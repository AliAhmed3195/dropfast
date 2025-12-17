const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixTemplates() {
  console.log('🔧 Fixing templates with raw SQL...');

  try {
    // Use raw SQL to update NULL values
    const defaultPages = JSON.stringify({
      landing: {
        sections: ['hero', 'featured', 'footer'],
        layout: 'grid',
        gridColumns: 3
      }
    });

    const defaultEditableFields = JSON.stringify({
      logo: true,
      banner: true,
      primaryColor: true
    });

    const defaultTheme = JSON.stringify({
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
    });

    // Update templates with NULL pages
    await prisma.$executeRawUnsafe(`
      UPDATE "Template"
      SET "pages" = $1::jsonb
      WHERE "pages" IS NULL
    `, defaultPages);

    // Update templates with NULL editableFields
    await prisma.$executeRawUnsafe(`
      UPDATE "Template"
      SET "editableFields" = $1::jsonb
      WHERE "editableFields" IS NULL
    `, defaultEditableFields);

    // Update templates with NULL theme
    await prisma.$executeRawUnsafe(`
      UPDATE "Template"
      SET "theme" = $1::jsonb
      WHERE "theme" IS NULL
    `, defaultTheme);

    // Update baseHtml column if it exists (set to empty string)
    try {
      await prisma.$executeRawUnsafe(`
        UPDATE "Template"
        SET "baseHtml" = ''
        WHERE "baseHtml" IS NULL
      `);
      console.log('✅ Fixed baseHtml column');
    } catch (error) {
      // Column might not exist, that's okay
      console.log('⚠️  baseHtml column not found or already fixed');
    }

    console.log('✅ Templates fixed with raw SQL!');

    // Now try the seed script
    console.log('\n🌱 Running seed script...');
    const { execSync } = require('child_process');
    execSync('node prisma/seed-templates.js', { stdio: 'inherit' });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTemplates();

