import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

// GET /api/admin/templates/[id] - Get template by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const template = await prisma.template.findUnique({
      where: { id: params.id },
      include: {
        stores: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/templates/[id] - Update template
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, baseHtml, baseConfig, previewImage, isActive } = await request.json();

    // Check if template exists
    const existingTemplate = await prisma.template.findUnique({
      where: { id: params.id }
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // If name is being changed, check for duplicates
    if (name && name !== existingTemplate.name) {
      const duplicateTemplate = await prisma.template.findUnique({
        where: { name }
      });

      if (duplicateTemplate) {
        return NextResponse.json(
          { error: 'Template with this name already exists' },
          { status: 400 }
        );
      }
    }

    const template = await prisma.template.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(baseHtml && { baseHtml }),
        ...(baseConfig && { baseConfig }),
        ...(previewImage !== undefined && { previewImage }),
        ...(isActive !== undefined && { isActive })
      }
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/templates/[id] - Delete template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if template is being used by any stores
    const storesUsingTemplate = await prisma.store.count({
      where: { templateId: params.id }
    });

    if (storesUsingTemplate > 0) {
      return NextResponse.json(
        { error: `Cannot delete template. It is being used by ${storesUsingTemplate} store(s). Please reassign stores first.` },
        { status: 400 }
      );
    }

    await prisma.template.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


