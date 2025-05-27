// scripts/seed.ts
import { db } from '@/db';
import { users } from '@/db/schema';
import { hashPassword } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

async function createSuperAdmin() {
  try {
    logger.info('Checking for existing Super Admin...');
    
    const [existingSuperAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.role, 'SUPER_ADMIN'))
      .limit(1);

    if (existingSuperAdmin) {
      logger.info('Super Admin already exists:', existingSuperAdmin.email);
      return;
    }

    const superAdmin = {
      name: 'Super Admin',
      email: 'superadmin@example.com',
      password: '1234', // Change this in production!
      role: 'SUPER_ADMIN' as const,
    };

    logger.info('Creating Super Admin...');
    const passwordHash = await hashPassword(superAdmin.password);

    const [newUser] = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        name: superAdmin.name,
        email: superAdmin.email,
        role: superAdmin.role,
        passwordHash,
        isSuspended: false,
      })
      .returning();

    logger.success('Super Admin created successfully:', newUser.email);
  } catch (error) {
    logger.error('Error creating Super Admin:', error);
    process.exit(1);
  }
}

async function main() {
  try {
    logger.info('Starting database seeding...');
    
    await createSuperAdmin();
    
    logger.success('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Database seeding failed:', error);
    process.exit(1);
  }
}

main();