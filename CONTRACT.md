# Contrato de Especificación, Arquitectura y Límites: Registro de Equipos Mineros

Este documento establece el contrato formal de arquitectura, modelos de datos, API REST, pruebas automatizadas, contenerización, integración continua y despliegue del proyecto. Sirve como la única fuente de verdad (Single Source of Truth) para el desarrollo, las pruebas y la evaluación técnica del sistema.

---

## 1. Filosofía y Objetivo del Proyecto

* **Objetivo:** Construir y publicar una aplicación desacoplada (Frontend y Backend con URLs públicas independientes), alojada en GitHub y con despliegue automatizado ejecutable con un solo comando de terminal (`./deploy.sh`).
* **Principio rector:** Priorizar un sistema sencillo, robusto, confiable e idempotente en su despliegue, incorporando buenas prácticas de contenerización, pruebas automatizadas, reversión ante fallos (rollback) e integración continua (CI/CD).
* **Eficiencia de Costos:** Separación estratégica de infraestructura para operar dentro de niveles gratuitos sostenibles sin agotar créditos de cómputo.

---

## 2. Stack Tecnológico y Hosting Seleccionado

| Componente | Tecnología / Plataforma | Justificación |
| :--- | :--- | :--- |
| **Backend** | Node.js (v24+), TypeScript, Express | Ligero, tipado estricto, estándar de industria y rápido arranque. |
| **ORM / Migraciones** | Prisma ORM | Migraciones declarativas, idempotentes y cliente tipado end-to-end. |
| **Base de Datos** | MySQL 8.4 | Motor relacional con integridad referencial y soporte de transacciones ACID. |
| **Frontend** | React 19, Vite, TypeScript, Tailwind CSS | SPA ultraligera, compilación instantánea y diseño responsivo sin sobrecarga SSR. |
| **Hosting Frontend** | Cloudflare Pages | Alojamiento en red perimetral (Edge CDN), ancho de banda ilimitado y 100% libre de costo. |
| **Hosting Backend y BD** | Railway / VPS Linux | Servicio de cómputo para Node.js y MySQL con URL pública independiente. |
| **Pruebas** | Vitest | Pruebas unitarias de lógica de dominio desacoplada (puras en memoria, ejecución instantánea y sin dependencias de base de datos). |
| **Contenerización** | Docker + Docker Compose | Entorno de ejecución reproducible para desarrollo local y despliegue en servidor. |
| **CI / CD** | GitHub Actions | Pipeline de validación de código, pruebas automáticas y orquestación de despliegue. |

---

## 3. Límites y Alcance (Scope & Boundaries)

### 3.1 Dentro del Alcance (In Scope)
* **Gestión de Equipos (CRUD completo):**
  * Registro, listado, detalle, edición y eliminación de maquinaria minera.
  * Atributos obligatorios: código único (ej. `CAM-001`), tipo (`camion`, `excavadora`, `perforadora`) y horómetro.
* **Lógica de Negocio de Mantenimiento:**
  * Intervalos configurados por tipo:
    * `camion`: 500 horas de operación.
    * `excavadora`: 250 horas de operación.
    * `perforadora`: 300 horas de operación.
  * Horas transcurridas en el ciclo actual:
    $$\text{horas\_en\_ciclo} = \text{horometro} - \text{horometro\_ultimo\_mantenimiento}$$
  * Bandera de alerta: si $\text{horas\_en\_ciclo} \ge \text{intervalo}$, el equipo reporta `requiere_mantenimiento = true`.
* **Registro de Mantenimiento y Reinicio de Ciclo:**
  * Almacena registro histórico (fecha, horómetro de servicio, descripción, técnico).
  * En una transacción atómica, actualiza $\text{horometro\_ultimo\_mantenimiento} = \text{horometro}$, reiniciando el ciclo operativo.
* **Diagnóstico de Salud:**
  * Endpoint `GET /health` que verifica disponibilidad del proceso y conexión activa a MySQL.
* **Componentes Opcionales Incorporados:**
  1. **Contenerización con Docker:** `Dockerfile` multi-stage para backend y frontend, y orquestación con `docker-compose.yml`.
  2. **Pruebas Automatizadas:** Pruebas unitarias sobre las reglas de negocio de mantenimiento y horómetros mediante Vitest (puras en memoria, sin dependencia de base de datos externa).
  3. **Rollback Automático:** Detección de fallos en `./deploy.sh` con reversión automática a la versión previa y código de salida `exit 1`.
  4. **GitHub Actions:** Pipeline `.github/workflows/ci-cd.yml` para validación de código, pruebas y despliegue continuo.
  5. **Seguridad de Endpoints (API Key):** Protección de todas las rutas de negocio (`/api/equipos/*`) mediante cabecera `x-api-key`, conservando `/health` público para diagnósticos y balanceadores.

### 3.2 Fuera del Alcance (Out of Scope)
* Sistemas multiusuario complejos (JWT con refresh tokens, OAuth2, gestión de contraseñas de usuarios individuales), para preservar la simplicidad y el enfoque en el despliegue confiable.
* Telemetría IoT en tiempo real o WebSockets: el horómetro se incrementa manualmente o mediante un botón de simulación de horas en la interfaz.
* Arquitectura de microservicios distribuidos.

---

## 4. Contrato de Datos (Data Contract)

### Tabla: `equipos`

| Columna | Tipo de Dato | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Identificador numérico único |
| `codigo` | VARCHAR(50) | NOT NULL, UNIQUE | Código identificador (ej. `CAM-001`) |
| `tipo` | ENUM('camion', 'excavadora', 'perforadora') | NOT NULL | Tipo de maquinaria minera |
| `horometro` | DECIMAL(10,2) | NOT NULL, DEFAULT 0.00 | Total acumulado de horas de uso |
| `horometro_ultimo_mantenimiento` | DECIMAL(10,2) | NOT NULL, DEFAULT 0.00 | Horómetro al momento del último mantenimiento |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Fecha de creación del registro |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Fecha de última actualización |

### Tabla: `mantenimientos`

| Columna | Tipo de Dato | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Identificador del mantenimiento |
| `equipo_id` | INT | NOT NULL, FOREIGN KEY -> `equipos(id)` ON DELETE CASCADE | Relación con el equipo intervenido |
| `fecha` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Fecha y hora de la intervención |
| `horometro_servicio` | DECIMAL(10,2) | NOT NULL | Lectura del horómetro al realizar el servicio |
| `descripcion` | TEXT | NULL | Detalle de las tareas realizadas |
| `tecnico` | VARCHAR(100) | NULL | Nombre del técnico responsable |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Registro de auditoría |

### 4.3 Sembrado de Datos de Demostración (Seed Data)
Para facilitar la verificación manual del sistema tanto en desarrollo como en la demostración para evaluación, el proyecto provee un script idempotente (`prisma/seed.ts`) ejecutable mediante `npm run db:seed`.

El conjunto de datos incluye 6 equipos representativos que cubren todos los estados del dominio:
* `CAM-101` (Camión, 150h acumuladas, último mantenimiento 0h) -> **Operativo** (150/500 hrs).
* `CAM-102` (Camión, 520h acumuladas, último mantenimiento 0h) -> **Requiere mantenimiento** (520 >= 500 hrs).
* `EXC-201` (Excavadora, 275h acumuladas, último mantenimiento 250h) -> **Operativo** (25/250 hrs), con 1 servicio histórico registrado.
* `EXC-202` (Excavadora, 260h acumuladas, último mantenimiento 0h) -> **Requiere mantenimiento** (260 >= 250 hrs).
* `PER-301` (Perforadora, 315h acumuladas, último mantenimiento 0h) -> **Requiere mantenimiento** (315 >= 300 hrs).
* `PER-302` (Perforadora, 80h acumuladas, último mantenimiento 0h) -> **Operativo** (80/300 hrs).

---

## 5. Contrato de la API REST (API Contract)

### Convención General
* Formato: `Content-Type: application/json`.
* Respuestas de error estandarizadas:
  ```json
  {
    "error": true,
    "message": "Descripción clara del error",
    "details": null
  }
  ```
* **Políticas de CORS y Handshake Preflight:**
  * El backend configura middleware `cors` utilizando la variable `CORS_ORIGIN` (ej. `https://<proyecto>.pages.dev` en producción o `http://localhost:5173` en local).
  * Métodos HTTP permitidos: `GET, POST, PUT, DELETE, OPTIONS`.
  * Cabeceras permitidas: `Content-Type, Authorization, x-api-key`.
  * Peticiones preflight (`OPTIONS`): El servidor responde inmediatamente con código `204 No Content` para habilitar el consumo transparente desde Cloudflare Pages.
* **Seguridad de Endpoints (Autenticación por API Key):**
  * Todas las rutas bajo `/api/equipos` requieren la cabecera `x-api-key` (o `Authorization: Bearer <token>`) coincidente con la variable de entorno `API_KEY`.
  * Peticiones sin la cabecera válida responden con `401 Unauthorized`:
    ```json
    {
      "error": true,
      "message": "Acceso no autorizado: la cabecera x-api-key o Authorization Bearer es inválida o está ausente",
      "details": null
    }
    ```
  * El endpoint `GET /health` se mantiene **completamente público y desprotegido** para permitir que plataformas de hosting (Railway, Render, VPS), balanceadores y scripts de health check verifiquen la salud del contenedor sin requerir credenciales.

---

### 5.1 Endpoint de Salud

#### `GET /health`
* **Propósito:** Validar estado del backend y conexión con la base de datos MySQL.
* **Respuesta Exitosa (`200 OK`):**
  ```json
  {
    "status": "healthy",
    "timestamp": "2026-11-06T19:00:00.000Z",
    "services": {
      "database": "connected"
    },
    "uptime": 360.2
  }
  ```
* **Respuesta de Fallo (`503 Service Unavailable`):**
  ```json
  {
    "status": "unhealthy",
    "timestamp": "2026-11-06T19:00:00.000Z",
    "services": {
      "database": "disconnected"
    },
    "error": "No se pudo conectar con la base de datos"
  }
  ```

---

### 5.2 Endpoints de Equipos

#### `GET /api/equipos`
* **Respuesta Exitosa (`200 OK`):** Retorna la lista de equipos con sus valores dinámicos calculados:
  ```json
  [
    {
      "id": 1,
      "codigo": "CAM-001",
      "tipo": "camion",
      "horometro": 520.0,
      "horometro_ultimo_mantenimiento": 0.0,
      "intervalo_mantenimiento": 500,
      "horas_en_ciclo": 520.0,
      "requiere_mantenimiento": true,
      "created_at": "2026-11-06T10:00:00.000Z",
      "updated_at": "2026-11-06T10:00:00.000Z"
    }
  ]
  ```

#### `POST /api/equipos`
* **Cuerpo de la Petición:**
  ```json
  {
    "codigo": "EXC-002",
    "tipo": "excavadora",
    "horometro": 50.0
  }
  ```
* **Respuestas:**
  * `201 Created`: Retorna el registro del equipo creado.
  * `400 Bad Request`: Datos inválidos o faltantes.
  * `409 Conflict`: El código del equipo ya se encuentra registrado.

#### `GET /api/equipos/:id`
* **Respuesta:** `200 OK` con datos del equipo y sus mantenimientos recientes, o `404 Not Found`.

#### `PUT /api/equipos/:id`
* **Cuerpo de la Petición:** Actualiza código, tipo o incrementa el horómetro.
* **Reglas Semánticas de Validación:**
  * El horómetro no puede ser menor a `horometro_ultimo_mantenimiento` (consistencia temporal del ciclo).
  * **Cambio de Tipo:** Si se modifica el `tipo` de maquinaria (ej. de `camion` a `excavadora`), el cálculo dinámico de `requiere_mantenimiento` se evalúa inmediatamente contra el nuevo intervalo correspondiente:
    $$\text{horas\_en\_ciclo} \ge \text{intervalo\_nuevo\_tipo}$$
    Si las horas en ciclo ya igualan o exceden el nuevo umbral (ej. 250h para excavadora), el equipo pasa automáticamente a `requiere_mantenimiento = true`.
* **Respuestas:** `200 OK`, `400 Bad Request`, `404 Not Found`.

#### `DELETE /api/equipos/:id`
* **Respuesta:** `200 OK` o `204 No Content` tras eliminar el equipo y su historial en cascada.

---

### 5.3 Endpoints de Mantenimiento

#### `POST /api/equipos/:id/mantenimientos`
* **Cuerpo de la Petición:**
  ```json
  {
    "descripcion": "Cambio de filtros y aceite de motor",
    "tecnico": "Carlos Perez"
  }
  ```
* **Comportamiento Transaccional:**
  1. Verifica existencia del equipo.
  2. Inserta registro en `mantenimientos` fijando `horometro_servicio = equipo.horometro`.
  3. Actualiza `equipo.horometro_ultimo_mantenimiento = equipo.horometro`.
* **Respuestas:** `201 Created`, `400 Bad Request`, `404 Not Found`.

#### `GET /api/equipos/:id/mantenimientos`
* **Respuesta:** `200 OK` con lista ordenada cronológicamente de los mantenimientos del equipo.

---

## 6. Estrategia de Pruebas Automatizadas

El proyecto adopta el **enfoque de lógica de dominio desacoplada**: pruebas unitarias puras y deterministas implementadas con **Vitest**.

### 6.1 Principio de Diseño
* **Separación de responsabilidades:** La lógica de cálculo del horómetro y reglas de mantenimiento se encapsula en un módulo de dominio puro (`backend/src/services/maintenanceRules.ts`), independiente de la base de datos y de la capa HTTP.
* **Cero dependencias externas:** Las pruebas se ejecutan 100% en memoria en menos de 50 milisegundos. Quien clone el repositorio puede ejecutar `npm test` con éxito inmediato sin requerir un servidor MySQL ni configuraciones de mocks frágiles.
* **Complementariedad:** La base de datos y la API en vivo se validan en el paso 7 de `./deploy.sh` mediante el Smoke Test contra `GET /health`.

### 6.2 Casos de Prueba Cubiertos (`backend/tests/unit/maintenanceRules.test.ts`)
1. **Cálculo de Horas en Ciclo:**
   * Cálculo correcto de `horas_en_ciclo = horometro - horometro_ultimo_mantenimiento`.
   * Manejo adecuado de lecturas iniciales (horómetro en 0).
2. **Intervalos de Mantenimiento por Tipo:**
   * `camion`: intervalo base de 500 horas.
   * `excavadora`: intervalo base de 250 horas.
   * `perforadora`: intervalo base de 300 horas.
3. **Condición de Alerta (`requiere_mantenimiento`):**
   * Retorna `true` cuando `horas_en_ciclo` iguala exactamente el intervalo.
   * Retorna `true` cuando `horas_en_ciclo` excede el intervalo.
   * Retorna `false` cuando `horas_en_ciclo` es menor al intervalo (ej. 499h para camión).
4. **Validación de Consistencia:**
   * Rechaza actualizaciones donde el nuevo horómetro sea menor al registrado en el último mantenimiento.
5. **Reinicio de Ciclo:**
   * Al registrar un servicio, el cálculo actualiza la base (`horometro_ultimo_mantenimiento = horometro`), dejando `horas_en_ciclo = 0` y `requiere_mantenimiento = false`.

### 6.3 Ejecución
* Comando local: `npm test` en backend.
* El script `./deploy.sh` y el workflow de GitHub Actions ejecutan esta suite de forma obligatoria antes de iniciar la compilación.

---

## 7. Contrato de Contenerización (Docker & Docker Compose)

El repositorio incluye la infraestructura Docker para desarrollo local unificado y despliegues en servidor VPS:

* **`backend/Dockerfile` (Multi-stage):**
  * Stage 1 (Builder): Node.js 24 Alpine, instala dependencias completas, genera el cliente Prisma y compila TypeScript (`npm run build`).
  * Stage 2 (Runner): Node.js 24 Alpine minimalista, copia sólo los artefactos compilados y dependencias de producción.
* **`frontend/Dockerfile` (Multi-stage):**
  * Stage 1 (Builder): Node.js 24 Alpine, instala dependencias y compila con Vite (`npm run build`).
  * Stage 2 (Server): Nginx Alpine, sirve la carpeta `dist` e implementa proxy reverso hacia el backend.
* **`docker-compose.yml`:**
  * Servicio `db`: MySQL 8.4 con healthcheck y volumen persistente.
  * Servicio `backend`: Dependiente del healthcheck de `db`, expone puerto `4000`.
  * Servicio `frontend`: Dependiente de `backend`, expone puerto `80`.

---

## 8. Contrato de Automatización de Despliegue Híbrido (`deploy.sh`) y Rollback

El script `./deploy.sh` es idempotente, cuenta con política estricta de detención (`set -euo pipefail`) y maneja reversión automática en caso de error.

### Diagrama de Fases y Rutina de Rollback

```
[Inicio de deploy.sh]
  │
  ├── 1. Pre-flight Check:
  │      ├── Validar variables de entorno (.env backend y frontend)
  │      └── Validar herramientas (node/npm, wrangler o railway CLI, git, curl)
  │
  ├── 2. Registro de Estado Previo (Para Rollback):
  │      └── Guardar versión o commit anterior: PREV_STATE=$(git rev-parse HEAD)
  │
  ├── 3. Pruebas Automatizadas:
  │      └── Ejecutar suite de pruebas (npm test en backend). Si falla -> ROLLBACK
  │
  ├── 4. Compilación y Construcción (Build):
  │      ├── Validar e inyectar VITE_API_URL en el entorno de compilación
  │      ├── Compilar backend (TypeScript -> JS ejecutable)
  │      └── Compilar frontend (Vite build empaqueta VITE_API_URL en los estáticos de dist/)
  │
  ├── 5. Migraciones de Base de Datos:
  │      └── Ejecutar migraciones con Prisma (prisma migrate deploy)
  │
  ├── 6. Despliegue Híbrido de Servicios:
  │      ├── Desplegar Backend a Railway / VPS
  │      └── Desplegar Frontend compilado a Cloudflare Pages (wrangler pages deploy)
  │
  └── 7. Smoke Test & Health Check:
         ├── curl -sf https://<backend-url>/health (debe responder HTTP 200)
         ├── curl -sf https://<frontend-url>/ (debe responder HTTP 200)
         └── Si falla cualquier verificación -> Ejecutar función ROLLBACK

[Función ROLLBACK (Activada ante cualquier fallo)]:
  ├── 1. Interrumpir nuevos despliegues.
  ├── 2. Revertir código o despliegue al estado anterior ($PREV_STATE).
  ├── 3. Notificar en stderr el paso exacto que originó la falla.
  └── 4. Terminar con código de salida distinto de cero: exit 1.
```

---

## 9. Integración Continua con GitHub Actions

El repositorio incluirá el archivo `.github/workflows/ci-cd.yml` estructurado con:

1. **Job `validate-and-test`:**
   * Se ejecuta en cada `push` y `pull_request` a la rama `main`.
   * Levanta un servicio MySQL efímero.
   * Ejecuta verificación de tipos TypeScript (`tsc --noEmit`).
   * Corre la suite completa de pruebas unitarias y de integración (`npm test`).
2. **Job `deploy`:**
   * Se ejecuta únicamente si el job de pruebas concluye exitosamente en `main`.
   * Despliega el backend a Railway y el frontend a Cloudflare Pages mediante sus respectivos tokens seguros en GitHub Secrets.
   * Ejecuta la comprobación final contra la URL pública de `/health`.

---

## 10. Especificación de Variables de Entorno

### Backend (`backend/.env.example`) - Variables en Runtime
```env
PORT=4000
NODE_ENV=production
DATABASE_URL="mysql://root:password@localhost:3306/equipos_mineros"
CORS_ORIGIN="https://equipos-mineros.pages.dev"
API_KEY="tu_clave_secreta_aqui"
```

### Frontend (`frontend/.env.example`) - Variables en Build-Time
> **Nota de Arquitectura:** En aplicaciones SPA con Vite, las variables con prefijo `VITE_` se sustituyen estáticamente durante el proceso de compilación (`npm run build`). Deben estar presentes en el entorno antes de compilar para empaquetarse en los archivos estáticos que se subirán a Cloudflare Pages.

```env
VITE_API_URL="https://backend-equipos-mineros.up.railway.app"
VITE_API_KEY="tu_clave_secreta_aqui"
```

---

## 11. Gobernanza y Plan de Ejecución

Este contrato técnico rige de manera indivisible junto con la hoja de ruta establecida en [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md):

* **Secuencia Vinculante:** La implementación debe progresar estrictamente a través de las 8 fases definidas en el plan (desde la inicialización del repositorio hasta la verificación final y etiquetado de versión).
* **Criterios de Aceptación por Fase:** Ninguna fase se dará por concluida si no cumple su respectivo criterio de verificación formal (compilación sin errores, pruebas unitarias en verde, respuesta HTTP 200 de diagnóstico o verificación de smoke test en despliegue).
* **Trazabilidad y Control de Cambios:** Cualquier modificación a los modelos de datos, endpoints de API o reglas del horómetro requerirá actualizar en paralelo este documento y la fase correspondiente en `IMPLEMENTATION_PLAN.md`.
* **Política de Git y Sugerencia de Commits:** La herramienta de IA puede inicializar el repositorio local (`git init`), pero no ejecutará comandos de Git para commits. Al concluir cada fase, la herramienta (Gemini) sugerirá en español el mensaje del commit claro y descriptivo para que el usuario gestione su historial manualmente.
