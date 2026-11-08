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
| **Frontend** | React 19, Vite, TypeScript, Tailwind CSS | **Cloudflare Pages** (Edge CDN global, ancho de banda ilimitado, costo cero) |
| **Backend** | Node.js (v24+), Express, TypeScript, Prisma ORM | **Railway / VPS** (Servicio Node.js con URL pública independiente) |
| **Base de Datos** | MySQL 8.4 (Transacciones ACID) | **Railway MySQL** (o instancia local en desarrollo) |
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
```

**Frontend (`frontend/.env`):**
```env
VITE_API_URL="http://localhost:4000"
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

El despliegue a producción se realiza con un único comando desde la raíz del proyecto:

```bash
./deploy.sh
```

### Qué hace `./deploy.sh`:
1. **Pre-flight Check:** Valida la presencia de herramientas requeridas (`node`, `npm`, `git`, `curl`) y las variables en los archivos `.env`.
2. **Snapshot de Seguridad (Rollback):** Guarda el estado anterior (`PREV_STATE`) para permitir reversión automática.
3. **Pruebas Automatizadas:** Ejecuta la suite de pruebas unitarias y de integración (`npm test`). Si falla, cancela el despliegue.
4. **Build:** Compila el backend TypeScript a JavaScript y empaqueta el frontend con Vite a la carpeta `dist/`.
5. **Migraciones:** Ejecuta `prisma migrate deploy` sobre la base de datos de producción de forma idempotente.
6. **Publicación:** Publica el backend en Railway y el frontend estático en Cloudflare Pages (`wrangler pages deploy`).
7. **Smoke Test:** Realiza peticiones HTTP automatizadas con `curl` a `GET /health` del backend y a la URL pública del frontend. Si alguno no responde con código 200, activa la función de **Rollback** y finaliza con código de error `exit 1`.

El script es completamente **idempotente**: puede ejecutarse múltiples veces consecutivas sin degradar ni corromper el servicio.

---

## Uso de Inteligencia Artificial y Prácticas de Ingeniería

En cumplimiento con las instrucciones del proyecto y las buenas prácticas de transparencia técnica:

* **Herramientas de IA Utilizadas:** Se utilizó **Google Antigravity** con modelos **Gemini 3.8 Flash (High)** como copiloto técnico durante el ciclo de vida del desarrollo.
* **Metodología (Spec-Driven Development):** El desarrollo se realizó siguiendo un proceso formal de especificación previa:
  1. Definición estricta de límites de alcance (*In Scope / Out of Scope*) y reglas de negocio antes de generar código.
  2. Redacción del contrato técnico en [`CONTRACT.md`](./CONTRACT.md) como única fuente de verdad para API, base de datos y scripts.
  3. Tipado estricto en TypeScript (`"strict": true`, sin `any`) e interfaces compartidas entre cliente y servidor.
* **Supervisión y Criterio Humano:**
  * **Optimización de Costos y Free Tier:** Se determinó separar el frontend hacia Cloudflare Pages (ancho de banda gratuito e ilimitado en CDN perimetral) y el backend hacia Railway, evitando agotar créditos de cómputo en la nube.
  * **Consistencia de Datos:** Se implementó transaccionalidad atómica (`prisma.$transaction`) para asegurar que el registro de mantenimiento y el reinicio del horómetro ocurran de manera indivisible.
  * **Resiliencia Operativa:** Se diseñó la rutina de reversión (`trap 'on_error' ERR`) y el control estricto de errores (`set -euo pipefail`) en `./deploy.sh`.