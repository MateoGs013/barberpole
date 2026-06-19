# Banco de preguntas para el oral — Peluquería SaaS

Preguntas típicas de defensa ordenadas de **fácil a difícil**, con la respuesta lista.
Practicá respondiéndolas en voz alta. Las marcadas con ⭐ son las más probables / las que más suman.

---

## A. Arquitectura general

**1. ¿Qué stack usaste y por qué?**
MERN: **MongoDB** (base NoSQL documental), **Express** (framework de la API REST sobre Node), **React** (UI con Vite) y **Node.js**. Lo elegí porque es un stack JavaScript de punta a punta: el mismo lenguaje en front y back reduce el costo de cambio de contexto, y Mongo encaja bien con datos flexibles como turnos y perfiles.

**2. ⭐ Explicá la arquitectura del backend.**
Está organizado en **capas con responsabilidad única**, y un request las atraviesa en este orden:
`route → middleware → validator → controller → service → model`.
- **route**: define el endpoint y encadena los middlewares.
- **middleware**: auth (¿quién sos? / ¿podés?) y manejo de validación.
- **validator**: reglas de express-validator sobre el body/params.
- **controller**: capa HTTP pura — lee `req`, responde `res`. No tiene lógica de negocio.
- **service**: la lógica de negocio reusable (ej. detectar turnos superpuestos).
- **model**: el esquema de Mongoose que habla con Mongo.

La ventaja: cada cosa está en un solo lugar, se testea y se cambia sin romper el resto.

**3. ¿Por qué separaste `app.js` de `server.js`?**
`app.js` **solo configura Express** (middlewares + rutas) y exporta la app. `server.js` se encarga de **conectar a Mongo y poner a escuchar el puerto**. Así la app es importable sin levantar la red — útil para testear y respeta single responsibility.

**4. ¿Qué son los ES Modules y por qué los usás?**
Es el sistema de módulos moderno de JavaScript (`import`/`export`) en lugar de CommonJS (`require`). Lo activo con `"type": "module"` en el `package.json`. Lo usé por consistencia con el frontend y porque es el estándar actual.

---

## B. Autenticación y seguridad

**5. ⭐ ¿Cómo funciona el login paso a paso?**
1. El usuario manda `email` + `password` a `POST /api/auth/login`.
2. El service busca el usuario con `.select('+password')` (porque por default el hash no se trae).
3. Compara la contraseña con `bcrypt.compare(plano, hash)`.
4. Si coincide, firma un **JWT** con `{ id, rol }` y lo devuelve junto a los datos del usuario.
5. El front guarda el token en `localStorage` y lo manda en cada request siguiente.

**6. ⭐ ¿Qué es un JWT y por qué es seguro si el payload se puede leer?**
Un JWT tiene 3 partes: `header.payload.firma`, todas en base64. El payload **se puede leer** por cualquiera (NO va encriptado), pero **JWT firma, no encripta**. La firma se genera con `JWT_SECRET` (HMAC-SHA256). Si alguien modifica el payload (ej. se cambia el rol a `admin`), la firma deja de coincidir y `jwt.verify` lo rechaza. Como solo el servidor tiene el secreto, nadie puede falsificar un token válido.

**7. ⭐ ¿Cómo guardás las contraseñas?**
Nunca en texto plano. Uso **bcrypt** con 10 salt rounds. bcrypt es **one-way (no se desencripta)**: en el login no "desencripto" el hash, sino que vuelvo a hashear la contraseña ingresada con el mismo salt (que queda incrustado dentro del hash) y comparo los resultados.

**8. ¿Qué es el salt y para qué sirve?**
Es un valor aleatorio que se mezcla con la contraseña antes de hashear. Hace que dos usuarios con la misma contraseña tengan hashes distintos, y que no se puedan usar tablas precalculadas (rainbow tables). bcrypt lo genera solo y lo guarda dentro del hash final.

**9. ¿Por qué `bcryptjs` y no `bcrypt`?**
`bcryptjs` es JavaScript puro, no necesita compilar binarios nativos — instala sin problemas en Windows. Misma API que `bcrypt`.

**10. ⭐ ¿Qué hace `select: false` en el campo password?**
En el schema de Usuario marca el password con `select: false`, así Mongoose **no lo devuelve en los `find()` por defecto**. Evita filtrar el hash en respuestas de la API por accidente. Solo en el login lo traigo explícitamente con `.select('+password')`.

**11. Diferencia entre autenticación y autorización (en tu código).**
- **Autenticación** = ¿quién sos? → middleware `requireAuth`: valida el JWT y deja `req.usuario = { id, rol }`.
- **Autorización** = ¿podés hacer esto? → middleware `requireRol('admin', ...)`: chequea que `req.usuario.rol` esté entre los permitidos.

**12. ⭐ ¿Qué es `requireRol` y por qué es una "factory"?**
Es una función que **recibe los roles permitidos y devuelve un middleware**. Eso permite reusarla: `requireRol('admin')`, `requireRol('admin', 'empleado')`, etc. Siempre va DESPUÉS de `requireAuth`, porque depende de que `req.usuario` ya exista.

**13. ¿Dónde se valida que un cliente solo vea sus propios turnos?**
En el **controller de turnos**. Si `req.usuario.rol === 'cliente'`, busco su perfil Cliente (`Cliente.usuario === req.usuario.id`) y fuerzo el filtro a su `clienteId`. En `crear` también valido que el `cliente` del body sea el suyo, si no devuelvo 403.

**14. ¿Por qué validás permisos en el backend si el front ya oculta las rutas?**
Porque el front es **solo UX** — cualquiera puede saltear el front y pegarle directo a la API con Postman. La seguridad real **siempre vive en el backend**. El `ProtectedRoute` del front evita que el usuario vea pantallas que no le sirven, pero el middleware del back es el que de verdad protege los datos.

**15. ¿Qué pasa si el token vence?**
`jwt.verify` tira excepción → `requireAuth` responde 401. En el front, el **interceptor de respuesta de axios** detecta el 401 y borra el token de `localStorage`, forzando a re-loguear.

**16. ¿Por qué el registro público siempre crea rol `cliente`?**
Por seguridad: si dejara elegir el rol, cualquiera se registraría como admin. Los admin/empleado se crean por el **seed** (`npm run seed`) o por el endpoint admin-only `POST /api/usuarios`.

---

## C. Lógica de turnos (la parte fuerte) ⭐⭐

**17. ⭐⭐ ¿Cómo evitás que un empleado tenga dos turnos al mismo tiempo?**
Cuando se crea/edita un turno calculo su rango `[inicio, fin]`, donde `fin = inicio + duracionMinutos del servicio`. Después busco si el empleado tiene **otro turno (no cancelado) que se superponga** con ese rango. Si lo hay, devuelvo **409 Conflict**.

**18. ⭐⭐ ¿Cuál es la regla matemática de solapamiento?**
Dos rangos `[a1, a2]` y `[b1, b2]` se **superponen si y solo si** `a1 < b2 && b1 < a2`.
La intuición: NO se superponen solo si uno termina antes de que el otro empiece (`a2 <= b1` o `b2 <= a1`). Negando esa condición se llega a `a1 < b2 && b1 < a2`.

**19. ⭐ ¿Por qué no traés todos los turnos del empleado y comparás en JS?**
Por eficiencia. **Pre-filtro en Mongo** los turnos del mismo empleado con `fechaHora < fin` (eso ya descarta todos los que empiezan después de que termina el nuevo). Solo sobre esos pocos candidatos calculo el `fin` real en JS (sumando la duración del servicio, que viene por `populate`) y aplico la condición `tFin > inicio`. Así muevo la mayor parte del filtrado a la base.

**20. ¿Por qué excluís los turnos cancelados del chequeo?**
Un turno cancelado libera el horario, así que no debe bloquear uno nuevo. Por eso el filtro lleva `estado: { $ne: 'cancelado' }`.

**21. Al editar un turno, ¿cómo evitás que choque consigo mismo?**
Le paso `excluirId` al chequeo de solapamiento, que agrega `_id: { $ne: id }` al filtro. Así el turno no se compara contra sí mismo. Además, solo re-chequeo si cambian `fechaHora`, `empleado` o `servicio`; si solo cambian estado o notas, no hace falta.

**22. ¿Qué es `populate` en Mongoose?**
Las referencias se guardan como `ObjectId`. `populate` **reemplaza ese id por el documento real** referenciado. Yo uso un `POBLAR` reusable que trae solo los campos que el front necesita (`select`), no el documento completo — ej. del servicio solo traigo `nombre precio duracionMinutos`.

**23. ¿Qué es `Promise.all` y por qué lo usás al crear un turno?**
Lanza varias promesas **en paralelo** y espera a todas. Lo uso para verificar que cliente, empleado y servicio existan: son 3 queries independientes, así que las corro juntas en vez de una atrás de otra, reduciendo el tiempo total.

---

## D. Frontend (React)

**24. ⭐ ¿Cómo manejás el estado global de la sesión?**
Con la **Context API** (`AuthContext`). El `AuthProvider` expone `usuario`, `miCliente`, `cargando`, y las funciones `login`, `registrar`, `logout`. Cualquier componente accede con el hook `useAuth()`. Evita pasar props por toda la jerarquía (prop drilling).

**25. ⭐ ¿Qué es la "rehidratación" de la sesión?**
Cuando recargás la página, React arranca de cero y pierde el estado. Al montar el `AuthProvider`, si hay token en `localStorage`, llamo a `GET /api/auth/yo` para validar el token y recuperar los datos del usuario. Mientras eso ocurre muestro `cargando`; si el token es inválido, queda `usuario = null`.

**26. ⭐ ¿Cómo funcionan los interceptores de axios?**
Tengo dos en `http.js`:
- **Request**: antes de cada llamada, si hay token, agrega el header `Authorization: Bearer <token>` automáticamente. Así ninguna función de API tiene que acordarse de mandarlo.
- **Response**: si la respuesta es 401, borra el token de `localStorage` (está vencido o es inválido).

**27. ¿Cómo protegés rutas en el front?**
Con el componente `ProtectedRoute`. Si está cargando la sesión, muestra "Cargando..." (evita un redirect prematuro al recargar). Si no hay usuario, redirige a `/login` guardando la ruta de origen en `location.state.from` para volver tras loguearse. Si hay usuario pero su rol no está en `roles`, redirige a `/`.

**28. ¿Qué son las rutas anidadas y el `<Outlet />`?**
React Router v6 permite una ruta **padre** que renderiza un layout común (`LayoutAutenticado` con header + nav), y rutas **hijas** que se renderizan dentro del `<Outlet />` del padre. Así las páginas autenticadas comparten el mismo marco sin repetir código.

**29. ¿Qué hace tu hook `useFetch`?**
Encapsula el patrón de cargar datos: maneja `datos`, `cargando`, `error` y expone `recargar`. Internamente usa `useCallback` para memoizar la función de fetch y `useEffect` para dispararla. Si cambian las dependencias (ej. filtros), re-ejecuta.

**30. ¿Por qué `useCallback` dentro de `useFetch`?**
Para que la función `cargar` no se re-cree en cada render. Si se re-creara, el `useEffect` que depende de ella se dispararía infinitamente. `useCallback` la memoiza y solo cambia cuando cambian las dependencias.

**31. ¿Cómo validás los formularios?**
Manualmente con `useState`, sin librerías (como pide la consigna). Cada formulario tiene una función `validar()` que devuelve un mapa de errores por campo, y muestro el error debajo del input correspondiente.

**32. ¿Qué es el proxy de Vite?**
En `vite.config.js` configuro que todo lo que vaya a `/api` se redirija a `localhost:4000` (el backend). Así en el código escribo `axios.get('/api/turnos')` sin hardcodear el host, y en desarrollo evito problemas de CORS.

---

## E. Base de datos y validación

**33. ¿Por qué MongoDB y no SQL?**
Por flexibilidad del esquema y porque las entidades encajan naturalmente como documentos. Las relaciones (turno → cliente/empleado/servicio) las resuelvo con **referencias por ObjectId + populate**, parecido a un join.

**34. ¿Qué son los `timestamps: true`?**
Una opción del schema que agrega automáticamente `createdAt` y `updatedAt` a cada documento y los mantiene actualizados. Todas mis entidades los tienen.

**35. ⭐ ¿Cómo validás los datos que entran a la API?**
Con **express-validator**. Cada ruta POST/PUT encadena reglas (ej. `body('precio').isFloat({ min: 0 })`) y al final el middleware `validarRequest` recoge los errores con `validationResult` y, si hay, responde **400** con un formato uniforme `{ error, detalles: [{ campo, mensaje }] }`.

**36. ¿Dónde manejás los errores del backend?**
Con un **manejador de errores global** al final de `app.js`, con firma de **4 parámetros** `(error, req, res, next)` — Express lo reconoce como error handler justamente por tener 4. Los controllers atrapan con `try/catch` y delegan con `next(error)`; el handler responde JSON uniforme con el `status` y el `message`.

**37. ¿Por qué los services tiran errores con `.status`?**
Para que el manejador global sepa qué código HTTP devolver. Creo el error con una helper `conError(mensaje, status)` que setea `error.status`. Así la lógica de negocio decide el código (404, 409...) sin saber de HTTP directamente.

**38. ¿Qué pasa si Mongo no conecta al arrancar?**
En `db.js`, si `mongoose.connect` falla, hago `process.exit(1)` — no tiene sentido levantar el server sin base. (Detalle extra: fuerzo DNS de Cloudflare/Google dentro del proceso porque algunos ISPs en Latinoamérica no resuelven bien los registros SRV de `mongodb+srv://`.)

---

## F. Preguntas "trampa" / de criterio

**39. Si tuvieras que escalar la paginación, ¿qué cambiarías?**
Hoy es **cliente-side**: traigo todo y el hook `usePaginacion` hace el slice en el front. Para datasets grandes lo movería al backend con `skip`/`limit` y devolvería metadata del total. Es un trade-off consciente para el alcance del parcial.

**40. ¿Qué le falta al proyecto para producción?**
Tests automatizados, CI/CD, refresh tokens (hoy uso JWT simple con expiración de 7 días), rate limiting, y mover la paginación al server. Están documentados como **limitaciones conscientes**, no olvidos.

**41. ¿Por qué el empleado ve todos los turnos y no solo los suyos?**
Es una simplificación de alcance. En una versión más madura filtraría también para el rol empleado por su empleado asignado. Lo tengo documentado.

**42. Si te pido agregar un endpoint nuevo, ¿qué archivos tocás?**
Siguiendo las capas: creo/edito el **model** (si hace falta campo), el **validator**, el **service** (lógica), el **controller** (HTTP) y registro la ruta en el **router**, montándola en `app.js` si es una entidad nueva.

**43. ¿Qué es CORS y cómo lo resolviste?**
CORS controla qué orígenes pueden pegarle a la API. En el backend uso el middleware `cors()`. En desarrollo además el **proxy de Vite** hace que front y API parezcan el mismo origen, así que ni aparece el problema.

**44. ¿Tu app es un SPA? ¿Qué implica?**
Sí, Single Page Application: React maneja el ruteo en el cliente con `BrowserRouter`, sin recargar la página. Implica que el servidor de archivos debe devolver `index.html` para cualquier ruta (y que el SEO requiere cuidado extra, fuera de alcance acá).
