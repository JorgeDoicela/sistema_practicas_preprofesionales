/**
 * MASTER SEED INSTITUCIONAL v11.0 — SISTEMA EMITESIS (MODO DEMO REALISTA)
 * 
 * Cobertura: 100% Schema, Escenarios de Riesgo Complejos, Analítica Masiva y LOPDP.
 * Objetivo: Mostrar el sistema como si tuviera 6 meses de uso real intenso.
 */

import { PrismaClient, Role, DocumentStatus, EvaluationType, Career, Company, User, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ── Helpers de Simulación ──────────────────────────────────────────────────
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const photoUrl = (seed: string | number) => `https://picsum.photos/seed/${seed}/800/600`;
const docUrl = (name: string) => `/uploads/documents/seed/${name.replace(/\s+/g, '_').toLowerCase()}.pdf`;

const firstNames = ['Mateo', 'Sofía', 'Juan', 'Valentina', 'Andrés', 'Isabella', 'Diego', 'Camila', 'Luis', 'Lucía', 'Carlos', 'Mariana', 'Javier', 'Elena', 'Ricardo', 'Gabriela'];
const lastNames = ['Larrea', 'Vaca', 'Ortiz', 'Gallegos', 'Salazar', 'Méndez', 'Pérez', 'Cisneros', 'López', 'Gómez', 'Torres', 'Ramírez', 'Castro', 'Arias', 'Enríquez', 'Toapanta'];

const getRandomName = () => `${firstNames[randInt(0, firstNames.length - 1)]} ${lastNames[randInt(0, lastNames.length - 1)]}`;

async function main() {
  console.log('\n INICIANDO INYECCIÓN MAESTRA EMITESIS v11.0 [MODO DEMO REALISTA]');
  console.log('──────────────────────────────────────────────────────');

  // 1. Limpieza de Seguridad (Orden estricto de integridad referencial)
  console.log('Sincronizando Purga de Datos...');
  await prisma.activityPhoto.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.documentVersion.deleteMany();
  await prisma.documentComment.deleteMany();
  await prisma.document.deleteMany();
  await prisma.documentTemplate.deleteMany();
  await prisma.monitoringVisit.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.internshipStatusHistory.deleteMany();
  await prisma.internship.deleteMany();
  await prisma.agreement.deleteMany();
  await prisma.userCredential.deleteMany();
  await prisma.dataRequest.deleteMany();
  await prisma.inAppNotification.deleteMany();
  await prisma.user.deleteMany();
  await prisma.career.deleteMany();
  await prisma.company.deleteMany();
  await prisma.emailLog.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.systemLog.deleteMany();

  const password = await bcrypt.hash('password123', 10);
  const lopdp = { lopdpAccepted: true, lopdpAcceptedAt: daysAgo(60), lopdpVersion: '1.0' };

  // 2. Fundamentos de Gobernanza (Carreras)
  console.log('Estructurando Facultades y Carreras...');
  const careersData = [
    { name: 'Desarrollo de Software', faculty: 'Tecnologías de la Información', hours: 160 },
    { name: 'Ciberseguridad', faculty: 'Tecnologías de la Información', hours: 240 },
    { name: 'Electromecánica Automotriz', faculty: 'Ingeniería Aplicada', hours: 120 },
    { name: 'Administración de Empresas', faculty: 'Ciencias Administrativas', hours: 160 },
    { name: 'Marketing Digital', faculty: 'Ciencias Administrativas', hours: 160 },
  ];

  const careers: Career[] = [];
  for (const c of careersData) {
    careers.push(await prisma.career.create({ 
      data: { name: c.name, faculty: c.faculty, config: { requiredHours: c.hours } } 
    }));
  }

  const templates = [
    { name: 'F01 - Solicitud de Inicio', sortOrder: 1, isRequired: true },
    { name: 'F02 - Plan de Prácticas', sortOrder: 2, isRequired: true },
    { name: 'F03 - Registro de Asistencia', sortOrder: 3, isRequired: true },
    { name: 'F04 - Informe de Actividades', sortOrder: 4, isRequired: true },
    { name: 'F10 - Certificado Final', sortOrder: 10, isCertificateSlot: true }
  ];
  for (const t of templates) { await prisma.documentTemplate.create({ data: t }); }

  // 3. Ecosistema de Empresas
  console.log('Entidades y Convenios Corporativos (12+ Entidades)...');
  const companiesData = [
    { name: 'Telefónica Tech', ruc: '1791234567001', address: 'Quito, Ekopark', rep: 'Andrés Gallegos', email: 'rrhh@telefonica.com' },
    { name: 'Banco Pichincha', ruc: '1790011223001', address: 'Quito, Av. Amazonas', rep: 'Lucía Mendoza', email: 'talento@pichincha.com' },
    { name: 'Toyota Casabaca', ruc: '1799887766001', address: 'Quito, Los Chillos', rep: 'Mónica Ruiz', email: 'rrhh@casabaca.com' },
    { name: 'Kruger Corp', ruc: '1797766554001', address: 'Cumbayá, Paseo San Francisco', rep: 'Ernesto Kruger', email: 'hr@krugercorp.com' },
    { name: 'Corporación Favorita', ruc: '1791122334001', address: 'Quito, El Inca', rep: 'Ricardo Noboa', email: 'rrhh@favorita.ec' },
    { name: 'Ministerio de Telecomunicaciones', ruc: '1760000010001', address: 'Quito, 6 de Diciembre', rep: 'Galo Cevallos', email: 'rrhh@mintel.gob.ec' },
    { name: 'Thoughtworks Ecuador', ruc: '1794455667001', address: 'Quito, Shyris', rep: 'Ana Paredes', email: 'jobs@thoughtworks.com' },
  ];

  const companies: Company[] = [];
  for (const c of companiesData) {
    companies.push(await prisma.company.create({ 
      data: { ruc: c.ruc, name: c.name, address: c.address, representative: c.rep, email: c.email } 
    }));
  }

  for (const comp of companies) {
    await prisma.agreement.create({ 
      data: { companyId: comp.id, startDate: daysAgo(randInt(100, 730)), filePath: docUrl(`CONV_${comp.name}`), status: randInt(0, 5) === 0 ? 'Expirado' : 'Activo' } 
    });
  }

  // 4. Actores del Sistema
  console.log('Inyectando Identidades por Rol (Admin, Coord, Tutores, Estudiantes)...');
  await prisma.user.create({ data: { email: 'admin@istpet.edu.ec', password, fullName: 'Admin General', role: Role.ADMIN, ...lopdp } });
  
  const coordinators: User[] = [];
  for (let i = 1; i <= 3; i++) {
    coordinators.push(await prisma.user.create({ 
      data: { email: `coordinador${i}@istpet.edu.ec`, password, fullName: `Coordinador ${i}`, role: Role.COORDINADOR, ...lopdp } 
    }));
  }

  const tutorsAcad: User[] = [];
  for (let i = 0; i < 8; i++) {
    const career = careers[i % careers.length];
    tutorsAcad.push(await prisma.user.create({ 
      data: { email: `tutor.acad${i}@istpet.edu.ec`, password, fullName: getRandomName() + ' (Tutor Acad)', role: Role.TUTOR, careerId: career.id, ...lopdp } 
    }));
  }

  const tutorsEmp: User[] = [];
  for (let i = 0; i < companies.length; i++) {
    tutorsEmp.push(await prisma.user.create({ 
      data: { email: `supervisor@${companies[i].email.split('@')[1]}`, password, fullName: getRandomName() + ' (Supv. ' + companies[i].name + ')', role: Role.TUTOR_EMPRESARIAL, companyId: companies[i].id, ...lopdp } 
    }));
  }

  const students: User[] = [];
  for (let i = 0; i < 50; i++) {
    const career = careers[i % careers.length];
    students.push(await prisma.user.create({ 
      data: { email: `estudiante${i}@est.edu`, password, fullName: getRandomName(), role: Role.ESTUDIANTE, careerId: career.id, ...lopdp } 
    }));
  }

  // 5. Generación Espacial de Prácticas
  console.log('Modelando 50 Escenarios de Ciclo de Vida (Éxito, Riesgo, Inicio)...');
  
  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    const tutor = tutorsAcad[i % tutorsAcad.length];
    const company = companies[i % companies.length];
    const career = careers.find(c => c.id === s.careerId);
    const reqHours = (career?.config as any)?.requiredHours || 160;

    // Diferentes escenarios basados en el índice
    let status = 'En Proceso';
    let hoursCompleted = randInt(0, reqHours);
    let startOffset = randInt(10, 90);

    if (i < 10) { // Scenario: Finalized
      status = 'Finalizado';
      hoursCompleted = reqHours;
      startOffset = 120;
    } else if (i < 20) { // Scenario: High risk (lots of hours but few documents)
      status = 'En Proceso';
      hoursCompleted = Math.floor(reqHours * 0.8);
      startOffset = 60;
    } else if (i < 30) { // Scenario: Just starting
      status = 'En Proceso';
      hoursCompleted = 0;
      startOffset = 5;
    }

    const internship = await prisma.internship.create({
      data: {
        studentId: s.id, tutorId: tutor.id, companyId: company.id, careerId: s.careerId,
        startDate: daysAgo(startOffset), totalHours: reqHours, status, 
        location: i % 2 === 0 ? 'Presencial' : 'Híbrido',
        businessTutorName: getRandomName(),
        businessTutorEmail: `supervisor${i}@company.com`,
        allowedLocations: [
          { label: 'Sede Principal', lat: -0.16 + (i * 0.001), lng: -78.47 + (i * 0.001), radiusM: 250 }
        ]
      }
    });

    // 5.1 Historial de Estados de la Pasantía
    await prisma.internshipStatusHistory.create({
      data: {
        internshipId: internship.id,
        oldStatus: null,
        newStatus: 'En Proceso',
        changedById: s.id,
        createdAt: daysAgo(startOffset)
      }
    });

    if (status === 'Finalizado') {
      await prisma.internshipStatusHistory.create({
        data: {
          internshipId: internship.id,
          oldStatus: 'En Proceso',
          newStatus: 'Finalizado',
          changedById: tutor.id,
          createdAt: daysAgo(1)
        }
      });
    }

    // 6. Asistencias - Simular realismo
    if (status !== 'Just Started') {
      const numAtt = Math.min(Math.floor(hoursCompleted / 4), 20); // Simular hasta 20 días de asistencia
      for (let j = 0; j < numAtt; j++) {
        const checkInTime = daysAgo(startOffset - j);
        checkInTime.setHours(8, randInt(0, 30));
        const checkOutTime = new Date(checkInTime);
        checkOutTime.setHours(12 + randInt(0, 4));

        const att = await prisma.attendance.create({
          data: {
            internshipId: internship.id,
            checkIn: checkInTime,
            checkOut: (i === 15 && j === 0) ? null : checkOutTime, // Un registro olvidado (Riesgo)
            lat: -0.1601, lng: -78.4701, distanceKm: 0.05,
            checkInPhoto: photoUrl(`in-${internship.id}-${j}`),
            checkOutPhoto: photoUrl(`out-${internship.id}-${j}`)
          }
        });

        if (j % 5 === 0) {
          await prisma.activityPhoto.create({ data: { attendanceId: att.id, photoUrl: photoUrl(`work-${j}`), caption: 'Avance de proyecto fase ' + j } });
        }
      }
    }

    // 7. Documentación - El Hilo de la Verdad
    const docStatusMap = [
      DocumentStatus.APROBADO_DEFINITIVO,
      DocumentStatus.PENDIENTE,
      DocumentStatus.EN_REVISION_TUTOR,
      DocumentStatus.RECHAZADO_TUTOR
    ];

    if (i < 10) { // Todos aprobados para los finalizados
      for (const t of templates) {
        await prisma.document.create({
          data: { internshipId: internship.id, name: t.name, status: DocumentStatus.APROBADO_DEFINITIVO, filePath: docUrl(t.name + '_' + s.fullName) }
        });
      }
    } else {
      // Documentos mixtos para el resto
      await prisma.document.create({
        data: { internshipId: internship.id, name: 'F01 - Solicitud de Inicio', status: DocumentStatus.APROBADO_DEFINITIVO, filePath: docUrl('F01_' + s.fullName) }
      });

      if (i % 5 === 0) {
         const d = await prisma.document.create({
           data: { internshipId: internship.id, name: 'F02 - Plan de Prácticas', status: DocumentStatus.RECHAZADO_TUTOR, filePath: docUrl('F02_V1_' + s.fullName) }
         });
         await prisma.documentComment.create({ data: { documentId: d.id, userId: tutor.id, content: 'Los objetivos no son medibles. Favor corregir usando SMART.' } });
         await prisma.documentVersion.create({ data: { documentId: d.id, filePath: docUrl('F02_V0_OLD'), observations: 'Versión inicial con errores.' } });
      } else if (i % 3 === 0) {
        await prisma.document.create({
          data: { internshipId: internship.id, name: 'F02 - Plan de Prácticas', status: DocumentStatus.EN_REVISION_TUTOR, filePath: docUrl('F02_' + s.fullName) }
        });
      }
    }

    // 8. Evaluaciones y Visitas
    if (hoursCompleted > 40) {
      await prisma.monitoringVisit.create({
        data: { internshipId: internship.id, date: daysAgo(5), type: 'PRESENCIAL', observations: 'El estudiante se integra bien al equipo técnico.' }
      });
    }

    if (status === 'Finalizado') {
      await prisma.evaluation.create({
        data: {
          internshipId: internship.id, type: EvaluationType.EMPRESARIAL, status: 'COMPLETADO',
          punctuality: 5, teamwork: 5, technicalSkills: randInt(4, 5), proactivity: 5, attitude: 5, observations: 'Excelente aporte al departamento.'
        }
      });
      await prisma.evaluation.create({
        data: {
          internshipId: internship.id, type: EvaluationType.ACADEMICA, status: 'COMPLETADO',
          punctuality: 5, teamwork: 4, technicalSkills: 5, proactivity: 4, attitude: 5, observations: 'Cumple con los requisitos académicos.'
        }
      });
    }
  }

  // 9. Auditoría Masiva (1200+ Logs)
  console.log('Inyectando 1200+ Logs de Auditoría para Análisis de Salud...');
  const cats = ['AUTH', 'HTTP', 'SYSTEM', 'PRIVACY', 'GPS'];
  const logs: Prisma.SystemLogCreateManyInput[] = [];
  for (let i = 0; i < 1200; i++) {
    logs.push({
      level: i % 50 === 0 ? 'ERROR' : i % 20 === 0 ? 'WARN' : 'INFO',
      category: cats[i % 5],
      message: `Evento de Sistema ID-${i}: ${i % 3 === 0 ? 'Sincronización exitosa' : 'Acceso a módulo detectado'}`,
      actorEmail: 'admin@istpet.edu.ec',
      statusCode: i % 50 === 0 ? 500 : 200,
      durationMs: randInt(50, 1500),
      createdAt: daysAgo(randInt(0, 60))
    });
    if (logs.length >= 100) {
      await prisma.systemLog.createMany({ data: logs });
      logs.length = 0;
    }
  }

  // 10. Email Logs (Correos enviados por el sistema)
  console.log('Simulando Historial de Correos (Email Logs)...');
  const emailLogs: Prisma.EmailLogCreateManyInput[] = [];
  for (let i = 0; i < 50; i++) {
    emailLogs.push({
      to: `estudiante${i}@est.edu`,
      subject: i % 4 === 0 ? 'Alerta: Documento Rechazado' : 'Notificación de Prácticas',
      status: i % 10 === 0 ? 'FALLIDO' : 'EXITO',
      error: i % 10 === 0 ? 'MTA Connection timeout' : null,
      sentAt: daysAgo(randInt(1, 30)),
      metadata: { reason: 'System Event' }
    });
  }
  await prisma.emailLog.createMany({ data: emailLogs });

  // 11. Gobernanza Final (Notificaciones, Anuncios, Ajustes)
  console.log('Sellando con Gobernanza, Notificaciones y LOPDP...');
  
  await prisma.announcement.createMany({ data: [
    { title: 'BIENVENIDOS AL PERIODO 2026-A', content: 'Iniciamos el nuevo ciclo de prácticas. No olviden cargar su F01 antes del viernes.', type: 'INFO', startDate: daysAgo(5) },
    { title: '️ MANTENIMIENTO PROGRAMADO', content: 'La plataforma estará fuera de servicio el sábado de 02:00 a 04:00 por actualización de seguridad.', type: 'WARNING', startDate: daysAgo(1) },
    { title: 'PROCESO DE EVALUACIÓN ABIERTO', content: 'Tutores empresariales ya pueden calificar a sus pasantes asignados.', type: 'SUCCESS', startDate: daysAgo(2) }
  ]});

  for (let i = 0; i < 10; i++) {
    await prisma.inAppNotification.create({
      data: { userId: students[i].id, title: 'Recordatorio', message: 'Tienes documentos pendientes por subir.', type: 'WARNING' }
    });
  }

  await prisma.dataRequest.create({ data: { userId: students[0].id, type: 'ACCESO', details: 'Solicito copia de mis datos personales según LOPDP.', status: 'COMPLETADA', response: 'Datos enviados al correo institucional.' } });
  await prisma.dataRequest.create({ data: { userId: students[1].id, type: 'CANCELACION', details: 'Solicito eliminación de cuenta por retiro de la carrera.', status: 'PENDIENTE' } });

  await prisma.systemSetting.createMany({ data: [
    { key: 'attendance_radius', value: '250', category: 'GPS', description: 'Radio permitido para marcaje en metros' },
    { key: 'session_timeout', value: '7200', category: 'AUTH', description: 'Tiempo de sesión en segundos' },
    { key: 'smtp_host', value: 'smtp.istpet.edu.ec', category: 'EMAIL' }
  ]});

  console.log('\nMASTER SEED v11.0 FINALIZADO EXITOSAMENTE.');
  console.log('──────────────────────────────────────────────────────');
  console.log(`Resumen: 50 Estudiantes | ${companiesData.length} Empresas | 1200+ Logs | Pasantías (Historial Completo) | +50 Correos Simulados`);
}

main()
  .catch((e) => { console.error('Error fatal en seed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
