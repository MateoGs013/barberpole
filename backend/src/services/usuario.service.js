// Lógica de Usuarios (gestión admin-only).
// El registro público está en auth.service.js; acá manejamos el CRUD que
// usa un admin para gestionar empleados, otros admins y clientes con cuenta.
//
// Aislamiento multi-tenant: cada operación recibe un `scope` con el rol y el
// negocio del usuario autenticado. Un admin solo puede ver y tocar usuarios de
// SU negocio; un superadmin (god de la plataforma) no tiene esa restricción.

import bcrypt from 'bcryptjs'
import { Usuario } from '../models/Usuario.js'

const SALT_ROUNDS = 10

// Campos que un admin/superadmin puede setear al actualizar. Evita mass-assignment
// (ej: que alguien inyecte `negocio` y mueva un usuario a otro tenant).
const CAMPOS_ACTUALIZABLES = ['nombre', 'email', 'password', 'rol']

const esSuperadmin = (scope) => scope?.rol === 'superadmin'

// Filtro de tenant para los listados/queries. Superadmin: sin restricción.
// Admin sin negocio: no debería ver a nadie (devolvemos un filtro imposible).
const filtroTenant = (scope) => {
  if (esSuperadmin(scope)) return {}
  if (!scope?.negocioId) return { _id: null }
  return { negocio: scope.negocioId }
}

// true si el usuario objetivo pertenece al tenant del `scope` (o si es superadmin).
const perteneceAlTenant = (usuario, scope) => {
  if (esSuperadmin(scope)) return true
  if (!scope?.negocioId) return false
  return String(usuario.negocio) === String(scope.negocioId)
}

export const listarUsuarios = async ({ page, limit, scope } = {}) => {
  const filtro = filtroTenant(scope)

  if (page) {
    const pagina = Math.max(1, parseInt(page, 10) || 1)
    const limite = Math.max(1, Math.min(100, parseInt(limit, 10) || 10))
    const skip = (pagina - 1) * limite

    const [total, datos] = await Promise.all([
      Usuario.countDocuments(filtro),
      Usuario.find(filtro).sort({ createdAt: -1 }).skip(skip).limit(limite),
    ])

    return {
      datos,
      paginacion: {
        total,
        pagina,
        limite,
        totalPaginas: Math.max(1, Math.ceil(total / limite)),
      },
    }
  }

  return Usuario.find(filtro).sort({ createdAt: -1 })
}

export const obtenerUsuario = async (id, scope) => {
  const usuario = await Usuario.findById(id)
  // Usamos 404 (y no 403) cuando es de otro tenant para no revelar su existencia.
  if (!usuario || !perteneceAlTenant(usuario, scope)) {
    throw conError('Usuario no encontrado', 404)
  }
  return usuario
}

export const crearUsuario = async ({ nombre, email, password, rol, negocio }, scope) => {
  const yaExiste = await Usuario.findOne({ email })
  if (yaExiste) throw conError('Ya existe un usuario con ese email', 409)

  // Un admin solo puede crear usuarios dentro de su propio negocio.
  // Un superadmin puede elegir el negocio (o dejarlo sin asignar).
  const negocioFinal = esSuperadmin(scope) ? negocio || null : scope?.negocioId || null

  const passwordHasheada = await bcrypt.hash(password, SALT_ROUNDS)
  return Usuario.create({
    nombre,
    email,
    password: passwordHasheada,
    rol,
    negocio: negocioFinal,
  })
}

export const actualizarUsuario = async (id, datos, scope) => {
  const objetivo = await Usuario.findById(id)
  if (!objetivo || !perteneceAlTenant(objetivo, scope)) {
    throw conError('Usuario no encontrado', 404)
  }

  // Whitelist de campos: ignoramos cualquier cosa fuera de CAMPOS_ACTUALIZABLES
  // (incluido `negocio`, que un admin no puede cambiar para no sacar usuarios de su tenant).
  const payload = {}
  for (const campo of CAMPOS_ACTUALIZABLES) {
    if (datos[campo] !== undefined) payload[campo] = datos[campo]
  }

  // Si viene un password nuevo, hay que hashearlo. Si no viene, no se toca.
  if (payload.password) {
    payload.password = await bcrypt.hash(payload.password, SALT_ROUNDS)
  } else {
    delete payload.password
  }

  const usuario = await Usuario.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  })
  return usuario
}

export const eliminarUsuario = async (id, scope) => {
  const objetivo = await Usuario.findById(id)
  if (!objetivo || !perteneceAlTenant(objetivo, scope)) {
    throw conError('Usuario no encontrado', 404)
  }
  await Usuario.findByIdAndDelete(id)
  return objetivo
}

const conError = (mensaje, status) => {
  const error = new Error(mensaje)
  error.status = status
  return error
}
