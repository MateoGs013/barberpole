import request from 'supertest'
import { describe, it, expect, beforeEach } from 'vitest'
import { app } from '../src/app.js'
import { Empleado } from '../src/models/Empleado.js'
import { Servicio } from '../src/models/Servicio.js'
import { Cliente } from '../src/models/Cliente.js'
import { Turno } from '../src/models/Turno.js'

// Verifica que un admin no pueda leer, modificar ni eliminar turnos ni empleados
// de OTRO negocio (IDOR cross-tenant en /api/turnos/:id y /api/empleados/:id).

const onboard = (slug) =>
  request(app)
    .post('/api/negocios/onboarding')
    .send({
      nombreNegocio: `Negocio ${slug}`,
      slug,
      email: `admin@${slug}.test`,
      password: 'password123',
      nombreOwner: `Admin ${slug}`,
    })

describe('Aislamiento multi-tenant de turnos y empleados', () => {
  let tokenA
  let tokenB
  let negocioAId
  let empleadoA
  let turnoA

  beforeEach(async () => {
    const resA = await onboard('tenant-a')
    const resB = await onboard('tenant-b')
    tokenA = resA.body.token
    tokenB = resB.body.token
    negocioAId = resA.body.negocio.id

    // El onboarding ya siembra un empleado y servicios en el tenant A
    empleadoA = await Empleado.findOne({ negocio: negocioAId })
    const servicioA = await Servicio.findOne({ negocio: negocioAId })
    const clienteA = await Cliente.create({
      nombre: 'Cliente A',
      email: 'cliente@tenant-a.test',
      negocio: negocioAId,
    })

    const inicio = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    turnoA = await Turno.create({
      negocio: negocioAId,
      cliente: clienteA._id,
      empleado: empleadoA._id,
      servicio: servicioA._id,
      fechaHora: inicio,
      fechaHoraFin: new Date(inicio.getTime() + 30 * 60_000),
      duracionMinutos: 30,
      precioCobrado: 8500,
      estado: 'confirmado',
    })
  })

  it('un admin NO puede leer un turno de otro negocio (403)', async () => {
    const res = await request(app)
      .get(`/api/turnos/${turnoA._id}`)
      .set('Authorization', `Bearer ${tokenB}`)
    expect(res.status).toBe(403)
  })

  it('un admin SÍ puede leer un turno de su propio negocio (200)', async () => {
    const res = await request(app)
      .get(`/api/turnos/${turnoA._id}`)
      .set('Authorization', `Bearer ${tokenA}`)
    expect(res.status).toBe(200)
    expect(String(res.body._id)).toBe(String(turnoA._id))
  })

  it('un admin NO puede modificar un turno de otro negocio (403)', async () => {
    const res = await request(app)
      .put(`/api/turnos/${turnoA._id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ notas: 'intrusión' })
    expect(res.status).toBe(403)

    // El turno quedó intacto
    const enBD = await Turno.findById(turnoA._id)
    expect(enBD.notas).not.toBe('intrusión')
  })

  it('un admin NO puede eliminar un turno de otro negocio (403)', async () => {
    const res = await request(app)
      .delete(`/api/turnos/${turnoA._id}`)
      .set('Authorization', `Bearer ${tokenB}`)
    expect(res.status).toBe(403)
    expect(await Turno.findById(turnoA._id)).not.toBeNull()
  })

  it('un admin NO puede modificar un empleado de otro negocio (403)', async () => {
    const res = await request(app)
      .put(`/api/empleados/${empleadoA._id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ nombre: 'Secuestrado' })
    expect(res.status).toBe(403)

    const enBD = await Empleado.findById(empleadoA._id)
    expect(enBD.nombre).not.toBe('Secuestrado')
  })

  it('un admin NO puede eliminar un empleado de otro negocio (403)', async () => {
    const res = await request(app)
      .delete(`/api/empleados/${empleadoA._id}`)
      .set('Authorization', `Bearer ${tokenB}`)
    expect(res.status).toBe(403)
    expect(await Empleado.findById(empleadoA._id)).not.toBeNull()
  })

  it('un admin SÍ puede modificar un empleado de su propio negocio (200)', async () => {
    const res = await request(app)
      .put(`/api/empleados/${empleadoA._id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ nombre: 'Nombre Actualizado' })
    expect(res.status).toBe(200)
    expect(res.body.nombre).toBe('Nombre Actualizado')
  })
})
