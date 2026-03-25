#!/bin/sh
set -e

# Esperar a que la base de datos esté lista (opcional, pero recomendado)
echo "Esperando a que la base de datos esté disponible..."

# Ejecutar migraciones de Prisma
echo "Ejecutando npx prisma migrate deploy..."
npx prisma migrate deploy

# Ejecutar semillas de Prisma (seeds)
echo "Ejecutando npx prisma db seed..."
npx prisma db seed

# Iniciar la aplicación
echo "Iniciando la aplicación..."
exec "$@"
