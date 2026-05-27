const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { fullName: { contains: 'Andrés Gallegos', mode: 'insensitive' } }
  });

  console.log(`Found ${users.length} users:`);
  users.forEach(u => {
    console.log(`- ID: ${u.id}`);
    console.log(`  Name: ${u.fullName}`);
    console.log(`  Email: ${u.email}`);
    console.log(`  Role: ${u.role}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
