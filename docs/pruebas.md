# Guía de Pruebas y Aseguramiento de Calidad (Praxis Hub)

Este documento describe los procedimientos, herramientas y convenciones de pruebas implementados para validar la integridad del código, el correcto funcionamiento de las reglas de negocio y asegurar que el sistema **Praxis Hub** cumpla con los más altos estándares de calidad de software antes de pasar a producción.

---

## 1. Tipos de Pruebas y Cobertura (Backend)

El backend utiliza **Jest** como motor de ejecución de pruebas y **Supertest** para las solicitudes HTTP en integración de API.

*   **Pruebas Unitarias (`Unit Tests`):** Validan funciones, servicios y helpers de forma totalmente aislada simulando la base de datos (mediante mocks del prisma service). Ej. validación del cálculo de distancias GPS o de fechas límites en `DocumentsService`.
*   **Pruebas de Integración y Extremo a Extremo (`e2e`):** Validan el ciclo de vida completo de una solicitud HTTP en controladores y rutas relacionales con base de datos de pruebas dedicada. Se alojan en la carpeta `test/`.

### Comandos de Ejecución (En la carpeta `api-emitesis/`)
```bash
# Ejecutar todas las pruebas unitarias
npm run test

# Ejecutar pruebas en modo observador (watch mode)
npm run test:watch

# Ejecutar pruebas de integración e2e
npm run test:e2e

# Generar reporte detallado de cobertura (coverage)
npm run test:cov
```

---

## 2. Análisis Estático de Código (Linting y Formateo)

Para mantener la legibilidad, escalabilidad y coherencia estilística a lo largo de todo el monorepositorio, el proyecto utiliza **ESLint** (con reglas de TypeScript) y **Prettier** para formateo automático.

### Comandos de Validación
```bash
# Validar y corregir automáticamente problemas de estilo y sintaxis
npm run lint

# Formatear todos los archivos según las reglas establecidas
npm run format
```

---

## 3. Pruebas de Humo (Smoke Tests)

Antes de autorizar un paso de versión a preproducción o producción, se debe ejecutar manualmente una batería de pruebas rápidas sobre la interfaz interactiva de Swagger (`/api/docs`) o la interfaz web:
1.  **Flujo de Sesión:** Autenticación exitosa `/auth/login` y retorno de JWT.
2.  **Validación GPS:** Intento de "Check-In" enviando coordenadas correctas y validación de aceptación.
3.  **Gestión Documental:** Carga de un documento PDF de prueba y paso de estado a `EN_REVISION_TUTOR`.

---

## 4. Integración Continua (GitHub Actions CI/CD)

Las pruebas y análisis estáticos están integrados en el pipeline automático de GitHub Actions definido en `ci.yml`. El flujo está diseñado de manera pragmática y flexible:
*   **Anotaciones Informativas:** Los fallos estilísticos o advertencias menores de ESLint se reportan como anotaciones en los archivos del Commit o Pull Request para su posterior limpieza por parte del equipo de desarrollo, sin interrumpir el flujo del pipeline.
*   **Compilación Estricta:** La fase de construcción (`npm run build`) en backend y frontend es mandatoria e ineludible. Cualquier error de tipado o compilación TypeScript detendrá inmediatamente el pipeline para evitar el empaquetado de artefactos con errores.
*   **Aislamiento:** El pipeline levanta una instancia efímera de base de datos PostgreSQL en un contenedor de Docker en paralelo para correr las pruebas de integración e2e de manera limpia en la nube.
