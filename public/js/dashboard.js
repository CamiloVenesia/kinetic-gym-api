// ═══════════════════════════════════════════
//  dashboard.js — Dashboard reactivo
// ═══════════════════════════════════════════


let dashMonthOffset = 0;


// ─────────────────────────────────────────
// Seguridad HTML
// ─────────────────────────────────────────

function escapeDashboardHTML(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}


function encodeDashboardJSArg(value) {
  return encodeURIComponent(
    String(value ?? '')
  ).replaceAll("'", '%27');
}


// ─────────────────────────────────────────
// Navegación temporal
// ─────────────────────────────────────────

function changeDashMonth(delta) {

  dashMonthOffset += delta;

  if (dashMonthOffset > 0) {
    dashMonthOffset = 0;
  }

  refreshDashboard();
}


function initDashboard() {
  refreshDashboard();
}


// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

function getIngFecha(i) {

  if (!i) return null;

  if (typeof i === 'string') {
    return i;
  }

  if (
    typeof i === 'object' &&
    i.fecha
  ) {
    return i.fecha;
  }

  return null;
}


function fmtMoney(n) {

  return n >= 1000
    ? '$' + (n / 1000).toFixed(0) + 'k'
    : '$' + n;
}


// ─────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────

function refreshDashboard() {

  // ───────────────────────────────────────
  // 1. Fechas relativas a navegación
  // ───────────────────────────────────────

  const targetDate = new Date(
    TODAY.getFullYear(),
    TODAY.getMonth() + dashMonthOffset,
    1
  );


  const mesActual =
    targetDate.getMonth();


  const anioActual =
    targetDate.getFullYear();


  const isCurrentMonth =
    dashMonthOffset === 0;


  const meses = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre'
  ];


  // ───────────────────────────────────────
  // 2. Activos y vencidos
  // ───────────────────────────────────────

  const activosReal = [];
  const vencidosReal = [];


  const hoySinHora = new Date(
    TODAY.getFullYear(),
    TODAY.getMonth(),
    TODAY.getDate()
  );


  clientes.forEach(c => {

    if (
      !c.vence ||
      c.vence === '—'
    ) {

      activosReal.push(c);

      return;
    }


    const partes =
      c.vence.split('/');


    if (partes.length === 3) {

      const [d, m, y] =
        partes;


      const fechaVence =
        new Date(
          y,
          m - 1,
          d
        );


      if (
        fechaVence <
        hoySinHora
      ) {

        vencidosReal.push(c);

      } else {

        activosReal.push(c);

      }

    } else {

      activosReal.push(c);

    }

  });


  const activos =
    activosReal;


  const vencidos =
    vencidosReal;


  // ───────────────────────────────────────
  // 3. Ingresos del kiosco
  // ───────────────────────────────────────

  const allFechas =
    clientes.flatMap(c =>
      (c.ingresos || [])
        .map(getIngFecha)
        .filter(Boolean)
    );


  const ingresosHoy =
    allFechas.filter(
      f =>
        typeof f === 'string' &&
        f.startsWith(TODAY_STR)
    ).length;


  // ───────────────────────────────────────
  // 4. Recaudación
  // ───────────────────────────────────────

  const pagosMes =
    inscRecientes.filter(i => {

      if (
        !i.fecha ||
        i.fecha === 'Ahora'
      ) {
        return isCurrentMonth;
      }


      const partes =
        String(i.fecha)
          .split('/');


      if (
        partes.length < 3
      ) {
        return false;
      }


      const [d, m, y] =
        partes;


      const fd =
        new Date(
          `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
        );


      return (
        fd.getMonth() ===
          mesActual &&
        fd.getFullYear() ===
          anioActual
      );

    });


  const recaudado =
    pagosMes.reduce(
      (sum, i) =>
        sum +
        parseInt(
          String(
            i.importe || '0'
          ).replace(
            /[^0-9]/g,
            ''
          ),
          10
        ),
      0
    );


  // ───────────────────────────────────────
  // 5. Vencimientos próximos
  // ───────────────────────────────────────

  const pronto =
    activos.filter(c => {

      const [d, m, y] =
        String(
          c.vence || ''
        ).split('/');


      if (!y) {
        return false;
      }


      const diff =
        Math.round(
          (
            new Date(
              y,
              m - 1,
              d
            ) -
            hoySinHora
          ) /
          86400000
        );


      return (
        diff >= 0 &&
        diff <= 7
      );

    });


  // ───────────────────────────────────────
  // Tarjetas principales
  // ───────────────────────────────────────

  animCounter(
    'db-activos',
    activos.length
  );


  const activosSub =
    document.getElementById(
      'db-activos-sub'
    );


  if (activosSub) {

    activosSub.innerHTML =
      `<span class="up">${pronto.length} vencen esta semana</span>`;

  }


  const lblIngresos =
    document.querySelector(
      '.metric-card.g .metric-label'
    );


  if (lblIngresos) {

    lblIngresos.textContent =
      isCurrentMonth
        ? 'Recaudado este mes'
        : `Recaudado en ${meses[mesActual]}`;

  }


  const ingresosEl =
    document.getElementById(
      'db-ingresos'
    );


  if (ingresosEl) {

    ingresosEl.textContent =
      fmtMoney(recaudado);

  }


  const ingresosSub =
    document.getElementById(
      'db-ingresos-sub'
    );


  if (ingresosSub) {

    ingresosSub.innerHTML =
      isCurrentMonth

        ? `
          <span
            style="
              cursor:pointer;
              text-decoration:underline;
              color:var(--text2)
            "
            onclick="openPagosDrawer()"
          >
            Ver ${pagosMes.length} pagos del mes →
          </span>
        `

        : `
          <span
            style="
              color:var(--text3)
            "
          >
            ${pagosMes.length} pagos registrados
          </span>
        `;

  }


  animCounter(
    'db-vencidas',
    vencidos.length
  );


  const pctVencidos =
    clientes.length
      ? Math.round(
          (
            vencidos.length /
            clientes.length
          ) * 100
        )
      : 0;


  const vencidasSub =
    document.getElementById(
      'db-vencidas-sub'
    );


  if (vencidasSub) {

    vencidasSub.textContent =
      `${pctVencidos}% del total`;

  }


  // ───────────────────────────────────────
  // Pico de asistencia de hoy
  // ───────────────────────────────────────

  const hourCountsToday =
    Array(24).fill(0);


  allFechas
    .filter(
      f =>
        typeof f === 'string' &&
        f.startsWith(TODAY_STR)
    )
    .forEach(f => {

      const h =
        new Date(f)
          .getHours();


      if (!isNaN(h)) {

        hourCountsToday[h]++;

      }

    });


  const maxHoy =
    Math.max(
      ...hourCountsToday
    );


  const picHourHoy =
    hourCountsToday.indexOf(
      maxHoy
    );


  animCounter(
    'db-hoy',
    ingresosHoy
  );


  const hoySub =
    document.getElementById(
      'db-hoy-sub'
    );


  if (hoySub) {

    if (
      ingresosHoy > 0
    ) {

      const horaInicio =
        String(
          picHourHoy
        ).padStart(
          2,
          '0'
        );


      const horaFin =
        String(
          picHourHoy + 1
        ).padStart(
          2,
          '0'
        );


      hoySub.innerHTML =
        `Pico: <strong>${horaInicio}:00–${horaFin}:00 hs</strong>`;

    } else {

      hoySub.textContent =
        'Sin ingresos aún hoy';

    }

  }


  // ───────────────────────────────────────
  // Gráfico de ingresos por día
  // ───────────────────────────────────────

  const diasEnMes =
    new Date(
      anioActual,
      mesActual + 1,
      0
    ).getDate();


  const entriesByDay = {};


  allFechas.forEach(f => {

    const d =
      new Date(f);


    if (
      d.getMonth() ===
        mesActual &&
      d.getFullYear() ===
        anioActual
    ) {

      const k =
        d.getDate();


      entriesByDay[k] =
        (
          entriesByDay[k] ||
          0
        ) + 1;

    }

  });


  const barVals =
    Array.from(
      {
        length:
          diasEnMes
      },
      (_, i) =>
        entriesByDay[i + 1] ||
        0
    );


  const maxRegistrado =
    Math.max(
      ...barVals,
      0
    );


  const MAX_Y =
    maxRegistrado > 50
      ? Math.ceil(
          maxRegistrado / 10
        ) * 10
      : 50;


  const Y_STEPS = [];


  for (
    let v = 0;
    v <= MAX_Y;
    v += 10
  ) {

    Y_STEPS.push(v);

  }


  const chart =
    document.getElementById(
      'bar-chart'
    );


  // ───────────────────────────────────────
  // Navegación del gráfico
  // ───────────────────────────────────────

  if (
    chart &&
    chart.previousElementSibling
  ) {

    const btnStyle =
      'background:var(--bg3);border:1px solid var(--border2);border-radius:4px;color:var(--text2);cursor:pointer;padding:2px 10px;font-size:10px;transition:all 0.15s;';


    const disabledStyle =
      'opacity:0.3;cursor:not-allowed;';


    const anioTag =
      anioActual !==
      TODAY.getFullYear()
        ? ` ${anioActual}`
        : '';


    chart.previousElementSibling.innerHTML = `
      <div
        style="
          display:flex;
          align-items:center;
        "
      >

        Ingresos — ${meses[mesActual]}${anioTag}

        <div
          style="
            display:flex;
            gap:6px;
            margin-left:14px;
          "
        >

          <button
            onclick="changeDashMonth(-1)"
            style="${btnStyle}"
            onmouseover="
              this.style.color='var(--text)'
            "
            onmouseout="
              this.style.color='var(--text2)'
            "
          >
            ◀
          </button>

          <button
            onclick="changeDashMonth(1)"
            style="
              ${btnStyle}
              ${
                isCurrentMonth
                  ? disabledStyle
                  : ''
              }
            "
            ${
              isCurrentMonth
                ? 'disabled'
                : `
                  onmouseover="
                    this.style.color='var(--text)'
                  "
                  onmouseout="
                    this.style.color='var(--text2)'
                  "
                `
            }
          >
            ▶
          </button>

        </div>

      </div>

      <span>
        cantidad de entradas
      </span>
    `;

  }


  // ───────────────────────────────────────
  // Dibujar gráfico
  // ───────────────────────────────────────

  if (chart) {

    chart.className =
      'chart-pro';


    chart.innerHTML = '';


    const yAxis =
      document.createElement(
        'div'
      );


    yAxis.className =
      'chart-pro-yaxis';


    Y_STEPS.forEach(v => {

      const lbl =
        document.createElement(
          'div'
        );


      lbl.className =
        'chart-pro-ylabel';


      lbl.textContent =
        v;


      yAxis.appendChild(
        lbl
      );

    });


    const body =
      document.createElement(
        'div'
      );


    body.className =
      'chart-pro-body';


    const barsArea =
      document.createElement(
        'div'
      );


    barsArea.className =
      'chart-pro-bars-area';


    Y_STEPS.forEach(v => {

      const line =
        document.createElement(
          'div'
        );


      line.className =
        'chart-pro-gridline';


      line.style.bottom =
        `${(v / MAX_Y) * 100}%`;


      barsArea.appendChild(
        line
      );

    });


    barVals.forEach(
      (v, i) => {

        const dia =
          i + 1;


        const isToday =
          isCurrentMonth &&
          dia ===
            TODAY.getDate();


        const pct =
          Math.min(
            (
              v /
              MAX_Y
            ) * 100,
            100
          );


        const col =
          document.createElement(
            'div'
          );


        col.className =
          'chart-pro-bar-col';


        const bar =
          document.createElement(
            'div'
          );


        bar.className =
          'chart-pro-bar';


        bar.style.height =
          `${pct}%`;


        bar.style.background =
          isToday
            ? 'var(--accent)'
            : v > 0
              ? 'rgba(230,48,48,0.4)'
              : 'var(--bg4)';


        bar.title =
          `${dia}/${mesActual + 1}: ${v} ingreso${v !== 1 ? 's' : ''}`;


        col.appendChild(
          bar
        );


        barsArea.appendChild(
          col
        );

      }
    );


    const xAxis =
      document.createElement(
        'div'
      );


    xAxis.className =
      'chart-pro-xaxis';


    barVals.forEach(
      (_, i) => {

        const dia =
          i + 1;


        const isToday =
          isCurrentMonth &&
          dia ===
            TODAY.getDate();


        const mostrar =
          dia === 1 ||
          dia % 5 === 0 ||
          isToday;


        const lbl =
          document.createElement(
            'div'
          );


        lbl.className =
          'chart-pro-xlabel' +
          (
            isToday
              ? ' today'
              : ''
          );


        lbl.textContent =
          mostrar
            ? dia
            : '';


        xAxis.appendChild(
          lbl
        );

      }
    );


    body.appendChild(
      barsArea
    );


    body.appendChild(
      xAxis
    );


    chart.appendChild(
      yAxis
    );


    chart.appendChild(
      body
    );

  }


  // ───────────────────────────────────────
  // Horas pico
  // ───────────────────────────────────────

  const horasData = [

    {
      h: '08 hs',
      range: [8, 10]
    },

    {
      h: '10 hs',
      range: [10, 12]
    },

    {
      h: '12 hs',
      range: [12, 13]
    },

    {
      h: '13 hs',
      range: [13, 14]
    },

    {
      h: '14 hs',
      range: [14, 15]
    },

    {
      h: '15 hs',
      range: [15, 16]
    },

    {
      h: '16 hs',
      range: [16, 17]
    },

    {
      h: '17 hs',
      range: [17, 18]
    },

    {
      h: '18 hs',
      range: [18, 19]
    },

    {
      h: '19 hs',
      range: [19, 20]
    },

    {
      h: '20 hs',
      range: [20, 21]
    },

    {
      h: '21 hs',
      range: [21, 24]
    }

  ];


  const franjaCount =
    horasData.map(f =>

      allFechas.filter(
        fecha => {

          const d =
            new Date(fecha);


          if (
            d.getMonth() !==
              mesActual ||
            d.getFullYear() !==
              anioActual
          ) {

            return false;

          }


          const h =
            d.getHours();


          return (
            h >=
              f.range[0] &&
            h <
              f.range[1]
          );

        }
      ).length

    );


  const maxFranja =
    Math.max(
      ...franjaCount,
      1
    );


  const horasEl =
    document.getElementById(
      'horas-chart'
    );


  if (horasEl) {

    horasEl.innerHTML =
      horasData.map(
        (f, i) => {

          const ancho =
            (
              franjaCount[i] /
              maxFranja
            ) * 100;


          const color =
            franjaCount[i] ===
              maxFranja &&
            franjaCount[i] > 0
              ? 'var(--accent)'
              : 'var(--bg4)';


          return `
            <div
              class="hora-row"
              style="
                margin-bottom:4px;
              "
            >

              <div
                class="hora-label"
                style="
                  font-size:11px;
                "
              >
                ${f.h}
              </div>

              <div
                class="hora-wrap"
                style="
                  height:6px;
                "
              >

                <div
                  class="hora-bar"
                  style="
                    width:${ancho}%;
                    background:${color};
                  "
                ></div>

              </div>

              <div
                class="hora-cnt"
                style="
                  font-size:11px;
                  width:25px;
                "
              >
                ${franjaCount[i]}
              </div>

            </div>
          `;

        }
      ).join('');


    const tit =
      document.getElementById(
        'horas-title'
      );


    if (tit) {

      tit.textContent =
        isCurrentMonth
          ? 'este mes'
          : `en ${meses[mesActual]}`;

    }

  }


  // ───────────────────────────────────────
  // Últimas inscripciones
  // ───────────────────────────────────────

  const pagosEl =
    document.getElementById(
      'pagos-list'
    );


  if (pagosEl) {

    pagosEl.innerHTML =
      inscRecientes
        .slice(
          0,
          5
        )
        .map(p => {

          const nombre =
            escapeDashboardHTML(
              p.nombre
            );


          const fecha =
            escapeDashboardHTML(
              p.fecha
            );


          const importe =
            escapeDashboardHTML(
              p.importe
            );


          const plan =
            escapeDashboardHTML(
              p.plan
            );


          return `
            <div class="payment-row">

              <div>

                <div class="pname">
                  ${nombre}
                </div>

                <div class="pdate">
                  ${fecha}
                </div>

              </div>

              <div
                style="
                  text-align:right
                "
              >

                <div class="pamount">
                  ${importe}
                </div>

                <div class="pplan">
                  ${plan}
                </div>

              </div>

            </div>
          `;

        })
        .join('')

      ||

      `
        <div
          style="
            color:var(--text3);
            font-size:13px;
            padding:12px 0;
          "
        >
          Sin inscripciones registradas
        </div>
      `;

  }


  // ───────────────────────────────────────
  // Distribución de planes
  // ───────────────────────────────────────

  const planColors = {

    'Mensual 2x':
      'var(--accent)',

    'Mensual 3x':
      '#3b82f6',

    'Mensual Libre':
      'var(--green)',

    'Semanal 5d':
      '#a78bfa',

    'Semanal 3d':
      'var(--yellow)',

    'Semanal 2d':
      '#fb923c',

    'Pase Diario':
      '#ec4899'

  };


  const planCount = {};


  activos.forEach(c => {

    const plan =
      String(
        c.plan || ''
      );


    planCount[plan] =
      (
        planCount[plan] ||
        0
      ) + 1;

  });


  const planEntries =
    Object.entries(
      planCount
    ).sort(
      (a, b) =>
        b[1] - a[1]
    );


  const maxPlan =
    Math.max(
      ...planEntries.map(
        e => e[1]
      ),
      1
    );


  const totEl =
    document.getElementById(
      'planes-total'
    );


  if (totEl) {

    totEl.textContent =
      activos.length +
      ' activos';

  }


  const planesEl =
    document.getElementById(
      'planes-list'
    );


  if (planesEl) {

    planesEl.innerHTML =
      planEntries.length

        ? planEntries.map(
            ([nm, cnt]) => {

              const nombrePlan =
                escapeDashboardHTML(
                  nm
                );


              const ancho =
                (
                  cnt /
                  maxPlan
                ) * 100;


              const color =
                planColors[nm] ||
                'var(--accent)';


              return `
                <div class="plan-row">

                  <div class="plan-nm">
                    ${nombrePlan}
                  </div>

                  <div class="plan-bar-w">

                    <div
                      class="plan-bar"
                      style="
                        width:${ancho}%;
                        background:${color};
                      "
                    ></div>

                  </div>

                  <div class="plan-cnt">
                    ${cnt}
                  </div>

                </div>
              `;

            }
          ).join('')

        : `
          <div
            style="
              color:var(--text3);
              font-size:13px;
              padding:8px 0;
            "
          >
            Sin datos
          </div>
        `;

  }


  // ───────────────────────────────────────
  // Vencimientos próximos
  // ───────────────────────────────────────

  const venc7 =
    activos
      .map(c => {

        const [d, m, y] =
          String(
            c.vence || ''
          ).split('/');


        if (!y) {
          return null;
        }


        const diff =
          Math.round(
            (
              new Date(
                y,
                m - 1,
                d
              ) -
              hoySinHora
            ) /
            86400000
          );


        return {
          ...c,
          diff
        };

      })
      .filter(
        c =>
          c &&
          c.diff >= 0 &&
          c.diff <= 7
      )
      .sort(
        (a, b) =>
          a.diff -
          b.diff
      );


  const vencEl =
    document.getElementById(
      'vencimientos-body'
    );


  if (vencEl) {

    vencEl.innerHTML =
      venc7.length

        ? venc7.map(c => {

            const idSeguro =
              encodeDashboardJSArg(
                c.id
              );


            const nombreSeguro =
              escapeDashboardHTML(
                c.nombre
              );


            const planSeguro =
              escapeDashboardHTML(
                c.plan
              );


            const venceSeguro =
              escapeDashboardHTML(
                c.vence
              );


            const textoDias =
              c.diff === 0
                ? 'Hoy'
                : c.diff === 1
                  ? 'Mañana'
                  : `En ${c.diff} días`;


            return `
              <tr>

                <td>

                  <strong
                    style="
                      cursor:pointer;
                      color:var(--text)
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
                    color:var(--text2)
                  "
                >
                  ${planSeguro}
                </td>

                <td
                  style="
                    color:var(--yellow)
                  "
                >
                  ${venceSeguro}
                </td>

                <td>

                  <span class="pill pill-y">
                    ${textoDias}
                  </span>

                </td>

              </tr>
            `;

          }).join('')

        : `
          <tr>

            <td
              colspan="4"
              style="
                color:var(--text3);
                font-size:13px;
                padding:12px 0;
              "
            >
              Sin vencimientos en los próximos 7 días
            </td>

          </tr>
        `;

  }

}


// ─────────────────────────────────────────
// Animación de contadores
// ─────────────────────────────────────────

function animCounter(
  id,
  target
) {

  const el =
    document.getElementById(
      id
    );


  if (!el) {
    return;
  }


  const start =
    parseInt(
      el.textContent,
      10
    ) || 0;


  if (
    start === target
  ) {

    el.textContent =
      target;

    return;
  }


  const step =
    Math.ceil(
      Math.abs(
        target -
        start
      ) /
      12
    );


  let cur =
    start;


  const t =
    setInterval(
      () => {

        cur =
          cur < target

            ? Math.min(
                cur + step,
                target
              )

            : Math.max(
                cur - step,
                target
              );


        el.textContent =
          cur;


        if (
          cur === target
        ) {

          clearInterval(t);

        }

      },
      40
    );

}