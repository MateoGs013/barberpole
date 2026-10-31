import request from 'supertest'
import { describe, it, expect } from 'vitest'
import { app } from '../src/app.js'
import { parsearEnv } from '../src/config/env.js'

describe('Validación de entorno (parsearEnv)', () => {
  const base = {
    NODE_ENV: 'production',
    MONGODB_URI: 'mongodb://localhost:27017/barberpole',
    JWT_SECRET: 'una-clave-jwt-suficientemente-larga',
  }

  it('acepta un entorno válido y aplica defaults', () => {
    const res = parsearEnv(base)
    expect(res.success).toBe(true)
    expect(res.data.PORT).toBe(4000) // default
    expect(res.data.JWT_EXPIRES_IN).toBe('7d') // default
    expect(res.data.LOG_LEVEL).toBe('info') // default
  })

  it('rechaza si falta MONGODB_URI', () => {
    const { MONGODB_URI, ...sinUri } = base
    const res = parsearEnv(sinUri)
    expect(res.success).toBe(false)
    expect(res.error.issues.some((i) => i.path.includes('MONGODB_URI'))).toBe(true)
  })

  it('rechaza un JWT_SECRET demasiado corto', () => {
    const res = parsearEnv({ ...base, JWT_SECRET: 'corto' })
    expect(res.success).toBe(false)
    expect(res.error.issues.some((i) => i.path.includes('JWT_SECRET'))).toBe(true)
  })

  it('rechaza un NODE_ENV fuera del enum', () => {
    const res = parsearEnv({ ...base, NODE_ENV: 'staging' })
    expect(res.success).toBe(false)
  })
})

describe('Documentación OpenAPI', () => {
  it('expone la spec en GET /api/docs.json', async () => {
    const res = await request(app).get('/api/docs.json')
    expect(res.status).toBe(200)
    expect(res.body.openapi).toBe('3.0.3')
    expect(res.body.info.title).toBe('BarberPole API')
    expect(res.body.paths).toHaveProperty('/turnos')
  })

  it('propaga un request-id en el header de respuesta', async () => {
    const res = await request(app).get('/api/salud')
    expect(res.headers['x-request-id']).toBeTruthy()
  })
})
