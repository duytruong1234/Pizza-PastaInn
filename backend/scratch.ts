import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const dishes = await prisma.dish.findMany({
    where: {
      dish_name: {
        contains: 'half'
      }
    },
    include: {
      prices: true
    }
  });
  console.log(JSON.stringify(dishes, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
