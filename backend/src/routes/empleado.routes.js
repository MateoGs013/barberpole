// Rutas de Empleados.
// Listar/obtener: cualquier usuario autenticado.
// Disponibilidad: pública con optAuth para portales de reservas.
// Crear/actualizar/eliminar: solo admin.
// Google Calendar 2-Way Sync: admin o empleado.

import { Router } from 'express'
import * as ctrl from '../controllers/empleado.controller.js'
import { reglasCrear, reglasActualizar, reglaIdParam } from '../validators/empleado.validator.js'
import { validarRequest } from '../middlewares/validacion.js'
import { requireAuth, requireRol, optAuth } from '../middlewares/auth.js'

export const empleadoRouter = Router()

empleadoRouter.get('/google-calendar/callback', ctrl.callbackGoogleRedirect)
empleadoRouter.get('/', requireAuth, ctrl.listar)
empleadoRouter.get('/:id/disponibilidad', optAuth, reglaIdParam, validarRequest, ctrl.disponibilidad)
empleadoRouter.get('/:id', requireAuth, reglaIdParam, validarRequest, ctrl.obtener)

// Sincronización Bidireccional de Google Calendar para el barbero
empleadoRouter.get(
  '/:id/google-calendar/auth-url',
  requireAuth,
  requireRol('admin', 'empleado'),
  reglaIdParam,
  validarRequest,
  ctrl.obtenerAuthUrlGoogle
)

empleadoRouter.post(
  '/:id/google-calendar/callback',
  requireAuth,
  requireRol('admin', 'empleado'),
  reglaIdParam,
  validarRequest,
  ctrl.callbackGoogle
)
empleadoRouter.post(
  '/:id/google-calendar/conectar',
  requireAuth,
  requireRol('admin', 'empleado'),
  reglaIdParam,
  validarRequest,
  ctrl.conectarGoogle
)

empleadoRouter.post(
  '/:id/google-calendar/desconectar',
  requireAuth,
  requireRol('admin', 'empleado'),
  reglaIdParam,
  validarRequest,
  ctrl.desconectarGoogle
)

empleadoRouter.post(
  '/:id/google-calendar/bloquear',
  requireAuth,
  requireRol('admin', 'empleado'),
  reglaIdParam,
  validarRequest,
  ctrl.bloquearGoogle
)

empleadoRouter.delete(
  '/:id/google-calendar/bloquear/:eventId',
  requireAuth,
  requireRol('admin', 'empleado'),
  reglaIdParam,
  validarRequest,
  ctrl.desbloquearGoogle
)

empleadoRouter.post('/', requireAuth, requireRol('admin'), reglasCrear, validarRequest, ctrl.crear)
empleadoRouter.put(
  '/:id',
  requireAuth,
  requireRol('admin'),
  reglaIdParam,
  reglasActualizar,
  validarRequest,
  ctrl.actualizar
)
empleadoRouter.delete(
  '/:id',
  requireAuth,
  requireRol('admin'),
  reglaIdParam,
  validarRequest,
  ctrl.eliminar
)
