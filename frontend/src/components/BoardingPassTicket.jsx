import { motion } from 'framer-motion'
import { ArrowRight, Calendar, Download, MessageSquare } from 'lucide-react'
import {
  generarGoogleCalendarUrl,
  descargarIcs,
  generarWhatsAppUrl,
} from '../utils/calendar.js'

export function BoardingPassTicket({
  negocioNombre = 'Salón BarberPole',
  negocioDireccion = 'Sede Oficial',
  servicio,
  empleado,
  fecha,
  hora,
  slot,
  codigoTurno = 'BP-2026',
  onConfirmar,
  enviando = false,
  deshabilitado = false,
  confirmado = false,
  fechaHoraIso = null,
  onVerMisTurnos,
}) {
  const isoCalculada =
    fechaHoraIso || (fecha && hora ? `${fecha}T${hora}:00` : null)

  const calendarParams = {
    titulo: `${servicio?.nombre || 'Turno'} — ${negocioNombre}`,
    descripcion: `Reserva confirmada con ${empleado?.nombre || 'Profesional'} en ${negocioNombre}.\nServicio: ${servicio?.nombre}\nPrecio: $${servicio?.precio || 0}\nCódigo de confirmación: ${codigoTurno}\nDirección: ${negocioDireccion}`,
    ubicacion: negocioDireccion,
    fechaHora: isoCalculada,
    duracionMinutos: servicio?.duracionMinutos || 30,
  }

  const googleUrl = isoCalculada ? generarGoogleCalendarUrl(calendarParams) : '#'
  const waUrl = generarWhatsAppUrl({
    servicio: servicio?.nombre,
    barbero: empleado?.nombre,
    fecha,
    hora,
    salon: negocioNombre,
    direccion: negocioDireccion,
    codigo: codigoTurno,
  })

  return (
    <div className="relative w-full max-w-xl mx-auto select-none">
      <div className="bg-black border border-white/10 rounded-none overflow-hidden">
        {/* Cabecera del ticket B&W */}
        <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-3">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                confirmado ? 'bg-emerald-400' : 'bg-white'
              }`}
            />
            <span className="font-semibold uppercase tracking-widest text-white">
              {negocioNombre}
            </span>
          </div>

          <div className="flex items-center gap-2 text-neutral-400">
            <span className="text-[10px] uppercase tracking-widest">
              {confirmado ? 'CONFIRMADO —' : 'PASE —'}
            </span>
            <span className="text-white font-mono tracking-wider">{codigoTurno}</span>
          </div>
        </div>

        {/* Sección de Datos Tabulares B&W */}
        <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-white/10 text-xs">
          <div className="p-6 space-y-5">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 mb-1">
                01 — SERVICIO
              </p>
              <h4 className="font-mono font-medium text-lg text-white tracking-tight">
                {servicio?.nombre || '— Sin definir —'}
              </h4>
              <div className="flex items-center gap-2 font-mono text-[11px] text-neutral-400 mt-1">
                <span>{servicio?.duracionMinutos ? `${servicio.duracionMinutos} MIN` : '30 MIN'}</span>
                <span>·</span>
                <span className="text-white font-semibold">
                  {servicio?.precio ? `$${servicio.precio.toLocaleString('es-AR')}` : '$0'}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 mb-1">
                02 — PROFESIONAL
              </p>
              <p className="font-mono font-medium text-sm text-white">
                {empleado?.nombre || 'Especialista asignado'}
              </p>
              <p className="font-mono text-[10px] text-neutral-500 mt-0.5 uppercase">
                {empleado?.especialidad || 'Estilista'}
              </p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 mb-1">
                03 — FECHA
              </p>
              <p className="font-mono font-medium text-lg text-white tracking-tight">
                {fecha || 'Fecha pendiente'}
              </p>
              <p className="font-mono text-[11px] text-neutral-400 mt-0.5">
                {negocioDireccion}
              </p>
            </div>

            <div className="pt-4 border-t border-white/10">
              <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 mb-1">
                04 — HORA
              </p>
              <div className="flex items-baseline gap-2">
                <span className="font-mono font-medium text-2xl text-white tracking-tight">
                  {hora || '--:--'}
                </span>
                <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">
                  {slot?.horaFin ? `hasta ${slot.horaFin} hs` : 'hs'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Línea de Perforación */}
        <div className="border-t border-dashed border-white/20 w-full" />

        {/* Pie: Confirmación o Automatizaciones Post-Reserva */}
        {!confirmado ? (
          <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
              CONFIRMACIÓN INMEDIATA — SIN COMISIONES
            </div>

            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={onConfirmar}
              disabled={deshabilitado || enviando}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-none font-mono text-xs font-semibold uppercase tracking-wider bg-white text-black hover:bg-neutral-200 transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
            >
              {enviando ? (
                <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Confirmar Turno</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </motion.button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between font-mono text-xs text-neutral-400 uppercase tracking-widest border-b border-white/10 pb-3">
              <span>SINCRONIZACIÓN AUTOMÁTICA</span>
              <span className="text-emerald-400">RESERVA CONFIRMADA</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <a
                href={googleUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primario w-full text-center py-3.5"
                title="Abrir y guardar en Google Calendar con recordatorio programado"
              >
                <Calendar className="w-4 h-4" />
                <span>Google Calendar ↗</span>
              </a>

              <button
                type="button"
                onClick={() => descargarIcs(calendarParams)}
                className="btn btn-secundario w-full py-3.5"
                title="Descargar invitación .ics para Apple Calendar o Microsoft Outlook"
              >
                <Download className="w-4 h-4" />
                <span>Descargar .ICS</span>
              </button>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs">
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-neutral-300 hover:text-white uppercase tracking-wider transition-colors"
                title="Enviar confirmación automática a WhatsApp"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Avisar por WhatsApp ↗</span>
              </a>

              {onVerMisTurnos && (
                <button
                  type="button"
                  onClick={onVerMisTurnos}
                  className="text-neutral-400 hover:text-white uppercase tracking-wider underline cursor-pointer"
                >
                  Ver en Mis Turnos →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
