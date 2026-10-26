import request from 'supertest'
import { describe, it, expect, beforeEach } from 'vitest'
import { app } from '../src/app.js'
import { Empleado } from '../src/models/Empleado.js'
import { Servicio } from '../src/models/Servicio.js'
import { Cliente } from '../src/models/Cliente.js'
import { Turno } from '../src/models/Turno.js'
import { Usuario } from '../src/models/Usuario.js'

describe('Barber Google Calendar 2-Way Sync & Slot Engine Collision', () => {
  let adminToken
  let empleadoToken
  let clienteToken
  let empleadoDoc
  let servicioDoc
  let clienteDoc

  beforeEach(async () => {
    // 1. Admin
    const adminReg = await request(app).post('/api/auth/registro').send({
      nombre: 'Admin General',
      email: 'admin.sync@barberpole.test',
      password: 'password123',
    })
    await Usuario.findByIdAndUpdate(adminReg.body.usuario.id, { rol: 'admin' })
    const adminLogin = await request(app).post('/api/auth/login').send({
      email: 'admin.sync@barberpole.test',
      password: 'password123',
    })
    adminToken = adminLogin.body.token

    // 2. Barbero / Empleado
    const empUserRes = await request(app).post('/api/auth/registro').send({
      nombre: 'Lucas Barbero',
      email: 'lucas.barbero@gmail.com',
      password: 'password123',
    })
    await Usuario.findByIdAndUpdate(empUserRes.body.usuario.id, { rol: 'empleado' })
    const empLogin = await request(app).post('/api/auth/login').send({
      email: 'lucas.barbero@gmail.com',
      password: 'password123',
    })
    empleadoToken = empLogin.body.token

    empleadoDoc = await Empleado.create({
      nombre: 'Lucas Barbero',
      especialidad: 'Fade & Navaja',
      email: 'lucas.barbero@gmail.com',
      usuario: empUserRes.body.usuario.id,
      activo: true,
      googleSyncActivo: false,
    })

    // 3. Servicio
    servicioDoc = await Servicio.create({
      nombre: 'Corte Tradicional',
      precio: 7000,
      duracionMinutos: 30,
      activo: true,
    })

    // 4. Cliente
    const cliRes = await request(app).post('/api/auth/registro').send({
      nombre: 'Martin Gomez',
      email: 'martin.gomez@test.com',
      password: 'password123',
    })
    clienteToken = cliRes.body.token
    clienteDoc = await Cliente.findOne({ usuario: cliRes.body.usuario.id })
  })

  it('permite a un barbero conectar su cuenta de Google Calendar', async () => {
    const res = await request(app)
      .post(`/api/empleados/${empleadoDoc._id}/google-calendar/conectar`)
      .set('Authorization', `Bearer ${empleadoToken}`)
      .send({ email: 'lucas.barbero@gmail.com' })

    expect(res.status).toBe(200)
    expect(res.body.googleSyncActivo).toBe(true)
    expect(res.body.googleCalendarId).toBe('lucas.barbero@gmail.com')

    const dbEmp = await Empleado.findById(empleadoDoc._id)
    expect(dbEmp.googleSyncActivo).toBe(true)
  })

  it('sincroniza bloqueos externos de Google Calendar e inhabilita los slots en el Slot Engine', async () => {
    // Conectar sync
    await request(app)
      .post(`/api/empleados/${empleadoDoc._id}/google-calendar/conectar`)
      .set('Authorization', `Bearer ${empleadoToken}`)
      .send({ email: 'lucas.barbero@gmail.com' })

    // Fecha futura para evitar "Horario pasado"
    const fechaFutura = '2028-11-20'
    const inicioBloqueo = new Date(`${fechaFutura}T15:00:00.000Z`)
    const finBloqueo = new Date(`${fechaFutura}T16:00:00.000Z`)

    // Simular evento entrante de Google Calendar (ej. turno médico o evento personal)
    const blockRes = await request(app)
      .post(`/api/empleados/${empleadoDoc._id}/google-calendar/bloquear`)
      .set('Authorization', `Bearer ${empleadoToken}`)
      .send({
        titulo: 'Consulta Médica Personal',
        inicio: inicioBloqueo.toISOString(),
        fin: finBloqueo.toISOString(),
      })

    expect(blockRes.status).toBe(200)
    expect(blockRes.body.eventosGoogle).toHaveLength(1)
    expect(blockRes.body.eventosGoogle[0].titulo).toBe('Consulta Médica Personal')

    // Consultar disponibilidad del día en el Slot Engine (con offset 0 para coincidencia exacta UTC)
    const dispRes = await request(app)
      .get(`/api/empleados/${empleadoDoc._id}/disponibilidad`)
      .query({
        fecha: fechaFutura,
        servicioId: String(servicioDoc._id),
        timezoneOffset: 0,
      })

    expect(dispRes.status).toBe(200)
    const slots = dispRes.body.slots

    // Slot 15:00 debe figurar ocupado por Google Calendar
    const slot1500 = slots.find((s) => s.hora === '15:00')
    expect(slot1500).toBeDefined()
    expect(slot1500.disponible).toBe(false)
    expect(slot1500.motivo).toBe('Ocupado (Google Calendar)')

    // Slot 15:30 también cae dentro del bloqueo (15:00 a 16:00)
    const slot1530 = slots.find((s) => s.hora === '15:30')
    expect(slot1530).toBeDefined()
    expect(slot1530.disponible).toBe(false)
    expect(slot1530.motivo).toBe('Ocupado (Google Calendar)')

    // Slot 16:00 debe estar disponible
    const slot1600 = slots.find((s) => s.hora === '16:00')
    expect(slot1600).toBeDefined()
    expect(slot1600.disponible).toBe(true)
  })

  it('rechaza con 409 Conflict reservas que colisionen con un evento de Google Calendar del barbero', async () => {
    // Activar sync y registrar bloqueo externo
    await request(app)
      .post(`/api/empleados/${empleadoDoc._id}/google-calendar/conectar`)
      .set('Authorization', `Bearer ${empleadoToken}`)
      .send({ email: 'lucas.barbero@gmail.com' })

    const fechaFutura = '2028-11-20'
    await request(app)
      .post(`/api/empleados/${empleadoDoc._id}/google-calendar/bloquear`)
      .set('Authorization', `Bearer ${empleadoToken}`)
      .send({
        titulo: 'Reunión Externa',
        inicio: `${fechaFutura}T14:00:00.000Z`,
        fin: `${fechaFutura}T15:00:00.000Z`,
      })

    // Intento de cliente de reservar a las 14:00 (choca con Google Calendar)
    const resReserva = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${clienteToken}`)
      .send({
        cliente: String(clienteDoc._id),
        empleado: String(empleadoDoc._id),
        servicio: String(servicioDoc._id),
        fechaHora: `${fechaFutura}T14:00:00.000Z`,
      })

    expect(resReserva.status).toBe(409)
    expect(resReserva.body.error).toMatch(/El empleado ya tiene un turno en ese horario/)
  })

  it('genera un googleCalendarEventId al confirmar un turno para un barbero sincronizado', async () => {
    await request(app)
      .post(`/api/empleados/${empleadoDoc._id}/google-calendar/conectar`)
      .set('Authorization', `Bearer ${empleadoToken}`)
      .send({ email: 'lucas.barbero@gmail.com' })

    const fechaFutura = '2028-11-20'
    const resReserva = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${clienteToken}`)
      .send({
        cliente: String(clienteDoc._id),
        empleado: String(empleadoDoc._id),
        servicio: String(servicioDoc._id),
        fechaHora: `${fechaFutura}T10:00:00.000Z`,
      })

    expect(resReserva.status).toBe(201)
    expect(resReserva.body.googleCalendarEventId).toBeTruthy()
    expect(resReserva.body.googleCalendarEventId).toMatch(/^gcal_/)
  })

  it('permite desbloquear un evento y desconectar Google Calendar', async () => {
    const resConn = await request(app)
      .post(`/api/empleados/${empleadoDoc._id}/google-calendar/conectar`)
      .set('Authorization', `Bearer ${empleadoToken}`)
      .send({ email: 'lucas.barbero@gmail.com' })

    const resBlock = await request(app)
      .post(`/api/empleados/${empleadoDoc._id}/google-calendar/bloquear`)
      .set('Authorization', `Bearer ${empleadoToken}`)
      .send({
        titulo: 'Almuerzo de equipo',
        inicio: '2028-11-20T13:00:00.000Z',
        fin: '2028-11-20T14:00:00.000Z',
      })

    const eventId = resBlock.body.eventosGoogle[0]._id

    // Desbloquear evento
    const resUnblock = await request(app)
      .delete(`/api/empleados/${empleadoDoc._id}/google-calendar/bloquear/${eventId}`)
      .set('Authorization', `Bearer ${empleadoToken}`)

    expect(resUnblock.status).toBe(200)
    expect(resUnblock.body.eventosGoogle).toHaveLength(0)

    // Desconectar sync
    const resDesconectar = await request(app)
      .post(`/api/empleados/${empleadoDoc._id}/google-calendar/desconectar`)
      .set('Authorization', `Bearer ${empleadoToken}`)

    expect(resDesconectar.status).toBe(200)
    expect(resDesconectar.body.googleSyncActivo).toBe(false)
  })
})
