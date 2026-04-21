# Guía Estructural de Código y Desarrollo

Si te han asignado al proyecto EmiTesis, esta arquitectura fue diseñada asumiendo altos volúmenes de tráfico, rotación rápida de mantenedores e inyección estricta de variables de entorno. Sigue los patrones de bajo acoplamiento para evitar disrupción de dependencias operativas o fallos críticos.

---

## 1. Convenciones Estilísticas Universales (Monitoreo Continuo)

Tanto el Backend como el Frontend operan bajo las normativas de `ESLint` y `Prettier`.
*   Un commit no debe empujarse (**Git Push**) si el comando `npm run format` en Backend falla.
*   Ninguna de las APIs REST en Next.js se usarán; en su lugar, se emplea reactividad a través de la carpeta de subrutas `src/services` mediante *Custom Hooks* con aislamiento de datos.
*   En el Backend, está **estrictamente baneado** usar constructores masivos o acceder a la base de datos sin pasar por un Servicio (`.service.ts`). Ningún controlador (`.controller.ts`) toca `PrismaClient` directamente.

---

## 2. Paradigma del Interceptor y Estandarización 

Si agregas nuevos Endpoints en el modulo `api-emitesis`, respeta siempre los retornos por defecto tipo Data Transfer Object (`DTO`). Todo retorna su respectivo Promise o interface, pero viaja blindado.

1.  Define el DTO exacto (usando los decoradores de `class-validator`) así prevees Payload poisoning `POST /login { undefined }`.
2.  Retorna el Objeto Simple (No un string JSON).
3.  El marco interceptor envolverá la request con el contenedor `success: true`.

---

## 3. Manipulación de la UI de NextJS (Responsive & Skeleton)

Cualquier asincronía en el Frontend (solicitud a Back o Fetch a Vercel Blob) que tarde más de 200 milisegundos **exige cargar Skeleton UI**. Nunca presentes retornos con un spinner en pantalla completa; la filosofía visual demanda:
*   Componentes aislados reactivos mientras cargan (Revisa `<Skeleton>` en `@components/ui`).
*   Bloqueos (Disabling) condicionales explícitos con `DoubleConfirmModal` para cualquier petición del CRUD destructiva o de transición de Estados jerárquica (Borrar Pasante o Aprobar Documento Oficial).
*   Empleo de **Shadcn** y configuraciones en **Tailwind** para las librerías CSS sin comprometer el Performance Load (CLS y LCP de WebVitals).

---

## 4. Agregando al Pipeline del Seeder de Base de Datos

Si haces una reestructuración de Base de Datos inyectando una tabla nueva, no basta con `npx prisma db push`.
1. Migra usando el estándar relacional de Prisma `npx prisma migrate dev --name <nombre_feature>`.
2. Ajusta OBLIGATORIAMENTE el script maestro en `prisma/seeds/seed.ts` inyectando entidades generadas lógicamente, si interfiere con referencias de cascada. Si obvias este paso, rompes la demostración simulada en los ambientes dev y qa.

---

## 5. Ambientes Compartidos (.env)

El archivo `.env` del Backend no se empuja. Debe mantener configuraciones estrictas para que funcione:
*   `DATABASE_URL`: Conexión de Prisma a PosgreSQL en la red dockerizada o cloud.
*   `JWT_SECRET`: Llave asimétrica ultra robusta generada preferiblemente ciber-segura.
*   `OPENAI_API_KEY`: Token estricto del proveedor de Inteligencia Artificial (OpenAI Engine).
*   `BLOB_READ_WRITE_TOKEN`: Suministrado por la plataforma vercel Blob para montar en nube documentos persistentes.

*Ante dudas, leer el diagrama arquitectónico completo ubicado en `arquitectura.md`.*
