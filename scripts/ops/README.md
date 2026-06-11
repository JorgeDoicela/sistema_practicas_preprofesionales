# Operaciones — Praxis Hub / EmiTesis

Guía rápida para despliegue y base de datos. **Lee esto antes de tocar producción.**

---

## Dos entornos de base de datos (no mezclar)

| Entorno | Dónde | Archivo de conexión |
|---------|--------|---------------------|
| **Desarrollo local** (`npm run dev`) | Neon (cloud) | `api-emitesis/.env` |
| **Producción AWS** (Lightsail VPS) | Postgres en Docker (`db`) | `~/emitesis/.env` (generado por CI) |

Los datos de Neon **no** se copian solos a AWS. Cada uno tiene su propia BD.

---

## Despliegue normal (recomendado)

1. Haz `git push origin main`
2. GitHub Actions: build → push imágenes GHCR → deploy SSH a la VPS
3. El deploy ejecuta `ensure-migrations.sh` antes de reiniciar API/web

No hace falta SSH salvo emergencia.

---

## Scripts en la VPS (`~/emitesis`)

Tras cada deploy, GitHub copia estos archivos a `~/emitesis/`:

```bash
cd ~/emitesis
./manage-db.sh help
```

| Comando | Cuándo usarlo |
|---------|----------------|
| `./manage-db.sh migrate` | Solo aplicar migraciones nuevas (sin borrar datos) |
| `./manage-db.sh seed` | Recargar datos demo (el seed purga tablas al inicio) |
| `./manage-db.sh reset --force` | **Borrar todo** y volver a sembrar (destructivo) |
| `./manage-db.sh repair` | Error **P3005** (tablas sin `_prisma_migrations`) |
| `./ensure-migrations.sh` | Lo mismo que hace el CI antes del deploy |
| `./backup-db.sh` | Respaldo manual antes de un reset |

### Ver estado

```bash
docker ps
docker logs emitesis-api-prod --tail 50
docker inspect emitesis-api-prod --format '{{.State.Health.Status}}'
```

---

## Errores frecuentes y solución

### P3005 — "database schema is not empty"

**Causa:** Se usó `prisma db push --force-reset` en lugar de `migrate reset`. Quedan tablas pero sin historial de migraciones.

**Solución:** `./manage-db.sh repair` o `./manage-db.sh reset --force`

**No usar** `db push` en producción.

---

### API en bucle / `unhealthy`

1. Ver logs: `docker logs emitesis-api-prod --tail 50`
2. Si dice `Cannot find module dist/src/main.js` → la ruta correcta es **`dist/main.js`** (ver `docker-compose.prod.yml` y `Dockerfile`)
3. Si el healthcheck falla → debe usar **Node**, no `wget` (Alpine no trae wget por defecto)

```bash
docker-compose -f docker-compose.prod.yml up -d --force-recreate api web nginx
```

---

### `Container is restarting` al ejecutar `manage-db.sh`

La API está caída. Los scripts usan `docker compose run` como respaldo; si falla:

```bash
docker stop emitesis-api-prod
./manage-db.sh repair
```

---

### Login: email con `ñ` no valida en el navegador

Los emails del seed deben ser **ASCII** (ej. `cristhofer.parreno@adm.istpet.edu.ec`).  
Contraseña demo: `password123`

---

## Modelo de dominio (prácticas)

- **Estudiante** y **tutor académico** no llevan `companyId` en `User`
- El vínculo con la empresa es por **práctica** (`Internship`: `studentId` + `tutorId` + `companyId`)
- Solo usuarios **EMPRESA** tienen `User.companyId`

---

## Recrear todo desde cero en AWS (nuclear)

```bash
cd ~/emitesis
./backup-db.sh                    # opcional
docker-compose -f docker-compose.prod.yml down -v   # borra volúmenes DB + uploads
docker-compose -f docker-compose.prod.yml pull api web
./ensure-migrations.sh            # migrate + seed
docker-compose -f docker-compose.prod.yml up -d
```

---

## Desarrollo local con Neon

```bash
cd api-emitesis
npx prisma migrate deploy
npx prisma db seed
```

Reset completo en Neon: `npx prisma migrate reset --force`
