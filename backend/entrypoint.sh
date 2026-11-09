#!/bin/sh
set -e

echo "[Docker Backend] Aplicando migraciones pendientes en MySQL..."
npx prisma migrate deploy

# Si se define RUN_SEED=true en Railway, ejecuta el sembrado inicial de 6 equipos
if [ "${RUN_SEED:-false}" = "true" ]; then
  echo "[Docker Backend] RUN_SEED activo: Ejecutando sembrado inicial de datos..."
  npx prisma db seed || true
fi

echo "[Docker Backend] Iniciando servicio Express en puerto ${PORT:-4000}..."
exec node dist/server.js

