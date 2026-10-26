import { Turno } from '../models/Turno.js'
import { Cliente } from '../models/Cliente.js'
import { Empleado } from '../models/Empleado.js'
import { Servicio } from '../models/Servicio.js'

const POBLAR = [
  { path: 'cliente', select: 'nombre email telefono' },
  { path: 'empleado', select: 'nombre especialidad' },
  { path: 'servicio', select: 'nombre precio duracionMinutos' },
  { path: 'negocio', select: 'nombre slug' },
]

const locksPorEmpleado = new Map()

const conBloqueoEmpleado = async (empleadoId, accion) => {
  const clave = String(empleadoId)
  const lockAnterior = locksPorEmpleado.get(clave) || Promise.resolve()

  let resolverLock
  const nuevoLock = new Promise((resolve) => {
    resolverLock = resolve
  })
  locksPorEmpleado.set(clave, nuevoLock)

  try {
    await lockAnterior
    return await accion()
  } finally {
    resolverLock()
    if (locksPorEmpleado.get(clave) === nuevoLock) {
      locksPorEmpleado.delete(clave)
    }
  }
}

export const listarTurnos = async ({
  clienteId,
  empleadoId,
  negocioId,
  estado,
  desde,
  hasta,
  page,
  limit,
} = {}) => {
  const filtro = {}
  if (clienteId) filtro.cliente = clienteId
  if (empleadoId) filtro.empleado = empleadoId
  if (negocioId) filtro.negocio = negocioId
  if (estado) filtro.estado = estado
  if (desde || hasta) {
    filtro.fechaHora = {}
    if (desde) filtro.fechaHora.$gte = new Date(desde)
    if (hasta) filtro.fechaHora.$lte = new Date(hasta)
  }

  if (page) {
    const pagina = Math.max(1, parseInt(page, 10) || 1)
    const limite = Math.max(1, Math.min(100, parseInt(limit, 10) || 10))
    const skip = (pagina - 1) * limite

    const [total, datos] = await Promise.all([
      Turno.countDocuments(filtro),
      Turno.find(filtro)
        .populate(POBLAR)
        .sort({ fechaHora: 1 })
        .skip(skip)
        .limit(limite),
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

  return Turno.find(filtro).populate(POBLAR).sort({ fechaHora: 1 })
}

export const obtenerTurno = async (id) => {
  const turno = await Turno.findById(id).populate(POBLAR)
  if (!turno) throw conError('Turno no encontrado', 404)
  return turno
}

export const crearTurno = async (datos) => {
  const [cliente, empleado, servicio] = await Promise.all([
    Cliente.findById(datos.cliente),
    Empleado.findById(datos.empleado),
    Servicio.findById(datos.servicio),
  ])
  if (!cliente) throw conError('Cliente no encontrado', 404)
  if (!empleado) throw conError('Empleado no encontrado', 404)
  if (!servicio) throw conError('Servicio no encontrado', 404)

  const inicio = new Date(datos.fechaHora)
  if (isNaN(inicio.getTime())) {
    throw conError('Fecha u hora inválida', 400)
  }
  if (inicio.getTime() < Date.now()) {
    throw conError('No se pueden reservar turnos en el pasado', 400)
  }

  const duracionMinutos = datos.duracionMinutos || servicio.duracionMinutos
  const precioCobrado = datos.precioCobrado != null ? datos.precioCobrado : servicio.precio
  const fin = new Date(inicio.getTime() + duracionMinutos * 60_000)
  const negocio = datos.negocio || servicio.negocio || empleado.negocio || null

  return conBloqueoEmpleado(datos.empleado, async () => {
    if (await hayTurnoSuperpuesto({ empleadoId: datos.empleado, inicio, fin })) {
      throw conError('El empleado ya tiene un turno en ese horario', 409)
    }

    const payload = {
      ...datos,
      negocio,
      duracionMinutos,
      precioCobrado,
      fechaHoraFin: fin,
      googleCalendarEventId: empleado.googleSyncActivo
        ? `gcal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
        : null,
    }

    const turno = await Turno.create(payload)
    return Turno.findById(turno._id).populate(POBLAR)
  })
}

export const cancelarTurno = async (id, { usuarioId, rol } = {}) => {
  const turno = await Turno.findById(id).populate('cliente')
  if (!turno) throw conError('Turno no encontrado', 404)

  if (turno.estado === 'cancelado') {
    throw conError('El turno ya se encuentra cancelado', 400)
  }
  if (turno.estado === 'completado') {
    throw conError('No se puede cancelar un turno ya completado', 400)
  }

  if (rol === 'cliente') {
    if (!usuarioId || !turno.cliente?.usuario || String(turno.cliente.usuario) !== String(usuarioId)) {
      throw conError('No podés cancelar turnos de otros clientes', 403)
    }

    let HORAS_MINIMAS = 2
    if (turno.negocio) {
      const { Negocio } = await import('../models/Negocio.js')
      const negDoc = await Negocio.findById(turno.negocio)
      if (negDoc?.configuracion?.cancelacionMinimaHoras != null) {
        HORAS_MINIMAS = negDoc.configuracion.cancelacionMinimaHoras
      }
    }
    const tiempoLimite = Date.now() + HORAS_MINIMAS * 60 * 60 * 1000
    if (new Date(turno.fechaHora).getTime() < tiempoLimite) {
      throw conError(
        `Las cancelaciones deben realizarse con al menos ${HORAS_MINIMAS} horas de anticipación`,
        400
      )
    }
  }

  turno.estado = 'cancelado'
  await turno.save()
  return Turno.findById(turno._id).populate(POBLAR)
}

export const actualizarTurno = async (id, datos) => {
  const turnoActual = await Turno.findById(id)
  if (!turnoActual) throw conError('Turno no encontrado', 404)

  const empleadoId = datos.empleado || turnoActual.empleado
  const servicioId = datos.servicio || turnoActual.servicio
  const inicio = datos.fechaHora ? new Date(datos.fechaHora) : turnoActual.fechaHora

  let duracionMinutos = turnoActual.duracionMinutos
  let precioCobrado = turnoActual.precioCobrado

  if (datos.servicio && String(datos.servicio) !== String(turnoActual.servicio)) {
    const nuevoServicio = await Servicio.findById(datos.servicio)
    if (!nuevoServicio) throw conError('Servicio no encontrado', 404)
    duracionMinutos = datos.duracionMinutos || nuevoServicio.duracionMinutos
    precioCobrado = datos.precioCobrado != null ? datos.precioCobrado : nuevoServicio.precio
  } else {
    if (datos.duracionMinutos != null) duracionMinutos = datos.duracionMinutos
    if (datos.precioCobrado != null) precioCobrado = datos.precioCobrado
  }

  const fin = new Date(new Date(inicio).getTime() + duracionMinutos * 60_000)

  return conBloqueoEmpleado(empleadoId, async () => {
    const hayConflicto = await hayTurnoSuperpuesto({
      empleadoId,
      inicio,
      fin,
      turnoIdIgnorado: id,
    })

    if (hayConflicto) {
      throw conError('El empleado ya tiene un turno en ese horario', 409)
    }

    const payload = {
      ...datos,
      duracionMinutos,
      precioCobrado,
      fechaHoraFin: fin,
    }

    const actualizado = await Turno.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    }).populate(POBLAR)

    return actualizado
  })
}

export const cambiarEstadoTurno = async (id, nuevoEstado) => {
  const turno = await Turno.findById(id)
  if (!turno) throw conError('Turno no encontrado', 404)

  turno.estado = nuevoEstado
  await turno.save()
  return Turno.findById(id).populate(POBLAR)
}

export const eliminarTurno = async (id) => {
  const turno = await Turno.findByIdAndDelete(id)
  if (!turno) throw conError('Turno no encontrado', 404)
  return turno
}

export const hayTurnoSuperpuesto = async ({
  empleadoId,
  inicio,
  fin,
  turnoIdIgnorado = null,
}) => {
  const fechaInicio = new Date(inicio)
  const fechaFin = new Date(fin)

  // Chequeo de colisión con eventos externos de Google Calendar del barbero
  const empleadoDoc = await Empleado.findById(empleadoId)
  if (empleadoDoc?.googleSyncActivo && empleadoDoc.eventosGoogle?.length) {
    const hayConflictoGoogle = empleadoDoc.eventosGoogle.some((ev) => {
      const evInicio = new Date(ev.inicio)
      const evFin = new Date(ev.fin)
      return fechaInicio < evFin && evInicio < fechaFin
    })
    if (hayConflictoGoogle) return true
  }

  const filtro = {
    empleado: empleadoId,
    estado: { $ne: 'cancelado' },
    fechaHora: { $lt: fechaFin },
    $or: [
      { fechaHoraFin: { $gt: fechaInicio } },
      { fechaHoraFin: { $exists: false } },
    ],
  }

  if (turnoIdIgnorado) {
    filtro._id = { $ne: turnoIdIgnorado }
  }

  const candidatos = await Turno.find(filtro).populate('servicio')

  return candidatos.some((t) => {
    const tInicio = new Date(t.fechaHora)
    const tFin = t.fechaHoraFin
      ? new Date(t.fechaHoraFin)
      : new Date(tInicio.getTime() + (t.duracionMinutos || t.servicio?.duracionMinutos || 30) * 60_000)
    return fechaInicio < tFin && tInicio < fechaFin
  })
}

const conError = (mensaje, status) => {
  const err = new Error(mensaje)
  err.status = status
  return err
}
