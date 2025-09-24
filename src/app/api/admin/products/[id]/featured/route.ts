import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { featured } = await request.json();
    const productId = params.id;

    if (typeof featured !== 'boolean') {
      return NextResponse.json({ error: 'Featured status must be a boolean' }, { status: 400 });
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: { featured },
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
            owner: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ 
      product,
      message: `Product ${featured ? 'added to' : 'removed from'} featured products`
    });
  } catch (error) {
    console.error('Error updating featured status:', error);
    return NextResponse.json(
      { error: 'Failed to update featured status' },
      { status: 500 }
    );
  }
}
