import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export function CustomSelect({
  id,
  name,
  valor,
  onChange,
  opciones = [],
  placeholder = 'Seleccionar...',
  disabled = false,
  className = '',
  label,
}) {
  const [abierto, setAbierto] = useState(false)
  const [focusIndex, setFocusIndex] = useState(-1)
  const containerRef = useRef(null)

  // Normalizar opciones a formato { valor, label, sublabel, badge }
  const normalizadas = opciones.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        valor: String(opt.valor ?? opt.id ?? ''),
        label: opt.label ?? opt.nombre ?? String(opt.valor ?? ''),
        sublabel: opt.sublabel ?? opt.descripcion ?? null,
        badge: opt.badge ?? null,
      }
    }
    return {
      valor: String(opt),
      label: String(opt),
      sublabel: null,
      badge: null,
    }
  })

  const valorStr = String(valor ?? '')
  const seleccionada = normalizadas.find((o) => o.valor === valorStr)

  // Cerrar al hacer clic afuera
  useEffect(() => {
    if (!abierto) return

    const clickAfuera = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setAbierto(false)
      }
    }
    document.addEventListener('mousedown', clickAfuera)
    return () => document.removeEventListener('mousedown', clickAfuera)
  }, [abierto])

  // Navegación con teclado
  const handleKeyDown = (e) => {
    if (disabled) return

    if (e.key === 'Escape') {
      setAbierto(false)
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!abierto) {
        setAbierto(true)
        setFocusIndex(0)
      } else {
        setFocusIndex((prev) => (prev + 1 < normalizadas.length ? prev + 1 : 0))
      }
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!abierto) {
        setAbierto(true)
        setFocusIndex(normalizadas.length - 1)
      } else {
        setFocusIndex((prev) => (prev - 1 >= 0 ? prev - 1 : normalizadas.length - 1))
      }
      return
    }

    if ((e.key === 'Enter' || e.key === ' ') && abierto && focusIndex >= 0) {
      e.preventDefault()
      const opt = normalizadas[focusIndex]
      if (opt) {
        onChange?.({ target: { value: opt.valor, name } }, opt.valor)
        setAbierto(false)
      }
      return
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setAbierto((prev) => !prev)
    }
  }

  const handleSeleccionar = (opt) => {
    onChange?.({ target: { value: opt.valor, name } }, opt.valor)
    setAbierto(false)
  }

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {label && (
        <label htmlFor={id} className="label">
          {label}
        </label>
      )}

      {/* Trigger Táctil Editorial */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setAbierto((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        className={`w-full py-2.5 px-0 bg-transparent border-b text-left font-mono text-xs flex items-center justify-between gap-2 select-none transition-all duration-150 outline-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
          abierto ? 'border-white text-white' : 'border-white/20 hover:border-white/50 text-white'
        }`}
      >
        <span className={`truncate ${seleccionada ? 'text-white font-medium' : 'text-neutral-500'}`}>
          {seleccionada ? seleccionada.label : placeholder}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
            abierto ? 'rotate-180 text-white' : 'text-neutral-400'
          }`}
        />
      </button>

      {/* Select nativo oculto para accesibilidad y serialización */}
      <select
        tabIndex={-1}
        aria-hidden="true"
        name={name}
        value={valorStr}
        onChange={(e) => onChange?.(e, e.target.value)}
        className="sr-only pointer-events-none"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {normalizadas.map((opt) => (
          <option key={opt.valor} value={opt.valor}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Menú Desplegable Flotante */}
      {abierto && (
        <div
          role="listbox"
          tabIndex={-1}
          className="absolute z-50 left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-[#0a0a0a] border border-white/20 shadow-2xl text-xs font-mono animate-in fade-in zoom-in-95 duration-100 divide-y divide-white/5"
        >
          {normalizadas.length === 0 ? (
            <div className="px-4 py-3 text-neutral-500 italic uppercase tracking-wider text-[11px]">
              Sin opciones disponibles
            </div>
          ) : (
            normalizadas.map((opt, idx) => {
              const estaSeleccionado = opt.valor === valorStr
              const tieneFoco = idx === focusIndex

              return (
                <div
                  key={opt.valor}
                  role="option"
                  aria-selected={estaSeleccionado}
                  onClick={() => handleSeleccionar(opt)}
                  onMouseEnter={() => setFocusIndex(idx)}
                  className={`px-4 py-3 flex items-center justify-between gap-3 cursor-pointer transition-colors duration-100 ${
                    estaSeleccionado
                      ? 'bg-white text-black font-medium'
                      : tieneFoco
                      ? 'bg-white/10 text-white'
                      : 'text-neutral-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="truncate uppercase tracking-wider">{opt.label}</span>
                    {opt.sublabel && (
                      <span
                        className={`text-[11px] font-sans font-light truncate ${
                          estaSeleccionado ? 'text-neutral-700' : 'text-neutral-500'
                        }`}
                      >
                        {opt.sublabel}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {opt.badge && (
                      <span
                        className={`text-[9px] uppercase px-1.5 py-0.5 border ${
                          estaSeleccionado ? 'border-black text-black' : 'border-white/20 text-neutral-400'
                        }`}
                      >
                        {opt.badge}
                      </span>
                    )}
                    {estaSeleccionado && <Check className="w-3.5 h-3.5 text-black shrink-0" />}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
