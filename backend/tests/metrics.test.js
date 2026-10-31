import request from 'supertest'
import { describe, it, expect } from 'vitest'
import { app } from '../src/app.js'

describe('Métricas Prometheus (/metrics)', () => {
  it('expone /metrics en formato de texto de Prometheus', async () => {
    const res = await request(app).get('/metrics')
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/text\/plain/)
    // Métricas por defecto del proceso Node
    expect(res.text).toContain('process_cpu_seconds_total')
    // Métricas HTTP propias (al menos las líneas HELP/TYPE)
    expect(res.text).toContain('http_requests_total')
    expect(res.text).toContain('http_request_duration_seconds')
  })

  it('registra las requests atendidas con su ruta normalizada', async () => {
    // Generamos una request para que el middleware la contabilice
    await request(app).get('/api/salud')

    const res = await request(app).get('/metrics')
    expect(res.status).toBe(200)
    // Debe existir una serie para GET /api/salud con status 200
    expect(res.text).toMatch(/http_requests_total\{[^}]*route="\/api\/salud"[^}]*\}/)
  })
})
