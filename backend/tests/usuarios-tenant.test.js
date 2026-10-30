import request from 'supertest'
import { describe, it, expect, beforeEach } from 'vitest'
import { app } from '../src/app.js'

// Verifica que la gestión de usuarios (/api/usuarios) esté aislada por negocio:
// un admin solo puede ver y tocar usuarios de su propio tenant.

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

describe('Aislamiento multi-tenant de /api/usuarios', () => {
  let tokenA
  let tokenB
  let adminAId
  let adminBId

  beforeEach(async () => {
    const resA = await onboard('tenant-a')
    const resB = await onboard('tenant-b')
    tokenA = resA.body.token
    tokenB = resB.body.token
    adminAId = resA.body.usuario.id
    adminBId = resB.body.usuario.id
  })

  it('un admin solo ve usuarios de su propio negocio en el listado', async () => {
    // Admin A crea un empleado en su tenant
    await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ nombre: 'Empleado A', email: 'empleado-a@tenant-a.test', password: 'password123', rol: 'empleado' })

    const listadoA = await request(app).get('/api/usuarios').set('Authorization', `Bearer ${tokenA}`)
    expect(listadoA.status).toBe(200)
    const emailsA = listadoA.body.map((u) => u.email)
    expect(emailsA).toContain('admin@tenant-a.test')
    expect(emailsA).toContain('empleado-a@tenant-a.test')
    // No debe filtrarse ningún usuario del tenant B
    expect(emailsA).not.toContain('admin@tenant-b.test')

    const listadoB = await request(app).get('/api/usuarios').set('Authorization', `Bearer ${tokenB}`)
    const emailsB = listadoB.body.map((u) => u.email)
    expect(emailsB).toContain('admin@tenant-b.test')
    expect(emailsB).not.toContain('admin@tenant-a.test')
    expect(emailsB).not.toContain('empleado-a@tenant-a.test')
  })

  it('un admin no puede leer un usuario de otro negocio (404)', async () => {
    const res = await request(app)
      .get(`/api/usuarios/${adminBId}`)
      .set('Authorization', `Bearer ${tokenA}`)
    expect(res.status).toBe(404)
  })

  it('un admin no puede modificar (ni resetear la contraseña de) un usuario de otro negocio', async () => {
    const res = await request(app)
      .put(`/api/usuarios/${adminBId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ password: 'hackeada123' })
    expect(res.status).toBe(404)

    // La contraseña original del admin B sigue funcionando
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@tenant-b.test', password: 'password123' })
    expect(login.status).toBe(200)
  })

  it('un admin no puede eliminar un usuario de otro negocio (404)', async () => {
    const res = await request(app)
      .delete(`/api/usuarios/${adminBId}`)
      .set('Authorization', `Bearer ${tokenA}`)
    expect(res.status).toBe(404)
  })

  it('al crear un usuario, queda forzado al negocio del admin (ignora negocio inyectado)', async () => {
    const res = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        nombre: 'Inyectado',
        email: 'inyectado@tenant-a.test',
        password: 'password123',
        rol: 'empleado',
        negocio: '507f1f77bcf86cd799439011', // intento de mass-assignment a otro negocio
      })
    expect(res.status).toBe(201)

    // El admin B no debe verlo: quedó en el tenant A, no en el negocio inyectado
    const listadoB = await request(app).get('/api/usuarios').set('Authorization', `Bearer ${tokenB}`)
    const emailsB = listadoB.body.map((u) => u.email)
    expect(emailsB).not.toContain('inyectado@tenant-a.test')

    const listadoA = await request(app).get('/api/usuarios').set('Authorization', `Bearer ${tokenA}`)
    const emailsA = listadoA.body.map((u) => u.email)
    expect(emailsA).toContain('inyectado@tenant-a.test')
  })
})
