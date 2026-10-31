# BarberPole 💈 — B2B Multi-Tenant Barbershop & Salon SaaS Platform

[![CI/CD Pipeline](https://github.com/MateoGs013/barberpole/actions/workflows/ci.yml/badge.svg)](https://github.com/MateoGs013/barberpole/actions/workflows/ci.yml)
[![Node.js Version](https://img.shields.io/badge/Node.js-22%2B-brightgreen.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Design: Modo Hiperfoco OLED](https://img.shields.io/badge/Design-Modo_Hiperfoco_OLED_%23050505-000000.svg)]()
[![Microinteractions: Bencho UI](https://img.shields.io/badge/Interactions-Bencho_UI_Tactile-blueviolet.svg)](https://bencho.dev/)

Plataforma SaaS multi-inquilino (Multi-Tenant) comercial de alto rendimiento para barberías, salones y profesionales independientes. Cuenta con arquitectura multi-tenant con aislamiento de datos, onboarding autoservicio con subdominios/slugs dinámicos (/:slug), motor inteligente de disponibilidad en tiempo real (**Slot Engine**), sincronización con Google Calendar, control atómico de concurrencia anti-double booking, y una interfaz visual ultra-minimalista **"Modo Hiperfoco" (OLED Black #050505)** con micro-interacciones táctiles.

**🔗 Demo en vivo: [parcial-2-peluqueria.vercel.app](https://parcial-2-peluqueria.vercel.app/)**

![barberpole — landing](docs/preview-hero.png)

*Proyecto de portafolio — servicio backend Node.js/Express multi-tenant con frontend React. Nació como trabajo académico y evolucionó hacia un servicio production-oriented (seguridad, tests y CI).*

---

## 🏛️ Arquitectura Multi-Tenant SaaS

```mermaid
graph TD
    Client[Visitante / Cliente Final] -->|barberpole.app/:slug| PortalPublico[Portal Público de Turnos por Salón]
    Owner[Dueño de Barbería] -->|barberpole.app/onboarding| OnboardingWizard[Wizard de Onboarding Autoservicio 3 Pasos]
    Admin[Admin / Barbero Autenticado] -->|barberpole.app/dashboard| StudioConsole[Consola de Telemetría Studio]

    PortalPublico -->|REST API| Backend[Backend Express 4 Multi-Tenant Engine]
    OnboardingWizard -->|REST API| Backend
    StudioConsole -->|Bearer JWT + Negocio Claim| Backend

    subgraph "Aislamiento & Seguridad"
        Backend --> TenantMiddleware[Tenant Scoping Middleware (req.negocioId)]
        Backend --> ConcurrencyMutex[Per-Employee Atomic Mutex]
        Backend --> HelmetShield[Helmet CSP & HSTS]
        Backend --> RateLimiters[Express Anti-Abuse Rate Limiters]
    end

    subgraph "Persistencia MongoDB Multi-Tenant"
        TenantMiddleware --> NegocioColl[(Negocios / Tenants)]
        TenantMiddleware --> ServicioColl[(Servicios / Scoped)]
        TenantMiddleware --> EmpleadoColl[(Empleados / Scoped)]
        TenantMiddleware --> TurnoColl[(Turnos / Scoped)]
        TenantMiddleware --> ClienteColl[(Clientes / Scoped)]
    end
```

---

## ✨ Características Principales

### 1. 🏢 Multi-Tenancy B2B & Onboarding Autoservicio
- **Aislamiento Estricto por Tenant**: Cada entidad (`Servicio`, `Empleado`, `Turno`, `Cliente`) está asociada a un `Negocio` mediante índices compuestos `{ negocio: 1, ... }`.
- **Onboarding de 3 Pasos (`/onboarding`)**:
  1. *Identidad del Salón*: Nombre comercial, dirección, WhatsApp y auto-generación de slug en tiempo real con normalización NFD.
  2. *Credenciales de Dueño*: Nombre, email y contraseña del administrador.
  3. *Selección de Plan*: Tiers **Free**, **Pro** y **Enterprise**.
- **Portales Públicos de Turnos (`/:slug`)**:
  - URLs amigables listas para bio de Instagram (ej: `/studio-palermo`, `/la-nave`).
  - Reserva en 1 pantalla: selección de servicio, barbero, fecha y slot interactivo con ingreso directo de nombre + WhatsApp.
  - Explosión táctil de confeti (`canvas-confetti`) y resumen en Dynamic Island flotante al confirmar.

### 2. 🖤 Estética "Modo Hiperfoco" & Micro-interacciones Táctiles
- **Fondo OLED Black `#050505`** con grilla técnica sutil de 24px y bordes monolíticos en `rgba(255,255,255,0.08)`.
- **Spotlight Cards**: Efecto specular de iluminación radial que sigue las coordenadas exactas del cursor del usuario (`SpotlightCard`).
- **Tactile Slots (Bencho UI inspired)**: Chips de horario con resortes Framer Motion (`type: "spring", stiffness: 450, damping: 25`), indicadores de estado en vivo (verde activo / gris ocupado) y animaciones hápticas.
- **Dynamic Island**: Píldora morphing flotante que expande el resumen en vivo de la reserva y confirma la cita sin cambios bruscos de pantalla.
- **BarberPole Monocromático**: Emblema minimalista con reflejo de cristal satinado y rotación sutil.

### 3. ⚡ Slot Engine & Control de Concurrencia
- **Disponibilidad Inteligente**: `GET /api/empleados/:id/disponibilidad?fecha=YYYY-MM-DD&servicioId=...` calcula dinámicamente horarios libres respetando horarios de apertura/cierre y turnos existentes.
- **Anti-Doble-Reserva**: Lock por empleado que serializa el chequeo de solapamiento y la creación, devolviendo `409 Conflict` ante colisiones. Usa un **lock distribuido en Redis** (`SET NX PX` + liberación segura por Lua) cuando hay `REDIS_URL` configurada, y cae a un lock en proceso cuando no. En ambos casos, una **reconciliación contra la base** es el backstop de correctitud: ante carreras entre múltiples instancias sobrevive de forma determinística el turno de `_id` menor.
- **Cancelación Autónoma**: Validación estricta de ventana mínima de 2 horas previas a la cita (`PATCH /api/turnos/:id/cancelar`).
- **Snapshots Contables Inmutables**: Los turnos graban `precioCobrado`, `duracionMinutos` y `fechaHoraFin` en el momento exacto de la reserva.

---

## ⚡ Demo en Vivo & Salones Pre-Sembrados

En el entorno local o de demostración se encuentran configurados dos salones completos:

| Salón / Tenant | URL de Turnos | Dueño / Admin | Contraseña | Plan |
| :--- | :--- | :--- | :--- | :--- |
| 💈 **Studio Palermo** | `http://localhost:5173/studio-palermo` | `admin@peluqueria.com` | `admin123` | **Pro** |
| 🚀 **La Nave Barbershop** | `http://localhost:5173/la-nave` | `owner@lanave.com` | `admin123` | **Enterprise** |

### Accesos Rápidos de la Plataforma:
- **Landing B2B SaaS**: `http://localhost:5173/`
- **Wizard Onboarding**: `http://localhost:5173/onboarding`
- **Consola Studio**: `http://localhost:5173/dashboard`
- **Healthcheck & Telemetría**: `http://localhost:4000/api/salud`

---

## 🚀 Inicio Rápido

### Opción A: Levantar con Docker Compose

```bash
# 1. Clonar el repositorio
git clone https://github.com/MateoGs013/barberpole.git
cd barberpole

# 2. Levantar MongoDB, Backend y Frontend
docker compose up --build
```

- **Frontend SPA**: `http://localhost:3000`
- **Backend API**: `http://localhost:4000/api/salud`
- **MongoDB**: `localhost:27017`

---

### Opción B: Ejecución Local Tradicional

#### 1. Backend

```bash
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno (.env)
cp .env.example .env

# Poblar base de datos con salones demo y datos multi-tenant
npm run seed:demo

# Ejecutar suite de tests automatizados (48 tests)
npm test

# Iniciar servidor backend en modo desarrollo
npm run dev
```

#### 2. Frontend

```bash
cd ../frontend

# Instalar dependencias
npm install

# Ejecutar suite de tests unitarios (18 tests)
npm test

# Build de producción
npm run build

# Iniciar servidor Vite en modo desarrollo
npm run dev
```

---

## 🧪 Suite de Tests Automatizados (66/66 Pasando)

### Backend Tests (`48 passed` | `vitest` + `supertest` + `mongodb-memory-server`)
```bash
cd backend && npm test
```
- ✅ Onboarding autoservicio de nuevos salones (`POST /api/negocios/onboarding`).
- ✅ Detección y rechazo de slugs duplicados con código `409 Conflict`.
- ✅ Consulta de portal público de tenant con servicios y profesionales (`GET /api/negocios/publico/:slug`).
- ✅ **Aislamiento Multi-Tenant Estricto**: verificación cruzada de que servicios, turnos, empleados y usuarios de un salón son invisibles e intocables desde otro (anti-IDOR en `/api/usuarios`, `/api/turnos/:id` y `/api/empleados/:id`).
- ✅ Registro público y creación atómica de perfiles `Cliente`.
- ✅ Autenticación segura con JWT `negocio` claim y política de contraseñas (mín. 8, con letra y número).
- ✅ **Hardening OAuth de Google**: validación de audiencia (`aud`) del ID token, rechazo de email no verificado y `state` firmado (JWT) en el callback de Calendar.
- ✅ Rechazo estricto de turnos en fechas pasadas (`400 Bad Request`).
- ✅ Inmutabilidad de snapshots contables (`precioCobrado`, `duracionMinutos`).
- ✅ Slot Engine: cálculo dinámico de franjas horarias libres y ocupadas, con colisión contra eventos de Google Calendar.
- ✅ **Anti-Doble-Reserva**: carreras paralelas de reservas concurrentes al mismo horario resultan en exactamente 1 confirmación y 1 rechazo `409 Conflict`.

### Frontend Tests (`18 passed` | `vitest` + `@testing-library/react` + `jsdom`)
```bash
cd frontend && npm test
```
- ✅ Flujo completo de Onboarding SaaS: renderizado, auto-generación reactiva de slug y validación de campos obligatorios (`OnboardingNegocio.test.jsx`).
- ✅ Formulario de Login, validación y 1-Click Demo rápido (`Login.test.jsx`).
- ✅ Accesibilidad WAI-ARIA del componente Modal (focus trap, tecla ESC, `role="dialog"`) (`Modal.test.jsx`).
- ✅ Wizard interactivo de 3 pasos con Slot Engine y confirmación háptica (`Reservar.test.jsx`).
- ✅ Gestión de turnos y confirmación de cancelación (`Turnos.test.jsx`).

---

## 📡 Endpoints de la API REST

### Multi-Tenant & Onboarding (`/api/negocios`)
- `POST /api/negocios/onboarding` — Registro público de un nuevo salón y su dueño.
- `GET /api/negocios/publicos` — Directorio de salones activos para el showcase del SaaS.
- `GET /api/negocios/publico/:slug` — Portal público del salón (información, servicios y barberos).
- `GET /api/negocios/mi-negocio` — Configuración del salón autenticado (*admin*).
- `PUT /api/negocios/mi-negocio` — Actualización de branding y horarios (*admin*).

### Autenticación (`/api/auth`)
- `POST /api/auth/registro` — Registro con creación atómica de cliente (rate-limited).
- `POST /api/auth/login` — Inicio de sesión con claims de tenant en JWT (rate-limited).
- `POST /api/auth/google` — Login con Google Identity Services, validando la audiencia del ID token (rate-limited).
- `GET /api/auth/yo` — Rehidratación de sesión.

### Usuarios (`/api/usuarios`, *admin*)
- CRUD de usuarios **scoped al negocio** del admin autenticado (un admin no ve ni gestiona usuarios de otro tenant).

### Empleados & Slot Engine (`/api/empleados`)
- `GET /api/empleados` — Listado de profesionales scoped por salón.
- `GET /api/empleados/:id/disponibilidad?fecha=YYYY-MM-DD&servicioId=...` — **Slot Engine**: franjas horarias en tiempo real.
- `POST /api/empleados` — Alta de profesional (*admin*).
- `PUT /api/empleados/:id` — Edición (*admin*).
- `DELETE /api/empleados/:id` — Baja (*admin*).

### Turnos & Reservas (`/api/turnos`)
- `GET /api/turnos?desde=...&hasta=...&estado=...` — Turnos scoped con paginación.
- `POST /api/turnos` — Reserva con validación anti-pasado, snapshots contables y control anti-doble-reserva.
- `PATCH /api/turnos/:id/cancelar` — Cancelación con lead-time mínimo de 2hs.

### Servicios (`/api/servicios`)
- `GET /api/servicios` — Listado con filtrado automático por tenant autenticado u opcional.
- `POST /api/servicios` — Alta de servicio (*admin*).
- `PUT /api/servicios/:id` — Edición de tarifa o duración (*admin*).
- `DELETE /api/servicios/:id` — Baja (*admin*).

### Observabilidad
- `GET /api/salud` — Healthcheck activo con estado de Mongoose y uptime.
- `GET /api/docs` — Documentación interactiva de la API (Swagger UI / OpenAPI 3); spec cruda en `GET /api/docs.json`.
- `GET /metrics` — Métricas en formato Prometheus (proceso Node + duración/total de requests HTTP).

---

## 👨‍💻 Autor

**Mateo Gabús**  
*Proyecto de portafolio — SaaS multi-tenant full-stack (Node.js/Express · MongoDB · React)*  
Repositorio: [https://github.com/MateoGs013/barberpole.git](https://github.com/MateoGs013/barberpole.git)
