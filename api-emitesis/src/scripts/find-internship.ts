import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const internship = await prisma.internship.findFirst({
    include: {
      student: true,
      documents: true,
      attendances: true
    }
  });

  if (!internship) {
    console.log("No internships found");
  } else {
    console.log("Found Internship ID:", internship.id);
    console.log("Student:", internship.student.fullName);
    console.log("Docs count:", internship.documents.length);
    console.log("Approved Docs:", internship.documents.filter(d => d.status === 'APROBADO_DEFINITIVO').map(d => d.name));
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
