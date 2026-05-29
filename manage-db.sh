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
# Evita fallos como "the input device is not a TTY" en pipelines de CI/CD (GitHub Actions)
if [ -t 0 ] && [ -t 1 ]; then
    DOCKER_EXEC_OPTS="-it"
else
    DOCKER_EXEC_OPTS="-i"
fi

CONTAINER_NAME="emitesis-db-prod"
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
    echo -e "  ${CYAN}backup${NC}             : Genera una copia de seguridad comprimida e inmediata en disco."
    echo -e "  ${CYAN}help${NC}               : Muestra este panel informativo."
    echo -e "${PURPLE}=====================================================================${NC}"
}

# Verificar que los contenedores estén en ejecución y detectar el nombre activo dinámicamente
verificar_contenedor() {
    log_info "Analizando contenedores activos en el sistema..."
    
    if docker ps --format '{{.Names}}' | grep -q "^emitesis-api-prod$"; then
        API_CONTAINER="emitesis-api-prod"
        log_success "Detectado entorno de producción activo ('$API_CONTAINER')."
    elif docker ps --format '{{.Names}}' | grep -q "^emitesis-api$"; then
        API_CONTAINER="emitesis-api"
        log_success "Detectado entorno local/desarrollo activo ('$API_CONTAINER')."
    else
        log_error "Ningún contenedor de la API ('emitesis-api-prod' o 'emitesis-api') está activo."
        log_error "Por favor, levante la aplicación con 'docker compose up -d' primero."
        exit 1
    fi
}

case "$1" in
    migrate)
        verificar_contenedor
        log_info "Iniciando despliegue de migraciones pendientes de Prisma..."
        docker exec $DOCKER_EXEC_OPTS "$API_CONTAINER" npx prisma migrate deploy
        log_success "Migraciones aplicadas con éxito sobre la base de datos."
        ;;
        
    seed)
        verificar_contenedor
        log_info "Poblando base de datos con semillas institucionales y datos maestros..."
        docker exec $DOCKER_EXEC_OPTS "$API_CONTAINER" npx prisma db seed
        log_success "Sembrado de base de datos finalizado correctamente."
        ;;
        
    reset)
        verificar_contenedor
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
            log_warning "Purgando la base de datos y recreando tablas vacías..."
            docker exec $DOCKER_EXEC_OPTS "$API_CONTAINER" npx prisma db push --force-reset
            
            log_info "Insertando registros institucionales y de configuración maestros (Seeder)..."
            docker exec $DOCKER_EXEC_OPTS "$API_CONTAINER" npx prisma db seed
            log_success "La base de datos ha sido restablecida e inicializada de forma impecable."
        else
            log_info "Operación cancelada por el usuario. La base de datos permanece intacta."
        fi
        ;;
        
    backup)
        # Buscar el script de respaldo localmente
        if [ -f "./backup-db.sh" ]; then
            ./backup-db.sh
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
