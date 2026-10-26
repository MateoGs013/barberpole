import request from 'supertest'
import { describe, it, expect, beforeEach } from 'vitest'
import { app } from '../src/app.js'
import { Empleado } from '../src/models/Empleado.js'
import { Servicio } from '../src/models/Servicio.js'
import { Cliente } from '../src/models/Cliente.js'
import { Turno } from '../src/models/Turno.js'

describe('Turnos, Slot Engine, Business Rules & Concurrency Collision', () => {
  let adminToken
  let cliente1Token
  let cliente1Doc
  let cliente2Token
  let cliente2Doc
  let empleadoDoc
  let servicioDoc

  beforeEach(async () => {
    // 1) Crear Admin
    const adminReg = await request(app).post('/api/auth/registro').send({
      nombre: 'Admin General',
      email: 'admin@barberpole.test',
      password: 'password123',
    })
    // Promover a admin en BD directamente
    const { Usuario } = await import('../src/models/Usuario.js')
    await Usuario.findByIdAndUpdate(adminReg.body.usuario.id, { rol: 'admin' })
    const adminLogin = await request(app).post('/api/auth/login').send({
      email: 'admin@barberpole.test',
      password: 'password123',
    })
    adminToken = adminLogin.body.token

    // 2) Crear Empleado y Servicio
    empleadoDoc = await Empleado.create({
      nombre: 'Facundo Barbero',
      especialidad: 'Fade & Barba Clásica',
      activo: true,
    })

    servicioDoc = await Servicio.create({
      nombre: 'Corte Degradé + Perfilado',
      precio: 8500,
      duracionMinutos: 30,
      activo: true,
    })

    // 3) Registrar dos clientes
    const cli1Res = await request(app).post('/api/auth/registro').send({
      nombre: 'Tomas Gonzalez',
      email: 'tomas@barberpole.test',
      password: 'password123',
    })
    cliente1Token = cli1Res.body.token
    cliente1Doc = await Cliente.findOne({ usuario: cli1Res.body.usuario.id })

    const cli2Res = await request(app).post('/api/auth/registro').send({
      nombre: 'Nicolas Fernandez',
      email: 'nicolas@barberpole.test',
      password: 'password123',
    })
    cliente2Token = cli2Res.body.token
    cliente2Doc = await Cliente.findOne({ usuario: cli2Res.body.usuario.id })
  })

  it('rechaza reservas de turnos en el pasado con código 400', async () => {
    const fechaPasada = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const res = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${cliente1Token}`)
      .send({
        cliente: cliente1Doc._id,
        empleado: empleadoDoc._id,
        servicio: servicioDoc._id,
        fechaHora: fechaPasada,
      })

    expect(res.status).toBe(400)
    expect(res.body.error || res.body.errores).toBeDefined()
  })

  it('crea turno exitosamente guardando snapshots inmutables de precio, duración y fin', async () => {
    // 3 días en el futuro a las 11:00
    const fechaFutura = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    fechaFutura.setHours(11, 0, 0, 0)

    const res = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${cliente1Token}`)
      .send({
        cliente: cliente1Doc._id,
        empleado: empleadoDoc._id,
        servicio: servicioDoc._id,
        fechaHora: fechaFutura.toISOString(),
      })

    expect(res.status).toBe(201)
    expect(res.body.precioCobrado).toBe(servicioDoc.precio)
    expect(res.body.duracionMinutos).toBe(servicioDoc.duracionMinutos)
    expect(res.body.fechaHoraFin).toBeDefined()

    // Modificamos el precio original del servicio en BD para asegurar inmutabilidad
    await Servicio.findByIdAndUpdate(servicioDoc._id, { precio: 15000 })
    const turnoEnBD = await Turno.findById(res.body._id)
    expect(turnoEnBD.precioCobrado).toBe(8500)
  })

  it('impide que un cliente reserve para otro cliente (control de roles)', async () => {
    const fechaFutura = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)
    fechaFutura.setHours(14, 0, 0, 0)

    const res = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${cliente1Token}`)
      .send({
        cliente: cliente2Doc._id, // Intenta reservar para cliente2 siendo cliente1
        empleado: empleadoDoc._id,
        servicio: servicioDoc._id,
        fechaHora: fechaFutura.toISOString(),
      })

    expect(res.status).toBe(403)
    expect(res.body.error).toMatch(/no podés/i)
  })

  it('calcula slots libres y ocupados en el Slot Engine (GET /api/empleados/:id/disponibilidad)', async () => {
    const fecha = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    const fechaStr = fecha.toISOString().slice(0, 10)

    // Agendamos turno a las 10:00 ese día
    const fechaTurno = new Date(`${fechaStr}T10:00:00`)
    await Turno.create({
      cliente: cliente1Doc._id,
      empleado: empleadoDoc._id,
      servicio: servicioDoc._id,
      fechaHora: fechaTurno,
      fechaHoraFin: new Date(fechaTurno.getTime() + 30 * 60_000),
      duracionMinutos: 30,
      precioCobrado: 8500,
      estado: 'confirmado',
    })

    const res = await request(app)
      .get(`/api/empleados/${empleadoDoc._id}/disponibilidad?fecha=${fechaStr}&servicioId=${servicioDoc._id}`)
      .set('Authorization', `Bearer ${cliente1Token}`)

    expect(res.status).toBe(200)
    expect(res.body.slots).toBeInstanceOf(Array)

    const slot1000 = res.body.slots.find((s) => s.hora === '10:00')
    const slot1030 = res.body.slots.find((s) => s.hora === '10:30')

    expect(slot1000.disponible).toBe(false)
    expect(slot1000.motivo).toBe('Ocupado')
    expect(slot1030.disponible).toBe(true)
  })

  it('permite a un cliente cancelar su turno con más de 2hs de anticipación y rechaza con menos', async () => {
    // 1) Turno con suficiente anticipación (24hs)
    const fecha24hs = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const turnoOk = await Turno.create({
      cliente: cliente1Doc._id,
      empleado: empleadoDoc._id,
      servicio: servicioDoc._id,
      fechaHora: fecha24hs,
      fechaHoraFin: new Date(fecha24hs.getTime() + 30 * 60_000),
      duracionMinutos: 30,
      precioCobrado: 8500,
      estado: 'pendiente',
    })

    const resOk = await request(app)
      .patch(`/api/turnos/${turnoOk._id}/cancelar`)
      .set('Authorization', `Bearer ${cliente1Token}`)

    expect(resOk.status).toBe(200)
    expect(resOk.body.estado).toBe('cancelado')

    // 2) Turno con menos de 2 horas de anticipación (ej: 40 minutos)
    const fechaInminente = new Date(Date.now() + 40 * 60 * 1000)
    const turnoTarde = await Turno.create({
      cliente: cliente1Doc._id,
      empleado: empleadoDoc._id,
      servicio: servicioDoc._id,
      fechaHora: fechaInminente,
      fechaHoraFin: new Date(fechaInminente.getTime() + 30 * 60_000),
      duracionMinutos: 30,
      precioCobrado: 8500,
      estado: 'confirmado',
    })

    const resTarde = await request(app)
      .patch(`/api/turnos/${turnoTarde._id}/cancelar`)
      .set('Authorization', `Bearer ${cliente1Token}`)

    expect(resTarde.status).toBe(400)
    expect(resTarde.body.error).toMatch(/2 horas/i)
  })

  it('CONCURRENCY COLLISION: dos reservas simultáneas para el mismo horario resultan en exactamente 1 éxito y 1 colisión 409', async () => {
    const fechaFutura = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    fechaFutura.setHours(15, 0, 0, 0)
    const slotIso = fechaFutura.toISOString()

    // Ejecutamos ambas solicitudes simultáneamente en paralelo
    const [p1, p2] = await Promise.all([
      request(app)
        .post('/api/turnos')
        .set('Authorization', `Bearer ${cliente1Token}`)
        .send({
          cliente: cliente1Doc._id,
          empleado: empleadoDoc._id,
          servicio: servicioDoc._id,
          fechaHora: slotIso,
        }),
      request(app)
        .post('/api/turnos')
        .set('Authorization', `Bearer ${cliente2Token}`)
        .send({
          cliente: cliente2Doc._id,
          empleado: empleadoDoc._id,
          servicio: servicioDoc._id,
          fechaHora: slotIso,
        }),
    ])

    const statusCodes = [p1.status, p2.status].sort()
    // Uno debe ser 201 Created y el otro debe ser 409 Conflict
    expect(statusCodes).toEqual([201, 409])

    const totalEnBD = await Turno.countDocuments({
      empleado: empleadoDoc._id,
      fechaHora: slotIso,
      estado: { $ne: 'cancelado' },
    })
    expect(totalEnBD).toBe(1)
  })
})
