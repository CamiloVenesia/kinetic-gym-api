// ─────────────────────────────────────────────
//  src/models/cliente.model.js
//  Define la "forma" de un cliente en MongoDB
// ─────────────────────────────────────────────
const mongoose = require('mongoose');

const ingresoSchema = new mongoose.Schema({
  fecha: { type: Date, default: Date.now }
}, { _id: false });

const clienteSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true
    },
    dni: {
      type: String,
      required: [true, 'El DNI es obligatorio'],
      unique: true,
      trim: true
    },
    telefono: {
      type: String,
      default: ''
    },
    plan: {
  type: String,
    enum: [
        // Planes Nuevos
        'Mensual 2x', 'Mensual 3x', 'Mensual Libre', 
        'Semanal 5d', 'Semanal 3d', 'Semanal 2d', 
        'Pase Diario',
        // Planes Legacy (Viejos)
        'Mensual', 'Quincenal', 'Pase libre', '10 entradas', 'Clases grupales'
      ],
      required: true
    },
    metodoPago: {
      type: String,
      enum: ['Efectivo', 'Transferencia', 'Mercado Pago', 'Tarjeta débito'],
      default: 'Efectivo'
    },
    fechaInicio: {
      type: Date,
      default: Date.now
    },
    fechaVencimiento: {
      type: Date,
      required: true
    },
    activo: {
      type: Boolean,
      default: true
    },
    ingresos: [ingresoSchema],  // historial de cada vez que pasó el kiosko
    pagos: [{                   // historial de pagos de cuotas
      fecha:   { type: Date, default: Date.now },
      importe: { type: Number },
      plan:    { type: String }
    }]
  },
  {
    timestamps: true  // agrega createdAt y updatedAt automáticamente
  }
);

module.exports = mongoose.model('Cliente', clienteSchema);