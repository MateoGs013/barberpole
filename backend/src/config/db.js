// Conexión a MongoDB usando Mongoose.
// Si la conexión falla, cortamos el proceso: no tiene sentido levantar el
// servidor sin base de datos.

import mongoose from 'mongoose'
import dns from 'node:dns'

export const conectarDB = async () => {
  try {
    const uri = process.env.MONGODB_URI
    if (!uri) throw new Error('MONGODB_URI no está definida en .env')

    // MongoDB Atlas usa connection strings con prefijo "mongodb+srv://" que
    // resuelven los nodos del cluster vía un registro DNS de tipo SRV.
    // Solo forzamos DNS externo si es Atlas, para no romper la resolución
    // interna de nombres de contenedores en Docker (127.0.0.11).
    if (uri.startsWith('mongodb+srv://')) {
      try {
        dns.setServers(['1.1.1.1', '8.8.8.8'])
      } catch (dnsErr) {
        console.warn('No se pudo aplicar DNS personalizado para SRV:', dnsErr.message)
      }
    }

    await mongoose.connect(uri)
    console.log('MongoDB conectado exitosamente')
  } catch (error) {
    console.error('Error conectando a MongoDB:', error.message)
    process.exit(1)
  }
}
