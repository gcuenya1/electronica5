/* app.js — página principal (alumno / docente) */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const temas = () => [...window.TEMAS].sort((a, b) => a.orden - b.orden);
  const porId = (id) => window.TEMAS.find(t => t.id === id);

  const ICO = {
    candado: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
    menu: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
    luna: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
  };

  const S = {
    estado: { temas: {}, foco: null, aviso: '' },
    origen: 'servidor',
    docente: false,
    presentacion: false,
    temaId: null,
    pestana: 'teoria',
  };

  // ---------- progreso del alumno (local) ----------
  const LS_PROG = 'progreso-e5';
  const prog = (() => { try { return JSON.parse(localStorage.getItem(LS_PROG) || '{}'); } catch { return {}; } })();
  const guardarProg = () => { try { localStorage.setItem(LS_PROG, JSON.stringify(prog)); } catch { } };

  // ---------- tema visual ----------
  function aplicarTemaVisual() {
    let t = null; try { t = localStorage.getItem('tema-visual'); } catch { }
    if (t) document.documentElement.dataset.theme = t;
  }
  function alternarTemaVisual() {
    const oscuroAhora = document.documentElement.dataset.theme
      ? document.documentElement.dataset.theme === 'dark'
      : matchMedia('(prefers-color-scheme: dark)').matches;
    const nuevo = oscuroAhora ? 'light' : 'dark';
    document.documentElement.dataset.theme = nuevo;
    try { localStorage.setItem('tema-visual', nuevo); } catch { }
    render(); // redibuja canvas con colores nuevos
  }

  // ---------- permisos ----------
  const habilitado = (id) => S.origen === 'local' || !!(S.estado.temas[id] && S.estado.temas[id].on);
  const solVisible = (id) => S.docente || S.origen === 'local' || !!(S.estado.temas[id] && S.estado.temas[id].sol);
  const puedeVer = (id) => S.docente || habilitado(id);
  const verDocente = () => (S.docente || S.origen === 'local') && !S.presentacion;

  // ---------- routing ----------
  function leerHash() {
    const [, id, pest] = (location.hash || '').split('/');
    S.temaId = id && porId(id) ? id : null;
    S.pestana = pest || 'teoria';
  }
  const ir = (id, pest = 'teoria') => { location.hash = `#/${id}/${pest}`; };

  // ---------- render ----------
  function renderSidebar() {
    const ul = $('#lista-temas');
    ul.innerHTML = '';
    for (const t of temas()) {
      const li = document.createElement('li');
      const ok = puedeVer(t.id);
      const tags = [];
      if (S.estado.foco === t.id) tags.push('<span class="tema-tag foco">ahora</span>');
      if (verDocente() && !habilitado(t.id)) tags.push('<span class="tema-tag oculto">oculto</span>');
      if (t.confirmar && verDocente()) tags.push('<span class="tema-tag">a confirmar</span>');
      li.innerHTML = `<button class="tema-btn ${S.temaId === t.id ? 'activo' : ''}" ${ok ? '' : 'disabled'} title="${ok ? '' : 'Todavía no habilitado'}">
        <span class="tema-num">${ok ? String(t.orden).padStart(2, '0') : ICO.candado}</span>
        <span class="tema-txt">${t.titulo}<small>${t.resumen || ''}</small></span>${tags.join('')}</button>`;
      if (ok) li.firstElementChild.addEventListener('click', () => { ir(t.id); cerrarMenu(); });
      ul.append(li);
    }
  }

  function renderBanners() {
    const zona = $('#banners');
    zona.innerHTML = '';
    if (S.estado.aviso) {
      const a = document.createElement('div'); a.className = 'aviso';
      a.textContent = S.estado.aviso; zona.append(a);
    }
    const f = S.estado.foco && porId(S.estado.foco);
    if (f && S.temaId !== f.id && puedeVer(f.id)) {
      const b = document.createElement('div'); b.className = 'foco-banner';
      b.innerHTML = `<span class="dot"></span><span>Ahora estamos viendo: <b>${f.titulo}</b></span>`;
      const btn = document.createElement('button'); btn.className = 'btn chico primario'; btn.textContent = 'Ir al tema';
      btn.onclick = () => ir(f.id); b.append(btn); zona.append(b);
    }
    if (S.origen === 'cache') {
      const a = document.createElement('div'); a.className = 'sim-nota'; a.style.marginBottom = '14px';
      a.innerHTML = 'Sin conexión con el servidor: se muestra la última configuración conocida.';
      zona.append(a);
    }
    if (S.origen === 'local') {
      const a = document.createElement('div'); a.className = 'sim-nota solo-docente'; a.style.marginBottom = '14px';
      a.innerHTML = '<b>Modo local (vista previa):</b> se muestran todos los temas y la guía docente. Al subirlo a Netlify, los temas se habilitan desde el <a href="docente.html">panel docente</a>.';
      zona.append(a);
    }
  }

  function renderPortada(main) {
    const disp = temas().filter(t => puedeVer(t.id));
    main.innerHTML = `<div class="portada">
      <h1 style="margin-top:.2em">Electrónica General — 5.º año</h1>
      <p style="color:var(--muted)">Teoría explicada paso a paso, simulaciones para experimentar, ejercicios con pistas y autoevaluaciones. Los temas se van habilitando a medida que avanzamos en clase.</p>
      ${disp.length ? '' : '<div class="vacio"><div class="grande">⏳</div><p>Todavía no hay temas habilitados. ¡Esperá la indicación del profe!</p></div>'}
      <div class="grid-temas"></div></div>`;
    const g = $('.grid-temas', main);
    for (const t of temas()) {
      const ok = puedeVer(t.id);
      const b = document.createElement('button'); b.className = 'card'; b.disabled = !ok;
      b.innerHTML = `<div style="font-family:var(--mono);font-weight:800;color:var(--accent)">${ok ? String(t.orden).padStart(2, '0') : ICO.candado}</div><b>${t.titulo}</b><div style="color:var(--muted);font-size:.85rem">${t.resumen || ''}</div>`;
      if (ok) b.onclick = () => ir(t.id);
      g.append(b);
    }
  }

  function renderMath(el) {
    if (window.renderMathInElement) {
      try {
        renderMathInElement(el, {
          delimiters: [{ left: '$$', right: '$$', display: true }, { left: '\\[', right: '\\]', display: true }, { left: '$', right: '$', display: false }, { left: '\\(', right: '\\)', display: false }],
          throwOnError: false,
        });
      } catch (e) { console.warn(e); }
    }
  }

  function renderTema(main) {
    const t = porId(S.temaId);
    if (!t || !puedeVer(t.id)) {
      main.innerHTML = `<div class="vacio"><div class="grande">🔒</div><p>Este tema todavía no está habilitado.</p><a class="btn" href="#/">Volver al inicio</a></div>`;
      return;
    }
    const pestanas = [
      ['teoria', 'Teoría'],
      ['sim', `Simulaciones${t.simulaciones?.length ? ' (' + t.simulaciones.length + ')' : ''}`],
      ['ejercicios', `Ejercicios${t.ejercicios?.length ? ' (' + t.ejercicios.length + ')' : ''}`],
      ['quiz', 'Autoevaluación'],
    ];
    if (verDocente()) pestanas.push(['docente', 'Guía docente']);
    if (!pestanas.some(p => p[0] === S.pestana)) S.pestana = 'teoria';

    main.innerHTML = `
      <div class="tema-head"><small style="color:var(--accent);font-weight:700;font-family:var(--mono)">TEMA ${String(t.orden).padStart(2, '0')}</small>
      <h1>${t.titulo}</h1><p>${t.resumen || ''}</p></div>
      <nav class="tabs">${pestanas.map(([k, n]) => `<button class="tab ${k === 'docente' ? 'docente solo-docente' : ''} ${S.pestana === k ? 'activo' : ''}" data-p="${k}">${n}</button>`).join('')}</nav>
      <div id="contenido" class="contenido"></div>
      <div id="nav-temas" style="display:flex;justify-content:space-between;gap:10px;margin-top:30px;max-width:980px"></div>`;
    main.querySelectorAll('.tab').forEach(b => b.onclick = () => ir(t.id, b.dataset.p));

    const c = $('#contenido', main);
    if (S.pestana === 'teoria') { c.classList.add('teoria'); c.innerHTML = t.teoria || '<p>Sin teoría cargada.</p>'; }
    else if (S.pestana === 'sim') renderSims(c, t);
    else if (S.pestana === 'ejercicios') renderEjercicios(c, t);
    else if (S.pestana === 'quiz') renderQuiz(c, t);
    else if (S.pestana === 'docente') c.innerHTML = `<div class="guia">${t.docente || '<p>Sin guía.</p>'}</div>`;
    renderMath(c);

    // navegación anterior / siguiente (solo entre temas visibles)
    const vis = temas().filter(x => puedeVer(x.id));
    const i = vis.findIndex(x => x.id === t.id);
    const nav = $('#nav-temas', main);
    if (vis[i - 1]) { const b = document.createElement('a'); b.className = 'btn'; b.href = `#/${vis[i - 1].id}/teoria`; b.textContent = '← ' + vis[i - 1].titulo; nav.append(b); } else nav.append(document.createElement('span'));
    if (vis[i + 1]) { const b = document.createElement('a'); b.className = 'btn'; b.href = `#/${vis[i + 1].id}/teoria`; b.textContent = vis[i + 1].titulo + ' →'; nav.append(b); }
  }

  function renderSims(c, t) {
    if (!t.simulaciones || !t.simulaciones.length) { c.innerHTML = '<p>Este tema no tiene simulaciones.</p>'; return; }
    for (const s of t.simulaciones) {
      const box = document.createElement('section'); box.className = 'sim';
      box.innerHTML = `<div class="sim-head"><h3>${s.titulo}</h3>${s.descripcion ? `<p>${s.descripcion}</p>` : ''}</div>`;
      c.append(box);
      try { s.montar(box, H); } catch (e) {
        console.error(e);
        box.insertAdjacentHTML('beforeend', `<div class="sim-nota" style="margin:12px">Error al cargar la simulación: ${e.message}</div>`);
      }
    }
  }

  function renderEjercicios(c, t) {
    const lista = t.ejercicios || [];
    if (!lista.length) { c.innerHTML = '<p>Sin ejercicios.</p>'; return; }
    const hechos = prog[t.id]?.ej || {};
    const total = lista.length, n = Object.values(hechos).filter(Boolean).length;
    c.innerHTML = `<p style="color:var(--muted)">Resolvé en la carpeta primero; usá la pista si te trabás. Marcá cada ejercicio cuando lo termines (${n}/${total} hechos).</p>`;
    lista.forEach((e, i) => {
      const d = document.createElement('div'); d.className = 'ej';
      const sol = solVisible(t.id);
      d.innerHTML = `<div class="ej-head"><span class="ej-num">${i + 1}</span>${e.nivel ? `<span class="ej-nivel">${e.nivel}</span>` : ''}
        <label class="ctrl-check ej-check"><input type="checkbox" ${hechos[i] ? 'checked' : ''}> Hecho</label></div>
        <div class="ej-enunciado">${e.enunciado}</div>
        <div class="ej-acciones">
          ${e.pista ? '<button class="btn chico" data-a="pista">Ver pista</button>' : ''}
          ${sol ? '<button class="btn chico" data-a="sol">Ver solución</button>' : `<span class="bloqueado">${ICO.candado} La solución se habilita cuando el profe lo indique</span>`}
        </div>
        ${e.pista ? `<div class="ej-desplegable pista" hidden><b>Pista:</b> ${e.pista}</div>` : ''}
        ${sol ? `<div class="ej-desplegable sol" hidden><b>Solución:</b> ${e.solucion}</div>` : ''}`;
      d.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
        const p = d.querySelector('.ej-desplegable.' + b.dataset.a);
        p.hidden = !p.hidden;
        b.textContent = (p.hidden ? 'Ver ' : 'Ocultar ') + (b.dataset.a === 'pista' ? 'pista' : 'solución');
      });
      d.querySelector('.ej-check input').onchange = (ev) => {
        prog[t.id] = prog[t.id] || {}; prog[t.id].ej = prog[t.id].ej || {};
        prog[t.id].ej[i] = ev.target.checked; guardarProg();
      };
      c.append(d);
    });
  }

  function renderQuiz(c, t) {
    const qs = t.quiz || [];
    if (!qs.length) { c.innerHTML = '<p>Sin autoevaluación.</p>'; return; }
    let correctas = 0, respondidas = 0;
    c.innerHTML = '<p style="color:var(--muted)">Elegí la opción correcta. Vas a ver la explicación al responder.</p>';
    const puntaje = document.createElement('div');
    qs.forEach((q, i) => {
      const d = document.createElement('div'); d.className = 'quiz-preg';
      d.innerHTML = `<b>${i + 1}.</b> ${q.pregunta}<div class="quiz-opc"></div><div class="quiz-exp" hidden></div>`;
      const opc = d.querySelector('.quiz-opc');
      q.opciones.forEach((o, j) => {
        const b = document.createElement('button'); b.innerHTML = o;
        b.onclick = () => {
          respondidas++;
          if (j === q.correcta) correctas++;
          opc.querySelectorAll('button').forEach((bb, k) => { bb.disabled = true; if (k === q.correcta) bb.classList.add('bien'); else if (k === j) bb.classList.add('mal'); });
          const ex = d.querySelector('.quiz-exp'); ex.hidden = false;
          ex.innerHTML = (j === q.correcta ? '<b style="color:var(--green)">¡Correcto!</b> ' : '<b style="color:var(--red)">No es correcta.</b> ') + (q.explicacion || '');
          renderMath(ex);
          if (respondidas === qs.length) {
            puntaje.innerHTML = `<div class="quiz-puntaje">Resultado: ${correctas} de ${qs.length} correctas</div> <button class="btn chico" style="margin-left:8px">Reintentar</button>`;
            puntaje.querySelector('button').onclick = () => { c.innerHTML = ''; renderQuiz(c, t); renderMath(c); };
            prog[t.id] = prog[t.id] || {}; prog[t.id].quiz = Math.max(prog[t.id].quiz || 0, correctas); guardarProg();
          }
        };
        opc.append(b);
      });
      c.append(d);
    });
    c.append(puntaje);
  }

  // ---------- barra docente ----------
  function renderBarraDocente() {
    let b = $('#barra-docente');
    if (!S.docente) { if (b) b.remove(); return; }
    if (!b) { b = document.createElement('div'); b.id = 'barra-docente'; b.className = 'barra-docente'; document.body.append(b); }
    if (S.presentacion) {
      b.innerHTML = '<button class="btn chico">Salir de modo presentación</button>';
      b.firstChild.onclick = () => { S.presentacion = false; document.body.classList.remove('presentacion'); render(); };
      return;
    }
    const t = S.temaId && porId(S.temaId);
    const st = (t && S.estado.temas[t.id]) || { on: false, sol: false };
    b.innerHTML = `<b>Modo docente</b>
      ${t ? `<label class="ctrl-check"><input type="checkbox" data-k="on" ${st.on ? 'checked' : ''}> Visible para el alumno</label>
      <label class="ctrl-check"><input type="checkbox" data-k="sol" ${st.sol ? 'checked' : ''}> Mostrar soluciones</label>
      <label class="ctrl-check"><input type="checkbox" data-k="foco" ${S.estado.foco === t.id ? 'checked' : ''}> Es el tema de hoy (foco)</label>` : '<span style="color:var(--muted)">Abrí un tema para habilitarlo.</span>'}
      <div class="fila"><button class="btn chico" data-a="pres">Modo presentación</button><a class="btn chico" href="docente.html">Panel</a></div>
      <span class="estado-guardado" id="guardado"></span>`;
    b.querySelectorAll('input[data-k]').forEach(i => i.onchange = async () => {
      const k = i.dataset.k;
      const nuevo = JSON.parse(JSON.stringify(S.estado));
      nuevo.temas[t.id] = nuevo.temas[t.id] || { on: false, sol: false };
      if (k === 'foco') { nuevo.foco = i.checked ? t.id : null; if (i.checked) nuevo.temas[t.id].on = true; }
      else nuevo.temas[t.id][k] = i.checked;
      const g = $('#guardado'); g.className = 'estado-guardado'; g.textContent = 'Guardando…';
      try {
        const r = await API.guardar(nuevo);
        S.estado = r.estado; render();
        const g2 = $('#guardado'); if (g2) { g2.className = 'estado-guardado ok'; g2.textContent = 'Guardado ✓'; }
      } catch (e) {
        g.className = 'estado-guardado err'; g.textContent = e.message;
        if (e.status === 401) { API.salir(); S.docente = false; render(); }
      }
    });
    b.querySelector('[data-a="pres"]').onclick = () => { S.presentacion = true; document.body.classList.add('presentacion'); render(); };
  }

  // ---------- menú móvil ----------
  const cerrarMenu = () => $('#sidebar').classList.remove('abierto');

  function render() {
    H.limpiar();
    leerHash();
    renderSidebar();
    renderBanners();
    const main = $('#vista');
    if (!S.temaId) renderPortada(main); else renderTema(main);
    renderBarraDocente();
    $('#modo-txt').textContent = S.docente ? (S.presentacion ? 'Presentación' : 'Docente') : (S.origen === 'local' ? 'Vista previa' : 'Alumno');
  }

  async function actualizarEstado(primera = false) {
    const { estado, origen } = await API.obtener();
    const antes = JSON.stringify(S.estado);
    S.origen = origen;
    if (estado) S.estado = { temas: {}, foco: null, aviso: '', ...estado };
    if (primera || antes !== JSON.stringify(S.estado)) {
      // si estoy en una pestaña de simulación, no rehacer todo salvo que cambie lo que afecta a este tema
      if (!primera && S.temaId && S.pestana === 'sim') { renderSidebar(); renderBanners(); renderBarraDocente(); }
      else render();
    }
  }

  async function iniciar() {
    aplicarTemaVisual();
    $('#btn-menu').innerHTML = ICO.menu;
    $('#btn-menu').onclick = () => $('#sidebar').classList.toggle('abierto');
    $('#btn-tema').innerHTML = ICO.luna;
    $('#btn-tema').onclick = alternarTemaVisual;
    $('#btn-docente').onclick = async () => {
      if (S.docente) { API.salir(); S.docente = false; S.presentacion = false; document.body.classList.remove('presentacion'); render(); return; }
      location.href = 'docente.html';
    };

    // ¿hay sesión docente?
    if (API.leerClave() && !API.esLocal) {
      try { await API.login(API.leerClave()); S.docente = true; } catch { API.salir(); }
    }
    $('#btn-docente').textContent = S.docente ? 'Salir de modo docente' : 'Soy docente';

    window.addEventListener('hashchange', render);
    await actualizarEstado(true);
    setInterval(() => { if (!document.hidden) actualizarEstado(); }, 15000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) actualizarEstado(); });
  }

  document.addEventListener('DOMContentLoaded', iniciar);
})();
