// Rutas de Turnos.
// Todo requiere autenticación. Los controllers tienen lógica adicional para
// restringir a clientes a sus propios turnos.

import { Router } from 'express'
import * as ctrl from '../controllers/turno.controller.js'
import { reglasCrear, reglasActualizar, reglaIdParam } from '../validators/turno.validator.js'
import { validarRequest } from '../middlewares/validacion.js'
import { requireAuth, requireRol } from '../middlewares/auth.js'

export const turnoRouter = Router()

turnoRouter.use(requireAuth)

turnoRouter.get('/', ctrl.listar)
turnoRouter.get('/:id', reglaIdParam, validarRequest, ctrl.obtener)
turnoRouter.post('/', reglasCrear, validarRequest, ctrl.crear)

// Modificar turnos (cambiar estado, reasignar, etc.) lo hacen admin/empleado.
turnoRouter.put(
  '/:id',
  requireRol('admin', 'empleado'),
  reglaIdParam,
  reglasActualizar,
  validarRequest,
  ctrl.actualizar
)

// Cancelar turno (clientes pueden cancelar sus propios turnos con anticipación; admin y empleados pueden cancelar cualquier turno)
turnoRouter.patch('/:id/cancelar', reglaIdParam, validarRequest, ctrl.cancelar)

// Eliminar = borrar la reserva. Solo admin.
turnoRouter.delete(
  '/:id',
  requireRol('admin'),
  reglaIdParam,
  validarRequest,
  ctrl.eliminar
)
