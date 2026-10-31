import 'dotenv/config'
import mongoose from 'mongoose'
import { validarEnv } from './src/config/env.js'
import { logger } from './src/config/logger.js'
import { conectarDB } from './src/config/db.js'
import { app } from './src/app.js'

// Valida el entorno antes de levantar nada: si falta algo crítico, corta acá.
const env = validarEnv()
const PORT = env.PORT

let server

const iniciar = async () => {
  await conectarDB()
  server = app.listen(PORT, () => {
    logger.info(`Servidor BarberPole escuchando en http://localhost:${PORT}`)
  })
}

const apagarGraciosamente = async (señal) => {
  logger.info(`Recibida señal ${señal}. Iniciando apagado controlado...`)

  // Timeout de seguridad para evitar cuelgues indefinidos
  const forceExitTimeout = setTimeout(() => {
    logger.error('El apagado controlado excedió el tiempo límite. Forzando salida.')
    process.exit(1)
  }, 10000)
  forceExitTimeout.unref()

  if (server) {
    server.close(async () => {
      logger.info('Servidor HTTP cerrado exitosamente.')
      try {
        await mongoose.disconnect()
        logger.info('Conexión con MongoDB cerrada.')
        process.exit(0)
      } catch (err) {
        logger.error({ err }, 'Error cerrando MongoDB')
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

