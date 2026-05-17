# Peluquería SaaS

Sistema fullstack MERN para gestión de una peluquería: turnos, servicios, empleados y clientes, con autenticación por roles y una identidad visual neo-brutalista inspirada en el faro tradicional de peluquería (barber pole).

**Parcial 2 — Aplicaciones Híbridas — Da Vinci**

---

## Tabla de contenidos

1. [Stack](#stack)
2. [Estructura del repositorio](#estructura-del-repositorio)
3. [Cómo levantar el proyecto](#cómo-levantar-el-proyecto)
4. [Variables de entorno](#variables-de-entorno)
5. [Scripts](#scripts)
6. [Usuarios de prueba](#usuarios-de-prueba)
7. [Modelo de datos](#modelo-de-datos)
8. [Endpoints de la API](#endpoints-de-la-api)
9. [Decisiones técnicas](#decisiones-técnicas)
10. [Limitaciones conscientes](#limitaciones-conscientes)
11. [Autor](#autor)

---

## Stack

### Backend
- **Node.js** + **Express** (API REST con ES Modules)
- **MongoDB Atlas** + **Mongoose**
- **JWT** (`jsonwebtoken`) para autenticación
- **bcryptjs** para hash de contraseñas
- **express-validator** para validación de payloads
- `cors`, `morgan`, `dotenv`

### Frontend
- **React 18** + **Vite**
- **React Router DOM** v6 (incluye rutas anidadas y `Outlet`)
- **Context API** para estado global (auth)
- **Axios** (con interceptores) para llamadas HTTP
- **Tailwind CSS 3** (config custom con paleta neo-brutalista)

### Identidad visual
- **Paleta**: negro `#0A0A0A`, crema `#F8F6F2`, blanco, rojo-faro `#E60026`, azul-faro `#0044CC`.
- **Tipografías**: Space Grotesk (display), Inter (cuerpo), JetBrains Mono.
- **Sombras "bruta"**: offset duro, sin blur. Hover desplaza el elemento dando sensación de "presionar".

---

## Estructura del repositorio

```
parcial-2-peluqueria/
├── backend/
│   ├── src/
│   │   ├── config/         conexión a MongoDB
│   │   ├── controllers/    handlers HTTP por entidad
│   │   ├── middlewares/    auth (JWT, rol) + handler de errores de validación
│   │   ├── models/         esquemas Mongoose
│   │   ├── routes/         routers Express por entidad
│   │   ├── services/       lógica de negocio (separada de la capa HTTP)
│   │   ├── validators/     reglas express-validator
│   │   ├── app.js          configuración de Express
│   │   └── seed.js         script para crear admin inicial
│   ├── server.js           punto de entrada
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/            cliente axios + un service por entidad
│   │   ├── components/     UI reutilizable (BarberPole, Modal, ProtectedRoute)
│   │   ├── context/        AuthContext
│   │   ├── hooks/          useAuth, useFetch
│   │   ├── layouts/        LayoutAutenticado (header con nav + outlet)
│   │   ├── pages/          Landing, Login, Registro, Dashboard, Turnos,
│   │   │                   Servicios, Empleados, Clientes, Usuarios,
│   │   │                   Reservar, Perfil, NotFound
│   │   ├── router/         AppRouter
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css       directivas Tailwind + clases custom
│   ├── index.html
│   ├── vite.config.js      con proxy /api → backend
│   ├── tailwind.config.js  paleta + tipografías + sombras "bruta"
│   ├── postcss.config.js
│   └── package.json
├── README.md
└── .gitignore
```

---

## Cómo levantar el proyecto

### Requisitos

- **Node.js 18+** (probado con Node 22)
- **npm 9+**
- Una base **MongoDB Atlas** (free tier alcanza) o **MongoDB local**

### 1. Clonar y entrar al directorio

```bash
git clone <url-del-repo>
cd parcial-2-peluqueria
```

### 2. Backend

```bash
cd backend
cp .env.example .env       # en Windows: copy .env.example .env
```

Editá `.env` y completá los valores (ver [Variables de entorno](#variables-de-entorno)).

```bash
npm install
npm run seed               # crea admin@peluqueria.com / admin123 (opcional)
npm run dev                # arranca en http://localhost:4000
```

### 3. Frontend (en otra terminal)

```bash
cd frontend
npm install
npm run dev                # arranca en http://localhost:5173
```

Abrí http://localhost:5173 en el navegador. El front hace proxy de cualquier llamada a `/api` hacia el backend en `:4000`, así que no necesitás configurar CORS ni hosts.

---

## Variables de entorno

El backend usa un archivo `.env` ubicado en `/backend`. Se entrega un `.env.example` con los nombres pero sin valores sensibles.

| Variable | Descripción | Ejemplo |
|---|---|---|
| `PORT` | Puerto donde escucha el backend | `4000` |
| `MONGODB_URI` | URI de conexión a MongoDB | `mongodb+srv://usuario:pass@cluster.xxxxx.mongodb.net/peluqueria?retryWrites=true&w=majority` |
| `JWT_SECRET` | Secreto para firmar los JWT (≥ 256 bits) | string hexadecimal largo y aleatorio |
| `JWT_EXPIRES_IN` | Duración del token | `7d` |

> El `.env` **no se commitea** (está en `.gitignore`). Se entrega aparte junto con el zip de la entrega.

---

## Scripts

### Backend (`/backend`)

| Comando | Descripción |
|---|---|
| `npm run dev` | Levanta el servidor con `nodemon` (recarga automática) |
| `npm start` | Levanta el servidor con `node` (modo producción) |
| `npm run seed` | Crea el usuario admin inicial si no existe |

### Frontend (`/frontend`)

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo de Vite con HMR |
| `npm run build` | Build de producción (genera `/dist`) |
| `npm run preview` | Sirve el build de producción para probarlo localmente |

---

## Usuarios de prueba

Después de correr `npm run seed` en el backend:

| Email | Contraseña | Rol |
|---|---|---|
| `admin@peluqueria.com` | `admin123` | admin |

Para probar el rol `cliente`: registrate desde `/registro` en el frontend (el registro público siempre crea cuentas con rol cliente).

Para probar el rol `empleado`: logueate como admin, andá a (en un futuro) `/usuarios` o creá uno desde la API con `POST /api/usuarios` (admin-only).

---

## Modelo de datos

| Entidad | Campos principales | Relaciones |
|---|---|---|
| **Usuario** | `nombre`, `email`, `password` (hash, `select:false`), `rol` (admin/empleado/cliente) | — |
| **Servicio** | `nombre`, `descripcion`, `precio`, `duracionMinutos`, `activo` | — |
| **Empleado** | `nombre`, `especialidad`, `telefono`, `email`, `activo` | → Usuario (opcional) |
| **Cliente** | `nombre`, `email`, `telefono`, `notas` | → Usuario (opcional) |
| **Turno** | `fechaHora`, `estado` (pendiente/confirmado/completado/cancelado), `notas` | → Cliente, Empleado, Servicio |

Todas las entidades llevan `createdAt` y `updatedAt` automáticos (`timestamps: true` en el schema).

---

## Endpoints de la API

Base URL: `http://localhost:4000/api`

Los endpoints protegidos requieren el header `Authorization: Bearer <token>` que se obtiene en `/auth/login` o `/auth/registro`.

### Auth

| Método | Ruta | Body | Permiso | Descripción |
|---|---|---|---|---|
| POST | `/auth/registro` | `{ nombre, email, password }` | público | Crea un usuario con rol `cliente` y devuelve token |
| POST | `/auth/login` | `{ email, password }` | público | Inicia sesión y devuelve token |
| GET | `/auth/yo` | — | autenticado | Devuelve los datos del usuario del token |
| GET | `/auth/mi-cliente` | — | autenticado | Devuelve el `Cliente` vinculado al usuario. Si no existe, lo crea lazy con `nombre` y `email` del User. |

### Servicios

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/servicios` | público |
| GET | `/servicios/:id` | público |
| POST | `/servicios` | admin |
| PUT | `/servicios/:id` | admin |
| DELETE | `/servicios/:id` | admin |

### Empleados

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/empleados` | autenticado |
| GET | `/empleados/:id` | autenticado |
| POST | `/empleados` | admin |
| PUT | `/empleados/:id` | admin |
| DELETE | `/empleados/:id` | admin |

### Clientes

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/clientes?q=búsqueda` | admin, empleado |
| GET | `/clientes/:id` | admin, empleado |
| POST | `/clientes` | admin, empleado |
| PUT | `/clientes/:id` | admin, empleado |
| DELETE | `/clientes/:id` | admin |

### Usuarios

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/usuarios` | admin |
| GET | `/usuarios/:id` | admin |
| POST | `/usuarios` | admin |
| PUT | `/usuarios/:id` | admin |
| DELETE | `/usuarios/:id` | admin |

### Turnos

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/turnos?empleadoId&clienteId&estado&desde&hasta` | autenticado (el cliente ve solo los suyos) |
| GET | `/turnos/:id` | autenticado (el cliente solo si es suyo) |
| POST | `/turnos` | autenticado (el cliente solo para su propio perfil) |
| PUT | `/turnos/:id` | admin, empleado |
| DELETE | `/turnos/:id` | admin |

**Códigos de error notables del recurso Turnos:**

- `409 Conflict` cuando el empleado ya tiene un turno cuyo horario se superpone con el nuevo (regla `[a1,a2]` y `[b1,b2]` se solapan ↔ `a1 < b2 && b1 < a2`).

### Validación

Todos los endpoints `POST` y `PUT` validan los payloads con **express-validator**. Las respuestas de error siguen el formato:

```json
{
  "error": "Datos inválidos",
  "detalles": [
    { "campo": "precio", "mensaje": "El precio debe ser un número >= 0" }
  ]
}
```

---

## Decisiones técnicas

Notas para defender en el oral, agrupadas por tema.

### Arquitectura del backend

- **ES Modules** (`"type": "module"` en `package.json`) en vez de CommonJS — usa `import/export`, código moderno y consistente con el frontend.
- **Separación `app.js` ↔ `server.js`**: `app.js` solo configura Express (rutas + middlewares); `server.js` conecta a Mongo y pone a escuchar el puerto. Permite testear la app sin levantar la red.
- **Patrón por capas**: `route → middleware → validator → controller → service → model`. Cada capa con una responsabilidad única.
- **Manejador de errores global** al final de `app.js` con firma de 4 parámetros `(error, req, res, next)`. Captura todo lo que los controllers tiran con `next(error)` y devuelve JSON uniforme.

### Auth

- **bcryptjs** en vez de bcrypt — es JavaScript puro, no necesita compilar nada en Windows. Misma API.
- **10 salt rounds** — balance estándar entre seguridad y rendimiento.
- **`select: false` en password** en el schema de Usuario — Mongoose no devuelve el hash por default, evitando filtrarlo en respuestas.
- **JWT firma, no encripta** — el payload se puede leer (base64), pero solo el servidor con `JWT_SECRET` puede generar firmas válidas. Nadie puede modificar el token sin invalidar la firma.
- **Middleware `requireRol(...roles)` como factory** — devuelve un middleware específico permitiendo `requireRol('admin', 'empleado')`.
- **Seed de admin** (`npm run seed`) — atajo realista: el registro público solo crea clientes, así que para tener un admin usamos un script en lugar de exponer un endpoint inseguro.

### Lógica de turnos

- **Validación de superposición**: dos rangos `[a1,a2]` y `[b1,b2]` se superponen si y solo si `a1 < b2 && b1 < a2`. En el service pre-filtramos en Mongo los turnos del mismo empleado cuyo inicio sea anterior al fin del nuevo (descartan los que empiezan después), y luego en código sumamos la duración del servicio (populated) para calcular el fin real y aplicar la regla.
- **Filtrado por rol en el controller**: el cliente solo puede ver y crear turnos vinculados a su propio perfil Cliente (`Cliente.usuario === req.usuario.id`). El admin y el empleado ven y modifican todos.

### MongoDB Atlas en Argentina

- En `db.js` forzamos a Node a usar DNS de Cloudflare (`1.1.1.1`) y Google (`8.8.8.8`) **solo dentro del proceso** porque algunos ISPs locales no resuelven correctamente los registros DNS de tipo SRV que usa `mongodb+srv://`. No toca la configuración del sistema.

### Frontend

- **Proxy de Vite** apuntando a `localhost:4000` para `/api` — en desarrollo escribimos `axios.get('/api/turnos')` y Vite hace el redirect, evitando CORS y hardcodeo del host.
- **Capa de API separada** (`src/api/`): cada entidad tiene su archivo con funciones que retornan promesas. Las vistas no saben de axios ni de headers.
- **Interceptores de axios** en `http.js`: el de request agrega `Authorization: Bearer <token>` automáticamente si hay token en `localStorage`; el de response borra el token si recibe `401` (token vencido).
- **AuthContext con rehidratación**: al montar la app, si hay token en `localStorage`, llama a `GET /api/auth/yo` para traer los datos del usuario. Si el token es inválido, el interceptor lo borra y el usuario queda en `null`.
- **ProtectedRoute con roles opcionales**: si no hay sesión redirige a `/login` guardando la ruta de origen en `location.state.from` para volver después. Si hay sesión pero el rol no está en la lista permitida, redirige a `/`.
- **Layouts compartidos vía `<Outlet />`** de react-router-dom v6. Las rutas autenticadas se agrupan en una ruta padre con `LayoutAutenticado` y el contenido específico se renderiza en el Outlet.
- **Validación manual con `useState`** según pide la consigna (sin librerías tipo react-hook-form). Cada formulario tiene función `validar()` que retorna un mapa de errores por campo.
- **`runValidators: true` en updates** de Mongoose — por default solo corre validadores al crear; el flag los activa también en `findByIdAndUpdate`.

### Diseño neo-brutalista

- **Inspirado en el faro de peluquería** (barber pole): rojo y azul vienen de la tradición medieval (sangrías), donde rojo = sangre arterial, azul = venosa, blanco = vendaje.
- **Solo 5 colores** para mantener la disciplina visual.
- **Sombra "bruta"**: `box-shadow: 6px 6px 0 0 #0A0A0A`. Sin blur, offset entero. Al hover se achica a `2px 2px` y el elemento se desplaza `4px,4px` → efecto "presionar".
- **Cada página tiene un layout distinto** para evitar repetición:
  - Servicios → grid de cards con rotación al hover
  - Empleados → cards "sticker" con rotación determinística por índice
  - Clientes → lista vertical con franja lateral coloreada por inicial
  - Turnos → agrupado por día con encabezado tipográfico grande
  - Usuarios → tabla brutalista en desktop, cards en mobile
  - Landing → secciones con fondos alternantes (crema/negro/crema/negro)

### Responsive

- **Desktop (≥1024px)**: nav horizontal en el header.
- **Mobile (<1024px)**: el nav baja al pie en un `BottomNav` sticky con 4 items principales por rol; admin tiene un 5to "Más" que abre un sheet con los items restantes. El header queda solo con logo + botón Salir.
- Tablas se convierten en cards en mobile (caso Usuarios) para evitar scroll horizontal.
- Tipografías y paddings escalan con `md:` / `lg:` para mantener legibilidad.

---

## Limitaciones conscientes

Estas son cosas que **no** hicimos a propósito para acotar el alcance del parcial. Son trade-offs documentados, no olvidos.

- **No hay tests automatizados** — la consigna no los pide y el tiempo se invirtió en cobertura funcional.
- **No hay CI/CD, Docker ni deploy** — fuera del alcance del parcial.
- **No hay refresh tokens** — el JWT simple con expiración de 7 días alcanza para el caso de uso.
- **El perfil es read-only** — para cambiar la contraseña hay que ir por el endpoint admin-only `PUT /api/usuarios/:id` o desde la página `/usuarios` (admin).
- **El empleado ve todos los turnos**, no solo los suyos asignados. En una versión más madura se filtraría también para el rol empleado.
- **La paginación es cliente-side** (`usePaginacion` hace el slice en el front). Para datasets muy grandes habría que mover la lógica al backend con `skip`/`limit` y devolver metadata de total.

---

## Autor

**Mateo Gabús** — `mateogabus@gmail.com`
Aplicaciones Híbridas · Da Vinci · 2026
