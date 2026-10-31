// Lock por clave. Con Redis disponible usa un lock distribuido (SET NX PX +
// liberación segura por Lua); si no, un lock en memoria por proceso.
//
// Es best-effort: la correctitud final de las reservas la garantiza la
// reconciliación contra la base (ver turno.service.js), así que si el lock
// expira, falla o no se adquiere a tiempo, igual no hay doble-reserva.

import { randomUUID } from 'node:crypto'
import { redis, redisDisponible } from './redis.js'
import { logger } from './logger.js'

const TTL_MS = 5000 // vida del lock (evita deadlocks si un proceso muere)
const ESPERA_MAX_MS = 2000 // cuánto esperamos para adquirirlo antes de seguir igual
const REINTENTO_MS = 50

// --- Fallback en memoria (una sola instancia) ---
const locksEnMemoria = new Map()

const conBloqueoEnMemoria = async (clave, accion) => {
  const lockAnterior = locksEnMemoria.get(clave) || Promise.resolve()
  let resolver
  const nuevoLock = new Promise((r) => {
    resolver = r
  })
  locksEnMemoria.set(clave, nuevoLock)
  try {
    await lockAnterior
    return await accion()
  } finally {
    resolver()
    if (locksEnMemoria.get(clave) === nuevoLock) locksEnMemoria.delete(clave)
  }
}

// --- Lock distribuido con Redis ---
// Libera solo si el token coincide (no borrar un lock ajeno que ya tomó otro).
const SCRIPT_LIBERAR = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end`

const dormir = (ms) => new Promise((r) => setTimeout(r, ms))

const adquirirRedis = async (key, token) => {
  const limite = Date.now() + ESPERA_MAX_MS
  do {
    const ok = await redis.set(key, token, 'PX', TTL_MS, 'NX')
    if (ok === 'OK') return true
    await dormir(REINTENTO_MS)
  } while (Date.now() < limite)
  return false
}

export const conBloqueo = async (clave, accion) => {
  if (!redisDisponible()) return conBloqueoEnMemoria(clave, accion)

  const key = `lock:${clave}`
  const token = randomUUID()
  let adquirido = false
  try {
    adquirido = await adquirirRedis(key, token)
  } catch (err) {
    // Si Redis falla, seguimos igual: la reconciliación en DB cubre la correctitud.
    logger.warn({ err }, 'No se pudo adquirir el lock en Redis; se continúa sin lock distribuido')
  }

  try {
    return await accion()
  } finally {
    if (adquirido) {
      try {
        await redis.eval(SCRIPT_LIBERAR, 1, key, token)
      } catch (err) {
        logger.warn({ err }, 'No se pudo liberar el lock en Redis (expirará por TTL)')
      }
    }
  }
}
