#!/bin/sh
set -e

# Esperar a que la base de datos esté lista (opcional, pero recomendado)
echo "Esperando a que la base de datos esté disponible..."

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
