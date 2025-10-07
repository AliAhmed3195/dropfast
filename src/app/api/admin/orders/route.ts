import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all orders with related information
    const orders = await prisma.order.findMany({
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
            images: {
              orderBy: [
                { isMain: 'desc' },
                { order: 'asc' },
                { createdAt: 'asc' }
              ]
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
            id: true,
            name: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
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
    console.error('Error fetching admin orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
