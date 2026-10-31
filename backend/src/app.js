import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import mongoose from 'mongoose'
import { pinoHttp } from 'pino-http'
import { randomUUID } from 'node:crypto'
import swaggerUi from 'swagger-ui-express'
import { RedisStore } from 'rate-limit-redis'

import { logger } from './config/logger.js'
import { openapiSpec } from './docs/openapi.js'
import { metricsMiddleware, metricsHandler } from './config/metrics.js'
import { redis } from './config/redis.js'

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

// Rate limiting. Con Redis disponible, el contador se comparte entre instancias
// (store distribuido); si no, cada instancia usa su store en memoria.
const isTest = process.env.NODE_ENV === 'test'
const storeRedis = (prefix) =>
  redis ? new RedisStore({ sendCommand: (...args) => redis.call(...args), prefix }) : undefined

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 10000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  store: storeRedis('rl-global:'),
  message: { error: 'Demasiadas solicitudes desde esta IP, intente de nuevo en 15 minutos.' },
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 10000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  store: storeRedis('rl-auth:'),
  message: { error: 'Demasiados intentos de autenticación, intente de nuevo en 15 minutos.' },
})

app.use(globalLimiter)
app.use(express.json())

// Métricas Prometheus: mide duración y cuenta cada request (antes del routing).
app.use(metricsMiddleware)

// Logging estructurado de requests con request-id (propaga/echo del header x-request-id).
// Se ignoran los endpoints de scraping/health para no inundar los logs.
app.use(
  pinoHttp({
    logger,
    autoLogging: {
      ignore: (req) => req.url === '/metrics' || req.url === '/api/salud',
    },
    genReqId: (req, res) => {
      const existente = req.headers['x-request-id']
      const id = existente || randomUUID()
      res.setHeader('x-request-id', id)
      return id
    },
  })
)

// Endpoint de métricas para scraping de Prometheus
app.get('/metrics', metricsHandler)

// Documentación interactiva de la API (OpenAPI 3 / Swagger UI)
app.get('/api/docs.json', (req, res) => res.json(openapiSpec))
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec))

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
  const status = error.status || 500
  // Logueamos los 5xx como error; los 4xx (errores de cliente) como warn.
  const log = req.log || logger
  if (status >= 500) {
    log.error({ err: error }, 'Error no controlado')
  } else {
    log.warn({ err: error, status }, 'Error de solicitud')
  }
  res.status(status).json({ error: error.message || 'Error del servidor' })
})
