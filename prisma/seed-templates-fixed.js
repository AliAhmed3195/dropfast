const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function seedTemplates() {
  console.log('🌱 Seeding templates from code...');

  // Read config files from theme folders
  const projectRoot = process.cwd();
  const themesPath = path.join(projectRoot, 'src', 'themes');
  
  // Helper function to upsert template using raw SQL for baseHtml
  async function upsertTemplate(config, previewImageUrl) {
    const templateExists = await prisma.template.findUnique({
      where: { slug: config.slug }
    });

    if (templateExists) {
      // Update existing
      return await prisma.template.update({
        where: { slug: config.slug },
        data: {
          name: config.name,
          description: config.description,
          version: config.version,
          pages: config.pages,
          theme: config.theme,
          editableFields: config.editableFields,
          isActive: true
        }
      });
    } else {
      // Try to create normally first
      try {
        return await prisma.template.create({
          data: {
            name: config.name,
            slug: config.slug,
            description: config.description,
            version: config.version,
            pages: config.pages,
            theme: config.theme,
            editableFields: config.editableFields,
            previewImage: previewImageUrl,
            isActive: true
          }
        });
      } catch (createError) {
        // If error is about baseHtml, use raw SQL
        if (createError.code === 'P2011' || createError.message.includes('baseHtml')) {
          await prisma.$executeRawUnsafe(`
            INSERT INTO "Template" ("id", "name", "slug", "description", "version", "pages", "theme", "editableFields", "previewImage", "isActive", "createdAt", "updatedAt", "baseHtml")
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb, $8, $9, NOW(), NOW(), '')
          `, 
            config.name,
            config.slug,
            config.description || '',
            config.version,
            JSON.stringify(config.pages),
            JSON.stringify(config.theme),
            JSON.stringify(config.editableFields),
            previewImageUrl || '',
            true
          );
          
          return await prisma.template.findUnique({
            where: { slug: config.slug }
          });
        }
        throw createError;
      }
    }
  }

  // Template 1: Basic
  const basicConfigPath = path.join(themesPath, 'basic', 'config.json');
  const basicConfig = JSON.parse(fs.readFileSync(basicConfigPath, 'utf-8'));
  const basicTemplate = await upsertTemplate(basicConfig, 'https://picsum.photos/800/600?random=1');

  // Template 2: Classic
  const classicConfigPath = path.join(themesPath, 'classic', 'config.json');
  const classicConfig = JSON.parse(fs.readFileSync(classicConfigPath, 'utf-8'));
  const classicTemplate = await upsertTemplate(classicConfig, 'https://picsum.photos/800/600?random=2');

  // Template 3: E-commerce Pro
  const ecommerceConfigPath = path.join(themesPath, 'ecommerce', 'config.json');
  const ecommerceConfig = JSON.parse(fs.readFileSync(ecommerceConfigPath, 'utf-8'));
  const ecommerceTemplate = await upsertTemplate(ecommerceConfig, 'https://picsum.photos/800/600?random=3');

  console.log('✅ Templates seeded successfully from code:', {
    basic: { id: basicTemplate.id, slug: basicTemplate.slug },
    classic: { id: classicTemplate.id, slug: classicTemplate.slug },
    ecommerce: { id: ecommerceTemplate.id, slug: ecommerceTemplate.slug }
  });
}

seedTemplates()
  .catch((error) => {
    console.error('❌ Error seeding templates:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

