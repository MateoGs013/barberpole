import { useState, useEffect } from 'react'
import { obtenerMiNegocioAPI, actualizarMiNegocioAPI } from '../api/negocios.api.js'
import { useFetch } from '../hooks/useFetch.js'
import { useToast } from '../hooks/useToast.js'

const DIAS_SEMANA = [
  { id: 1, label: 'Lunes', corto: 'LUN' },
  { id: 2, label: 'Martes', corto: 'MAR' },
  { id: 3, label: 'Miércoles', corto: 'MIÉ' },
  { id: 4, label: 'Jueves', corto: 'JUE' },
  { id: 5, label: 'Viernes', corto: 'VIE' },
  { id: 6, label: 'Sábado', corto: 'SÁB' },
  { id: 0, label: 'Domingo', corto: 'DOM' },
]

export default function ConfiguracionNegocio() {
  const toast = useToast()
  const { datos: negocio, cargando, error, recargar } = useFetch(() => obtenerMiNegocioAPI())

  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [direccion, setDireccion] = useState('')
  const [telefono, setTelefono] = useState('')

  // Configuración operativa
  const [horaApertura, setHoraApertura] = useState('09:00')
  const [horaCierre, setHoraCierre] = useState('20:00')
  const [intervaloMinutos, setIntervaloMinutos] = useState(30)
  const [bufferMinutos, setBufferMinutos] = useState(0)
  const [diasLaborales, setDiasLaborales] = useState([1, 2, 3, 4, 5, 6])
  const [anticipacionMinimaHoras, setAnticipacionMinimaHoras] = useState(1)
  const [anticipacionMaximaDias, setAnticipacionMaximaDias] = useState(30)
  const [cancelacionMinimaHoras, setCancelacionMinimaHoras] = useState(2)
  const [notificacionesWhatsapp, setNotificacionesWhatsapp] = useState(true)
  const [instagram, setInstagram] = useState('')

  const [guardando, setGuardando] = useState(false)
  const [errorGlobal, setErrorGlobal] = useState('')

  useEffect(() => {
    if (negocio) {
      setNombre(negocio.nombre || '')
      setDescripcion(negocio.descripcion || '')
      setDireccion(negocio.direccion || '')
      setTelefono(negocio.telefono || '')

      const cfg = negocio.configuracion || {}
      if (cfg.horaApertura) setHoraApertura(cfg.horaApertura)
      if (cfg.horaCierre) setHoraCierre(cfg.horaCierre)
      if (cfg.intervaloMinutos) setIntervaloMinutos(cfg.intervaloMinutos)
      if (cfg.bufferMinutos != null) setBufferMinutos(cfg.bufferMinutos)
      if (Array.isArray(cfg.diasLaborales)) setDiasLaborales(cfg.diasLaborales)
      if (cfg.anticipacionMinimaHoras != null) setAnticipacionMinimaHoras(cfg.anticipacionMinimaHoras)
      if (cfg.anticipacionMaximaDias != null) setAnticipacionMaximaDias(cfg.anticipacionMaximaDias)
      if (cfg.cancelacionMinimaHoras != null) setCancelacionMinimaHoras(cfg.cancelacionMinimaHoras)
      if (cfg.notificacionesWhatsapp != null) setNotificacionesWhatsapp(cfg.notificacionesWhatsapp)
      if (cfg.instagram) setInstagram(cfg.instagram)
    }
  }, [negocio])

  const toggleDia = (diaId) => {
    if (diasLaborales.includes(diaId)) {
      if (diasLaborales.length === 1) {
        toast.error('Debe haber al menos un día laboral activo')
        return
      }
      setDiasLaborales(diasLaborales.filter((d) => d !== diaId))
    } else {
      setDiasLaborales([...diasLaborales, diaId].sort())
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setErrorGlobal('')
    setGuardando(true)

    try {
      const payload = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        direccion: direccion.trim(),
        telefono: telefono.trim(),
        configuracion: {
          horaApertura,
          horaCierre,
          intervaloMinutos: Number(intervaloMinutos),
          bufferMinutos: Number(bufferMinutos),
          diasLaborales,
          anticipacionMinimaHoras: Number(anticipacionMinimaHoras),
          anticipacionMaximaDias: Number(anticipacionMaximaDias),
          cancelacionMinimaHoras: Number(cancelacionMinimaHoras),
          politicaPago: 'efectivo',
          notificacionesWhatsapp,
          instagram: instagram.trim(),
        },
      }

      await actualizarMiNegocioAPI(payload)
      recargar()
      toast.exito('Configuración del salón actualizada')
    } catch (err) {
      setErrorGlobal(err.response?.data?.error || 'No se pudo guardar la configuración')
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <p className="font-mono text-xs uppercase text-neutral-500 animate-pulse">
          Cargando configuración...
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header Zen */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-500 mb-1">
            — PARÁMETROS OPERATIVOS & POLÍTICAS
          </p>
          <h1 className="text-4xl sm:text-6xl font-mono font-medium tracking-tight text-white uppercase leading-none">
            CONFIGURACIÓN.
          </h1>
        </div>
        {negocio?.slug && (
          <a
            href={`/${negocio.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secundario text-xs font-mono uppercase self-start sm:self-auto"
          >
            Ver Portal Público ↗
          </a>
        )}
      </div>

      {errorGlobal && (
        <div className="p-4 border border-rose-500/30 text-rose-300 font-mono text-xs uppercase">
          {errorGlobal}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-10">
        {/* SECCIÓN 1: Identidad del Salón */}
        <section className="space-y-4">
          <h2 className="font-mono text-xs uppercase tracking-widest text-neutral-400 pb-2 border-b border-white/10">
            01 — IDENTIDAD & CONTACTO
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="label" htmlFor="nombre">Nombre del Salón</label>
              <input
                id="nombre"
                type="text"
                className="input"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="slug">Identificador / Slug Público</label>
              <input
                id="slug"
                type="text"
                className="input text-neutral-500 cursor-not-allowed"
                value={negocio?.slug || ''}
                disabled
              />
            </div>
            <div>
              <label className="label" htmlFor="telefono">Teléfono WhatsApp</label>
              <input
                id="telefono"
                type="tel"
                className="input"
                placeholder="+54 9 11 1234-5678"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="instagram">Instagram</label>
              <input
                id="instagram"
                type="text"
                className="input"
                placeholder="@tu_barberia"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="direccion">Dirección Física</label>
            <input
              id="direccion"
              type="text"
              className="input"
              placeholder="Ej: Av. Santa Fe 3400, Palermo"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
            />
          </div>
        </section>

        {/* SECCIÓN 2: Jornada y Horarios */}
        <section className="space-y-4">
          <h2 className="font-mono text-xs uppercase tracking-widest text-neutral-400 pb-2 border-b border-white/10">
            02 — JORNADA & HORARIOS DE ATENCIÓN
          </h2>

          <div>
            <label className="label mb-2 block">Días Laborales Habilitados</label>
            <div className="flex flex-wrap gap-2">
              {DIAS_SEMANA.map((dia) => {
                const activo = diasLaborales.includes(dia.id)
                return (
                  <button
                    key={dia.id}
                    type="button"
                    onClick={() => toggleDia(dia.id)}
                    className={`px-3 py-2 font-mono text-xs uppercase tracking-wider transition-colors border ${
                      activo
                        ? 'bg-white text-black border-white font-medium'
                        : 'bg-transparent text-neutral-500 border-white/10 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    {dia.corto}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="label" htmlFor="horaApertura">Hora Apertura</label>
              <input
                id="horaApertura"
                type="time"
                className="input"
                value={horaApertura}
                onChange={(e) => setHoraApertura(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="horaCierre">Hora Cierre</label>
              <input
                id="horaCierre"
                type="time"
                className="input"
                value={horaCierre}
                onChange={(e) => setHoraCierre(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="label" htmlFor="intervalo">Intervalo de Slots (Minutos)</label>
              <select
                id="intervalo"
                className="input"
                value={intervaloMinutos}
                onChange={(e) => setIntervaloMinutos(Number(e.target.value))}
              >
                <option value={15}>15 minutos</option>
                <option value={20}>20 minutos</option>
                <option value={30}>30 minutos (Estándar)</option>
                <option value={45}>45 minutos</option>
                <option value={60}>60 minutos</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="buffer">Buffer entre Turnos (Limpieza/Espera)</label>
              <select
                id="buffer"
                className="input"
                value={bufferMinutos}
                onChange={(e) => setBufferMinutos(Number(e.target.value))}
              >
                <option value={0}>0 minutos (Inmediato)</option>
                <option value={5}>5 minutos</option>
                <option value={10}>10 minutos</option>
                <option value={15}>15 minutos</option>
              </select>
            </div>
          </div>
        </section>

        {/* SECCIÓN 3: Políticas de Reserva y Cancelación */}
        <section className="space-y-4">
          <h2 className="font-mono text-xs uppercase tracking-widest text-neutral-400 pb-2 border-b border-white/10">
            03 — REGLAS DE RESERVA & CANCELACIÓN
          </h2>

          <div className="grid sm:grid-cols-3 gap-6">
            <div>
              <label className="label" htmlFor="anticipacionMin">Anticipación Mínima</label>
              <select
                id="anticipacionMin"
                className="input"
                value={anticipacionMinimaHoras}
                onChange={(e) => setAnticipacionMinimaHoras(Number(e.target.value))}
              >
                <option value={0}>Inmediata (0 hs)</option>
                <option value={1}>1 hora antes</option>
                <option value={2}>2 horas antes</option>
                <option value={4}>4 horas antes</option>
                <option value={12}>12 horas antes</option>
                <option value={24}>24 horas antes</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="anticipacionMax">Ventana Máxima Futura</label>
              <select
                id="anticipacionMax"
                className="input"
                value={anticipacionMaximaDias}
                onChange={(e) => setAnticipacionMaximaDias(Number(e.target.value))}
              >
                <option value={7}>7 días</option>
                <option value={14}>14 días</option>
                <option value={30}>30 días (1 mes)</option>
                <option value={60}>60 días (2 meses)</option>
                <option value={90}>90 días (3 meses)</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="cancelacionMin">Límite para Cancelar</label>
              <select
                id="cancelacionMin"
                className="input"
                value={cancelacionMinimaHoras}
                onChange={(e) => setCancelacionMinimaHoras(Number(e.target.value))}
              >
                <option value={1}>1 hora antes</option>
                <option value={2}>2 horas antes (Recomendado)</option>
                <option value={4}>4 horas antes</option>
                <option value={6}>6 horas antes</option>
                <option value={12}>12 horas antes</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notificacionesWhatsapp}
                onChange={(e) => setNotificacionesWhatsapp(e.target.checked)}
                className="w-4 h-4 rounded-none accent-white cursor-pointer"
              />
              <span className="font-mono text-xs uppercase tracking-wider text-neutral-300">
                Habilitar enlace de aviso y recordatorio directo por WhatsApp
              </span>
            </label>

            <div className="p-3 border border-white/10 bg-white/[0.01]">
              <p className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">
                POLÍTICA DE PAGO: <strong className="text-white">EFECTIVO EN EL LOCAL</strong>
              </p>
              <p className="font-mono text-[10px] text-neutral-500 mt-1">
                Los clientes no abonan seña ni tarjeta online; abonan en mano en el mostrador tras recibir el servicio.
              </p>
            </div>
          </div>
        </section>

        {/* Botón de Guardado */}
        <div className="pt-6 border-t border-white/10 flex justify-end">
          <button
            type="submit"
            disabled={guardando}
            className="btn btn-primario px-8 py-3 text-xs font-mono uppercase"
          >
            {guardando ? 'Guardando...' : 'Guardar Parámetros'}
          </button>
        </div>
      </form>
    </div>
  )
}
