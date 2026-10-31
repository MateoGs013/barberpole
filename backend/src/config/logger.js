// Logger estructurado (JSON) basado en pino.
// En test queda en 'silent' para no ensuciar la salida de la suite.
// En producción emite JSON (ideal para agregadores de logs); en desarrollo
// se puede pipear por `pino-pretty` si se quiere salida legible.

import pino from 'pino'

const nivel =
  process.env.NODE_ENV === 'test' ? 'silent' : process.env.LOG_LEVEL || 'info'

export const logger = pino({
  level: nivel,
  // No logueamos secretos ni tokens aunque aparezcan en algún objeto.
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      '*.password',
      'token',
      '*.token',
    ],
    censor: '[REDACTED]',
  },
})
