// Context global para Toasts Stacked con física Spring (inspirado en Sonner / Emil Kowalski)
// Micro-animaciones con Framer Motion, stack inteligente y síntesis auditiva Web Audio API.

import { createContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { soundManager } from '../utils/sound.js'

export const ToastContext = createContext(null)

let proximoId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const cerrar = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const agregar = useCallback(
    (mensaje, tipo = 'info') => {
      const id = ++proximoId

      if (tipo === 'exito') {
        soundManager.playSuccess()
      } else {
        soundManager.playPop()
      }

      setToasts((prev) => [...prev, { id, mensaje, tipo }])
      setTimeout(() => cerrar(id), 3800)
    },
    [cerrar]
  )

  const valor = {
    exito: (m) => agregar(m, 'exito'),
    error: (m) => agregar(m, 'error'),
    info: (m) => agregar(m, 'info'),
  }

  return (
    <ToastContext.Provider value={valor}>
      {children}
      <ContenedorToastsStacked toasts={toasts} onCerrar={cerrar} />
    </ToastContext.Provider>
  )
}

function ContenedorToastsStacked({ toasts, onCerrar }) {
  const [expandido, setExpandido] = useState(false)

  if (toasts.length === 0) return null

  // Invertido para que el más nuevo quede arriba
  const toastsVisibles = [...toasts].slice(-4).reverse()

  return (
    <aside
      aria-label="Notificaciones"
      onMouseEnter={() => setExpandido(true)}
      onMouseLeave={() => setExpandido(false)}
      className="fixed bottom-6 right-6 z-[80] flex flex-col items-end pointer-events-none"
    >
      <div className="relative flex flex-col items-end w-full max-w-sm pointer-events-auto">
        <AnimatePresence mode="popLayout">
          {toastsVisibles.map((toast, index) => {
            const esPrincipal = index === 0

            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{
                  opacity: expandido ? 1 : 1 - index * 0.18,
                  y: expandido ? index * 8 : -index * 10,
                  scale: expandido ? 1 : 1 - index * 0.05,
                  zIndex: 50 - index,
                }}
                exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
                transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                className={`w-full rounded-xl border border-white/15 bg-zinc-950/95 backdrop-blur-xl p-3.5 shadow-[0_12px_30px_rgba(0,0,0,0.8)] text-zinc-100 mb-2 flex items-center justify-between gap-3 ${
                  !expandido && !esPrincipal ? 'pointer-events-none' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <IconoToast tipo={toast.tipo} />
                  <p className="font-mono text-xs text-zinc-200 tracking-tight leading-snug truncate">
                    {toast.mensaje}
                  </p>
                </div>

                <button
                  onClick={() => onCerrar(toast.id)}
                  className="p-1 rounded-md text-zinc-500 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                  aria-label="Cerrar notificación"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </aside>
  )
}

function IconoToast({ tipo }) {
  if (tipo === 'exito') {
    return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
  }
  if (tipo === 'error') {
    return <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
  }
  return <Info className="w-4 h-4 text-sky-400 shrink-0" />
}
