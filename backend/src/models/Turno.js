import mongoose from 'mongoose'

const turnoSchema = new mongoose.Schema(
  {
    negocio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Negocio',
      default: null,
      index: true,
    },
    cliente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cliente',
      required: true,
    },
    empleado: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Empleado',
      required: true,
    },
    servicio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Servicio',
      required: true,
    },
    fechaHora: { type: Date, required: true },
    fechaHoraFin: { type: Date, required: true },
    precioCobrado: {
      type: Number,
      required: true,
      min: [0, 'El precio cobrado no puede ser negativo'],
    },
    duracionMinutos: {
      type: Number,
      required: true,
      min: [5, 'La duración mínima es 5 minutos'],
    },
    estado: {
      type: String,
      enum: ['pendiente', 'confirmado', 'completado', 'cancelado'],
      default: 'pendiente',
    },
    notas: { type: String, trim: true, default: '' },
    googleCalendarEventId: { type: String, default: null },
  },
  { timestamps: true }
)

turnoSchema.index({ negocio: 1, fechaHora: 1 })
turnoSchema.index({ empleado: 1, fechaHora: 1 })
turnoSchema.index({ cliente: 1, fechaHora: 1 })
turnoSchema.index({ estado: 1, fechaHora: 1 })

export const Turno = mongoose.model('Turno', turnoSchema)
