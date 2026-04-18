/**
 * SEED PROFESIONAL & EMPRESARIAL — Sistema de Prácticas Preprofesionales ISTPET
 * 
 * Este seeder genera un entorno realista para pruebas de usuario (UAT) y demostraciones.
 * Cubre: LOPDP, Gestión de Documentos, Asistencia GPS, Evaluaciones y Auditoría.
 */

import { PrismaClient, Role, DocumentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ── Helpers ─────────────────────────────────────────────────────────────────
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
};

const daysFromNow = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(0, 0, 0, 0);
  return d;
};

const withTime = (date: Date, h: number, m: number) => {
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
};

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));

function workingDays(startDaysAgo: number, endDaysAgo = 0): Date[] {
  const dates: Date[] = [];
  for (let i = startDaysAgo; i >= endDaysAgo; i--) {
    const d = daysAgo(i);
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      dates.push(d);
    }
  }
  return dates;
}

const photoUrl = (seed: string | number, w = 800, h = 600) => `https://picsum.photos/seed/${seed}/${w}/${h}`;
const docUrl = (name: string) => `/uploads/documents/${name.replace(/\s+/g, '_').toLowerCase()}.pdf`;

// ── IDs Estáticos para estabilidad de Sesión ────────────────────────────────
const ADMIN_ID      = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const COORD_ID      = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12';
const TUTOR_MARCO_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13';
const EST_MATEO_ID  = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd480a01';
const EST_SOFIA_ID  = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd480a02';
const EST_JAVIER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd480a03';

async function main() {
  console.log('\n🚀 Iniciando Seed Profesional ISTPET (Ambiente Corporativo)...\n');

  // 1. Limpieza
  await prisma.activityPhoto.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.userCredential.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.document.deleteMany();
  await prisma.internship.deleteMany();
  await prisma.agreement.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();
  await prisma.emailLog.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.announcement.deleteMany();

  const password = await bcrypt.hash('password123', 10);
  const lopdpData = { lopdpAccepted: true, lopdpAcceptedAt: daysAgo(10), lopdpVersion: '1.0' };

  // 2. Empresas de Élite
  const [empProdubanco, empTelefonica, empThoughtWorks, empMineduc] = await Promise.all([
    prisma.company.create({
      data: {
        ruc: '1790011234001',
        name: 'Produbanco S.A. Grupo Promerica',
        address: 'Av. Amazonas y Villalengua, Edificio Matriz, Quito',
        representative: 'Ing. Alejandro Vaca',
        email: 'talento.humano@produbanco.com.ec',
      },
    }),
    prisma.company.create({
      data: {
        ruc: '1791241512001',
        name: 'OTECEL S.A. (Telefónica / Movistar)',
        address: 'Av. Simon Bolivar y Vía a Nayón, Centro Corporativo Ekopark, Quito',
        representative: 'Msc. Lorena Salazar',
        email: 'movistar.practicas@telefonica.com',
      },
    }),
    prisma.company.create({
      data: {
        ruc: '1792345678001',
        name: 'ThoughtWorks Ecuador S.A.',
        address: 'Av. República del Salvador N34-127 y Portugal, Quito',
        representative: 'Msc. David Heinemeier',
        email: 'ecuador-careers@thoughtworks.com',
      },
    }),
    prisma.company.create({
      data: {
        ruc: '1760001550001',
        name: 'Ministerio de Educación (MINEDUC)',
        address: 'Av. Amazonas N34-451 y Atahualpa, Quito',
        representative: 'Dra. María Belén Ortiz',
        email: 'pasantias@educacion.gob.ec',
      },
    }),
  ]);

  // 3. Usuarios Pro (Admin, Coordinadores, Tutores)
  const [admin, coordCris, tutorMarco, tutorSilvia, tutorRoberto] = await Promise.all([
    prisma.user.create({ data: { id: ADMIN_ID, email: 'admin@istpet.edu.ec', password, fullName: 'Ing. Gabriel Zurita (Administrador)', role: Role.ADMIN, ...lopdpData } }),
    prisma.user.create({ data: { id: COORD_ID, email: 'coordinador@istpet.edu.ec', password, fullName: 'Msc. Cristhofer Parreño (Coordinador)', role: Role.COORDINADOR, ...lopdpData } }),
    prisma.user.create({ data: { id: TUTOR_MARCO_ID, email: 'm.perez@istpet.edu.ec', password, fullName: 'Msc. Marco Pérez (Tutor Académico)', role: Role.TUTOR, ...lopdpData } }),
    prisma.user.create({ data: { email: 's.endara@istpet.edu.ec', password, fullName: 'Msc. Silvia Endara (Tutora Académica)', role: Role.TUTOR, ...lopdpData } }),
    prisma.user.create({ data: { email: 'r.mora@istpet.edu.ec', password, fullName: 'Ing. Roberto Mora (Tutor Académico)', role: Role.TUTOR, ...lopdpData } }),
  ]);

  // 4. Estudiantes (Diversos Estados de Proceso)
  const [estMateo, estSofia, estJavier, estPaola] = await Promise.all([
    // El "Pro": Casi listo, todo aprobado
    prisma.user.create({ data: { id: EST_MATEO_ID, email: 'm.larrea@estudiante.istpet.edu.ec', password, fullName: 'Mateo Sebastián Larrea Goyes', role: Role.ESTUDIANTE, ...lopdpData } }),
    // La "Novata": Recién asignada, todo PENDIENTE (Ideal para pruebas de subida)
    prisma.user.create({ data: { id: EST_SOFIA_ID, email: 's.vaca@estudiante.istpet.edu.ec', password, fullName: 'Sofía Valentina Vaca Torres', role: Role.ESTUDIANTE, ...lopdpData } }),
    // El "Observado": Tiene documentos rechazados para probar correcciones
    prisma.user.create({ data: { id: EST_JAVIER_ID, email: 'j.ortiz@estudiante.istpet.edu.ec', password, fullName: 'Javier Andrés Ortiz Ledesma', role: Role.ESTUDIANTE, ...lopdpData } }),
    // El "Nuevo": Sin LOPDP aceptada aún (para probar overlay)
    prisma.user.create({ data: { email: 'p.cadena@estudiante.istpet.edu.ec', password, fullName: 'Paola Fernanda Cadena Riofrío', role: Role.ESTUDIANTE, lopdpAccepted: false } }),
  ]);

  // Usuarios Empresa
  await Promise.all([
    prisma.user.create({ data: { email: 'talento.humano@produbanco.com.ec', password, fullName: 'Alejandro Vaca', role: Role.EMPRESA, companyId: empProdubanco.id, ...lopdpData } }),
    prisma.user.create({ data: { email: 'movistar.practicas@telefonica.com', password, fullName: 'Lorena Salazar', role: Role.EMPRESA, companyId: empTelefonica.id, ...lopdpData } }),
    prisma.user.create({ data: { email: 'tutor.it@thoughtworks.com', password, fullName: 'Ing. David Hansson', role: Role.TUTOR_EMPRESARIAL, companyId: empThoughtWorks.id, ...lopdpData } }),
  ]);

  // 5. Convenios Vigentes
  await prisma.agreement.createMany({
    data: [
      { companyId: empProdubanco.id, startDate: daysAgo(365), filePath: docUrl('CONV_PROD_2025'), status: 'Activo' },
      { companyId: empTelefonica.id, startDate: daysAgo(200), filePath: docUrl('CONV_TELE_2025'), status: 'Activo' },
      { companyId: empThoughtWorks.id, startDate: daysAgo(150), filePath: docUrl('CONV_TW_2026'), status: 'Activo' },
    ]
  });

  // 6. Asignaciones (Internships)
  // Produbanco (Matriz): -0.1706 / -78.4870
  // Ekopark (Telefónica): -0.1764 / -78.4678
  // R. Salvador (TW): -0.1833 / -78.4815

  const intMateo = await prisma.internship.create({
    data: {
      studentId: estMateo.id, tutorId: tutorMarco.id, companyId: empProdubanco.id,
      startDate: daysAgo(60), endDate: daysFromNow(60), totalHours: 480,
      location: 'Produbanco Matriz — Área de Desarrollo Core',
      lat: -0.1706, lng: -78.4870, status: 'En Proceso'
    }
  });

  const intSofia = await prisma.internship.create({
    data: {
      studentId: estSofia.id, tutorId: tutorSilvia.id, companyId: empTelefonica.id,
      startDate: daysAgo(5), endDate: daysFromNow(115), totalHours: 480,
      location: 'Telefónica Ekopark — Big Data & Analytics',
      lat: -0.1764, lng: -78.4678, status: 'En Proceso'
    }
  });

  const intJavier = await prisma.internship.create({
    data: {
      studentId: estJavier.id, tutorId: tutorRoberto.id, companyId: empThoughtWorks.id,
      startDate: daysAgo(30), endDate: daysFromNow(90), totalHours: 480,
      location: 'ThoughtWorks — Agile Software Delivery',
      lat: -0.1833, lng: -78.4815, status: 'En Proceso'
    }
  });

  // 7. Documentos Realistas
  const docData = [
    // MATEO (Avanzado)
    { internshipId: intMateo.id, name: 'Plan de Prácticas - Dev. Core', status: DocumentStatus.APROBADO_DEFINITIVO, submittedAt: daysAgo(55), filePath: docUrl('mateo_plan') },
    { internshipId: intMateo.id, name: 'Informe Parcial N1 - Microservicios', status: DocumentStatus.APROBADO_TUTOR, submittedAt: daysAgo(30), filePath: docUrl('mateo_parcial1') },
    { internshipId: intMateo.id, name: 'Registro de Horas Mensual', status: DocumentStatus.EN_REVISION_TUTOR, submittedAt: daysAgo(2), filePath: docUrl('mateo_horas') },
    
    // SOFIA (Novata - para subir documentos)
    { internshipId: intSofia.id, name: 'Propuesta de Plan de Trabajo', status: DocumentStatus.PENDIENTE, dueDate: daysFromNow(5) },
    { internshipId: intSofia.id, name: 'Copia de Convenio Firmada', status: DocumentStatus.PENDIENTE, dueDate: daysFromNow(10) },
    { internshipId: intSofia.id, name: 'Acta de Inducción de Seguridad', status: DocumentStatus.PENDIENTE, dueDate: daysFromNow(15) },

    // JAVIER (Observado por corrección)
    { internshipId: intJavier.id, name: 'Informe Técnico Agile', status: DocumentStatus.RECHAZADO_TUTOR, submittedAt: daysAgo(5), observations: 'El informe carece de evidencias de las ceremonias SCRUM. Se requiere capturas de Jira y bitácoras de Daily Meetings.' },
  ];

  for (const d of docData) { await prisma.document.create({ data: d }); }

  // 8. Asistencia Real (Mateo - Produbanco)
  const mateoDays = workingDays(59, 1);
  for (const [i, day] of mateoDays.entries()) {
    const isPresent = i % 15 !== 0; // Algunas ausencias
    if (isPresent) {
      const att = await prisma.attendance.create({
        data: {
          internshipId: intMateo.id,
          checkIn: withTime(day, 8, randInt(0, 15)),
          checkOut: withTime(day, 17, randInt(0, 20)),
          lat: -0.1706 + rand(-0.0001, 0.0001),
          lng: -78.4870 + rand(-0.0001, 0.0001),
          distanceKm: rand(0.01, 0.1),
          checkInPhoto: photoUrl(`in-${i}`), checkOutPhoto: photoUrl(`out-${i}`)
        }
      });

      // Actividades Técnicas para el PRO
      if (i % 5 === 0) {
        await prisma.activityPhoto.create({
          data: {
            attendanceId: att.id,
            photoUrl: photoUrl(`act-${i}`),
            caption: 'Refactorización de controladores en backend NestJS y migración de esquemas en Prisma.'
          }
        });
      }
    }
  }

  // 9. Configuraciones Globales
  console.log('⚙️ Seteando configuraciones globales...');
  await prisma.systemSetting.createMany({
    data: [
      { key: 'attendance_radius', value: '250', description: 'Radio de geofencing para asistencia (metros)', category: 'GPS' },
      { key: 'session_timeout', value: '3600', description: 'Tiempo de expiración de sesión (segundos)', category: 'AUTH' },
      { key: 'smtp_host', value: 'smtp.gmail.com', description: 'Servidor SMTP para notificaciones', category: 'EMAIL' },
    ]
  });

  // 10. Anuncio Inicial
  await prisma.announcement.create({
    data: {
      title: '¡Bienvenidos a la nueva versión Admin Pro!',
      content: 'Hemos industrializado el panel administrativo para mejor control del sistema.',
      type: 'SUCCESS',
      startDate: daysAgo(1),
    }
  });

  console.log('\n✅ Seed Profesional finalizado con éxito.');
  console.log('──────────────────────────────────────────────────────');
  console.log('🔑 Credenciales Master (Password: password123)');
  console.log('COORDINADOR : coordinador@istpet.edu.ec');
  console.log('EL PRO     : m.larrea@estudiante.istpet.edu.ec');
  console.log('LA NOVATA  : s.vaca@estudiante.istpet.edu.ec (Úsalo para subir documentos)');
  console.log('OBSERVADO  : j.ortiz@estudiante.istpet.edu.ec (Para ver rechazos)');
  console.log('SIN LOPDP  : p.cadena@estudiante.istpet.edu.ec (Prueba de overlay)');
  console.log('──────────────────────────────────────────────────────');
}

main()
  .catch((e) => { console.error('❌ Error en seed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
