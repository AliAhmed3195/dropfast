import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        storeId: null, // Products not yet imported by vendors
      },
      include: {
        supplier: {
          select: {
            name: true,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Add variants to products if available
    const productsWithVariants = products.map(product => ({
      ...product,
      variants: product.variants || []
    }));

    return NextResponse.json({ products: productsWithVariants });
  } catch (error) {
    console.error('Error fetching available products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
