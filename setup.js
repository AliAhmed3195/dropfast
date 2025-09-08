#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Fastdrop Setup Script');
console.log('========================\n');

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file...');
  const envContent = `# Database
DATABASE_URL="postgresql://username:password@localhost:5432/fastdrop"

# Next.js
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# Optional: Add your payment gateway keys here
# STRIPE_PUBLIC_KEY=""
# STRIPE_SECRET_KEY=""
# RAZORPAY_KEY_ID=""
# RAZORPAY_KEY_SECRET=""
`;
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully!');
  console.log('⚠️  Please update the DATABASE_URL with your PostgreSQL credentials\n');
} else {
  console.log('✅ .env file already exists\n');
}

// Check if node_modules exists
const nodeModulesPath = path.join(process.cwd(), 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Installing dependencies...');
  console.log('Run: npm install\n');
} else {
  console.log('✅ Dependencies already installed\n');
}

console.log('🔧 Next Steps:');
console.log('1. Update your .env file with correct database credentials');
console.log('2. Run: npm install');
console.log('3. Run: npx prisma generate');
console.log('4. Run: npx prisma db push');
console.log('5. Run: npm run dev');
console.log('\n🎉 Your Fastdrop platform will be ready!');
console.log('\n📚 For detailed setup instructions, see README.md');
