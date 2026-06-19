# Los términos técnicos en criollo

Traducción sin vueltas de la jerga, con analogías. Para terminar de entender qué es cada cosa.
(La definición "formal" de cada una está en [04-definiciones-clave.md](04-definiciones-clave.md).)

---

## Frontend / React

**Render / re-render**
"Dibujar" el componente en pantalla. *Re-render* = volver a dibujarlo porque algo cambió.
React redibuja solo cuando hace falta. Analogía: refrescar una planilla cuando cambiás un número.

**Estado (state)**
La "memoria" de un componente. Datos que, cuando cambian, hacen que React redibuje.
Ej: `usuario` es estado — cuando pasás de "nadie logueado" a "logueado", la pantalla cambia.

**Hook**
Una función de React que empieza con `use` y te "engancha" a una capacidad de React (memoria,
efectos, contexto). Analogía: enchufes. `useState` te enchufa memoria, `useEffect` te enchufa a
"hacé esto cuando pase tal cosa".

**Prop drilling**
El bajón de tener que pasar un dato de mano en mano por muchos componentes que ni lo usan, solo
para que llegue a uno profundo. Analogía: pasar un papel por 5 personas en una fila para que llegue
a la última. Un garrón.

**Context (Context API)**
La solución al prop drilling: un "pizarrón global" que cuelgo arriba y cualquier componente lee
directo, sin pasar el papel de mano en mano. Analogía: en vez de pasar el papel, lo colgás en una
cartelera y el que lo necesita lo mira.

**Provider**
El componente que "cuelga el pizarrón" y le escribe el contenido. Todo lo que esté adentro del
Provider puede leer ese pizarrón. Tu `AuthProvider` cuelga la sesión; tu `ToastProvider`, los carteles.

**useContext**
El acto de "mirar el pizarrón". Devuelve lo que el Provider escribió.

**Custom hook**
Un enchufe que te armás vos combinando los de React, para no repetir código. `useAuth` es "el enchufe
para mirar el pizarrón de la sesión, con un cartel de error si te olvidaste de colgarlo".

**useEffect**
"Cuando pase X, hacé Y". Corre código *después* de dibujar. Con `[]` corre una sola vez (al aparecer
el componente). Ej: "cuando arranca la app, fijate si hay token y traé el usuario".

**Array de dependencias**
La lista de "¿cuándo se vuelve a ejecutar esto?". `[]` = una vez. `[filtro]` = cada vez que cambia
`filtro`. Es como decirle a React qué vigilar.

**useCallback / memoizar**
*Memoizar* = guardar algo ya calculado para no rehacerlo. `useCallback` hace que una función sea
"la misma de antes" entre dibujos, en vez de una nueva igualita. Importa porque una función "nueva"
puede disparar efectos al pepe. Analogía: en vez de fotocopiar la misma hoja cada vez, reusás la
que ya tenías.

**children**
Lo que un componente "envuelve". Si escribís `<Provider><App/></Provider>`, el `<App/>` le llega al
Provider como `children`. Analogía: el contenido adentro de una caja; la caja no sabe qué hay, solo
lo muestra.

**SPA (Single Page Application)**
Una sola página HTML donde React cambia el contenido sin recargar. Navegás de "Turnos" a "Servicios"
y la página no parpadea: React reemplaza lo de adentro. Analogía: cambiar de canal sin apagar el tele.

**Interceptor (axios)**
Un "colado" que se mete antes de cada pedido o después de cada respuesta para hacer algo automático.
El de request le pega el token a cada pedido; el de response borra el token si vino "401". Analogía:
el de seguridad que le pone la pulsera a todos los que entran sin que vos lo pidas.

---

## Backend / Node / Express

**Middleware**
Una función que se mete "en el medio" entre que llega el pedido y se responde. Puede dejar pasar
(`next()`) o frenar todo. Analogía: los puestos de control en una ruta. Primero "¿tenés documento?"
(auth), después "¿podés pasar a esta zona?" (rol), después "¿el formulario está bien lleno?"
(validación), y recién ahí llegás al destino (controller).

**Controller**
El que atiende el pedido HTTP: lee lo que mandaron, llama a quien resuelve, y devuelve la respuesta.
No piensa la lógica, solo coordina. Analogía: el mozo — toma el pedido y lo lleva, no cocina.

**Service**
Donde está la lógica de verdad (la "cocina"). Ej: calcular si un turno se pisa con otro. Analogía:
el cocinero.

**Model (Mongoose)**
El molde de cómo se guarda cada cosa en la base + la forma de hablar con la base. Analogía: el
formulario con los campos obligatorios de cada entidad.

**Endpoint / ruta**
Una "dirección" de la API. Ej: `POST /api/turnos` = "la puerta para crear un turno".

**Token (JWT)**
Una credencial firmada que te dan al loguearte y mostrás en cada pedido para probar quién sos.
Analogía: la pulsera del boliche. Te la dan en la entrada, la mostrás adentro, y tiene un sello que
no se puede falsificar.

**"Firma, no encripta" (JWT)**
El token NO está en clave secreta: cualquiera puede leer qué dice (tu id y rol). Pero tiene un sello
(firma) que solo el server sabe hacer. Si alguien le cambia el contenido, el sello no da y se rechaza.
Analogía: un cheque — se ve el monto y el nombre, pero la firma es lo que lo hace válido.

**Payload**
El "contenido" que va adentro del token o del pedido. En tu token, `{ id, rol }`.

**Hash**
Picar algo a una sola vía: de la contraseña sacás un código ilegible, pero del código NO podés volver
a la contraseña. Analogía: hacer un licuado — de la fruta sacás el jugo, del jugo no recuperás la
fruta. Por eso el login no "descifra": vuelve a licuar lo que tipeaste y compara los jugos.

**bcrypt**
La licuadora de contraseñas, hecha lenta a propósito para que a un atacante le cueste probar millones.

**Salt**
Un puñado de azúcar aleatorio que se le tira a cada licuado, así dos contraseñas iguales dan jugos
distintos y nadie puede usar "recetas precalculadas" para adivinarlas.

**ObjectId / referencia**
El "número de documento" único de cada cosa en Mongo. Un Turno no guarda al cliente entero, guarda
su número (referencia). Analogía: en una planilla anotás el DNI del cliente, no toda su ficha.

**populate**
Cambiar ese número por la ficha completa cuando hace falta mostrarla. Analogía: tenés el DNI anotado
y vas y traés la ficha entera de esa persona. (Como un JOIN de SQL.)

**Promesa / async / await**
Una *promesa* es un "te aviso cuando esté" para cosas que tardan (pedir a la base, a otra API).
`await` = "esperá acá hasta que esté, pero no congeles todo lo demás". Analogía: pedís un café, te
dan un número, seguís con lo tuyo y `await` es esperar que llamen tu número.

**Promise.all**
Pedir varias cosas al mismo tiempo y esperar que lleguen todas. Analogía: mandás a 3 personas a
comprar a la vez en vez de una atrás de otra. Tardás lo de la más lenta, no la suma.

**Closure (clausura)**
Una función que se "acuerda" de las cosas que había alrededor cuando nació, aunque la uses mucho
después. Analogía: una valija que armaste en casa — la abrís en otro país y adentro está lo que
metiste. Es lo que hace que `requireRol('admin')` se acuerde de que tiene que validar "admin".

**Factory (función fábrica)**
Una función que fabrica otras funciones ya configuradas. `requireRol('admin')` te fabrica el control
que valida admin; `requireRol('admin','empleado')` te fabrica otro. Analogía: una máquina de sellos
a la que le decís qué texto y te tira el sello listo.

**Manejador de errores global**
Un único lugar al final que atrapa cualquier error que se tiró en el camino y arma la respuesta de
error prolija. Analogía: el de quejas/reclamos — pase lo que pase, todos los problemas terminan ahí
y se responden igual.

**CORS**
La regla del navegador de "¿este sitio tiene permiso de pedirle datos a esta API?". Se resuelve
habilitándolo en el server (y en desarrollo el proxy de Vite hace que ni aparezca el problema).

**Proxy (de Vite)**
Un redireccionador: vos escribís `/api/turnos` y Vite lo manda calladito al backend en el puerto 4000.
Analogía: un conmutador que pasa la llamada a la interna correcta.
