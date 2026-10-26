import { motion } from 'framer-motion'

export function BorderBeam({
  className = '',
  duration = 8,
  borderWidth = 1.5,
  colorFrom = '#ffffff',
  colorTo = '#10b981',
}) {
  return (
    <div
      style={{
        padding: `${borderWidth}px`,
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
      }}
      className={`pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden ${className}`}
    >
      <motion.div
        className="absolute -inset-[100%] m-auto"
        style={{
          width: '200%',
          height: '200%',
          background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 310deg, ${colorFrom} 345deg, ${colorTo} 360deg)`,
        }}
        animate={{ rotate: 360 }}
        transition={{
          repeat: Infinity,
          duration,
          ease: 'linear',
        }}
      />
    </div>
  )
}
