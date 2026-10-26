import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../hooks/useToast.js'
import { useNavigate } from 'react-router-dom'
import { Modal } from './Modal.jsx'
import { ArrowRight, Info } from 'lucide-react'

export function GoogleLoginButton({
  onSuccess,
  texto = 'CONTINUAR CON GOOGLE',
  className = '',
}) {
  const { loginConGoogle } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [cargando, setCargando] = useState(false)

  // Modal de fallback para desarrollo si no hay VITE_GOOGLE_CLIENT_ID
  const [modalDev, setModalDev] = useState(false)
  const [devEmail, setDevEmail] = useState('')
  const [devNombre, setDevNombre] = useState('')

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  useEffect(() => {
    if (!googleClientId) return

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            try {
              setCargando(true)
              const usuario = await loginConGoogle({ credential: response.credential })
              toast.exito(`Sesión iniciada con Google — ${usuario.nombre}`)
              const destino = usuario.rol === 'superadmin' ? '/superadmin' : '/dashboard'
              if (onSuccess) onSuccess(usuario)
              else navigate(destino)
            } catch (err) {
              toast.error(err.response?.data?.error || 'Error al autenticar con Google')
            } finally {
              setCargando(false)
            }
          },
        })
      }
    }
    document.body.appendChild(script)

    return () => {
      try {
        document.body.removeChild(script)
      } catch {}
    }
  }, [googleClientId, loginConGoogle, navigate, onSuccess, toast])

  const handleClick = async () => {
    if (googleClientId && window.google?.accounts?.id) {
      window.google.accounts.id.prompt()
      return
    }

    // Si no está configurado VITE_GOOGLE_CLIENT_ID (entorno local o de desarrollo)
    setModalDev(true)
  }

  const handleDevSubmit = async (e) => {
    e.preventDefault()
    if (!devEmail.trim() || !/\S+@\S+\.\S+/.test(devEmail)) {
      toast.error('Ingresá un email válido para simular el acceso de Google')
      return
    }

    try {
      setCargando(true)
      const emailFinal = devEmail.trim().toLowerCase()
      const nombreFinal = devNombre.trim() || emailFinal.split('@')[0]
      const usuario = await loginConGoogle({
        email: emailFinal,
        nombre: nombreFinal,
        googleId: `google_dev_${Date.now()}`,
      })

      setModalDev(false)
      toast.exito(`Sesión iniciada con Google (Dev) — ${usuario.nombre}`)
      const destino = usuario.rol === 'superadmin' ? '/superadmin' : '/dashboard'
      if (onSuccess) onSuccess(usuario)
      else navigate(destino)
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo iniciar sesión con Google')
    } finally {
      setCargando(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={cargando}
        className={`w-full py-3.5 px-4 border border-white/20 hover:border-white hover:bg-white hover:text-black font-mono text-xs uppercase tracking-widest transition-all duration-150 flex items-center justify-center gap-3 select-none cursor-pointer disabled:opacity-40 disabled:pointer-events-none ${className}`}
        title="Iniciar sesión con tu cuenta de Google"
      >
        <GoogleIcon className="w-4 h-4 shrink-0" />
        <span>{cargando ? 'AUTENTICANDO...' : texto}</span>
      </button>

      {/* Modal de Acceso Google en Modo Desarrollo */}
      <Modal
        abierto={modalDev}
        onCerrar={() => setModalDev(false)}
        titulo="Acceso con Google — Modo Local"
        ancho="max-w-md"
      >
        <form onSubmit={handleDevSubmit} className="space-y-4 font-mono text-xs">
          <div className="p-3 border border-white/10 bg-white/5 space-y-1">
            <div className="flex items-center gap-2 text-white font-medium uppercase tracking-wider">
              <Info className="w-3.5 h-3.5 text-neutral-400" />
              <span>Configuración de Google OAuth</span>
            </div>
            <p className="text-neutral-400 font-sans text-xs font-light leading-relaxed">
              No se detectó <code className="text-white">VITE_GOOGLE_CLIENT_ID</code> en el frontend. Podés ingresar tu email directamente para probar el acceso o configurar tu Client ID en el archivo <code className="text-white">.env</code>.
            </p>
          </div>

          <div>
            <label htmlFor="devEmail" className="label">
              Tu Email de Google *
            </label>
            <input
              id="devEmail"
              type="email"
              value={devEmail}
              onChange={(e) => setDevEmail(e.target.value)}
              placeholder="tu_email@gmail.com"
              className="input"
              autoFocus
              required
            />
          </div>

          <div>
            <label htmlFor="devNombre" className="label">
              Tu Nombre (Opcional)
            </label>
            <input
              id="devNombre"
              type="text"
              value={devNombre}
              onChange={(e) => setDevNombre(e.target.value)}
              placeholder="Ej. Mateo Gabús"
              className="input"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => setModalDev(false)}
              className="btn btn-secundario flex-1"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="btn btn-primario flex-1 flex items-center justify-center gap-2"
            >
              <span>{cargando ? 'Ingresando...' : 'Continuar'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}

function GoogleIcon({ className = 'w-4 h-4' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M21.35 11.1H12v2.98h5.36c-.46 2.45-2.58 3.92-5.36 3.92-3.32 0-6-2.68-6-6s2.68-6 6-6c1.47 0 2.81.54 3.84 1.43l2.25-2.25C17.65 3.79 15 3 12 3 7.03 3 3 7.03 3 12s4.03 9 9 9c5.22 0 8.68-3.66 8.68-8.83 0-.71-.07-1.39-.33-2.07z" />
    </svg>
  )
}
