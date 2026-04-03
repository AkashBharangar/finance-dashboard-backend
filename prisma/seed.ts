import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Role } from '../src/common/enums/role.enum';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin@123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@finance.local' },
    update: {
      name: 'System Admin',
      role: Role.ADMIN,
      isActive: true,
      passwordHash,
    },
    create: {
      email: 'admin@finance.local',
      name: 'System Admin',
      role: Role.ADMIN,
      isActive: true,
      passwordHash,
    },
  });
}

main()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
