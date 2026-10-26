import { useState, useMemo } from 'react'
import { soundManager } from '../utils/sound.js'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const DIAS_SEMANA = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM']

const MESES = [
  'ENERO',
  'FEBRERO',
  'MARZO',
  'ABRIL',
  'MAYO',
  'JUNIO',
  'JULIO',
  'AGOSTO',
  'SEPTIEMBRE',
  'OCTUBRE',
  'NOVIEMBRE',
  'DICIEMBRE',
]

export function MatrixCalendar({
  fechaSeleccionada,
  onSeleccionarFecha,
  minFecha,
  diasConTurnos,
}) {
  const fechaActual = useMemo(() => {
    if (fechaSeleccionada) {
      const [y, m, d] = fechaSeleccionada.split('-').map(Number)
      return new Date(y, m - 1, d)
    }
    return new Date()
  }, [fechaSeleccionada])

  const [mesVista, setMesVista] = useState(fechaActual.getMonth())
  const [anioVista, setAnioVista] = useState(fechaActual.getFullYear())

  const hoyStr = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const minStr = minFecha || hoyStr

  const irMesAnterior = () => {
    soundManager.playClick()
    if (mesVista === 0) {
      setMesVista(11)
      setAnioVista((a) => a - 1)
    } else {
      setMesVista((m) => m - 1)
    }
  }

  const irMesSiguiente = () => {
    soundManager.playClick()
    if (mesVista === 11) {
      setMesVista(0)
      setAnioVista((a) => a + 1)
    } else {
      setMesVista((m) => m + 1)
    }
  }

  const diasMes = useMemo(() => {
    const primerDiaMes = new Date(anioVista, mesVista, 1)
    const ultimoDiaMes = new Date(anioVista, mesVista + 1, 0)
    const totalDias = ultimoDiaMes.getDate()

    let diaSemanaInicio = primerDiaMes.getDay() - 1
    if (diaSemanaInicio === -1) diaSemanaInicio = 6

    const slots = []
    for (let i = 0; i < diaSemanaInicio; i++) {
      slots.push({ tipo: 'vacio', id: `empty-${i}` })
    }

    for (let d = 1; d <= totalDias; d++) {
      const mesFormat = String(mesVista + 1).padStart(2, '0')
      const diaFormat = String(d).padStart(2, '0')
      const isoStr = `${anioVista}-${mesFormat}-${diaFormat}`

      const esPasado = isoStr < minStr
      const esHoy = isoStr === hoyStr
      const esSeleccionado = isoStr === fechaSeleccionada

      slots.push({
        tipo: 'dia',
        numero: d,
        isoStr,
        esPasado,
        esHoy,
        esSeleccionado,
        id: isoStr,
      })
    }

    return slots
  }, [anioVista, mesVista, fechaSeleccionada, hoyStr, minStr])

  const infoSeleccionada = useMemo(() => {
    if (!fechaSeleccionada) return null
    const [y, m, d] = fechaSeleccionada.split('-').map(Number)
    const dateObj = new Date(y, m - 1, d)
    const diaNum = d
    const mesNom = MESES[m - 1]
    const anioNum = y
    const diaSem = DIAS_SEMANA[dateObj.getDay() === 0 ? 6 : dateObj.getDay() - 1]
    return { diaNum, mesNom, anioNum, diaSem }
  }, [fechaSeleccionada])

  const manejarClickDia = (isoStr, esPasado) => {
    if (esPasado) return
    soundManager.playPop()
    onSeleccionarFecha?.(isoStr)
  }

  return (
    <div className="bg-transparent border border-white/10 p-5 md:p-6 text-white select-none">
      {/* Display SWA B&W */}
      <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5 mb-5">
        <div className="flex items-baseline gap-4">
          <span className="font-mono font-light text-6xl md:text-8xl text-white leading-none tracking-tight">
            {infoSeleccionada ? infoSeleccionada.diaNum : fechaActual.getDate()}
          </span>
          <div>
            <h3 className="font-mono font-medium text-lg md:text-xl text-white tracking-tight uppercase">
              {infoSeleccionada ? infoSeleccionada.mesNom : MESES[mesVista]}
            </h3>
            <div className="flex items-center gap-2 font-mono text-xs text-neutral-400 uppercase tracking-widest mt-0.5">
              <span>'{String(infoSeleccionada ? infoSeleccionada.anioNum : anioVista).slice(-2)}</span>
              <span>—</span>
              <span className="text-white font-medium">
                {infoSeleccionada ? infoSeleccionada.diaSem : 'SELECCIONÁ DÍA'}
              </span>
            </div>
          </div>
        </div>

        {/* Navegación de Mes */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            tabIndex={-1}
            onClick={irMesAnterior}
            className="w-8 h-8 border border-white/10 hover:border-white text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Mes anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            tabIndex={-1}
            onClick={irMesSiguiente}
            className="w-8 h-8 border border-white/10 hover:border-white text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Mes siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-2 mb-3 text-center">
        {DIAS_SEMANA.map((d) => (
          <span
            key={d}
            className="font-mono text-[10px] uppercase tracking-widest text-neutral-500"
          >
            {d}
          </span>
        ))}
      </div>

      {/* Matriz de Círculos / Puntos B&W */}
      <div className="grid grid-cols-7 gap-2 place-items-center">
        {diasMes.map((item) => {
          if (item.tipo === 'vacio') {
            return <div key={item.id} className="w-8 h-8" />
          }

          const { numero, isoStr, esPasado, esHoy, esSeleccionado } = item

          return (
            <button
              key={isoStr}
              type="button"
              disabled={esPasado}
              onClick={() => manejarClickDia(isoStr, esPasado)}
              className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs transition-colors select-none cursor-pointer ${
                esPasado
                  ? 'opacity-20 text-neutral-600 cursor-not-allowed bg-transparent'
                  : esSeleccionado
                    ? 'bg-white text-black font-semibold'
                    : esHoy
                      ? 'border border-white text-white'
                      : 'border border-white/10 text-neutral-400 hover:text-white hover:border-white/40'
              }`}
            >
              {numero}
            </button>
          )
        })}
      </div>

      {/* Referencia técnica accesible */}
      <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 pt-4 mt-4 border-t border-white/10 uppercase tracking-wider">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-white" /> Elegido
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full border border-white" /> Hoy
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full border border-white/20" /> Disponible
          </span>
        </div>

        <div className="relative">
          <label htmlFor="fecha" className="sr-only">
            Día de atención
          </label>
          <input
            id="fecha"
            type="date"
            min={minStr}
            value={fechaSeleccionada || ''}
            onChange={(e) => onSeleccionarFecha?.(e.target.value)}
            className="text-[10px] font-mono bg-transparent border border-white/10 px-1 py-0.5 text-neutral-400 focus:outline-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  )
}
