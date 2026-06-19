# Guía de flujos comentada — para señalar el código mientras explicás

Esta guía recorre **paso a paso** los flujos que más te van a preguntar, citando
**archivo y línea** para que puedas abrir el código y seguirlo con el dedo durante el oral.

> Consejo: tené estos 3 flujos tan claros que puedas dibujarlos en una hoja sin mirar.
> Si dominás el flujo de "crear turno", dominás casi todo el proyecto.

---

## Flujo 1 — Crear un turno (el más completo) ⭐⭐

Recorre TODAS las capas del backend + la lógica de negocio estrella.

### Paso a paso

**1. El usuario completa el formulario en la página Reservar**
`frontend/src/pages/Reservar.jsx` — arma el objeto `{ cliente, empleado, servicio, fechaHora }` y llama a la función de API.

**2. La capa de API dispara el POST**
`frontend/src/api/turnos.api.js` → `http.post('/turnos', datos)`.
La página no sabe nada de axios ni de headers: solo invoca una función que devuelve una promesa.

**3. El interceptor de request agrega el token**
[`frontend/src/api/http.js:21`](../../frontend/src/api/http.js) — antes de salir, el interceptor lee el token de `localStorage` y agrega `Authorization: Bearer <token>`.

**4. Vite hace proxy al backend**
La baseURL es `/api` (relativa). En desarrollo, Vite redirige `/api/turnos` → `http://localhost:4000/api/turnos`. Sin CORS, sin host hardcodeado.

**5. Express enruta la petición**
[`backend/src/app.js:35`](../../backend/src/app.js) — `app.use('/api/turnos', turnoRouter)` despacha al router de turnos.

**6. El router encadena los middlewares**
[`backend/src/routes/turno.routes.js:13`](../../backend/src/routes/turno.routes.js):
- `turnoRouter.use(requireAuth)` → **todo** turno exige estar logueado.
- `POST '/'` → `reglasCrear` (validación) → `validarRequest` → `ctrl.crear`.

**7. `requireAuth` valida el JWT**
[`backend/src/middlewares/auth.js:8`](../../backend/src/middlewares/auth.js) — saca el token del header, lo verifica con `jwt.verify(token, JWT_SECRET)` y deja `req.usuario = { id, rol }`. Si falla → **401**.

**8. Los validators chequean el body**
[`backend/src/validators/turno.validator.js:5`](../../backend/src/validators/turno.validator.js) — `cliente/empleado/servicio` deben ser `isMongoId()`, `fechaHora` debe ser `isISO8601()`. Luego [`validacion.js:7`](../../backend/src/middlewares/validacion.js) recoge los errores; si hay, responde **400** con `{ error, detalles }`.

**9. El controller aplica la lógica de rol**
[`backend/src/controllers/turno.controller.js:52`](../../backend/src/controllers/turno.controller.js) — si el usuario es `cliente`:
- Busca su perfil Cliente (`Cliente.usuario === req.usuario.id`).
- Si el `cliente` del body **no es el suyo**, responde **403**.
Luego delega en `turnoService.crearTurno(req.body)`.

**10. El service ejecuta la lógica de negocio** ⭐ (el corazón)
[`backend/src/services/turno.service.js:43`](../../backend/src/services/turno.service.js):
- **a)** Verifica que cliente, empleado y servicio existan, en paralelo con `Promise.all` (línea 46). Si falta alguno → **404**.
- **b)** Calcula el rango: `inicio = fechaHora`, `fin = inicio + servicio.duracionMinutos` (línea 57-58).
- **c)** Llama a `hayTurnoSuperpuesto(...)`. Si hay choque → **409 Conflict** (línea 61).
- **d)** Si está libre, `Turno.create(datos)` y devuelve el turno con `populate`.

**11. La respuesta sube de vuelta**
El controller responde `res.status(201).json(turno)`. Sube por la cadena, vuelve al front, y la página actualiza la UI.

### El "punto de oro" para defender: `hayTurnoSuperpuesto`
[`backend/src/services/turno.service.js:120`](../../backend/src/services/turno.service.js)
```
1. Filtra en Mongo: turnos del mismo empleado, no cancelados, con fechaHora < fin.
   (Eso descarta los que empiezan DESPUÉS de que termina el nuevo.)
2. Por cada candidato, calcula su fin real (inicio + duración del servicio).
3. Si algún candidato tiene tFin > inicio → hay superposición → return true.
```
**Regla:** dos rangos `[a1,a2]` y `[b1,b2]` se superponen ⟺ `a1 < b2 && b1 < a2`.
El filtro de Mongo cubre `a1 < b2` (fechaHora < fin); el chequeo en JS cubre `b1 < a2` (tFin > inicio).

---

## Flujo 2 — Login y manejo de sesión ⭐

### Backend

**1. POST `/api/auth/login`** → [`auth.routes.js`](../../backend/src/routes/auth.routes.js) valida el body y llama a `ctrl.login`.

**2. El controller delega en el service**
[`backend/src/controllers/auth.controller.js:21`](../../backend/src/controllers/auth.controller.js) — solo HTTP: `iniciarSesion(req.body)` y responde.

**3. El service verifica credenciales y firma el token**
[`backend/src/services/auth.service.js:37`](../../backend/src/services/auth.service.js):
- Busca el usuario con `.select('+password')` (línea 40) — necesario porque el hash tiene `select:false`.
- `bcrypt.compare(password, usuario.password)` (línea 50). Si no coincide → **401**.
- `generarRespuestaAuth` (línea 65) firma el JWT con `{ id, rol }` y devuelve `{ token, usuario }`.

### Frontend

**4. El AuthContext guarda la sesión**
[`frontend/src/context/AuthContext.jsx:58`](../../frontend/src/context/AuthContext.jsx) — `login()` llama a la API, setea `usuario` en el estado y carga `miCliente` si el rol es cliente.

**5. El token persiste en localStorage**
[`frontend/src/api/http.js:15`](../../frontend/src/api/http.js) — `guardarToken` lo escribe; desde ahí el interceptor de request lo adjunta a cada llamada.

### Rehidratación (al recargar la página)

**6. Al montar el provider, recupera la sesión**
[`frontend/src/context/AuthContext.jsx:39`](../../frontend/src/context/AuthContext.jsx) — el `useEffect` revisa si hay token; si lo hay, llama a `GET /api/auth/yo` para validar y traer el usuario. Mientras tanto `cargando = true`.

**7. Si el token venció**
[`frontend/src/api/http.js:29`](../../frontend/src/api/http.js) — el interceptor de response detecta el **401** y borra el token. El usuario queda `null` y se lo manda a login.

---

## Flujo 3 — Acceso a una ruta protegida por rol ⭐

Ejemplo: un cliente intenta entrar a `/servicios` (que es admin-only).

### En el frontend (UX — evita mostrar lo que no corresponde)

**1. El router envuelve la ruta con ProtectedRoute + roles**
[`frontend/src/router/AppRouter.jsx:80`](../../frontend/src/router/AppRouter.jsx) — el grupo admin usa `<ProtectedRoute roles={['admin']}>`.

**2. ProtectedRoute decide**
[`frontend/src/components/ProtectedRoute.jsx:11`](../../frontend/src/components/ProtectedRoute.jsx):
- Si `cargando` → muestra "Cargando..." (no redirige hasta saber si hay sesión).
- Si no hay `usuario` → `Navigate to="/login"` guardando `from` en `location.state`.
- Si el rol no está en `roles` → `Navigate to="/"`.

### En el backend (seguridad real — la que cuenta)

**3. Aunque salteen el front, el middleware bloquea**
[`backend/src/routes/servicio.routes.js`](../../backend/src/routes/servicio.routes.js) — las mutaciones usan `requireAuth, requireRol('admin')`.
[`backend/src/middlewares/auth.js:30`](../../backend/src/middlewares/auth.js) — `requireRol` chequea `req.usuario.rol`; si no está permitido → **403**.

> **Frase clave para el oral:** "El `ProtectedRoute` del front es solo experiencia de usuario; la seguridad real está en el middleware del backend, porque cualquiera puede saltear el front con Postman."

---

## Mapa rápido de "dónde está cada cosa"

| Si te preguntan por... | Andá a... |
|---|---|
| Configuración de Express y rutas montadas | [`backend/src/app.js`](../../backend/src/app.js) |
| Manejo de errores global | [`backend/src/app.js:40`](../../backend/src/app.js) |
| Validar JWT / validar rol | [`backend/src/middlewares/auth.js`](../../backend/src/middlewares/auth.js) |
| Hash de password / firma de JWT | [`backend/src/services/auth.service.js`](../../backend/src/services/auth.service.js) |
| Regla de turnos superpuestos | [`backend/src/services/turno.service.js:120`](../../backend/src/services/turno.service.js) |
| Esquema de datos (Mongoose) | `backend/src/models/*.js` |
| Validación de payloads | `backend/src/validators/*.js` |
| Cliente HTTP + interceptores | [`frontend/src/api/http.js`](../../frontend/src/api/http.js) |
| Estado global de sesión | [`frontend/src/context/AuthContext.jsx`](../../frontend/src/context/AuthContext.jsx) |
| Rutas y protección por rol | [`frontend/src/router/AppRouter.jsx`](../../frontend/src/router/AppRouter.jsx) |
| Patrón de carga de datos | [`frontend/src/hooks/useFetch.js`](../../frontend/src/hooks/useFetch.js) |
