# Seguridad y Hardening del Sistema

Este documento especifica las capas de seguridad implementadas para proteger la integridad de la información y la disponibilidad de los servicios de EmiTesis.

## 1. Seguridad en Capa de Aplicación (API)

### 1.1 Autenticación Robusta
*   **Tokenización:** Uso de JWT (JSON Web Tokens) firmados con algoritmo HS256. El payload incluye `sub` (ID de usuario), `role` y `email`.
*   **Hashing de Secretos:** Implementación de `bcrypt` con un `saltFactor` de 10 para todas las contraseñas de usuario.
*   **Recuperación Segura:** Generación de tokens de recuperación de un solo uso (`crypto.randomBytes(32)`) con una ventana de validez de 60 minutos.

### 1.2 Mecanismos de Defensa Activa
*   **Protección contra Fuerza Bruta:** El sistema implementa un bloqueo temporal de cuenta tras 5 intentos fallidos consecutivos de login. El bloqueo persiste por 15 minutos (`lockoutUntil`).
*   **reCAPTCHA v2/v3:** Integración con Google reCAPTCHA en los endpoints de Login y Registro de Empresa para mitigar ataques de bots y automatización no autorizada.

## 2. Control de Acceso (RBAC)

El sistema utiliza un Control de Acceso Basado en Roles (RBAC) mediante Guards de NestJS.

*   **JwtAuthGuard:** Valida la presencia y autenticidad del token en cada request.
*   **RolesGuard:** Intercepta la petición y compara el rol del token con los roles permitidos en el decorador `@Roles()`.

### Jerarquía de Roles
1.  **ADMIN:** Acceso a gestión de usuarios y logs de auditoría.
2.  **COORDINADOR:** Aprobación definitiva de documentos y gestión de convenios.
3.  **TUTOR:** Supervisión técnica de prácticas y primera fase de aprobación.
4.  **ESTUDIANTE:** Registro de actividades y carga de evidencia.
5.  **EMPRESA:** Visualización de pasantes y gestión de datos institucionales.

## 3. Seguridad de Datos

### 3.1 Protección de la Base de Datos
*   **Sanitización:** Prisma ORM previene ataques de SQL Injection mediante consultas parametrizadas automáticas.
*   **Aislamiento:** La base de datos PostgreSQL solo acepta conexiones desde el contenedor de la API dentro de la red privada de Docker, o mediante túneles seguros en desarrollo.

### 3.2 Almacenamiento de Archivos (Storage)
*   Integridad: Los archivos se almacenan en Vercel Blob con nombres ofuscados y metadatos vinculados a la práctica para evitar accesos directos por adivinación de URL.
*   Políticas de Tamaño: Restricción estricta de 5MB por archivo para evitar ataques de agotamiento de almacenamiento.

## 4. Arquitectura de Defensa y Robustez

El esquema de seguridad de EmiTesis se basa en el principio de defensa en profundidad, garantizando un entorno resistente mediante:

1.  **Defensa en Multi-capa:** No se depende de un solo control. Se validan roles en el frontend, autenticación en el backend e integridad a nivel de base de datos.
2.  **Interconexión Segura:** El uso de JWT permite una arquitectura ligera y segura, facilitando la auditoría de accesos y eliminando vulnerabilidades comunes asociadas a las sesiones persistentes.
3.  **Protección de Infraestructura:** La implementación de Google reCAPTCHA y los bloqueos por fuerza bruta aseguran la alta disponibilidad del sistema frente a ataques automatizados de denegación de servicio.
4.  **Red Compartimentada:** Mediante Docker, se ha aislado la base de datos del tráfico público, permitiendo únicamente conexiones autorizadas dentro de una red privada virtual cifrada.
