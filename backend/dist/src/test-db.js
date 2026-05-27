"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    try {
        const categories = await prisma.category.findMany();
        console.log('Success:', categories.length, 'categories found');
    }
    catch (e) {
        console.error('Connection failed:', e);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
//# sourceMappingURL=test-db.js.map