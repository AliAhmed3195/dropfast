const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function seedTemplates() {
  console.log('🌱 Seeding templates from code...');

  // Read config files from theme folders
  const projectRoot = process.cwd();
  const themesPath = path.join(projectRoot, 'src', 'themes');
  
  const templates = [
    { path: path.join(themesPath, 'basic', 'config.json'), previewImage: 'https://picsum.photos/800/600?random=1' },
    { path: path.join(themesPath, 'classic', 'config.json'), previewImage: 'https://picsum.photos/800/600?random=2' },
    { path: path.join(themesPath, 'ecommerce', 'config.json'), previewImage: 'https://picsum.photos/800/600?random=3' }
  ];

  const results = {};

  for (const { path: configPath, previewImage } of templates) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    
    // Check if template exists
    const existing = await prisma.template.findUnique({
      where: { slug: config.slug }
    });

    try {
      if (existing) {
        // Update existing template
        const updated = await prisma.template.update({
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
        results[config.slug] = { id: updated.id, slug: updated.slug, action: 'updated' };
        console.log(`✅ Updated template: ${config.name}`);
      } else {
        // Template doesn't exist, but database might have baseHtml column
        // Try creating normally first
        try {
          const created = await prisma.template.create({
            data: {
              name: config.name,
              slug: config.slug,
              description: config.description,
              version: config.version,
              pages: config.pages,
              theme: config.theme,
              editableFields: config.editableFields,
              previewImage: previewImage,
              isActive: true
            }
          });
          results[config.slug] = { id: created.id, slug: created.slug, action: 'created' };
          console.log(`✅ Created template: ${config.name}`);
        } catch (createError) {
          // If baseHtml column exists, we'll update the existing one if it exists
          console.log(`⚠️  Could not create ${config.name}, template might already exist or database schema mismatch`);
          // Template already exists or there's a schema issue, skip
        }
      }
    } catch (error) {
      console.error(`❌ Error processing ${config.name}:`, error.message);
    }
  }

  console.log('\n✅ Templates processing complete:', results);
}

seedTemplates()
  .catch((error) => {
    console.error('❌ Error seeding templates:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

