/* docente.js — panel para habilitar temas */
(() => {
  const $ = (s) => document.querySelector(s);
  let estado = { temas: {}, foco: null, aviso: '' };
  const temas = [...window.TEMAS].sort((a, b) => a.orden - b.orden);

  try { const t = localStorage.getItem('tema-visual'); if (t) document.documentElement.dataset.theme = t; } catch { }

  function msg(txt, tipo = '') { const g = $('#guardado'); g.className = 'estado-guardado ' + tipo; g.textContent = txt; }

  async function guardar() {
    msg('Guardando…');
    try {
      const r = await API.guardar(estado);
      estado = r.estado;
      msg('Guardado ✓ ' + new Date().toLocaleTimeString('es-AR'), 'ok');
      pintar();
    } catch (e) {
      msg('No se pudo guardar: ' + e.message, 'err');
      if (e.status === 401) { API.salir(); mostrarLogin(); }
    }
  }

  const sw = (checked, on) => {
    const l = document.createElement('label'); l.className = 'switch';
    const i = document.createElement('input'); i.type = 'checkbox'; i.checked = checked; i.onchange = () => on(i.checked);
    l.append(i, document.createElement('span')); return l;
  };

  function pintar() {
    const tb = $('#filas'); tb.innerHTML = '';
    for (const t of temas) {
      const st = estado.temas[t.id] || { on: false, sol: false };
      const tr = document.createElement('tr');
      tr.innerHTML = `<td style="font-family:var(--mono);font-weight:700">${String(t.orden).padStart(2, '0')}</td>
        <td><b>${t.titulo}</b>${t.confirmar ? ' <span class="tema-tag">a confirmar</span>' : ''}<br><small style="color:var(--muted)">${t.resumen || ''}</small></td>
        <td></td><td></td><td></td><td><a class="btn chico" href="index.html#/${t.id}/docente">Guía</a></td>`;
      const set = (k, v) => { estado.temas[t.id] = { ...(estado.temas[t.id] || { on: false, sol: false }), [k]: v }; };
      tr.children[2].append(sw(st.on, v => { set('on', v); if (!v && estado.foco === t.id) estado.foco = null; guardar(); }));
      tr.children[3].append(sw(st.sol, v => { set('sol', v); guardar(); }));
      const r = document.createElement('input'); r.type = 'radio'; r.name = 'foco'; r.checked = estado.foco === t.id;
      r.style.cssText = 'width:18px;height:18px;accent-color:var(--accent)';
      r.onclick = () => {
        if (estado.foco === t.id) { estado.foco = null; } else { estado.foco = t.id; set('on', true); }
        guardar();
      };
      tr.children[4].append(r);
      tb.append(tr);
    }
    $('#aviso').value = estado.aviso || '';
  }

  function mostrarLogin() { $('#login').hidden = false; $('#panel').hidden = true; }
  async function mostrarPanel() {
    $('#login').hidden = true; $('#panel').hidden = false;
    const { estado: e, origen } = await API.obtener();
    if (e) estado = { temas: {}, foco: null, aviso: '', ...e };
    if (origen !== 'servidor') msg('Atención: no se pudo leer el estado del servidor (' + origen + ').', 'err');
    pintar();
  }

  $('#form-login').onsubmit = async (ev) => {
    ev.preventDefault();
    $('#login-err').textContent = '';
    if (API.esLocal) { $('#login-err').textContent = 'El panel funciona solo con el sitio publicado en Netlify (o con "netlify dev").'; return; }
    try { await API.login($('#clave').value); mostrarPanel(); }
    catch (e) { $('#login-err').textContent = e.status === 404 ? 'No se encontró la función /api/estado. ¿Lo subiste con la carpeta netlify/functions y el package.json?' : e.message; }
  };
  $('#salir').onclick = () => { API.salir(); mostrarLogin(); };
  $('#todos-on').onclick = () => { temas.forEach(t => estado.temas[t.id] = { ...(estado.temas[t.id] || {}), on: true, sol: !!estado.temas[t.id]?.sol }); guardar(); };
  $('#todos-off').onclick = () => { temas.forEach(t => estado.temas[t.id] = { ...(estado.temas[t.id] || {}), on: false, sol: !!estado.temas[t.id]?.sol }); estado.foco = null; guardar(); };
  $('#sol-off').onclick = () => { temas.forEach(t => estado.temas[t.id] = { ...(estado.temas[t.id] || { on: false }), sol: false }); guardar(); };
  $('#guardar-aviso').onclick = () => { estado.aviso = $('#aviso').value.trim(); guardar(); };

  (async () => {
    if (API.leerClave()) {
      try { await API.login(API.leerClave()); return mostrarPanel(); } catch { API.salir(); }
    }
    mostrarLogin();
  })();
})();
