import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string; productId: string } }
) {
  try {
    // First find the store
    const store = await prisma.store.findFirst({
      where: {
        slug: params.slug,
        isActive: true
      },
      select: {
        id: true
      }
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Find the product through StoreProduct
    const storeProduct = await prisma.storeProduct.findFirst({
      where: {
        storeId: store.id,
        productId: params.productId,
        product: {
          isActive: true
        }
      },
      include: {
        product: {
          include: {
            images: true,
            category: true,
            subcategory: true,
            tags: {
              include: {
                tag: true
              }
            },
            supplier: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!storeProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Format product for frontend
    const product = {
      id: storeProduct.product.id,
      name: storeProduct.product.name,
      description: storeProduct.product.description,
      price: storeProduct.finalPrice || storeProduct.product.lockedUSDPrice,
      image: storeProduct.product.images?.find(img => img.isMain)?.url || storeProduct.product.image || '',
      images: storeProduct.product.images || [],
      category: storeProduct.product.category,
      subcategory: storeProduct.product.subcategory,
      tags: storeProduct.product.tags,
      sku: storeProduct.product.sku,
      brandName: storeProduct.product.brandName,
      minQuantity: storeProduct.product.minQuantity,
      totalQuantity: storeProduct.product.totalQuantity,
      availableQuantity: storeProduct.product.availableQuantity,
      shippingInfo: storeProduct.product.shippingInfo,
      variants: storeProduct.product.variants,
      supplier: storeProduct.product.supplier,
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

