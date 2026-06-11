# Índice de Documentación Técnica - Praxis Hub (ISTPET)

Bienvenido a la base de conocimientos central de **Praxis Hub**, el ecosistema de nivel industrial diseñado para la automatización, monitoreo, gobernanza y certificación de prácticas preprofesionales en el **ISTPET**.

---

## Mapa de Navegación

Recomendamos revisar la documentación en el siguiente orden secuencial para obtener una visión global e integrada del sistema:

### 1. Fundamentos de Negocio y Problemática
*   **[Problemática y Propuesta de Valor](problematica.md):** El caso de negocio, análisis del fraude analógico, cuellos de botella burocráticos y la propuesta de valor estratégico de Praxis Hub.

### 2. Arquitectura del Sistema y Persistencia
*   **[Arquitectura y Topología](arquitectura.md):** Vista general del stack tecnológico, diagrama C4, túneles de resiliencia (interceptores y filtros) y el motor contextual de IA.
*   **[Base de Datos y Estrategia de Seeding](base-de-datos.md):** Diseño Entidad-Relación (3NF), tablas transversales de auditoría y la lógica de inyección de datos para simulación de producción.

### 3. Lógica de Negocio y Reglas Técnicas
*   **[Lógica de Negocio y Reglas de Control](logica-negocio.md):** El ciclo de vida de la práctica, lógica de Haversine para geofencing, rúbrica de evaluación dual y la máquina de estados inmutables para documentos.

### 4. Seguridad y Cumplimiento
*   **[Seguridad y Privacidad LOPDP](seguridad.md):** Cifrado BCrypt/JWT, preparación de autenticación biométrica WebAuthn (Passkeys), cumplimiento de la Ley de Protección de Datos (derechos ARCO) y mitigación de fuerza bruta.

### 5. Guía de API y Desarrollo
*   **[Guía de API y Swagger](api-guia.md):** Catálogo de endpoints transaccionales del backend, uso de Swagger (`/api/docs`) y estándares DTO.
*   **[Estándares de Desarrollo](desarrollo.md):** Convenciones estilísticas de código (Linters), flujos asíncronos y reglas de experiencia de usuario (Skeletons UI).

### 6. Pruebas y Aseguramiento de Calidad
*   **[Guía de Pruebas y Calidad](pruebas.md):** Estructuración de pruebas unitarias y e2e con Jest y Supertest, análisis estático de código y flujos en el pipeline CI/CD.

### 7. Guía del Usuario Final
*   **[Manual de Usuario](manual-usuario.md):** Guía práctica de flujos de trabajo detallados para Estudiantes, Tutores Académicos, Empresas y Administradores.

### 8. DevOps y Mantenimiento Operativo
*   **[DevOps y Despliegue Continuo](devops.md):** Orquestación con Docker Compose, aprovisionamiento automatizado con Terraform (IaC) en AWS Lightsail, y pipelines de GitHub Actions.
*   **[Protocolo de Mantenimiento](mantenimiento.md):** Rutinas de respaldos de base de datos diarios, restauración ante desastres y monitoreo de salud del servidor.

---

## Objetivo de la Base de Conocimientos
Esta documentación ha sido estructurada bajo estrictos estándares corporativos para asegurar:
1.  **Mantenibilidad de Software:** Entrada fluida de nuevos desarrolladores al ecosistema.
2.  **Seguridad y Auditoría:** Transparencia total en el procesamiento de información sensible académica y de geolocalización.
3.  **Calidad Académica:** Referencia formal para el ISTPET en la gobernanza digital.
