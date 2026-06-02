#!/bin/sh
# =====================================================================
#   EMITESIS CORE - ENTRYPOINT DOCKER DE LA API
# =====================================================================
# Script ejecutado al arrancar el contenedor. Realiza una espera activa
# de la base de datos, ejecuta las migraciones pendientes y semillas,
# y finalmente arranca el servidor NestJS en producción.

set -e

# Esperar a que la base de datos esté lista usando un script de Node.js puro de alta precisión
echo "Esperando a que la base de datos esté disponible..."
node -e "
const net = require('net');
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.log('[Entrypoint] DATABASE_URL no definida. Saltando verificación.');
  process.exit(0);
}
// Reemplazar el protocolo para permitir parseo correcto de forma robusta
let host = 'db';
let port = 5432;
try {
  const urlWithoutProtocol = dbUrl.split('://')[1] || dbUrl;
  const authorityAndPath = urlWithoutProtocol.split('/')[0];
  const parts = authorityAndPath.split('@');
  const hostPort = parts[parts.length - 1]; // El último elemento siempre es host:port o host
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

# Ejecutar migraciones de Prisma
echo "Ejecutando npx prisma migrate deploy..."
npx prisma migrate deploy

# Semillas demo (destructivo: borra y recrea datos). Automático salvo SKIP_PRISMA_SEED=true.
if [ "$SKIP_PRISMA_SEED" = "true" ]; then
  echo "SKIP_PRISMA_SEED=true: se omite prisma db seed."
else
  echo "Ejecutando npx prisma db seed (datos de prueba)..."
  npx prisma db seed
fi

# Iniciar la aplicación
echo "Iniciando la aplicación..."
exec "$@"
