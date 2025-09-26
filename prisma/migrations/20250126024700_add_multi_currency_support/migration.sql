-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "lockedUSDPrice" DOUBLE PRECISION,
ADD COLUMN     "exchangeRateAtCreation" DOUBLE PRECISION,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "lockedUSDPrice" DOUBLE PRECISION,
ADD COLUMN     "lockedLocalPrice" DOUBLE PRECISION,
ADD COLUMN     "displayPrice" DOUBLE PRECISION,
ADD COLUMN     "displayCurrency" TEXT,
ADD COLUMN     "settlementCurrency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "shippingAddress" JSONB,
ADD COLUMN     "billingAddress" JSONB,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "storeProductId" TEXT;

-- CreateTable
CREATE TABLE "StoreProduct" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "lockedUSDPrice" DOUBLE PRECISION NOT NULL,
    "lockedLocalPrice" DOUBLE PRECISION NOT NULL,
    "localCurrency" TEXT NOT NULL,
    "exchangeRateAtImport" DOUBLE PRECISION NOT NULL,
    "markup" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "finalPrice" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StoreProduct_productId_storeId_key" ON "StoreProduct"("productId", "storeId");

-- AddForeignKey
ALTER TABLE "StoreProduct" ADD CONSTRAINT "StoreProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreProduct" ADD CONSTRAINT "StoreProduct_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_storeProductId_fkey" FOREIGN KEY ("storeProductId") REFERENCES "StoreProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Payout" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Payout" ALTER COLUMN "status" SET DATA TYPE "PayoutStatus" USING ("status"::text::"PayoutStatus");
ALTER TABLE "Payout" ALTER COLUMN "status" SET DEFAULT 'PENDING';
