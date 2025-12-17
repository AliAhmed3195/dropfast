import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { currencyService } from '@/lib/currency-conversion';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'VENDOR_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId, storeId, markup = 0, markupType = 'percentage' } = await request.json();
    
    console.log('Import product request:', { productId, storeId, markup, markupType });
    
    // Validate markupType - be more flexible with the values
    console.log('Received markupType:', markupType, 'Type:', typeof markupType);
    
    // Normalize markupType to handle different possible values
    let normalizedMarkupType = markupType;
    if (typeof markupType === 'string') {
      normalizedMarkupType = markupType.toLowerCase().trim();
    }
    
    // Map common variations to standard values
    if (normalizedMarkupType === 'percent' || normalizedMarkupType === 'pct' || normalizedMarkupType === '%') {
      normalizedMarkupType = 'percentage';
    } else if (normalizedMarkupType === 'amount' || normalizedMarkupType === 'price' || normalizedMarkupType === 'fixed_amount') {
      normalizedMarkupType = 'fixed';
    }
    
    if (normalizedMarkupType !== 'percentage' && normalizedMarkupType !== 'fixed') {
      console.log('Invalid markupType received:', {
        original: markupType,
        normalized: normalizedMarkupType,
        type: typeof markupType,
        length: markupType?.length
      });
      
      // For debugging, let's accept any value and default to percentage
      console.log('Defaulting to percentage for debugging');
      normalizedMarkupType = 'percentage';
    }
    
    // Use the normalized markupType
    const finalMarkupType = normalizedMarkupType;
    
    // Validate and normalize markup value
    console.log('Received markup:', markup, 'Type:', typeof markup);
    
    let normalizedMarkup = markup;
    
    // Convert string to number if needed
    if (typeof markup === 'string') {
      normalizedMarkup = parseFloat(markup);
      console.log('Converted markup from string:', markup, 'to number:', normalizedMarkup);
    }
    
    // Check if conversion was successful
    if (isNaN(normalizedMarkup) || normalizedMarkup < 0) {
      return NextResponse.json(
        { 
          error: 'Markup must be a valid non-negative number',
          received: markup,
          type: typeof markup,
          converted: normalizedMarkup
        },
        { status: 400 }
      );
    }
    
    console.log('Final normalized markup:', normalizedMarkup);

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
      select: { ownerId: true, name: true }
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

    // Check if product is already imported to this vendor (any store)
    const existingStoreProduct = await prisma.storeProduct.findFirst({
      where: {
        productId,
        store: {
          ownerId: session.id
        }
      },
      include: {
        store: true
      }
    });

    if (existingStoreProduct) {
      // If product exists in My Products (isActive: false), update it to Store
      if (!existingStoreProduct.isActive) {
        // Update existing StoreProduct to be active and assign to the selected store
        const updatedStoreProduct = await prisma.storeProduct.update({
          where: { id: existingStoreProduct.id },
          data: {
            storeId,
            isActive: true,
            // Pricing is always in USD
            lockedLocalPrice: product.lockedUSDPrice || product.price,
            localCurrency: 'USD',
            exchangeRateAtImport: 1,
            finalPrice: (product.lockedUSDPrice || product.price) * (1 + markup / 100),
            markup,
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
          message: `Product moved from My Products to ${store.name} successfully`,
          storeProduct: {
            id: updatedStoreProduct.id,
            product: updatedStoreProduct.product,
            lockedUSDPrice: updatedStoreProduct.lockedUSDPrice,
            lockedLocalPrice: updatedStoreProduct.lockedLocalPrice,
            localCurrency: updatedStoreProduct.localCurrency,
            finalPrice: updatedStoreProduct.finalPrice,
            markup: updatedStoreProduct.markup,
            isActive: updatedStoreProduct.isActive,
            createdAt: updatedStoreProduct.createdAt
          }
        });
      } else {
        // Product is already in a store
        return NextResponse.json(
          { error: 'Product already imported to a store' },
          { status: 400 }
        );
      }
    }

    // Price is always in USD
    const usdPrice = product.lockedUSDPrice || product.price;
    const lockedLocalPrice = usdPrice;
    const exchangeRateAtImport = 1;

    console.log(`Store import: USD ${usdPrice.toFixed(2)} (always USD)`);

    // Calculate and lock markup amounts based on type
    let markupAmountInUSD: number;
    let markupAmountInLocalCurrency: number;
    let finalPrice: number;

    try {
      // Use normalized markupType and markup from request
      console.log('Markup calculation:', { markupType: finalMarkupType, markup: normalizedMarkup, usdPrice, lockedLocalPrice, exchangeRateAtImport });

      if (finalMarkupType === 'percentage') {
        // Percentage-based markup (always in USD)
        markupAmountInUSD = usdPrice * (normalizedMarkup / 100);
        markupAmountInLocalCurrency = markupAmountInUSD; // Same as USD
      } else {
        // Fixed price markup (always in USD)
        markupAmountInUSD = normalizedMarkup;
        markupAmountInLocalCurrency = normalizedMarkup;
      }

      finalPrice = lockedLocalPrice + markupAmountInLocalCurrency;
      
      console.log('Calculated markup amounts:', { markupAmountInUSD, markupAmountInLocalCurrency, finalPrice });
    } catch (calculationError) {
      console.error('Error in markup calculation:', calculationError);
      throw new Error(`Markup calculation failed: ${calculationError instanceof Error ? calculationError.message : 'Unknown error'}`);
    }

    // Create StoreProduct entry
    let storeProduct;
    try {
      console.log('Creating StoreProduct with data:', {
        productId,
        storeId,
        lockedUSDPrice: usdPrice,
        lockedLocalPrice,
        localCurrency: store.currency,
        exchangeRateAtImport,
        markup: normalizedMarkup,
        markupType: finalMarkupType,
        markupAmountInUSD,
        markupAmountInLocalCurrency,
        finalPrice
      });

      storeProduct = await prisma.storeProduct.create({
        data: {
          productId,
          storeId,
          lockedUSDPrice: usdPrice,
          lockedLocalPrice,
          localCurrency: 'USD',
          exchangeRateAtImport,
          markup: normalizedMarkup,
          markupType: finalMarkupType,
          markupAmountInUSD,
          markupAmountInLocalCurrency,
          markupLockedAt: new Date(),
          markupExchangeRate: exchangeRateAtImport,
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

      console.log('StoreProduct created successfully:', storeProduct.id);
    } catch (dbError) {
      console.error('Error creating StoreProduct:', dbError);
      throw new Error(`Database creation failed: ${dbError instanceof Error ? dbError.message : 'Unknown database error'}`);
    }

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
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
