# Arquitectura de Datos y Diccionario de Base de Datos

El sistema utiliza **PostgreSQL 16** gestionado a través de **Prisma ORM**. La estructura ha sido diseñada para garantizar la integridad referencial, la inmutabilidad de los registros de asistencia y el cumplimiento de la normativa de protección de datos (LOPDP).

## 1. Modelos del Sistema Industrializado

### 1.1 Núcleo de Prácticas
- **Internship (Asignación)**: Entidad central que une al Estudiante, Empresa y Tutores. Almacena las ubicaciones permitidas (JSON), el estado del test de actitud y las coordenadas principales.
- **Attendance (Asistencia)**: Registro inmutable de entradas y salidas. Incluye geolocalización, biometría y **activityPhotoKey** para evidencias visuales.
- **Evaluation (Evaluación Dual)**: Almacena puntajes de aptitud y actitud. Diferencia entre evaluaciones de tipo `ACADEMICA` y `EMPRESARIAL`.

### 1.2 Monitoreo y Seguimiento 360
- **MonitoringVisit (Visita de Campo)**: Registro de las visitas de supervisión realizadas por el tutor académico. Almacena fecha, observaciones y resultados de la verificación in situ.
- **Document (Gestión Documental)**: Rastreo del ciclo de vida de los 21+ documentos obligatorios, incluyendo validaciones y plantillas.

### 1.3 Auditoría e Inteligencia
- **SystemLog (Auditoría Industrial)**: Registro de eventos de seguridad, acceso a datos sensibles (LOPDP) y errores sistémicos. Esencial para el cumplimiento normativo.
- **AiChatLog**: Registro de las interacciones del estudiante con el Copilot de IA, permitiendo refinar el conocimiento del asistente.

### 1.4 Comunicación y Privacidad
- **Announcement (Avisos Masivos)**: Gestión de notificaciones globales para roles específicos.
- **PrivacyRequest (LOPDP/ARCO)**: Gestión de solicitudes ciudadanas sobre sus datos personales (Acceso, Rectificación, Cancelación, Oposición).

## 2. Diagrama Entidad-Relación (Conceptual)

```mermaid
erDiagram
        string id PK "UUID"
        string ruc UK "Identificación fiscal única"
        string name "Nombre comercial"
        string address "Dirección física"
        string representative "Representante legal"
        string email "Contacto corporativo"
    }

    AGREEMENT {
        string id PK "UUID"
        string companyId FK "Relación con Company"
        datetime startDate "Inicio de vigencia"
        string filePath "Ruta al PDF firmado"
        string status "Estado (Activo, Vencido)"
    }

    INTERNSHIP {
        string id PK "UUID"
        string studentId FK "Relación con User (ESTUDIANTE)"
        string tutorId FK "Relación con User (TUTOR)"
        string companyId FK "Relación con Company"
        datetime startDate "Fecha de inicio"
        datetime endDate "Fecha de culminación proyectada"
        int totalHours "Total de horas a cumplir"
        string location "Ubicación detallada"
        float lat "Latitud de la empresa"
        float lng "Longitud de la empresa"
        string status "Enum: En Proceso, Finalizado"
    }

    DOCUMENT {
        string id PK "UUID"
        string internshipId FK "Relación con Internship"
        string name "Nombre del formato obligatorio"
        string filePath "Ruta en Storage (Vercel Blob)"
        DocumentStatus status "Enum: PENDIENTE, EN_REVISION, etc."
        string observations "Feedback del tutor/coordinador"
        datetime startDate "Apertura para subida"
        datetime dueDate "Fecha límite"
        datetime submittedAt "Fecha de entrega"
    }

    ATTENDANCE {
        string id PK "UUID"
        string internshipId FK "Relación con Internship"
        datetime checkIn "Entrada"
        datetime checkOut "Salida"
        float lat "Captura GPS"
        float lng "Captura GPS"
        float distanceKm "Distancia calculada vs Empresa"
    }
```

## 2. Diccionario de Datos: Atributos Especiales

### Gestión de Seguridad (Modelo `User`)
*   `failedAttempts`: Contador incremental que se dispara ante logins fallidos.
*   `lockoutUntil`: Sello de tiempo (Timestamp) que impide el acceso a la cuenta por 15 minutos tras 5 fallos.
*   `resetToken`: Cadena alfanumérica única generada mediante `crypto.randomBytes(32)` para flujos de recuperación.

### Control de Prácticas (Modelo `Internship`)
*   `totalHours`: Horas validadas por el sistema. No se puede cerrar la práctica si las asistencias no cubren el total.
*   `lat / lng`: Almacenan las coordenadas de la empresa para el algoritmo de validación de presencia.

## 3. Consideraciones de Integridad y Rendimiento

El diseño de la base de datos prioriza la consistencia y la seguridad del dato mediante las siguientes estrategias:

1.  **Validación de Tipos (Type Safety):** Gracias al uso de Prisma, el esquema de datos está sincronizado matemáticamente con el código fuente. Esto previene que se almacenen datos inconsistentes o tipos incorrectos, asegurando la calidad de la información desde la raíz.
2.  **Garantía de Relaciones:** PostgreSQL asegura la integridad referencial. Todas las relaciones entre estudiantes, tutores y empresas están estrictamente supervisadas a nivel de base de datos para evitar registros huérfanos.
3.  **Transaccionalidad Atómica:** Operaciones críticas, como la creación de una práctica con sus documentos obligatorios, se ejecutan en transacciones. Esto garantiza que el sistema nunca quede en un estado incompleto si ocurre un fallo.
4.  **Geolocalización Precisa:** El uso de tipos Double Precision para las coordenadas permite una exactitud milimétrica en el cálculo de distancias para el control de asistencia (geofencing).
