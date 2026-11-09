# ==========================================
# Etapa 1: Builder (Compilación y generación Prisma)
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Instalar dependencias del sistema requeridas por Prisma
RUN apk add --no-cache openssl

# Copiar manifiestos de dependencias
COPY package*.json ./
COPY tsconfig*.json ./
COPY prisma ./prisma/

# Instalar todas las dependencias (incluye devDependencies)
RUN npm ci

# Generar cliente de Prisma para Linux Musl y compilar TypeScript
RUN npx prisma generate
COPY src ./src/
RUN npm run build

# ==========================================
# Etapa 2: Runner (Producción ligera)
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV PATH="/app/node_modules/.bin:$PATH"

# Instalar utilidades esenciales de ejecución y healthcheck
RUN apk add --no-cache openssl curl dumb-init

# Crear usuario y grupo no privilegiado por seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Copiar manifiestos e instalar sólo dependencias de producción
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev && npm cache clean --force

# Copiar cliente de Prisma generado y código compilado desde builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/dist ./dist

# Copiar script de arranque con permisos de ejecución
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 4000

# Healthcheck nativo contra el endpoint de diagnóstico (soporta PORT dinámico de Railway)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:${PORT:-4000}/health || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["./entrypoint.sh"]

