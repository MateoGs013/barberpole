import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Fuentes self-hosted vía @fontsource (cero requests a Google, cacheadas por
// el navegador). Subconjunto "latin" únicamente (cubre español: á é í ó ú ü ñ
// ¿ ¡), y solo los pesos que la UI realmente usa:
//   Inter (sans/cuerpo): 300, 400, 500, 600
//   Space Grotesk (display/títulos): 400, 500, 600, 700
//   JetBrains Mono (mono, cara dominante): 300, 400, 500, 600, 700
import '@fontsource/inter/latin-300.css'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/space-grotesk/latin-400.css'
import '@fontsource/space-grotesk/latin-500.css'
import '@fontsource/space-grotesk/latin-600.css'
import '@fontsource/space-grotesk/latin-700.css'
import '@fontsource/jetbrains-mono/latin-300.css'
import '@fontsource/jetbrains-mono/latin-400.css'
import '@fontsource/jetbrains-mono/latin-500.css'
import '@fontsource/jetbrains-mono/latin-600.css'
import '@fontsource/jetbrains-mono/latin-700.css'

import './index.css'
import App from './App.jsx'

// Registro de Service Worker para soporte PWA y carga instantánea
if ('serviceWorker' in navigator && !window.location.host.includes('localhost:5173')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch(() => {})
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
