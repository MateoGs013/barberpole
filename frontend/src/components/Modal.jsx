// Modal táctil estilo Bencho con Framer Motion, backdrop blur y WAI-ARIA
import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

export function Modal({ abierto, onCerrar, titulo, children, ancho = 'max-w-lg' }) {
  const modalRef = useRef(null)
  const previoFocusRef = useRef(null)

  useEffect(() => {
    if (!abierto) return

    previoFocusRef.current = document.activeElement
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusableElementsSelector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

    const enfocarInicial = setTimeout(() => {
      if (modalRef.current) {
        const elementos = modalRef.current.querySelectorAll(focusableElementsSelector)
        if (elementos.length > 0) {
          elementos[0].focus()
        } else {
          modalRef.current.focus()
        }
      }
    }, 50)

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCerrar()
        return
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusables = Array.from(modalRef.current.querySelectorAll(focusableElementsSelector))
        if (focusables.length === 0) {
          e.preventDefault()
          return
        }

        const primerElem = focusables[0]
        const ultimoElem = focusables[focusables.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === primerElem) {
            e.preventDefault()
            ultimoElem.focus()
          }
        } else {
          if (document.activeElement === ultimoElem) {
            e.preventDefault()
            primerElem.focus()
          }
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      clearTimeout(enfocarInicial)
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', onKeyDown)
      if (previoFocusRef.current && typeof previoFocusRef.current.focus === 'function') {
        previoFocusRef.current.focus()
      }
    }
  }, [abierto, onCerrar])

  if (!abierto) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={onCerrar}
      role="presentation"
    >
      <motion.div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-titulo"
        tabIndex="-1"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', stiffness: 450, damping: 30 }}
        className={`w-full ${ancho} my-8 outline-none rounded-none bg-black border border-white/20 overflow-hidden text-white`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 id="modal-titulo" className="font-mono font-medium text-lg uppercase text-white tracking-tight">
            {titulo}
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            className="p-1 text-neutral-400 hover:text-white transition-colors outline-none cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </motion.div>
    </div>
  )
}
