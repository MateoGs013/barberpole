import mongoose from 'mongoose'

const configuracionSchema = new mongoose.Schema(
  {
    horaApertura: { type: String, default: '09:00' },
    horaCierre: { type: String, default: '20:00' },
    intervaloMinutos: { type: Number, default: 30, min: 10, max: 120 },
    moneda: { type: String, default: 'ARS' },
    diasLaborales: {
      type: [Number],
      default: [1, 2, 3, 4, 5, 6], // 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb, 0=Dom
    },
    bufferMinutos: { type: Number, default: 0, min: 0, max: 60 },
    anticipacionMinimaHoras: { type: Number, default: 1, min: 0 },
    anticipacionMaximaDias: { type: Number, default: 30, min: 1, max: 180 },
    cancelacionMinimaHoras: { type: Number, default: 2, min: 0 },
    politicaPago: {
      type: String,
      default: 'efectivo',
      enum: ['efectivo', 'acordar'],
    },
    notificacionesWhatsapp: { type: Boolean, default: true },
    permitirCancelacionCliente: { type: Boolean, default: true },
    direccionPrivada: { type: Boolean, default: false },
    instagram: { type: String, trim: true, default: '' },
    mensajeBienvenida: { type: String, trim: true, default: '' },
    recordatorioHoras: { type: Number, default: 24, min: 1 },
  },
  { _id: false }
)

const negocioSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre del negocio es obligatorio'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'El slug identificador es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones'],
    },
    rubro: {
      type: String,
      enum: ['barberia', 'estetica', 'salud', 'servicios', 'otro'],
      default: 'barberia',
    },
    modalidad: {
      type: String,
      enum: ['local', 'particular'],
      default: 'local',
    },
    descripcion: {
      type: String,
      trim: true,
      default: '',
    },
    direccion: {
      type: String,
      trim: true,
      default: '',
    },
    telefono: {
      type: String,
      trim: true,
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
    },
    plan: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free',
    },
    activo: {
      type: Boolean,
      default: true,
    },
    configuracion: {
      type: configuracionSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
)

export const Negocio = mongoose.model('Negocio', negocioSchema)
