// ═══════════════════════════════════════════
//  data.js — Estado global y conexión API
// ═══════════════════════════════════════════

const API_URL = '/api';

const TOKEN_KEY = 'kinetic_token';
const USER_KEY = 'kinetic_user';


// ─────────────────────────────────────────
// Sesión
// ─────────────────────────────────────────

function guardarSesion(token, usuario) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(
    USER_KEY,
    JSON.stringify(usuario)
  );
}


function obtenerToken() {
  return localStorage.getItem(TOKEN_KEY);
}


function obtenerUsuarioSesion() {
  const data = localStorage.getItem(USER_KEY);

  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}


function limpiarSesion() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}


// ─────────────────────────────────────────
// Fetch autenticado
// ─────────────────────────────────────────

async function apiFetch(url, options = {}) {
  const token = obtenerToken();

  const headers = new Headers(
    options.headers || {}
  );

  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has('Content-Type')
  ) {
    headers.set(
      'Content-Type',
      'application/json'
    );
  }

  if (token) {
    headers.set(
      'Authorization',
      `Bearer ${token}`
    );
  }

  const response = await fetch(
    url,
    {
      ...options,
      headers
    }
  );

  if (response.status === 401) {
    limpiarSesion();

    const app = document.getElementById('app');
    const login = document.getElementById('login');

    if (app) {
      app.classList.remove('active');
    }

    if (login) {
      login.classList.add('active');
    }
  }

  return response;
}


// ─────────────────────────────────────────
// Datos globales
// ─────────────────────────────────────────

let clientes = [];
let inscRecientes = [];

let nextId = 200;
let pendingDeleteId = null;
let pendingDeleteType = null;


// ─────────────────────────────────────────
// Precios
// ─────────────────────────────────────────

const PLAN_PRECIOS = {
  'Mensual 2x': 30000,
  'Mensual 3x': 33000,
  'Mensual Libre': 35000,

  'Semanal 5d': 20000,
  'Semanal 3d': 15000,
  'Semanal 2d': 13000,

  'Pase Diario': 7000,

  'Mensual': 18000,
  'Quincenal': 10000,
  'Pase libre': 22000,
  '10 entradas': 14000,
  'Clases grupales': 9000
};


// ─────────────────────────────────────────
// Fecha actual
// ─────────────────────────────────────────

const TODAY = new Date();

const TODAY_STR = TODAY
  .toISOString()
  .slice(0, 10);