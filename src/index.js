// ─────────────────────────────────────────────
//  src/index.js — Punto de entrada del servidor
// ─────────────────────────────────────────────

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const helmet = require('helmet');
require('dotenv').config();

const clientesRoutes = require('./routes/clientes.routes');
const authRoutes = require('./routes/auth.routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, '../public');


// ─────────────────────────────────────────────
// Proxy de producción
// ─────────────────────────────────────────────

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}


// ─────────────────────────────────────────────
// Seguridad
// ─────────────────────────────────────────────

app.disable('x-powered-by');

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);


// ─────────────────────────────────────────────
// Middlewares
// ─────────────────────────────────────────────

app.use(
  express.json({
    limit: '100kb'
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '100kb'
  })
);


// ─────────────────────────────────────────────
// API
// ─────────────────────────────────────────────

app.use('/api/auth', authRoutes);

app.use('/api/clientes', clientesRoutes);


// Health check
app.get('/api/ping', (req, res) => {
  res.json({
    status: 'ok',
    mensaje: 'Kinetic API funcionando',
    entorno: process.env.NODE_ENV || 'development'
  });
});


// ─────────────────────────────────────────────
// Frontend
// ─────────────────────────────────────────────

app.use(
  express.static(PUBLIC_DIR)
);

app.get('/', (req, res) => {
  res.sendFile(
    path.join(
      PUBLIC_DIR,
      'index.html'
    )
  );
});


// ─────────────────────────────────────────────
// 404 API
// ─────────────────────────────────────────────

app.use('/api', (req, res) => {
  res.status(404).json({
    mensaje: 'Ruta no encontrada'
  });
});


// ─────────────────────────────────────────────
// Errores
// ─────────────────────────────────────────────

app.use(errorHandler);


// ─────────────────────────────────────────────
// MongoDB + servidor
// ─────────────────────────────────────────────

async function iniciarServidor() {
  try {

    const esProduccion =
      process.env.NODE_ENV === 'production';


    const mongoURI =
      esProduccion
        ? process.env.MONGODB_URI_DEMO
        : process.env.MONGODB_URI;


    if (!mongoURI) {
      throw new Error(
        esProduccion
          ? 'La variable MONGODB_URI_DEMO no está configurada'
          : 'La variable MONGODB_URI no está configurada'
      );
    }


    if (!process.env.JWT_SECRET) {
      throw new Error(
        'La variable JWT_SECRET no está configurada'
      );
    }


    await mongoose.connect(
      mongoURI
    );


    console.log(
      esProduccion
        ? 'Conectado a MongoDB Atlas — BASE DEMO'
        : 'Conectado a MongoDB Atlas — DESARROLLO'
    );


    app.listen(PORT, () => {
      console.log(
        `Servidor Kinetic ejecutándose en puerto ${PORT}`
      );
    });


  } catch (error) {

    console.error(
      'Error al iniciar Kinetic:',
      error.message
    );

    process.exit(1);
  }
}


iniciarServidor();