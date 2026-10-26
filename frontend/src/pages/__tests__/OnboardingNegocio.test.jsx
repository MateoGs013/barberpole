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

describe('OnboardingNegocio SaaS Flow — Universal', () => {
  it('renderiza el paso 1 de identidad con selección de modalidad y auto-genera el slug en vivo', () => {
    renderOnboarding()

    expect(screen.getByText(/identidad & modalidad/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /local \/ salón/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /particular \/ estudio/i })).toBeInTheDocument()

    const inputNombre = screen.getByLabelText(/nombre del negocio, salón o profesional/i)
    expect(inputNombre).toBeInTheDocument()

    fireEvent.change(inputNombre, { target: { value: 'La Nave Barber' } })

    const inputSlug = screen.getByPlaceholderText(/tu-estudio/i)
    expect(inputSlug.value).toBe('la-nave-barber')
  })

  it('permite alternar a modalidad particular y muestra opción de dirección privada', () => {
    renderOnboarding()

    const btnParticular = screen.getByRole('button', { name: /particular \/ estudio/i })
    fireEvent.click(btnParticular)

    expect(screen.getByLabelText(/dirección privada/i)).toBeInTheDocument()
  })

  it('valida campos obligatorios antes de avanzar al paso 2', () => {
    renderOnboarding()

    const btnContinuar = screen.getByRole('button', { name: /continuar a datos de acceso/i })
    fireEvent.click(btnContinuar)

    expect(screen.getByText(/ingresá el nombre del negocio o estudio/i)).toBeInTheDocument()
  })
})
