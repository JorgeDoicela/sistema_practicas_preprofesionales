const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkInternships() {
  const studentId = '98e9fb44-92f0-4aff-9ecd-31b3c92ad887';
  const internships = await prisma.internship.findMany({
    where: { studentId },
    include: {
      company: true,
      tutor: true,
      documents: true
    }
  });
  console.log('Internships:', JSON.stringify(internships, null, 2));
  process.exit(0);
}

checkInternships();
