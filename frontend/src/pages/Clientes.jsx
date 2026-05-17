// Página de Clientes.
// Layout vertical: lista de filas con franja lateral coloreada por inicial.
// Buscador con debounce simple — espera 300ms tras el último tipeo antes
// de pedir al backend para no inundarlo de requests.

import { useState, useEffect, useMemo } from 'react'
import {
  listarClientesAPI,
  crearClienteAPI,
  actualizarClienteAPI,
  eliminarClienteAPI,
} from '../api/clientes.api.js'
import { useFetch } from '../hooks/useFetch.js'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../hooks/useToast.js'
import { listarUsuariosAPI } from '../api/usuarios.api.js'
import { Modal } from '../components/Modal.jsx'
import { ModalConfirmacion } from '../components/ModalConfirmacion.jsx'

export default function Clientes() {
  const { usuario } = useAuth()
  const toast = useToast()
  const esAdmin = usuario?.rol === 'admin'

  // Buscador con debounce. "busquedaInput" es lo que tipea el usuario en
  // tiempo real; "busqueda" es lo que efectivamente le mandamos al backend,
  // y se actualiza 300ms después de que dejó de tipear.
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
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <p className="font-mono text-xs uppercase text-negro/60 tracking-tight">Base de</p>
          <h1 className="text-5xl md:text-7xl font-display font-bold uppercase tracking-tighter leading-none">
            Clientes.
          </h1>
        </div>
        <button onClick={abrirNuevo} className="btn btn-aceptar">
          + Nuevo cliente
        </button>
      </div>

      <div className="mb-6">
        <input
          type="search"
          placeholder="Buscar por nombre o email..."
          value={busquedaInput}
          onChange={(e) => setBusquedaInput(e.target.value)}
          className="input"
        />
      </div>

      {cargando && <p className="font-mono uppercase">Cargando...</p>}
      {error && (
        <div className="card !p-4 bg-rojo-faro text-white font-mono uppercase">
          Error al cargar clientes
        </div>
      )}

      {clientes && clientes.length === 0 && (
        <div className="card text-center">
          <p className="font-display text-2xl uppercase mb-2">
            {busqueda ? 'No encontramos clientes con esa búsqueda' : 'No hay clientes cargados'}
          </p>
        </div>
      )}

      {clientes && clientes.length > 0 && (
        <ul className="flex flex-col gap-3">
          {clientes.map((c) => (
            <FilaCliente
              key={c._id}
              cliente={c}
              esAdmin={esAdmin}
              onEditar={() => abrirEditar(c)}
              onEliminar={() => setPidiendoEliminar(c)}
            />
          ))}
        </ul>
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

// Mapea la primera letra del nombre a un color de la paleta para la franja.
// A-G rojo, H-N azul, O-T negro, U-Z crema. Es estable: el mismo nombre
// siempre cae al mismo color.
const colorPorInicial = (nombre = '') => {
  const c = nombre.trim().charAt(0).toUpperCase()
  if (c >= 'A' && c <= 'G') return 'bg-rojo-faro text-white'
  if (c >= 'H' && c <= 'N') return 'bg-azul-faro text-white'
  if (c >= 'O' && c <= 'T') return 'bg-negro text-white'
  return 'bg-crema text-negro'
}

function FilaCliente({ cliente, esAdmin, onEditar, onEliminar }) {
  const claseFranja = useMemo(() => colorPorInicial(cliente.nombre), [cliente.nombre])
  const inicial = cliente.nombre?.trim().charAt(0).toUpperCase() || '?'

  return (
    <li className="card !p-0 flex hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-bruta-lg transition-all duration-100">
      <div
        className={`${claseFranja} w-16 lg:w-24 flex items-center justify-center font-display font-bold text-3xl lg:text-5xl uppercase border-r-3 border-negro shrink-0`}
      >
        {inicial}
      </div>
      <div className="flex-1 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-xl uppercase tracking-tight leading-tight truncate">
            {cliente.nombre}
          </h3>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
            {cliente.email && (
              <p className="font-mono text-xs text-negro/70 truncate">{cliente.email}</p>
            )}
            {cliente.telefono && (
              <p className="font-mono text-xs text-negro/70">{cliente.telefono}</p>
            )}
          </div>
          {cliente.notas && (
            <p className="font-sans text-sm mt-1 line-clamp-1">{cliente.notas}</p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={onEditar} className="btn btn-secundario !px-3 !py-2 text-xs">
            Editar
          </button>
          {esAdmin && (
            <button onClick={onEliminar} className="btn btn-peligro !px-3 !py-2 text-xs">
              Eliminar
            </button>
          )}
        </div>
      </div>
    </li>
  )
}

function FormCliente({ inicial, onCancelar, onGuardado }) {
  const esEdicion = !!inicial
  const { usuario } = useAuth()
  const esAdmin = usuario?.rol === 'admin'

  // Igual que en Empleados: solo admin ve el dropdown porque /api/usuarios
  // es admin-only. Para empleados el campo "usuario" queda como el inicial
  // (no lo pueden cambiar desde la UI).
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
        <div className="border-3 border-negro bg-rojo-faro text-white px-4 py-3 font-mono text-sm uppercase">
          {errorGlobal}
        </div>
      )}

      <div>
        <label className="label" htmlFor="nombre">Nombre</label>
        <input id="nombre" type="text" className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        {errores.nombre && <p className="font-mono text-xs text-rojo-faro mt-2 uppercase">{errores.nombre}</p>}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          {errores.email && <p className="font-mono text-xs text-rojo-faro mt-2 uppercase">{errores.email}</p>}
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
          placeholder="Alergias, preferencias, color favorito..."
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
        />
      </div>

      {esAdmin && (
        <div>
          <label className="label" htmlFor="usuarioVinc">
            Cuenta vinculada <span className="text-negro/60 normal-case font-mono text-[10px]">(opcional — permite al cliente ver sus turnos)</span>
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
