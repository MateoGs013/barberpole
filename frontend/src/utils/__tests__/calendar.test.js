import { describe, it, expect } from 'vitest'
import {
  generarGoogleCalendarUrl,
  generarIcsContent,
  generarWhatsAppUrl,
} from '../calendar.js'

describe('Calendar & WhatsApp Automations Utility', () => {
  const mockParams = {
    titulo: 'Corte Tradicional Navaja — Studio Palermo',
    descripcion: 'Turno confirmado con Mateo Gabús.\nPrecio: $7.000',
    ubicacion: 'Palermo Soho, CABA',
    fechaHora: '2026-10-30T15:00:00.000Z',
    duracionMinutos: 45,
  }

  it('genera correctamente el link de 1-Click a Google Calendar', () => {
    const url = generarGoogleCalendarUrl(mockParams)
    expect(url).toContain('https://calendar.google.com/calendar/render')
    expect(url).toContain('action=TEMPLATE')
    expect(url).toContain('text=Corte+Tradicional+Navaja')
    expect(url).toContain('dates=20261030T150000Z%2F20261030T154500Z')
    expect(url).toContain('location=Palermo+Soho%2C+CABA')
  })

  it('genera contenido iCalendar (.ics) estándar compatible con Apple y Outlook', () => {
    const ics = generarIcsContent(mockParams)
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('VERSION:2.0')
    expect(ics).toContain('SUMMARY:Corte Tradicional Navaja — Studio Palermo')
    expect(ics).toContain('DTSTART:20261030T150000Z')
    expect(ics).toContain('DTEND:20261030T154500Z')
    expect(ics).toContain('TRIGGER:-PT30M')
    expect(ics).toContain('END:VCALENDAR')
  })

  it('genera enlace con mensaje formateado para WhatsApp', () => {
    const waUrl = generarWhatsAppUrl({
      telefono: '+54 11 5522-3344',
      servicio: 'Corte Fade',
      barbero: 'Mateo Gabús',
      fecha: '30/10/2026',
      hora: '15:00',
      salon: 'Studio Palermo',
      codigo: 'BP-9988',
    })
    expect(waUrl).toContain('https://wa.me/541155223344?text=')
    expect(waUrl).toContain('*CONFIRMACI%C3%93N%20DE%20TURNO%20%E2%80%94%20STUDIO%20PALERMO*')
    expect(waUrl).toContain('BP-9988')
  })
})
