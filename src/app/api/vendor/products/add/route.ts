import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'VENDOR_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId, markup } = await request.json();

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
        supplier: true,
      },
    });

    if (!originalProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if product already exists in vendor's products
    const existingProduct = await prisma.product.findFirst({
      where: {
        supplierId: originalProduct.supplierId,
        storeId: null,
        name: originalProduct.name,
        // Check if this vendor already has this product
        AND: {
          OR: [
            { storeId: null }, // Products without store (My Products)
            { store: { ownerId: session.id } } // Products in vendor's stores
          ]
        }
      }
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: 'Product already exists in your products' },
        { status: 400 }
      );
    }

    // Create a copy of the product for the vendor (My Products only)
    const vendorProduct = await prisma.product.create({
      data: {
        name: originalProduct.name,
        description: originalProduct.description,
        price: originalProduct.price,
        image: originalProduct.image,
        categoryId: originalProduct.categoryId || null,
        subcategoryId: originalProduct.subcategoryId || null,
        sku: originalProduct.sku,
        brandName: originalProduct.brandName,
        minQuantity: originalProduct.minQuantity,
        suggestedAmount: originalProduct.suggestedAmount,
        metaTitle: originalProduct.metaTitle,
        metaDescription: originalProduct.metaDescription,
        metaTags: originalProduct.metaTags,
        totalQuantity: originalProduct.totalQuantity,
        availableQuantity: originalProduct.availableQuantity,
        shippingInfo: originalProduct.shippingInfo,
        variants: originalProduct.variants,
        markup: markup || 0,
        supplierId: originalProduct.supplierId,
        storeId: null, // null means it's in My Products only
        isActive: true,
      },
    });

    return NextResponse.json({ 
      product: vendorProduct,
      message: 'Product added to your products list successfully'
    });
  } catch (error) {
    console.error('Error adding product to My Products:', error);
    return NextResponse.json(
      { error: 'Failed to add product to My Products' },
      { status: 500 }
    );
  }
}
