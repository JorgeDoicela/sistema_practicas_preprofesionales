# Praxis Hub: Sistema de Gobernanza y Gestión de Prácticas Preprofesionales

> Plataforma centralizada y de grado empresarial (*Enterprise-grade*) para la digitalización integral, auditoría y trazabilidad del ciclo de vida de las prácticas preprofesionales a nivel institucional.

Praxis Hub es un ecosistema digital diseñado para administrar de inicio a fin el proceso de pasantías y prácticas institucionales en el **ISTPET**. Sustituyendo el manejo analógico y disperso de documentos, Praxis Hub orquesta la interacción segura entre autoridades, empresas y estudiantes, garantizando la **seguridad documental**, **control de asistencia preciso mediante Geofencing**, e integración con **Inteligencia Artificial para soporte proactivo**.

---

## Resumen Ejecutivo

Históricamente, la administración de pasantías presenta retos críticos: falsificación de registros de asistencia, demoras en el flujo burocrático de revisión documental, y dificultad en la supervisión real (véase [La Problemática y Propuesta de Valor](./docs/problematica.md)).

Praxis Hub soluciona estos obstáculos a través de un ecosistema interconectado basado en 3 pilares estructurales:
1. **Verificación Estricta (Geofencing y Biometría):** Garantiza que cada hora registrada sea legítima mediante la fórmula de Haversine y autenticación passwordless (Passkeys/WebAuthn).
2. **Validación en Cascada (Nested Approvals):** Flujos de validación estricta multinivel para documentos legales y académicos con estados inmutables al ser aprobados.
3. **Observabilidad 360°:** Integración del seguimiento empresarial con el rendimiento y soporte asistido por IA (GPT-4o) con directrices "Zero-Hallucination Policy".

---

## Arquitectura y Stack Tecnológico

El sistema se compone de una arquitectura **Hybrid Universal Bridge**, segmentando responsabilidades entre una API altamente resiliente y un cliente interactivo y predictivo.

| Capa | Tecnologías Clave | Propósito Estratégico |
| :--- | :--- | :--- |
| **Frontend UI** | Next.js 16 (App Router), React 19, Tailwind CSS | Interfaces Premium reactivas, protección de rutas y renderizado optimizado (SSR/CSR). |
| **Backend Core** | NestJS 11+, TypeScript, JWT, WebAuthn | Procesamiento robusto, interceptores globales y tareas automáticas asíncronas (CRON). |
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
4. **Empresa (RRHH/Convenio):** Entidad legal enmarcada en el sistema, responsable de registrar las evaluaciones técnicas duales y visualizar los marcajes en vivo.
5. **Estudiante:** El protagonista en campo; registra asistencia geo-localizada, somete documentos a iteración y requiere retroalimentación contínua.

*Más detalles en [Lógica de Negocio y Reglas Técnicas](./docs/logica-negocio.md).*

---

## Instalación y Despliegue Local (Zero-Config)

Praxis Hub está industrializado para ser "Clone & Run". Toda la configuración necesaria ya viene incluida en el repositorio.

### Requisitos Previos
*   **Node.js** (v22+)
*   **Base de Datos:**
    *   **Opción A (Recomendado):** Servidor PostgreSQL local instalado en la laptop/máquina (o corriendo en Docker).
    *   **Opción B:** Neon PostgreSQL (en la nube).

### Pasos para iniciar:

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/TU_USUARIO/TU_REPOSITORIO.git
   cd sistema_practicas_preprofesionales
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar e Inicializar la Base de Datos Local**
   Si vas a ejecutar el proyecto con una base de datos PostgreSQL local instalada en tu laptop, asegúrate de que tu servicio PostgreSQL esté iniciado y ejecuta desde la raíz:
   ```bash
   npm run setup:local-db
   ```
   *(Este asistente automatizado te guiará para configurar las credenciales, creará la base de datos si no existe, sincronizará las tablas con Prisma y cargará los seeders con los datos iniciales de prueba de forma automática).*

   *Nota: Si decides usar Docker Compose, levanta la base de datos con `npm run docker:up` y luego ejecuta `npm run setup` para inicializarla.*

4. **Lanzar el ecosistema**
   Inicia el backend y el frontend concurrentemente.
   ```bash
   npm run dev
   ```
   *   **Frontend:** [http://localhost:3005](http://localhost:3005)
   *   **Backend / Swagger:** [http://localhost:5000/api/docs](http://localhost:5000/api/docs)

---

## Documentación Institucional

Este repositorio cuenta con un nivel de especificación detallado destinado a Desarrolladores, Arquitectos y DevOps. Recomendamos revisar los documentos en el siguiente orden para entender el sistema de manera global:

1. **[Planteamiento de la Problemática y Solución](./docs/problematica.md)**: Caso de negocio y propuesta de valor estratégico.
2. **[Arquitectura y Topología de Despliegue](./docs/arquitectura.md)**: Estructura C4, resiliencia y motor contextual IA.
3. **[Lógica de Negocio y State Machines](./docs/logica-negocio.md)**: Ciclos de vida, flujos de aprobación e inmutabilidad.
4. **[Diseño de Base de Datos y Estrategia de Seeding](./docs/base-de-datos.md)**: Diccionario y simulación hiperrealista.
5. **[Políticas de Seguridad y Privacidad LOPDP](./docs/seguridad.md)**: Encriptación, ARCO y protección de sesión.
6. **[Guía de Desarrollo y Estándares](./docs/desarrollo.md)**: Convenciones de código, DTOs y manejo de Skeletons.
7. **[Endpoints del API y Especificaciones](./docs/api-guia.md)**: Catálogo de API y uso de Swagger.
8. **[Manual de Usuario](./docs/manual-usuario.md)**: Guía detallada de flujos operativos por rol.
9. **[Guía de Pruebas y Calidad](./docs/pruebas.md)**: Cobertura Jest, e2e y análisis estático.
10. **[DevOps y Despliegue Continuo](./docs/devops.md)**: Terraform, Docker y pipelines de CI/CD.
11. **[Protocolo de Mantenimiento](./docs/mantenimiento.md)**: Respaldos automáticos, restauración y logs.

---
**Praxis Hub © 2026** - Transformando la trazabilidad burocrática en operabilidad inteligente.
**Tesis Parreño**
