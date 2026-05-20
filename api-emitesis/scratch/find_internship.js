const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const targetId = 'e835daa8-ba35-4f02-bee4-9e4a6029a740';
  try {
    const internship = await prisma.internship.findUnique({
      where: { id: targetId },
      include: {
        student: true,
        company: true,
        tutor: true
      }
    });
    if (internship) {
      console.log('INTERNSHIP_FOUND:', JSON.stringify(internship, null, 2));
    } else {
      console.log('INTERNSHIP_NOT_FOUND');
      
      // Let's also print all internships in the DB to see if the ID is different
      const all = await prisma.internship.findMany({
        select: { id: true, student: { select: { fullName: true } } }
      });
      console.log('ALL_INTERNSHIPS:', JSON.stringify(all, null, 2));
    }
  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
