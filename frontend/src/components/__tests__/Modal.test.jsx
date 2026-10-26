import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Modal } from '../Modal.jsx'

describe('Modal Accessibility & Behaviors', () => {
  it('no renderiza nada si abierto es false', () => {
    const { container } = render(
      <Modal abierto={false} onCerrar={vi.fn()} titulo="Mi Modal">
        <p>Contenido</p>
      </Modal>
    )
    expect(container.firstChild).toBeNull()
  })

  it('renderiza con atributos ARIA accesibles (role="dialog", aria-modal="true")', () => {
    render(
      <Modal abierto={true} onCerrar={vi.fn()} titulo="Turno Nuevo">
        <p>Contenido accesible</p>
      </Modal>
    )

    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-titulo')
    expect(screen.getByText('Turno Nuevo')).toBeInTheDocument()
    expect(screen.getByText('Contenido accesible')).toBeInTheDocument()
  })

  it('llama a onCerrar cuando se presiona la tecla Escape', () => {
    const mockCerrar = vi.fn()
    render(
      <Modal abierto={true} onCerrar={mockCerrar} titulo="Cerrable">
        <button>Aceptar</button>
      </Modal>
    )

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(mockCerrar).toHaveBeenCalledTimes(1)
  })
})
