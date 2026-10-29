import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  listarEmpleadosAPI,
  crearEmpleadoAPI,
  actualizarEmpleadoAPI,
  eliminarEmpleadoAPI,
  conectarGoogleCalendarAPI,
  desconectarGoogleCalendarAPI,
  bloquearHorarioGoogleAPI,
  desbloquearHorarioGoogleAPI,
  obtenerAuthUrlGoogleAPI,
} from '../api/empleados.api.js'
import { useFetch } from '../hooks/useFetch.js'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../hooks/useToast.js'
import { usePaginacion } from '../hooks/usePaginacion.js'
import { listarUsuariosAPI } from '../api/usuarios.api.js'
import { Modal } from '../components/Modal.jsx'
import { ModalConfirmacion } from '../components/ModalConfirmacion.jsx'
import { Paginacion } from '../components/Paginacion.jsx'

export default function Empleados() {
  const toast = useToast()
  const { datos: empleados, cargando, error, recargar } = useFetch(() =>
    listarEmpleadosAPI()
  )
  const { visibles: pagina, pagina: nPagina, setPagina, totalPaginas } = usePaginacion(empleados, 15)
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    const syncStatus = searchParams.get('googleSync')
    if (syncStatus === 'exito') {
      toast.exito('¡Google Calendar conectado y sincronizando automáticamente!')
      searchParams.delete('googleSync')
      setSearchParams(searchParams, { replace: true })
      if (typeof recargar === 'function') recargar()
    } else if (syncStatus === 'error') {
      const msg = searchParams.get('mensaje') || 'Error desconocido'
      toast.error(`Error al conectar Google Calendar: ${msg}`)
      searchParams.delete('googleSync')
      searchParams.delete('mensaje')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams])

  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [pidiendoEliminar, setPidiendoEliminar] = useState(null)
  const [empleadoCalendar, setEmpleadoCalendar] = useState(null)

  const abrirNuevo = () => {
    setEditando(null)
    setModalAbierto(true)
  }
  const abrirEditar = (empleado) => {
    setEditando(empleado)
    setModalAbierto(true)
  }
  const cerrarModal = () => {
    setModalAbierto(false)
    setEditando(null)
  }

  const confirmarEliminar = async () => {
    const empleado = pidiendoEliminar
    try {
      await eliminarEmpleadoAPI(empleado._id)
      setPidiendoEliminar(null)
      recargar()
      toast.exito(`"${empleado.nombre}" eliminado`)
    } catch (e) {
      setPidiendoEliminar(null)
      toast.error(e.response?.data?.error || 'No se pudo eliminar')
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-500 mb-1">
            — EQUIPO & PROFESIONALES
          </p>
          <h1 className="text-4xl sm:text-6xl font-mono font-medium tracking-tight text-white uppercase leading-none">
            EMPLEADOS.
          </h1>
        </div>
        <button onClick={abrirNuevo} className="btn btn-primario self-start sm:self-auto">
          + Nuevo empleado
        </button>
      </div>

      {cargando && <p className="font-mono text-xs uppercase text-neutral-500 animate-pulse">Cargando...</p>}
      {error && (
        <div className="p-4 border border-rose-500/30 text-rose-300 font-mono text-xs uppercase">
          Error al cargar empleados
        </div>
      )}

      {empleados && empleados.length === 0 && (
        <div className="py-12 border border-white/10 text-center">
          <p className="font-mono text-sm uppercase text-neutral-400">No hay empleados cargados</p>
        </div>
      )}

      {empleados && empleados.length > 0 && (
        <div className="space-y-6">
          <ul className="divide-y divide-white/10 border-t border-b border-white/10">
            {pagina.map((emp) => (
              <FilaEmpleado
                key={emp._id}
                empleado={emp}
                onEditar={() => abrirEditar(emp)}
                onEliminar={() => setPidiendoEliminar(emp)}
                onGestionarCalendar={() => setEmpleadoCalendar(emp)}
              />
            ))}
          </ul>
          <Paginacion pagina={nPagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
        </div>
      )}

      <Modal
        abierto={modalAbierto}
        onCerrar={cerrarModal}
        titulo={editando ? 'Editar empleado' : 'Nuevo empleado'}
      >
        <FormEmpleado
          inicial={editando}
          onCancelar={cerrarModal}
          onGuardado={() => {
            const fueEdicion = !!editando
            cerrarModal()
            recargar()
            toast.exito(fueEdicion ? 'Empleado actualizado' : 'Empleado creado')
          }}
        />
      </Modal>

      <ModalConfirmacion
        abierto={!!pidiendoEliminar}
        onCerrar={() => setPidiendoEliminar(null)}
        onConfirmar={confirmarEliminar}
        titulo="Eliminar empleado"
        mensaje={`¿Seguro que querés eliminar a "${pidiendoEliminar?.nombre}"? Esta acción no se puede deshacer.`}
        textoConfirmar="Eliminar"
        peligro
      />

      {empleadoCalendar && (
        <ModalGoogleCalendar
          empleado={empleadoCalendar}
          onCerrar={() => setEmpleadoCalendar(null)}
          onActualizado={() => {
            recargar()
          }}
        />
      )}
    </div>
  )
}

function FilaEmpleado({ empleado, onEditar, onEliminar, onGestionarCalendar }) {
  return (
    <li className="py-4 px-2 hover:bg-white/[0.02] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h3 className="font-mono font-medium text-lg uppercase tracking-tight leading-tight text-white truncate">
            {empleado.nombre}
          </h3>
          <span className={`badge ${empleado.activo ? 'badge-confirmado' : 'badge-cancelado'}`}>
            {empleado.activo ? 'Activo' : 'Inactivo'}
          </span>
          {empleado.googleSyncActivo ? (
            <span className="badge badge-confirmado flex items-center gap-1.5" title={`Google Calendar: ${empleado.googleCalendarId}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Google Calendar
            </span>
          ) : (
            <span className="badge badge-pendiente !text-neutral-500 !border-neutral-700">
              Sin Calendar
            </span>
          )}
          {empleado.usuario && (
            <span className="badge badge-confirmado">Cuenta vinculada</span>
          )}
        </div>
        <p className="font-mono text-xs uppercase tracking-wider text-neutral-400">
          {empleado.especialidad}
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 font-mono text-xs text-neutral-500">
          {empleado.email && <span>{empleado.email}</span>}
          {empleado.telefono && <span>· {empleado.telefono}</span>}
          {empleado.googleSyncActivo && (
            <span>· {empleado.eventosGoogle?.length || 0} bloqueos activos</span>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 shrink-0 items-center">
        <button
          onClick={onGestionarCalendar}
          className="btn btn-secundario !px-3 !py-1.5 text-xs flex items-center gap-1.5"
          title="Gestionar sincronización de Google Calendar"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" />
          </svg>
          <span>Google Sync</span>
        </button>
        <button onClick={onEditar} className="btn btn-secundario !px-3 !py-1.5 text-xs">
          Editar
        </button>
        <button onClick={onEliminar} className="btn btn-peligro !px-3 !py-1.5 text-xs">
          Eliminar
        </button>
      </div>
    </li>
  )
}

function FormEmpleado({ inicial, onCancelar, onGuardado }) {
  const esEdicion = !!inicial
  const { usuario } = useAuth()
  const esAdmin = usuario?.rol === 'admin'

  const { datos: todosUsuarios } = useFetch(
    () => (esAdmin ? listarUsuariosAPI() : Promise.resolve([])),
    [esAdmin]
  )
  const usuariosCandidatos = (todosUsuarios || []).filter((u) => u.rol === 'empleado')

  const [nombre, setNombre] = useState(inicial?.nombre || '')
  const [especialidad, setEspecialidad] = useState(inicial?.especialidad || '')
  const [telefono, setTelefono] = useState(inicial?.telefono || '')
  const [email, setEmail] = useState(inicial?.email || '')
  const [usuarioId, setUsuarioId] = useState(inicial?.usuario?._id || inicial?.usuario || '')
  const [activo, setActivo] = useState(inicial?.activo ?? true)
  const [errores, setErrores] = useState({})
  const [errorGlobal, setErrorGlobal] = useState('')
  const [enviando, setEnviando] = useState(false)

  const validar = () => {
    const errs = {}
    if (!nombre.trim()) errs.nombre = 'El nombre es obligatorio'
    if (!especialidad.trim()) errs.especialidad = 'La especialidad es obligatoria'
    if (email && !/\S+@\S+\.\S+/.test(email)) errs.email = 'Email inválido'
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
        nombre: nombre.trim(),
        especialidad: especialidad.trim(),
        telefono: telefono.trim(),
        email: email.trim(),
        usuario: usuarioId || null,
        activo,
      }
      if (esEdicion) await actualizarEmpleadoAPI(inicial._id, payload)
      else await crearEmpleadoAPI(payload)
      onGuardado()
    } catch (e) {
      setErrorGlobal(e.response?.data?.error || 'No se pudo guardar')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {errorGlobal && (
        <div className="p-4 border border-rose-500/30 text-rose-300 font-mono text-xs uppercase">
          {errorGlobal}
        </div>
      )}

      <div>
        <label className="label" htmlFor="nombre">Nombre</label>
        <input id="nombre" type="text" className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        {errores.nombre && <p className="font-mono text-xs text-rose-400 mt-2 uppercase">{errores.nombre}</p>}
      </div>

      <div>
        <label className="label" htmlFor="especialidad">Especialidad</label>
        <input
          id="especialidad"
          type="text"
          className="input"
          placeholder="Ej: Cortes de autor, Navaja, Colorimetría..."
          value={especialidad}
          onChange={(e) => setEspecialidad(e.target.value)}
        />
        {errores.especialidad && <p className="font-mono text-xs text-rose-400 mt-2 uppercase">{errores.especialidad}</p>}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="telefono">Teléfono</label>
          <input id="telefono" type="tel" className="input" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          {errores.email && <p className="font-mono text-xs text-rose-400 mt-2 uppercase">{errores.email}</p>}
        </div>
      </div>

      {esAdmin && (
        <div>
          <label className="label" htmlFor="usuarioVinc">
            Cuenta vinculada <span className="text-neutral-500 normal-case font-mono text-[10px]">(opcional)</span>
          </label>
          <select
            id="usuarioVinc"
            className="input"
            value={usuarioId}
            onChange={(e) => setUsuarioId(e.target.value)}
          >
            <option value="">— Sin cuenta vinculada —</option>
            {usuariosCandidatos.map((u) => (
              <option key={u._id} value={u._id}>
                {u.nombre} · {u.email}
              </option>
            ))}
          </select>
        </div>
      )}

      <label className="flex items-center gap-3 cursor-pointer pt-2">
        <input
          type="checkbox"
          checked={activo}
          onChange={(e) => setActivo(e.target.checked)}
          className="w-4 h-4 rounded-none accent-white cursor-pointer"
        />
        <span className="font-mono text-xs uppercase tracking-wider text-neutral-300">Empleado activo</span>
      </label>

      <div className="flex gap-3 pt-6 border-t border-white/10">
        <button type="button" onClick={onCancelar} className="btn btn-secundario flex-1">
          Cancelar
        </button>
        <button type="submit" disabled={enviando} className="btn btn-primario flex-1">
          {enviando ? 'Guardando...' : esEdicion ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  )
}

function ModalGoogleCalendar({ empleado, onCerrar, onActualizado }) {
  const toast = useToast()
  const [empActual, setEmpActual] = useState(empleado)
  const [emailSync, setEmailSync] = useState(empleado.googleCalendarId || empleado.email || '')
  const [cargando, setCargando] = useState(false)
  const [errorLocal, setErrorLocal] = useState('')

  // Formulario de bloqueo de horario
  const [tituloBloqueo, setTituloBloqueo] = useState('')
  const [inicioBloqueo, setInicioBloqueo] = useState('')
  const [finBloqueo, setFinBloqueo] = useState('')

  const conectar = async (e) => {
    e?.preventDefault()
    setCargando(true)
    setErrorLocal('')
    try {
      const actualizado = await conectarGoogleCalendarAPI(empActual._id, {
        email: emailSync.trim() || empActual.email,
      })
      setEmpActual(actualizado)
      onActualizado()
      toast.exito('Google Calendar vinculado correctamente')
    } catch (err) {
      setErrorLocal(err.response?.data?.error || 'Error al conectar Google Calendar')
    } finally {
      setCargando(false)
    }
  }

  const desconectar = async () => {
    setCargando(true)
    setErrorLocal('')
    try {
      const actualizado = await desconectarGoogleCalendarAPI(empActual._id)
      setEmpActual(actualizado)
      onActualizado()
      toast.exito('Google Calendar desvinculado')
    } catch (err) {
      setErrorLocal(err.response?.data?.error || 'Error al desvincular Google Calendar')
    } finally {
      setCargando(false)
    }
  }

  const registrarBloqueo = async (e) => {
    e.preventDefault()
    if (!inicioBloqueo || !finBloqueo) {
      setErrorLocal('Indicá fecha y hora de inicio y fin para el bloqueo')
      return
    }
    setCargando(true)
    setErrorLocal('')
    try {
      const actualizado = await bloquearHorarioGoogleAPI(empActual._id, {
        titulo: tituloBloqueo.trim() || 'Bloqueo Google Calendar',
        inicio: new Date(inicioBloqueo).toISOString(),
        fin: new Date(finBloqueo).toISOString(),
      })
      setEmpActual(actualizado)
      setTituloBloqueo('')
      setInicioBloqueo('')
      setFinBloqueo('')
      onActualizado()
      toast.exito('Horario bloqueado en Google Calendar')
    } catch (err) {
      setErrorLocal(err.response?.data?.error || 'Error al registrar bloqueo')
    } finally {
      setCargando(false)
    }
  }

  const eliminarBloqueo = async (eventId) => {
    setCargando(true)
    setErrorLocal('')
    try {
      const actualizado = await desbloquearHorarioGoogleAPI(empActual._id, eventId)
      setEmpActual(actualizado)
      onActualizado()
      toast.exito('Bloqueo eliminado de Google Calendar')
    } catch (err) {
      setErrorLocal(err.response?.data?.error || 'Error al eliminar bloqueo')
    } finally {
      setCargando(false)
    }
  }

  return (
    <Modal abierto={true} onCerrar={onCerrar} titulo={`GOOGLE CALENDAR — ${empActual.nombre}`}>
      <div className="space-y-6">
        <p className="font-mono text-xs uppercase text-neutral-400 leading-relaxed">
          Sincronización bidireccional: bloquea horarios personales en Google Calendar y
          automáticamente inhabilita los turnos en el motor de reservas.
        </p>

        {errorLocal && (
          <div className="p-3 border border-rose-500/30 text-rose-300 font-mono text-xs uppercase">
            {errorLocal}
          </div>
        )}

        {/* Estado y Conexión */}
        <div className="p-4 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase text-neutral-500 tracking-wider">
                ESTADO DE SINCRONIZACIÓN
              </p>
              <p className="font-mono text-sm text-white font-medium uppercase mt-0.5">
                {empActual.googleSyncActivo ? '● CONECTADO Y SINCRONIZANDO' : '○ DESCONECTADO'}
              </p>
            </div>
            {empActual.googleSyncActivo && (
              <a
                href="https://calendar.google.com/calendar/u/0/r"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secundario !px-3 !py-1 text-xs font-mono uppercase"
              >
                Abrir Calendar ↗
              </a>
            )}
          </div>

          {!empActual.googleSyncActivo ? (
            <div className="space-y-3 pt-2">
              <div>
                <label className="label" htmlFor="emailSync">
                  Email de cuenta Google Calendar
                </label>
                <input
                  id="emailSync"
                  type="email"
                  className="input"
                  placeholder="barbero@gmail.com"
                  value={emailSync}
                  onChange={(e) => setEmailSync(e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={conectar}
                disabled={cargando}
                className="btn btn-primario w-full text-xs font-mono uppercase"
              >
                {cargando ? 'Vinculando...' : 'Vincular cuenta de Google'}
              </button>

              <div className="pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={async () => {
                    setCargando(true)
                    setErrorLocal('')
                    try {
                      const { url } = await obtenerAuthUrlGoogleAPI(empActual._id)
                      if (url) window.location.href = url
                    } catch (err) {
                      setErrorLocal(
                        err.response?.data?.error ||
                          'Para autorización directa en la nube completá GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en el servidor.'
                      )
                    } finally {
                      setCargando(false)
                    }
                  }}
                  disabled={cargando}
                  className="btn btn-secundario w-full text-xs font-mono uppercase flex items-center justify-center gap-1.5"
                  title="Conectar directamente con Google OAuth2 para sincronización automática en tiempo real"
                >
                  <span>Conectar API Oficial Google ↗</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="font-mono text-xs text-neutral-400">
                Cuenta: <strong className="text-white">{empActual.googleCalendarId}</strong>
              </span>
              <button
                type="button"
                onClick={desconectar}
                disabled={cargando}
                className="btn btn-peligro !px-3 !py-1 text-xs font-mono uppercase"
              >
                {cargando ? 'Desvinculando...' : 'Desvincular'}
              </button>
            </div>
          )}
        </div>

        {/* Lista de bloqueos actuales */}
        {empActual.googleSyncActivo && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-mono text-xs uppercase tracking-widest text-neutral-300">
                — BLOQUEOS EXTERNOS ({empActual.eventosGoogle?.length || 0})
              </h4>
            </div>

            {empActual.eventosGoogle && empActual.eventosGoogle.length > 0 ? (
              <ul className="divide-y divide-white/10 border-t border-b border-white/10">
                {empActual.eventosGoogle.map((ev) => (
                  <li
                    key={ev._id || ev.googleEventId}
                    className="py-3 flex items-center justify-between gap-4 font-mono text-xs"
                  >
                    <div>
                      <p className="text-white font-medium uppercase">{ev.titulo}</p>
                      <p className="text-neutral-500 text-[11px] mt-0.5">
                        {new Date(ev.inicio).toLocaleString('es-AR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}{' '}
                        —{' '}
                        {new Date(ev.fin).toLocaleTimeString('es-AR', {
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => eliminarBloqueo(ev._id || ev.googleEventId)}
                      disabled={cargando}
                      className="btn btn-peligro !px-2.5 !py-1 text-[11px] font-mono uppercase"
                    >
                      Desbloquear
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="font-mono text-xs text-neutral-500 py-3 border-t border-b border-white/10 uppercase">
                No hay bloqueos activos registrados.
              </p>
            )}

            {/* Formulario para registrar bloqueo */}
            <form onSubmit={registrarBloqueo} className="p-4 border border-white/10 space-y-3">
              <p className="font-mono text-xs uppercase text-white font-medium">
                + Bloquear nuevo horario personal
              </p>
              <div>
                <label className="label" htmlFor="tituloBloqueo">Motivo o Evento</label>
                <input
                  id="tituloBloqueo"
                  type="text"
                  placeholder="Ej: Trámite médico, Almuerzo personal..."
                  className="input !py-1.5 text-xs"
                  value={tituloBloqueo}
                  onChange={(e) => setTituloBloqueo(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label" htmlFor="inicioBloqueo">Inicio</label>
                  <input
                    id="inicioBloqueo"
                    type="datetime-local"
                    className="input !py-1.5 text-xs"
                    value={inicioBloqueo}
                    onChange={(e) => setInicioBloqueo(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="finBloqueo">Fin</label>
                  <input
                    id="finBloqueo"
                    type="datetime-local"
                    className="input !py-1.5 text-xs"
                    value={finBloqueo}
                    onChange={(e) => setFinBloqueo(e.target.value)}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={cargando}
                className="btn btn-primario w-full text-xs font-mono uppercase !py-2"
              >
                {cargando ? 'Registrando...' : 'Bloquear horario en calendar'}
              </button>
            </form>
          </div>
        )}

        <div className="pt-4 border-t border-white/10 flex justify-end">
          <button type="button" onClick={onCerrar} className="btn btn-secundario text-xs font-mono uppercase">
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  )
}
