// Reglas de validación para los endpoints de auth.
// Cada array es una secuencia de middlewares de express-validator que
// inspeccionan req.body y acumulan errores en la request; al final de la
// cadena, el middleware validarRequest decide si devolver 400 o seguir.

import { body } from 'express-validator'

export const reglasRegistro = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ min: 2, max: 60 }).withMessage('El nombre debe tener entre 2 y 60 caracteres'),
  body('email')
    .trim()
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/[A-Za-z]/).withMessage('La contraseña debe incluir al menos una letra')
    .matches(/\d/).withMessage('La contraseña debe incluir al menos un número'),
]

export const reglasLogin = [
  body('email')
    .trim()
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria'),
]
