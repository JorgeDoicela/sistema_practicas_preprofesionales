#!/bin/bash
# Script para reiniciar todo el entorno, aplicar migraciones y levantar la app limpia
# Diseñado para ejecutarse directamente en la VPS

set -e

echo "[INFO] Deteniendo servicios y eliminando volumenes antiguos..."
docker-compose -f docker-compose.prod.yml down -v

echo "[INFO] Iniciando base de datos y aplicando migraciones..."
docker-compose -f docker-compose.prod.yml run --rm -v ~/sistema_practicas_preprofesionales/api-emitesis/prisma:/app/prisma api npx prisma migrate deploy

echo "[INFO] Levantando todos los servicios en segundo plano..."
docker-compose -f docker-compose.prod.yml up -d

echo "[INFO] Mostrando logs en tiempo real de la API (presiona Ctrl+C para salir)..."
docker-compose -f docker-compose.prod.yml logs -f api
