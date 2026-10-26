import 'dotenv/config'
import mongoose from 'mongoose'
import { conectarDB } from './src/config/db.js'
import { app } from './src/app.js'

const PORT = process.env.PORT || 4000

let server

const iniciar = async () => {
  await conectarDB()
  server = app.listen(PORT, () => {
    console.log(`Servidor BarberPole escuchando en http://localhost:${PORT}`)
  })
}

const apagarGraciosamente = async (señal) => {
  console.log(`\nRecibida señal ${señal}. Iniciando apagado controlado...`)

  // Timeout de seguridad para evitar cuelgues indefinidos
  const forceExitTimeout = setTimeout(() => {
    console.error('El apagado controlado excedió el tiempo límite. Forzando salida.')
    process.exit(1)
  }, 10000)
  forceExitTimeout.unref()

  if (server) {
    server.close(async () => {
      console.log('Servidor HTTP cerrado exitosamente.')
      try {
        await mongoose.disconnect()
        console.log('Conexión con MongoDB cerrada.')
        process.exit(0)
      } catch (err) {
        console.error('Error cerrando MongoDB:', err)
        process.exit(1)
      }
    })
  } else {
    process.exit(0)
  }
}

process.on('SIGINT', () => apagarGraciosamente('SIGINT'))
process.on('SIGTERM', () => apagarGraciosamente('SIGTERM'))

iniciar()

