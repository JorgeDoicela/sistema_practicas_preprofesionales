import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);

  // Crear Usuarios
  const admin = await prisma.user.upsert({
    where: { email: 'admin@emitesis.com' },
    update: {},
    create: {
      email: 'admin@emitesis.com',
      password,
      fullName: 'Administrador General',
      role: Role.ADMIN,
    },
  });

  const coordinator = await prisma.user.upsert({
    where: { email: 'coordinador@emitesis.com' },
    update: {},
    create: {
      email: 'coordinador@emitesis.com',
      password,
      fullName: 'Jorge Doicela',
      role: Role.COORDINADOR,
    },
  });

  const tutor = await prisma.user.upsert({
    where: { email: 'tutor@emitesis.com' },
    update: {},
    create: {
      email: 'tutor@emitesis.com',
      password,
      fullName: 'Marcos Pérez',
      role: Role.TUTOR,
    },
  });

  const student = await prisma.user.upsert({
    where: { email: 'estudiante@emitesis.com' },
    update: {},
    create: {
      email: 'estudiante@emitesis.com',
      password,
      fullName: 'Ismael Estudiante',
      role: Role.ESTUDIANTE,
    },
  });

  // Crear Empresa de prueba
  const company = await prisma.company.upsert({
    where: { ruc: '1790000000001' },
    update: {},
    create: {
      ruc: '1790000000001',
      name: 'Tech Solutions S.A.',
      address: 'Av. Amazonas y Colón',
      representative: 'Juan Pueblo',
      email: 'contacto@techsolutions.com',
    },
  });

  console.log('Semillas creadas con éxito:');
  console.log({ admin: admin.email, coordinator: coordinator.email, tutor: tutor.email, student: student.email, company: company.name });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
