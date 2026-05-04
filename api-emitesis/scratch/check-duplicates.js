
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDuplicates() {
  const result = await prisma.document.groupBy({
    by: ['internshipId', 'name'],
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

  console.log('Duplicate documents found:', result.length);
  for (const item of result) {
    const docs = await prisma.document.findMany({
      where: {
        internshipId: item.internshipId,
        name: item.name
      },
      select: {
        id: true,
        startDate: true,
        dueDate: true
      }
    });
    console.log(`Internship ${item.internshipId}, Document ${item.name}:`);
    docs.forEach(d => console.log(`  ID: ${d.id}, Dates: ${d.startDate} - ${d.dueDate}`));
  }
}

checkDuplicates()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
