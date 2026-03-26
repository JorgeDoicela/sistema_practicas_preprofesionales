# Guía de Pruebas y Calidad de Software

Este documento describe los procedimientos para validar la integridad del código y asegurar que el sistema EmiTesis cumpla con los estándares de calidad antes de pasar a producción.

## 1. Pruebas Automatizadas (Backend)

El sistema utiliza **Jest** como motor de pruebas y **Supertest** para pruebas de integración de API.

### Ejecución de Pruebas
Dentro de la carpeta `api-emitesis`:
```bash
# Ejecutar todas las pruebas unitarias
npm run test

# Ejecutar pruebas en modo observador (watch)
npm run test:watch

# Generar reporte de cobertura (coverage)
npm run test:cov
```

### Tipos de Pruebas Implementadas
*   **Unitarias:** Validan la lógica aislada de los servicios (ej. validación de fechas en `DocumentsService`).
*   **Integración (e2e):** Validan el flujo completo desde la petición HTTP hasta la respuesta, incluyendo la interacción con la base de datos (carpeta `test/`).

## 2. Análisis Estático de Código (Linting)

Para mantener un estilo de código uniforme y profesional, el proyecto utiliza **ESLint** y **Prettier**. Se ha configurado un entorno flexible que permite la evolución del código sin bloqueos innecesarios por reglas de estilo estrictas.

### Comandos de Validación
```bash
# Validar y corregir automáticamente problemas de estilo
npm run lint

# Formatear todos los archivos según las reglas establecidas
npm run format
```

## 3. Pruebas de Humo (Smoke Tests)
Antes de cada despliegue, se recomienda verificar los endpoints críticos mediante la interfaz de **Swagger** en `/api/docs`:
1.  Login exitoso.
2.  Registro de asistencia (Geofencing).
3.  Carga de documentos.

## 4. Integración en el Pipeline (CI)
Estas verificaciones se ejecutan automáticamente en GitHub Actions. El pipeline está configurado con un enfoque **flexible e informativo**:
*   Los errores de estilo (Lint) o pruebas unitarias fallidas generan reportes detallados en las anotaciones del commit para su revisión técnica.
*   El pipeline continuará con la fase de construcción (Build) siempre que el código sea compilable, asegurando la entrega continua (CD) sin detener despliegues críticos por advertencias secundarias.
*   La compilación exitosa (`npm run build`) es el requisito indispensable para la publicación de imágenes de contenedor.
