import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../hooks/useToast.js'
import { ThemeToggle } from '../components/ThemeToggle.jsx'
import { GoogleLoginButton } from '../components/GoogleLoginButton.jsx'
import { ArrowLeft } from 'lucide-react'

export default function Registro() {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [errores, setErrores] = useState({})
  const [errorGlobal, setErrorGlobal] = useState('')
  const [enviando, setEnviando] = useState(false)

  const { registrar } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const validar = () => {
    const errs = {}
    if (!nombre.trim()) errs.nombre = 'Ingresá tu nombre'
    else if (nombre.trim().length < 2) errs.nombre = 'Mínimo 2 caracteres'
    if (!email.trim()) errs.email = 'Ingresá tu email'
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Formato de email inválido'
    if (!password) errs.password = 'Ingresá una contraseña'
    else if (password.length < 6) errs.password = 'Mínimo 6 caracteres'
    if (password !== password2) errs.password2 = 'Las contraseñas no coinciden'
    return errs
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setErrorGlobal('')
    const errs = validar()
    setErrores(errs)
    if (Object.keys(errs).length > 0) return

    setEnviando(true)
    try {
      const usuario = await registrar({ nombre: nombre.trim(), email: email.trim(), password })
      const primerNombre = usuario.nombre?.split(' ')[0] || ''
      toast.exito(`Bienvenido a BarberPole, ${primerNombre}`)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setErrorGlobal(err.response?.data?.error || 'No pudimos crear la cuenta')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-black text-white flex flex-col justify-between p-6 sm:p-10 md:p-16 lg:p-20 selection:bg-white selection:text-black">
      {/* Header Editorial B&W */}
      <header className="w-full border-b border-white/10 pb-6 flex items-center justify-between text-xs font-mono uppercase tracking-widest text-neutral-400">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al inicio</span>
        </Link>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <span className="hidden sm:inline text-white font-medium">BARBERPOLE — STUDIO</span>
        </div>
      </header>

      {/* Main Grid Editorial */}
      <main className="w-full my-auto py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        {/* Columna Izquierda: Identidad */}
        <div className="lg:col-span-6 space-y-6">
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-500">
            — NUEVO CLIENTE
          </p>
          <h1 className="text-4xl sm:text-6xl font-mono font-medium tracking-tight text-white uppercase leading-none">
            CREAR
            <br />
            CUENTA.
          </h1>
          <p className="font-sans text-sm text-neutral-400 max-w-md font-light leading-relaxed">
            Creá tu perfil en 10 segundos con Google o email directo para agendar con confirmación automática en tu calendario.
          </p>

          <div className="hidden lg:block pt-8 border-t border-white/10 space-y-3 font-mono text-xs text-neutral-500 uppercase tracking-wider">
            <div>01 — EMISIÓN INMEDIATA DE TICKET</div>
            <div>02 — SINCRONIZACIÓN GOOGLE CALENDAR</div>
            <div>03 — RECORDATORIOS VÍA WHATSAPP</div>
          </div>
        </div>

        {/* Columna Derecha: Formulario */}
        <div className="lg:col-span-6 max-w-lg w-full space-y-8 lg:ml-auto">
          {errorGlobal && (
            <div className="p-4 border border-rose-500/30 text-rose-300 font-mono text-xs uppercase tracking-wide">
              {errorGlobal}
            </div>
          )}

          {/* Botón Principal Google 1-Click */}
          <div className="space-y-4">
            <GoogleLoginButton
              texto="REGISTRARSE CON GOOGLE"
              onSuccess={() => navigate('/dashboard', { replace: true })}
            />
            <div className="flex items-center gap-3">
              <span className="h-px bg-white/10 flex-1" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                O COMPLETAR MANUALMENTE
              </span>
              <span className="h-px bg-white/10 flex-1" />
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-6" noValidate>
            <div>
              <label htmlFor="nombre" className="label">
                Nombre y Apellido
              </label>
              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="input"
                placeholder="Juan Pérez"
                autoComplete="name"
              />
              {errores.nombre && (
                <p className="font-mono text-xs text-rose-400 mt-2 uppercase tracking-wide">
                  {errores.nombre}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="vos@email.com"
                autoComplete="email"
              />
              {errores.email && (
                <p className="font-mono text-xs text-rose-400 mt-2 uppercase tracking-wide">
                  {errores.email}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="password" className="label">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                {errores.password && (
                  <p className="font-mono text-xs text-rose-400 mt-2 uppercase tracking-wide">
                    {errores.password}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="password2" className="label">
                  Repetir contraseña
                </label>
                <input
                  id="password2"
                  type="password"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  className="input"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                {errores.password2 && (
                  <p className="font-mono text-xs text-rose-400 mt-2 uppercase tracking-wide">
                    {errores.password2}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={enviando}
              className="btn btn-primario w-full !py-4"
            >
              {enviando ? 'Creando cuenta...' : 'Crear cuenta ↗'}
            </button>
          </form>

          <div className="pt-6 border-t border-white/10 flex items-center justify-between font-mono text-xs">
            <span className="text-neutral-500">¿Ya tenés cuenta?</span>
            <Link
              to="/login"
              className="text-white hover:underline uppercase tracking-wider font-medium"
            >
              Iniciá sesión ↗
            </Link>
          </div>
        </div>
      </main>

      {/* Footer Editorial B&W */}
      <footer className="w-full border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-neutral-500 uppercase tracking-widest gap-4">
        <span>BARBERPOLE — SISTEMA EDITORIAL</span>
        <span>MODO ZEN & HIPERFOCO PERMANENTE</span>
      </footer>
    </div>
  )
}
