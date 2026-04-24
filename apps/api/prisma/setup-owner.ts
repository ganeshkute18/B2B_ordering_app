import { PrismaClient, Role, ApprovalStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as readline from 'readline';

/**
 * Owner Account Setup Script
 * 
 * This script is used to create the first OWNER account for production.
 * 
 * Usage:
 * npx ts-node prisma/setup-owner.ts
 * 
 * Instructions:
 * 1. Start this script
 * 2. Answer the prompts:
 *    - Email address (will be used for login)
 *    - Full name
 *    - Password (must be at least 8 characters)
 *    - Business name (optional)
 * 3. Account will be created with:
 *    - Role: OWNER
 *    - Email verified: true (since owner is setting up)
 *    - Approval status: APPROVED
 */

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function validateEmail(email: string): Promise<boolean> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.log('❌ Invalid email format');
    return false;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('❌ Email already registered');
    return false;
  }

  return true;
}

function validatePassword(password: string): boolean {
  if (password.length < 8) {
    console.log('❌ Password must be at least 8 characters');
    return false;
  }

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);

  if (!hasUppercase || !hasLowercase || !hasNumbers || !hasSpecial) {
    console.log(
      '⚠️  Password should contain uppercase, lowercase, numbers, and special characters for better security',
    );
  }

  return true;
}

async function main() {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('  🚀 DISTRO PLATFORM - OWNER ACCOUNT SETUP');
    console.log('='.repeat(60) + '\n');

    console.log('This script will create your first OWNER account.\n');

    let email = '';
    while (!email) {
      const inputEmail = await question('📧 Enter your email address: ');
      if (await validateEmail(inputEmail)) {
        email = inputEmail;
      }
    }

    const name = await question('👤 Enter your full name: ');
    if (!name) {
      console.log('❌ Name is required');
      process.exit(1);
    }

    let password = '';
    while (!password) {
      const inputPassword = await question('🔒 Enter a secure password (min 8 chars): ');
      if (validatePassword(inputPassword)) {
        const confirmPassword = await question('🔒 Confirm password: ');
        if (inputPassword === confirmPassword) {
          password = inputPassword;
        } else {
          console.log('❌ Passwords do not match');
        }
      }
    }

    const businessName = await question('🏢 Enter your business name (optional, press Enter to skip): ');

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create owner user
    const owner = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: Role.OWNER,
        businessName: businessName || undefined,
        isActive: true,
        emailVerified: true,
        approvalStatus: 'APPROVED' as ApprovalStatus,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        businessName: true,
        createdAt: true,
      },
    });

    console.log('\n' + '='.repeat(60));
    console.log('  ✅ OWNER ACCOUNT CREATED SUCCESSFULLY');
    console.log('='.repeat(60) + '\n');
    console.log('Account Details:');
    console.log(`  📧 Email: ${owner.email}`);
    console.log(`  👤 Name: ${owner.name}`);
    console.log(`  🏢 Business: ${owner.businessName || 'Not specified'}`);
    console.log(`  👑 Role: OWNER`);
    console.log(`  ✅ Email Verified: Yes`);
    console.log(`  ✅ Status: APPROVED`);
    console.log(`  📅 Created: ${owner.createdAt.toISOString()}`);

    console.log('\n' + '='.repeat(60));
    console.log('  🎉 NEXT STEPS');
    console.log('='.repeat(60) + '\n');
    console.log('1. Login with your credentials at the web app');
    console.log('2. Go to "User Management" to approve/reject staff signups');
    console.log('3. Generate invitation codes to invite staff members');
    console.log('4. Monitor user applications and manage your team\n');

    console.log('⚠️  IMPORTANT:');
    console.log('- Never share your password');
    console.log('- Keep your email secure');
    console.log('- You can create additional owner accounts via database\n');

    rl.close();
  } catch (error) {
    console.error('❌ Error creating owner account:', error);
    rl.close();
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
