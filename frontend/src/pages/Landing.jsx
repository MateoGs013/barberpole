import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { http } from '../api/http.js'
import { TactileSlot } from '../components/TactileSlot.jsx'
import { ThemeToggle } from '../components/ThemeToggle.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { ArrowRight, Check, Search } from 'lucide-react'

export default function Landing() {
  const { usuario } = useAuth()

  return (
    <div className="min-h-screen w-full flex flex-col bg-black text-white selection:bg-white selection:text-black">
      <HeaderEditorial usuario={usuario} />
      <HeroEditorial />
      <ShowcaseSalones />
      <CapacidadesEditorial />
      <PricingEditorial />
      <FooterEditorial />
    </div>
  )
}

function HeaderEditorial({ usuario }) {
  const abrirCommandPalette = () => {
    window.dispatchEvent(new CustomEvent('barberpole:abrir-palette'))
  }

  return (
    <header className="w-full border-b border-white/10 px-6 sm:px-12 md:px-16 py-5 flex items-center justify-between text-xs font-mono uppercase tracking-widest text-neutral-400">
      <div className="flex items-center gap-6">
        <Link to="/" className="text-white font-medium text-sm tracking-tight">
          BARBERPOLE
        </Link>
        <span className="hidden md:inline text-neutral-600">— MOTOR UNIVERSAL DE TURNOS</span>
      </div>

      <nav className="hidden lg:flex items-center gap-8 text-neutral-400">
        <a href="#salones" className="hover:text-white transition-colors">
          01 — ESPACIOS ↘
        </a>
        <a href="#capacidades" className="hover:text-white transition-colors">
          02 — CAPACIDADES ↘
        </a>
        <a href="#planes" className="hover:text-white transition-colors">
          03 — PLANES ↘
        </a>
      </nav>

      <div className="flex items-center gap-4">
        <ThemeToggle className="hidden md:inline-flex" />
        <button
          onClick={abrirCommandPalette}
          className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 border border-white/10 hover:border-white/30 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          title="Buscar (Ctrl+K / Cmd+K)"
        >
          <Search className="w-3 h-3" />
          <span className="text-[11px]">BUSCAR</span>
          <kbd className="text-[9px] border border-white/20 px-1 py-0.2">⌘K</kbd>
        </button>

        {usuario ? (
          <Link to="/dashboard" className="px-4 py-2 bg-white text-black font-semibold hover:bg-neutral-200 transition-colors">
            PANEL ↗
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login" className="px-3 py-2 text-neutral-400 hover:text-white transition-colors">
              INGRESAR
            </Link>
            <Link to="/onboarding" className="px-4 py-2 bg-white text-black font-semibold hover:bg-neutral-200 transition-colors">
              CREAR ESPACIO ↗
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}

function HeroEditorial() {
  return (
    <section className="w-full border-b border-white/10 px-6 sm:px-12 md:px-16 py-24 sm:py-32 lg:py-40">
      <div className="max-w-6xl">
        <div className="text-xs font-mono uppercase tracking-widest text-neutral-500 mb-6">
          — MOTOR UNIVERSAL DE TURNOS & GESTIÓN DIRECTA
        </div>

        <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-mono font-medium tracking-tighter text-white leading-[0.92] uppercase">
          RESERVA <br />
          DIRECTA.
        </h1>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 text-sm md:text-base font-light text-neutral-400 max-w-3xl leading-relaxed">
          <p>
            Plataforma despojada de fricción para salones, estudios y profesionales independientes. Eliminá los mensajes manuales de WhatsApp y permití que tus clientes aseguren su turno en 30 segundos.
          </p>
          <p>
            Cero comisiones intermedias, enlace público propio para compartir y bloqueo atómico de horarios en tiempo real con sincronización a Google Calendar.
          </p>
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-4 text-xs font-mono uppercase tracking-wider">
          <Link
            to="/onboarding"
            className="px-8 py-4 bg-white text-black font-semibold hover:bg-neutral-200 transition-colors flex items-center gap-3"
          >
            <span>Crear espacio o agenda</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <a
            href="#salones"
            className="px-8 py-4 border border-white/20 text-white hover:border-white hover:bg-white hover:text-black transition-colors"
          >
            Ver espacios activos ↘
          </a>
        </div>
      </div>
    </section>
  )
}

function ShowcaseSalones() {
  const [salones, setSalones] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let cancelado = false
    http
      .get('/negocios/publicos')
      .then((res) => {
        if (!cancelado && Array.isArray(res.data)) {
          setSalones(res.data)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelado) setCargando(false)
      })

    return () => {
      cancelado = true
    }
  }, [])

  return (
    <section id="salones" className="w-full border-b border-white/10 px-6 sm:px-12 md:px-16 py-20 lg:py-28">
      <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4 mb-12 border-b border-white/10 pb-6">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-neutral-500">
            01 — DIRECTORIO
          </span>
          <h2 className="text-3xl sm:text-4xl font-mono font-medium text-white tracking-tight mt-1 uppercase">
            Espacios y profesionales activos
          </h2>
        </div>
        <p className="font-mono text-xs uppercase text-neutral-500 max-w-sm">
          Cada negocio o particular opera con su enlace independiente y disponibilidad en vivo.
        </p>
      </div>

      {cargando ? (
        <div className="py-12 text-center font-mono text-xs text-neutral-500 uppercase tracking-widest">
          Cargando directorio de espacios...
        </div>
      ) : salones.length === 0 ? (
        <div className="py-16 text-center space-y-4 font-mono text-xs text-neutral-500 uppercase tracking-wider border border-white/10">
          <p>No hay espacios registrados en la plataforma actualmente.</p>
          <Link
            to="/onboarding"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black font-semibold hover:bg-neutral-200 transition-colors"
          >
            <span>Crear el primer espacio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-white/10 border-b border-white/10">
          {salones.map((s) => (
            <div
              key={s.slug}
              className="py-8 flex flex-col md:flex-row md:items-baseline justify-between gap-6 group hover:bg-white/[0.02] transition-colors"
            >
              <div className="max-w-xl">
                <div className="flex items-center gap-3 text-xs font-mono text-neutral-500 mb-2 uppercase">
                  <span className="text-white">
                    {s.modalidad === 'particular' ? 'ESTUDIO PRIVADO' : 'LOCAL COMERCIAL'}
                  </span>
                  <span>·</span>
                  <span>barberpole.app/{s.slug}</span>
                  {s.rubro && (
                    <>
                      <span>·</span>
                      <span className="text-neutral-400">{s.rubro}</span>
                    </>
                  )}
                </div>
                <h3 className="font-mono text-2xl text-white font-medium tracking-tight">
                  {s.nombre}
                </h3>
                {s.descripcion && (
                  <p className="font-light text-sm text-neutral-400 mt-2">
                    {s.descripcion}
                  </p>
                )}
              </div>

              <div className="flex flex-col md:items-end gap-2 shrink-0 font-mono text-xs uppercase">
                <span className="text-neutral-500">
                  {s.configuracion?.direccionPrivada
                    ? 'Dirección confidencial'
                    : s.direccion || 'Buenos Aires'}
                </span>
                <Link
                  to={`/${s.slug}`}
                  className="text-white hover:underline flex items-center gap-2 mt-2"
                >
                  <span>Abrir portal de reservas</span>
                  <span>↘</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function CapacidadesEditorial() {
  const [slotSeleccionado, setSlotSeleccionado] = useState('16:30')

  return (
    <section id="capacidades" className="w-full border-b border-white/10 px-6 sm:px-12 md:px-16 py-20 lg:py-28">
      <div className="mb-16 border-b border-white/10 pb-6">
        <span className="font-mono text-xs uppercase tracking-widest text-neutral-500">
          02 — ARQUITECTURA
        </span>
        <h2 className="text-3xl sm:text-4xl font-mono font-medium text-white tracking-tight mt-1 uppercase">
          Capacidades técnicas
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 font-mono text-xs">
        <div className="space-y-4">
          <div className="text-neutral-500 uppercase tracking-widest">↘ 01</div>
          <h3 className="text-lg font-medium text-white uppercase">Portal Independiente</h3>
          <p className="font-light text-neutral-400 leading-relaxed normal-case font-sans text-sm">
            URL propia para compartir en la bio de Instagram o enviar por mensaje directo. El cliente entra y reserva sin descargar aplicaciones ni recordar contraseñas.
          </p>
        </div>

        <div className="space-y-4">
          <div className="text-neutral-500 uppercase tracking-widest">↘ 02</div>
          <h3 className="text-lg font-medium text-white uppercase">Prevención de Colisiones</h3>
          <p className="font-light text-neutral-400 leading-relaxed normal-case font-sans text-sm">
            Control de concurrencia atómico a nivel backend. Si dos clientes intentan reservar el mismo slot simultáneamente, el sistema garantiza exactamente una reserva exitosa y previene sobreturnos.
          </p>
        </div>

        <div className="space-y-4">
          <div className="text-neutral-500 uppercase tracking-widest">↘ 03</div>
          <h3 className="text-lg font-medium text-white uppercase">Respuesta Táctil</h3>
          <p className="font-light text-neutral-400 leading-relaxed normal-case font-sans text-sm mb-4">
            Interacción instantánea con inversión binaria de alto contraste. Probá los slots:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <TactileSlot
              hora="16:00"
              horaFin="16:30"
              disponible={false}
              motivo="Lleno"
            />
            <TactileSlot
              hora="16:30"
              horaFin="17:00"
              disponible={true}
              seleccionado={slotSeleccionado === '16:30'}
              onClick={() => setSlotSeleccionado('16:30')}
            />
            <TactileSlot
              hora="17:00"
              horaFin="17:30"
              disponible={true}
              seleccionado={slotSeleccionado === '17:00'}
              onClick={() => setSlotSeleccionado('17:00')}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function PricingEditorial() {
  const planes = [
    {
      nombre: 'PLAN FREE',
      precio: '$0',
      periodo: 'PARA SIEMPRE',
      desc: 'Para profesionales particulares e independientes que gestionan su propia agenda.',
      items: [
        'Hasta 50 turnos por mes',
        '1 Profesional / Agenda única',
        'Enlace público para WhatsApp / Instagram',
        'Catálogo de servicios ilimitado',
      ],
      cta: 'Empezar gratis',
      destacado: false,
    },
    {
      nombre: 'PLAN PRO',
      precio: '$29',
      periodo: 'POR MES',
      desc: 'Para salones, estudios y locales consolidados con equipo de profesionales.',
      items: [
        'Turnos ilimitados',
        'Profesionales ilimitados',
        'Sincronización Google Calendar 2-Way',
        'Métricas de facturación en tiempo real',
        'Avisos por WhatsApp',
      ],
      cta: 'Crear espacio Pro',
      destacado: true,
    },
    {
      nombre: 'ENTERPRISE',
      precio: '$79',
      periodo: 'POR MES',
      desc: 'Para cadenas y múltiples sucursales con control centralizado.',
      items: [
        'Multi-sucursales conectadas',
        'Subdominio propio',
        'Integración API contable',
        'Soporte prioritario 24/7',
      ],
      cta: 'Contactar ventas',
      destacado: false,
    },
  ]

  return (
    <section id="planes" className="w-full border-b border-white/10 px-6 sm:px-12 md:px-16 py-20 lg:py-28">
      <div className="mb-16 border-b border-white/10 pb-6">
        <span className="font-mono text-xs uppercase tracking-widest text-neutral-500">
          03 — PLANES
        </span>
        <h2 className="text-3xl sm:text-4xl font-mono font-medium text-white tracking-tight mt-1 uppercase">
          Suscripciones
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {planes.map((p) => (
          <div
            key={p.nombre}
            className={`p-8 border flex flex-col justify-between ${
              p.destacado ? 'border-white bg-white/[0.03]' : 'border-white/10'
            }`}
          >
            <div>
              <div className="font-mono text-xs uppercase tracking-widest text-neutral-400 mb-6">
                {p.nombre}
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-mono text-4xl font-semibold text-white">{p.precio}</span>
                <span className="font-mono text-xs text-neutral-500 uppercase">{p.periodo}</span>
              </div>

              <p className="font-sans text-xs text-neutral-400 mt-4 leading-relaxed font-light">
                {p.desc}
              </p>

              <ul className="space-y-3 mt-8 pt-8 border-t border-white/10 font-mono text-xs text-neutral-300">
                {p.items.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-white shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              to="/onboarding"
              className={`w-full py-4 text-center font-mono text-xs uppercase tracking-wider font-semibold mt-8 transition-colors ${
                p.destacado
                  ? 'bg-white text-black hover:bg-neutral-200'
                  : 'border border-white/20 text-white hover:bg-white hover:text-black'
              }`}
            >
              {p.cta} ↗
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}

function FooterEditorial() {
  return (
    <footer className="w-full px-6 sm:px-12 md:px-16 py-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-xs font-mono uppercase tracking-widest text-neutral-500">
      <div>
        <span>BARBERPOLE — MOTOR UNIVERSAL DE TURNOS</span>
        <span className="mx-3 text-neutral-700">·</span>
        <span>MODO ZEN & HIPERFOCO</span>
      </div>
      <div>
        <span>BUENOS AIRES · '26</span>
      </div>
    </footer>
  )
}
