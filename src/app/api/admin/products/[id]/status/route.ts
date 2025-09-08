import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const productId = params.id;
    const { isActive } = await request.json();

    // Update product status
    const product = await prisma.product.update({
      where: { id: productId },
      data: { isActive },
      include: {
        supplier: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ 
      message: `Product ${isActive ? 'activated' : 'deactivated'} successfully`,
      product 
    });
  } catch (error) {
    console.error('Error updating product status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
