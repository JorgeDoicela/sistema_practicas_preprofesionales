# Guía de API e Integración Swagger (Praxis Hub)

Este documento es un catálogo de referencia para los endpoints principales de la API del sistema **Praxis Hub**, diseñados bajo estándares RESTful, documentados interactivamente con OpenAPI (Swagger) y protegidos mediante JWT.

---

## 1. Catálogo General de Endpoints

### A. Inteligencia y Salud del Sistema
*   **`GET /api/health`**: Devuelve el estado proactivo de la infraestructura (Base de Datos PostgreSQL, Vercel Blob Storage y el motor de IA OpenAI).
*   **`POST /api/ai/ask`**: Permite interactuar con el motor GPT-4o. Recibe las consultas contextuales del estudiante y le provee guía proactiva basada en su expediente.
*   **`GET /api/system-logs`**: *(Solo ADMIN)* Recupera los logs de auditoría técnica del sistema (peticiones HTTP, errores 500, IPs, etc.).

### B. Seguimiento, Monitoreo y Asistencia
*   **`POST /api/monitoring-visits`**: Registra la visita de campo física o virtual realizada por el tutor académico.
*   **`PATCH /api/internships/:id/locations`**: Configura las zonas de geofencing (múltiples sedes permitidas, coordenadas y radio de tolerancia en metros) para una práctica.
*   **`POST /api/attendance/check-in`**: Registra la asistencia diaria (entrada) adjuntando evidencias fotográficas e interceptando la ubicación GPS y la biometría.
*   **`POST /api/attendance/check-out`**: Registra la marcación de salida diaria.

### C. Evaluación, Documentación y Privacidad (LOPDP)
*   **`POST /api/evaluations`**: Guarda las rúbricas de calificación duales (Académica o Empresarial).
*   **`GET /api/privacy/requests`**: Gestiona las solicitudes de ejercicio de derechos ARCO.
*   **`GET /api/privacy/logs`**: Registro para auditoría LOPDP (transparencia de accesos a datos sensibles de estudiantes).

### D. Comunicación Interna y Avisos
*   **`POST /api/announcements`**: Publicación de avisos generales en cartelera por parte de directores o administradores, filtrados por rol.
*   **`GET /api/announcements/active`**: Recupera los anuncios activos vigentes según el perfil del usuario autenticado.

---

## 2. Endpoints Críticos de la Plataforma

| Módulo | Ruta | Método | Rol Mínimo | Propósito |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `/auth/login` | `POST` | Público | Autenticación de usuario tradicional o WebAuthn, retorna JWT. |
| **Auth** | `/auth/register-company` | `POST` | Público | Registro de empresa corporativa blindado con reCAPTCHA v3. |
| **Users** | `/users` | `POST` | `ADMIN` | Creación de usuarios administrativos internos (Coordinadores, Tutores). |
| **Internships** | `/internships` | `POST` | `COORDINADOR` | Crea una asignación de práctica y autogenera sus documentos obligatorios (`F01`, etc.). |
| **Attendance**| `/attendance/check-in`| `POST` | `ESTUDIANTE` | Registra el inicio de jornada con validación estricta de Geofencing. |

---

## 3. Formato Estándar de Respuesta (Envelope JSON)

Cada llamada exitosa a la API devuelve una respuesta estructurada de forma homogénea mediante el interceptor global del backend:

```json
{
  "success": true,
  "data": {
    "id": "e3b0c442-98fc-1111-b329-0242ac130003",
    "status": "En Proceso"
  },
  "timestamp": "2026-06-11T13:42:00.000Z"
}
```

En caso de error, el filtro de excepciones global intercepta el fallo y devuelve:

```json
{
  "success": false,
  "error": "Acceso denegado: rol insuficiente",
  "statusCode": 403,
  "path": "/api/system-logs",
  "timestamp": "2026-06-11T13:42:05.000Z"
}
```

---

## 4. Documentación Interactiva (Swagger UI)

El servidor NestJS compila y publica Swagger de forma automática en el arranque:
*   **URL Local:** `http://localhost:5000/api/docs`
*   **Autenticación en Swagger:**
    1. Ejecuta el endpoint `/auth/login` con tus credenciales.
    2. Copia el token JWT en el campo `accessToken`.
    3. Haz clic en el botón **"Authorize"** en la parte superior derecha de Swagger e ingresa tu token en formato: `Bearer TU_JWT_TOKEN`.

---

## 5. Estándares para Desarrolladores (Cómo extender la API)

Para asegurar la correcta autodocumentación de los nuevos endpoints, los desarrolladores deben seguir obligatoriamente estas directrices:

### 5.1 Categorización de Controladores
Cada controlador (`.controller.ts`) debe estar anotado con el decorador `@ApiTags('NombreModulo')`. Esto agrupa ordenadamente las operaciones lógicas en Swagger.

### 5.2 Modelado de Datos (DTOs)
Todos los Data Transfer Objects utilizados en peticiones (`POST`, `PUT`, `PATCH`) deben utilizar el decorador `@ApiProperty()` en cada atributo.
*   **Obligatorio:** Definir el tipo, si es opcional/requerido, y proporcionar un ejemplo real en la propiedad `example`.
*   **Validaciones:** Utilizar decoradores de `class-validator` (ej. `@IsString()`, `@IsUUID()`) en conjunto con las propiedades de Swagger.

### 5.3 Seguridad de Endpoints
Cualquier controlador o ruta protegida por el guard de JWT (`JwtAuthGuard`) debe estar decorado con `@ApiBearerAuth()` para habilitar el icono de candado y permitir el envío del token de autorización en la cabecera HTTP de Swagger.

### 5.4 Respuestas y Códigos de Estado
Utilizar decoradores explícitos de respuesta de Swagger en cada método del controlador:
*   `@ApiResponse({ status: 200, description: 'Operación exitosa' })`
*   `@ApiBadRequestResponse({ description: 'Payload con formato incorrecto o faltante' })`
*   `@ApiForbiddenResponse({ description: 'Token inválido o rol insuficiente' })`
