import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Iniciando Reinicio Seguro de Datos ---');

  // 1. Limpieza de datos en orden inverso de dependencias
  // Esto evita errores de integridad referencial (Foreign Key constraints)
  await prisma.$transaction([
    prisma.attendance.deleteMany(),
    prisma.document.deleteMany(),
    prisma.internship.deleteMany(),
    prisma.agreement.deleteMany(),
    prisma.user.deleteMany(),
    prisma.company.deleteMany(),
  ]);

  console.log('✅ Base de datos limpia.');

  const password = await bcrypt.hash('password123', 10);

  // 2. Crear Empresa de prueba inicial
  const company = await prisma.company.create({
    data: {
      ruc: '1790000000001',
      name: 'ISTPET Corativo',
      address: 'Quito, Sector El Calzado',
      representative: 'Ing. Jorge Doicela',
      email: 'institucion@istpet.edu.ec',
    },
  });

  // 3. Crear Usuarios Base
  const usersToCreate = [
    {
      email: 'admin@emitesis.com',
      password,
      fullName: 'Administrador General',
      role: Role.ADMIN,
    },
    {
      email: 'coordinador@emitesis.com',
      password,
      fullName: 'Jorge Doicela',
      role: Role.COORDINADOR,
    },
    {
      email: 'tutor@emitesis.com',
      password,
      fullName: 'Marcos Pérez',
      role: Role.TUTOR,
    },
    {
      email: 'estudiante@emitesis.com',
      password,
      fullName: 'Ismael Estudiante',
      role: Role.ESTUDIANTE,
    },
    {
      email: 'empresa@emitesis.com',
      password,
      fullName: 'Responsable Empresa',
      role: Role.EMPRESA,
      companyId: company.id,
    },
  ];

  for (const userData of usersToCreate) {
    await prisma.user.create({ data: userData });
  }

  console.log('✅ Usuarios del ecosistemas recreados correctamente.');
  console.log('--- Resumen de Credenciales ---');
  console.log('Usuario: [correo] / Contraseña: password123');
  console.log('---------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Error en el proceso de seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
