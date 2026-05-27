const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const absences = await prisma.absence.findMany({
    include: {
      internship: {
        include: {
          student: true,
          tutor: true
        }
      }
    }
  });

  console.log(`=== ABSENCES COUNT: ${absences.length} ===`);
  absences.forEach(a => {
    console.log(`- Absence ID: ${a.id}`);
    console.log(`  Date: ${a.date}`);
    console.log(`  Student: ${a.internship?.student?.fullName} (${a.internship?.student?.email})`);
    console.log(`  Tutor: ${a.internship?.tutor?.fullName} (${a.internship?.tutor?.email})`);
    console.log(`  Reason: ${a.reason}`);
    console.log(`  Status: ${a.status}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
