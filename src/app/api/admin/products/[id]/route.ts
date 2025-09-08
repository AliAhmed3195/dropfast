import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const productId = params.id;

    // Check if product has any orders
    const orderCount = await prisma.order.count({
      where: { productId },
    });

    if (orderCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete product with existing orders. Deactivate it instead.' },
        { status: 400 }
      );
    }

    // Delete product
    await prisma.product.delete({
      where: { id: productId },
    });

    return NextResponse.json({ 
      message: 'Product deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
