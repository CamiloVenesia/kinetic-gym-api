// ─────────────────────────────────────────────
//  src/middlewares/errorHandler.js
//  Captura cualquier error no manejado
// ─────────────────────────────────────────────
const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({
    mensaje: err.message || 'Error interno del servidor',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;
