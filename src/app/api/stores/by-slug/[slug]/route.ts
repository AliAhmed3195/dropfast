import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { currencyService } from '@/lib/currency-conversion';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const url = new URL(request.url);
    const customerCurrency = url.searchParams.get('currency') || 'USD';

    const store = await prisma.store.findUnique({
      where: { slug },
      include: {
        storeProducts: {
          where: {
            isActive: true,
          },
          include: {
            product: {
              include: {
                supplier: {
                  select: {
                    name: true,
                  },
                },
                category: {
                  select: {
                    name: true,
                    slug: true
                  }
                },
                subcategory: {
                  select: {
                    name: true,
                    slug: true
                  }
                },
                tags: {
                  include: {
                    tag: {
                      select: {
                        name: true,
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
              }
            }
          }
        },
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Convert prices to customer currency
    const productsWithConvertedPrices = await Promise.all(
      store.storeProducts.map(async (storeProduct) => {
        let displayPrice = storeProduct.finalPrice;
        let displayCurrency = storeProduct.localCurrency;
        let exchangeRate = 1;

        // If customer currency is different from store currency, convert
        if (customerCurrency !== storeProduct.localCurrency) {
          try {
            displayPrice = await currencyService.convert(
              storeProduct.finalPrice,
              storeProduct.localCurrency,
              customerCurrency
            );
            displayCurrency = customerCurrency;
            exchangeRate = await currencyService.getRate(storeProduct.localCurrency, customerCurrency);
          } catch (error) {
            console.error('Currency conversion error:', error);
            // Fallback to store currency if conversion fails
          }
        }

        return {
          ...storeProduct.product,
          storeProductId: storeProduct.id,
          lockedUSDPrice: storeProduct.lockedUSDPrice,
          lockedLocalPrice: storeProduct.lockedLocalPrice,
          localCurrency: storeProduct.localCurrency,
          markup: storeProduct.markup,
          finalPrice: storeProduct.finalPrice,
          displayPrice,
          displayCurrency,
          exchangeRate,
          isActive: storeProduct.isActive,
          createdAt: storeProduct.createdAt,
          updatedAt: storeProduct.updatedAt,
        };
      })
    );

    // Filter out inactive products and sort
    const activeProducts = productsWithConvertedPrices
      .filter(p => p.isActive)
      .sort((a, b) => {
        // Featured products first, then by creation date
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

    const storeData = {
      ...store,
      products: activeProducts,
      storeProducts: undefined, // Remove the raw storeProducts
    };

    console.log('Store found:', store.name);
    console.log('Store currency:', store.currency);
    console.log('Customer currency:', customerCurrency);
    console.log('Products count:', activeProducts.length);

    return NextResponse.json({ 
      store: storeData,
      currencyInfo: {
        storeCurrency: store.currency,
        customerCurrency,
        conversionApplied: customerCurrency !== store.currency
      }
    });
  } catch (error) {
    console.error('Error fetching store by slug:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}