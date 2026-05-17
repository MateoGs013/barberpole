// Rutas de autenticación.
// El orden de los middlewares importa: primero las reglas de validación,
// después validarRequest (que cortea con 400 si hubo errores), después el
// controller que solo se ejecuta si los datos son válidos.

import { Router } from 'express'
import { registrar, login, yo, miCliente } from '../controllers/auth.controller.js'
import { reglasRegistro, reglasLogin } from '../validators/auth.validator.js'
import { validarRequest } from '../middlewares/validacion.js'
import { requireAuth } from '../middlewares/auth.js'

export const authRouter = Router()

authRouter.post('/registro', reglasRegistro, validarRequest, registrar)
authRouter.post('/login', reglasLogin, validarRequest, login)
authRouter.get('/yo', requireAuth, yo)
authRouter.get('/mi-cliente', requireAuth, miCliente)
