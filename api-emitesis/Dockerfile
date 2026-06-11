# =============================================================================
# Imagen Docker API — usada en GHCR y desplegada en AWS VPS
# =============================================================================
# Build: GitHub Actions (build-api) → ghcr.io/.../sistema_practicas_preprofesionales-api
#
# Arranque producción:
#   ENTRYPOINT → docker-entrypoint.sh (migrate deploy + seed opcional)
#   CMD        → node dist/main.js
#
# ⚠️  nest build genera dist/main.js (NO dist/src/main.js).
#     Si cambias la salida del compilador, actualiza también:
#       - package.json "start:prod"
#       - docker-compose.prod.yml command
# =============================================================================

FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl wget

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install --legacy-peer-deps

COPY . .

RUN npx prisma generate
RUN npm run build

FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl wget

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 5000

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
