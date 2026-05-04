
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStudent() {
  const student = await prisma.user.findUnique({
    where: { email: 'estudiante53@est.istpet.edu.ec' },
    include: {
      assignmentsAsStudent: {
        include: {
          documents: {
            where: { name: 'F06 - Evaluación del Tutor Empresarial' }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  console.log(`Student: ${student.fullName}`);
  console.log(`Number of internships: ${student.assignmentsAsStudent.length}`);
  student.assignmentsAsStudent.forEach((internship, i) => {
    console.log(`Internship ${i}: ID ${internship.id}, Created At: ${internship.createdAt}`);
    internship.documents.forEach(doc => {
      console.log(`  Document: ${doc.name}, Start Date: ${doc.startDate}, Due Date: ${doc.dueDate}`);
    });
  });
}

checkStudent()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
