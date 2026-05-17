// Página para que un cliente logueado reserve su propio turno.
// Layout tipo "wizard visual" en una sola pantalla: tres secciones (servicio,
// profesional, fecha) y un resumen sticky abajo con el botón de confirmar.
//
// El backend valida en POST /api/turnos que el cliente sea el del usuario
// logueado; acá pasamos el clienteId desde useAuth().miCliente.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFetch } from '../hooks/useFetch.js'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../hooks/useToast.js'
import { listarServiciosAPI } from '../api/servicios.api.js'
import { listarEmpleadosAPI } from '../api/empleados.api.js'
import { crearTurnoAPI } from '../api/turnos.api.js'

export default function Reservar() {
  const { miCliente } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const { datos: servicios } = useFetch(() => listarServiciosAPI({ activos: true }))
  const { datos: empleados } = useFetch(() => listarEmpleadosAPI({ activos: true }))

  const [servicioId, setServicioId] = useState('')
  const [empleadoId, setEmpleadoId] = useState('')
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [errorGlobal, setErrorGlobal] = useState('')

  const servicioElegido = servicios?.find((s) => s._id === servicioId)
  const empleadoElegido = empleados?.find((e) => e._id === empleadoId)

  const sePuedeReservar = servicioId && empleadoId && fecha && hora && miCliente?._id

  const onConfirmar = async () => {
    setErrorGlobal('')
    if (!miCliente?._id) {
      setErrorGlobal('No pudimos cargar tu perfil de cliente. Refrescá la página.')
      return
    }

    // Combinamos fecha (YYYY-MM-DD) + hora (HH:MM) en un Date local y lo
    // convertimos a ISO UTC para mandarlo al backend.
    const fechaHoraLocal = new Date(`${fecha}T${hora}:00`)
    if (isNaN(fechaHoraLocal.getTime())) {
      setErrorGlobal('Fecha u hora inválidas')
      return
    }
    if (fechaHoraLocal.getTime() < Date.now()) {
      setErrorGlobal('No podés reservar un turno en el pasado')
      return
    }

    setEnviando(true)
    try {
      await crearTurnoAPI({
        cliente: miCliente._id,
        empleado: empleadoId,
        servicio: servicioId,
        fechaHora: fechaHoraLocal.toISOString(),
      })
      toast.exito('Turno reservado — te esperamos')
      navigate('/turnos')
    } catch (e) {
      setErrorGlobal(e.response?.data?.error || 'No pudimos reservar el turno')
    } finally {
      setEnviando(false)
    }
  }

  const hoy = new Date().toISOString().slice(0, 10)

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto pb-32">
      <div className="mb-10">
        <p className="font-mono text-xs uppercase text-negro/60 tracking-tight">Nuevo</p>
        <h1 className="text-5xl md:text-7xl font-display font-bold uppercase tracking-tighter leading-none">
          Turno.
        </h1>
        <p className="font-mono text-sm uppercase mt-3 tracking-tight text-negro/70">
          Elegí servicio, profesional y horario.
        </p>
      </div>

      {/* PASO 1: Servicio */}
      <Seccion numero="01" titulo="Elegí el servicio">
        {!servicios && <p className="font-mono">Cargando...</p>}
        {servicios && servicios.length === 0 && (
          <p className="font-mono text-sm uppercase">No hay servicios disponibles</p>
        )}
        {servicios && servicios.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {servicios.filter((s) => s.activo).map((s) => (
              <Seleccionable
                key={s._id}
                seleccionado={s._id === servicioId}
                onClick={() => setServicioId(s._id)}
                color="azul"
              >
                <h3 className="font-display font-bold text-xl uppercase tracking-tight leading-tight">
                  {s.nombre}
                </h3>
                {s.descripcion && (
                  <p className="font-sans text-xs mt-1 opacity-80 line-clamp-2">{s.descripcion}</p>
                )}
                <div className="flex items-end justify-between mt-3 pt-3 border-t-2 border-current">
                  <p className="font-display font-bold text-xl">${s.precio}</p>
                  <p className="font-mono text-[10px] uppercase">{s.duracionMinutos}min</p>
                </div>
              </Seleccionable>
            ))}
          </div>
        )}
      </Seccion>

      {/* PASO 2: Profesional */}
      <Seccion numero="02" titulo="Elegí el profesional">
        {!empleados && <p className="font-mono">Cargando...</p>}
        {empleados && empleados.filter((e) => e.activo).length === 0 && (
          <p className="font-mono text-sm uppercase">No hay profesionales disponibles</p>
        )}
        {empleados && empleados.filter((e) => e.activo).length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {empleados.filter((e) => e.activo).map((e) => (
              <Seleccionable
                key={e._id}
                seleccionado={e._id === empleadoId}
                onClick={() => setEmpleadoId(e._id)}
                color="rojo"
              >
                <h3 className="font-display font-bold text-xl uppercase tracking-tight leading-tight">
                  {e.nombre}
                </h3>
                <p className="font-mono text-xs uppercase mt-1 opacity-80">
                  {e.especialidad}
                </p>
              </Seleccionable>
            ))}
          </div>
        )}
      </Seccion>

      {/* PASO 3: Fecha y hora */}
      <Seccion numero="03" titulo="Elegí fecha y hora">
        <div className="grid sm:grid-cols-2 gap-4 max-w-xl">
          <div>
            <label className="label" htmlFor="fecha">Día</label>
            <input
              id="fecha"
              type="date"
              className="input"
              value={fecha}
              min={hoy}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="hora">Hora</label>
            <input
              id="hora"
              type="time"
              step="600"
              className="input"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
            />
          </div>
        </div>
      </Seccion>

      {/* Resumen sticky abajo */}
      <div className="fixed bottom-0 left-0 right-0 bg-crema border-t-3 border-negro z-30 px-4 py-4 lg:py-5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            {errorGlobal ? (
              <p className="font-mono text-xs uppercase text-rojo-faro">{errorGlobal}</p>
            ) : (
              <p className="font-mono text-xs uppercase tracking-tight">
                <span className="text-negro/60">Resumen:</span>{' '}
                <span className="font-bold">
                  {servicioElegido?.nombre || '— servicio —'} ·{' '}
                  {empleadoElegido?.nombre || '— profesional —'} ·{' '}
                  {fecha && hora ? `${fecha} ${hora}` : '— día y hora —'}
                </span>
              </p>
            )}
          </div>
          <button
            onClick={onConfirmar}
            disabled={!sePuedeReservar || enviando}
            className="btn btn-primario"
          >
            {enviando ? 'Reservando...' : 'Confirmar reserva'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Seccion({ numero, titulo, children }) {
  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <span className="bg-negro text-white font-display font-bold px-3 py-1 text-lg">
          {numero}
        </span>
        <h2 className="font-display font-bold text-2xl md:text-3xl uppercase tracking-tighter">
          {titulo}
        </h2>
      </div>
      {children}
    </section>
  )
}

// Card seleccionable con dos estados visuales muy contrastantes.
function Seleccionable({ seleccionado, onClick, color = 'azul', children }) {
  const colorActivo = color === 'rojo' ? 'bg-rojo-faro text-white' : 'bg-azul-faro text-white'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left border-3 border-negro p-5 transition-all duration-100 ${
        seleccionado
          ? `${colorActivo} shadow-bruta-lg translate-x-[-3px] translate-y-[-3px]`
          : 'bg-white text-negro shadow-bruta hover:shadow-bruta-sm hover:translate-x-[2px] hover:translate-y-[2px]'
      }`}
    >
      {children}
    </button>
  )
}
