
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLocations() {
  const internship = await prisma.internship.findUnique({
    where: { id: '6e11d517-814c-4429-bc51-369008b38330' }
  });

  console.log('Internship:', internship.id);
  console.log('Allowed Locations:', JSON.stringify(internship.allowedLocations, null, 2));
  console.log('Legacy Lat/Lng:', internship.lat, internship.lng);
}

checkLocations()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
