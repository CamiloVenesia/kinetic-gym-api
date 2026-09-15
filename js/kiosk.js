// ═══════════════════════════════════════════
//  kiosk.js — Teclado numérico e ingreso DNI
// ═══════════════════════════════════════════

let kioskDNI   = '';
let kioskTimer = null;

// Reemplazamos el API_URL por la dirección directa de tu backend
const LOCAL_API_URL = 'http://localhost:3000/api';

function kp(d) {
  if (kioskDNI.length >= 8) return;
  kioskDNI += d;
  updateKioskDisplay();
}

function kiosk_del() {
  kioskDNI = kioskDNI.slice(0, -1);
  updateKioskDisplay();
  if (!kioskDNI) resetKioskResult();
}

function kiosk_del_all() {
  kioskDNI = '';
  updateKioskDisplay();
  resetKioskResult();
}

function updateKioskDisplay() {
  const el = document.getElementById('kiosk-display');
  if (!kioskDNI) {
    el.textContent = '_ _ _ _ _ _ _ _';
    el.className = 'dni-display-num empty';
    return;
  }
  el.className = 'dni-display-num typing';
  
  // Convertimos el string a número y le damos formato argentino (puntos de miles)
  el.textContent = parseInt(kioskDNI, 10).toLocaleString('es-AR');
}

async function kiosk_enter() {
  if (!kioskDNI) { showToast('Ingresá tu DNI primero', true); return; }
  
  if (kioskTimer) clearTimeout(kioskTimer);
  
  mostrarKioskLoading();

  // ── PASO 1: buscar el DNI ──
  let data;
  try {
    const response = await fetch(`${LOCAL_API_URL}/clientes/dni/${kioskDNI}`);
    data = await response.json();
  } catch (error) {
    console.error('Error buscando DNI (fetch falló):', error);
    mostrarKioskResultado({
      tipo:    'red',
      icono:   '⚠️',
      nombre:  'Sin conexión',
      detalle: 'No se pudo conectar con el servidor.<br>Avisá al encargado.',
      badge:   'Error de red'
    });
    iniciarLimpiezaSilenciosa();
    return;
  }

  // ── PASO 2: mostrar el resultado según lo que devolvió el backend ──
  if (!data.encontrado) {
    const dniFormateado = parseInt(kioskDNI, 10).toLocaleString('es-AR');
    mostrarKioskResultado({
      tipo:    'red',
      icono:   '🚫',
      nombre:  'DNI no registrado',
      detalle: `DNI <strong style="color:var(--accent)">${dniFormateado}</strong><br>no está en el sistema.`,
      badge:   'Sin registro'
    });
  } else if (!data.activo) {
    const vence = new Date(data.vence).toLocaleDateString('es-AR');
    mostrarKioskResultado({
      tipo:    'red',
      icono:   '❌',
      nombre:  data.nombre,
      detalle: `Cuota vencida el <strong>${vence}</strong><br>Dirigite a recepción.`,
      badge:   'Cuota vencida'
    });
  } else if (data.bloqueadoPorLimite) {
    mostrarKioskResultado({
      tipo:    'red',
      icono:   '🔒',
      nombre:  data.nombre,
      detalle: `Plan: <strong>${data.plan}</strong><br>Ya utilizaste todas las clases permitidas esta semana.`,
      badge:   'Límite alcanzado'
    });
  } else {
    // Cliente activo y con clases disponibles: mostramos el ✅ YA
    const vence      = new Date(data.vence).toLocaleDateString('es-AR');
    const enModoK    = document.getElementById('app').classList.contains('kiosk-mode');
    
    // Tabla bonita si está en kiosco, o texto normal si es finito
    const detalleStr = enModoK
      ? `<div style="width:100%;margin-top:12px;text-align:center">
          <div style="padding:16px 0;border-bottom:1px solid rgba(255,255,255,0.08)">
            <div style="font-size:13px;text-transform:uppercase;letter-spacing:2px;color:var(--text3);font-weight:700;margin-bottom:6px">Plan</div>
            <div style="font-size:32px;font-weight:800;color:var(--text);font-family:var(--font-d)">${data.plan}</div>
          </div>
          <div style="padding:16px 0">
            <div style="font-size:13px;text-transform:uppercase;letter-spacing:2px;color:var(--text3);font-weight:700;margin-bottom:6px">Vencimiento</div>
            <div style="font-size:32px;font-weight:800;color:var(--green);font-family:var(--font-d)">${vence}</div>
          </div>
        </div>`
      : `Plan: <strong>${data.plan}</strong><br>Vence: <strong>${vence}</strong>`;

    mostrarKioskResultado({
      tipo:    'green',
      icono:   '✅',
      nombre:  data.nombre,
      detalle: detalleStr,
      badge:   '¡Pasá!'
    });

    // ── PASO 3: registrar el ingreso en segundo plano ──
    try {
      await fetch(`${LOCAL_API_URL}/clientes/${data._id}/ingreso`, { method: 'POST' });
      await cargarClientes(); 
      refreshDashboard();
    } catch (err) {
      console.error('No se pudo registrar el ingreso:', err);
    }
  }
  
  iniciarLimpiezaSilenciosa();
}

function mostrarKioskLoading() {
  document.getElementById('kiosk-idle').style.display = 'none';
  const res = document.getElementById('kiosk-result');
  res.className = 'kiosk-result-inner show green';
  document.getElementById('kr-icon').textContent    = '⏳';
  document.getElementById('kr-name').textContent    = 'Buscando...';
  document.getElementById('kr-detail').textContent  = '';
  document.getElementById('kr-badge').textContent   = '';
}

function mostrarKioskResultado({ tipo, icono, nombre, detalle, badge }) {
  const res = document.getElementById('kiosk-result');
  res.className = `kiosk-result-inner show ${tipo}`;
  document.getElementById('kr-icon').textContent  = icono;
  document.getElementById('kr-name').textContent  = nombre;
  document.getElementById('kr-detail').innerHTML  = detalle;
  document.getElementById('kr-badge').textContent = badge;
  document.getElementById('kr-badge').className   = `kiosk-badge ${tipo}`;
}

// ── NUEVO: Limpia la pantalla en silencio después de 4 segundos ──
function iniciarLimpiezaSilenciosa() {
  kioskTimer = setTimeout(() => {
    kioskDNI = '';
    updateKioskDisplay();
    resetKioskResult();
  }, 7000); // 4000 ms = 4 segundos (podés cambiarlo a 3000 si querés que sea más rápido)
}

function resetKioskResult() {
  document.getElementById('kiosk-result').className   = 'kiosk-result-inner';
  document.getElementById('kiosk-idle').style.display = 'flex';
  if (kioskTimer) clearTimeout(kioskTimer);
}

document.addEventListener('keydown', e => {
  if (!document.getElementById('app').classList.contains('active')) return;
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  if (document.getElementById('modal-edit').classList.contains('open')) return;
  
  if (e.key >= '0' && e.key <= '9') kp(e.key);
  else if (e.key === 'Backspace') kiosk_del();
  else if (e.key === 'Enter') kiosk_enter();
});