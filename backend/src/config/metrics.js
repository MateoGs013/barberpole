// Métricas Prometheus. Expone un registry propio con:
//  - métricas por defecto del proceso Node (CPU, memoria, event loop, GC)
//  - duración y total de requests HTTP, etiquetadas por método, ruta y status.
// La ruta se normaliza (ids -> :id) para acotar la cardinalidad de las series.

import client from 'prom-client'

export const register = new client.Registry()
register.setDefaultLabels({ app: 'barberpole-api' })
client.collectDefaultMetrics({ register })

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duración de las requests HTTP en segundos',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
})

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total de requests HTTP procesadas',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
})

// Normaliza el path para acotar cardinalidad: usa el patrón de ruta montado
// (ej. /api/turnos/:id) y, como fallback, reemplaza ObjectIds y números por :id.
const normalizarRuta = (req) => {
  const base = req.baseUrl || ''
  const ruta = req.route?.path && req.route.path !== '/' ? req.route.path : ''
  let full = `${base}${ruta}` || req.path || req.originalUrl.split('?')[0] || ''
  full = full
    .replace(/\/[0-9a-fA-F]{24}(?=\/|$)/g, '/:id')
    .replace(/\/\d+(?=\/|$)/g, '/:id')
  return full || 'unknown'
}

// Middleware que mide duración y cuenta cada request al terminar la respuesta.
export const metricsMiddleware = (req, res, next) => {
  if (req.path === '/metrics') return next()
  const finTimer = httpRequestDuration.startTimer()
  res.on('finish', () => {
    const labels = {
      method: req.method,
      route: normalizarRuta(req),
      status_code: res.statusCode,
    }
    finTimer(labels)
    httpRequestsTotal.inc(labels)
  })
  next()
}

// Handler del endpoint /metrics (formato de exposición de Prometheus).
export const metricsHandler = async (req, res) => {
  res.set('Content-Type', register.contentType)
  res.end(await register.metrics())
}
