# Protocolo de Mantenimiento y Operaciones (Praxis Hub)

Este documento define las rutinas de administración del servidor, monitoreo continuo de la infraestructura y mantenimiento correctivo/preventivo sobre el ecosistema **Praxis Hub** en entornos de producción.

---

## 1. Gestión de Respaldos (Backups)

Para garantizar la inalterabilidad histórica de las bitácoras y la documentalidad legal de las prácticas frente a fallos fortuitos de hardware, se han establecido dos flujos:

### 1.1 Método Automatizado (Recomendado)
El sistema dispone de un script de respaldo avanzado con rotación automática de 30 días ubicado en `scripts/ops/backup-db.sh`. 

En la VPS de producción, este script está programado mediante un Cron Job diario a las **03:00 AM** que guarda los archivos comprimidos `.sql.gz` en la ruta `~/emitesis/backups/`.

Para generar un respaldo de forma inmediata desde la VPS, conéctese por SSH y ejecute:
```bash
~/emitesis/manage-db.sh backup
```
*(O ejecute `./scripts/ops/backup-db.sh` si se encuentra en un entorno de desarrollo local).*

### 1.2 Método Manual Directo
Si requiere realizar un volcado de base de datos directamente sobre el contenedor Docker sin pasar por scripts gestores:
```bash
# Generar volcado comprimido con marca de tiempo
docker exec -t emitesis-db-prod pg_dump -U postgres -d emitesis_db | gzip > backup_emitesis_$(date +%Y%m%d_%H%M%S).sql.gz
```

### 1.3 Restauración de Datos
En caso de desastre físico del servidor o migración a un nuevo proveedor cloud:
1.  Transfiera el archivo de backup comprimido al servidor.
2.  Ejecute la restauración introduciendo el flujo de datos al contenedor de base de datos de producción:
    ```bash
    gunzip -c backup_emitesis_xxxx.sql.gz | docker exec -i emitesis-db-prod psql -U postgres -d emitesis_db
    ```

---

## 2. Monitoreo de Servicios y Logs

### 2.1 Revisión de Logs en Tiempo Real
Para diagnosticar fallos en la API, problemas de indexación o errores del proxy inverso Nginx en la VPS:
```bash
# Logs detallados de la API NestJS
docker compose -f docker-compose.prod.yml logs -f api

# Logs transaccionales de la base de datos PostgreSQL
docker compose -f docker-compose.prod.yml logs -f db

# Logs de peticiones HTTP en el proxy Nginx
docker compose -f docker-compose.prod.yml logs -f nginx
```

### 2.2 Estado de Salud (Healthchecks)
El contenedor de la API NestJS cuenta con un Healthcheck interno declarado en `docker-compose.prod.yml` que consulta periódicamente `/api/health`. Puede revisar el estado de salud de todos los contenedores mediante:
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```
Si el estado del contenedor de la API reporta `(unhealthy)`, Docker Compose lo reiniciará automáticamente según las políticas de tolerancia configuradas.

---

## 3. Limpieza de Recursos y Optimización de Disco

Los despliegues continuos (CI/CD) descargan imágenes nuevas de Docker de manera repetitiva, lo que puede saturar el almacenamiento de la VPS. Para liberar espacio de forma segura sin interrumpir los contenedores en ejecución, ejecute periódicamente:
```bash
# Elimina imágenes sin etiqueta (dangling images), contenedores parados y redes huérfanas
docker system prune -f

# Limpieza profunda de volúmenes no referenciados (Precaución: no borra la base de datos activa)
docker system prune -a --volumes -f
```
