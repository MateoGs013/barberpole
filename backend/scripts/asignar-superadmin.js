import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { Usuario } from '../src/models/Usuario.js'

const emailArg = process.argv[2]

if (!emailArg || !emailArg.includes('@')) {
  console.error('\n❌ Uso incorrecto. Especificá el email del usuario:')
  console.error('   npm run set-superadmin tu_email@gmail.com\n')
  process.exit(1)
}

const emailNorm = emailArg.trim().toLowerCase()
const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/peluqueria'

async function asignarSuperadmin() {
  try {
    await mongoose.connect(uri)
    console.log(`\nConectado a MongoDB: ${uri}`)

    let usuario = await Usuario.findOne({ email: emailNorm })

    if (usuario) {
      usuario.rol = 'superadmin'
      await usuario.save()
      console.log(`\n✅ ÉXITO: El usuario "${usuario.nombre}" (${usuario.email}) ahora es SUPERADMIN.`)
      console.log(`   Rol asignado: ${usuario.rol}`)
    } else {
      const passwordDefault = 'Admin2026!'
      const passwordHasheada = await bcrypt.hash(passwordDefault, 10)
      usuario = await Usuario.create({
        nombre: emailNorm.split('@')[0].toUpperCase(),
        email: emailNorm,
        password: passwordHasheada,
        rol: 'superadmin',
        authProvider: 'local',
      })
      console.log(`\n✅ ÉXITO: Se creó una nueva cuenta SUPERADMIN para ${usuario.email}.`)
      console.log(`   Contraseña inicial: ${passwordDefault} (podés cambiarla o ingresar con Google).`)
    }

    console.log('   Ya podés ingresar al sistema y acceder a la ruta /superadmin.\n')
  } catch (err) {
    console.error('\n❌ Error al asignar superadmin:', err.message)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
  }
}

asignarSuperadmin()
