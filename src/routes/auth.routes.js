const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const router = express.Router();


const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    mensaje: 'Demasiados intentos de inicio de sesión. Intentá nuevamente en unos minutos.'
  }
});


function generarToken(usuario, rol) {
  return jwt.sign(
    {
      usuario,
      rol
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '8h'
    }
  );
}


router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { usuario, clave, rol } = req.body;

    if (!usuario || !clave || !rol) {
      return res.status(400).json({
        mensaje: 'Usuario, contraseña y rol son obligatorios'
      });
    }


    const configuracionUsuarios = {
      admin: {
        usuario: process.env.ADMIN_USER,
        passwordHash: process.env.ADMIN_PASSWORD_HASH
      },

      recepcion: {
        usuario: process.env.RECEPCION_USER,
        passwordHash: process.env.RECEPCION_PASSWORD_HASH
      },

      dueno: {
        usuario: process.env.DUENO_USER,
        passwordHash: process.env.DUENO_PASSWORD_HASH
      }
    };


    const rolNormalizado = rol
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');


    const usuarioConfigurado =
      configuracionUsuarios[rolNormalizado];


    if (
      !usuarioConfigurado ||
      !usuarioConfigurado.usuario ||
      !usuarioConfigurado.passwordHash
    ) {
      return res.status(401).json({
        mensaje: 'Credenciales incorrectas'
      });
    }


    if (usuario !== usuarioConfigurado.usuario) {
      return res.status(401).json({
        mensaje: 'Credenciales incorrectas'
      });
    }


    const claveValida = await bcrypt.compare(
      clave,
      usuarioConfigurado.passwordHash
    );


    if (!claveValida) {
      return res.status(401).json({
        mensaje: 'Credenciales incorrectas'
      });
    }


    const token = generarToken(
      usuarioConfigurado.usuario,
      rolNormalizado
    );


    return res.json({
      ok: true,
      token,
      usuario: {
        nombre: usuarioConfigurado.usuario,
        rol: rolNormalizado
      }
    });

  } catch (error) {
    console.error(
      'Error en login:',
      error.message
    );

    return res.status(500).json({
      mensaje: 'No se pudo iniciar sesión'
    });
  }
});


router.post('/demo', (req, res) => {
  try {
    const token = jwt.sign(
      {
        usuario: 'Demo',
        rol: 'demo'
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '2h'
      }
    );


    return res.json({
      ok: true,
      token,
      usuario: {
        nombre: 'Demo',
        rol: 'demo'
      }
    });

  } catch (error) {
    console.error(
      'Error creando sesión demo:',
      error.message
    );

    return res.status(500).json({
      mensaje: 'No se pudo iniciar el modo demo'
    });
  }
});


module.exports = router;