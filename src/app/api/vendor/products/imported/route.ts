import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'VENDOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all products that belong to this vendor (either in their stores or My Products)
    const products = await prisma.product.findMany({
      where: {
        OR: [
          // Products in vendor's stores
          {
            store: {
              ownerId: session.id
            }
          },
          // Products in My Products (storeId is null but supplierId matches)
          {
            storeId: null,
            supplier: {
              id: {
                not: session.id // Not the vendor's own products
              }
            }
          }
        ]
      },
      include: {
        supplier: true,
        store: {
          select: {
            id: true,
            name: true,
            ownerId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error fetching imported products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch imported products' },
      { status: 500 }
    );
  }
}
