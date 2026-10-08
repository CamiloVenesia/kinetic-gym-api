const mongoose = require('mongoose');
require('dotenv').config();

const Cliente = require('../src/models/cliente.model');


// ─────────────────────────────────────────────
// Configuración
// ─────────────────────────────────────────────

const MONGODB_URI_DEMO = process.env.MONGODB_URI_DEMO;

const PLAN_PRECIOS = {
  'Mensual 2x': 30000,
  'Mensual 3x': 33000,
  'Mensual Libre': 35000,
  'Semanal 5d': 20000,
  'Semanal 3d': 15000,
  'Semanal 2d': 13000,
  'Pase Diario': 7000
};


// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function fechaRelativa(dias = 0, hora = 12) {
  const fecha = new Date();

  fecha.setDate(
    fecha.getDate() + dias
  );

  fecha.setHours(
    hora,
    Math.floor(Math.random() * 50),
    0,
    0
  );

  return fecha;
}


function mesesAtras(meses = 0) {
  const fecha = new Date();

  fecha.setMonth(
    fecha.getMonth() - meses
  );

  fecha.setDate(
    Math.max(
      1,
      Math.min(
        fecha.getDate(),
        25
      )
    )
  );

  fecha.setHours(
    12,
    0,
    0,
    0
  );

  return fecha;
}


function generarIngresos(cantidad, maxDiasAtras = 28) {
  const ingresos = [];

  const usados = new Set();

  while (
    ingresos.length < cantidad
  ) {
    const diasAtras =
      Math.floor(
        Math.random() * maxDiasAtras
      );

    const hora =
      [
        8,
        10,
        12,
        13,
        14,
        15,
        16,
        17,
        18,
        19,
        20,
        21
      ][
        Math.floor(
          Math.random() * 12
        )
      ];

    const clave =
      `${diasAtras}-${hora}`;

    if (
      usados.has(clave)
    ) {
      continue;
    }

    usados.add(clave);

    ingresos.push({
      fecha:
        fechaRelativa(
          -diasAtras,
          hora
        )
    });
  }

  return ingresos.sort(
    (a, b) =>
      a.fecha - b.fecha
  );
}


function generarPagos(
  plan,
  cantidad = 2
) {
  const pagos = [];

  const precio =
    PLAN_PRECIOS[plan] || 0;

  for (
    let i = cantidad - 1;
    i >= 0;
    i--
  ) {
    pagos.push({
      fecha:
        mesesAtras(i),

      importe:
        precio,

      plan
    });
  }

  return pagos;
}


function crearCliente({
  nombre,
  dni,
  telefono,
  plan,
  diasVencimiento,
  ingresos = 0,
  pagos = 2,
  fechaInicioMesesAtras = 4
}) {
  const fechaInicio =
    mesesAtras(
      fechaInicioMesesAtras
    );

  const fechaVencimiento =
    fechaRelativa(
      diasVencimiento
    );

  return {
    nombre,
    dni,
    telefono,
    plan,

    metodoPago:
      [
        'Efectivo',
        'Transferencia',
        'Mercado Pago',
        'Tarjeta débito'
      ][
        Math.floor(
          Math.random() * 4
        )
      ],

    fechaInicio,

    fechaVencimiento,

    activo:
      diasVencimiento >= 0,

    ingresos:
      generarIngresos(
        ingresos
      ),

    pagos:
      generarPagos(
        plan,
        pagos
      ),

    createdAt:
      fechaInicio,

    updatedAt:
      new Date()
  };
}


// ─────────────────────────────────────────────
// Casos especiales de kiosco
// ─────────────────────────────────────────────

function clienteKioscoActivo() {
  return {
    nombre:
      'Lucía Fernández',

    dni:
      '11111111',

    telefono:
      '3415001001',

    plan:
      'Mensual Libre',

    metodoPago:
      'Mercado Pago',

    fechaInicio:
      mesesAtras(5),

    fechaVencimiento:
      fechaRelativa(18),

    activo:
      true,

    ingresos:
      generarIngresos(11),

    pagos:
      generarPagos(
        'Mensual Libre',
        4
      ),

    createdAt:
      mesesAtras(5),

    updatedAt:
      new Date()
  };
}


function clienteKioscoVencido() {
  return {
    nombre:
      'Tomás Benítez',

    dni:
      '22222222',

    telefono:
      '3415001002',

    plan:
      'Mensual 2x',

    metodoPago:
      'Efectivo',

    fechaInicio:
      mesesAtras(4),

    fechaVencimiento:
      fechaRelativa(-6),

    activo:
      false,

    ingresos:
      generarIngresos(7),

    pagos:
      generarPagos(
        'Mensual 2x',
        3
      ),

    createdAt:
      mesesAtras(4),

    updatedAt:
      new Date()
  };
}


function clienteKioscoLimite() {
  const ahora =
    new Date();

  const dia =
    ahora.getDay();

  const diferenciaLunes =
    dia === 0
      ? -6
      : 1 - dia;

  const lunes =
    new Date(ahora);

  lunes.setDate(
    ahora.getDate() +
    diferenciaLunes
  );

  lunes.setHours(
    18,
    0,
    0,
    0
  );

  const segundoIngreso =
    new Date(lunes);

  segundoIngreso.setDate(
    segundoIngreso.getDate() + 1
  );

  segundoIngreso.setHours(
    19,
    0,
    0,
    0
  );

  return {
    nombre:
      'Martín Rodríguez',

    dni:
      '33333333',

    telefono:
      '3415001003',

    plan:
      'Mensual 2x',

    metodoPago:
      'Transferencia',

    fechaInicio:
      mesesAtras(6),

    fechaVencimiento:
      fechaRelativa(20),

    activo:
      true,

    ingresos: [
      {
        fecha:
          lunes
      },
      {
        fecha:
          segundoIngreso
      }
    ],

    pagos:
      generarPagos(
        'Mensual 2x',
        4
      ),

    createdAt:
      mesesAtras(6),

    updatedAt:
      new Date()
  };
}


// ─────────────────────────────────────────────
// Datos demo
// ─────────────────────────────────────────────

const clientesDemo = [
  clienteKioscoActivo(),
  clienteKioscoVencido(),
  clienteKioscoLimite(),

  crearCliente({
    nombre: 'Sofía Molina',
    dni: '30124567',
    telefono: '3415123401',
    plan: 'Mensual 3x',
    diasVencimiento: 22,
    ingresos: 10,
    pagos: 4,
    fechaInicioMesesAtras: 6
  }),

  crearCliente({
    nombre: 'Nicolás Gómez',
    dni: '31234568',
    telefono: '3415123402',
    plan: 'Mensual Libre',
    diasVencimiento: 3,
    ingresos: 15,
    pagos: 5,
    fechaInicioMesesAtras: 8
  }),

  crearCliente({
    nombre: 'Valentina López',
    dni: '32345679',
    telefono: '3415123403',
    plan: 'Mensual 2x',
    diasVencimiento: 12,
    ingresos: 7,
    pagos: 3,
    fechaInicioMesesAtras: 5
  }),

  crearCliente({
    nombre: 'Facundo Rossi',
    dni: '33456780',
    telefono: '3415123404',
    plan: 'Semanal 5d',
    diasVencimiento: 5,
    ingresos: 9,
    pagos: 3,
    fechaInicioMesesAtras: 3
  }),

  crearCliente({
    nombre: 'Camila Torres',
    dni: '34567891',
    telefono: '3415123405',
    plan: 'Mensual Libre',
    diasVencimiento: 28,
    ingresos: 17,
    pagos: 5,
    fechaInicioMesesAtras: 7
  }),

  crearCliente({
    nombre: 'Agustín Romero',
    dni: '35678902',
    telefono: '3415123406',
    plan: 'Mensual 3x',
    diasVencimiento: -4,
    ingresos: 5,
    pagos: 2,
    fechaInicioMesesAtras: 4
  }),

  crearCliente({
    nombre: 'Julieta Sánchez',
    dni: '36789013',
    telefono: '3415123407',
    plan: 'Mensual 2x',
    diasVencimiento: 7,
    ingresos: 8,
    pagos: 4,
    fechaInicioMesesAtras: 6
  }),

  crearCliente({
    nombre: 'Mateo Álvarez',
    dni: '37890124',
    telefono: '3415123408',
    plan: 'Semanal 3d',
    diasVencimiento: 4,
    ingresos: 6,
    pagos: 3,
    fechaInicioMesesAtras: 4
  }),

  crearCliente({
    nombre: 'Emilia Castro',
    dni: '38901235',
    telefono: '3415123409',
    plan: 'Mensual Libre',
    diasVencimiento: 16,
    ingresos: 13,
    pagos: 5,
    fechaInicioMesesAtras: 7
  }),

  crearCliente({
    nombre: 'Franco Martínez',
    dni: '39012346',
    telefono: '3415123410',
    plan: 'Mensual 3x',
    diasVencimiento: -9,
    ingresos: 6,
    pagos: 3,
    fechaInicioMesesAtras: 5
  }),

  crearCliente({
    nombre: 'Martina Ruiz',
    dni: '40123457',
    telefono: '3415123411',
    plan: 'Mensual 2x',
    diasVencimiento: 2,
    ingresos: 7,
    pagos: 4,
    fechaInicioMesesAtras: 6
  }),

  crearCliente({
    nombre: 'Joaquín Herrera',
    dni: '41234569',
    telefono: '3415123412',
    plan: 'Semanal 5d',
    diasVencimiento: 6,
    ingresos: 10,
    pagos: 3,
    fechaInicioMesesAtras: 4
  }),

  crearCliente({
    nombre: 'Renata Díaz',
    dni: '42345670',
    telefono: '3415123413',
    plan: 'Mensual Libre',
    diasVencimiento: 24,
    ingresos: 14,
    pagos: 5,
    fechaInicioMesesAtras: 9
  }),

  crearCliente({
    nombre: 'Lautaro Acosta',
    dni: '43456781',
    telefono: '3415123414',
    plan: 'Mensual 3x',
    diasVencimiento: -2,
    ingresos: 9,
    pagos: 4,
    fechaInicioMesesAtras: 6
  }),

  crearCliente({
    nombre: 'Delfina Peralta',
    dni: '44567892',
    telefono: '3415123415',
    plan: 'Semanal 2d',
    diasVencimiento: 5,
    ingresos: 5,
    pagos: 3,
    fechaInicioMesesAtras: 3
  }),

  crearCliente({
    nombre: 'Bruno Navarro',
    dni: '45678903',
    telefono: '3415123416',
    plan: 'Mensual 2x',
    diasVencimiento: 19,
    ingresos: 8,
    pagos: 4,
    fechaInicioMesesAtras: 5
  }),

  crearCliente({
    nombre: 'Malena Cabrera',
    dni: '46789014',
    telefono: '3415123417',
    plan: 'Mensual Libre',
    diasVencimiento: 1,
    ingresos: 12,
    pagos: 5,
    fechaInicioMesesAtras: 8
  }),

  crearCliente({
    nombre: 'Benjamín Silva',
    dni: '47890125',
    telefono: '3415123418',
    plan: 'Mensual 3x',
    diasVencimiento: 14,
    ingresos: 9,
    pagos: 4,
    fechaInicioMesesAtras: 6
  }),

  crearCliente({
    nombre: 'Catalina Vega',
    dni: '48901236',
    telefono: '3415123419',
    plan: 'Semanal 3d',
    diasVencimiento: -7,
    ingresos: 5,
    pagos: 2,
    fechaInicioMesesAtras: 3
  }),

  crearCliente({
    nombre: 'Thiago Medina',
    dni: '49012347',
    telefono: '3415123420',
    plan: 'Mensual 2x',
    diasVencimiento: 9,
    ingresos: 7,
    pagos: 4,
    fechaInicioMesesAtras: 5
  }),

  crearCliente({
    nombre: 'Pilar Aguirre',
    dni: '50123458',
    telefono: '3415123421',
    plan: 'Mensual Libre',
    diasVencimiento: 26,
    ingresos: 16,
    pagos: 5,
    fechaInicioMesesAtras: 8
  }),

  crearCliente({
    nombre: 'Santino Ortiz',
    dni: '51234560',
    telefono: '3415123422',
    plan: 'Pase Diario',
    diasVencimiento: 1,
    ingresos: 1,
    pagos: 1,
    fechaInicioMesesAtras: 0
  })
];


// ─────────────────────────────────────────────
// Seed
// ─────────────────────────────────────────────

async function ejecutarSeed() {
  try {
    if (!MONGODB_URI_DEMO) {
      throw new Error(
        'MONGODB_URI_DEMO no está configurada en .env'
      );
    }


    if (
      !MONGODB_URI_DEMO.includes(
        '/kinetic_demo?'
      )
    ) {
      throw new Error(
        'SEGURIDAD: la URI no apunta a kinetic_demo. Seed cancelado.'
      );
    }


    console.log(
      'Conectando a kinetic_demo...'
    );


    await mongoose.connect(
      MONGODB_URI_DEMO
    );


    console.log(
      'Conectado a MongoDB Atlas'
    );


    await Cliente.deleteMany({});


    console.log(
      'Base demo anterior limpiada'
    );


    await Cliente.insertMany(
      clientesDemo
    );


    console.log(
      `Seed completado: ${clientesDemo.length} clientes demo creados`
    );


    console.log('');
    console.log(
      'DNIs para probar Modo Kiosco:'
    );

    console.log(
      '11111111 → acceso permitido'
    );

    console.log(
      '22222222 → cuota vencida'
    );

    console.log(
      '33333333 → límite semanal alcanzado'
    );

    console.log('');


  } catch (error) {

    console.error(
      'Error en seed demo:',
      error.message
    );


    process.exitCode = 1;


  } finally {

    await mongoose.disconnect();

    console.log(
      'Conexión cerrada'
    );
  }
}


ejecutarSeed();