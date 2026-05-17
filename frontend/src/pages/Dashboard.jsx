// Dashboard: pantalla de inicio para usuarios logueados.
// Adapta el contenido según el rol del usuario.
// - Admin/empleado: 4 KPIs sobre todos los turnos + lista de próximos.
// - Cliente: KPIs sobre sus propios turnos + sus próximos.

import { Link } from 'react-router-dom'
import { useFetch } from '../hooks/useFetch.js'
import { listarTurnosAPI } from '../api/turnos.api.js'
import { useAuth } from '../hooks/useAuth.js'

const formatearHora = (fecha) =>
  new Intl.DateTimeFormat('es-AR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(fecha)

// Filtra turnos cuya fechaHora es >= ahora y los ordena ascendente.
const proximosTurnos = (turnos = [], cantidad = 5) => {
  const ahora = Date.now()
  return [...turnos]
    .filter((t) => new Date(t.fechaHora).getTime() >= ahora)
    .sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora))
    .slice(0, cantidad)
}

// Suma precios de servicios de turnos completados del mes en curso.
const ingresosDelMes = (turnos = []) => {
  const ahora = new Date()
  const desde = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
  return turnos
    .filter((t) => t.estado === 'completado' && new Date(t.fechaHora) >= desde)
    .reduce((acc, t) => acc + (t.servicio?.precio || 0), 0)
}

export default function Dashboard() {
  const { usuario } = useAuth()
  const { datos: turnos, cargando } = useFetch(() => listarTurnosAPI())
  const esCliente = usuario?.rol === 'cliente'

  const total = turnos?.length || 0
  const pendientes = turnos?.filter((t) => t.estado === 'pendiente').length || 0
  const confirmados = turnos?.filter((t) => t.estado === 'confirmado').length || 0
  const ingresos = ingresosDelMes(turnos)
  const proximos = proximosTurnos(turnos)

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-10">
        <p className="font-mono text-xs uppercase text-negro/60 tracking-tight">
          Hola, {usuario?.nombre?.split(' ')[0]?.toLowerCase()}
        </p>
        <h1 className="text-5xl md:text-7xl font-display font-bold uppercase tracking-tighter leading-none">
          {esCliente ? 'Bienvenido.' : 'Tu panel.'}
        </h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <CardKpi
          etiqueta={esCliente ? 'Mis turnos' : 'Turnos'}
          valor={total}
          fondo="bg-crema"
        />
        <CardKpi etiqueta="Pendientes" valor={pendientes} fondo="bg-white" />
        <CardKpi etiqueta="Confirmados" valor={confirmados} fondo="bg-azul-faro text-white" />
        {esCliente ? (
          <CardKpi
            etiqueta="Completados"
            valor={turnos?.filter((t) => t.estado === 'completado').length || 0}
            fondo="bg-negro text-white"
          />
        ) : (
          <CardKpi
            etiqueta="Ingresos del mes"
            valor={`$${ingresos.toLocaleString('es-AR')}`}
            fondo="bg-rojo-faro text-white"
          />
        )}
      </div>

      {/* Próximos turnos */}
      <section>
        <div className="flex items-end justify-between border-b-3 border-negro pb-2 mb-4">
          <h2 className="font-display font-bold text-2xl md:text-4xl uppercase tracking-tighter leading-none">
            Próximos turnos
          </h2>
          <Link
            to="/turnos"
            className="font-mono text-xs uppercase underline decoration-2 underline-offset-4 hover:text-azul-faro"
          >
            Ver todos →
          </Link>
        </div>

        {cargando && <p className="font-mono uppercase">Cargando...</p>}
        {!cargando && proximos.length === 0 && (
          <div className="card text-center">
            <p className="font-display text-xl uppercase">No hay turnos próximos</p>
          </div>
        )}
        {proximos.length > 0 && (
          <ul className="space-y-3">
            {proximos.map((t) => (
              <FilaTurnoProximo key={t._id} turno={t} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function CardKpi({ etiqueta, valor, fondo }) {
  return (
    <article className={`${fondo} border-3 border-negro shadow-bruta p-5`}>
      <p className="font-mono text-xs uppercase tracking-tight opacity-70">{etiqueta}</p>
      <p className="font-display font-bold text-4xl lg:text-5xl mt-1 tracking-tighter">{valor}</p>
    </article>
  )
}

function FilaTurnoProximo({ turno }) {
  return (
    <li className="card !p-4 flex items-center gap-4">
      <div className="font-mono text-xs uppercase bg-negro text-white px-3 py-2 shrink-0">
        {formatearHora(new Date(turno.fechaHora))}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display font-bold uppercase tracking-tight truncate">
          {turno.cliente?.nombre || '—'} · {turno.servicio?.nombre || '—'}
        </p>
        <p className="font-mono text-xs text-negro/60">
          con {turno.empleado?.nombre || '—'}
        </p>
      </div>
      <span className={`badge ${turno.estado === 'confirmado' ? 'badge-confirmado' : 'badge-pendiente'} shrink-0`}>
        {turno.estado}
      </span>
    </li>
  )
}
