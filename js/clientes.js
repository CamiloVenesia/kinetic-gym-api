// ═══════════════════════════════════════════
//  clientes.js — Tabla de clientes
//  Conectado al backend real
//  NOTA: API_URL viene de data.js
// ═══════════════════════════════════════════

// Función auxiliar para evitar el desfase de zona horaria al formatear fechas ISO
function formatearFechaLocal(fechaISO) {
  if (!fechaISO) return '—';
  const fecha = new Date(fechaISO);
  // Le sumamos el offset local para que caiga en el día correcto
  fecha.setMinutes(fecha.getMinutes() + fecha.getTimezoneOffset());
  return fecha.toLocaleDateString('es-AR');
}

async function cargarClientes() {
  try {
    const respuesta = await fetch(`${API_URL}/clientes`);
    const datos     = await respuesta.json();

    clientes.length = 0;
    datos.forEach(c => {
      clientes.push({
        id:       c._id,
        dni:      c.dni,
        nombre:   c.nombre,
        plan:     c.plan,
        // Usamos la función auxiliar para arreglar el día menos
        vence:    formatearFechaLocal(c.fechaVencimiento),
        activo:   c.activo,
        tel:      c.telefono || '—',
        desde:    formatearFechaLocal(c.fechaInicio),
        ingresos: c.ingresos || []
      });
    });

    renderClientsTable();
    refreshDashboard();

  } catch (error) {
    console.error('Error al cargar clientes:', error);
    showToast('No se pudo cargar la lista de clientes', true);
  }
}

function renderClientsTable(filter = '') {
  const fl   = filter.toLowerCase();
  const data = clientes.filter(c =>
    !fl || c.nombre.toLowerCase().includes(fl) || c.dni.includes(fl)
  );

  document.getElementById('clients-body').innerHTML = data.length
    ? data.map(c => {
        // Normalizamos "hoy" a las 00:00:00 para cálculos precisos
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        let vDate = null;
        let diffDays = 999; // Valor por defecto alto

        if (c.vence && c.vence !== '—' && c.vence.includes('/')) {
           const [d, m, y] = c.vence.split('/');
           // ACÁ ESTABA EL ERROR: Agregamos los ceros para que no de Invalid Date
           vDate = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T00:00:00`);
           diffDays = Math.round((vDate - hoy) / (1000 * 60 * 60 * 24));
        }

        let pillClass = 'pill-g', pillLabel = 'Activo';

        // Corrección de la lógica de estados
        if (!c.activo || diffDays < 0) { 
           pillClass = 'pill-r'; 
           pillLabel = 'Vencida';       
        } else if (diffDays >= 0 && diffDays <= 5) { 
           pillClass = 'pill-y'; 
           pillLabel = 'Vence pronto'; 
        }

        // Para que el color de la fecha coincida con la pastilla
        let dateColor = 'var(--green)';
        if (pillClass === 'pill-r') dateColor = 'var(--red)';
        if (pillClass === 'pill-y') dateColor = 'var(--yellow)';

        return `<tr>
          <td>
            <strong
              style="cursor:pointer;color:var(--text);border-bottom:1px solid var(--border2);transition:color .15s"
              onmouseover="this.style.color='var(--accent)'"
              onmouseout="this.style.color='var(--text)'"
              onclick="openProfile('${c.id}')"
            >${c.nombre}</strong>
          </td>
          <td style="font-family:var(--font-d);font-size:14px;font-weight:600;letter-spacing:1px">${c.dni}</td>
          <td style="color:var(--text2)">${c.plan}</td>
          <td><span class="pill ${pillClass}">${pillLabel}</span></td>
          <td style="color:${dateColor}">${c.vence}</td>
          <td style="color:var(--text3)">${c.tel}</td>
          <td>
            <div style="display:flex;gap:5px">
              <button class="btn-icon" style="color:var(--green);border-color:var(--green)" onclick="openRenovar('${c.id}')">💵 Renovar</button>
              <button class="btn-icon edit" onclick="openEditClient('${c.id}')">✏ Editar</button>
              <button class="btn-icon del"  onclick="openDelete('${c.id}','client','${c.nombre}')">✕</button>
            </div>
          </td>
        </tr>`;
      }).join('')
    : `<tr><td colspan="7" style="color:var(--text3);padding:20px;text-align:center">
        ${filter ? 'No se encontraron resultados' : 'No hay clientes registrados'}
       </td></tr>`;
}

function filterClients() {
  renderClientsTable(document.getElementById('client-search').value);
}