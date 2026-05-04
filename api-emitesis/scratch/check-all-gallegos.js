
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkGallegos() {
  const students = await prisma.user.findMany({
    where: { 
      role: 'ESTUDIANTE',
      fullName: { contains: 'Gallegos', mode: 'insensitive' }
    },
    include: {
      assignmentsAsStudent: {
        include: { tutor: true, company: true }
      }
    }
  });

  console.log(`Found ${students.length} students with 'Gallegos' in their name:`);
  students.forEach(s => {
    console.log(`- ${s.fullName} (${s.email})`);
    s.assignmentsAsStudent.forEach(i => {
      console.log(`  * Assigned to Tutor: ${i.tutor.fullName}`);
      console.log(`  * Company: ${i.company.name}`);
      console.log(`  * Status: ${i.status}`);
    });
  });
}

checkGallegos()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
