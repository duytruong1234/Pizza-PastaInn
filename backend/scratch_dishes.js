const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dishes = await prisma.dish.findMany({
    where: {
      category: {
        category_name: {
          contains: 'Pizza',
          mode: 'insensitive'
        }
      }
    },
    include: {
      prices: true
    }
  });
  console.log(JSON.stringify(dishes, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
