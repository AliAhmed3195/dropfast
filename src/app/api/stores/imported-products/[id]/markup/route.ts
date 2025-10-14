import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'VENDOR_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { markup } = await request.json();
    const storeProductId = params.id;

    if (markup === undefined || markup < 0) {
      return NextResponse.json(
        { error: 'Valid markup percentage is required' },
        { status: 400 }
      );
    }

    // Get the store product and verify ownership
    const storeProduct = await prisma.storeProduct.findUnique({
      where: { id: storeProductId },
      include: {
        store: {
          select: { ownerId: true }
        }
      }
    });

    if (!storeProduct) {
      return NextResponse.json({ error: 'Store product not found' }, { status: 404 });
    }

    // Verify store ownership
    if (storeProduct.store.ownerId !== session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Calculate and lock new markup amounts based on current type
    let newMarkupAmountInUSD: number;
    let newMarkupAmountInLocalCurrency: number;
    let newFinalPrice: number;

    const currentMarkupType = storeProduct.markupType || 'percentage';

    if (currentMarkupType === 'percentage') {
      // Percentage-based markup
      newMarkupAmountInUSD = storeProduct.lockedUSDPrice * (markup / 100);
      newMarkupAmountInLocalCurrency = storeProduct.lockedLocalPrice * (markup / 100);
    } else {
      // Fixed price markup
      newMarkupAmountInLocalCurrency = markup;
      // Convert fixed markup to USD
      newMarkupAmountInUSD = newMarkupAmountInLocalCurrency / storeProduct.exchangeRateAtImport;
    }

    newFinalPrice = storeProduct.lockedLocalPrice + newMarkupAmountInLocalCurrency;

    // Update the store product
    const updatedStoreProduct = await prisma.storeProduct.update({
      where: { id: storeProductId },
      data: {
        markup,
        markupAmountInUSD: newMarkupAmountInUSD,
        markupAmountInLocalCurrency: newMarkupAmountInLocalCurrency,
        markupLockedAt: new Date(),
        markupExchangeRate: storeProduct.exchangeRateAtImport,
        finalPrice: newFinalPrice,
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
      message: 'Markup updated successfully',
      storeProduct: {
        id: updatedStoreProduct.id,
        markup: updatedStoreProduct.markup,
        finalPrice: updatedStoreProduct.finalPrice,
        lockedLocalPrice: updatedStoreProduct.lockedLocalPrice,
        localCurrency: updatedStoreProduct.localCurrency,
      }
    });

  } catch (error) {
    console.error('Error updating markup:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
