import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'SUPPLIER_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all orders for supplier's products
    const orders = await prisma.order.findMany({
      where: {
        product: {
          supplierId: session.id,
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            image: true,
            images: {
              orderBy: [
                { isMain: 'desc' },
                { order: 'asc' },
                { createdAt: 'asc' }
              ]
            },
            supplier: {
              select: {
                name: true,
              },
            },
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
            name: true,
            owner: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Process orders to include guest customer info from shipping address
    const processedOrders = orders.map(order => {
      if (!order.customer && order.shippingAddress) {
        const shipping = order.shippingAddress as any;
        return {
          ...order,
          customer: {
            name: `${shipping.firstName || ''} ${shipping.lastName || ''}`.trim() || 'Guest Customer',
            email: shipping.email || 'N/A (Guest)'
          }
        };
      }
      return order;
    });

    return NextResponse.json({ orders: processedOrders });
  } catch (error) {
    console.error('Error fetching supplier orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
