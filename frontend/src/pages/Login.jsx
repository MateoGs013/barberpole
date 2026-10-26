import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../hooks/useToast.js'
import { ThemeToggle } from '../components/ThemeToggle.jsx'
import { GoogleLoginButton } from '../components/GoogleLoginButton.jsx'
import { ArrowLeft } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errores, setErrores] = useState({})
  const [errorGlobal, setErrorGlobal] = useState('')
  const [enviando, setEnviando] = useState(false)

  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const redirigirA = location.state?.from?.pathname || '/dashboard'

  const validar = () => {
    const err = {}
    if (!email.trim()) {
      err.email = 'Ingresá tu email'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      err.email = 'Formato de email inválido'
    }
    if (!password) {
      err.password = 'Ingresá una contraseña'
    }
    setErrores(err)
    return Object.keys(err).length === 0
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setErrorGlobal('')

    if (!validar()) return

    setEnviando(true)
    try {
      const usuario = await login({ email, password })
      toast.exito('Sesión iniciada correctamente')
      const destino = location.state?.from?.pathname || (usuario?.rol === 'superadmin' ? '/superadmin' : '/dashboard')
      navigate(destino, { replace: true })
    } catch (err) {
      const msg = err.response?.data?.error || 'Credenciales inválidas'
      setErrorGlobal(msg)
      toast.error(msg)
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
        {/* Columna Izquierda: Identidad Tipográfica Monumental */}
        <div className="lg:col-span-6 space-y-6">
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-500">
            — ACCESO AL SISTEMA
          </p>
          <h1 className="text-4xl sm:text-6xl font-mono font-medium tracking-tight text-white uppercase leading-none">
            INICIAR
            <br />
            SESIÓN.
          </h1>
          <p className="font-sans text-sm text-neutral-400 max-w-md font-light leading-relaxed">
            Plataforma despojada de fricción para salones y barberías. Ingresá con Google o tus credenciales de acceso directo.
          </p>

          <div className="hidden lg:block pt-8 border-t border-white/10 space-y-3 font-mono text-xs text-neutral-500 uppercase tracking-wider">
            <div>01 — AUTENTICACIÓN GOOGLE 1-CLICK</div>
            <div>02 — CONTROL DE CONCURRENCIA ATÓMICO</div>
            <div>03 — SINCRONIZACIÓN GOOGLE CALENDAR</div>
          </div>
        </div>

        {/* Columna Derecha: Formulario Profesional */}
        <div className="lg:col-span-6 max-w-lg w-full space-y-8 lg:ml-auto">
          {errorGlobal && (
            <div className="p-4 border border-rose-500/30 text-rose-300 font-mono text-xs uppercase tracking-wide">
              {errorGlobal}
            </div>
          )}

          {/* Botón Principal Google */}
          <div className="space-y-4">
            <GoogleLoginButton
              onSuccess={(u) => {
                const destino = location.state?.from?.pathname || (u?.rol === 'superadmin' ? '/superadmin' : '/dashboard')
                navigate(destino, { replace: true })
              }}
            />
            <div className="flex items-center gap-3">
              <span className="h-px bg-white/10 flex-1" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                O CON EMAIL DIRECTO
              </span>
              <span className="h-px bg-white/10 flex-1" />
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-6" noValidate>
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
                autoComplete="current-password"
              />
              {errores.password && (
                <p className="font-mono text-xs text-rose-400 mt-2 uppercase tracking-wide">
                  {errores.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={enviando}
              className="btn btn-primario w-full !py-4"
            >
              {enviando ? 'Ingresando...' : 'Iniciar sesión ↗'}
            </button>
          </form>

          <div className="pt-6 border-t border-white/10 flex items-center justify-between font-mono text-xs">
            <span className="text-neutral-500">¿No tenés cuenta?</span>
            <Link
              to="/registro"
              className="text-white hover:underline uppercase tracking-wider font-medium"
            >
              Registrate ↗
            </Link>
          </div>
        </div>
      </main>

      {/* Footer Objetivo B&W */}
      <footer className="w-full border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-neutral-500 uppercase tracking-widest gap-4">
        <span>BARBERPOLE — SISTEMA EDITORIAL</span>
        <div className="flex items-center gap-4 text-neutral-400">
          <Link to="/privacidad" className="hover:text-white transition-colors">
            Privacidad
          </Link>
          <span className="text-neutral-700">·</span>
          <Link to="/terminos" className="hover:text-white transition-colors">
            Términos
          </Link>
        </div>
      </footer>
    </div>
  )
}
