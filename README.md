# EmiTesis: Sistema de Gobernanza y Gestión de Prácticas Preprofesionales

> Plataforma centralizada y automatizada para la digitalización integral, auditoría y trazabilidad del ciclo de vida de las prácticas preprofesionales a nivel institucional.

EmiTesis es un ecosistema digital de grado empresarial (*Enterprise-grade*) diseñado para administrar de inicio a fin el proceso de pasantías y prácticas institucionales. Sustituyendo el manejo físico o disperso de documentos, EmiTesis orquesta la interacción entre autoridades, instituciones corporativas y estudiantes, garantizando la **seguridad documental**, **control de asistencia preciso mediante Geofencing**, e integración con **Inteligencia Artificial para soporte proactivo**.

---

## Resumen Ejecutivo

Históricamente, la administración de pasantías presenta retos críticos: falsificación de registros de asistencia, demoras en el flujo burocrático de revisión documental, y dificultad en la supervisión real (véase [La Problemática y Propuesta de Valor](./docs/problematica.md)).

EmiTesis soluciona estos obstáculos a través de un ecosistema interconectado basado en 3 pilares estructurales:
1. **Verificación Estricta (Geofencing y Biometría):** Garantiza que cada hora registrada sea legítima.
2. **Validación en Cascada (Nested Approvals):** Flujos de validación estricta multinivel para documentos legales y académicos.
3. **Observabilidad 360°:** Integración del seguimiento empresarial con el rendimiento y soporte asistido por AI (GPT-4o).

---

## Arquitectura y Stack Tecnológico

El sistema se compone de una arquitectura **Hybrid Universal Bridge**, segmentando responsabilidades entre una API altamente resiliente y un cliente interactivo y predictivo.

| Capa | Tecnologías Clave | Propósito Estratégico |
| :--- | :--- | :--- |
| **Frontend UI** | Next.js 16 (App Router), React 19, Tailwind CSS | Interfaces Premium reactivas, protección de rutas y renderizado optimizado (SSR/CSR). |
| **Backend Core** | NestJS 11+, TypeScript, JWT, OAuth (WebAuthn) | Procesamiento robusto, interceptores globales y tareas automáticas asíncronas (CRON). |
| **Motor de Base de Datos** | PostgreSQL, Prisma ORM 5+ | Manejo de consistencia de alta presión, relaciones y logs de auditoría masivos. |
| **Document Storage** | Vercel Blob, PDF.js | Almacenamiento perenne de evidencias fotográficas, documentos firmados y convenios. |
| **AI Copilot** | OpenAI GPT-4o | Asistente contextual con directrices anti-alucinaciones "Zero-Hallucination Policy". |

*Más detalles en [Arquitectura Técnica y Topología](./docs/arquitectura.md).*

---

## Gobernanza de Roles (RBAC)

La integridad del sistema depende de una separación de responsabilidades absoluta:

1. **Administrador:** Orquestador de la plataforma; gestiona analíticas de salud del sistema, carreras, cronogramas y limpieza en caliente (Hot Maintenance).
2. **Coordinador de Prácticas:** Regulador del ecosistema; aprueba documentos en última instancia, maneja convenios corporativos y emite la certificación final.
3. **Tutor Académico:** Monitor educativo; da primera revisión a documentos y valida el progreso de objetivos.
4. **Empresa (RRHH/Convenio):** Entidad legal enmarcada en el sistema, agrupa tutores empresariales.
5. **Tutor Empresarial:** Supervisor en campo; responsable de realizar las evaluaciones duales técnicas.
6. **Estudiante:** El protagonista en campo; registra asistencia geo-localizada, somete documentos a iteración y requiere retroalimentación contínua.

*Más detalles en [Lógica de Negocio y Reglas Técnicas](./docs/logica-negocio.md).*

---

## Instalación y Despliegue Local (Zero-Config)

EmiTesis está industrializado para ser "Clone & Run". Toda la configuración necesaria ya viene incluida en el repositorio.

### Requisitos Previos
*   **Node.js** (v20+)
*   **Docker** (Para la base de datos local, aunque por defecto usa Neon en la nube)

### Pasos para iniciar:

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/TU_USUARIO/TU_REPOSITORIO.git
   cd sistema_practicas_preprofesionales
   ```

2. **Instalar dependencias (Configuración Automática)**
   Al ejecutar este comando, el sistema detectará las variables de entorno, generará el cliente de base de datos y **reseteará/sembrará (seed)** los datos automáticamente para un entorno de pruebas fresco.
   ```bash
   npm install
   ```

3. **Lanzar el ecosistema**
   Inicia el backend, el frontend y muestra los accesos directos.
   ```bash
   npm run dev
   ```

---

---

## Documentación Institucional

Este repositorio cuenta con un nivel de especificación detallado destinado a Desarrolladores, Arquitectos y DevOps. Recomendamos fuertemente revisar los documentos en estricto orden para entender el sistema de manera global:

1. **[Planteamiento de la Problemática y Solución](./docs/problematica.md)**
2. **[Arquitectura y Topología de Despliegue](./docs/arquitectura.md)**
3. **[Lógica de Negocio y State Machines](./docs/logica-negocio.md)**
4. **[Diseño de Base de Datos y Estrategia de Seeding](./docs/base-de-datos.md)**
5. **[Políticas de Seguridad y Privacidad LOPDP](./docs/seguridad.md)**
6. **[Documentación de Componentes y Guía de Desarrollo](./docs/desarrollo.md)**
7. **[Endpoints del API y Especificaciones](./docs/api-guia.md)**
8. **[Manual de Usuario](./docs/manual-usuario.md)**
9. ... *y guías de Devops y Mantenimiento alojadas en la misma carpeta base*.

---
**EmiTesis © 2026** - Transformando la trazabilidad burocrática en operabilidad inteligente.
