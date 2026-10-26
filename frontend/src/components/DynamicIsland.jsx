import { motion } from 'framer-motion'
import { ArrowRight, Clock, User, Scissors } from 'lucide-react'

export function DynamicIsland({
  servicio,
  empleado,
  slot,
  onConfirmar,
  enviando = false,
  listo = false,
}) {
  const tieneContenido = Boolean(servicio || empleado || slot)

  if (!tieneContenido) return null

  return (
    <div className="fixed bottom-6 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
      <motion.div
        layout
        initial={{ y: 50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 50, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="relative pointer-events-auto w-full max-w-xl bg-[#18191D]/95 backdrop-blur-2xl border border-white/15 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-3 text-zinc-100"
      >
        <div className="flex items-center justify-between gap-3">
          {/* Resumen dinámico en píldoras */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none text-xs">
            {servicio && (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#15161A] border border-white/10 shrink-0"
              >
                <Scissors className="w-3.5 h-3.5 text-[#E55934]" />
                <span className="font-medium text-zinc-200 truncate max-w-[120px]">
                  {servicio.nombre}
                </span>
                <span className="font-mono text-zinc-400 text-[11px]">
                  ${servicio.precio?.toLocaleString('es-AR')}
                </span>
              </motion.div>
            )}

            {empleado && (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#15161A] border border-white/10 shrink-0"
              >
                <User className="w-3.5 h-3.5 text-zinc-400" />
                <span className="font-medium text-zinc-200 truncate max-w-[100px]">
                  {empleado.nombre}
                </span>
              </motion.div>
            )}

            {slot && (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#E55934]/20 border border-[#E55934]/40 text-white font-mono shrink-0"
              >
                <Clock className="w-3.5 h-3.5 text-[#E55934]" />
                <span className="font-bold text-xs">{slot.hora}</span>
              </motion.div>
            )}
          </div>

          {/* Botón de acción */}
          <div className="shrink-0">
            {listo ? (
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={onConfirmar}
                disabled={enviando}
                className="inline-flex items-center gap-2 px-4 py-2 rounded bg-[#E55934] text-white font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#d44e2b] transition-all cursor-pointer shadow-[0_0_15px_rgba(229,89,52,0.3)]"
              >
                {enviando ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Confirmar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </motion.button>
            ) : (
              <div className="px-3 py-1.5 font-mono text-[10px] text-zinc-500 uppercase tracking-widest hidden sm:block">
                Paso incompleto
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
