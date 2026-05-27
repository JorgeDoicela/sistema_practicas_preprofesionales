#!/bin/bash
# Script de respaldo automatizado de la base de datos de producción EmiTesis
# Realiza una copia de seguridad comprimida y elimina respaldos con más de 30 días de antigüedad

# Configuración de rutas y variables
BACKUP_DIR="$HOME/emitesis/backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/emitesis_db_$TIMESTAMP.sql.gz"
CONTAINER_NAME="emitesis-db-prod"
DB_USER="postgres"
DB_NAME="emitesis_db"

# Asegurar que el directorio de respaldos existe
mkdir -p "$BACKUP_DIR"

echo "[INFO] Iniciando respaldo de la base de datos..."

# Cargar variables del archivo .env local si existe para obtener credenciales reales
if [ -f "$HOME/emitesis/.env" ]; then
    # Filtrar comentarios y exportar variables de entorno de configuración
    export $(grep -v '^#' "$HOME/emitesis/.env" | xargs)
    DB_USER="${POSTGRES_USER:-$DB_USER}"
    DB_NAME="${POSTGRES_DB:-$DB_NAME}"
fi

# Ejecutar el volcado de la base de datos desde el contenedor de PostgreSQL
if docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_FILE"; then
    echo "[OK] Respaldo completado con éxito: $BACKUP_FILE"
    
    # Asegurar permisos correctos de lectura y escritura exclusivos para el propietario
    chmod 600 "$BACKUP_FILE"
else
    echo "[ERROR] Falló el volcado de la base de datos." >&2
    exit 1
fi

# Eliminar respaldos antiguos (más de 30 días) para evitar saturar el disco del VPS
echo "[INFO] Limpiando respaldos con más de 30 días de antigüedad..."
find "$BACKUP_DIR" -name "emitesis_db_*.sql.gz" -type f -mtime +30 -exec rm -f {} \;
echo "[INFO] Proceso de limpieza finalizado."
