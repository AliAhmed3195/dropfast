import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { currencyService } from '@/lib/currency-conversion';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'VENDOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId, storeId, markup = 0 } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    if (!storeId) {
      return NextResponse.json(
        { error: 'Store ID is required' },
        { status: 400 }
      );
    }

    // Get store details
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { currency: true, ownerId: true, name: true }
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Verify store ownership
    if (store.ownerId !== session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get product details
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        supplier: true,
        category: true,
        subcategory: true,
        tags: {
          include: {
            tag: true
          }
        },
        images: {
          orderBy: [
            { isMain: 'desc' },
            { order: 'asc' },
            { createdAt: 'asc' }
          ]
        }
      }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if product is already imported to this store
    const existingStoreProduct = await prisma.storeProduct.findUnique({
      where: {
        productId_storeId: {
          productId,
          storeId
        }
      }
    });

    if (existingStoreProduct) {
      return NextResponse.json(
        { error: 'Product already imported to this store' },
        { status: 400 }
      );
    }

    // Convert price to store currency
    let lockedLocalPrice: number;
    let exchangeRateAtImport: number;
    const usdPrice = product.lockedUSDPrice || product.price;

    try {
      if (store.currency === 'USD') {
        lockedLocalPrice = usdPrice;
        exchangeRateAtImport = 1;
      } else {
        lockedLocalPrice = await currencyService.convert(
          usdPrice,
          'USD',
          store.currency
        );
        exchangeRateAtImport = await currencyService.getRate('USD', store.currency);
      }

      console.log(`Store import conversion: USD ${usdPrice} -> ${store.currency} ${lockedLocalPrice.toFixed(2)} (rate: ${exchangeRateAtImport})`);
    } catch (error) {
      console.error('Currency conversion error during import:', error);
      return NextResponse.json(
        { error: 'Currency conversion failed' },
        { status: 400 }
      );
    }

    // Calculate final price with markup
    const finalPrice = lockedLocalPrice * (1 + markup / 100);

    // Create StoreProduct entry
    const storeProduct = await prisma.storeProduct.create({
      data: {
        productId,
        storeId,
        lockedUSDPrice: usdPrice,
        lockedLocalPrice,
        localCurrency: store.currency,
        exchangeRateAtImport,
        markup,
        finalPrice,
        isActive: true,
      },
      include: {
        product: {
          include: {
            images: {
              orderBy: [
                { isMain: 'desc' },
                { order: 'asc' },
                { createdAt: 'asc' }
              ]
            }
          }
        },
        store: true
      }
    });

    return NextResponse.json({
      success: true,
      message: `Product imported to ${store.name} successfully`,
      storeProduct: {
        id: storeProduct.id,
        product: storeProduct.product,
        lockedUSDPrice: storeProduct.lockedUSDPrice,
        lockedLocalPrice: storeProduct.lockedLocalPrice,
        localCurrency: storeProduct.localCurrency,
        finalPrice: storeProduct.finalPrice,
        markup: storeProduct.markup,
        isActive: storeProduct.isActive,
        createdAt: storeProduct.createdAt
      }
    });

  } catch (error) {
    console.error('Error importing product to store:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
