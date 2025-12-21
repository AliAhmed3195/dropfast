import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
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

      // Get sales (totalAmount) for this month
      const salesResult = await prisma.order.aggregate({
        where: {
          createdAt: {
            gte: monthDate,
            lt: nextMonthDate,
          },
          // Only count completed/delivered orders (exclude PENDING and CANCELLED)
          status: {
            notIn: ['PENDING', 'CANCELLED', 'REFUNDED'],
          },
        },
        _sum: {
          totalAmount: true,
        },
      });

      // Get order count for this month
      const ordersCount = await prisma.order.count({
        where: {
          createdAt: {
            gte: monthDate,
            lt: nextMonthDate,
          },
        },
      });

      salesData.push({
        name: monthName,
        sales: salesResult._sum.totalAmount || 0,
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
    console.error('Error fetching dashboard sales/orders data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
