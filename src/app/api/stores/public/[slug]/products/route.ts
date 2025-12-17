import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // First find the store by slug
    const store = await prisma.store.findFirst({
      where: {
        slug: params.slug,
        isActive: true
      },
      select: { id: true }
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Get products for this store
    const storeProducts = await prisma.storeProduct.findMany({
      where: {
        storeId: store.id,
        isActive: true
      },
      include: {
        product: {
          include: {
            images: true,
            category: true,
            subcategory: true,
            tags: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const products = storeProducts.map(sp => ({
      ...sp.product,
      storeProductId: sp.id,
      markup: sp.markup,
      markupType: sp.markupType,
      finalPrice: sp.finalPrice,
      isActive: sp.isActive
    }));

    // Separate featured and best-selling products
    const featuredProducts = products.filter(p => p.featured === true);
    
    // Best selling products - determined by order count
    // Query orders for each product in this store
    const productsWithOrders = await Promise.all(
      products.map(async (product) => {
        const orderCount = await prisma.order.count({
          where: {
            productId: product.id,
            storeId: store.id,
            status: {
              not: 'CANCELLED'
            }
          }
        });
        return { ...product, orderCount };
      })
    );

    // Best selling = products with highest order count (top 10)
    // If no orders exist, use featured products as fallback
    const bestSellingProducts = productsWithOrders
      .filter(p => p.orderCount > 0)
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 10)
      .map(p => {
        const { orderCount, ...product } = p;
        return product;
      });

    // If no best selling products from orders, use featured products as fallback
    const finalBestSellingProducts = bestSellingProducts.length > 0 
      ? bestSellingProducts 
      : featuredProducts.slice(0, 10);

    // Extract distinct categories from products
    // Use first product image from each category as category image
    const categoryMap = new Map();
    products.forEach(product => {
      if (product.category && !categoryMap.has(product.category.id)) {
        // Get image from product's images array or image field
        let categoryImage = 'https://picsum.photos/200/200?random=' + product.category.id;
        if (product.images && product.images.length > 0) {
          // Try to find main image first
          const mainImage = product.images.find(img => img.isMain);
          categoryImage = mainImage?.url || product.images[0].url;
        } else if (product.image) {
          categoryImage = product.image;
        }

        categoryMap.set(product.category.id, {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug,
          image: categoryImage
        });
      }
    });
    const categories = Array.from(categoryMap.values());

    return NextResponse.json({ 
      products,
      featuredProducts,
      bestSellingProducts: finalBestSellingProducts,
      categories
    });

  } catch (error) {
    console.error('Error fetching public store products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
