// Página de Empleados.
// Layout "stickers": cada card tiene una pequeña rotación + offset determinístico
// según su _id, así parece pegado a una pared. Al hover se endereza.

import { useState } from 'react'
import {
  listarEmpleadosAPI,
  crearEmpleadoAPI,
  actualizarEmpleadoAPI,
  eliminarEmpleadoAPI,
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
  const { visibles: pagina, pagina: nPagina, setPagina, totalPaginas } = usePaginacion(empleados, 12)

  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [pidiendoEliminar, setPidiendoEliminar] = useState(null)

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
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <p className="font-mono text-xs uppercase text-negro/60 tracking-tight">
            Equipo
          </p>
          <h1 className="text-5xl md:text-7xl font-display font-bold uppercase tracking-tighter leading-none">
            Empleados.
          </h1>
        </div>
        <button onClick={abrirNuevo} className="btn btn-aceptar">
          + Nuevo empleado
        </button>
      </div>

      {cargando && <p className="font-mono uppercase">Cargando...</p>}
      {error && (
        <div className="card !p-4 bg-rojo-faro text-white font-mono uppercase">
          Error al cargar empleados
        </div>
      )}

      {empleados && empleados.length === 0 && (
        <div className="card text-center">
          <p className="font-display text-2xl uppercase mb-2">No hay empleados cargados</p>
          <p className="font-mono text-sm">Apretá "+ Nuevo empleado" para empezar</p>
        </div>
      )}

      {empleados && empleados.length > 0 && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10 py-4">
            {pagina.map((emp, i) => (
              <CardEmpleado
                key={emp._id}
                empleado={emp}
                indice={i}
                onEditar={() => abrirEditar(emp)}
                onEliminar={() => setPidiendoEliminar(emp)}
              />
            ))}
          </div>
          <Paginacion pagina={nPagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
        </>
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
    </div>
  )
}

// Determinista por índice — no random, así no se mueve en cada render.
const ROTACIONES = ['-rotate-2', '-rotate-1', 'rotate-1', 'rotate-2']
const COLORES_FRANJA = ['bg-rojo-faro', 'bg-azul-faro', 'bg-negro', 'bg-azul-faro', 'bg-rojo-faro']

function CardEmpleado({ empleado, indice, onEditar, onEliminar }) {
  const rotacion = ROTACIONES[indice % ROTACIONES.length]
  const colorFranja = COLORES_FRANJA[indice % COLORES_FRANJA.length]
  return (
    <article
      className={`card !p-0 ${rotacion} hover:rotate-0 hover:scale-[1.02] transition-transform duration-150`}
    >
      <div className={`${colorFranja} px-5 py-3 border-b-3 border-negro`}>
        <p className="font-mono text-xs uppercase text-white/80 tracking-tight">
          {empleado.activo ? 'Activo' : 'Inactivo'}
        </p>
        <p className="font-display font-bold text-white text-xl uppercase tracking-tighter leading-tight line-clamp-2 break-words">
          {empleado.especialidad}
        </p>
      </div>
      <div className="p-5 space-y-2">
        <h3 className="font-display font-bold text-2xl uppercase tracking-tight leading-tight line-clamp-2 break-words">
          {empleado.nombre}
        </h3>
        {empleado.email && (
          <p className="font-mono text-xs truncate">{empleado.email}</p>
        )}
        {empleado.telefono && (
          <p className="font-mono text-xs truncate">{empleado.telefono}</p>
        )}
        {empleado.usuario && (
          <span className="badge badge-confirmado mt-2 inline-block">Tiene cuenta</span>
        )}
      </div>
      <div className="flex gap-2 p-4 pt-0">
        <button onClick={onEditar} className="btn btn-secundario !px-3 !py-2 text-xs flex-1">
          Editar
        </button>
        <button onClick={onEliminar} className="btn btn-peligro !px-3 !py-2 text-xs">
          Eliminar
        </button>
      </div>
    </article>
  )
}

function FormEmpleado({ inicial, onCancelar, onGuardado }) {
  const esEdicion = !!inicial
  const { usuario } = useAuth()
  const esAdmin = usuario?.rol === 'admin'

  // Solo el admin puede ver la lista de usuarios y vincular. El endpoint
  // /api/usuarios es admin-only, así que si es empleado le mandamos un
  // promise vacío para no disparar un 403.
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
        <label className="label" htmlFor="especialidad">Especialidad</label>
        <input
          id="especialidad"
          type="text"
          className="input"
          placeholder="Ej: Coloración, Corte caballero, Barbería..."
          value={especialidad}
          onChange={(e) => setEspecialidad(e.target.value)}
        />
        {errores.especialidad && <p className="font-mono text-xs text-rojo-faro mt-2 uppercase">{errores.especialidad}</p>}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="telefono">Teléfono</label>
          <input id="telefono" type="tel" className="input" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          {errores.email && <p className="font-mono text-xs text-rojo-faro mt-2 uppercase">{errores.email}</p>}
        </div>
      </div>

      {esAdmin && (
        <div>
          <label className="label" htmlFor="usuarioVinc">
            Cuenta vinculada <span className="text-negro/60 normal-case font-mono text-[10px]">(opcional — permite que el empleado se loguee)</span>
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
          {usuariosCandidatos.length === 0 && (
            <p className="font-mono text-xs text-negro/60 mt-2">
              No hay usuarios con rol "empleado" disponibles. Crealos desde /usuarios.
            </p>
          )}
        </div>
      )}

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={activo}
          onChange={(e) => setActivo(e.target.checked)}
          className="w-5 h-5 border-3 border-negro accent-azul-faro"
        />
        <span className="font-mono text-sm uppercase tracking-tight">Empleado activo</span>
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
