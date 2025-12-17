const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTemplates() {
  try {
    const templates = await prisma.template.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        version: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log('\n📊 Total Templates:', templates.length);
    console.log('─────────────────────────────────────────\n');

    templates.forEach((t, index) => {
      console.log(`${index + 1}. ${t.name}`);
      console.log(`   Slug: ${t.slug}`);
      console.log(`   Version: ${t.version}`);
      console.log(`   Active: ${t.isActive ? '✅' : '❌'}`);
      console.log('');
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTemplates();

