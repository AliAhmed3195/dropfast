const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function completeCheck() {
  console.log('🔍 Complete System Check\n');
  console.log('═══════════════════════════════════════════════════\n');

  // 1. Check Database Templates
  console.log('1️⃣ DATABASE TEMPLATES:');
  const templates = await prisma.template.findMany({
    select: { id: true, name: true, slug: true, isActive: true, pages: true, theme: true }
  });
  
  if (templates.length === 0) {
    console.log('   ❌ No templates found in database\n');
  } else {
    templates.forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.name}`);
      console.log(`      Slug: "${t.slug}" ${t.isActive ? '✅' : '❌'}`);
      console.log(`      Has pages config: ${t.pages ? '✅' : '❌'}`);
      console.log(`      Has theme config: ${t.theme ? '✅' : '❌'}`);
      console.log('');
    });
  }

  // 2. Check Code Themes
  console.log('2️⃣ CODE THEMES:');
  const projectRoot = process.cwd();
  const themesPath = path.join(projectRoot, 'src', 'themes');
  
  const themeFolders = ['basic', 'classic', 'ecommerce'];
  const requiredFiles = ['config.json', 'index.ts', 'HeroSection.tsx', 'FeaturedSection.tsx', 'Footer.tsx'];
  
  themeFolders.forEach(theme => {
    const themePath = path.join(themesPath, theme);
    console.log(`   📁 ${theme}/`);
    
    if (!fs.existsSync(themePath)) {
      console.log(`      ❌ Folder does not exist\n`);
      return;
    }

    // Check config.json
    const configPath = path.join(themePath, 'config.json');
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        console.log(`      ✅ config.json (slug: "${config.slug}")`);
      } catch (e) {
        console.log(`      ❌ config.json (invalid JSON)`);
      }
    } else {
      console.log(`      ❌ config.json missing`);
    }

    // Check index.ts
    const indexPath = path.join(themePath, 'index.ts');
    if (fs.existsSync(indexPath)) {
      const content = fs.readFileSync(indexPath, 'utf-8');
      if (content.includes('export const sectionMap')) {
        console.log(`      ✅ index.ts (has sectionMap)`);
      } else {
        console.log(`      ⚠️  index.ts (missing sectionMap)`);
      }
    } else {
      console.log(`      ❌ index.ts missing`);
    }

    // Check component files
    const components = ['HeroSection.tsx', 'FeaturedSection.tsx', 'CategoriesSection.tsx', 'NewsletterSection.tsx', 'Footer.tsx'];
    components.forEach(comp => {
      const compPath = path.join(themePath, comp);
      if (fs.existsSync(compPath)) {
        console.log(`      ✅ ${comp}`);
      } else {
        console.log(`      ❌ ${comp} missing`);
      }
    });
    console.log('');
  });

  // 3. Check Slug Match
  console.log('3️⃣ SLUG MATCHING:');
  templates.forEach(template => {
    const themePath = path.join(themesPath, template.slug);
    const configPath = path.join(themePath, 'config.json');
    
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        if (config.slug === template.slug) {
          console.log(`   ✅ "${template.name}" - DB slug "${template.slug}" matches code slug`);
        } else {
          console.log(`   ❌ "${template.name}" - DB slug "${template.slug}" does NOT match code slug "${config.slug}"`);
        }
      } catch (e) {
        console.log(`   ❌ "${template.name}" - Cannot read config.json`);
      }
    } else {
      console.log(`   ❌ "${template.name}" - No code theme found for slug "${template.slug}"`);
    }
  });
  console.log('');

  // 4. Check API Routes
  console.log('4️⃣ API ROUTES:');
  const apiRoutes = [
    'src/app/api/stores/public/[slug]/route.ts',
    'src/app/api/templates/route.ts'
  ];
  
  apiRoutes.forEach(route => {
    const routePath = path.join(projectRoot, route);
    if (fs.existsSync(routePath)) {
      console.log(`   ✅ ${route}`);
    } else {
      console.log(`   ❌ ${route} missing`);
    }
  });
  console.log('');

  // 5. Check Components
  console.log('5️⃣ COMPONENTS:');
  const components = [
    'src/components/store-templates/TemplateRenderer.tsx',
    'src/lib/mergeTemplate.ts'
  ];
  
  components.forEach(comp => {
    const compPath = path.join(projectRoot, comp);
    if (fs.existsSync(compPath)) {
      console.log(`   ✅ ${comp}`);
    } else {
      console.log(`   ❌ ${comp} missing`);
    }
  });
  console.log('');

  console.log('═══════════════════════════════════════════════════\n');
  console.log('✅ Check complete!\n');
}

completeCheck()
  .catch((error) => {
    console.error('❌ Error during check:', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

