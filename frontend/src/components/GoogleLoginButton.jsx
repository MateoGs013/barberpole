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

    const inicializarGSI = () => {
      if (!window.google?.accounts?.id) return
      try {
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
          auto_select: false,
          cancel_on_tap_outside: true,
        })
      } catch (err) {
        console.warn('GSI initialize error:', err)
      }
    }

    if (window.google?.accounts?.id) {
      inicializarGSI()
      return
    }

    const scriptExistente = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
    if (!scriptExistente) {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = inicializarGSI
      document.body.appendChild(script)
    } else {
      scriptExistente.addEventListener('load', inicializarGSI)
    }
  }, [googleClientId, loginConGoogle, navigate, onSuccess, toast])

  const handleClick = async () => {
    if (googleClientId && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed()) {
            console.warn('Google One Tap no se mostró:', notification.getNotDisplayedReason())
          }
          if (notification.isSkippedMoment()) {
            console.warn('Google One Tap omitido:', notification.getSkippedReason())
          }
        })
      } catch (err) {
        console.warn('Error al invocar prompt de Google:', err)
        setModalDev(true)
      }
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
              placeholder="Ej: Mateo G."
              className="input"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setModalDev(false)}
              className="btn btn-secundario !py-2 !px-4 text-xs font-mono uppercase"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="btn btn-primario !py-2 !px-5 text-xs font-mono uppercase flex items-center gap-2"
            >
              <span>{cargando ? 'Conectando...' : 'Entrar (Dev)'}</span>
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
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 5c1.56 0 2.96.57 4.07 1.5l3.05-3.05C17.27 1.7 14.82 1 12 1 7.46 1 3.59 3.58 1.69 7.35l3.66 2.84C6.23 7.3 8.87 5 12 5z"
      />
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.69 2.86c2.16-1.99 3.73-4.92 3.73-8.68z"
      />
      <path
        fill="#FBBC05"
        d="M5.35 14.81c-.24-.7-.37-1.45-.37-2.22s.13-1.52.37-2.22L1.69 7.53C.61 9.68 0 12.09 0 14.61c0 2.52.61 4.93 1.69 7.08l3.66-2.88z"
      />
      <path
        fill="#34A853"
        d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.69-2.86c-1.07.72-2.45 1.16-4.24 1.16-3.13 0-5.77-2.11-6.72-4.96L1.62 16.27C3.51 20.08 7.42 23 12 23z"
      />
    </svg>
  )
}
