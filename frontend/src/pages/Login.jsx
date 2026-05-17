// Página de Login.
// Layout split asimétrico: izquierda decorativa (barber pole sobre negro),
// derecha formulario sobre crema. En mobile el split se colapsa y muestra
// solo el formulario.

import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../hooks/useToast.js'
import { BarberPole } from '../components/BarberPole.jsx'

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
  // Si el usuario intentó entrar a una ruta protegida sin sesión, lo mandamos
  // a esa ruta después del login. Si no, default a /dashboard.
  const destino = location.state?.from?.pathname || '/dashboard'

  // Validación manual con useState — la consigna del parcial pide que el
  // frontend también valide, sin librerías como react-hook-form.
  const validar = () => {
    const errs = {}
    if (!email.trim()) errs.email = 'Ingresá tu email'
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Formato de email inválido'
    if (!password) errs.password = 'Ingresá tu contraseña'
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
      const usuario = await login({ email: email.trim(), password })
      const primerNombre = usuario.nombre?.split(' ')[0] || ''
      toast.exito(`Hola de nuevo, ${primerNombre}`)
      navigate(destino, { replace: true })
    } catch (err) {
      setErrorGlobal(err.response?.data?.error || 'No pudimos iniciar la sesión')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr]">
      {/* Lado decorativo — solo desktop */}
      <div className="hidden lg:flex relative bg-negro overflow-hidden items-center justify-center p-12">
        <BarberPole className="w-56 h-96 z-10" />
        <div className="absolute top-12 left-12 right-12">
          <p className="font-mono text-xs uppercase text-white/60 tracking-tight">
            [Sistema · v1.0]
          </p>
        </div>
        <div className="absolute bottom-12 left-12 right-12">
          <h2 className="font-display font-bold text-white text-5xl xl:text-7xl uppercase leading-none tracking-tighter">
            Peluquería
            <br />
            <span className="text-rojo-faro">SaaS</span>
          </h2>
          <p className="font-mono text-xs text-white/60 mt-4 uppercase tracking-tight">
            Gestión de turnos · servicios · clientes
          </p>
        </div>
      </div>

      {/* Lado formulario */}
      <div className="flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md space-y-8">
          <Link
            to="/"
            className="font-mono text-xs uppercase inline-block hover:text-rojo-faro tracking-tight"
          >
            ← Volver al inicio
          </Link>

          <div>
            <h1 className="text-5xl md:text-6xl font-display font-bold uppercase tracking-tighter leading-none">
              Hola de
              <br />
              nuevo.
            </h1>
            <p className="font-mono text-sm uppercase mt-4 tracking-tight">
              Ingresá para gestionar la peluquería
            </p>
          </div>

          {errorGlobal && (
            <div className="border-3 border-negro bg-rojo-faro text-white px-4 py-3 font-mono text-sm uppercase">
              {errorGlobal}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            <div>
              <label className="label" htmlFor="email">
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
                <p className="font-mono text-xs text-rojo-faro mt-2 uppercase">
                  {errores.email}
                </p>
              )}
            </div>

            <div>
              <label className="label" htmlFor="password">
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
                <p className="font-mono text-xs text-rojo-faro mt-2 uppercase">
                  {errores.password}
                </p>
              )}
            </div>

            <button type="submit" disabled={enviando} className="btn btn-primario w-full">
              {enviando ? 'Entrando...' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="font-mono text-sm uppercase text-center tracking-tight">
            ¿No tenés cuenta?{' '}
            <Link
              to="/registro"
              className="underline decoration-2 underline-offset-4 hover:text-rojo-faro font-bold"
            >
              Registrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
