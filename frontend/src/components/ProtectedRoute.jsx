// Wrapper para rutas privadas con soporte multi-rol y superadmin universal.
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

export function ProtectedRoute({ children, roles = null }) {
  const { usuario, cargando } = useAuth()
  const location = useLocation()

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-mono uppercase tracking-tight">Cargando...</p>
      </div>
    )
  }

  if (!usuario) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  // Superadmin tiene acceso a todas las rutas de gestión
  if (roles && usuario.rol !== 'superadmin' && !roles.includes(usuario.rol)) {
    return <Navigate to="/" replace />
  }

  return children
}
