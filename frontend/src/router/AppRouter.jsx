// Router principal de la app.
// Las rutas autenticadas comparten LayoutAutenticado (header + outlet).

import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { ProtectedRoute } from '../components/ProtectedRoute.jsx'
import { LayoutAutenticado } from '../layouts/LayoutAutenticado.jsx'
import Login from '../pages/Login.jsx'
import Registro from '../pages/Registro.jsx'
import Servicios from '../pages/Servicios.jsx'
import Empleados from '../pages/Empleados.jsx'
import Clientes from '../pages/Clientes.jsx'
import Turnos from '../pages/Turnos.jsx'
import Landing from '../pages/Landing.jsx'
import Dashboard from '../pages/Dashboard.jsx'
import Perfil from '../pages/Perfil.jsx'

const Placeholder = ({ titulo, descripcion }) => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-8 text-center">
    <span className="badge badge-pendiente">EN CONSTRUCCION</span>
    <h1 className="text-6xl md:text-8xl font-display font-bold uppercase tracking-tighter">
      {titulo}
    </h1>
    {descripcion && (
      <p className="font-mono text-sm uppercase tracking-tight max-w-md">{descripcion}</p>
    )}
    <Link
      to="/dashboard"
      className="font-mono text-xs uppercase underline decoration-2 underline-offset-4 hover:text-azul-faro mt-4"
    >
      ← Volver al dashboard
    </Link>
  </div>
)

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />

        {/* Rutas protegidas — comparten el LayoutAutenticado */}
        <Route
          element={
            <ProtectedRoute>
              <LayoutAutenticado />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/turnos" element={<Turnos />} />
          <Route path="/perfil" element={<Perfil />} />
        </Route>

        {/* Solo admin */}
        <Route
          element={
            <ProtectedRoute roles={['admin']}>
              <LayoutAutenticado />
            </ProtectedRoute>
          }
        >
          <Route path="/servicios" element={<Servicios />} />
          <Route path="/empleados" element={<Empleados />} />
        </Route>

        {/* Admin o empleado */}
        <Route
          element={
            <ProtectedRoute roles={['admin', 'empleado']}>
              <LayoutAutenticado />
            </ProtectedRoute>
          }
        >
          <Route path="/clientes" element={<Clientes />} />
        </Route>

        <Route path="*" element={<Placeholder titulo="404" descripcion="Ruta no encontrada" />} />
      </Routes>
    </BrowserRouter>
  )
}
