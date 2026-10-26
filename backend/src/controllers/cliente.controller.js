import * as clienteService from '../services/cliente.service.js'

export const listar = async (req, res, next) => {
  try {
    const clientes = await clienteService.listarClientes({
      busqueda: req.query.q || '',
      negocioId: req.negocioId || req.query.negocioId,
      page: req.query.page,
      limit: req.query.limit,
    })
    res.json(clientes)
  } catch (error) {
    next(error)
  }
}

export const obtener = async (req, res, next) => {
  try {
    const cliente = await clienteService.obtenerCliente(req.params.id)
    res.json(cliente)
  } catch (error) {
    next(error)
  }
}

export const crear = async (req, res, next) => {
  try {
    const cliente = await clienteService.crearCliente({
      ...req.body,
      negocio: req.body.negocio || req.negocioId,
    })
    res.status(201).json(cliente)
  } catch (error) {
    next(error)
  }
}

export const actualizar = async (req, res, next) => {
  try {
    const cliente = await clienteService.actualizarCliente(req.params.id, req.body)
    res.json(cliente)
  } catch (error) {
    next(error)
  }
}

export const eliminar = async (req, res, next) => {
  try {
    await clienteService.eliminarCliente(req.params.id)
    res.status(204).end()
  } catch (error) {
    next(error)
  }
}
