const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateToBusinessStructure() {
  console.log('🚀 Starting migration to business structure...');

  try {
    // Step 1: Create businesses for existing vendors and suppliers
    console.log('📦 Creating businesses for existing vendors and suppliers...');
    
    const vendors = await prisma.user.findMany({
      where: { role: 'VENDOR' }
    });

    const suppliers = await prisma.user.findMany({
      where: { role: 'SUPPLIER' }
    });

    // Create businesses for vendors
    for (const vendor of vendors) {
      console.log(`Creating business for vendor: ${vendor.name}`);
      
      const business = await prisma.business.create({
        data: {
          type: 'VENDOR',
          businessName: vendor.name,
          businessType: 'INDIVIDUAL',
          country: 'US', // Default country
          preferredCurrency: vendor.preferredCurrency || 'USD',
          addressStreet: 'TBD',
          addressCity: 'TBD',
          addressState: 'TBD',
          addressZip: 'TBD',
          addressCountry: 'US',
          kycStatus: 'PENDING'
        }
      });

      // Update user to link to business and change role
      await prisma.user.update({
        where: { id: vendor.id },
        data: {
          businessId: business.id,
          role: 'VENDOR_USER'
        }
      });

      // Update user's stores to link to business
      await prisma.store.updateMany({
        where: { ownerId: vendor.id },
        data: { businessId: business.id }
      });
    }

    // Create businesses for suppliers
    for (const supplier of suppliers) {
      console.log(`Creating business for supplier: ${supplier.name}`);
      
      const business = await prisma.business.create({
        data: {
          type: 'SUPPLIER',
          businessName: supplier.name,
          businessType: 'INDIVIDUAL',
          country: 'US', // Default country
          preferredCurrency: supplier.preferredCurrency || 'USD',
          addressStreet: 'TBD',
          addressCity: 'TBD',
          addressState: 'TBD',
          addressZip: 'TBD',
          addressCountry: 'US',
          kycStatus: 'PENDING'
        }
      });

      // Update user to link to business and change role
      await prisma.user.update({
        where: { id: supplier.id },
        data: {
          businessId: business.id,
          role: 'SUPPLIER_USER'
        }
      });

      // Update user's products to link to business
      await prisma.product.updateMany({
        where: { supplierId: supplier.id },
        data: { businessId: business.id }
      });
    }

    // Step 2: Update payout records to include business references
    console.log('💰 Updating payout records...');
    
    const payouts = await prisma.payout.findMany({
      include: {
        supplier: true,
        vendor: true
      }
    });

    for (const payout of payouts) {
      const supplierBusiness = await prisma.business.findFirst({
        where: { 
          type: 'SUPPLIER',
          users: {
            some: { id: payout.supplierId }
          }
        }
      });

      const vendorBusiness = await prisma.business.findFirst({
        where: { 
          type: 'VENDOR',
          users: {
            some: { id: payout.vendorId }
          }
        }
      });

      await prisma.payout.update({
        where: { id: payout.id },
        data: {
          supplierBusinessId: supplierBusiness?.id,
          vendorBusinessId: vendorBusiness?.id,
          supplierCurrency: supplierBusiness?.preferredCurrency || 'USD',
          vendorCurrency: vendorBusiness?.preferredCurrency || 'USD'
        }
      });
    }

    // Step 3: Update bank details to link to businesses
    console.log('🏦 Updating bank details...');
    
    const bankDetails = await prisma.bankDetails.findMany({
      include: { user: true }
    });

    for (const bankDetail of bankDetails) {
      if (bankDetail.user.businessId) {
        await prisma.bankDetails.update({
          where: { id: bankDetail.id },
          data: { businessId: bankDetail.user.businessId }
        });
      }
    }

    console.log('✅ Migration completed successfully!');
    console.log(`Created ${vendors.length} vendor businesses`);
    console.log(`Created ${suppliers.length} supplier businesses`);
    console.log(`Updated ${payouts.length} payout records`);
    console.log(`Updated ${bankDetails.length} bank detail records`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateToBusinessStructure()
  .then(() => {
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
