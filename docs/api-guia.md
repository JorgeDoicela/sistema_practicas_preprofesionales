# Guía de API y Documentación Interactiva

Se ha integrado una capa de documentación dinámica basada en **Swagger** para que cualquier desarrollador pueda interactuar con la API de forma visual y rápida, eliminando la necesidad de manuales estáticos que se desactualizan.

## 1. Arquitectura de Swagger

La configuración reside en `src/main.ts` y está diseñada para ser la fuente de verdad del contrato de la API.

*   **Punto de Acceso:** `/api/docs`
*   **Automatización:** El módulo se alimenta directamente de los decoradores en el código, garantizando que el manual web siempre refleje el estado real de los endpoints en producción.

## 2. Estándares para Desarrolladores

Para que un nuevo endpoint sea documentado profesionalmente, se deben seguir estas reglas:

### 2.1 Categorización (Controllers)
Cada controlador debe estar marcado con el decorador `@ApiTags('NombreModulo')`. Esto agrupa las operaciones en secciones lógicas dentro de la interfaz web.

### 2.2 Modelado de Datos (DTOs)
Todos los Data Transfer Objects (DTOs) utilizados en peticiones `POST`, `PUT` o `PATCH` deben usar el decorador `@ApiProperty()` en cada atributo.
*   **Propósito:** Define el tipo de dato, si es opcional y proporciona ejemplos al usuario final.

### 2.3 Seguridad de Endpoints
Las rutas protegidas por `JwtAuthGuard` deben incluir el decorador `@ApiBearerAuth()` (si se desea especificar a nivel de operación) para que Swagger permita el envío del token JWT.

## 3. Endpoints Críticos del Sistema

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
