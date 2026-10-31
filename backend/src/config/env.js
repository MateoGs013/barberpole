// Validación de variables de entorno al arranque (fail-fast).
// Si falta o es inválida una variable crítica, el proceso corta con un mensaje
// claro en vez de fallar más tarde de forma confusa en runtime.

import { z } from 'zod'

const esquema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI es obligatoria'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET debe tener al menos 16 caracteres'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  // Opcionales: la app degrada con gracia si no están (CORS abierto en dev,
  // login con Google deshabilitado, etc.).
  FRONTEND_URL: z.string().optional(),
  SUPERADMIN_EMAILS: z.string().optional(),
  INITIAL_SUPERADMIN_EMAIL: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALENDAR_REDIRECT_URI: z.string().optional(),
})

// Función pura: valida un objeto fuente (por defecto process.env) y devuelve el
// resultado de zod sin efectos secundarios. Testeable sin matar el proceso.
export const parsearEnv = (fuente = process.env) => esquema.safeParse(fuente)

// Wrapper para el arranque: valida process.env y, si falla, imprime los errores
// y corta el proceso. Devuelve el env tipado y normalizado.
export const validarEnv = () => {
  const resultado = parsearEnv()
  if (!resultado.success) {
    console.error('❌ Variables de entorno inválidas:')
    for (const issue of resultado.error.issues) {
      console.error(`  - ${issue.path.join('.') || '(raíz)'}: ${issue.message}`)
    }
    process.exit(1)
  }
  return resultado.data
}
