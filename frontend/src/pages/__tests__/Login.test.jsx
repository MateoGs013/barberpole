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

  it('renderiza la vista profesional limpia sin botones de demo públicos por defecto', () => {
    renderLogin('/login')

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument()

    // En producción / modo profesional los accesos demo NO están visibles
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

    fireEvent.change(emailInput, { target: { value: 'admin@peluqueria.com' } })
    fireEvent.change(passwordInput, { target: { value: 'admin123' } })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'admin@peluqueria.com',
        password: 'admin123',
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

  it('habilita los accesos rápidos de evaluación únicamente bajo parámetro ?demo=true', () => {
    renderLogin('/login?demo=true')

    expect(screen.getByText(/modo evaluación demo/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^superadmin$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^admin$/i })).toBeInTheDocument()

    // Probar autocompletado bajo ?demo=true
    const btnAdmin = screen.getByRole('button', { name: /^admin$/i })
    fireEvent.click(btnAdmin)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/contraseña/i)
    expect(emailInput.value).toBe('admin@peluqueria.com')
    expect(passwordInput.value).toBe('admin123')
  })
})
