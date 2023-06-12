// prisma/seed.ts

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'tri.le@prisma.io' },
    update: {},
    create: {
      email: 'tri.le@prisma.io',
      password: 'trile',
      firstName: 'Tri',
      lastName: 'Le',
    },
  });
  const user1 = await prisma.user.upsert({
    where: { email: 'vinh.nguyen@prisma.io' },
    update: {},
    create: {
      email: 'vinh.nguyen@prisma.io',
      password: 'vinhnguyen',
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
