import { useState } from 'react'
import {
  listarServiciosAPI,
  crearServicioAPI,
  actualizarServicioAPI,
  eliminarServicioAPI,
} from '../api/servicios.api.js'
import { useFetch } from '../hooks/useFetch.js'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../hooks/useToast.js'
import { usePaginacion } from '../hooks/usePaginacion.js'
import { Modal } from '../components/Modal.jsx'
import { ModalConfirmacion } from '../components/ModalConfirmacion.jsx'
import { Paginacion } from '../components/Paginacion.jsx'

export default function Servicios() {
  const { usuario } = useAuth()
  const toast = useToast()
  const esAdmin = usuario?.rol === 'admin'
  const { datos: servicios, cargando, error, recargar } = useFetch(() => listarServiciosAPI())
  const { visibles: pagina, pagina: nPagina, setPagina, totalPaginas } = usePaginacion(servicios, 15)

  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [pidiendoEliminar, setPidiendoEliminar] = useState(null)

  const abrirNuevo = () => {
    setEditando(null)
    setModalAbierto(true)
  }
  const abrirEditar = (servicio) => {
    setEditando(servicio)
    setModalAbierto(true)
  }
  const cerrarModal = () => {
    setModalAbierto(false)
    setEditando(null)
  }

  const confirmarEliminar = async () => {
    const servicio = pidiendoEliminar
    try {
      await eliminarServicioAPI(servicio._id)
      setPidiendoEliminar(null)
      recargar()
      toast.exito(`"${servicio.nombre}" eliminado`)
    } catch (e) {
      setPidiendoEliminar(null)
      toast.error(e.response?.data?.error || 'No se pudo eliminar')
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-500 mb-1">
            — CATÁLOGO DE TRABAJOS
          </p>
          <h1 className="text-4xl sm:text-6xl font-mono font-medium tracking-tight text-white uppercase leading-none">
            SERVICIOS.
          </h1>
        </div>
        {esAdmin && (
          <button onClick={abrirNuevo} className="btn btn-primario self-start sm:self-auto">
            + Nuevo servicio
          </button>
        )}
      </div>

      {cargando && <p className="font-mono text-xs uppercase text-neutral-500 animate-pulse">Cargando...</p>}
      {error && (
        <div className="p-4 border border-rose-500/30 text-rose-300 font-mono text-xs uppercase">
          Error al cargar servicios
        </div>
      )}

      {servicios && servicios.length === 0 && (
        <div className="py-12 border border-white/10 text-center">
          <p className="font-mono text-sm uppercase text-neutral-400">No hay servicios cargados</p>
        </div>
      )}

      {servicios && servicios.length > 0 && (
        <div className="space-y-6">
          <ul className="divide-y divide-white/10 border-t border-b border-white/10">
            {pagina.map((s) => (
              <FilaServicio
                key={s._id}
                servicio={s}
                esAdmin={esAdmin}
                onEditar={() => abrirEditar(s)}
                onEliminar={() => setPidiendoEliminar(s)}
              />
            ))}
          </ul>
          <Paginacion pagina={nPagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
        </div>
      )}

      <Modal
        abierto={modalAbierto}
        onCerrar={cerrarModal}
        titulo={editando ? 'Editar servicio' : 'Nuevo servicio'}
      >
        <FormServicio
          inicial={editando}
          onCancelar={cerrarModal}
          onGuardado={() => {
            const fueEdicion = !!editando
            cerrarModal()
            recargar()
            toast.exito(fueEdicion ? 'Servicio actualizado' : 'Servicio creado')
          }}
        />
      </Modal>

      <ModalConfirmacion
        abierto={!!pidiendoEliminar}
        onCerrar={() => setPidiendoEliminar(null)}
        onConfirmar={confirmarEliminar}
        titulo="Eliminar servicio"
        mensaje={`¿Seguro que querés eliminar "${pidiendoEliminar?.nombre}"? Esta acción no se puede deshacer.`}
        textoConfirmar="Eliminar"
        peligro
      />
    </div>
  )
}

function FilaServicio({ servicio, esAdmin, onEditar, onEliminar }) {
  return (
    <li className="py-5 px-2 hover:bg-white/[0.02] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-mono font-medium text-lg uppercase tracking-tight leading-tight text-white truncate">
            {servicio.nombre}
          </h3>
          {!servicio.activo && (
            <span className="badge badge-cancelado shrink-0">Inactivo</span>
          )}
        </div>
        {servicio.descripcion && (
          <p className="font-sans text-xs text-neutral-400 mb-2 line-clamp-2 max-w-2xl font-light">
            {servicio.descripcion}
          </p>
        )}
        <div className="flex items-center gap-3 font-mono text-xs text-neutral-500">
          <span>{servicio.duracionMinutos} MIN</span>
          <span>·</span>
          <span className="text-white font-semibold">${servicio.precio?.toLocaleString('es-AR')}</span>
        </div>
      </div>

      {esAdmin && (
        <div className="flex gap-2 shrink-0 items-center">
          <button onClick={onEditar} className="btn btn-secundario !px-3 !py-1.5 text-xs">
            Editar
          </button>
          <button onClick={onEliminar} className="btn btn-peligro !px-3 !py-1.5 text-xs">
            Eliminar
          </button>
        </div>
      )}
    </li>
  )
}

function FormServicio({ inicial, onCancelar, onGuardado }) {
  const esEdicion = !!inicial
  const [nombre, setNombre] = useState(inicial?.nombre || '')
  const [descripcion, setDescripcion] = useState(inicial?.descripcion || '')
  const [precio, setPrecio] = useState(inicial?.precio ?? '')
  const [duracion, setDuracion] = useState(inicial?.duracionMinutos ?? '')
  const [activo, setActivo] = useState(inicial?.activo ?? true)
  const [errores, setErrores] = useState({})
  const [errorGlobal, setErrorGlobal] = useState('')
  const [enviando, setEnviando] = useState(false)

  const validar = () => {
    const errs = {}
    if (!nombre.trim()) errs.nombre = 'El nombre es obligatorio'
    if (precio === '' || isNaN(Number(precio))) errs.precio = 'Precio inválido'
    else if (Number(precio) < 0) errs.precio = 'No puede ser negativo'
    if (duracion === '' || isNaN(Number(duracion))) errs.duracion = 'Duración inválida'
    else if (Number(duracion) < 5) errs.duracion = 'Mínimo 5 minutos'
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
        descripcion: descripcion.trim(),
        precio: Number(precio),
        duracionMinutos: Number(duracion),
        activo,
      }
      if (esEdicion) await actualizarServicioAPI(inicial._id, payload)
      else await crearServicioAPI(payload)
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
        <label className="label" htmlFor="descripcion">Descripción</label>
        <textarea
          id="descripcion"
          className="input min-h-[100px] resize-y"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="precio">Precio ($)</label>
          <input
            id="precio"
            type="number"
            step="1"
            min="0"
            className="input"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
          />
          {errores.precio && <p className="font-mono text-xs text-rose-400 mt-2 uppercase">{errores.precio}</p>}
        </div>
        <div>
          <label className="label" htmlFor="duracion">Duración (min)</label>
          <input
            id="duracion"
            type="number"
            step="5"
            min="5"
            className="input"
            value={duracion}
            onChange={(e) => setDuracion(e.target.value)}
          />
          {errores.duracion && <p className="font-mono text-xs text-rose-400 mt-2 uppercase">{errores.duracion}</p>}
        </div>
      </div>

      <label className="flex items-center gap-3 cursor-pointer pt-2">
        <input
          type="checkbox"
          checked={activo}
          onChange={(e) => setActivo(e.target.checked)}
          className="w-4 h-4 rounded-none accent-white cursor-pointer"
        />
        <span className="font-mono text-xs uppercase tracking-wider text-neutral-300">Servicio activo</span>
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
