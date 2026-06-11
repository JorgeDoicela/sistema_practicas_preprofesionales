# Praxis Hub API - Backend Core (NestJS)

El backend core de **Praxis Hub** es una API RESTful desarrollada con **NestJS 11+** y **TypeScript**. Se encarga de la orquestación lógica del sistema de prácticas preprofesionales, garantizando seguridad perimetral, persistencia de datos relacionales, tareas programadas e integración con Inteligencia Artificial.

---

## Stack Tecnológico Integrado

*   **Framework:** NestJS 11 (Node.js) con paradigma de Inyección de Dependencias.
*   **Lenguaje:** TypeScript 5+.
*   **Base de Datos y ORM:** PostgreSQL con Prisma ORM 5+.
*   **Seguridad y Autenticación:** JWT con Passport, WebAuthn (Passkeys/Passwordless) para registro/inicio de sesión biométrico.
*   **Inteligencia Artificial:** SDK de OpenAI (GPT-4o) para copiloto contextual.
*   **Evidencias y Almacenamiento:** SDK de Vercel Blob Storage para archivos persistentes e inmutables.
*   **Generación de Documentos:** Puppeteer (para certificados PDF dinámicos) y ExcelJS (para reportes de auditoría en Excel).
*   **Comunicaciones:** Nodemailer para notificaciones de correo y Socket.io para mensajería In-App bidireccional en tiempo real.

---

## Configuración y Ejecución Local

### Requisitos
*   Node.js (v22+)
*   npm (v10+)
*   Docker (para la base de datos PostgreSQL local)

### Configuración de Variables de Entorno
Crea un archivo `.env` en la raíz de esta subcarpeta (`api-emitesis/`) y define las siguientes variables:
```env
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/emitesis_db?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/emitesis_db?schema=public"
JWT_SECRET="su_jwt_secret_ultra_seguro"
OPENAI_API_KEY="su_openai_api_key"
BLOB_READ_WRITE_TOKEN="su_vercel_blob_token"
MAIL_HOST="smtp.gmail.com"
MAIL_PORT=587
MAIL_USER="su_correo@gmail.com"
MAIL_PASS="su_contrasena_de_aplicacion"
```

### Comandos de Desarrollo

1.  **Instalar dependencias y generar cliente de Prisma:**
    ```bash
    npm install
    ```
2.  **Iniciar base de datos PostgreSQL local (Docker):**
    ```bash
    npm run docker:up
    ```
3.  **Ejecutar migraciones y sembrar base de datos:**
    ```bash
    npx prisma migrate dev
    ```
4.  **Iniciar el servidor NestJS en modo desarrollo (watch mode):**
    ```bash
    npm run start:dev
    ```

La API estará disponible en `http://localhost:5000`.

---

## Swagger OpenAPI

La API cuenta con documentación interactiva generada automáticamente por Swagger.
*   **URL Local:** `http://localhost:5000/api/docs`
*   **Uso:** Inicie sesión mediante `/auth/login`, obtenga el token JWT Bearer, y utilícelo en el botón "Authorize" de Swagger para interactuar con los endpoints restringidos.

---

## Pruebas Unitarias y e2e

*   **Pruebas unitarias:** Validan la lógica interna y reglas de negocio aisladas.
    ```bash
    npm run test
    ```
*   **Pruebas de integración (e2e):** Verifican el ciclo de vida completo de las peticiones.
    ```bash
    npm run test:e2e
    ```
*   **Reporte de cobertura:**
    ```bash
    npm run test:cov
    ```

---

## Enlaces y Carpetas Clave

*   `src/auth`: Autenticación tradicional, WebAuthn y JWT.
*   `src/users`: Control de usuarios y perfiles.
*   `src/internships`: Control de prácticas preprofesionales, convenios y asignaciones.
*   `src/attendance`: Gestión de asistencia diaria con Geofencing Haversine.
*   `src/documents`: Gestión de evidencias e integración con Vercel Blob.
*   `src/ai`: Copiloto interactivo con GPT-4o.
*   `src/privacy`: Logs de acceso a datos y solicitudes de derechos ARCO (LOPDP).
*   `prisma/schema.prisma`: Esquema de datos transaccional central.
*   `prisma/seeds/seed.ts`: Algoritmo hiperrealista de simulación de datos.
