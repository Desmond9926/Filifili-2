import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

config({ path: 'Q:/Filifili-2/.env' });

const prisma = new PrismaClient();

try {
  const user = await prisma.user.findFirst({ where: { email: 'admin@test.com' } });
  console.log('user:', user ? { id: user.id, email: user.email, username: user.username, role: user.role } : null);
  if (user) {
    const ok = await bcrypt.compare('Admin@123', user.passwordHash);
    console.log('passwordMatch:', ok);
  }
} finally {
  await prisma.$disconnect();
}
