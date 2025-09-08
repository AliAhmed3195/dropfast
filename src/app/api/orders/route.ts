import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { productId, customerInfo, quantity = 1 } = await request.json();

    if (!productId || !customerInfo) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the product with store information
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
        isActive: true,
      },
      include: {
        store: true,
        supplier: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (!product.store) {
      return NextResponse.json({ error: 'Product not available' }, { status: 400 });
    }

    // Calculate pricing
    const productPrice = product.price / (1 + product.markup / 100); // Original supplier price
    const markupAmount = product.price - productPrice;
    const totalAmount = product.price * quantity;

    // Create customer user if not exists
    let customer = await prisma.user.findUnique({
      where: { email: customerInfo.email },
    });

    if (!customer) {
      customer = await prisma.user.create({
        data: {
          email: customerInfo.email,
          name: customerInfo.name,
          password: 'temp_password', // In real app, you'd handle this differently
          role: 'VENDOR', // Default role for customers
        },
      });
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        productId: product.id,
        storeId: product.store.id,
        customerId: customer.id,
        quantity,
        productPrice,
        markupAmount,
        totalAmount,
        status: 'PENDING',
      },
    });

    // In a real application, you would:
    // 1. Process payment through a payment gateway
    // 2. Update order status to 'PAID' after successful payment
    // 3. Send confirmation emails
    // 4. Handle inventory management

    return NextResponse.json({
      message: 'Order created successfully',
      order: {
        id: order.id,
        totalAmount: order.totalAmount,
        status: order.status,
      },
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
