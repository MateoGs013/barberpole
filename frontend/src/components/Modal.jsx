// Modal táctil estilo Bencho con Framer Motion, backdrop blur y WAI-ARIA
import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
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
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onCerrar}
      role="presentation"
    >
      <motion.div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-titulo"
        tabIndex="-1"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className={`w-full ${ancho} m-auto my-auto max-h-[92vh] flex flex-col outline-none rounded-none bg-[#0a0a0a] border border-white/20 text-white shadow-2xl relative`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 sm:px-6 py-4 shrink-0 bg-[#0a0a0a]">
          <h2 id="modal-titulo" className="font-mono font-medium text-base sm:text-lg uppercase text-white tracking-tight">
            {titulo}
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            className="p-1.5 text-neutral-400 hover:text-white transition-colors outline-none cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 sm:p-6 overflow-y-auto">{children}</div>
      </motion.div>
    </div>
  )
}
