import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'VENDOR_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get filter parameters from query string
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    // Build where clause
    const whereClause: any = {
      store: {
        ownerId: session.id,
      },
    };

    // Add store filter
    if (storeId) {
      whereClause.storeId = storeId;
    }

    // Add date range filter
    if (fromDate || toDate) {
      whereClause.createdAt = {};
      if (fromDate) {
        whereClause.createdAt.gte = new Date(fromDate);
      }
      if (toDate) {
        // Include the entire day (end of day)
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = endDate;
      }
    }

    // Get all orders for products in vendor's stores
    const orders = await prisma.order.findMany({
      where: whereClause,
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
            id: true,
            name: true,
            currency: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Process orders to include guest customer info from shipping address and currency fields
    const processedOrders = orders.map(order => {
      const baseOrder: any = {
        ...order,
        // Include all currency/pricing fields
        lockedUSDPrice: order.lockedUSDPrice,
        lockedLocalPrice: order.lockedLocalPrice,
        displayPrice: order.displayPrice,
        displayCurrency: order.displayCurrency,
        settlementCurrency: order.settlementCurrency,
        markupPercentage: order.markupPercentage,
        markupAmountInVendorCurrency: order.markupAmountInVendorCurrency,
        markupType: order.markupType,
        vendorCurrency: order.vendorCurrency,
        supplierCurrency: order.supplierCurrency,
      };

      if (!order.customer && order.shippingAddress) {
        const shipping = order.shippingAddress as any;
        baseOrder.customer = {
          name: `${shipping.firstName || ''} ${shipping.lastName || ''}`.trim() || 'Guest Customer',
          email: shipping.email || 'N/A (Guest)'
        };
      }

      return baseOrder;
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
