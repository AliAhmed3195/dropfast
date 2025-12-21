import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'SUPPLIER_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current date
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Get last 6 months of data
    const months = [];
    const salesData = [];
    const ordersData = [];

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(currentYear, currentMonth - i, 1);
      const nextMonthDate = new Date(currentYear, currentMonth - i + 1, 1);
      
      const monthName = monthDate.toLocaleString('default', { month: 'short' });
      months.push(monthName);

      // Get sales (productPrice) for this month for supplier's products
      const salesResult = await prisma.order.aggregate({
        where: {
          createdAt: {
            gte: monthDate,
            lt: nextMonthDate,
          },
          product: {
            supplierId: session.id,
          },
          // Only count completed/delivered orders (exclude PENDING and CANCELLED)
          status: {
            notIn: ['PENDING', 'CANCELLED', 'REFUNDED'],
          },
        },
        _sum: {
          productPrice: true,
        },
      });

      // Get order count for this month for supplier's products
      const ordersCount = await prisma.order.count({
        where: {
          createdAt: {
            gte: monthDate,
            lt: nextMonthDate,
          },
          product: {
            supplierId: session.id,
          },
        },
      });

      salesData.push({
        name: monthName,
        sales: salesResult._sum.productPrice || 0,
      });

      ordersData.push({
        name: monthName,
        orders: ordersCount,
      });
    }

    return NextResponse.json({
      sales: salesData,
      orders: ordersData,
    });
  } catch (error) {
    console.error('Error fetching supplier dashboard sales/orders data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
