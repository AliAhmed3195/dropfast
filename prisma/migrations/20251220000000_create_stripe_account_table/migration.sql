-- Create StripeAccount table
CREATE TABLE IF NOT EXISTS "stripe_accounts" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "stripeAccountId" TEXT,
    "expressAccountId" TEXT,
    "stripeAccountStatus" TEXT,
    "stripeVerificationLevel" TEXT,
    "stripeCapabilities" JSONB,
    "stripeRequirements" JSONB,
    "stripeMissingFields" JSONB,
    "stripeLastRequirementsCheck" TIMESTAMP(3),
    "stripePayoutsEnabled" BOOLEAN,
    "stripeChargesEnabled" BOOLEAN,
    "bankStatus" TEXT,
    "stripeLastUpdated" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stripe_accounts_pkey" PRIMARY KEY ("id")
);

-- Create unique index on businessId
CREATE UNIQUE INDEX IF NOT EXISTS "stripe_accounts_businessId_key" ON "stripe_accounts"("businessId");

-- Add foreign key constraint
ALTER TABLE "stripe_accounts" ADD CONSTRAINT "stripe_accounts_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing data from Business to StripeAccount
INSERT INTO "stripe_accounts" (
    "id",
    "businessId",
    "stripeAccountId",
    "expressAccountId",
    "stripeAccountStatus",
    "stripeVerificationLevel",
    "stripeCapabilities",
    "stripeRequirements",
    "stripeMissingFields",
    "stripeLastRequirementsCheck",
    "stripePayoutsEnabled",
    "stripeChargesEnabled",
    "bankStatus",
    "stripeLastUpdated",
    "createdAt",
    "updatedAt"
)
SELECT 
    gen_random_uuid()::text as "id",
    "id" as "businessId",
    "stripeAccountId",
    "expressAccountId",
    "stripeAccountStatus",
    "stripeVerificationLevel",
    "stripeCapabilities"::jsonb,
    "stripeRequirements"::jsonb,
    "stripeMissingFields"::jsonb,
    "stripeLastRequirementsCheck",
    "stripePayoutsEnabled",
    "stripeChargesEnabled",
    "bankStatus",
    "stripeLastUpdated",
    "createdAt",
    "updatedAt"
FROM "Business"
WHERE 
    "stripeAccountId" IS NOT NULL 
    OR "expressAccountId" IS NOT NULL 
    OR "stripeAccountStatus" IS NOT NULL
ON CONFLICT ("businessId") DO NOTHING;

-- Remove Stripe columns from Business table (after data migration)
ALTER TABLE "Business" DROP COLUMN IF EXISTS "stripeAccountId";
ALTER TABLE "Business" DROP COLUMN IF EXISTS "expressAccountId";
ALTER TABLE "Business" DROP COLUMN IF EXISTS "stripeAccountStatus";
ALTER TABLE "Business" DROP COLUMN IF EXISTS "stripeVerificationLevel";
ALTER TABLE "Business" DROP COLUMN IF EXISTS "stripeCapabilities";
ALTER TABLE "Business" DROP COLUMN IF EXISTS "stripeRequirements";
ALTER TABLE "Business" DROP COLUMN IF EXISTS "stripeMissingFields";
ALTER TABLE "Business" DROP COLUMN IF EXISTS "stripeLastRequirementsCheck";
ALTER TABLE "Business" DROP COLUMN IF EXISTS "stripePayoutsEnabled";
ALTER TABLE "Business" DROP COLUMN IF EXISTS "stripeChargesEnabled";
ALTER TABLE "Business" DROP COLUMN IF EXISTS "bankStatus";
ALTER TABLE "Business" DROP COLUMN IF EXISTS "stripeLastUpdated";
