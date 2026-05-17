// Controllers de auth: solo manejan la parte HTTP (leer req, devolver res).
// La lógica de hash / comparación / JWT vive en services/auth.service.js.

import {
  registrarUsuario,
  iniciarSesion,
  obtenerUsuarioPorId,
} from '../services/auth.service.js'
import { Cliente } from '../models/Cliente.js'
import { Usuario } from '../models/Usuario.js'

export const registrar = async (req, res, next) => {
  try {
    const data = await registrarUsuario(req.body)
    res.status(201).json(data)
  } catch (error) {
    next(error)
  }
}

export const login = async (req, res, next) => {
  try {
    const data = await iniciarSesion(req.body)
    res.json(data)
  } catch (error) {
    next(error)
  }
}

// GET /api/auth/yo
// Devuelve el usuario del token. El frontend lo usa al recargar la página
// para "rehidratar" la sesión sin pedir login otra vez.
export const yo = async (req, res, next) => {
  try {
    const usuario = await obtenerUsuarioPorId(req.usuario.id)
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' })
    res.json({
      id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
    })
  } catch (error) {
    next(error)
  }
}

// GET /api/auth/mi-cliente
// Devuelve el documento Cliente vinculado al usuario logueado. Si no existe,
// lo crea lazy con los datos del usuario. Esto resuelve dos problemas:
// 1) Los usuarios registrados antes de implementar la vinculación automática
//    obtienen su perfil al primer pedido.
// 2) El frontend siempre puede asumir que un usuario logueado va a tener
//    un perfil disponible para reservar turnos.
export const miCliente = async (req, res, next) => {
  try {
    let cliente = await Cliente.findOne({ usuario: req.usuario.id })
    if (!cliente) {
      const usuario = await Usuario.findById(req.usuario.id)
      if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' })
      cliente = await Cliente.create({
        nombre: usuario.nombre,
        email: usuario.email,
        usuario: usuario._id,
      })
    }
    res.json(cliente)
  } catch (error) {
    next(error)
  }
}
