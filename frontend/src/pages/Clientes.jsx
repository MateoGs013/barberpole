import { useState, useEffect } from 'react'
import {
  listarClientesAPI,
  crearClienteAPI,
  actualizarClienteAPI,
  eliminarClienteAPI,
} from '../api/clientes.api.js'
import { useFetch } from '../hooks/useFetch.js'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../hooks/useToast.js'
import { usePaginacion } from '../hooks/usePaginacion.js'
import { listarUsuariosAPI } from '../api/usuarios.api.js'
import { Modal } from '../components/Modal.jsx'
import { ModalConfirmacion } from '../components/ModalConfirmacion.jsx'
import { Paginacion } from '../components/Paginacion.jsx'

export default function Clientes() {
  const { usuario } = useAuth()
  const toast = useToast()
  const esAdmin = usuario?.rol === 'admin'

  const [busquedaInput, setBusquedaInput] = useState('')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setBusqueda(busquedaInput), 300)
    return () => clearTimeout(t)
  }, [busquedaInput])

  const { datos: clientes, cargando, error, recargar } = useFetch(
    () => listarClientesAPI({ q: busqueda }),
    [busqueda]
  )
  const { visibles: pagina, pagina: nPagina, setPagina, totalPaginas } = usePaginacion(clientes, 15)

  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [pidiendoEliminar, setPidiendoEliminar] = useState(null)

  const abrirNuevo = () => {
    setEditando(null)
    setModalAbierto(true)
  }
  const abrirEditar = (cliente) => {
    setEditando(cliente)
    setModalAbierto(true)
  }
  const cerrarModal = () => {
    setModalAbierto(false)
    setEditando(null)
  }

  const confirmarEliminar = async () => {
    const cliente = pidiendoEliminar
    try {
      await eliminarClienteAPI(cliente._id)
      setPidiendoEliminar(null)
      recargar()
      toast.exito(`"${cliente.nombre}" eliminado`)
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
            — BASE DE DATOS
          </p>
          <h1 className="text-4xl sm:text-6xl font-mono font-medium tracking-tight text-white uppercase leading-none">
            CLIENTES.
          </h1>
        </div>
        <button onClick={abrirNuevo} className="btn btn-primario self-start sm:self-auto">
          + Nuevo cliente
        </button>
      </div>

      <div className="w-full">
        <input
          type="search"
          placeholder="Buscar por nombre o email..."
          value={busquedaInput}
          onChange={(e) => setBusquedaInput(e.target.value)}
          className="input"
        />
      </div>

      {cargando && <p className="font-mono text-xs uppercase text-neutral-500 animate-pulse">Cargando...</p>}
      {error && (
        <div className="p-4 border border-rose-500/30 text-rose-300 font-mono text-xs uppercase">
          Error al cargar clientes
        </div>
      )}

      {clientes && clientes.length === 0 && (
        <div className="py-12 border border-white/10 text-center">
          <p className="font-mono text-sm uppercase text-neutral-400">
            {busqueda ? 'No encontramos clientes con esa búsqueda' : 'No hay clientes cargados'}
          </p>
        </div>
      )}

      {clientes && clientes.length > 0 && (
        <div className="space-y-6">
          <ul className="divide-y divide-white/10 border-t border-b border-white/10">
            {pagina.map((c) => (
              <FilaCliente
                key={c._id}
                cliente={c}
                esAdmin={esAdmin}
                onEditar={() => abrirEditar(c)}
                onEliminar={() => setPidiendoEliminar(c)}
              />
            ))}
          </ul>
          <Paginacion pagina={nPagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
        </div>
      )}

      <Modal
        abierto={modalAbierto}
        onCerrar={cerrarModal}
        titulo={editando ? 'Editar cliente' : 'Nuevo cliente'}
      >
        <FormCliente
          inicial={editando}
          onCancelar={cerrarModal}
          onGuardado={() => {
            const fueEdicion = !!editando
            cerrarModal()
            recargar()
            toast.exito(fueEdicion ? 'Cliente actualizado' : 'Cliente creado')
          }}
        />
      </Modal>

      <ModalConfirmacion
        abierto={!!pidiendoEliminar}
        onCerrar={() => setPidiendoEliminar(null)}
        onConfirmar={confirmarEliminar}
        titulo="Eliminar cliente"
        mensaje={`¿Seguro que querés eliminar a "${pidiendoEliminar?.nombre}"? Esta acción no se puede deshacer.`}
        textoConfirmar="Eliminar"
        peligro
      />
    </div>
  )
}

function FilaCliente({ cliente, esAdmin, onEditar, onEliminar }) {
  return (
    <li className="py-4 px-2 hover:bg-white/[0.02] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <h3 className="font-mono font-medium text-lg uppercase tracking-tight leading-tight text-white truncate">
          {cliente.nombre}
        </h3>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 font-mono text-xs text-neutral-400">
          {cliente.email && <span>{cliente.email}</span>}
          {cliente.telefono && <span>· {cliente.telefono}</span>}
        </div>
        {cliente.notas && (
          <p className="font-mono text-xs mt-1 text-neutral-500 line-clamp-1">{cliente.notas}</p>
        )}
      </div>
      <div className="flex gap-2 shrink-0 items-center">
        <button onClick={onEditar} className="btn btn-secundario !px-3 !py-1.5 text-xs">
          Editar
        </button>
        {esAdmin && (
          <button onClick={onEliminar} className="btn btn-peligro !px-3 !py-1.5 text-xs">
            Eliminar
          </button>
        )}
      </div>
    </li>
  )
}

function FormCliente({ inicial, onCancelar, onGuardado }) {
  const esEdicion = !!inicial
  const { usuario } = useAuth()
  const esAdmin = usuario?.rol === 'admin'

  const { datos: todosUsuarios } = useFetch(
    () => (esAdmin ? listarUsuariosAPI() : Promise.resolve([])),
    [esAdmin]
  )
  const usuariosCandidatos = (todosUsuarios || []).filter((u) => u.rol === 'cliente')

  const [nombre, setNombre] = useState(inicial?.nombre || '')
  const [email, setEmail] = useState(inicial?.email || '')
  const [telefono, setTelefono] = useState(inicial?.telefono || '')
  const [notas, setNotas] = useState(inicial?.notas || '')
  const [usuarioId, setUsuarioId] = useState(inicial?.usuario?._id || inicial?.usuario || '')
  const [errores, setErrores] = useState({})
  const [errorGlobal, setErrorGlobal] = useState('')
  const [enviando, setEnviando] = useState(false)

  const validar = () => {
    const errs = {}
    if (!nombre.trim()) errs.nombre = 'El nombre es obligatorio'
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
        email: email.trim(),
        telefono: telefono.trim(),
        notas: notas.trim(),
        usuario: usuarioId || null,
      }
      if (esEdicion) await actualizarClienteAPI(inicial._id, payload)
      else await crearClienteAPI(payload)
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

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          {errores.email && <p className="font-mono text-xs text-rose-400 mt-2 uppercase">{errores.email}</p>}
        </div>
        <div>
          <label className="label" htmlFor="telefono">Teléfono</label>
          <input id="telefono" type="tel" className="input" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="notas">Notas</label>
        <textarea
          id="notas"
          className="input min-h-[80px] resize-y"
          placeholder="Alergias, preferencias, etc..."
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
        />
      </div>

      {esAdmin && (
        <div>
          <label className="label" htmlFor="usuarioVinc">
            Cuenta vinculada <span className="text-neutral-500 normal-case font-mono text-[10px]">(opcional — permite al cliente ver sus turnos)</span>
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
