import { Empleado } from '../models/Empleado.js'
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
    const emp = await Empleado.findById(req.params.id)
    if (!emp) return res.status(404).json({ error: 'Empleado no encontrado' })

    if (req.usuario.rol === 'empleado' && String(emp.usuario) !== String(req.usuario.id)) {
      return res.status(403).json({ error: 'Solo podés gestionar tu propio Google Calendar' })
    }
    if (req.usuario.rol === 'admin' && req.negocioId && String(emp.negocio) !== String(req.negocioId)) {
      return res.status(403).json({ error: 'No podés gestionar empleados de otro negocio' })
    }

    const empleado = await empleadoService.conectarGoogleCalendar(req.params.id, req.body)
    res.json(empleado)
  } catch (error) {
    next(error)
  }
}

export const desconectarGoogle = async (req, res, next) => {
  try {
    const emp = await Empleado.findById(req.params.id)
    if (!emp) return res.status(404).json({ error: 'Empleado no encontrado' })

    if (req.usuario.rol === 'empleado' && String(emp.usuario) !== String(req.usuario.id)) {
      return res.status(403).json({ error: 'Solo podés gestionar tu propio Google Calendar' })
    }
    if (req.usuario.rol === 'admin' && req.negocioId && String(emp.negocio) !== String(req.negocioId)) {
      return res.status(403).json({ error: 'No podés gestionar empleados de otro negocio' })
    }

    const empleado = await empleadoService.desconectarGoogleCalendar(req.params.id)
    res.json(empleado)
  } catch (error) {
    next(error)
  }
}

export const bloquearGoogle = async (req, res, next) => {
  try {
    const emp = await Empleado.findById(req.params.id)
    if (!emp) return res.status(404).json({ error: 'Empleado no encontrado' })

    if (req.usuario.rol === 'empleado' && String(emp.usuario) !== String(req.usuario.id)) {
      return res.status(403).json({ error: 'Solo podés gestionar tu propio Google Calendar' })
    }
    if (req.usuario.rol === 'admin' && req.negocioId && String(emp.negocio) !== String(req.negocioId)) {
      return res.status(403).json({ error: 'No podés gestionar empleados de otro negocio' })
    }

    const empleado = await empleadoService.bloquearHorarioGoogle(req.params.id, req.body)
    res.json(empleado)
  } catch (error) {
    next(error)
  }
}

export const desbloquearGoogle = async (req, res, next) => {
  try {
    const emp = await Empleado.findById(req.params.id)
    if (!emp) return res.status(404).json({ error: 'Empleado no encontrado' })

    if (req.usuario.rol === 'empleado' && String(emp.usuario) !== String(req.usuario.id)) {
      return res.status(403).json({ error: 'Solo podés gestionar tu propio Google Calendar' })
    }
    if (req.usuario.rol === 'admin' && req.negocioId && String(emp.negocio) !== String(req.negocioId)) {
      return res.status(403).json({ error: 'No podés gestionar empleados de otro negocio' })
    }

    const empleado = await empleadoService.desbloquearHorarioGoogle(
      req.params.id,
      req.params.eventId
    )
    res.json(empleado)
  } catch (error) {
    next(error)
  }
}

export const obtenerAuthUrlGoogle = async (req, res, next) => {
  try {
    const { generarAuthUrl } = await import('../services/google-calendar.service.js')
    const url = generarAuthUrl(req.params.id, req.query.redirectUri)
    res.json({ url })
  } catch (error) {
    next(error)
  }
}

export const callbackGoogle = async (req, res, next) => {
  try {
    const { canjearCodigoYVincular } = await import('../services/google-calendar.service.js')
    const empleado = await canjearCodigoYVincular({
      code: req.body.code,
      empleadoId: req.params.id,
      customRedirectUri: req.body.redirectUri,
    })
    res.json(empleado)
  } catch (error) {
    next(error)
  }
}
