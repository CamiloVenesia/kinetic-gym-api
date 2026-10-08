// ═══════════════════════════════════════════
//  perfil.js — Panel de perfil del cliente
// ═══════════════════════════════════════════


const DIAS_ES = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado'
];


const MESES_ES = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic'
];


// ─────────────────────────────────────────
// Seguridad HTML
// ─────────────────────────────────────────

function escapePerfilHTML(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}


// ─────────────────────────────────────────
// Abrir perfil
// ─────────────────────────────────────────

function openProfile(id) {

  try {

    const c = clientes.find(
      x =>
        String(x.id) ===
        String(id)
    );


    if (!c) {

      console.error(
        'Error: Cliente no encontrado en el array local. ID buscado:',
        id
      );

      return;
    }


    // ─────────────────────────────────────
    // Ingresos
    // ─────────────────────────────────────

    const ingresos =
      (c.ingresos || [])
        .map(i => {

          if (
            typeof i === 'object' &&
            i !== null &&
            i.fecha
          ) {

            return i.fecha;

          }

          return i;

        })
        .filter(Boolean);


    // ─────────────────────────────────────
    // Header
    // ─────────────────────────────────────

    const nombreSeguro =
      String(
        c.nombre ||
        'Sin Nombre'
      );


    const partesNombre =
      nombreSeguro
        .split(' ')
        .filter(Boolean);


    const ini =
      partesNombre
        .map(
          n =>
            n && n[0]
              ? n[0]
              : ''
        )
        .slice(
          0,
          2
        )
        .join('');


    const avatar =
      document.getElementById(
        'pd-avatar'
      );


    const nombreEl =
      document.getElementById(
        'pd-name'
      );


    const metaEl =
      document.getElementById(
        'pd-meta'
      );


    if (avatar) {

      avatar.textContent =
        ini;

    }


    if (nombreEl) {

      nombreEl.textContent =
        nombreSeguro;

    }


    if (metaEl) {

      const dni =
        escapePerfilHTML(
          c.dni || '—'
        );


      const plan =
        escapePerfilHTML(
          c.plan || '—'
        );


      const tel =
        escapePerfilHTML(
          c.tel || '—'
        );


      const desde =
        escapePerfilHTML(
          c.desde || '—'
        );


      const vence =
        escapePerfilHTML(
          c.vence || '—'
        );


      const colorVence =
        c.activo
          ? 'var(--green)'
          : 'var(--red)';


      metaEl.innerHTML = `
        DNI:
        <strong
          style="
            color:var(--text)
          "
        >
          ${dni}
        </strong>

        &nbsp;·&nbsp;

        Plan:
        <strong
          style="
            color:var(--text)
          "
        >
          ${plan}
        </strong>

        <br>

        Tel:
        ${tel}

        &nbsp;·&nbsp;

        Desde:
        ${desde}

        <br>

        Vence:
        <strong
          style="
            color:${colorVence}
          "
        >
          ${vence}
        </strong>
      `;

    }


    // ─────────────────────────────────────
    // Fechas y estadísticas
    // ─────────────────────────────────────

    const hoyReal =
      new Date();


    const inicioMes =
      new Date(
        hoyReal.getFullYear(),
        hoyReal.getMonth(),
        1
      );


    let mesCnt = 0;


    const validDates = [];


    ingresos.forEach(
      iso => {

        const d =
          new Date(iso);


        if (
          !isNaN(
            d.getTime()
          )
        ) {

          validDates.push(d);


          if (
            d >= inicioMes
          ) {

            mesCnt++;

          }

        }

      }
    );


    const totalVis =
      document.getElementById(
        'pd-total-vis'
      );


    const mesVis =
      document.getElementById(
        'pd-mes-vis'
      );


    if (totalVis) {

      totalVis.textContent =
        validDates.length;

    }


    if (mesVis) {

      mesVis.textContent =
        mesCnt;

    }


    // ─────────────────────────────────────
    // Racha
    // ─────────────────────────────────────

    const uniqueDays = [
      ...new Set(
        validDates.map(
          d =>
            `${d.getFullYear()}-${String(
              d.getMonth() + 1
            ).padStart(
              2,
              '0'
            )}-${String(
              d.getDate()
            ).padStart(
              2,
              '0'
            )}`
        )
      )
    ]
      .sort()
      .reverse();


    let racha = 0;


    for (
      let i = 0;
      i < uniqueDays.length;
      i++
    ) {

      const expected =
        new Date(hoyReal);


      expected.setDate(
        hoyReal.getDate() -
        i
      );


      const exp =
        `${expected.getFullYear()}-${String(
          expected.getMonth() + 1
        ).padStart(
          2,
          '0'
        )}-${String(
          expected.getDate()
        ).padStart(
          2,
          '0'
        )}`;


      if (
        uniqueDays[i] === exp
      ) {

        racha++;

      } else {

        break;

      }

    }


    const rachaEl =
      document.getElementById(
        'pd-racha'
      );


    if (rachaEl) {

      rachaEl.textContent =
        racha;

    }


    // ─────────────────────────────────────
    // Heatmap
    // ─────────────────────────────────────

    const hm =
      document.getElementById(
        'pd-heatmap'
      );


    if (hm) {

      hm.innerHTML = '';


      const ingDays =
        new Set(
          uniqueDays
        );


      const todayStr =
        `${hoyReal.getFullYear()}-${String(
          hoyReal.getMonth() + 1
        ).padStart(
          2,
          '0'
        )}-${String(
          hoyReal.getDate()
        ).padStart(
          2,
          '0'
        )}`;


      const gridStart =
        new Date(hoyReal);


      gridStart.setDate(
        hoyReal.getDate() -
        (
          hoyReal.getDay() +
          28
        )
      );


      [
        'D',
        'L',
        'M',
        'X',
        'J',
        'V',
        'S'
      ].forEach(
        day => {

          const h =
            document.createElement(
              'div'
            );


          h.style.cssText =
            'font-size:9px;color:var(--text3);text-align:center;padding-bottom:2px;font-weight:700';


          h.textContent =
            day;


          hm.appendChild(
            h
          );

        }
      );


      for (
        let i = 0;
        i < 35;
        i++
      ) {

        const d =
          new Date(
            gridStart
          );


        d.setDate(
          gridStart.getDate() +
          i
        );


        const dStr =
          `${d.getFullYear()}-${String(
            d.getMonth() + 1
          ).padStart(
            2,
            '0'
          )}-${String(
            d.getDate()
          ).padStart(
            2,
            '0'
          )}`;


        const cell =
          document.createElement(
            'div'
          );


        cell.className =
          'hm-cell';


        if (
          dStr > todayStr
        ) {

          cell.style.opacity =
            '0.2';

        } else {

          cell.textContent =
            d.getDate();


          if (
            dStr === todayStr
          ) {

            cell.classList.add(
              'has-entry-today'
            );

          } else if (
            ingDays.has(
              dStr
            )
          ) {

            cell.classList.add(
              'has-entry'
            );

          }


          const tip =
            document.createElement(
              'div'
            );


          tip.className =
            'hm-tooltip';


          tip.textContent =
            `${d.getDate()} ${MESES_ES[d.getMonth()]}`;


          if (
            ingDays.has(
              dStr
            )
          ) {

            tip.textContent +=
              ' ✓';

          }


          cell.appendChild(
            tip
          );

        }


        hm.appendChild(
          cell
        );

      }

    }


    // ─────────────────────────────────────
    // Historial
    // ─────────────────────────────────────

    const hist =
      document.getElementById(
        'pd-history'
      );


    const countLabel =
      document.getElementById(
        'pd-hist-count'
      );


    if (countLabel) {

      countLabel.textContent =
        `${validDates.length} ${
          validDates.length === 1
            ? 'ingreso'
            : 'ingresos'
        }`;

    }


    if (hist) {

      hist.innerHTML = '';


      if (
        validDates.length === 0
      ) {

        const empty =
          document.createElement(
            'div'
          );


        empty.className =
          'history-empty';


        empty.innerHTML =
          '⌚<br>Sin ingresos registrados<br>aún en este sistema.';


        hist.appendChild(
          empty
        );


      } else {

        validDates
          .sort(
            (a, b) =>
              b - a
          )
          .slice(
            0,
            50
          )
          .forEach(
            d => {

              const dateStr =
                `${DIAS_ES[d.getDay()]} ${d.getDate()} ${MESES_ES[d.getMonth()]} ${d.getFullYear()}`;


              const timeStr =
                `${String(
                  d.getHours()
                ).padStart(
                  2,
                  '0'
                )}:${String(
                  d.getMinutes()
                ).padStart(
                  2,
                  '0'
                )}`;


              const isToday =
                d.toDateString() ===
                hoyReal.toDateString();


              const item =
                document.createElement(
                  'div'
                );


              item.className =
                'history-item';


              const dot =
                document.createElement(
                  'div'
                );


              dot.className =
                'history-dot';


              dot.style.background =
                isToday
                  ? 'var(--accent)'
                  : 'var(--green)';


              const content =
                document.createElement(
                  'div'
                );


              content.style.flex =
                '1';


              const fechaEl =
                document.createElement(
                  'div'
                );


              fechaEl.className =
                'history-date';


              if (isToday) {

                const hoySpan =
                  document.createElement(
                    'span'
                  );


                hoySpan.style.color =
                  'var(--accent)';


                hoySpan.textContent =
                  'Hoy';


                fechaEl.appendChild(
                  hoySpan
                );


                fechaEl.appendChild(
                  document.createTextNode(
                    `, ${timeStr}`
                  )
                );


              } else {

                fechaEl.textContent =
                  dateStr;

              }


              content.appendChild(
                fechaEl
              );


              const horaEl =
                document.createElement(
                  'div'
                );


              horaEl.className =
                'history-time';


              horaEl.textContent =
                isToday
                  ? ''
                  : timeStr;


              item.appendChild(
                dot
              );


              item.appendChild(
                content
              );


              item.appendChild(
                horaEl
              );


              hist.appendChild(
                item
              );

            }
          );

      }

    }


    // ─────────────────────────────────────
    // Abrir panel
    // ─────────────────────────────────────

    const overlay =
      document.getElementById(
        'profile-overlay'
      );


    const drawer =
      document.getElementById(
        'profile-drawer'
      );


    if (
      overlay &&
      drawer
    ) {

      overlay.classList.add(
        'open'
      );


      setTimeout(
        () =>
          drawer.classList.add(
            'open'
          ),
        10
      );


    } else {

      console.error(
        'Error: No se encontraron los elementos HTML del panel.'
      );

    }


  } catch (error) {

    console.error(
      'Error crítico al intentar abrir el perfil:',
      error
    );


    if (
      typeof showToast ===
      'function'
    ) {

      showToast(
        'Hubo un error al procesar los datos de este cliente',
        true
      );

    } else {

      alert(
        'Error al cargar el perfil del cliente.'
      );

    }

  }

}


// ─────────────────────────────────────────
// Cerrar perfil
// ─────────────────────────────────────────

function closeProfile() {

  const drawer =
    document.getElementById(
      'profile-drawer'
    );


  const overlay =
    document.getElementById(
      'profile-overlay'
    );


  if (drawer) {

    drawer.classList.remove(
      'open'
    );

  }


  if (overlay) {

    overlay.classList.remove(
      'open'
    );

  }

}