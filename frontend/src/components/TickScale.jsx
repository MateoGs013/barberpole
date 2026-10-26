export function TickScale({
  direction = 'horizontal',
  count = 16,
  height = 'h-6',
  className = '',
}) {
  return (
    <div
      aria-hidden="true"
      className={`flex items-end select-none pointer-events-none ${
        direction === 'horizontal' ? 'gap-1' : 'flex-col gap-1'
      } ${className}`}
    >
      {Array.from({ length: count }).map((_, i) => {
        // Altura variable sutil estilo dial de radio / Teenage Engineering
        const isTall = i % 4 === 0
        const isMed = i % 2 === 0
        return (
          <span
            key={i}
            className={`w-[1px] bg-white/20 transition-all ${
              direction === 'horizontal'
                ? isTall
                  ? 'h-6 bg-white/40'
                  : isMed
                    ? 'h-4 bg-white/25'
                    : 'h-2.5 bg-white/15'
                : isTall
                  ? 'w-6 bg-white/40'
                  : isMed
                    ? 'w-4 bg-white/25'
                    : 'w-2.5 bg-white/15'
            }`}
          />
        )
      })}
    </div>
  )
}
