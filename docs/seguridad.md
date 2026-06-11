# Arquitectura Criptográfica y Seguridad Perimetral (Praxis Hub)

La gestión de información estudiantil, académica y empresarial debe estar herméticamente blindada. El módulo de Seguridad de Praxis Hub sigue las pautas de **OWASP** y el cumplimiento de la **LOPDP** (Ley Orgánica de Protección de Datos Personales de Ecuador) para un aislamiento real y control de acceso riguroso.

---

## 1. Defensa contra Explotación Común

El backend se abstrae detrás de Middlewares que depuran las entradas antes de inyectarlas en la lógica de negocios.
*   **Límites de Carga y Throttling (Rate Limiting):** El servidor implementa `@nestjs/throttler` previniendo ataques de denegación de servicio (DoS) y fuerza bruta (`HTTP 429 Too Many Requests`).
*   **Helmet & CORS:** Todo tráfico exterior en Next.js está limitado. Protección mediante Content Security Policy (CSP) en cabeceras HTTP y bloqueo de firmas del servidor (`X-Powered-By`).

---

## 2. Inmutabilidad Documental y Privacidad (Vercel Blob)

1.  **Enmascaramiento de Recursos:** Vercel Blob genera enlaces criptográficos complejos y dinámicos para los repositorios de fotos y firmas de convenio. Los documentos no se sirven mediante rutas locales tradicionales vulnerables a ataques de `Path Traversal`, sino que el backend controla el token aislado (`BLOB_READ_WRITE_TOKEN`) para cada transacción.
2.  **Protección LOPDP (Ley de Privacidad de Ecuador):**
    Un módulo especializado recibe solicitudes de estudiantes (`DataRequest` y `Privacy` controllers) centralizando sus peticiones de los denominados derechos ARCO:
    *   **Derecho de Acceso/Rectificación:** Permite descargar un reporte consolidado del perfil en formato JSON o corregir campos.
    *   **Derecho de Cancelación/Oposición:** Al eliminarse la cuenta de un usuario, se activa el borrado en cascada (`onDelete: Cascade`) que destruye de manera inmediata toda la evidencia fotográfica y GPS de marcaciones para evitar violaciones legales.
    *   **Bitácora LOPDP:** La tabla `LopdpLog` registra inmutablemente cuándo y quién aceptó los términos y condiciones de la política de datos.

---

## 3. Autenticación y Credenciales Criptográficas

*   **Autenticación Primaria:** Implementa hashing robusto de contraseñas con **BCrypt** (con salado dinámico).
*   **Sesiones:** Los JSON Web Tokens (JWT) se firman con una clave ultra segura en el servidor, renovándose mediante Refresh Tokens.
*   **Passwordless WebAuthn / Passkeys:** El sistema cuenta con endpoints y flujos listos para autenticación basada en hardware criptográfico (FaceID, TouchID, Windows Hello, Fingerprint). Esto previene ataques de phishing y garantiza la legitimidad del estudiante en el registro de asistencia sin necesidad de memorizar contraseñas.

---

## 4. Control de Acceso Basado en Roles (RBAC)

El servidor NestJS ejecuta un Guard recursivo de permisos antes de cada ejecución analizando los roles del JWT. Los roles de usuario definidos oficialmente en el esquema (`Role` enum) y sus privilegios son:

1.  **`ADMIN` (Administrador):** Acceso global sin restricciones. Capacidad para ver la bitácora maestra (`SystemLog`), gestionar configuraciones globales (`SystemSetting`), dar de alta carreras, cronogramas y ejecutar rutinas de mantenimiento en caliente.
2.  **`COORDINADOR` (Coordinador de Carrera):** Regulador académico general. Puede crear asignaciones de prácticas (`Internship`), aprobar convenios (`Agreement`) con empresas y dar el visado final `APROBADO_DEFINITIVO` para cerrar el ciclo de prácticas de un estudiante.
3.  **`TUTOR` (Tutor Académico):** Supervisor docente. Solo puede visualizar los expedientes y aprobar/rechazar documentos de los estudiantes que tiene asignados bajo su tutoría.
4.  **`EMPRESA` (Representante Legal / RRHH):** Representa a la corporación vinculada en el convenio. Puede visualizar a los pasantes asignados a su empresa, ver el estado de asistencia diaria en vivo y registrar la rúbrica de evaluación técnica dual.
5.  **`ESTUDIANTE` (Pasante):** Acceso en modo Sandbox. Solo puede registrar sus marcaciones de asistencia (Check-In/Out) validadas contra su geolocalización, subir sus documentos obligatorios, ver su roadmap visual y consultar a su Copiloto de IA.

> [!NOTE]
> **Gestión del Tutor Empresarial:** El rol `EMPRESA` gestiona la cuenta corporativa principal en el sistema. Los datos específicos del supervisor en campo (Tutor Empresarial) se almacenan de manera transaccional dentro de la asignación de la práctica (`businessTutorName`, `businessTutorEmail`, `businessTutorPosition`, `businessTutorPhone`) para fines de contacto directo y generación de actas.

---

## 5. Prevención de Robo de Sesión en Frontend (Next.js)

En Next.js (lado del cliente):
*   Se protegen rutas privadas y paneles del dashboard usando un custom hook global (`useAuth`).
*   Implementación de auto-desconexión (Auto-Logout) transcurridos periodos de inactividad, previniendo secuestro de sesión en ordenadores compartidos o cibercafés públicos.
