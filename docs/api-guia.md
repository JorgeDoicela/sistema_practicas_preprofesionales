# Guía de API Industrialized - EmiTesis

Este documento es un catálogo de referencia para los endpoints principales de la API, diseñados bajo estándares RESTful y protegidos por JWT.

## 1. Endpoints de Inteligencia y Salud

- **`GET /api/health`**: Devuelve el estado proactivo de la infraestructura (DB, AI, Storage).
- **`POST /api/ai/ask`**: Interactúa con el motor GPT-4o para consultas contextuales del estudiante.
- **`GET /api/system-logs`**: (Admin) Recupera el registro de auditoría industrial.

## 2. Endpoints de Seguimiento y Monitoreo

- **`POST /api/monitoring-visits`**: Registra una visita de campo por parte del tutor académico.
- **`PATCH /api/internships/:id/locations`**: Configura múltiples zonas de geofencing permitidas.
- **`POST /api/attendance/check-in`**: Inicia jornada con evidencias fotográficas y validación biométrica/GPS.

## 3. Endpoints de Evaluación y Privacidad

- **`POST /api/evaluations`**: Registra evaluaciones duales (Académica/Empresarial).
- **`GET /api/privacy/requests`**: Gestiona solicitudes de derechos ARCO.
- **`GET /api/privacy/logs`**: Registro de transparencia de acceso a datos (PIA).

## 4. Endpoints de Comunicación

- **`POST /api/announcements`**: Publicación de avisos masivos filtrados por rol.
- **`GET /api/announcements/active`**: Recupera avisos vigentes para el perfil del usuario.

## 5. Documentación Interactiva (Swagger)

Para una exploración detallada de los esquemas Request/Response, acceda a la interfaz interactiva de Swagger:
- **URL**: `[BASE_URL]/api/docs`
- **Autenticación**: Use el botón "Authorize" e ingrese su token Bearer.

---
Cada llamada a la API devuelve un sobre de respuesta estandarizado:
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-04-18T18:42:00Z"
}
```

## 6. Estándares para Desarrolladores

Para que un nuevo endpoint sea documentado profesionalmente, se deben seguir estas reglas:

### 6.1 Categorización (Controllers)
Cada controlador debe estar marcado con el decorador `@ApiTags('NombreModulo')`. Esto agrupa las operaciones en secciones lógicas dentro de la interfaz web.

### 6.2 Modelado de Datos (DTOs)
Todos los Data Transfer Objects (DTOs) utilizados en peticiones `POST`, `PUT` o `PATCH` deben usar el decorador `@ApiProperty()` en cada atributo.
*   **Propósito:** Define el tipo de dato, si es opcional y proporciona ejemplos al usuario final.

### 6.3 Seguridad de Endpoints
Las rutas protegidas por `JwtAuthGuard` deben incluir el decorador `@ApiBearerAuth()` (si se desea especificar a nivel de operación) para que Swagger permita el envío del token JWT.

## 7. Endpoints Críticos del Sistema

| Módulo | Ruta | Propósito |
| :--- | :--- | :--- |
| **Auth** | `/auth/login` | Autenticación y obtención de JWT. |
| **Auth** | `/auth/register-company` | Registro de nueva entidad con reCAPTCHA. |
| **Users** | `/users` (POST) | Creación de usuarios administrativos (Solo Admin). |
| **Internships**| `/internships` (POST) | Creación de asignaciones y documentos obligatorio (RF-DOC-001). |
| **Attendance** | `/attendance/check-in` | Registro de asistencia con validación de geofencing. |

## 4. Mejores Prácticas
*   **Respuestas:** Utilizar decoradores como `@ApiResponse({ status: 201, description: '...' })` para documentar los estados de salida.
*   **Ejemplos:** Proporcionar valores de ejemplo en `ApiProperty` para facilitar el testing rápido por parte de otros equipos (ej: Frontend).
