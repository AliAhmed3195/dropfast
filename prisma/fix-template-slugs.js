const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixSlugs() {
  console.log('🔧 Fixing template slugs to match code...\n');

  try {
    // Update Basic Store -> basic
    const basic = await prisma.template.updateMany({
      where: { slug: 'basic-store' },
      data: { slug: 'basic' }
    });
    if (basic.count > 0) {
      console.log('✅ Updated "basic-store" -> "basic"');
    }

    // Update Classic Store -> classic
    const classic = await prisma.template.updateMany({
      where: { slug: 'classic-store' },
      data: { slug: 'classic' }
    });
    if (classic.count > 0) {
      console.log('✅ Updated "classic-store" -> "classic"');
    }

    // Update E-commerce Pro -> ecommerce
    const ecommerce = await prisma.template.updateMany({
      where: { slug: 'e-commerce-pro' },
      data: { slug: 'ecommerce' }
    });
    if (ecommerce.count > 0) {
      console.log('✅ Updated "e-commerce-pro" -> "ecommerce"');
    }

    // Verify all templates
    const templates = await prisma.template.findMany({
      select: { name: true, slug: true, isActive: true }
    });

    console.log('\n📊 Current templates:');
    templates.forEach(t => {
      console.log(`   ${t.name} -> slug: "${t.slug}" ${t.isActive ? '✅' : '❌'}`);
    });

    console.log('\n✅ All slugs fixed!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSlugs();

