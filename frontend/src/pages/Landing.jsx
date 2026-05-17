// Landing pública. Es la primera impresión del SaaS para visitantes
// no logueados. Carga el catálogo de servicios desde el endpoint público
// (GET /api/servicios) y deja CTAs prominentes para reservar / registrarse.

import { Link } from 'react-router-dom'
import { useFetch } from '../hooks/useFetch.js'
import { listarServiciosAPI } from '../api/servicios.api.js'
import { BarberPole } from '../components/BarberPole.jsx'
import { useAuth } from '../hooks/useAuth.js'

export default function Landing() {
  const { usuario } = useAuth()
  const { datos: servicios } = useFetch(() => listarServiciosAPI({ activos: true }))
  const serviciosActivos = (servicios || []).filter((s) => s.activo).slice(0, 6)

  return (
    <div className="min-h-screen flex flex-col">
      <HeaderPublico usuario={usuario} />
      <Hero />
      <SeccionServicios servicios={serviciosActivos} />
      <SeccionComoFunciona />
      <FooterPublico />
    </div>
  )
}

function HeaderPublico({ usuario }) {
  return (
    <header className="sticky top-0 z-40 bg-crema border-b-3 border-negro">
      <div className="px-4 lg:px-8 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="font-display font-bold text-lg lg:text-xl uppercase tracking-tighter">
          <span className="text-rojo-faro">✂</span> Peluquería
          <span className="text-azul-faro"> SaaS</span>
        </Link>
        <nav className="flex items-center gap-2">
          {usuario ? (
            <Link to="/dashboard" className="btn btn-primario !px-4 !py-2 text-sm">
              Entrar al panel
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-secundario !px-4 !py-2 text-sm">
                Ingresar
              </Link>
              <Link to="/registro" className="btn btn-peligro !px-4 !py-2 text-sm">
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="bg-crema border-b-3 border-negro overflow-hidden">
      <div className="px-4 lg:px-8 py-16 lg:py-24 max-w-7xl mx-auto grid lg:grid-cols-[1.3fr_1fr] gap-12 items-center">
        <div>
          <p className="font-mono text-xs uppercase tracking-tight mb-4">
            [Reservás · Te atendemos · Listo]
          </p>
          <h1 className="font-display font-bold uppercase tracking-tighter leading-[0.9] text-6xl md:text-8xl lg:text-9xl">
            Una silla.
            <br />
            <span className="text-rojo-faro">Tu</span>{' '}
            <span className="text-azul-faro">turno.</span>
          </h1>
          <p className="font-sans text-lg md:text-xl mt-6 max-w-md">
            Sistema de reservas online para tu peluquería favorita. Sin llamadas,
            sin esperar.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            {/*
              El CTA principal manda al destino correcto segun la sesion:
              - sin sesion: a registro
              - cliente: directo al wizard de reservas
              - admin/empleado: al dashboard (no son clientes, no reservan)
            */}
            <Link
              to={
                !usuario
                  ? '/registro'
                  : usuario.rol === 'cliente'
                  ? '/reservar'
                  : '/dashboard'
              }
              className="btn btn-peligro text-base"
            >
              {!usuario
                ? 'Reservar ahora'
                : usuario.rol === 'cliente'
                ? 'Reservar mi turno'
                : 'Ir al panel'}
            </Link>
            <a href="#servicios" className="btn btn-secundario text-base">
              Ver servicios
            </a>
          </div>
        </div>
        <div className="hidden lg:flex justify-center">
          <BarberPole className="w-64 h-[28rem]" />
        </div>
      </div>
    </section>
  )
}

function SeccionServicios({ servicios }) {
  return (
    <section id="servicios" className="bg-negro text-white px-4 lg:px-8 py-16 lg:py-24 border-b-3 border-negro">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <p className="font-mono text-xs uppercase text-white/60 tracking-tight">
              Nuestro
            </p>
            <h2 className="font-display font-bold uppercase tracking-tighter leading-none text-5xl md:text-7xl">
              Catálogo.
            </h2>
          </div>
          <p className="font-mono text-sm uppercase max-w-sm">
            Precios y duraciones reales. Reservá el servicio que necesites.
          </p>
        </div>

        {servicios.length === 0 ? (
          <div className="card !p-8 bg-white text-negro text-center max-w-xl mx-auto">
            <p className="font-display text-2xl uppercase">Catálogo en preparación</p>
            <p className="font-mono text-sm mt-2">Volvé en unos días.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {servicios.map((s, i) => (
              <ServicioPublico key={s._id} servicio={s} indice={i} />
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Link to="/registro" className="btn btn-peligro text-base">
            Crear cuenta y reservar
          </Link>
        </div>
      </div>
    </section>
  )
}

function ServicioPublico({ servicio, indice }) {
  const colores = ['bg-crema', 'bg-rojo-faro text-white', 'bg-azul-faro text-white']
  const claseFondo = colores[indice % colores.length]
  return (
    <article className={`${claseFondo} border-3 border-white shadow-bruta p-6 hover:rotate-[-1deg] transition-transform duration-150`}>
      <p className="font-mono text-xs uppercase opacity-70 tracking-tight">
        N° {String(indice + 1).padStart(2, '0')}
      </p>
      <h3 className="font-display font-bold text-2xl lg:text-3xl uppercase tracking-tight leading-tight mt-2">
        {servicio.nombre}
      </h3>
      {servicio.descripcion && (
        <p className="font-sans text-sm mt-2 opacity-90">{servicio.descripcion}</p>
      )}
      <div className="flex items-end justify-between mt-6 pt-4 border-t-2 border-current">
        <p className="font-display font-bold text-3xl">${servicio.precio}</p>
        <p className="font-mono text-xs uppercase">{servicio.duracionMinutos} min</p>
      </div>
    </article>
  )
}

function SeccionComoFunciona() {
  const pasos = [
    {
      n: '01',
      titulo: 'Creá tu cuenta',
      texto: 'En 30 segundos, sin tarjeta. Solo nombre, email y contraseña.',
      color: 'bg-rojo-faro text-white',
    },
    {
      n: '02',
      titulo: 'Elegí el servicio',
      texto: 'Mirá el catálogo, los precios y la duración de cada uno.',
      color: 'bg-crema text-negro',
    },
    {
      n: '03',
      titulo: 'Reservá el turno',
      texto: 'Con quién, qué día, a qué hora. Llegás y te atendemos.',
      color: 'bg-azul-faro text-white',
    },
  ]
  return (
    <section className="bg-crema px-4 lg:px-8 py-16 lg:py-24 border-b-3 border-negro">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <p className="font-mono text-xs uppercase text-negro/60 tracking-tight">
            Así de simple
          </p>
          <h2 className="font-display font-bold uppercase tracking-tighter leading-none text-5xl md:text-7xl">
            ¿Cómo funciona?
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {pasos.map((p) => (
            <article
              key={p.n}
              className={`${p.color} border-3 border-negro shadow-bruta p-8 hover:translate-x-[-3px] hover:translate-y-[-3px] hover:shadow-bruta-lg transition-all duration-150`}
            >
              <p className="font-display font-bold text-7xl opacity-80 leading-none">{p.n}</p>
              <h3 className="font-display font-bold text-2xl uppercase tracking-tight mt-4">
                {p.titulo}
              </h3>
              <p className="font-sans text-sm mt-2">{p.texto}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function FooterPublico() {
  return (
    <footer className="bg-negro text-white px-4 lg:px-8 py-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="font-display font-bold text-xl uppercase tracking-tighter">
          <span className="text-rojo-faro">✂</span> Peluquería
          <span className="text-azul-faro"> SaaS</span>
        </p>
        <p className="font-mono text-xs uppercase text-white/60">
          Parcial 2 · Aplicaciones Híbridas · Mateo Gabús · 2026
        </p>
      </div>
    </footer>
  )
}
