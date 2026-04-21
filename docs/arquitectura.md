# Arquitectura Técnica y Topología de Despliegue

Este documento define la estructura física y lógica del ecosistema EmiTesis, garantizando un despliegue escalable, proactivo, trazable y de alta disponibilidad corporativa.

---

## 1. Stack Tecnológico Industrializado (Technology Stack)

El sistema emplea un conjunto de tecnologías de última generación meticulosamente seleccionadas para maximizar la seguridad perimetral, la persistencia de datos relacionales y la mantenibilidad a largo plazo.

| Categoría | Tecnología Empleada | Propósito Arquitectónico y Valor Técnico |
| :--- | :--- | :--- |
| **Backend Core** | NestJS (Node.js) | El núcleo orquestador. Desarrollado en TypeScript bajo paradigmas de Inyección de Dependencias. Utiliza **Interceptores Globales** y **Filtros de Excepción** para una homogeneidad de API RESTful perfecta. |
| **Frontend Framework** | Next.js 16+ (App Router) | Interfaz transaccional (Client/SSR). Emplea `Skeleton Loading` interactivos, renderizado parcial y manejo de vistas Reactivas con Tailwind CSS. |
| **Persistencia ORM** | Prisma 5 | Wrapper de base de datos *Type-Safe*. Garantiza migraciones consistentes de esquema y permite un `Seed` algorítmico avanzado para simulaciones de carga. |
| **Motor Relacional** | PostgreSQL | Almacenamiento maestro de datos (Statefulness). Maneja más de 20 uniones y jerarquías referenciales críticas (*Cascade Deletions*). |
| **Motor de Inteligencia**| OpenAI GPT-4o vía API | Motor de inferencia incrustado asíncronamente en los copilotajes y evaluación de reportes de texto e imágenes (OCR semántico). |
| **Distribución Estructurada**| Vercel Blob Storage | CDN inmutable para almacenamiento descentralizado de documentos PDF gigantescos, archivos fotográficos y evidencias satelitales. Encriptado en reposo. |
| **Transporte de Red** | HTTPS / WebSockets (Socket.io) | Manejo bidireccional seguro (TLS) y tráfico asíncrono para notificaciones In-App en vivo sin cuellos de botella mediante Polling. |

---

## 2. Abstracción del Modelo C4

La separación de preocupaciones (Separation of Concerns) se aplica estructuralmente:

### Contexto (Nivel 1)
EmiTesis actúa como el "Control Tower" entre sistemas externos (MTA de correos electrónicos, Proveedores OIDC, Motores de IA en la nube) y Entidades Reales (Estudiantes, Coordinadores de Carrera). Todo flujo interactivo pasa por validación central.

### Contenedores (Nivel 2)
```mermaid
graph TD
    ClientFrontend[Aplicación Web Next.js\nInterfaz Reactiva UI] -->|RESTful & WebSockets| APIGateway[Core API NestJS\nServicios Interceptados]
    
    subgraph "Nube Híbrida / Managed Services"
        APIGateway -->|Conexión Pool Prisma| DB[(PostgreSQL Master\nData Relacional)]
        APIGateway -->|SDK Vercel| Storage[Vercel Blob Storage\nRepositiorio Físico]
        APIGateway -->|API Rest REST| AI[Motor GPT-4o\nProcesamiento Semántico]
        APIGateway -->|SMTP TLS| MailService[Nodemailer/SMTP\nGestión de Notificaciones]
    end
```

---

## 3. Arquitectura Lógica Defensiva (Resiliencia)

El backend de EmiTesis no expone servicios al cliente de manera cruda; requiere transicionar por un **Tunnel de Resiliencia**. Cada petición HTTP atraviesa:

1. **Helmet Middleware + CORS Layer:** Filtrado perimetral contra XSS, ataques de enmarcado (Clickjacking) y limitación de agentes remotos.
2. **Passport JWT Auth Guard:** Resolución criptográfica de la sesión de WebAuthn o Bearer Token del cliente.
3. **Roles Guard (RBAC):** Una muralla que comprueba recursivamente en base de datos si el JWT decodificado tiene autorización algorítmica para el controlador final.

### El Estándar de Retorno Constante (TransformInterceptor)
Cualquier endpoint que devuelva código 201 o 200, será transformado automáticamente en el servidor para evitar discrepancias que corrompan el parseo del front-end. Esto asegura que _todas_ las respuestas tengan la máscara geométrica: 
```typescript
{
  "success": true,
  "data": { ... payload original ... },
  "timestamp": "2026-04-21T01:00:00Z"
}
```

---

## 4. Estrategia del Motor Contextual IA (Hybrid Copilot)

El `AiService` (NestJS) no es un sistema de autocompletado en blanco; su lógica integra un **System Prompt inyectado en tiempo real**. 
Antes de disparar a OpenAI, el sistema:
1. Extrae de Postgres el ID del estudiante, las horas validadas y el estado actual (e.g. `EN_REVISION_TUTOR`).
2. Forma el contexto e interpola variables.
3. Lo envía como *System Context* al GPT-4o asegurando un soporte extremadamente técnico y acoplado a la academia ("Zero-Hallucination Policy").

---

## 5. Cron Jobs y Automatización 

La salud institucional requiere auditorías automáticas invisibles:
*   Módulo `@nestjs/schedule` que se ejecuta asíncronamente (Diario, a las 02:00 AM) para realizar tareas de "Garbage Collection" (Borrado de documentos huérfanos que nunca se finalizaron y saturación en Vercel Blob).
*   Monitoreo por inactividad prolongada y envíos agrupados de recordatorios de evaluación empresarial (via SMTP/Email).
