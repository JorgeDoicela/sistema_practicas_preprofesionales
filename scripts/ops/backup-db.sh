#!/bin/bash
# =====================================================================
#   EMITESIS CORE - SCRIPT DE RESPALDO DE BASE DE DATOS (PRODUCCIÓN)
# =====================================================================
# Genera copias de seguridad calientes y comprimidas de la base de datos
# PostgreSQL en ejecución dentro del contenedor Docker y aplica políticas
# de rotación automática para conservar el espacio en disco.

set -o pipefail # Capturar fallos en tuberías (pipes) como pg_dump | gzip

# Códigos de colores ANSI para una visualización premium
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # Sin color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✔]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

log_error() {
    echo -e "${RED}[✘]${NC} $1"
}

# Configuración por defecto
BACKUP_DIR="$HOME/emitesis/backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/emitesis_db_$TIMESTAMP.sql.gz"
CONTAINER_NAME="emitesis-db-prod"
DB_USER="postgres"
DB_NAME="emitesis_db"

# Asegurar que el directorio de respaldos exista
mkdir -p "$BACKUP_DIR"

log_info "Iniciando proceso de copia de seguridad de EmiTesis..."

# 1. Cargar variables del archivo .env local si existe para autenticación real
ENV_PATH="$HOME/emitesis/.env"
if [ -f "$ENV_PATH" ]; then
    log_info "Cargando credenciales del archivo de entorno en $ENV_PATH..."
    # Filtrar comentarios y exportar variables de entorno de configuración
    export $(grep -v '^#' "$ENV_PATH" | xargs)
    DB_USER="${POSTGRES_USER:-$DB_USER}"
    DB_NAME="${POSTGRES_DB:-$DB_NAME}"
    log_success "Credenciales cargadas correctamente para el usuario: $DB_USER en DB: $DB_NAME."
else
    log_warning "No se encontró el archivo .env en $ENV_PATH. Usando credenciales por defecto."
fi

# 2. Validar que el motor Docker y el contenedor estén en ejecución
if ! command -v docker &> /dev/null; then
    log_error "Docker no se encuentra instalado en este sistema. Abortando respaldo."
    exit 1
fi

log_info "Verificando estado del contenedor de base de datos..."
CONTAINER_STATUS=$(docker inspect -f '{{.State.Running}}' "$CONTAINER_NAME" 2>/dev/null || echo "false")

if [ "$CONTAINER_STATUS" != "true" ]; then
    # Intentar buscar contenedor local de desarrollo como respaldo en entornos híbridos
    if docker inspect -f '{{.State.Running}}' "emitesis-db" 2>/dev/null | grep -q "true"; then
        CONTAINER_NAME="emitesis-db"
        log_warning "Contenedor de producción no encontrado. Redireccionando respaldo a base de datos de desarrollo: $CONTAINER_NAME"
    else
        log_error "El contenedor de la base de datos ($CONTAINER_NAME) no está en ejecución o no existe."
        log_error "Por favor, levante la base de datos usando 'docker compose up -d' antes de respaldar."
        exit 1
    fi
fi

# 3. Ejecutar el volcado de la base de datos de manera atómica
log_info "Realizando volcado en caliente (pg_dump) desde el contenedor '$CONTAINER_NAME'..."
if docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_FILE"; then
    
    # Comprobar la integridad física básica del respaldo (que no esté vacío o sea inválido)
    if [ -s "$BACKUP_FILE" ]; then
        log_success "Copia de seguridad generada con éxito."
        log_info "Ruta del archivo: $BACKUP_FILE"
        
        # Ajustar permisos de lectura y escritura exclusivos para el propietario (Seguridad Estricta)
        chmod 600 "$BACKUP_FILE"
        log_success "Permisos del archivo asegurados correctamente (Lectura/Escritura exclusivo para propietario)."
    else
        log_error "El archivo de respaldo generado está vacío. Ocurrió un fallo en el flujo."
        rm -f "$BACKUP_FILE"
        exit 1
    fi
else
    log_error "Falló la ejecución del comando pg_dump en el contenedor de base de datos."
    exit 1
fi

# 4. Rotación automática de copias de seguridad antiguas (Mayor a 30 días)
log_info "Analizando rotación de archivos antiguos para optimizar almacenamiento en VPS..."
FILES_TO_REMOVE=$(find "$BACKUP_DIR" -name "emitesis_db_*.sql.gz" -type f -mtime +30)

if [ -n "$FILES_TO_REMOVE" ]; then
    log_warning "Los siguientes respaldos exceden la antigüedad permitida (30 días) y serán eliminados:"
    echo "$FILES_TO_REMOVE" | while read -r file; do
        log_warning "Eliminando archivo de respaldo obsoleto: $(basename "$file")"
        rm -f "$file"
    done
    log_success "Rotación y depuración completada con éxito."
else
    log_info "No se encontraron archivos de respaldo con más de 30 días de antigüedad."
fi

log_success "Proceso de respaldo de EmiTesis finalizado exitosamente."
