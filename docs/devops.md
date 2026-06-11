# Manual de DevOps y Despliegue Continuo (Praxis Hub)

Este documento detalla la infraestructura automatizada, las tareas de aprovisionamiento de servidores (IaC) y el entorno de ejecución del monorepositorio **Praxis Hub** utilizando estándares modernos de portabilidad y resiliencia.

---

## 1. Entorno de Ejecución

*   **Lenguaje:** TypeScript 5.0+
*   **Plataforma de Ejecución:** Node.js 22 LTS (Estándar del proyecto).
*   **Gestor de Dependencias:** npm (v10+).
*   **Docker Engine:** 24.0+
*   **Docker Compose:** 2.20+
*   **Aprovisionamiento Cloud:** Terraform 1.5+

---

## 2. Pipeline Automático de Integración (CI/CD)

El pipeline de GitHub Actions definido en `.github/workflows/ci.yml` automatiza la verificación y puesta en producción del código en cada push o fusión a la rama `main`.

### 2.1 Fase de Integración Continua (CI)
*   **Auditoría de Vulnerabilidades:** Escaneo automático de dependencias inseguras.
*   **Base de Datos Temporal:** Levantamiento en paralelo de un servicio Docker de PostgreSQL para aplicar las migraciones de Prisma y asegurar la compatibilidad del esquema.
*   **Validaciones de Calidad:** Verificación de ESLint y formateo con Prettier.
*   **Pruebas Unitarias y e2e:** Ejecución de tests en Jest y reportes de cobertura.
*   **Validación de Compilación:** Compilación de la API (NestJS) y del cliente Web (Next.js).

### 2.2 Fase de Entrega Continua (CD)
Una vez superadas las pruebas:
*   **Docker Build:** Compila las imágenes optimizadas para producción de backend y frontend usando el tag del commit y `latest`.
*   **GitHub Container Registry (GHCR):** Publica las imágenes resultantes en `ghcr.io` de manera privada y segura.
*   **SSH VPS Deploy:** El pipeline se conecta por SSH a la máquina virtual (AWS Lightsail) y ejecuta los scripts de reinicio y descarga del nuevo software.

---

## 3. Orquestación con Docker Compose

El archivo `docker-compose.yml` en la raíz del proyecto define el ecosistema local de desarrollo, mientras que `docker-compose.prod.yml` orquesta los servicios de producción:

1.  **`db`:** Servicio PostgreSQL 15-alpine para persistencia de datos relacionales.
2.  **`api`:** El servidor backend NestJS 11+ expuesto en el puerto `5000`. Utiliza el script `docker-entrypoint.sh` para esperar a que PostgreSQL esté activo, correr migraciones, aplicar seeds institucionales y levantar la API.
3.  **`web`:** El servidor frontend Next.js expuesto localmente en el puerto `3005`.
4.  **`nginx`:** Proxy inverso y terminación SSL (HTTPS) que redirige el tráfico exterior al puerto `3005` (web) o `/api` al puerto `5000` (backend).

---

## 4. Guía de Despliegue en Servidor de Producción (AWS VPS)

El despliegue está diseñado bajo el estándar *Zero-Downtime* utilizando Nginx, Docker y Cloudflare.

### 4.1 Requisitos Previos en la VPS (Ubuntu 22.04 LTS)
El servidor VPS debe contar con:
*   Docker y Docker Compose configurados.
*   Puertos públicos abiertos: `22/TCP` (SSH), `80/TCP` (HTTP), `443/TCP` (HTTPS).

### 4.2 GitHub Secrets Requeridos
En la pestaña de configuración del repositorio de GitHub, configure las siguientes variables:
*   `VPS_HOST`: Dirección IP pública del servidor VPS.
*   `VPS_USERNAME`: Usuario del sistema operativo SSH (ej. `ubuntu`).
*   `VPS_SSH_KEY`: Clave privada SSH (`.pem` o `.id_rsa`) para autenticarse en el servidor.
*   `DOMAIN`: Dominio o subdominio apuntado a la IP de la VPS (ej. `emitesis.istpet.edu.ec`).
*   `ENV_PROD`: Contenido completo del archivo de producción `.env`.

---

## 5. Scripts de Operación y Automatización (Ops)

Ubicados en la carpeta `scripts/ops/`, estos scripts simplifican tareas críticas en el servidor:

### 5.1 Aprovisionamiento Inicial (`setup-vps.sh`)
Script bash ejecutado una sola vez en un servidor Ubuntu limpio:
1.  Actualiza dependencias e instala Docker y Docker Compose automáticamente.
2.  **Firewall Defensivo (UFW):** Cierra todos los puertos de la máquina al exterior (incluyendo el puerto de base de datos `5432` y puertos de NodeJS `5000`/`3005`), exponiendo exclusivamente `22` (SSH), `80` (HTTP) y `443` (HTTPS).
3.  Registra un Cron Job para respaldos diarios automáticos a las 03:00 AM.

### 5.2 Copia de Seguridad Automática (`backup-db.sh`)
Script programado mediante CRON:
1.  Extrae las credenciales del archivo `.env` de producción.
2.  Realiza un volcado comprimido (`pg_dump` y `gzip`) del contenedor `db` sin exponer puertos externos.
3.  Asigna privilegios estrictos `600` al archivo generado para seguridad.
4.  **Rotación de Respaldos:** Elimina automáticamente del disco local (`~/emitesis/backups/`) archivos con más de 30 días de antigüedad para proteger el almacenamiento.

### 5.3 Gestor Unificado de Base de Datos (`manage-db.sh`)
Facilita la interacción rutinaria con Prisma y bases de datos Docker en producción. Comandos disponibles:
*   `./manage-db.sh migrate` $\to$ Ejecuta las migraciones pendientes en el contenedor.
*   `./manage-db.sh seed` $\to$ Siembra la base de datos de producción con datos oficiales.
*   `./manage-db.sh backup` $\to$ Lanza un respaldo instantáneo comprimido en caliente.
*   `./manage-db.sh reset` $\to$ Limpia por completo la base de datos y recrea esquemas y datos semilla. Requiere confirmación manual e interactiva por seguridad.

### 5.4 Limpieza y Restablecimiento Completo (`reset-all.sh`)
Script utilizado principalmente en entornos de desarrollo y staging para limpiar por completo el volumen de Docker, eliminar imágenes colgadas, recrear los contenedores desde cero y aplicar semillas frescas. Ejecútelo con:
```bash
./scripts/ops/reset-all.sh
```
