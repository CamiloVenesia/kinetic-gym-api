const mongoose = require('mongoose');


// ─────────────────────────────────────────────
// Ingresos al gimnasio
// ─────────────────────────────────────────────

const ingresoSchema = new mongoose.Schema(
  {
    fecha: {
      type: Date,
      default: Date.now,
      required: true
    }
  },
  {
    _id: false
  }
);


// ─────────────────────────────────────────────
// Historial de pagos
// ─────────────────────────────────────────────

const pagoSchema = new mongoose.Schema(
  {
    fecha: {
      type: Date,
      default: Date.now,
      required: true
    },

    importe: {
      type: Number,
      required: true,
      min: 0
    },

    plan: {
      type: String,
      required: true
    }
  },
  {
    _id: false
  }
);


// ─────────────────────────────────────────────
// Cliente
// ─────────────────────────────────────────────

const clienteSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [
        true,
        'El nombre es obligatorio'
      ],
      trim: true,
      minlength: 3,
      maxlength: 100
    },


    dni: {
      type: String,
      required: [
        true,
        'El DNI es obligatorio'
      ],
      unique: true,
      trim: true,
      match: [
        /^\d{7,8}$/,
        'El DNI debe tener 7 u 8 dígitos'
      ]
    },


    telefono: {
      type: String,
      trim: true,
      maxlength: 30,
      default: ''
    },


    plan: {
      type: String,

      enum: [
        'Mensual 2x',
        'Mensual 3x',
        'Mensual Libre',

        'Semanal 5d',
        'Semanal 3d',
        'Semanal 2d',

        'Pase Diario',

        // Planes anteriores
        'Mensual',
        'Quincenal',
        'Pase libre',
        '10 entradas',
        'Clases grupales'
      ],

      required: [
        true,
        'El plan es obligatorio'
      ]
    },


    metodoPago: {
      type: String,

      enum: [
        'Efectivo',
        'Transferencia',
        'Mercado Pago',
        'Tarjeta débito'
      ],

      default: 'Efectivo'
    },


    fechaInicio: {
      type: Date,
      required: true,
      default: Date.now
    },


    fechaVencimiento: {
      type: Date,
      required: [
        true,
        'La fecha de vencimiento es obligatoria'
      ]
    },


    activo: {
      type: Boolean,
      default: true
    },


    ingresos: {
      type: [ingresoSchema],
      default: []
    },


    pagos: {
      type: [pagoSchema],
      default: []
    }
  },

  {
    timestamps: true,
    versionKey: false
  }
);


// ─────────────────────────────────────────────
// Índices
// ─────────────────────────────────────────────

clienteSchema.index({
  nombre: 1
});


// ─────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────

module.exports = mongoose.model(
  'Cliente',
  clienteSchema
);