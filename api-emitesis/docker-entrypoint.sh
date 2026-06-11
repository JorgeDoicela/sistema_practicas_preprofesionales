#!/bin/sh
# =====================================================================
#   EMITESIS CORE - ENTRYPOINT DOCKER DE LA API (PRODUCCIÓN)
# =====================================================================
# Orden al arrancar el contenedor api:
#   1. Esperar Postgres (host "db" en Docker Compose prod)
#   2. prisma migrate deploy  → aplica migraciones pendientes
#   3. prisma db seed         → SOLO si SKIP_PRISMA_SEED != true
#   4. exec del CMD           → por defecto: node dist/main.js
#
# NOTAS:
# - Usar migrate deploy / migrate reset, NUNCA db push en producción (causa P3005).
# - En AWS, SKIP_PRISMA_SEED=true por defecto; seed con manage-db.sh o ensure-migrations.
# - Si migrate deploy falla con P3005, ejecutar en VPS: ./manage-db.sh repair
# - La app arranca en dist/main.js (ver Dockerfile CMD y docker-compose.prod.yml)
# =====================================================================

set -e

echo "Esperando a que la base de datos esté disponible..."
node -e "
const net = require('net');
let dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.log('[Entrypoint] DATABASE_URL no definida. Saltando verificación.');
  process.exit(0);
}
dbUrl = dbUrl.replace(/[\"\']/g, '').trim();
let host = 'db';
let port = 5432;
try {
  const urlWithoutProtocol = dbUrl.split('://')[1] || dbUrl;
  const authorityAndPath = urlWithoutProtocol.split('/')[0];
  const parts = authorityAndPath.split('@');
  const hostPort = parts[parts.length - 1];
  const hostPortParts = hostPort.split(':');
  host = hostPortParts[0] || 'db';
  const parsedPort = parseInt(hostPortParts[1], 10);
  port = isNaN(parsedPort) ? 5432 : parsedPort;
} catch (e) {
  console.log('[Entrypoint] Error al parsear DATABASE_URL. Usando valores por defecto (db:5432).');
}
console.log('[Entrypoint] Intentando conectar a la base de datos en ' + host + ':' + port + '...');

const check = () => {
  const socket = net.createConnection(port, host);
  socket.setTimeout(2000);
  socket.on('connect', () => {
    console.log('[Entrypoint] ✔ ¡Base de datos detectada y disponible!');
    socket.end();
    process.exit(0);
  });
  socket.on('error', () => {
    setTimeout(check, 1500);
  });
  socket.on('timeout', () => {
    socket.destroy();
    setTimeout(check, 1500);
  });
};
check();
"

echo "Ejecutando npx prisma migrate deploy..."
npx prisma migrate deploy

if [ "$SKIP_PRISMA_SEED" = "true" ]; then
  echo "SKIP_PRISMA_SEED=true: se omite prisma db seed."
else
  echo "Ejecutando npx prisma db seed (datos de prueba)..."
  npx prisma db seed
fi

echo "Iniciando la aplicación..."
exec "$@"
