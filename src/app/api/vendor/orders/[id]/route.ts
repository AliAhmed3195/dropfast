import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Vendor order detail API called for orderId:', params.id);
    
    const session = await getSession();
    console.log('Session:', session);
    
    if (!session || session.role !== 'VENDOR_USER') {
      console.log('No session or not VENDOR_USER role');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get order details
    const order = await prisma.order.findUnique({
      where: {
        id: params.id,
      },
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
            images: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            currency: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        statusHistory: {
          orderBy: {
            changedAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if the vendor owns this store
    if (order.store.owner.id !== session.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Process order to include guest customer info from shipping address and currency fields
    let processedOrder: any = {
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
      processedOrder.customer = {
        id: 'guest',
        name: `${shipping.firstName || ''} ${shipping.lastName || ''}`.trim() || 'Guest Customer',
        email: shipping.email || 'N/A (Guest)'
      };
    }

    return NextResponse.json({ order: processedOrder });
  } catch (error) {
    console.error('Error fetching vendor order details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}