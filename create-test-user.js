const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: 'admin@fastdrop.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'ADMIN',
        isActive: true,
      },
    });
    
    console.log('Admin user created:', admin);
    
    // Create supplier user
    const supplierPassword = await bcrypt.hash('supplier123', 12);
    const supplier = await prisma.user.create({
      data: {
        email: 'supplier@fastdrop.com',
        password: supplierPassword,
        name: 'Test Supplier',
        role: 'SUPPLIER',
        isActive: true,
      },
    });
    
    console.log('Supplier user created:', supplier);
    
    // Create vendor user
    const vendorPassword = await bcrypt.hash('vendor123', 12);
    const vendor = await prisma.user.create({
      data: {
        email: 'vendor@fastdrop.com',
        password: vendorPassword,
        name: 'Test Vendor',
        role: 'VENDOR',
        isActive: true,
      },
    });
    
    console.log('Vendor user created:', vendor);
    
    console.log('\n✅ Test users created successfully!');
    console.log('\nLogin credentials:');
    console.log('Admin: admin@fastdrop.com / admin123');
    console.log('Supplier: supplier@fastdrop.com / supplier123');
    console.log('Vendor: vendor@fastdrop.com / vendor123');
    
  } catch (error) {
    console.error('Error creating users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
