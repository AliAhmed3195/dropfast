import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateExistingStores() {
  console.log('🔄 Migrating existing stores to use Template table...');

  try {
    // Get classic template (should be seeded first)
    const classicTemplate = await prisma.template.findFirst({
      where: { name: 'Classic Store' }
    });

    if (!classicTemplate) {
      console.error('❌ Classic Store template not found. Please seed templates first!');
      process.exit(1);
    }

    // Get all stores without templateId
    const storesWithoutTemplate = await prisma.store.findMany({
      where: { templateId: null },
      select: { id: true, template: true } // template is the old string field
    });

    console.log(`Found ${storesWithoutTemplate.length} stores to migrate`);

    // Map old template string values to template names
    const templateNameMap: Record<string, string> = {
      'basic': 'Basic Store',
      'classic': 'Classic Store',
      'ecommerce': 'E-commerce Pro'
    };

    for (const store of storesWithoutTemplate) {
      // Get template name from old template field
      const oldTemplate = (store as any).template || 'classic';
      const templateName = templateNameMap[oldTemplate] || 'Classic Store';

      // Find template by name
      const template = await prisma.template.findFirst({
        where: { name: templateName }
      });

      if (template) {
        await prisma.store.update({
          where: { id: store.id },
          data: { templateId: template.id }
        });
        console.log(`✅ Migrated store ${store.id} to template ${templateName}`);
      } else {
        // Default to classic template
        await prisma.store.update({
          where: { id: store.id },
          data: { templateId: classicTemplate.id }
        });
        console.log(`✅ Migrated store ${store.id} to Classic Store (default)`);
      }
    }

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Error migrating stores:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrateExistingStores();

