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
    const status = searchParams.get('status');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    // Build where clause
    const whereClause: any = {
      store: {
        ownerId: session.id
      }
    };

    // Add store filter
    if (storeId) {
      whereClause.storeId = storeId;
    }

    // Add status filter
    if (status) {
      whereClause.status = status.toUpperCase();
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

    // Get all invoices for vendor's stores with filters
    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      select: {
        id: true,
        invoiceNumber: true,
        subtotal: true,
        tax: true,
        total: true,
        status: true,
        template: true, // Include template field from invoice (saved when invoice was created)
        createdAt: true,
        order: {
          include: {
            product: {
              include: {
                supplier: {
                  select: {
                    name: true,
                  }
                }
              }
            },
            customer: {
              select: {
                name: true,
                email: true,
              }
            }
          }
        },
        store: {
          select: {
            id: true,
            name: true,
            logo: true,
            address: true,
            phone: true,
            email: true,
            taxNumber: true,
            invoiceTemplate: true,
          }
        },
        customer: {
          select: {
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error('Error fetching vendor invoices:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
