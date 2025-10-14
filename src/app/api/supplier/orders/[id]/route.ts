import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Supplier order detail API called for orderId:', params.id);
    
    const session = await getSession();
    console.log('Session:', session);
    
    if (!session || session.role !== 'SUPPLIER_USER') {
      console.log('No session or not SUPPLIER_USER role');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get order details
    const order = await prisma.order.findUnique({
      where: {
        id: params.id,
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
            id: true,
            name: true,
            email: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        statusHistory: {
          orderBy: {
            changedAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if the supplier owns this product
    if (order.product.supplier.id !== session.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Process order to include guest customer info from shipping address
    let processedOrder = order;
    if (!order.customer && order.shippingAddress) {
      const shipping = order.shippingAddress as any;
      processedOrder = {
        ...order,
        customer: {
          id: 'guest',
          name: `${shipping.firstName || ''} ${shipping.lastName || ''}`.trim() || 'Guest Customer',
          email: shipping.email || 'N/A (Guest)'
        }
      };
    }

    return NextResponse.json({ order: processedOrder });
  } catch (error) {
    console.error('Error fetching supplier order details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
