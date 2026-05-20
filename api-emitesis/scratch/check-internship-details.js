const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tutor = await prisma.user.findFirst({
    where: { fullName: { contains: 'Andrés Gallegos Larrea', mode: 'insensitive' } }
  });

  if (tutor) {
    const internships = await prisma.internship.findMany({
      where: { tutorId: tutor.id },
      include: {
        student: true,
        company: true
      }
    });

    console.log(`Found ${internships.length} internships for tutor e4d56fac-95af-44d9-b395-8a138bec81e3:`);
    internships.forEach(i => {
      console.log(`- Internship ID: ${i.id}`);
      console.log(`  * Student: ${i.student?.fullName} (ID: ${i.studentId})`);
      console.log(`  * Company: ${i.company?.name} (ID: ${i.companyId})`);
      console.log(`  * Tutor ID: ${i.tutorId}`);
      console.log(`  * Status: ${i.status}`);
    });
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
