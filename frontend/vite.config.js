import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const zlib = require('node:zlib')

// Polyfill para compatibilidad con undici 8.12+ (requerido por JSDOM 30) en Node < 22.15
if (typeof zlib.createZstdDecompress !== 'function') {
  zlib.createZstdDecompress = function () {
    throw new Error('zstd decompression not supported in this Node version')
  }
}

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Config de Vite con plugin de React.
// El proxy redirige cualquier petición a /api al backend en localhost:4000
// durante el desarrollo: así evitamos problemas de CORS y podemos usar rutas
// relativas (axios.get('/api/turnos')) sin hardcodear el host.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    // Solo tests unitarios bajo src/. Los e2e de Playwright (e2e/) corren con `npm run test:e2e`.
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },
})
