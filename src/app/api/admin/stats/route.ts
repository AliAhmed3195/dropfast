import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all stats in parallel
    const [
      totalUsers,
      totalSuppliers,
      totalVendors,
      totalProducts,
      totalStores,
      totalOrders,
      totalRevenue
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'SUPPLIER' } }),
      prisma.user.count({ where: { role: 'VENDOR' } }),
      prisma.product.count(),
      prisma.store.count(),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
      }),
    ]);

    const stats = {
      totalUsers,
      totalSuppliers,
      totalVendors,
      totalProducts,
      totalStores,
      totalOrders,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
