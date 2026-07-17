// ═══════════════════════════════════════════
//  dashboard.js — Dashboard reactivo
// ═══════════════════════════════════════════

let dashMonthOffset = 0; // Controla la navegación temporal (0 = actual, -1 = pasado, etc.)

function changeDashMonth(delta) {
  dashMonthOffset += delta;
  if (dashMonthOffset > 0) dashMonthOffset = 0; // Bloqueamos ir hacia el futuro
  refreshDashboard();
}

function initDashboard() { refreshDashboard(); }

function getIngFecha(i) {
  if (!i) return null;
  if (typeof i === 'string') return i;
  if (typeof i === 'object' && i.fecha) return i.fecha;
  return null;
}

function fmtMoney(n) {
  return n >= 1000 ? '$' + (n / 1000).toFixed(0) + 'k' : '$' + n;
}

function refreshDashboard() {
  // 1. Fechas relativas a la navegación (Para los gráficos)
  const targetDate = new Date(TODAY.getFullYear(), TODAY.getMonth() + dashMonthOffset, 1);
  const mesActual  = targetDate.getMonth();
  const anioActual = targetDate.getFullYear();
  const isCurrentMonth = dashMonthOffset === 0;
  
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  // 2. Calcular Vencidos vs Activos en TIEMPO REAL (Siempre al día de HOY)
  let activosReal = [];
  let vencidosReal = [];
  const hoySinHora = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate());

  clientes.forEach(c => {
    if (!c.vence || c.vence === '—') {
      activosReal.push(c);
      return;
    }
    const partes = c.vence.split('/');
    if (partes.length === 3) {
      const [d, m, y] = partes;
      const fechaVence = new Date(y, m - 1, d);
      
      if (fechaVence < hoySinHora) {
        vencidosReal.push(c);
      } else {
        activosReal.push(c);
      }
    } else {
      activosReal.push(c);
    }
  });

  const activos  = activosReal;
  const vencidos = vencidosReal;

  // 3. Recopilar todos los ingresos del kiosko
  const allFechas = clientes.flatMap(c =>
    (c.ingresos || []).map(getIngFecha).filter(Boolean)
  );

  const ingresosHoy = allFechas.filter(f => f.startsWith(TODAY_STR)).length;

  // 4. Calcular Recaudación del MES SELECCIONADO
  const pagosMes = inscRecientes.filter(i => {
    if (!i.fecha || i.fecha === 'Ahora') return isCurrentMonth;
    const partes = i.fecha.split('/');
    if (partes.length < 3) return false;
    const [d, m, y] = partes;
    const fd = new Date(`${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`);
    return fd.getMonth() === mesActual && fd.getFullYear() === anioActual;
  });

  const recaudado = pagosMes.reduce((sum, i) =>
    sum + parseInt((i.importe || '0').replace(/[^0-9]/g, '')), 0);

  // 5. Vencimientos próximos (Siempre relativos a HOY)
  const pronto = activos.filter(c => {
    const [d, m, y] = (c.vence || '').split('/');
    if (!y) return false;
    const diff = Math.round((new Date(y, m - 1, d) - hoySinHora) / 86400000);
    return diff >= 0 && diff <= 7;
  });

  // ── ACTUALIZAR TARJETAS ──
  animCounter('db-activos', activos.length);
  document.getElementById('db-activos-sub').innerHTML =
    `<span class="up">${pronto.length} vencen esta semana</span>`;

  // Adaptación de la tarjeta de recaudación para viajes en el tiempo
  const lblIngresos = document.querySelector('.metric-card.g .metric-label');
  if (lblIngresos) {
    lblIngresos.textContent = isCurrentMonth ? 'Recaudado este mes' : `Recaudado en ${meses[mesActual]}`;
  }
  
  document.getElementById('db-ingresos').textContent = fmtMoney(recaudado);
  document.getElementById('db-ingresos-sub').innerHTML = isCurrentMonth
    ? `<span style="cursor:pointer;text-decoration:underline;color:var(--text2)"
       onclick="openPagosDrawer()">Ver ${pagosMes.length} pagos del mes →</span>`
    : `<span style="color:var(--text3)">${pagosMes.length} pagos registrados</span>`;

  animCounter('db-vencidas', vencidos.length);
  const pctVencidos = clientes.length ? Math.round((vencidos.length / clientes.length) * 100) : 0;
  document.getElementById('db-vencidas-sub').innerHTML = `${pctVencidos}% del total`;

  // Calcular el pico de asistencia de HOY
  const hourCountsToday = Array(24).fill(0);
  allFechas.filter(f => f.startsWith(TODAY_STR)).forEach(f => {
    const h = new Date(f).getHours();
    if (!isNaN(h)) hourCountsToday[h]++;
  });
  const maxHoy = Math.max(...hourCountsToday);
  const picHourHoy = hourCountsToday.indexOf(maxHoy);

  animCounter('db-hoy', ingresosHoy);
  document.getElementById('db-hoy-sub').innerHTML = ingresosHoy > 0
    ? `Pico: <strong>${String(picHourHoy).padStart(2,'0')}:00–${String(picHourHoy+1).padStart(2,'0')}:00 hs</strong>`
    : 'Sin ingresos aún hoy';

  // ── Gráfico de barras profesional (Adaptable al mes seleccionado) ──
  const diasEnMes = new Date(anioActual, mesActual + 1, 0).getDate();
  const entriesByDay = {};
  allFechas.forEach(f => {
    const d = new Date(f);
    if (d.getMonth() === mesActual && d.getFullYear() === anioActual) {
      const k = d.getDate();
      entriesByDay[k] = (entriesByDay[k] || 0) + 1;
    }
  });
  
  const barVals = Array.from({ length: diasEnMes }, (_, i) => entriesByDay[i + 1] || 0);
  const maxRegistrado = Math.max(...barVals, 0);
  const MAX_Y = maxRegistrado > 50 ? Math.ceil(maxRegistrado / 10) * 10 : 50;
  
  const Y_STEPS = [];
  for (let v = 0; v <= MAX_Y; v += 10) Y_STEPS.push(v);
  
  const chart = document.getElementById('bar-chart');
  
  // INYECCIÓN DE LOS BOTONES DE NAVEGACIÓN
  if (chart && chart.previousElementSibling) {
    const btnStyle = "background:var(--bg3);border:1px solid var(--border2);border-radius:4px;color:var(--text2);cursor:pointer;padding:2px 10px;font-size:10px;transition:all 0.15s;";
    const disabledStyle = "opacity:0.3;cursor:not-allowed;";
    const anioTag = anioActual !== TODAY.getFullYear() ? ` ${anioActual}` : '';
    
    chart.previousElementSibling.innerHTML = `
      <div style="display:flex; align-items:center;">
        Ingresos — ${meses[mesActual]}${anioTag}
        <div style="display:flex; gap:6px; margin-left:14px;">
          <button onclick="changeDashMonth(-1)" style="${btnStyle}" onmouseover="this.style.color='var(--text)'" onmouseout="this.style.color='var(--text2)'">◀</button>
          <button onclick="changeDashMonth(1)" style="${btnStyle} ${isCurrentMonth ? disabledStyle : ''}" 
            ${isCurrentMonth ? 'disabled' : `onmouseover="this.style.color='var(--text)'" onmouseout="this.style.color='var(--text2)'"`}>▶</button>
        </div>
      </div>
      <span>cantidad de entradas</span>
    `;
  }
  
  if (chart) {
    chart.className = 'chart-pro';
    chart.innerHTML = '';
    
    // Eje Y
    const yAxis = document.createElement('div');
    yAxis.className = 'chart-pro-yaxis';
    Y_STEPS.forEach(v => {
      const lbl = document.createElement('div');
      lbl.className = 'chart-pro-ylabel';
      lbl.textContent = v;
      yAxis.appendChild(lbl);
    });
    
    // Área central
    const body = document.createElement('div');
    body.className = 'chart-pro-body';
    const barsArea = document.createElement('div');
    barsArea.className = 'chart-pro-bars-area';
    
    // Líneas de referencia de la grilla
    Y_STEPS.forEach(v => {
      const line = document.createElement('div');
      line.className = 'chart-pro-gridline';
      line.style.bottom = `${(v / MAX_Y) * 100}%`;
      barsArea.appendChild(line);
    });
    
    // Generar Barras
    barVals.forEach((v, i) => {
      const dia     = i + 1;
      const isToday = isCurrentMonth && (dia === TODAY.getDate());
      const pct     = Math.min((v / MAX_Y) * 100, 100);
      const col = document.createElement('div');
      col.className = 'chart-pro-bar-col';
      const bar = document.createElement('div');
      bar.className = 'chart-pro-bar';
      bar.style.cssText =
        `height:${pct}%;` +
        `background:${isToday
          ? 'var(--accent)'
          : v > 0
            ? 'rgba(230,48,48,0.4)'
            : 'var(--bg4)'};`;
      bar.title = `${dia}/${mesActual + 1}: ${v} ingreso${v !== 1 ? 's' : ''}`;
      col.appendChild(bar);
      barsArea.appendChild(col);
    });
    
    // Eje X
    const xAxis = document.createElement('div');
    xAxis.className = 'chart-pro-xaxis';
    barVals.forEach((_, i) => {
      const dia     = i + 1;
      const isToday = isCurrentMonth && (dia === TODAY.getDate());
      const mostrar = dia === 1 || dia % 5 === 0 || isToday;
      const lbl = document.createElement('div');
      lbl.className = 'chart-pro-xlabel' + (isToday ? ' today' : '');
      lbl.textContent = mostrar ? dia : '';
      xAxis.appendChild(lbl);
    });
    
    body.appendChild(barsArea);
    body.appendChild(xAxis);
    chart.appendChild(yAxis);
    chart.appendChild(body);
  }

  // ── Horas pico (Mes Seleccionado) ──
  const horasData = [
    { h: '08 hs', range: [8, 10] },
    { h: '10 hs', range: [10, 12] },
    { h: '12 hs', range: [12, 13] },
    { h: '13 hs', range: [13, 14] },
    { h: '14 hs', range: [14, 15] },
    { h: '15 hs', range: [15, 16] },
    { h: '16 hs', range: [16, 17] },
    { h: '17 hs', range: [17, 18] },
    { h: '18 hs', range: [18, 19] },
    { h: '19 hs', range: [19, 20] },
    { h: '20 hs', range: [20, 21] },
    { h: '21 hs', range: [21, 24] }
  ];
  
  const franjaCount = horasData.map(f =>
    allFechas.filter(fecha => {
      const d = new Date(fecha);
      if (d.getMonth() !== mesActual || d.getFullYear() !== anioActual) return false;
      const h = d.getHours();
      return h >= f.range[0] && h < f.range[1];
    }).length
  );
  
  const maxFranja = Math.max(...franjaCount, 1);
  const horasEl = document.getElementById('horas-chart');
  if (horasEl) {
    horasEl.innerHTML = horasData.map((f, i) => `
      <div class="hora-row" style="margin-bottom: 4px;"> 
        <div class="hora-label" style="font-size: 11px;">${f.h}</div>
        <div class="hora-wrap" style="height: 6px;">
          <div class="hora-bar" style="width:${(franjaCount[i]/maxFranja)*100}%;
            background:${franjaCount[i]===maxFranja && franjaCount[i]>0 ? 'var(--accent)' : 'var(--bg4)'}"></div>
        </div>
        <div class="hora-cnt" style="font-size: 11px; width: 25px;">${franjaCount[i]}</div>
      </div>`).join('');
    const tit = document.getElementById('horas-title');
    if (tit) tit.textContent = isCurrentMonth ? 'este mes' : `en ${meses[mesActual]}`;
  }

  // ── Últimas inscripciones ──
  const pagosEl = document.getElementById('pagos-list');
  if (pagosEl) {
    pagosEl.innerHTML = inscRecientes.slice(0, 5).map(p => `
      <div class="payment-row">
        <div><div class="pname">${p.nombre}</div><div class="pdate">${p.fecha}</div></div>
        <div style="text-align:right">
          <div class="pamount">${p.importe}</div>
          <div class="pplan">${p.plan}</div>
        </div>
      </div>`).join('')
      || '<div style="color:var(--text3);font-size:13px;padding:12px 0">Sin inscripciones registradas</div>';
  }

  // ── Distribución de planes ──
  const planColors = {
    'Mensual 2x':'var(--accent)', 'Mensual 3x':'#3b82f6', 'Mensual Libre': 'var(--green)',
    'Semanal 5d': '#a78bfa', 'Semanal 3d': 'var(--yellow)', 'Semanal 2d': '#fb923c',
    'Pase Diario': '#ec4899'
  };
  const planCount = {};
  activos.forEach(c => { planCount[c.plan] = (planCount[c.plan] || 0) + 1; });
  const planEntries = Object.entries(planCount).sort((a, b) => b[1] - a[1]);
  const maxPlan = Math.max(...planEntries.map(e => e[1]), 1);
  const totEl = document.getElementById('planes-total');
  if (totEl) totEl.textContent = activos.length + ' activos';
  const planesEl = document.getElementById('planes-list');
  if (planesEl) {
    planesEl.innerHTML = planEntries.length
      ? planEntries.map(([nm, cnt]) => `
          <div class="plan-row">
            <div class="plan-nm">${nm}</div>
            <div class="plan-bar-w">
              <div class="plan-bar" style="width:${(cnt/maxPlan)*100}%;background:${planColors[nm]||'var(--accent)'}"></div>
            </div>
            <div class="plan-cnt">${cnt}</div>
          </div>`).join('')
      : '<div style="color:var(--text3);font-size:13px;padding:8px 0">Sin datos</div>';
  }

  // ── Vencimientos próximos ──
  const venc7 = activos.map(c => {
    const [d, m, y] = (c.vence || '').split('/');
    if (!y) return null;
    const diff = Math.round((new Date(y, m - 1, d) - hoySinHora) / 86400000);
    return { ...c, diff };
  }).filter(c => c && c.diff >= 0 && c.diff <= 7).sort((a, b) => a.diff - b.diff);

  const vencEl = document.getElementById('vencimientos-body');
  if (vencEl) {
    vencEl.innerHTML = venc7.length
      ? venc7.map(c => `<tr>
          <td><strong style="cursor:pointer;color:var(--text)"
            onclick="openProfile('${c.id}')">${c.nombre}</strong></td>
          <td style="color:var(--text2)">${c.plan}</td>
          <td style="color:var(--yellow)">${c.vence}</td>
          <td><span class="pill pill-y">${
            c.diff === 0 ? 'Hoy' : c.diff === 1 ? 'Mañana' : 'En ' + c.diff + ' días'
          }</span></td>
        </tr>`).join('')
      : '<tr><td colspan="4" style="color:var(--text3);font-size:13px;padding:12px 0">Sin vencimientos en los próximos 7 días</td></tr>';
  }
}

function animCounter(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = parseInt(el.textContent) || 0;
  if (start === target) { el.textContent = target; return; }
  const step = Math.ceil(Math.abs(target - start) / 12);
  let cur = start;
  const t = setInterval(() => {
    cur = cur < target ? Math.min(cur + step, target) : Math.max(cur - step, target);
    el.textContent = cur;
    if (cur === target) clearInterval(t);
  }, 40);
}