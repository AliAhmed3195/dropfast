import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OrderStatusHandler } from '@/lib/order-status-handler';

// POST /api/test/order-status - Test order status change (for testing purposes)
export async function POST(request: NextRequest) {
  try {
    const { orderId, newStatus } = await request.json();

    if (!orderId || !newStatus) {
      return NextResponse.json(
        { error: 'Order ID and new status are required' },
        { status: 400 }
      );
    }

    // Get current order
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus as any }
    });

    // Handle status change
    await OrderStatusHandler.handleStatusChange(orderId, newStatus);

    // Check if payout was created
    const payout = await prisma.payout.findUnique({
      where: { orderId: orderId },
      include: {
        supplier: {
          select: {
            name: true
          }
        },
        vendor: {
          select: {
            name: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      payout: payout,
      message: payout ? 'Payout created and locked' : 'No payout created'
    });

  } catch (error) {
    console.error('Error testing order status change:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
