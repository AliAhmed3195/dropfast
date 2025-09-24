import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const productId = params.id;

    // Check if product exists and belongs to the supplier
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        supplierId: session.id
      },
      include: {
        images: {
          orderBy: [
            { isMain: 'desc' },
            { order: 'asc' },
            { createdAt: 'asc' }
          ]
        }
      }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ images: product.images });
  } catch (error) {
    console.error('Error fetching product images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product images' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'SUPPLIER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const productId = params.id;
    const { images } = await request.json();

    // Check if product exists and belongs to the supplier
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        supplierId: session.id
      }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Delete existing images
    await prisma.productImage.deleteMany({
      where: { productId }
    });

    // Create new images
    if (images && images.length > 0) {
      const imageData = images.map((img: any, index: number) => ({
        productId,
        url: img.url,
        alt: img.alt || `Product image ${index + 1}`,
        isMain: img.isMain || false,
        order: img.order || index
      }));

      await prisma.productImage.createMany({
        data: imageData
      });
    }

    // Fetch updated product with images
    const updatedProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: {
          orderBy: [
            { isMain: 'desc' },
            { order: 'asc' },
            { createdAt: 'asc' }
          ]
        }
      }
    });

    return NextResponse.json({ product: updatedProduct });
  } catch (error) {
    console.error('Error updating product images:', error);
    return NextResponse.json(
      { error: 'Failed to update product images' },
      { status: 500 }
    );
  }
}