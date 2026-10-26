import request from 'supertest'
import { describe, it, expect, beforeEach } from 'vitest'
import { app } from '../src/app.js'
import { Usuario } from '../src/models/Usuario.js'
import { Cliente } from '../src/models/Cliente.js'
import { Empleado } from '../src/models/Empleado.js'
import { Servicio } from '../src/models/Servicio.js'
import { Turno } from '../src/models/Turno.js'

describe('Observability (Healthcheck) & Server-side Pagination & Collision Edge Cases', () => {
  let adminToken

  beforeEach(async () => {
    // Crear y autenticar Admin
    const regRes = await request(app).post('/api/auth/registro').send({
      nombre: 'Admin Observabilidad',
      email: 'admin.obs@barberpole.test',
      password: 'password123',
    })
    await Usuario.findByIdAndUpdate(regRes.body.usuario.id, { rol: 'admin' })
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'admin.obs@barberpole.test',
      password: 'password123',
    })
    adminToken = loginRes.body.token
  })

  it('GET /api/salud devuelve 200, status healthy y estado de mongoose', async () => {
    const res = await request(app).get('/api/salud')

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      ok: true,
      status: 'healthy',
      database: 'conectado',
    })
    expect(res.body).toHaveProperty('uptime')
    expect(res.body).toHaveProperty('timestamp')
  })

  it('soporta paginación server-side en GET /api/clientes', async () => {
    // Crear 5 clientes
    for (let i = 1; i <= 5; i++) {
      await Cliente.create({
        nombre: `Cliente Paginado ${i}`,
        email: `cliente${i}@paginacion.test`,
      })
    }

    const res = await request(app)
      .get('/api/clientes?page=2&limit=2')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('datos')
    expect(res.body).toHaveProperty('paginacion')
    expect(res.body.datos.length).toBe(2)
    expect(res.body.paginacion.pagina).toBe(2)
    expect(res.body.paginacion.limite).toBe(2)
    expect(res.body.paginacion.total).toBeGreaterThanOrEqual(5)
    expect(res.body.paginacion.totalPaginas).toBeGreaterThanOrEqual(3)
  })

  it('soporta paginación server-side en GET /api/turnos', async () => {
    const empleado = await Empleado.create({
      nombre: 'Empleado Paginado',
      especialidad: 'Cortes',
      activo: true,
    })
    const servicio = await Servicio.create({
      nombre: 'Servicio Paginado',
      precio: 5000,
      duracionMinutos: 30,
      activo: true,
    })
    const cliente = await Cliente.create({
      nombre: 'Cliente Turno Paginado',
    })

    const baseTime = Date.now() + 10 * 24 * 60 * 60 * 1000
    for (let i = 0; i < 4; i++) {
      const fechaHora = new Date(baseTime + i * 2 * 60 * 60 * 1000)
      await Turno.create({
        cliente: cliente._id,
        empleado: empleado._id,
        servicio: servicio._id,
        fechaHora,
        fechaHoraFin: new Date(fechaHora.getTime() + 30 * 60_000),
        precioCobrado: 5000,
        duracionMinutos: 30,
      })
    }

    const res = await request(app)
      .get('/api/turnos?page=1&limit=2')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('datos')
    expect(res.body).toHaveProperty('paginacion')
    expect(res.body.datos.length).toBe(2)
    expect(res.body.paginacion.pagina).toBe(1)
    expect(res.body.paginacion.limite).toBe(2)
  })

  it('rechaza actualización de turno si causa superposición (409 Conflict)', async () => {
    const empleado = await Empleado.create({
      nombre: 'Barbero Test Put',
      especialidad: 'Barba',
      activo: true,
    })
    const servicio = await Servicio.create({
      nombre: 'Servicio Test Put',
      precio: 4000,
      duracionMinutos: 30,
      activo: true,
    })
    const cliente = await Cliente.create({ nombre: 'Cliente Test Put' })

    const fecha1 = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
    fecha1.setHours(14, 0, 0, 0)
    const turno1 = await Turno.create({
      cliente: cliente._id,
      empleado: empleado._id,
      servicio: servicio._id,
      fechaHora: fecha1,
      fechaHoraFin: new Date(fecha1.getTime() + 30 * 60_000),
      precioCobrado: 4000,
      duracionMinutos: 30,
    })

    const fecha2 = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
    fecha2.setHours(15, 0, 0, 0)
    const turno2 = await Turno.create({
      cliente: cliente._id,
      empleado: empleado._id,
      servicio: servicio._id,
      fechaHora: fecha2,
      fechaHoraFin: new Date(fecha2.getTime() + 30 * 60_000),
      precioCobrado: 4000,
      duracionMinutos: 30,
    })

    // Intentar mover turno2 al mismo horario que turno1 (14:00)
    const res = await request(app)
      .put(`/api/turnos/${turno2._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        fechaHora: fecha1.toISOString(),
      })

    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/superpone|horario/i)
  })

  it('Slot Engine calcula slots con timezoneOffset provisto por el cliente', async () => {
    const empleado = await Empleado.create({
      nombre: 'Barbero TZ',
      especialidad: 'Fade',
      activo: true,
    })
    const servicio = await Servicio.create({
      nombre: 'Corte TZ',
      precio: 7000,
      duracionMinutos: 30,
      activo: true,
    })

    const fechaFutura = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000)
    const fechaStr = fechaFutura.toISOString().slice(0, 10)

    const res = await request(app)
      .get(`/api/empleados/${empleado._id}/disponibilidad?fecha=${fechaStr}&servicioId=${servicio._id}&timezoneOffset=180`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    expect(res.body.slots).toBeInstanceOf(Array)
    expect(res.body.slots.length).toBeGreaterThan(0)
    // Cada slot debe incluir hora y fechaHora en ISO
    const slot0900 = res.body.slots.find((s) => s.hora === '09:00')
    expect(slot0900).toBeDefined()
    expect(slot0900.fechaHora).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/)
  })
})
