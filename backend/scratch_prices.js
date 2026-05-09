const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: '123',
  database: 'Pizza&PastaInn',
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const prices = await prisma.dishPrice.findMany({
    where: { dish_id: 65 }
  });
  console.log(JSON.stringify(prices, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
