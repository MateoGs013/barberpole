// Layout para todas las páginas que requieren sesión.
// Header sticky con logo, nav, info de usuario y botón salir.
// El contenido de cada ruta se renderiza vía <Outlet />.

import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

// Links que aparecen en el nav según el rol del usuario logueado.
const LINKS_POR_ROL = {
  admin: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/turnos', label: 'Turnos' },
    { to: '/servicios', label: 'Servicios' },
    { to: '/empleados', label: 'Empleados' },
    { to: '/clientes', label: 'Clientes' },
    { to: '/usuarios', label: 'Usuarios' },
  ],
  empleado: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/turnos', label: 'Turnos' },
    { to: '/clientes', label: 'Clientes' },
  ],
  cliente: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/reservar', label: 'Reservar' },
    { to: '/turnos', label: 'Mis turnos' },
    { to: '/perfil', label: 'Perfil' },
  ],
}

export function LayoutAutenticado() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const links = LINKS_POR_ROL[usuario?.rol] || []

  const onLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 bg-crema border-b-3 border-negro">
        <div className="px-4 lg:px-8 py-3 flex items-center gap-4 lg:gap-8">
          {/* Logo */}
          <Link to="/dashboard" className="font-display font-bold text-lg lg:text-xl uppercase tracking-tighter shrink-0">
            <span className="text-rojo-faro">✂</span> Peluquería
            <span className="text-azul-faro"> SaaS</span>
          </Link>

          {/* Nav — scrolleable en mobile para no apretar */}
          <nav className="flex-1 overflow-x-auto">
            <ul className="flex gap-1 lg:gap-2 min-w-max">
              {links.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    className={({ isActive }) =>
                      `inline-block px-3 py-2 font-mono text-sm uppercase tracking-tight border-2 transition-all duration-100 ${
                        isActive
                          ? 'bg-negro text-white border-negro'
                          : 'border-transparent hover:border-negro'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Usuario + logout */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden md:block text-right">
              <p className="font-display font-bold text-sm uppercase leading-tight">
                {usuario?.nombre}
              </p>
              <span className="badge badge-pendiente text-[10px] !py-0.5 !px-1.5">
                {usuario?.rol}
              </span>
            </div>
            <button onClick={onLogout} className="btn btn-peligro !px-3 !py-2 text-xs">
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
