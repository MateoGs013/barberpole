import * as turnoService from '../services/turno.service.js'
import { Cliente } from '../models/Cliente.js'

const obtenerClienteDelUsuario = async (req) => {
  if (req.usuario.rol !== 'cliente') return null
  return Cliente.findOne({ usuario: req.usuario.id })
}

export const listar = async (req, res, next) => {
  try {
    const filtros = {
      empleadoId: req.query.empleadoId,
      clienteId: req.query.clienteId,
      negocioId: req.negocioId || req.query.negocioId,
      estado: req.query.estado,
      desde: req.query.desde,
      hasta: req.query.hasta,
      page: req.query.page,
      limit: req.query.limit,
    }
    if (req.usuario.rol === 'cliente') {
      const miCliente = await obtenerClienteDelUsuario(req)
      if (!miCliente) {
        return res.json(
          req.query.page
            ? { datos: [], paginacion: { total: 0, pagina: 1, limite: 10, totalPaginas: 1 } }
            : []
        )
      }
      filtros.clienteId = miCliente._id
    }
    const turnos = await turnoService.listarTurnos(filtros)
    res.json(turnos)
  } catch (error) {
    next(error)
  }
}

export const obtener = async (req, res, next) => {
  try {
    const turno = await turnoService.obtenerTurno(req.params.id)
    if (req.usuario.rol === 'cliente') {
      const miCliente = await obtenerClienteDelUsuario(req)
      if (!miCliente || String(turno.cliente._id) !== String(miCliente._id)) {
        return res.status(403).json({ error: 'No podés ver turnos de otros clientes' })
      }
    }
    res.json(turno)
  } catch (error) {
    next(error)
  }
}

export const crear = async (req, res, next) => {
  try {
    if (req.usuario.rol === 'cliente') {
      const miCliente = await obtenerClienteDelUsuario(req)
      if (!miCliente) {
        return res.status(400).json({
          error: 'No tenés un perfil de cliente vinculado. Pedile al admin que lo cree.',
        })
      }
      if (String(req.body.cliente) !== String(miCliente._id)) {
        return res.status(403).json({ error: 'No podés crear turnos para otros clientes' })
      }
    }
    const turno = await turnoService.crearTurno({
      ...req.body,
      negocio: req.body.negocio || req.negocioId,
    })
    res.status(201).json(turno)
  } catch (error) {
    next(error)
  }
}

export const cancelar = async (req, res, next) => {
  try {
    const turno = await turnoService.cancelarTurno(req.params.id, {
      usuarioId: req.usuario.id,
      rol: req.usuario.rol,
    })
    res.json(turno)
  } catch (error) {
    next(error)
  }
}

export const actualizar = async (req, res, next) => {
  try {
    const turno = await turnoService.actualizarTurno(req.params.id, req.body)
    res.json(turno)
  } catch (error) {
    next(error)
  }
}

export const eliminar = async (req, res, next) => {
  try {
    const turno = await turnoService.eliminarTurno(req.params.id)
    res.json(turno)
  } catch (error) {
    next(error)
  }
}
