// ═══════════════════════════════════════════
//  app.js — Login, navegación, modales, toast
// ═══════════════════════════════════════════

// ── LOGIN ──
function selRole(el) {
  document.querySelectorAll('.role-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
}

async function doLogin() {
  const usuario = document.getElementById('l-user').value.trim();
  const clave   = document.getElementById('l-pass').value;
  const role    = document.querySelector('.role-chip.active').textContent.trim();

  const CREDENCIALES = {
    'Admin':     { usuario: 'admin1234',   clave: 'kinetic.dev'  },
    'Dueño':     { usuario: 'kinetic1270', clave: 'gimnasio1270' },
    'Recepción': { usuario: 'recepcion01', clave: 'kinetic'      },
  };

  const match = CREDENCIALES[role];
  if (!match || match.usuario !== usuario || match.clave !== clave) {
    showToast('Credenciales incorrectas para este rol', true);
    document.getElementById('l-pass').value = '';
    document.getElementById('l-pass').focus();
    return;
  }

  document.getElementById('nav-u').textContent = role;
  document.querySelector('.nav-avatar').textContent = role[0];
  document.getElementById('login').classList.remove('active');
  document.getElementById('app').classList.add('active');

  aplicarPermisosPorRol(role);

  await cargarClientes();
  await cargarInscRecientes();

  if (typeof refreshDashboard === 'function') refreshDashboard();
  updatePlanPreview();
  showToast(`Bienvenido, ${role} 💪`);
}

function aplicarPermisosPorRol(role) {  
  const esRecepcionista = role === 'Recepcionista' || role === 'Recepción';  
  
  // ── Nav: ocultar Dashboard al Recepcionista ──  
  const tabDashboard = document.getElementById('nav-tab-dashboard');  
  if (tabDashboard) tabDashboard.classList.toggle('hidden', esRecepcionista);  
  
  // ── Tarjeta de recaudación: ocultar onclick al Recepcionista ──  
  const cardIngresos = document.getElementById('db-ingresos')?.closest('.metric-card');  
  if (cardIngresos) {    
    if (esRecepcionista) {      
      cardIngresos.removeAttribute('onclick');      
      cardIngresos.style.cursor = 'default';      
      cardIngresos.onmouseover = null;      
      cardIngresos.onmouseout  = null;    
    }  
  }  
  
  // ── Redirigir según rol ──  
  if (esRecepcionista) {    
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));    
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));    
    document.getElementById('tab-clientes')?.classList.add('active');    
    document.getElementById('nav-tab-clientes')?.classList.add('active');  
  } else {    
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));    
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));    
    document.getElementById('tab-dashboard')?.classList.add('active');    
    document.getElementById('nav-tab-dashboard')?.classList.add('active');  
  }
}

function doLogout() {
  document.getElementById('app').classList.remove('active');
  document.getElementById('login').classList.add('active');
}

// ── TABS ──
function showTab(id, btn) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + id).classList.add('active');
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
}

// ── MODAL EDITAR CLIENTE ──
function openEditClient(id) {
  const c = clientes.find(x => x.id === id);
  if (!c) return;
  document.getElementById('edit-id').value     = id;
  document.getElementById('edit-nombre').value = c.nombre;
  document.getElementById('edit-dni').value    = c.dni;
  document.getElementById('edit-tel').value    = c.tel;
  
  const selectPlan = document.getElementById('edit-plan');
  const existeOpcion = Array.from(selectPlan.options).some(opt => opt.value === c.plan);
  if (!existeOpcion && c.plan) {
    const opt = document.createElement('option');
    opt.value = c.plan;
    opt.textContent = `${c.plan} (Plan anterior)`;
    selectPlan.appendChild(opt);
  }
  selectPlan.value = c.plan;

  document.getElementById('edit-vence').value  = c.vence;
  document.getElementById('modal-edit').classList.add('open');
}

function openEditIns(id) {
  const i = inscRecientes.find(x => x.id === id);
  if (!i) return;
  document.getElementById('edit-id').value     = 'ins_' + id;
  document.getElementById('edit-nombre').value = i.nombre;
  document.getElementById('edit-dni').value    = i.dni;
  document.getElementById('edit-tel').value    = '';

  const selectPlan = document.getElementById('edit-plan');
  const existeOpcion = Array.from(selectPlan.options).some(opt => opt.value === i.plan);
  if (!existeOpcion && i.plan) {
    const opt = document.createElement('option');
    opt.value = i.plan;
    opt.textContent = `${i.plan} (Plan anterior)`;
    selectPlan.appendChild(opt);
  }
  selectPlan.value = i.plan;

  document.getElementById('edit-vence').value  = '—';
  document.getElementById('modal-edit').classList.add('open');
}

async function saveEdit() {
  const raw    = document.getElementById('edit-id').value;
  const nombre = document.getElementById('edit-nombre').value.trim();
  const dni    = document.getElementById('edit-dni').value.trim();
  const tel    = document.getElementById('edit-tel').value.trim();
  const plan   = document.getElementById('edit-plan').value;
  const vence  = document.getElementById('edit-vence').value.trim();

  if (!nombre) { showToast('El nombre no puede estar vacío', true); return; }

  if (raw.startsWith('ins_')) {
    const id = raw.replace('ins_', '');
    const i  = inscRecientes.find(x => x.id === id);
    if (i) { i.nombre = nombre; i.dni = dni; i.plan = plan; }
    renderInscRecientes();
    closeModal();
    showToast('Cambios guardados');
  } else {
    try {
      let fechaVencimiento = undefined;
      if (vence && vence !== '—' && vence.includes('/')) {
        const [d, m, y] = vence.split('/');
        fechaVencimiento = new Date(`${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}T12:00:00Z`);
      }

      const body = { nombre, dni, telefono: tel || '—', plan };
      if (fechaVencimiento) body.fechaVencimiento = fechaVencimiento;

      const respuesta = await fetch(`${API_URL}/clientes/${raw}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body)
      });
      if (respuesta.ok) {
        await cargarClientes();
        closeModal();
        showToast('Cambios guardados correctamente');
        refreshDashboard();
      } else {
        const err = await respuesta.json();
        showToast(err.mensaje || 'Error al guardar', true);
      }
    } catch (error) {
      showToast('Error de conexión', true);
    }
  }
}

// ── MODAL ELIMINAR ──
function openDelete(id, type, nombre) {
  pendingDeleteId   = id;
  pendingDeleteType = type;
  document.getElementById('del-nombre').textContent = nombre;
  document.getElementById('modal-del').classList.add('open');
}

async function confirmDelete() {
  if (pendingDeleteType === 'client') {
    try {
      await fetch(`${API_URL}/clientes/${pendingDeleteId}`, { method: 'DELETE' });
      await cargarClientes(); 
      refreshDashboard();
    } catch (error) {
      showToast('Error al eliminar', true);
    }
  } else {
    inscRecientes = inscRecientes.filter(i => i.id !== pendingDeleteId);
    renderInscRecientes();
  }
  closeModal();
  showToast('Registro eliminado');
}

function closeModal() {
  document.getElementById('modal-edit').classList.remove('open');
  document.getElementById('modal-del').classList.remove('open');
  document.getElementById('modal-renovar').classList.remove('open');
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  document.querySelectorAll('.modal-overlay').forEach(o => {
    o.addEventListener('click', e => { if (e.target === o) closeModal(); });
  });

  const inputFechaInscripcion = document.getElementById('f-fecha'); 
  if (inputFechaInscripcion) {
    inputFechaInscripcion.value = new Date().toISOString().split('T')[0];
  }
});

// ── TOAST ──
function showToast(msg, err = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (err ? ' err' : '') + ' show';
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── RENOVAR CUOTA ──
function calcularNuevaFecha(fechaBase, plan) {
  const d = new Date(fechaBase);
  if (plan.startsWith('Mensual')) {
    const dia = d.getDate();
    d.setMonth(d.getMonth() + 1);
    if (d.getDate() !== dia) d.setDate(0);
  } else if (plan.startsWith('Semanal')) {
    d.setDate(d.getDate() + 7);
  } else if (plan === 'Pase Diario') {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

function openRenovar(id) {
  const c = clientes.find(x => x.id === id);
  if (!c) return;
  document.getElementById('renovar-id').value      = c.id;
  document.getElementById('renovar-nombre').value  = c.nombre;
  document.getElementById('renovar-plan').value    = '';
  document.getElementById('renovar-importe').value = '';
  document.getElementById('renovar-fecha-preview').textContent = '—';
  document.getElementById('renovar-fecha-preview').dataset.iso = '';
  document.getElementById('renovar-base-info').textContent = 'Seleccioná un plan para ver el vencimiento';
  document.getElementById('modal-renovar').classList.add('open');
}

function actualizarPreviewRenovacion() {
  const id = document.getElementById('renovar-id').value;
  const c  = clientes.find(x => x.id === id);
  if (!c) return;
  
  const plan = document.getElementById('renovar-plan').value;
  if (!plan) return;

  document.getElementById('renovar-importe').value = PLAN_PRECIOS[plan] || 0;
  
  const hoy = new Date();
  hoy.setHours(12, 0, 0, 0);
  
  let base = hoy; 
  let esAdelantado = false;
  
  if (c.vence && c.vence !== '—' && c.vence.includes('/')) {
    const [d, m, y] = c.vence.split('/');
    const vDate = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T12:00:00Z`);
    
    if (vDate >= hoy) {
      base = vDate;
      esAdelantado = true;
    }
  }
  
  const nuevaFecha = calcularNuevaFecha(base, plan);
  const previewEl  = document.getElementById('renovar-fecha-preview');
  
  previewEl.textContent = nuevaFecha.toLocaleDateString('es-AR');
  previewEl.dataset.iso = `${nuevaFecha.getFullYear()}-${String(nuevaFecha.getMonth()+1).padStart(2,'0')}-${String(nuevaFecha.getDate()).padStart(2,'0')}T12:00:00Z`;
  
  document.getElementById('renovar-base-info').textContent = esAdelantado
    ? `Se suma al vencimiento actual (${c.vence})`
    : 'Cliente vencido — el nuevo mes cuenta desde HOY';
}

async function confirmarRenovacion() {
  const id      = document.getElementById('renovar-id').value;
  const c       = clientes.find(x => x.id === id);
  if (!c) return;
  
  const plan    = document.getElementById('renovar-plan').value;
  const importe = parseInt(document.getElementById('renovar-importe').value) || 0;
  const fechaVencimiento = document.getElementById('renovar-fecha-preview').dataset.iso;
  
  if (!plan) { showToast('Por favor, elegí un plan primero', true); return; }
  if (!fechaVencimiento) { showToast('No se pudo calcular la fecha', true); return; }
  
  try {
    const respuesta = await fetch(`${API_URL}/clientes/${id}/renovar`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ plan, importe, fechaVencimiento })
    });
    
    if (respuesta.ok) {
      inscRecientes.unshift({
        id:      id,
        nombre:  c.nombre,
        plan:    plan,
        importe: '$' + importe.toLocaleString('es-AR'), 
        fecha:   new Date().toLocaleDateString('es-AR'),
        dni:     c.dni
      });
      
      closeModal();
      await cargarClientes();
      refreshDashboard(); 
      showToast('Cuota renovada y pago registrado');
    } else {
      const err = await respuesta.json();
      showToast(err.mensaje || 'Error al renovar', true);
    }
  } catch (error) {
    showToast('Error de conexión', true);
  }
}

// ═══════════════════════════════════════════
//  HELPER: MATCH UNIVERSAL DE FECHAS
// ═══════════════════════════════════════════
function perteneceAlMes(fechaStr, targetMonth, targetYear, isCurrentMonth) {
  if (!fechaStr || fechaStr === 'Ahora') return isCurrentMonth;

  // Extraer solo los números de la fecha (ignora /, -, . o letras)
  const nums = fechaStr.match(/\d+/g);
  if (!nums || nums.length < 2) return false;

  const n1 = parseInt(nums[0], 10);
  const n2 = parseInt(nums[1], 10);
  const n3 = nums.length >= 3 ? parseInt(nums[2], 10) : null;

  if (n1 === targetYear) {
    // Formato YYYY-MM-DD (El mes está siempre en el medio)
    return n2 === targetMonth;
  } else if (n3 === targetYear || fechaStr.includes(targetYear.toString())) {
    // Formato DD/MM/YYYY o MM/DD/YYYY
    if (n1 > 12) return n2 === targetMonth; // El día es mayor a 12, n2 es el mes seguro
    if (n2 > 12) return n1 === targetMonth; // El día es mayor a 12, n1 es el mes seguro
    // Si es ambiguo (ej: 04/07), aceptamos ambas posiciones
    return n1 === targetMonth || n2 === targetMonth;
  }
  return false;
}

// ── DRAWER: PAGOS DEL MES ──
let pagosOffset = 0;

function changePagosMonth(delta) {
  const nuevoOffset = pagosOffset + delta;
  if (nuevoOffset > 0) return; // No ir al futuro
  pagosOffset = nuevoOffset;
  openPagosDrawer();
}

function openPagosDrawer() {
  const fecha = new Date(TODAY.getFullYear(), TODAY.getMonth() + pagosOffset, 1);
  const mesActual = fecha.getMonth();
  const anioActual = fecha.getFullYear();
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  const targetM = mesActual + 1; // 1 a 12
  const isCurrent = (pagosOffset === 0);

  // Filtro invencible usando nuestro Match Universal
  const pagosMes = inscRecientes.filter(i => perteneceAlMes(i.fecha, targetM, anioActual, isCurrent));

  const totalRecaudado = pagosMes.reduce((sum, i) =>
    sum + parseInt((i.importe || '0').replace(/[^0-9]/g, ''), 10), 0);
  const promedio = pagosMes.length > 0 ? Math.round(totalRecaudado / pagosMes.length) : 0;

  document.getElementById('pagos-drawer-titulo').textContent = `${meses[mesActual]} ${anioActual}`;
  document.getElementById('pagos-stat-total').textContent = '$' + totalRecaudado.toLocaleString('es-AR');
  document.getElementById('pagos-stat-cant').textContent = pagosMes.length;
  document.getElementById('pagos-stat-prom').textContent = '$' + promedio.toLocaleString('es-AR');
  document.getElementById('pagos-drawer-subtitulo').textContent = `${pagosMes.length} pago${pagosMes.length !== 1 ? 's' : ''} registrados`;

  const lista = document.getElementById('pagos-drawer-list');
  if (pagosMes.length === 0) {
    lista.innerHTML = '<div class="history-empty" style="color:var(--text3);text-align:center;padding:30px;">💳<br>Sin pagos registrados<br>en este mes.</div>';
  } else {
    lista.innerHTML = pagosMes.map(p => `
      <div class="history-item" style="justify-content:space-between">
        <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0">
          <div class="history-dot" style="background:var(--green);flex-shrink:0"></div>
          <div style="min-width:0">
            <div class="history-date" style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
              ${p.nombre}
            </div>
            <div style="font-size:11px;color:var(--text3)">${p.plan} · ${p.fecha}</div>
          </div>
        </div>
        <div style="font-family:var(--font-d);font-size:16px;font-weight:700;color:var(--green);flex-shrink:0;margin-left:12px">
          ${p.importe}
        </div>
      </div>`).join('');
  }

  const overlay = document.getElementById('pagos-overlay');
  const drawer  = document.getElementById('pagos-drawer');
  if (!drawer.classList.contains('open')) {
    overlay.classList.add('open');
    setTimeout(() => drawer.classList.add('open'), 10);
  }
}

// FIX: Había dos closePagosDrawer, dejamos solo una correcta que resetea el offset
function closePagosDrawer() {
  document.getElementById('pagos-drawer').classList.remove('open');
  document.getElementById('pagos-overlay').classList.remove('open');
  pagosOffset = 0; // Para que al volver a abrir, empiece en el mes actual
}

// ── DRAWER: ALUMNOS ACTIVOS ──
function openActivosDrawer() {
  const hoySinHora = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate());

  const activos = clientes.filter(c => {
    if (!c.vence || c.vence === '—') return true;
    const [d, m, y] = c.vence.split('/');
    if (!y) return true;
    return new Date(y, m - 1, d) >= hoySinHora;
  });

  const vencenPronto = activos.filter(c => {
    const [d, m, y] = (c.vence || '').split('/');
    if (!y) return false;
    const diff = Math.round((new Date(y, m - 1, d) - hoySinHora) / 86400000);
    return diff >= 0 && diff <= 7;
  }).length;

  const planLibre = activos.filter(c => c.plan === 'Mensual Libre').length;

  document.getElementById('activos-drawer-subtitulo').textContent =
    `${activos.length} alumno${activos.length !== 1 ? 's' : ''} con cuota vigente`;
  document.getElementById('activos-drawer-count').textContent = `${activos.length} registros`;
  document.getElementById('activos-stat-total').textContent   = activos.length;
  document.getElementById('activos-stat-pronto').textContent  = vencenPronto;
  document.getElementById('activos-stat-libre').textContent   = planLibre;

  const lista = document.getElementById('activos-drawer-list');
  if (!activos.length) {
    lista.innerHTML = '<div class="history-empty">🏋️<br>No hay alumnos activos<br>en este momento.</div>';
  } else {
    lista.innerHTML = activos
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
      .map(c => `
        <div class="history-item" style="justify-content:space-between;cursor:pointer" onclick="openProfile('${c.id}')">
          <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0">
            <div class="history-dot" style="background:var(--accent);flex-shrink:0"></div>
            <div style="min-width:0">
              <div class="history-date" style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                ${c.nombre}
              </div>
              <div style="font-size:11px;color:var(--text3)">${c.plan}</div>
            </div>
          </div>
          <div style="font-family:var(--font-d);font-size:14px;font-weight:700;color:var(--text2);flex-shrink:0;margin-left:12px">
            ${c.vence}
          </div>
        </div>`).join('');
  }

  document.getElementById('activos-overlay').classList.add('open');
  setTimeout(() => document.getElementById('activos-drawer').classList.add('open'), 10);
}

function closeActivosDrawer() {
  document.getElementById('activos-drawer').classList.remove('open');
  document.getElementById('activos-overlay').classList.remove('open');
}

// ── EXPORTAR A CSV ──
function exportarCSV(tipo) {
  let filas = [];
  let nombreArchivo = '';

  if (tipo === 'pagos') {
    // FIX: Ahora exporta el mes exacto que estás visualizando, no siempre el actual!
    const targetDate = new Date(TODAY.getFullYear(), TODAY.getMonth() + pagosOffset, 1);
    const mesActual  = targetDate.getMonth();
    const anioActual = targetDate.getFullYear();
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                   'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

    const targetM = mesActual + 1;
    const isCurrent = (pagosOffset === 0);

    const pagosMes = inscRecientes.filter(i => perteneceAlMes(i.fecha, targetM, anioActual, isCurrent));

    filas.push(['Nombre', 'DNI', 'Plan', 'Importe', 'Fecha']);
    pagosMes.forEach(p => filas.push([p.nombre, p.dni || '', p.plan, p.importe, p.fecha]));
    nombreArchivo = `pagos_${meses[mesActual]}_${anioActual}.csv`;

  } else if (tipo === 'activos') {
    const hoySinHora = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate());
    const activos = clientes.filter(c => {
      if (!c.vence || c.vence === '—') return true;
      const [d, m, y] = c.vence.split('/');
      if (!y) return true;
      return new Date(y, m - 1, d) >= hoySinHora;
    });

    filas.push(['Nombre', 'DNI', 'Plan', 'Teléfono', 'Vence']);
    activos.forEach(c => filas.push([c.nombre, c.dni || '', c.plan, c.tel || '', c.vence]));
    nombreArchivo = `alumnos_activos_${TODAY.toISOString().slice(0,10)}.csv`;
  }

  if (filas.length <= 1) {
    showToast('No hay datos para exportar', true);
    return;
  }

  const csvContent = filas
    .map(fila => fila.map(campo => `"${String(campo).replace(/"/g, '""')}"`).join(';'))
    .join('\n');

  const BOM = '\uFEFF'; 
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showToast('Archivo descargado correctamente');
}


// ── TEMA CLARO/OSCURO ──
// ── ÍCONOS PROFESIONALES SVG ──
const iconoSol = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;

const iconoLuna = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

function aplicarTema(modo) {
  const btn = document.getElementById('theme-toggle');
  if (modo === 'light') {
    document.body.classList.add('light-mode');
    if (btn) btn.innerHTML = iconoSol; 
  } else {
    document.body.classList.remove('light-mode');
    if (btn) btn.innerHTML = iconoLuna;
  }
}

function toggleTheme() {
  const esClaroActual = document.body.classList.contains('light-mode');
  const nuevoModo = esClaroActual ? 'dark' : 'light';
  aplicarTema(nuevoModo);
  localStorage.setItem('kinetic-theme', nuevoModo);
}

function initTheme() {
  const guardado = localStorage.getItem('kinetic-theme');
  if (guardado === 'light') {
    aplicarTema('light');
  } else {
    aplicarTema('dark'); // Acá se inyecta la luna por defecto si no hay tema guardado
  }
}


// ── MODO KIOSCO ──
let kioskModeActivo = false;

function toggleKioskMode() {
  kioskModeActivo = !kioskModeActivo;
  const app = document.getElementById('app');

  if (kioskModeActivo) {
    app.classList.add('kiosk-mode');
    // Doble click o tecla Escape para salir
    document.addEventListener('keydown', salirKioskMode);
  } else {
    app.classList.remove('kiosk-mode');
    document.removeEventListener('keydown', salirKioskMode);
  }
}

function salirKioskMode(e) {
  if (e.key === 'Escape') toggleKioskMode();
}