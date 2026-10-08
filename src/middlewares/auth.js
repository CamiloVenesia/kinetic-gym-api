const jwt = require('jsonwebtoken');


function autenticar(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      mensaje: 'Acceso no autorizado'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.usuario = decoded;

    next();

  } catch (error) {
    return res.status(401).json({
      mensaje: 'Sesión inválida o expirada'
    });
  }
}


function permitirRoles(...rolesPermitidos) {
  return (req, res, next) => {
    if (
      !req.usuario ||
      !rolesPermitidos.includes(req.usuario.rol)
    ) {
      return res.status(403).json({
        mensaje: 'No tenés permisos para realizar esta acción'
      });
    }

    next();
  };
}


function bloquearDemo(req, res, next) {
  if (req.usuario && req.usuario.rol === 'demo') {
    return res.status(403).json({
      mensaje: 'Esta acción está deshabilitada en el modo demo'
    });
  }

  next();
}


module.exports = {
  autenticar,
  permitirRoles,
  bloquearDemo
};