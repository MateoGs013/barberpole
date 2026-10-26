import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../hooks/useToast.js'
import { soundManager } from '../utils/sound.js'
import {
  Search,
  LayoutDashboard,
  Calendar,
  Scissors,
  Users,
  Building2,
  Volume2,
  VolumeX,
  UserCheck,
  ExternalLink,
  Sparkles,
  ArrowRight,
  LogOut,
  X,
} from 'lucide-react'

export function CommandPalette() {
  const [abierto, setAbierto] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [indiceSeleccionado, setIndiceSeleccionado] = useState(0)
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const { usuario, login, logout } = useAuth()
  const toast = useToast()

  // Abrir con Cmd+K o Ctrl+K
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setAbierto((prev) => {
          if (!prev) soundManager.playPop()
          return !prev
        })
      }
      if (e.key === 'Escape' && abierto) {
        setAbierto(false)
      }
    }

    const onCustomOpen = () => {
      soundManager.playPop()
      setAbierto(true)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('barberpole:abrir-palette', onCustomOpen)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('barberpole:abrir-palette', onCustomOpen)
    }
  }, [abierto])

  useEffect(() => {
    if (abierto) {
      setBusqueda('')
      setIndiceSeleccionado(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [abierto])

  const comandos = [
    // Seccion Navegación
    {
      categoria: 'Navegación',
      id: 'nav-dashboard',
      titulo: 'Ir al Dashboard',
      icono: LayoutDashboard,
      accion: () => navigate('/dashboard'),
    },
    {
      categoria: 'Navegación',
      id: 'nav-turnos',
      titulo: 'Gestionar Turnos & Agenda',
      icono: Calendar,
      accion: () => navigate('/turnos'),
    },
    {
      categoria: 'Navegación',
      id: 'nav-reservar',
      titulo: 'Nueva Reserva (Slot Engine)',
      icono: Sparkles,
      accion: () => navigate('/reservar'),
    },
    {
      categoria: 'Navegación',
      id: 'nav-servicios',
      titulo: 'Catálogo de Servicios',
      icono: Scissors,
      accion: () => navigate('/servicios'),
    },
    {
      categoria: 'Navegación',
      id: 'nav-onboarding',
      titulo: 'Crear Nuevo Salón (Onboarding SaaS)',
      icono: Building2,
      accion: () => navigate('/onboarding'),
    },
    {
      categoria: 'Navegación',
      id: 'nav-landing',
      titulo: 'Ir a Landing Page Comercial',
      icono: ArrowRight,
      accion: () => navigate('/'),
    },

    // Seccion Salones Live
    {
      categoria: 'Portales Públicos',
      id: 'tenant-palermo',
      titulo: 'Portal Salón: Studio Palermo',
      subtitulo: 'barberpole.app/studio-palermo',
      icono: ExternalLink,
      accion: () => navigate('/studio-palermo'),
    },
    {
      categoria: 'Portales Públicos',
      id: 'tenant-nave',
      titulo: 'Portal Salón: La Nave Barbershop',
      subtitulo: 'barberpole.app/la-nave',
      icono: ExternalLink,
      accion: () => navigate('/la-nave'),
    },

    // Acciones y 1-Click Switcher
    {
      categoria: 'Acciones & Audio',
      id: 'toggle-audio',
      titulo: soundManager.isEnabled ? 'Desactivar Audio Háptico' : 'Activar Audio Háptico',
      subtitulo: soundManager.isEnabled ? 'Audio activado (Web Audio API)' : 'Audio silenciado',
      icono: soundManager.isEnabled ? Volume2 : VolumeX,
      accion: () => {
        const estado = soundManager.toggle()
        toast.info(estado ? 'Audio háptico activado' : 'Audio silenciado')
      },
    },
    {
      categoria: '1-Click Demo Switcher',
      id: 'demo-admin',
      titulo: 'Iniciar como Admin Studio',
      subtitulo: 'admin@peluqueria.com (Control total)',
      icono: UserCheck,
      accion: async () => {
        try {
          await login('admin@peluqueria.com', 'admin123')
          toast.exito('Sesión iniciada como Admin Studio')
          navigate('/dashboard')
        } catch {
          toast.error('Error al iniciar como admin')
        }
      },
    },
    {
      categoria: '1-Click Demo Switcher',
      id: 'demo-barbero',
      titulo: 'Iniciar como Barbero Operativo',
      subtitulo: 'barbero@peluqueria.com (Agenda de cortes)',
      icono: UserCheck,
      accion: async () => {
        try {
          await login('barbero@peluqueria.com', 'barbero123')
          toast.exito('Sesión iniciada como Barbero')
          navigate('/dashboard')
        } catch {
          toast.error('Error al iniciar como barbero')
        }
      },
    },
    {
      categoria: '1-Click Demo Switcher',
      id: 'demo-cliente',
      titulo: 'Iniciar como Cliente Final',
      subtitulo: 'cliente@peluqueria.com (Mis citas)',
      icono: UserCheck,
      accion: async () => {
        try {
          await login('cliente@peluqueria.com', 'cliente123')
          toast.exito('Sesión iniciada como Cliente')
          navigate('/reservar')
        } catch {
          toast.error('Error al iniciar como cliente')
        }
      },
    },
    ...(usuario
      ? [
          {
            categoria: 'Sesión',
            id: 'logout',
            titulo: 'Cerrar Sesión Actual',
            subtitulo: `Conectado como ${usuario.email}`,
            icono: LogOut,
            accion: () => {
              logout()
              toast.info('Sesión cerrada')
              navigate('/login')
            },
          },
        ]
      : []),
  ]

  const comandosFiltrados = comandos.filter((cmd) => {
    const texto = `${cmd.titulo} ${cmd.subtitulo || ''} ${cmd.categoria}`.toLowerCase()
    return texto.includes(busqueda.toLowerCase())
  })

  // Navegación por teclado
  const handleKeyDown = (e) => {
    if (comandosFiltrados.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      soundManager.playNavigation()
      setIndiceSeleccionado((prev) => (prev + 1) % comandosFiltrados.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      soundManager.playNavigation()
      setIndiceSeleccionado((prev) => (prev - 1 + comandosFiltrados.length) % comandosFiltrados.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      ejecutarComando(comandosFiltrados[indiceSeleccionado])
    }
  }

  const ejecutarComando = (cmd) => {
    if (!cmd) return
    soundManager.playClick()
    setAbierto(false)
    cmd.accion()
  }

  return (
    <AnimatePresence>
      {abierto && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
          {/* Backdrop con blur profundo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAbierto(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal flotante de comando */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            className="relative w-full max-w-xl rounded-2xl bg-zinc-950/95 border border-white/15 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden z-10 text-zinc-100"
          >
            {/* Input Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10">
              <Search className="w-4 h-4 text-zinc-500 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Escribí un comando, salón o atajo..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value)
                  setIndiceSeleccionado(0)
                }}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent text-sm font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none"
              />
              <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 border border-white/10 px-1.5 py-0.5 rounded select-none">
                ESC
              </span>
            </div>

            {/* Lista de Comandos */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {comandosFiltrados.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 font-mono text-xs">
                  No se encontraron comandos para &quot;{busqueda}&quot;
                </div>
              ) : (
                comandosFiltrados.map((cmd, idx) => {
                  const Icon = cmd.icono
                  const estaSeleccionado = idx === indiceSeleccionado

                  return (
                    <button
                      key={cmd.id}
                      onClick={() => ejecutarComando(cmd)}
                      onMouseEnter={() => setIndiceSeleccionado(idx)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all ${
                        estaSeleccionado
                          ? 'bg-white/10 text-white shadow-inner'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`p-1.5 rounded-md ${
                            estaSeleccionado ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <p className="font-mono text-xs font-medium tracking-tight text-white">
                            {cmd.titulo}
                          </p>
                          {cmd.subtitulo && (
                            <p className="font-mono text-[10px] text-zinc-500 truncate">
                              {cmd.subtitulo}
                            </p>
                          )}
                        </div>
                      </div>

                      <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-600 shrink-0 ml-2">
                        {cmd.categoria}
                      </span>
                    </button>
                  )
                })
              )}
            </div>

            {/* Footer de atajos */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 bg-zinc-900/50 font-mono text-[10px] text-zinc-500">
              <div className="flex items-center gap-3">
                <span>↑↓ Navegar</span>
                <span>↵ Seleccionar</span>
              </div>
              <span className="text-zinc-600">BarberPole Command Engine</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
