// Router principal de la app.
// Las rutas autenticadas comparten LayoutAutenticado (header + outlet).

import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { ProtectedRoute } from '../components/ProtectedRoute.jsx'
import { LayoutAutenticado } from '../layouts/LayoutAutenticado.jsx'
import { CommandPalette } from '../components/CommandPalette.jsx'
import Login from '../pages/Login.jsx'
import Registro from '../pages/Registro.jsx'
import Servicios from '../pages/Servicios.jsx'
import Empleados from '../pages/Empleados.jsx'
import Clientes from '../pages/Clientes.jsx'
import Turnos from '../pages/Turnos.jsx'
import Landing from '../pages/Landing.jsx'
import Dashboard from '../pages/Dashboard.jsx'
import Perfil from '../pages/Perfil.jsx'
import Usuarios from '../pages/Usuarios.jsx'
import Reservar from '../pages/Reservar.jsx'
import OnboardingNegocio from '../pages/OnboardingNegocio.jsx'
import PortalNegocio from '../pages/PortalNegocio.jsx'
import ConfiguracionNegocio from '../pages/ConfiguracionNegocio.jsx'
import Superadmin from '../pages/Superadmin.jsx'
import Privacidad from '../pages/Privacidad.jsx'
import Terminos from '../pages/Terminos.jsx'
import NotFound from '../pages/NotFound.jsx'

export function AppRouter() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <CommandPalette />
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/onboarding" element={<OnboardingNegocio />} />
        <Route path="/privacidad" element={<Privacidad />} />
        <Route path="/terminos" element={<Terminos />} />

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

        {/* Solo clientes */}
        <Route
          element={
            <ProtectedRoute roles={['cliente']}>
              <LayoutAutenticado />
            </ProtectedRoute>
          }
        >
          <Route path="/reservar" element={<Reservar />} />
        </Route>

        {/* Admin y Superadmin */}
        <Route
          element={
            <ProtectedRoute roles={['admin', 'superadmin']}>
              <LayoutAutenticado />
            </ProtectedRoute>
          }
        >
          <Route path="/servicios" element={<Servicios />} />
          <Route path="/empleados" element={<Empleados />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/configuracion" element={<ConfiguracionNegocio />} />
        </Route>

        {/* Exclusivo Superadmin */}
        <Route
          element={
            <ProtectedRoute roles={['superadmin']}>
              <LayoutAutenticado />
            </ProtectedRoute>
          }
        >
          <Route path="/superadmin" element={<Superadmin />} />
        </Route>

        {/* Admin, Empleado o Superadmin */}
        <Route
          element={
            <ProtectedRoute roles={['admin', 'empleado', 'superadmin']}>
              <LayoutAutenticado />
            </ProtectedRoute>
          }
        >
          <Route path="/clientes" element={<Clientes />} />
        </Route>

        {/* Dynamic Tenant Portal: /:slug */}
        <Route path="/:slug" element={<PortalNegocio />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
