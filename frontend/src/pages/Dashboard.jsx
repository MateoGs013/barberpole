import { generarGoogleCalendarUrl } from '../utils/calendar.js'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useFetch } from '../hooks/useFetch.js'
import { listarTurnosAPI } from '../api/turnos.api.js'
import { useAuth } from '../hooks/useAuth.js'
import { SpotlightCard } from '../components/SpotlightCard.jsx'
import { NumberTicker } from '../components/NumberTicker.jsx'
import { ShinyText } from '../components/ShinyText.jsx'
import {
  Calendar,
  Clock,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  User,
  Sparkles,
} from 'lucide-react'

const formatearHora = (fecha) =>
  new Intl.DateTimeFormat('es-AR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(fecha)

const CLASES_BADGE_ESTADO = {
  pendiente: 'badge-pendiente',
  confirmado: 'badge-confirmado',
  completado: 'badge-completado',
  cancelado: 'badge-cancelado',
}

const proximosTurnos = (turnos, cantidad = 5) => {
  if (!turnos) return []
  const ahora = Date.now()
  return [...turnos]
    .filter((t) => new Date(t.fechaHora).getTime() >= ahora)
    .sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora))
    .slice(0, cantidad)
}

const ingresosDelMes = (turnos) => {
  if (!turnos) return 0
  const ahora = new Date()
  const desde = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
  return turnos
    .filter((t) => t.estado === 'completado' && new Date(t.fechaHora) >= desde)
    .reduce(
      (acc, t) =>
        acc + (t.precioCobrado != null ? t.precioCobrado : (t.servicio?.precio || 0)),
      0
    )
}

export default function Dashboard() {
  const { usuario } = useAuth()
  const { datos: turnos, cargando } = useFetch(() => listarTurnosAPI())
  const esCliente = usuario?.rol === 'cliente'

  const total = turnos?.length || 0
  const pendientes = turnos?.filter((t) => t.estado === 'pendiente').length || 0
  const confirmados = turnos?.filter((t) => t.estado === 'confirmado').length || 0
  const completados = turnos?.filter((t) => t.estado === 'completado').length || 0
  const ingresos = ingresosDelMes(turnos)
  const proximos = proximosTurnos(turnos)

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Telemetría */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            <span className="font-mono text-xs uppercase tracking-widest text-zinc-400">
              Sesión activa · {usuario?.rol}
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-white tracking-tight leading-none uppercase">
            {esCliente ? 'Tu Espacio.' : 'Consola de Control.'}
          </h1>
        </div>

        {esCliente ? (
          <Link to="/reservar" className="btn btn-primario self-start sm:self-auto">
            <PlusCircle className="w-4 h-4" />
            <span>Reservar turno</span>
          </Link>
        ) : usuario?.rol === 'superadmin' ? (
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <Link to="/superadmin" className="btn btn-primario text-xs font-mono uppercase flex items-center gap-2">
              <span>Panel Superadmin →</span>
            </Link>
            <a
              href="https://calendar.google.com/calendar/u/0/r"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secundario text-xs font-mono uppercase flex items-center gap-2"
            >
              <span>Calendar ↗</span>
            </a>
          </div>
        ) : (
          <a
            href="https://calendar.google.com/calendar/u/0/r"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secundario self-start sm:self-auto text-xs font-mono uppercase flex items-center gap-2"
          >
            <span>Google Calendar</span>
            <span className="text-zinc-500">↗</span>
          </a>
        )}
      </div>

      {/* Banner de Superadmin */}
      {usuario?.rol === 'superadmin' && (
        <div className="p-4 border border-emerald-500/30 bg-emerald-500/[0.04] font-mono text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold uppercase tracking-wider">MODO SUPERADMINISTRADOR</span>
            <span className="text-neutral-400">— Plataforma central y directorio de tenants.</span>
          </div>
          <Link
            to="/superadmin"
            className="px-3 py-1.5 border border-emerald-400/40 text-emerald-300 hover:bg-emerald-400 hover:text-black uppercase tracking-wider transition-colors shrink-0"
          >
            Ver Espacios Registrados →
          </Link>
        </div>
      )}

      {/* Bento Grid de KPIs con NumberTickers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <SpotlightCard className="p-5">
          <div className="flex items-center justify-between text-zinc-500 mb-3">
            <span className="font-mono text-xs uppercase tracking-wider">
              {esCliente ? 'Mis turnos' : 'Turnos totales'}
            </span>
            <Calendar className="w-4 h-4 text-zinc-400" />
          </div>
          <p className="font-mono font-bold text-3xl lg:text-4xl text-white tracking-tight">
            <NumberTicker value={total} />
          </p>
        </SpotlightCard>

        <SpotlightCard className="p-5">
          <div className="flex items-center justify-between text-zinc-500 mb-3">
            <span className="font-mono text-xs uppercase tracking-wider">Pendientes</span>
            <AlertCircle className="w-4 h-4 text-zinc-400" />
          </div>
          <p className="font-mono font-bold text-3xl lg:text-4xl text-white tracking-tight">
            <NumberTicker value={pendientes} />
          </p>
        </SpotlightCard>

        <SpotlightCard className="p-5">
          <div className="flex items-center justify-between text-zinc-500 mb-3">
            <span className="font-mono text-xs uppercase tracking-wider">Confirmados</span>
            <CheckCircle2 className="w-4 h-4 text-zinc-400" />
          </div>
          <p className="font-mono font-bold text-3xl lg:text-4xl text-white tracking-tight">
            <NumberTicker value={confirmados} />
          </p>
        </SpotlightCard>

        <SpotlightCard className="p-5">
          <div className="flex items-center justify-between text-zinc-500 mb-3">
            <span className="font-mono text-xs uppercase tracking-wider">
              {esCliente ? 'Completados' : 'Facturación mes'}
            </span>
            <TrendingUp className="w-4 h-4 text-zinc-400" />
          </div>
          <p className="font-mono font-bold text-2xl lg:text-3xl text-white tracking-tight">
            {esCliente ? (
              <NumberTicker value={completados} />
            ) : (
              <NumberTicker value={ingresos} prefix="$" />
            )}
          </p>
        </SpotlightCard>
      </div>

      {/* Próximos turnos */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-400" />
            <h2 className="font-display font-semibold text-xl text-white tracking-tight">
              Próximos turnos
            </h2>
          </div>
          <Link
            to="/turnos"
            className="font-mono text-xs uppercase tracking-wider text-zinc-400 hover:text-white transition-colors inline-flex items-center gap-1"
          >
            <span>Ver agenda completa</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {cargando ? (
          <div className="p-12 text-center font-mono text-xs text-zinc-500 uppercase tracking-widest animate-pulse">
            Sincronizando telemetría...
          </div>
        ) : proximos.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-white/10 bg-transparent">
            <Calendar className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
            <p className="font-mono text-xs uppercase text-zinc-400 tracking-wider">
              No hay turnos futuros programados
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/10 border-y border-white/10">
            {proximos.map((t) => (
              <div
                key={t._id}
                className="py-3.5 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                  <div className="truncate">
                    <p className="font-sans font-medium text-sm text-white truncate">
                      {t.servicio?.nombre || 'Servicio'}
                    </p>
                    <div className="flex items-center gap-2 font-mono text-xs text-zinc-500 mt-0.5">
                      <span>{t.empleado?.nombre}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-zinc-400">
                        <User className="w-3 h-3" />
                        {t.cliente?.nombre || 'Cliente'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                  <span className="font-mono text-xs text-zinc-400">
                    {formatearHora(new Date(t.fechaHora))}
                  </span>
                  <span className={`badge ${CLASES_BADGE_ESTADO[t.estado] || 'badge-confirmado'}`}>
                    {t.estado}
                  </span>
                  {t.estado !== 'cancelado' && (
                    <a
                      href={generarGoogleCalendarUrl({
                        titulo: `${t.servicio?.nombre || 'Turno'} — BarberPole`,
                        descripcion: `Turno agendado.\nServicio: ${t.servicio?.nombre || '—'}\nProfesional: ${t.empleado?.nombre || '—'}\nCliente: ${t.cliente?.nombre || '—'}`,
                        ubicacion: 'Sede Oficial',
                        fechaHora: t.fechaHora,
                        duracionMinutos: t.duracionMinutos || t.servicio?.duracionMinutos || 30,
                      })}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secundario !px-2.5 !py-1 text-xs font-mono uppercase inline-flex items-center gap-1.5"
                      title="Guardar este turno en Google Calendar"
                    >
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                      <span>+ Calendar ↗</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
