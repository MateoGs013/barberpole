import mongoose from 'mongoose'

const usuarioSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'El email es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [
        function () {
          return this.authProvider === 'local'
        },
        'La contraseña es obligatoria',
      ],
      select: false,
    },
    googleId: {
      type: String,
      default: null,
      sparse: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    rol: {
      type: String,
      enum: ['superadmin', 'admin', 'empleado', 'cliente'],
      default: 'cliente',
    },
    negocio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Negocio',
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

usuarioSchema.index({ negocio: 1 })

export const Usuario = mongoose.model('Usuario', usuarioSchema)
