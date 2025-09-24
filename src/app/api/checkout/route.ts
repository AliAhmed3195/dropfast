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

    // Validate required fields
    if (!productId || !storeId || !quantity || !customerInfo || !shippingInfo || !paymentInfo) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get product details
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        supplier: true,
        store: true
      }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if product is available
    if (product.availableQuantity < quantity) {
      return NextResponse.json(
        { error: 'Insufficient quantity available' },
        { status: 400 }
      );
    }

    // Calculate markup amount (assuming vendor markup is applied)
    const basePrice = product.price;
    const markupAmount = totalAmount - (basePrice * quantity);

    // Create order
    const order = await prisma.order.create({
      data: {
        productId,
        storeId,
        customerId: 'guest', // For now, using guest customer
        quantity,
        productPrice: basePrice,
        markupAmount,
        totalAmount,
        selectedVariants: JSON.stringify(selectedVariants),
        status: 'PENDING',
        // Store customer and shipping info in a JSON field for now
        // In a real app, you'd create a Customer record
      }
    });

    // Update product available quantity
    await prisma.product.update({
      where: { id: productId },
      data: {
        availableQuantity: product.availableQuantity - quantity
      }
    });

    // In a real application, you would:
    // 1. Process payment with a payment gateway (Stripe, PayPal, etc.)
    // 2. Create a Customer record
    // 3. Send confirmation emails
    // 4. Generate invoice

    // For now, we'll just return success
    return NextResponse.json({
      success: true,
      orderId: order.id,
      message: 'Order placed successfully'
    });

  } catch (error) {
    console.error('Error processing checkout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

