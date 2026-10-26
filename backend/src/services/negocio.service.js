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

const SERVICIOS_POR_RUBRO = {
  barberia: [
    {
      nombre: 'Corte Clásico / Fade',
      descripcion: 'Corte completo a tijera y máquina con peinado.',
      precio: 8500,
      duracionMinutos: 30,
    },
    {
      nombre: 'Perfilado & Ritual de Barba',
      descripcion: 'Toalla caliente, navaja tradicional y bálsamo.',
      precio: 6000,
      duracionMinutos: 25,
    },
  ],
  estetica: [
    {
      nombre: 'Manicuría Integral / Semipermanente',
      descripcion: 'Preparación, esmaltado y tratamiento hidratante.',
      precio: 7500,
      duracionMinutos: 45,
    },
    {
      nombre: 'Perfilado & Diseño de Mirada',
      descripcion: 'Lifting de pestañas y perfilado de cejas.',
      precio: 6500,
      duracionMinutos: 30,
    },
  ],
  salud: [
    {
      nombre: 'Consulta Diagnóstica / Primera Vez',
      descripcion: 'Evaluación personalizada e historia clínica.',
      precio: 12000,
      duracionMinutos: 45,
    },
    {
      nombre: 'Sesión de Tratamiento & Seguimiento',
      descripcion: 'Control evolutivo y plan de acción terapéutico.',
      precio: 9500,
      duracionMinutos: 30,
    },
  ],
  servicios: [
    {
      nombre: 'Diagnóstico & Presupuesto Técnico',
      descripcion: 'Revisión exhaustiva y cotización detallada.',
      precio: 5000,
      duracionMinutos: 30,
    },
    {
      nombre: 'Servicio Estándar Programado',
      descripcion: 'Ejecución integral del trabajo acordado.',
      precio: 15000,
      duracionMinutos: 60,
    },
  ],
  otro: [
    {
      nombre: 'Sesión Estándar',
      descripcion: 'Servicio individual por turno reservado.',
      precio: 8000,
      duracionMinutos: 30,
    },
    {
      nombre: 'Sesión Extendida / Completa',
      descripcion: 'Atención personalizada de mayor duración.',
      precio: 12000,
      duracionMinutos: 60,
    },
  ],
}

const ESPECIALIDAD_POR_RUBRO = {
  barberia: 'Barbero Principal / Estilista',
  estetica: 'Especialista en Estética & Belleza',
  salud: 'Profesional de la Salud / Terapeuta',
  servicios: 'Especialista Técnico / Consultor',
  otro: 'Profesional a cargo',
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
  rubro = 'barberia',
  modalidad = 'local',
  direccionPrivada = false,
}) => {
  // Validar unicidad de slug
  const slugNormalizado = slug.toLowerCase().trim()
  const slugOcupado = await Negocio.findOne({ slug: slugNormalizado })
  if (slugOcupado) {
    throw conError('Ese identificador (slug) ya está registrado. Elegí otro.', 409)
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
    const rubroValido = ['barberia', 'estetica', 'salud', 'servicios', 'otro'].includes(rubro)
      ? rubro
      : 'barberia'
    const modalidadValida = ['local', 'particular'].includes(modalidad) ? modalidad : 'local'

    negocio = await Negocio.create({
      nombre: nombreNegocio.trim(),
      slug: slugNormalizado,
      rubro: rubroValido,
      modalidad: modalidadValida,
      descripcion: descripcion.trim(),
      direccion: direccion.trim(),
      telefono: telefono.trim(),
      owner: usuario._id,
      plan: ['free', 'pro', 'enterprise'].includes(plan) ? plan : 'free',
      activo: true,
      configuracion: {
        direccionPrivada: Boolean(direccionPrivada),
      },
    })

    // Vincular negocio al usuario
    usuario.negocio = negocio._id
    await usuario.save()

    // Sembrar servicios iniciales de cortesía adaptados al rubro
    const serviciosBase = SERVICIOS_POR_RUBRO[rubroValido] || SERVICIOS_POR_RUBRO.barberia
    await Servicio.create(
      serviciosBase.map((s) => ({
        ...s,
        negocio: negocio._id,
        activo: true,
      }))
    )

    // Crear profesional inicial adaptado a la modalidad y rubro
    await Empleado.create({
      negocio: negocio._id,
      nombre: nombreOwner.trim(),
      especialidad: ESPECIALIDAD_POR_RUBRO[rubroValido] || 'Profesional a cargo',
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
      rubro: negocio.rubro,
      modalidad: negocio.modalidad,
      plan: negocio.plan,
    },
  }
}

export const obtenerNegocioPublicoPorSlug = async (slug) => {
  const negocio = await Negocio.findOne({ slug: slug.toLowerCase().trim(), activo: true })
  if (!negocio) {
    throw conError('Salón o estudio no encontrado', 404)
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
      rubro: negocio.rubro,
      modalidad: negocio.modalidad,
      descripcion: negocio.descripcion,
      direccion: negocio.configuracion?.direccionPrivada
        ? 'Dirección confidencial — Se envía tras confirmar'
        : negocio.direccion,
      telefono: negocio.telefono,
      configuracion: negocio.configuracion,
    },
    servicios,
    empleados,
  }
}

export const listarNegociosPublicos = async () => {
  return Negocio.find({ activo: true })
    .select('nombre slug rubro modalidad descripcion direccion telefono configuracion')
    .sort({ createdAt: -1 })
    .limit(10)
}

export const obtenerMiNegocio = async (negocioId) => {
  if (!negocioId) {
    throw conError('El usuario no tiene un negocio vinculado', 404)
  }
  const negocio = await Negocio.findById(negocioId)
  if (!negocio) {
    throw conError('Negocio no encontrado', 404)
  }
  return negocio
}

export const actualizarMiNegocio = async (negocioId, datos) => {
  if (!negocioId) {
    throw conError('El usuario no tiene un negocio vinculado', 404)
  }
  const camposPermitidos = [
    'nombre',
    'rubro',
    'modalidad',
    'descripcion',
    'direccion',
    'telefono',
    'configuracion',
  ]
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
  rubro = 'barberia',
  modalidad = 'local',
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

  const rubroValido = ['barberia', 'estetica', 'salud', 'servicios', 'otro'].includes(rubro)
    ? rubro
    : 'barberia'
  const modalidadValida = ['local', 'particular'].includes(modalidad) ? modalidad : 'local'

  const negocio = await Negocio.create({
    nombre: nombre.trim(),
    slug: slugNormalizado,
    rubro: rubroValido,
    modalidad: modalidadValida,
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

  // Servicios iniciales según rubro
  const serviciosBase = SERVICIOS_POR_RUBRO[rubroValido] || SERVICIOS_POR_RUBRO.barberia
  await Servicio.create(
    serviciosBase.map((s) => ({
      ...s,
      negocio: negocio._id,
      activo: true,
    }))
  )

  // Empleado inicial
  await Empleado.create({
    negocio: negocio._id,
    nombre: usuarioOwner.nombre,
    especialidad: ESPECIALIDAD_POR_RUBRO[rubroValido] || 'Profesional a cargo',
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
    'rubro',
    'modalidad',
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
