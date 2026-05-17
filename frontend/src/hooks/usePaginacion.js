// Hook de paginación cliente-side.
// Recibe un array completo (o null si está cargando) y devuelve solo la
// "ventana" visible de la página actual, junto con metadatos para los
// controles de paginación.
//
// Resetea automáticamente la página actual a 1 cuando el total cambia
// y la página seleccionada queda fuera de rango (ej. el usuario está
// en la página 3 y aplica un filtro que reduce el resultado a 5 items).

import { useEffect, useMemo, useState } from 'react'

export function usePaginacion(items, porPagina = 12) {
  const [pagina, setPagina] = useState(1)
  const total = items?.length || 0
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina))

  useEffect(() => {
    if (pagina > totalPaginas) setPagina(1)
  }, [totalPaginas, pagina])

  const visibles = useMemo(() => {
    if (!items) return null
    const inicio = (pagina - 1) * porPagina
    return items.slice(inicio, inicio + porPagina)
  }, [items, pagina, porPagina])

  const resetear = () => setPagina(1)

  return { visibles, pagina, setPagina, totalPaginas, total, resetear }
}
