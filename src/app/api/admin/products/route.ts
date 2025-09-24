import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all products with supplier, store information, and sales data
    const products = await prisma.product.findMany({
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
        orders: {
          select: {
            id: true,
            quantity: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate total sales for each product
    const productsWithSales = products.map(product => ({
      ...product,
      totalSales: product.orders.reduce((total, order) => total + order.quantity, 0),
    }));

    return NextResponse.json({ products: productsWithSales });
  } catch (error) {
    console.error('Error fetching admin products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
