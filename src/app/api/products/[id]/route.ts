import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    const productId = params.id;

    // If no session (public access), allow access to active products in stores
    if (!session) {
      const product = await prisma.product.findFirst({
        where: { 
          id: productId,
          isActive: true,
          storeId: { not: null } // Only products that are in stores
        },
        include: {
          supplier: {
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
              logo: true,
            },
          },
          images: {
            orderBy: [
              { isMain: 'desc' },
              { order: 'asc' },
              { createdAt: 'asc' }
            ]
          },
        },
      });

      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }

      return NextResponse.json({ product });
    }

    // If session exists, check if user can access this product
    const product = await prisma.product.findFirst({
      where: { 
        id: productId,
        OR: [
          { supplierId: session.id }, // Supplier can access their own products
          { 
            isActive: true,
            storeId: { not: null } // Anyone can access active products in stores
          }
        ]
      },
      include: {
        supplier: {
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
            logo: true,
          },
        },
        images: {
          orderBy: [
            { isMain: 'desc' },
            { order: 'asc' },
            { createdAt: 'asc' }
          ]
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'SUPPLIER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const productId = params.id;
    const body = await request.json();

    // Check if product exists and belongs to the supplier
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: productId,
        supplierId: session.id
      }
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Define allowed fields for editing (excluding restricted fields)
    const allowedFields = [
      'name', 'description', 'category', 'metaTitle', 'metaDescription', 
      'metaTags', 'type', 'subCategory', 'totalQuantity', 'availableQuantity', 
      'shippingInfo', 'isActive'
    ];

    // Filter only allowed fields
    const updateData: any = {};
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    // Update the product
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
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
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}