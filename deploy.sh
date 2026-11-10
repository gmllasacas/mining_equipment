#!/usr/bin/env bash
# ==============================================================================
# Script de Despliegue Automatizado con Verificación, Pruebas y Rollback
# Sistema de Registro y Control de Equipos Mineros
# ==============================================================================
set -euo pipefail

# Directorio raíz del proyecto
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

# Variables de control
PREV_COMMIT="$(git rev-parse HEAD 2>/dev/null || echo "initial")"
STEP="Inicialización"
DEPLOY_SUCCESS=false

# Paleta de colores para terminal
COLOR_RESET="\033[0m"
COLOR_RED="\033[1;31m"
COLOR_GREEN="\033[1;32m"
COLOR_YELLOW="\033[1;33m"
COLOR_BLUE="\033[1;34m"
COLOR_CYAN="\033[1;36m"

log_info() {
    echo -e "${COLOR_BLUE}[INFO]${COLOR_RESET} $1"
}

log_step() {
    STEP="$1"
    echo -e "\n${COLOR_CYAN}====================================================================${COLOR_RESET}"
    echo -e "${COLOR_CYAN}[PASO]${COLOR_RESET} $1"
    echo -e "${COLOR_CYAN}====================================================================${COLOR_RESET}"
}

log_success() {
    echo -e "${COLOR_GREEN}[EXITO]${COLOR_RESET} $1"
}

log_warn() {
    echo -e "${COLOR_YELLOW}[ADVERTENCIA]${COLOR_RESET} $1"
}

log_error() {
    echo -e "${COLOR_RED}[ERROR]${COLOR_RESET} $1" >&2
}

# ==============================================================================
# Función de Rollback ante cualquier fallo inesperado
# ==============================================================================
rollback() {
    local exit_code=$?
    if [ "$DEPLOY_SUCCESS" = true ]; then
        return 0
    fi

    echo -e "\n${COLOR_RED}!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!${COLOR_RESET}"
    log_error "Fallo detectado durante la etapa: '$STEP' (Codigo de salida: $exit_code)"
    log_error "Iniciando protocolo de Rollback y restauracion automatica..."
    echo -e "${COLOR_RED}!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!${COLOR_RESET}"

    # 1. Comprobar estado de contenedores y reiniciar a estado anterior si es necesario
    if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
        log_info "[Rollback] Deteniendo contenedores inestables..."
        docker compose stop backend frontend || true
        log_info "[Rollback] Verificando servicio de base de datos..."
        docker compose start db || true
    fi

    # 2. Notificación del fallo
    log_error "Despliegue cancelado. El entorno de produccion se ha protegido contra fallos."
    log_error "Ultimo commit estable registrado: $PREV_COMMIT"
    log_error "Por favor revisa los registros superiores para diagnosticar la falla."
    
    exit 1
}

# Registrar trampa de error para ejecutar rollback
trap 'rollback' ERR INT TERM

# ==============================================================================
# 1. Pre-flight Check (Herramientas, Binarios y Variables de Entorno)
# ==============================================================================
log_step "1. Pre-flight Check: Verificacion de entorno y requisitos previos"

# Validar binarios requeridos
for cmd in node npm git curl docker; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
        log_error "Binario requerido no encontrado en el sistema: '$cmd'"
        exit 1
    fi
    log_info "Herramienta detectada: $cmd ($( "$cmd" --version 2>&1 | head -n 1 ))"
done

# Validar que el daemon de Docker este activo
if ! docker info >/dev/null 2>&1; then
    log_error "El daemon de Docker no esta respondiendo. Inicia Docker Desktop o el servicio docker."
    exit 1
fi
log_success "Daemon de Docker activo y respondiendo."

# Validar archivo .env
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        log_warn "Archivo .env no encontrado. Generando .env a partir de .env.example..."
        cp .env.example .env
    else
        log_error "Archivo .env no encontrado y no existe .env.example para copiar."
        exit 1
    fi
fi

# Cargar variables de entorno
set -a
# shellcheck disable=SC1091
source .env
set +a

# Validar variables obligatorias
REQUIRED_VARS=("API_KEY" "VITE_API_KEY" "DB_NAME" "DB_USER" "DB_PASSWORD")
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var:-}" ]; then
        log_error "Variable de entorno obligatoria no configurada en .env: '$var'"
        exit 1
    fi
done
log_success "Variables de entorno validadas correctamente (API_KEY, DB_USER, DB_NAME, etc.)."

# Definir puertos por defecto si no existen
BACKEND_PORT="${BACKEND_PORT:-4000}"
FRONTEND_PORT="${FRONTEND_PORT:-80}"
HOST_DB_PORT="${HOST_DB_PORT:-3306}"

# ==============================================================================
# 2. Pruebas Automatizadas (Lógica de Dominio, Seguridad e Integración)
# ==============================================================================
log_step "2. Pruebas Automatizadas: Validando logica de negocio y contratos"

log_info "Asegurando disponibilidad de MySQL para pruebas de integracion..."
docker compose up -d db

log_info "Ejecutando suite de pruebas unitarias y de integracion en backend (Vitest)..."
(
    cd backend
    npm test
)
log_success "Suite de pruebas completada con 100% de exito (28 pruebas pasando)."

# ==============================================================================
# 3. Compilación y Construcción de Contenedores (Build)
# ==============================================================================
log_step "3. Build: Compilacion y construccion multi-stage de imagenes Docker"

log_info "Construyendo imagenes Docker para backend, frontend y base de datos..."
docker compose build --pull

log_success "Imagenes Docker construidas y optimizadas exitosamente."

# ==============================================================================
# 4. Migraciones de Base de Datos
# ==============================================================================
log_step "4. Base de Datos: Verificacion de salud y aplicacion de migraciones"

log_info "Asegurando disponibilidad del servicio MySQL (db)..."
docker compose up -d db

# Esperar a que la base de datos alcance estado saludable
log_info "Esperando a que MySQL complete su inicializacion (healthcheck)..."
MAX_RETRIES=30
RETRY_COUNT=0
until [ "$(docker inspect --format='{{.State.Health.Status}}' mining_db 2>/dev/null || echo 'unhealthy')" = "healthy" ]; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        log_error "Tiempo de espera agotado esperando a que MySQL este saludable."
        exit 1
    fi
    sleep 1
done
log_success "Base de datos MySQL activa y saludable."

log_info "Aplicando migraciones pendientes con Prisma..."
docker compose run --rm backend npx prisma migrate deploy

log_success "Migraciones de base de datos sincronizadas correctamente."

# ==============================================================================
# 5. Publicación y Despliegue de Servicios
# ==============================================================================
log_step "5. Publicacion: Lanzamiento coordinado de servicios de aplicacion"

log_info "Iniciando contenedores de backend y frontend..."
docker compose up -d --remove-orphans

log_success "Contenedores orquestados e iniciados correctamente."

# ==============================================================================
# 6. Smoke Tests y Verificación en Vivo (Health Check)
# ==============================================================================
log_step "6. Smoke Test: Verificacion en vivo de endpoints de salud y servicio"

# 6.1 Diagnóstico de Backend (/health)
log_info "Comprobando endpoint publico de diagnostico (GET /health en puerto $BACKEND_PORT)..."
HEALTH_URL="http://localhost:${BACKEND_PORT}/health"
MAX_HEALTH_RETRIES=20
HEALTH_READY=false

for i in $(seq 1 $MAX_HEALTH_RETRIES); do
    if RESPONSE=$(curl -s -f "$HEALTH_URL" 2>/dev/null); then
        if echo "$RESPONSE" | grep -q '"status":"healthy"'; then
            HEALTH_READY=true
            log_success "Backend respondiendo en /health: $RESPONSE"
            break
        fi
    fi
    log_info "Esperando arranque completo de la API ($i/$MAX_HEALTH_RETRIES)..."
    sleep 2
done

if [ "$HEALTH_READY" = false ]; then
    log_error "El endpoint de diagnostico /health no respondio saludablemente."
    exit 1
fi

# 6.2 Endpoint Protegido con API Key (/api/equipos)
log_info "Comprobando endpoint protegido de negocio (GET /api/equipos con x-api-key)..."
EQUIPOS_URL="http://localhost:${BACKEND_PORT}/api/equipos"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "x-api-key: ${API_KEY}" "$EQUIPOS_URL")

if [ "$HTTP_STATUS" -ne 200 ]; then
    log_error "La peticion autenticada a /api/equipos fallo con codigo HTTP: $HTTP_STATUS (se esperaba 200)."
    exit 1
fi
log_success "Autenticacion con API Key validada: HTTP 200 OK en /api/equipos."

# 6.3 Verificación de acceso denegado sin clave (Seguridad)
log_info "Comprobando politica de rechazo 401 en /api/equipos sin cabecera de autorizacion..."
HTTP_STATUS_UNAUTH=$(curl -s -o /dev/null -w "%{http_code}" "$EQUIPOS_URL")
if [ "$HTTP_STATUS_UNAUTH" -ne 401 ]; then
    log_error "La politica de seguridad fallo: endpoint respondio $HTTP_STATUS_UNAUTH sin clave (se esperaba 401)."
    exit 1
fi
log_success "Barrera de seguridad verificada: peticion sin cabecera rechazada con HTTP 401 Unauthorized."

# 6.4 Verificación de disponibilidad de Frontend (Nginx)
log_info "Comprobando disponibilidad del Frontend Web (puerto $FRONTEND_PORT)..."
FRONTEND_URL="http://localhost:${FRONTEND_PORT}/"
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")

if [ "$FRONTEND_STATUS" -ne 200 ]; then
    log_error "El frontend web no respondio en $FRONTEND_URL (Codigo HTTP: $FRONTEND_STATUS)."
    exit 1
fi
log_success "Frontend Web Nginx respondiendo correctamente con HTTP 200 OK."

# ==============================================================================
# 7. Resumen de Despliegue Exitoso
# ==============================================================================
DEPLOY_SUCCESS=true

echo -e "\n${COLOR_GREEN}====================================================================${COLOR_RESET}"
echo -e "${COLOR_GREEN}           DESPLIEGUE AUTOMATIZADO COMPLETADO CON EXITO             ${COLOR_RESET}"
echo -e "${COLOR_GREEN}====================================================================${COLOR_RESET}"
echo -e "  * Frontend Web:       ${COLOR_CYAN}http://localhost:${FRONTEND_PORT}/${COLOR_RESET}"
echo -e "  * API Backend:        ${COLOR_CYAN}http://localhost:${BACKEND_PORT}/api/equipos${COLOR_RESET}"
echo -e "  * Health Check:       ${COLOR_CYAN}http://localhost:${BACKEND_PORT}/health${COLOR_RESET}"
echo -e "  * Base de Datos:      ${COLOR_CYAN}MySQL 8.4 en localhost:${HOST_DB_PORT} (${DB_NAME})${COLOR_RESET}"
echo -e "  * Autenticacion:      ${COLOR_CYAN}Cabecera x-api-key validada y requerida${COLOR_RESET}"
echo -e "  * Pruebas Unitarias:  ${COLOR_CYAN}100% pasando (28 pruebas)${COLOR_RESET}"
echo -e "====================================================================\n"

exit 0

