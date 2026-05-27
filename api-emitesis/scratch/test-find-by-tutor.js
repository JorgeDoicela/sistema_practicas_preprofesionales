const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tutorId = 'e4d56fac-95af-44d9-b395-8a138bec81e3';
  const internships = await prisma.internship.findMany({
    where: { tutorId },
    include: {
      student: true,
      company: true,
      documents: true,
      attendances: {
        orderBy: { checkIn: 'desc' },
        take: 3,
      },
      evaluations: true,
      monitoringVisits: {
        orderBy: { date: 'desc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`Results length: ${internships.length}`);
  console.log('Results:', JSON.stringify(internships, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
