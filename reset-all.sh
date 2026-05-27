#!/bin/bash
# Script para reiniciar todo el entorno, aplicar migraciones y levantar la app limpia
# Diseñado para ejecutarse directamente en la VPS

set -e

echo "[INFO] Deteniendo servicios y eliminando volumenes antiguos..."
docker compose down -v

echo "[INFO] Compilando imagenes Docker desde el codigo fuente local..."
docker compose build

echo "[INFO] Iniciando base de datos y aplicando migraciones..."
docker compose run --rm api npx prisma migrate deploy

echo "[INFO] Levantando todos los servicios en segundo plano..."
docker compose up -d

echo "[INFO] Mostrando logs en tiempo real de la API (presiona Ctrl+C para salir)..."
docker compose logs -f api