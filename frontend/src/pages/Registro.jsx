// Página de Registro.
// Mismo lenguaje visual que Login pero con motif distinto: en vez de barber
// pole, una "muralla tipográfica" con texto rotado repetido — referencia a
// los stickers / etiquetas típicos del neo-brutalismo. Y el split invertido
// (decoración a la derecha) para que no sea idéntico a Login.

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../hooks/useToast.js'

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
      toast.exito(`Bienvenido a Peluquería SaaS, ${primerNombre}`)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setErrorGlobal(err.response?.data?.error || 'No pudimos crear la cuenta')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_1.1fr]">
      {/* Lado formulario */}
      <div className="flex items-center justify-center p-8 lg:p-16 order-2 lg:order-1">
        <div className="w-full max-w-md space-y-6">
          <Link
            to="/"
            className="font-mono text-xs uppercase inline-block hover:text-azul-faro tracking-tight"
          >
            ← Volver al inicio
          </Link>

          <div>
            <h1 className="text-5xl md:text-6xl font-display font-bold uppercase tracking-tighter leading-none">
              Sumate.
            </h1>
            <p className="font-mono text-sm uppercase mt-4 tracking-tight">
              Creá tu cuenta para reservar turnos
            </p>
          </div>

          {errorGlobal && (
            <div className="border-3 border-negro bg-rojo-faro text-white px-4 py-3 font-mono text-sm uppercase">
              {errorGlobal}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            <div>
              <label className="label" htmlFor="nombre">
                Nombre
              </label>
              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="input"
                placeholder="Tu nombre completo"
                autoComplete="name"
              />
              {errores.nombre && (
                <p className="font-mono text-xs text-rojo-faro mt-2 uppercase">
                  {errores.nombre}
                </p>
              )}
            </div>

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

            <div className="grid sm:grid-cols-2 gap-4">
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
                  placeholder="6+ caracteres"
                  autoComplete="new-password"
                />
                {errores.password && (
                  <p className="font-mono text-xs text-rojo-faro mt-2 uppercase">
                    {errores.password}
                  </p>
                )}
              </div>

              <div>
                <label className="label" htmlFor="password2">
                  Repetir
                </label>
                <input
                  id="password2"
                  type="password"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  className="input"
                  placeholder="Repetí la contraseña"
                  autoComplete="new-password"
                />
                {errores.password2 && (
                  <p className="font-mono text-xs text-rojo-faro mt-2 uppercase">
                    {errores.password2}
                  </p>
                )}
              </div>
            </div>

            <button type="submit" disabled={enviando} className="btn btn-peligro w-full">
              {enviando ? 'Creando...' : 'Crear cuenta'}
            </button>
          </form>

          <p className="font-mono text-sm uppercase text-center tracking-tight">
            ¿Ya tenés cuenta?{' '}
            <Link
              to="/login"
              className="underline decoration-2 underline-offset-4 hover:text-azul-faro font-bold"
            >
              Ingresá
            </Link>
          </p>
        </div>
      </div>

      {/* Lado decorativo — muralla tipográfica rotada */}
      <div className="hidden lg:flex relative bg-azul-faro overflow-hidden items-center justify-center order-1 lg:order-2">
        <MurallaTipografica />
        <div className="absolute bottom-12 left-12 right-12 z-10">
          <h2 className="font-display font-bold text-white text-5xl xl:text-7xl uppercase leading-none tracking-tighter">
            Una silla.
            <br />
            <span className="text-rojo-faro">Tu turno.</span>
          </h2>
          <p className="font-mono text-xs text-white/70 mt-4 uppercase tracking-tight">
            Reservá online en 30 segundos
          </p>
        </div>
        <div className="absolute top-12 right-12 z-10">
          <span className="badge bg-white text-negro border-white">N° 001</span>
        </div>
      </div>
    </div>
  )
}

// Capa de texto repetido y rotado, vibra de poster brutalist.
// Cada línea es un Array.from para que el texto se repita sin escribirlo
// 7 veces a mano.
function MurallaTipografica() {
  const texto = '✂ PELUQUERIA · '
  const fila = Array.from({ length: 12 }).map(() => texto).join('')
  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-2 opacity-20 pointer-events-none select-none">
      {Array.from({ length: 14 }).map((_, i) => (
        <div
          key={i}
          className="font-display font-bold text-white text-3xl uppercase whitespace-nowrap"
          style={{ transform: `translateX(${i % 2 === 0 ? '-10%' : '-30%'})` }}
        >
          {fila}
        </div>
      ))}
    </div>
  )
}
