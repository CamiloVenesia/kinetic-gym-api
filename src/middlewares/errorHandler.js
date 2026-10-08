function errorHandler(err, req, res, next) {
  console.error(
    'Error interno:',
    err.message
  );


  if (res.headersSent) {
    return next(err);
  }


  if (
    err.name ===
    'ValidationError'
  ) {
    return res
      .status(400)
      .json({
        mensaje:
          'Los datos enviados no son válidos'
      });
  }


  if (
    err.name ===
    'CastError'
  ) {
    return res
      .status(400)
      .json({
        mensaje:
          'Identificador inválido'
      });
  }


  if (
    err.code === 11000
  ) {
    return res
      .status(409)
      .json({
        mensaje:
          'Ya existe un registro con esos datos'
      });
  }


  return res
    .status(
      err.status ||
      500
    )
    .json({
      mensaje:
        process.env.NODE_ENV ===
        'production'
          ? 'Ocurrió un error interno'
          : err.message ||
            'Ocurrió un error interno'
    });
}


module.exports =
  errorHandler;