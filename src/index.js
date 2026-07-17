// ─────────────────────────────────────────────
//  src/index.js  —  Punto de entrada del servidor
// ─────────────────────────────────────────────
const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
require('dotenv').config();

const clientesRoutes = require('./routes/clientes.routes');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares globales ──
app.use(cors({
  origin: process.env.FRONTEND_URL || '*'
}));
app.use(express.json()); // permite leer JSON en el body de los requests

// ── Rutas ──
app.use('/api/clientes', clientesRoutes);

// Ruta de salud: útil para verificar que el servidor está vivo
app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok', mensaje: 'Kinetic API funcionando 💪' });
});

// ── Conexión a MongoDB y arranque ──
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Conectado a MongoDB Atlas');
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ Error al conectar con MongoDB:', error.message);
    process.exit(1);
  });
