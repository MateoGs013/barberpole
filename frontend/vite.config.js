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
  },
})
