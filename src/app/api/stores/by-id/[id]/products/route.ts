import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: storeId } = params;

    const products = await prisma.product.findMany({
      where: {
        storeId: storeId,
        isActive: true,
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
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error fetching store products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}