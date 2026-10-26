import { useState, useMemo } from 'react'
import {
  listarNegociosSuperadminAPI,
  crearNegocioSuperadminAPI,
  actualizarNegocioSuperadminAPI,
  toggleEstadoNegocioSuperadminAPI,
  eliminarNegocioSuperadminAPI,
} from '../api/negocios.api.js'
import { useFetch } from '../hooks/useFetch.js'
import { useToast } from '../hooks/useToast.js'
import { Modal } from '../components/Modal.jsx'
import { ModalConfirmacion } from '../components/ModalConfirmacion.jsx'
import { PlusCircle, Search, ShieldCheck, Building2, Calendar, Users, Sliders } from 'lucide-react'

export default function Superadmin() {
  const toast = useToast()
  const { datos: salones, cargando, error, recargar } = useFetch(() =>
    listarNegociosSuperadminAPI()
  )

  const [busqueda, setBusqueda] = useState('')
  const [filtroPlan, setFiltroPlan] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  const [modalNuevo, setModalNuevo] = useState(false)
  const [editandoSalon, setEditandoSalon] = useState(null)
  const [pidiendoEliminar, setPidiendoEliminar] = useState(null)

  // Filtrado reactivo
  const salonesFiltrados = useMemo(() => {
    if (!salones) return []
    return salones.filter((s) => {
      const q = busqueda.toLowerCase().trim()
      const coincideBusqueda =
        !q ||
        s.nombre.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        s.owner?.email?.toLowerCase().includes(q) ||
        s.owner?.nombre?.toLowerCase().includes(q)

      const coincidePlan = !filtroPlan || s.plan === filtroPlan
      const coincideEstado =
        !filtroEstado ||
        (filtroEstado === 'activo' && s.activo) ||
        (filtroEstado === 'suspendido' && !s.activo)

      return coincideBusqueda && coincidePlan && coincideEstado
    })
  }, [salones, busqueda, filtroPlan, filtroEstado])

  // Métricas globales
  const totalSalones = salones?.length || 0
  const salonesActivos = salones?.filter((s) => s.activo).length || 0
  const totalTurnos = salones?.reduce((acc, s) => acc + (s.metricas?.turnos || 0), 0) || 0
  const totalBarberos = salones?.reduce((acc, s) => acc + (s.metricas?.empleados || 0), 0) || 0

  const toggleEstado = async (salon) => {
    try {
      await toggleEstadoNegocioSuperadminAPI(salon._id)
      recargar()
      toast.exito(`Salón "${salon.nombre}" ${salon.activo ? 'suspendido' : 'activado'}`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo cambiar el estado')
    }
  }

  const confirmarEliminar = async () => {
    const s = pidiendoEliminar
    setPidiendoEliminar(null)
    if (!s) return
    try {
      await eliminarNegocioSuperadminAPI(s._id)
      recargar()
      toast.exito(`Salón "${s.nombre}" eliminado definitivamente`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo eliminar el salón')
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Zen Superadmin */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">
              — PANEL DE CONTROL CENTRAL · MULTI-TENANT SAAS
            </p>
          </div>
          <h1 className="text-4xl sm:text-6xl font-mono font-medium tracking-tight text-white uppercase leading-none">
            SUPERADMIN.
          </h1>
        </div>
        <button
          onClick={() => setModalNuevo(true)}
          className="btn btn-primario self-start sm:self-auto flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Crear Salón de Cero</span>
        </button>
      </div>

      {/* Telemetría Global Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-5 border border-white/10 bg-white/[0.01]">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="font-mono text-xs uppercase tracking-wider">Salones Totales</span>
            <Building2 className="w-4 h-4 text-neutral-400" />
          </div>
          <p className="font-mono font-bold text-3xl lg:text-4xl text-white tracking-tight">
            {totalSalones}
          </p>
        </div>

        <div className="p-5 border border-white/10 bg-white/[0.01]">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="font-mono text-xs uppercase tracking-wider">Salones Activos</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="font-mono font-bold text-3xl lg:text-4xl text-white tracking-tight">
            {salonesActivos}
          </p>
        </div>

        <div className="p-5 border border-white/10 bg-white/[0.01]">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="font-mono text-xs uppercase tracking-wider">Turnos Globales</span>
            <Calendar className="w-4 h-4 text-neutral-400" />
          </div>
          <p className="font-mono font-bold text-3xl lg:text-4xl text-white tracking-tight">
            {totalTurnos}
          </p>
        </div>

        <div className="p-5 border border-white/10 bg-white/[0.01]">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="font-mono text-xs uppercase tracking-wider">Barberos Registrados</span>
            <Users className="w-4 h-4 text-neutral-400" />
          </div>
          <p className="font-mono font-bold text-3xl lg:text-4xl text-white tracking-tight">
            {totalBarberos}
          </p>
        </div>
      </div>

      {/* Filtros & Búsqueda */}
      <div className="p-4 border border-white/10 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label" htmlFor="busqueda">Buscar Salón o Dueño</label>
            <div className="relative">
              <input
                id="busqueda"
                type="text"
                placeholder="Nombre, slug o email..."
                className="input !py-2 text-xs"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="filtroPlan">Filtrar por Plan</label>
            <select
              id="filtroPlan"
              className="input !py-2 text-xs"
              value={filtroPlan}
              onChange={(e) => setFiltroPlan(e.target.value)}
            >
              <option value="">— Todos los planes —</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          <div>
            <label className="label" htmlFor="filtroEstado">Filtrar por Estado</label>
            <select
              id="filtroEstado"
              className="input !py-2 text-xs"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="">— Todos los estados —</option>
              <option value="activo">Solo Activos</option>
              <option value="suspendido">Solo Suspendidos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista Tabular Editorial */}
      {cargando && <p className="font-mono text-xs uppercase text-neutral-500 animate-pulse">Cargando salones...</p>}
      {error && (
        <div className="p-4 border border-rose-500/30 text-rose-300 font-mono text-xs uppercase">
          Error al cargar salones multi-tenant
        </div>
      )}

      {salonesFiltrados && salonesFiltrados.length === 0 && !cargando && (
        <div className="py-12 border border-white/10 text-center font-mono text-xs uppercase text-neutral-500">
          No se encontraron salones con los criterios seleccionados
        </div>
      )}

      {salonesFiltrados && salonesFiltrados.length > 0 && (
        <ul className="divide-y divide-white/10 border-t border-b border-white/10">
          {salonesFiltrados.map((s) => (
            <FilaSuperadmin
              key={s._id}
              salon={s}
              onEditar={() => setEditandoSalon(s)}
              onToggleEstado={() => toggleEstado(s)}
              onEliminar={() => setPidiendoEliminar(s)}
            />
          ))}
        </ul>
      )}

      {/* Modal Crear Salón de Cero */}
      {modalNuevo && (
        <ModalCrearSalon
          onCerrar={() => setModalNuevo(false)}
          onCreado={() => {
            setModalNuevo(false)
            recargar()
            toast.exito('Salón creado y configurado con éxito')
          }}
        />
      )}

      {/* Modal Editar Salón */}
      {editandoSalon && (
        <ModalEditarSalon
          salon={editandoSalon}
          onCerrar={() => setEditandoSalon(null)}
          onActualizado={() => {
            setEditandoSalon(null)
            recargar()
            toast.exito('Salón actualizado correctamente')
          }}
        />
      )}

      {/* Modal Confirmación Eliminar */}
      <ModalConfirmacion
        abierto={!!pidiendoEliminar}
        onCerrar={() => setPidiendoEliminar(null)}
        onConfirmar={confirmarEliminar}
        titulo="Eliminar salón definitivamente"
        mensaje={`¿Estás seguro de que querés eliminar "${pidiendoEliminar?.nombre}" (${pidiendoEliminar?.slug})? Esta acción eliminará el tenant de la plataforma.`}
        textoConfirmar="Eliminar salón"
        peligro
      />
    </div>
  )
}

function FilaSuperadmin({ salon, onEditar, onToggleEstado, onEliminar }) {
  const cfg = salon.configuracion || {}

  return (
    <li className="py-5 px-3 hover:bg-white/[0.02] transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 font-mono">
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg uppercase text-white font-medium tracking-tight">
            {salon.nombre}
          </h3>
          <span className="badge badge-confirmado text-[11px] font-mono">
            /{salon.slug}
          </span>
          <span className={`badge ${salon.activo ? 'badge-confirmado' : 'badge-cancelado'}`}>
            {salon.activo ? '● ACTIVO' : '○ SUSPENDIDO'}
          </span>
          <span className="badge !border-white/20 text-neutral-300 uppercase">
            PLAN {salon.plan}
          </span>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-400">
          <span>Dueño: <strong className="text-white">{salon.owner?.nombre || '—'}</strong> ({salon.owner?.email || '—'})</span>
          {salon.telefono && <span>· Tel: {salon.telefono}</span>}
          {salon.direccion && <span>· Dir: {salon.direccion}</span>}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-neutral-500 pt-1">
          <span>{salon.metricas?.turnos || 0} turnos</span>
          <span>· {salon.metricas?.empleados || 0} profesionales</span>
          <span>· {salon.metricas?.servicios || 0} servicios</span>
          <span>· {salon.metricas?.clientes || 0} clientes</span>
          <span>· Horario: {cfg.horaApertura || '09:00'} a {cfg.horaCierre || '20:00'} ({cfg.intervaloMinutos || 30} min)</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 shrink-0 items-center">
        <a
          href={`/${salon.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secundario !px-3 !py-1.5 text-xs font-mono uppercase"
          title="Ver portal público de reservas del salón"
        >
          Portal ↗
        </a>
        <button
          onClick={onEditar}
          className="btn btn-secundario !px-3 !py-1.5 text-xs font-mono uppercase"
        >
          Configurar
        </button>
        <button
          onClick={onToggleEstado}
          className={`btn !px-3 !py-1.5 text-xs font-mono uppercase ${
            salon.activo ? 'btn-peligro' : 'btn-primario'
          }`}
        >
          {salon.activo ? 'Suspender' : 'Activar'}
        </button>
        <button
          onClick={onEliminar}
          className="btn btn-peligro !px-3 !py-1.5 text-xs font-mono uppercase"
          title="Eliminar salón definitivamente"
        >
          Eliminar
        </button>
      </div>
    </li>
  )
}

function ModalCrearSalon({ onCerrar, onCreado }) {
  const [nombre, setNombre] = useState('')
  const [slug, setSlug] = useState('')
  const [plan, setPlan] = useState('pro')
  const [nombreOwner, setNombreOwner] = useState('')
  const [emailOwner, setEmailOwner] = useState('')
  const [passwordOwner, setPasswordOwner] = useState('Admin2026!')
  const [direccion, setDireccion] = useState('')
  const [telefono, setTelefono] = useState('')
  const [horaApertura, setHoraApertura] = useState('09:00')
  const [horaCierre, setHoraCierre] = useState('20:00')
  const [intervaloMinutos, setIntervaloMinutos] = useState(30)
  const [cargando, setCargando] = useState(false)
  const [errorLocal, setErrorLocal] = useState('')

  const handleNombreChange = (val) => {
    setNombre(val)
    if (!slug || slug === val.slice(0, -1).toLowerCase().replace(/[^a-z0-9]+/g, '-')) {
      setSlug(val.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setErrorLocal('')
    if (!nombre.trim() || !slug.trim() || !emailOwner.trim()) {
      setErrorLocal('Nombre, slug y email del dueño son obligatorios')
      return
    }

    setCargando(true)
    try {
      await crearNegocioSuperadminAPI({
        nombre: nombre.trim(),
        slug: slug.trim().toLowerCase(),
        plan,
        nombreOwner: nombreOwner.trim() || nombre.trim(),
        emailOwner: emailOwner.trim().toLowerCase(),
        passwordOwner: passwordOwner.trim(),
        direccion: direccion.trim(),
        telefono: telefono.trim(),
        configuracion: {
          horaApertura,
          horaCierre,
          intervaloMinutos: Number(intervaloMinutos),
          politicaPago: 'efectivo',
        },
      })
      onCreado()
    } catch (err) {
      setErrorLocal(err.response?.data?.error || 'Error al crear salón')
    } finally {
      setCargando(false)
    }
  }

  return (
    <Modal abierto={true} onCerrar={onCerrar} titulo="CREAR SALÓN DESDE CERO">
      <form onSubmit={onSubmit} className="space-y-6">
        {errorLocal && (
          <div className="p-3 border border-rose-500/30 text-rose-300 font-mono text-xs uppercase">
            {errorLocal}
          </div>
        )}

        {/* Identidad */}
        <div className="space-y-4">
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">
            — 01. IDENTIDAD DEL SALÓN
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="crearNombre">Nombre del Salón</label>
              <input
                id="crearNombre"
                type="text"
                className="input"
                placeholder="Ej: Palermo Barber Club"
                value={nombre}
                onChange={(e) => handleNombreChange(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="crearSlug">Slug Identificador</label>
              <input
                id="crearSlug"
                type="text"
                className="input"
                placeholder="ej: palermo-barber-club"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                required
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="crearPlan">Plan SaaS</label>
            <select
              id="crearPlan"
              className="input"
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
            >
              <option value="free">Free — Plan Básico</option>
              <option value="pro">Pro — Multi-Barbero</option>
              <option value="enterprise">Enterprise — Red de Franquicias</option>
            </select>
          </div>
        </div>

        {/* Dueño / Administrador */}
        <div className="space-y-4 pt-4 border-t border-white/10">
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">
            — 02. CUENTA DEL DUEÑO
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="crearOwnerNombre">Nombre del Dueño</label>
              <input
                id="crearOwnerNombre"
                type="text"
                className="input"
                placeholder="Ej: Mateo Gabús"
                value={nombreOwner}
                onChange={(e) => setNombreOwner(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="crearOwnerEmail">Email de Acceso</label>
              <input
                id="crearOwnerEmail"
                type="email"
                className="input"
                placeholder="dueño@salondemo.com"
                value={emailOwner}
                onChange={(e) => setEmailOwner(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="crearOwnerPass">Contraseña Inicial</label>
            <input
              id="crearOwnerPass"
              type="text"
              className="input font-mono"
              value={passwordOwner}
              onChange={(e) => setPasswordOwner(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Horarios Iniciales */}
        <div className="space-y-4 pt-4 border-t border-white/10">
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">
            — 03. HORARIOS OPERATIVOS
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label" htmlFor="crearApertura">Apertura</label>
              <input
                id="crearApertura"
                type="time"
                className="input"
                value={horaApertura}
                onChange={(e) => setHoraApertura(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="crearCierre">Cierre</label>
              <input
                id="crearCierre"
                type="time"
                className="input"
                value={horaCierre}
                onChange={(e) => setHoraCierre(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="crearIntervalo">Intervalo</label>
              <select
                id="crearIntervalo"
                className="input"
                value={intervaloMinutos}
                onChange={(e) => setIntervaloMinutos(Number(e.target.value))}
              >
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 flex gap-3">
          <button type="button" onClick={onCerrar} className="btn btn-secundario flex-1">
            Cancelar
          </button>
          <button type="submit" disabled={cargando} className="btn btn-primario flex-1">
            {cargando ? 'Creando Salón...' : 'Crear Salón'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function ModalEditarSalon({ salon, onCerrar, onActualizado }) {
  const [nombre, setNombre] = useState(salon.nombre || '')
  const [slug, setSlug] = useState(salon.slug || '')
  const [plan, setPlan] = useState(salon.plan || 'free')
  const [direccion, setDireccion] = useState(salon.direccion || '')
  const [telefono, setTelefono] = useState(salon.telefono || '')

  const cfg = salon.configuracion || {}
  const [horaApertura, setHoraApertura] = useState(cfg.horaApertura || '09:00')
  const [horaCierre, setHoraCierre] = useState(cfg.horaCierre || '20:00')
  const [intervaloMinutos, setIntervaloMinutos] = useState(cfg.intervaloMinutos || 30)
  const [bufferMinutos, setBufferMinutos] = useState(cfg.bufferMinutos || 0)
  const [cancelacionMinimaHoras, setCancelacionMinimaHoras] = useState(cfg.cancelacionMinimaHoras || 2)

  const [cargando, setCargando] = useState(false)
  const [errorLocal, setErrorLocal] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setErrorLocal('')
    setCargando(true)

    try {
      await actualizarNegocioSuperadminAPI(salon._id, {
        nombre: nombre.trim(),
        slug: slug.trim().toLowerCase(),
        plan,
        direccion: direccion.trim(),
        telefono: telefono.trim(),
        configuracion: {
          ...cfg,
          horaApertura,
          horaCierre,
          intervaloMinutos: Number(intervaloMinutos),
          bufferMinutos: Number(bufferMinutos),
          cancelacionMinimaHoras: Number(cancelacionMinimaHoras),
        },
      })
      onActualizado()
    } catch (err) {
      setErrorLocal(err.response?.data?.error || 'Error al actualizar salón')
    } finally {
      setCargando(false)
    }
  }

  return (
    <Modal abierto={true} onCerrar={onCerrar} titulo={`CONFIGURAR SALÓN — ${salon.nombre}`}>
      <form onSubmit={onSubmit} className="space-y-6">
        {errorLocal && (
          <div className="p-3 border border-rose-500/30 text-rose-300 font-mono text-xs uppercase">
            {errorLocal}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="editNombre">Nombre del Salón</label>
              <input
                id="editNombre"
                type="text"
                className="input"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="editSlug">Slug Identificador</label>
              <input
                id="editSlug"
                type="text"
                className="input font-mono"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                required
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="label" htmlFor="editPlan">Plan</label>
              <select
                id="editPlan"
                className="input"
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
              >
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="editTel">Teléfono</label>
              <input
                id="editTel"
                type="tel"
                className="input"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="editDir">Dirección</label>
              <input
                id="editDir"
                type="text"
                className="input"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-white/10">
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">
            — PARÁMETROS OPERATIVOS
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="label" htmlFor="editApertura">Apertura</label>
              <input
                id="editApertura"
                type="time"
                className="input"
                value={horaApertura}
                onChange={(e) => setHoraApertura(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="editCierre">Cierre</label>
              <input
                id="editCierre"
                type="time"
                className="input"
                value={horaCierre}
                onChange={(e) => setHoraCierre(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="editIntervalo">Intervalo</label>
              <select
                id="editIntervalo"
                className="input"
                value={intervaloMinutos}
                onChange={(e) => setIntervaloMinutos(Number(e.target.value))}
              >
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="editCancel">Cancelación</label>
              <select
                id="editCancel"
                className="input"
                value={cancelacionMinimaHoras}
                onChange={(e) => setCancelacionMinimaHoras(Number(e.target.value))}
              >
                <option value={1}>1 hora</option>
                <option value={2}>2 horas</option>
                <option value={4}>4 horas</option>
                <option value={6}>6 horas</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 flex gap-3">
          <button type="button" onClick={onCerrar} className="btn btn-secundario flex-1">
            Cancelar
          </button>
          <button type="submit" disabled={cargando} className="btn btn-primario flex-1">
            {cargando ? 'Guardando...' : 'Actualizar Salón'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
