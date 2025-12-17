import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateTemplates() {
  console.log('🔄 Migrating templates to new structure...');

  try {
    // Get all existing templates
    const templates = await prisma.template.findMany();

    console.log(`Found ${templates.length} templates to migrate`);

    for (const template of templates) {
      // Map old template names to new slugs
      const slugMap: Record<string, string> = {
        'Basic Store': 'basic',
        'Classic Store': 'classic',
        'E-commerce Pro': 'ecommerce',
      };

      const slug = slugMap[template.name] || template.name.toLowerCase().replace(/\s+/g, '-');

      // Extract old baseConfig structure
      const oldConfig = template.baseConfig as any || {};

      // Convert to new structure
      const newPages = {
        landing: {
          sections: [] as string[],
          layout: oldConfig.layout?.sidebarPosition === 'none' ? 'grid' : 'grid',
          gridColumns: oldConfig.layout?.gridColumns || 3,
        },
        productDetail: {
          layout: 'single-column',
          showRelatedProducts: true,
          showReviews: false,
        },
      };

      // Map old features to sections
      if (oldConfig.features?.hasSlider) {
        newPages.landing.sections.push('hero');
      }
      if (oldConfig.features?.hasFeatured) {
        newPages.landing.sections.push('featured');
      }
      if (oldConfig.features?.hasCategories) {
        newPages.landing.sections.push('categories');
      }
      if (oldConfig.features?.hasNewsletter) {
        newPages.landing.sections.push('newsletter');
      }
      
      // Add footer if not present
      if (!newPages.landing.sections.includes('footer')) {
        newPages.landing.sections.push('footer');
      }

      // Convert old baseConfig to new theme structure
      const newTheme = {
        colors: {
          primary: oldConfig.colorScheme?.primary || '#3B82F6',
          secondary: oldConfig.colorScheme?.secondary || '#10B981',
          accent: oldConfig.colorScheme?.accent || '#F59E0B',
          background: '#FFFFFF',
          text: '#1F2937',
        },
        typography: {
          headingFont: oldConfig.fonts?.headingFont || 'Inter',
          bodyFont: oldConfig.fonts?.bodyFont || 'Inter',
        },
        layout: {
          containerWidth: 'max-w-7xl',
          spacing: 'md',
        },
      };

      // Set editable fields (vendor customization limits)
      const editableFields = {
        logo: true,
        banner: true,
        primaryColor: true,
      };

      // Update template with new structure
      await prisma.template.update({
        where: { id: template.id },
        data: {
          slug,
          version: 1,
          pages: newPages,
          theme: newTheme,
          editableFields,
        },
      });

      console.log(`✅ Migrated template: ${template.name} → slug: ${slug}`);
    }

    console.log('✅ Template migration completed successfully!');
  } catch (error) {
    console.error('❌ Error migrating templates:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrateTemplates();

