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

    // Get currencies from business
    const storeCurrency = storeProduct.store.owner?.business?.preferredCurrency || 'USD';
    const supplierCurrency = storeProduct.product.supplier?.business?.preferredCurrency || 'USD';

    // Use locked markup amounts from StoreProduct
    const basePrice = storeProduct.lockedUSDPrice || storeProduct.product.price;
    const markupAmountInUSD = storeProduct.markupAmountInUSD || 0;
    const markupAmountInVendorCurrency = storeProduct.markupAmountInLocalCurrency || 0;
    const markupType = storeProduct.markupType || 'percentage';
    const markupPercentage = storeProduct.markup || 0;
    
    const finalPrice = storeProduct.finalPrice;

    console.log('Pricing details:', { basePrice, markupAmountInUSD, markupAmountInVendorCurrency, finalPrice, totalAmount, storeCurrency, supplierCurrency });

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
        totalAmount: totalAmount,
        selectedVariants: JSON.stringify(selectedVariants),
        status: initialStatus,
        // Vendor approval workflow
        requiresVendorApproval: requiresApproval,
        // Multi-currency support
        lockedUSDPrice: storeProduct.lockedUSDPrice,
        lockedLocalPrice: storeProduct.lockedLocalPrice,
        displayPrice: totalAmount,
        displayCurrency: storeCurrency,
        settlementCurrency: 'USD',
        // Markup details
        markupPercentage: markupPercentage,
        markupAmountInVendorCurrency: markupAmountInVendorCurrency,
        markupType: markupType,
        vendorCurrency: storeCurrency,
        supplierCurrency: supplierCurrency,
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

    // Create payout record immediately (PENDING status)
    try {
      await createPayoutRecord(order, storeProduct);
      console.log('Payout record created for order:', order.id);
    } catch (payoutError) {
      console.error('Error creating payout record:', payoutError);
      // Don't fail the order if payout creation fails
    }

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

// Helper function to create payout record
async function createPayoutRecord(order: any, storeProduct: any) {
  // Get supplier and vendor details
  const supplier = await prisma.user.findUnique({
    where: { id: storeProduct.product.supplierId }
  });

  const vendor = await prisma.user.findUnique({
    where: { id: storeProduct.store.ownerId }
  });

  if (!supplier || !vendor) {
    throw new Error('Supplier or vendor not found');
  }

  // Prepare order data for calculation
  const orderData = {
    id: order.id,
    totalAmount: order.totalAmount,
    quantity: order.quantity,
    productPrice: order.productPrice,
    markupAmount: order.markupAmount,
    supplier: {
      id: supplier.id,
      preferredCurrency: supplier.preferredCurrency
    },
    vendor: {
      id: vendor.id,
      preferredCurrency: vendor.preferredCurrency
    }
  };

  // Calculate payout with currency conversion
  const calculation = await payoutCalculator.calculatePayoutWithCurrency(orderData);

  // Create payout record with PENDING status
  const payout = await prisma.payout.create({
    data: {
      orderId: order.id,
      supplierId: supplier.id,
      vendorId: vendor.id,
      // Use new field names from schema
      grossAmount: calculation.orderTotal,
      supplierAmount: calculation.supplierAmount,
      grossVendorAmount: calculation.vendorGrossAmount,
      platformFee: calculation.platformFee,
      stripeProcessingFee: calculation.transactionFee,
      currencyConversionFee: calculation.currencyConversionFee,
      finalSupplierAmount: calculation.finalSupplierAmount,
      finalVendorAmount: calculation.finalVendorAmount,
      platformRevenue: calculation.platformRevenue,
      baseCurrency: 'USD',
      supplierCurrency: supplier.preferredCurrency,
      vendorCurrency: vendor.preferredCurrency,
      exchangeRateAtPayout: calculation.currencyConversion?.exchangeRates?.supplier || 1,
      
      // Payout Locking (not locked yet)
      isLocked: false,
      lockedAt: null,
      lockedExchangeRate: null,
      lockedSupplierAmount: null,
      lockedVendorAmount: null,
      
      status: 'PENDING', // Created at order placement
      payoutMethod: 'STRIPE_CONNECT',
      requiresApproval: false // Will be set to true when order is delivered
    }
  });

  // Create initial status history
  await prisma.payoutStatusHistory.create({
    data: {
      id: `psh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Generate unique ID
      payoutId: payout.id,
      status: 'PENDING',
      reason: 'Order placed - payout created',
      changedBy: 'system',
      notes: 'Payout record created when order was placed'
    }
  });

  return payout;
}

