import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Privacidad from '../Privacidad.jsx'
import Terminos from '../Terminos.jsx'
import { ThemeProvider } from '../../context/ThemeContext.jsx'

describe('Páginas Legales y Compliance — Producción', () => {
  it('renderiza la Política de Privacidad con cumplimiento de Google User Data Policy', () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <Privacidad />
        </ThemeProvider>
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: /política de privacidad/i })).toBeInTheDocument()
    expect(screen.getByText(/03 — USO DE DATOS DE GOOGLE/i)).toBeInTheDocument()
    expect(screen.getByText(/Google API Services User Data Policy/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /volver al inicio/i })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: /términos de servicio/i })).toHaveAttribute('href', '/terminos')
  })

  it('renderiza los Términos de Servicio con regla de cancelación mínima de 2 horas', () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <Terminos />
        </ThemeProvider>
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: /términos de servicio/i })).toBeInTheDocument()
    expect(screen.getByText(/02 — POLÍTICA DE CANCELACIÓN Y ANTICIPACIÓN/i)).toBeInTheDocument()
    expect(screen.getByText(/dos \(2\) horas de anticipación/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /volver al inicio/i })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: /política de privacidad/i })).toHaveAttribute('href', '/privacidad')
  })
})
