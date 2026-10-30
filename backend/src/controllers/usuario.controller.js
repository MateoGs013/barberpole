// Controller HTTP de Usuarios (gestión admin-only).
// El aislamiento multi-tenant se resuelve pasando un `scope` (rol + negocio del
// usuario autenticado) a cada función del service.

import * as usuarioService from '../services/usuario.service.js'

const scopeDe = (req) => ({ rol: req.usuario.rol, negocioId: req.negocioId })

export const listar = async (req, res, next) => {
  try {
    const usuarios = await usuarioService.listarUsuarios({
      page: req.query.page,
      limit: req.query.limit,
      scope: scopeDe(req),
    })
    res.json(usuarios)
  } catch (error) {
    next(error)
  }
}

export const obtener = async (req, res, next) => {
  try {
    const usuario = await usuarioService.obtenerUsuario(req.params.id, scopeDe(req))
    res.json(usuario)
  } catch (error) {
    next(error)
  }
}

export const crear = async (req, res, next) => {
  try {
    const usuario = await usuarioService.crearUsuario(req.body, scopeDe(req))
    res.status(201).json(usuario)
  } catch (error) {
    next(error)
  }
}

export const actualizar = async (req, res, next) => {
  try {
    const usuario = await usuarioService.actualizarUsuario(req.params.id, req.body, scopeDe(req))
    res.json(usuario)
  } catch (error) {
    next(error)
  }
}

export const eliminar = async (req, res, next) => {
  try {
    await usuarioService.eliminarUsuario(req.params.id, scopeDe(req))
    res.status(204).end()
  } catch (error) {
    next(error)
  }
}
