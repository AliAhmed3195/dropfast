/**
 * Migration Script: Move Stripe fields from Business to StripeAccount table
 * 
 * This script migrates existing Stripe data from Business table to the new StripeAccount table
 * 
 * Run: npx tsx prisma/migrate-stripe-to-separate-table.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateStripeData() {
  console.log('🚀 Starting Stripe data migration...\n');

  try {
    // NOTE: This script should be run BEFORE the migration.
    // After migration, Stripe fields are moved to StripeAccount table.
    // If running after migration, use the SQL migration file instead.
    
    // Find all businesses that have Stripe data (using raw query for old schema)
    const businesses = await prisma.$queryRaw<Array<{ id: string; stripeAccountId: string | null; expressAccountId: string | null; stripeAccountStatus: string | null }>>`
      SELECT id, "stripeAccountId", "expressAccountId", "stripeAccountStatus"
      FROM "Business"
      WHERE "stripeAccountId" IS NOT NULL 
         OR "expressAccountId" IS NOT NULL 
         OR "stripeAccountStatus" IS NOT NULL
    `;

    console.log(`📊 Found ${businesses.length} businesses with Stripe data\n`);

    let migrated = 0;
    let skipped = 0;

    for (const business of businesses) {
      try {
        // Check if StripeAccount already exists
        const existingStripeAccount = await prisma.stripeAccount.findUnique({
          where: { businessId: business.id }
        });

        if (existingStripeAccount) {
          console.log(`⏭️  Skipping business ${business.id} - StripeAccount already exists`);
          skipped++;
          continue;
        }

        // Create StripeAccount with data from Business
        await prisma.stripeAccount.create({
          data: {
            businessId: business.id,
            stripeAccountId: (business as any).stripeAccountId || null,
            expressAccountId: (business as any).expressAccountId || null,
            stripeAccountStatus: (business as any).stripeAccountStatus || null,
            stripeVerificationLevel: (business as any).stripeVerificationLevel || null,
            stripeCapabilities: (business as any).stripeCapabilities || null,
            stripeRequirements: (business as any).stripeRequirements || null,
            stripeMissingFields: (business as any).stripeMissingFields || null,
            stripeLastRequirementsCheck: (business as any).stripeLastRequirementsCheck || null,
            stripePayoutsEnabled: (business as any).stripePayoutsEnabled || null,
            stripeChargesEnabled: (business as any).stripeChargesEnabled || null,
            bankStatus: (business as any).bankStatus || null,
            stripeLastUpdated: (business as any).stripeLastUpdated || null,
          }
        });

        console.log(`✅ Migrated Stripe data for business: ${business.id}`);
        migrated++;

      } catch (error: any) {
        console.error(`❌ Error migrating business ${business.id}:`, error.message);
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Migrated: ${migrated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   📦 Total: ${businesses.length}\n`);

    console.log('✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateStripeData()
  .catch((error) => {
    console.error('Migration error:', error);
    process.exit(1);
  });
