import mongoose from 'mongoose'

const servicioSchema = new mongoose.Schema(
  {
    negocio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Negocio',
      default: null,
      index: true,
    },
    nombre: { type: String, required: [true, 'El nombre es obligatorio'], trim: true },
    descripcion: { type: String, trim: true, default: '' },
    precio: { type: Number, required: true, min: [0, 'El precio no puede ser negativo'] },
    duracionMinutos: {
      type: Number,
      required: true,
      min: [5, 'La duración mínima es 5 minutos'],
    },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
)

servicioSchema.index({ negocio: 1, activo: 1 })

export const Servicio = mongoose.model('Servicio', servicioSchema)
