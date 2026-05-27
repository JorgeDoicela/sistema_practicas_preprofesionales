#!/bin/bash
# Script de administración y control unificado para la base de datos de EmiTesis en producción
# Permite realizar operaciones individuales o un flujo completo con un único comando

set -e

CONTAINER_NAME="emitesis-db-prod"
API_CONTAINER="emitesis-api-prod"

mostrar_ayuda() {
    echo "====================================================================="
    echo "   EMITESIS CORE - GESTOR DE BASE DE DATOS DE PRODUCCIÓN"
    echo "====================================================================="
    echo "Uso: ./manage-db.sh [comando]"
    echo ""
    echo "Comandos disponibles:"
    echo "  migrate            : Sincroniza y ejecuta las migraciones pendientes sin borrar datos."
    echo "  seed               : Puebla la base de datos con los registros maestros e institucionales."
    echo "  reset              : Purga por completo la base de datos y la inicializa desde cero"
    echo "                       (ejecuta limpieza total, migraciones y datos de prueba en un paso)."
    echo "  reset --force      : Realiza el restablecimiento total omitiendo la confirmación de seguridad."
    echo "  backup             : Realiza una copia de seguridad comprimida e inmediata de la base de datos."
    echo "  help               : Muestra esta ayuda."
    echo "====================================================================="
}

# Verificar que los contenedores estén en ejecución
verificar_contenedor() {
    if ! docker ps --format '{{.Names}}' | grep -q "^$API_CONTAINER$"; then
        echo "[ERROR] El contenedor '$API_CONTAINER' no está en ejecución." >&2
        echo "Asegúrese de levantar los servicios con 'docker compose -f docker-compose.prod.yml up -d' primero." >&2
        exit 1
    fi
}

case "$1" in
    migrate)
        verificar_contenedor
        echo "[INFO] Iniciando sincronización de migraciones..."
        docker exec -it "$API_CONTAINER" npx prisma migrate deploy
        echo "[OK] Migraciones aplicadas con éxito."
        ;;
    seed)
        verificar_contenedor
        echo "[INFO] Poblando la base de datos con registros institucionales y de prueba..."
        docker exec -it "$API_CONTAINER" npx prisma db seed
        echo "[OK] Sembrado de base de datos finalizado."
        ;;
    reset)
        verificar_contenedor
        
        PROCEDER=false
        if [ "$2" = "--force" ]; then
            PROCEDER=true
        else
            echo "====================================================================="
            echo "   ADVERTENCIA: ESTA OPERACIÓN ELIMINARÁ TODOS LOS DATOS EXISTENTES"
            echo "====================================================================="
            read -p "¿Está seguro de que desea proceder con el restablecimiento total? (s/N): " confirmacion
            if [[ "$confirmacion" =~ ^[sS]$ ]]; then
                PROCEDER=true
            fi
        fi

        if [ "$PROCEDER" = true ]; then
            echo "[INFO] Purgando base de datos y restableciendo esquemas..."
            docker exec -it "$API_CONTAINER" npx prisma db push --force-reset
            echo "[INFO] Re-sembrando registros maestros y datos de prueba..."
            docker exec -it "$API_CONTAINER" npx prisma db seed
            echo "[OK] Restablecimiento e inicialización completada con éxito."
        else
            echo "[INFO] Operación cancelada."
        fi
        ;;
    backup)
        if [ -f "./backup-db.sh" ]; then
            ./backup-db.sh
        else
            echo "[ERROR] No se encontró el script 'backup-db.sh' en el directorio actual." >&2
            exit 1
        fi
        ;;
    help|*)
        mostrar_ayuda
        ;;
esac
