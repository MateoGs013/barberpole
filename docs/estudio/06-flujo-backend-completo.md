# El flujo completo del backend (y cómo modificarlo)

La guía para entender el backend de una vez y saber **qué tocar** cuando te piden un cambio.

---

## La idea: una fábrica con cinta transportadora

Un pedido HTTP entra por un lado, pasa por **estaciones en orden** (cada una un archivo), y sale
una respuesta. Cada estación hace **una sola cosa**.

```
PEDIDO  →  ROUTE  →  MIDDLEWARES  →  VALIDATOR  →  CONTROLLER  →  SERVICE  →  MODEL  →  MongoDB
                     (auth + rol)                    (HTTP)       (lógica)   (molde)
                                                                                        │
RESPUESTA  ←──────────────────────────────────────────────────────────────────────────┘
```

Ejemplo real: el admin edita un cliente → `PUT /api/clientes/123`

| Estación | Archivo | Qué hace | Analogía |
|---|---|---|---|
| 1. Route | `routes/cliente.routes.js` | Reconoce la dirección y arma la cinta de middlewares | El recepcionista |
| 2. Middlewares | `middlewares/auth.js` | `requireAuth` (¿logueado?) + `requireRol` (¿puede?) | Los puestos de control |
| 3. Validator | `validators/cliente.validator.js` | Revisa que el body venga bien | El control de calidad |
| 4. Controller | `controllers/cliente.controller.js` | Lee `req`, llama al service, devuelve `res` | El mozo |
| 5. Service | `services/cliente.service.js` | La lógica real (consultas a la base) | El cocinero |
| 6. Model | `models/Cliente.js` | El molde del documento + habla con Mongo | El formulario |
| 7. MongoDB | — | Guarda/devuelve | El depósito |

**Regla de oro:** cada capa habla solo con la de al lado. El controller nunca toca Mongo directo
(pasa por el service); el service nunca lee `req` (eso es del controller). Por eso están separados.

---

## Por qué separar controller y service

1. **Responsabilidad única**: el controller se ocupa solo de HTTP (leer `req`, devolver `res`,
   códigos de estado); el service, solo de la lógica de negocio. Cada uno se entiende y se cambia solo.
2. **Reusabilidad**: la lógica del service se puede llamar desde varios lugares (otro controller, un
   script, un test) sin arrastrar nada de HTTP.
3. **Testeable**: podés probar la lógica del service sin levantar Express ni simular un request.
4. **Mantenible**: si cambia la base de datos, tocás services; si cambia la forma de la API, tocás
   controllers. Los cambios quedan acotados.

---

## Caso práctico: "agregá un campo nuevo" (ej. `direccion` en Cliente)

Tocás las capas que tienen que ver con ese campo, de adentro hacia afuera. Son **2 o 3 archivos**.

### ① Model — `models/Cliente.js` (OBLIGATORIO)
```js
const clienteSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: '' },
    telefono: { type: String, trim: true, default: '' },
    direccion: { type: String, trim: true, default: '' },   // ← NUEVO
    notas: { type: String, trim: true, default: '' },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
  },
  { timestamps: true }
)
```
Sin esto, aunque mandes `direccion` en el body, Mongoose lo ignora: no está en el molde.

### ② Validator — `validators/cliente.validator.js` (RECOMENDADO)
Agregás la regla en `reglasCrear` y en `reglasActualizar`:
```js
body('direccion').optional().trim().isLength({ max: 120 }),   // ← NUEVO
```

### ③ Controller y Service — NO se tocan
El controller hace `clienteService.crearCliente(req.body)` y el service hace `Cliente.create(datos)`.
Ninguno nombra los campos uno por uno: pasan el `req.body` entero. El campo nuevo viaja solo.

### Para el oral
> "Toco el model (obligatorio, define qué campos existen) y el validator (para validar lo que entra).
> El controller y el service no los toco porque pasan el `req.body` completo sin nombrar campos uno
> por uno, así que el campo nuevo fluye solo. Esa es la ventaja de la separación en capas."

---

## Otros cambios típicos y qué tocar

| Te piden... | Tocás... |
|---|---|
| Agregar un **campo** a una entidad | model + validator |
| Agregar un **endpoint nuevo** (ej. desactivar) | service (lógica) + controller (HTTP) + route (+ validator si recibe datos) |
| Cambiar **quién puede** hacer algo | la route (el `requireRol(...)`) |
| Cambiar una **regla de negocio** (ej. cómo se calcula algo) | el service |
| Agregar una **entidad nueva** completa | los 5 archivos (model, validator, service, controller, route) + montar el router en `app.js` |
| Cambiar el **formato de una respuesta** | el controller (o el service si arma el objeto) |

**Truco para no perderte:** preguntate "¿esto es sobre **cómo se guarda** (model), **qué entra**
(validator), **quién puede** (route), **la lógica** (service) o **el HTTP** (controller)?". La
respuesta te dice qué archivo abrir.
