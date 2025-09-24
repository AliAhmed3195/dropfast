import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      where: {
        supplierId: session.userId || session.id,
        storeId: null, // Only show original products, not vendor-created copies
      },
      include: {
        store: true,
        images: {
          orderBy: [
            { isMain: 'desc' },
            { order: 'asc' },
            { createdAt: 'asc' }
          ]
        },
        // variants: true, // Temporarily commented out
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Add variants to products if available
    const productsWithVariants = products.map(product => ({
      ...product,
      variants: product.variants || []
    }));

    return NextResponse.json({ products: productsWithVariants });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    console.log('Session in products API:', session);
    if (!session || session.role !== 'SUPPLIER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      name, 
      description, 
      price, 
      image, 
      images = [],
      category, 
      sku,
      brandName,
      minQuantity,
      suggestedAmount,
      metaTitle,
      metaDescription,
      metaTags,
      type,
      subCategory,
      totalQuantity,
      availableQuantity,
      shippingInfo,
      variants = [] 
    } = await request.json();

    if (!name || !description || !price || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Prepare variants data
    const variantsData = variants.filter(v => v.name && v.value).map((variant: any) => ({
      id: `variant-${Date.now()}-${Math.random()}`,
      name: variant.name,
      value: variant.value,
      priceModifier: parseFloat(variant.priceModifier) || 0,
    }));

    console.log('Creating product with supplierId:', session.userId || session.id);
    let product;
    try {
      // Create product first
      product = await prisma.product.create({
        data: {
          name,
          description,
          price: parseFloat(price),
          image,
          category,
          sku: sku || null,
          brandName: brandName || null,
          minQuantity: minQuantity || null,
          suggestedAmount: suggestedAmount || null,
          metaTitle: metaTitle || null,
          metaDescription: metaDescription || null,
          metaTags: metaTags || null,
          type: type || null,
          subCategory: subCategory || null,
          totalQuantity: totalQuantity || 0,
          availableQuantity: availableQuantity || 0,
          shippingInfo: shippingInfo || null,
          supplierId: session.userId || session.id,
          storeId: null, // Explicitly set to null for original products
          isActive: true, // Explicitly set to true
          variants: variantsData.length > 0 ? variantsData : null, // Store as JSON
        },
      });

      // Add images if provided
      if (images.length > 0) {
        const imageData = images.map((img: string, index: number) => ({
          productId: product.id,
          url: img,
          alt: `${name} image ${index + 1}`,
          isMain: index === 0, // First image is main
          order: index
        }));

        await prisma.productImage.createMany({
          data: imageData
        });
      }
    } catch (error) {
      console.error('Error creating product with variants:', error);
      // If variants column doesn't exist, create without variants
      console.log('Variants column not available, creating product without variants');
      console.log('Fallback - Creating product with supplierId:', session.userId || session.id);
      product = await prisma.product.create({
        data: {
          name,
          description,
          price: parseFloat(price),
          image,
          category,
          sku: sku || null,
          brandName: brandName || null,
          minQuantity: minQuantity || null,
          suggestedAmount: suggestedAmount || null,
          metaTitle: metaTitle || null,
          metaDescription: metaDescription || null,
          metaTags: metaTags || null,
          type: type || null,
          subCategory: subCategory || null,
          totalQuantity: totalQuantity || 0,
          availableQuantity: availableQuantity || 0,
          shippingInfo: shippingInfo || null,
          supplierId: session.userId || session.id,
          storeId: null,
          isActive: true,
        },
      });

      // Add images if provided (fallback method)
      if (images.length > 0) {
        const imageData = images.map((img: string, index: number) => ({
          productId: product.id,
          url: img,
          alt: `${name} image ${index + 1}`,
          isMain: index === 0, // First image is main
          order: index
        }));

        await prisma.productImage.createMany({
          data: imageData
        });
      }
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
