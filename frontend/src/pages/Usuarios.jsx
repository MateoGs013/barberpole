import { useState } from 'react'
import {
  listarUsuariosAPI,
  crearUsuarioAPI,
  actualizarUsuarioAPI,
  eliminarUsuarioAPI,
} from '../api/usuarios.api.js'
import { useFetch } from '../hooks/useFetch.js'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../hooks/useToast.js'
import { usePaginacion } from '../hooks/usePaginacion.js'
import { Modal } from '../components/Modal.jsx'
import { ModalConfirmacion } from '../components/ModalConfirmacion.jsx'
import { Paginacion } from '../components/Paginacion.jsx'

export default function Usuarios() {
  const { usuario: yo } = useAuth()
  const toast = useToast()
  const { datos: usuarios, cargando, error, recargar } = useFetch(() => listarUsuariosAPI())
  const { visibles: pagina, pagina: nPagina, setPagina, totalPaginas } = usePaginacion(usuarios, 15)

  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [pidiendoEliminar, setPidiendoEliminar] = useState(null)

  const abrirNuevo = () => {
    setEditando(null)
    setModalAbierto(true)
  }
  const abrirEditar = (u) => {
    setEditando(u)
    setModalAbierto(true)
  }
  const cerrarModal = () => {
    setModalAbierto(false)
    setEditando(null)
  }

  const confirmarEliminar = async () => {
    const u = pidiendoEliminar
    try {
      await eliminarUsuarioAPI(u._id)
      setPidiendoEliminar(null)
      recargar()
      toast.exito(`"${u.nombre}" eliminado`)
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
            — GESTIÓN DE ACCESOS
          </p>
          <h1 className="text-4xl sm:text-6xl font-mono font-medium tracking-tight text-white uppercase leading-none">
            USUARIOS.
          </h1>
        </div>
        <button onClick={abrirNuevo} className="btn btn-primario self-start sm:self-auto">
          + Nuevo usuario
        </button>
      </div>

      {cargando && <p className="font-mono text-xs uppercase text-neutral-500 animate-pulse">Cargando...</p>}
      {error && (
        <div className="p-4 border border-rose-500/30 text-rose-300 font-mono text-xs uppercase">
          Error al cargar usuarios
        </div>
      )}

      {usuarios && usuarios.length === 0 && (
        <div className="py-12 border border-white/10 text-center">
          <p className="font-mono text-sm uppercase text-neutral-400">No hay usuarios cargados</p>
        </div>
      )}

      {usuarios && usuarios.length > 0 && (
        <div className="space-y-6">
          <ul className="divide-y divide-white/10 border-t border-b border-white/10">
            {pagina.map((u) => (
              <FilaUsuario
                key={u._id}
                usuario={u}
                esYo={u._id === yo?.id}
                onEditar={() => abrirEditar(u)}
                onEliminar={() => setPidiendoEliminar(u)}
              />
            ))}
          </ul>
          <Paginacion pagina={nPagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
        </div>
      )}

      <Modal
        abierto={modalAbierto}
        onCerrar={cerrarModal}
        titulo={editando ? 'Editar usuario' : 'Nuevo usuario'}
      >
        <FormUsuario
          inicial={editando}
          onCancelar={cerrarModal}
          onGuardado={() => {
            const fueEdicion = !!editando
            cerrarModal()
            recargar()
            toast.exito(fueEdicion ? 'Usuario actualizado' : 'Usuario creado')
          }}
        />
      </Modal>

      <ModalConfirmacion
        abierto={!!pidiendoEliminar}
        onCerrar={() => setPidiendoEliminar(null)}
        onConfirmar={confirmarEliminar}
        titulo="Eliminar usuario"
        mensaje={`¿Seguro que querés eliminar a "${pidiendoEliminar?.nombre}"? Si tenía un Empleado o Cliente vinculado, esos quedarán sin cuenta.`}
        textoConfirmar="Eliminar"
        peligro
      />
    </div>
  )
}

function FilaUsuario({ usuario, esYo, onEditar, onEliminar }) {
  return (
    <li className="py-4 px-2 hover:bg-white/[0.02] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-mono font-medium text-lg uppercase tracking-tight leading-tight text-white truncate">
            {usuario.nombre}
          </h3>
          {esYo && (
            <span className="badge badge-confirmado text-[10px]">Vos</span>
          )}
          <span className="badge uppercase">
            {usuario.rol}
          </span>
        </div>
        <p className="font-mono text-xs text-neutral-400">
          {usuario.email}
        </p>
      </div>

      <div className="flex gap-2 shrink-0 items-center">
        <button onClick={onEditar} className="btn btn-secundario !px-3 !py-1.5 text-xs">
          Editar
        </button>
        {!esYo && (
          <button onClick={onEliminar} className="btn btn-peligro !px-3 !py-1.5 text-xs">
            Eliminar
          </button>
        )}
      </div>
    </li>
  )
}

function FormUsuario({ inicial, onCancelar, onGuardado }) {
  const esEdicion = !!inicial
  const [nombre, setNombre] = useState(inicial?.nombre || '')
  const [email, setEmail] = useState(inicial?.email || '')
  const [password, setPassword] = useState('')
  const [rol, setRol] = useState(inicial?.rol || 'cliente')
  const [errores, setErrores] = useState({})
  const [errorGlobal, setErrorGlobal] = useState('')
  const [enviando, setEnviando] = useState(false)

  const validar = () => {
    const errs = {}
    if (!nombre.trim()) errs.nombre = 'El nombre es obligatorio'
    else if (nombre.trim().length < 2) errs.nombre = 'Mínimo 2 caracteres'
    if (!email.trim()) errs.email = 'El email es obligatorio'
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Email inválido'
    if (!esEdicion && !password) errs.password = 'Ingresá una contraseña'
    else if (password && password.length < 6) errs.password = 'Mínimo 6 caracteres'
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
      const payload = { nombre: nombre.trim(), email: email.trim(), rol }
      if (password) payload.password = password
      if (esEdicion) await actualizarUsuarioAPI(inicial._id, payload)
      else await crearUsuarioAPI(payload)
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
        <label className="label" htmlFor="email">Email</label>
        <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        {errores.email && <p className="font-mono text-xs text-rose-400 mt-2 uppercase">{errores.email}</p>}
      </div>

      <div>
        <label className="label" htmlFor="password">
          Contraseña {esEdicion && <span className="text-neutral-500 normal-case font-mono text-[10px]">(opcional — dejar vacío para mantener)</span>}
        </label>
        <input
          id="password"
          type="password"
          className="input"
          placeholder={esEdicion ? 'Vacío para no cambiarla' : 'Mínimo 6 caracteres'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
        {errores.password && <p className="font-mono text-xs text-rose-400 mt-2 uppercase">{errores.password}</p>}
      </div>

      <div>
        <label className="label" htmlFor="rol">Rol</label>
        <select id="rol" className="input" value={rol} onChange={(e) => setRol(e.target.value)}>
          <option value="cliente">Cliente</option>
          <option value="empleado">Empleado</option>
          <option value="admin">Administrador</option>
        </select>
      </div>

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
