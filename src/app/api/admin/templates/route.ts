import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

// GET /api/admin/templates - Get all templates
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templates = await prisma.template.findMany({
      orderBy: {
        createdAt: 'desc'
      }
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

// POST /api/admin/templates - Create new template
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, baseHtml, baseConfig, previewImage } = await request.json();

    if (!name || !baseHtml || !baseConfig) {
      return NextResponse.json(
        { error: 'Missing required fields: name, baseHtml, baseConfig' },
        { status: 400 }
      );
    }

    // Check if template name already exists
    const existingTemplate = await prisma.template.findUnique({
      where: { name }
    });

    if (existingTemplate) {
      return NextResponse.json(
        { error: 'Template with this name already exists' },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    const template = await prisma.template.create({
      data: {
        name,
        slug,
        description: description || null,
        theme: baseConfig || {},
        pages: {},
        editableFields: {},
        previewImage: previewImage || null,
        isActive: true
      }
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


