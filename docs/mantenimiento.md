# Protocolo de Mantenimiento y Operaciones

Este documento define las rutinas que se han establecido para garantizar la continuidad operativa, los respaldos de información y el monitoreo de salud del sistema EmiTesis.

## 1. Gestión de Respaldos (Backups)

Para proteger la integridad histórica de los datos, se ha definido un protocolo de copia de seguridad directa desde el contenedor de PostgreSQL.

### Exportar Base de Datos
Desde el servidor donde corre Docker:
```bash
# Generar un respaldo completo en formato SQL
docker exec -t db pg_dumpall -c -U user_emitesis > backup_emitesis_$(date +%Y%m%d).sql
```

### Importar / Restaurar Datos
En caso de desastre o migración de servidor:
```bash
# Restaurar la base de datos desde un archivo SQL
cat backup_emitesis.sql | docker exec -i db psql -U user_emitesis
```

## 2. Monitoreo de Servicios

### Revisión de Logs
Para diagnosticar problemas en tiempo real:
```bash
# Logs del Backend
docker-compose logs -f api

# Logs de la Base de Datos
docker-compose logs -f db
```

### Estado de Salud (Health)
El sistema utiliza healthchecks internos. Si un servicio aparece como "unhealthy" en `docker ps`, Docker intentará reiniciarlo automáticamente según las políticas del archivo `docker-compose.yml`.

## 3. Actualización del Sistema

Para aplicar cambios del repositorio en producción:
1.  Realizar `git pull origin main`.
2.  Re-construir las imágenes: `docker-compose up -d --build`.
3.  El sistema ejecutará automáticamente las nuevas migraciones de Prisma durante el arranque.

## 4. Limpieza de Recursos
Si el espacio en disco es crítico, se recomienda limpiar imágenes antiguas:
```bash
docker image prune -a
```
