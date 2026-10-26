import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Usuario } from '../models/Usuario.js'
import { Cliente } from '../models/Cliente.js'
import { Empleado } from '../models/Empleado.js'

const obtenerSuperadminEmails = () => {
  const envSuperadmins = process.env.SUPERADMIN_EMAILS || process.env.INITIAL_SUPERADMIN_EMAIL || ''
  return envSuperadmins
    .toLowerCase()
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)
}

const SALT_ROUNDS = 10

export const registrarUsuario = async ({ nombre, email, password, negocio = null }) => {
  const yaExiste = await Usuario.findOne({ email })
  if (yaExiste) {
    const error = new Error('Ya existe un usuario con ese email')
    error.status = 409
    throw error
  }

  const passwordHasheada = await bcrypt.hash(password, SALT_ROUNDS)

  const usuario = await Usuario.create({
    nombre,
    email,
    password: passwordHasheada,
    negocio: negocio || null,
  })

  // Creación atómica del perfil Cliente vinculado
  try {
    await Cliente.create({
      nombre: usuario.nombre,
      email: usuario.email,
      usuario: usuario._id,
      negocio: negocio || null,
    })
  } catch (error) {
    await Usuario.findByIdAndDelete(usuario._id)
    throw error
  }

  return generarRespuestaAuth(usuario)
}

export const iniciarSesion = async ({ email, password }) => {
  const usuario = await Usuario.findOne({ email }).select('+password')
  if (!usuario) {
    const error = new Error('Credenciales inválidas')
    error.status = 401
    throw error
  }

  const coincide = await bcrypt.compare(password, usuario.password)
  if (!coincide) {
    const error = new Error('Credenciales inválidas')
    error.status = 401
    throw error
  }

  const superadmins = obtenerSuperadminEmails()
  if (superadmins.includes(usuario.email.toLowerCase()) && usuario.rol !== 'superadmin') {
    usuario.rol = 'superadmin'
    await usuario.save()
  }

  return generarRespuestaAuth(usuario)
}

export const obtenerUsuarioPorId = async (id) => {
  return Usuario.findById(id).populate('negocio')
}

export const autenticarConGoogle = async ({
  credential = null,
  email,
  nombre,
  googleId,
  avatar = null,
  negocio = null,
}) => {
  let finalEmail = email
  let finalNombre = nombre
  let finalGoogleId = googleId
  let finalAvatar = avatar

  // Si se envió un credential (JWT ID token emitido por Google Identity Services)
  if (credential) {
    try {
      const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`)
      if (res.ok) {
        const payload = await res.json()
        finalEmail = payload.email
        finalNombre = payload.name || payload.given_name || 'Usuario Google'
        finalGoogleId = payload.sub
        finalAvatar = payload.picture || null
      } else {
        if (process.env.NODE_ENV === 'production') {
          const error = new Error('Token de Google inválido')
          error.status = 401
          throw error
        }
        const parts = credential.split('.')
        if (parts.length === 3) {
          const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'))
          finalEmail = decoded.email || finalEmail
          finalNombre = decoded.name || finalNombre || 'Usuario Google'
          finalGoogleId = decoded.sub || finalGoogleId
          finalAvatar = decoded.picture || finalAvatar
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'production') throw err
      // Fallback a los datos directos en entorno de test/desarrollo sin red
    }
  } else if (process.env.NODE_ENV === 'production') {
    const error = new Error('Token de Google Identity Services (credential) obligatorio en producción')
    error.status = 400
    throw error
  }

  if (!finalEmail) {
    const error = new Error('No se pudo obtener el email de la cuenta de Google')
    error.status = 400
    throw error
  }

  const superadmins = obtenerSuperadminEmails()
  const esSuperadmin = superadmins.includes(finalEmail.toLowerCase())

  let usuario = await Usuario.findOne({
    $or: [{ email: finalEmail }, ...(finalGoogleId ? [{ googleId: finalGoogleId }] : [])],
  })

  if (usuario) {
    let modificado = false
    if (!usuario.googleId && finalGoogleId) {
      usuario.googleId = finalGoogleId
      modificado = true
    }
    if (!usuario.avatar && finalAvatar) {
      usuario.avatar = finalAvatar
      modificado = true
    }
    if (esSuperadmin && usuario.rol !== 'superadmin') {
      usuario.rol = 'superadmin'
      modificado = true
    }
    if (modificado) {
      await usuario.save()
    }
  } else {
    usuario = await Usuario.create({
      nombre: finalNombre || 'Usuario Google',
      email: finalEmail,
      googleId: finalGoogleId || `google_${Date.now()}`,
      avatar: finalAvatar,
      authProvider: 'google',
      rol: esSuperadmin ? 'superadmin' : 'cliente',
      negocio: negocio || null,
    })

    try {
      await Cliente.create({
        nombre: usuario.nombre,
        email: usuario.email,
        usuario: usuario._id,
        negocio: negocio || null,
      })
    } catch (err) {
      await Usuario.findByIdAndDelete(usuario._id)
      throw err
    }
  }

  let clienteExistente = await Cliente.findOne({ usuario: usuario._id })
  if (!clienteExistente && usuario.rol === 'cliente') {
    await Cliente.create({
      nombre: usuario.nombre,
      email: usuario.email,
      usuario: usuario._id,
      negocio: usuario.negocio || null,
    })
  }

  // Sincronización y enlace automático con perfiles de profesional (Empleado)
  try {
    await Empleado.updateMany(
      { email: finalEmail },
      {
        $set: {
          usuario: usuario._id,
          googleCalendarId: finalEmail,
          googleSyncActivo: true,
        },
      }
    )
  } catch {}

  return generarRespuestaAuth(usuario)
}

export const generarRespuestaAuth = (usuario) => {
  const payload = {
    id: usuario._id.toString(),
    rol: usuario.rol,
    negocio: usuario.negocio ? usuario.negocio.toString() : null,
  }

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })

  return {
    token,
    usuario: {
      id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      negocio: usuario.negocio,
    },
  }
}
