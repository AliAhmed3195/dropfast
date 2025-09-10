import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'VENDOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId, storeId, markup, generateHostedLink = true } = await request.json();

    if (!productId || !storeId || markup === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify the store belongs to the user
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        ownerId: session.id,
      },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Get the original product (not vendor-created copies)
    const originalProduct = await prisma.product.findFirst({
      where: {
        id: productId,
        storeId: null, // Only original products, not vendor copies
        isActive: true,
      },
    });

    if (!originalProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if product is already imported to this store
    const existingProduct = await prisma.product.findFirst({
      where: {
        name: originalProduct.name,
        storeId: storeId,
        supplierId: originalProduct.supplierId,
      },
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: 'Product already imported to this store' },
        { status: 400 }
      );
    }

    // Create imported product with markup
    const finalPrice = originalProduct.price + (originalProduct.price * markup / 100);

    const importedProduct = await prisma.product.create({
      data: {
        name: originalProduct.name,
        description: originalProduct.description,
        price: finalPrice,
        image: originalProduct.image,
        category: originalProduct.category,
        markup: markup,
        supplierId: originalProduct.supplierId,
        storeId: storeId,
        variants: originalProduct.variants, // Copy variants from original product
        hostedLink: null, // Will be updated after creation
      },
    });

    // Generate hosted link using the new product ID
    let hostedLink = null;
    if (generateHostedLink) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      hostedLink = `${baseUrl}/checkout/vendor/${storeId}/${importedProduct.id}`;
      
      // Update the product with the correct hosted link
      await prisma.product.update({
        where: { id: importedProduct.id },
        data: { hostedLink: hostedLink }
      });
    }

    return NextResponse.json({ 
      message: 'Product imported successfully',
      product: importedProduct,
      hostedLink: hostedLink
    });
  } catch (error) {
    console.error('Error importing product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
