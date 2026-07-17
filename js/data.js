// ═══════════════════════════════════════════
//  data.js — Estado global compartido
//  Los datos reales vienen de MongoDB
// ═══════════════════════════════════════════

// URL base del backend
const API_URL = 'http://localhost:3000/api';

// Arrays vacíos — se llenan desde MongoDB al hacer login
let clientes      = [];
let inscRecientes = [];

// Variables de control
let nextId            = 200;
let pendingDeleteId   = null;
let pendingDeleteType = null;

// Precios por plan
const PLAN_PRECIOS = {
  // ── PLANES NUEVOS (Los que se venden ahora) ──
  // Mensuales
  'Mensual 2x': 30000,
  'Mensual 3x': 33000,
  'Mensual Libre': 35000,
  // Semanales
  'Semanal 5d': 20000,
  'Semanal 3d': 15000,
  'Semanal 2d': 13000,
  // Otros
  'Pase Diario': 7000,

  // ── PLANES VIEJOS / LEGACY (Para no romper la contabilidad del pasado) ──
  'Mensual': 18000,
  'Quincenal': 10000,
  'Pase libre': 22000,
  '10 entradas': 14000,
  'Clases grupales': 9000
};

// Fecha de hoy
const TODAY     = new Date();
const TODAY_STR = TODAY.toISOString().slice(0, 10);