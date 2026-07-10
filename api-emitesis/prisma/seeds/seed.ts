/**
 * SEED INSTITUCIONAL — ejecutar con: npx prisma db seed
 * (definido en package.json → prisma.seed). Purga todas las tablas al inicio.
 *
 * Entornos:
 * - Desarrollo: Neon (api-emitesis/.env) → npx prisma db seed
 * - Producción AWS: ~/emitesis → ./manage-db.sh seed o reset --force
 *
 * Login demo: password123 | Admin: cristhofer.parreno@adm.istpet.edu.ec
 * Emails ASCII (sin ñ) por validación HTML5 del formulario de login.
 *
 * Instituto Superior Tecnológico "Mayor Pedro Traversari" (ISTPET)
 * Av. Matilde Álvarez y Hugo Díaz Romero, sector Chillogallo, Quito – Ecuador
 * Teléfonos: 02 303 2894 / 098 4033166 | admisiones@istpet.edu.ec
 *
 * Datos: Carreras reales del ISTPET, empresas de Quito por perfil profesional,
 * personal académico y coordinación acordes a la estructura institucional real.
 *
 * Cobertura: 100% de modelos del schema, todos los estados de documentos,
 * múltiples versiones y comentarios, visitas de monitoreo, evaluaciones,
 * credenciales WebAuthn, templates por carrera, notificaciones, ARCO, logs.
 */

import {
    PrismaClient,
    Role,
    DocumentStatus,
    EvaluationType,
    Modalidad,
    Career,
    Company,
    User,
    Internship,
    Document,
    DocumentTemplate,
    Prisma,
    Absence,
    ChatRoom,
    ChatRoomMember,
    ChatMessage,
    LopdpLog,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ── Helpers ────────────────────────────────────────────────────────────────

const daysAgo = (n: number): Date => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
};


const randInt = (min: number, max: number): number =>
    Math.floor(Math.random() * (max - min + 1)) + min;

const pick = <T>(arr: T[]): T => arr[randInt(0, arr.length - 1)];

const docUrl = (name: string): string =>
    `/uploads/documents/seed/${name.replace(/\s+/g, '_').toLowerCase()}.pdf`;

const genCedula = () => {
    const province = randInt(1, 24).toString().padStart(2, '0');
    const digits = Array.from({ length: 7 }, () => randInt(0, 9)).join('');
    const last = randInt(0, 9);
    return `${province}${digits}${last}`;
};

const genPhone = () => `09${randInt(7, 9)}${randInt(1000000, 9999999)}`;

const photoUrl = (seed: string | number): string =>
    `https://picsum.photos/seed/${seed}/800/600`;

/** Genera un email institucional a partir del nombre completo.
 * Elimina títulos (Ing., Lic., etc.), quita acentos/ñ y toma primer nombre + primer apellido.
 * Los emails deben ser ASCII: el login web usa type="email" y rechaza la ñ.
 * Ejemplo: 'Ing. Andrés Gallegos Larrea' → 'andres.gallegos@istpet.edu.ec' */
const toEmail = (fullName: string, domain: string): string => {
    const cleaned = fullName
        .replace(/^(Ing\.|Lic\.|Lcda\.|CPA\.|Psic\.|Tec\.|Dis\.|Chef\.)\s*/i, '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')  // quitar acentos
        .replace(/ñ/gi, 'n')              // ASCII para validación HTML5 de email
        .toLowerCase()
        .replace(/[^a-z\s]/g, '')         // solo letras y espacios
        .trim();
    const parts = cleaned.split(/\s+/);
    return `${parts[0]}.${parts[1] ?? 'user'}@${domain}`;
};

const firstNames = [
    'Mateo', 'Sofía', 'Juan', 'Valentina', 'Andrés', 'Isabella',
    'Diego', 'Camila', 'Luis', 'Lucía', 'Carlos', 'Mariana',
    'Javier', 'Elena', 'Ricardo', 'Gabriela', 'Sebastián', 'Natalia',
    'Fernando', 'Patricia', 'Miguel', 'Daniela', 'Alejandro', 'Paola',
];

const lastNames = [
    'Larrea', 'Vaca', 'Ortiz', 'Gallegos', 'Salazar', 'Méndez',
    'Pérez', 'Cisneros', 'López', 'Gómez', 'Torres', 'Ramírez',
    'Castro', 'Arias', 'Enríquez', 'Toapanta', 'Moreira', 'Herrera',
    'Villacís', 'Almeida', 'Quiñonez', 'Burbano', 'Freire', 'Ponce',
];

let nameIndex = 0;
const getUniqueName = (): string => {
    const fn = firstNames[nameIndex % firstNames.length];
    const ln = lastNames[Math.floor(nameIndex / firstNames.length) % lastNames.length];
    nameIndex++;
    return `${fn} ${ln}`;
};

// ── Comentarios y observaciones realistas ─────────────────────────────────

const tutorRejectionComments = [
    'Los objetivos no son medibles. Por favor usa la metodología SMART.',
    'El cronograma no incluye fechas específicas. Corregir y reenviar.',
    'Falta la firma de la empresa receptora en la sección 3.',
    'Las actividades descritas no corresponden al perfil de la carrera.',
    'El informe no tiene las horas desglosadas por semana. Revisar formato.',
    'La introducción es demasiado breve. Debe tener al menos 3 párrafos.',
    'No se adjuntó el anexo fotográfico requerido.',
    'Las competencias adquiridas no están vinculadas con el perfil profesional.',
];

const coordRejectionComments = [
    'El documento no cumple con el reglamento institucional vigente 2026.',
    'Se requiere la validación previa del tutor académico antes de la revisión del coordinador.',
    'Faltan firmas en las páginas 2 y 4. Regularizar con el área correspondiente.',
    'El contenido no refleja las horas realmente laboradas según el registro de asistencia.',
];

const approvalComments = [
    'Documento revisado y aprobado. Buen trabajo.',
    'Aprobado. El plan de prácticas está bien estructurado.',
    'Correcciones aplicadas satisfactoriamente. Aprobado.',
    'Cumple con todos los requisitos institucionales. Aprobado.',
];

const studentResponses = [
    'He corregido los objetivos usando la metodología SMART. Adjunto nueva versión.',
    'Actualicé el cronograma con fechas específicas. Por favor revisar.',
    'Agregué la firma de la empresa receptora. Reenvío el documento corregido.',
    'He ampliado la introducción y agregado los anexos fotográficos. Gracias por la retroalimentación.',
    'Corregí el desglose de horas por semana según el formato oficial.',
];

const visitObservations = [
    'El estudiante se integra correctamente al equipo técnico. Muestra iniciativa y actitud proactiva.',
    'El ambiente de trabajo es adecuado. Se verificó el cumplimiento de los objetivos planteados.',
    'Se observó al estudiante realizando tareas acordes con su perfil profesional.',
    'La empresa receptora expresó satisfacción con el desempeño del pasante.',
    'Se detectaron algunas dificultades en la comunicación con el equipo. Se recomendó refuerzo.',
    'Excelente avance. El estudiante ya maneja las herramientas principales del área.',
    'Se verificó el registro de asistencia y está al día. El estudiante cumple con el horario acordado.',
];

// ── MAIN ──────────────────────────────────────────────────────────────────

async function main() {
    if (process.env.NODE_ENV === 'production') {
        console.error('\n[!] ERROR DE SEGURIDAD: No se permite ejecutar la semilla en el entorno de producción.\n');
        process.exit(1);
    }

    console.log('\n INICIANDO MASTER SEED v14.0 — ISTPET "Mayor Pedro Traversari"');
    console.log('═══════════════════════════════════════════════════════════\n');

    // ─── 1. LIMPIEZA (orden estricto de integridad referencial) ──────────────
    console.log(' [1/12] Purgando base de datos...');
    const tables = [
        'activityPhoto', 'attendance', 'documentVersion', 'documentComment', 'document',
        'documentTemplate', 'monitoringVisit', 'evaluation', 'internshipStatusHistory',
        'absence', 'lopdpLog', 'chatMessage', 'chatRoomMember', 'chatRoom', 'chatPermission',
        'internship', 'agreement', 'userCredential', 'dataRequest', 'inAppNotification',
        'user', 'career', 'company', 'emailLog', 'systemSetting', 'announcement', 'systemLog'
    ];

    for (const table of tables) {
        try {
            await (prisma as any)[table].deleteMany();
        } catch (error) {
            // Ignorar errores si la tabla no existe (P2021)
            if ((error as any).code !== 'P2021') {
                console.warn(`    No se pudo purgar la tabla ${table}:`, (error as any).message);
            }
        }
    }
    console.log('    Base de datos purgada.\n');

    const password = await bcrypt.hash('password123', 10);
    const lopdp = {
        lopdpAccepted: true,
        lopdpAcceptedAt: daysAgo(60),
        lopdpVersion: '1.0',
    };

    // ─── 2. CARRERAS REALES DEL ISTPET ────────────────────────────────────────
    // Fuente: https://institutotraversari.edu.ec — Programa Académico 2026
    console.log(' [2/12] Creando carreras reales del ISTPET...');
    const careersData: { name: string; faculty: string; modalidad: Modalidad; hours: number }[] = [
        // Departamento de Tecnologías de la Información y Comunicación
        { name: 'Desarrollo de Software', faculty: 'Tecnologías de la Información y Comunicación', modalidad: Modalidad.PRESENCIAL, hours: 200 },
        { name: 'Electrónica', faculty: 'Tecnologías de la Información y Comunicación', modalidad: Modalidad.SEMIPRESENCIAL, hours: 200 },
        { name: 'Redes & Telecomunicaciones', faculty: 'Tecnologías de la Información y Comunicación', modalidad: Modalidad.SEMIPRESENCIAL, hours: 200 },
        { name: 'Desarrollo de Software', faculty: 'Tecnologías de la Información y Comunicación', modalidad: Modalidad.EN_LINEA, hours: 200 },
        // Departamento de Ingeniería y Diseño
        { name: 'Mecánica Automotriz', faculty: 'Ingeniería y Diseño', modalidad: Modalidad.PRESENCIAL, hours: 160 },
        { name: 'Diseño Gráfico', faculty: 'Ingeniería y Diseño', modalidad: Modalidad.PRESENCIAL, hours: 160 },
        // Departamento de Ciencias Administrativas y Comerciales
        { name: 'Contabilidad y Asesoría Tributaria', faculty: 'Ciencias Administrativas y Comerciales', modalidad: Modalidad.EN_LINEA, hours: 160 },
        { name: 'Marketing & Comercio Electrónico', faculty: 'Ciencias Administrativas y Comerciales', modalidad: Modalidad.EN_LINEA, hours: 160 },
        { name: 'Talento Humano', faculty: 'Ciencias Administrativas y Comerciales', modalidad: Modalidad.HIBRIDA, hours: 160 },
        // Departamento de Ciencias de la Educación
        { name: 'Educación Inicial', faculty: 'Ciencias de la Educación', modalidad: Modalidad.PRESENCIAL, hours: 320 },
        { name: 'Educación Básica', faculty: 'Ciencias de la Educación', modalidad: Modalidad.SEMIPRESENCIAL, hours: 320 },
        { name: 'Educación Inclusiva', faculty: 'Ciencias de la Educación', modalidad: Modalidad.EN_LINEA, hours: 320 },
        // Departamento de Cultura, Deporte y Gastronomía
        { name: 'Entrenamiento Deportivo', faculty: 'Cultura, Deporte y Gastronomía', modalidad: Modalidad.PRESENCIAL, hours: 200 },
        { name: 'Gastronomía', faculty: 'Cultura, Deporte y Gastronomía', modalidad: Modalidad.SEMIPRESENCIAL, hours: 160 },
    ];

    const careers = await (prisma.career as any).createManyAndReturn({
        data: careersData.map(c => ({
            name: c.name,
            faculty: c.faculty,
            modalidad: c.modalidad,
            config: { requiredHours: c.hours },
        })),
    });
    console.log(`    ${careers.length} carreras creadas.\n`);

    // ─── 3. DOCUMENT TEMPLATES (por carrera + globales) ──────────────────────
    console.log(' [3/12] Creando plantillas de documentos...');

    // Plantillas globales (aplican a todas las carreras)
    const globalTemplatesData = [
        { name: 'F01 - Solicitud de Inicio de Prácticas', sortOrder: 1, isRequired: true },
        { name: 'F02 - Plan de Prácticas Preprofesionales', sortOrder: 2, isRequired: true },
        { name: 'F03 - Registro Semanal de Actividades', sortOrder: 3, isRequired: true },
        { name: 'F04 - Informe de Avance de Prácticas', sortOrder: 4, isRequired: true },
        { name: 'F05 - Informe Final de Prácticas', sortOrder: 5, isRequired: true },
        { name: 'F06 - Evaluación del Tutor Empresarial', sortOrder: 6, isRequired: true },
        { name: 'F07 - Autoevaluación del Estudiante', sortOrder: 7, isRequired: false },
        { name: 'F10 - Certificado de Finalización', sortOrder: 10, isRequired: true, isCertificateSlot: true },
    ];

    const globalTemplates = await (prisma.documentTemplate as any).createManyAndReturn({
        data: globalTemplatesData.map((t, idx) => ({ ...t, sortOrder: idx + 1, isRequired: true })),
    });

    // Plantillas específicas por carrera del ISTPET
    const careerSW = careers.find((c) => c.name === 'Desarrollo de Software' && c.modalidad === Modalidad.PRESENCIAL)!;
    const careerSWOnline = careers.find((c) => c.name === 'Desarrollo de Software' && c.modalidad === Modalidad.EN_LINEA)!;
    const careerRedes = careers.find((c) => c.name === 'Redes & Telecomunicaciones')!;
    const careerElec = careers.find((c) => c.name === 'Electrónica')!;
    const careerAuto = careers.find((c) => c.name === 'Mecánica Automotriz')!;
    const careerDG = careers.find((c) => c.name === 'Diseño Gráfico')!;
    const careerGast = careers.find((c) => c.name === 'Gastronomía')!;
    const careerEdu = careers.find((c) => c.name === 'Educación Inicial')!;
    const careerDepo = careers.find((c) => c.name === 'Entrenamiento Deportivo')!;

    const csTemplateData = [
        // Desarrollo de Software (Presencial)
        { name: 'F-SW-01 - Enlace al Repositorio de Código (GitHub/GitLab)', sortOrder: 8, careerId: careerSW.id },
        { name: 'F-SW-02 - Manual Técnico del Proyecto de Software', sortOrder: 9, careerId: careerSW.id },
        // Desarrollo de Software (En Línea)
        { name: 'F-SW-01 - Enlace al Repositorio de Código (GitHub/GitLab)', sortOrder: 8, careerId: careerSWOnline.id },
        { name: 'F-SW-02 - Manual Técnico del Proyecto de Software', sortOrder: 9, careerId: careerSWOnline.id },
        // Redes & Telecomunicaciones
        { name: 'F-RED-01 - Diagrama de Red y Topología Implementada', sortOrder: 8, careerId: careerRedes.id },
        { name: 'F-RED-02 - Reporte de Configuración de Equipos', sortOrder: 9, careerId: careerRedes.id },
        // Electrónica
        { name: 'F-ELEC-01 - Bitácora de Montaje y Pruebas Electrónicas', sortOrder: 8, careerId: careerElec.id },
        // Mecánica Automotriz
        { name: 'F-AUTO-01 - Bitácora de Mantenimiento Vehicular', sortOrder: 8, careerId: careerAuto.id },
        { name: 'F-AUTO-02 - Ficha Técnica de Vehículos Intervenidos', sortOrder: 9, careerId: careerAuto.id },
        // Diseño Gráfico
        { name: 'F-DG-01 - Portafolio Digital de Trabajos Realizados', sortOrder: 8, careerId: careerDG.id },
        // Gastronomía
        { name: 'F-GAST-01 - Recetario y Mise en Place Documentado', sortOrder: 8, careerId: careerGast.id },
        { name: 'F-GAST-02 - Control de Temperatura y Normas HACCP', sortOrder: 9, careerId: careerGast.id },
        // Educación Inicial
        { name: 'F-EDU-01 - Planificación Microcurricular Aplicada', sortOrder: 8, careerId: careerEdu.id },
        { name: 'F-EDU-02 - Diario de Campo Pedagógico', sortOrder: 9, careerId: careerEdu.id },
        // Entrenamiento Deportivo
        { name: 'F-DEP-01 - Plan de Entrenamiento Individualizado', sortOrder: 8, careerId: careerDepo.id },
        { name: 'F-DEP-02 - Ficha de Evaluación Física del Deportista', sortOrder: 9, careerId: careerDepo.id },
    ];

    const careerSpecificTemplates = await (prisma.documentTemplate as any).createManyAndReturn({
        data: csTemplateData.map(t => ({ name: t.name, sortOrder: t.sortOrder, isRequired: true, careerId: t.careerId })),
    });

    const allTemplates = [...globalTemplates, ...careerSpecificTemplates];
    console.log(`    ${allTemplates.length} plantillas creadas (${globalTemplates.length} globales + ${careerSpecificTemplates.length} específicas por carrera).\n`);

    // ─── 4. EMPRESAS Y CONVENIOS ────────────────────────────────────────────────
    // Empresas reales y organismos públicos de Quito, seleccionados según los
    // perfiles profesionales de cada carrera del ISTPET.
    console.log(' [4/12] Creando empresas y convenios...');
    const companiesData = [
        // ── TI: Desarrollo de Software / Redes / Electrónica ──────────────────
        { name: 'Kruger Corp', ruc: '1797766554001', address: 'Cumbayá, Paseo San Francisco Lc-12', rep: 'Ernesto Kruger', email: 'hr@krugercorp.com', convenio: 'Activo', sector: 'Tecnología' },
        { name: 'Ministerio de Telecomunicaciones (MINTEL)', ruc: '1760000010001', address: 'Quito, Av. 6 de Diciembre N25-75 y Colón', rep: 'Galo Cevallos', email: 'practicas@mintel.gob.ec', convenio: 'Activo', sector: 'Gobierno' },
        { name: 'CNT EP', ruc: '1760000030001', address: 'Quito, Av. Amazonas N39-137 y Villalengua', rep: 'Byron Espinoza', email: 'practicas@cnt.gob.ec', convenio: 'Activo', sector: 'Telecomunicaciones' },
        { name: 'Claro Ecuador S.A.', ruc: '1791345678001', address: 'Quito, Av. República de El Salvador N36-140', rep: 'Verónica Mora', email: 'practicantes@claro.com.ec', convenio: 'Activo', sector: 'Telecomunicaciones' },
        { name: 'Consejo de la Judicatura', ruc: '1768006130001', address: 'Quito, Av. Amazonas N37-101 y Unión Nacional', rep: 'Patricia Solís', email: 'practicas@funcionjudicial.gob.ec', convenio: 'Activo', sector: 'Gobierno' },
        // ── Mecánica Automotriz ────────────────────────────────────────────────
        { name: 'Toyota Casabaca S.A.', ruc: '1799887766001', address: 'Quito, Av. Simón Bolívar km 12, Valle de Los Chillos', rep: 'Mónica Ruiz', email: 'rrhh@casabaca.com', convenio: 'Activo', sector: 'Automotriz' },
        { name: 'Automotores Continental S.A.', ruc: '1790226553001', address: 'Quito, Av. 10 de Agosto N36-211 y Naciones Unidas', rep: 'Rodrigo Cedeño', email: 'rrhh@autoconti.com.ec', convenio: 'Activo', sector: 'Automotriz' },
        { name: 'MARESA (Manufacturas Armaduría y Rep. S.A.)', ruc: '1790014932001', address: 'Quito, Av. Galo Plaza Lasso km 7.5', rep: 'Carlos Olmedo', email: 'practicantes@maresa.com.ec', convenio: 'Expirado', sector: 'Automotriz' },
        // ── Diseño Gráfico ────────────────────────────────────────────────────
        { name: 'Ministerio de Turismo del Ecuador', ruc: '1760000060001', address: 'Quito, Av. Eloy Alfaro N32-300 y Carlos Tobar', rep: 'Andrea Vallejo', email: 'practicas@turismo.gob.ec', convenio: 'Activo', sector: 'Gobierno' },
        { name: 'Grupo El Comercio C.A.', ruc: '1790011801001', address: 'Quito, Av. Pedro Vicente Maldonado y El Tablón', rep: 'Santiago Rivadeneira', email: 'practicas@elcomercio.com', convenio: 'Activo', sector: 'Medios de Comunicación' },
        // ── Contabilidad / Marketing / Talento Humano ─────────────────────────
        { name: 'Corporación Favorita C.A.', ruc: '1791122334001', address: 'Quito, Av. General Enríquez 1360, Sangolquí', rep: 'Ricardo Noboa', email: 'rrhh@favorita.ec', convenio: 'Activo', sector: 'Comercio' },
        { name: 'Servicio de Rentas Internas (SRI)', ruc: '1760000020001', address: 'Quito, Av. Amazonas 4430 y Villalengua', rep: 'Mireya Zambrano', email: 'practicas@sri.gob.ec', convenio: 'Activo', sector: 'Gobierno' },
        { name: 'Banco Pichincha C.A.', ruc: '1790011223001', address: 'Quito, Av. Amazonas N35-211 y Japón', rep: 'Lucía Mendoza', email: 'talento@pichincha.com', convenio: 'Activo', sector: 'Financiero' },
        { name: 'Instituto Ecuatoriano de Seguridad Social (IESS)', ruc: '1760000070001', address: 'Quito, Av. 10 de Agosto 2270 y Briceño', rep: 'Jorge Freire', email: 'practicas@iess.gob.ec', convenio: 'En Trámite', sector: 'Gobierno' },
        // ── Educación Inicial / Básica / Inclusiva ────────────────────────────
        { name: 'Unidad Educativa Municipal "Quitumbe"', ruc: '1768150310001', address: 'Quito, Av. Rumichaca y Av. Quitumbe Ñan', rep: 'Lic. Rosa Taipe', email: 'practicas@quitumbe.edu.ec', convenio: 'Activo', sector: 'Educación' },
        { name: 'Jardín de Infantes Municipal Chillogallo', ruc: '1768200110001', address: 'Quito, Av. Matilde Álvarez S/N, Chillogallo', rep: 'Lic. Margarita Simba', email: 'practicas@chillogallo.edu.ec', convenio: 'Activo', sector: 'Educación' },
        { name: 'Ministerio de Educación', ruc: '1760000050001', address: 'Quito, Av. Amazonas N34-451 y Atahualpa', rep: 'Carlos Tobar', email: 'practicaspreprofesionales@educacion.gob.ec', convenio: 'Activo', sector: 'Gobierno' },
        // ── Entrenamiento Deportivo ───────────────────────────────────────────
        { name: 'Liga Deportiva Universitaria de Quito (LDU)', ruc: '1790011001001', address: 'Quito, Estadio Rodrigo Paz Delgado, Av. Galo Plaza', rep: 'Gustavo Morán', email: 'practicas@ldu.com.ec', convenio: 'Activo', sector: 'Deportes' },
        { name: 'Ministerio del Deporte', ruc: '1760000040001', address: 'Quito, Av. 6 de Diciembre N25-95 y Colón', rep: 'Alexandra Torres', email: 'practicas@deporte.gob.ec', convenio: 'Activo', sector: 'Gobierno' },
        // ── Gastronomía ───────────────────────────────────────────────────────
        { name: 'JW Marriott Hotel Quito', ruc: '1791500300001', address: 'Quito, Av. Orellana 1172 y Av. Amazonas', rep: 'Chef Roberto Alarcón', email: 'rrhh@marriottquito.com', convenio: 'Activo', sector: 'Hospitalidad' },
        { name: 'Restaurant Zazu', ruc: '1792100450001', address: 'Quito, Mariano Aguilera 331 y La Pradera', rep: 'Chef Rodrigo Pacheco', email: 'practicas@zazuquito.com', convenio: 'Activo', sector: 'Gastronomía' },
    ];

    const companies = await (prisma.company as any).createManyAndReturn({
        data: companiesData.map(c => ({
            ruc: c.ruc,
            name: c.name,
            address: c.address,
            representative: c.rep,
            email: c.email,
            phone: `02${randInt(2, 3)}${randInt(100000, 999999)}`,
            city: 'Quito',
            sector: c.sector,
        })),
    });

    await prisma.agreement.createMany({
        data: companies.map((comp, i) => ({
            companyId: comp.id,
            startDate: daysAgo(randInt(60, 730)),
            filePath: docUrl(`CONVENIO_${comp.name}`),
            status: companiesData[i].convenio,
        })),
    });
    console.log(`    ${companies.length} empresas y ${companies.length} convenios creados.\n`);

    // Índices en companies[] alineados con companiesData (solo convenios activos o en trámite).
    const careerCompanyIndices: number[][] = [
        [0, 1, 4],       // Desarrollo de Software (Presencial) → TI
        [0, 1, 2],       // Electrónica
        [2, 3, 1],       // Redes & Telecomunicaciones
        [0, 1, 4],       // Desarrollo de Software (En Línea)
        [5, 6],          // Mecánica Automotriz
        [8, 9],          // Diseño Gráfico
        [11, 12, 10],    // Contabilidad y Asesoría Tributaria
        [9, 10, 12],     // Marketing & Comercio Electrónico
        [10, 12, 13],    // Talento Humano
        [15, 14],        // Educación Inicial
        [14, 16],        // Educación Básica
        [14, 16],        // Educación Inclusiva
        [17, 18],        // Entrenamiento Deportivo
        [19, 20],        // Gastronomía
    ];
    const careerIndexById = new Map<string, number>(
        careers.map((c, idx) => [c.id, idx]),
    );
    const pickCompanyForStudent = (careerId: string, assignmentIndex: number): Company => {
        const ci: number = careerIndexById.get(careerId) ?? 0;
        const pool = careerCompanyIndices[ci] ?? [0];
        return companies[pool[assignmentIndex % pool.length]];
    };

    // ─── 5. USUARIOS ──────────────────────────────────────────────────────────
    console.log(' [5/12] Creando usuarios por rol...');

    // Admin del sistema (email ASCII: sin ñ para validación HTML5 del login)
    const adminUser = await prisma.user.create({
        data: {
            email: 'cristhofer.parreno@adm.istpet.edu.ec',
            password,
            fullName: 'Cristhofer Parreño',
            role: Role.ADMIN,
            ...lopdp,
        },
    });

    // Coordinador General de Prácticas Preprofesionales — ISTPET
    // En ISTs de este tamaño un solo coordinador supervisa todas las carreras.
    const coordinator = await prisma.user.create({
        data: {
            email: 'wilfrido.trujillo@coo.istpet.edu.ec',
            password,
            fullName: 'Wilfrido Trujillo',
            role: Role.COORDINADOR,
            cedula: genCedula(),
            phone: genPhone(),
            ...lopdp,
        },
    });
    // Envolver en array para que el resto del seed pueda usar coordinators[n] sin cambios
    const coordinators = [coordinator];

    // Tutores académicos — docentes del ISTPET asignados por carrera
    // Array indexado por índice de carrera (ci) para garantizar emails únicos,
    // incluso cuando la misma carrera existe en varias modalidades.
    const tutorsByCareerIdx: string[][] = [
        ['Ing. Andrés Gallegos Larrea', 'Ing. Paola Cisneros Méndez'],      // ci=0  Desarrollo de Software (Presencial)
        ['Ing. Diego Ramírez Castro', 'Ing. Luis Ortiz Pérez'],           // ci=1  Electrónica
        ['Ing. Javier Salazar Vaca', 'Ing. Elena Gómez Torres'],         // ci=2  Redes & Telecomunicaciones
        ['Ing. Roberto Torres Almeida', 'Ing. Fernanda Larrea Vaca'],        // ci=3  Desarrollo de Software (En Línea)
        ['Tec. Ricardo Toapanta Moreira', 'Tec. Fernando Arias Gallegos'],     // ci=4  Mecánica Automotriz
        ['Dis. Valentina López Enríquez', 'Dis. Sebastián Ponce Villacís'],  // ci=5  Diseño Gráfico
        ['CPA. Natalia Quiñonez Freire', 'CPA. Patricia Almeida Herrera'],    // ci=6  Contabilidad y Asesoría Tributaria
        ['Ing. Miguel Burbano Larrea', 'Ing. Gabriela Méndez Salazar'],    // ci=7  Marketing & Comercio Electrónico
        ['Psic. Daniela Castro Vaca', 'Psic. Carlos Cisneros López'],      // ci=8  Talento Humano
        ['Lic. Mariana Ortiz Ramírez', 'Lic. Lucía Torres Arias'],          // ci=9  Educación Inicial
        ['Lic. Sofía Pérez Gallegos', 'Lic. Juan Gómez Toapanta'],         // ci=10 Educación Básica
        ['Lic. Camila Herrera Ponce', 'Lic. Mateo Enríquez Moreira'],      // ci=11 Educación Inclusiva
        ['Lic. Alejandro Villacís Freire', 'Lic. Isabella Quiñonez Burbano'],  // ci=12 Entrenamiento Deportivo
        ['Chef. Carmen Almeida Salazar', 'Chef. Ricardo Larrea Cisneros'],    // ci=13 Gastronomía
    ];

    const tutorsAcadData: any[] = [];
    for (let ci = 0; ci < careers.length; ci++) {
        const career = careers[ci];
        const names = tutorsByCareerIdx[ci] ?? [`Ing. Docente ${career.name} A`, `Ing. Docente ${career.name} B`];
        for (let t = 0; t < names.length; t++) {
            tutorsAcadData.push({
                email: toEmail(names[t], 'tut.istpet.edu.ec'),
                password,
                fullName: names[t],
                role: Role.TUTOR,
                careerId: career.id,
                cedula: genCedula(),
                phone: genPhone(),
                ...lopdp,
            });
        }
    }
    const tutorsAcad = await (prisma.user as any).createManyAndReturn({ data: tutorsAcadData });

    // Supervisores empresariales — un representante con nombre real por empresa
    const tutorsEmp = await (prisma.user as any).createManyAndReturn({
        data: companies.map(comp => {
            const empName = getUniqueName();
            return {
                email: toEmail(empName, comp.email.split('@')[1]),
                password,
                fullName: empName,
                role: Role.EMPRESA,
                companyId: comp.id,
                cedula: genCedula(),
                phone: genPhone(),
                ...lopdp,
            };
        }),
    });

    // Representantes adicionales con acceso al portal por empresa
    await prisma.user.createMany({
        data: Array.from({ length: 4 }).map((_, i) => {
            const portalName = getUniqueName();
            return {
                email: toEmail(portalName, companies[i].email.split('@')[1]),
                password,
                fullName: portalName,
                role: Role.EMPRESA,
                companyId: companies[i].id,
                ...lopdp,
            };
        }),
    });

    // Estudiantes (60: cubrir todos los escenarios posibles)
    const students = await (prisma.user as any).createManyAndReturn({
        data: Array.from({ length: 60 }).map((_, i) => {
            const name = getUniqueName();
            return {
                email: toEmail(name, 'est.istpet.edu.ec'),
                password,
                fullName: name,
                role: Role.ESTUDIANTE,
                careerId: careers[i % careers.length].id,
                cedula: genCedula(),
                phone: genPhone(),
                ciclo: `${['1er', '2do', '3er', '4to', '5to', '6to'][randInt(0, 5)]} Ciclo`,
                ...lopdp,
            };
        }),
    });

    // Usuario con cuenta bloqueada (por intentos fallidos)
    const blockedName = 'Carlos Mendoza Ríos';
    await prisma.user.create({
        data: {
            email: toEmail(blockedName, 'est.istpet.edu.ec'),
            password,
            fullName: blockedName,
            role: Role.ESTUDIANTE,
            careerId: careers[0].id,
            failedAttempts: 5,
            lockoutUntil: new Date(Date.now() + 30 * 60 * 1000),
            lopdpAccepted: false,
        },
    });

    console.log(
        `    1 admin + 1 coordinador + ${tutorsAcad.length} tutores acad. + ` +
        `${tutorsEmp.length} supervisores + 4 portales empresa + ${students.length} estudiantes + 1 bloqueado.\n`,
    );

    // ─── 5b. REGISTROS LOPDP ──────────────────────────────────────────────────
    console.log(' [5b] Creando logs de aceptación LOPDP...');
    const allUsersForLopdp = [adminUser, ...coordinators, ...tutorsAcad, ...tutorsEmp, ...students];
    await prisma.lopdpLog.createMany({
        data: allUsersForLopdp.filter(u => u.lopdpAccepted).map(u => ({
            userId: u.id,
            fullName: u.fullName,
            email: u.email,
            ip: `192.168.${randInt(1, 10)}.${randInt(1, 254)}`,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            acceptedAt: daysAgo(randInt(30, 90)),
        })),
    });
    console.log(`    ${allUsersForLopdp.length} logs de aceptación LOPDP creados.\n`);

    // ─── 6. CREDENCIALES WEBAUTHN ─────────────────────────────────────────────
    console.log(' [6/12] Creando credenciales WebAuthn...');
    // Registrar credencial para el admin y 5 tutores
    const webauthnUsers = [adminUser, ...tutorsAcad.slice(0, 5)];
    await prisma.userCredential.createMany({
        data: webauthnUsers.map((u, i) => ({
            userId: u.id,
            credentialId: `cred-${u.id.substring(0, 8)}-${i}`,
            publicKey: `-----BEGIN PUBLIC KEY-----\nMFkwEwYH${Buffer.from(u.id).toString('base64').substring(0, 40)}\n-----END PUBLIC KEY-----`,
            counter: randInt(1, 50),
        })),
    });
    console.log(`    ${webauthnUsers.length} credenciales WebAuthn registradas.\n`);

    // Supervisor principal EMPRESA por compañía (mismo orden que companies[]).
    const empresaUserByCompanyId = new Map<string, string>(
        companies.map((comp, idx) => [comp.id, tutorsEmp[idx].id]),
    );

    // ─── 7. PRÁCTICAS CON CICLO DE VIDA COMPLETO ──────────────────────────────
    console.log(' [7/12] Generando prácticas con ciclo de vida completo...');

    /**
     * Escenarios distribuidos entre los 60 estudiantes:
     *  0-9  (10): Finalizadas — todos los documentos aprobados + evaluaciones completas
     * 10-19 (10): En proceso avanzado — documentos mixtos, varios en revisión
     * 20-29 (10): En proceso con rechazos — al menos un documento rechazado con historial de versiones
     * 30-39 (10): En proceso temprano — solo F01 aprobado, el resto pendiente
     * 40-49 (10): Recién iniciadas — sin documentos aún o solo F01
     * 50-59 (10): En proceso con incumplimientos — asistencia irregular, documentos incumplidos
     */

    let internshipsCreated: Internship[] = [];
    const internshipsData: any[] = [];
    const studentInternshipMap: any[] = []; // Para trackear qué estudiante tiene qué index de internship
    const careerAssignmentCounts = new Map<string, number>();

    for (let i = 0; i < students.length; i++) {
        const s = students[i];
        const career = careers.find((c) => c.id === s.careerId)!;
        // Tutor académico de la misma carrera del estudiante.
        const careerTutors = tutorsAcad.filter((t: any) => t.careerId === s.careerId);
        const tutor = careerTutors[i % Math.max(careerTutors.length, 1)] ?? tutorsAcad[0];
        const careerAssignments = careerAssignmentCounts.get(s.careerId) ?? 0;
        careerAssignmentCounts.set(s.careerId, careerAssignments + 1);
        const company = pickCompanyForStudent(s.careerId, careerAssignments);
        const reqHours = (career?.config as any)?.requiredHours ?? 160;

        // Determinar escenario
        let status = 'En Proceso';
        let startOffset = 60;
        let hoursCompleted = 0;

        if (i < 10) {
            status = 'Finalizado';
            startOffset = 130;
            hoursCompleted = reqHours;
        } else if (i < 20) {
            status = 'En Proceso';
            startOffset = 80;
            hoursCompleted = Math.floor(reqHours * 0.75);
        } else if (i < 30) {
            status = 'En Proceso';
            startOffset = 70;
            hoursCompleted = Math.floor(reqHours * 0.6);
        } else if (i < 40) {
            status = 'En Proceso';
            startOffset = 30;
            hoursCompleted = Math.floor(reqHours * 0.25);
        } else if (i < 50) {
            status = 'En Proceso';
            startOffset = 10;
            hoursCompleted = Math.floor(reqHours * 0.05);
        } else {
            status = 'En Proceso';
            startOffset = 90;
            hoursCompleted = Math.floor(reqHours * 0.4);
        }

        const careerModalidad = career?.modalidad ?? Modalidad.PRESENCIAL;
        let internshipModalidad: Modalidad;
        if (careerModalidad === Modalidad.EN_LINEA) {
            internshipModalidad = i % 3 === 0 ? Modalidad.HIBRIDA : Modalidad.EN_LINEA;
        } else if (careerModalidad === Modalidad.SEMIPRESENCIAL) {
            internshipModalidad = i % 4 === 0 ? Modalidad.EN_LINEA : Modalidad.SEMIPRESENCIAL;
        } else if (careerModalidad === Modalidad.HIBRIDA) {
            internshipModalidad = i % 2 === 0 ? Modalidad.PRESENCIAL : Modalidad.HIBRIDA;
        } else {
            internshipModalidad = i % 5 === 0 ? Modalidad.HIBRIDA : Modalidad.PRESENCIAL;
        }

        const hasPhysicalLocation = internshipModalidad === Modalidad.PRESENCIAL || internshipModalidad === Modalidad.HIBRIDA || internshipModalidad === Modalidad.SEMIPRESENCIAL;
        const locationText = hasPhysicalLocation ? company.address : null;

        internshipsData.push({
            studentId: s.id,
            tutorId: tutor.id,
            companyId: company.id,
            careerId: s.careerId,
            startDate: daysAgo(startOffset),
            endDate: status === 'Finalizado' ? daysAgo(5) : null,
            totalHours: reqHours,
            status,
            modalidad: internshipModalidad,
            location: locationText,
            allowedLocations: hasPhysicalLocation ? [
                {
                    label: 'Sede Principal',
                    lat: -0.1601 + i * 0.001,
                    lng: -78.4701 + i * 0.001,
                    radiusM: 250,
                },
                {
                    label: 'Sede Secundaria / Sucursal',
                    lat: -0.2100 + i * 0.001,
                    lng: -78.5000 + i * 0.001,
                    radiusM: 300,
                },
            ] : (Prisma as any).JsonNull,
        });

        studentInternshipMap.push({
            index: i,
            studentId: s.id,
            tutorId: tutor.id,
            companyId: company.id,
            careerId: s.careerId,
            status,
            startOffset,
            hoursCompleted,
            internshipModalidad,
            hasPhysicalLocation,
        });
    }

    (internshipsCreated as any) = await (prisma.internship as any).createManyAndReturn({ data: internshipsData });

    const historyBatch: any[] = [];
    const attendanceBatchData: any[] = [];
    const docsBatchData: any[] = [];
    const visitsBatchData: any[] = [];
    const evalBatchData: any[] = [];

    for (let i = 0; i < internshipsCreated.length; i++) {
        const internship = internshipsCreated[i];
        const sInfo = studentInternshipMap[i];

        // Historial
        historyBatch.push({
            internshipId: internship.id,
            oldStatus: null,
            newStatus: 'En Proceso',
            changedById: coordinators[i % coordinators.length].id,
            createdAt: sInfo.startOffset ? daysAgo(sInfo.startOffset) : new Date(),
        });
        if (sInfo.status === 'Finalizado') {
            historyBatch.push({
                internshipId: internship.id,
                oldStatus: 'En Proceso',
                newStatus: 'Finalizado',
                changedById: sInfo.tutorId,
                createdAt: daysAgo(5),
                reason: 'Horas completadas y documentación aprobada en su totalidad.',
            });
        }

        // Preparar Asistencias
        const numAtt = Math.max(1, Math.min(Math.floor(sInfo.hoursCompleted / 4), 30));
        for (let j = 0; j < numAtt; j++) {
            const checkIn = daysAgo(sInfo.startOffset - j * 2);
            checkIn.setHours(7 + randInt(0, 1), randInt(0, 59));
            const checkOut = new Date(checkIn);
            const missingCheckout = i >= 50 && j % 4 === 0;
            if (!missingCheckout) {
                checkOut.setHours(checkIn.getHours() + randInt(4, 8));
            }
            const isOnline = sInfo.internshipModalidad === Modalidad.EN_LINEA;

            attendanceBatchData.push({
                internshipId: internship.id,
                checkIn,
                checkOut: missingCheckout ? null : checkOut,
                lat: isOnline ? 0 : -0.1601 + i * 0.001,
                lng: isOnline ? 0 : -78.4701 + i * 0.001,
                distanceKm: isOnline ? 0 : (randInt(0, 1) === 0 ? 0.05 : 0.15),
                checkInPhoto: isOnline ? null : photoUrl(`in-${internship.id}-${j}`),
                checkOutPhoto: (isOnline || missingCheckout) ? null : photoUrl(`out-${internship.id}-${j}`),
                _meta: { studentIndex: i, attendanceIndex: j } // Metadata temporal
            });
        }

        // Preparar Documentos
        const applicableTemplates = allTemplates.filter(
            (t) => t.careerId === null || t.careerId === sInfo.careerId || !t.careerId,
        );

        for (let ti = 0; ti < applicableTemplates.length; ti++) {
            const tmpl = applicableTemplates[ti];
            let docStatus: DocumentStatus = DocumentStatus.PENDIENTE;
            let hasFile = false;
            let submittedAt: Date | null = null;
            let reviewedAt: Date | null = null;
            let isDigitallySigned = false;
            let signatureDate: Date | null = null;
            let signatureKey: string | null = null;

            if (i < 10) {
                docStatus = DocumentStatus.APROBADO_DEFINITIVO;
                hasFile = true;
                submittedAt = daysAgo(sInfo.startOffset - 30 + ti * 3);
                reviewedAt = daysAgo(sInfo.startOffset - 20 + ti * 2);
                if (tmpl.isCertificateSlot) {
                    isDigitallySigned = true;
                    signatureDate = daysAgo(6);
                    signatureKey = `SHA256:${Buffer.from(sInfo.studentId).toString('hex').substring(0, 32)}`;
                }
            } else if (i < 20) {
                if (ti === 0) { docStatus = DocumentStatus.APROBADO_DEFINITIVO; hasFile = true; submittedAt = daysAgo(50); reviewedAt = daysAgo(40); }
                else if (ti === 1) { docStatus = DocumentStatus.APROBADO_TUTOR; hasFile = true; submittedAt = daysAgo(35); reviewedAt = daysAgo(25); }
                else if (ti === 2) { docStatus = DocumentStatus.EN_REVISION_TUTOR; hasFile = true; submittedAt = daysAgo(15); }
                else if (ti === 3) { docStatus = DocumentStatus.APROBADO_DEFINITIVO; hasFile = true; submittedAt = daysAgo(30); reviewedAt = daysAgo(20); }
                else { docStatus = DocumentStatus.PENDIENTE; hasFile = false; }
            } else if (i < 30) {
                if (ti === 0) { docStatus = DocumentStatus.APROBADO_DEFINITIVO; hasFile = true; submittedAt = daysAgo(50); reviewedAt = daysAgo(40); }
                else if (ti === 1) { docStatus = DocumentStatus.RECHAZADO_TUTOR; hasFile = true; submittedAt = daysAgo(35); }
                else if (ti === 2) { docStatus = DocumentStatus.RECHAZADO_COORDINADOR; hasFile = true; submittedAt = daysAgo(30); }
                else if (ti === 3) { docStatus = DocumentStatus.EN_REVISION_TUTOR; hasFile = true; submittedAt = daysAgo(10); }
                else { docStatus = DocumentStatus.PENDIENTE; hasFile = false; }
            } else if (i < 40) {
                if (ti === 0) { docStatus = DocumentStatus.APROBADO_DEFINITIVO; hasFile = true; submittedAt = daysAgo(20); reviewedAt = daysAgo(15); }
                else if (ti === 1) { docStatus = DocumentStatus.EN_REVISION_TUTOR; hasFile = true; submittedAt = daysAgo(7); }
                else { docStatus = DocumentStatus.PENDIENTE; hasFile = false; }
            } else if (i < 50) {
                if (ti === 0) { docStatus = DocumentStatus.EN_REVISION_TUTOR; hasFile = true; submittedAt = daysAgo(3); }
                else { docStatus = DocumentStatus.PENDIENTE; hasFile = false; }
            } else {
                if (ti === 0) { docStatus = DocumentStatus.APROBADO_DEFINITIVO; hasFile = true; submittedAt = daysAgo(60); reviewedAt = daysAgo(55); }
                else if (ti === 1) { docStatus = DocumentStatus.APROBADO_TUTOR; hasFile = true; submittedAt = daysAgo(45); reviewedAt = daysAgo(40); }
                else if (ti === 2) { docStatus = DocumentStatus.INCUMPLIDO; hasFile = false; }
                else if (ti === 3) { docStatus = DocumentStatus.EN_REVISION_TUTOR; hasFile = true; submittedAt = daysAgo(20); }
                else if (ti === 4) { docStatus = DocumentStatus.RECHAZADO_TUTOR; hasFile = true; submittedAt = daysAgo(30); }
                else { docStatus = DocumentStatus.PENDIENTE; hasFile = false; }
            }

            docsBatchData.push({
                internshipId: internship.id,
                templateId: tmpl.id,
                name: tmpl.name,
                status: docStatus,
                filePath: hasFile
                    ? docUrl(i < 30 && (docStatus === DocumentStatus.RECHAZADO_TUTOR || docStatus === DocumentStatus.RECHAZADO_COORDINADOR)
                        ? `${tmpl.name}_V2_${students[i].fullName}`
                        : `${tmpl.name}_${students[i].fullName}`)
                    : null,
                sortOrder: tmpl.sortOrder,
                isRequired: tmpl.isRequired,
                isCertificateSlot: tmpl.isCertificateSlot,
                submittedAt,
                reviewedAt,
                isDigitallySigned,
                signatureDate,
                signatureKey,
                _meta: { studentIndex: i, templateIndex: ti, tutorId: sInfo.tutorId, docStatus, submittedAt, reviewedAt, studentId: sInfo.studentId, tmplName: tmpl.name, fullName: students[i].fullName }
            });
        }

        // Visitas
        const numVisits = i < 10 ? 3 : i < 30 ? 2 : sInfo.hoursCompleted > 40 ? 1 : 0;
        for (let v = 0; v < numVisits; v++) {
            visitsBatchData.push({
                internshipId: internship.id,
                date: daysAgo(sInfo.startOffset - v * 20 - 10),
                type: v % 2 === 0 ? 'PRESENCIAL' : 'VIRTUAL',
                observations: pick(visitObservations),
                evidenceUrl: v % 2 === 0 ? photoUrl(`visit-${i}-${v}`) : null,
            });
        }

        const empresaEvaluatorId = empresaUserByCompanyId.get(sInfo.companyId)!;

        // Evaluaciones
        if (i < 10) {
            evalBatchData.push({
                internshipId: internship.id,
                type: EvaluationType.EMPRESARIAL,
                evaluatorId: empresaEvaluatorId,
                status: 'COMPLETADO',
                punctuality: randInt(4, 5),
                teamwork: randInt(4, 5),
                technicalSkills: randInt(3, 5),
                proactivity: randInt(4, 5),
                attitude: 5,
                observations: `Excelente desempeño. ${pick(['El estudiante demostró gran capacidad técnica.', 'Se integró perfectamente al equipo de trabajo.', 'Superó las expectativas del área.'])}`,
            });
            evalBatchData.push({
                internshipId: internship.id,
                type: EvaluationType.ACADEMICA,
                status: 'COMPLETADO',
                punctuality: randInt(4, 5),
                teamwork: randInt(3, 5),
                technicalSkills: randInt(4, 5),
                proactivity: randInt(3, 5),
                attitude: randInt(4, 5),
                observations: `Cumple satisfactoriamente con los requisitos académicos. ${pick(['Buen dominio de las herramientas.', 'Aplica correctamente los conocimientos teóricos.', 'Reportes bien estructurados.'])}`,
            });
        } else if (i < 20) {
            evalBatchData.push({
                internshipId: internship.id,
                type: EvaluationType.EMPRESARIAL,
                evaluatorId: empresaEvaluatorId,
                status: 'COMPLETADO',
                punctuality: randInt(3, 5),
                teamwork: randInt(3, 5),
                technicalSkills: randInt(2, 5),
                proactivity: randInt(3, 5),
                attitude: randInt(3, 5),
                observations: 'Buen progreso durante el periodo de prácticas.',
            });
            evalBatchData.push({
                internshipId: internship.id,
                type: EvaluationType.ACADEMICA,
                status: 'PENDIENTE',
                punctuality: 0, teamwork: 0, technicalSkills: 0, proactivity: 0, attitude: 0,
            });
        } else if (i < 30) {
            evalBatchData.push({
                internshipId: internship.id,
                type: EvaluationType.EMPRESARIAL,
                evaluatorId: empresaEvaluatorId,
                status: 'PENDIENTE',
                punctuality: 0, teamwork: 0, technicalSkills: 0, proactivity: 0, attitude: 0,
            });
        }
    }

    // Ejecutar batches de nivel 2
    await prisma.internshipStatusHistory.createMany({ data: historyBatch });
    const attendancesCreated = await (prisma.attendance as any).createManyAndReturn({
        data: attendanceBatchData.map(({ _meta, ...d }: any) => d)
    });
    const docsCreated = await (prisma.document as any).createManyAndReturn({
        data: docsBatchData.map(({ _meta, ...d }: any) => d)
    });
    await prisma.monitoringVisit.createMany({ data: visitsBatchData });
    await prisma.evaluation.createMany({ data: evalBatchData });

    // ─── 7b. AUSENCIAS JUSTIFICADAS ───────────────────────────────────────────
    const absenceBatch: Prisma.AbsenceCreateManyInput[] = [];
    for (let i = 0; i < internshipsCreated.length; i++) {
        if (i % 5 === 0) { // Un 20% de estudiantes tienen alguna falta
            const internship = internshipsCreated[i];
            const tutor = tutorsAcad[i % tutorsAcad.length];
            absenceBatch.push({
                internshipId: internship.id,
                date: daysAgo(randInt(10, 50)),
                reason: pick(['Cita médica en el IESS', 'Problemas familiares urgentes', 'Trámites académicos en campus', 'Fallecimiento de familiar cercano']),
                type: pick(['ENFERMEDAD', 'PERSONAL', 'OTRA']),
                status: i % 10 === 0 ? 'APROBADA' : 'PENDIENTE',
                reviewedById: i % 10 === 0 ? tutor.id : null,
                reviewedAt: i % 10 === 0 ? daysAgo(randInt(1, 5)) : null,
                reviewNotes: i % 10 === 0 ? 'Justificativo médico verificado correctamente.' : null,
                filePath: `/uploads/absences/seed/justificativo_${i}.pdf`,
            });
        }
    }
    await prisma.absence.createMany({ data: absenceBatch });
    console.log(`    ${absenceBatch.length} registros de ausencia creados.\n`);

    // Batches de nivel 3: Fotos de actividades, Comentarios, Versiones
    const activityPhotoBatch: any[] = [];
    for (let k = 0; k < attendancesCreated.length; k++) {
        const att = attendancesCreated[k];
        const meta = attendanceBatchData[k]._meta;
        if (meta.attendanceIndex % 2 === 0) {
            const numPhotos = randInt(1, 3);
            for (let p = 0; p < numPhotos; p++) {
                activityPhotoBatch.push({
                    attendanceId: att.id,
                    photoUrl: photoUrl(`work-${meta.studentIndex}-${meta.attendanceIndex}-${p}`),
                    caption: pick([
                        'Desarrollo de módulo de facturación.',
                        'Reunión de seguimiento con el equipo.',
                        'Pruebas unitarias del componente.',
                        'Capacitación en herramientas internas.',
                        'Revisión de código con el supervisor.',
                        'Diseño de arquitectura del sistema.',
                        'Instalación y configuración de servidores.',
                        'Atención al cliente — área de soporte.',
                    ]),
                });
            }
        }
    }
    await prisma.activityPhoto.createMany({ data: activityPhotoBatch });

    const docCommentBatch: any[] = [];
    const docVersionBatch: any[] = [];

    for (let k = 0; k < docsCreated.length; k++) {
        const doc = docsCreated[k];
        const meta = docsBatchData[k]._meta;

        if (meta.docStatus === DocumentStatus.APROBADO_DEFINITIVO || meta.docStatus === DocumentStatus.APROBADO_TUTOR) {
            docCommentBatch.push({
                documentId: doc.id, userId: meta.tutorId, content: pick(approvalComments), createdAt: meta.reviewedAt ?? daysAgo(5)
            });
        }

        if (meta.docStatus === DocumentStatus.EN_REVISION_TUTOR) {
            docCommentBatch.push({
                documentId: doc.id, userId: meta.studentId, content: '¿Hay alguna observación sobre mi documento? Quedo atento a cualquier corrección.', createdAt: meta.submittedAt ?? daysAgo(3)
            });
        }

        if (meta.docStatus === DocumentStatus.RECHAZADO_TUTOR) {
            docVersionBatch.push({
                documentId: doc.id, filePath: docUrl(`${meta.tmplName}_V1_${meta.fullName}`), observations: 'Primera versión enviada. Rechazada por el tutor académico.', createdAt: daysAgo(randInt(20, 45))
            });
            docCommentBatch.push({ documentId: doc.id, userId: meta.tutorId, content: pick(tutorRejectionComments), createdAt: daysAgo(randInt(12, 20)) });
            docCommentBatch.push({ documentId: doc.id, userId: meta.studentId, content: pick(studentResponses), createdAt: daysAgo(randInt(5, 11)) });
        }

        if (meta.docStatus === DocumentStatus.RECHAZADO_COORDINADOR) {
            docVersionBatch.push({
                documentId: doc.id, filePath: docUrl(`${meta.tmplName}_V1_${meta.fullName}`), observations: 'Versión revisada por tutor. Rechazada por coordinación.', createdAt: daysAgo(randInt(20, 35))
            });
            docCommentBatch.push({ documentId: doc.id, userId: coordinators[meta.studentIndex % coordinators.length].id, content: pick(coordRejectionComments), createdAt: daysAgo(randInt(10, 20)) });
            docCommentBatch.push({ documentId: doc.id, userId: meta.studentId, content: pick(studentResponses), createdAt: daysAgo(randInt(3, 9)) });
        }

        if (meta.docStatus === DocumentStatus.INCUMPLIDO) {
            docCommentBatch.push({
                documentId: doc.id, userId: coordinators[meta.studentIndex % coordinators.length].id, content: 'El estudiante no entregó este documento dentro del plazo establecido. Se marca como incumplido según el reglamento vigente.',
            });
        }

        if (meta.studentIndex < 30 && meta.templateIndex === 3 && meta.docStatus === DocumentStatus.EN_REVISION_TUTOR) {
            for (let v = 0; v < 2; v++) {
                docVersionBatch.push({
                    documentId: doc.id,
                    filePath: docUrl(`${meta.tmplName}_V${v + 1}_${meta.fullName}`),
                    observations: v === 0 ? 'Versión inicial.' : 'Segunda versión con correcciones aplicadas según indicaciones del tutor.',
                    createdAt: daysAgo(15 - v * 4),
                });
            }
            docCommentBatch.push({
                documentId: doc.id, userId: meta.tutorId, content: 'Revisando la nueva versión. En breve recibirán retroalimentación detallada.'
            });
        }
    }

    await prisma.documentComment.createMany({ data: docCommentBatch });
    await prisma.documentVersion.createMany({ data: docVersionBatch });

    console.log(`    ${internshipsCreated.length} prácticas generadas con documentos, asistencias, visitas y evaluaciones.\n`);

    // ─── 8. SYSTEM LOGS (1500+) ───────────────────────────────────────────────
    console.log(' [8/12] Generando logs de auditoría (1500+)...');
    const logCategories = ['AUTH', 'HTTP', 'SYSTEM', 'PRIVACY', 'GPS', 'EMAIL', 'DOCUMENT'];
    const logBatch: Prisma.SystemLogCreateManyInput[] = [];

    for (let i = 0; i < 1500; i++) {
        const cat = logCategories[i % logCategories.length];
        const isError = i % 50 === 0;
        const isWarn = i % 20 === 0;

        // Generar metadatos realistas según la categoría
        let metadata: any = null;
        const simulatedUserAgent = pick([
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/605.1.15',
            'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
        ]);

        if (cat === 'AUTH') {
            metadata = {
                authMethod: pick(['Credentials', 'WebAuthn', 'JWT']),
                userAgent: simulatedUserAgent,
                loginAttempts: isWarn ? randInt(2, 4) : isError ? 5 : 1,
                sessionTimeoutSec: 7200,
                mfaVerified: pick([true, false])
            };
        } else if (cat === 'HTTP') {
            metadata = {
                userAgent: simulatedUserAgent,
                acceptLanguage: pick(['es-EC,es;q=0.9', 'en-US,en;q=0.5']),
                query: i % 3 === 0 ? { page: String(randInt(1, 5)), limit: '10' } : null,
                body: i % 2 === 0 ? { action: 'update', targetId: 'uuid-' + i } : null
            };
        } else if (cat === 'SYSTEM') {
            metadata = {
                cpuUsagePercent: randInt(5, 45),
                memoryUsageMB: randInt(120, 512),
                environment: 'production',
                uptimeSeconds: randInt(1000, 864000)
            };
        } else if (cat === 'PRIVACY') {
            metadata = {
                lopdpVersion: '1.0',
                consentAction: pick(['Aceptado', 'Revisado', 'Otorgado']),
                arcoType: pick(['ACCESO', 'RECTIFICACION', 'CANCELACION', 'OPOSICION', 'PORTABILIDAD']),
                termsApproved: true
            };
        } else if (cat === 'GPS') {
            metadata = {
                coordinates: {
                    lat: -0.1601 + (i % 20) * 0.001,
                    lng: -78.4701 + (i % 20) * 0.001
                },
                allowedRadiusMeters: 250,
                distanceDiffKm: isWarn ? 0.38 : 0.04,
                gpsAccuracyMeters: randInt(3, 15)
            };
        } else if (cat === 'EMAIL') {
            metadata = {
                smtpHost: 'smtp.istpet.edu.ec',
                smtpPort: 587,
                encryption: 'STARTTLS',
                emailProvider: 'TraversariMailServer',
                deliveryAttempts: isError ? 3 : 1
            };
        } else if (cat === 'DOCUMENT') {
            metadata = {
                fileName: `F0${randInt(1, 8)}_documento_${i}.pdf`,
                fileSize: `${(randInt(100, 8000) / 1024).toFixed(2)} MB`,
                isDigitallySigned: i % 4 === 0,
                verificationCode: i % 4 === 0 ? `VERIF-${i}-QR` : null
            };
        }

        logBatch.push({
            level: isError ? 'ERROR' : isWarn ? 'WARN' : 'INFO',
            category: cat,
            message: isError
                ? `[${cat}] Error crítico en evento ${i}: ${pick(['Timeout de base de datos', 'JWT expirado sin renovar', 'Permiso denegado en acceso a recurso', 'Fallo de conexión GPS'])}`
                : isWarn
                    ? `[${cat}] Advertencia en evento ${i}: ${pick(['Sesión próxima a expirar', 'Umbral de intentos fallidos', 'Distancia GPS fuera del rango esperado'])}`
                    : `[${cat}] Operación exitosa ${i}: ${pick(['Login correcto', 'Documento subido', 'Asistencia registrada', 'Evaluación enviada', 'Notificación entregada'])}`,
            actorEmail: pick([
                'admin@istpet.edu.ec',
                `estudiante${(i % 10) + 1}@est.istpet.edu.ec`,
                `tutor.acad${(i % 5) + 1}@istpet.edu.ec`,
            ]),
            method: ['GET', 'POST', 'PATCH', 'DELETE'][i % 4],
            path: pick(['/api/auth/login', '/api/internships', '/api/documents', '/api/attendance', '/api/evaluations']),
            statusCode: isError ? pick([500, 502, 503]) : isWarn ? pick([400, 401, 403]) : 200,
            durationMs: randInt(30, 2000),
            ip: `192.168.${randInt(1, 10)}.${randInt(1, 254)}`,
            createdAt: daysAgo(randInt(0, 90)),
            metadata: metadata || undefined,
        });

        if (logBatch.length >= 150) {
            await prisma.systemLog.createMany({ data: logBatch });
            logBatch.length = 0;
        }
    }
    if (logBatch.length > 0) {
        await prisma.systemLog.createMany({ data: logBatch });
    }
    console.log('    1500 logs de auditoría insertados.\n');

    // ─── 9. EMAIL LOGS ────────────────────────────────────────────────────────
    console.log(' [9/12] Generando historial de correos...');
    const emailSubjects = [
        'Documento rechazado — acción requerida',
        'Nueva práctica asignada',
        'Recordatorio: subir registro de asistencia',
        'Tu evaluación ha sido completada',
        'Convenio por vencer — renovación requerida',
        'Acceso al sistema bloqueado',
        'Notificación de nueva solicitud ARCO',
        'Certificado de finalización de prácticas disponible',
        'Visita de monitoreo programada',
        'Documento aprobado definitivamente',
    ];

    const emailBatch: Prisma.EmailLogCreateManyInput[] = [];
    for (let i = 0; i < 120; i++) {
        const failed = i % 8 === 0;
        emailBatch.push({
            to: `estudiante${(i % 60) + 1}@est.istpet.edu.ec`,
            subject: emailSubjects[i % emailSubjects.length],
            status: failed ? 'FALLIDO' : 'EXITO',
            error: failed
                ? pick(['MTA Connection timeout', 'Invalid recipient address', 'SMTP 550 Mailbox not found'])
                : null,
            sentAt: daysAgo(randInt(0, 60)),
            metadata: { internshipIndex: i % 60, eventType: emailSubjects[i % emailSubjects.length] },
        });
    }
    await prisma.emailLog.createMany({ data: emailBatch });
    console.log('    120 email logs generados.\n');

    // ─── 10. GOBERNANZA: ANUNCIOS Y NOTIFICACIONES ────────────────────────────
    console.log(' [10/12] Creando anuncios y notificaciones...');

    await prisma.announcement.createMany({
        data: [
            {
                title: '¡Bienvenidos al Período Académico 2026-A — ISTPET!',
                content:
                    'El Instituto Superior Tecnológico "Mayor Pedro Traversari" da inicio al nuevo período de prácticas preprofesionales 2026-A. ' +
                    'Todos los estudiantes habilitados deben cargar su F01 - Solicitud de Inicio antes del viernes de esta semana. ' +
                    'Para consultas, contactar a su coordinador de carrera en el campus Chillogallo (Av. Matilde Álvarez y Hugo Díaz Romero) ' +
                    'o escribir a admisiones@istpet.edu.ec.',
                type: 'INFO',
                startDate: daysAgo(10),
                isActive: true,
            },
            {
                title: 'Mantenimiento del Sistema EMITESIS — Sábado 02:00 a 04:00',
                content:
                    'El portal EMITESIS estará fuera de servicio el próximo sábado de 02:00 a 04:00 por actualización de seguridad y respaldo de base de datos. ' +
                    'Planifique sus cargas de documentos con anticipación. Ante emergencias: 02 303 2894.',
                type: 'WARNING',
                startDate: daysAgo(2),
                endDate: daysAgo(-5),
                isActive: true,
            },
            {
                title: 'Proceso de Evaluación Final Abierto — Período 2026-A',
                content:
                    'Los tutores empresariales asignados en el sistema ya pueden ingresar y completar la evaluación de desempeño de sus pasantes. ' +
                    'Plazo máximo: 15 días calendario desde la publicación de este aviso. ' +
                    'Contacto coordinación: coordinador.tic@istpet.edu.ec / coordinador.adm@istpet.edu.ec',
                type: 'SUCCESS',
                startDate: daysAgo(3),
                isActive: true,
            },
            {
                title: 'Recordatorio: Documentos Pendientes por Regularizar',
                content:
                    'Existen estudiantes con documentos pendientes de entrega. Se solicita regularizar la situación antes del cierre del período. ' +
                    'El incumplimiento puede derivar en la no aprobación de las prácticas preprofesionales según el Reglamento ISTPET 2026.',
                type: 'WARNING',
                startDate: daysAgo(1),
                isActive: true,
            },
            {
                title: 'Actualización del Reglamento de Prácticas Preprofesionales 2026',
                content:
                    'Se ha publicado la versión actualizada del Reglamento de Prácticas Preprofesionales del ISTPET, aprobada por el Consejo Académico en sesión del 15 de marzo de 2026. ' +
                    'El documento está disponible en la sección Normativa del portal institucional: https://institutotraversari.edu.ec',
                type: 'INFO',
                startDate: daysAgo(15),
                isActive: true,
            },
            {
                title: 'Aviso: Convenios Vencidos — Renovación Requerida',
                content:
                    'Los convenios con MARESA y el JW Marriott Hotel Quito han expirado. No se podrán asignar nuevos pasantes a estas entidades hasta completar el proceso de renovación. ' +
                    'Coordinación está gestionando la actualización. Estimado de resolución: 30 días.',
                type: 'WARNING',
                startDate: daysAgo(7),
                isActive: true,
            },
            {
                title: 'Congreso CAISEB 2024 — ISTPET',
                content:
                    'El Instituto Traversari participó exitosamente en el II Congreso Académico Internacional CAISEB 2024. ' +
                    'Felicitamos a los estudiantes y docentes que presentaron sus trabajos de investigación en el área de prácticas preprofesionales.',
                type: 'SUCCESS',
                startDate: daysAgo(180),
                isActive: false,
            },
        ],
    });

    // Notificaciones para todos los estudiantes con prácticas activas
    const notifMessages = [
        { title: 'Documento rechazado', message: 'Tu F02 - Plan de Prácticas fue rechazado. Revisa los comentarios del tutor.', type: 'ERROR' },
        { title: 'Documento aprobado', message: 'Tu F01 - Solicitud de Inicio fue aprobada. Continúa con el siguiente formulario.', type: 'SUCCESS' },
        { title: 'Recordatorio de asistencia', message: 'No has registrado asistencia en los últimos 3 días. Verifica tu registro.', type: 'WARNING' },
        { title: 'Evaluación disponible', message: 'Tu evaluación empresarial ha sido completada. Puedes revisarla en tu perfil.', type: 'INFO' },
        { title: 'Visita de monitoreo', message: 'Se ha programado una visita de monitoreo presencial para el próximo miércoles.', type: 'INFO' },
        { title: 'Documento en revisión', message: 'Tu F04 - Informe de Avance está siendo revisado por el coordinador.', type: 'INFO' },
        { title: 'Horas completadas', message: '¡Felicidades! Has completado el 75% de las horas requeridas.', type: 'SUCCESS' },
        { title: 'Documento incumplido', message: 'El plazo para entregar F03 ha vencido. El documento ha sido marcado como incumplido.', type: 'ERROR' },
    ];

    const notifBatch: any[] = [];
    for (let i = 0; i < students.length; i++) {
        const s = students[i];
        const numNotifs = randInt(1, 4);
        for (let n = 0; n < numNotifs; n++) {
            const notif = notifMessages[(i + n) % notifMessages.length];
            notifBatch.push({
                userId: s.id,
                title: notif.title,
                message: notif.message,
                type: notif.type,
                isRead: n === 0 ? false : randInt(0, 1) === 1,
                link: n % 2 === 0 ? '/dashboard/documentos' : '/dashboard/asistencia',
                createdAt: daysAgo(randInt(0, 30)),
            });
        }
    }
    await prisma.inAppNotification.createMany({ data: notifBatch });

    // Notificaciones para tutores y coordinadores
    const extraNotifs: any[] = [];
    for (const tutor of tutorsAcad.slice(0, 5)) {
        extraNotifs.push({
            userId: tutor.id,
            title: 'Documentos pendientes de revisión',
            message: 'Tienes 3 documentos esperando tu revisión.',
            type: 'WARNING',
            isRead: false,
            link: '/tutor/documentos',
        });
    }
    for (const coord of coordinators) {
        extraNotifs.push({
            userId: coord.id,
            title: 'Informe mensual disponible',
            message: 'El informe de seguimiento del mes de abril está listo para descarga.',
            type: 'INFO',
            isRead: false,
            link: '/coordinador/reportes',
        });
    }
    await prisma.inAppNotification.createMany({ data: extraNotifs });

    console.log('    6 anuncios y ~200 notificaciones creados.\n');

    // ─── 11. SOLICITUDES ARCO (LOPDP) ─────────────────────────────────────────
    console.log(' [11/12] Creando solicitudes ARCO (LOPDP)...');
    const arcoRequests = [
        { student: students[0], type: 'ACCESO', details: 'Solicito copia completa de mis datos personales almacenados en el sistema, conforme al Art. 18 de la LOPDP.', status: 'COMPLETADA', response: 'Se envió el reporte completo de datos personales al correo institucional del solicitante.' },
        { student: students[1], type: 'CANCELACION', details: 'Solicito la eliminación de mi cuenta y datos personales por retiro voluntario de la institución.', status: 'EN_REVISION', response: null },
        { student: students[2], type: 'RECTIFICACION', details: 'Mi nombre completo está registrado incorrectamente. El correcto es con tilde en la é.', status: 'COMPLETADA', response: 'Se corrigió el nombre en el sistema. Verificar en el perfil de usuario.' },
        { student: students[3], type: 'OPOSICION', details: 'Me opongo al uso de mis datos para comunicaciones de terceros. Solo autorizo usos académicos directos.', status: 'PENDIENTE', response: null },
        { student: students[4], type: 'ACCESO', details: 'Requiero el listado de todas las entidades con las que se han compartido mis datos.', status: 'PENDIENTE', response: null },
        { student: students[5], type: 'CANCELACION', details: 'Solicito la anonimización de mis datos de asistencia GPS después de finalizar las prácticas.', status: 'COMPLETADA', response: 'Datos GPS anonimizados. Se mantiene el registro de horas sin coordenadas exactas.' },
    ];

    await prisma.dataRequest.createMany({
        data: arcoRequests.map(req => ({
            userId: req.student.id,
            type: req.type,
            details: req.details,
            status: req.status,
            response: req.response,
            createdAt: daysAgo(randInt(5, 45)),
        })),
    });
    console.log(`    ${arcoRequests.length} solicitudes ARCO creadas.\n`);

    // ─── 12b. PERMISOS DE CHAT ────────────────────────────────────────────────
    console.log(' [12b] Inicializando permisos de chat por roles...');
    const allRoles = [Role.ADMIN, Role.COORDINADOR, Role.TUTOR, Role.ESTUDIANTE, Role.EMPRESA];
    const chatPermPairs: { fromRole: Role; toRole: Role }[] = [];
    for (const fromRole of allRoles) {
        for (const toRole of allRoles) {
            if (fromRole !== toRole) {
                chatPermPairs.push({ fromRole, toRole });
            }
        }
    }
    // Canales académicos activos por defecto en un IST
    const academicPairs: Array<[Role, Role]> = [
        [Role.TUTOR, Role.COORDINADOR],
        [Role.COORDINADOR, Role.TUTOR],
        [Role.TUTOR, Role.ESTUDIANTE],
        [Role.ESTUDIANTE, Role.TUTOR],
        [Role.COORDINADOR, Role.ESTUDIANTE],
        [Role.ESTUDIANTE, Role.COORDINADOR],
    ];
    const isAcademicPair = (from: Role, to: Role) =>
        academicPairs.some(([f, t]) => f === from && t === to);

    await prisma.chatPermission.createMany({
        data: chatPermPairs.map(p => ({
            fromRole: p.fromRole,
            toRole: p.toRole,
            isEnabled: isAcademicPair(p.fromRole, p.toRole),
        })),
        skipDuplicates: true,
    });
    const enabledCount = chatPermPairs.filter(p => isAcademicPair(p.fromRole, p.toRole)).length;
    console.log(`    ${chatPermPairs.length} pares de permisos de chat creados (${enabledCount} canales académicos activos por defecto).\n`);

    // ─── 12c. CONVERSACIONES REALES ───────────────────────────────────────────
    console.log(' [12c] Generando conversaciones de prueba...');
    // Crear salas entre algunos estudiantes y sus tutores
    for (let i = 0; i < 10; i++) {
        const student = students[i];
        const tutor = tutorsAcad[i % tutorsAcad.length];

        const room = await prisma.chatRoom.create({
            data: {
                isGroup: false,
                members: {
                    create: [
                        { userId: student.id },
                        { userId: tutor.id },
                    ]
                },
                messages: {
                    create: [
                        { senderId: student.id, content: 'Hola estimado tutor, tengo una duda con el formato F02.' },
                        { senderId: tutor.id, content: 'Hola, dime en qué puedo ayudarte.', readAt: new Date() },
                        { senderId: student.id, content: '¿En la sección de actividades debo ser muy detallado o un resumen general?', readAt: new Date() },
                        { senderId: tutor.id, content: 'Es mejor ser detallado por semanas. Saludos.', readAt: new Date() },
                    ]
                }
            }
        });
    }
    console.log('    10 salas de chat con mensajes generadas.\n');

    // ─── 12. CONFIGURACIONES DEL SISTEMA ──────────────────────────────────────
    console.log(' [12/12] Configurando ajustes del sistema...');
    await prisma.systemSetting.createMany({
        data: [
            { key: 'attendance_radius_meters', value: '250', category: 'GPS', description: 'Radio máximo permitido para el registro de asistencia por GPS (metros).' },
            { key: 'attendance_max_distance_km', value: '0.5', category: 'GPS', description: 'Distancia máxima tolerada antes de emitir alerta de irregularidad (km).' },
            { key: 'session_timeout_seconds', value: '7200', category: 'AUTH', description: 'Tiempo de inactividad antes de cerrar sesión automáticamente (segundos).' },
            { key: 'max_login_attempts', value: '5', category: 'AUTH', description: 'Número máximo de intentos fallidos antes de bloquear la cuenta.' },
            { key: 'lockout_duration_minutes', value: '30', category: 'AUTH', description: 'Duración del bloqueo de cuenta después de superar los intentos fallidos.' },
            { key: 'smtp_host', value: 'smtp.istpet.edu.ec', category: 'EMAIL', description: 'Servidor SMTP para envío de correos institucionales.' },
            { key: 'smtp_port', value: '587', category: 'EMAIL', description: 'Puerto del servidor SMTP.' },
            { key: 'smtp_sender', value: 'noreply@istpet.edu.ec', category: 'EMAIL', description: 'Dirección de correo remitente para notificaciones automáticas.' },
            { key: 'document_max_size_mb', value: '10', category: 'GENERAL', description: 'Tamaño máximo permitido para subir documentos (MB).' },
            { key: 'allowed_file_types', value: 'pdf,docx,jpg,png', category: 'GENERAL', description: 'Tipos de archivo permitidos para carga de documentos.' },
            { key: 'lopdp_version_current', value: '1.0', category: 'GENERAL', description: 'Versión actual de la política de protección de datos LOPDP.' },
            { key: 'webauthn_enabled', value: 'true', category: 'AUTH', description: 'Habilitar autenticación biométrica/WebAuthn para usuarios con credencial registrada.' },
            { key: 'chat_message_retention_days', value: '730', category: 'CHAT', description: 'Periodo de retención de mensajes de chat antes de su anonimización o purga (días).' },
        ],
    });
    console.log('    12 configuraciones del sistema registradas.\n');

    // ─── RESUMEN FINAL ────────────────────────────────────────────────────────
    const counts = {
        careers: await prisma.career.count(),
        templates: await prisma.documentTemplate.count(),
        companies: await prisma.company.count(),
        agreements: await prisma.agreement.count(),
        users: await prisma.user.count(),
        credentials: await prisma.userCredential.count(),
        internships: await prisma.internship.count(),
        statusHistory: await prisma.internshipStatusHistory.count(),
        attendances: await prisma.attendance.count(),
        activityPhotos: await prisma.activityPhoto.count(),
        documents: await prisma.document.count(),
        docVersions: await prisma.documentVersion.count(),
        docComments: await prisma.documentComment.count(),
        evaluations: await prisma.evaluation.count(),
        monitoringVisits: await prisma.monitoringVisit.count(),
        systemLogs: await prisma.systemLog.count(),
        emailLogs: await prisma.emailLog.count(),
        announcements: await prisma.announcement.count(),
        notifications: await prisma.inAppNotification.count(),
        dataRequests: await prisma.dataRequest.count(),
        settings: await prisma.systemSetting.count(),
        absences: await prisma.absence.count(),
        chatRooms: await prisma.chatRoom.count(),
        chatMessages: await prisma.chatMessage.count(),
        lopdpLogs: await prisma.lopdpLog.count(),
    };

    console.log('═══════════════════════════════════════════════════════════');
    console.log(' MASTER SEED v14.0 — ISTPET "Mayor Pedro Traversari" OK');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n RESUMEN DE REGISTROS CREADOS:');
    console.log('─────────────────────────────────────────────────────');
    console.log(`   Carreras                  : ${counts.careers}`);
    console.log(`   Plantillas de documentos  : ${counts.templates}`);
    console.log(`   Empresas                  : ${counts.companies}`);
    console.log(`   Convenios                 : ${counts.agreements}`);
    console.log(`   Usuarios (todos los roles): ${counts.users}`);
    console.log(`   Credenciales WebAuthn     : ${counts.credentials}`);
    console.log(`   Prácticas preprofesionales: ${counts.internships}`);
    console.log(`   Historial de estados      : ${counts.statusHistory}`);
    console.log(`   Registros de asistencia   : ${counts.attendances}`);
    console.log(`   Fotos de actividades      : ${counts.activityPhotos}`);
    console.log(`   Documentos                : ${counts.documents}`);
    console.log(`   Versiones de documentos   : ${counts.docVersions}`);
    console.log(`   Comentarios en documentos : ${counts.docComments}`);
    console.log(`   Evaluaciones              : ${counts.evaluations}`);
    console.log(`   Visitas de monitoreo      : ${counts.monitoringVisits}`);
    console.log(`   Ausencias justificadas    : ${counts.absences}`);
    console.log(`    Salas de chat             : ${counts.chatRooms}`);
    console.log(`    Mensajes de chat          : ${counts.chatMessages}`);
    console.log(`   Logs del sistema          : ${counts.systemLogs}`);
    console.log(`   Logs de email             : ${counts.emailLogs}`);
    console.log(`   Anuncios                  : ${counts.announcements}`);
    console.log(`   Notificaciones in-app     : ${counts.notifications}`);
    console.log(`   Solicitudes ARCO (LOPDP)  : ${counts.dataRequests}`);
    console.log(`    Logs de aceptación LOPDP  : ${counts.lopdpLogs}`);
    console.log(`    Configuraciones del sistema: ${counts.settings}`);
    console.log('─────────────────────────────────────────────────────\n');
    console.log('   Credenciales de acceso (contraseña universal: password123):');
    console.log('     cristhofer.parreno@adm.istpet.edu.ec   → ADMIN');
    console.log('     wilfrido.trujillo@coo.istpet.edu.ec  → COORDINADOR GENERAL');
    console.log('     andres.gallegos@tut.istpet.edu.ec    → TUTOR (Desarrollo de Software — Presencial)');
    console.log('     roberto.torres@tut.istpet.edu.ec     → TUTOR (Desarrollo de Software — En Línea)');
    console.log('     ricardo.toapanta@tut.istpet.edu.ec   → TUTOR (Mecánica Automotriz)');
    console.log('     carmen.almeida@tut.istpet.edu.ec     → TUTOR (Gastronomía)');
    console.log('     mateo.larrea@est.istpet.edu.ec       → ESTUDIANTE (primer estudiante generado)');
    console.log('     carlos.mendoza@est.istpet.edu.ec     → ESTUDIANTE (cuenta bloqueada — test)');
    console.log('');
    console.log('   Instituto: I.S.T. "Mayor Pedro Traversari" — ISTPET');
    console.log('     Av. Matilde Álvarez y Hugo Díaz Romero, Chillogallo, Quito');
    console.log('     Tel: 02 303 2894 | admisiones@istpet.edu.ec');
    console.log('═══════════════════════════════════════════════════════════\n');
}

main()
    .catch((e) => {
        console.error('\n Error fatal en seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
