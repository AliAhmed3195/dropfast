const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function verifyPages() {
  console.log('🔍 Verifying All Store Pages\n');
  console.log('═══════════════════════════════════════════════════\n');

  // 1. Check Templates have all page configs
  console.log('1️⃣ TEMPLATE PAGE CONFIGURATIONS:');
  const templates = await prisma.template.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true, pages: true }
  });

  const requiredPages = ['landing', 'productDetail', 'cart', 'checkout'];
  
  templates.forEach(template => {
    console.log(`\n   📋 ${template.name} (${template.slug}):`);
    const pages = template.pages || {};
    
    requiredPages.forEach(page => {
      if (pages[page]) {
        console.log(`      ✅ ${page} - configured`);
      } else {
        console.log(`      ❌ ${page} - missing`);
      }
    });
  });

  // 2. Check Routes exist
  console.log('\n2️⃣ STORE ROUTES:');
  const projectRoot = process.cwd();
  const routes = [
    'src/app/store/[slug]/page.tsx',
    'src/app/store/[slug]/product/[productId]/page.tsx',
    'src/app/store/[slug]/cart/page.tsx',
    'src/app/store/[slug]/checkout/page.tsx',
  ];

  routes.forEach(route => {
    const routePath = path.join(projectRoot, route);
    if (fs.existsSync(routePath)) {
      console.log(`   ✅ ${route}`);
    } else {
      console.log(`   ❌ ${route} - MISSING`);
    }
  });

  // 3. Check TemplateRenderer supports all pageTypes
  console.log('\n3️⃣ TEMPLATE RENDERER SUPPORT:');
  const rendererPath = path.join(projectRoot, 'src/components/store-templates/TemplateRenderer.tsx');
  if (fs.existsSync(rendererPath)) {
    const content = fs.readFileSync(rendererPath, 'utf-8');
    const pageTypes = ['landing', 'productDetail', 'cart', 'checkout'];
    
    pageTypes.forEach(pageType => {
      if (content.includes(pageType)) {
        console.log(`   ✅ ${pageType} - supported`);
      } else {
        console.log(`   ⚠️  ${pageType} - check if supported`);
      }
    });
  }

  // 4. Check Stores
  console.log('\n4️⃣ STORES WITH TEMPLATES:');
  const stores = await prisma.store.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      template: {
        select: { name: true, slug: true }
      }
    },
    take: 5
  });

  if (stores.length === 0) {
    console.log('   ℹ️  No active stores found');
  } else {
    stores.forEach((store, i) => {
      console.log(`   ${i + 1}. ${store.name} (${store.slug})`);
      if (store.template) {
        console.log(`      Template: ${store.template.name} (${store.template.slug})`);
        console.log(`      Landing: /store/${store.slug}`);
        console.log(`      Product: /store/${store.slug}/product/[id]`);
        console.log(`      Cart: /store/${store.slug}/cart`);
        console.log(`      Checkout: /store/${store.slug}/checkout`);
      } else {
        console.log(`      ⚠️  No template assigned`);
      }
    });
  }

  console.log('\n═══════════════════════════════════════════════════\n');
  console.log('✅ Verification Complete!\n');
}

verifyPages()
  .catch((error) => {
    console.error('❌ Error:', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

