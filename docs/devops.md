# Manual de DevOps y Despliegue Continuo

Este documento detalla la infraestructura automatizada que se ha diseñado para garantizar que el sistema EmiTesis sea portable, seguro y fácil de actualizar.

## 1. Pipeline Automático de Integración (CI/CD)

Se ha implementado un flujo de trabajo en GitHub Actions (`ci.yml`) que actúa como control de calidad y despliegue automatizado. El proceso se divide en dos fases fundamentales:

### 1.1 Validación Estricta
Cada vez que se sube código a la rama principal, el sistema ejecuta automáticamente una serie de defensas:
*   **Auditoría de Seguridad:** Escaneamos las dependencias para detectar vulnerabilidades conocidas antes de avanzar.
*   **Entorno Efímero de Pruebas:** Levantamos una base de datos PostgreSQL temporal dentro del pipeline para validar que las migraciones y los datos maestros (seeds) funcionen perfectamente.
*   **Compilación Robusta:** Verificamos que tanto el Frontend como el Backend compilen sin errores, asegurando que el despliegue nunca falle por fallos de sintaxis o tipos.

### 1.2 Construcción y Publicación (Trabajo: build-and-push)
Se ejecuta solo tras el éxito de la validación en la rama `main`:
*   **Docker Build:** Crea imágenes optimizadas de producción.
*   **GitHub Container Registry (GHCR):** Etiqueta y sube las imágenes a `ghcr.io`.
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
