# Plan de Implementación: Registro de Equipos Mineros

Este documento establece la hoja de ruta secuencial para la construcción, prueba y despliegue del proyecto. Cada fase cuenta con tareas atómicas, criterios de aceptación y métodos de verificación para garantizar el cumplimiento estricto de las especificaciones pactadas en [`CONTRACT.md`](./CONTRACT.md) y [`BASE_INSTRUCTIONS.md`](./BASE_INSTRUCTIONS.md).

> [!IMPORTANT]
> **Política de Operación con Git:** Esta herramienta (Gemini) tiene autorización para inicializar el repositorio (`git init`) y estructurar los archivos del proyecto, pero **no ejecutará commits ni comandos de Git**. Al concluir cada fase, Gemini sugerirá en español el mensaje descriptivo del commit para que el usuario gestione su control de versiones manualmente en su terminal.

---

## Índice de Fases

1. [Fase 1: Inicialización del Repositorio y Estructura Base](#fase-1-inicialización-del-repositorio-y-estructura-base)
2. [Fase 2: Backend y Base de Datos (Node.js + Express + Prisma + MySQL)](#fase-2-backend-y-base-de-datos)
3. [Fase 3: Pruebas Automatizadas (Vitest + Supertest)](#fase-3-pruebas-automatizadas)
4. [Fase 4: Frontend SPA (React + Vite + TypeScript + Tailwind CSS)](#fase-4-frontend-spa)
5. [Fase 5: Contenerización con Docker y Docker Compose](#fase-5-contenerización-con-docker)
6. [Fase 6: Automatización del Despliegue (deploy.sh y Rollback)](#fase-6-automatización-del-despliegue)
7. [Fase 7: Pipeline de Integración Continua (GitHub Actions)](#fase-7-pipeline-de-integración-continua)
8. [Fase 8: Verificación de Aceptación y Despliegue Final](#fase-8-verificación-final)

---

## Fase 1: Inicialización del Repositorio y Estructura Base

* **Objetivo:** Establecer el control de versiones y el andamiaje del monorepo sin exponer secretos.

### Tareas
* [x] Inicializar el repositorio Git local (`git init`).
* [x] Crear `.gitignore` exhaustivo (excluyendo `node_modules/`, `.env`, `dist/`, `build/`, `coverage/`, archivos temporales de sistema).
* [x] Crear las carpetas de trabajo: `backend/` y `frontend/`.
* [x] Crear plantillas de variables de entorno:
  * [x] `backend/.env.example`
  * [x] `frontend/.env.example`
* [x] Sugerir al usuario el mensaje de commit en español tras completar la fase.

### Criterio de Verificación
* `git status` limpio y ningún archivo sensible rastreado.

---

## Fase 2: Backend y Base de Datos

* **Objetivo:** Construir la API REST, la conexión a MySQL y la lógica transaccional de horómetros y mantenimientos.

### Tareas
* [x] Inicializar proyecto Node.js en `backend/` con TypeScript (`npm init -y`, `typescript`, `@types/node`, `tsx`).
* [x] Configurar `tsconfig.json` con `"strict": true`.
* [x] Instalar dependencias de producción: `express`, `cors`, `dotenv`, `@prisma/client`.
* [x] Configurar middleware de CORS en Express:
  * Permitir origen parametrizado por `CORS_ORIGIN`.
  * Permitir métodos `GET, POST, PUT, DELETE, OPTIONS`.
  * Responder HTTP 204 ante peticiones preflight `OPTIONS` para compatibilidad transparente con Cloudflare Pages.
* [x] Configurar Prisma ORM (`npx prisma init --datasource-provider mysql`).
* [x] Definir el esquema relacional en `prisma/schema.prisma`:
  * Modelo `Equipo` (campos: `id`, `codigo`, `tipo`, `horometro`, `horometroUltimoMantenimiento`, timestamps).
  * Modelo `Mantenimiento` (campos: `id`, `equipoId`, `fecha`, `horometroServicio`, `descripcion`, `tecnico`, timestamps).
  * Relación 1 a N con `onDelete: Cascade`.
* [x] Crear y ejecutar la migración inicial en la base de datos local (`npx prisma migrate dev --name init`).
* [x] Implementar script de sembrado de datos (`backend/prisma/seed.ts`) con 6 equipos de prueba y comando `npm run db:seed`.
* [x] Implementar endpoint de diagnóstico `GET /health`:
  * Ejecuta una consulta ligera a la base de datos (`prisma.$queryRaw\`SELECT 1\``).
  * Responde HTTP 200 con `{ status: "healthy", database: "connected" }` si hay conexión.
  * Responde HTTP 503 con `{ status: "unhealthy", database: "disconnected" }` si la BD no responde.
* [x] Implementar la capa de servicios y controladores para Equipos:
  * `GET /api/equipos`: Listado con cálculo dinámico de `intervalo_mantenimiento`, `horas_en_ciclo` y `requiere_mantenimiento`.
  * `POST /api/equipos`: Creación con validaciones de código único y tipos permitidos.
  * `GET /api/equipos/:id`: Detalle de equipo e historial reciente.
  * `PUT /api/equipos/:id`: Actualización de horómetro y datos (con validación de que el horómetro no decrezca y re-evaluación inmediata de alerta si se modifica el tipo de maquinaria).
  * `DELETE /api/equipos/:id`: Eliminación física con borrado en cascada del historial.
* [x] Implementar la capa de Mantenimientos con transacción atómica:
  * `POST /api/equipos/:id/mantenimientos`:
    * Ejecución en `prisma.$transaction`: inserción de registro histórico y actualización de `horometroUltimoMantenimiento = horometro`.
  * `GET /api/equipos/:id/mantenimientos`: Historial ordenado descendentemente por fecha.
* [x] Implementar middleware de autenticación por API Key (`x-api-key` o Bearer) para proteger endpoints de negocio (`/api/equipos`), manteniendo `/health` público.
* [x] Sugerir al usuario el mensaje de commit en español tras completar la fase.

### Criterio de Verificación
* Petición `curl http://localhost:4000/health` responde HTTP 200 sin credenciales.
* Peticiones a `/api/equipos` sin cabecera responden HTTP 401; con cabecera `x-api-key` responden HTTP 200.
* CRUD completo funcional mediante peticiones HTTP autenticadas.

---

## Fase 3: Pruebas Automatizadas (Lógica de Dominio y Seguridad)

* **Objetivo:** Garantizar la fiabilidad y exactitud de las reglas de negocio de mantenimiento y horómetros mediante pruebas unitarias puras y validar la protección de endpoints por API Key.

### Tareas
* [x] Instalar herramienta de pruebas unitarias: `vitest` y `supertest` en `backend/`.
* [x] Configurar `vitest.config.ts` y script `npm test` en `backend/package.json`.
* [x] Crear módulo de lógica pura de dominio `backend/src/services/maintenanceRules.ts`:
  * [x] Función `calcularHorasEnCiclo(horometro, horometroUltimoMantenimiento)`.
  * [x] Función `obtenerIntervaloMantenimiento(tipo)`.
  * [x] Función `evaluarRequiereMantenimiento(tipo, horasEnCiclo)`.
  * [x] Función `calcularReinicioCiclo(horometro)`.
  * [x] Validación de que el horómetro nunca decrezca respecto al último mantenimiento.
* [x] Crear suite de pruebas unitarias de dominio (`backend/tests/unit/maintenanceRules.test.ts`):
  * [x] Cálculo de horas transcurridas en el ciclo actual.
  * [x] Intervalos correctos: camión (500h), excavadora (250h) y perforadora (300h).
  * [x] Activación de `requiere_mantenimiento` en umbral exacto y horas excedidas.
  * [x] No activación antes de alcanzar el umbral (ej. 499h en camión).
  * [x] Validación de casos con horómetros iniciales en cero.
  * [x] Validación de reinicio de ciclo tras registrar servicio.
* [x] Crear suite de pruebas unitarias de seguridad (`backend/tests/unit/apiKeyAuth.test.ts`):
  * [x] Peticiones `OPTIONS` permitidas sin verificación.
  * [x] Rechazo con HTTP 401 si falta `x-api-key`.
  * [x] Rechazo con HTTP 401 ante clave errónea.
  * [x] Aceptación de `x-api-key` válida.
  * [x] Aceptación de token `Authorization: Bearer <key>`.
  * [x] Manejo de error 500 si `API_KEY` no está configurada en el servidor.
* [x] Crear suite de pruebas de integración HTTP (`backend/tests/integration/routes.test.ts`):
  * [x] `GET /health` responde HTTP 200 sin credenciales.
  * [x] `OPTIONS /api/equipos` responde HTTP 204.
  * [x] `GET /api/equipos` protegido con 401 y 200 según cabecera.
* [x] Sugerir al usuario el mensaje de commit en español tras completar la fase.

### Criterio de Verificación
* Ejecución de `npm test` en backend con 100% de pruebas pasando (28 pruebas pasando exitosamente en < 2 segundos).

---

## Fase 4: Frontend SPA

* **Objetivo:** Desarrollar la interfaz gráfica de usuario en React, moderna, intuitiva y conectada a la API.

### Tareas
* [x] Inicializar proyecto en `frontend/` con Vite, React y TypeScript:
  * [x] `package.json` con React 19, Vite y TypeScript configurado.
* [x] Instalar Tailwind CSS y Lucide Icons (`lucide-react`).
* [x] Configurar cliente HTTP y tipos compartidos (`frontend/src/types/`, `frontend/src/services/apiClient.ts`):
  * [x] Interfaces `Equipo`, `Mantenimiento`, `TipoEquipo`, `HealthStatus`.
  * [x] Conexión parametrizada mediante variable de entorno `VITE_API_URL`.
  * [x] Inyección automática del encabezado `x-api-key` en todas las peticiones a la API mediante la variable de entorno `VITE_API_KEY`.
* [x] Desarrollar componentes de la interfaz:
  * [x] **Header:** Barra superior con diseño Cruip Mosaic, ping interactivo en vivo al endpoint `/health` (badge de estado del backend y base de datos) y botón de nuevo equipo.
  * [x] **Panel de Resumen:** Contadores rápidos con métricas visuales (total de equipos, equipos operativos y equipos que requieren mantenimiento urgente con indicador de alerta).
  * [x] **Filtros y Búsqueda:** Buscador por código, filtros por tipo de maquinaria y estado operativo/alerta, con selector de vista (tabla Cruip o grid de tarjetas).
  * [x] **Tabla / Grid de Equipos:**
    * [x] Código, tipo, horómetro acumulado y barra de progreso hacia el próximo mantenimiento.
    * [x] Badge visual prominente: `"Requiere mantenimiento"` (resaltado en ámbar/rojo con alerta activa).
    * [x] Botón de acción rápida "+50 hrs" para simular uso y disparar la alerta de mantenimiento.
    * [x] Botón "Registrar Mantenimiento" y "Ver Historial".
    * [x] Acciones de editar y eliminar con modal dedicado de confirmación.
  * [x] **Notificaciones Toast:** Notificaciones flotantes de alto contraste (`bg-gray-900`) con transiciones CSS fluidas (entrada/salida con desvanecimiento y escala), badges de estado (`success`, `warning`, `error`, `info`) y botón de descarte manual.
  * [x] **Componente Base de Modales con Transiciones:** [Modal.tsx](file:///d:/laragon/www/mining_equipment/frontend/src/components/Modal.tsx) centralizado con animaciones fluidas de entrada y salida (`fade` en backdrop, `scale` y `translate` en tarjeta), bloqueo de scroll de página (`body overflow: hidden`), soporte para tecla Escape y cierre al hacer clic en el backdrop.
  * [x] **Modal de Registro de Equipo:** Formulario validado para código, tipo y horómetro inicial/actualizado con transiciones de entrada y salida.
  * [x] **Modal de Mantenimiento:** Formulario para registrar técnico y notas del servicio con reinicio atómico de ciclo a 0h y transiciones suaves.
  * [x] **Modal de Historial:** Vista cronológica de mantenimientos previos del equipo con transiciones y scroll independiente.
  * [x] **Modal de Confirmación de Eliminación:** Modal de advertencia destructiva con detalles del equipo, advertencia de eliminación en cascada y transiciones completas.
* [x] Verificar compilación de producción con `npm run build` garantizando la inyección estática de `VITE_API_URL` y `VITE_API_KEY` en el bundle de `dist/`.
* [x] Sugerir al usuario el mensaje de commit en español tras completar la fase.

### Criterio de Verificación
* Interfaz funcional en navegador conectada al backend local; todas las peticiones a la API incluyen la cabecera `x-api-key` respondiendo HTTP 200 sin bloqueos 401; el flujo completo de simular horas y registrar mantenimiento actualiza la UI de inmediato.

---

## Fase 5: Contenerización con Docker

* **Objetivo:** Crear un entorno autocontenido y reproducible tanto para desarrollo local como para VPS.

### Tareas
* [x] Crear `backend/Dockerfile` multi-stage:
  * [x] Builder: instala dependencias, compila TypeScript y genera cliente Prisma para arquitectura Linux musl.
  * [x] Runner: imagen ligera de Node 22 Alpine con sólo dependencias de producción, script `entrypoint.sh` de migración automática y usuario no privilegiado (`nodejs`).
* [x] Crear `frontend/Dockerfile` multi-stage:
  * [x] Builder: instala dependencias y compila con Vite (`npm run build`) inyectando variables de entorno.
  * [x] Server: imagen Nginx 1.27 Alpine que sirve `dist/`, implementa compresión Gzip, cabeceras de seguridad y enrutamiento SPA (`try_files $uri $uri/ /index.html`).
* [x] Crear `docker-compose.yml` en la raíz:
  * [x] Servicio `db`: MySQL 8.4 con credenciales parametrizables, volumen persistente `mining_mysql_data` y `healthcheck` nativo `mysqladmin ping`.
  * [x] Servicio `backend`: depende de `db` (condición `service_healthy`), expone puerto `4000` y cuenta con healthcheck en `/health`.
  * [x] Servicio `frontend`: depende de `backend` (condición `service_healthy`), expone puerto `80` con healthcheck.
* [x] Crear `.dockerignore` en raíz, backend y frontend.
* [x] Crear `.env.example` centralizado en la raíz del proyecto.
* [x] Sugerir al usuario el mensaje de commit en español tras completar la fase.

### Criterio de Verificación
* Ejecutar `docker compose up -d` levanta los tres servicios de forma coordinada y la aplicación responde en `http://localhost`.

---

## Fase 6: Automatización del Despliegue (`deploy.sh` y Rollback)

* **Objetivo:** Cumplir el requisito central: un único comando de terminal que valide, compile, migre, publique y verifique con rollback ante fallos.

### Tareas
* [ ] Crear el script ejecutable `deploy.sh` en la raíz del proyecto.
* [ ] Configurar directivas estrictas: `set -euo pipefail`.
* [ ] Implementar función de Rollback:
  * Captura del commit o estado previo: `PREV_COMMIT=$(git rev-parse HEAD)`.
  * Registro de trampa de error: `trap 'rollback' ERR`.
  * Función `rollback()`: revierte el código/despliegue al estado estable previo, emite reporte del fallo y finaliza con `exit 1`.
* [ ] Implementar las 5 etapas obligatorias del reto:
  1. **Pre-flight Check:** Verificar binarios (`node`, `npm`, `git`, `curl`) y presencia de variables requeridas en `.env` (incluyendo `API_KEY` y `VITE_API_KEY`).
  2. **Pruebas Automatizadas:** Ejecutar `npm test` en backend antes de compilar.
  3. **Build:** Compilación de backend (`npm run build`) y compilación de frontend con inyección de `VITE_API_URL` y `VITE_API_KEY` (`npm run build`).
  4. **Migraciones:** Ejecutar `npx prisma migrate deploy` contra la base de datos de destino.
  5. **Publicación:**
     * Despliegue de backend en Railway / VPS.
     * Despliegue de frontend compilado en Cloudflare Pages (`wrangler pages deploy`).
  6. **Smoke Test y Health Check:**
     * Petición cURL a `GET /health` del backend esperando HTTP 200 y `status: "healthy"` (público).
     * Petición cURL a `GET /api/equipos` con cabecera `x-api-key: $API_KEY` esperando HTTP 200 (protegido).
     * Petición cURL al frontend de Cloudflare Pages esperando HTTP 200.
* [ ] Probar idempotencia: ejecutar el script dos veces consecutivas y verificar que concluya con éxito sin romper nada.
* [ ] Sugerir al usuario el mensaje de commit en español tras completar la fase.

### Criterio de Verificación
* Ejecutar `./deploy.sh` completa todos los pasos y finaliza con mensaje de éxito y código de salida 0.
* Forzar un error (ej. romper una prueba o credencial de BD) activa el rollback y termina con código de salida 1.

---

## Fase 7: Pipeline de Integración Continua (GitHub Actions)

* **Objetivo:** Implementar CI/CD automatizado en GitHub para pruebas y despliegue continuo.

### Tareas
* [ ] Crear el directorio `.github/workflows/`.
* [ ] Crear el archivo `.github/workflows/ci-cd.yml`:
  * Job 1: `test-and-lint` (se ejecuta en push y PR a `main`):
    * Configura Node.js 24.
    * Levanta un servicio MySQL efímero con Docker service container.
    * Instala dependencias y corre `tsc --noEmit`.
    * Corre la suite de pruebas `npm test`.
  * Job 2: `deploy` (solo en push a `main` tras pasar las pruebas):
    * Despliega backend a Railway y frontend a Cloudflare Pages mediante secrets seguros (incluyendo `API_KEY` y `VITE_API_KEY`).
    * Realiza el chequeo final de `/health` y `/api/equipos`.
* [ ] Sugerir al usuario el mensaje de commit en español tras completar la fase.

### Criterio de Verificación
* GitHub Actions ejecuta el workflow en verde al subir los cambios a la rama `main`.

---

## Fase 8: Verificación Final y Documentación

* **Objetivo:** Validar el cumplimiento del 100% de los requisitos y finalizar la entrega.

### Tareas
* [ ] Revisar checklist contra `BASE_INSTRUCTIONS.md`:
  * [ ] Frontend y backend separados con URLs públicas propias.
  * [ ] Endpoint `GET /health` responde correctamente.
  * [ ] Base de datos relacional con migraciones.
  * [ ] Sin secretos en el repositorio (`.env.example` incluidos).
  * [ ] `./deploy.sh` automatiza las 5 etapas y maneja código de error.
  * [ ] Opcionales cumplidos: Rollback, Docker, GitHub Actions, Pruebas automatizadas.
  * [ ] `README.md` completo y con sección de herramientas de IA.
* [ ] Sugerir al usuario el mensaje de commit y versión en español tras completar la fase.

---

## Registro de Progreso

| Fase | Descripción | Estado |
| :--- | :--- | :--- |
| Fase 1 | Inicialización del Repositorio y Estructura Base | Completado |
| Fase 2 | Backend y Base de Datos (Express + Prisma + MySQL) | Completado |
| Fase 3 | Pruebas Automatizadas (Vitest - Lógica de Dominio y Seguridad) | Completado |
| Fase 4 | Frontend SPA (React + Vite + Tailwind) | Completado |
| Fase 5 | Contenerización con Docker y Docker Compose | Pendiente |
| Fase 6 | Automatización del Despliegue (`deploy.sh` y Rollback) | Pendiente |
| Fase 7 | Pipeline de Integración Continua (GitHub Actions) | Pendiente |
| Fase 8 | Verificación de Aceptación y Despliegue Final | Pendiente |

