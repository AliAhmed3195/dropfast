import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const store = await prisma.store.findFirst({
      where: {
        slug: params.slug,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        templateId: true,
        template: {
          select: {
            id: true,
            name: true,
            slug: true,
            version: true,
            theme: true, // Theme config (renamed from baseConfig)
            pages: true, // Pages structure
            editableFields: true, // Editable fields
          }
        },
        overrides: true,
        logo: true,
        banner: true,
        address: true,
        phone: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        storeProducts: {
          include: {
            product: {
              include: {
                images: true,
                category: true,
                subcategory: true,
                tags: true
              }
            }
          }
        },
        owner: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    return NextResponse.json({ store });

  } catch (error) {
    console.error('Error fetching public store:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
