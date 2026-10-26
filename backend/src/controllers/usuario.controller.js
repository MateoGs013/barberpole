// Controller HTTP de Usuarios (gestión admin-only).

import * as usuarioService from '../services/usuario.service.js'

export const listar = async (req, res, next) => {
  try {
    const usuarios = await usuarioService.listarUsuarios({
      page: req.query.page,
      limit: req.query.limit,
    })
    res.json(usuarios)
  } catch (error) {
    next(error)
  }
}

export const obtener = async (req, res, next) => {
  try {
    const usuario = await usuarioService.obtenerUsuario(req.params.id)
    res.json(usuario)
  } catch (error) {
    next(error)
  }
}

export const crear = async (req, res, next) => {
  try {
    const usuario = await usuarioService.crearUsuario(req.body)
    res.status(201).json(usuario)
  } catch (error) {
    next(error)
  }
}

export const actualizar = async (req, res, next) => {
  try {
    const usuario = await usuarioService.actualizarUsuario(req.params.id, req.body)
    res.json(usuario)
  } catch (error) {
    next(error)
  }
}

export const eliminar = async (req, res, next) => {
  try {
    await usuarioService.eliminarUsuario(req.params.id)
    res.status(204).end()
  } catch (error) {
    next(error)
  }
}
