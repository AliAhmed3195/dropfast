import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { OrderStatusHandler } from '@/lib/order-status-handler';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status, reason, notes } = await request.json();

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    // Get the order
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        product: {
          include: {
            supplier: true
          }
        },
        store: {
          include: {
            owner: true
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check authorization - supplier must own the product
    if (order.product.supplier.id !== session.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate status transition
    const validTransitions: { [key: string]: string[] } = {
      'PENDING': ['PAID', 'CANCELLED'],
      'PAID': ['PENDING_VENDOR_APPROVAL', 'AWAITING_SUPPLIER_CONFIRMATION', 'CANCELLED'],
      'PENDING_VENDOR_APPROVAL': ['AWAITING_SUPPLIER_CONFIRMATION', 'CANCELLED'],
      'AWAITING_SUPPLIER_CONFIRMATION': ['CONFIRMED', 'CANCELLED'],
      'CONFIRMED': ['PACKED', 'CANCELLED'],
      'PACKED': ['HANDED_TO_COURIER', 'CANCELLED'],
      'HANDED_TO_COURIER': ['SHIPPED', 'CANCELLED'],
      'SHIPPED': ['DELIVERED', 'CANCELLED'],
      'DELIVERED': ['REFUNDED'],
      'CANCELLED': [],
      'REFUNDED': []
    };

    if (!validTransitions[order.status]?.includes(status)) {
      return NextResponse.json({ 
        error: `Invalid status transition from ${order.status} to ${status}` 
      }, { status: 400 });
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: {
        status: status as any,
        updatedAt: new Date()
      }
    });

    // Create status history entry
    await prisma.orderStatusHistory.create({
      data: {
        orderId: params.id,
        status: status as any,
        reason: reason || `Status updated to ${status.replace(/_/g, ' ')}`,
        changedBy: session.id,
        notes: notes || `Status updated by ${session.role}`,
        metadata: {
          updatedBy: session.email,
          updatedAt: new Date().toISOString(),
          previousStatus: order.status
        }
      }
    });

    // Handle status-specific logic using OrderStatusHandler
    try {
      await OrderStatusHandler.handleStatusChange(params.id, status as any);
    } catch (handlerError) {
      console.error('Error in OrderStatusHandler:', handlerError);
      // Don't fail the request if handler fails, just log it
    }

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
      order: updatedOrder
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
