import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      productId,
      storeId,
      quantity,
      selectedVariants,
      customerInfo,
      shippingInfo,
      paymentInfo,
      totalAmount
    } = body;

    console.log('Checkout request received:', { productId, storeId, quantity, totalAmount });

    // Validate required fields
    if (!productId || !storeId || !quantity || !customerInfo || !shippingInfo || !paymentInfo) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find or create customer
    let customerId: string | null = null;
    if (customerInfo.email) {
      try {
        // Try to find existing customer by email
        const existingCustomer = await prisma.user.findFirst({
          where: { 
            email: customerInfo.email,
            role: 'CUSTOMER'
          }
        });

        if (existingCustomer) {
          customerId = existingCustomer.id;
          console.log('Found existing customer:', customerId);
        } else {
          // Create new customer
          const newCustomer = await prisma.user.create({
            data: {
              email: customerInfo.email,
              name: `${customerInfo.firstName} ${customerInfo.lastName}`,
              role: 'CUSTOMER',
              preferredCurrency: 'USD' // Default currency
            }
          });
          customerId = newCustomer.id;
          console.log('Created new customer:', customerId);
        }
      } catch (customerError) {
        console.warn('Customer creation failed, proceeding as guest:', customerError);
        customerId = null;
      }
    }

    // Get store product details (imported product)
    const storeProduct = await prisma.storeProduct.findFirst({
      where: {
        productId: productId,
        storeId: storeId,
        isActive: true
      },
      include: {
        product: {
          include: {
            supplier: true
          }
        },
        store: true
      }
    });

    if (!storeProduct) {
      return NextResponse.json(
        { error: 'Product not found in store or not active' },
        { status: 404 }
      );
    }

    // Check if product is available
    if ((storeProduct.product.availableQuantity || 100) < quantity) {
      return NextResponse.json(
        { error: 'Insufficient quantity available' },
        { status: 400 }
      );
    }

    // Calculate pricing
    const basePrice = storeProduct.lockedUSDPrice || storeProduct.product.price;
    const markupAmount = storeProduct.markup || 0;
    const finalPrice = storeProduct.finalPrice;

    console.log('Pricing details:', { basePrice, markupAmount, finalPrice, totalAmount });

    // Create order with new schema
    const order = await prisma.order.create({
      data: {
        productId: storeProduct.productId,
        storeId: storeProduct.storeId,
        storeProductId: storeProduct.id,
        customerId: customerId, // Can be null for guest customers
        quantity,
        productPrice: basePrice,
        markupAmount: markupAmount,
        totalAmount: totalAmount,
        selectedVariants: JSON.stringify(selectedVariants),
        status: 'PENDING',
        // Multi-currency support
        lockedUSDPrice: storeProduct.lockedUSDPrice,
        lockedLocalPrice: storeProduct.lockedLocalPrice,
        displayPrice: totalAmount,
        displayCurrency: storeProduct.localCurrency,
        settlementCurrency: 'USD',
        // Address information
        shippingAddress: {
          firstName: customerInfo.firstName,
          lastName: customerInfo.lastName,
          email: customerInfo.email,
          phone: customerInfo.phone,
          address: shippingInfo.address,
          city: shippingInfo.city,
          state: shippingInfo.state,
          zipCode: shippingInfo.zipCode,
          country: shippingInfo.country
        },
        billingAddress: {
          firstName: customerInfo.firstName,
          lastName: customerInfo.lastName,
          email: customerInfo.email,
          phone: customerInfo.phone,
          address: shippingInfo.address, // Using shipping as billing for now
          city: shippingInfo.city,
          state: shippingInfo.state,
          zipCode: shippingInfo.zipCode,
          country: shippingInfo.country
        },
        notes: `Payment method: ${paymentInfo.cardName} ending in ${paymentInfo.cardNumber.slice(-4)}`
      }
    });

    // Update product available quantity
    await prisma.product.update({
      where: { id: storeProduct.productId },
      data: {
        availableQuantity: (storeProduct.product.availableQuantity || 100) - quantity
      }
    });

    console.log('Order created successfully:', order.id);

    // In a real application, you would:
    // 1. Process payment with a payment gateway (Stripe, PayPal, etc.)
    // 2. Send confirmation emails
    // 3. Generate invoice
    // 4. Create payout records for supplier and vendor

    return NextResponse.json({
      success: true,
      orderId: order.id,
      message: 'Order placed successfully',
      customerId: customerId
    });

  } catch (error) {
    console.error('Error processing checkout:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

