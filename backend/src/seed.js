// Script de inicialización para producción / despliegue.
// Crea el usuario Superadmin y Admin iniciales a partir de variables de entorno.
// Ejecutar con `npm run seed` en el entorno donde se realice el deploy.

import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { conectarDB } from './config/db.js'
import { Usuario } from './models/Usuario.js'
import mongoose from 'mongoose'

const SUPERADMIN_EMAIL = process.env.INITIAL_SUPERADMIN_EMAIL
const SUPERADMIN_PASSWORD = process.env.INITIAL_SUPERADMIN_PASSWORD

const ADMIN_EMAIL = process.env.INITIAL_ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.INITIAL_ADMIN_PASSWORD

const seed = async () => {
  await conectarDB()

  if (SUPERADMIN_EMAIL && SUPERADMIN_PASSWORD) {
    const yaExiste = await Usuario.findOne({ email: SUPERADMIN_EMAIL.toLowerCase().trim() })
    if (yaExiste) {
      console.log(`El superadmin ${SUPERADMIN_EMAIL} ya existe, omitiendo creación.`)
    } else {
      const passwordHasheada = await bcrypt.hash(SUPERADMIN_PASSWORD, 10)
      await Usuario.create({
        nombre: 'Super Administrador (Platform)',
        email: SUPERADMIN_EMAIL.toLowerCase().trim(),
        password: passwordHasheada,
        rol: 'superadmin',
      })
      console.log(`✓ Superadmin creado exitosamente: ${SUPERADMIN_EMAIL}`)
    }
  } else {
    console.log('ℹ INITIAL_SUPERADMIN_EMAIL o INITIAL_SUPERADMIN_PASSWORD no definidas en el entorno.')
  }

  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    const yaExiste = await Usuario.findOne({ email: ADMIN_EMAIL.toLowerCase().trim() })
    if (yaExiste) {
      console.log(`El admin ${ADMIN_EMAIL} ya existe, omitiendo creación.`)
    } else {
      const passwordHasheada = await bcrypt.hash(ADMIN_PASSWORD, 10)
      await Usuario.create({
        nombre: 'Administrador Principal',
        email: ADMIN_EMAIL.toLowerCase().trim(),
        password: passwordHasheada,
        rol: 'admin',
      })
      console.log(`✓ Admin creado exitosamente: ${ADMIN_EMAIL}`)
    }
  } else {
    console.log('ℹ INITIAL_ADMIN_EMAIL o INITIAL_ADMIN_PASSWORD no definidas en el entorno.')
  }

  await mongoose.disconnect()
  process.exit(0)
}

seed().catch((err) => {
  console.error('Error en el seed:', err)
  process.exit(1)
})
