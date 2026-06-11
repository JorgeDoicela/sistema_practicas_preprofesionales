#!/bin/bash
# =====================================================================
#   EMITESIS CORE - REINICIO TOTAL DE ENTORNO (PRODUCCIÓN)
# =====================================================================
# Detiene todos los contenedores en producción, purga volúmenes
# (incluyendo la base de datos completa), compila imágenes, aplica 
# migraciones de Prisma y levanta todos los servicios limpios.

set -e

# Detectar el directorio raíz del proyecto (dos niveles arriba de scripts/ops/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

# Códigos de colores ANSI para una visualización premium en consola
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

# Encabezado elegante
echo -e "${PURPLE}=====================================================================${NC}"
echo -e "${PURPLE}   EMITESIS CORE - FLUX DE REINICIO TOTAL Y PURGA GENERAL            ${NC}"
echo -e "${PURPLE}=====================================================================${NC}"

# Validar confirmación de seguridad para evitar desastres
PROCEDER=false
if [ "$1" = "--force" ]; then
    PROCEDER=true
else
    echo -e "${RED}=====================================================================${NC}"
    echo -e "${RED}   ¡ATENCIÓN CRÍTICA! ESTA OPERACIÓN ES TOTALMENTE DESTRUCTIVA        ${NC}"
    echo -e "${RED}=====================================================================${NC}"
    log_warning "Esta acción detendrá todos los servicios, eliminará la base de datos,"
    log_warning "limpiará todos los volúmenes en producción y reconstruirá las imágenes."
    read -p "¿Está seguro de querer proceder con el reinicio total? (s/N): " confirmacion
    if [[ "$confirmacion" =~ ^[sS]$ ]]; then
        PROCEDER=true
    fi
fi

if [ "$PROCEDER" != true ]; then
    log_info "Reinicio total cancelado. El entorno de producción sigue funcionando sin alteraciones."
    exit 0
fi

# 1. Detener servicios y eliminar volúmenes
log_warning "Deteniendo servicios y destruyendo contenedores, redes y volúmenes antiguos..."
docker compose -f docker-compose.prod.yml down -v --remove-orphans
log_success "Entorno purgado con éxito."

# 2. Compilar imágenes Docker localmente
log_info "Compilando imágenes de Docker en base al código fuente local..."
docker compose -f docker-compose.prod.yml build
log_success "Compilación completada de todos los servicios."

# 3. Aplicar migraciones previas a la base de datos
log_info "Iniciando contenedor temporal para aplicar migraciones en la base de datos limpia..."
docker compose -f docker-compose.prod.yml run --rm api npx prisma migrate deploy
log_success "Migraciones iniciales cargadas exitosamente."

# 4. Levantar todos los servicios en segundo plano
log_info "Levantando el ecosistema de servicios (Nginx, Web, API, Postgres) en producción..."
docker compose -f docker-compose.prod.yml up -d
log_success "Todos los contenedores iniciados con éxito en segundo plano."

echo -e "${PURPLE}=====================================================================${NC}"
log_success "REINICIO TOTAL DE EMITESIS COMPLETADO EXITOSAMENTE"
log_info "Mostrando logs de NestJS en tiempo real (Presione Ctrl+C para salir)"
echo -e "${PURPLE}=====================================================================${NC}"

docker compose -f docker-compose.prod.yml logs -f api
