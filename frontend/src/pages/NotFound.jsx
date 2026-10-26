import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { ArrowLeft, LayoutDashboard } from 'lucide-react'

export default function NotFound() {
  const { usuario } = useAuth()
  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 flex flex-col">
      <header className="px-4 lg:px-8 py-3.5 border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl">
        <Link
          to="/"
          className="flex items-center gap-2 group w-fit"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
          <span className="font-mono text-xs uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">
            BarberPole <span className="text-zinc-600">—</span> Studio
          </span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-xl">
          <p className="font-mono font-bold leading-none tracking-tight text-[22vw] lg:text-[10rem] text-zinc-800 select-none">
            404
          </p>
          <h1 className="font-display font-bold text-2xl md:text-3xl tracking-tight text-white mt-4">
            Página no encontrada.
          </h1>
          <p className="font-mono text-xs uppercase mt-2 tracking-wider text-zinc-500">
            La ruta solicitada no se encuentra disponible en el sistema.
          </p>
          <div className="flex gap-2.5 justify-center flex-wrap mt-8">
            <Link to="/" className="btn btn-primario">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Volver al inicio
            </Link>
            {usuario && (
              <Link to="/dashboard" className="btn btn-secundario">
                <LayoutDashboard className="w-3.5 h-3.5 mr-1" />
                Ir al panel
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
