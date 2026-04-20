/**
 * MASTER SEED INSTITUCIONAL v10.0 — SISTEMA EMITESIS (REFLEJO TOTAL)
 * 
 * Cobertura: 100% Schema, 100% Reglas de Negocio, Escenarios de Riesgo y Analítica.
 */

import { PrismaClient, Role, DocumentStatus, EvaluationType } from '@prisma/client';
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

async function main() {
  console.log('\n💎  INICIANDO INYECCIÓN MAESTRA EMITESIS v10.0...');
  console.log('──────────────────────────────────────────────────────');

  // 1. Limpieza de Seguridad
  console.log('🧹 Sincronizando Purga de Datos...');
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
  const lopdp = { lopdpAccepted: true, lopdpAcceptedAt: daysAgo(30), lopdpVersion: '1.0' };

  // 2. Fundamentos de Gobernanza (Carreras)
  console.log('🎓 Estructurando Carreras y Plantillas...');
  const carSoftware = await prisma.career.create({ data: { name: 'Desarrollo de Software', config: { requiredHours: 160 } } });
  const carCyber = await prisma.career.create({ data: { name: 'Ciberseguridad', config: { requiredHours: 240 } } });
  const carAutomotive = await prisma.career.create({ data: { name: 'Electromecánica Automotriz', config: { requiredHours: 120 } } });

  const templates = [
    { name: 'F01 - Solicitud de Inicio', sortOrder: 1, isRequired: true },
    { name: 'F02 - Plan de Prácticas', sortOrder: 2, isRequired: true },
    { name: 'F03 - Registro de Asistencia', sortOrder: 3, isRequired: true },
    { name: 'F10 - Certificado Final', sortOrder: 10, isCertificateSlot: true }
  ];
  for (const t of templates) { await prisma.documentTemplate.create({ data: t }); }
  
  // Plantilla específica para Software
  await prisma.documentTemplate.create({ 
    data: { name: 'Anexo S - Repositorio de Código', careerId: carSoftware.id, sortOrder: 5, isRequired: true } 
  });

  // 3. Ecosistema de Empresas
  console.log('🏢 Entidades y Convenios Corporativos...');
  const empTech = await prisma.company.create({ 
    data: { ruc: '1791234567001', name: 'Telefónica Tech', address: 'Quito, Ekopark', representative: 'Andrés Gallegos', email: 'rrhh@telefonica.com' } 
  });
  const empToyota = await prisma.company.create({ 
    data: { ruc: '1799887766001', name: 'Toyota Casabaca', address: 'Quito, Av. Amazonas', representative: 'Mónica Ruiz', email: 'rrhh@casabaca.com' } 
  });
  
  await prisma.agreement.create({ data: { companyId: empTech.id, startDate: daysAgo(365), filePath: docUrl('CONV_TELEFONICA'), status: 'Activo' } });
  await prisma.agreement.create({ data: { companyId: empToyota.id, startDate: daysAgo(730), filePath: docUrl('CONV_TOYOTA'), status: 'Expirado' } });

  // 4. Actores del Sistema (Identidades)
  console.log('👥 Inyectando Identidades por Rol...');
  await prisma.user.create({ data: { email: 'admin@istpet.edu.ec', password, fullName: 'Admin General', role: Role.ADMIN, ...lopdp } });
  await prisma.user.create({ data: { email: 'coordinador@istpet.edu.ec', password, fullName: 'Coordinador Global', role: Role.COORDINADOR, ...lopdp } });
  
  const tutAcad = await prisma.user.create({ data: { email: 'm.perez@istpet.edu.ec', password, fullName: 'Marco Pérez (Tutor Acad)', role: Role.TUTOR, careerId: carSoftware.id, ...lopdp } });
  
  const tutEmp = await prisma.user.create({ 
    data: { email: 'l.salazar@tech.com', password, fullName: 'Lorena Salazar (Supervisor Tech)', role: Role.TUTOR_EMPRESARIAL, companyId: empTech.id, ...lopdp } 
  });
  const empUser = await prisma.user.create({ 
    data: { email: 'rrhh@tech.com', password, fullName: 'Admin Telefónica', role: Role.EMPRESA, companyId: empTech.id, ...lopdp } 
  });

  const estMateo = await prisma.user.create({ data: { email: 'm.mateo@est.edu', password, fullName: 'Mateo Larrea (Software)', role: Role.ESTUDIANTE, careerId: carSoftware.id, ...lopdp } });
  const estSofia = await prisma.user.create({ data: { email: 's.sofia@est.edu', password, fullName: 'Sofía Vaca (Cyber - Riesgo)', role: Role.ESTUDIANTE, careerId: carCyber.id, ...lopdp } });
  const estJuan = await prisma.user.create({ data: { email: 'j.juan@est.edu', password, fullName: 'Juan Ortiz (Finalizado)', role: Role.ESTUDIANTE, careerId: carAutomotive.id, ...lopdp } });

  // 5. Escenarios de Pasantías (Riesgo y Éxito)
  console.log('🚀 Modelando Escenarios de Riesgo y Éxito...');
  
  // Mateo: ÉXITO (Software)
  const intMateo = await prisma.internship.create({
    data: {
      studentId: estMateo.id, tutorId: tutAcad.id, companyId: empTech.id, careerId: carSoftware.id,
      startDate: daysAgo(40), totalHours: 160, status: 'En Proceso', location: 'Remoto',
      allowedLocations: [
        { label: 'Matriz Ekopark', lat: -0.165, lng: -78.471, radiusM: 200 },
        { label: 'Sede Sur', lat: -0.300, lng: -78.550, radiusM: 500 }
      ]
    }
  });

  // Sofia: RIESGO (Cyber)
  const intSofia = await prisma.internship.create({
    data: {
      studentId: estSofia.id, tutorId: tutAcad.id, companyId: empTech.id, careerId: carCyber.id,
      startDate: daysAgo(60), totalHours: 240, status: 'En Proceso', location: 'Oficina Central'
    }
  });

  // Juan: FINALIZADO (Automotriz)
  const intJuan = await prisma.internship.create({
    data: {
      studentId: estJuan.id, tutorId: tutAcad.id, companyId: empToyota.id, careerId: carAutomotive.id,
      startDate: daysAgo(120), totalHours: 120, status: 'Finalizado', location: 'Taller Norte'
    }
  });

  // 6. Asistencia y Evidencia Visual
  console.log('📸 Poblando Fotos de Actividades y Geocercas...');
  for (let i = 0; i < 20; i++) {
    const att = await prisma.attendance.create({
      data: {
        internshipId: intMateo.id, checkIn: daysAgo(20 - i), checkOut: daysAgo(20 - i),
        lat: -0.165, lng: -78.471, distanceKm: 0.05,
        checkInPhoto: photoUrl(`in-${i}`), checkOutPhoto: photoUrl(`out-${i}`)
      }
    });
    if (i % 2 === 0) {
      await prisma.activityPhoto.create({ data: { attendanceId: att.id, photoUrl: photoUrl(`work-${i}`), caption: 'Desarrollo de microservicios' } });
    }
  }

  // 7. Seguimiento y Evaluaciones
  console.log('📈 Registrando Visitas y Notas del Supervisor...');
  await prisma.monitoringVisit.create({
    data: { internshipId: intMateo.id, date: daysAgo(10), type: 'PRESENCIAL', observations: 'Desempeño técnico sobresaliente.', evidenceUrl: photoUrl('visit1') }
  });

  await prisma.evaluation.create({
    data: {
      internshipId: intMateo.id, type: EvaluationType.EMPRESARIAL, status: 'COMPLETADO',
      punctuality: 5, teamwork: 5, technicalSkills: 5, proactivity: 5, attitude: 5, observations: 'Pasante con futuro en la empresa.'
    }
  });

  // 8. Trazabilidad Documental (El Hilo de Feedback)
  console.log('📄 Generando Hilos de Conversación y Versiones...');
  const docSofia = await prisma.document.create({
    data: { internshipId: intSofia.id, name: 'F02 - Plan de Prácticas', status: 'RECHAZADO_TUTOR', filePath: docUrl('plan_sofia_v1') }
  });
  await prisma.documentVersion.create({ data: { documentId: docSofia.id, filePath: docUrl('plan_sofia_v1_old'), observations: 'Faltan objetivos' } });
  await prisma.documentComment.create({ data: { documentId: docSofia.id, userId: tutAcad.id, content: 'Por favor añade los KPI de seguridad solicitados.' } });

  // 9. Auditoría Institucional (Logs Masivos)
  console.log('🔍 Inyectando 200+ Logs de Auditoría para Analytics...');
  const cats = ['AUTH', 'HTTP', 'SYSTEM', 'PRIVACY', 'GPS'];
  const levels = ['INFO', 'WARN', 'ERROR'];
  for (let i = 0; i < 200; i++) {
    await prisma.systemLog.create({
      data: {
        level: i % 10 === 0 ? 'ERROR' : i % 5 === 0 ? 'WARN' : 'INFO',
        category: cats[i % 5], message: `Evento ${i}: Acceso institucional detectado`,
        actorEmail: 'admin@istpet.edu.ec', statusCode: 200, durationMs: randInt(100, 1000),
        createdAt: daysAgo(randInt(0, 30))
      }
    });
  }

  // 10. Cumplimiento, Notificaciones y Ajustes
  console.log('🔒 Seteando Privacidad (PIA), Notificaciones y Ajustes...');
  await prisma.dataRequest.create({ data: { userId: estMateo.id, type: 'ACCESO', details: 'Solicitud ARCO perfil completo', status: 'COMPLETADA' } });
  
  await prisma.inAppNotification.createMany({ data: [
    { userId: estMateo.id, title: 'Documento Rechazado', message: 'Tu tutor ha enviado comentarios al Plan de Prácticas.', type: 'ERROR' },
    { userId: tutAcad.id, title: 'Nueva Evaluación', message: 'Telefónica ha calificado a Mateo Larrea.', type: 'SUCCESS' }
  ]});

  await prisma.systemSetting.createMany({ data: [
    { key: 'attendance_radius', value: '250', category: 'GPS' },
    { key: 'session_timeout', value: '3600', category: 'AUTH' }
  ]});

  console.log('\n✅ MASTER SEED v10.0 FINALIZADO EXITOSAMENTE.');
  console.log('──────────────────────────────────────────────────────');
  console.log('Audit Logs: 200+ | Escenarios: Éxito vs Riesgo');
}

main()
  .catch((e) => { console.error('❌ Error fatal en seed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
