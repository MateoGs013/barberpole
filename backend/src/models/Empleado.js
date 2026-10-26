import mongoose from 'mongoose'

const eventoGoogleSchema = new mongoose.Schema(
  {
    googleEventId: {
      type: String,
      default: () => `gevt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    },
    titulo: { type: String, default: 'Evento personal (Google Calendar)' },
    inicio: { type: Date, required: true },
    fin: { type: Date, required: true },
  },
  { _id: true }
)

const empleadoSchema = new mongoose.Schema(
  {
    negocio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Negocio',
      default: null,
      index: true,
    },
    nombre: { type: String, required: true, trim: true },
    especialidad: { type: String, required: true, trim: true },
    telefono: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      default: null,
    },
    activo: { type: Boolean, default: true },
    googleCalendarId: { type: String, trim: true, default: null },
    googleSyncActivo: { type: Boolean, default: false },
    eventosGoogle: [eventoGoogleSchema],
  },
  { timestamps: true }
)

empleadoSchema.index({ negocio: 1, activo: 1 })

export const Empleado = mongoose.model('Empleado', empleadoSchema)
