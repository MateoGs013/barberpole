import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import mongoose from 'mongoose'

import { authRouter } from './routes/auth.routes.js'
import { servicioRouter } from './routes/servicio.routes.js'
import { empleadoRouter } from './routes/empleado.routes.js'
import { clienteRouter } from './routes/cliente.routes.js'
import { usuarioRouter } from './routes/usuario.routes.js'
import { turnoRouter } from './routes/turno.routes.js'
import negocioRouter from './routes/negocio.routes.js'

export const app = express()

// Security headers with Content Security Policy
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        scriptSrc: ["'self'", "'unsafe-inline'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
)

// CORS restringido por FRONTEND_URL en producción con fallback para desarrollo local
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((u) => u.trim())
  : [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
    ]

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      if (
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(origin) ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true)
      }
      return callback(new Error(`CORS bloqueado para el origen: ${origin}`))
    },
    credentials: true,
  })
)

// Rate limiting
const isTest = process.env.NODE_ENV === 'test'
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 10000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes desde esta IP, intente de nuevo en 15 minutos.' },
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 10000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de autenticación, intente de nuevo en 15 minutos.' },
})

app.use(globalLimiter)
app.use(express.json())
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'))
}

// Ruta de salud e inspección de estado de base de datos
app.get('/api/salud', (req, res) => {
  const mongoStatus = mongoose.connection.readyState
  const isHealthy = mongoStatus === 1
  const estados = { 0: 'desconectado', 1: 'conectado', 2: 'conectando', 3: 'desconectando' }

  const payload = {
    ok: isHealthy,
    status: isHealthy ? 'healthy' : 'unhealthy',
    database: estados[mongoStatus] || 'desconocido',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  }

  res.status(isHealthy ? 200 : 503).json(payload)
})

// Rutas de la API (con authLimiter en endpoints críticos de auth)
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/registro', authLimiter)
app.use('/api/auth/google', authLimiter)
app.use('/api/negocios/onboarding', authLimiter)
app.use('/api/auth', authRouter)
app.use('/api/negocios', negocioRouter)
app.use('/api/servicios', servicioRouter)
app.use('/api/empleados', empleadoRouter)
app.use('/api/clientes', clienteRouter)
app.use('/api/usuarios', usuarioRouter)
app.use('/api/turnos', turnoRouter)

// Manejador de errores global
app.use((error, req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error(error)
  }
  const status = error.status || 500
  res.status(status).json({ error: error.message || 'Error del servidor' })
})
