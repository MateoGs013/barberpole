/**
 * BarberPole Studio — Utilidades de Integración de Calendario & Automatizaciones
 * Soporta Google Calendar (1-Click URL), iCalendar (.ics para Apple/Outlook)
 * y Deep-Link de confirmación instantánea vía WhatsApp.
 */

function formatearFechaIsoUtc(date) {
  const anio = date.getUTCFullYear()
  const mes = String(date.getUTCMonth() + 1).padStart(2, '0')
  const dia = String(date.getUTCDate()).padStart(2, '0')
  const hora = String(date.getUTCHours()).padStart(2, '0')
  const min = String(date.getUTCMinutes()).padStart(2, '0')
  const seg = String(date.getUTCSeconds()).padStart(2, '0')
  return `${anio}${mes}${dia}T${hora}${min}${seg}Z`
}

export function generarGoogleCalendarUrl({
  titulo = 'Turno en BarberPole Studio',
  descripcion = 'Reserva confirmada en BarberPole Studio.',
  ubicacion = 'Studio Palermo, Palermo Soho, CABA',
  fechaHora,
  duracionMinutos = 30,
}) {
  const inicio = new Date(fechaHora)
  if (isNaN(inicio.getTime())) return null

  const fin = new Date(inicio.getTime() + duracionMinutos * 60 * 1000)
  const fechasUtc = `${formatearFechaIsoUtc(inicio)}/${formatearFechaIsoUtc(fin)}`

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: titulo,
    dates: fechasUtc,
    details: descripcion,
    location: ubicacion,
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function generarIcsContent({
  titulo = 'Turno en BarberPole Studio',
  descripcion = 'Reserva confirmada en BarberPole Studio.',
  ubicacion = 'Studio Palermo, Palermo Soho, CABA',
  fechaHora,
  duracionMinutos = 30,
  uid = `turno-${Date.now()}@barberpole.app`,
}) {
  const inicio = new Date(fechaHora)
  if (isNaN(inicio.getTime())) return ''

  const fin = new Date(inicio.getTime() + duracionMinutos * 60 * 1000)
  const dtStamp = formatearFechaIsoUtc(new Date())
  const dtStart = formatearFechaIsoUtc(inicio)
  const dtEnd = formatearFechaIsoUtc(fin)

  // Escapar saltos de línea para el estándar iCalendar
  const descEscapada = descripcion.replace(/\n/g, '\\n')

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BarberPole Studio//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${titulo}`,
    `DESCRIPTION:${descEscapada}`,
    `LOCATION:${ubicacion}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Recordatorio de Turno en BarberPole',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

export function descargarIcs(params, nombreArchivo = 'turno-barberpole.ics') {
  const contenido = generarIcsContent(params)
  if (!contenido) return

  const blob = new Blob([contenido], { type: 'text/calendar;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.setAttribute('download', nombreArchivo)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function generarWhatsAppUrl({
  telefono = '',
  servicio = 'Corte Tradicional',
  barbero = 'Barbero',
  fecha = '',
  hora = '',
  salon = 'BarberPole Studio',
  direccion = 'Palermo Soho, CABA',
  codigo = 'BP-2026',
}) {
  const texto = [
    `*CONFIRMACIÓN DE TURNO — ${salon.toUpperCase()}*`,
    ``,
    `✂ *Servicio:* ${servicio}`,
    `👤 *Profesional:* ${barbero}`,
    `📅 *Fecha:* ${fecha}`,
    `⏰ *Horario:* ${hora} hs`,
    `📍 *Ubicación:* ${direccion}`,
    `🔖 *Código:* ${codigo}`,
    ``,
    `Reserva gestionada automáticamente vía BarberPole Studio.`,
  ].join('\n')

  const telefonoLimpio = telefono.replace(/[^0-9]/g, '')
  const query = encodeURIComponent(texto)
  return telefonoLimpio
    ? `https://wa.me/${telefonoLimpio}?text=${query}`
    : `https://wa.me/?text=${query}`
}
