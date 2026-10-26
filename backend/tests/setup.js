import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { beforeAll, afterAll, beforeEach } from 'vitest'

process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-secret-key-super-secure-123456789'
process.env.JWT_EXPIRES_IN = '1d'

let mongod

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  const uri = mongod.getUri()
  await mongoose.connect(uri)
})

beforeEach(async () => {
  const collections = mongoose.connection.collections
  for (const key in collections) {
    await collections[key].deleteMany({})
  }
})

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect()
  }
  if (mongod) {
    await mongod.stop()
  }
})
