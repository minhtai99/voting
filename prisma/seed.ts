// prisma/seed.ts

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'tri@gmail.com' },
    update: {},
    create: {
      email: 'tri@gmail.com',
      name: 'Tri',
    },
  });
  const user1 = await prisma.user.upsert({
    where: { email: 'tri1@gmail.com' },
    update: {},
    create: {
      email: 'tri1@gmail.com',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'tri2@gmail.com' },
    update: {},
    create: {
      email: 'tri2@gmail.com',
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
