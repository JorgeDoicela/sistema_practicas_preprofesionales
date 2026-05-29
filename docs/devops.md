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

## 3. Guía de Despliegue Automatizado en Servidor de Producción (AWS VPS)

El despliegue de la aplicación se encuentra automatizado a través de GitHub Actions utilizando Docker y Nginx Proxy en conjunto con el SSL de Cloudflare para la gestión del tráfico y certificados SSL (HTTPS) de forma centralizada.

### 3.1 Requisitos Previos en el Servidor (AWS VPS)

Para el correcto funcionamiento de los contenedores en producción, el servidor AWS VPS debe contar con:
*   **Sistema Operativo:** Ubuntu Server 22.04 LTS o superior (recomendado).
*   **Docker Engine:** Versión 24.0 o superior.
*   **Docker Compose:** Versión 2.20 o superior.
*   **Puertos Abiertos en el Grupo de Seguridad:** 
    *   `22/TCP` (SSH) para el pipeline de despliegue.
    *   `80/TCP` (HTTP) para redirecciones y validaciones de Let's Encrypt.
    *   `443/TCP` (HTTPS) para el acceso seguro al sistema.

### 3.2 Configuración de GitHub Secrets (Obligatorio)

Para que el pipeline de GitHub Actions pueda realizar la compilación, transferencia de archivos y despliegue automático, es mandatorio registrar los siguientes secretos en el repositorio (Settings > Secrets and variables > Actions):

*   `VPS_HOST`: La dirección IP pública del servidor AWS VPS.
*   `VPS_USERNAME`: El usuario SSH de acceso a la instancia (por ejemplo, `ubuntu` o `ec2-user`).
*   `VPS_SSH_KEY`: El contenido completo de la clave privada SSH (archivo `.pem` o `.id_rsa`) con la que se tiene acceso al servidor.
*   `ENV_PROD`: El contenido de las variables de entorno de producción que se utilizarán para la aplicación. Debe tener la estructura de un archivo `.env` regular con las siguientes variables clave:
    ```ini
    POSTGRES_USER=postgres
    POSTGRES_PASSWORD=una_contrasena_segura_aqui
    POSTGRES_DB=emitesis_db
    DATABASE_URL=postgresql://postgres:una_contrasena_segura_aqui@db:5432/emitesis_db?schema=public
    JWT_SECRET=una_clave_secreta_para_jwt_segura
    CORS_ORIGINS=https://su-dominio.com
    PUBLIC_APP_URL=https://su-dominio.com
    MAIL_USER=su_correo@gmail.com
    MAIL_PASS=su_contrasena_de_aplicacion
    SKIP_PRISMA_SEED=
    RECAPTCHA_SECRET_KEY=su_clave_secreta_recaptcha
    BLOB_READ_WRITE_TOKEN=su_token_de_vercel_blob
    OPENAI_API_KEY=su_clave_openai
    ```
*   `DOMAIN`: El nombre de dominio o subdominio apuntado a la IP de la VPS (por ejemplo, `emitesis.tudominio.com`). Cloudflare actuará como proxy de este dominio y enrutará las peticiones HTTP seguras al puerto 80 del servidor VPS.

### 3.3 Flujo de Despliegue Automatizado

Una vez configurados los secretos en GitHub, el flujo se ejecuta automáticamente al realizar un `push` a la rama `main`:

1.  **Fase de Integración Continua (CI):** Ejecuta validaciones de linting, auditoría de dependencias, base de datos de pruebas efímera y compilación de la Web y la API.
2.  **Fase de Empaquetado:** Construye las imágenes Docker de la API y de la Web, y las publica de forma segura en GitHub Container Registry (GHCR).
3.  **Fase de Despliegue Continuo (CD):** 
    *   Se conecta al servidor VPS por SSH.
    *   Crea el directorio de trabajo `~/emitesis` en el servidor si no existe.
    *   Transfiere los archivos de orquestación `docker-compose.prod.yml` y `nginx.conf`.
    *   Escribe el archivo `.env` en base al secreto `ENV_PROD` y asocia el secreto `DOMAIN`.
    *   Autentica el motor Docker local en GHCR usando el token temporal de GitHub Actions.
    *   Descarga las imágenes actualizadas (`docker compose pull`).
    *   Realiza un reinicio ordenado de los servicios (`docker compose up -d`).
    *   Limpia las imágenes obsoletas en la VPS para optimizar el almacenamiento.

### 3.4 Despliegue Manual Alternativo

Si por algún motivo requiere realizar el despliegue de forma manual directo en el servidor:

1.  Acceda al servidor e instale Docker y Docker Compose si no los tiene.
2.  Cree el directorio del proyecto y transfiera los archivos `docker-compose.prod.yml` y `nginx.conf` al mismo.
3.  Cree un archivo `.env` en ese directorio y defina manualmente las variables de producción (incluyendo `DOMAIN`).
4.  Inicie sesión en GHCR de forma manual en su terminal local o servidor:
    ```bash
    echo "SU_GITHUB_PAT" | docker login ghcr.io -u SU_USUARIO_GITHUB --password-stdin
    ```
5.  Ejecute la descarga y puesta en marcha de los servicios:
    ```bash
    docker compose -f docker-compose.prod.yml pull
    docker compose -f docker-compose.prod.yml up -d
    ```
6.  Para inspeccionar el comportamiento de las migraciones, la base de datos y la inicialización de la API, use:
    ```bash
    docker compose -f docker-compose.prod.yml logs -f api
    ```

## 4. Scripts de Automatización Avanzada y Seguridad Estricta

Para garantizar un estándar de fiabilidad y seguridad óptimo (equivalente a entornos transaccionales o bancarios), el repositorio incluye dos scripts de automatización para su ejecución en la VPS.

### 4.1 Script de Aprovisionamiento y Segurización (`setup-vps.sh`)

Este script se encarga de preparar un servidor recién creado con todas las dependencias necesarias y aplicar reglas estrictas de cortafuegos (firewall).

**Acciones que realiza automáticamente:**
1.  **Actualización del Sistema:** Actualiza la lista de paquetes de la VPS e instala las últimas actualizaciones de seguridad.
2.  **Instalación del Entorno:** Detecta e instala Docker Engine y Docker Compose de forma desasistida.
3.  **Firewall Estricto (Nivel Transaccional):** Configura y activa UFW (Uncomplicated Firewall) para rechazar cualquier petición externa dirigida a puertos vulnerables (como el puerto interno de la base de datos `5432` o los puertos de los servicios `5000` y `3005`). Únicamente se exponen al exterior los puertos estrictamente necesarios:
    *   `22/TCP` (SSH)
    *   `80/TCP` (HTTP)
    *   `443/TCP` (HTTPS)
4.  **Respaldo Continuo:** Copia el script de respaldo en el directorio operativo y configura un cron job (tarea automática programada) para ejecutar copias de seguridad de la base de datos todos los días a las 03:00 AM de forma silenciosa.

**Cómo ejecutarlo en la VPS (Una sola vez):**
Una vez clonado el repositorio o transferido el script `setup-vps.sh` y `backup-db.sh` al servidor, ejecute:
```bash
chmod +x setup-vps.sh backup-db.sh
./setup-vps.sh
```

### 4.2 Script de Respaldos de Base de Datos (`backup-db.sh`)

Este script se encarga de proteger la información del sistema ante pérdidas fortuitas o corrupción de datos.

**Acciones que realiza automáticamente:**
1.  **Detección de Variables:** Carga de manera dinámica las credenciales y el nombre de la base de datos a partir del archivo `.env` de producción.
2.  **Volcado Seguro:** Realiza un volcado completo de la base de datos ejecutando `pg_dump` directo en el contenedor de base de datos sin necesidad de exponerla externamente.
3.  **Compresión de Alta Eficiencia:** Comprime el archivo resultante utilizando `gzip` y lo etiqueta con una marca de tiempo detallada (año, mes, día, hora, minutos y segundos).
4.  **Protección de Archivo:** Ajusta los privilegios del archivo generado (`chmod 600`) para asegurar que únicamente el usuario propietario del servidor pueda leer o modificar el archivo.
5.  **Rotación de Respaldos:** Identifica y elimina automáticamente del disco los respaldos con más de 30 días de antigüedad para mantener estable el espacio de almacenamiento del servidor.

**Ubicación de los respaldos:**
Los archivos de respaldo se almacenan de forma segura en la ruta `~/emitesis/backups/`.

### 4.3 Script Gestor de Base de Datos Unificado (`manage-db.sh`)

Para simplificar las tareas rutinarias de administración sobre la base de datos de producción (evitando memorizar comandos complejos de Docker), se proporciona un script gestor unificado interactivo y parametrizable.

**Comandos disponibles:**
*   **Sincronización de Migraciones:** Aplica las últimas migraciones de Prisma sin alterar los datos de producción.
    ```bash
    ./manage-db.sh migrate
    ```
*   **Población de Datos de Prueba (Seeder):** Inserta los registros institucionales del ISTPET en la base de datos.
    ```bash
    ./manage-db.sh seed
    ```
*   **Restablecimiento Total en Un Solo Paso:** Limpia por completo la base de datos (drop schemas) y ejecuta la secuencia completa de recreación de tablas e inserción de semillas/datos de prueba. Cuenta con una advertencia de confirmación por seguridad interactiva.
    ```bash
    ./manage-db.sh reset
    ```
*   **Restablecimiento Forzado (Omitir Confirmación):** Realiza el flujo completo de restablecimiento de forma silenciosa para entornos desasistidos.
    ```bash
    ./manage-db.sh reset --force
    ```
*   **Copia de Seguridad Instantánea:** Llama directamente al script de respaldo para generar una copia de seguridad en caliente comprimida.
    ```bash
    ./manage-db.sh backup
    ```

**Cómo utilizarlo en la VPS:**
El script se actualiza automáticamente con cada despliegue de GitHub Actions en el directorio `~/emitesis/`. Para usarlo, simplemente conéctese por SSH a la VPS y ejecute el script con la acción deseada. Si no se especifica ninguna acción, el script mostrará un menú explicativo de ayuda.



