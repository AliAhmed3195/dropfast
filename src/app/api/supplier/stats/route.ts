import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'SUPPLIER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [
      totalProducts,
      activeProducts,
      totalSales,
      totalOrders,
    ] = await Promise.all([
      prisma.product.count({
        where: { supplierId: session.userId },
      }),
      prisma.product.count({
        where: { 
          supplierId: session.userId,
          isActive: true,
        },
      }),
      prisma.order.aggregate({
        where: {
          product: {
            supplierId: session.userId,
          },
          status: 'PAID',
        },
        _sum: {
          productPrice: true,
        },
      }),
      prisma.order.count({
        where: {
          product: {
            supplierId: session.userId,
          },
        },
      }),
    ]);

    const stats = {
      totalProducts,
      activeProducts,
      totalSales: totalSales._sum.productPrice || 0,
      totalOrders,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching supplier stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
