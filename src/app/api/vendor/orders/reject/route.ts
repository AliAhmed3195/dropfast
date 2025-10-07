import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'VENDOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, reason, notes } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    if (!reason) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
    }

    // Get the order and verify it belongs to the vendor
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        store: {
          ownerId: session.user.id
        },
        status: 'PENDING_VENDOR_APPROVAL'
      },
      include: {
        store: true,
        product: {
          include: {
            supplier: true
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found or not pending approval' }, { status: 404 });
    }

    // Update order status to CANCELLED
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        requiresVendorApproval: false,
        vendorRejectedAt: new Date(),
        vendorRejectedBy: session.user.id,
        vendorRejectionReason: reason,
        vendorApprovedAt: null,
        vendorApprovedBy: null
      }
    });

    // Create status history entry
    await prisma.orderStatusHistory.create({
      data: {
        orderId: orderId,
        status: 'CANCELLED',
        reason: 'Vendor rejected order',
        changedBy: session.user.id,
        notes: notes || `Order rejected: ${reason}`,
        metadata: {
          rejectedBy: session.user.email,
          rejectedAt: new Date().toISOString(),
          rejectionReason: reason
        }
      }
    });

    // TODO: Process refund for customer
    // TODO: Send notification to customer
    // TODO: Send notification to supplier

    return NextResponse.json({
      success: true,
      message: 'Order rejected successfully',
      order: updatedOrder
    });

  } catch (error) {
    console.error('Error rejecting order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
