import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

// Update an image
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: productId, imageId } = params;
    const body = await request.json();
    const { alt, isMain, order } = body;

    // Verify product exists and user has permission
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { supplier: true }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if user is the supplier or has admin role
    if (product.supplierId !== session.id && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // If this is set as main image, unset other main images
    if (isMain) {
      await prisma.productImage.updateMany({
        where: { 
          productId,
          id: { not: imageId }
        },
        data: { isMain: false }
      });
    }

    const image = await prisma.productImage.update({
      where: { id: imageId },
      data: {
        alt,
        isMain,
        order
      }
    });

    return NextResponse.json({ image });
  } catch (error) {
    console.error('Error updating product image:', error);
    return NextResponse.json(
      { error: 'Failed to update product image' },
      { status: 500 }
    );
  }
}

// Delete an image
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: productId, imageId } = params;

    // Verify product exists and user has permission
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { supplier: true }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if user is the supplier or has admin role
    if (product.supplierId !== session.id && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if this is the main image
    const imageToDelete = await prisma.productImage.findUnique({
      where: { id: imageId }
    });

    if (!imageToDelete) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    await prisma.productImage.delete({
      where: { id: imageId }
    });

    // If we deleted the main image, set another image as main
    if (imageToDelete.isMain) {
      const remainingImages = await prisma.productImage.findMany({
        where: { productId },
        orderBy: { createdAt: 'asc' },
        take: 1
      });

      if (remainingImages.length > 0) {
        await prisma.productImage.update({
          where: { id: remainingImages[0].id },
          data: { isMain: true }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product image:', error);
    return NextResponse.json(
      { error: 'Failed to delete product image' },
      { status: 500 }
    );
  }
}

