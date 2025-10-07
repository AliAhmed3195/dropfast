import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'VENDOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, notes } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
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

    // Update order status to AWAITING_SUPPLIER_CONFIRMATION
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'AWAITING_SUPPLIER_CONFIRMATION',
        requiresVendorApproval: false,
        vendorApprovedAt: new Date(),
        vendorApprovedBy: session.user.id,
        vendorRejectedAt: null,
        vendorRejectedBy: null,
        vendorRejectionReason: null
      }
    });

    // Create status history entry
    await prisma.orderStatusHistory.create({
      data: {
        orderId: orderId,
        status: 'AWAITING_SUPPLIER_CONFIRMATION',
        reason: 'Vendor approved order',
        changedBy: session.user.id,
        notes: notes || 'Order approved by vendor',
        metadata: {
          approvedBy: session.user.email,
          approvedAt: new Date().toISOString()
        }
      }
    });

    // TODO: Send notification to supplier
    // TODO: Send notification to customer

    return NextResponse.json({
      success: true,
      message: 'Order approved successfully',
      order: updatedOrder
    });

  } catch (error) {
    console.error('Error approving order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
