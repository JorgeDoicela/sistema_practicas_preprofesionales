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

# Iniciar la aplicación
CMD ["npm", "start"]
