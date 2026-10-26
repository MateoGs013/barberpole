import request from 'supertest'
import { describe, it, expect } from 'vitest'
import { app } from '../src/app.js'
import { Negocio } from '../src/models/Negocio.js'
import { Usuario } from '../src/models/Usuario.js'
import { Servicio } from '../src/models/Servicio.js'
import { Empleado } from '../src/models/Empleado.js'

describe('B2B Multi-Tenant SaaS Architecture', () => {
  it('registra un nuevo salón mediante el wizard de onboarding', async () => {
    const payload = {
      nombreNegocio: 'Vanguard Barber Studio',
      slug: 'vanguard-studio',
      email: 'founder@vanguard.io',
      password: 'securePass123!',
      nombreOwner: 'Mateo Founder',
      telefono: '+54 11 9999 8888',
      direccion: 'Av. Santa Fe 3400, CABA',
      plan: 'pro',
    }

    const res = await request(app).post('/api/negocios/onboarding').send(payload)

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('token')
    expect(res.body).toHaveProperty('negocio')
    expect(res.body.negocio.slug).toBe('vanguard-studio')
    expect(res.body.negocio.plan).toBe('pro')
    expect(res.body.usuario.email).toBe('founder@vanguard.io')
    expect(res.body.usuario.rol).toBe('admin')

    // Verificar en BD
    const negocioBD = await Negocio.findOne({ slug: 'vanguard-studio' })
    expect(negocioBD).not.toBeNull()
    expect(negocioBD.nombre).toBe('Vanguard Barber Studio')
    expect(String(negocioBD.owner)).toBe(String(res.body.usuario.id))
  })

  it('rechaza un slug duplicado con código 409', async () => {
    const payload1 = {
      nombreNegocio: 'Studio Uno',
      slug: 'studio-uno',
      email: 'uno@studio.io',
      password: 'pass12345',
      nombreOwner: 'Admin Uno',
    }
    await request(app).post('/api/negocios/onboarding').send(payload1)

    const payload2 = {
      nombreNegocio: 'Studio Uno Clon',
      slug: 'studio-uno',
      email: 'otro@studio.io',
      password: 'pass12345',
      nombreOwner: 'Admin Dos',
    }
    const res = await request(app).post('/api/negocios/onboarding').send(payload2)

    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/slug.*registrado/i)
  })

  it('obtiene el portal público de un tenant por slug con sus servicios y profesionales', async () => {
    // 1. Crear tenant
    const onboardingRes = await request(app).post('/api/negocios/onboarding').send({
      nombreNegocio: 'The Classic Cut',
      slug: 'classic-cut',
      email: 'boss@classic.io',
      password: 'pass12345',
      nombreOwner: 'Big Boss',
    })
    const negocioId = onboardingRes.body.negocio.id

    // 2. Crear servicio y empleado adicional bajo este tenant
    await Servicio.create({
      nombre: 'Fade Personalizado',
      duracionMinutos: 45,
      precio: 8500,
      negocio: negocioId,
    })

    await Empleado.create({
      nombre: 'Barbero Alpha',
      email: 'alpha@classic.io',
      especialidad: 'Degradé',
      telefono: '1122334455',
      negocio: negocioId,
    })

    // 3. Consultar endpoint público sin token
    const resPublico = await request(app).get('/api/negocios/publico/classic-cut')

    expect(resPublico.status).toBe(200)
    expect(resPublico.body.negocio.nombre).toBe('The Classic Cut')
    expect(resPublico.body.servicios.some((s) => s.nombre === 'Fade Personalizado')).toBe(true)
    expect(resPublico.body.empleados.some((e) => e.nombre === 'Barbero Alpha')).toBe(true)
  })

  it('aísla los datos entre diferentes tenants (servicios creados en Tenant A no son visibles por Tenant B)', async () => {
    // Tenant A
    const resA = await request(app).post('/api/negocios/onboarding').send({
      nombreNegocio: 'Barberia Norte',
      slug: 'norte',
      email: 'norte@barber.io',
      password: 'pass12345',
      nombreOwner: 'Admin Norte',
    })
    const tokenA = resA.body.token

    // Tenant B
    const resB = await request(app).post('/api/negocios/onboarding').send({
      nombreNegocio: 'Barberia Sur',
      slug: 'sur',
      email: 'sur@barber.io',
      password: 'pass12345',
      nombreOwner: 'Admin Sur',
    })
    const tokenB = resB.body.token

    // Crear servicio en Tenant A
    const postA = await request(app)
      .post('/api/servicios')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        nombre: 'Corte Norte Exclusivo',
        duracionMinutos: 30,
        precio: 5000,
      })
    expect(postA.status).toBe(201)

    // Crear servicio en Tenant B
    const postB = await request(app)
      .post('/api/servicios')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        nombre: 'Corte Sur Exclusivo',
        duracionMinutos: 40,
        precio: 6000,
      })
    expect(postB.status).toBe(201)

    // Consultar servicios como Admin A
    const listadoA = await request(app)
      .get('/api/servicios')
      .set('Authorization', `Bearer ${tokenA}`)
    expect(listadoA.status).toBe(200)
    const serviciosA = listadoA.body.datos || listadoA.body
    expect(serviciosA.some((s) => s.nombre === 'Corte Norte Exclusivo')).toBe(true)
    expect(serviciosA.some((s) => s.nombre === 'Corte Sur Exclusivo')).toBe(false)

    // Consultar servicios como Admin B
    const listadoB = await request(app)
      .get('/api/servicios')
      .set('Authorization', `Bearer ${tokenB}`)
    expect(listadoB.status).toBe(200)
    const serviciosB = listadoB.body.datos || listadoB.body
    expect(serviciosB.some((s) => s.nombre === 'Corte Sur Exclusivo')).toBe(true)
    expect(serviciosB.some((s) => s.nombre === 'Corte Norte Exclusivo')).toBe(false)
  })
})
