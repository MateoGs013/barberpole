// Cliente Redis OPCIONAL. Si no hay REDIS_URL (ej. en tests o en una instancia
// única sin Redis), queda en null y el resto del código degrada con gracia:
// el rate-limit usa su store en memoria y el lock cae al lock en proceso.

import Redis from 'ioredis'
import { logger } from './logger.js'

let cliente = null

if (process.env.REDIS_URL) {
  cliente = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 2,
    retryStrategy: (times) => Math.min(times * 200, 2000),
  })
  cliente.on('error', (err) => logger.error({ err }, 'Error de conexión con Redis'))
  cliente.on('ready', () => logger.info('Conectado a Redis'))
}

export const redis = cliente

// true solo si hay cliente y está conectado y listo para operar.
export const redisDisponible = () => Boolean(cliente) && cliente.status === 'ready'
