#!/bin/bash
# =====================================================================
#   EMITESIS CORE - GESTOR DE BASE DE DATOS UNIFICADO
# =====================================================================
# Script de administración interactivo y automatizado para gestionar las
# migraciones de Prisma, semillas institucionales y copias de seguridad de
# la base de datos de EmiTesis en entornos de desarrollo y producción.

set -e

# Códigos de colores ANSI para una visualización premium
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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

# Detectar inteligentemente si estamos en un dispositivo de entrada interactivo (TTY)
if [ -t 0 ] && [ -t 1 ]; then
    DOCKER_EXEC_OPTS="-it"
else
    DOCKER_EXEC_OPTS="-i"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

if [ -f "docker-compose.prod.yml" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
elif [ -f "docker-compose.yml" ]; then
    COMPOSE_FILE="docker-compose.yml"
else
    log_error "No se encontró docker-compose.prod.yml ni docker-compose.yml."
    exit 1
fi

COMPOSE_CMD=(docker compose -f "$COMPOSE_FILE")
API_CONTAINER="emitesis-api-prod"

mostrar_ayuda() {
    echo -e "${PURPLE}=====================================================================${NC}"
    echo -e "${PURPLE}   EMITESIS CORE - GESTOR DE BASE DE DATOS DE PRODUCCIÓN             ${NC}"
    echo -e "${PURPLE}=====================================================================${NC}"
    echo -e "Uso: ./manage-db.sh [comando]"
    echo ""
    echo -e "Comandos disponibles:"
    echo -e "  ${CYAN}migrate${NC}            : Sincroniza y ejecuta las migraciones de Prisma sin alterar datos."
    echo -e "  ${CYAN}seed${NC}               : Puebla la base de datos con los registros institucionales."
    echo -e "  ${CYAN}reset${NC}              : Purga por completo la base de datos e inicializa de cero"
    echo -e "                       (Advertencia: Ejecuta drop total, recreamiento y seed)."
    echo -e "  ${CYAN}reset --force${NC}      : Realiza el restablecimiento total omitiendo la confirmación."
    echo -e "  ${CYAN}repair${NC}             : Repara error P3005 (schema sin historial de migraciones)."
    echo -e "  ${CYAN}backup${NC}             : Genera una copia de seguridad comprimida e inmediata en disco."
    echo -e "  ${CYAN}help${NC}               : Muestra este panel informativo."
    echo -e "${PURPLE}=====================================================================${NC}"
}

verificar_entorno() {
    log_info "Analizando contenedores activos en el sistema..."

    if docker ps --format '{{.Names}}' | grep -q "^emitesis-api-prod$"; then
        API_CONTAINER="emitesis-api-prod"
        log_success "Detectado entorno de producción activo ('$API_CONTAINER')."
    elif docker ps --format '{{.Names}}' | grep -q "^emitesis-api$"; then
        API_CONTAINER="emitesis-api"
        log_success "Detectado entorno local/desarrollo activo ('$API_CONTAINER')."
    else
        log_warning "Contenedor API no detectado en ejecución estable."
    fi

    if docker ps --format '{{.Names}}' | grep -qE '^(emitesis-db-prod|emitesis-db)$'; then
        log_success "PostgreSQL activo."
    else
        log_error "PostgreSQL no está activo. Levante el stack con:"
        log_error "  docker compose -f $COMPOSE_FILE up -d db"
        exit 1
    fi
}

api_esta_ejecutable() {
    docker inspect -f '{{.State.Running}}' "$API_CONTAINER" 2>/dev/null | grep -q '^true$' \
        && docker exec "$API_CONTAINER" true 2>/dev/null
}

api_prisma_cmd() {
    local cmd="$1"

    if api_esta_ejecutable; then
        docker exec $DOCKER_EXEC_OPTS "$API_CONTAINER" sh -c "$cmd"
        return
    fi

    log_warning "API no ejecutable (reiniciando o caída). Usando contenedor temporal..."
    SKIP_PRISMA_SEED=true "${COMPOSE_CMD[@]}" run --rm --no-deps api sh -c "$cmd"
}

reiniciar_api() {
    log_info "Reiniciando servicio API..."
    "${COMPOSE_CMD[@]}" up -d api
}

db_container_name() {
    if docker ps --format '{{.Names}}' | grep -q '^emitesis-db-prod$'; then
        echo "emitesis-db-prod"
    else
        echo "emitesis-db"
    fi
}

limpiar_schema_public() {
    local db_container
    db_container="$(db_container_name)"
    log_warning "Eliminando schema public para reconstruir migraciones desde cero..."
    docker exec -i "$db_container" psql -U postgres -d emitesis_db -v ON_ERROR_STOP=1 -c \
        "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO public;"
}

case "$1" in
    migrate)
        verificar_entorno
        log_info "Iniciando despliegue de migraciones pendientes de Prisma..."
        api_prisma_cmd "npx prisma migrate deploy"
        reiniciar_api
        log_success "Migraciones aplicadas con éxito sobre la base de datos."
        ;;

    seed)
        verificar_entorno
        log_info "Poblando base de datos con semillas institucionales y datos maestros..."
        api_prisma_cmd "npx prisma db seed"
        reiniciar_api
        log_success "Sembrado de base de datos finalizado correctamente."
        ;;

    reset)
        verificar_entorno
        PROCEDER=false

        if [ "$2" = "--force" ]; then
            PROCEDER=true
        else
            echo -e "${RED}=====================================================================${NC}"
            echo -e "${RED}   ¡ALERTA CRÍTICA! ESTA OPERACIÓN BORRARÁ TODOS LOS DATOS EXISTENTES ${NC}"
            echo -e "${RED}=====================================================================${NC}"
            log_warning "Esta acción eliminará registros de usuarios, configuraciones e historial."
            read -p "¿Está completamente seguro de proceder con el restablecimiento total? (s/N): " confirmacion
            if [[ "$confirmacion" =~ ^[sS]$ ]]; then
                PROCEDER=true
            fi
        fi

        if [ "$PROCEDER" = true ]; then
            log_warning "Deteniendo API para evitar conflictos durante el reset..."
            docker stop "$API_CONTAINER" 2>/dev/null || true

            log_warning "Purgando la base de datos y recreando tablas vacías..."
            api_prisma_cmd "npx prisma migrate reset --force --skip-seed"

            log_info "Insertando registros institucionales y de configuración maestros (Seeder)..."
            api_prisma_cmd "npx prisma db seed"

            reiniciar_api
            log_success "La base de datos ha sido restablecida e inicializada de forma impecable."
        else
            log_info "Operación cancelada por el usuario. La base de datos permanece intacta."
        fi
        ;;

    repair)
        verificar_entorno
        log_warning "Reparando base de datos con error P3005 (tablas sin _prisma_migrations)..."
        docker stop "$API_CONTAINER" 2>/dev/null || true

        if ! api_prisma_cmd "npx prisma migrate reset --force --skip-seed"; then
            log_warning "migrate reset no aplicó; limpiando schema manualmente..."
            limpiar_schema_public
            api_prisma_cmd "npx prisma migrate deploy"
        fi

        api_prisma_cmd "npx prisma db seed"
        reiniciar_api
        log_success "Base de datos reparada. La API debería arrancar sin P3005."
        ;;

    backup)
        if [ -f "./backup-db.sh" ]; then
            ./backup-db.sh
        elif [ -f "$SCRIPT_DIR/backup-db.sh" ]; then
            "$SCRIPT_DIR/backup-db.sh"
        elif [ -f "$HOME/emitesis/backup-db.sh" ]; then
            "$HOME/emitesis/backup-db.sh"
        else
            log_error "No se encontró el script 'backup-db.sh' en el directorio de ejecución."
            exit 1
        fi
        ;;

    help|*)
        mostrar_ayuda
        ;;
esac
