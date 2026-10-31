import { Modal } from './Modal.jsx'

export function ModalConfirmacion({
  abierto,
  onCerrar,
  onConfirmar,
  titulo = 'Confirmar acción',
  mensaje,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  peligro = false,
}) {
  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo={titulo} ancho="max-w-md">
      <p className="font-sans text-sm text-muted mb-6 leading-relaxed">{mensaje}</p>
      <div className="flex gap-2.5 pt-4 border-t border-ink/10">
        <button onClick={onCerrar} className="btn btn-secundario flex-1">
          {textoCancelar}
        </button>
        <button
          onClick={onConfirmar}
          className={`btn ${peligro ? 'btn-peligro' : 'btn-primario'} flex-1`}
        >
          {textoConfirmar}
        </button>
      </div>
    </Modal>
  )
}
