import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Login from '../Login.jsx'
import { AuthContext } from '../../context/AuthContext.jsx'
import { ToastContext } from '../../context/ToastContext.jsx'

const mockLogin = vi.fn().mockResolvedValue({})
const mockToast = { exito: vi.fn(), error: vi.fn() }

const renderLogin = (rutaInicial = '/login') => {
  return render(
    <MemoryRouter initialEntries={[rutaInicial]}>
      <AuthContext.Provider value={{ login: mockLogin }}>
        <ToastContext.Provider value={mockToast}>
          <Login />
        </ToastContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>
  )
}

describe('Login Component — Profesional & Zen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza la vista profesional limpia sin botones de demo ni credenciales expuestas', () => {
    renderLogin('/login')

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument()

    // En producción los accesos demo y botones hardcodeados NO existen
    expect(screen.queryByRole('button', { name: /^superadmin$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^admin$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^barbero$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^cliente$/i })).not.toBeInTheDocument()
  })

  it('permite ingresar credenciales manualmente y autenticar', async () => {
    renderLogin('/login')

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/contraseña/i)
    const submitBtn = screen.getByRole('button', { name: /iniciar sesión/i })

    fireEvent.change(emailInput, { target: { value: 'usuario@empresa.com' } })
    fireEvent.change(passwordInput, { target: { value: 'ContraseñaSegura123!' } })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'usuario@empresa.com',
        password: 'ContraseñaSegura123!',
      })
    })
  })

  it('valida campos obligatorios si se intenta enviar vacío', () => {
    renderLogin('/login')

    const submitBtn = screen.getByRole('button', { name: /iniciar sesión/i })
    fireEvent.click(submitBtn)

    expect(screen.getByText(/ingresá tu email/i)).toBeInTheDocument()
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('no expone accesos de prueba ni atajos hardcodeados incluso con query params', () => {
    renderLogin('/login?demo=true')

    expect(screen.queryByText(/modo evaluación demo/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^superadmin$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^admin$/i })).not.toBeInTheDocument()
  })
})
