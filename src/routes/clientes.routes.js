const express = require('express');

const router = express.Router();

const {
  autenticar,
  permitirRoles,
  bloquearDemo
} = require('../middlewares/auth');

const {
  getClientes,
  getClientePorDNI,
  crearCliente,
  editarCliente,
  eliminarCliente,
  registrarIngreso,
  renovarCuota
} = require('../controllers/clientes.controller');


// Todas las rutas requieren sesión válida
router.use(autenticar);


// Consultas
router.get(
  '/',
  getClientes
);

router.get(
  '/dni/:dni',
  getClientePorDNI
);


// Crear cliente
router.post(
  '/',
  bloquearDemo,
  permitirRoles('admin', 'dueno', 'recepcion'),
  crearCliente
);


// Editar cliente
router.put(
  '/:id',
  bloquearDemo,
  permitirRoles('admin', 'dueno', 'recepcion'),
  editarCliente
);


// Eliminar cliente
router.delete(
  '/:id',
  bloquearDemo,
  permitirRoles('admin', 'dueno'),
  eliminarCliente
);


// Registrar ingreso
router.post(
  '/:id/ingreso',
  bloquearDemo,
  permitirRoles('admin', 'dueno', 'recepcion'),
  registrarIngreso
);


// Renovar cuota
router.post(
  '/:id/renovar',
  bloquearDemo,
  permitirRoles('admin', 'dueno', 'recepcion'),
  renovarCuota
);


module.exports = router;