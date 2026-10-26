import bcrypt from 'bcryptjs'
import { Negocio } from '../models/Negocio.js'
import { Usuario } from '../models/Usuario.js'
import { Servicio } from '../models/Servicio.js'
import { Empleado } from '../models/Empleado.js'
import { Turno } from '../models/Turno.js'
import { Cliente } from '../models/Cliente.js'
import { generarRespuestaAuth } from './auth.service.js'

const SALT_ROUNDS = 10

const conError = (mensaje, status) => {
  const err = new Error(mensaje)
  err.status = status
  return err
}

export const onboardingNegocio = async ({
  nombreNegocio,
  slug,
  nombreOwner,
  email,
  password,
  telefono = '',
  direccion = '',
  descripcion = '',
  plan = 'free',
}) => {
  // Validar unicidad de slug
  const slugNormalizado = slug.toLowerCase().trim()
  const slugOcupado = await Negocio.findOne({ slug: slugNormalizado })
  if (slugOcupado) {
    throw conError('Ese identificador de salón (slug) ya está registrado. Elegí otro.', 409)
  }

  // Validar unicidad de email
  const emailOcupado = await Usuario.findOne({ email: email.toLowerCase().trim() })
  if (emailOcupado) {
    throw conError('Ya existe una cuenta con ese email.', 409)
  }

  // Hashear password y crear owner
  const passwordHasheada = await bcrypt.hash(password, SALT_ROUNDS)
  const usuario = await Usuario.create({
    nombre: nombreOwner.trim(),
    email: email.toLowerCase().trim(),
    password: passwordHasheada,
    rol: 'admin',
  })

  // Crear Negocio (Tenant)
  let negocio
  try {
    negocio = await Negocio.create({
      nombre: nombreNegocio.trim(),
      slug: slugNormalizado,
      descripcion: descripcion.trim(),
      direccion: direccion.trim(),
      telefono: telefono.trim(),
      owner: usuario._id,
      plan: ['free', 'pro', 'enterprise'].includes(plan) ? plan : 'free',
      activo: true,
    })

    // Vincular negocio al usuario
    usuario.negocio = negocio._id
    await usuario.save()

    // Sembrar servicios iniciales de cortesía
    await Servicio.create([
      {
        negocio: negocio._id,
        nombre: 'Corte Clásico / Fade',
        descripcion: 'Corte completo a tijera y máquina con lavado y peinado.',
        precio: 8500,
        duracionMinutos: 30,
        activo: true,
      },
      {
        negocio: negocio._id,
        nombre: 'Perfilado & Ritual de Barba',
        descripcion: 'Toalla caliente, navaja tradicional y aceites esenciales.',
        precio: 6000,
        duracionMinutos: 25,
        activo: true,
      },
    ])

    // Crear profesional inicial
    await Empleado.create({
      negocio: negocio._id,
      nombre: nombreOwner.trim(),
      especialidad: 'Barbero Principal / Estilista',
      telefono: telefono.trim(),
      email: email.toLowerCase().trim(),
      usuario: usuario._id,
      activo: true,
    })
  } catch (error) {
    if (usuario) await Usuario.findByIdAndDelete(usuario._id)
    if (negocio) await Negocio.findByIdAndDelete(negocio._id)
    throw error
  }

  const authResponse = generarRespuestaAuth(usuario)
  return {
    ...authResponse,
    negocio: {
      id: negocio._id,
      nombre: negocio.nombre,
      slug: negocio.slug,
      plan: negocio.plan,
    },
  }
}

export const obtenerNegocioPublicoPorSlug = async (slug) => {
  const negocio = await Negocio.findOne({ slug: slug.toLowerCase().trim(), activo: true })
  if (!negocio) {
    throw conError('Salón no encontrado', 404)
  }

  const [servicios, empleados] = await Promise.all([
    Servicio.find({ negocio: negocio._id, activo: true }).select(
      '_id nombre descripcion precio duracionMinutos'
    ),
    Empleado.find({ negocio: negocio._id, activo: true }).select(
      '_id nombre especialidad telefono email'
    ),
  ])

  return {
    negocio: {
      id: negocio._id,
      nombre: negocio.nombre,
      slug: negocio.slug,
      descripcion: negocio.descripcion,
      direccion: negocio.direccion,
      telefono: negocio.telefono,
      configuracion: negocio.configuracion,
    },
    servicios,
    empleados,
  }
}

export const listarNegociosPublicos = async () => {
  return Negocio.find({ activo: true })
    .select('nombre slug descripcion direccion telefono')
    .sort({ createdAt: -1 })
    .limit(10)
}

export const obtenerMiNegocio = async (negocioId) => {
  if (!negocioId) {
    throw conError('El usuario no tiene un salón vinculado', 404)
  }
  const negocio = await Negocio.findById(negocioId)
  if (!negocio) {
    throw conError('Negocio no encontrado', 404)
  }
  return negocio
}

export const actualizarMiNegocio = async (negocioId, datos) => {
  if (!negocioId) {
    throw conError('El usuario no tiene un salón vinculado', 404)
  }
  const camposPermitidos = ['nombre', 'descripcion', 'direccion', 'telefono', 'configuracion']
  const updates = {}
  for (const campo of camposPermitidos) {
    if (datos[campo] !== undefined) {
      updates[campo] = datos[campo]
    }
  }

  const negocio = await Negocio.findByIdAndUpdate(negocioId, updates, {
    new: true,
    runValidators: true,
  })
  if (!negocio) {
    throw conError('Negocio no encontrado', 404)
  }
  return negocio
}

// ─── Superadmin Services ──────────────────────────────────────────────────────

export const listarTodosLosNegociosSuperadmin = async () => {
  const negocios = await Negocio.find().populate('owner', 'nombre email rol').sort({ createdAt: -1 })

  const resultados = await Promise.all(
    negocios.map(async (neg) => {
      const [turnos, empleados, servicios, clientes] = await Promise.all([
        Turno.countDocuments({ negocio: neg._id }),
        Empleado.countDocuments({ negocio: neg._id }),
        Servicio.countDocuments({ negocio: neg._id }),
        Cliente.countDocuments({ negocio: neg._id }),
      ])
      return {
        ...neg.toObject(),
        metricas: {
          turnos,
          empleados,
          servicios,
          clientes,
        },
      }
    })
  )

  return resultados
}

export const crearNegocioSuperadmin = async ({
  nombre,
  slug,
  emailOwner,
  nombreOwner,
  passwordOwner,
  plan = 'pro',
  descripcion = '',
  direccion = '',
  telefono = '',
  configuracion = {},
}) => {
  if (!nombre || !slug || !emailOwner) {
    throw conError('Nombre, slug y email del dueño son obligatorios', 400)
  }

  const slugNormalizado = slug.toLowerCase().trim()
  const slugExistente = await Negocio.findOne({ slug: slugNormalizado })
  if (slugExistente) {
    throw conError('Ese identificador (slug) ya existe', 409)
  }

  let usuarioOwner = await Usuario.findOne({ email: emailOwner.toLowerCase().trim() })
  if (!usuarioOwner) {
    const passwordFinal = passwordOwner || 'Admin2026!'
    const passwordHasheada = await bcrypt.hash(passwordFinal, SALT_ROUNDS)
    usuarioOwner = await Usuario.create({
      nombre: (nombreOwner || nombre).trim(),
      email: emailOwner.toLowerCase().trim(),
      password: passwordHasheada,
      rol: 'admin',
    })
  }

  const negocio = await Negocio.create({
    nombre: nombre.trim(),
    slug: slugNormalizado,
    descripcion: descripcion.trim(),
    direccion: direccion.trim(),
    telefono: telefono.trim(),
    owner: usuarioOwner._id,
    plan: ['free', 'pro', 'enterprise'].includes(plan) ? plan : 'pro',
    activo: true,
    configuracion: configuracion || {},
  })

  if (!usuarioOwner.negocio) {
    usuarioOwner.negocio = negocio._id
    await usuarioOwner.save()
  }

  // Servicios iniciales
  await Servicio.create([
    {
      negocio: negocio._id,
      nombre: 'Corte Clásico / Fade',
      descripcion: 'Corte completo a tijera y máquina con peinado.',
      precio: 8500,
      duracionMinutos: 30,
      activo: true,
    },
    {
      negocio: negocio._id,
      nombre: 'Perfilado & Ritual de Barba',
      descripcion: 'Toalla caliente, navaja tradicional y bálsamo.',
      precio: 6000,
      duracionMinutos: 25,
      activo: true,
    },
  ])

  // Empleado inicial
  await Empleado.create({
    negocio: negocio._id,
    nombre: usuarioOwner.nombre,
    especialidad: 'Master Barber / Estilista',
    telefono: telefono.trim(),
    email: usuarioOwner.email,
    usuario: usuarioOwner._id,
    activo: true,
  })

  return Negocio.findById(negocio._id).populate('owner', 'nombre email rol')
}

export const actualizarNegocioSuperadmin = async (id, datos) => {
  const camposPermitidos = [
    'nombre',
    'slug',
    'descripcion',
    'direccion',
    'telefono',
    'plan',
    'activo',
    'configuracion',
  ]
  const updates = {}
  for (const campo of camposPermitidos) {
    if (datos[campo] !== undefined) {
      if (campo === 'slug') updates[campo] = datos[campo].toLowerCase().trim()
      else updates[campo] = datos[campo]
    }
  }

  const negocio = await Negocio.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  }).populate('owner', 'nombre email rol')

  if (!negocio) {
    throw conError('Negocio no encontrado', 404)
  }
  return negocio
}

export const toggleEstadoNegocioSuperadmin = async (id) => {
  const negocio = await Negocio.findById(id)
  if (!negocio) throw conError('Negocio no encontrado', 404)
  negocio.activo = !negocio.activo
  await negocio.save()
  return Negocio.findById(id).populate('owner', 'nombre email rol')
}

export const eliminarNegocioSuperadmin = async (id) => {
  const negocio = await Negocio.findByIdAndDelete(id)
  if (!negocio) throw conError('Negocio no encontrado', 404)
  return negocio
}
