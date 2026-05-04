
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMultipleInternships() {
  const result = await prisma.internship.groupBy({
    by: ['studentId'],
    _count: {
      id: true
    },
    having: {
      id: {
        _count: {
          gt: 1
        }
      }
    }
  });

  console.log('Students with multiple internships:', result.length);
  for (const item of result) {
    const student = await prisma.user.findUnique({ where: { id: item.studentId } });
    console.log(`Student ${student.fullName} (${student.email}) has ${item._count.id} internships.`);
  }
}

checkMultipleInternships()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
