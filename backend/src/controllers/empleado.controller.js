import * as empleadoService from '../services/empleado.service.js'

export const listar = async (req, res, next) => {
  try {
    const soloActivos = req.query.activos === 'true'
    const negocioId = req.negocioId || req.query.negocioId
    const empleados = await empleadoService.listarEmpleados({ soloActivos, negocioId })
    res.json(empleados)
  } catch (error) {
    next(error)
  }
}

export const obtener = async (req, res, next) => {
  try {
    const empleado = await empleadoService.obtenerEmpleado(req.params.id)
    res.json(empleado)
  } catch (error) {
    next(error)
  }
}

export const disponibilidad = async (req, res, next) => {
  try {
    const data = await empleadoService.obtenerDisponibilidad(req.params.id, {
      fecha: req.query.fecha,
      servicioId: req.query.servicioId,
      bufferMinutos: req.query.bufferMinutos,
      timezoneOffset: req.query.timezoneOffset,
    })
    res.json(data)
  } catch (error) {
    next(error)
  }
}

export const crear = async (req, res, next) => {
  try {
    const empleado = await empleadoService.crearEmpleado({
      ...req.body,
      negocio: req.body.negocio || req.negocioId,
    })
    res.status(201).json(empleado)
  } catch (error) {
    next(error)
  }
}

export const actualizar = async (req, res, next) => {
  try {
    const empleado = await empleadoService.actualizarEmpleado(req.params.id, req.body)
    res.json(empleado)
  } catch (error) {
    next(error)
  }
}

export const eliminar = async (req, res, next) => {
  try {
    await empleadoService.eliminarEmpleado(req.params.id)
    res.status(204).end()
  } catch (error) {
    next(error)
  }
}

export const conectarGoogle = async (req, res, next) => {
  try {
    const empleado = await empleadoService.conectarGoogleCalendar(req.params.id, req.body)
    res.json(empleado)
  } catch (error) {
    next(error)
  }
}

export const desconectarGoogle = async (req, res, next) => {
  try {
    const empleado = await empleadoService.desconectarGoogleCalendar(req.params.id)
    res.json(empleado)
  } catch (error) {
    next(error)
  }
}

export const bloquearGoogle = async (req, res, next) => {
  try {
    const empleado = await empleadoService.bloquearHorarioGoogle(req.params.id, req.body)
    res.json(empleado)
  } catch (error) {
    next(error)
  }
}

export const desbloquearGoogle = async (req, res, next) => {
  try {
    const empleado = await empleadoService.desbloquearHorarioGoogle(
      req.params.id,
      req.params.eventId
    )
    res.json(empleado)
  } catch (error) {
    next(error)
  }
}
