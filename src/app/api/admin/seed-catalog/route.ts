import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Sample categories and subcategories data
    const catalogData = [
      {
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic devices and gadgets',
        order: 1,
        subcategories: [
          { name: 'Smartphones', slug: 'smartphones', order: 1 },
          { name: 'Laptops', slug: 'laptops', order: 2 },
          { name: 'Tablets', slug: 'tablets', order: 3 },
          { name: 'Headphones', slug: 'headphones', order: 4 },
          { name: 'Cameras', slug: 'cameras', order: 5 }
        ]
      },
      {
        name: 'Fashion',
        slug: 'fashion',
        description: 'Clothing and accessories',
        order: 2,
        subcategories: [
          { name: 'Men\'s Clothing', slug: 'mens-clothing', order: 1 },
          { name: 'Women\'s Clothing', slug: 'womens-clothing', order: 2 },
          { name: 'Shoes', slug: 'shoes', order: 3 },
          { name: 'Bags', slug: 'bags', order: 4 },
          { name: 'Jewelry', slug: 'jewelry', order: 5 }
        ]
      },
      {
        name: 'Home & Garden',
        slug: 'home-garden',
        description: 'Home improvement and garden supplies',
        order: 3,
        subcategories: [
          { name: 'Furniture', slug: 'furniture', order: 1 },
          { name: 'Kitchen', slug: 'kitchen', order: 2 },
          { name: 'Garden Tools', slug: 'garden-tools', order: 3 },
          { name: 'Home Decor', slug: 'home-decor', order: 4 },
          { name: 'Lighting', slug: 'lighting', order: 5 }
        ]
      },
      {
        name: 'Sports & Outdoors',
        slug: 'sports-outdoors',
        description: 'Sports equipment and outdoor gear',
        order: 4,
        subcategories: [
          { name: 'Fitness', slug: 'fitness', order: 1 },
          { name: 'Outdoor Gear', slug: 'outdoor-gear', order: 2 },
          { name: 'Team Sports', slug: 'team-sports', order: 3 },
          { name: 'Water Sports', slug: 'water-sports', order: 4 },
          { name: 'Winter Sports', slug: 'winter-sports', order: 5 }
        ]
      },
      {
        name: 'Beauty & Health',
        slug: 'beauty-health',
        description: 'Beauty products and health supplements',
        order: 5,
        subcategories: [
          { name: 'Skincare', slug: 'skincare', order: 1 },
          { name: 'Makeup', slug: 'makeup', order: 2 },
          { name: 'Hair Care', slug: 'hair-care', order: 3 },
          { name: 'Fragrances', slug: 'fragrances', order: 4 },
          { name: 'Health Supplements', slug: 'health-supplements', order: 5 }
        ]
      }
    ];

    // Sample tags
    const sampleTags = [
      { name: 'New Arrival', slug: 'new-arrival', color: '#10B981' },
      { name: 'Best Seller', slug: 'best-seller', color: '#F59E0B' },
      { name: 'Sale', slug: 'sale', color: '#EF4444' },
      { name: 'Premium', slug: 'premium', color: '#8B5CF6' },
      { name: 'Eco-Friendly', slug: 'eco-friendly', color: '#059669' },
      { name: 'Limited Edition', slug: 'limited-edition', color: '#DC2626' },
      { name: 'Trending', slug: 'trending', color: '#7C3AED' },
      { name: 'Gift', slug: 'gift', color: '#EC4899' }
    ];

    // Create categories and subcategories
    for (const categoryData of catalogData) {
      const { subcategories, ...categoryInfo } = categoryData;
      
      const category = await prisma.category.upsert({
        where: { slug: categoryInfo.slug },
        update: categoryInfo,
        create: categoryInfo
      });

      for (const subcategoryData of subcategories) {
        await prisma.subcategory.upsert({
          where: { 
            categoryId_slug: { 
              categoryId: category.id, 
              slug: subcategoryData.slug 
            }
          },
          update: subcategoryData,
          create: {
            ...subcategoryData,
            categoryId: category.id
          }
        });
      }
    }

    // Create tags
    for (const tagData of sampleTags) {
      await prisma.tag.upsert({
        where: { slug: tagData.slug },
        update: tagData,
        create: tagData
      });
    }

    return NextResponse.json({ 
      message: 'Catalog data seeded successfully',
      categories: catalogData.length,
      tags: sampleTags.length
    });
  } catch (error) {
    console.error('Error seeding catalog data:', error);
    return NextResponse.json(
      { error: 'Failed to seed catalog data' },
      { status: 500 }
    );
  }
}
