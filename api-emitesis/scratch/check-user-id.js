const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { fullName: { contains: 'Andrés Gallegos Larrea', mode: 'insensitive' } }
  });

  if (user) {
    console.log(`Tutor: ${user.fullName}`);
    console.log(`ID: ${user.id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
  } else {
    console.log('Tutor not found');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
