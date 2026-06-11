#!/bin/bash
# =====================================================================
#   EMITESIS CORE - ASEGURAR MIGRACIONES EN PRODUCCIÓN
# =====================================================================
# Ejecuta prisma migrate deploy ANTES de reiniciar la API en deploy.
# Lo invoca GitHub Actions (ci.yml) y puede correrse a mano en ~/emitesis.
#
# ¿Por qué existe?
# - Web depende de api healthy; si migrate deploy falla, api reinicia en bucle.
# - Error P3005: tablas sin tabla _prisma_migrations (p. ej. tras db push).
#   → Repara: DROP SCHEMA + migrate deploy + seed.
#
# Ubicación en VPS: ~/emitesis/ensure-migrations.sh (copiado por CI).
# PROJECT_ROOT: si el script está junto a docker-compose.prod.yml, usa ese dir.
#
# Ver también: scripts/ops/README.md y ./manage-db.sh repair

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[!]${NC} $1"; }
log_ok() { echo -e "${GREEN}[✔]${NC} $1"; }
log_err() { echo -e "${RED}[✘]${NC} $1"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/docker-compose.prod.yml" ] || [ -f "$SCRIPT_DIR/docker-compose.yml" ]; then
    PROJECT_ROOT="$SCRIPT_DIR"
else
    PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
fi
cd "$PROJECT_ROOT"

COMPOSE_FILE="docker-compose.prod.yml"
if [ ! -f "$COMPOSE_FILE" ]; then
    COMPOSE_FILE="docker-compose.yml"
fi

if docker compose version >/dev/null 2>&1; then
    COMPOSE=(docker compose -f "$COMPOSE_FILE")
elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE=(docker-compose -f "$COMPOSE_FILE")
else
    log_err "No se encontró docker compose ni docker-compose."
    exit 1
fi
DB_CONTAINER="emitesis-db-prod"
API_CONTAINER="emitesis-api-prod"

log_info "Asegurando que PostgreSQL esté activo..."
"${COMPOSE[@]}" up -d db

for _ in $(seq 1 30); do
    if docker exec "$DB_CONTAINER" pg_isready -U postgres -d emitesis_db >/dev/null 2>&1; then
        break
    fi
    sleep 2
done

docker stop "$API_CONTAINER" 2>/dev/null || true

log_info "Ejecutando prisma migrate deploy (contenedor temporal)..."
set +e
DEPLOY_OUTPUT="$("${COMPOSE[@]}" run --rm --no-deps -e SKIP_PRISMA_SEED=true api npx prisma migrate deploy 2>&1)"
DEPLOY_STATUS=$?
set -e

if [ "$DEPLOY_STATUS" -eq 0 ]; then
    log_ok "Migraciones aplicadas correctamente."
    exit 0
fi

echo "$DEPLOY_OUTPUT"

if echo "$DEPLOY_OUTPUT" | grep -q "P3005"; then
    log_warn "Detectado P3005: schema sin historial de migraciones. Reparando..."

    docker exec -i "$DB_CONTAINER" psql -U postgres -d emitesis_db -v ON_ERROR_STOP=1 -c \
        "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO public;"

    "${COMPOSE[@]}" run --rm --no-deps -e SKIP_PRISMA_SEED=true api npx prisma migrate deploy

    log_info "Cargando seed institucional tras reparación..."
    "${COMPOSE[@]}" run --rm --no-deps -e SKIP_PRISMA_SEED=true api npx prisma db seed

    log_ok "Base de datos reparada y sembrada."
    exit 0
fi

log_err "migrate deploy falló por un motivo distinto a P3005."
exit 1
