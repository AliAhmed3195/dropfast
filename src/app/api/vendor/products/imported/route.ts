import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'VENDOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all StoreProducts that belong to this vendor's stores
    const storeProducts = await prisma.storeProduct.findMany({
      where: {
        store: {
          ownerId: session.id
        }
      },
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
            category: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            },
            subcategory: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            },
            tags: {
              include: {
                tag: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    color: true
                  }
                }
              }
            },
            images: {
              orderBy: [
                { isMain: 'desc' },
                { order: 'asc' },
                { createdAt: 'asc' }
              ]
            }
          }
        },
        store: {
          select: {
            id: true,
            name: true,
            currency: true,
            isActive: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ products: storeProducts });
  } catch (error) {
    console.error('Error fetching imported products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch imported products' },
      { status: 500 }
    );
  }
}
