import request from 'supertest'
import { describe, it, expect } from 'vitest'
import { app } from '../src/app.js'
import { Cliente } from '../src/models/Cliente.js'
import { Usuario } from '../src/models/Usuario.js'

describe('Auth Endpoints & Atomic Client Creation', () => {
  it('registra un usuario y crea atómicamente su perfil Cliente', async () => {
    const payload = {
      nombre: 'Luciano Castro',
      email: 'luciano@barberpole.test',
      password: 'password123',
    }

    const res = await request(app).post('/api/auth/registro').send(payload)
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('token')
    expect(res.body.usuario).toMatchObject({
      nombre: payload.nombre,
      email: payload.email,
      rol: 'cliente',
    })

    // Verificar en BD que el Cliente se haya creado automáticamente vinculado
    const clienteCreado = await Cliente.findOne({ email: payload.email })
    expect(clienteCreado).not.toBeNull()
    expect(String(clienteCreado.usuario)).toBe(String(res.body.usuario.id))
    expect(clienteCreado.nombre).toBe(payload.nombre)
  })

  it('rechaza registro con email duplicado con código 409', async () => {
    const payload = {
      nombre: 'Matias Perez',
      email: 'matias@barberpole.test',
      password: 'password123',
    }

    await request(app).post('/api/auth/registro').send(payload)
    const resDuplicado = await request(app).post('/api/auth/registro').send(payload)

    expect(resDuplicado.status).toBe(409)
    expect(resDuplicado.body.error).toMatch(/ya existe/i)
  })

  it('inicia sesión con credenciales correctas y rechaza con inválidas', async () => {
    const usuario = {
      nombre: 'Esteban Quito',
      email: 'esteban@barberpole.test',
      password: 'password123',
    }
    await request(app).post('/api/auth/registro').send(usuario)

    // Login correcto
    const resOk = await request(app).post('/api/auth/login').send({
      email: usuario.email,
      password: usuario.password,
    })
    expect(resOk.status).toBe(200)
    expect(resOk.body).toHaveProperty('token')

    // Login con contraseña incorrecta
    const resBad = await request(app).post('/api/auth/login').send({
      email: usuario.email,
      password: 'wrongpassword',
    })
    expect(resBad.status).toBe(401)
    expect(resBad.body.error).toMatch(/inválidas/i)
  })

  it('rechaza acceso a ruta protegida sin token con 401', async () => {
    const res = await request(app).get('/api/auth/yo')
    expect(res.status).toBe(401)
  })

  it('autentica e inicia sesión con Google creando perfil atómico de cliente', async () => {
    const googlePayload = {
      nombre: 'Gonzalo Google',
      email: 'gonzalo.google@barberpole.test',
      googleId: 'google-sub-123456',
      avatar: 'https://lh3.googleusercontent.com/a/avatar123',
    }

    const res = await request(app).post('/api/auth/google').send(googlePayload)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('token')
    expect(res.body.usuario).toMatchObject({
      nombre: googlePayload.nombre,
      email: googlePayload.email,
      rol: 'cliente',
    })

    // Verificar en BD que el usuario no requiere password y tiene authProvider: 'google'
    const usuarioBD = await Usuario.findOne({ email: googlePayload.email })
    expect(usuarioBD).not.toBeNull()
    expect(usuarioBD.googleId).toBe(googlePayload.googleId)
    expect(usuarioBD.authProvider).toBe('google')

    // Verificar cliente creado atómicamente
    const clienteBD = await Cliente.findOne({ email: googlePayload.email })
    expect(clienteBD).not.toBeNull()
    expect(String(clienteBD.usuario)).toBe(String(usuarioBD._id))
  })
})
