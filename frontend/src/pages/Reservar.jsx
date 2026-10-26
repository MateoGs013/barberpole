// Flujo de reservas en Modo Zen & Hiperfoco Permanente (B&W)
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFetch } from '../hooks/useFetch.js'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../hooks/useToast.js'
import { listarServiciosAPI } from '../api/servicios.api.js'
import { listarEmpleadosAPI, obtenerDisponibilidadAPI } from '../api/empleados.api.js'
import { crearTurnoAPI } from '../api/turnos.api.js'
import { TactileSlot } from '../components/TactileSlot.jsx'
import { MatrixCalendar } from '../components/MatrixCalendar.jsx'
import { BoardingPassTicket } from '../components/BoardingPassTicket.jsx'
import { ThemeToggle } from '../components/ThemeToggle.jsx'
import { soundManager } from '../utils/sound.js'

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
  const [slotSeleccionado, setSlotSeleccionado] = useState(null)
  const [slots, setSlots] = useState([])
  const [cargandoSlots, setCargandoSlots] = useState(false)
  const [errorSlots, setErrorSlots] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [errorGlobal, setErrorGlobal] = useState('')
  const [turnoConfirmado, setTurnoConfirmado] = useState(null)

  const servicioElegido = servicios?.find((s) => s._id === servicioId)
  const empleadoElegido = empleados?.find((e) => e._id === empleadoId)

  // Carga de slots en tiempo real vía Slot Engine
  useEffect(() => {
    if (!empleadoId || !fecha || !servicioId) {
      setSlots([])
      setSlotSeleccionado(null)
      return
    }

    let cancelado = false
    const cargarDisponibilidad = async () => {
      setCargandoSlots(true)
      setErrorSlots('')
      try {
        const res = await obtenerDisponibilidadAPI(empleadoId, {
          fecha,
          servicioId,
        })
        if (!cancelado) {
          setSlots(res.slots || [])
        }
      } catch (err) {
        if (!cancelado) {
          setErrorSlots('No pudimos calcular los horarios para este día')
        }
      } finally {
        if (!cancelado) setCargandoSlots(false)
      }
    }

    cargarDisponibilidad()
    return () => {
      cancelado = true
    }
  }, [empleadoId, fecha, servicioId])

  // Deseleccionar slot si cambia el servicio o el profesional
  const seleccionarServicio = (id) => {
    setServicioId(id)
    setHora('')
    setSlotSeleccionado(null)
  }

  const seleccionarEmpleado = (id) => {
    setEmpleadoId(id)
    setHora('')
    setSlotSeleccionado(null)
  }

  const sePuedeReservar = Boolean(
    servicioId && empleadoId && fecha && hora && slotSeleccionado && !enviando
  )

  const onConfirmar = async () => {
    setErrorGlobal('')
    if (!miCliente?._id) {
      setErrorGlobal('No encontramos tu perfil de cliente. Volvé a iniciar sesión.')
      return
    }

    const fechaHoraIso =
      slotSeleccionado?.fechaHora || new Date(`${fecha}T${hora}:00`).toISOString()
    const fechaHoraLocal = new Date(fechaHoraIso)
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
      const res = await crearTurnoAPI({
        cliente: miCliente._id,
        empleado: empleadoId,
        servicio: servicioId,
        fechaHora: fechaHoraIso,
      })
      soundManager.playSuccess()
      toast.exito('Turno reservado — te esperamos')
      setTurnoConfirmado({
        ...res,
        fechaHora: fechaHoraIso,
      })
    } catch (e) {
      setErrorGlobal(e.response?.data?.error || 'No pudimos reservar el turno')
    } finally {
      setEnviando(false)
    }
  }

  const hoy = new Date().toISOString().slice(0, 10)

  // Vista de Sincronización Post-Confirmación Automática
  if (turnoConfirmado) {
    return (
      <div className="min-h-screen w-full bg-black text-white p-6 sm:p-10 md:p-14 lg:p-20 flex flex-col justify-between selection:bg-white selection:text-black">
        <header className="w-full border-b border-white/10 pb-8 flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-emerald-400 mb-2">
              ● RESERVA REGISTRADA CON ÉXITO
            </p>
            <h1 className="text-4xl sm:text-6xl font-mono font-medium tracking-tight text-white uppercase">
              TURNO ASEGURADO.
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={() => {
                setTurnoConfirmado(null)
                setServicioId('')
                setEmpleadoId('')
                setFecha('')
                setHora('')
                setSlotSeleccionado(null)
              }}
              className="btn btn-secundario text-xs"
            >
              ← Reservar otro turno
            </button>
          </div>
        </header>

        <main className="w-full my-auto py-12 flex items-center justify-center">
          <BoardingPassTicket
            confirmado={true}
            negocioNombre="Studio Palermo — Barber & Hair"
            negocioDireccion="Palermo Soho, CABA"
            servicio={servicioElegido}
            empleado={empleadoElegido}
            fecha={fecha}
            hora={hora}
            slot={slotSeleccionado}
            codigoTurno={`BP-${Date.now().toString().slice(-4)}`}
            fechaHoraIso={turnoConfirmado.fechaHora}
            onVerMisTurnos={() => navigate('/turnos')}
          />
        </main>

        <footer className="w-full border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-neutral-500 uppercase tracking-widest gap-4">
          <span>BARBERPOLE — SINCRONIZACIÓN AUTOMÁTICA ACTIVA</span>
          <span>GOOGLE CALENDAR · ICS · WHATSAPP</span>
        </footer>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-black text-white p-6 sm:p-10 md:p-14 lg:p-20 flex flex-col justify-between selection:bg-white selection:text-black">
      {/* Header Objetivo Full Width */}
      <header className="w-full border-b border-white/10 pb-8 flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-500 mb-2">
            — MODO HIPERFOCO PERMANENTE
          </p>
          <h1 className="text-4xl sm:text-6xl font-mono font-medium tracking-tight text-white uppercase">
            NUEVO TURNO
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="font-mono text-xs text-neutral-400 uppercase tracking-widest hidden sm:block">
            SISTEMA DE EMISIÓN DIRECTA
          </div>
        </div>
      </header>

      {/* Main Grid Editorial Full Width */}
      <main className="w-full my-auto py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* COLUMNA 1: Servicios */}
        <section className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-white/10 pb-8 lg:pb-0 lg:pr-8">
          <div className="flex items-baseline justify-between mb-6 pb-2 border-b border-white/10">
            <h2 className="font-mono text-xs uppercase tracking-widest text-neutral-400">
              01 — ELEGÍ EL SERVICIO
            </h2>
            <span className="font-mono text-[10px] uppercase text-neutral-500">
              {servicioId ? 'SELECCIONADO' : '1 REQUERIDO'}
            </span>
          </div>

          <div className="divide-y divide-white/10">
            {servicios?.map((s) => {
              const seleccionado = s._id === servicioId
              return (
                <button
                  key={s._id}
                  type="button"
                  onClick={() => seleccionarServicio(s._id)}
                  className={`w-full py-4 text-left transition-colors flex items-center justify-between group cursor-pointer ${
                    seleccionado ? 'text-white' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="min-w-0 pr-4">
                    <p className={`font-mono text-sm uppercase tracking-tight ${seleccionado ? 'font-bold text-white' : ''}`}>
                      {s.nombre}
                    </p>
                    <p className="font-mono text-[11px] text-neutral-500 mt-1 uppercase">
                      {s.duracionMinutos} MIN
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-sm font-medium">
                      ${s.precio?.toLocaleString('es-AR')}
                    </p>
                    {seleccionado && (
                      <span className="font-mono text-[10px] uppercase tracking-widest text-white mt-1 block">
                        [ACTIVO]
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* COLUMNA 2: Profesionales */}
        <section className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-white/10 pb-8 lg:pb-0 lg:pr-8">
          <div className="flex items-baseline justify-between mb-6 pb-2 border-b border-white/10">
            <h2 className="font-mono text-xs uppercase tracking-widest text-neutral-400">
              02 — ELEGÍ EL PROFESIONAL
            </h2>
            <span className="font-mono text-[10px] uppercase text-neutral-500">
              {empleadoId ? 'SELECCIONADO' : '1 REQUERIDO'}
            </span>
          </div>

          <div className="divide-y divide-white/10">
            {empleados?.map((e) => {
              const seleccionado = e._id === empleadoId
              return (
                <button
                  key={e._id}
                  type="button"
                  onClick={() => seleccionarEmpleado(e._id)}
                  className={`w-full py-4 text-left transition-colors flex items-center justify-between group cursor-pointer ${
                    seleccionado ? 'text-white' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="min-w-0 pr-4">
                    <p className={`font-mono text-sm uppercase tracking-tight ${seleccionado ? 'font-bold text-white' : ''}`}>
                      {e.nombre}
                    </p>
                    <p className="font-mono text-[11px] text-neutral-500 mt-1 uppercase">
                      {e.especialidad}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`font-mono text-[11px] uppercase tracking-wider ${
                      seleccionado ? 'text-white font-bold' : 'text-neutral-500 group-hover:text-white'
                    }`}>
                      {seleccionado ? '[ELEGIDO]' : 'ELEGIR'}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* COLUMNA 3: Matriz de Calendario & Horarios */}
        <section className="lg:col-span-4">
          <div className="flex items-baseline justify-between mb-6 pb-2 border-b border-white/10">
            <h2 className="font-mono text-xs uppercase tracking-widest text-neutral-400">
              03 — ELEGÍ DÍA Y HORARIO
            </h2>
            <span className="font-mono text-[10px] uppercase text-neutral-500">
              {fecha && hora ? `${hora} HS` : 'FECHA PENDIENTE'}
            </span>
          </div>

          <div className="space-y-6">
            {/* Matriz interactiva de calendario */}
            <MatrixCalendar
              fechaSeleccionada={fecha}
              onSeleccionarFecha={(f) => {
                setFecha(f)
                setHora('')
                setSlotSeleccionado(null)
              }}
              minFecha={hoy}
            />

            {/* Selector de horario en grilla monocromática */}
            <div className="pt-4 border-t border-white/10">
              <label className="block font-mono text-[11px] uppercase tracking-widest text-neutral-400 mb-3">
                HORARIOS DISPONIBLES
              </label>

              {!fecha ? (
                <p className="font-mono text-xs text-neutral-600 uppercase tracking-wider py-4">
                  Seleccioná un día en el calendario superior
                </p>
              ) : cargandoSlots ? (
                <p className="font-mono text-xs text-neutral-500 uppercase tracking-widest animate-pulse py-4">
                  Calculando disponibilidad en vivo...
                </p>
              ) : errorSlots ? (
                <p className="font-mono text-xs text-rose-400 uppercase py-2">
                  {errorSlots}
                </p>
              ) : slots.length === 0 ? (
                <p className="font-mono text-xs text-neutral-500 uppercase tracking-wider py-4">
                  No hay horarios disponibles para esta combinación
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {slots.map((s) => (
                    <TactileSlot
                      key={s.hora}
                      hora={s.hora}
                      horaFin={s.horaFin}
                      disponible={s.disponible}
                      motivo={s.motivo}
                      seleccionado={hora === s.hora}
                      onClick={() => {
                        setHora(s.hora)
                        setSlotSeleccionado(s)
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

      </main>

      {/* Footer Fijo Objetivo con Confirmar Reserva */}
      <footer className="w-full border-t border-white/10 pt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6">
        <div>
          {errorGlobal ? (
            <p className="font-mono text-xs text-rose-400 uppercase">{errorGlobal}</p>
          ) : (
            <div className="font-mono text-xs uppercase tracking-widest text-neutral-400">
              <span>RESUMEN:</span>{' '}
              <span className="text-white font-medium">
                {servicioElegido?.nombre || '— SERVICIO —'} ·{' '}
                {empleadoElegido?.nombre || '— PROFESIONAL —'} ·{' '}
                {fecha && hora ? `${fecha} ${hora} HS` : '— DÍA Y HORA —'}
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onConfirmar}
          disabled={!sePuedeReservar || enviando}
          className="px-10 py-5 bg-white text-black hover:bg-neutral-200 font-mono text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-20 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-3 shrink-0"
        >
          <span>{enviando ? 'Confirmando...' : 'Confirmar Reserva'}</span>
          <span>↗</span>
        </button>
      </footer>
    </div>
  )
}
