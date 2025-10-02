import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'VENDOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get order details with all relations
    const order = await prisma.order.findFirst({
      where: {
        id: params.orderId,
        store: {
          ownerId: session.id, // Ensure vendor can only see their own orders
        },
      },
      include: {
        product: {
          include: {
            supplier: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            images: true,
          },
        },
        customer: {
          select: {
            name: true,
            email: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Process order to include guest customer info from shipping address
    let processedOrder = { ...order };
    if (!order.customer && order.shippingAddress) {
      const shipping = order.shippingAddress as any;
      processedOrder = {
        ...order,
        customer: {
          name: `${shipping.firstName || ''} ${shipping.lastName || ''}`.trim() || 'Guest Customer',
          email: shipping.email || 'N/A (Guest)'
        }
      };
    }

    return NextResponse.json({ order: processedOrder });
  } catch (error) {
    console.error('Error fetching order details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
