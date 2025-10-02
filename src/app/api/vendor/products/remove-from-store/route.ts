import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'VENDOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storeProductId } = await request.json();

    if (!storeProductId) {
      return NextResponse.json(
        { error: 'StoreProduct ID is required' },
        { status: 400 }
      );
    }

    // Get the StoreProduct
    const storeProduct = await prisma.storeProduct.findUnique({
      where: { id: storeProductId },
      include: {
        store: true,
        product: true
      }
    });

    if (!storeProduct) {
      return NextResponse.json(
        { error: 'StoreProduct not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (storeProduct.store.ownerId !== session.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get or create My Products store
    let myProductsStore = await prisma.store.findFirst({
      where: {
        ownerId: session.id,
        name: 'My Products (Private)',
        isActive: false
      }
    });

    if (!myProductsStore) {
      const vendor = await prisma.user.findUnique({
        where: { id: session.id },
        select: { preferredCurrency: true }
      });

      myProductsStore = await prisma.store.create({
        data: {
          name: 'My Products (Private)',
          slug: `my-products-${session.id}`,
          description: 'Private collection of imported products',
          ownerId: session.id,
          currency: vendor?.preferredCurrency || 'USD',
          isActive: false,
        }
      });
    }

    // Update StoreProduct to be inactive and move to My Products store
    const updatedStoreProduct = await prisma.storeProduct.update({
      where: { id: storeProductId },
      data: {
        storeId: myProductsStore.id,
        isActive: false,
      },
      include: {
        product: {
          include: {
            images: {
              orderBy: [
                { isMain: 'desc' },
                { order: 'asc' },
                { createdAt: 'asc' }
              ]
            }
          }
        },
        store: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Product moved to My Products successfully',
      storeProduct: updatedStoreProduct
    });

  } catch (error) {
    console.error('Error removing product from store:', error);
    return NextResponse.json(
      { error: 'Failed to remove product from store' },
      { status: 500 }
    );
  }
}
