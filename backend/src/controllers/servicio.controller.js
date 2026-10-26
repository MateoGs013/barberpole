import * as servicioService from '../services/servicio.service.js'

export const listar = async (req, res, next) => {
  try {
    const soloActivos = req.query.activos === 'true'
    const negocioId = req.negocioId || req.query.negocioId
    const servicios = await servicioService.listarServicios({ soloActivos, negocioId })
    res.json(servicios)
  } catch (error) {
    next(error)
  }
}

export const obtener = async (req, res, next) => {
  try {
    const servicio = await servicioService.obtenerServicio(req.params.id)
    res.json(servicio)
  } catch (error) {
    next(error)
  }
}

export const crear = async (req, res, next) => {
  try {
    const servicio = await servicioService.crearServicio({
      ...req.body,
      negocio: req.body.negocio || req.negocioId,
    })
    res.status(201).json(servicio)
  } catch (error) {
    next(error)
  }
}

export const actualizar = async (req, res, next) => {
  try {
    const servicio = await servicioService.actualizarServicio(req.params.id, req.body)
    res.json(servicio)
  } catch (error) {
    next(error)
  }
}

export const eliminar = async (req, res, next) => {
  try {
    await servicioService.eliminarServicio(req.params.id)
    res.status(204).end()
  } catch (error) {
    next(error)
  }
}
