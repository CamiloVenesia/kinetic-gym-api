// ─────────────────────────────────────────────
//  src/controllers/clientes.controller.js
//  Lógica de negocio para cada endpoint
// ─────────────────────────────────────────────
const Cliente = require('../models/cliente.model');

// ── Calcular fecha de vencimiento según plan ──
function calcularVencimiento(fechaInicio, plan) {
  const fecha = new Date(fechaInicio);
  
  // Usamos condicionales flexibles para detectar los nuevos nombres de planes
  if (plan.startsWith('Semanal')) {
    fecha.setDate(fecha.getDate() + 7);
  } else if (plan === 'Pase Diario') {
    fecha.setDate(fecha.getDate() + 1);
  } else if (plan === 'Quincenal') {
    fecha.setDate(fecha.getDate() + 15);
  } else if (plan === '10 entradas') {
    fecha.setDate(fecha.getDate() + 60);
  } else if (plan === 'Pase libre') {
    fecha.setMonth(fecha.getMonth() + 3);
  } else { 
    // Por defecto: Mensual, Mensual 2x, Mensual 3x, Mensual Libre → mismo día mes siguiente
    const dia = fecha.getDate();
    fecha.setMonth(fecha.getMonth() + 1);
    if (fecha.getDate() !== dia) fecha.setDate(0);
  }
  return fecha;
}

// ── Límites semanales por plan ──
const LIMITES_SEMANALES = {
  'Mensual 2x':  2,
  'Mensual 3x':  3,
  'Semanal 2d':  2,
  'Semanal 3d':  3,
  'Semanal 5d':  5,
  // Mensual Libre, Pase libre, 10 entradas, Pase Diario → sin límite
};

// ── Devuelve el lunes 00:00:00 de la semana de una fecha dada ──
function getLunesDeLaSemana(fecha) {
  const d = new Date(fecha);
  const dia = d.getDay(); // 0=domingo, 1=lunes...
  const diff = dia === 0 ? -6 : 1 - dia; // si es domingo, retrocede 6 días
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}


// ──────────────────────────────────────────────
//  GET /api/clientes
//  Devuelve todos los clientes
// ──────────────────────────────────────────────
const getClientes = async (req, res) => {
  try {
    const clientes = await Cliente.find().sort({ createdAt: -1 });
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener clientes', error: error.message });
  }
};

// ──────────────────────────────────────────────
//  GET /api/clientes/dni/:dni
//  Busca un cliente por DNI — lo usa el kiosko
// ──────────────────────────────────────────────
const getClientePorDNI = async (req, res) => {
  try {
    const cliente = await Cliente.findOne({ dni: req.params.dni });

    if (!cliente) {
      return res.status(404).json({ encontrado: false, mensaje: 'DNI no registrado' });
    }

    const hoy    = new Date();
    const activo = cliente.fechaVencimiento >= hoy;

    // ── Control de límite semanal ──
    const limite = LIMITES_SEMANALES[cliente.plan];
    let bloqueadoPorLimite = false;
    let ingresosEstaSemana = 0;

    if (activo && limite) {
      const lunes = getLunesDeLaSemana(hoy);
      ingresosEstaSemana = (cliente.ingresos || []).filter(i => {
        const f = new Date(i.fecha);
        return f >= lunes;
      }).length;

      if (ingresosEstaSemana >= limite) {
        bloqueadoPorLimite = true;
      }
    }

    res.json({
      encontrado: true,
      activo,
      bloqueadoPorLimite,
      limite,
      ingresosEstaSemana,
      nombre: cliente.nombre,
      plan:   cliente.plan,
      vence:  cliente.fechaVencimiento,
      _id:    cliente._id
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error en la búsqueda', error: error.message });
  }
};


// ──────────────────────────────────────────────
//  POST /api/clientes
//  Crea un nuevo cliente (inscripción)
// ──────────────────────────────────────────────
const crearCliente = async (req, res) => {
  try {
    const { nombre, dni, telefono, plan, metodoPago, fechaInicio } = req.body;

    // Verificar si ya existe el DNI
    const existe = await Cliente.findOne({ dni });
    if (existe) {
      return res.status(400).json({ mensaje: 'Ya existe un cliente con ese DNI' });
    }

    const inicio      = fechaInicio ? new Date(fechaInicio) : new Date();
    const vencimiento = calcularVencimiento(inicio, plan);

    const nuevoCliente = new Cliente({
      nombre,
      dni,
      telefono,
      plan,
      metodoPago,
      fechaInicio:       inicio,
      fechaVencimiento:  vencimiento,
      activo: true
    });

    const clienteGuardado = await nuevoCliente.save();
    res.status(201).json(clienteGuardado);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al crear cliente', error: error.message });
  }
};

// ──────────────────────────────────────────────
//  PUT /api/clientes/:id
//  Edita un cliente existente
// ──────────────────────────────────────────────
const editarCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!cliente) return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    res.json(cliente);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al editar cliente', error: error.message });
  }
};

// ──────────────────────────────────────────────
//  DELETE /api/clientes/:id
//  Elimina un cliente
// ──────────────────────────────────────────────
const eliminarCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findByIdAndDelete(req.params.id);
    if (!cliente) return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    res.json({ mensaje: `Cliente ${cliente.nombre} eliminado correctamente` });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar cliente', error: error.message });
  }
};

// ──────────────────────────────────────────────
//  POST /api/clientes/:id/ingreso
//  Registra un ingreso al kiosko (historial)
// ──────────────────────────────────────────────
const registrarIngreso = async (req, res) => {
  try {
    const cliente = await Cliente.findByIdAndUpdate(
      req.params.id,
      { $push: { ingresos: { fecha: new Date() } } },
      { new: true }
    );
    if (!cliente) return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    res.json({ mensaje: 'Ingreso registrado', cliente });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al registrar ingreso', error: error.message });
  }
};

// ──────────────────────────────────────────────
//  POST /api/clientes/:id/renovar
//  Renueva la cuota y registra el pago
// ──────────────────────────────────────────────
const renovarCuota = async (req, res) => {
  try {
    // Aceptamos la fechaVencimiento directamente desde el body (calculada en el frontend)
    const { plan, importe, fechaVencimiento } = req.body;
    
    if (!fechaVencimiento) {
      return res.status(400).json({ mensaje: 'Falta la fecha de vencimiento' });
    }

    const cliente = await Cliente.findByIdAndUpdate(
      req.params.id,
      {
        plan,
        activo: true,
        fechaVencimiento: new Date(fechaVencimiento),
        $push: { pagos: { fecha: new Date(), importe, plan } }
      },
      { new: true, runValidators: true }
    );

    if (!cliente) return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    res.json({ mensaje: 'Cuota renovada correctamente', cliente });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al renovar cuota', error: error.message });
  }
};

module.exports = {
  getClientes,
  getClientePorDNI,
  crearCliente,
  editarCliente,
  eliminarCliente,
  registrarIngreso,
  renovarCuota
};
