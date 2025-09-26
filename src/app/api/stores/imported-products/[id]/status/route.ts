import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'VENDOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { isActive } = await request.json();
    const storeProductId = params.id;

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'Valid isActive status is required' },
        { status: 400 }
      );
    }

    // Get the store product and verify ownership
    const storeProduct = await prisma.storeProduct.findUnique({
      where: { id: storeProductId },
      include: {
        store: {
          select: { ownerId: true }
        }
      }
    });

    if (!storeProduct) {
      return NextResponse.json({ error: 'Store product not found' }, { status: 404 });
    }

    // Verify store ownership
    if (storeProduct.store.ownerId !== session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update the store product status
    const updatedStoreProduct = await prisma.storeProduct.update({
      where: { id: storeProductId },
      data: {
        isActive,
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
      message: `Product ${isActive ? 'activated' : 'deactivated'} successfully`,
      storeProduct: {
        id: updatedStoreProduct.id,
        isActive: updatedStoreProduct.isActive,
      }
    });

  } catch (error) {
    console.error('Error updating product status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
