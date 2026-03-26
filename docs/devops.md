# Manual de DevOps y Despliegue Continuo

Este documento detalla la infraestructura automatizada y el entorno de ejecución diseñado para garantizar que el sistema EmiTesis sea portable, seguro y eficiente, utilizando tecnologías de vanguardia como Node.js 22.

## 0. Entorno de Ejecución
*   **Lenguaje:** TypeScript 5.0+
*   **Entorno:** Node.js 22 LTS (Estándar del proyecto).
*   **Gestor de Dependencias:** npm con uso de `--legacy-peer-deps` para resolución de conflictos.
*   **Docker Engine:** 24.0+
*   **Docker Compose:** 2.20+

## 1. Pipeline Automático de Integración (CI/CD)

Se ha implementado un flujo de trabajo en GitHub Actions (`ci.yml`) que actúa como control de calidad y despliegue automatizado. El proceso se divide en dos fases fundamentales:

### 1.1 Validación Inteligente
Cada vez que se realiza un push o pull request a la rama `main`, el sistema ejecuta una serie de validaciones diseñadas para ser informativas y no bloqueantes en fases preliminares, asegurando agilidad en el desarrollo:
*   **Auditoría de Seguridad:** Escaneo de dependencias para detectar vulnerabilidades críticas.
*   **Entorno de Pruebas Efímero:** Levantamiento automatizado de una base de datos PostgreSQL 15 temporal para validar migraciones y esquemas de Prisma.
*   **Calidad de Código (Linting):** Verificación de estándares de código (ESLint) reportando advertencias sin detener el flujo si son menores.
*   **Compilación de Producción:** Validación de que tanto el Frontend (Next.js) como el Backend (NestJS) compilan perfectamente.

### 1.2 Construcción y Publicación Optimista
Tras la validación, el pipeline procede a la generación de artefactos finales:
*   **Docker Build Optimizado:** Se utiliza `npm install --legacy-peer-deps` para garantizar la resolución de dependencias complejas y asegurar una construcción exitosa en entornos aislados.
*   **GitHub Container Registry (GHCR):** Publicación automática de imágenes etiquetadas a `ghcr.io` para su posterior despliegue.
*   **Seguridad de Acceso:** Utiliza el secreto nativo `GITHUB_TOKEN` para autenticarse, eliminando la necesidad de gestionar claves externas de Docker Hub.

## 2. Orquestación con Docker Compose

El archivo `docker-compose.yml` en la raíz define el ecosistema de ejecución:

### Servicios Definidos
1.  **db:** Imagen oficial de PostgreSQL 15-alpine encargada de la persistencia de datos.
2.  **api:** El servidor backend NestJS. Incluye una política de reinicio `unless-stopped`.
3.  **web:** El servidor frontend Next.js.

### Automatización de Arranque (Entrypoint)
El backend utiliza un script de entrada personalizado (`docker-entrypoint.sh`) que garantiza el orden de ejecución:
1.  Espera a que la base de datos esté lista para recibir conexiones.
2.  Ejecuta `npx prisma migrate deploy` para actualizar el esquema sin perder datos.
3.  Ejecuta `npm run seed` para poblar tablas maestras si están vacías.
4.  Inicia el servidor en modo producción.

## 3. Guía de Despliegue en Servidor Nuevo

Para desplegar el sistema en un nuevo entorno de producción (ej. VPS), seguir estos pasos:

1.  **Requisitos:** Tener instalados Docker y Docker Compose.
2.  **Configuración:** Clonar el repositorio y configurar el archivo `.env` basado en `.env.example`.
3.  **Ejecución:**
    ```bash
    docker-compose up -d
    ```
4.  **Verificación:** Acceder a los logs con `docker-compose logs -f` para confirmar que las migraciones y el arranque del servidor fueron exitosos.
