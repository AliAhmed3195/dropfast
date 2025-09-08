// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Admin user
  const admin = await prisma.user.create({
    data: {
      email: "admin@fastdrop.com",
      password: "admin123", // Hash karna production me
      name: "Super Admin",
      role: "ADMIN",
    },
  });

  // Supplier user
  const supplier = await prisma.user.create({
    data: {
      email: "supplier@fastdrop.com",
      password: "supplier123",
      name: "Default Supplier",
      role: "SUPPLIER",
    },
  });

  // Vendor user
  const vendor = await prisma.user.create({
    data: {
      email: "vendor@fastdrop.com",
      password: "vendor123",
      name: "Test Vendor",
      role: "VENDOR",
    },
  });

  // Supplier adds a product
  const product = await prisma.product.create({
    data: {
      name: "Wireless Headphones",
      description: "High-quality Bluetooth headphones",
      price: 50,
      supplierId: supplier.id,
      image: "https://via.placeholder.com/150",
    },
  });

  // Vendor creates a store
  const store = await prisma.store.create({
    data: {
      name: "Vendor’s First Store",
      slug: "vendor-store",
      ownerId: vendor.id,
    },
  });

  // Vendor imports supplier’s product into their store
  await prisma.product.create({
    data: {
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      supplierId: supplier.id,
      storeId: store.id,
      markup: 20, // Vendor adds markup %
    },
  });

  console.log("✅ Seed data inserted");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
