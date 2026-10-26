import { motion } from 'framer-motion'
import { soundManager } from '../utils/sound.js'

export function TactileSlot({
  hora,
  horaFin,
  disponible = true,
  motivo,
  seleccionado = false,
  onClick,
}) {
  const handleClick = (e) => {
    if (!disponible) return
    soundManager.playClick()
    onClick?.(e)
  }

  return (
    <motion.button
      type="button"
      disabled={!disponible}
      onClick={handleClick}
      whileTap={disponible ? { scale: 0.96 } : undefined}
      className={`relative group flex flex-col items-center justify-center py-3 px-3 rounded-none transition-colors duration-150 select-none cursor-pointer border ${
        !disponible
          ? 'opacity-20 cursor-not-allowed border-neutral-800 text-neutral-600 bg-transparent'
          : seleccionado
            ? 'bg-white text-black border-white font-medium'
            : 'bg-transparent text-neutral-300 hover:text-white border-white/10 hover:border-white/40'
      }`}
    >
      <div className="flex items-center gap-1.5">
        <span
          className={`font-mono text-sm tracking-tight ${
            !disponible ? 'line-through text-neutral-600' : ''
          }`}
        >
          {hora}
        </span>
      </div>

      <span
        className={`font-mono text-[10px] mt-0.5 uppercase tracking-widest ${
          seleccionado ? 'text-neutral-700' : 'text-neutral-500'
        }`}
      >
        {!disponible ? motivo || 'Ocupado' : horaFin ? `${horaFin} HS` : 'LIBRE'}
      </span>
    </motion.button>
  )
}
