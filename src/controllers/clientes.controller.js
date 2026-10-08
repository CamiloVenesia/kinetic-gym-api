const Cliente = require('../models/cliente.model');


const PLANES_VALIDOS = [
  'Mensual 2x',
  'Mensual 3x',
  'Mensual Libre',
  'Semanal 5d',
  'Semanal 3d',
  'Semanal 2d',
  'Pase Diario',

  // Legacy
  'Mensual',
  'Quincenal',
  'Pase libre',
  '10 entradas',
  'Clases grupales'
];


const METODOS_PAGO_VALIDOS = [
  'Efectivo',
  'Transferencia',
  'Mercado Pago',
  'Tarjeta débito'
];


const LIMITES_SEMANALES = {
  'Mensual 2x': 2,
  'Mensual 3x': 3,
  'Semanal 2d': 2,
  'Semanal 3d': 3,
  'Semanal 5d': 5
};


const PLAN_PRECIOS = {
  'Mensual 2x': 30000,
  'Mensual 3x': 33000,
  'Mensual Libre': 35000,

  'Semanal 5d': 20000,
  'Semanal 3d': 15000,
  'Semanal 2d': 13000,

  'Pase Diario': 7000,

  // Legacy
  'Mensual': 18000,
  'Quincenal': 10000,
  'Pase libre': 22000,
  '10 entradas': 14000,
  'Clases grupales': 9000
};


function calcularVencimiento(fechaInicio, plan) {
  const fecha = new Date(fechaInicio);

  if (Number.isNaN(fecha.getTime())) {
    throw new Error('Fecha inválida');
  }


  if (plan.startsWith('Semanal')) {
    fecha.setDate(
      fecha.getDate() + 7
    );

  } else if (plan === 'Pase Diario') {
    fecha.setDate(
      fecha.getDate() + 1
    );

  } else if (plan === 'Quincenal') {
    fecha.setDate(
      fecha.getDate() + 15
    );

  } else if (plan === '10 entradas') {
    fecha.setDate(
      fecha.getDate() + 60
    );

  } else if (plan === 'Pase libre') {
    fecha.setMonth(
      fecha.getMonth() + 3
    );

  } else {
    const diaOriginal =
      fecha.getDate();

    fecha.setMonth(
      fecha.getMonth() + 1
    );

    if (
      fecha.getDate() !==
      diaOriginal
    ) {
      fecha.setDate(0);
    }
  }


  return fecha;
}


function getLunesDeLaSemana(fecha) {
  const d =
    new Date(fecha);

  const dia =
    d.getDay();

  const diff =
    dia === 0
      ? -6
      : 1 - dia;

  d.setDate(
    d.getDate() + diff
  );

  d.setHours(
    0,
    0,
    0,
    0
  );

  return d;
}


function limpiarTexto(valor) {
  return String(
    valor || ''
  )
    .trim()
    .replace(/\s+/g, ' ');
}


function validarDNI(dni) {
  return /^\d{7,8}$/.test(
    String(dni || '')
  );
}


function calcularActivo(fechaVencimiento) {
  const hoy =
    new Date();

  return (
    new Date(fechaVencimiento) >=
    hoy
  );
}


// ─────────────────────────────────────────
// GET /api/clientes
// ─────────────────────────────────────────

const getClientes = async (req, res) => {
  try {
    const clientes =
      await Cliente
        .find()
        .sort({
          createdAt: -1
        });

    return res.json(
      clientes
    );

  } catch (error) {
    console.error(
      'Error al obtener clientes:',
      error
    );

    return res
      .status(500)
      .json({
        mensaje:
          'Error al obtener clientes'
      });
  }
};


// ─────────────────────────────────────────
// GET /api/clientes/dni/:dni
// ─────────────────────────────────────────

const getClientePorDNI = async (
  req,
  res
) => {
  try {
    const dni =
      String(
        req.params.dni || ''
      ).trim();


    if (!validarDNI(dni)) {
      return res
        .status(400)
        .json({
          encontrado: false,
          mensaje:
            'DNI inválido'
        });
    }


    const cliente =
      await Cliente.findOne({
        dni
      });


    if (!cliente) {
      return res
        .status(404)
        .json({
          encontrado: false,
          mensaje:
            'DNI no registrado'
        });
    }


    const hoy =
      new Date();


    const activo =
      calcularActivo(
        cliente.fechaVencimiento
      );


    const limite =
      LIMITES_SEMANALES[
        cliente.plan
      ];


    let bloqueadoPorLimite =
      false;


    let ingresosEstaSemana =
      0;


    if (
      activo &&
      limite
    ) {
      const lunes =
        getLunesDeLaSemana(
          hoy
        );


      ingresosEstaSemana =
        (
          cliente.ingresos ||
          []
        ).filter(
          ingreso => {

            const fechaIngreso =
              new Date(
                ingreso.fecha
              );

            return (
              fechaIngreso >=
              lunes
            );
          }
        ).length;


      bloqueadoPorLimite =
        ingresosEstaSemana >=
        limite;
    }


    return res.json({
      encontrado: true,
      activo,
      bloqueadoPorLimite,
      limite:
        limite || null,
      ingresosEstaSemana,
      nombre:
        cliente.nombre,
      plan:
        cliente.plan,
      vence:
        cliente.fechaVencimiento,
      _id:
        cliente._id
    });


  } catch (error) {
    console.error(
      'Error buscando cliente por DNI:',
      error
    );

    return res
      .status(500)
      .json({
        mensaje:
          'Error en la búsqueda'
      });
  }
};


// ─────────────────────────────────────────
// POST /api/clientes
// ─────────────────────────────────────────

const crearCliente = async (
  req,
  res
) => {
  try {
    const {
      nombre,
      dni,
      telefono,
      plan,
      metodoPago,
      fechaInicio
    } = req.body;


    const nombreLimpio =
      limpiarTexto(nombre);


    const dniLimpio =
      String(
        dni || ''
      ).trim();


    const telefonoLimpio =
      limpiarTexto(
        telefono
      );


    if (
      nombreLimpio.length < 3
    ) {
      return res
        .status(400)
        .json({
          mensaje:
            'El nombre es inválido'
        });
    }


    if (
      !validarDNI(
        dniLimpio
      )
    ) {
      return res
        .status(400)
        .json({
          mensaje:
            'El DNI debe tener 7 u 8 dígitos'
        });
    }


    if (
      !PLANES_VALIDOS.includes(
        plan
      )
    ) {
      return res
        .status(400)
        .json({
          mensaje:
            'Plan inválido'
        });
    }


    if (
      metodoPago &&
      !METODOS_PAGO_VALIDOS.includes(
        metodoPago
      )
    ) {
      return res
        .status(400)
        .json({
          mensaje:
            'Método de pago inválido'
        });
    }


    const existe =
      await Cliente.findOne({
        dni:
          dniLimpio
      });


    if (existe) {
      return res
        .status(409)
        .json({
          mensaje:
            'Ya existe un cliente con ese DNI'
        });
    }


    const inicio =
      fechaInicio
        ? new Date(
            `${fechaInicio}T12:00:00`
          )
        : new Date();


    if (
      Number.isNaN(
        inicio.getTime()
      )
    ) {
      return res
        .status(400)
        .json({
          mensaje:
            'Fecha de inicio inválida'
        });
    }


    const vencimiento =
      calcularVencimiento(
        inicio,
        plan
      );


    const importe =
      PLAN_PRECIOS[
        plan
      ] || 0;


    const nuevoCliente =
      new Cliente({
        nombre:
          nombreLimpio,

        dni:
          dniLimpio,

        telefono:
          telefonoLimpio,

        plan,

        metodoPago:
          metodoPago ||
          'Efectivo',

        fechaInicio:
          inicio,

        fechaVencimiento:
          vencimiento,

        activo:
          true,

        pagos: [
          {
            fecha:
              new Date(),

            importe,

            plan
          }
        ]
      });


    const clienteGuardado =
      await nuevoCliente.save();


    return res
      .status(201)
      .json(
        clienteGuardado
      );


  } catch (error) {
    console.error(
      'Error al crear cliente:',
      error
    );


    if (
      error &&
      error.code === 11000
    ) {
      return res
        .status(409)
        .json({
          mensaje:
            'Ya existe un cliente con ese DNI'
        });
    }


    return res
      .status(400)
      .json({
        mensaje:
          'Error al crear cliente'
      });
  }
};


// ─────────────────────────────────────────
// PUT /api/clientes/:id
// ─────────────────────────────────────────

const editarCliente = async (
  req,
  res
) => {
  try {
    const cliente =
      await Cliente.findById(
        req.params.id
      );


    if (!cliente) {
      return res
        .status(404)
        .json({
          mensaje:
            'Cliente no encontrado'
        });
    }


    const {
      nombre,
      dni,
      telefono,
      plan,
      metodoPago,
      fechaVencimiento
    } = req.body;


    if (
      nombre !== undefined
    ) {
      const nombreLimpio =
        limpiarTexto(
          nombre
        );


      if (
        nombreLimpio.length <
        3
      ) {
        return res
          .status(400)
          .json({
            mensaje:
              'El nombre es inválido'
          });
      }


      cliente.nombre =
        nombreLimpio;
    }


    if (
      dni !== undefined
    ) {
      const dniLimpio =
        String(
          dni
        ).trim();


      if (
        !validarDNI(
          dniLimpio
        )
      ) {
        return res
          .status(400)
          .json({
            mensaje:
              'El DNI debe tener 7 u 8 dígitos'
          });
      }


      const duplicado =
        await Cliente.findOne({
          dni:
            dniLimpio,

          _id: {
            $ne:
              cliente._id
          }
        });


      if (duplicado) {
        return res
          .status(409)
          .json({
            mensaje:
              'Ya existe otro cliente con ese DNI'
          });
      }


      cliente.dni =
        dniLimpio;
    }


    if (
      telefono !==
      undefined
    ) {
      cliente.telefono =
        limpiarTexto(
          telefono
        );
    }


    if (
      plan !== undefined
    ) {
      if (
        !PLANES_VALIDOS.includes(
          plan
        )
      ) {
        return res
          .status(400)
          .json({
            mensaje:
              'Plan inválido'
          });
      }


      cliente.plan =
        plan;
    }


    if (
      metodoPago !==
      undefined
    ) {
      if (
        !METODOS_PAGO_VALIDOS.includes(
          metodoPago
        )
      ) {
        return res
          .status(400)
          .json({
            mensaje:
              'Método de pago inválido'
          });
      }


      cliente.metodoPago =
        metodoPago;
    }


    if (
      fechaVencimiento !==
      undefined
    ) {
      const fecha =
        new Date(
          fechaVencimiento
        );


      if (
        Number.isNaN(
          fecha.getTime()
        )
      ) {
        return res
          .status(400)
          .json({
            mensaje:
              'Fecha de vencimiento inválida'
          });
      }


      cliente.fechaVencimiento =
        fecha;


      cliente.activo =
        calcularActivo(
          fecha
        );
    }


    const actualizado =
      await cliente.save();


    return res.json(
      actualizado
    );


  } catch (error) {
    console.error(
      'Error al editar cliente:',
      error
    );


    if (
      error &&
      error.code === 11000
    ) {
      return res
        .status(409)
        .json({
          mensaje:
            'Ya existe otro cliente con ese DNI'
        });
    }


    return res
      .status(400)
      .json({
        mensaje:
          'Error al editar cliente'
      });
  }
};


// ─────────────────────────────────────────
// DELETE /api/clientes/:id
// ─────────────────────────────────────────

const eliminarCliente = async (
  req,
  res
) => {
  try {
    const cliente =
      await Cliente.findByIdAndDelete(
        req.params.id
      );


    if (!cliente) {
      return res
        .status(404)
        .json({
          mensaje:
            'Cliente no encontrado'
        });
    }


    return res.json({
      mensaje:
        'Cliente eliminado correctamente'
    });


  } catch (error) {
    console.error(
      'Error al eliminar cliente:',
      error
    );


    return res
      .status(500)
      .json({
        mensaje:
          'Error al eliminar cliente'
      });
  }
};


// ─────────────────────────────────────────
// POST /api/clientes/:id/ingreso
// ─────────────────────────────────────────

const registrarIngreso = async (
  req,
  res
) => {
  try {
    const cliente =
      await Cliente.findById(
        req.params.id
      );


    if (!cliente) {
      return res
        .status(404)
        .json({
          mensaje:
            'Cliente no encontrado'
        });
    }


    const hoy =
      new Date();


    const activo =
      calcularActivo(
        cliente.fechaVencimiento
      );


    if (!activo) {
      return res
        .status(403)
        .json({
          mensaje:
            'La cuota del cliente está vencida'
        });
    }


    const limite =
      LIMITES_SEMANALES[
        cliente.plan
      ];


    if (limite) {
      const lunes =
        getLunesDeLaSemana(
          hoy
        );


      const ingresosEstaSemana =
        (
          cliente.ingresos ||
          []
        ).filter(
          ingreso =>
            new Date(
              ingreso.fecha
            ) >= lunes
        ).length;


      if (
        ingresosEstaSemana >=
        limite
      ) {
        return res
          .status(403)
          .json({
            mensaje:
              'El cliente alcanzó el límite semanal de ingresos'
          });
      }
    }


    cliente.ingresos.push({
      fecha:
        hoy
    });


    await cliente.save();


    return res.json({
      mensaje:
        'Ingreso registrado correctamente',
      cliente
    });


  } catch (error) {
    console.error(
      'Error al registrar ingreso:',
      error
    );


    return res
      .status(500)
      .json({
        mensaje:
          'Error al registrar ingreso'
      });
  }
};


// ─────────────────────────────────────────
// POST /api/clientes/:id/renovar
// ─────────────────────────────────────────

const renovarCuota = async (
  req,
  res
) => {
  try {
    const {
      plan
    } = req.body;


    if (
      !PLANES_VALIDOS.includes(
        plan
      )
    ) {
      return res
        .status(400)
        .json({
          mensaje:
            'Plan inválido'
        });
    }


    const cliente =
      await Cliente.findById(
        req.params.id
      );


    if (!cliente) {
      return res
        .status(404)
        .json({
          mensaje:
            'Cliente no encontrado'
        });
    }


    const hoy =
      new Date();


    hoy.setHours(
      12,
      0,
      0,
      0
    );


    const vencimientoActual =
      new Date(
        cliente.fechaVencimiento
      );


    const fechaBase =
      vencimientoActual >= hoy
        ? vencimientoActual
        : hoy;


    const nuevoVencimiento =
      calcularVencimiento(
        fechaBase,
        plan
      );


    const importe =
      PLAN_PRECIOS[
        plan
      ] || 0;


    cliente.plan =
      plan;


    cliente.activo =
      true;


    cliente.fechaVencimiento =
      nuevoVencimiento;


    cliente.pagos.push({
      fecha:
        new Date(),

      importe,

      plan
    });


    await cliente.save();


    return res.json({
      mensaje:
        'Cuota renovada correctamente',

      fechaVencimiento:
        nuevoVencimiento,

      importe,

      cliente
    });


  } catch (error) {
    console.error(
      'Error al renovar cuota:',
      error
    );


    return res
      .status(500)
      .json({
        mensaje:
          'Error al renovar cuota'
      });
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