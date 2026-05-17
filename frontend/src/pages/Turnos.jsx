// Página de Turnos.
// - Admin/empleado: pueden crear, editar, cambiar estado y eliminar.
// - Cliente: ve solo sus turnos (el backend filtra automáticamente por su
//   perfil Cliente vinculado), sin acciones.
// Layout: agrupado por día, con encabezado tipográfico grande por sección.

import { useState } from 'react'
import {
  listarTurnosAPI,
  crearTurnoAPI,
  actualizarTurnoAPI,
  eliminarTurnoAPI,
} from '../api/turnos.api.js'
import { listarClientesAPI } from '../api/clientes.api.js'
import { listarEmpleadosAPI } from '../api/empleados.api.js'
import { listarServiciosAPI } from '../api/servicios.api.js'
import { useFetch } from '../hooks/useFetch.js'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../hooks/useToast.js'
import { Modal } from '../components/Modal.jsx'
import { ModalConfirmacion } from '../components/ModalConfirmacion.jsx'

// ─── Helpers de fecha ──────────────────────────────────────────────────────

// "sábado 30 may"
const formatearDia = (fecha) =>
  new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
  }).format(fecha)

// "15:00"
const formatearHora = (fecha) =>
  new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(fecha)

// Convierte un Date a "YYYY-MM-DDTHH:MM" (lo que espera <input type="datetime-local">)
// respetando la zona horaria local. Si pasamos el ISO directo, el navegador
// muestra la hora UTC y el usuario ve un horario incorrecto.
const fechaAInputLocal = (fechaIso) => {
  if (!fechaIso) return ''
  const d = new Date(fechaIso)
  const offsetMs = d.getTimezoneOffset() * 60_000
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16)
}

// Agrupa los turnos por día. Key = "YYYY-MM-DD" para ordenamiento natural.
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

// ─── Página ────────────────────────────────────────────────────────────────

export default function Turnos() {
  const { usuario } = useAuth()
  const toast = useToast()
  const esCliente = usuario?.rol === 'cliente'
  const puedeGestionar = usuario?.rol === 'admin' || usuario?.rol === 'empleado'

  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroEmpleado, setFiltroEmpleado] = useState('')
  const [filtroDesde, setFiltroDesde] = useState('')
  const [filtroHasta, setFiltroHasta] = useState('')

  const params = {}
  if (filtroEstado) params.estado = filtroEstado
  if (filtroEmpleado) params.empleadoId = filtroEmpleado
  // El backend acepta cualquier fecha ISO 8601. Concatenamos T00:00 y T23:59
  // para que el filtro "desde" tome desde el inicio del dia y "hasta" hasta
  // el final del dia local del usuario.
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

  // Para el filtro por empleado (solo gestores lo ven). Lo cargamos siempre
  // que el rol lo permita; los clientes no necesitan este filtro.
  const { datos: empleadosFiltro } = useFetch(
    () => (puedeGestionar ? listarEmpleadosAPI() : Promise.resolve([])),
    [puedeGestionar]
  )

  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [pidiendoEliminar, setPidiendoEliminar] = useState(null)

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
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <p className="font-mono text-xs uppercase text-negro/60 tracking-tight">
            {esCliente ? 'Mis' : 'Agenda de'}
          </p>
          <h1 className="text-5xl md:text-7xl font-display font-bold uppercase tracking-tighter leading-none">
            Turnos.
          </h1>
        </div>
        {puedeGestionar && (
          <button onClick={abrirNuevo} className="btn btn-aceptar">
            + Nuevo turno
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="card mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-mono text-xs uppercase tracking-tight">Filtros</p>
          {hayFiltros && (
            <button
              type="button"
              onClick={limpiarFiltros}
              className="font-mono text-xs uppercase underline decoration-2 underline-offset-4 hover:text-rojo-faro"
            >
              Limpiar todos
            </button>
          )}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="label">Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="input"
            >
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="confirmado">Confirmado</option>
              <option value="completado">Completado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
          {puedeGestionar && (
            <div>
              <label className="label">Empleado</label>
              <select
                value={filtroEmpleado}
                onChange={(e) => setFiltroEmpleado(e.target.value)}
                className="input"
              >
                <option value="">Todos</option>
                {empleadosFiltro?.map((e) => (
                  <option key={e._id} value={e._id}>
                    {e.nombre} — {e.especialidad}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="label">Desde</label>
            <input
              type="date"
              className="input"
              value={filtroDesde}
              onChange={(e) => setFiltroDesde(e.target.value)}
              max={filtroHasta || undefined}
            />
          </div>
          <div>
            <label className="label">Hasta</label>
            <input
              type="date"
              className="input"
              value={filtroHasta}
              onChange={(e) => setFiltroHasta(e.target.value)}
              min={filtroDesde || undefined}
            />
          </div>
        </div>
      </div>

      {/* Estados */}
      {cargando && <p className="font-mono uppercase">Cargando...</p>}
      {error && (
        <div className="card !p-4 bg-rojo-faro text-white font-mono uppercase">
          Error al cargar turnos
        </div>
      )}

      {turnos && turnos.length === 0 && (
        <div className="card text-center">
          <p className="font-display text-2xl uppercase mb-2">
            No hay turnos {filtroEstado || filtroEmpleado ? 'con esos filtros' : 'cargados'}
          </p>
        </div>
      )}

      {/* Listado agrupado por día */}
      <div className="space-y-10">
        {grupos.map(([clave, lista]) => {
          const fechaDelGrupo = new Date(lista[0].fechaHora)
          return (
            <section key={clave}>
              <header className="flex items-end justify-between border-b-3 border-negro pb-2 mb-4">
                <h2 className="font-display font-bold text-2xl md:text-4xl uppercase tracking-tighter leading-none">
                  {formatearDia(fechaDelGrupo)}
                </h2>
                <span className="font-mono text-xs uppercase text-negro/60">
                  {lista.length} {lista.length === 1 ? 'turno' : 'turnos'}
                </span>
              </header>
              <ul className="space-y-3">
                {lista.map((turno) => (
                  <CardTurno
                    key={turno._id}
                    turno={turno}
                    puedeGestionar={puedeGestionar}
                    onEditar={() => abrirEditar(turno)}
                    onCambiarEstado={(estado) => cambiarEstado(turno, estado)}
                    onEliminar={() => setPidiendoEliminar(turno)}
                  />
                ))}
              </ul>
            </section>
          )
        })}
      </div>

      {puedeGestionar && (
        <Modal
          abierto={modalAbierto}
          onCerrar={cerrarModal}
          titulo={editando ? 'Editar turno' : 'Nuevo turno'}
          ancho="max-w-xl"
        >
          <FormTurno
            inicial={editando}
            onCancelar={cerrarModal}
            onGuardado={() => {
              const fueEdicion = !!editando
              cerrarModal()
              recargar()
              toast.exito(fueEdicion ? 'Turno actualizado' : 'Turno creado')
            }}
          />
        </Modal>
      )}

      <ModalConfirmacion
        abierto={!!pidiendoEliminar}
        onCerrar={() => setPidiendoEliminar(null)}
        onConfirmar={confirmarEliminar}
        titulo="Eliminar turno"
        mensaje="¿Seguro que querés eliminar este turno? Esta acción no se puede deshacer."
        textoConfirmar="Eliminar"
        peligro
      />
    </div>
  )
}

// ─── Card de turno ─────────────────────────────────────────────────────────

function CardTurno({ turno, puedeGestionar, onEditar, onCambiarEstado, onEliminar }) {
  const fecha = new Date(turno.fechaHora)
  const claseBadge = CLASES_BADGE_ESTADO[turno.estado] || 'badge-pendiente'

  return (
    <li className="card !p-0 flex flex-col sm:flex-row hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-bruta-lg transition-all duration-100">
      {/* Bloque hora */}
      <div className="bg-negro text-white px-5 py-4 sm:py-6 flex sm:flex-col items-center justify-center gap-2 sm:gap-1 border-b-3 sm:border-b-0 sm:border-r-3 border-negro sm:min-w-[110px]">
        <p className="font-display font-bold text-3xl sm:text-4xl tracking-tighter leading-none">
          {formatearHora(fecha)}
        </p>
        <p className="font-mono text-[10px] uppercase text-white/60">
          {turno.servicio?.duracionMinutos || '?'} min
        </p>
      </div>

      {/* Contenido */}
      <div className="flex-1 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`badge ${claseBadge}`}>{turno.estado}</span>
          </div>
          <h3 className="font-display font-bold text-xl uppercase tracking-tight leading-tight">
            {turno.cliente?.nombre || '—'}
          </h3>
          <p className="font-sans text-sm mt-1">
            <span className="font-mono text-xs uppercase text-negro/60">→</span>{' '}
            {turno.servicio?.nombre} ·{' '}
            <span className="text-negro/70">{turno.empleado?.nombre}</span>
          </p>
          {turno.notas && (
            <p className="font-mono text-xs mt-1 text-negro/70">{turno.notas}</p>
          )}
        </div>

        {puedeGestionar && (
          <div className="flex flex-wrap gap-2 shrink-0">
            {turno.estado === 'pendiente' && (
              <button
                onClick={() => onCambiarEstado('confirmado')}
                className="btn btn-primario !px-3 !py-2 text-xs"
              >
                Confirmar
              </button>
            )}
            {turno.estado === 'confirmado' && (
              <button
                onClick={() => onCambiarEstado('completado')}
                className="btn btn-aceptar !px-3 !py-2 text-xs"
              >
                Completar
              </button>
            )}
            <button onClick={onEditar} className="btn btn-secundario !px-3 !py-2 text-xs">
              Editar
            </button>
            {turno.estado !== 'cancelado' && (
              <button
                onClick={() => onCambiarEstado('cancelado')}
                className="btn btn-peligro !px-3 !py-2 text-xs"
              >
                Cancelar
              </button>
            )}
            <button onClick={onEliminar} className="btn btn-peligro !px-3 !py-2 text-xs" title="Eliminar">
              ✕
            </button>
          </div>
        )}
      </div>
    </li>
  )
}

// ─── Form de turno ─────────────────────────────────────────────────────────

function FormTurno({ inicial, onCancelar, onGuardado }) {
  const esEdicion = !!inicial

  // Cargamos las 3 listas en paralelo cuando el modal monta.
  const { datos: clientes } = useFetch(() => listarClientesAPI(), [])
  const { datos: empleados } = useFetch(() => listarEmpleadosAPI(), [])
  const { datos: servicios } = useFetch(() => listarServiciosAPI({ activos: true }), [])

  const [cliente, setCliente] = useState(inicial?.cliente?._id || '')
  const [empleado, setEmpleado] = useState(inicial?.empleado?._id || '')
  const [servicio, setServicio] = useState(inicial?.servicio?._id || '')
  const [fechaHora, setFechaHora] = useState(fechaAInputLocal(inicial?.fechaHora))
  const [estado, setEstado] = useState(inicial?.estado || 'pendiente')
  const [notas, setNotas] = useState(inicial?.notas || '')
  const [errores, setErrores] = useState({})
  const [errorGlobal, setErrorGlobal] = useState('')
  const [enviando, setEnviando] = useState(false)

  const validar = () => {
    const errs = {}
    if (!cliente) errs.cliente = 'Elegí un cliente'
    if (!empleado) errs.empleado = 'Elegí un empleado'
    if (!servicio) errs.servicio = 'Elegí un servicio'
    if (!fechaHora) errs.fechaHora = 'Indicá fecha y hora'
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
        // Convertimos el input local a ISO UTC para el backend.
        fechaHora: new Date(fechaHora).toISOString(),
        estado,
        notas: notas.trim(),
      }
      if (esEdicion) await actualizarTurnoAPI(inicial._id, payload)
      else await crearTurnoAPI(payload)
      onGuardado()
    } catch (e) {
      const msg = e.response?.data?.error || 'No se pudo guardar'
      // El backend devuelve 409 cuando hay superposición de horarios.
      setErrorGlobal(msg)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {errorGlobal && (
        <div className="border-3 border-negro bg-rojo-faro text-white px-4 py-3 font-mono text-sm uppercase">
          {errorGlobal}
        </div>
      )}

      <div>
        <label className="label" htmlFor="cliente">Cliente</label>
        <select id="cliente" className="input" value={cliente} onChange={(e) => setCliente(e.target.value)}>
          <option value="">— Elegir cliente —</option>
          {clientes?.map((c) => (
            <option key={c._id} value={c._id}>
              {c.nombre} {c.email ? `· ${c.email}` : ''}
            </option>
          ))}
        </select>
        {errores.cliente && <p className="font-mono text-xs text-rojo-faro mt-2 uppercase">{errores.cliente}</p>}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="empleado">Empleado</label>
          <select id="empleado" className="input" value={empleado} onChange={(e) => setEmpleado(e.target.value)}>
            <option value="">— Elegir —</option>
            {empleados?.filter((e) => e.activo !== false).map((e) => (
              <option key={e._id} value={e._id}>
                {e.nombre} — {e.especialidad}
              </option>
            ))}
          </select>
          {errores.empleado && <p className="font-mono text-xs text-rojo-faro mt-2 uppercase">{errores.empleado}</p>}
        </div>
        <div>
          <label className="label" htmlFor="servicio">Servicio</label>
          <select id="servicio" className="input" value={servicio} onChange={(e) => setServicio(e.target.value)}>
            <option value="">— Elegir —</option>
            {servicios?.map((s) => (
              <option key={s._id} value={s._id}>
                {s.nombre} · {s.duracionMinutos}min · ${s.precio}
              </option>
            ))}
          </select>
          {errores.servicio && <p className="font-mono text-xs text-rojo-faro mt-2 uppercase">{errores.servicio}</p>}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="fechaHora">Fecha y hora</label>
          <input
            id="fechaHora"
            type="datetime-local"
            className="input"
            value={fechaHora}
            onChange={(e) => setFechaHora(e.target.value)}
          />
          {errores.fechaHora && <p className="font-mono text-xs text-rojo-faro mt-2 uppercase">{errores.fechaHora}</p>}
        </div>
        {esEdicion && (
          <div>
            <label className="label" htmlFor="estado">Estado</label>
            <select id="estado" className="input" value={estado} onChange={(e) => setEstado(e.target.value)}>
              <option value="pendiente">Pendiente</option>
              <option value="confirmado">Confirmado</option>
              <option value="completado">Completado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        )}
      </div>

      <div>
        <label className="label" htmlFor="notas">Notas</label>
        <textarea
          id="notas"
          className="input min-h-[80px] resize-y"
          placeholder="Información adicional para el turno..."
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
        />
      </div>

      <div className="flex gap-3 pt-4 border-t-2 border-negro">
        <button type="button" onClick={onCancelar} className="btn btn-secundario flex-1">
          Cancelar
        </button>
        <button type="submit" disabled={enviando} className="btn btn-primario flex-1">
          {enviando ? 'Guardando...' : esEdicion ? 'Actualizar' : 'Crear turno'}
        </button>
      </div>
    </form>
  )
}
