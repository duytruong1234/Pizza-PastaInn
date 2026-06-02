import { prisma } from './src/lib/prisma';

async function main() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { order_id: 'desc' },
      take: 5
    });
    console.log('LATEST 5 ORDERS:', JSON.stringify(orders, null, 2));
  } catch (error) {
    console.error('ERROR:', error);
  } finally {
    process.exit(0);
  }
}

main();
