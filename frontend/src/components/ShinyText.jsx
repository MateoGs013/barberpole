import { motion } from 'framer-motion'

export function ShinyText({ children, className = '' }) {
  return (
    <span
      className={`relative inline-flex overflow-hidden font-mono text-xs uppercase tracking-widest ${className}`}
    >
      <span className="text-zinc-400">{children}</span>
      <motion.span
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent bg-clip-text text-transparent select-none pointer-events-none"
        initial={{ x: '-100%' }}
        animate={{ x: '200%' }}
        transition={{
          repeat: Infinity,
          repeatDelay: 2.5,
          duration: 1.6,
          ease: 'easeInOut',
        }}
      >
        {children}
      </motion.span>
    </span>
  )
}
