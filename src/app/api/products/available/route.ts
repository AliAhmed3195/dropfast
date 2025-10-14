import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'VENDOR_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Fetching available products for vendor:', session.id);

    // First, get basic products without complex relations
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        storeId: null
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        images: {
          orderBy: [
            { isMain: 'desc' },
            { order: 'asc' },
            { createdAt: 'asc' }
          ]
        }
      },
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    console.log(`Found ${products.length} basic products`);

    // For now, just return products without import status to test
    const productsWithStatus = products.map(product => ({
      ...product,
      isImported: false,
      importedStores: []
    }));

    console.log(`Processed ${productsWithStatus.length} products with status`);
    console.log(`Products with imports: ${productsWithStatus.filter(p => p.isImported).length}`);

    return NextResponse.json({ products: productsWithStatus });
  } catch (error) {
    console.error('Error fetching available products:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}