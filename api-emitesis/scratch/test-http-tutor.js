const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function main() {
  const tutor = await prisma.user.findFirst({
    where: { fullName: { contains: 'Andrés Gallegos Larrea', mode: 'insensitive' } }
  });

  if (!tutor) {
    console.error('Tutor not found in database');
    return;
  }

  console.log(`Generating JWT token for tutor: ${tutor.fullName} (${tutor.id})`);
  
  const payload = {
    email: tutor.email,
    sub: tutor.id,
    role: tutor.role,
    fullName: tutor.fullName,
    careerId: tutor.careerId
  };

  const secret = 'EmitesisSecretKey2026!'; // JWT_SECRET from .env
  const token = jwt.sign(payload, secret, { expiresIn: '1h' });

  console.log('Token generated successfully.');

  try {
    const url = `http://localhost:5000/api/internships/tutor/${tutor.id}`;
    console.log(`Sending GET request to: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log(`Status: ${response.status}`);
    console.log(`Response length: ${response.data.length}`);
    console.log('First item sample student:', response.data[0]?.student?.fullName);
  } catch (error) {
    console.error('Request failed:', error.response ? error.response.status : error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
