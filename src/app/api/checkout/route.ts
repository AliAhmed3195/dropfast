import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { payoutCalculator } from '@/lib/payout-calculator';

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
              password: '', // Temporary password, should be set properly
              status: 'ACTIVE'
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
            supplier: {
              include: { business: true }
            }
          }
        },
        store: {
          include: {
            owner: {
              include: { business: true }
            }
          }
        }
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

    // Currency is always USD
    const storeCurrency = 'USD';
    const supplierCurrency = 'USD';

    // Use locked markup amounts from StoreProduct
    const basePrice = storeProduct.lockedUSDPrice || storeProduct.product.price;
    const markupAmountInUSD = storeProduct.markupAmountInUSD || 0;
    const markupAmountInVendorCurrency = storeProduct.markupAmountInLocalCurrency || 0;
    const markupType = storeProduct.markupType || 'percentage';
    const markupPercentage = storeProduct.markup || 0;
    
    const finalPrice = storeProduct.finalPrice;
    
    // Calculate totalAmount correctly: quantity * (basePrice + markupAmount)
    const calculatedTotalAmount = quantity * (basePrice + markupAmountInUSD);

    console.log('Pricing details:', { 
      basePrice, 
      markupAmountInUSD, 
      markupAmountInVendorCurrency, 
      finalPrice, 
      quantity,
      calculatedTotalAmount,
      frontendTotalAmount: totalAmount,
      storeCurrency, 
      supplierCurrency 
    });

    // Check if store requires vendor approval
    const requiresApproval = !storeProduct.store.autoForwardOrders;
    const initialStatus = requiresApproval ? 'PENDING_VENDOR_APPROVAL' : 'AWAITING_SUPPLIER_CONFIRMATION';

    // Create order with new schema
    const order = await prisma.order.create({
      data: {
        productId: storeProduct.productId,
        storeId: storeProduct.storeId,
        storeProductId: storeProduct.id,
        customerId: customerId, // Can be null for guest customers
        quantity,
        productPrice: basePrice,
        markupAmount: markupAmountInUSD, // Store USD equivalent for consistency
        totalAmount: calculatedTotalAmount,
        selectedVariants: JSON.stringify(selectedVariants),
        status: initialStatus,
        // Vendor approval workflow
        requiresVendorApproval: requiresApproval,
        // Currency is always USD
        lockedUSDPrice: storeProduct.lockedUSDPrice,
        lockedLocalPrice: storeProduct.lockedLocalPrice,
        settlementCurrency: 'USD',
        // Markup details
        markupPercentage: markupPercentage,
        markupAmountInVendorCurrency: markupAmountInVendorCurrency,
        markupType: markupType,
        vendorCurrency: 'USD',
        supplierCurrency: 'USD',
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

    // Create initial status history entry
    await prisma.orderStatusHistory.create({
      data: {
        id: `osh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Generate unique ID
        orderId: order.id,
        status: initialStatus,
        reason: requiresApproval ? 'Order created, awaiting vendor approval' : 'Order created, forwarded to supplier',
        changedBy: 'system',
        notes: requiresApproval ? 'Order requires vendor approval before forwarding to supplier' : 'Order automatically forwarded to supplier',
        metadata: {
          storeAutoForward: storeProduct.store.autoForwardOrders,
          requiresApproval: requiresApproval,
          createdAt: new Date().toISOString()
        }
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

    // Payout will be created when supplier confirms the order
    // This ensures payout is only created for confirmed orders

    // In a real application, you would:
    // 1. Process payment with a payment gateway (Stripe, PayPal, etc.)
    // 2. Send confirmation emails
    // 3. Generate invoice

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

// Payout creation moved to OrderStatusHandler.handleOrderConfirmed()
// This ensures payouts are only created when supplier confirms the order

