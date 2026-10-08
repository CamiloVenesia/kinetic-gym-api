// ═══════════════════════════════════════════
//  inscripcion.js — Formulario de inscripción
//  API_URL y apiFetch vienen de data.js
// ═══════════════════════════════════════════


function escapeInscripcionHTML(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}


// ─────────────────────────────────────────
// Render de inscripciones recientes
// ─────────────────────────────────────────

function renderInscRecientes() {
  const usuarioSesion = obtenerUsuarioSesion();

  const esDemo =
    usuarioSesion &&
    usuarioSesion.rol === 'demo';


  document.getElementById('ins-list').innerHTML =
    inscRecientes
      .slice(0, 8)
      .map(i => {

        const nombreSeguro =
          escapeInscripcionHTML(
            i.nombre
          );

        const dniSeguro =
          escapeInscripcionHTML(
            i.dni
          );

        const planSeguro =
          escapeInscripcionHTML(
            i.plan
          );

        const importeSeguro =
          escapeInscripcionHTML(
            i.importe
          );

        const fechaSegura =
          escapeInscripcionHTML(
            i.fecha
          );


        const acciones = esDemo
          ? `
            <div class="ins-actions">

              <button
                class="btn-icon edit"
                disabled
                title="Acción deshabilitada en modo demo"
                style="
                  cursor:not-allowed;
                  opacity:.55
                "
              >
                ✏
              </button>

              <button
                class="btn-icon del"
                disabled
                title="Acción deshabilitada en modo demo"
                style="
                  cursor:not-allowed;
                  opacity:.55
                "
              >
                ✕
              </button>

            </div>
          `
          : `
            <div class="ins-actions">

              <button
                class="btn-icon edit"
                onclick="openEditIns('${i.id}')"
              >
                ✏
              </button>

              <button
                class="btn-icon del"
                onclick="openDelete(
                  '${i.id}',
                  'ins',
                  '${nombreSeguro}'
                )"
              >
                ✕
              </button>

            </div>
          `;


        const iniciales =
          nombreSeguro
            .split(' ')
            .map(n => n[0])
            .slice(0, 2)
            .join('');


        return `
          <div class="ins-row">

            <div class="ins-avatar">
              ${iniciales}
            </div>

            <div
              style="
                flex:1;
                min-width:0
              "
            >

              <div class="ins-name">
                ${nombreSeguro}
              </div>

              <div class="ins-sub">
                DNI ${dniSeguro}
              </div>

            </div>

            <div class="ins-right">

              <div class="ins-plan">
                ${planSeguro}
              </div>

              <div class="ins-amount">
                ${importeSeguro}
              </div>

              <div class="ins-date">
                ${fechaSegura}
              </div>

            </div>

            ${acciones}

          </div>
        `;

      })
      .join('');
}


// ─────────────────────────────────────────
// Inscribir cliente
// ─────────────────────────────────────────

async function inscribirCliente() {
  const usuarioSesion =
    obtenerUsuarioSesion();


  if (
    usuarioSesion &&
    usuarioSesion.rol === 'demo'
  ) {
    showToast(
      'Esta acción está deshabilitada en modo demo',
      true
    );

    return;
  }


  const nombre =
    document
      .getElementById('f-nombre')
      .value
      .trim();


  const apellido =
    document
      .getElementById('f-apellido')
      .value
      .trim();


  const dni =
    document
      .getElementById('f-dni')
      .value
      .trim();


  const tel =
    document
      .getElementById('f-tel')
      .value
      .trim();


  const planRaw =
    document
      .getElementById('f-plan')
      .value;


  const fecha =
    document
      .getElementById('f-fecha')
      .value;


  const elMetodo =
    document
      .getElementById('f-metodo');


  const metodoPago =
    elMetodo
      ? elMetodo.value
      : 'Efectivo';


  if (
    !nombre ||
    !apellido
  ) {
    showToast(
      'Ingresá nombre y apellido',
      true
    );

    return;
  }


  if (
    !/^\d{7,8}$/.test(dni)
  ) {
    showToast(
      'DNI inválido',
      true
    );

    return;
  }


  if (!planRaw) {
    showToast(
      'Seleccioná un plan',
      true
    );

    return;
  }


  if (!fecha) {
    showToast(
      'Seleccioná una fecha de inicio',
      true
    );

    return;
  }


  const [plan, precio] =
    planRaw.split('|');


  const nombreCompleto =
    `${nombre} ${apellido}`;


  const payload = {
    nombre: nombreCompleto,
    dni,
    telefono: tel || '—',
    plan,
    metodoPago,
    fechaInicio: fecha
  };


  try {
    const respuesta =
      await apiFetch(
        `${API_URL}/clientes`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body:
            JSON.stringify(
              payload
            )
        }
      );


    const resultado =
      await respuesta.json();


    if (respuesta.ok) {

      const imp =
        '$' +
        parseInt(
          precio,
          10
        ).toLocaleString(
          'es-AR'
        );


      inscRecientes.unshift({
        id:
          resultado._id,

        nombre:
          nombreCompleto,

        plan,

        importe:
          imp,

        fecha:
          new Date()
            .toLocaleDateString(
              'es-AR'
            ),

        dni
      });


      clientes.unshift({
        id:
          resultado._id,

        dni,

        nombre:
          nombreCompleto,

        plan,

        vence:
          calcVence(
            fecha,
            plan
          ),

        activo:
          true,

        tel:
          tel || '—',

        desde:
          fecha
            .split('-')
            .reverse()
            .join('/'),

        ingresos:
          []
      });


      renderInscRecientes();

      renderClientsTable();

      refreshDashboard();


      document
        .getElementById('f-nombre')
        .value = '';


      document
        .getElementById('f-apellido')
        .value = '';


      document
        .getElementById('f-dni')
        .value = '';


      document
        .getElementById('f-tel')
        .value = '';


      showToast(
        `✓ ${nombreCompleto} inscripto y guardado`
      );


    } else {

      showToast(
        resultado.mensaje ||
        'No se pudo inscribir el cliente',
        true
      );

    }


  } catch (error) {

    console.error(
      'Error al inscribir cliente:',
      error
    );


    showToast(
      'Error al conectar con la base de datos',
      true
    );

  }
}


// ─────────────────────────────────────────
// Calcular vencimiento visual
// ─────────────────────────────────────────

function calcVence(
  fechaStr,
  plan
) {

  const d =
    new Date(
      fechaStr +
      'T12:00:00'
    );


  if (
    plan.startsWith(
      'Mensual'
    )
  ) {

    const dia =
      d.getDate();


    d.setMonth(
      d.getMonth() + 1
    );


    if (
      d.getDate() !== dia
    ) {
      d.setDate(0);
    }


  } else if (
    plan.startsWith(
      'Semanal'
    )
  ) {

    d.setDate(
      d.getDate() + 7
    );


  } else if (
    plan ===
    'Pase Diario'
  ) {

    d.setDate(
      d.getDate() + 1
    );

  }


  return d.toLocaleDateString(
    'es-AR'
  );
}


// ─────────────────────────────────────────
// Selección visual de plan
// ─────────────────────────────────────────

function selectPlan(
  el,
  val
) {

  document
    .querySelectorAll(
      '.plan-option'
    )
    .forEach(
      o =>
        o.classList.remove(
          'selected'
        )
    );


  el.classList.add(
    'selected'
  );


  document
    .getElementById(
      'f-plan'
    )
    .value =
      val;


  updatePlanPreview();
}


// ─────────────────────────────────────────
// Preview de plan
// ─────────────────────────────────────────

function updatePlanPreview() {
  const val =
    document
      .getElementById('f-plan')
      .value;


  const fecha =
    document
      .getElementById('f-fecha')
      .value;


  if (
    !val ||
    !fecha
  ) {
    return;
  }


  const [plan, precio] =
    val.split('|');


  const vence =
    calcVence(
      fecha,
      plan
    );


  const planSeguro =
    escapeInscripcionHTML(
      plan
    );


  document
    .getElementById(
      'plan-resumen'
    )
    .innerHTML =
      `Plan: <strong style="color:var(--text)">${planSeguro}</strong><br>` +
      `Importe: <strong style="color:var(--green)">$${parseInt(precio, 10).toLocaleString('es-AR')}</strong><br>` +
      `Vence: <strong style="color:var(--text)">${vence}</strong>`;


  document
    .querySelectorAll(
      '.plan-option'
    )
    .forEach(
      o => {

        const nombrePlan =
          o.querySelector(
            '.plan-option-name'
          );


        if (!nombrePlan) {
          return;
        }


        o.classList.toggle(
          'selected',
          nombrePlan.textContent === plan
        );

      }
    );
}


// ─────────────────────────────────────────
// Cargar historial de inscripciones y pagos
// ─────────────────────────────────────────

async function cargarInscRecientes() {
  try {
    const respuesta =
      await apiFetch(
        `${API_URL}/clientes`
      );


    if (!respuesta.ok) {
      throw new Error(
        `Error HTTP ${respuesta.status}`
      );
    }


    const datos =
      await respuesta.json();


    const todosLosPagos =
      [];


    datos.forEach(
      c => {

        const precioInsc =
          PLAN_PRECIOS[c.plan] ||
          0;


        const fechaOriginal =
          new Date(
            c.createdAt ||
            c.fechaInicio
          );


        todosLosPagos.push({
          id:
            c._id,

          nombre:
            c.nombre,

          plan:
            c.plan,

          importe:
            '$' +
            precioInsc
              .toLocaleString(
                'es-AR'
              ),

          fechaObj:
            fechaOriginal,

          fecha:
            fechaOriginal
              .toLocaleDateString(
                'es-AR'
              ),

          dni:
            c.dni
        });


        if (
          c.pagos &&
          c.pagos.length > 0
        ) {

          c.pagos.forEach(
            p => {

              const fechaPago =
                new Date(
                  p.fecha
                );


              todosLosPagos.push({
                id:
                  c._id +
                  '_' +
                  fechaPago
                    .getTime(),

                nombre:
                  c.nombre,

                plan:
                  p.plan,

                importe:
                  '$' +
                  (
                    p.importe ||
                    0
                  ).toLocaleString(
                    'es-AR'
                  ),

                fechaObj:
                  fechaPago,

                fecha:
                  fechaPago
                    .toLocaleDateString(
                      'es-AR'
                    ),

                dni:
                  c.dni
              });

            }
          );
        }

      }
    );


    todosLosPagos.sort(
      (a, b) =>
        b.fechaObj -
        a.fechaObj
    );


    inscRecientes.length =
      0;


    todosLosPagos.forEach(
      p => {

        inscRecientes.push({
          id:
            p.id,

          nombre:
            p.nombre,

          plan:
            p.plan,

          importe:
            p.importe,

          fecha:
            p.fecha,

          dni:
            p.dni
        });

      }
    );


    renderInscRecientes();


  } catch (error) {

    console.error(
      'Error al cargar inscripciones:',
      error
    );

  }
}