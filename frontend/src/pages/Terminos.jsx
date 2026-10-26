import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { ThemeToggle } from '../components/ThemeToggle.jsx'

export default function Terminos() {
  return (
    <div className="min-h-screen w-full bg-black text-white flex flex-col justify-between p-6 sm:p-10 md:p-16 lg:p-20 selection:bg-white selection:text-black">
      {/* Header Editorial B&W */}
      <header className="w-full border-b border-white/10 pb-6 flex items-center justify-between text-xs font-mono uppercase tracking-widest text-neutral-400">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al inicio</span>
        </Link>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <span className="hidden sm:inline text-white font-medium">BARBERPOLE — LEGAL</span>
        </div>
      </header>

      {/* Main Document Content */}
      <main className="max-w-3xl w-full mx-auto my-12 space-y-12">
        <div className="space-y-3 border-b border-white/10 pb-8">
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-500">
            — TÉRMINOS & CONDICIONES DE USO
          </p>
          <h1 className="text-3xl sm:text-5xl font-mono font-medium tracking-tight text-white uppercase">
            TÉRMINOS DE{' '}
            <br />
            SERVICIO.
          </h1>
          <p className="font-mono text-xs text-neutral-400 uppercase tracking-wider">
            Última actualización: Octubre 2026 · Versión 1.0 Producción
          </p>
        </div>

        {/* Secciones */}
        <div className="space-y-10 text-sm leading-relaxed text-neutral-300 font-sans font-light">
          {/* Sección 1 */}
          <section className="space-y-3">
            <h2 className="font-mono text-xs text-white uppercase tracking-widest">
              01 — OBJETO DEL SERVICIO
            </h2>
            <p>
              BarberPole provee infraestructura de software como servicio (SaaS) multitenant para la gestión de turnos, cálculo de disponibilidad en tiempo real mediante Slot Engine y sincronización de agendas. La plataforma no participa ni es parte en la relación comercial o de prestación de servicios entre el negocio/profesional y su cliente.
            </p>
          </section>

          {/* Sección 2 */}
          <section className="space-y-3">
            <h2 className="font-mono text-xs text-white uppercase tracking-widest">
              02 — POLÍTICA DE CANCELACIÓN Y ANTICIPACIÓN
            </h2>
            <p>
              Para preservar la previsibilidad operativa de los profesionales, el sistema impone una regla técnica de cancelación de al menos dos (2) horas de anticipación previa al inicio del turno. Las cancelaciones solicitadas con menor anticipación deberán ser coordinadas directamente entre las partes vía WhatsApp o canal de contacto directo.
            </p>
          </section>

          {/* Sección 3 */}
          <section className="space-y-3">
            <h2 className="font-mono text-xs text-white uppercase tracking-widest">
              03 — RESPONSABILIDAD DE LOS NEGOCIOS
            </h2>
            <p>
              Cada negocio o profesional independiente es el único responsable de la veracidad de los precios, horarios de apertura y cierre, tiempos de atención configurados y de la efectiva prestación del servicio pactado.
            </p>
          </section>

          {/* Sección 4 */}
          <section className="space-y-3">
            <h2 className="font-mono text-xs text-white uppercase tracking-widest">
              04 — DISPONIBILIDAD Y SINCRONIZACIÓN EXTERNA
            </h2>
            <p>
              La sincronización con Google Calendar depende de la disponibilidad de las APIs oficiales de Google. BarberPole implementa mecanismos de tolerancia a fallos y verificación atómica de concurrencia para evitar sobre-reservas en todo momento.
            </p>
          </section>

          {/* Sección 5 */}
          <section className="space-y-3">
            <h2 className="font-mono text-xs text-white uppercase tracking-widest">
              05 — PLANES Y MEMBRESÍAS
            </h2>
            <p>
              Los negocios registrados en el plan Free disponen de las capacidades esenciales del motor de turnos. Los planes avanzados (Pro y Enterprise) amplían los límites de profesionales, personalización de buffer y soporte prioritario conforme a los términos vigentes al momento de la suscripción.
            </p>
          </section>
        </div>
      </main>

      {/* Footer Editorial B&W */}
      <footer className="w-full border-t border-white/10 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-mono uppercase tracking-widest text-neutral-500">
        <div>
          <span>BARBERPOLE — TÉRMINOS & CONDICIONES</span>
        </div>
        <div className="flex items-center gap-4 text-neutral-400">
          <Link to="/privacidad" className="hover:text-white transition-colors">
            Política de Privacidad →
          </Link>
        </div>
      </footer>
    </div>
  )
}
