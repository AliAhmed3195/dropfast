const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixExistingTemplates() {
  console.log('🔧 Fixing existing templates...');

  // Get all templates
  const templates = await prisma.template.findMany();

  console.log(`Found ${templates.length} templates to fix`);

  for (const template of templates) {
    // Set default values if null - use raw update to handle JSON fields
    const updateData = {};
    
    // Check and set pages
    if (!template.pages || (typeof template.pages === 'object' && Object.keys(template.pages).length === 0)) {
      updateData.pages = {
        landing: {
          sections: ['hero', 'featured', 'footer'],
          layout: 'grid',
          gridColumns: 3
        }
      };
    }

    // Check and set editableFields
    if (!template.editableFields || (typeof template.editableFields === 'object' && Object.keys(template.editableFields).length === 0)) {
      updateData.editableFields = {
        logo: true,
        banner: true,
        primaryColor: true
      };
    }

    // Check and set theme
    if (!template.theme || (typeof template.theme === 'object' && Object.keys(template.theme).length === 0)) {
      updateData.theme = {
        colors: {
          primary: '#3B82F6',
          secondary: '#10B981',
          accent: '#F59E0B',
          background: '#FFFFFF',
          text: '#1F2937'
        },
        typography: {
          headingFont: 'Inter',
          bodyFont: 'Inter'
        },
        layout: {
          containerWidth: 'max-w-7xl',
          spacing: 'md'
        }
      };
    }

    if (Object.keys(updateData).length > 0) {
      try {
        await prisma.template.update({
          where: { id: template.id },
          data: updateData
        });
        console.log(`✅ Updated template: ${template.name}`);
      } catch (error) {
        console.error(`❌ Error updating template ${template.name}:`, error.message);
      }
    } else {
      console.log(`✓ Template ${template.name} already has all required fields`);
    }
  }

  console.log('✅ All templates fixed!');
}

fixExistingTemplates()
  .catch((error) => {
    console.error('❌ Error fixing templates:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

