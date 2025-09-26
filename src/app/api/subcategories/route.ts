import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

// GET /api/subcategories - Get all subcategories for a category
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    const whereClause = categoryId 
      ? { categoryId, isActive: true }
      : { isActive: true };

    const subcategories = await prisma.subcategory.findMany({
      where: whereClause,
      include: {
        category: {
          select: { id: true, name: true, slug: true }
        }
      },
      orderBy: { order: 'asc' }
    });

    return NextResponse.json(subcategories);
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subcategories' },
      { status: 500 }
    );
  }
}

// POST /api/subcategories - Create new subcategory (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, image, order, categoryId } = body;

    if (!name || !categoryId) {
      return NextResponse.json(
        { error: 'Subcategory name and category ID are required' },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();

    const subcategory = await prisma.subcategory.create({
      data: {
        name,
        slug,
        description,
        image,
        order: order || 0,
        categoryId
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true }
        }
      }
    });

    return NextResponse.json(subcategory);
  } catch (error) {
    console.error('Error creating subcategory:', error);
    return NextResponse.json(
      { error: 'Failed to create subcategory' },
      { status: 500 }
    );
  }
}
