// Validación de payloads de Usuario (gestión admin-only).

import { body, param } from 'express-validator'

export const reglasCrear = [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio').isLength({ min: 2, max: 60 }),
  body('email').trim().isEmail().withMessage('Email inválido').normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/[A-Za-z]/).withMessage('La contraseña debe incluir al menos una letra')
    .matches(/\d/).withMessage('La contraseña debe incluir al menos un número'),
  body('rol').isIn(['admin', 'empleado', 'cliente']).withMessage('Rol inválido'),
]

export const reglasActualizar = [
  body('nombre').optional().trim().notEmpty().isLength({ min: 2, max: 60 }),
  body('email').optional().trim().isEmail().normalizeEmail(),
  body('password')
    .optional()
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/[A-Za-z]/).withMessage('La contraseña debe incluir al menos una letra')
    .matches(/\d/).withMessage('La contraseña debe incluir al menos un número'),
  body('rol').optional().isIn(['admin', 'empleado', 'cliente']),
]

export const reglaIdParam = [param('id').isMongoId().withMessage('ID inválido')]
