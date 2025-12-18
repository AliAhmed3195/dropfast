import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { payoutCalculator } from '@/lib/payout-calculator';

// GET /api/admin/payouts - Get all payouts with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    console.log('Session in payouts API:', session);
    if (!session || session.role !== 'ADMIN') {
      console.log('Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const supplierId = searchParams.get('supplierId');
    const vendorId = searchParams.get('vendorId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    console.log('Admin payouts API called with params:', {
      status, supplierId, vendorId, dateFrom, dateTo, search, page, limit, sortBy, sortOrder
    });

    // Build where clause
    const where: any = {};
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (supplierId) {
      where.supplierId = supplierId;
    }
    
    if (vendorId) {
      where.vendorId = vendorId;
    }
    
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    // Add search functionality
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } },
        { supplier: { email: { contains: search, mode: 'insensitive' } } },
        { vendor: { name: { contains: search, mode: 'insensitive' } } },
        { vendor: { email: { contains: search, mode: 'insensitive' } } },
        { order: { id: { contains: search, mode: 'insensitive' } } }
      ];
    }

    console.log('Where clause:', JSON.stringify(where, null, 2));

    // Get payouts with pagination
    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        include: {
        supplier: {
          select: {
            id: true,
            name: true,
            email: true,
            bankDetails: {
              select: {
                id: true,
                isVerified: true
              }
            },
            business: {
              select: {
                id: true,
                businessName: true,
                preferredCurrency: true,
                kycStatus: true,
                expressAccountId: true,
                stripeAccountId: true,
                stripeAccountStatus: true,
                stripePayoutsEnabled: true,
                stripeChargesEnabled: true,
                bankStatus: true,
                stripeLastUpdated: true
              }
            }
          }
        },
        vendor: {
          select: {
            id: true,
            name: true,
            email: true,
            bankDetails: {
              select: {
                id: true,
                isVerified: true
              }
            },
            business: {
              select: {
                id: true,
                businessName: true,
                preferredCurrency: true,
                kycStatus: true,
                expressAccountId: true,
                stripeAccountId: true,
                stripeAccountStatus: true,
                stripePayoutsEnabled: true,
                stripeChargesEnabled: true,
                bankStatus: true,
                stripeLastUpdated: true
              }
            }
          }
        },
          order: {
            select: {
              id: true,
              totalAmount: true,
              status: true,
              createdAt: true
            }
          },
          statusHistory: {
            orderBy: { changedAt: 'desc' },
            take: 1
          }
        },
        orderBy: {
          [sortBy]: sortOrder
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.payout.count({ where })
    ]);

    console.log('Payouts found:', payouts.length);
    console.log('Total count:', total);

    // Calculate summary statistics
    const summary = await prisma.payout.aggregate({
      where: {
        status: { in: ['PENDING', 'PROCESSING', 'COMPLETED'] }
      },
      _sum: {
        finalSupplierAmount: true,
        finalVendorAmount: true,
        platformRevenue: true
      },
      _count: {
        id: true
      }
    });

    return NextResponse.json({
      payouts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      summary: {
        totalPayouts: summary._count.id,
        totalSupplierAmount: summary._sum.finalSupplierAmount || 0,
        totalVendorAmount: summary._sum.finalVendorAmount || 0,
        totalPlatformRevenue: summary._sum.platformRevenue || 0
      }
    });

  } catch (error) {
    console.error('Error fetching payouts:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/payouts - Create payout for an order
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, payoutMethod = 'STRIPE_CONNECT' } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Check if payout already exists
    const existingPayout = await prisma.payout.findUnique({
      where: { orderId }
    });

    if (existingPayout) {
      return NextResponse.json(
        { error: 'Payout already exists for this order' },
        { status: 400 }
      );
    }

    // Get order details with relations
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        product: {
          include: {
            supplier: {
              include: {
                business: true
              }
            }
          }
        },
        store: {
          include: {
            owner: {
              include: {
                business: true
              }
            }
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Prepare order data for calculation
    const orderData = {
      id: order.id,
      totalAmount: order.totalAmount,
      quantity: order.quantity,
      productPrice: order.productPrice,
      markupAmount: order.markupAmount,
      supplier: {
        id: order.product.supplier.id,
        preferredCurrency: order.product.supplier.business?.preferredCurrency || 'USD'
      },
      vendor: {
        id: order.store.owner.id,
        preferredCurrency: order.store.owner.business?.preferredCurrency || 'USD'
      }
    };

    // Calculate payout with currency conversion
    const calculation = await payoutCalculator.calculatePayoutWithCurrency(orderData);

    // Create payout record
    const payout = await prisma.payout.create({
      data: {
        orderId: order.id,
        supplierId: order.product.supplier.id,
        vendorId: order.store.owner.id,
        orderTotal: calculation.orderTotal,
        supplierAmount: calculation.supplierAmount,
        vendorGrossAmount: calculation.vendorGrossAmount,
        platformFee: calculation.platformFee,
        transactionFee: calculation.transactionFee,
        currencyConversionFee: calculation.currencyConversionFee,
        finalSupplierAmount: calculation.finalSupplierAmount,
        finalVendorAmount: calculation.finalVendorAmount,
        platformRevenue: calculation.platformRevenue,
        baseCurrency: 'USD',
        supplierCurrency: order.product.supplier.business?.preferredCurrency || 'USD',
        vendorCurrency: order.store.owner.business?.preferredCurrency || 'USD',
        exchangeRateAtPayout: calculation.currencyConversion?.exchangeRates?.supplier || 1,
        status: 'PENDING',
        payoutMethod: payoutMethod as any,
        requiresApproval: calculation.finalSupplierAmount > 1000 || calculation.finalVendorAmount > 1000
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            email: true,
            business: {
              select: {
                id: true,
                businessName: true,
                preferredCurrency: true
              }
            }
          }
        },
        vendor: {
          select: {
            id: true,
            name: true,
            email: true,
            business: {
              select: {
                id: true,
                businessName: true,
                preferredCurrency: true
              }
            }
          }
        },
        order: {
          select: {
            id: true,
            totalAmount: true,
            status: true
          }
        }
      }
    });

    // Create initial status history
    await prisma.payoutStatusHistory.create({
      data: {
        payoutId: payout.id,
        status: 'PENDING',
        changedBy: session.id,
        notes: 'Payout created'
      }
    });

    return NextResponse.json({
      success: true,
      payout,
      calculation
    });

  } catch (error) {
    console.error('Error creating payout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
