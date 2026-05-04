
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAssignment() {
  const student = await prisma.user.findFirst({
    where: { fullName: { contains: 'Valentina Gallegos', mode: 'insensitive' } }
  });

  const tutor = await prisma.user.findFirst({
    where: { fullName: { contains: 'Andrés Gallegos Larrea', mode: 'insensitive' } }
  });

  console.log('Student Found:', student ? student.fullName : 'No');
  console.log('Tutor Found:', tutor ? tutor.fullName : 'No');

  if (student && tutor) {
    const internship = await prisma.internship.findFirst({
      where: {
        studentId: student.id,
        tutorId: tutor.id
      },
      include: {
        company: true
      }
    });

    if (internship) {
      console.log(`YES: They are assigned in internship ${internship.id}`);
      console.log(`Company: ${internship.company.name}`);
      console.log(`Status: ${internship.status}`);
    } else {
      console.log('NO: They are not assigned to each other.');
      // Check who is the student's tutor
      const studentInternship = await prisma.internship.findFirst({
        where: { studentId: student.id },
        include: { tutor: true }
      });
      if (studentInternship) {
        console.log(`Student ${student.fullName} has tutor: ${studentInternship.tutor.fullName}`);
      }
    }
  }
}

checkAssignment()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
