// Lógica de negocio de Empleados.

import { Empleado } from '../models/Empleado.js'
import { Turno } from '../models/Turno.js'
import { Servicio } from '../models/Servicio.js'

// populate('usuario', 'nombre email rol') reemplaza el ObjectId del campo
// "usuario" por un objeto con esos campos del documento User referenciado.
// Es como un JOIN pero a nivel aplicación.
const POBLAR_USUARIO = { path: 'usuario', select: 'nombre email rol' }

export const listarEmpleados = async ({ soloActivos = false, negocioId } = {}) => {
  const filtro = soloActivos ? { activo: true } : {}
  if (negocioId) filtro.negocio = negocioId
  return Empleado.find(filtro).populate(POBLAR_USUARIO).sort({ createdAt: -1 })
}

export const obtenerEmpleado = async (id) => {
  const empleado = await Empleado.findById(id).populate(POBLAR_USUARIO)
  if (!empleado) throw conError('Empleado no encontrado', 404)
  return empleado
}

export const crearEmpleado = async (datos) => {
  return Empleado.create(datos)
}

export const actualizarEmpleado = async (id, datos) => {
  const empleado = await Empleado.findByIdAndUpdate(id, datos, {
    new: true,
    runValidators: true,
  }).populate(POBLAR_USUARIO)
  if (!empleado) throw conError('Empleado no encontrado', 404)
  return empleado
}

export const eliminarEmpleado = async (id) => {
  const empleado = await Empleado.findByIdAndDelete(id)
  if (!empleado) throw conError('Empleado no encontrado', 404)
  return empleado
}

export const conectarGoogleCalendar = async (empleadoId, { email, eventosIniciales = [] } = {}) => {
  const empleado = await Empleado.findById(empleadoId)
  if (!empleado) throw conError('Empleado no encontrado', 404)

  empleado.googleSyncActivo = true
  empleado.googleCalendarId = email || empleado.email || 'primary'
  if (Array.isArray(eventosIniciales) && eventosIniciales.length > 0) {
    empleado.eventosGoogle = eventosIniciales
  }
  await empleado.save()
  return empleado
}

export const desconectarGoogleCalendar = async (empleadoId) => {
  const empleado = await Empleado.findById(empleadoId)
  if (!empleado) throw conError('Empleado no encontrado', 404)

  empleado.googleSyncActivo = false
  empleado.eventosGoogle = []
  await empleado.save()
  return empleado
}

export const bloquearHorarioGoogle = async (empleadoId, { titulo, inicio, fin }) => {
  const empleado = await Empleado.findById(empleadoId)
  if (!empleado) throw conError('Empleado no encontrado', 404)

  const fechaInicio = new Date(inicio)
  const fechaFin = new Date(fin)
  if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
    throw conError('Fechas de inicio y fin inválidas', 400)
  }
  if (fechaFin <= fechaInicio) {
    throw conError('La fecha de fin debe ser posterior al inicio', 400)
  }

  empleado.eventosGoogle.push({
    titulo: titulo || 'Bloqueo Google Calendar',
    inicio: fechaInicio,
    fin: fechaFin,
    googleEventId: `gevt_${Date.now()}`,
  })
  await empleado.save()
  return empleado
}

export const desbloquearHorarioGoogle = async (empleadoId, eventId) => {
  const empleado = await Empleado.findById(empleadoId)
  if (!empleado) throw conError('Empleado no encontrado', 404)

  empleado.eventosGoogle = empleado.eventosGoogle.filter(
    (e) => String(e._id) !== String(eventId) && e.googleEventId !== eventId
  )
  await empleado.save()
  return empleado
}

export const obtenerDisponibilidad = async (
  empleadoId,
  { fecha, servicioId, bufferMinutos = 0, timezoneOffset = null }
) => {
  const empleado = await Empleado.findById(empleadoId)
  if (!empleado) throw conError('Empleado no encontrado', 404)
  if (!empleado.activo) throw conError('El empleado no está activo', 400)

  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    throw conError('La fecha debe tener formato YYYY-MM-DD', 400)
  }

  let duracion = 30
  let servicioDoc = null
  if (servicioId) {
    servicioDoc = await Servicio.findById(servicioId)
    if (!servicioDoc) throw conError('Servicio no encontrado', 404)
    duracion = servicioDoc.duracionMinutos
  }

  // Horario de atención: 09:00 a 20:00 (por defecto o configurado por el negocio)
  let horaInicio = 9
  let horaCierre = 20
  let intervaloMinutos = 30
  let buffer = Number(bufferMinutos) || 0

  if (empleado.negocio) {
    const { Negocio } = await import('../models/Negocio.js')
    const negDoc = await Negocio.findById(empleado.negocio)
    if (negDoc?.configuracion) {
      if (negDoc.configuracion.horaApertura) {
        horaInicio = parseInt(negDoc.configuracion.horaApertura.split(':')[0], 10) || 9
      }
      if (negDoc.configuracion.horaCierre) {
        horaCierre = parseInt(negDoc.configuracion.horaCierre.split(':')[0], 10) || 20
      }
      if (negDoc.configuracion.intervaloMinutos) {
        intervaloMinutos = negDoc.configuracion.intervaloMinutos
      }
      if (buffer === 0 && negDoc.configuracion.bufferMinutos) {
        buffer = negDoc.configuracion.bufferMinutos
      }
    }
  }
  const horaFin = horaCierre - 1

  // Rango de búsqueda en DB: día con margen de 12hs para cubrir zonas horarias
  const offsetMin =
    timezoneOffset != null && !isNaN(Number(timezoneOffset)) ? Number(timezoneOffset) : null
  const [año, mes, dia] = fecha.split('-').map(Number)

  let inicioDia, finDia
  if (offsetMin !== null) {
    inicioDia = new Date(Date.UTC(año, mes - 1, dia, 0, 0, 0) + offsetMin * 60_000)
    finDia = new Date(Date.UTC(año, mes - 1, dia, 23, 59, 59) + offsetMin * 60_000)
  } else {
    inicioDia = new Date(`${fecha}T00:00:00`)
    finDia = new Date(`${fecha}T23:59:59`)
  }

  const ventanaDesde = new Date(inicioDia.getTime() - 12 * 60 * 60 * 1000)
  const ventanaHasta = new Date(finDia.getTime() + 12 * 60 * 60 * 1000)

  const turnosExistentes = await Turno.find({
    empleado: empleadoId,
    estado: { $ne: 'cancelado' },
    fechaHora: { $gte: ventanaDesde, $lte: ventanaHasta },
  }).populate('servicio')

  const ahora = Date.now()
  const slots = []

  for (let h = horaInicio; h <= horaFin; h++) {
    for (let m = 0; m < 60; m += intervaloMinutos) {
      if (h === horaFin && m > 30) break
      const horaStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`

      let slotInicio
      if (offsetMin !== null) {
        slotInicio = new Date(Date.UTC(año, mes - 1, dia, h, m, 0) + offsetMin * 60_000)
      } else {
        slotInicio = new Date(`${fecha}T${horaStr}:00`)
      }

      const duracionTotal = duracion + buffer
      const slotFin = new Date(slotInicio.getTime() + duracionTotal * 60_000)

      // Cierre del local: si excede la hora de cierre (20:00)
      let tiempoCierreLocal
      if (offsetMin !== null) {
        tiempoCierreLocal = new Date(Date.UTC(año, mes - 1, dia, horaCierre, 0, 0) + offsetMin * 60_000)
      } else {
        tiempoCierreLocal = new Date(`${fecha}T${String(horaCierre).padStart(2, '0')}:00:00`)
      }

      let disponible = true
      let motivo = null

      if (slotInicio.getTime() <= ahora) {
        disponible = false
        motivo = 'Horario pasado'
      } else if (slotFin.getTime() > tiempoCierreLocal.getTime()) {
        disponible = false
        motivo = 'Excede horario de atención'
      } else {
        // Verificar turnos del sistema
        for (const t of turnosExistentes) {
          const tInicio = new Date(t.fechaHora)
          const duracionExistente = t.duracionMinutos || t.servicio?.duracionMinutos || 30
          const tFin = t.fechaHoraFin
            ? new Date(t.fechaHoraFin)
            : new Date(tInicio.getTime() + duracionExistente * 60_000)

          if (slotInicio.getTime() < tFin.getTime() && slotFin.getTime() > tInicio.getTime()) {
            disponible = false
            motivo = 'Ocupado'
            break
          }
        }

        // Sincronización Bidireccional: Bloquear por eventos de Google Calendar del barbero
        if (disponible && empleado.googleSyncActivo && empleado.eventosGoogle?.length) {
          for (const ev of empleado.eventosGoogle) {
            const evInicio = new Date(ev.inicio)
            const evFin = new Date(ev.fin)
            if (slotInicio.getTime() < evFin.getTime() && slotFin.getTime() > evInicio.getTime()) {
              disponible = false
              motivo = 'Ocupado (Google Calendar)'
              break
            }
          }
        }
      }

      slots.push({
        hora: horaStr,
        fechaHora: slotInicio.toISOString(),
        disponible,
        motivo,
      })
    }
  }

  return {
    fecha,
    empleado: {
      id: empleado._id,
      nombre: empleado.nombre,
      especialidad: empleado.especialidad,
      googleSyncActivo: empleado.googleSyncActivo,
    },
    servicio: servicioDoc
      ? {
          id: servicioDoc._id,
          nombre: servicioDoc.nombre,
          duracionMinutos: servicioDoc.duracionMinutos,
          precio: servicioDoc.precio,
        }
      : null,
    duracionTotalMinutos: duracion + buffer,
    slots,
  }
}

const conError = (mensaje, status) => {
  const error = new Error(mensaje)
  error.status = status
  return error
}
