// Emblema y columna de estudio inspirada en BarberPole en clave monocromática
export function BarberPole({ className = '' }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.06)] bg-zinc-950 ${className}`}
    >
      <div
        className="absolute inset-0 opacity-40 animate-pulse-subtle"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            #09090b 0px,
            #09090b 24px,
            #18181b 24px,
            #18181b 48px,
            #27272a 48px,
            #27272a 72px,
            rgba(255,255,255,0.08) 72px,
            rgba(255,255,255,0.08) 96px
          )`,
          backgroundSize: '200% 200%',
        }}
      />
      {/* Reflejo especular de cristal */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent pointer-events-none" />
      <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl pointer-events-none" />
    </div>
  )
}
