import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../hooks/useToast.js'
import { useNavigate } from 'react-router-dom'

export function GoogleLoginButton({
  onSuccess,
  texto = 'CONTINUAR CON GOOGLE',
  className = '',
}) {
  const { loginConGoogle } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [cargando, setCargando] = useState(false)

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
              if (onSuccess) onSuccess(usuario)
              else navigate('/dashboard')
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

    try {
      setCargando(true)
      const mockGoogleProfile = {
        nombre: 'Agustín Navarro (Google)',
        email: 'agustin.navarro.google@barberpole.test',
        googleId: 'google-oauth2|10987654321',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop',
      }

      const usuario = await loginConGoogle(mockGoogleProfile)
      toast.exito(`Sesión iniciada con Google — ${usuario.nombre}`)
      if (onSuccess) onSuccess(usuario)
      else navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo iniciar sesión con Google')
    } finally {
      setCargando(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={cargando}
      className={`w-full py-3.5 px-4 border border-white/20 hover:border-white hover:bg-white hover:text-black font-mono text-xs uppercase tracking-widest transition-all duration-150 flex items-center justify-center gap-3 select-none cursor-pointer disabled:opacity-40 disabled:pointer-events-none ${className}`}
      title="Iniciar sesión instantáneamente con tu cuenta de Google"
    >
      <GoogleIcon className="w-4 h-4 shrink-0" />
      <span>{cargando ? 'AUTENTICANDO...' : texto}</span>
    </button>
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
