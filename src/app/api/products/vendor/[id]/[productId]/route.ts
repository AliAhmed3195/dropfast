import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string; productId: string } }
) {
  try {
    const { id: storeId, productId } = params;

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        storeId: storeId,
        isActive: true,
      },
      include: {
        store: {
          select: {
            name: true,
            slug: true,
            logo: true,
            address: true,
            phone: true,
            email: true,
          },
        },
        supplier: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error fetching product for vendor checkout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
