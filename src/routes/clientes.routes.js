// ─────────────────────────────────────────────
//  src/routes/clientes.routes.js
//  Define las URLs y las conecta con el controller
// ─────────────────────────────────────────────
const express = require('express');
const router  = express.Router();

const {
  getClientes,
  getClientePorDNI,
  crearCliente,
  editarCliente,
  eliminarCliente,
  registrarIngreso,
  renovarCuota // <-- Nueva función importada
} = require('../controllers/clientes.controller');

// ┌─────────────────────────────────────────────────────────────┐
// │  URL completa = /api/clientes + lo que está acá abajo       │
// └─────────────────────────────────────────────────────────────┘

router.get('/',              getClientes);         // GET    /api/clientes
router.get('/dni/:dni',      getClientePorDNI);    // GET    /api/clientes/dni/32847651
router.post('/',             crearCliente);        // POST   /api/clientes
router.put('/:id',           editarCliente);       // PUT    /api/clientes/664abc...
router.delete('/:id',        eliminarCliente);     // DELETE /api/clientes/664abc...
router.post('/:id/ingreso',  registrarIngreso);    // POST   /api/clientes/664abc.../ingreso
router.post('/:id/renovar',  renovarCuota);        // POST   /api/clientes/664abc.../renovar <-- Nueva ruta

module.exports = router;