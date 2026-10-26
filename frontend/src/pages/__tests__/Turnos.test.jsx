import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Turnos from '../Turnos.jsx'
import { AuthContext } from '../../context/AuthContext.jsx'
import { ToastContext } from '../../context/ToastContext.jsx'
import { cancelarTurnoAPI } from '../../api/turnos.api.js'

vi.mock('../../api/turnos.api.js', () => ({
  listarTurnosAPI: vi.fn().mockResolvedValue([
    {
      _id: 'turno1',
      fechaHora: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      estado: 'confirmado',
      duracionMinutos: 30,
      precioCobrado: 8500,
      cliente: { _id: 'cli1', nombre: 'Agustin Cliente' },
      empleado: { _id: 'emp1', nombre: 'Lucas Barbero' },
      servicio: { _id: 'serv1', nombre: 'Corte Fade' },
    },
  ]),
  crearTurnoAPI: vi.fn(),
  actualizarTurnoAPI: vi.fn(),
  eliminarTurnoAPI: vi.fn(),
  cancelarTurnoAPI: vi.fn().mockResolvedValue({ _id: 'turno1', estado: 'cancelado' }),
}))

vi.mock('../../api/clientes.api.js', () => ({
  listarClientesAPI: vi.fn().mockResolvedValue([]),
}))
vi.mock('../../api/empleados.api.js', () => ({
  listarEmpleadosAPI: vi.fn().mockResolvedValue([]),
}))
vi.mock('../../api/servicios.api.js', () => ({
  listarServiciosAPI: vi.fn().mockResolvedValue([]),
}))

const mockClienteAuth = {
  usuario: { id: 'u1', nombre: 'Agustin Cliente', rol: 'cliente' },
  miCliente: { _id: 'cli1', nombre: 'Agustin Cliente' },
}

const mockToast = { exito: vi.fn(), error: vi.fn() }

describe('Turnos Component & Client Cancellation Confirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza turnos del cliente y muestra modal de confirmación antes de cancelar', async () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider value={mockClienteAuth}>
          <ToastContext.Provider value={mockToast}>
            <Turnos />
          </ToastContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    )

    // Espera a que cargue el turno
    expect(await screen.findByText('Agustin Cliente')).toBeInTheDocument()
    expect(screen.getByText(/Corte Fade/)).toBeInTheDocument()
    expect(screen.getByText(/Lucas Barbero/)).toBeInTheDocument()

    // El botón Cancelar reserva debe estar presente para el cliente
    const btnCancelar = screen.getByRole('button', { name: /cancelar reserva/i })
    expect(btnCancelar).toBeInTheDocument()

    // Clic en cancelar reserva
    fireEvent.click(btnCancelar)

    // Debe abrirse el modal de confirmación
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Cancelar reserva' })).toBeInTheDocument()
    expect(screen.getByText(/al menos 2 horas de anticipación/i)).toBeInTheDocument()

    // Confirmar en el modal
    const btnConfirmarModal = screen.getByRole('button', { name: 'Cancelar turno' })
    fireEvent.click(btnConfirmarModal)

    await waitFor(() => {
      expect(cancelarTurnoAPI).toHaveBeenCalledWith('turno1')
      expect(mockToast.exito).toHaveBeenCalledWith('Turno cancelado correctamente')
    })
  })
})
