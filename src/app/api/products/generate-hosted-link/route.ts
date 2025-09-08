import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'VENDOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId, storeId, markup } = await request.json();

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
        ownerId: session.userId,
      },
    });

    // Store lookup

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Get the original product (not vendor-created copies)
    const originalProduct = await prisma.product.findFirst({
      where: {
        id: productId,
        storeId: null, // Only original products, not vendor copies
        // isActive: true, // Temporarily removed to debug
      },
      include: {
        supplier: true,
        // variants: true, // Temporarily commented out
      },
    });

    // Product lookup

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

    let hostedLink;
    if (existingProduct) {
      // Use existing hosted link
      hostedLink = existingProduct.hostedLink;
    } else {
      // Create a temporary product entry for hosted link generation
      const finalPrice = originalProduct.price + (originalProduct.price * markup / 100);
      
      // Create a temporary product entry (not imported to store, just for hosted link)
      let newProduct;
      try {
        newProduct = await prisma.product.create({
          data: {
            name: originalProduct.name,
            description: originalProduct.description,
            price: finalPrice,
            image: originalProduct.image,
            category: originalProduct.category,
            markup: markup,
            supplierId: originalProduct.supplierId,
            storeId: storeId,
            hostedLink: '', // Will be updated below
            variants: originalProduct.variants, // Copy variants from original product
          },
        });
      } catch (error) {
        // If variants column doesn't exist, create without variants
        console.log('Variants column not available, creating product without variants');
        newProduct = await prisma.product.create({
          data: {
            name: originalProduct.name,
            description: originalProduct.description,
            price: finalPrice,
            image: originalProduct.image,
            category: originalProduct.category,
            markup: markup,
            supplierId: originalProduct.supplierId,
            storeId: storeId,
            hostedLink: '', // Will be updated below
          },
        });
      }

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      hostedLink = `${baseUrl}/checkout/vendor/${storeId}/${newProduct.id}`;

      // Update the product with the correct hosted link
      await prisma.product.update({
        where: { id: newProduct.id },
        data: { hostedLink: hostedLink },
      });
    }

    return NextResponse.json({ 
      message: 'Hosted link generated successfully',
      hostedLink: hostedLink,
      product: {
        name: originalProduct.name,
        supplier: originalProduct.supplier.name,
        basePrice: originalProduct.price,
        finalPrice: originalProduct.price + (originalProduct.price * markup / 100),
        markup: markup,
      }
    });
  } catch (error) {
    console.error('Error generating hosted link:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
