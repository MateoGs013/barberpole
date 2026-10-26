import { Router } from 'express'
import * as negocioController from '../controllers/negocio.controller.js'
import { requireAuth, requireRol } from '../middlewares/auth.js'

const router = Router()

// Rutas públicas del SaaS
router.post('/onboarding', negocioController.onboarding)
router.get('/publicos', negocioController.listarPublicos)
router.get('/publico/:slug', negocioController.obtenerPublicoPorSlug)

// Rutas privadas para el dueño del salón (Admin / Superadmin)
router.get(
  '/mi-negocio',
  requireAuth,
  requireRol('admin', 'superadmin'),
  negocioController.obtenerMiNegocio
)
router.put(
  '/mi-negocio',
  requireAuth,
  requireRol('admin', 'superadmin'),
  negocioController.actualizarMiNegocio
)

// Rutas exclusivas para Superadmin (Gestión Global de Tenants / Salones)
router.get(
  '/superadmin/todos',
  requireAuth,
  requireRol('superadmin'),
  negocioController.listarSuperadmin
)
router.post(
  '/superadmin/crear',
  requireAuth,
  requireRol('superadmin'),
  negocioController.crearSuperadmin
)
router.put(
  '/superadmin/:id',
  requireAuth,
  requireRol('superadmin'),
  negocioController.actualizarSuperadmin
)
router.post(
  '/superadmin/:id/toggle',
  requireAuth,
  requireRol('superadmin'),
  negocioController.toggleEstadoSuperadmin
)
router.delete(
  '/superadmin/:id',
  requireAuth,
  requireRol('superadmin'),
  negocioController.eliminarSuperadmin
)

export default router
