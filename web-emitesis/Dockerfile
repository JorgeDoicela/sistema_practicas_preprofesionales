# Etapa de construcción
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el resto del código
COPY . .

# Desactivar telemetría de Next.js durante la construcción
ENV NEXT_TELEMETRY_DISABLED=1

# URLs públicas inyectadas en el cliente (deben pasarse como build-args desde docker-compose / CI).
ARG NEXT_PUBLIC_API_URL=http://127.0.0.1:5000/api
ARG NEXT_PUBLIC_RECAPTCHA_SITE_KEY=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_RECAPTCHA_SITE_KEY=$NEXT_PUBLIC_RECAPTCHA_SITE_KEY

# Construir la aplicación Next.js
RUN npm run build

# Etapa de producción
FROM node:20-alpine

WORKDIR /app

# Copiar archivos necesarios desde la etapa de construcción
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./

# Exponer el puerto de Next.js
EXPOSE 3005

# Desactivar telemetría en ejecución
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3005

# Escuchar en todas las interfaces (necesario dentro de Docker)
CMD ["sh", "-c", "exec npx next start --hostname 0.0.0.0 -p ${PORT:-3005}"]
