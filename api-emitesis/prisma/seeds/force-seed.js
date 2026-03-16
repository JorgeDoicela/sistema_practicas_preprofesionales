const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);
  
  const usersToCreate = [
    { email: 'admin@emitesis.com', fullName: 'Administrador General', role: 'ADMIN' },
    { email: 'coordinador@emitesis.com', fullName: 'Jorge Doicela', role: 'COORDINADOR' },
    { email: 'tutor@emitesis.com', fullName: 'Marcos Pérez', role: 'TUTOR' },
    { email: 'estudiante@emitesis.com', fullName: 'Ismael Estudiante', role: 'ESTUDIANTE' },
  ];

  for (const u of usersToCreate) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        password: password,
        isActive: true,
        failedAttempts: 0,
        lockoutUntil: null
      },
      create: {
        email: u.email,
        password: password,
        fullName: u.fullName,
        role: u.role,
        isActive: true,
      },
    });
    console.log(`User ${user.email} ensured.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
