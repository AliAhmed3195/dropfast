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

    // Ensure template is loaded (handle case where relation might not be included)
    let finalStore = store;
    if (!store.template && store.templateId) {
      console.warn(`⚠️ Template relation not loaded for store ${store.slug}. Loading manually...`);
      const template = await prisma.template.findUnique({
        where: { id: store.templateId },
        select: {
          id: true,
          name: true,
          slug: true,
          version: true,
          theme: true,
          pages: true,
          editableFields: true,
        }
      });
      
      if (template) {
        finalStore = {
          ...store,
          template: template
        };
        console.log(`✅ Template loaded manually for store ${store.slug}: ${template.name} (${template.slug})`);
      } else {
        console.error(`❌ Template ${store.templateId} not found in database for store ${store.slug}`);
      }
    }

    // Validate template exists
    if (!finalStore.template && finalStore.templateId) {
      console.error(`❌ CRITICAL: Store ${finalStore.slug} has templateId ${finalStore.templateId} but template not found!`);
    }

    // Debug log
    console.log('Store API Response:', {
      storeId: finalStore.id,
      storeSlug: finalStore.slug,
      templateId: finalStore.templateId,
      hasTemplate: !!finalStore.template,
      templateSlug: finalStore.template?.slug,
      templateName: finalStore.template?.name,
      templateVersion: finalStore.template?.version
    });

    return NextResponse.json({ store: finalStore });

  } catch (error) {
    console.error('Error fetching public store:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
