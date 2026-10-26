// Validación de payloads de Turno.

import { body, param } from 'express-validator'

export const reglasCrear = [
  body('cliente').isMongoId().withMessage('Cliente inválido'),
  body('empleado').isMongoId().withMessage('Empleado inválido'),
  body('servicio').isMongoId().withMessage('Servicio inválido'),
  body('fechaHora')
    .isISO8601().withMessage('La fechaHora debe ser una fecha ISO 8601 válida (ej: 2026-06-01T15:30:00Z)')
    .toDate()
    .custom((value) => {
      if (new Date(value).getTime() < Date.now()) {
        throw new Error('No se pueden reservar turnos en el pasado')
      }
      return true
    }),
  body('estado')
    .optional()
    .isIn(['pendiente', 'confirmado', 'completado', 'cancelado'])
    .withMessage('Estado inválido'),
  body('notas').optional().trim().isLength({ max: 500 }),
]

export const reglasActualizar = [
  body('cliente').optional().isMongoId(),
  body('empleado').optional().isMongoId(),
  body('servicio').optional().isMongoId(),
  body('fechaHora').optional().isISO8601().toDate(),
  body('estado').optional().isIn(['pendiente', 'confirmado', 'completado', 'cancelado']),
  body('notas').optional().trim().isLength({ max: 500 }),
]

export const reglaIdParam = [param('id').isMongoId().withMessage('ID inválido')]
