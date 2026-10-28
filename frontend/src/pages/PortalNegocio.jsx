import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { obtenerNegocioPublicoAPI } from '../api/negocios.api.js'
import { obtenerDisponibilidadAPI } from '../api/empleados.api.js'
import { crearTurnoAPI } from '../api/turnos.api.js'
import { miClienteAPI } from '../api/auth.api.js'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../hooks/useToast.js'
import { TactileSlot } from '../components/TactileSlot.jsx'
import { MatrixCalendar } from '../components/MatrixCalendar.jsx'
import { BoardingPassTicket } from '../components/BoardingPassTicket.jsx'
import { GoogleLoginButton } from '../components/GoogleLoginButton.jsx'
import { ThemeToggle } from '../components/ThemeToggle.jsx'
import { soundManager } from '../utils/sound.js'
import { ArrowLeft, Check } from 'lucide-react'

export default function PortalNegocio() {
  const { slug } = useParams()
  const { usuario, miCliente, cargarMiCliente } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [salonData, setSalonData] = useState(null)
  const [cargandoSalon, setCargandoSalon] = useState(true)
  const [errorSalon, setErrorSalon] = useState('')

  // Control de paso en modo hiperfoco (1: Servicio, 2: Profesional, 3: Fecha & Hora, 4: Boarding Pass)
  const [paso, setPaso] = useState(1)

  useEffect(() => {
    if (usuario && !miCliente && cargarMiCliente) {
      cargarMiCliente()
    }
  }, [usuario, miCliente, cargarMiCliente])

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

  useEffect(() => {
    let cancelado = false
    const cargar = async () => {
      setCargandoSalon(true)
      setErrorSalon('')
      try {
        const data = await obtenerNegocioPublicoAPI(slug)
        if (!cancelado) setSalonData(data)
      } catch (err) {
        if (!cancelado)
          setErrorSalon(err.response?.data?.error || 'No pudimos encontrar este salón o estudio')
      } finally {
        if (!cancelado) setCargandoSalon(false)
      }
    }
    cargar()
    return () => {
      cancelado = true
    }
  }, [slug])

  const negocio = salonData?.negocio
  const servicios = salonData?.servicios || []
  const empleados = salonData?.empleados || []

  const esParticularOUnipersonal =
    empleados.length === 1 || negocio?.modalidad === 'particular'

  // Auto-asignar profesional si es particular o hay uno solo
  useEffect(() => {
    if (esParticularOUnipersonal && empleados.length === 1 && !empleadoId) {
      setEmpleadoId(empleados[0]._id)
    }
  }, [esParticularOUnipersonal, empleados, empleadoId])

  const servicioElegido = servicios.find((s) => s._id === servicioId)
  const empleadoElegido = empleados.find((e) => e._id === empleadoId)

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
          timezoneOffset: new Date().getTimezoneOffset(),
        })
        if (!cancelado) {
          setSlots(res.slots || [])
          if (hora) {
            const elegido = res.slots?.find((s) => s.hora === hora)
            if (!elegido || !elegido.disponible) {
              setHora('')
              setSlotSeleccionado(null)
            } else {
              setSlotSeleccionado(elegido)
            }
          }
        }
      } catch (err) {
        if (!cancelado) {
          setErrorSlots('No pudimos calcular la disponibilidad para esa fecha')
          setSlots([])
          setSlotSeleccionado(null)
        }
      } finally {
        if (!cancelado) setCargandoSlots(false)
      }
    }

    cargarDisponibilidad()
    return () => {
      cancelado = true
    }
  }, [empleadoId, fecha, servicioId, hora])

  const sePuedeReservar = servicioId && empleadoId && fecha && hora

  const seleccionarServicio = (id) => {
    soundManager.playPop()
    setServicioId(id)
    if (esParticularOUnipersonal) {
      if (empleados[0]) setEmpleadoId(empleados[0]._id)
      setPaso(3) // Salto directo a Fecha & Hora
    } else {
      setPaso(2)
    }
  }

  const seleccionarEmpleado = (id) => {
    soundManager.playPop()
    setEmpleadoId(id)
    setPaso(3)
  }

  const seleccionarSlot = (s) => {
    setHora(s.hora)
    setSlotSeleccionado(s)
    soundManager.playPop()
  }

  const onConfirmar = async () => {
    setErrorGlobal('')

    if (!usuario) {
      toast.error('Para confirmar tu turno necesitás ingresar a tu cuenta')
      navigate('/login', { state: { from: { pathname: `/${slug}` } } })
      return
    }

    let perfilCliente = miCliente
    if (!perfilCliente?._id) {
      try {
        if (cargarMiCliente) {
          perfilCliente = await cargarMiCliente()
        }
        if (!perfilCliente?._id) {
          perfilCliente = await miClienteAPI()
        }
      } catch (err) {
        console.error('No se pudo validar el perfil de cliente:', err)
      }
    }

    if (!perfilCliente?._id) {
      setErrorGlobal('No pudimos validar tu perfil de cliente. Refrescá la página.')
      return
    }

    const fechaHoraIso =
      slotSeleccionado?.fechaHora || new Date(`${fecha}T${hora}:00`).toISOString()

    setEnviando(true)
    try {
      await crearTurnoAPI({
        negocio: negocio.id,
        cliente: perfilCliente._id,
        empleado: empleadoId,
        servicio: servicioId,
        fechaHora: fechaHoraIso,
      })
      soundManager.playSuccess()
      toast.exito(`Turno reservado en ${negocio.nombre}`)
      navigate('/turnos')
    } catch (e) {
      setErrorGlobal(e.response?.data?.error || 'No pudimos agendar tu turno')
    } finally {
      setEnviando(false)
    }
  }

  const hoy = new Date().toISOString().slice(0, 10)

  if (cargandoSalon) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="font-mono text-xs text-neutral-500 uppercase tracking-widest animate-pulse">
          Cargando agenda...
        </div>
      </div>
    )
  }

  if (errorSalon || !negocio) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="text-center max-w-md border border-white/10 p-10">
          <p className="font-mono text-5xl font-light text-white">404</p>
          <h1 className="font-mono text-lg text-white uppercase mt-4">Espacio no encontrado</h1>
          <p className="font-mono text-xs text-neutral-500 mt-2 uppercase">
            El enlace no existe o fue dado de baja.
          </p>
          <Link to="/" className="btn btn-primario mt-8 inline-block">
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-black text-white p-6 sm:p-10 md:p-14 lg:p-20 pb-36 flex flex-col justify-between selection:bg-white selection:text-black">
      {/* Header Objetivo B&W */}
      <header className="w-full border-b border-white/10 pb-6 flex items-center justify-between text-xs font-mono uppercase tracking-widest text-neutral-400">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-white font-medium text-sm tracking-tight">{negocio.nombre}</h1>
              {negocio.modalidad === 'particular' && (
                <span className="text-[10px] px-1.5 py-0.5 border border-white/20 text-neutral-300 font-mono">
                  ESTUDIO PRIVADO
                </span>
              )}
            </div>
            <span className="text-neutral-500 text-xs font-mono">
              {negocio.direccion || 'BUENOS AIRES'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle className="hidden sm:inline-flex" />
          {usuario ? (
            <Link to="/dashboard" className="text-white hover:underline">
              Mi cuenta ↗
            </Link>
          ) : (
            <Link to="/login" className="px-3 py-1.5 border border-white/20 text-white hover:bg-white hover:text-black transition-colors">
              Ingresar
            </Link>
          )}
        </div>
      </header>

      {/* Stepper Objetivo con Guiones Editoriales */}
      <div className="w-full border-b border-white/10 py-4 my-6">
        <div className="flex items-center gap-4 sm:gap-6 font-mono text-xs overflow-x-auto scrollbar-none">
          {/* Paso 1: Servicio */}
          <button
            type="button"
            onClick={() => setPaso(1)}
            className={`flex items-center gap-2 cursor-pointer shrink-0 transition-colors ${
              paso === 1 ? 'text-white font-semibold' : servicioId ? 'text-neutral-400 hover:text-white' : 'text-neutral-600'
            }`}
          >
            <span className={`px-1.5 py-0.5 text-[10px] ${paso === 1 ? 'bg-white text-black' : 'border border-white/20'}`}>
              01
            </span>
            <span>SERVICIO ↘</span>
            {servicioId && <Check className="w-3 h-3 text-white" />}
          </button>

          <span className="text-neutral-700">—</span>

          {/* Paso 2: Profesional (Oculto o simplificado si es particular/unipersonal) */}
          {!esParticularOUnipersonal && (
            <>
              <button
                type="button"
                onClick={() => servicioId && setPaso(2)}
                disabled={!servicioId}
                className={`flex items-center gap-2 shrink-0 transition-colors ${
                  !servicioId ? 'text-neutral-700 cursor-not-allowed' : paso === 2 ? 'text-white font-semibold cursor-pointer' : empleadoId ? 'text-neutral-400 hover:text-white cursor-pointer' : 'text-neutral-600 cursor-pointer'
                }`}
              >
                <span className={`px-1.5 py-0.5 text-[10px] ${paso === 2 ? 'bg-white text-black' : 'border border-white/20'}`}>
                  02
                </span>
                <span>PROFESIONAL ↘</span>
                {empleadoId && <Check className="w-3 h-3 text-white" />}
              </button>

              <span className="text-neutral-700">—</span>
            </>
          )}

          {/* Paso 3: Fecha y Hora */}
          <button
            type="button"
            onClick={() => servicioId && empleadoId && setPaso(3)}
            disabled={!servicioId || !empleadoId}
            className={`flex items-center gap-2 shrink-0 transition-colors ${
              !servicioId || !empleadoId ? 'text-neutral-700 cursor-not-allowed' : paso === 3 ? 'text-white font-semibold cursor-pointer' : hora ? 'text-neutral-400 hover:text-white cursor-pointer' : 'text-neutral-600 cursor-pointer'
            }`}
          >
            <span className={`px-1.5 py-0.5 text-[10px] ${paso === 3 ? 'bg-white text-black' : 'border border-white/20'}`}>
              {esParticularOUnipersonal ? '02' : '03'}
            </span>
            <span>FECHA Y HORA ↘</span>
            {hora && <Check className="w-3 h-3 text-white" />}
          </button>

          <span className="text-neutral-700">—</span>

          {/* Paso 4: Ticket */}
          <button
            type="button"
            onClick={() => sePuedeReservar && setPaso(4)}
            disabled={!sePuedeReservar}
            className={`flex items-center gap-2 shrink-0 transition-colors ${
              !sePuedeReservar ? 'text-neutral-700 cursor-not-allowed' : paso === 4 ? 'text-white font-semibold cursor-pointer' : 'text-neutral-400 hover:text-white cursor-pointer'
            }`}
          >
            <span className={`px-1.5 py-0.5 text-[10px] ${paso === 4 ? 'bg-white text-black' : 'border border-white/20'}`}>
              {esParticularOUnipersonal ? '03' : '04'}
            </span>
            <span>COMPROBANTE ↘</span>
          </button>
        </div>
      </div>

      {/* Main Single-Task Cognition Flow */}
      <main className="w-full flex-1 my-6 max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {/* PASO 1: SERVICIO */}
          {paso === 1 && (
            <motion.div
              key="paso-1"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <div className="flex items-baseline justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="font-mono text-xs uppercase tracking-widest text-neutral-500">
                    01 — CATÁLOGO DE SERVICIOS
                  </p>
                  <h2 className="font-mono font-medium text-2xl text-white mt-1 uppercase">
                    Elegí el servicio
                  </h2>
                </div>
                <span className="font-mono text-xs text-neutral-500 uppercase">
                  {servicios.length} disponibles
                </span>
              </div>

              {servicios.length === 0 ? (
                <p className="font-mono text-xs text-neutral-500 uppercase">
                  No hay servicios registrados en este momento.
                </p>
              ) : (
                <div className="divide-y divide-white/10 border-b border-white/10">
                  {servicios.map((s) => {
                    const activo = s._id === servicioId
                    return (
                      <div
                        key={s._id}
                        role="button"
                        tabIndex={0}
                        onClick={() => seleccionarServicio(s._id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            seleccionarServicio(s._id)
                          }
                        }}
                        className={`group py-5 px-4 -mx-4 flex items-baseline justify-between transition-colors cursor-pointer ${
                          activo ? 'bg-white text-black' : 'hover:bg-white/5 text-neutral-300 hover:text-white'
                        }`}
                      >
                        <div>
                          <div className="font-mono text-lg font-medium tracking-tight">
                            {s.nombre}
                          </div>
                          <div className={`font-mono text-xs mt-1 ${activo ? 'text-neutral-700' : 'text-neutral-500'}`}>
                            {s.duracionMinutos} MIN {s.descripcion ? `· ${s.descripcion}` : ''}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-mono text-base font-semibold">
                            ${s.precio?.toLocaleString('es-AR')}
                          </div>
                          <div className="font-mono text-[10px] uppercase tracking-wider mt-0.5">
                            {activo ? 'SELECCIONADO' : 'ELEGIR ↘'}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* PASO 2: PROFESIONAL (Solo visible en local con múltiples profesionales) */}
          {paso === 2 && !esParticularOUnipersonal && (
            <motion.div
              key="paso-2"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <div className="flex items-baseline justify-between border-b border-white/10 pb-4">
                <div>
                  <button
                    type="button"
                    onClick={() => setPaso(1)}
                    className="font-mono text-xs text-neutral-500 hover:text-white transition-colors cursor-pointer mb-2 flex items-center gap-1 uppercase"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Volver a servicios</span>
                  </button>
                  <h2 className="font-mono font-medium text-2xl text-white uppercase">
                    Elegí el profesional
                  </h2>
                </div>
                {servicioElegido && (
                  <span className="font-mono text-xs text-neutral-400 hidden sm:inline uppercase">
                    {servicioElegido.nombre} · ${servicioElegido.precio?.toLocaleString('es-AR')}
                  </span>
                )}
              </div>

              {empleados.length === 0 ? (
                <p className="font-mono text-xs text-neutral-500 uppercase">
                  No hay profesionales disponibles en este momento.
                </p>
              ) : (
                <div className="divide-y divide-white/10 border-b border-white/10">
                  {empleados.map((e) => {
                    const activo = e._id === empleadoId
                    return (
                      <div
                        key={e._id}
                        role="button"
                        tabIndex={0}
                        onClick={() => seleccionarEmpleado(e._id)}
                        onKeyDown={(ev) => {
                          if (ev.key === 'Enter' || ev.key === ' ') {
                            ev.preventDefault()
                            seleccionarEmpleado(e._id)
                          }
                        }}
                        className={`group py-5 px-4 -mx-4 flex items-baseline justify-between transition-colors cursor-pointer ${
                          activo ? 'bg-white text-black' : 'hover:bg-white/5 text-neutral-300 hover:text-white'
                        }`}
                      >
                        <div>
                          <div className="font-mono text-lg font-medium tracking-tight">
                            {e.nombre}
                          </div>
                          <div className={`font-mono text-xs mt-1 uppercase ${activo ? 'text-neutral-700' : 'text-neutral-500'}`}>
                            {e.especialidad || 'Especialista'}
                          </div>
                        </div>

                        <div className="font-mono text-xs uppercase tracking-wider">
                          {activo ? 'SELECCIONADO' : 'ELEGIR ↘'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* PASO 3: FECHA & HORARIO */}
          {paso === 3 && (
            <motion.div
              key="paso-3"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <div className="flex items-baseline justify-between border-b border-white/10 pb-4">
                <div>
                  <button
                    type="button"
                    onClick={() => setPaso(esParticularOUnipersonal ? 1 : 2)}
                    className="font-mono text-xs text-neutral-500 hover:text-white transition-colors cursor-pointer mb-2 flex items-center gap-1 uppercase"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>{esParticularOUnipersonal ? 'Volver a servicios' : 'Volver a profesionales'}</span>
                  </button>
                  <h2 className="font-mono font-medium text-2xl text-white uppercase">
                    Elegí día y horario
                  </h2>
                </div>
                <div className="text-right font-mono text-xs text-neutral-400 hidden sm:block uppercase">
                  <span>{servicioElegido?.nombre}</span>
                  {empleadoElegido && (
                    <>
                      <span className="text-neutral-600"> — </span>
                      <span>{empleadoElegido.nombre}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-8 items-start">
                <MatrixCalendar
                  fechaSeleccionada={fecha}
                  onSeleccionarFecha={(f) => {
                    setFecha(f)
                    setHora('')
                    setSlotSeleccionado(null)
                  }}
                  minFecha={hoy}
                />

                <div className="space-y-4">
                  <div className="font-mono text-xs uppercase tracking-widest text-neutral-500">
                    HORARIOS DISPONIBLES
                  </div>

                  {!fecha && (
                    <div className="py-12 border border-white/10 text-center font-mono text-xs uppercase tracking-wider text-neutral-500">
                      ← Tocá un día en el calendario para consultar horarios
                    </div>
                  )}

                  {fecha && cargandoSlots && (
                    <div className="py-12 border border-white/10 text-center font-mono text-xs uppercase tracking-wider text-white animate-pulse">
                      Consultando disponibilidad...
                    </div>
                  )}

                  {fecha && errorSlots && (
                    <div className="p-4 border border-rose-500/30 text-rose-300 font-mono text-xs">
                      {errorSlots}
                    </div>
                  )}

                  {fecha && !cargandoSlots && !errorSlots && slots.length === 0 && (
                    <div className="py-12 border border-white/10 text-center font-mono text-xs uppercase tracking-wider text-neutral-500">
                      Sin turnos libres para esta fecha. Probá otro día.
                    </div>
                  )}

                  {fecha && !cargandoSlots && slots.length > 0 && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {slots.map((s) => (
                          <TactileSlot
                            key={s.hora}
                            hora={s.hora}
                            horaFin={s.horaFin}
                            disponible={s.disponible}
                            motivo={s.motivo}
                            seleccionado={hora === s.hora}
                            onClick={() => seleccionarSlot(s)}
                          />
                        ))}
                      </div>

                      {hora && (
                        <div className="pt-4 border-t border-white/10 flex justify-end">
                          <button
                            type="button"
                            onClick={() => setPaso(4)}
                            className="px-6 py-3 bg-white text-black font-mono text-xs font-semibold uppercase tracking-wider hover:bg-neutral-200 transition-colors cursor-pointer"
                          >
                            Ver Comprobante ↘
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* PASO 4: BOARDING PASS TICKET */}
          {paso === 4 && (
            <motion.div
              key="paso-4"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <div className="flex items-baseline justify-between border-b border-white/10 pb-4">
                <div>
                  <button
                    type="button"
                    onClick={() => setPaso(3)}
                    className="font-mono text-xs text-neutral-500 hover:text-white transition-colors cursor-pointer mb-2 flex items-center gap-1 uppercase"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Cambiar día u horario</span>
                  </button>
                  <h2 className="font-mono font-medium text-2xl text-white uppercase">
                    Comprobante de Reserva
                  </h2>
                </div>
                <span className="font-mono text-xs text-neutral-400 uppercase tracking-widest">
                  ETAPA FINAL
                </span>
              </div>

              {errorGlobal && (
                <div className="p-4 border border-rose-500/30 text-rose-300 font-mono text-xs uppercase">
                  {errorGlobal}
                </div>
              )}

              {!usuario && (
                <div className="p-4 border border-white/20 bg-white/5 font-mono text-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-white font-medium uppercase tracking-wider">
                      ACCESO DIRECTO 1-CLICK
                    </div>
                    <p className="text-neutral-400 font-sans text-xs">
                      Ingresá con Google para confirmar la reserva y sincronizar en tu calendario.
                    </p>
                  </div>
                  <div className="w-full sm:w-auto shrink-0">
                    <GoogleLoginButton
                      texto="CONTINUAR CON GOOGLE"
                      onSuccess={() => {
                        toast.exito('Cuenta conectada. Ya podés confirmar tu turno.')
                      }}
                    />
                  </div>
                </div>
              )}

              <BoardingPassTicket
                negocioNombre={negocio.nombre}
                negocioDireccion={negocio.direccion || 'Buenos Aires'}
                servicio={servicioElegido}
                empleado={empleadoElegido}
                fecha={fecha}
                hora={hora}
                slot={slotSeleccionado}
                codigoTurno={`TK-${Math.floor(1000 + Math.random() * 9000)}`}
                onConfirmar={onConfirmar}
                enviando={enviando}
                deshabilitado={!sePuedeReservar}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Barra de control inferior fija si paso < 4 */}
      {paso < 4 && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-black/95 border-t border-white/10 px-6 sm:px-12 py-4">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 font-mono text-xs">
            <div className="text-neutral-400 uppercase tracking-wider truncate">
              <span className="text-neutral-600">{negocio.nombre}:</span>{' '}
              <span className="text-white">
                {servicioElegido?.nombre || '— SERVICIO —'} ·{' '}
                {empleadoElegido?.nombre || '— PROFESIONAL —'} ·{' '}
                {fecha && hora ? `${fecha} ${hora} HS` : '— FECHA Y HORA —'}
              </span>
            </div>

            <button
              type="button"
              onClick={onConfirmar}
              disabled={!sePuedeReservar || enviando}
              className="px-6 py-3 bg-white text-black font-semibold uppercase tracking-wider hover:bg-neutral-200 transition-colors disabled:opacity-20 disabled:pointer-events-none cursor-pointer shrink-0"
            >
              {enviando ? 'Confirmando...' : 'Confirmar Reserva ↗'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
