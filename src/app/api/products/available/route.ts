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

    // Get products with all necessary relations for filtering and display
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        storeId: null // Only original products, not vendor-created copies
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        subcategory: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
                color: true
              }
            }
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

    // Get vendor's stores to check import status
    const vendorStores = await prisma.store.findMany({
      where: {
        ownerId: session.id
      },
      select: {
        id: true,
        name: true,
        currency: true
      }
    });

    const storeIds = vendorStores.map(s => s.id);

    // Get all StoreProducts for this vendor's stores to check import status
    const importedStoreProducts = storeIds.length > 0 ? await prisma.storeProduct.findMany({
      where: {
        storeId: { in: storeIds },
        productId: { in: products.map(p => p.id) }
      },
      select: {
        productId: true,
        storeId: true,
        store: {
          select: {
            id: true,
            name: true,
            currency: true
          }
        }
      }
    }) : [];

    // Create a map of productId -> imported stores
    const importStatusMap = new Map<string, Array<{ id: string; name: string; currency: string }>>();
    
    importedStoreProducts.forEach(sp => {
      if (!importStatusMap.has(sp.productId)) {
        importStatusMap.set(sp.productId, []);
      }
      importStatusMap.get(sp.productId)!.push(sp.store);
    });

    // Add import status to each product
    const productsWithStatus = products.map(product => {
      const importedStores = importStatusMap.get(product.id) || [];
      return {
        ...product,
        isImported: importedStores.length > 0,
        importedStores: importedStores
      };
    });

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