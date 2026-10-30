import request from 'supertest'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { app } from '../src/app.js'
import { generarAuthUrl, verificarStateOAuth } from '../src/services/google-calendar.service.js'

const CLIENT_ID = 'mi-client-id.apps.googleusercontent.com'

const tokeninfoFalso = (payload) => async () => ({
  ok: true,
  json: async () => payload,
})

describe('Hardening OAuth: audiencia (aud) del ID token de Google', () => {
  let originalClientId

  beforeEach(() => {
    originalClientId = process.env.GOOGLE_CLIENT_ID
    process.env.GOOGLE_CLIENT_ID = CLIENT_ID
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    if (originalClientId === undefined) delete process.env.GOOGLE_CLIENT_ID
    else process.env.GOOGLE_CLIENT_ID = originalClientId
  })

  it('rechaza un ID token emitido para otra aplicación (aud distinto) con 401', async () => {
    vi.stubGlobal(
      'fetch',
      tokeninfoFalso({
        email: 'victima@gmail.com',
        name: 'Víctima',
        sub: 'sub-123',
        aud: 'app-de-otro.apps.googleusercontent.com',
        email_verified: 'true',
      })
    )

    const res = await request(app).post('/api/auth/google').send({ credential: 'a.b.c' })
    expect(res.status).toBe(401)
    expect(res.body.error).toMatch(/otra aplicación/i)
  })

  it('acepta un ID token con aud correcto y crea la sesión', async () => {
    vi.stubGlobal(
      'fetch',
      tokeninfoFalso({
        email: 'legit@gmail.com',
        name: 'Legit',
        sub: 'sub-456',
        aud: CLIENT_ID,
        email_verified: 'true',
      })
    )

    const res = await request(app).post('/api/auth/google').send({ credential: 'a.b.c' })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('token')
    expect(res.body.usuario.email).toBe('legit@gmail.com')
  })

  it('rechaza un ID token con email no verificado con 401', async () => {
    vi.stubGlobal(
      'fetch',
      tokeninfoFalso({
        email: 'noverificado@gmail.com',
        name: 'No Verificado',
        sub: 'sub-789',
        aud: CLIENT_ID,
        email_verified: 'false',
      })
    )

    const res = await request(app).post('/api/auth/google').send({ credential: 'a.b.c' })
    expect(res.status).toBe(401)
    expect(res.body.error).toMatch(/no está verificado/i)
  })
})

describe('Hardening OAuth: state firmado del callback de Google Calendar', () => {
  let originalClientId

  beforeEach(() => {
    originalClientId = process.env.GOOGLE_CLIENT_ID
    process.env.GOOGLE_CLIENT_ID = CLIENT_ID
  })

  afterEach(() => {
    if (originalClientId === undefined) delete process.env.GOOGLE_CLIENT_ID
    else process.env.GOOGLE_CLIENT_ID = originalClientId
  })

  it('el state generado es un JWT verificable que contiene el empleadoId', () => {
    const empleadoId = '507f1f77bcf86cd799439011'
    const url = generarAuthUrl(empleadoId)
    const state = new URL(url).searchParams.get('state')

    expect(state).toBeTruthy()
    // Ya no es JSON plano: está firmado, así que parsearlo como JSON falla.
    expect(() => JSON.parse(state)).toThrow()
    expect(verificarStateOAuth(state)).toBe(empleadoId)
  })

  it('rechaza un state forjado o manipulado (no firmado por el servidor)', () => {
    // Un atacante intenta inyectar el empleadoId de otra persona como JSON plano.
    const stateForjado = JSON.stringify({ empleadoId: '507f1f77bcf86cd799439011' })
    expect(verificarStateOAuth(stateForjado)).toBeNull()
    expect(verificarStateOAuth('basura')).toBeNull()
    expect(verificarStateOAuth('')).toBeNull()
    expect(verificarStateOAuth(null)).toBeNull()
  })
})
