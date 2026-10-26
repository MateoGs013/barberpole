import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Reservar from '../Reservar.jsx'
import { AuthContext } from '../../context/AuthContext.jsx'
import { ToastContext } from '../../context/ToastContext.jsx'
import { crearTurnoAPI } from '../../api/turnos.api.js'
import { obtenerDisponibilidadAPI } from '../../api/empleados.api.js'

vi.mock('../../api/servicios.api.js', () => ({
  listarServiciosAPI: vi.fn().mockResolvedValue([
    {
      _id: 'serv1',
      nombre: 'Corte Tradicional',
      precio: 6000,
      duracionMinutos: 30,
      activo: true,
    },
  ]),
}))

vi.mock('../../api/empleados.api.js', () => ({
  listarEmpleadosAPI: vi.fn().mockResolvedValue([
    {
      _id: 'emp1',
      nombre: 'Marcos Barbero',
      especialidad: 'Barba',
      activo: true,
    },
  ]),
  obtenerDisponibilidadAPI: vi.fn().mockResolvedValue({
    slots: [
      { hora: '10:00', fechaHora: '2026-11-15T13:00:00.000Z', disponible: true },
      { hora: '10:30', fechaHora: '2026-11-15T13:30:00.000Z', disponible: false, motivo: 'Ocupado' },
    ],
  }),
}))

vi.mock('../../api/turnos.api.js', () => ({
  crearTurnoAPI: vi.fn().mockResolvedValue({ _id: 't1' }),
}))

const mockAuth = {
  usuario: { id: 'u1', nombre: 'Cliente Test', rol: 'cliente' },
  miCliente: { _id: 'cli1', nombre: 'Cliente Test' },
}

const mockToast = { exito: vi.fn(), error: vi.fn() }

describe('Reservar Component with Slot Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza las 3 secciones del wizard y espera la carga de servicios y profesionales', async () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider value={mockAuth}>
          <ToastContext.Provider value={mockToast}>
            <Reservar />
          </ToastContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/turno/i)
    expect(screen.getByText(/01/i)).toBeInTheDocument()
    expect(screen.getByText(/elegí el servicio/i)).toBeInTheDocument()
    expect(screen.getByText(/02/i)).toBeInTheDocument()
    expect(screen.getByText(/elegí el profesional/i)).toBeInTheDocument()
    expect(screen.getByText(/03/i)).toBeInTheDocument()
    expect(screen.getByText(/elegí día y horario/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /confirmar reserva/i })).toBeDisabled()

    // Wait for async fetch to resolve
    expect(await screen.findByText('Corte Tradicional')).toBeInTheDocument()
    expect(await screen.findByText('Marcos Barbero')).toBeInTheDocument()
  })

  it('permite completar el flujo: elegir servicio, profesional, día, slot y confirmar', async () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider value={mockAuth}>
          <ToastContext.Provider value={mockToast}>
            <Reservar />
          </ToastContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    )

    // 1) Elegir servicio
    const btnServicio = await screen.findByText('Corte Tradicional')
    fireEvent.click(btnServicio)

    // 2) Elegir profesional
    const btnEmpleado = await screen.findByText('Marcos Barbero')
    fireEvent.click(btnEmpleado)

    // 3) Ingresar fecha futura
    const inputFecha = screen.getByLabelText(/día de atención/i)
    fireEvent.change(inputFecha, { target: { value: '2026-11-15' } })

    // Slot Engine debe dispararse y renderizar los slots
    await waitFor(() => {
      expect(obtenerDisponibilidadAPI).toHaveBeenCalledWith('emp1', expect.objectContaining({
        fecha: '2026-11-15',
        servicioId: 'serv1',
      }))
    })

    // El slot 10:00 debe estar disponible y 10:30 deshabilitado
    const slot1000 = await screen.findByRole('button', { name: /10:00/i })
    const slot1030 = screen.getByRole('button', { name: /10:30/i })

    expect(slot1000).not.toBeDisabled()
    expect(slot1030).toBeDisabled()

    // 4) Seleccionar slot disponible
    fireEvent.click(slot1000)

    // El botón Confirmar reserva debe habilitarse
    const btnConfirmar = screen.getByRole('button', { name: /confirmar reserva/i })
    expect(btnConfirmar).not.toBeDisabled()

    // 5) Confirmar reserva
    fireEvent.click(btnConfirmar)

    await waitFor(() => {
      expect(crearTurnoAPI).toHaveBeenCalledWith(
        expect.objectContaining({
          cliente: 'cli1',
          empleado: 'emp1',
          servicio: 'serv1',
          fechaHora: '2026-11-15T13:00:00.000Z',
        })
      )
      expect(mockToast.exito).toHaveBeenCalled()
    })
  })
})
