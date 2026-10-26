import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { onboardingNegocioAPI } from '../api/negocios.api.js'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../hooks/useToast.js'
import { ThemeToggle } from '../components/ThemeToggle.jsx'
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Building2,
  Lock,
  CreditCard,
  Check,
  CheckCircle2,
  User,
  ShieldCheck,
} from 'lucide-react'

const slugificar = (texto) =>
  texto
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const RUBROS = [
  { id: 'barberia', label: 'Barbería & Pelo' },
  { id: 'estetica', label: 'Estética & Uñas' },
  { id: 'salud', label: 'Salud & Terapia' },
  { id: 'servicios', label: 'Servicios Técnicos' },
  { id: 'otro', label: 'Otro Rubro' },
]

export default function OnboardingNegocio() {
  const [paso, setPaso] = useState(1)
  const [modalidad, setModalidad] = useState('local')
  const [rubro, setRubro] = useState('barberia')
  const [nombreNegocio, setNombreNegocio] = useState('')
  const [slug, setSlug] = useState('')
  const [direccion, setDireccion] = useState('')
  const [direccionPrivada, setDireccionPrivada] = useState(false)
  const [telefono, setTelefono] = useState('')
  const [nombreOwner, setNombreOwner] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [plan, setPlan] = useState('free')

  const [errores, setErrores] = useState({})
  const [errorGlobal, setErrorGlobal] = useState('')
  const [enviando, setEnviando] = useState(false)

  const { guardarSesion } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const handleNombreNegocioChange = (e) => {
    const val = e.target.value
    setNombreNegocio(val)
    if (!slug || slug === slugificar(nombreNegocio)) {
      setSlug(slugificar(val))
    }
  }

  const validarPaso1 = () => {
    const errs = {}
    if (!nombreNegocio.trim()) errs.nombreNegocio = 'Ingresá el nombre del negocio o estudio'
    if (!slug.trim()) errs.slug = 'El identificador único (slug) es obligatorio'
    else if (!/^[a-z0-9-]+$/.test(slug))
      errs.slug = 'Solo letras minúsculas, números y guiones'
    return errs
  }

  const validarPaso2 = () => {
    const errs = {}
    if (!nombreOwner.trim()) errs.nombreOwner = 'Ingresá tu nombre y apellido'
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email))
      errs.email = 'Ingresá un email válido'
    if (!password || password.length < 6)
      errs.password = 'La contraseña debe tener mínimo 6 caracteres'
    return errs
  }

  const siguiente = () => {
    setErrorGlobal('')
    if (paso === 1) {
      const errs = validarPaso1()
      setErrores(errs)
      if (Object.keys(errs).length === 0) setPaso(2)
    } else if (paso === 2) {
      const errs = validarPaso2()
      setErrores(errs)
      if (Object.keys(errs).length === 0) setPaso(3)
    }
  }

  const anterior = () => {
    setErrorGlobal('')
    setPaso((p) => Math.max(1, p - 1))
  }

  const onSubmit = async () => {
    setEnviando(true)
    setErrorGlobal('')
    try {
      const res = await onboardingNegocioAPI({
        nombreNegocio,
        slug,
        nombreOwner,
        email,
        password,
        direccion,
        direccionPrivada: modalidad === 'particular' ? direccionPrivada : false,
        telefono,
        plan,
        rubro,
        modalidad,
      })

      localStorage.setItem('token', res.token)
      toast.exito(`¡${res.negocio.nombre} creado con éxito!`)
      window.location.href = '/dashboard'
    } catch (err) {
      setErrorGlobal(err.response?.data?.error || 'No pudimos crear el negocio')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 flex flex-col justify-between p-4 lg:p-8">
      {/* Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between pb-6 border-b border-white/10">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
          <span className="font-mono text-xs uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">
            BarberPole <span className="text-zinc-600">—</span> Plataforma de Turnos
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link
            to="/login"
            className="font-mono text-xs uppercase text-zinc-400 hover:text-white transition-colors"
          >
            ¿Ya tenés cuenta? Ingresar →
          </Link>
        </div>
      </header>

      {/* Wizard Central */}
      <main className="max-w-xl mx-auto w-full my-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <span className="font-mono text-xs text-zinc-500 uppercase tracking-widest">
              Paso {paso} de 3
            </span>
            <h1 className="text-3xl font-display font-bold text-white tracking-tight mt-1">
              {paso === 1 && 'Identidad & Modalidad'}
              {paso === 2 && 'Cuenta de Acceso'}
              {paso === 3 && 'Elegí tu Plan'}
            </h1>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  paso === n
                    ? 'bg-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.4)]'
                    : paso > n
                    ? 'bg-zinc-600'
                    : 'bg-zinc-800'
                }`}
              />
            ))}
          </div>
        </div>

        {errorGlobal && (
          <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-950/40 text-rose-300 px-4 py-3 font-mono text-xs">
            {errorGlobal}
          </div>
        )}

        <div className="border border-white/10 p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {/* PASO 1: MODALIDAD, RUBRO Y DATOS */}
            {paso === 1 && (
              <motion.div
                key="paso1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Selector Modalidad: Local vs Particular */}
                <div>
                  <label className="label">Modalidad de Atención *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setModalidad('local')}
                      className={`py-3 px-3 border font-mono text-xs uppercase tracking-wider text-center transition-colors cursor-pointer ${
                        modalidad === 'local'
                          ? 'border-white bg-white text-black font-semibold'
                          : 'border-white/20 text-neutral-400 hover:border-white/50 hover:text-white'
                      }`}
                    >
                      Local / Salón
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalidad('particular')}
                      className={`py-3 px-3 border font-mono text-xs uppercase tracking-wider text-center transition-colors cursor-pointer ${
                        modalidad === 'particular'
                          ? 'border-white bg-white text-black font-semibold'
                          : 'border-white/20 text-neutral-400 hover:border-white/50 hover:text-white'
                      }`}
                    >
                      Particular / Estudio
                    </button>
                  </div>
                  <p className="font-mono text-[10px] text-neutral-500 mt-2 uppercase tracking-wide">
                    {modalidad === 'local'
                      ? 'Local comercial a la calle o establecimiento con equipo.'
                      : 'Atención individual independiente (en casa o estudio privado).'}
                  </p>
                </div>

                {/* Selector Rubro */}
                <div>
                  <label className="label">Rubro o Especialidad *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {RUBROS.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRubro(r.id)}
                        className={`py-2.5 px-2 border font-mono text-xs uppercase tracking-wider text-center transition-colors cursor-pointer truncate ${
                          rubro === r.id
                            ? 'border-white bg-white text-black font-semibold'
                            : 'border-white/10 text-neutral-400 hover:border-white/30 hover:text-white'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nombre Comercial */}
                <div>
                  <label className="label" htmlFor="nombreNegocio">
                    Nombre del negocio, salón o profesional *
                  </label>
                  <input
                    id="nombreNegocio"
                    type="text"
                    value={nombreNegocio}
                    onChange={handleNombreNegocioChange}
                    placeholder={
                      modalidad === 'particular'
                        ? 'Ej. Rodrigo Díaz — Estilista / Dra. Gómez'
                        : 'Ej. Studio Palermo / Barbería La Nave'
                    }
                    className="input"
                    autoFocus
                  />
                  {errores.nombreNegocio && (
                    <p className="font-mono text-xs text-rose-400 mt-1 uppercase">
                      {errores.nombreNegocio}
                    </p>
                  )}
                </div>

                {/* Slug */}
                <div>
                  <label className="label" htmlFor="slug">
                    Enlace público para tu agenda (WhatsApp / Instagram) *
                  </label>
                  <div className="flex items-center rounded-lg border border-white/10 bg-zinc-950/80 px-3 py-2 text-sm font-mono text-zinc-400">
                    <span className="text-zinc-600 select-none">barberpole.app/</span>
                    <input
                      id="slug"
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(slugificar(e.target.value))}
                      placeholder="tu-estudio"
                      className="bg-transparent text-white font-medium focus:outline-none flex-1 ml-1"
                    />
                  </div>
                  {errores.slug && (
                    <p className="font-mono text-xs text-rose-400 mt-1 uppercase">
                      {errores.slug}
                    </p>
                  )}
                </div>

                {/* Ubicación y Teléfono */}
                <div className="grid sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="label" htmlFor="direccion">
                      {modalidad === 'particular' ? 'Zona o Localidad' : 'Dirección'}
                    </label>
                    <input
                      id="direccion"
                      type="text"
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      placeholder={modalidad === 'particular' ? 'Ej. Palermo Soho / Domicilio' : 'Ej. Av. Corrientes 1234'}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="telefono">
                      WhatsApp de contacto
                    </label>
                    <input
                      id="telefono"
                      type="text"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="+54 11 ..."
                      className="input"
                    />
                  </div>
                </div>

                {/* Si es particular, opción de dirección privada */}
                {modalidad === 'particular' && (
                  <div className="flex items-center gap-3 pt-2">
                    <input
                      id="direccionPrivada"
                      type="checkbox"
                      checked={direccionPrivada}
                      onChange={(e) => setDireccionPrivada(e.target.checked)}
                      className="w-4 h-4 accent-white rounded cursor-pointer"
                    />
                    <label
                      htmlFor="direccionPrivada"
                      className="font-mono text-xs text-neutral-300 uppercase cursor-pointer select-none"
                    >
                      Dirección privada (se envía al cliente tras reservar)
                    </label>
                  </div>
                )}

                <button
                  type="button"
                  onClick={siguiente}
                  className="btn btn-primario w-full mt-6 !py-3"
                >
                  Continuar a datos de acceso →
                </button>
              </motion.div>
            )}

            {/* PASO 2: CREDENCIALES DEL RESPONSABLE */}
            {paso === 2 && (
              <motion.div
                key="paso2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <label className="label" htmlFor="nombreOwner">
                    Tu nombre y apellido *
                  </label>
                  <input
                    id="nombreOwner"
                    type="text"
                    value={nombreOwner}
                    onChange={(e) => setNombreOwner(e.target.value)}
                    placeholder="Ej. Rodrigo Díaz"
                    className="input"
                    autoFocus
                  />
                  {errores.nombreOwner && (
                    <p className="font-mono text-xs text-rose-400 mt-1 uppercase">
                      {errores.nombreOwner}
                    </p>
                  )}
                </div>

                <div>
                  <label className="label" htmlFor="email">
                    Email de acceso *
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vos@tudominio.com"
                    className="input"
                  />
                  {errores.email && (
                    <p className="font-mono text-xs text-rose-400 mt-1 uppercase">
                      {errores.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="label" htmlFor="password">
                    Contraseña *
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="input"
                  />
                  {errores.password && (
                    <p className="font-mono text-xs text-rose-400 mt-1 uppercase">
                      {errores.password}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={anterior} className="btn btn-secundario flex-1">
                    ← Volver
                  </button>
                  <button type="button" onClick={siguiente} className="btn btn-primario flex-1">
                    Elegir plan →
                  </button>
                </div>
              </motion.div>
            )}

            {/* PASO 3: PLAN */}
            {paso === 3 && (
              <motion.div
                key="paso3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="grid sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setPlan('free')}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      plan === 'free'
                        ? 'border-white bg-zinc-900 shadow-[0_0_20px_rgba(255,255,255,0.15)]'
                        : 'border-white/10 bg-zinc-950/60 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs uppercase text-zinc-400 font-bold">
                        Plan Free
                      </span>
                      {plan === 'free' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <p className="font-mono text-2xl font-bold text-white">$0</p>
                    <p className="font-sans text-xs text-zinc-400 mt-2 leading-relaxed">
                      Hasta 50 turnos/mes, 1 profesional, link público activo. Ideal para particulares.
                    </p>
                  </div>

                  <div
                    onClick={() => setPlan('pro')}
                    className={`p-4 rounded-xl border cursor-pointer transition-all relative ${
                      plan === 'pro'
                        ? 'border-white bg-zinc-900 shadow-[0_0_20px_rgba(255,255,255,0.15)]'
                        : 'border-white/10 bg-zinc-950/60 hover:border-white/20'
                    }`}
                  >
                    <span className="absolute -top-2.5 right-3 font-mono text-[10px] uppercase px-2 py-0.5 rounded-full bg-white text-black font-bold">
                      Recomendado
                    </span>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs uppercase text-zinc-400 font-bold">
                        Plan Pro
                      </span>
                      {plan === 'pro' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <p className="font-mono text-2xl font-bold text-white">$29 / mes</p>
                    <p className="font-sans text-xs text-zinc-400 mt-2 leading-relaxed">
                      Turnos ilimitados, profesionales ilimitados, telemetría y Google Calendar sync.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950 border border-white/10 text-xs font-mono text-zinc-400 mt-4">
                  <div className="flex items-center gap-2 text-white font-semibold mb-1">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Tu agenda arrancará lista para recibir reservas:</span>
                  </div>
                  <p>
                    Crearemos automáticamente 2 servicios de cortesía adaptados a tu rubro ({RUBROS.find(r => r.id === rubro)?.label}) y tu perfil profesional para recibir reservas de inmediato.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={anterior} className="btn btn-secundario flex-1">
                    ← Volver
                  </button>
                  <button
                    type="button"
                    onClick={onSubmit}
                    disabled={enviando}
                    className="btn btn-primario flex-1 !py-3"
                  >
                    {enviando ? 'Configurando...' : 'Finalizar y Abrir Agenda'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full pt-6 border-t border-white/10 text-center font-mono text-xs text-zinc-600">
        BarberPole Multi-Tenant Platform · Motor Universal de Turnos 2026
      </footer>
    </div>
  )
}
