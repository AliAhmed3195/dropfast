import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'VENDOR_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {
      store: {
        ownerId: session.user.id
      },
      status: 'PENDING_VENDOR_APPROVAL'
    };

    // Add search functionality
    if (search) {
      whereClause.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { 
          customer: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } }
            ]
          }
        },
        {
          product: {
            name: { contains: search, mode: 'insensitive' }
          }
        }
      ];
    }

    // Get pending approval orders
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        product: {
          include: {
            supplier: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            images: true
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        store: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        statusHistory: {
          orderBy: {
            changedAt: 'desc'
          },
          take: 5
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });

    // Get total count for pagination
    const totalCount = await prisma.order.count({
      where: whereClause
    });

    // Process orders to include guest customer info
    const processedOrders = orders.map(order => {
      let customerInfo = order.customer;
      
      // Handle guest customers
      if (!customerInfo && order.shippingAddress) {
        const shipping = order.shippingAddress as any;
        customerInfo = {
          id: 'guest',
          name: shipping.name || 'Guest Customer',
          email: shipping.email || 'N/A (Guest)'
        };
      }

      return {
        ...order,
        customer: customerInfo
      };
    });

    return NextResponse.json({
      orders: processedOrders,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching pending approval orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
