import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import OnboardingNegocio from '../OnboardingNegocio.jsx'
import { AuthContext } from '../../context/AuthContext.jsx'
import { ToastContext } from '../../context/ToastContext.jsx'

vi.mock('../../api/negocios.api.js', () => ({
  onboardingNegocioAPI: vi.fn().mockResolvedValue({
    token: 'fake-token-123',
    usuario: { id: 'u1', nombre: 'Mateo', email: 'mateo@estudio.io', rol: 'admin' },
    negocio: { id: 'n1', nombre: 'Test Studio', slug: 'test-studio', plan: 'pro' },
  }),
}))

const mockLoginConToken = vi.fn()
const mockToast = { exito: vi.fn(), error: vi.fn() }

const renderOnboarding = () => {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={{ loginConToken: mockLoginConToken }}>
        <ToastContext.Provider value={mockToast}>
          <OnboardingNegocio />
        </ToastContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>
  )
}

describe('OnboardingNegocio SaaS Flow', () => {
  it('renderiza el paso 1 de identidad y auto-genera el slug de reserva en vivo', () => {
    renderOnboarding()

    expect(screen.getByText(/configurá tu salón/i)).toBeInTheDocument()
    const inputNombre = screen.getByPlaceholderText(/ej\. barbería la nave/i)
    expect(inputNombre).toBeInTheDocument()

    fireEvent.change(inputNombre, { target: { value: 'La Nave Barber' } })

    const inputSlug = screen.getByPlaceholderText(/mi-salon/i)
    expect(inputSlug.value).toBe('la-nave-barber')
  })

  it('valida campos obligatorios antes de avanzar al paso 2', () => {
    renderOnboarding()

    const btnContinuar = screen.getByRole('button', { name: /continuar a datos del dueño/i })
    fireEvent.click(btnContinuar)

    expect(screen.getByText(/ingresá el nombre del salón/i)).toBeInTheDocument()
  })
})
