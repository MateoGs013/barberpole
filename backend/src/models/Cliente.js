import mongoose from 'mongoose'

const clienteSchema = new mongoose.Schema(
  {
    negocio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Negocio',
      default: null,
      index: true,
    },
    nombre: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: '' },
    telefono: { type: String, trim: true, default: '' },
    notas: { type: String, trim: true, default: '' },
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      default: null,
    },
  },
  { timestamps: true }
)

clienteSchema.index({ negocio: 1, usuario: 1 })
clienteSchema.index({ usuario: 1 })
clienteSchema.index({ email: 1 })
clienteSchema.index({ nombre: 1 })

export const Cliente = mongoose.model('Cliente', clienteSchema)
