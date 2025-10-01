import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const url = new URL(request.url);
    const customerCurrency = url.searchParams.get('currency') || 'USD';

    // First try to find as StoreProduct (imported product)
    let storeProduct = await prisma.storeProduct.findFirst({
      where: {
        productId: id,
        isActive: true,
      },
      include: {
        product: {
          include: {
            supplier: {
              select: {
                name: true,
                email: true,
              },
            },
            category: {
              select: {
                name: true,
                slug: true,
              },
            },
            subcategory: {
              select: {
                name: true,
                slug: true,
              },
            },
            tags: {
              include: {
                tag: {
                  select: {
                    name: true,
                    color: true,
                  },
                },
              },
            },
            images: {
              orderBy: [
                { isMain: 'desc' },
                { order: 'asc' },
                { createdAt: 'asc' },
              ],
            },
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            currency: true,
          },
        },
      },
    });

    if (storeProduct) {
      // This is an imported product, return with store context
      const product = {
        ...storeProduct.product,
        storeProductId: storeProduct.id,
        lockedUSDPrice: storeProduct.lockedUSDPrice,
        lockedLocalPrice: storeProduct.lockedLocalPrice,
        localCurrency: storeProduct.localCurrency,
        markup: storeProduct.markup,
        finalPrice: storeProduct.finalPrice,
        displayPrice: storeProduct.finalPrice, // Will be converted on frontend
        displayCurrency: storeProduct.localCurrency,
        exchangeRate: 1,
        isActive: storeProduct.isActive,
        updatedAt: storeProduct.updatedAt,
        store: storeProduct.store,
      };

      return NextResponse.json({ product });
    }

    // If not found as StoreProduct, try to find as original Product
    const originalProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        supplier: {
          select: {
            name: true,
            email: true,
          },
        },
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
        subcategory: {
          select: {
            name: true,
            slug: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                name: true,
                color: true,
              },
            },
          },
        },
        images: {
          orderBy: [
            { isMain: 'desc' },
            { order: 'asc' },
            { createdAt: 'asc' },
          ],
        },
      },
    });

    if (!originalProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Return original product with default values
    const product = {
      ...originalProduct,
      storeProductId: originalProduct.id,
      lockedUSDPrice: originalProduct.lockedUSDPrice || originalProduct.price,
      lockedLocalPrice: originalProduct.price,
      localCurrency: originalProduct.currency || 'USD',
      markup: 0,
      finalPrice: originalProduct.price,
      displayPrice: originalProduct.price,
      displayCurrency: originalProduct.currency || 'USD',
      exchangeRate: 1,
      isActive: true,
      updatedAt: originalProduct.updatedAt,
      store: null, // No store context for original products
    };

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}