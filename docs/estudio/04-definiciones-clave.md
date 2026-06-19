# Definiciones clave — los conceptos del código para defender con propiedad

Glosario de los conceptos que el proyecto usa pero que tal vez no se vieron en clase.
Cada uno tiene: **qué es**, **cómo aparece en TU código** (con archivo) y una **frase para el oral**.

Índice:
- [Parte 1 — Context API (en profundidad)](#parte-1--context-api-en-profundidad)
- [Parte 2 — Hooks de React](#parte-2--hooks-de-react)
- [Parte 3 — JavaScript moderno](#parte-3--javascript-moderno)
- [Parte 4 — Conceptos del backend](#parte-4--conceptos-del-backend)

---

# Parte 1 — Context API (en profundidad)

## 1.1 ¿Qué problema resuelve? — el "prop drilling"

En React los datos fluyen **de padre a hijo por props**. Si un dato (ej. el usuario logueado)
lo necesita un componente muy profundo, hay que pasarlo por **todos** los componentes intermedios
aunque no lo usen. A eso se le llama **prop drilling** (perforación de props): props que viajan
por capas que solo las "pasan de mano".

La **Context API** es la solución oficial de React: crea un "canal global" del que **cualquier
componente puede leer directamente**, sin importar qué tan profundo esté, sin pasar props.

> **Frase para el oral:** "Usé Context para evitar prop drilling. El usuario logueado lo necesitan
> muchas páginas en distintos niveles; en vez de pasarlo por props por toda la jerarquía, lo puse
> en un contexto global y cada componente lo lee directo con un hook."

## 1.2 Las 3 piezas de Context

Context siempre tiene tres partes. En tu código (`AuthContext.jsx`):

**1) `createContext(null)` — crear el canal**
```js
export const AuthContext = createContext(null)
```
Crea el objeto Context. El argumento (`null`) es el **valor por defecto**: lo que se devuelve si
alguien lo lee SIN un Provider arriba. Lo pongo en `null` a propósito para detectar ese error (ver 1.5).

**2) El `Provider` — proveer el valor**
```js
<AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
```
El Provider es un componente que **envuelve** una parte del árbol y le inyecta un `value`.
Todos los componentes adentro de ese Provider pueden leer ese `value`. En tu app, `AuthProvider`
envuelve toda la app (ver `App.jsx`), así que el usuario está disponible en todas las páginas.

**3) `useContext(...)` — consumir el valor**
```js
const contexto = useContext(AuthContext)
```
El hook `useContext` lee el `value` del Provider más cercano hacia arriba. Devuelve exactamente
lo que el Provider puso en `value`.

> **Frase para el oral:** "Context tiene tres piezas: `createContext` define el canal, el `Provider`
> lo provee envolviendo el árbol con un `value`, y `useContext` lo consume desde cualquier hijo."

## 1.3 El "Provider pattern" — por qué hay un componente `AuthProvider`

`createContext` solo crea el canal vacío. Para que tenga **estado y lógica de verdad**, lo envuelvo
en un componente propio: el `AuthProvider`. Ese componente:
- Tiene el **estado** con `useState` (`usuario`, `miCliente`, `cargando`).
- Tiene las **funciones** que modifican ese estado (`login`, `logout`, `registrar`).
- Arma un objeto `valor` con todo eso y lo pasa al `Provider` como `value`.

Esto es el **provider pattern**: un componente que centraliza estado + lógica y lo expone por contexto.

> **Frase para el oral:** "El `AuthProvider` es donde vive el estado de sesión y las funciones de
> login/logout. Arma un objeto con el estado y las acciones, y lo entrega por el `value` del Provider.
> Así un solo lugar maneja toda la lógica de auth y el resto de la app solo la consume."

## 1.4 El custom hook envoltorio (`useAuth`) — por qué no llamo a `useContext` directo

Podría usar `useContext(AuthContext)` en cada componente, pero en vez de eso hice un hook propio:
```js
export const useAuth = () => {
  const contexto = useContext(AuthContext)
  if (!contexto) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return contexto
}
```
Ventajas:
- **Encapsula** el detalle de qué contexto se lee. Los componentes escriben `useAuth()`, no
  `useContext(AuthContext)` — más limpio y desacoplado.
- **Falla rápido y claro:** si alguien usa `useAuth()` fuera del Provider, el contexto sería `null`
  (el default) y tirar un error explícito es mucho mejor que un `undefined.usuario` misterioso
  más adelante.

> **Frase para el oral:** "Envolví `useContext` en un custom hook `useAuth` por dos razones: la API
> queda más limpia (los componentes solo llaman `useAuth()`) y agrego una guarda que tira un error
> claro si se usa fuera del Provider, en vez de fallar silenciosamente con un null."

## 1.5 Por qué el default es `null` y la guarda

`createContext(null)`: si un componente lee el contexto sin Provider arriba, recibe `null`.
La guarda `if (!contexto) throw...` convierte ese caso en un error explícito durante el desarrollo.
Es una técnica defensiva estándar de la comunidad React.

## 1.6 Anidar varios Providers (tu caso real)

En `App.jsx` tenés dos contextos anidados:
```jsx
<AuthProvider>
  <ToastProvider>
    <AppRouter />
  </ToastProvider>
</AuthProvider>
```
Cada contexto resuelve un dominio distinto: `AuthContext` la sesión, `ToastContext` las
notificaciones efímeras. Se anidan porque son **independientes**; el orden no importa salvo que uno
dependa del otro. Todo lo que esté adentro (toda la app) puede usar `useAuth()` y `useToast()`.

> **Frase para el oral:** "Tengo dos contextos separados por responsabilidad: uno para auth y otro
> para los toasts. Los anido en App.jsx; cada uno es un dominio independiente, así no mezclo
> preocupaciones en un único contexto gigante."

## 1.7 Re-render: el "costo" de Context (pregunta avanzada)

Cuando el `value` de un Provider cambia, **todos los componentes que lo consumen se vuelven a
renderizar**. Por eso Context es ideal para datos que cambian **poco** (sesión, tema, idioma) y no
para datos que cambian muchas veces por segundo. En esta app la sesión cambia rara vez (login/logout),
así que el costo es despreciable.

> **Frase para el oral:** "Sé que cuando cambia el value de un contexto se re-renderizan todos sus
> consumidores. Por eso Context me sirve para la sesión, que cambia poco. Para estado de alta
> frecuencia usaría otra cosa o lo dividiría en contextos más chicos."

## 1.8 Context API vs Redux / otras librerías

Context es **nativo de React** (no instalo nada) y alcanza perfecto para estado global simple.
Redux/Zustand aportan más (middleware, devtools, optimización de re-renders) pero son una dependencia
extra que esta app no necesita. Elegí la herramienta más liviana que resuelve el problema.

---

# Parte 2 — Hooks de React

## 2.1 ¿Qué es un hook?

Una **función especial de React** (empieza con `use`) que te permite "engancharte" a features de
React —estado, ciclo de vida, contexto— desde un componente de función. Antes esto solo se podía
en componentes de clase; los hooks lo trajeron a las funciones.

**Reglas de los hooks** (importante para defender):
1. Solo se llaman en el **nivel superior** del componente, nunca dentro de `if`, loops o funciones anidadas.
2. Solo se llaman desde **componentes de función** o desde **otros hooks**.

Esto es porque React identifica cada hook **por su orden de llamada** en cada render; si el orden
cambia, se rompe.

## 2.2 `useState` — estado local

```js
const [usuario, setUsuario] = useState(null)
```
Crea una variable de estado (`usuario`) y su función para actualizarla (`setUsuario`). Cuando llamás
al setter, React **re-renderiza** el componente con el nuevo valor. El argumento (`null`) es el valor inicial.

Detalle que conviene saber: para actualizar en base al valor previo se usa la **forma funcional**:
```js
setToasts((prev) => [...prev, nuevo])   // ToastContext.jsx
```
Es lo correcto cuando el nuevo estado depende del anterior, porque garantiza que partís del valor
más reciente.

## 2.3 `useEffect` — efectos secundarios y ciclo de vida

```js
useEffect(() => { rehidratar() }, [])   // AuthContext.jsx
```
Ejecuta código **después** de que el componente se renderiza. Sirve para "efectos secundarios":
llamadas a API, timers, suscripciones. El segundo argumento es el **array de dependencias**:
- `[]` (vacío) → corre **una sola vez**, al montar el componente. (Tu rehidratación de sesión.)
- `[a, b]` → corre al montar y cada vez que `a` o `b` cambian.
- sin array → corre en **cada** render (casi nunca se quiere).

> **Frase para el oral:** "La rehidratación de sesión va en un `useEffect` con array vacío: corre una
> vez al montar la app, chequea si hay token y trae el usuario. Es el efecto secundario de
> sincronizar el estado de React con el token de localStorage."

## 2.4 `useContext` — leer un contexto

Ya cubierto en la Parte 1. Lee el `value` del Provider más cercano. En tu código siempre lo accedo
a través de los custom hooks `useAuth` y `useToast`.

## 2.5 `useCallback` — memoizar funciones

```js
const cerrar = useCallback((id) => { ... }, [])   // ToastContext.jsx
```
Devuelve la **misma instancia** de la función entre renders, mientras no cambien sus dependencias.
"Memoizar" = recordar/cachear un resultado para no recalcularlo.

¿Por qué importa? En JS, cada render crea funciones **nuevas** (distinta identidad aunque hagan lo
mismo). Si esa función es dependencia de un `useEffect` o se pasa a un hijo, una función nueva en cada
render dispara efectos o re-renders innecesarios. `useCallback` evita eso.

En `useFetch` lo uso para que `cargar` no se re-cree en cada render (si no, el `useEffect` que depende
de ella se dispararía infinitamente). En `ToastContext` para que `agregar`/`cerrar` sean estables.

> **Frase para el oral:** "`useCallback` memoiza la función para que mantenga la misma identidad entre
> renders. Lo necesito en `useFetch` porque la función de carga es dependencia de un `useEffect`; sin
> memoizar, se re-crearía en cada render y el efecto entraría en loop."

## 2.6 Custom hooks (`useAuth`, `useToast`, `useFetch`, `usePaginacion`)

Un **custom hook** es una función propia que empieza con `use` y **compone otros hooks** para
encapsular lógica reutilizable. No es magia: es reutilización de lógica con estado.
- `useAuth` / `useToast`: encapsulan `useContext` + la guarda.
- `useFetch`: encapsula el patrón `useState` + `useEffect` + `useCallback` para cargar datos.
- `usePaginacion`: encapsula el estado de página + el slice del array.

> **Frase para el oral:** "Un custom hook es una función que empieza con `use` y combina hooks de
> React para reutilizar lógica. Por ejemplo `useFetch` encapsula el patrón de cargar datos con sus
> estados de carga y error, así no lo repito en cada página."

## 2.7 `children` y composición

```js
export function AuthProvider({ children }) { ... }
```
`children` es una **prop especial**: representa lo que el componente envuelve. Cuando escribís
`<AuthProvider><App/></AuthProvider>`, dentro de `AuthProvider` el `<App/>` llega como `children`.
Es el mecanismo de **composición** de React: componentes que envuelven a otros sin saber qué son.

---

# Parte 3 — JavaScript moderno

## 3.1 `async` / `await` y Promesas

Una **Promesa** representa un valor que estará disponible en el futuro (resultado de algo asíncrono,
como una llamada HTTP). `async` marca una función que devuelve una promesa; `await` **pausa** la
función hasta que la promesa se resuelve, sin bloquear el resto del programa. Es azúcar sintáctico
sobre `.then()` que hace el código asíncrono leerse como secuencial.
```js
const usuario = await Usuario.findOne({ email })   // espera el resultado de Mongo
```

## 3.2 `Promise.all` — paralelismo

```js
const [cliente, empleado, servicio] = await Promise.all([
  Cliente.findById(datos.cliente),
  Empleado.findById(datos.empleado),
  Servicio.findById(datos.servicio),
])
```
Lanza varias promesas **a la vez** y espera a que **todas** terminen. Como las tres queries son
independientes, corren en paralelo y el tiempo total es el de la más lenta, no la suma. Si una falla,
`Promise.all` rechaza.

> **Frase para el oral:** "Uso `Promise.all` para verificar cliente, empleado y servicio en paralelo,
> porque son queries independientes. Es más rápido que hacerlas una atrás de otra."

## 3.3 Destructuring (desestructuración)

Extraer valores de objetos/arrays en variables:
```js
const { usuario, cargando } = useAuth()        // de un objeto
const [datos, setDatos] = useState(null)        // de un array (lo que devuelve useState)
```

## 3.4 Spread / rest (`...`)

```js
setToasts((prev) => [...prev, nuevo])           // spread: copia el array y agrega
export const requireRol = (...rolesPermitidos)  // rest: junta los argumentos en un array
```
- **Spread** (`[...prev, x]`): "desparrama" los elementos para crear una copia nueva (inmutabilidad).
- **Rest** (`...args`): junta una cantidad variable de argumentos en un array.

## 3.5 Arrow functions

`const f = (x) => x + 1` — sintaxis corta de función. Además **no tienen su propio `this`**, lo que
las hace predecibles. Es el estilo usado en todo el proyecto.

## 3.6 ES Modules (`import` / `export`)

El sistema de módulos moderno de JS. `export` expone algo de un archivo, `import` lo trae en otro.
Se activa con `"type": "module"` en el `package.json`. Reemplaza a `require`/`module.exports` (CommonJS).

## 3.7 Closures (clausuras) — concepto avanzado

Una **clausura** es una función que "recuerda" las variables del ámbito donde fue creada, aunque se
ejecute después y en otro lugar. Es lo que hace que `requireRol('admin')` funcione: el middleware
devuelto **recuerda** el `rolesPermitidos` con el que se creó. También es la razón del array de
dependencias en hooks: una función puede quedar con una versión "vieja" (stale) de una variable si no
se actualizan las dependencias.

> **Frase para el oral:** "Una clausura es una función que recuerda el contexto donde se definió. Es lo
> que permite que `requireRol('admin')` devuelva un middleware que ya sabe qué roles validar."

---

# Parte 4 — Conceptos del backend

## 4.1 Middleware

Una **función que se ejecuta en el medio** del ciclo request → response, con la firma
`(req, res, next)`. Puede leer/modificar `req` y `res`, cortar la cadena (respondiendo) o pasar al
siguiente con `next()`. Express ejecuta los middlewares **en orden**. Ejemplos en tu código:
`cors()`, `express.json()`, `morgan()`, `requireAuth`, `requireRol`, `validarRequest`.

> **Frase para el oral:** "Un middleware es una función con `(req, res, next)` que se ejecuta entre que
> llega el request y se responde. Puede cortar la cadena o pasar al siguiente con `next()`. Encadeno
> varios por ruta: primero autentico, después autorizo, después valido, y recién ahí corre el controller."

## 4.2 Función factory / Higher-Order Function (HOF)

Una **HOF** es una función que recibe o **devuelve** otra función. Una **factory** es una HOF que
fabrica funciones configuradas. Tu `requireRol(...roles)` es exactamente eso: recibe los roles y
**devuelve** el middleware ya configurado. Permite `requireRol('admin')` y `requireRol('admin','empleado')`
reutilizando la misma lógica.

## 4.3 Interceptores (axios)

Funciones que axios ejecuta **automáticamente** antes de cada request o después de cada response.
- **Request interceptor** (`http.js`): agrega `Authorization: Bearer <token>` a cada llamada.
- **Response interceptor**: si llega un 401, borra el token.

Son el equivalente en el cliente a los middlewares del servidor: lógica transversal en un solo lugar.

> **Frase para el oral:** "Los interceptores de axios son como middlewares pero del lado del cliente:
> el de request inyecta el token en cada llamada, el de response borra el token si recibe un 401. Así
> la lógica del token vive en un único lugar y no la repito en cada función de API."

## 4.4 JWT por dentro (header.payload.firma)

Un **JSON Web Token** tiene tres partes separadas por puntos, cada una en base64:
- **header**: el algoritmo (ej. HS256).
- **payload**: los datos (en tu caso `{ id, rol }` + expiración). **Legible**, no encriptado.
- **firma**: `HMAC-SHA256(header + payload, JWT_SECRET)`.

`jwt.sign` crea el token; `jwt.verify` recalcula la firma con el secreto y la compara — si no coincide
(porque alguien tocó el payload) o expiró, lo rechaza.

> **Frase para el oral:** "El JWT firma, no encripta. El payload se puede leer pero no falsificar: si lo
> modificás, la firma deja de coincidir, y solo el servidor con el `JWT_SECRET` puede generar firmas válidas."

## 4.5 Hashing, bcrypt y salt

- **Hash**: transformación **de una sola vía** (one-way). De la contraseña sacás el hash, pero del hash
  NO podés volver a la contraseña. Por eso en el login no "desencripto": vuelvo a hashear lo ingresado
  y comparo hashes.
- **bcrypt**: algoritmo de hashing **lento a propósito** (resistente a fuerza bruta). 10 "salt rounds"
  = 2^10 iteraciones internas.
- **Salt**: valor aleatorio que se mezcla con la contraseña antes de hashear, así dos contraseñas
  iguales dan hashes distintos y no sirven tablas precalculadas (rainbow tables). bcrypt lo genera solo
  y lo guarda **dentro** del hash.

## 4.6 Referencias y `populate` (Mongoose)

En Mongo NoSQL las relaciones se modelan guardando el **`ObjectId`** del documento relacionado (una
"referencia", como una foreign key). `populate` reemplaza ese id por el **documento real** al consultar.
Tu `POBLAR` además usa `select` para traer solo los campos necesarios.

> **Frase para el oral:** "El Turno guarda solo los ids de cliente, empleado y servicio. Con `populate`
> Mongoose los reemplaza por los documentos reales al devolver, parecido a un JOIN, y con `select`
> traigo solo los campos que el front necesita mostrar."

## 4.7 El manejador de errores global (4 parámetros)

Express distingue un middleware de error **por tener 4 parámetros**: `(error, req, res, next)`. Va al
final de `app.js`. Los controllers atrapan con `try/catch` y delegan con `next(error)`; este handler
centraliza la respuesta de error en un JSON uniforme. Evita repetir manejo de errores en cada controller.

## 4.8 `select: false` y `.select('+password')`

En el schema, `select: false` hace que un campo **no** se devuelva por defecto en las consultas (el
password). Cuando excepcionalmente lo necesito (el login), lo traigo con `.select('+password')`. Es una
medida para no filtrar el hash en las respuestas de la API por accidente.

## 4.9 `runValidators: true` en updates

Por defecto Mongoose corre las validaciones del schema **solo al crear** (`create`). En
`findByIdAndUpdate` hay que pedirlas explícitamente con `{ runValidators: true }`, si no una
actualización podría meter datos inválidos saltándose las reglas del schema.
