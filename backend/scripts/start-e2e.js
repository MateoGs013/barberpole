// Arranque del backend para tests e2e: levanta una MongoDB efímera en memoria
// y luego el servidor real apuntado a ella. Pensado para ser lanzado por el
// webServer de Playwright. No usar en producción.

import { MongoMemoryServer } from 'mongodb-memory-server'

const mongod = await MongoMemoryServer.create()

// Importante: setear el entorno ANTES de importar el server (app.js lee algunas
// de estas al cargarse). dotenv no pisa variables ya definidas, así que ganan estas.
process.env.MONGODB_URI = mongod.getUri()
process.env.NODE_ENV = 'development' // CORS abierto para el proxy de Vite
process.env.JWT_SECRET = process.env.JWT_SECRET || 'e2e-jwt-secret-key-super-secure-0123456789'
process.env.JWT_EXPIRES_IN = '1d'
process.env.PORT = process.env.PORT || '4000'
process.env.LOG_LEVEL = 'silent'

const limpiar = async () => {
  try {
    await mongod.stop()
  } catch {
    // ignorar
  }
  process.exit(0)
}
process.on('SIGTERM', limpiar)
process.on('SIGINT', limpiar)

// El server real valida el entorno, conecta a la Mongo efímera y empieza a escuchar.
await import('../server.js')
