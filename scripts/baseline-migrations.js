/**
 * Baseline script to mark existing migrations as applied
 * This is needed when the database already has tables but Prisma doesn't know about them
 * Run this once before deploying to production
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function baselineMigrations() {
  try {
    console.log('Checking database state...');
    
    // Check if _prisma_migrations table exists
    const migrationsTableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '_prisma_migrations'
      );
    `;

    if (!migrationsTableExists[0].exists) {
      console.log('Creating _prisma_migrations table...');
      // Create the migrations table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
          "id" VARCHAR(36) PRIMARY KEY,
          "checksum" VARCHAR(64) NOT NULL,
          "finished_at" TIMESTAMP,
          "migration_name" VARCHAR(255) NOT NULL,
          "logs" TEXT,
          "rolled_back_at" TIMESTAMP,
          "started_at" TIMESTAMP NOT NULL DEFAULT now(),
          "applied_steps_count" INTEGER NOT NULL DEFAULT 0
        );
      `;
    }

    // Get all migration files
    const migrationsDir = path.join(__dirname, '..', 'prisma', 'migrations');
    const migrationFolders = fs.readdirSync(migrationsDir)
      .filter(item => {
        const itemPath = path.join(migrationsDir, item);
        return fs.statSync(itemPath).isDirectory();
      })
      .sort();

    console.log(`Found ${migrationFolders.length} migration folders`);

    // Mark each migration as applied
    for (const folder of migrationFolders) {
      const migrationName = folder;
      const migrationPath = path.join(migrationsDir, folder, 'migration.sql');
      
      if (!fs.existsSync(migrationPath)) {
        console.log(`Skipping ${migrationName} - no migration.sql found`);
        continue;
      }

      // Read migration file to get checksum
      const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
      const crypto = require('crypto');
      const checksum = crypto.createHash('sha256').update(migrationSQL).digest('hex');

      // Check if migration is already recorded
      const existing = await prisma.$queryRaw`
        SELECT * FROM "_prisma_migrations" 
        WHERE "migration_name" = ${migrationName}
      `;

      if (existing.length === 0) {
        console.log(`Marking ${migrationName} as applied...`);
        await prisma.$executeRaw`
          INSERT INTO "_prisma_migrations" (
            "id",
            "checksum",
            "finished_at",
            "migration_name",
            "started_at",
            "applied_steps_count"
          ) VALUES (
            gen_random_uuid()::text,
            ${checksum},
            now(),
            ${migrationName},
            now(),
            1
          );
        `;
        console.log(`✅ ${migrationName} marked as applied`);
      } else {
        console.log(`⏭️  ${migrationName} already marked as applied`);
      }
    }

    console.log('✅ Baseline complete! All migrations marked as applied.');
  } catch (error) {
    console.error('❌ Error baselining migrations:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

baselineMigrations()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
