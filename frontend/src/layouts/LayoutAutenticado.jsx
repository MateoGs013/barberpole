import { useState } from 'react'
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { BottomNav } from '../components/BottomNav.jsx'
import { ThemeToggle } from '../components/ThemeToggle.jsx'
import { soundManager } from '../utils/sound.js'
import { LogOut, Search, Volume2, VolumeX } from 'lucide-react'

const LINKS_POR_ROL = {
  superadmin: [
    { to: '/superadmin', label: 'Superadmin' },
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/turnos', label: 'Turnos' },
    { to: '/servicios', label: 'Servicios' },
    { to: '/empleados', label: 'Empleados' },
    { to: '/clientes', label: 'Clientes' },
    { to: '/usuarios', label: 'Usuarios' },
    { to: '/configuracion', label: 'Configuración' },
  ],
  admin: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/turnos', label: 'Turnos' },
    { to: '/servicios', label: 'Servicios' },
    { to: '/empleados', label: 'Empleados' },
    { to: '/clientes', label: 'Clientes' },
    { to: '/usuarios', label: 'Usuarios' },
    { to: '/configuracion', label: 'Configuración' },
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
  const [audioActivo, setAudioActivo] = useState(soundManager.isEnabled)
  const links = LINKS_POR_ROL[usuario?.rol] || []

  const onLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const toggleAudio = () => {
    const next = soundManager.toggle()
    setAudioActivo(next)
  }

  const abrirCommandPalette = () => {
    window.dispatchEvent(new CustomEvent('barberpole:abrir-palette'))
  }

  return (
    <div className="min-h-screen flex flex-col pb-24 2xl:pb-0 bg-canvas text-ink">
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-ink/10">
        <div className="px-4 lg:px-8 py-3 flex items-center justify-between gap-4">
          {/* Logo Monocromático Studio */}
          <Link
            to="/dashboard"
            className="flex items-center gap-2 group shrink-0"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-ink group-hover:scale-125 transition-transform" />
            <span className="font-mono text-xs uppercase tracking-widest text-muted group-hover:text-ink transition-colors">
              BarberPole <span className="text-faint">—</span> Studio
            </span>
          </Link>

          {/* Nav horizontal desktop (aparece en 2xl; por debajo se usa el BottomNav,
              que es un nav completo con menú "Más"). Evita el desborde del header
              con 7-8 pills + el cluster de usuario en el rango de laptop. */}
          <nav className="hidden 2xl:block">
            <ul className="flex items-center gap-1.5 p-1 rounded-xl bg-elevated/40 border border-ink/5">
              {links.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    className={({ isActive }) =>
                      `px-3 py-1.5 rounded-lg font-mono text-xs uppercase tracking-wider transition-all duration-150 ${
                        isActive
                          ? 'bg-ink/10 text-ink border border-ink/15 shadow-[0_0_15px_rgb(var(--ink)/0.05)]'
                          : 'text-muted hover:text-ink hover:bg-ink/5 border border-transparent'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Quick Actions (Command Menu + Audio + Usuario) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Command Palette Trigger */}
            <button
              onClick={abrirCommandPalette}
              className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-ink/10 bg-elevated/50 hover:bg-elevated/60 text-muted hover:text-ink font-mono text-xs transition-colors cursor-pointer"
              title="Abrir paleta de comandos (Ctrl+K / Cmd+K)"
            >
              <Search className="w-3.5 h-3.5 text-muted" />
              <span className="hidden md:inline text-[11px] text-muted">Buscar...</span>
              <kbd className="text-[10px] bg-surface border border-ink/10 px-1.5 py-0.5 rounded text-muted select-none">
                ⌘K
              </kbd>
            </button>

            {/* Theme Toggle */}
            <ThemeToggle className="hidden sm:inline-flex" />

            {/* Audio Micro-Haptics Toggle */}
            <button
              onClick={toggleAudio}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                audioActivo
                  ? 'border-ink bg-ink text-canvas'
                  : 'border-ink/10 bg-elevated/50 text-faint hover:text-muted'
              }`}
              title={audioActivo ? 'Audio táctil activado (clic para silenciar)' : 'Audio silenciado (clic para activar)'}
            >
              {audioActivo ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            {/* Usuario Info */}
            <div className="hidden sm:block text-right">
              <p className="font-sans text-xs font-medium text-ink leading-tight">
                {usuario?.nombre}
              </p>
              <span className="font-mono text-[10px] uppercase text-faint tracking-wider">
                {usuario?.rol}
              </span>
            </div>

            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-ink/10 bg-elevated/60 hover:bg-ink hover:text-canvas hover:border-ink text-muted font-mono text-xs transition-all cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  )
}
