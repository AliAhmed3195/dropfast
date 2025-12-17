import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/templates - Get all active templates (public API for vendor template selection)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    const where: any = {
      isActive: true,
    };

    // Filter by slug if provided (for preview route)
    if (slug) {
      where.slug = slug;
    }

    const templates = await prisma.template.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        version: true,
        previewImage: true,
        theme: true, // Theme config (renamed from baseConfig)
        pages: true, // Pages structure
        editableFields: true, // Editable fields
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


