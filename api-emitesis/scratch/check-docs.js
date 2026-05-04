
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDocs() {
  const docs = await prisma.document.findMany({
    where: {
      name: 'F06 - Evaluación del Tutor Empresarial',
      startDate: { not: null }
    },
    include: {
      internship: {
        include: {
          student: true
        }
      }
    }
  });

  console.log('Documents with dates found:', docs.length);
  docs.forEach(doc => {
    console.log(`Document ID: ${doc.id}`);
    console.log(`Internship ID: ${doc.internshipId}`);
    console.log(`Student: ${doc.internship.student.fullName} (${doc.internship.student.email})`);
    console.log(`Dates: ${doc.startDate} - ${doc.dueDate}`);
    console.log('---');
  });

  const allDocs = await prisma.document.findMany({
    where: {
      name: 'F06 - Evaluación del Tutor Empresarial'
    },
    include: {
      internship: {
        include: {
          student: true
        }
      }
    }
  });
  
  console.log('Total F06 documents:', allDocs.length);
  allDocs.forEach(doc => {
    if (!doc.startDate) {
        console.log(`Document WITHOUT dates: ${doc.id} for student ${doc.internship.student.email} in internship ${doc.internshipId}`);
    }
  });
}

checkDocs()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
