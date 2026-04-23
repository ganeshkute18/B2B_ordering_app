/**
 * Production Seed File
 * 
 * This seed file is used for production deployments.
 * It creates sample PRODUCTS, CATEGORIES, and AGENCIES
 * but NO USER ACCOUNTS.
 * 
 * Users should be created via:
 * 1. Client self-registration (POST /api/v1/auth/signup/customer)
 * 2. Admin creation (npx ts-node prisma/create-real-user.ts)
 * 3. Direct database insert (for advanced users)
 */

import { PrismaClient, Role, UnitType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Production Seed - Creating base data (NO USER ACCOUNTS)...');

  // Create Agency
  const agency = await prisma.agency.upsert({
    where: { name: 'Hindustan Unilever' },
    update: {},
    create: {
      name: 'Hindustan Unilever',
      description: 'FMCG products distributor',
      contactName: 'Priya Sharma',
      contactEmail: 'priya@hul.com',
      contactPhone: '+912022000000',
    },
  });

  // Create Categories
  const personalCare = await prisma.category.upsert({
    where: { slug: 'personal-care' },
    update: {},
    create: {
      name: 'Personal Care',
      slug: 'personal-care',
      description: 'Soaps, shampoos, skincare',
    },
  });

  const homecare = await prisma.category.upsert({
    where: { slug: 'home-care' },
    update: {},
    create: {
      name: 'Home Care',
      slug: 'home-care',
      description: 'Cleaning products, detergents',
    },
  });

  // Create Products
  const product1 = await prisma.product.upsert({
    where: { sku: 'HUL-LUX-001' },
    update: {},
    create: {
      sku: 'HUL-LUX-001',
      name: 'Lux Soap Bar (Pack of 4)',
      description: 'Premium bathing soap, rose fragrance',
      unitType: UnitType.PACKET,
      unitsPerCase: 4,
      pricePerUnit: 8000, // ₹80 in paise
      taxPercent: 18,
      agencyId: agency.id,
      categoryId: personalCare.id,
    },
  });

  const product2 = await prisma.product.upsert({
    where: { sku: 'HUL-DOVE-001' },
    update: {},
    create: {
      sku: 'HUL-DOVE-001',
      name: 'Dove Shampoo 400ml',
      description: 'Moisturizing shampoo for smooth hair',
      unitType: UnitType.PACKET,
      unitsPerCase: 12,
      pricePerUnit: 15000, // ₹150
      taxPercent: 18,
      agencyId: agency.id,
      categoryId: personalCare.id,
    },
  });

  // Create Inventory for Products
  await prisma.inventory.upsert({
    where: { productId: product1.id },
    update: {},
    create: {
      productId: product1.id,
      totalStock: 500,
      reservedStock: 0,
      lowStockThreshold: 50,
    },
  });

  await prisma.inventory.upsert({
    where: { productId: product2.id },
    update: {},
    create: {
      productId: product2.id,
      totalStock: 300,
      reservedStock: 0,
      lowStockThreshold: 30,
    },
  });

  console.log('✅ Production Seed Complete!\n');
  console.log('📊 Created:');
  console.log(`   ✓ Agencies: 1 (Hindustan Unilever)`);
  console.log(`   ✓ Categories: 2 (Personal Care, Home Care)`);
  console.log(`   ✓ Products: 2 (Lux Soap, Dove Shampoo)`);
  console.log(`   ✓ Users: 0 (Create manually via signup or script)\n`);

  console.log('🚀 Next Steps:');
  console.log(`   1. Users can sign up as CUSTOMER`);
  console.log(`   2. Admins can promote to OWNER`);
  console.log(`   3. Owners can generate staff invitations\n`);

  console.log('📝 To create first user, run:');
  console.log(`   npx ts-node prisma/create-real-user.ts\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
