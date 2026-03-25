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

Para mantener un estilo de código uniforme y profesional, el proyecto utiliza **ESLint** y **Prettier**.

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

## 4. Integración en el Pipeline
Estas pruebas se ejecutan de forma obligatoria en GitHub Actions. Si alguna prueba falla o el `lint` detecta errores, el pipeline detiene el despliegue automáticamente para proteger la estabilidad del sistema.
