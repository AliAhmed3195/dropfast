import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'VENDOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [
      totalStores,
      totalProducts,
      totalSales,
      totalOrders,
    ] = await Promise.all([
      prisma.store.count({
        where: { ownerId: session.userId },
      }),
      prisma.product.count({
        where: { 
          store: {
            ownerId: session.userId,
          },
        },
      }),
      prisma.order.aggregate({
        where: {
          store: {
            ownerId: session.userId,
          },
          status: 'PAID',
        },
        _sum: {
          totalAmount: true,
        },
      }),
      prisma.order.count({
        where: {
          store: {
            ownerId: session.userId,
          },
        },
      }),
    ]);

    const stats = {
      totalStores,
      totalProducts,
      totalSales: totalSales._sum.totalAmount || 0,
      totalOrders,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching vendor stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
