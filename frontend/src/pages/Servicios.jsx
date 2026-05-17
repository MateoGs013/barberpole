// Página de Servicios.
// Grid de cards con el catálogo. Solo admin puede crear/editar/eliminar.

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
  const { visibles: pagina, pagina: nPagina, setPagina, totalPaginas } = usePaginacion(servicios, 12)

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
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header de página */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <p className="font-mono text-xs uppercase text-negro/60 tracking-tight">
            Catálogo
          </p>
          <h1 className="text-5xl md:text-7xl font-display font-bold uppercase tracking-tighter leading-none">
            Servicios.
          </h1>
        </div>
        {esAdmin && (
          <button onClick={abrirNuevo} className="btn btn-aceptar">
            + Nuevo servicio
          </button>
        )}
      </div>

      {/* Estados de carga / error / vacío */}
      {cargando && <p className="font-mono uppercase">Cargando...</p>}
      {error && (
        <div className="card !p-4 bg-rojo-faro text-white font-mono uppercase">
          Error al cargar servicios
        </div>
      )}

      {servicios && servicios.length === 0 && (
        <div className="card text-center">
          <p className="font-display text-2xl uppercase mb-2">No hay servicios cargados</p>
          {esAdmin && <p className="font-mono text-sm">Apretá "+ Nuevo servicio" para empezar</p>}
        </div>
      )}

      {/* Grid de servicios */}
      {servicios && servicios.length > 0 && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pagina.map((s) => (
              <CardServicio
                key={s._id}
                servicio={s}
                esAdmin={esAdmin}
                onEditar={() => abrirEditar(s)}
                onEliminar={() => setPidiendoEliminar(s)}
              />
            ))}
          </div>
          <Paginacion pagina={nPagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
        </>
      )}

      {/* Modal de form */}
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

function CardServicio({ servicio, esAdmin, onEditar, onEliminar }) {
  return (
    <article className="card hover:rotate-[-1deg] transition-transform duration-150">
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-display font-bold text-2xl uppercase tracking-tight leading-tight line-clamp-2 break-words min-w-0">
          {servicio.nombre}
        </h3>
        {!servicio.activo && (
          <span className="badge badge-cancelado shrink-0">Inactivo</span>
        )}
      </div>
      {servicio.descripcion && (
        <p className="font-sans text-sm text-negro/70 mb-4 line-clamp-3">{servicio.descripcion}</p>
      )}
      <div className="flex items-end justify-between gap-4 mt-auto">
        <div>
          <p className="font-display font-bold text-3xl">${servicio.precio}</p>
          <p className="font-mono text-xs uppercase text-negro/60">
            {servicio.duracionMinutos} min
          </p>
        </div>
      </div>
      {esAdmin && (
        <div className="flex gap-2 mt-4 pt-4 border-t-2 border-negro">
          <button onClick={onEditar} className="btn btn-secundario !px-3 !py-2 text-xs flex-1">
            Editar
          </button>
          <button onClick={onEliminar} className="btn btn-peligro !px-3 !py-2 text-xs">
            Eliminar
          </button>
        </div>
      )}
    </article>
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
        <div className="border-3 border-negro bg-rojo-faro text-white px-4 py-3 font-mono text-sm uppercase">
          {errorGlobal}
        </div>
      )}

      <div>
        <label className="label" htmlFor="nombre">Nombre</label>
        <input id="nombre" type="text" className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        {errores.nombre && <p className="font-mono text-xs text-rojo-faro mt-2 uppercase">{errores.nombre}</p>}
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
          <label className="label" htmlFor="precio">Precio</label>
          <input
            id="precio"
            type="number"
            step="1"
            min="0"
            className="input"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
          />
          {errores.precio && <p className="font-mono text-xs text-rojo-faro mt-2 uppercase">{errores.precio}</p>}
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
          {errores.duracion && <p className="font-mono text-xs text-rojo-faro mt-2 uppercase">{errores.duracion}</p>}
        </div>
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={activo}
          onChange={(e) => setActivo(e.target.checked)}
          className="w-5 h-5 border-3 border-negro accent-azul-faro"
        />
        <span className="font-mono text-sm uppercase tracking-tight">Servicio activo</span>
      </label>

      <div className="flex gap-3 pt-4 border-t-2 border-negro">
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
