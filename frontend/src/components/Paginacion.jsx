// Controles de paginación brutalistas. Si hay solo una página, no renderiza
// nada — el caller no necesita ocultarlo manualmente.

export function Paginacion({ pagina, totalPaginas, onCambiar }) {
  if (totalPaginas <= 1) return null

  const anterior = () => onCambiar(Math.max(1, pagina - 1))
  const siguiente = () => onCambiar(Math.min(totalPaginas, pagina + 1))

  return (
    <nav
      aria-label="Paginación"
      className="flex items-center justify-between gap-3 mt-8 pt-6 border-t-3 border-negro"
    >
      <button
        type="button"
        onClick={anterior}
        disabled={pagina === 1}
        className="btn btn-secundario !px-3 !py-2 text-xs"
      >
        ← Anterior
      </button>
      <p className="font-mono text-xs uppercase tracking-tight text-center">
        Página <span className="font-display font-bold text-base">{pagina}</span> de{' '}
        <span className="font-display font-bold text-base">{totalPaginas}</span>
      </p>
      <button
        type="button"
        onClick={siguiente}
        disabled={pagina === totalPaginas}
        className="btn btn-secundario !px-3 !py-2 text-xs"
      >
        Siguiente →
      </button>
    </nav>
  )
}
