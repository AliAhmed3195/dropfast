import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { currencyService } from '@/lib/currency-conversion';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'VENDOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId, markup, markupType } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Get the original product from supplier
    const originalProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        supplier: {
          select: {
            id: true,
            preferredCurrency: true,
          }
        },
        category: true,
        subcategory: true,
        tags: {
          include: {
            tag: true,
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
    });

    if (!originalProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get vendor's preferred currency
    const vendor = await prisma.user.findUnique({
      where: { id: session.id },
      select: { preferredCurrency: true }
    });

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    const vendorCurrency = vendor.preferredCurrency || 'USD';

    // Check if product already exists in vendor's My Products
    const existingStoreProduct = await prisma.storeProduct.findFirst({
      where: {
        productId: productId,
        store: {
          ownerId: session.id
        },
        isActive: false // My Products only
      }
    });

    if (existingStoreProduct) {
      return NextResponse.json(
        { error: 'Product already exists in your My Products' },
        { status: 400 }
      );
    }

    // Get or create a default store for My Products (inactive store)
    let myProductsStore = await prisma.store.findFirst({
      where: {
        ownerId: session.id,
        name: 'My Products (Private)',
        isActive: false
      }
    });

    if (!myProductsStore) {
      myProductsStore = await prisma.store.create({
        data: {
          name: 'My Products (Private)',
          slug: `my-products-${session.id}`,
          description: 'Private collection of imported products',
          ownerId: session.id,
          currency: vendorCurrency,
          isActive: false, // This store is not public
        }
      });
    }

    // Convert USD price to vendor's currency
    const usdPrice = originalProduct.lockedUSDPrice || originalProduct.price;
    const exchangeRate = await currencyService.getRate('USD', vendorCurrency);
    const convertedPrice = usdPrice * exchangeRate;

    // Calculate final price with markup
    let finalMarkup = 0;
    if (markupType === 'percentage') {
      finalMarkup = convertedPrice * (Number(markup) / 100);
    } else {
      finalMarkup = Number(markup) || 0;
    }

    const finalPrice = convertedPrice + finalMarkup;

    // Create StoreProduct entry for My Products (isActive: false)
    const storeProduct = await prisma.storeProduct.create({
      data: {
        productId: productId,
        storeId: myProductsStore.id,
        lockedUSDPrice: usdPrice,
        lockedLocalPrice: convertedPrice,
        localCurrency: vendorCurrency,
        exchangeRateAtImport: exchangeRate,
        markup: finalMarkup,
        finalPrice: finalPrice,
        isActive: false, // This is My Products only, not in public store
      }
    });

    return NextResponse.json({ 
      storeProduct,
      message: 'Product added to your My Products successfully'
    });
  } catch (error) {
    console.error('Error adding product to My Products:', error);
    return NextResponse.json(
      { error: 'Failed to add product to My Products' },
      { status: 500 }
    );
  }
}

