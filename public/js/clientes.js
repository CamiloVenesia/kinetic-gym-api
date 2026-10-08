// ═══════════════════════════════════════════
//  clientes.js — Tabla de clientes
//  Conectado al backend real
// ═══════════════════════════════════════════


// ─────────────────────────────────────────
// Seguridad HTML
// ─────────────────────────────────────────

function escapeClientesHTML(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}


function encodeClientesJSArg(value) {
  return encodeURIComponent(
    String(value ?? '')
  ).replaceAll("'", '%27');
}


// ─────────────────────────────────────────
// Función auxiliar para evitar desfase horario
// ─────────────────────────────────────────

function formatearFechaLocal(fechaISO) {
  if (!fechaISO) return '—';

  const fecha = new Date(fechaISO);

  fecha.setMinutes(
    fecha.getMinutes() + fecha.getTimezoneOffset()
  );

  return fecha.toLocaleDateString('es-AR');
}


// ─────────────────────────────────────────
// Cargar clientes
// ─────────────────────────────────────────

async function cargarClientes() {
  try {

    const respuesta = await apiFetch(
      `${API_URL}/clientes`
    );


    if (!respuesta.ok) {
      throw new Error(
        `Error HTTP ${respuesta.status}`
      );
    }


    const datos = await respuesta.json();


    clientes.length = 0;


    datos.forEach(c => {

      clientes.push({
        id: String(c._id || ''),

        dni: String(c.dni || ''),

        nombre: String(c.nombre || ''),

        plan: String(c.plan || ''),

        vence: formatearFechaLocal(
          c.fechaVencimiento
        ),

        activo: Boolean(c.activo),

        tel: String(c.telefono || '—'),

        desde: formatearFechaLocal(
          c.fechaInicio
        ),

        ingresos: Array.isArray(c.ingresos)
          ? c.ingresos
          : []
      });

    });


    renderClientsTable();


    if (
      typeof refreshDashboard === 'function'
    ) {
      refreshDashboard();
    }


  } catch (error) {

    console.error(
      'Error al cargar clientes:',
      error
    );


    showToast(
      'No se pudo cargar la lista de clientes',
      true
    );

  }
}


// ─────────────────────────────────────────
// Render tabla
// ─────────────────────────────────────────

function renderClientsTable(filter = '') {

  const fl = String(filter)
    .toLowerCase();


  const data = clientes.filter(c =>
    !fl ||
    c.nombre.toLowerCase().includes(fl) ||
    c.dni.includes(fl)
  );


  const usuarioSesion =
    obtenerUsuarioSesion();


  const esDemo =
    usuarioSesion &&
    usuarioSesion.rol === 'demo';


  const tbody =
    document.getElementById(
      'clients-body'
    );


  if (!tbody) return;


  tbody.innerHTML = data.length

    ? data.map(c => {

        const hoy = new Date();

        hoy.setHours(
          0,
          0,
          0,
          0
        );


        let diffDays = 999;


        if (
          c.vence &&
          c.vence !== '—' &&
          c.vence.includes('/')
        ) {

          const [d, m, y] =
            c.vence.split('/');


          const vDate = new Date(
            `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T00:00:00`
          );


          diffDays = Math.round(
            (vDate - hoy) /
            (1000 * 60 * 60 * 24)
          );

        }


        let pillClass = 'pill-g';
        let pillLabel = 'Activo';


        if (
          !c.activo ||
          diffDays < 0
        ) {

          pillClass = 'pill-r';
          pillLabel = 'Vencida';

        } else if (
          diffDays >= 0 &&
          diffDays <= 5
        ) {

          pillClass = 'pill-y';
          pillLabel = 'Vence pronto';

        }


        let dateColor = 'var(--green)';


        if (
          pillClass === 'pill-r'
        ) {
          dateColor = 'var(--red)';
        }


        if (
          pillClass === 'pill-y'
        ) {
          dateColor = 'var(--yellow)';
        }


        const idSeguro =
          encodeClientesJSArg(
            c.id
          );


        const nombreSeguro =
          escapeClientesHTML(
            c.nombre
          );


        const nombreArgSeguro =
          encodeClientesJSArg(
            c.nombre
          );


        const dniSeguro =
          escapeClientesHTML(
            c.dni
          );


        const planSeguro =
          escapeClientesHTML(
            c.plan
          );


        const venceSeguro =
          escapeClientesHTML(
            c.vence
          );


        const telSeguro =
          escapeClientesHTML(
            c.tel
          );


        const acciones = esDemo

          ? `
            <div style="display:flex;gap:5px">

              <button
                class="btn-icon"
                style="
                  color:var(--text3);
                  border-color:var(--border2);
                  cursor:not-allowed;
                  opacity:.55
                "
                title="Acción deshabilitada en modo demo"
                disabled
              >
                💵 Renovar
              </button>

              <button
                class="btn-icon edit"
                style="
                  cursor:not-allowed;
                  opacity:.55
                "
                title="Acción deshabilitada en modo demo"
                disabled
              >
                ✏ Editar
              </button>

              <button
                class="btn-icon del"
                style="
                  cursor:not-allowed;
                  opacity:.55
                "
                title="Acción deshabilitada en modo demo"
                disabled
              >
                ✕
              </button>

            </div>
          `

          : `
            <div style="display:flex;gap:5px">

              <button
                class="btn-icon"
                style="
                  color:var(--green);
                  border-color:var(--green)
                "
                onclick="
                  openRenovar(
                    decodeURIComponent('${idSeguro}')
                  )
                "
              >
                💵 Renovar
              </button>

              <button
                class="btn-icon edit"
                onclick="
                  openEditClient(
                    decodeURIComponent('${idSeguro}')
                  )
                "
              >
                ✏ Editar
              </button>

              <button
                class="btn-icon del"
                onclick="
                  openDelete(
                    decodeURIComponent('${idSeguro}'),
                    'client',
                    decodeURIComponent('${nombreArgSeguro}')
                  )
                "
              >
                ✕
              </button>

            </div>
          `;


        return `
          <tr>

            <td>

              <strong
                style="
                  cursor:pointer;
                  color:var(--text);
                  border-bottom:1px solid var(--border2);
                  transition:color .15s
                "

                onmouseover="
                  this.style.color='var(--accent)'
                "

                onmouseout="
                  this.style.color='var(--text)'
                "

                onclick="
                  openProfile(
                    decodeURIComponent('${idSeguro}')
                  )
                "
              >

                ${nombreSeguro}

              </strong>

            </td>


            <td
              style="
                font-family:var(--font-d);
                font-size:14px;
                font-weight:600;
                letter-spacing:1px
              "
            >
              ${dniSeguro}
            </td>


            <td
              style="
                color:var(--text2)
              "
            >
              ${planSeguro}
            </td>


            <td>

              <span
                class="pill ${pillClass}"
              >
                ${pillLabel}
              </span>

            </td>


            <td
              style="
                color:${dateColor}
              "
            >
              ${venceSeguro}
            </td>


            <td
              style="
                color:var(--text3)
              "
            >
              ${telSeguro}
            </td>


            <td>
              ${acciones}
            </td>

          </tr>
        `;

      }).join('')

    : `
      <tr>

        <td
          colspan="7"
          style="
            color:var(--text3);
            padding:20px;
            text-align:center
          "
        >

          ${
            filter
              ? 'No se encontraron resultados'
              : 'No hay clientes registrados'
          }

        </td>

      </tr>
    `;
}


// ─────────────────────────────────────────
// Buscar clientes
// ─────────────────────────────────────────

function filterClients() {

  renderClientsTable(
    document
      .getElementById('client-search')
      .value
  );

}