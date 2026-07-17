// ═══════════════════════════════════════════
//  inscripcion.js — Formulario de inscripción
//  NOTA: API_URL viene de data.js
// ═══════════════════════════════════════════

function renderInscRecientes() {
  // SLICE(0,8) ACÁ: Para que la tabla visual solo muestre los 8 más nuevos,
  // pero el Dashboard pueda sumar TODOS los que están en el array.
  document.getElementById('ins-list').innerHTML = inscRecientes.slice(0, 8).map(i => `
    <div class="ins-row">
      <div class="ins-avatar">${i.nombre.split(' ').map(n => n[0]).slice(0, 2).join('')}</div>
      <div style="flex:1;min-width:0">
        <div class="ins-name">${i.nombre}</div>
        <div class="ins-sub">DNI ${i.dni}</div>
      </div>
      <div class="ins-right">
        <div class="ins-plan">${i.plan}</div>
        <div class="ins-amount">${i.importe}</div>
        <div class="ins-date">${i.fecha}</div>
      </div>
      <div class="ins-actions">
        <button class="btn-icon edit" onclick="openEditIns('${i.id}')">✏</button>
        <button class="btn-icon del"  onclick="openDelete('${i.id}','ins','${i.nombre}')">✕</button>
      </div>
    </div>`).join('');
}

async function inscribirCliente() {
  const nombre    = document.getElementById('f-nombre').value.trim();
  const apellido  = document.getElementById('f-apellido').value.trim();
  const dni       = document.getElementById('f-dni').value.trim();
  const tel       = document.getElementById('f-tel').value.trim();
  const planRaw   = document.getElementById('f-plan').value;
  const fecha     = document.getElementById('f-fecha').value;
  const elMetodo  = document.getElementById('f-metodo');
  const metodoPago = elMetodo ? elMetodo.value : 'Efectivo';

  if (!nombre || !apellido) { showToast('Ingresá nombre y apellido', true); return; }
  if (dni.length < 7)       { showToast('DNI inválido', true); return; }

  const [plan, precio] = planRaw.split('|');
  const nombreCompleto = nombre + ' ' + apellido;

  const payload = { nombre: nombreCompleto, dni, telefono: tel || '—', plan, metodoPago, fechaInicio: fecha };

  try {
    const respuesta = await fetch(`${API_URL}/clientes`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    });

    const resultado = await respuesta.json();

    if (respuesta.ok) {
      const imp = '$' + parseInt(precio).toLocaleString('es-AR');

      // ── ACÁ ESTÁ EL CAMBIO: Usamos la fecha real en lugar de 'Ahora' ──
      inscRecientes.unshift({ 
        id: resultado._id, 
        nombre: nombreCompleto, 
        plan, 
        importe: imp, 
        fecha: new Date().toLocaleDateString('es-AR'), 
        dni 
      });
      
      clientes.unshift({
        id: resultado._id, dni, nombre: nombreCompleto, plan,
        vence:  calcVence(fecha, plan),
        activo: true,
        tel:    tel || '—',
        desde:  fecha.split('-').reverse().join('/'),
        ingresos: []
      });

      renderInscRecientes();
      renderClientsTable();
      refreshDashboard();

      document.getElementById('f-nombre').value   = '';
      document.getElementById('f-apellido').value = '';
      document.getElementById('f-dni').value      = '';
      document.getElementById('f-tel').value      = '';

      showToast('✓ ' + nombreCompleto + ' inscripto y guardado en la nube');
    } else {
      showToast(resultado.mensaje, true);
    }

  } catch (error) {
    console.error('Error:', error);
    showToast('Error al conectar con la base de datos', true);
  }
}

function calcVence(fechaStr, plan) {
  const d = new Date(fechaStr + 'T12:00:00');
  if (plan.startsWith('Mensual')) {
    const dia = d.getDate();
    d.setMonth(d.getMonth() + 1);
    if (d.getDate() !== dia) d.setDate(0);
  } else if (plan.startsWith('Semanal')) {
    d.setDate(d.getDate() + 7);
  } else if (plan === 'Pase Diario') {
    d.setDate(d.getDate() + 1);
  }
  return d.toLocaleDateString('es-AR');
}

function selectPlan(el, val) {
  document.querySelectorAll('.plan-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('f-plan').value = val;
  updatePlanPreview();
}

function updatePlanPreview() {
  const val   = document.getElementById('f-plan').value;
  const fecha = document.getElementById('f-fecha').value;
  if (!val || !fecha) return;
  const [plan, precio] = val.split('|');
  const vence = calcVence(fecha, plan);
  document.getElementById('plan-resumen').innerHTML =
    `Plan: <strong style="color:var(--text)">${plan}</strong><br>` +
    `Importe: <strong style="color:var(--green)">$${parseInt(precio).toLocaleString('es-AR')}</strong><br>` +
    `Vence: <strong style="color:var(--text)">${vence}</strong>`;
  document.querySelectorAll('.plan-option').forEach(o => {
    o.classList.toggle('selected', o.querySelector('.plan-option-name').textContent === plan);
  });
}

async function cargarInscRecientes() {
  try {
    const respuesta = await fetch(`${API_URL}/clientes`);
    const datos     = await respuesta.json();
    
    const todosLosPagos = [];

    datos.forEach(c => {
      // 1. Extraemos la inscripción original
      const precioInsc = PLAN_PRECIOS[c.plan] || 0;
      todosLosPagos.push({
        id:       c._id,
        nombre:   c.nombre,
        plan:     c.plan,
        importe:  '$' + precioInsc.toLocaleString('es-AR'),
        fechaObj: new Date(c.createdAt || c.fechaInicio),
        fecha:    new Date(c.createdAt || c.fechaInicio).toLocaleDateString('es-AR'),
        dni:      c.dni
      });

      // 2. Extraemos TODAS las renovaciones de la base de datos
      if (c.pagos && c.pagos.length > 0) {
        c.pagos.forEach(p => {
          todosLosPagos.push({
            id:       c._id + '_' + new Date(p.fecha).getTime(),
            nombre:   c.nombre,
            plan:     p.plan,
            importe:  '$' + (p.importe || 0).toLocaleString('es-AR'),
            fechaObj: new Date(p.fecha),
            fecha:    new Date(p.fecha).toLocaleDateString('es-AR'),
            dni:      c.dni
          });
        });
      }
    });

    // Ordenamos todo el historial del más nuevo al más viejo
    todosLosPagos.sort((a, b) => b.fechaObj - a.fechaObj);

    // Llenamos el array global
    inscRecientes.length = 0;
    todosLosPagos.forEach(p => {
      inscRecientes.push({
        id:      p.id,
        nombre:  p.nombre,
        plan:    p.plan,
        importe: p.importe,
        fecha:   p.fecha,
        dni:     p.dni
      });
    });

    renderInscRecientes();
  } catch (error) {
    console.error('Error al cargar inscripciones:', error);
  }
}