/**
 * SEED COMPLETO — Sistema de Prácticas Preprofesionales ISTPET
 *
 * Cubre todos los módulos implementados:
 *   RF-01 a RF-07  → Empresas, evaluaciones, test de aptitud
 *   RF-08 a RF-12  → Documentos con fechas, estados y recordatorios
 *   RF-13 a RF-17  → Asistencia georreferenciada, fotos, actividades
 *   RF-18 / RF-19  → Solo infraestructura (IA y confirmación doble son UI)
 */

import { PrismaClient, Role, DocumentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Genera una fecha resta-días desde hoy */
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
};

/** Genera una fecha suma-días desde hoy */
const daysFromNow = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(0, 0, 0, 0);
  return d;
};

/** Hora fija en una fecha */
const withTime = (date: Date, h: number, m: number) => {
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
};

/** Número aleatorio entre min y max */
const rand = (min: number, max: number) =>
  min + Math.random() * (max - min);

/** Número aleatorio entero */
const randInt = (min: number, max: number) =>
  Math.floor(rand(min, max + 1));

/** Genera días laborables (lun-vie) entre startDaysAgo y endDaysAgo */
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

/** URL de foto placeholder de Picsum */
const photoUrl = (seed: string | number, w = 800, h = 600) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

/** URL placeholder de documento PDF */
const docUrl = (name: string) =>
  `/uploads/documents/${name.replace(/\s+/g, '_').toLowerCase()}.pdf`;

// ── Datos base ────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱  Iniciando seed completo del sistema ISTPET...\n');

  // ─── Limpieza en orden inverso de dependencias ───────────────────────────
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

  console.log('🗑️   Base de datos limpia.');

  const password = await bcrypt.hash('password123', 10);

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. EMPRESAS (con coordenadas GPS reales para RF-13)
  // ═══════════════════════════════════════════════════════════════════════════

  const [empBanco, empCNT, empMunicipioQ, empMineduc] = await Promise.all([
    prisma.company.create({
      data: {
        ruc: '1790012345001',
        name: 'Banco del Pacífico S.A.',
        address: 'Av. Naciones Unidas E7-61 y Amazonas, Quito',
        representative: 'Ing. Fernanda Castellanos',
        email: 'practicas@bancopacífico.com',
      },
    }),
    prisma.company.create({
      data: {
        ruc: '1768100690001',
        name: 'CNT Ecuador (Corporación Nacional de Telecomunicaciones)',
        address: 'Av. 6 de Diciembre N25-75 y Colón, Quito',
        representative: 'Ing. Marco Salazar',
        email: 'rrhh@cnt.gob.ec',
      },
    }),
    prisma.company.create({
      data: {
        ruc: '1760002630001',
        name: 'Municipio del Distrito Metropolitano de Quito',
        address: 'Espejo S1-07 y Venezuela, Centro Histórico, Quito',
        representative: 'Lic. Rosa Andrade',
        email: 'practicantes@quito.gob.ec',
      },
    }),
    prisma.company.create({
      data: {
        ruc: '1760001550001',
        name: 'Ministerio de Educación del Ecuador',
        address: 'Av. Amazonas N34-451 y Atahualpa, Quito',
        representative: 'Msc. Patricia Lema',
        email: 'practicantes@educacion.gob.ec',
      },
    }),
  ]);

  console.log('🏢  Empresas creadas.');

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. USUARIOS
  // ═══════════════════════════════════════════════════════════════════════════

  // Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@istpet.edu.ec',
      password,
      fullName: 'Administrador General ISTPET',
      role: Role.ADMIN,
    },
  });

  // Coordinadores
  const [coordCristofer, coordDiana] = await Promise.all([
    prisma.user.create({
      data: {
        email: 'coordinador@istpet.edu.ec',
        password,
        fullName: 'Cristhofer Steve Parreño Poma',
        role: Role.COORDINADOR,
      },
    }),
    prisma.user.create({
      data: {
        email: 'coordinadora2@istpet.edu.ec',
        password,
        fullName: 'Diana Marcela Torres Heredia',
        role: Role.COORDINADOR,
      },
    }),
  ]);

  // Tutores académicos
  const [tutorMarcos, tutorRoberto, tutorSilvia] = await Promise.all([
    prisma.user.create({
      data: {
        email: 'tutor.marcos@istpet.edu.ec',
        password,
        fullName: 'Marcos Alejandro Pérez Vásquez',
        role: Role.TUTOR,
      },
    }),
    prisma.user.create({
      data: {
        email: 'tutor.roberto@istpet.edu.ec',
        password,
        fullName: 'Roberto Javier Mora Sánchez',
        role: Role.TUTOR,
      },
    }),
    prisma.user.create({
      data: {
        email: 'tutor.silvia@istpet.edu.ec',
        password,
        fullName: 'Silvia Gabriela Endara Quilca',
        role: Role.TUTOR,
      },
    }),
  ]);

  // Estudiantes
  const [
    estCarlos, estMaria, estJuan, estAndrea,
    estDiego, estValeria, estLuis, estPatricia,
  ] = await Promise.all([
    prisma.user.create({ data: { email: 'c.guaman@estudiante.istpet.edu.ec', password, fullName: 'Carlos Andrés Guamán Pilco', role: Role.ESTUDIANTE } }),
    prisma.user.create({ data: { email: 'm.quispe@estudiante.istpet.edu.ec', password, fullName: 'María José Quispe Condor', role: Role.ESTUDIANTE } }),
    prisma.user.create({ data: { email: 'j.lema@estudiante.istpet.edu.ec', password, fullName: 'Juan Diego Lema Cárdenas', role: Role.ESTUDIANTE } }),
    prisma.user.create({ data: { email: 'a.salinas@estudiante.istpet.edu.ec', password, fullName: 'Andrea Sofía Salinas Reyes', role: Role.ESTUDIANTE } }),
    prisma.user.create({ data: { email: 'd.vargas@estudiante.istpet.edu.ec', password, fullName: 'Diego Fabricio Vargas Narváez', role: Role.ESTUDIANTE } }),
    prisma.user.create({ data: { email: 'v.torres@estudiante.istpet.edu.ec', password, fullName: 'Valeria Alexandra Torres Aguilar', role: Role.ESTUDIANTE } }),
    prisma.user.create({ data: { email: 'l.quishpe@estudiante.istpet.edu.ec', password, fullName: 'Luis Fernando Quishpe Tipán', role: Role.ESTUDIANTE } }),
    prisma.user.create({ data: { email: 'p.vega@estudiante.istpet.edu.ec', password, fullName: 'Patricia Elizabeth Vega Molina', role: Role.ESTUDIANTE } }),
  ]);

  // Usuarios empresa (RF-06: portal empresa)
  const [userBanco, userCNT, userMuni, userMined] = await Promise.all([
    prisma.user.create({ data: { email: 'practicas@bancopacífico.com', password, fullName: 'Ing. Fernanda Castellanos', role: Role.EMPRESA, companyId: empBanco.id } }),
    prisma.user.create({ data: { email: 'rrhh@cnt.gob.ec', password, fullName: 'Ing. Marco Salazar', role: Role.EMPRESA, companyId: empCNT.id } }),
    prisma.user.create({ data: { email: 'practicantes@quito.gob.ec', password, fullName: 'Lic. Rosa Andrade', role: Role.EMPRESA, companyId: empMunicipioQ.id } }),
    prisma.user.create({ data: { email: 'practicantes@educacion.gob.ec', password, fullName: 'Msc. Patricia Lema', role: Role.EMPRESA, companyId: empMineduc.id } }),
  ]);

  // Tutor empresarial (misma empresa que RRHH; rol distinto para permisos y demo)
  await prisma.user.create({
    data: {
      email: 'tutor.empresarial@bancopacifico.com',
      password,
      fullName: 'Ing. Roberto Méndez (Tutor Empresarial)',
      role: Role.TUTOR_EMPRESARIAL,
      companyId: empBanco.id,
    },
  });

  console.log('👥  Usuarios creados.');

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. CONVENIOS (RF-02: módulo de convenios)
  // ═══════════════════════════════════════════════════════════════════════════

  await Promise.all([
    prisma.agreement.create({ data: { companyId: empBanco.id, startDate: daysAgo(180), filePath: docUrl('convenio_banco_pacifico_2025'), status: 'Activo' } }),
    prisma.agreement.create({ data: { companyId: empCNT.id, startDate: daysAgo(120), filePath: docUrl('convenio_cnt_2025'), status: 'Activo' } }),
    prisma.agreement.create({ data: { companyId: empMunicipioQ.id, startDate: daysAgo(90), filePath: docUrl('convenio_municipio_quito_2026'), status: 'Activo' } }),
    prisma.agreement.create({ data: { companyId: empMineduc.id, startDate: daysAgo(60), filePath: docUrl('convenio_mineduc_2026'), status: 'Activo' } }),
  ]);

  console.log('📄  Convenios creados.');

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. ASIGNACIONES (Internships)
  //    Coordenadas GPS reales de Quito para la geovalla RF-13
  // ═══════════════════════════════════════════════════════════════════════════

  // Banco del Pacífico — Av. Naciones Unidas, Quito
  const GPS_BANCO    = { lat: -0.1768, lng: -78.4845 };
  // CNT — Av. 6 de Diciembre, Quito
  const GPS_CNT      = { lat: -0.2064, lng: -78.4965 };
  // Municipio Quito — Centro histórico
  const GPS_MUNI     = { lat: -0.2203, lng: -78.5125 };
  // Ministerio de Educación — Av. Amazonas, Quito
  const GPS_MINEDUC  = { lat: -0.2144, lng: -78.4941 };

  // Carlos Guamán → Banco Pacífico (Buen progreso, EN PROCESO)
  const intCarlos = await prisma.internship.create({
    data: {
      studentId: estCarlos.id,
      tutorId: tutorMarcos.id,
      companyId: empBanco.id,
      startDate: daysAgo(75),
      endDate: daysFromNow(45),
      totalHours: 480,
      location: 'Banco del Pacífico — Av. Naciones Unidas, Quito',
      businessTutorName: 'Ing. Hernán Mosquera',
      businessTutorEmail: 'h.mosquera@bancopacífico.com',
      ...GPS_BANCO,
      testEnabled: true,
      status: 'En Proceso',
    },
  });

  // María Quispe → CNT (Buen avance, EN PROCESO)
  const intMaria = await prisma.internship.create({
    data: {
      studentId: estMaria.id,
      tutorId: tutorMarcos.id,
      companyId: empCNT.id,
      startDate: daysAgo(60),
      endDate: daysFromNow(60),
      totalHours: 480,
      location: 'CNT Ecuador — Av. 6 de Diciembre, Quito',
      businessTutorName: 'Ing. Lorena Hidalgo',
      businessTutorEmail: 'l.hidalgo@cnt.gob.ec',
      ...GPS_CNT,
      testEnabled: true,
      status: 'En Proceso',
    },
  });

  // Juan Lema → Banco Pacífico (Informe rechazado, resubmitido)
  const intJuan = await prisma.internship.create({
    data: {
      studentId: estJuan.id,
      tutorId: tutorRoberto.id,
      companyId: empBanco.id,
      startDate: daysAgo(70),
      endDate: daysFromNow(50),
      totalHours: 480,
      location: 'Banco del Pacífico — Dirección de TI',
      businessTutorName: 'Ing. Hernán Mosquera',
      businessTutorEmail: 'h.mosquera@bancopacífico.com',
      ...GPS_BANCO,
      testEnabled: false,
      status: 'En Proceso',
    },
  });

  // Andrea Salinas → Municipio Quito (EN PROCESO normal)
  const intAndrea = await prisma.internship.create({
    data: {
      studentId: estAndrea.id,
      tutorId: tutorRoberto.id,
      companyId: empMunicipioQ.id,
      startDate: daysAgo(50),
      endDate: daysFromNow(70),
      totalHours: 480,
      location: 'Municipio de Quito — Dirección de Sistemas',
      businessTutorName: 'Lic. Rafael Castro',
      businessTutorEmail: 'r.castro@quito.gob.ec',
      ...GPS_MUNI,
      testEnabled: true,
      status: 'En Proceso',
    },
  });

  // Diego Vargas → CNT (EN PROCESO, buen historial)
  const intDiego = await prisma.internship.create({
    data: {
      studentId: estDiego.id,
      tutorId: tutorSilvia.id,
      companyId: empCNT.id,
      startDate: daysAgo(65),
      endDate: daysFromNow(55),
      totalHours: 480,
      location: 'CNT Ecuador — Área de Infraestructura',
      businessTutorName: 'Ing. Lorena Hidalgo',
      businessTutorEmail: 'l.hidalgo@cnt.gob.ec',
      ...GPS_CNT,
      testEnabled: false,
      status: 'En Proceso',
    },
  });

  // Valeria Torres → Mineduc (Tiene documento INCUMPLIDO, RF-09)
  const intValeria = await prisma.internship.create({
    data: {
      studentId: estValeria.id,
      tutorId: tutorSilvia.id,
      companyId: empMineduc.id,
      startDate: daysAgo(55),
      endDate: daysFromNow(65),
      totalHours: 480,
      location: 'Ministerio de Educación — Dirección de Tecnología',
      businessTutorName: 'Msc. Verónica Ortega',
      businessTutorEmail: 'v.ortega@educacion.gob.ec',
      ...GPS_MINEDUC,
      testEnabled: true,
      status: 'En Proceso',
    },
  });

  // Luis Quishpe → Banco Pacífico (COMPLETADO — todo aprobado)
  const intLuis = await prisma.internship.create({
    data: {
      studentId: estLuis.id,
      tutorId: tutorMarcos.id,
      companyId: empBanco.id,
      startDate: daysAgo(180),
      endDate: daysAgo(3),
      totalHours: 480,
      location: 'Banco del Pacífico — Área de Desarrollo de Software',
      businessTutorName: 'Ing. Hernán Mosquera',
      businessTutorEmail: 'h.mosquera@bancopacífico.com',
      ...GPS_BANCO,
      testEnabled: true,
      status: 'Completado',
    },
  });

  // Patricia Vega → Mineduc (EN PROCESO, inicio reciente)
  const intPatricia = await prisma.internship.create({
    data: {
      studentId: estPatricia.id,
      tutorId: tutorRoberto.id,
      companyId: empMineduc.id,
      startDate: daysAgo(20),
      endDate: daysFromNow(100),
      totalHours: 480,
      location: 'Ministerio de Educación — Gestión de Contenidos',
      businessTutorName: 'Msc. Verónica Ortega',
      businessTutorEmail: 'v.ortega@educacion.gob.ec',
      ...GPS_MINEDUC,
      testEnabled: false,
      status: 'En Proceso',
    },
  });

  console.log('🎓  Asignaciones creadas.');

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. DOCUMENTOS (RF-08 a RF-12)
  //    Estados: PENDIENTE, EN_REVISION_TUTOR, APROBADO_TUTOR,
  //             RECHAZADO_TUTOR, APROBADO_DEFINITIVO, RECHAZADO_COORDINADOR, INCUMPLIDO
  // ═══════════════════════════════════════════════════════════════════════════

  type DocSeed = {
    internshipId: string;
    name: string;
    status: DocumentStatus;
    startDate: Date | null;
    dueDate: Date | null;
    submittedAt?: Date;
    reviewedAt?: Date;
    filePath?: string;
    observations?: string;
  };

  const docSeeds: DocSeed[] = [
    // ── CARLOS GUAMÁN (buen progreso) ───────────────────────────────────────
    { internshipId: intCarlos.id, name: 'Plan de Prácticas Preprofesionales', status: DocumentStatus.APROBADO_DEFINITIVO, startDate: daysAgo(74), dueDate: daysAgo(60), submittedAt: daysAgo(62), reviewedAt: daysAgo(58), filePath: docUrl('carlos_plan_practicas') },
    { internshipId: intCarlos.id, name: 'Carta de Presentación a Empresa', status: DocumentStatus.APROBADO_DEFINITIVO, startDate: daysAgo(74), dueDate: daysAgo(68), submittedAt: daysAgo(70), reviewedAt: daysAgo(66), filePath: docUrl('carlos_carta_presentacion') },
    { internshipId: intCarlos.id, name: 'Informe de Avance Parcial N°1', status: DocumentStatus.APROBADO_DEFINITIVO, startDate: daysAgo(45), dueDate: daysAgo(30), submittedAt: daysAgo(32), reviewedAt: daysAgo(28), filePath: docUrl('carlos_informe_parcial_1'), observations: 'Excelente detalle técnico. Demuestra dominio de las tecnologías asignadas.' },
    { internshipId: intCarlos.id, name: 'Informe de Avance Parcial N°2', status: DocumentStatus.EN_REVISION_TUTOR, startDate: daysAgo(20), dueDate: daysFromNow(10), submittedAt: daysAgo(3), filePath: docUrl('carlos_informe_parcial_2') },
    { internshipId: intCarlos.id, name: 'Registro de Actividades Semanales', status: DocumentStatus.APROBADO_TUTOR, startDate: daysAgo(50), dueDate: daysAgo(10), submittedAt: daysAgo(12), reviewedAt: daysAgo(8), filePath: docUrl('carlos_registro_actividades') },
    { internshipId: intCarlos.id, name: 'Informe Final de Prácticas', status: DocumentStatus.PENDIENTE, startDate: daysFromNow(20), dueDate: daysFromNow(40) },
    { internshipId: intCarlos.id, name: 'Ficha de Evaluación de Empresa', status: DocumentStatus.PENDIENTE, startDate: daysFromNow(30), dueDate: daysFromNow(44) },

    // ── MARÍA QUISPE (avance normal) ──────────────────────────────────────────
    { internshipId: intMaria.id, name: 'Plan de Prácticas Preprofesionales', status: DocumentStatus.APROBADO_DEFINITIVO, startDate: daysAgo(59), dueDate: daysAgo(48), submittedAt: daysAgo(50), reviewedAt: daysAgo(45), filePath: docUrl('maria_plan_practicas') },
    { internshipId: intMaria.id, name: 'Carta de Presentación a Empresa', status: DocumentStatus.APROBADO_DEFINITIVO, startDate: daysAgo(59), dueDate: daysAgo(53), submittedAt: daysAgo(55), reviewedAt: daysAgo(51), filePath: docUrl('maria_carta_presentacion') },
    { internshipId: intMaria.id, name: 'Informe de Avance Parcial N°1', status: DocumentStatus.APROBADO_TUTOR, startDate: daysAgo(30), dueDate: daysAgo(15), submittedAt: daysAgo(16), reviewedAt: daysAgo(12), filePath: docUrl('maria_informe_parcial_1') },
    { internshipId: intMaria.id, name: 'Informe de Avance Parcial N°2', status: DocumentStatus.PENDIENTE, startDate: daysAgo(5), dueDate: daysFromNow(25) },
    { internshipId: intMaria.id, name: 'Registro de Actividades Semanales', status: DocumentStatus.EN_REVISION_TUTOR, startDate: daysAgo(40), dueDate: daysAgo(5), submittedAt: daysAgo(6), filePath: docUrl('maria_registro_actividades') },
    { internshipId: intMaria.id, name: 'Informe Final de Prácticas', status: DocumentStatus.PENDIENTE, startDate: daysFromNow(35), dueDate: daysFromNow(58) },
    { internshipId: intMaria.id, name: 'Ficha de Evaluación de Empresa', status: DocumentStatus.PENDIENTE, startDate: daysFromNow(45), dueDate: daysFromNow(58) },

    // ── JUAN LEMA (informe rechazado y resubmitido) ──────────────────────────
    { internshipId: intJuan.id, name: 'Plan de Prácticas Preprofesionales', status: DocumentStatus.APROBADO_DEFINITIVO, startDate: daysAgo(69), dueDate: daysAgo(55), submittedAt: daysAgo(57), reviewedAt: daysAgo(53), filePath: docUrl('juan_plan_practicas') },
    { internshipId: intJuan.id, name: 'Carta de Presentación a Empresa', status: DocumentStatus.APROBADO_DEFINITIVO, startDate: daysAgo(69), dueDate: daysAgo(63), submittedAt: daysAgo(65), reviewedAt: daysAgo(61), filePath: docUrl('juan_carta_presentacion') },
    { internshipId: intJuan.id, name: 'Informe de Avance Parcial N°1', status: DocumentStatus.RECHAZADO_TUTOR, startDate: daysAgo(40), dueDate: daysAgo(25), submittedAt: daysAgo(26), reviewedAt: daysAgo(22), filePath: docUrl('juan_informe_parcial_1_v1'), observations: 'El informe no especifica las tecnologías utilizadas ni los resultados obtenidos. Requiere revisión completa de la sección técnica.' },
    { internshipId: intJuan.id, name: 'Informe de Avance Parcial N°1 (corregido)', status: DocumentStatus.APROBADO_TUTOR, startDate: daysAgo(22), dueDate: daysAgo(15), submittedAt: daysAgo(16), reviewedAt: daysAgo(10), filePath: docUrl('juan_informe_parcial_1_v2'), observations: 'Corregido satisfactoriamente. Aprobado.' },
    { internshipId: intJuan.id, name: 'Informe de Avance Parcial N°2', status: DocumentStatus.PENDIENTE, startDate: daysAgo(8), dueDate: daysFromNow(20) },
    { internshipId: intJuan.id, name: 'Registro de Actividades Semanales', status: DocumentStatus.PENDIENTE, startDate: daysAgo(30), dueDate: daysFromNow(5) },
    { internshipId: intJuan.id, name: 'Informe Final de Prácticas', status: DocumentStatus.PENDIENTE, startDate: daysFromNow(25), dueDate: daysFromNow(48) },

    // ── ANDREA SALINAS (inicio reciente, buena marcha) ────────────────────────
    { internshipId: intAndrea.id, name: 'Plan de Prácticas Preprofesionales', status: DocumentStatus.APROBADO_DEFINITIVO, startDate: daysAgo(49), dueDate: daysAgo(38), submittedAt: daysAgo(40), reviewedAt: daysAgo(35), filePath: docUrl('andrea_plan_practicas') },
    { internshipId: intAndrea.id, name: 'Carta de Presentación a Empresa', status: DocumentStatus.APROBADO_DEFINITIVO, startDate: daysAgo(49), dueDate: daysAgo(43), submittedAt: daysAgo(45), reviewedAt: daysAgo(41), filePath: docUrl('andrea_carta_presentacion') },
    { internshipId: intAndrea.id, name: 'Informe de Avance Parcial N°1', status: DocumentStatus.EN_REVISION_TUTOR, startDate: daysAgo(20), dueDate: daysFromNow(10), submittedAt: daysAgo(2), filePath: docUrl('andrea_informe_parcial_1') },
    { internshipId: intAndrea.id, name: 'Registro de Actividades Semanales', status: DocumentStatus.PENDIENTE, startDate: daysAgo(30), dueDate: daysFromNow(8) },
    { internshipId: intAndrea.id, name: 'Informe de Avance Parcial N°2', status: DocumentStatus.PENDIENTE, startDate: daysFromNow(10), dueDate: daysFromNow(35) },
    { internshipId: intAndrea.id, name: 'Informe Final de Prácticas', status: DocumentStatus.PENDIENTE, startDate: daysFromNow(45), dueDate: daysFromNow(68) },
    { internshipId: intAndrea.id, name: 'Ficha de Evaluación de Empresa', status: DocumentStatus.PENDIENTE, startDate: daysFromNow(55), dueDate: daysFromNow(68) },

    // ── DIEGO VARGAS (buen historial) ─────────────────────────────────────────
    { internshipId: intDiego.id, name: 'Plan de Prácticas Preprofesionales', status: DocumentStatus.APROBADO_DEFINITIVO, startDate: daysAgo(64), dueDate: daysAgo(52), submittedAt: daysAgo(54), reviewedAt: daysAgo(50), filePath: docUrl('diego_plan_practicas') },
    { internshipId: intDiego.id, name: 'Carta de Presentación a Empresa', status: DocumentStatus.APROBADO_DEFINITIVO, startDate: daysAgo(64), dueDate: daysAgo(58), submittedAt: daysAgo(60), reviewedAt: daysAgo(56), filePath: docUrl('diego_carta_presentacion') },
    { internshipId: intDiego.id, name: 'Informe de Avance Parcial N°1', status: DocumentStatus.APROBADO_DEFINITIVO, startDate: daysAgo(35), dueDate: daysAgo(22), submittedAt: daysAgo(24), reviewedAt: daysAgo(18), filePath: docUrl('diego_informe_parcial_1'), observations: 'Informe completo. Evidencia buen dominio de administración de redes.' },
    { internshipId: intDiego.id, name: 'Informe de Avance Parcial N°2', status: DocumentStatus.APROBADO_TUTOR, startDate: daysAgo(15), dueDate: daysAgo(2), submittedAt: daysAgo(4), reviewedAt: daysAgo(1), filePath: docUrl('diego_informe_parcial_2') },
    { internshipId: intDiego.id, name: 'Registro de Actividades Semanales', status: DocumentStatus.APROBADO_TUTOR, startDate: daysAgo(45), dueDate: daysAgo(3), submittedAt: daysAgo(5), reviewedAt: daysAgo(2), filePath: docUrl('diego_registro_actividades') },
    { internshipId: intDiego.id, name: 'Informe Final de Prácticas', status: DocumentStatus.PENDIENTE, startDate: daysFromNow(30), dueDate: daysFromNow(53) },
    { internshipId: intDiego.id, name: 'Ficha de Evaluación de Empresa', status: DocumentStatus.PENDIENTE, startDate: daysFromNow(40), dueDate: daysFromNow(53) },

    // ── VALERIA TORRES (tiene documento INCUMPLIDO — RF-09) ───────────────────
    { internshipId: intValeria.id, name: 'Plan de Prácticas Preprofesionales', status: DocumentStatus.APROBADO_DEFINITIVO, startDate: daysAgo(54), dueDate: daysAgo(42), submittedAt: daysAgo(44), reviewedAt: daysAgo(40), filePath: docUrl('valeria_plan_practicas') },
    { internshipId: intValeria.id, name: 'Carta de Presentación a Empresa', status: DocumentStatus.APROBADO_DEFINITIVO, startDate: daysAgo(54), dueDate: daysAgo(48), submittedAt: daysAgo(50), reviewedAt: daysAgo(46), filePath: docUrl('valeria_carta_presentacion') },
    {
      internshipId: intValeria.id, name: 'Informe de Avance Parcial N°1',
      status: DocumentStatus.INCUMPLIDO,
      startDate: daysAgo(30), dueDate: daysAgo(8),
      observations: 'El plazo de entrega venció sin que se presentara el documento. Marcado como INCUMPLIDO automáticamente por el sistema el ' + daysAgo(8).toLocaleDateString('es-EC') + '.',
    },
    { internshipId: intValeria.id, name: 'Registro de Actividades Semanales', status: DocumentStatus.PENDIENTE, startDate: daysAgo(40), dueDate: daysFromNow(5) },
    { internshipId: intValeria.id, name: 'Informe de Avance Parcial N°2', status: DocumentStatus.PENDIENTE, startDate: daysFromNow(5), dueDate: daysFromNow(30) },
    { internshipId: intValeria.id, name: 'Informe Final de Prácticas', status: DocumentStatus.PENDIENTE, startDate: daysFromNow(40), dueDate: daysFromNow(63) },

    // ── LUIS QUISHPE (COMPLETADO — todo aprobado) ─────────────────────────────
    { internshipId: intLuis.id, name: 'Plan de Prácticas Preprofesionales', status: DocumentStatus.APROBADO_DEFINITIVO, startDate: daysAgo(178), dueDate: daysAgo(165), submittedAt: daysAgo(167), reviewedAt: daysAgo(163), filePath: docUrl('luis_plan_practicas') },
    { internshipId: intLuis.id, name: 'Carta de Presentación a Empresa', status: DocumentStatus.APROBADO_DEFINITIVO, startDate: daysAgo(178), dueDate: daysAgo(172), submittedAt: daysAgo(174), reviewedAt: daysAgo(170), filePath: docUrl('luis_carta_presentacion') },
    { internshipId: intLuis.id, name: 'Informe de Avance Parcial N°1', status: DocumentStatus.APROBADO_DEFINITIVO, startDate: daysAgo(130), dueDate: daysAgo(115), submittedAt: daysAgo(117), reviewedAt: daysAgo(112), filePath: docUrl('luis_informe_parcial_1'), observations: 'Excelente. Muy buen desempeño técnico.' },
    { internshipId: intLuis.id, name: 'Informe de Avance Parcial N°2', status: DocumentStatus.APROBADO_DEFINITIVO, startDate: daysAgo(90), dueDate: daysAgo(75), submittedAt: daysAgo(77), reviewedAt: daysAgo(72), filePath: docUrl('luis_informe_parcial_2'), observations: 'Progreso consistente. Muy buenos resultados.' },
    { internshipId: intLuis.id, name: 'Registro de Actividades Semanales', status: DocumentStatus.APROBADO_DEFINITIVO, startDate: daysAgo(150), dueDate: daysAgo(20), submittedAt: daysAgo(22), reviewedAt: daysAgo(18), filePath: docUrl('luis_registro_actividades') },
    { internshipId: intLuis.id, name: 'Informe Final de Prácticas', status: DocumentStatus.APROBADO_DEFINITIVO, startDate: daysAgo(30), dueDate: daysAgo(5), submittedAt: daysAgo(8), reviewedAt: daysAgo(4), filePath: docUrl('luis_informe_final'), observations: 'Informe de alta calidad. Cumplió todas las competencias del perfil. APROBADO.' },
    { internshipId: intLuis.id, name: 'Ficha de Evaluación de Empresa', status: DocumentStatus.APROBADO_DEFINITIVO, startDate: daysAgo(20), dueDate: daysAgo(4), submittedAt: daysAgo(6), reviewedAt: daysAgo(3), filePath: docUrl('luis_ficha_evaluacion_empresa') },

    // ── PATRICIA VEGA (inicio muy reciente) ──────────────────────────────────
    { internshipId: intPatricia.id, name: 'Plan de Prácticas Preprofesionales', status: DocumentStatus.APROBADO_DEFINITIVO, startDate: daysAgo(19), dueDate: daysAgo(10), submittedAt: daysAgo(12), reviewedAt: daysAgo(8), filePath: docUrl('patricia_plan_practicas') },
    { internshipId: intPatricia.id, name: 'Carta de Presentación a Empresa', status: DocumentStatus.EN_REVISION_TUTOR, startDate: daysAgo(19), dueDate: daysFromNow(5), submittedAt: daysAgo(1), filePath: docUrl('patricia_carta_presentacion') },
    { internshipId: intPatricia.id, name: 'Informe de Avance Parcial N°1', status: DocumentStatus.PENDIENTE, startDate: daysFromNow(20), dueDate: daysFromNow(40) },
    { internshipId: intPatricia.id, name: 'Registro de Actividades Semanales', status: DocumentStatus.PENDIENTE, startDate: daysAgo(15), dueDate: daysFromNow(15) },
    { internshipId: intPatricia.id, name: 'Informe Final de Prácticas', status: DocumentStatus.PENDIENTE, startDate: daysFromNow(70), dueDate: daysFromNow(98) },
  ];

  for (const doc of docSeeds) {
    await prisma.document.create({ data: doc as Parameters<typeof prisma.document.create>[0]['data'] });
  }

  console.log(`📋  ${docSeeds.length} documentos creados.`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. ASISTENCIAS (RF-13: GPS + RF-15: fotos)
  //    Genera días laborables con check-in ~08:00 y check-out ~17:00
  // ═══════════════════════════════════════════════════════════════════════════

  type AttSeed = {
    internshipId: string;
    lat: number;
    lng: number;
    startAgo: number;
    endAgo: number;
    skipDays?: number[];    // índices de días a omitir (ausencias)
  };

  const attSeeds: AttSeed[] = [
    { internshipId: intCarlos.id, ...GPS_BANCO, startAgo: 74, endAgo: 1 },
    { internshipId: intMaria.id,  ...GPS_CNT,   startAgo: 59, endAgo: 1, skipDays: [5, 12, 28] },
    { internshipId: intJuan.id,   ...GPS_BANCO, startAgo: 69, endAgo: 1, skipDays: [3, 15, 22] },
    { internshipId: intAndrea.id, ...GPS_MUNI,  startAgo: 49, endAgo: 1, skipDays: [8] },
    { internshipId: intDiego.id,  ...GPS_CNT,   startAgo: 64, endAgo: 1 },
    { internshipId: intValeria.id,...GPS_MINEDUC,startAgo: 54, endAgo: 1, skipDays: [4, 11, 18, 25, 30] },
    { internshipId: intLuis.id,   ...GPS_BANCO, startAgo: 180, endAgo: 4 }, // completado
    { internshipId: intPatricia.id,...GPS_MINEDUC,startAgo: 19, endAgo: 1, skipDays: [7] },
  ];

  let totalAttendances = 0;
  const attendanceIds: string[] = [];

  for (const seed of attSeeds) {
    const days = workingDays(seed.startAgo, seed.endAgo);
    let idx = 0;
    for (const day of days) {
      if (seed.skipDays?.includes(idx)) { idx++; continue; }

      // Pequeña variación GPS (±30m ≈ ±0.0003 grados) — dentro del radio 200m RF-13
      const jitterLat = rand(-0.0003, 0.0003);
      const jitterLng = rand(-0.0003, 0.0003);
      const distKm = Math.sqrt(jitterLat ** 2 + jitterLng ** 2) * 111; // aprox km

      const checkInMinutes  = randInt(0, 25);
      const checkOutMinutes = randInt(0, 30);

      const checkIn  = withTime(day, 7, 55 + checkInMinutes > 59 ? 8 : 7 + Math.floor((55 + checkInMinutes) / 60));
      checkIn.setMinutes((55 + checkInMinutes) % 60);

      const checkOut = withTime(day, 16, 45 + checkOutMinutes > 59 ? 17 : 16 + Math.floor((45 + checkOutMinutes) / 60));
      checkOut.setMinutes((45 + checkOutMinutes) % 60);

      // Solo los últimos 15 días tienen fotos (RF-15)
      const hasPhoto = seed.startAgo - idx <= 15;
      const photoSeed = `att-${seed.internshipId.slice(0, 8)}-${idx}`;

      const att = await prisma.attendance.create({
        data: {
          internshipId: seed.internshipId,
          checkIn,
          checkOut,
          lat: seed.lat + jitterLat,
          lng: seed.lng + jitterLng,
          distanceKm: distKm,
          checkInPhoto:  hasPhoto ? photoUrl(`checkin-${photoSeed}`, 640, 480) : null,
          checkOutPhoto: hasPhoto ? photoUrl(`checkout-${photoSeed}`, 640, 480) : null,
        },
      });

      // RF-17: Fotos de actividades (solo en algunos registros recientes)
      if (hasPhoto && idx % 3 === 0) {
        attendanceIds.push(att.id);
      }

      totalAttendances++;
      idx++;
    }
  }

  console.log(`📍  ${totalAttendances} registros de asistencia creados.`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. FOTOS DE ACTIVIDADES (RF-17)
  // ═══════════════════════════════════════════════════════════════════════════

  const activityCaptions = [
    'Reunión de revisión de sprint con el equipo de desarrollo',
    'Implementación de módulo de autenticación con JWT',
    'Análisis de requerimientos con el cliente interno',
    'Configuración de servidor Nginx en ambiente de pruebas',
    'Presentación de avance a jefe de área',
    'Revisión y corrección de bugs reportados en Jira',
    'Capacitación sobre metodologías ágiles — SCRUM',
    'Diseño de base de datos relacional para módulo de reportes',
    'Testing de interfaz con usuarios finales',
    'Documentación técnica de la API REST desarrollada',
    'Integración de servicio de pagos con webservice externo',
    'Backup y restauración de base de datos PostgreSQL',
  ];

  let totalActivityPhotos = 0;
  for (const attId of attendanceIds) {
    const numPhotos = randInt(1, 3);
    for (let i = 0; i < numPhotos; i++) {
      const capIdx = randInt(0, activityCaptions.length - 1);
      await prisma.activityPhoto.create({
        data: {
          attendanceId: attId,
          photoUrl: photoUrl(`activity-${attId.slice(0, 8)}-${i}`, 1024, 768),
          caption: i === 0 ? activityCaptions[capIdx] : (Math.random() > 0.5 ? activityCaptions[(capIdx + 1) % activityCaptions.length] : undefined),
        },
      });
      totalActivityPhotos++;
    }
  }

  console.log(`📸  ${totalActivityPhotos} fotos de actividades creadas.`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. EVALUACIONES (RF-07: Test de Aptitud/Actitud)
  // ═══════════════════════════════════════════════════════════════════════════

  await Promise.all([
    // Carlos — evaluación COMPLETADA (sobresaliente)
    prisma.evaluation.create({
      data: {
        internshipId: intCarlos.id,
        punctuality: 5,
        teamwork: 5,
        technicalSkills: 5,
        proactivity: 4,
        attitude: 5,
        observations: 'El estudiante demuestra un excelente nivel técnico y una actitud proactiva destacable. Se integró rápidamente al equipo y sus aportes fueron valiosos para el área de desarrollo. Cumplió todos los objetivos planteados y superó las expectativas. Se recomienda para futuras contrataciones.',
        status: 'COMPLETADO',
      },
    }),

    // María — evaluación COMPLETADA (muy buena)
    prisma.evaluation.create({
      data: {
        internshipId: intMaria.id,
        punctuality: 5,
        teamwork: 4,
        technicalSkills: 4,
        proactivity: 4,
        attitude: 5,
        observations: 'María demostró sólidos conocimientos técnicos y una excelente disposición para aprender. Puntual y responsable. Muy buena capacidad de trabajo en equipo.',
        status: 'COMPLETADO',
      },
    }),

    // Diego — evaluación COMPLETADA (buena)
    prisma.evaluation.create({
      data: {
        internshipId: intDiego.id,
        punctuality: 4,
        teamwork: 4,
        technicalSkills: 4,
        proactivity: 3,
        attitude: 4,
        observations: 'Buen desempeño general. Mostró dominio de las herramientas de infraestructura asignadas. Puede mejorar su proactividad para proponer soluciones.',
        status: 'COMPLETADO',
      },
    }),

    // Luis — evaluación COMPLETADA (sobresaliente, internship completado)
    prisma.evaluation.create({
      data: {
        internshipId: intLuis.id,
        punctuality: 5,
        teamwork: 5,
        technicalSkills: 5,
        proactivity: 5,
        attitude: 5,
        observations: 'Luis fue el mejor practicante que hemos recibido en los últimos dos años. Su nivel técnico, compromiso y actitud son excepcionales. Desarrolló por completo el módulo de integraciones API que llevamos dos años postergando. Se recomienda ampliamente para contratación inmediata.',
        status: 'COMPLETADO',
      },
    }),

    // Juan — evaluación PENDIENTE (empresa aún no la completa)
    prisma.evaluation.create({
      data: {
        internshipId: intJuan.id,
        punctuality: 3,
        teamwork: 0,
        technicalSkills: 0,
        proactivity: 0,
        attitude: 0,
        observations: '',
        status: 'PENDIENTE',
      },
    }),
  ]);

  console.log('⭐  Evaluaciones creadas.');

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. EMAIL LOGS (historial de notificaciones)
  // ═══════════════════════════════════════════════════════════════════════════

  const emailLogs = [
    { to: estCarlos.email, subject: 'Bienvenido al Sistema de Prácticas ISTPET', status: 'EXITO', sentAt: daysAgo(75) },
    { to: estMaria.email, subject: 'Bienvenido al Sistema de Prácticas ISTPET', status: 'EXITO', sentAt: daysAgo(60) },
    { to: estJuan.email, subject: 'Bienvenido al Sistema de Prácticas ISTPET', status: 'EXITO', sentAt: daysAgo(70) },
    { to: estAndrea.email, subject: 'Bienvenido al Sistema de Prácticas ISTPET', status: 'EXITO', sentAt: daysAgo(50) },
    { to: estDiego.email, subject: 'Bienvenido al Sistema de Prácticas ISTPET', status: 'EXITO', sentAt: daysAgo(65) },
    { to: estValeria.email, subject: 'Bienvenido al Sistema de Prácticas ISTPET', status: 'EXITO', sentAt: daysAgo(55) },
    { to: estLuis.email, subject: 'Bienvenido al Sistema de Prácticas ISTPET', status: 'EXITO', sentAt: daysAgo(180) },
    { to: estPatricia.email, subject: 'Bienvenido al Sistema de Prácticas ISTPET', status: 'EXITO', sentAt: daysAgo(20) },
    // Recordatorios de documentos próximos a vencer
    { to: estCarlos.email, subject: 'Recordatorio: "Informe de Avance Parcial N°2" vence en 3 días', status: 'EXITO', sentAt: daysAgo(4) },
    { to: estJuan.email, subject: 'Recordatorio: "Registro de Actividades Semanales" vence pronto', status: 'EXITO', sentAt: daysAgo(2) },
    { to: estPatricia.email, subject: 'Recordatorio: "Carta de Presentación a Empresa" vence en 5 días', status: 'EXITO', sentAt: daysAgo(1) },
    // Alerta de INCUMPLIMIENTO — Valeria (RF-09)
    { to: tutorSilvia.email, subject: 'INCUMPLIMIENTO: Valeria Torres no entregó "Informe de Avance Parcial N°1"', status: 'EXITO', sentAt: daysAgo(8), metadata: { internshipId: intValeria.id, studentName: 'Valeria Alexandra Torres Aguilar' } },
    // Asignaciones de prácticas
    { to: empBanco.email, subject: 'Nueva asignación de practicante: Carlos Guamán Pilco', status: 'EXITO', sentAt: daysAgo(75) },
    { to: empCNT.email, subject: 'Nueva asignación de practicante: María Quispe Condor', status: 'EXITO', sentAt: daysAgo(60) },
    { to: empMunicipioQ.email, subject: 'Nueva asignación de practicante: Andrea Salinas Reyes', status: 'EXITO', sentAt: daysAgo(50) },
    { to: empMineduc.email, subject: 'Nueva asignación de practicante: Valeria Torres Aguilar', status: 'EXITO', sentAt: daysAgo(55) },
    // Correo fallido (simulación)
    { to: 'servidor-error@empresa.com', subject: 'Recordatorio: documento próximo a vencer', status: 'FALLIDO', error: 'ECONNREFUSED: No se pudo conectar al servidor SMTP', sentAt: daysAgo(10) },
  ];

  for (const log of emailLogs) {
    await prisma.emailLog.create({ data: log as Parameters<typeof prisma.emailLog.create>[0]['data'] });
  }

  console.log(`📧  ${emailLogs.length} registros de email log creados.`);

  // ═══════════════════════════════════════════════════════════════════════════
  // RESUMEN FINAL
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n' + '═'.repeat(60));
  console.log('✅  SEED COMPLETADO EXITOSAMENTE');
  console.log('═'.repeat(60));
  console.log('\n📊  Resumen de datos creados:');
  console.log(`   🏢  Empresas        : 4 (Banco Pacífico, CNT, Municipio Q., Mineduc)`);
  console.log(`   👥  Usuarios        : 19 total`);
  console.log(`        1 ADMIN  |  2 COORDINADORES  |  3 TUTORES ACADÉMICOS`);
  console.log(`        8 ESTUDIANTES  |  4 EMPRESA  |  1 TUTOR EMPRESARIAL`);
  console.log(`   📑  Convenios       : 4 (uno por empresa)`);
  console.log(`   🎓  Asignaciones    : 8 (6 activas + 1 completada + 1 reciente)`);
  console.log(`   📋  Documentos      : ${docSeeds.length}`);
  console.log(`        ✅ APROBADO_DEFINITIVO  |  🔄 EN_REVISION_TUTOR`);
  console.log(`        ⏳ PENDIENTE            |  ❌ RECHAZADO  |  🚫 INCUMPLIDO`);
  console.log(`   📍  Asistencias     : ${totalAttendances} (con GPS RF-13 + fotos RF-15)`);
  console.log(`   📸  Fotos actividad : ${totalActivityPhotos} (RF-17)`);
  console.log(`   ⭐  Evaluaciones    : 5 (4 completadas + 1 pendiente)`);
  console.log(`   📧  Email Logs      : ${emailLogs.length}`);
  console.log('\n🔑  Credenciales de acceso (todas con password: password123)');
  console.log('─'.repeat(60));
  console.log('ADMIN         : admin@istpet.edu.ec');
  console.log('COORDINADOR   : coordinador@istpet.edu.ec');
  console.log('TUTOR         : tutor.marcos@istpet.edu.ec');
  console.log('ESTUDIANTE 1  : c.guaman@estudiante.istpet.edu.ec   (buena trayectoria)');
  console.log('ESTUDIANTE 2  : m.quispe@estudiante.istpet.edu.ec   (avance normal)');
  console.log('ESTUDIANTE 3  : j.lema@estudiante.istpet.edu.ec     (informe rechazado/corregido)');
  console.log('ESTUDIANTE 4  : v.torres@estudiante.istpet.edu.ec   (tiene documento INCUMPLIDO)');
  console.log('ESTUDIANTE 5  : l.quishpe@estudiante.istpet.edu.ec  (internship COMPLETADO)');
  console.log('EMPRESA       : practicas@bancopacífico.com          (Banco del Pacífico)');
  console.log('TUTOR EMPRES. : tutor.empresarial@bancopacifico.com  (Banco Pacífico, evaluaciones / portal empresa)');
  console.log('─'.repeat(60) + '\n');
}

main()
  .catch((e) => {
    console.error('❌  Error en el proceso de seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
