import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'VENDOR_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const months = [];
    const salesData = [];
    const ordersData = [];

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(currentYear, currentMonth - i, 1);
      const nextMonthDate = new Date(currentYear, currentMonth - i + 1, 1);
      const monthName = monthDate.toLocaleString('default', { month: 'short' });
      months.push(monthName);

      // Sales data - sum of totalAmount for paid orders in vendor's stores
      const salesResult = await prisma.order.aggregate({
        where: {
          createdAt: { gte: monthDate, lt: nextMonthDate },
          store: { ownerId: session.id },
          status: { notIn: ['PENDING', 'CANCELLED', 'REFUNDED'] },
        },
        _sum: { totalAmount: true },
      });

      // Orders count - all orders in vendor's stores
      const ordersCount = await prisma.order.count({
        where: {
          createdAt: { gte: monthDate, lt: nextMonthDate },
          store: { ownerId: session.id },
        },
      });

      salesData.push({ name: monthName, sales: salesResult._sum.totalAmount || 0 });
      ordersData.push({ name: monthName, orders: ordersCount });
    }

    return NextResponse.json({ sales: salesData, orders: ordersData });
  } catch (error) {
    console.error('Error fetching vendor dashboard sales/orders data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
