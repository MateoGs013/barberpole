import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { ThemeToggle } from '../components/ThemeToggle.jsx'

export default function Privacidad() {
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
            — DOCUMENTO DE COMPLIANCE & PRIVACIDAD
          </p>
          <h1 className="text-3xl sm:text-5xl font-mono font-medium tracking-tight text-white uppercase">
            POLÍTICA DE{' '}
            <br />
            PRIVACIDAD.
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
              01 — RESPONSABLE DEL TRATAMIENTO
            </h2>
            <p>
              BarberPole opera como plataforma SaaS multitenant para la gestión y reserva de turnos en locales comerciales, estudios privados y profesionales independientes. Esta política describe cómo se recopila, utiliza y protege la información suministrada por los usuarios finales (clientes) y los administradores de cada negocio.
            </p>
          </section>

          {/* Sección 2 */}
          <section className="space-y-3">
            <h2 className="font-mono text-xs text-white uppercase tracking-widest">
              02 — INFORMACIÓN RECOPILADA
            </h2>
            <p>
              Recolectamos exclusivamente la información técnica y de contacto necesaria para garantizar la reserva de turnos:
            </p>
            <ul className="space-y-2 pl-4 border-l border-white/10 font-mono text-xs text-neutral-400">
              <li>— Nombre y apellido del usuario o cliente.</li>
              <li>— Dirección de correo electrónico y número de teléfono / WhatsApp.</li>
              <li>— Metadatos de la reserva: fecha, horario, servicio y profesional seleccionado.</li>
              <li>— Datos de sesión generados por tokens criptográficos JWT.</li>
            </ul>
          </section>

          {/* Sección 3 — Google API User Data Policy */}
          <section className="space-y-3 border border-white/15 p-6 bg-white/[0.02]">
            <h2 className="font-mono text-xs text-white uppercase tracking-widest">
              03 — USO DE DATOS DE GOOGLE (GOOGLE USER DATA POLICY)
            </h2>
            <p>
              Nuestra aplicación utiliza Google Identity Services para autenticación 1-Click y Google Calendar API para sincronización de agendas. En cumplimiento con la <strong className="text-white font-medium">Google API Services User Data Policy</strong>:
            </p>
            <ul className="space-y-2 pl-4 border-l border-white/20 font-mono text-xs text-neutral-400">
              <li>
                — <span className="text-white">Autenticación:</span> Obtenemos el ID de usuario de Google, email y foto de perfil únicamente para verificar la identidad y crear la sesión del usuario.
              </li>
              <li>
                — <span className="text-white">Google Calendar:</span> Los eventos externos de la agenda del profesional se consultan exclusivamente para inhabilitar turnos colisionantes en el Slot Engine. No almacenamos el contenido personal confidencial de los eventos.
              </li>
              <li>
                — <span className="text-white">Prohibición de Comercialización:</span> No vendemos, transferimos ni compartimos datos obtenidos a través de Google con terceros, empresas de publicidad ni plataformas de intermediación.
              </li>
            </ul>
          </section>

          {/* Sección 4 */}
          <section className="space-y-3">
            <h2 className="font-mono text-xs text-white uppercase tracking-widest">
              04 — DIRECCIÓN CONFIDENCIAL Y PARTICULARES
            </h2>
            <p>
              Para profesionales que atienden en modalidad particular o en su domicilio privado, la dirección exacta nunca se publica en índices públicos. La ubicación solo se transmite al cliente de forma directa una vez confirmada la reserva.
            </p>
          </section>

          {/* Sección 5 */}
          <section className="space-y-3">
            <h2 className="font-mono text-xs text-white uppercase tracking-widest">
              05 — DERECHOS DEL TITULAR DE LOS DATOS
            </h2>
            <p>
              Cualquier usuario puede solicitar el acceso, rectificación o eliminación total de su cuenta y sus registros históricos de turnos comunicándose a través de los canales oficiales o mediante el panel de configuración de perfil.
            </p>
          </section>
        </div>
      </main>

      {/* Footer Editorial B&W */}
      <footer className="w-full border-t border-white/10 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-mono uppercase tracking-widest text-neutral-500">
        <div>
          <span>BARBERPOLE — PRIVACIDAD & SEGURIDAD</span>
        </div>
        <div className="flex items-center gap-4 text-neutral-400">
          <Link to="/terminos" className="hover:text-white transition-colors">
            Términos de Servicio →
          </Link>
        </div>
      </footer>
    </div>
  )
}
