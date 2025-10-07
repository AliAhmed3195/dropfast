import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'VENDOR_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all orders for products in vendor's stores
    const orders = await prisma.order.findMany({
      where: {
        store: {
          ownerId: session.id,
        },
      },
      include: {
        product: {
          include: {
            supplier: {
              select: {
                name: true,
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
            name: true,
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
    console.error('Error fetching vendor orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
