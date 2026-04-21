# Arquitectura Criptográfica y Seguridad Perimetral

La gestión de información estudiantil, académica y empresarial debe estar herméticamente blindada. El módulo de Seguridad de EmiTesis sigue las pautas **OWASP** y **GDPR** (LOPDP) para un aislamiento real.

---

## 1. Defensa contra Explotación Común

El backend se abstrae detrás de Middlewares que depuran las entradas antes de inyectarlas en lógica de negocios.
*   **Aislamiento de Carga (Payload Limit & Rate Limiting):** El servidor implementa `@nestjs/throttler` previniendo ataques de Fuerza Bruta u Overloads (`HTTP 429 Too Many Requests`).
*   **Helmet & CORS:** Todo tráfico exterior en el clúster de Next.js está limitado. Protección mediante DNS Content Security Policy (CSP). Se bloquean las cabeceras maliciosas (`X-Powered-By`).

---

## 2. Inmutabilidad Documental y Privacidad (Vercel Blob)

1.  **Enmascaramiento de Recursos:** Vercel Blob genera links criptográficos complejos y dinámicos para los repositorios de fotos y firmas de convenio. Los documentos ya no se sirven mediante carpetas public tradicionales vulnerables a un ataque `Path Traversal`, sino que el backend controla el `BLOB_READ_WRITE_TOKEN` aislado para cada transacción.
2.  **Protección LOPDP (Ley de Privacidad):**
    Un módulo especializado recibe peticiones de estudiantes (`DataRequest` y `Privacy` controllers) centralizando sus peticiones de los denominados derechos ARCO:
    *   Derecho a Solicitar Cancelación de fotos o metadatos biométricos (Geolocaciones).
    *   Al eliminarse su cuenta de usuario de la Universidad, se activa el `onDelete: Cascade` que destruye toda la evidencia algorítmica para evitar violaciones legales.

---

## 3. Credenciales Modernizadas (Contraseñas + WebAuthn)

La autenticación primaria implementa Hash con encriptación BCrypt (iteraciones asíncronas dinámicas, salt). Los JWT ("Json Web Tokens") están firmados con encriptación asimétrica en el backend.

Considerando avances modernos, el sistema tiene preparativos y endpoints para autenticación **sin contraseñas (Passwordless WebAuthn / Passkeys)**. Dependiendo el navegador o móvil con hardware criptográfico (FaceID, Windows Hello, Fingerprint), se evita el robo de claves y se fuerza la legitimidad física del estudiante durante el "Asistencia Check-In".

---

## 4. Control de Acceso Estricto Basado en Roles (RBAC)

El servidor NestJS ejecuta un Guard recursivo de permisos antes de cada ejecución analizando los 6 Niveles Categóricos del JWT.

1.  **Nivel Omega (`ADMIN`):** Modificación del estado operativo, acceso libre y capacidad destructiva global o de borrado técnico.
2.  **Nivel Aprobatorio (`COORDINADOR`):** Facultado para realizar el Bypass de la base y dar "APROBADO_DEFINITIVO" a procesos, control general sobre tutores académicos y convenios empresariales activos.
3.  **Nivel Supervisor (`TUTOR` / Académico):** Vista aislada. No puede ver las notas empresariales ni manipular convenios; solo aprueba los subyacentes de los "Estudiantes" asignados con su UUID explícito.
4.  **Nivel Externo (`TUTOR_EMPRESARIAL` y `EMPRESA`):** Solo ven "Visibilizar" a los pasantes afiliados matemáticamente a su ID de Compañía. No tienen acceso real de escritura en el registro de estudiantes, solo en las Evaluaciones relacionales.
5.  **Nivel Terminal (`ESTUDIANTE`):** Visión túnel y Sandbox. Sus mutaciones de base de datos (`POST` / `PATCH`) se validan contra el interceptor asegurando en cada transacción que su propio token corresponda y matche obligatoriamente al ID de lo que está intentando actualizar.

---

## 5. Prevención de Robo de Sesión en UI (Frontend)

En NextJS (Client Side):
- Se protegen rutas privadas usando Hooks globales (`useAuth`).
- Desconexión forzosa (Auto-Logout) transcurridos *Militimeouts* de inactividad, erradicando persistencias maliciosas en computadoras o cibercafés públicos.
