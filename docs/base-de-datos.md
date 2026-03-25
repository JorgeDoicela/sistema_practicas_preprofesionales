# Diccionario de Datos y Modelo de Entidad-Relación

Este documento proporciona una especificación técnica exhaustiva de la base de datos de EmiTesis, detallando cada entidad, sus atributos, restricciones y el propósito de los campos especiales.

## 1. Diagrama Entidad-Relación Completo (Mermaid)

```mermaid
erDiagram
    USER ||--o| COMPANY : "vinculado_a (opcional)"
    USER ||--o{ INTERNSHIP : "como_estudiante"
    USER ||--o{ INTERNSHIP : "como_tutor"
    COMPANY ||--o{ AGREEMENT : "posee"
    COMPANY ||--o{ INTERNSHIP : "aloja"
    INTERNSHIP ||--o{ ATTENDANCE : "registra"
    INTERNSHIP ||--o{ DOCUMENT : "contiene"

    USER {
        string id PK "UUID"
        string email UK "Correo institucional"
        string password "Hash BCrypt (costo 10)"
        string fullName "Nombre completo"
        Role role "Enum: ADMIN, COORDINADOR, TUTOR, ESTUDIANTE, EMPRESA"
        boolean isActive "Estado de cuenta"
        int failedAttempts "Contador para bloqueo"
        datetime lockoutUntil "Fecha/hora de liberación de bloqueo"
        string resetToken "Token de recuperación (32 bytes)"
        datetime resetTokenExpires "Expiración de recuperación (1h)"
    }

    COMPANY {
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
