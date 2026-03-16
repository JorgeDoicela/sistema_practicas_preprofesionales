const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany();
    fs.writeFileSync('db_check.txt', JSON.stringify(users, null, 2));
  } catch (e) {
    fs.writeFileSync('db_error.txt', e.stack);
  }
}

main().finally(() => prisma.$disconnect());
