import * as turnoService from '../services/turno.service.js'
import { Cliente } from '../models/Cliente.js'
import { Usuario } from '../models/Usuario.js'

const obtenerClienteDelUsuario = async (req) => {
  let cliente = await Cliente.findOne({ usuario: req.usuario.id })
  if (!cliente) {
    const usuario = await Usuario.findById(req.usuario.id)
    if (!usuario) return null
    if (usuario.email) {
      cliente = await Cliente.findOne({
        email: usuario.email.toLowerCase(),
        $or: [{ usuario: null }, { usuario: { $exists: false } }],
      })
    }
    if (cliente) {
      cliente.usuario = usuario._id
      await cliente.save()
    } else {
      cliente = await Cliente.create({
        nombre: usuario.nombre || 'Cliente',
        email: usuario.email || '',
        usuario: usuario._id,
        negocio: usuario.negocio || null,
      })
    }
  }
  return cliente
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
    let clienteId = req.body.cliente
    if (req.usuario.rol === 'cliente') {
      const miCliente = await obtenerClienteDelUsuario(req)
      if (!miCliente) {
        return res.status(400).json({
          error: 'No tenés un perfil de cliente vinculado.',
        })
      }
      if (clienteId && String(clienteId) !== String(miCliente._id)) {
        return res.status(403).json({ error: 'No podés crear turnos para otros clientes' })
      }
      clienteId = miCliente._id
    } else if (!clienteId) {
      const miPerfil = await obtenerClienteDelUsuario(req)
      if (miPerfil) clienteId = miPerfil._id
    }

    if (!clienteId) {
      return res.status(400).json({ error: 'El campo cliente es obligatorio' })
    }

    const turno = await turnoService.crearTurno({
      ...req.body,
      cliente: clienteId,
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
