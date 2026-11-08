#!/bin/sh
set -e

echo "[Docker Backend] Aplicando migraciones pendientes en MySQL..."
npx prisma migrate deploy

echo "[Docker Backend] Iniciando servicio Express en puerto ${PORT:-4000}..."
exec node dist/server.js

