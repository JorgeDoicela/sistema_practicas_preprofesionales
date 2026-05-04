const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listUsers() {
  const users = await prisma.user.findMany({
    select: {
        id: true,
        email: true,
        fullName: true,
        role: true
    }
  });
  console.log('Users:', JSON.stringify(users, null, 2));
  process.exit(0);
}

listUsers();
