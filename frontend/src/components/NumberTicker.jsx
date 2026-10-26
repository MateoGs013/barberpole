import { useEffect, useState } from 'react'

export function NumberTicker({ value, prefix = '', suffix = '', duration = 900 }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let startTime = null
    const numericValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]+/g, '')) || 0

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(Math.floor(eased * numericValue))

      if (progress < 1) {
        requestAnimationFrame(step)
      } else {
        setDisplayValue(numericValue)
      }
    }

    const rafId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafId)
  }, [value, duration])

  return (
    <span className="font-mono tabular-nums">
      {prefix}
      {displayValue.toLocaleString('es-AR')}
      {suffix}
    </span>
  )
}
