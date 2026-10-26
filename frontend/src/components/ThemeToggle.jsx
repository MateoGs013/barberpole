import { useTheme } from '../hooks/useTheme.js'

export function ThemeToggle({ className = '' }) {
  const { tema, alternarTema, esOscuro } = useTheme()

  return (
    <button
      type="button"
      onClick={alternarTema}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-xs uppercase tracking-wider border border-white/20 hover:border-white transition-colors cursor-pointer select-none ${className}`}
      title={esOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      aria-label={esOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      <span className="w-2 h-2 rounded-full border border-current flex items-center justify-center">
        <span className={`w-1 h-1 rounded-full ${esOscuro ? 'bg-white' : 'bg-black'}`} />
      </span>
      <span>{esOscuro ? 'MODO CLARO' : 'MODO OSCURO'}</span>
    </button>
  )
}
