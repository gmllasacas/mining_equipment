# Registro de Equipos Mineros

Sistema integral para el control de horas de uso (horómetro), seguimiento de ciclos de mantenimiento preventivo y registro histórico de intervenciones en maquinaria minera.

El proyecto está diseñado bajo una arquitectura desacoplada (Frontend y Backend independientes), con despliegue automatizado en un solo comando (`./deploy.sh`) y optimización de costos mediante infraestructura híbrida.

---

## Qué hace la aplicación

* **Gestión de Equipos (CRUD):** Registro, edición, detalle y eliminación de maquinaria: camiones, excavadoras y perforadoras. Cada equipo cuenta con un código único y una lectura de horómetro acumulado.
* **Cálculo de Mantenimiento Preventivo:** Monitorea las horas de operación transcurridas desde el último servicio según el tipo de equipo:
  * **Camión:** intervalo de 500 horas.
  * **Excavadora:** intervalo de 250 horas.
  * **Perforadora:** intervalo de 300 horas.
  * Si $\text{horómetro actual} - \text{horómetro último mantenimiento} \ge \text{intervalo}$, la aplicación reporta visual y lógicamente el estado **"Requiere mantenimiento"**.
* **Historial y Reinicio de Ciclo:** Permite registrar cada intervención técnica (fecha, técnico, descripción y lectura de horómetro). En una transacción atómica, se guarda el historial y se actualiza la base del horómetro, reiniciando el ciclo operativo del equipo.
* **Diagnóstico del Sistema:** Endpoint dedicado `GET /health` que verifica la disponibilidad del proceso y la conectividad activa con la base de datos relacional.

---

## Arquitectura y Stack Tecnológico

| Capa | Tecnología | Plataforma de Publicación |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite, TypeScript, Tailwind CSS | **Railway / Docker Nginx** (Servicio web independiente con URL pública propia) |
| **Backend** | Node.js (v24+), Express, TypeScript, Prisma ORM | **Railway / VPS** (Servicio Node.js con URL pública independiente) |
| **Base de Datos** | MySQL 8.4 (Transacciones ACID) | **Railway MySQL** (Servicio gestionado en red privada) |
| **Pruebas** | Vitest | Pruebas unitarias de dominio puras (en memoria, sin dependencias de BD) |
| **CI / CD** | GitHub Actions | Validación automática en cada push |

El contrato formal de datos, API REST y límites del sistema se encuentra detallado en [`CONTRACT.md`](./CONTRACT.md), y la hoja de ruta de desarrollo en [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md).

---

## Cómo levantarlo en local

### Prerrequisitos
* Node.js v24+ y npm.
* MySQL 8.4 corriendo localmente (por ejemplo mediante Laragon o servicio local).
* Git y cURL.

### 1. Clonar y configurar variables de entorno

```bash
git clone <url-del-repositorio>
cd fullstack_vps
```

Crear los archivos de entorno a partir de los ejemplos:

**Backend (`backend/.env`):**
```env
PORT=4000
NODE_ENV=development
DATABASE_URL="mysql://root:@localhost:3306/equipos_mineros"
CORS_ORIGIN="http://localhost:5173"
API_KEY="mining_secret_key_2026"
```

**Frontend (`frontend/.env`):**
```env
VITE_API_URL="http://localhost:4000"
VITE_API_KEY="mining_secret_key_2026"
```

### 2. Base de datos y dependencias del Backend

```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run db:seed    # Opcional: Carga datos de prueba (6 equipos en distintos estados)
npm run dev
```
El backend estará disponible en `http://localhost:4000` y el health check en `http://localhost:4000/health`.

### 3. Levantar el Frontend

En otra terminal:
```bash
cd frontend
npm install
npm run dev
```
La aplicación web estará accesible en `http://localhost:5173`.

### 4. Opción alternativa con Docker Compose

Si cuentas con Docker instalado, puedes levantar la base de datos, backend y frontend en un solo paso:
```bash
docker compose up -d --build
```

### 5. Ejecutar Pruebas Automatizadas

Las pruebas unitarias validan la lógica de negocio del horómetro y las reglas de mantenimiento de forma pura en memoria (ejecución en menos de 50ms, sin requerir servidor MySQL activo):

```bash
cd backend
npm test
```

La conectividad con la base de datos real se valida automáticamente durante el despliegue con el Smoke Test de `GET /health`.

---

## Cómo desplegarlo (Automatización)

### Despliegue con un Solo Comando (`./deploy.sh` o `make deploy`)

El despliegue automatizado completo se realiza desde la raíz del proyecto con un único comando:

```bash
./deploy.sh
# o alternativamente:
make deploy
```

#### Fases ejecutadas por `./deploy.sh`:
1. **Pre-flight Check:** Valida la presencia de herramientas requeridas (`node`, `npm`, `git`, `curl`, `docker`), la disponibilidad del motor Docker y las variables en los archivos `.env`.
2. **Pruebas Automatizadas:** Ejecuta la suite de pruebas unitarias, de seguridad y de integración (`npm test` con Vitest). Si falla cualquier prueba, cancela el despliegue.
3. **Build:** Construye y optimiza las imágenes Docker multi-stage para backend (Node 22 Alpine) y frontend (Nginx 1.27 Alpine) con inyección de variables.
4. **Migraciones de Base de Datos:** Espera a que MySQL 8.4 alcance estado saludable (`healthy`) y aplica `prisma migrate deploy` de forma idempotente.
5. **Publicación y Orquestación:** Inicia los contenedores con Docker Compose coordinando sus dependencias y reinicios.
6. **Smoke Test y Health Check:**
   * Verifica `GET /health` en el backend esperando HTTP 200 y `"status": "healthy"`.
   * Verifica `GET /api/equipos` con cabecera `x-api-key` esperando HTTP 200.
   * Verifica la barrera de seguridad: petición sin clave rechazada con HTTP 401 Unauthorized.
   * Verifica la disponibilidad del Frontend Web Nginx esperando HTTP 200.
7. **Rollback Automático ante Fallos:** Si cualquier verificación o paso falla, la directiva `trap 'rollback' ERR INT TERM` detiene los contenedores inestables, preserva la base de datos y finaliza con código de error `exit 1`.

El script es completamente **idempotente**: puede ejecutarse múltiples veces consecutivas sin romper nada ni alterar datos existentes.

---

## Pipeline de Integración Continua (CI/CD en GitHub Actions)

El repositorio incluye un flujo automatizado en [`.github/workflows/ci-cd.yml`](./.github/workflows/ci-cd.yml) que se ejecuta en cada `push` o `pull request` hacia `main` o `master`:

1. **Job `test-and-build`:**
   * Levanta un contenedor de servicio efímero de MySQL 8.4 con healthcheck nativo.
   * Instala dependencias con caché npm, genera el cliente Prisma, ejecuta migraciones y sembrado de prueba.
   * Compila el backend TypeScript (`npm run build`).
   * Ejecuta la suite de 28 pruebas automatizadas (Vitest).
   * Compila el Frontend SPA con Vite y guarda los artefactos de producción (`dist/`).
2. **Job `docker-verification`:**
   * Construye las imágenes Docker con Buildx y levanta la pila con `docker compose up -d --build`.
   * Espera la salud de los contenedores y ejecuta smoke tests de red contra `/health`, `/api/equipos` (200 y 401) y Nginx.
3. **Job `deploy`:**
   * Se ejecuta automáticamente tras la aprobación de pruebas cuando se realiza un `push` a `main`.
   * Utilizando el secreto `RAILWAY_TOKEN`, realiza el despliegue automatizado continuo hacia los servicios de Railway (`backend` y `frontend`).

---

## Despliegue en Railway (Dos URLs Públicas Independientes)

Cumpliendo estrictamente con el requisito de **"Frontend y backend separados, cada uno con su propia URL pública"**, la arquitectura en Railway se estructura en dos servicios desacoplados:

1. **Servicio Backend (`backend`):**
   * Contenedor Node.js 22 Alpine con Express y Prisma.
   * Expone su propia URL pública HTTPS (ej. `https://mining-backend-production.up.railway.app`).
   * Conectado a la base de datos MySQL en red privada (`${{MySQL.DATABASE_URL}}`).
2. **Servicio Frontend (`frontend`):**
   * Contenedor Nginx 1.27 Alpine que sirve la SPA compilada.
   * Expone su propia URL pública HTTPS (ej. `https://mining-frontend-production.up.railway.app`).
   * Conectado a la API backend mediante `VITE_API_URL` y protegido con `VITE_API_KEY`.
3. **Servicio Base de Datos (`MySQL`):**
   * Instancia MySQL 8.4 gestionada en Railway con transacciones ACID y volumen persistente.

---

## Uso de Inteligencia Artificial y Prácticas de Ingeniería

En cumplimiento con las instrucciones del proyecto y las buenas prácticas de transparencia técnica:

* **Herramientas de IA Utilizadas:** Se utilizó **Google Antigravity** con modelos **Gemini 3.8 Flash (High)** como copiloto técnico durante el ciclo de vida del desarrollo.
* **Metodología (Spec-Driven Development):** El desarrollo se realizó siguiendo un proceso formal de especificación previa:
  1. Definición estricta de límites de alcance (*In Scope / Out of Scope*) y reglas de negocio antes de generar código.
  2. Redacción del contrato técnico en [`CONTRACT.md`](./CONTRACT.md) como única fuente de verdad para API, base de datos y scripts.
  3. Tipado estricto en TypeScript (`"strict": true`, sin `any`) e interfaces compartidas entre cliente y servidor.
* **Supervisión y Criterio Humano:**
  * **Arquitectura de Microservicios Desacoplada:** Se optó por una arquitectura contenerizada en Railway donde el backend y el frontend corren como contenedores independientes con URLs públicas HTTPS propias y políticas CORS rigurosas.
  * **Consistencia de Datos:** Se implementó transaccionalidad atómica (`prisma.$transaction`) para asegurar que el registro de mantenimiento y el reinicio del horómetro ocurran de manera indivisible.
  * **Resiliencia Operativa:** Se diseñó la rutina de reversión (`trap 'rollback' ERR INT TERM`) y el control estricto de errores (`set -euo pipefail`) en `./deploy.sh`.