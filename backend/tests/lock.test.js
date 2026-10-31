import { describe, it, expect } from 'vitest'
import { conBloqueo } from '../src/config/lock.js'
import { redisDisponible } from '../src/config/redis.js'

describe('Lock por clave (fallback en memoria sin Redis)', () => {
  it('sin REDIS_URL, Redis no está disponible y se usa el lock en memoria', () => {
    expect(redisDisponible()).toBe(false)
  })

  it('serializa acciones concurrentes sobre la MISMA clave (sin interleaving)', async () => {
    const eventos = []
    const accion = (n) => async () => {
      eventos.push(`start-${n}`)
      await new Promise((r) => setTimeout(r, 20))
      eventos.push(`end-${n}`)
      return n
    }

    const [a, b] = await Promise.all([
      conBloqueo('k', accion(1)),
      conBloqueo('k', accion(2)),
    ])

    expect(a).toBe(1)
    expect(b).toBe(2)
    // Cada acción termina antes de que empiece la siguiente
    expect(eventos).toEqual(['start-1', 'end-1', 'start-2', 'end-2'])
  })

  it('permite concurrencia entre claves DISTINTAS', async () => {
    const eventos = []
    const accion = (n) => async () => {
      eventos.push(`start-${n}`)
      await new Promise((r) => setTimeout(r, 20))
      eventos.push(`end-${n}`)
    }

    await Promise.all([conBloqueo('k1', accion(1)), conBloqueo('k2', accion(2))])

    // Con claves distintas los dos arrancan antes de que termine cualquiera
    expect(eventos.slice(0, 2).sort()).toEqual(['start-1', 'start-2'])
  })
})
