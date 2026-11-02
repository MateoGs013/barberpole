import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { Modal } from './Modal.jsx'
import {
  LayoutDashboard,
  Calendar,
  Scissors,
  Users,
  User,
  PlusCircle,
  MoreHorizontal,
  LogOut,
  UserCheck,
  Shield,
  ShieldCheck,
} from 'lucide-react'

const ICONOS = {
  '/superadmin': ShieldCheck,
  '/dashboard': LayoutDashboard,
  '/turnos': Calendar,
  '/servicios': Scissors,
  '/clientes': Users,
  '/empleados': UserCheck,
  '/usuarios': Shield,
  '/reservar': PlusCircle,
  '/perfil': User,
}

const ITEMS_VISIBLES = {
  superadmin: [
    { to: '/superadmin', label: 'Superadmin' },
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/turnos', label: 'Turnos' },
    { to: '/usuarios', label: 'Usuarios' },
  ],
  admin: [
    { to: '/dashboard', label: 'Inicio' },
    { to: '/turnos', label: 'Turnos' },
    { to: '/servicios', label: 'Catálogo' },
    { to: '/clientes', label: 'Clientes' },
  ],
  empleado: [
    { to: '/dashboard', label: 'Inicio' },
    { to: '/turnos', label: 'Turnos' },
    { to: '/clientes', label: 'Clientes' },
    { to: '/perfil', label: 'Perfil' },
  ],
  cliente: [
    { to: '/dashboard', label: 'Inicio' },
    { to: '/reservar', label: 'Reservar' },
    { to: '/turnos', label: 'Mis turnos' },
    { to: '/perfil', label: 'Perfil' },
  ],
}

const ITEMS_EXTRA = {
  superadmin: [
    { to: '/servicios', label: 'Servicios' },
    { to: '/empleados', label: 'Empleados' },
    { to: '/clientes', label: 'Clientes' },
    { to: '/configuracion', label: 'Configuración' },
    { to: '/perfil', label: 'Perfil' },
  ],
  admin: [
    { to: '/empleados', label: 'Empleados' },
    { to: '/usuarios', label: 'Usuarios' },
    { to: '/perfil', label: 'Perfil' },
  ],
  empleado: [],
  cliente: [],
}

export function BottomNav() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const [masAbierto, setMasAbierto] = useState(false)

  if (!usuario) return null

  const principales = ITEMS_VISIBLES[usuario.rol] || []
  const extras = ITEMS_EXTRA[usuario.rol] || []
  const tieneMas = extras.length > 0
  const columnas = tieneMas ? 'grid-cols-5' : 'grid-cols-4'

  const irY = (ruta) => {
    setMasAbierto(false)
    navigate(ruta)
  }

  const onLogout = () => {
    setMasAbierto(false)
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <nav className="2xl:hidden fixed bottom-3 inset-x-3 z-40 bg-surface/90 backdrop-blur-xl border border-ink/10 rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.8)] px-2 py-1">
        <ul className={`grid ${columnas} items-center`}>
          {principales.map((item) => {
            const Icono = ICONOS[item.to] || Calendar
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl text-center transition-all ${
                      isActive
                        ? 'text-ink bg-ink/10 font-medium'
                        : 'text-muted hover:text-ink hover:bg-ink/5'
                    }`
                  }
                >
                  <Icono className="w-4 h-4" />
                  <span className="font-mono text-[9px] uppercase tracking-wider leading-none">
                    {item.label}
                  </span>
                </NavLink>
              </li>
            )
          })}
          {tieneMas && (
            <li>
              <button
                type="button"
                onClick={() => setMasAbierto(true)}
                className="w-full h-full flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl text-center text-muted hover:text-ink hover:bg-ink/5 transition-all"
              >
                <MoreHorizontal className="w-4 h-4" />
                <span className="font-mono text-[9px] uppercase tracking-wider leading-none">
                  Más
                </span>
              </button>
            </li>
          )}
        </ul>
      </nav>

      {/* Modal Más */}
      <Modal abierto={masAbierto} onCerrar={() => setMasAbierto(false)} titulo="Navegación extendida">
        <ul className="space-y-2">
          {extras.map((item) => {
            const Icono = ICONOS[item.to] || Calendar
            return (
              <li key={item.to}>
                <button
                  onClick={() => irY(item.to)}
                  className="w-full text-left rounded-xl border border-ink/10 bg-elevated/50 hover:bg-elevated hover:border-ink/20 px-4 py-3 flex items-center gap-3 transition-all text-ink"
                >
                  <Icono className="w-5 h-5 text-muted" />
                  <span className="font-mono text-xs uppercase tracking-wider">
                    {item.label}
                  </span>
                </button>
              </li>
            )
          })}
          <li className="pt-3 border-t border-ink/10">
            <button
              onClick={onLogout}
              className="btn btn-peligro w-full justify-center"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Cerrar sesión
            </button>
          </li>
        </ul>
      </Modal>
    </>
  )
}
