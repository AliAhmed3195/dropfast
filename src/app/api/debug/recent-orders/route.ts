import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get recent orders (last 10)
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        product: {
          include: {
            supplier: {
              select: {
                id: true,
                name: true,
                email: true,
                preferredCurrency: true
              }
            }
          }
        },
        store: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                preferredCurrency: true
              }
            }
          }
        }
      }
    });

    // Check which orders have payouts
    const ordersWithPayouts = await Promise.all(
      recentOrders.map(async (order) => {
        const payout = await prisma.payout.findUnique({
          where: { orderId: order.id },
          select: {
            id: true,
            status: true,
            createdAt: true
          }
        });

        return {
          orderId: order.id,
          orderStatus: order.status,
          orderCreatedAt: order.createdAt,
          orderTotal: order.totalAmount,
          supplier: order.product.supplier.name,
          vendor: order.store.owner.name,
          hasPayout: !!payout,
          payoutId: payout?.id || null,
          payoutStatus: payout?.status || null,
          payoutCreatedAt: payout?.createdAt || null
        };
      })
    );

    return NextResponse.json({
      totalOrders: recentOrders.length,
      ordersWithPayouts: ordersWithPayouts.filter(o => o.hasPayout).length,
      ordersWithoutPayouts: ordersWithPayouts.filter(o => !o.hasPayout).length,
      orders: ordersWithPayouts
    });

  } catch (error) {
    console.error('Error fetching recent orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
