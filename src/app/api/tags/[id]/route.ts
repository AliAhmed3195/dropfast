import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

// PUT /api/tags/[id] - Update tag (full update)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return updateTag(request, { params });
}

// PATCH /api/tags/[id] - Update tag (partial update)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return updateTag(request, { params });
}

async function updateTag(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, color, isActive } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (color !== undefined) updateData.color = color;
    if (isActive !== undefined) updateData.isActive = isActive;

    // If name is being updated, update slug too
    if (name) {
      updateData.slug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();
    }

    const tag = await prisma.tag.update({
      where: { id: params.id },
      data: updateData
    });

    return NextResponse.json(tag);
  } catch (error) {
    console.error('Error updating tag:', error);
    return NextResponse.json(
      { error: 'Failed to update tag' },
      { status: 500 }
    );
  }
}

// DELETE /api/tags/[id] - Delete tag
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if tag has products
    const productCount = await prisma.productTag.count({
      where: { tagId: params.id }
    });

    if (productCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete tag with existing products' },
        { status: 400 }
      );
    }

    await prisma.tag.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return NextResponse.json(
      { error: 'Failed to delete tag' },
      { status: 500 }
    );
  }
}
