# Estándares de Seguridad, Privacidad y Hardening

El ecosistema EmiTesis sigue estándares internacionales de seguridad y cumplimiento legal para proteger la integridad de los datos académicos y personales.

## 1. Cumplimiento LOPDP (Ley de Protección de Datos)

El sistema ha sido diseñado bajo los principios de **Privacidad desde el Diseño**.
- **Módulo ARCO**: Interfaz dedicada para que los usuarios ejerzan sus derechos de Acceso, Rectificación, Cancelación y Oposición.
- **Transparencia**: Los estudiantes pueden ver un registro de quién ha accedido a sus datos personales (PIA - Privacy Impact Assessment) en tiempo real.
- **Responsabilidad Estricta**: Los administradores deben justificar y registrar cada acceso a expedientes sensibles.

## 2. Auditoría Industrial y Trazabilidad

- **System Logs de Grado Militar**: Cada acción crítica (cambios de notas, aprobación de documentos, accesos fallidos) se registra con IP, agente de usuario y marca de tiempo inmutable.
- **Categorización de Eventos**: Los logs se clasifican en INFO, WARN, ERROR y SECURITY para una respuesta rápida ante incidentes.

## 3. Defensa Activa (Hardening)

### 3.1 Rate Limiting (Throttling)
Protección contra ataques de fuerza bruta y denegación de servicio (DoS) en endpoints críticos:
- `/api/auth/login`: Límite estricto de intentos antes de bloqueo temporal.
- `/api/attendance/check-in`: Evita el spam de registros de ubicación.

### 3.2 Protección contra Suplantación (GPS Spoofing)
- Algoritmos de validación de proximidad que detectan discrepancias entre la IP de conexión y la geolocalización reportada por el dispositivo.

### 3.3 Cifrado y Hash
- **Contraseñas**: Almacenadas con BCrypt (salt cost: 10).
- **Tránsito**: Encriptación forzosa mediante TLS 1.3 (HTTPS).
- **Documentos**: Los enlaces a archivos en Vercel Blob tienen tokens de expiración para evitar accesos no autorizados mediante URL directas.

---
Para más detalles sobre la gestión de sesiones y tokens, consulte la [Guía de API](api-guia.md).

## 4. Control de Acceso (RBAC)

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
