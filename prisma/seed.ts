// prisma/seed.ts

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import * as bcrypt from 'bcrypt';

async function main() {
  const saltOrRounds = 10;
  const user = await prisma.user.upsert({
    where: { email: 'tri.le@prisma.io' },
    update: {},
    create: {
      email: 'tri.le@prisma.io',
      password: await bcrypt.hash('trile', saltOrRounds),
      firstName: 'Tri',
      lastName: 'Le',
    },
  });
  const user1 = await prisma.user.upsert({
    where: { email: 'vinh.nguyen@prisma.io' },
    update: {},
    create: {
      email: 'vinh.nguyen@prisma.io',
      password: await bcrypt.hash('vinhnguyen', saltOrRounds),
      firstName: 'Vinh',
      lastName: 'Nguyen',
    },
  });
}

// execute the main function
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // close Prisma Client at the end
    await prisma.$disconnect();
  });
