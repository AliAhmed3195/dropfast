/**
 * Migration deployment script for Vercel
 * Handles the case where database already has tables but migrations aren't recorded
 */

const { execSync } = require('child_process');

function deployMigrations() {
  try {
    console.log('🔄 Running Prisma migrations...');
    
    // Try to deploy migrations
    try {
      execSync('npx prisma migrate deploy', { 
        stdio: 'inherit',
        env: process.env 
      });
      console.log('✅ Migrations deployed successfully');
      return true;
    } catch (error) {
      // Check if it's the P3005 error (database not empty)
      const errorOutput = error.stdout?.toString() || error.stderr?.toString() || error.message || '';
      
      if (errorOutput.includes('P3005') || errorOutput.includes('database schema is not empty')) {
        console.log('⚠️  Database schema is not empty. Migrations may already be applied.');
        console.log('ℹ️  This is normal if the database was set up manually or migrations were already applied.');
        console.log('ℹ️  Continuing with build...');
        console.log('💡 To fix this permanently, run: npm run baseline (locally)');
        return true; // Continue anyway
      }
      
      // For other errors, fail
      console.error('❌ Migration error:', errorOutput);
      throw error;
    }
  } catch (error) {
    console.error('❌ Failed to deploy migrations:', error);
    throw error;
  }
}

try {
  deployMigrations();
  process.exit(0);
} catch (error) {
  console.error('Failed:', error);
  process.exit(1);
}
