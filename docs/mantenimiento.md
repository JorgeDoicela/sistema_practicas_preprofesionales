# Protocolo de Mantenimiento y Operaciones

Este documento define las rutinas establecidas para garantizar la continuidad operativa, los respaldos de información y el monitoreo de salud del sistema EmiTesis.

---

## 1. Gestión de Respaldos (Backups)

Para proteger la integridad histórica de los datos, el sistema cuenta con dos mecanismos: automatizado (recomendado) y manual.

### 1.1 Método Automatizado (Recomendado)
El sistema dispone de un script de respaldo avanzado con rotación automática de 30 días ubicado en `scripts/ops/backup-db.sh`. 

En producción (VPS), este script está programado mediante un Cron Job diario a las **03:00 AM** que guarda los archivos comprimidos `.sql.gz` en la ruta `~/emitesis/backups/`.

Para generar un respaldo de forma inmediata desde la VPS, ejecute:
```bash
~/emitesis/manage-db.sh backup
```
*(O ejecute `./scripts/ops/backup-db.sh` si se encuentra en el repositorio local).*

### 1.2 Método Manual Directo
Si requiere realizar un volcado directo del contenedor de PostgreSQL:
```bash
# Generar respaldo manual comprimido (.sql.gz)
docker exec -t emitesis-db-prod pg_dump -U postgres -d emitesis_db | gzip > backup_emitesis_$(date +%Y%m%d).sql.gz
```

### 1.3 Restauración de Datos
En caso de desastre o migración de servidor:
```bash
# Descomprimir y restaurar en el contenedor de base de datos de producción
gunzip -c backup_emitesis.sql.gz | docker exec -i emitesis-db-prod psql -U postgres -d emitesis_db
```

---

## 2. Monitoreo de Servicios

### 2.1 Revisión de Logs en Tiempo Real
Para diagnosticar problemas en los contenedores de producción:
```bash
# Logs del Backend NestJS
docker compose -f docker-compose.prod.yml logs -f api

# Logs de la Base de Datos PostgreSQL
docker compose -f docker-compose.prod.yml logs -f db

# Logs del Proxy Nginx
docker compose -f docker-compose.prod.yml logs -f nginx
```

### 2.2 Estado de Salud (Healthchecks)
El sistema utiliza healthchecks internos definidos en `docker-compose.prod.yml`. Puede verificar el estado de salud con:
```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```
Si el contenedor backend aparece como `(unhealthy)`, Docker Compose lo reiniciará automáticamente según la política de reinicios configurada.

---

## 3. Actualización de Producción (Despliegue Manual)

Si se requiere actualizar el sistema manualmente sin el pipeline de CI/CD:
1.  Obtenga los últimos cambios:
    ```bash
    git pull origin main
    ```
2.  Actualice y compile los contenedores:
    ```bash
    docker compose -f docker-compose.prod.yml up -d --build
    ```
3.  El contenedor de API ejecutará de forma automática las migraciones pendientes de Prisma durante el arranque.

---

## 4. Limpieza de Recursos y Optimización de Disco

Para evitar problemas de almacenamiento en la VPS debido a imágenes obsoletas generadas por despliegues continuos, ejecute:
```bash
# Eliminar contenedores, redes e imágenes sin usar
docker system prune -f
```
