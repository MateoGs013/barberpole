// Servicio de Integración Oficial con Google Calendar API (v3)
// Maneja flujo OAuth 2.0 (Offline Access con Refresh Token)
// y operaciones REST para creación, actualización y cancelación de eventos en la agenda.

import jwt from 'jsonwebtoken'
import { Empleado } from '../models/Empleado.js'

// Vida del `state` de OAuth: suficiente para completar el consentimiento,
// corta para limitar replays.
const STATE_EXPIRA_EN = '10m'

// Firma el `state` del flujo OAuth con JWT. Antes era JSON plano con el empleadoId,
// lo que permitía a un atacante forjar el callback con el empleadoId de otra persona
// y vincular su cuenta/calendario (CSRF). Firmado, el callback solo acepta estados
// que el propio servidor emitió, y con expiración corta.
const firmarState = (empleadoId) =>
  jwt.sign({ empleadoId: String(empleadoId) }, process.env.JWT_SECRET, {
    expiresIn: STATE_EXPIRA_EN,
  })

// Verifica el `state` del callback y devuelve el empleadoId, o null si es inválido/expirado.
export const verificarStateOAuth = (state) => {
  if (!state) return null
  try {
    const payload = jwt.verify(state, process.env.JWT_SECRET)
    return payload.empleadoId || null
  } catch {
    return null
  }
}

export const generarAuthUrl = (empleadoId, customRedirectUri = null) => {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID no configurado en las variables de entorno del servidor')
  }

  const redirectUri =
    customRedirectUri ||
    process.env.GOOGLE_CALENDAR_REDIRECT_URI ||
    'https://developers.google.com/oauthplayground'

  const scope = [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.readonly',
  ].join(' ')

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope,
    access_type: 'offline',
    prompt: 'consent',
    state: firmarState(empleadoId),
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export const canjearCodigoYVincular = async ({ code, empleadoId, customRedirectUri = null }) => {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri =
    customRedirectUri ||
    process.env.GOOGLE_CALENDAR_REDIRECT_URI ||
    'https://developers.google.com/oauthplayground'

  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET faltantes en el servidor')
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    const errorBody = await tokenRes.text()
    throw new Error(`Error canjeando código con Google Calendar: ${errorBody}`)
  }

  const tokens = await tokenRes.json()
  const empleado = await Empleado.findById(empleadoId).select(
    '+googleAccessToken +googleRefreshToken +googleTokenExpiry'
  )
  if (!empleado) throw new Error('Empleado no encontrado')

  empleado.googleAccessToken = tokens.access_token
  if (tokens.refresh_token) {
    empleado.googleRefreshToken = tokens.refresh_token
  }
  if (tokens.expires_in) {
    empleado.googleTokenExpiry = new Date(Date.now() + tokens.expires_in * 1000)
  }
  empleado.googleSyncActivo = true
  await empleado.save()

  return empleado
}

export const obtenerAccessTokenValido = async (empleado) => {
  if (!empleado.googleRefreshToken && !empleado.googleAccessToken) {
    return null
  }

  const ahora = Date.now()
  const expiraPronto =
    !empleado.googleTokenExpiry ||
    new Date(empleado.googleTokenExpiry).getTime() - ahora < 5 * 60 * 1000

  if (!expiraPronto && empleado.googleAccessToken) {
    return empleado.googleAccessToken
  }

  if (!empleado.googleRefreshToken) {
    return empleado.googleAccessToken || null
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) return null

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: empleado.googleRefreshToken,
        grant_type: 'refresh_token',
      }),
    })

    if (!res.ok) return null
    const data = await res.json()
    empleado.googleAccessToken = data.access_token
    if (data.expires_in) {
      empleado.googleTokenExpiry = new Date(Date.now() + data.expires_in * 1000)
    }
    await empleado.save()
    return data.access_token
  } catch (err) {
    console.error('Error refrescando access_token de Google Calendar:', err)
    return null
  }
}

export const crearEventoGoogleCalendar = async ({
  empleadoId,
  turno,
  cliente,
  servicio,
  negocio,
}) => {
  try {
    const empleado = await Empleado.findById(empleadoId).select(
      '+googleAccessToken +googleRefreshToken +googleTokenExpiry'
    )
    if (!empleado || !empleado.googleSyncActivo) return null

    const token = await obtenerAccessTokenValido(empleado)
    if (!token) return null

    const inicio = new Date(turno.fechaHora)
    const duracion = turno.duracionMinutos || servicio?.duracionMinutos || 30
    const fin = turno.fechaHoraFin
      ? new Date(turno.fechaHoraFin)
      : new Date(inicio.getTime() + duracion * 60_000)

    const calendarId = encodeURIComponent(empleado.googleCalendarId || 'primary')

    const eventoPayload = {
      summary: `Turno: ${servicio?.nombre || 'Servicio'} — ${cliente?.nombre || 'Cliente'}`,
      description: `Reserva confirmada en ${negocio?.nombre || 'BarberPole'}.\nCliente: ${cliente?.nombre || '—'}\nTeléfono: ${cliente?.telefono || '—'}\nServicio: ${servicio?.nombre || '—'}\nPrecio: $${turno.precioCobrado || servicio?.precio || 0}`,
      location: negocio?.direccion || 'Sede Oficial',
      start: { dateTime: inicio.toISOString() },
      end: { dateTime: fin.toISOString() },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 },
          { method: 'email', minutes: 60 },
        ],
      },
    }

    if (cliente?.email) {
      eventoPayload.attendees = [{ email: cliente.email, displayName: cliente.nombre }]
    }

    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventoPayload),
    })

    if (!res.ok) {
      const errTxt = await res.text()
      console.warn('Google Calendar API error al crear evento:', errTxt)
      return null
    }

    const eventData = await res.json()
    return eventData.id
  } catch (err) {
    console.error('Excepción al crear evento en Google Calendar:', err)
    return null
  }
}

export const eliminarEventoGoogleCalendar = async ({ empleadoId, googleCalendarEventId }) => {
  if (
    !googleCalendarEventId ||
    googleCalendarEventId.startsWith('gcal_') ||
    googleCalendarEventId.startsWith('gevt_')
  ) {
    return
  }
  try {
    const empleado = await Empleado.findById(empleadoId).select(
      '+googleAccessToken +googleRefreshToken +googleTokenExpiry'
    )
    if (!empleado) return

    const token = await obtenerAccessTokenValido(empleado)
    if (!token) return

    const calendarId = encodeURIComponent(empleado.googleCalendarId || 'primary')
    await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${googleCalendarEventId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }
    )
  } catch (err) {
    console.error('Excepción al eliminar evento en Google Calendar:', err)
  }
}
