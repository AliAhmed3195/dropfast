import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all payouts with their order status
    const payouts = await prisma.payout.findMany({
      include: {
        order: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            totalAmount: true
          }
        },
        supplier: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        vendor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Group by status
    const statusCounts = payouts.reduce((acc, payout) => {
      acc[payout.status] = (acc[payout.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      totalPayouts: payouts.length,
      statusCounts,
      payouts: payouts.map(payout => ({
        id: payout.id,
        orderId: payout.orderId,
        orderStatus: payout.order.status,
        payoutStatus: payout.status,
        createdAt: payout.createdAt,
        orderTotal: payout.order.totalAmount,
        supplier: payout.supplier.name,
        vendor: payout.vendor.name
      }))
    });

  } catch (error) {
    console.error('Error fetching debug payouts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
