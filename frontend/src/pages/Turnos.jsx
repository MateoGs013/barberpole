// Página de Turnos — Consola de Agenda & Gestión Operativa Zen (B&W)
import { useState, useEffect } from 'react'
import {
  listarTurnosAPI,
  crearTurnoAPI,
  actualizarTurnoAPI,
  eliminarTurnoAPI,
  cancelarTurnoAPI,
} from '../api/turnos.api.js'
import { listarClientesAPI } from '../api/clientes.api.js'
import { listarEmpleadosAPI, obtenerDisponibilidadAPI } from '../api/empleados.api.js'
import { listarServiciosAPI } from '../api/servicios.api.js'
import { useFetch } from '../hooks/useFetch.js'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../hooks/useToast.js'
import { Modal } from '../components/Modal.jsx'
import { ModalConfirmacion } from '../components/ModalConfirmacion.jsx'
import { CustomSelect } from '../components/CustomSelect.jsx'
import { MatrixCalendar } from '../components/MatrixCalendar.jsx'
import { TactileSlot } from '../components/TactileSlot.jsx'
import { ThemeToggle } from '../components/ThemeToggle.jsx'
import { generarGoogleCalendarUrl } from '../utils/calendar.js'
import { Plus, Calendar, Clock, User, Filter, ArrowRight } from 'lucide-react'

// Helpers tipográficos de fecha
const formatearDia = (fecha) =>
  new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
  }).format(fecha)

const formatearHora = (fecha) =>
  new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(fecha)

const agruparPorDia = (turnos) => {
  const mapa = new Map()
  for (const t of turnos) {
    const d = new Date(t.fechaHora)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (!mapa.has(key)) mapa.set(key, [])
    mapa.get(key).push(t)
  }
  return Array.from(mapa.entries()).sort(([a], [b]) => a.localeCompare(b))
}

const CLASES_BADGE_ESTADO = {
  pendiente: 'badge-pendiente',
  confirmado: 'badge-confirmado',
  completado: 'badge-completado',
  cancelado: 'badge-cancelado',
}

export default function Turnos() {
  const { usuario } = useAuth()
  const toast = useToast()
  const esCliente = usuario?.rol === 'cliente'
  const puedeGestionar = usuario?.rol === 'admin' || usuario?.rol === 'empleado' || usuario?.rol === 'superadmin'

  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroEmpleado, setFiltroEmpleado] = useState('')
  const [filtroDesde, setFiltroDesde] = useState('')
  const [filtroHasta, setFiltroHasta] = useState('')

  const params = {}
  if (filtroEstado) params.estado = filtroEstado
  if (filtroEmpleado) params.empleadoId = filtroEmpleado
  if (filtroDesde) params.desde = `${filtroDesde}T00:00:00`
  if (filtroHasta) params.hasta = `${filtroHasta}T23:59:59`

  const { datos: turnos, cargando, error, recargar } = useFetch(
    () => listarTurnosAPI(params),
    [filtroEstado, filtroEmpleado, filtroDesde, filtroHasta]
  )

  const limpiarFiltros = () => {
    setFiltroEstado('')
    setFiltroEmpleado('')
    setFiltroDesde('')
    setFiltroHasta('')
  }

  const hayFiltros = !!(filtroEstado || filtroEmpleado || filtroDesde || filtroHasta)

  const { datos: empleadosFiltro } = useFetch(
    () => (puedeGestionar ? listarEmpleadosAPI() : Promise.resolve([])),
    [puedeGestionar]
  )

  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [pidiendoEliminar, setPidiendoEliminar] = useState(null)
  const [pidiendoCancelar, setPidiendoCancelar] = useState(null)

  const abrirNuevo = () => {
    setEditando(null)
    setModalAbierto(true)
  }
  const abrirEditar = (turno) => {
    setEditando(turno)
    setModalAbierto(true)
  }
  const cerrarModal = () => {
    setModalAbierto(false)
    setEditando(null)
  }

  const confirmarCancelar = async () => {
    const turno = pidiendoCancelar
    setPidiendoCancelar(null)
    if (!turno) return
    try {
      await cancelarTurnoAPI(turno._id)
      recargar()
      toast.exito('Turno cancelado correctamente')
    } catch (e) {
      toast.error(e.response?.data?.error || 'No se pudo cancelar el turno')
    }
  }

  const cambiarEstado = async (turno, nuevoEstado) => {
    try {
      await actualizarTurnoAPI(turno._id, { estado: nuevoEstado })
      recargar()
      toast.exito(`Turno marcado como ${nuevoEstado}`)
    } catch (e) {
      toast.error(e.response?.data?.error || 'No se pudo cambiar el estado')
    }
  }

  const confirmarEliminar = async () => {
    const turno = pidiendoEliminar
    try {
      await eliminarTurnoAPI(turno._id)
      setPidiendoEliminar(null)
      recargar()
      toast.exito('Turno eliminado')
    } catch (e) {
      setPidiendoEliminar(null)
      toast.error(e.response?.data?.error || 'No se pudo eliminar')
    }
  }

  const grupos = turnos ? agruparPorDia(turnos) : []

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header Zen */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-500 mb-1">
            — {esCliente ? 'PANEL DE CLIENTE' : 'AGENDA & OPERACIONES'}
          </p>
          <h1 className="text-3xl sm:text-5xl font-mono font-medium tracking-tight text-white uppercase leading-none">
            {esCliente ? 'MIS TURNOS.' : 'TURNOS.'}
          </h1>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <ThemeToggle />
          {puedeGestionar && (
            <>
              <a
                href="https://calendar.google.com/calendar/u/0/r"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secundario text-xs font-mono uppercase"
                title="Abrir Google Calendar en una pestaña nueva"
              >
                Calendar ↗
              </a>
              <button
                onClick={abrirNuevo}
                className="btn btn-primario flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo turno</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Barra de Filtros Tabular Hairline */}
      <div className="p-4 border border-white/10 space-y-4">
        <div className="flex items-center justify-between font-mono text-xs text-neutral-400 uppercase tracking-wider">
          <span className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros de Agenda</span>
          </span>
          {hayFiltros && (
            <button
              type="button"
              onClick={limpiarFiltros}
              className="text-neutral-400 hover:text-white underline cursor-pointer"
            >
              Limpiar filtros [✕]
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="label">Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="input !py-2 text-xs"
            >
              <option value="">— Todos los estados —</option>
              <option value="pendiente">Pendiente</option>
              <option value="confirmado">Confirmado</option>
              <option value="completado">Completado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          {puedeGestionar && (
            <div>
              <label className="label">Especialista / Profesional</label>
              <select
                value={filtroEmpleado}
                onChange={(e) => setFiltroEmpleado(e.target.value)}
                className="input !py-2 text-xs"
              >
                <option value="">— Todos los profesionales —</option>
                {empleadosFiltro?.map((e) => (
                  <option key={e._id} value={e._id}>
                    {e.nombre} — {e.especialidad}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="label">Fecha Desde</label>
            <input
              type="date"
              className="input !py-2 text-xs"
              value={filtroDesde}
              onChange={(e) => setFiltroDesde(e.target.value)}
              max={filtroHasta || undefined}
            />
          </div>

          <div>
            <label className="label">Fecha Hasta</label>
            <input
              type="date"
              className="input !py-2 text-xs"
              value={filtroHasta}
              onChange={(e) => setFiltroHasta(e.target.value)}
              min={filtroDesde || undefined}
            />
          </div>
        </div>
      </div>

      {/* Estados de Carga o Error */}
      {cargando && (
        <div className="py-12 text-center font-mono text-xs uppercase text-neutral-500 tracking-widest animate-pulse">
          Sincronizando agenda con Slot Engine...
        </div>
      )}

      {error && (
        <div className="p-4 border border-rose-500/30 text-rose-300 font-mono text-xs uppercase">
          Error al cargar los turnos de la agenda
        </div>
      )}

      {turnos && turnos.length === 0 && !cargando && (
        <div className="p-12 text-center border border-white/10 font-mono text-xs uppercase text-neutral-400">
          No hay turnos registrados {hayFiltros ? 'con los filtros seleccionados' : 'en la agenda'}
        </div>
      )}

      {/* Listado de Turnos Agrupado Editorialmente por Día */}
      <div className="space-y-12">
        {grupos.map(([clave, lista]) => {
          const fechaDelGrupo = new Date(lista[0].fechaHora)
          return (
            <section key={clave} className="space-y-3">
              <header className="flex items-baseline justify-between border-b border-white/15 pb-2">
                <h2 className="font-mono text-base sm:text-lg font-medium uppercase tracking-wider text-white">
                  {formatearDia(fechaDelGrupo)}
                </h2>
                <span className="font-mono text-xs uppercase text-neutral-500">
                  {lista.length} {lista.length === 1 ? 'turno' : 'turnos'}
                </span>
              </header>

              <ul className="divide-y divide-white/10 border-b border-white/10">
                {lista.map((turno) => (
                  <FilaTurnoEditorial
                    key={turno._id}
                    turno={turno}
                    puedeGestionar={puedeGestionar}
                    onEditar={() => abrirEditar(turno)}
                    onCambiarEstado={(estado) => cambiarEstado(turno, estado)}
                    onCancelarCliente={() => setPidiendoCancelar(turno)}
                    onEliminar={() => setPidiendoEliminar(turno)}
                  />
                ))}
              </ul>
            </section>
          )
        })}
      </div>

      {/* Modal Unificado con Slot Engine para Crear / Editar */}
      {puedeGestionar && (
        <Modal
          abierto={modalAbierto}
          onCerrar={cerrarModal}
          titulo={editando ? 'Editar Turno' : 'Nuevo Turno con Slot Engine'}
          ancho="max-w-2xl"
        >
          <FormTurnoUnificado
            inicial={editando}
            onCancelar={cerrarModal}
            onGuardado={() => {
              const fueEdicion = !!editando
              cerrarModal()
              recargar()
              toast.exito(fueEdicion ? 'Turno actualizado' : 'Turno creado con éxito')
            }}
          />
        </Modal>
      )}

      {/* Modal Confirmación Cancelar */}
      <ModalConfirmacion
        abierto={!!pidiendoCancelar}
        onCerrar={() => setPidiendoCancelar(null)}
        onConfirmar={confirmarCancelar}
        titulo="Cancelar reserva"
        mensaje="¿Seguro que querés cancelar tu turno? Las cancelaciones deben realizarse con al menos 2 horas de anticipación."
        textoConfirmar="Cancelar turno"
        peligro
      />

      {/* Modal Confirmación Eliminar */}
      <ModalConfirmacion
        abierto={!!pidiendoEliminar}
        onCerrar={() => setPidiendoEliminar(null)}
        onConfirmar={confirmarEliminar}
        titulo="Eliminar turno definitivamente"
        mensaje="¿Seguro que querés eliminar este turno del sistema? Esta acción no se puede deshacer."
        textoConfirmar="Eliminar"
        peligro
      />
    </div>
  )
}

// ─── Fila Editorial de Turno ───────────────────────────────────────────────

function FilaTurnoEditorial({
  turno,
  puedeGestionar,
  onEditar,
  onCambiarEstado,
  onCancelarCliente,
  onEliminar,
}) {
  const fecha = new Date(turno.fechaHora)
  const claseBadge = CLASES_BADGE_ESTADO[turno.estado] || 'badge-pendiente'

  return (
    <li className="py-4 px-2 hover:bg-white/[0.02] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
      {/* Columna Hora & Duración */}
      <div className="flex sm:flex-col items-baseline sm:items-start gap-2 sm:gap-0 sm:min-w-[100px] shrink-0">
        <span className="font-mono text-2xl sm:text-3xl font-medium tracking-tight text-white leading-none">
          {formatearHora(fecha)}
        </span>
        <span className="text-[10px] uppercase text-neutral-500 tracking-wider mt-1">
          {turno.duracionMinutos || turno.servicio?.duracionMinutos || 30} MIN
        </span>
      </div>

      {/* Columna Central: Detalles del Turno */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`badge ${claseBadge}`}>{turno.estado}</span>
          {turno.precioCobrado != null && (
            <span className="font-mono text-xs text-white font-medium">
              ${turno.precioCobrado.toLocaleString('es-AR')}
            </span>
          )}
          {turno.googleCalendarEventId && (
            <span className="text-[10px] text-emerald-400 font-mono tracking-wider">
              ● SYNC CALENDAR
            </span>
          )}
        </div>

        <h3 className="font-mono text-base uppercase text-white font-medium truncate">
          {turno.cliente?.nombre || '—'}
        </h3>

        <p className="text-neutral-400 text-xs">
          <span className="text-white">{turno.servicio?.nombre || 'Servicio'}</span>
          <span className="text-neutral-600"> — </span>
          <span>{turno.empleado?.nombre || 'Profesional'}</span>
        </p>

        {turno.notas && (
          <p className="text-neutral-500 text-[11px] italic truncate">
            Nota: {turno.notas}
          </p>
        )}
      </div>

      {/* Columna Acciones */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {puedeGestionar ? (
          <>
            {turno.estado === 'pendiente' && (
              <button
                onClick={() => onCambiarEstado('confirmado')}
                className="btn btn-primario !px-3 !py-1.5 text-xs font-mono uppercase"
              >
                Confirmar
              </button>
            )}
            {turno.estado === 'confirmado' && (
              <button
                onClick={() => onCambiarEstado('completado')}
                className="btn btn-secundario !px-3 !py-1.5 text-xs font-mono uppercase text-emerald-300 border-emerald-500/30"
              >
                Completar
              </button>
            )}
            <button
              onClick={onEditar}
              className="btn btn-secundario !px-3 !py-1.5 text-xs font-mono uppercase"
            >
              Editar
            </button>
            {turno.estado !== 'cancelado' && (
              <button
                onClick={() => onCambiarEstado('cancelado')}
                className="btn btn-peligro !px-3 !py-1.5 text-xs font-mono uppercase"
              >
                Cancelar
              </button>
            )}
            <button
              onClick={onEliminar}
              className="btn btn-peligro !px-3 !py-1.5 text-xs font-mono uppercase"
              title="Eliminar definitivamente"
            >
              ✕
            </button>
          </>
        ) : (
          (turno.estado === 'pendiente' || turno.estado === 'confirmado') && (
            <>
              <a
                href={generarGoogleCalendarUrl({
                  titulo: `${turno.servicio?.nombre || 'Turno'} — BarberPole`,
                  descripcion: `Turno confirmado con ${turno.empleado?.nombre}.\nServicio: ${turno.servicio?.nombre}`,
                  ubicacion: 'Sede Oficial',
                  fechaHora: turno.fechaHora,
                  duracionMinutos: turno.duracionMinutos || 30,
                })}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secundario !px-3 !py-1.5 text-xs font-mono uppercase"
                title="Sincronizar automáticamente con Google Calendar"
              >
                + Calendar ↗
              </a>
              <button
                onClick={onCancelarCliente}
                className="btn btn-peligro !px-3 !py-1.5 text-xs font-mono uppercase"
                title="Cancelar con al menos 2 horas de anticipación"
              >
                Cancelar reserva
              </button>
            </>
          )
        )}
      </div>
    </li>
  )
}

// ─── Formulario Unificado con Slot Engine ──────────────────────────────────

function FormTurnoUnificado({ inicial, onCancelar, onGuardado }) {
  const esEdicion = !!inicial

  const { datos: clientes } = useFetch(() => listarClientesAPI(), [])
  const { datos: empleados } = useFetch(() => listarEmpleadosAPI({ activos: true }), [])
  const { datos: servicios } = useFetch(() => listarServiciosAPI({ activos: true }), [])

  const [cliente, setCliente] = useState(inicial?.cliente?._id || '')
  const [empleado, setEmpleado] = useState(inicial?.empleado?._id || '')
  const [servicio, setServicio] = useState(inicial?.servicio?._id || '')
  const [estado, setEstado] = useState(inicial?.estado || 'confirmado')
  const [notas, setNotas] = useState(inicial?.notas || '')

  // Slot Engine en vivo
  const fechaInicialCalculada = inicial?.fechaHora ? inicial.fechaHora.slice(0, 10) : ''
  const horaInicialCalculada = inicial?.fechaHora
    ? new Date(inicial.fechaHora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })
    : ''

  const [fecha, setFecha] = useState(fechaInicialCalculada)
  const [hora, setHora] = useState(horaInicialCalculada)
  const [slotSeleccionado, setSlotSeleccionado] = useState(null)
  const [slots, setSlots] = useState([])
  const [cargandoSlots, setCargandoSlots] = useState(false)
  const [reagendarActivo, setReagendarActivo] = useState(!esEdicion)

  const [errores, setErrores] = useState({})
  const [errorGlobal, setErrorGlobal] = useState('')
  const [enviando, setEnviando] = useState(false)

  // Consulta al Slot Engine cuando cambian fecha, empleado o servicio
  useEffect(() => {
    if (!empleado || !fecha || !servicio || !reagendarActivo) {
      setSlots([])
      return
    }

    let cancelado = false
    const cargarDisponibilidad = async () => {
      setCargandoSlots(true)
      try {
        const res = await obtenerDisponibilidadAPI(empleado, {
          fecha,
          servicioId: servicio,
        })
        if (!cancelado) {
          setSlots(res.slots || [])
        }
      } catch (err) {
        if (!cancelado) {
          setSlots([])
        }
      } finally {
        if (!cancelado) setCargandoSlots(false)
      }
    }

    cargarDisponibilidad()
    return () => {
      cancelado = true
    }
  }, [empleado, fecha, servicio, reagendarActivo])

  const validar = () => {
    const errs = {}
    if (!cliente) errs.cliente = 'Elegí un cliente'
    if (!empleado) errs.empleado = 'Elegí un profesional'
    if (!servicio) errs.servicio = 'Elegí un servicio'
    if (reagendarActivo && (!fecha || !hora)) {
      errs.horario = 'Seleccioná un día y un horario disponible en el Slot Engine'
    }
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
      const payload = {
        cliente,
        empleado,
        servicio,
        estado,
        notas: notas.trim(),
      }

      if (reagendarActivo) {
        const fechaHoraIso = slotSeleccionado?.fechaHora || new Date(`${fecha}T${hora}:00`).toISOString()
        payload.fechaHora = fechaHoraIso
      }

      if (esEdicion) {
        await actualizarTurnoAPI(inicial._id, payload)
      } else {
        await crearTurnoAPI(payload)
      }
      onGuardado()
    } catch (e) {
      setErrorGlobal(e.response?.data?.error || 'No se pudo guardar el turno')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 font-mono text-xs">
      {errorGlobal && (
        <div className="p-3 border border-rose-500/30 text-rose-300 uppercase">
          {errorGlobal}
        </div>
      )}

      {/* Sección 1: Sujetos y Servicio */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="label" htmlFor="cliente">Cliente *</label>
          <select
            id="cliente"
            className="input !py-2 text-xs"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
          >
            <option value="">— Elegir cliente —</option>
            {clientes?.map((c) => (
              <option key={c._id} value={c._id}>
                {c.nombre} {c.email ? `(${c.email})` : ''}
              </option>
            ))}
          </select>
          {errores.cliente && <p className="text-rose-400 mt-1 uppercase text-[10px]">{errores.cliente}</p>}
        </div>

        <div>
          <label className="label" htmlFor="servicio">Servicio *</label>
          <select
            id="servicio"
            className="input !py-2 text-xs"
            value={servicio}
            onChange={(e) => {
              setServicio(e.target.value)
              setSlotSeleccionado(null)
              setHora('')
            }}
          >
            <option value="">— Elegir servicio —</option>
            {servicios?.map((s) => (
              <option key={s._id} value={s._id}>
                {s.nombre} · {s.duracionMinutos}m · ${s.precio}
              </option>
            ))}
          </select>
          {errores.servicio && <p className="text-rose-400 mt-1 uppercase text-[10px]">{errores.servicio}</p>}
        </div>

        <div>
          <label className="label" htmlFor="empleado">Profesional *</label>
          <select
            id="empleado"
            className="input !py-2 text-xs"
            value={empleado}
            onChange={(e) => {
              setEmpleado(e.target.value)
              setSlotSeleccionado(null)
              setHora('')
            }}
          >
            <option value="">— Elegir profesional —</option>
            {empleados?.map((e) => (
              <option key={e._id} value={e._id}>
                {e.nombre} — {e.especialidad}
              </option>
            ))}
          </select>
          {errores.empleado && <p className="text-rose-400 mt-1 uppercase text-[10px]">{errores.empleado}</p>}
        </div>
      </div>

      {/* Sección 2: Slot Engine Unificado */}
      <div className="border border-white/10 p-4 space-y-4 bg-white/[0.01]">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <span className="uppercase text-neutral-400 tracking-wider">
            DISPONIBILIDAD & HORARIOS — SLOT ENGINE
          </span>
          {esEdicion && (
            <button
              type="button"
              onClick={() => setReagendarActivo(!reagendarActivo)}
              className="text-neutral-300 hover:text-white uppercase underline cursor-pointer"
            >
              {reagendarActivo ? 'Mantener Horario Actual' : 'Modificar Horario'}
            </button>
          )}
        </div>

        {!reagendarActivo ? (
          <div className="p-3 bg-white/5 flex items-center justify-between">
            <div>
              <span className="text-neutral-500 uppercase">HORARIO AGENDADO: </span>
              <strong className="text-white">{fecha} a las {hora} HS</strong>
            </div>
            <span className="badge badge-confirmado">SIN MODIFICACIONES</span>
          </div>
        ) : (
          <div className="space-y-4">
            {(!empleado || !servicio) ? (
              <p className="text-neutral-500 italic py-4 text-center">
                ← Seleccioná un servicio y un profesional para consultar la matriz de horarios en vivo
              </p>
            ) : (
              <>
                <div>
                  <label className="label">1. Seleccioná el Día</label>
                  <MatrixCalendar
                    fechaSeleccionada={fecha}
                    onSeleccionarFecha={(f) => {
                      setFecha(f)
                      setHora('')
                      setSlotSeleccionado(null)
                    }}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="label !mb-0">2. Horarios Calculados</label>
                    {hora && (
                      <span className="text-white uppercase tracking-wider font-medium">
                        Slot: {hora} HS
                      </span>
                    )}
                  </div>

                  {cargandoSlots ? (
                    <p className="text-neutral-500 animate-pulse py-4 text-center uppercase tracking-wider">
                      Consultando disponibilidad y bloqueos de Google Calendar...
                    </p>
                  ) : slots.length === 0 ? (
                    <p className="text-neutral-500 py-4 text-center">
                      {fecha ? 'No hay turnos disponibles para este día.' : 'Seleccioná un día en el calendario.'}
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1">
                      {slots.map((s, idx) => (
                        <TactileSlot
                          key={idx}
                          hora={s.hora}
                          disponible={s.disponible}
                          seleccionado={hora === s.hora}
                          onClick={() => {
                            setHora(s.hora)
                            setSlotSeleccionado(s)
                          }}
                          motivo={s.motivo}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
        {errores.horario && <p className="text-rose-400 mt-1 uppercase text-[10px]">{errores.horario}</p>}
      </div>

      {/* Sección 3: Estado y Notas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="estado">Estado del Turno</label>
          <select
            id="estado"
            className="input !py-2 text-xs"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
          >
            <option value="confirmado">Confirmado</option>
            <option value="pendiente">Pendiente</option>
            <option value="completado">Completado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        <div>
          <label className="label" htmlFor="notas">Notas Internas</label>
          <input
            id="notas"
            type="text"
            className="input !py-2 text-xs"
            placeholder="Ej. Prefiere tijera / cliente habitual"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
          />
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex gap-3 pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={onCancelar}
          className="btn btn-secundario flex-1"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={enviando}
          className="btn btn-primario flex-1 flex items-center justify-center gap-2"
        >
          <span>{enviando ? 'Guardando...' : esEdicion ? 'Actualizar Turno' : 'Crear Turno'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </form>
  )
}
