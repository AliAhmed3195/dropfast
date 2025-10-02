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

    const { storeProductId, storeId } = await request.json();

    if (!storeProductId || !storeId) {
      return NextResponse.json(
        { error: 'StoreProduct ID and Store ID are required' },
        { status: 400 }
      );
    }

    // Get the StoreProduct
    const storeProduct = await prisma.storeProduct.findUnique({
      where: { id: storeProductId },
      include: {
        store: true,
        product: true
      }
    });

    if (!storeProduct) {
      return NextResponse.json(
        { error: 'StoreProduct not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (storeProduct.store.ownerId !== session.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get target store
    const targetStore = await prisma.store.findUnique({
      where: { id: storeId },
      select: { currency: true, ownerId: true, name: true }
    });

    if (!targetStore) {
      return NextResponse.json(
        { error: 'Target store not found' },
        { status: 404 }
      );
    }

    // Verify store ownership
    if (targetStore.ownerId !== session.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update StoreProduct to be active and assign to target store
    const updatedStoreProduct = await prisma.storeProduct.update({
      where: { id: storeProductId },
      data: {
        storeId,
        isActive: true,
        // Update pricing if store currency is different
        lockedLocalPrice: targetStore.currency === storeProduct.localCurrency
          ? storeProduct.lockedLocalPrice
          : await currencyService.convert(
              storeProduct.lockedUSDPrice,
              'USD',
              targetStore.currency
            ),
        localCurrency: targetStore.currency,
        exchangeRateAtImport: targetStore.currency === 'USD'
          ? 1
          : await currencyService.getRate('USD', targetStore.currency),
        finalPrice: targetStore.currency === storeProduct.localCurrency
          ? storeProduct.finalPrice
          : (await currencyService.convert(
              storeProduct.lockedUSDPrice,
              'USD',
              targetStore.currency
            )) * (1 + storeProduct.markup / 100),
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
      message: `Product moved to ${targetStore.name} successfully`,
      storeProduct: updatedStoreProduct
    });

  } catch (error) {
    console.error('Error moving product to store:', error);
    return NextResponse.json(
      { error: 'Failed to move product to store' },
      { status: 500 }
    );
  }
}
