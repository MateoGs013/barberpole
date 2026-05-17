// Perfil: muestra los datos del usuario logueado como un "carnet" brutalista.
// En esta versión es read-only — para cambiar password contactá al admin.
// (Decisión consciente para acotar el alcance del parcial.)

import { useAuth } from '../hooks/useAuth.js'
import { BarberPole } from '../components/BarberPole.jsx'

const formatearFecha = (iso) => {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso))
}

const ETIQUETAS_ROL = {
  admin: 'Administrador',
  empleado: 'Empleado',
  cliente: 'Cliente',
}

export default function Perfil() {
  const { usuario } = useAuth()
  if (!usuario) return null

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-10">
        <p className="font-mono text-xs uppercase text-negro/60 tracking-tight">Tu</p>
        <h1 className="text-5xl md:text-7xl font-display font-bold uppercase tracking-tighter leading-none">
          Perfil.
        </h1>
      </div>

      {/* Tarjeta tipo carnet */}
      <article className="card !p-0 overflow-hidden">
        <div className="grid sm:grid-cols-[1fr_auto]">
          <div className="p-6 lg:p-8 space-y-6">
            <div>
              <p className="font-mono text-xs uppercase text-negro/60 tracking-tight">
                Identificación
              </p>
              <p className="font-display font-bold text-3xl lg:text-4xl uppercase tracking-tighter leading-tight">
                {usuario.nombre}
              </p>
              <span className="badge badge-confirmado mt-2">
                {ETIQUETAS_ROL[usuario.rol] || usuario.rol}
              </span>
            </div>

            <Dato etiqueta="Email" valor={usuario.email} />
            <Dato etiqueta="ID interno" valor={usuario.id} mono />

            <div className="pt-6 border-t-2 border-negro">
              <p className="font-mono text-xs uppercase text-negro/60 tracking-tight">
                Nota
              </p>
              <p className="font-sans text-sm mt-1">
                Para cambiar tu nombre o contraseña, contactá al administrador del sistema.
              </p>
            </div>
          </div>

          {/* Decoración lateral */}
          <div className="hidden sm:flex bg-negro p-6 items-center justify-center border-l-3 border-negro">
            <BarberPole className="w-20 h-72" />
          </div>
        </div>
      </article>
    </div>
  )
}

function Dato({ etiqueta, valor, mono = false }) {
  return (
    <div>
      <p className="font-mono text-xs uppercase text-negro/60 tracking-tight">{etiqueta}</p>
      <p className={`${mono ? 'font-mono text-sm break-all' : 'font-sans text-base'} mt-1`}>
        {valor}
      </p>
    </div>
  )
}
