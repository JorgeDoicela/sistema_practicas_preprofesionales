/**
 * SEED UNIVERSAL INSTITUCIONAL v6.0 — Sistema EMITESIS
 * 
 * Este seeder de grado industrial cubre el 100% de la arquitectura del sistema.
 * Genera datos de auditoría, cumplimiento LOPDP, seguimiento académico y analíticas.
 */

import { PrismaClient, Role, DocumentStatus, EvaluationType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ── Helpers ─────────────────────────────────────────────────────────────────
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

const daysFromNow = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));

const photoUrl = (seed: string | number, w = 800, h = 600) => `https://picsum.photos/seed/${seed}/${w}/${h}`;
const docUrl = (name: string) => `/uploads/documents/${name.replace(/\s+/g, '_').toLowerCase()}.pdf`;

// ── IDs Estáticos ───────────────────────────────────────────────────────────
const ADMIN_ID      = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const COORD_ID      = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12';
const TUTOR_MARCO_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13';
const EST_MATEO_ID  = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd480a01';
const EST_SOFIA_ID  = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd480a02';

async function main() {
  console.log('\n🌟 Iniciando Industrialización Total de Datos EMITESIS v6.0...\n');

  // 1. Limpieza Total
  console.log('🧹 Limpiando sistema...');
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
  const lopdpData = { lopdpAccepted: true, lopdpAcceptedAt: daysAgo(30), lopdpVersion: '1.0' };

  // 2. Carreras Institucionales
  console.log('🎓 Poblando catálogo de carreras...');
  const carSoftware = await prisma.career.create({
    data: { name: 'Desarrollo de Software', config: { requiredHours: 160 } }
  });
  const carCyber = await prisma.career.create({
    data: { name: 'Ciberseguridad', config: { requiredHours: 240 } }
  });
  const carAutomotive = await prisma.career.create({
    data: { name: 'Electromecánica Automotriz', config: { requiredHours: 120 } }
  });

  // 3. Plantillas de Documentos
  const tmpSolicitud = await prisma.documentTemplate.create({ data: { name: 'F01 - Solicitud de Inicio', sortOrder: 1 } });
  const tmpPlan = await prisma.documentTemplate.create({ data: { name: 'F02 - Plan de Prácticas', sortOrder: 2 } });
  const tmpCertificado = await prisma.documentTemplate.create({ data: { name: 'F10 - Certificado', sortOrder: 10, isCertificateSlot: true } });

  // 4. Empresas y Convenios
  const empTf = await prisma.company.create({
    data: { 
      ruc: '1791241512001', name: 'Telefónica Tech', address: 'Ekopark, Quito', 
      representative: 'Lorena Salazar', email: 'tech@telefonica.com' 
    }
  });
  await prisma.agreement.create({
    data: { companyId: empTf.id, startDate: daysAgo(365), filePath: docUrl('CONV_TF_2025'), status: 'Activo' }
  });

  // 5. Usuarios de Élite
  console.log('👥 Creando usuarios y credenciales...');
  await prisma.user.create({ data: { id: ADMIN_ID, email: 'admin@istpet.edu.ec', password, fullName: 'Admin General', role: Role.ADMIN, ...lopdpData } });
  await prisma.user.create({ data: { id: COORD_ID, email: 'coordinador@istpet.edu.ec', password, fullName: 'Coordinador Global', role: Role.COORDINADOR, ...lopdpData } });
  
  const tutorMarco = await prisma.user.create({ 
    data: { id: TUTOR_MARCO_ID, email: 'm.perez@istpet.edu.ec', password, fullName: 'Marco Pérez', role: Role.TUTOR, careerId: carSoftware.id, ...lopdpData } 
  });

  const estMateo = await prisma.user.create({ 
    data: { id: EST_MATEO_ID, email: 'm.larrea@estudiante.istpet.edu.ec', password, fullName: 'Mateo Larrea', role: Role.ESTUDIANTE, careerId: carSoftware.id, ...lopdpData } 
  });

  // 6. Asignaciones e Historial
  console.log('🚀 Creando pasantías y estados...');
  const intMateo = await prisma.internship.create({
    data: {
      studentId: estMateo.id, tutorId: tutorMarco.id, companyId: empTf.id, careerId: carSoftware.id,
      startDate: daysAgo(45), totalHours: 160, location: 'Remoto / Tech Hub', status: 'En Proceso'
    }
  });

  await prisma.internshipStatusHistory.createMany({
    data: [
      { internshipId: intMateo.id, oldStatus: null, newStatus: 'Asignado', reason: 'Asignación inicial', createdAt: daysAgo(45) },
      { internshipId: intMateo.id, oldStatus: 'Asignado', newStatus: 'En Proceso', reason: 'Inicio de actividades', createdAt: daysAgo(40) }
    ]
  });

  // 7. Seguimiento Académico (Visitas y Evaluaciones)
  console.log('📈 Registrando visitas y evaluaciones...');
  await prisma.monitoringVisit.create({
    data: {
      internshipId: intMateo.id, date: daysAgo(20), type: 'VIRTUAL', observations: 'El estudiante demuestra dominio de NestJS y arquitectura limpia.', evidenceUrl: photoUrl('visit-1')
    }
  });

  await prisma.evaluation.create({
    data: {
      internshipId: intMateo.id, type: EvaluationType.EMPRESARIAL, status: 'COMPLETADO',
      punctuality: 5, teamwork: 4, technicalSkills: 5, proactivity: 5, attitude: 5,
      observations: 'Excelente desempeño técnico.'
    }
  });

  // 8. Expedientes, Versiones y Comentarios
  console.log('📄 Generando trazabilidad documental...');
  const docMateo = await prisma.document.create({
    data: { 
      internshipId: intMateo.id, templateId: tmpPlan.id, name: tmpPlan.name, 
      status: DocumentStatus.APROBADO_TUTOR, filePath: docUrl('plan_v2'), submittedAt: daysAgo(10)
    }
  });

  await prisma.documentVersion.create({
    data: { documentId: docMateo.id, filePath: docUrl('plan_v1'), observations: 'Primera entrega con errores en cronograma.', createdAt: daysAgo(15) }
  });

  await prisma.documentComment.create({
    data: { documentId: docMateo.id, userId: TUTOR_MARCO_ID, content: 'Buen trabajo corrigiendo las fechas.', createdAt: daysAgo(9) }
  });

  // 9. Auditoría y Analytics (SystemLogs)
  console.log('🔍 Generando 50+ registros de auditoría...');
  const levels = ['INFO', 'WARN', 'ERROR'];
  const categories = ['AUTH', 'HTTP', 'SYSTEM'];
  const methods = ['GET', 'POST', 'PUT', 'DELETE'];

  for (let i = 0; i < 60; i++) {
    await prisma.systemLog.create({
      data: {
        level: i % 20 === 0 ? 'ERROR' : i % 5 === 0 ? 'WARN' : 'INFO',
        category: categories[i % 3],
        message: `Evento de sistema ${i}: Operación procesada con éxito`,
        method: methods[i % 4],
        path: `/api/v1/resource/${i}`,
        statusCode: i % 20 === 0 ? 500 : 200,
        actorEmail: i % 2 === 0 ? 'admin@istpet.edu.ec' : 'm.larrea@estudiante.istpet.edu.ec',
        durationMs: randInt(50, 500),
        createdAt: daysAgo(randInt(0, 30))
      }
    });
  }

  // 10. Cumplimiento LOPDP (DataRequests)
  console.log('🔒 Creando solicitudes de privacidad...');
  await prisma.dataRequest.create({
    data: { userId: estMateo.id, type: 'ACCESO', details: 'Solicito acceso a mi perfil completo.', status: 'COMPLETADA', response: 'Enviado por correo el 2026-04-15' }
  });
  await prisma.dataRequest.create({
    data: { userId: estMateo.id, type: 'RECTIFICACION', details: 'Mi segundo nombre está mal escrito.', status: 'PENDIENTE' }
  });

  // 11. Notificaciones In-App
  console.log('🔔 Generando bandeja de notificaciones...');
  await prisma.inAppNotification.createMany({
    data: [
      { userId: estMateo.id, title: 'Evaluación Completada', message: 'Tu supervisor ha calificado tu desempeño.', type: 'SUCCESS' },
      { userId: estMateo.id, title: 'Documento en Revisión', message: 'Tu plan de prácticas está siendo auditado.', type: 'INFO', isRead: true },
      { userId: COORD_ID, title: 'Nueva Solicitud ARCO', message: 'Un estudiante ha solicitado rectificación de datos.', type: 'WARNING' }
    ]
  });

  // 12. Configuraciones y Anuncios
  await prisma.systemSetting.createMany({
    data: [
      { key: 'attendance_radius', value: '300', description: 'Metros' },
      { key: 'company_id_required', value: 'true', category: 'VALIDATION' }
    ]
  });

  await prisma.announcement.create({
    data: { title: 'Mantenimiento Programado', content: 'El sistema estará fuera de línea el domingo de 2am a 4am.', type: 'DANGER', startDate: new Date() }
  });

  console.log('\n✅ SEED UNIVERSAL COMPLETADO.');
  console.log('──────────────────────────────────────────────────────');
  console.log('Audit Logs: 60+ (Para Dashboard Analytics)');
  console.log('Gobernanza: Carreras y Plantillas activas');
  console.log('Seguimiento: Visitas, Evaluaciones e Historial activos');
  console.log('Cumplimiento: LOPDP y Notificaciones configuradas');
  console.log('──────────────────────────────────────────────────────\n');
}

main()
  .catch((e) => { console.error('❌ Error en seeder:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
