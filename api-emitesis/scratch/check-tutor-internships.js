const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tutors = await prisma.user.findMany({
    where: { role: 'TUTOR' },
    include: {
      assignmentsAsTutor: {
        include: { student: true, company: true }
      }
    }
  });

  console.log(`=== TUTORS AND INTERNSHIPS COUNT ===`);
  tutors.forEach(t => {
    console.log(`- Tutor: ${t.fullName} (${t.email}) has ${t.assignmentsAsTutor.length} assigned students.`);
    t.assignmentsAsTutor.forEach(a => {
      console.log(`  * Student: ${a.student?.fullName || 'N/A'} (Company: ${a.company?.name || 'N/A'})`);
    });
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
