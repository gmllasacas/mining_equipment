# ==========================================
# Etapa 1: Builder (Compilación SPA con Vite)
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Argumentos de construcción para inyección estática en Vite
ARG VITE_API_URL
ARG VITE_API_KEY

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_API_KEY=$VITE_API_KEY

# Copiar manifiestos e instalar dependencias
COPY package*.json ./
RUN npm ci

# Copiar código fuente y compilar bundle de producción
COPY . .
RUN npm run build

# ==========================================
# Etapa 2: Runner (Nginx Web Server ligero)
# ==========================================
FROM nginx:1.27-alpine AS runner

# Instalar curl para soportar healthcheck nativo
RUN apk add --no-cache curl

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar artefactos compilados desde builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Healthcheck de disponibilidad web
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

