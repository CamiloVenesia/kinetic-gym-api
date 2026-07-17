// ═══════════════════════════════════════════
//  perfil.js — Panel de perfil del cliente
// ═══════════════════════════════════════════

const DIAS_ES  = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function openProfile(id) {
  try {
    // 1. Búsqueda a prueba de fallos: convierte ambos a texto para asegurar la coincidencia
    const c = clientes.find(x => String(x.id) === String(id));
    if (!c) {
      console.error("Error: Cliente no encontrado en el array local. ID buscado:", id);
      return;
    }

    // 2. Extracción segura de ingresos: soporta el formato nuevo de MongoDB y datos viejos mezclados
    const ingresos = (c.ingresos || []).map(i => {
      if (typeof i === 'object' && i !== null && i.fecha) return i.fecha;
      return i; // Si ya es un texto plano, lo deja pasar
    }).filter(i => i); // Elimina cualquier dato corrupto o nulo

    // 3. Renderizado del Header con validación por si faltan datos
    const nombreSeguro = c.nombre || "Sin Nombre";
    const partesNombre = nombreSeguro.split(' ');
    const ini = partesNombre.map(n => n && n[0] ? n[0] : '').slice(0, 2).join('');
    
    document.getElementById('pd-avatar').textContent = ini;
    document.getElementById('pd-name').textContent   = nombreSeguro;
    document.getElementById('pd-meta').innerHTML =
      `DNI: <strong style="color:var(--text)">${c.dni || '—'}</strong> &nbsp;·&nbsp; ` +
      `Plan: <strong style="color:var(--text)">${c.plan || '—'}</strong><br>` +
      `Tel: ${c.tel || '—'} &nbsp;·&nbsp; Desde: ${c.desde || '—'}<br>` +
      `Vence: <strong style="color:${c.activo ? 'var(--green)' : 'var(--red)'}">${c.vence || '—'}</strong>`;

    // 4. Cálculo de Fechas y Estadísticas blindado
    const hoyReal = new Date();
    const inicioMes = new Date(hoyReal.getFullYear(), hoyReal.getMonth(), 1);
    
    let mesCnt = 0;
    const validDates = [];
    
    ingresos.forEach(iso => {
      const d = new Date(iso);
      if (!isNaN(d.getTime())) { // Solo procesa la fecha si el motor de JS confirma que es válida
        validDates.push(d);
        if (d >= inicioMes) mesCnt++;
      }
    });

    document.getElementById('pd-total-vis').textContent = validDates.length;
    document.getElementById('pd-mes-vis').textContent   = mesCnt;

    // 5. Cálculo de Racha
    const uniqueDays = [...new Set(validDates.map(d => 
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    ))].sort().reverse();

    let racha = 0;
    for (let i = 0; i < uniqueDays.length; i++) {
      const expected = new Date(hoyReal);
      expected.setDate(hoyReal.getDate() - i);
      const exp = `${expected.getFullYear()}-${String(expected.getMonth() + 1).padStart(2, '0')}-${String(expected.getDate()).padStart(2, '0')}`;
      if (uniqueDays[i] === exp) racha++;
      else break;
    }
    document.getElementById('pd-racha').textContent = racha;

    // 6. Mapa de Calor (Heatmap)
    const hm = document.getElementById('pd-heatmap');
    if (hm) {
      hm.innerHTML = '';
      const ingDays = new Set(uniqueDays);
      const todayStr = `${hoyReal.getFullYear()}-${String(hoyReal.getMonth() + 1).padStart(2, '0')}-${String(hoyReal.getDate()).padStart(2, '0')}`;
      
      const gridStart = new Date(hoyReal);
      gridStart.setDate(hoyReal.getDate() - (hoyReal.getDay() + 28));

      ['D', 'L', 'M', 'X', 'J', 'V', 'S'].forEach(day => {
        const h = document.createElement('div');
        h.style.cssText = 'font-size:9px;color:var(--text3);text-align:center;padding-bottom:2px;font-weight:700';
        h.textContent = day;
        hm.appendChild(h);
      });

      for (let i = 0; i < 35; i++) {
        const d = new Date(gridStart);
        d.setDate(gridStart.getDate() + i);
        const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const cell = document.createElement('div');
        cell.className = 'hm-cell';
        
        if (dStr > todayStr) {
          cell.style.opacity = '0.2';
        } else {
          cell.textContent = d.getDate();
          if (dStr === todayStr) cell.classList.add('has-entry-today');
          else if (ingDays.has(dStr)) cell.classList.add('has-entry');
          
          const tip = document.createElement('div');
          tip.className = 'hm-tooltip';
          tip.textContent = `${d.getDate()} ${MESES_ES[d.getMonth()]}`;
          if (ingDays.has(dStr)) tip.textContent += ' ✓';
          cell.appendChild(tip);
        }
        hm.appendChild(cell);
      }
    }

    // 7. Renderizado del Historial (Lista Inferior)
    const hist = document.getElementById('pd-history');
    const countLabel = document.getElementById('pd-hist-count');
    if (countLabel) countLabel.textContent = `${validDates.length} ${validDates.length === 1 ? 'ingreso' : 'ingresos'}`;

    if (hist) {
      if (validDates.length === 0) {
        hist.innerHTML = '<div class="history-empty">⌚<br>Sin ingresos registrados<br>aún en este sistema.</div>';
      } else {
        // Ordena por fecha descendente (más nuevos arriba)
        hist.innerHTML = validDates.sort((a, b) => b - a).slice(0, 50).map(d => {
          const dateStr = `${DIAS_ES[d.getDay()]} ${d.getDate()} ${MESES_ES[d.getMonth()]} ${d.getFullYear()}`;
          const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
          const isToday = d.toDateString() === hoyReal.toDateString();
          
          return `<div class="history-item">
            <div class="history-dot" style="background:${isToday ? 'var(--accent)' : 'var(--green)'}"></div>
            <div style="flex:1">
              <div class="history-date">${isToday ? '<span style="color:var(--accent)">Hoy</span>, ' + timeStr : dateStr}</div>
            </div>
            <div class="history-time">${isToday ? '' : timeStr}</div>
          </div>`;
        }).join('');
      }
    }

    // 8. Abrir el panel de forma segura
    const overlay = document.getElementById('profile-overlay');
    const drawer = document.getElementById('profile-drawer');
    
    if (overlay && drawer) {
      overlay.classList.add('open');
      setTimeout(() => drawer.classList.add('open'), 10);
    } else {
      console.error("Error: No se encontraron los elementos HTML del panel (profile-overlay o profile-drawer).");
    }
    
  } catch (error) {
    console.error("Error crítico al intentar abrir el perfil:", error);
    if (typeof showToast === 'function') {
      showToast("Hubo un error al procesar los datos de este cliente", true);
    } else {
      alert("Error al cargar el perfil del cliente.");
    }
  }
}

function closeProfile() {
  const drawer = document.getElementById('profile-drawer');
  const overlay = document.getElementById('profile-overlay');
  if (drawer) drawer.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
}