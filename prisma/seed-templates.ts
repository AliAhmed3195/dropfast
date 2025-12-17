const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function seedTemplates() {
  console.log('🌱 Seeding templates from code...');

  // Read config files from theme folders
  const projectRoot = process.cwd();
  const themesPath = path.join(projectRoot, 'src', 'themes');
  
  // Template 1: Basic
  const basicConfigPath = path.join(themesPath, 'basic', 'config.json');
  const basicConfig = JSON.parse(fs.readFileSync(basicConfigPath, 'utf-8'));
  
  const basicTemplate = await prisma.template.upsert({
    where: { slug: 'basic' },
    update: {
      name: basicConfig.name,
      description: basicConfig.description,
      version: basicConfig.version,
      pages: basicConfig.pages,
      theme: basicConfig.theme,
      editableFields: basicConfig.editableFields,
      isActive: true
    },
    create: {
      name: basicConfig.name,
      slug: basicConfig.slug,
      description: basicConfig.description,
      version: basicConfig.version,
      pages: basicConfig.pages,
      theme: basicConfig.theme,
      editableFields: basicConfig.editableFields,
      previewImage: 'https://picsum.photos/800/600?random=1',
      isActive: true
    }
  });

  // Template 2: Classic
  const classicConfigPath = path.join(themesPath, 'classic', 'config.json');
  const classicConfig = JSON.parse(fs.readFileSync(classicConfigPath, 'utf-8'));
  
  const classicTemplate = await prisma.template.upsert({
    where: { slug: 'classic' },
    update: {
      name: classicConfig.name,
      description: classicConfig.description,
      version: classicConfig.version,
      pages: classicConfig.pages,
      theme: classicConfig.theme,
      editableFields: classicConfig.editableFields,
      isActive: true
    },
    create: {
      name: classicConfig.name,
      slug: classicConfig.slug,
      description: classicConfig.description,
      version: classicConfig.version,
      pages: classicConfig.pages,
      theme: classicConfig.theme,
      editableFields: classicConfig.editableFields,
      previewImage: 'https://picsum.photos/800/600?random=2',
      isActive: true
    }
  });

  // Template 3: E-commerce Pro
  const ecommerceConfigPath = path.join(themesPath, 'ecommerce', 'config.json');
  const ecommerceConfig = JSON.parse(fs.readFileSync(ecommerceConfigPath, 'utf-8'));
  
  const ecommerceTemplate = await prisma.template.upsert({
    where: { slug: 'ecommerce' },
    update: {
      name: ecommerceConfig.name,
      description: ecommerceConfig.description,
      version: ecommerceConfig.version,
      pages: ecommerceConfig.pages,
      theme: ecommerceConfig.theme,
      editableFields: ecommerceConfig.editableFields,
      isActive: true
    },
    create: {
      name: ecommerceConfig.name,
      slug: ecommerceConfig.slug,
      description: ecommerceConfig.description,
      version: ecommerceConfig.version,
      pages: ecommerceConfig.pages,
      theme: ecommerceConfig.theme,
      editableFields: ecommerceConfig.editableFields,
      previewImage: 'https://picsum.photos/800/600?random=3',
      isActive: true
    }
  });

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


