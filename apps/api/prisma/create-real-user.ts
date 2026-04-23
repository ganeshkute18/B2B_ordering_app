import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
};

async function main() {
  console.log('\n🔐 Real User Creation for Production\n');
  console.log('This script creates real users for production deployment.');
  console.log('Sample users (owner@distro.com, etc.) are only for local testing.\n');

  try {
    // Collect user information
    const email = await question('📧 Enter owner email: ');
    const name = await question('👤 Enter owner name: ');
    const businessName = await question('🏢 Enter business name: ');
    const password = await question('🔑 Enter owner password (min 8 chars): ');

    // Validate
    if (!email.includes('@')) {
      throw new Error('Invalid email');
    }
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error(`User with email ${email} already exists`);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        businessName,
        passwordHash,
        role: Role.OWNER,
        isActive: true,
      },
    });

    console.log('\n✅ Owner account created successfully!\n');
    console.log('🎯 Login Credentials:');
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`\n📌 Next Steps:`);
    console.log(`   1. Deploy to production`);
    console.log(`   2. Login with above credentials`);
    console.log(`   3. Generate invitation codes for staff`);
    console.log(`   4. Share codes with team members\n`);

    rl.close();
  } catch (error) {
    console.error('\n❌ Error:', (error as Error).message);
    rl.close();
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
