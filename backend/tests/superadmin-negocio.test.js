import request from 'supertest'
import { describe, it, expect, beforeEach } from 'vitest'
import { app } from '../src/app.js'
import { Usuario } from '../src/models/Usuario.js'
import { Negocio } from '../src/models/Negocio.js'
import { Empleado } from '../src/models/Empleado.js'
import { Servicio } from '../src/models/Servicio.js'

describe('Superadmin Multi-Tenant Management & Extended Salon Configuration', () => {
  let superadminToken
  let adminToken
  let clienteToken

  beforeEach(async () => {
    // 1. Superadmin User
    const saReg = await request(app).post('/api/auth/registro').send({
      nombre: 'Super Administrador',
      email: 'master@barberpole.test',
      password: 'password123',
    })
    await Usuario.findByIdAndUpdate(saReg.body.usuario.id, { rol: 'superadmin' })
    const saLogin = await request(app).post('/api/auth/login').send({
      email: 'master@barberpole.test',
      password: 'password123',
    })
    superadminToken = saLogin.body.token

    // 2. Regular Admin (Salon owner)
    const adminReg = await request(app).post('/api/auth/registro').send({
      nombre: 'Dueño Salón',
      email: 'owner@barberpole.test',
      password: 'password123',
    })
    await Usuario.findByIdAndUpdate(adminReg.body.usuario.id, { rol: 'admin' })
    const adminLogin = await request(app).post('/api/auth/login').send({
      email: 'owner@barberpole.test',
      password: 'password123',
    })
    adminToken = adminLogin.body.token

    // 3. Regular Client
    const cliReg = await request(app).post('/api/auth/registro').send({
      nombre: 'Cliente Regular',
      email: 'cliente@barberpole.test',
      password: 'password123',
    })
    clienteToken = cliReg.body.token
  })

  it('deniega acceso al panel superadmin para roles cliente y admin regular (403)', async () => {
    const resCliente = await request(app)
      .get('/api/negocios/superadmin/todos')
      .set('Authorization', `Bearer ${clienteToken}`)
    expect(resCliente.status).toBe(403)

    const resAdmin = await request(app)
      .get('/api/negocios/superadmin/todos')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(resAdmin.status).toBe(403)
  })

  it('permite al superadmin listar todos los salones con métricas de turnos, empleados y servicios', async () => {
    // Onboarding de un salón de prueba
    await request(app).post('/api/negocios/onboarding').send({
      nombreNegocio: 'Studio Belgrano Barber',
      slug: 'belgrano-barber',
      nombreOwner: 'Marcos Belgrano',
      email: 'marcos@belgrano.test',
      password: 'password123',
      telefono: '1122334455',
      direccion: 'Av Cabildo 2040',
      plan: 'pro',
    })

    const res = await request(app)
      .get('/api/negocios/superadmin/todos')
      .set('Authorization', `Bearer ${superadminToken}`)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThanOrEqual(1)

    const salon = res.body.find((n) => n.slug === 'belgrano-barber')
    expect(salon).toBeDefined()
    expect(salon.metricas).toBeDefined()
    expect(salon.metricas.servicios).toBeGreaterThanOrEqual(2)
    expect(salon.metricas.empleados).toBeGreaterThanOrEqual(1)
  })

  it('permite al superadmin crear un negocio de cero con configuración personalizada avanzada', async () => {
    const payload = {
      nombre: 'Nordelta Grooming Lounge',
      slug: 'nordelta-grooming',
      emailOwner: 'diego@nordelta.test',
      nombreOwner: 'Diego Nordelta',
      plan: 'enterprise',
      direccion: 'Bahía Grande Nordelta 450',
      telefono: '1199887766',
      configuracion: {
        horaApertura: '08:00',
        horaCierre: '22:00',
        intervaloMinutos: 45,
        bufferMinutos: 15,
        cancelacionMinimaHoras: 4,
        diasLaborales: [1, 2, 3, 4, 5, 6],
        notificacionesWhatsapp: true,
        instagram: '@nordeltagrooming',
      },
    }

    const res = await request(app)
      .post('/api/negocios/superadmin/crear')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send(payload)

    expect(res.status).toBe(201)
    expect(res.body.nombre).toBe('Nordelta Grooming Lounge')
    expect(res.body.slug).toBe('nordelta-grooming')
    expect(res.body.plan).toBe('enterprise')
    expect(res.body.configuracion.horaApertura).toBe('08:00')
    expect(res.body.configuracion.horaCierre).toBe('22:00')
    expect(res.body.configuracion.intervaloMinutos).toBe(45)
    expect(res.body.configuracion.bufferMinutos).toBe(15)
    expect(res.body.configuracion.cancelacionMinimaHoras).toBe(4)

    // Verificar en BD
    const dbNegocio = await Negocio.findOne({ slug: 'nordelta-grooming' })
    expect(dbNegocio).toBeTruthy()
    expect(dbNegocio.configuracion.instagram).toBe('@nordeltagrooming')
  })

  it('permite al superadmin actualizar datos y suspender/activar un salón', async () => {
    const neg = await Negocio.create({
      nombre: 'Salón Temporal',
      slug: 'salon-temporal',
      owner: (await Usuario.findOne({ rol: 'superadmin' }))._id,
      plan: 'free',
      activo: true,
    })

    // 1. Toggle estado (Suspender)
    const toggleRes = await request(app)
      .post(`/api/negocios/superadmin/${neg._id}/toggle`)
      .set('Authorization', `Bearer ${superadminToken}`)

    expect(toggleRes.status).toBe(200)
    expect(toggleRes.body.activo).toBe(false)

    // 2. Actualizar plan y configuraciones
    const updateRes = await request(app)
      .put(`/api/negocios/superadmin/${neg._id}`)
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({
        plan: 'pro',
        configuracion: {
          horaApertura: '10:00',
          horaCierre: '19:00',
        },
      })

    expect(updateRes.status).toBe(200)
    expect(updateRes.body.plan).toBe('pro')
    expect(updateRes.body.configuracion.horaApertura).toBe('10:00')

    // 3. Eliminar negocio
    const delRes = await request(app)
      .delete(`/api/negocios/superadmin/${neg._id}`)
      .set('Authorization', `Bearer ${superadminToken}`)

    expect(delRes.status).toBe(204)
    const dbDel = await Negocio.findById(neg._id)
    expect(dbDel).toBeNull()
  })

  it('Slot Engine respeta el horario de apertura, cierre y buffer configurados por el negocio', async () => {
    // Crear negocio con apertura 08:00 y cierre 14:00 (jornada reducida)
    const neg = await Negocio.create({
      nombre: 'Barbería Madrugadora',
      slug: 'barberia-madrugadora',
      owner: (await Usuario.findOne({ rol: 'superadmin' }))._id,
      activo: true,
      configuracion: {
        horaApertura: '08:00',
        horaCierre: '14:00',
        intervaloMinutos: 30,
      },
    })

    const emp = await Empleado.create({
      nombre: 'Santiago Madrugador',
      especialidad: 'Cortes Express',
      negocio: neg._id,
      activo: true,
    })

    const srv = await Servicio.create({
      nombre: 'Corte Rápido',
      precio: 5000,
      duracionMinutos: 30,
      negocio: neg._id,
      activo: true,
    })

    const fechaFutura = '2028-12-10'
    const dispRes = await request(app)
      .get(`/api/empleados/${emp._id}/disponibilidad`)
      .query({
        fecha: fechaFutura,
        servicioId: String(srv._id),
        timezoneOffset: 0,
      })

    expect(dispRes.status).toBe(200)
    const slots = dispRes.body.slots

    // El primer slot debe ser 08:00
    expect(slots[0].hora).toBe('08:00')
    expect(slots[0].disponible).toBe(true)

    // El último slot disponible debe ser 13:30 (ya que cierra a las 14:00)
    const slot1330 = slots.find((s) => s.hora === '13:30')
    expect(slot1330).toBeDefined()
    expect(slot1330.disponible).toBe(true)

    // Las 14:00 no debe estar en los slots generados
    const slot1400 = slots.find((s) => s.hora === '14:00')
    expect(slot1400).toBeUndefined()
  })
})
