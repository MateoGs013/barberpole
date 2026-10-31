import { useAuth } from '../hooks/useAuth.js'

const ETIQUETAS_ROL = {
  admin: 'Administrador',
  empleado: 'Empleado',
  cliente: 'Cliente',
}

export default function Perfil() {
  const { usuario } = useAuth()
  if (!usuario) return null

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-8">
      <div className="border-b border-ink/10 pb-6">
        <p className="font-mono text-xs uppercase tracking-widest text-faint mb-1">
          — IDENTIDAD DE USUARIO
        </p>
        <h1 className="text-4xl sm:text-6xl font-mono font-medium tracking-tight text-ink uppercase leading-none">
          PERFIL.
        </h1>
      </div>

      <div className="divide-y divide-ink/10 border-t border-b border-ink/10">
        <div className="py-6 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <span className="font-mono text-xs uppercase tracking-wider text-faint sm:w-1/3">
            Nombre Completo
          </span>
          <span className="font-mono text-lg font-medium text-ink sm:w-2/3">
            {usuario.nombre}
          </span>
        </div>

        <div className="py-6 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <span className="font-mono text-xs uppercase tracking-wider text-faint sm:w-1/3">
            Rol del Sistema
          </span>
          <div className="sm:w-2/3">
            <span className="badge badge-confirmado">
              {ETIQUETAS_ROL[usuario.rol] || usuario.rol}
            </span>
          </div>
        </div>

        <div className="py-6 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <span className="font-mono text-xs uppercase tracking-wider text-faint sm:w-1/3">
            Correo Electrónico
          </span>
          <span className="font-mono text-sm text-muted sm:w-2/3">
            {usuario.email}
          </span>
        </div>

        <div className="py-6 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <span className="font-mono text-xs uppercase tracking-wider text-faint sm:w-1/3">
            ID de Cuenta
          </span>
          <span className="font-mono text-xs text-muted break-all sm:w-2/3">
            {usuario.id}
          </span>
        </div>

        <div className="py-6 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <span className="font-mono text-xs uppercase tracking-wider text-faint sm:w-1/3">
            Seguridad
          </span>
          <p className="font-sans text-xs text-muted font-light sm:w-2/3">
            Para modificar tu contraseña o datos de contacto, comunicate directamente con el administrador de la plataforma.
          </p>
        </div>
      </div>
    </div>
  )
}
