import escapeStringRegexp from 'escape-string-regexp'
import { Cliente } from '../models/Cliente.js'

const POBLAR_USUARIO = { path: 'usuario', select: 'nombre email rol' }

export const listarClientes = async ({ busqueda = '', negocioId, page, limit } = {}) => {
  const filtro = {}
  if (negocioId) filtro.negocio = negocioId
  if (busqueda && busqueda.trim()) {
    const escaped = escapeStringRegexp(busqueda.trim())
    filtro.$or = [
      { nombre: { $regex: escaped, $options: 'i' } },
      { email: { $regex: escaped, $options: 'i' } },
    ]
  }

  if (page) {
    const pagina = Math.max(1, parseInt(page, 10) || 1)
    const limite = Math.max(1, Math.min(100, parseInt(limit, 10) || 10))
    const skip = (pagina - 1) * limite

    const [total, datos] = await Promise.all([
      Cliente.countDocuments(filtro),
      Cliente.find(filtro)
        .populate(POBLAR_USUARIO)
        .sort({ createdAt: -1 })
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

  return Cliente.find(filtro).populate(POBLAR_USUARIO).sort({ createdAt: -1 })
}

export const obtenerCliente = async (id) => {
  const cliente = await Cliente.findById(id).populate(POBLAR_USUARIO)
  if (!cliente) throw conError('Cliente no encontrado', 404)
  return cliente
}

export const crearCliente = async (datos) => {
  return Cliente.create(datos)
}

export const actualizarCliente = async (id, datos) => {
  const cliente = await Cliente.findByIdAndUpdate(id, datos, {
    new: true,
    runValidators: true,
  }).populate(POBLAR_USUARIO)
  if (!cliente) throw conError('Cliente no encontrado', 404)
  return cliente
}

export const eliminarCliente = async (id) => {
  const cliente = await Cliente.findByIdAndDelete(id)
  if (!cliente) throw conError('Cliente no encontrado', 404)
  return cliente
}

const conError = (mensaje, status) => {
  const error = new Error(mensaje)
  error.status = status
  return error
}
