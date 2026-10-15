/* =====================================================================
   core.js — registro de temas + utilidades para simulaciones (H)
   + mini‑librería de esquemas eléctricos en SVG (Esq)
   ===================================================================== */
window.TEMAS = [];
function registrarTema(t) { window.TEMAS.push(t); }

/* ---------------------------------------------------------------------
   H: helpers para simulaciones
   --------------------------------------------------------------------- */
const H = (() => {
  const PREF = [[1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'µ'], [1e-9, 'n'], [1e-12, 'p']];

  /** Formatea con prefijo de ingeniería: fmt(0.0123,'A') -> "12.3 mA" */
  function fmt(v, unidad = '', dig = 3) {
    if (v === null || v === undefined || Number.isNaN(v)) return '—';
    if (!Number.isFinite(v)) return (v > 0 ? '∞ ' : '−∞ ') + unidad;
    if (v === 0) return '0 ' + unidad;
    const a = Math.abs(v);
    for (const [f, p] of PREF) {
      if (a >= f * 0.9995) {
        const n = v / f;
        return Number(n.toPrecision(dig)).toLocaleString('es-AR', { maximumFractionDigits: 6 }) + ' ' + p + unidad;
      }
    }
    return Number((v / 1e-12).toPrecision(dig)).toLocaleString('es-AR') + ' p' + unidad;
  }
  /** Número con coma decimal y d decimales */
  const num = (v, d = 2) => Number(v).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: d });

  /** Lee una variable CSS del tema actual: col('c1') -> '#1f5fbf' */
  const col = (n) => getComputedStyle(document.documentElement).getPropertyValue('--' + n).trim() || '#888';

  function el(tag, attrs = {}, html = '') {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') e.className = v; else if (k === 'style') e.style.cssText = v; else e.setAttribute(k, v);
    }
    if (html) e.innerHTML = html;
    return e;
  }

  /** Estructura estándar: devuelve { controles, vista } */
  function layout(cont) {
    const cuerpo = el('div', { class: 'sim-cuerpo' });
    const controles = el('div', { class: 'sim-controles' });
    const vista = el('div', { class: 'sim-vista' });
    cuerpo.append(controles, vista);
    cont.append(cuerpo);
    return { controles, vista };
  }

  /** Slider. op: {label,min,max,step,value,unidad,fmt:(v)=>str, onInput, log:true} */
  function slider(parent, op) {
    const w = el('div', { class: 'ctrl' });
    const lab = el('label');
    const t = el('span', {}, op.label);
    const v = el('span', { class: 'v' });
    lab.append(t, v);
    const inp = el('input', { type: 'range' });
    const log = !!op.log;
    if (log) {
      inp.min = 0; inp.max = 1000; inp.step = 1;
    } else {
      inp.min = op.min; inp.max = op.max; inp.step = op.step ?? (op.max - op.min) / 100;
    }
    const aSlider = (x) => log ? Math.round(1000 * Math.log(x / op.min) / Math.log(op.max / op.min)) : x;
    const deSlider = (s) => {
      if (!log) return parseFloat(s);
      const x = op.min * Math.pow(op.max / op.min, s / 1000);
      const p = Math.pow(10, Math.floor(Math.log10(x)) - 2);   // 3 cifras significativas
      return Math.round(x / p) * p;
    };
    let valor = op.value;
    inp.value = aSlider(valor);
    const mostrar = () => { v.textContent = op.fmt ? op.fmt(valor) : (op.unidad !== undefined ? fmt(valor, op.unidad) : num(valor)); };
    inp.addEventListener('input', () => { valor = deSlider(inp.value); mostrar(); op.onInput && op.onInput(valor); });
    mostrar();
    w.append(lab, inp);
    parent.append(w);
    return {
      get value() { return valor; },
      set value(x) { valor = x; inp.value = aSlider(x); mostrar(); },
      el: w,
    };
  }

  /** Select. op: {label, opciones:[{v,t}] | ['a','b'], value, onChange} */
  function select(parent, op) {
    const w = el('div', { class: 'ctrl' });
    if (op.label) w.append(el('label', {}, `<span>${op.label}</span>`));
    const s = el('select');
    for (const o of op.opciones) {
      const oo = typeof o === 'object' ? o : { v: o, t: o };
      const opt = el('option', { value: oo.v }, oo.t);
      s.append(opt);
    }
    if (op.value !== undefined) s.value = op.value;
    s.addEventListener('change', () => op.onChange && op.onChange(s.value));
    w.append(s);
    parent.append(w);
    return { get value() { return s.value; }, set value(x) { s.value = x; }, el: w };
  }

  /** Checkbox. op: {label, value, onChange} */
  function check(parent, op) {
    const l = el('label', { class: 'ctrl-check' });
    const i = el('input', { type: 'checkbox' });
    i.checked = !!op.value;
    i.addEventListener('change', () => op.onChange && op.onChange(i.checked));
    l.append(i, el('span', {}, op.label));
    parent.append(l);
    return { get value() { return i.checked; }, set value(x) { i.checked = x; }, el: l };
  }

  /** Botón. */
  function boton(parent, texto, onClick, clase = 'btn') {
    const b = el('button', { class: clase, type: 'button' }, texto);
    b.addEventListener('click', onClick);
    parent.append(b);
    return b;
  }

  const titulo = (parent, txt) => parent.append(el('div', { class: 'ctrl-titulo' }, txt));
  const sep = (parent) => parent.append(el('div', { class: 'ctrl-sep' }));
  function nota(parent, html = '') { const n = el('div', { class: 'sim-nota' }, html); parent.append(n); return n; }

  /** Panel de lecturas. set([{k:'Corriente', v:'12 mA', estado:'ok|mal|alerta'}]) */
  function lecturas(parent) {
    const d = el('div', { class: 'lecturas' });
    parent.append(d);
    return {
      el: d,
      set(items) {
        d.innerHTML = items.map(i => `<div class="lectura ${i.estado || ''}"><small>${i.k}</small><b>${i.v}</b></div>`).join('');
      },
    };
  }

  /**
   * Canvas con alta resolución y redibujado automático al cambiar tamaño/tema.
   * op: { alto: 280, dibujar: (ctx, w, h) => {} , fondo?: 'scope-bg' }
   * devuelve { cv, ctx, redibujar(), get w, get h }
   */
  function canvas(parent, op) {
    const cv = el('canvas', { class: 'sim-canvas' });
    parent.append(cv);
    const ctx = cv.getContext('2d');
    let w = 0, h = 0;
    function ajustar() {
      const dpr = window.devicePixelRatio || 1;
      w = cv.clientWidth || parent.clientWidth || 600;
      h = typeof op.alto === 'function' ? op.alto(w) : (op.alto || 280);
      cv.style.height = h + 'px';
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function redibujar() {
      if (!w) ajustar();
      ctx.save();
      ctx.clearRect(0, 0, w, h);
      if (op.fondo) { ctx.fillStyle = col(op.fondo); ctx.fillRect(0, 0, w, h); }
      op.dibujar && op.dibujar(ctx, w, h);
      ctx.restore();
    }
    const ro = new ResizeObserver(() => { const prev = w; ajustar(); if (prev !== w || true) redibujar(); });
    ro.observe(cv);
    H._limpiezas.push(() => ro.disconnect());
    ajustar();
    return { cv, ctx, redibujar, get w() { return w; }, get h() { return h; } };
  }

  /** Ticks "lindos" para un rango */
  function ticks(min, max, n = 6) {
    const span = max - min;
    if (span <= 0) return [min];
    const paso0 = span / n;
    const mag = Math.pow(10, Math.floor(Math.log10(paso0)));
    const r = paso0 / mag;
    const paso = (r < 1.5 ? 1 : r < 3 ? 2 : r < 7 ? 5 : 10) * mag;
    const out = [];
    for (let v = Math.ceil(min / paso) * paso; v <= max + paso * 1e-6; v += paso) out.push(Math.abs(v) < paso * 1e-9 ? 0 : v);
    return out;
  }

  /**
   * Ejes cartesianos dentro del canvas.
   * op: { x0,y0,w,h (área en px, opcional: por defecto margen automático),
   *       xmin,xmax,ymin,ymax, xlabel, ylabel, xfmt, yfmt, grid:true, nx, ny, oscuro:false }
   * devuelve objeto P con: X(x), Y(y), fn(f,op), pts(arr,op), area(f,op), punto(x,y,op),
   *   hline(y,op), vline(x,op), texto(x,y,str,op), clip(cb)
   */
  function ejes(ctx, W, Hh, op) {
    const m = { l: op.ml ?? 52, r: op.mr ?? 14, t: op.mt ?? 14, b: op.mb ?? 34 };
    const x0 = op.x0 ?? m.l, y0 = op.y0 ?? m.t;
    const w = op.w ?? (W - m.l - m.r), h = op.h ?? (Hh - m.t - m.b);
    const { xmin, xmax, ymin, ymax } = op;
    const X = (x) => x0 + (x - xmin) / (xmax - xmin) * w;
    const Y = (y) => y0 + h - (y - ymin) / (ymax - ymin) * h;
    const cGrid = op.oscuro ? col('scope-grid') : col('grid');
    const cAxis = op.oscuro ? '#5b8a76' : col('axis');
    const cTxt = op.oscuro ? '#9cc7b4' : col('muted');
    ctx.save();
    ctx.font = '11px ' + (getComputedStyle(document.body).fontFamily || 'sans-serif');
    ctx.lineWidth = 1;
    const tx = op.xticks || ticks(xmin, xmax, op.nx || 8);
    const ty = op.yticks || ticks(ymin, ymax, op.ny || 6);
    if (op.grid !== false) {
      ctx.strokeStyle = cGrid;
      ctx.beginPath();
      for (const t of tx) { ctx.moveTo(Math.round(X(t)) + .5, y0); ctx.lineTo(Math.round(X(t)) + .5, y0 + h); }
      for (const t of ty) { ctx.moveTo(x0, Math.round(Y(t)) + .5); ctx.lineTo(x0 + w, Math.round(Y(t)) + .5); }
      ctx.stroke();
    }
    ctx.strokeStyle = cAxis;
    ctx.beginPath();
    ctx.rect(x0 + .5, y0 + .5, w, h);
    ctx.stroke();
    // ejes en cero
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    if (ymin < 0 && ymax > 0) { ctx.moveTo(x0, Math.round(Y(0)) + .5); ctx.lineTo(x0 + w, Math.round(Y(0)) + .5); }
    if (xmin < 0 && xmax > 0) { ctx.moveTo(Math.round(X(0)) + .5, y0); ctx.lineTo(Math.round(X(0)) + .5, y0 + h); }
    ctx.stroke();
    ctx.fillStyle = cTxt;
    if (op.etiquetas !== false) {
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      for (const t of tx) ctx.fillText(op.xfmt ? op.xfmt(t) : num(t, 3), X(t), y0 + h + 4);
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      for (const t of ty) ctx.fillText(op.yfmt ? op.yfmt(t) : num(t, 3), x0 - 5, Y(t));
    }
    ctx.font = '600 11px ' + (getComputedStyle(document.body).fontFamily || 'sans-serif');
    if (op.xlabel) { ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText(op.xlabel, x0 + w - 4, y0 + h - 4); }
    if (op.ylabel) { ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(op.ylabel, x0 + 5, y0 + 4); }
    ctx.restore();

    const P = {
      X, Y, x0, y0, w, h, ctx,
      clip(cb) { ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip(); cb(); ctx.restore(); },
      /** curva y=f(x). op: {color, ancho, n, desde, hasta, guiones:[4,4]} */
      fn(f, o = {}) {
        const a = o.desde ?? xmin, b = o.hasta ?? xmax, n = o.n || Math.max(200, Math.round(w));
        P.clip(() => {
          ctx.strokeStyle = o.color || col('c1'); ctx.lineWidth = o.ancho || 2;
          if (o.guiones) ctx.setLineDash(o.guiones);
          ctx.beginPath();
          let pen = false;
          for (let i = 0; i <= n; i++) {
            const x = a + (b - a) * i / n; const y = f(x);
            if (!Number.isFinite(y)) { pen = false; continue; }
            const py = Math.max(-1e4, Math.min(1e4, Y(y)));
            if (!pen) { ctx.moveTo(X(x), py); pen = true; } else ctx.lineTo(X(x), py);
          }
          ctx.stroke();
        });
      },
      /** polilínea con puntos [[x,y],...] */
      pts(arr, o = {}) {
        P.clip(() => {
          ctx.strokeStyle = o.color || col('c1'); ctx.lineWidth = o.ancho || 2;
          if (o.guiones) ctx.setLineDash(o.guiones);
          ctx.beginPath();
          arr.forEach(([x, y], i) => i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y)));
          ctx.stroke();
        });
      },
      /** área sombreada entre f(x) y base (por defecto 0). op: {color, alfa, desde, hasta, base} */
      area(f, o = {}) {
        const a = o.desde ?? xmin, b = o.hasta ?? xmax, n = o.n || 400, base = o.base ?? 0;
        P.clip(() => {
          ctx.globalAlpha = o.alfa ?? 0.25; ctx.fillStyle = o.color || col('c1');
          ctx.beginPath(); ctx.moveTo(X(a), Y(base));
          for (let i = 0; i <= n; i++) { const x = a + (b - a) * i / n; ctx.lineTo(X(x), Y(f(x))); }
          ctx.lineTo(X(b), Y(base)); ctx.closePath(); ctx.fill();
        });
      },
      punto(x, y, o = {}) {
        ctx.save(); ctx.fillStyle = o.color || col('c2');
        ctx.beginPath(); ctx.arc(X(x), Y(y), o.r || 5, 0, 7); ctx.fill();
        if (o.label) { ctx.font = '600 12px sans-serif'; ctx.textAlign = 'left'; ctx.fillText(o.label, X(x) + 8, Y(y) - 8); }
        ctx.restore();
      },
      hline(y, o = {}) {
        P.clip(() => {
          ctx.strokeStyle = o.color || col('muted'); ctx.lineWidth = o.ancho || 1.2; ctx.setLineDash(o.guiones || [5, 4]);
          ctx.beginPath(); ctx.moveTo(x0, Y(y)); ctx.lineTo(x0 + w, Y(y)); ctx.stroke();
        });
        if (o.label) P.texto(o.labelX ?? xmax, y, o.label, { color: o.color, align: 'right', base: 'bottom', dy: -3 });
      },
      vline(x, o = {}) {
        P.clip(() => {
          ctx.strokeStyle = o.color || col('muted'); ctx.lineWidth = o.ancho || 1.2; ctx.setLineDash(o.guiones || [5, 4]);
          ctx.beginPath(); ctx.moveTo(X(x), y0); ctx.lineTo(X(x), y0 + h); ctx.stroke();
        });
        if (o.label) P.texto(x, o.labelY ?? ymax, o.label, { color: o.color, align: 'left', base: 'top', dx: 4, dy: 3 });
      },
      texto(x, y, s, o = {}) {
        ctx.save(); ctx.fillStyle = o.color || col('ink'); ctx.font = o.font || '600 12px sans-serif';
        ctx.textAlign = o.align || 'left'; ctx.textBaseline = o.base || 'middle';
        ctx.fillText(s, X(x) + (o.dx || 0), Y(y) + (o.dy || 0)); ctx.restore();
      },
    };
    return P;
  }

  /** Bucle de animación que se detiene solo al cambiar de tema/pestaña */
  function loop(fn) {
    let id = 0, vivo = true, t0 = performance.now();
    const paso = (t) => { if (!vivo) return; fn((t - t0) / 1000); id = requestAnimationFrame(paso); };
    id = requestAnimationFrame(paso);
    const stop = () => { vivo = false; cancelAnimationFrame(id); };
    H._limpiezas.push(stop);
    return { stop };
  }

  /** Integral numérica (Simpson) */
  function integrar(f, a, b, n = 2000) {
    if (n % 2) n++;
    const hh = (b - a) / n; let s = f(a) + f(b);
    for (let i = 1; i < n; i++) s += f(a + i * hh) * (i % 2 ? 4 : 2);
    return s * hh / 3;
  }

  /** Resuelve Ax=b (Gauss) */
  function resolver(A, b) {
    const n = b.length; const M = A.map((r, i) => [...r, b[i]]);
    for (let c = 0; c < n; c++) {
      let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      [M[c], M[p]] = [M[p], M[c]];
      if (Math.abs(M[c][c]) < 1e-15) return null;
      for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
    }
    return M.map((r, i) => r[n] / r[i]);
  }

  /** Bisección para f(x)=0 en [a,b] */
  function biseccion(f, a, b, it = 80) {
    let fa = f(a);
    for (let i = 0; i < it; i++) { const m = (a + b) / 2, fm = f(m); if ((fm > 0) === (fa > 0)) { a = m; fa = fm; } else b = m; }
    return (a + b) / 2;
  }

  /** Dibuja un LED/lámpara con brillo 0..1 en canvas */
  function brillo(ctx, x, y, r, nivel, color = '#ff3b30') {
    nivel = Math.max(0, Math.min(1, nivel));
    ctx.save();
    if (nivel > 0.02) {
      const g = ctx.createRadialGradient(x, y, r * .2, x, y, r * 3.2);
      g.addColorStop(0, color); g.addColorStop(1, 'transparent');
      ctx.globalAlpha = 0.65 * nivel; ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r * 3.2, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.fillStyle = col('panel2'); ctx.strokeStyle = col('ink'); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    ctx.globalAlpha = 0.15 + 0.85 * nivel; ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
    ctx.restore();
  }

  return {
    _limpiezas: [], fmt, num, col, el, layout, slider, select, check, boton, titulo, sep, nota,
    lecturas, canvas, ticks, ejes, loop, integrar, resolver, biseccion, brillo,
    limpiar() { H._limpiezas.forEach(f => { try { f(); } catch (e) { } }); H._limpiezas = []; },
  };
})();

/* ---------------------------------------------------------------------
   Esq: esquemas eléctricos en SVG (para usar dentro del HTML de teoría)
   Uso:  Esq.svg(ancho, alto, [ Esq.R(x1,y1,x2,y2,'R1','1 kΩ'), Esq.cable([[..],[..]]), ... ], 'pie de figura')
   Todos los componentes de 2 terminales se dibujan entre (x1,y1) y (x2,y2)
   (horizontal o vertical, también diagonal). El cuerpo mide ~40 px.
   --------------------------------------------------------------------- */
const Esq = (() => {
  const S = 'stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"';
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');

  // Envoltorio genérico para 2 terminales: body(c) dibuja centrado en x=c sobre el eje x local.
  function dos(x1, y1, x2, y2, b, body, t, v, lado = 1, extra = '') {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ang = Math.atan2(dy, dx) * 180 / Math.PI;
    const c = L / 2;
    let g = `<g transform="translate(${x1},${y1}) rotate(${ang})"><path ${S} d="M0 0H${c - b / 2}M${c + b / 2} 0H${L}"/>${body(c)}</g>`;
    // etiquetas: perpendicular al componente
    const nx = -dy / L, ny = dx / L;           // normal (para horizontal izq->der apunta hacia abajo)
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const d = 22 * lado;
    const horizontal = Math.abs(dx) >= Math.abs(dy);
    if (t || v) {
      if (horizontal) {
        const ty = my - d * Math.sign(ny || 1);
        const ytxt = lado > 0 ? ty - 2 : ty + 12;
        g += `<text x="${mx}" y="${ytxt - (v && lado > 0 ? 12 : 0)}" text-anchor="middle" font-size="13" font-weight="600">${esc(t)}</text>`;
        if (v) g += `<text class="val" x="${mx}" y="${ytxt + (lado > 0 ? 0 : 14)}" text-anchor="middle" font-size="12">${esc(v)}</text>`;
      } else {
        const tx = mx + d;
        const anchor = lado > 0 ? 'start' : 'end';
        g += `<text x="${tx}" y="${my - (v ? 3 : -4)}" text-anchor="${anchor}" font-size="13" font-weight="600">${esc(t)}</text>`;
        if (v) g += `<text class="val" x="${tx}" y="${my + 13}" text-anchor="${anchor}" font-size="12">${esc(v)}</text>`;
      }
    }
    return g + extra;
  }

  const api = {
    /** Contenedor SVG */
    svg(w, h, partes, pie = '') {
      return `<figure class="figura"><svg class="esq" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${partes.join('')}</svg>${pie ? `<figcaption>${pie}</figcaption>` : ''}</figure>`;
    },
    /** Cable: polilínea [[x,y],[x,y],...] */
    cable(pts, clase = '') { return `<polyline class="${clase}" ${S} points="${pts.map(p => p.join(',')).join(' ')}"/>`; },
    /** Punto de unión */
    nodo(x, y) { return `<circle cx="${x}" cy="${y}" r="3.5" fill="currentColor"/>`; },
    /** Borne abierto (terminal) */
    borne(x, y, t = '', dx = 0, dy = -10) { return `<circle cx="${x}" cy="${y}" r="4" fill="var(--panel)" stroke="currentColor" stroke-width="2"/>${t ? `<text x="${x + dx}" y="${y + dy}" text-anchor="middle" font-size="13" font-weight="600">${esc(t)}</text>` : ''}`; },
    /** Texto libre */
    texto(x, y, s, op = {}) { return `<text x="${x}" y="${y}" text-anchor="${op.anchor || 'middle'}" font-size="${op.size || 13}" font-weight="${op.peso || 600}" ${op.color ? `fill="${op.color}" style="fill:${op.color}"` : ''}>${esc(s)}</text>`; },
    /** Flecha (para indicar corriente/tensión). color opcional */
    flecha(x1, y1, x2, y2, t = '', color = 'var(--c2)') {
      const a = Math.atan2(y2 - y1, x2 - x1), L = 9;
      const p1 = [x2 - L * Math.cos(a - .4), y2 - L * Math.sin(a - .4)], p2 = [x2 - L * Math.cos(a + .4), y2 - L * Math.sin(a + .4)];
      return `<g style="color:${color}"><path ${S} d="M${x1} ${y1}L${x2} ${y2}"/><path d="M${x2} ${y2}L${p1}L${p2}Z" fill="currentColor"/>${t ? `<text x="${(x1 + x2) / 2 + 8}" y="${(y1 + y2) / 2 - 6}" font-size="13" font-weight="700" style="fill:${color}">${esc(t)}</text>` : ''}</g>`;
    },
    /** Signos + y − de tensión sobre un componente */
    pm(xp, yp, xm, ym, color = 'var(--c1)') {
      return `<text x="${xp}" y="${yp + 5}" text-anchor="middle" font-size="16" font-weight="700" style="fill:${color}">+</text><text x="${xm}" y="${ym + 5}" text-anchor="middle" font-size="18" font-weight="700" style="fill:${color}">−</text>`;
    },
    R(x1, y1, x2, y2, t, v, lado) {
      return dos(x1, y1, x2, y2, 40, c => `<path ${S} d="M${c - 20} 0l3.3 -7l6.7 14l6.7 -14l6.7 14l6.7 -14l6.6 14l3.3 -7"/>`, t, v, lado);
    },
    /** Resistencia variable (potenciómetro como reóstato) */
    Rvar(x1, y1, x2, y2, t, v, lado) {
      return dos(x1, y1, x2, y2, 40, c => `<path ${S} d="M${c - 20} 0l3.3 -7l6.7 14l6.7 -14l6.7 14l6.7 -14l6.6 14l3.3 -7"/><path ${S} d="M${c - 16} 13L${c + 16} -13"/><path d="M${c + 16} -13l-8 1.5l4.5 5z" fill="currentColor"/>`, t, v, lado);
    },
    C(x1, y1, x2, y2, t, v, lado, polar = false) {
      return dos(x1, y1, x2, y2, 10, c => polar
        ? `<path ${S} d="M${c - 5} -13V13"/><path ${S} d="M${c + 7} -13q-4 13 0 26"/><text x="${c - 14}" y="-8" font-size="13" font-weight="700" text-anchor="middle" transform="rotate(0)">+</text>`
        : `<path ${S} d="M${c - 5} -13V13M${c + 5} -13V13"/>`, t, v, lado);
    },
    /** Batería / fuente CC: el terminal + está en (x1,y1) */
    bat(x1, y1, x2, y2, t, v, lado) {
      const py = (lado ?? 1) > 0 ? 20 : -10;   // el "+" va del lado opuesto a la etiqueta
      return dos(x1, y1, x2, y2, 8, c => `<path ${S} d="M${c - 4} -15V15"/><path stroke="currentColor" stroke-width="4" d="M${c + 4} -8V8"/><text x="${c - 12}" y="${py}" font-size="13" font-weight="700" text-anchor="middle">+</text>`, t, v, lado);
    },
    /** Fuente de tensión genérica (círculo con + −): + hacia (x1,y1) */
    fuenteV(x1, y1, x2, y2, t, v, lado) {
      return dos(x1, y1, x2, y2, 34, c => `<circle cx="${c}" cy="0" r="17" ${S}/><text x="${c - 8}" y="5" font-size="14" font-weight="700" text-anchor="middle" transform="rotate(90 ${c - 8} 0)">+</text><text x="${c + 8}" y="5" font-size="16" font-weight="700" text-anchor="middle" transform="rotate(90 ${c + 8} 0)">−</text>`, t, v, lado);
    },
    /** Fuente de corriente alterna (senoidal) */
    fuenteAC(x1, y1, x2, y2, t, v, lado) {
      return dos(x1, y1, x2, y2, 34, c => `<circle cx="${c}" cy="0" r="17" ${S}/><path ${S} d="M${c} -10c-7 0 -7 10 0 10s7 10 0 10" transform="rotate(90 ${c} 0) translate(0 -5)"/>`, t, v, lado);
    },
    /** Fuente de corriente: la flecha apunta de (x1,y1) hacia (x2,y2) (sentido en que empuja la corriente) */
    fuenteI(x1, y1, x2, y2, t, v, lado) {
      return dos(x1, y1, x2, y2, 34, c => `<circle cx="${c}" cy="0" r="17" ${S}/><path ${S} d="M${c - 9} 0H${c + 6}"/><path d="M${c + 10} 0l-8 -5v10z" fill="currentColor"/>`, t, v, lado);
    },
    /** Diodo: ánodo en (x1,y1), cátodo en (x2,y2) */
    D(x1, y1, x2, y2, t, v, lado) {
      return dos(x1, y1, x2, y2, 22, c => `<path d="M${c - 9} -10L${c + 7} 0L${c - 9} 10Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path ${S} d="M${c + 8} -11V11"/>`, t, v, lado);
    },
    /** Zener: ánodo (x1,y1), cátodo (x2,y2) */
    Dz(x1, y1, x2, y2, t, v, lado) {
      return dos(x1, y1, x2, y2, 22, c => `<path d="M${c - 9} -10L${c + 7} 0L${c - 9} 10Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path ${S} d="M${c + 3} -14L${c + 8} -11V11L${c + 13} 14"/>`, t, v, lado);
    },
    /** LED: ánodo (x1,y1), cátodo (x2,y2) */
    LED(x1, y1, x2, y2, t, v, lado, color = 'var(--c2)') {
      return dos(x1, y1, x2, y2, 22, c => `<path d="M${c - 9} -10L${c + 7} 0L${c - 9} 10Z" fill="currentColor" stroke="currentColor" stroke-width="1.5"/><path ${S} d="M${c + 8} -11V11"/><g style="color:${color}"><path ${S} d="M${c - 2} -13l7 -9M${c + 6} -11l7 -9"/><path d="M${c + 5} -22l-4.5 1.2l3.2 2.4zM${c + 13} -20l-4.5 1.2l3.2 2.4z" fill="currentColor" stroke="currentColor" stroke-width="1.5"/></g>`, t, v, lado);
    },
    /** LDR (fotorresistencia) */
    LDR(x1, y1, x2, y2, t, v, lado) {
      return dos(x1, y1, x2, y2, 36, c => `<rect x="${c - 18}" y="-8" width="36" height="16" rx="2" ${S}/><g style="color:var(--amber)"><path ${S} d="M${c - 14} -26l7 12M${c - 2} -26l7 12"/><path d="M${c - 7} -14l-.5 -5l-3.5 2zM${c + 5} -14l-.5 -5l-3.5 2z" fill="currentColor" stroke="currentColor" stroke-width="1.5"/></g>`, t, v, lado);
    },
    /** Termistor (NTC/PTC) */
    termistor(x1, y1, x2, y2, t, v, lado, tipo = 'NTC') {
      return dos(x1, y1, x2, y2, 36, c => `<rect x="${c - 18}" y="-8" width="36" height="16" rx="2" ${S}/><path ${S} d="M${c - 22} 14L${c - 12} 14L${c + 16} -16"/><text x="${c + 18}" y="20" font-size="10" font-weight="700">${tipo === 'PTC' ? '+t°' : '−t°'}</text>`, t, v, lado);
    },
    /** Lámpara */
    lampara(x1, y1, x2, y2, t, v, lado) {
      return dos(x1, y1, x2, y2, 30, c => `<circle cx="${c}" cy="0" r="15" ${S}/><path ${S} d="M${c - 10.6} -10.6L${c + 10.6} 10.6M${c - 10.6} 10.6L${c + 10.6} -10.6"/>`, t, v, lado);
    },
    /** Instrumento: círculo con letra (V, A, Ω) */
    medidor(x1, y1, x2, y2, letra = 'V', t, v, lado) {
      return dos(x1, y1, x2, y2, 32, c => `<circle cx="${c}" cy="0" r="16" ${S}/>`, t, v, lado,
        `<text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 + 5}" text-anchor="middle" font-size="15" font-weight="800">${esc(letra)}</text>`);
    },
    /** Interruptor abierto (cerrado=true lo dibuja cerrado) */
    llave(x1, y1, x2, y2, t, v, lado, cerrado = false) {
      return dos(x1, y1, x2, y2, 30, c => `<circle cx="${c - 15}" cy="0" r="2.5" fill="currentColor"/><circle cx="${c + 15}" cy="0" r="2.5" fill="currentColor"/><path ${S} d="M${c - 15} 0L${c + 14} ${cerrado ? 0 : -14}"/>`, t, v, lado);
    },
    /** Bobina */
    L(x1, y1, x2, y2, t, v, lado) {
      return dos(x1, y1, x2, y2, 40, c => `<path ${S} d="M${c - 20} 0a5 5 0 0 1 10 0a5 5 0 0 1 10 0a5 5 0 0 1 10 0a5 5 0 0 1 10 0"/>`, t, v, lado);
    },
    /** Motor (círculo con M) */
    motor(x1, y1, x2, y2, t, v, lado) {
      return dos(x1, y1, x2, y2, 32, c => `<circle cx="${c}" cy="0" r="16" ${S}/>`, t, v, lado,
        `<text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 + 5}" text-anchor="middle" font-size="15" font-weight="800">M</text>`);
    },
    /** Masa / tierra en (x,y) */
    masa(x, y) { return `<path ${S} d="M${x} ${y}v8M${x - 12} ${y + 8}h24M${x - 7} ${y + 13}h14M${x - 3} ${y + 18}h6"/>`; },
    /** Transformador. Terminales: P1(x,y) P2(x,y+80) S1(x+70,y) S2(x+70,y+80) toma central (x+70,y+40) si ct */
    trafo(x, y, ct = false, t = '') {
      const arcos = (dir) => 'a7.5 7.5 0 0 ' + dir + ' 0 15'.repeat(1) + (' a7.5 7.5 0 0 ' + dir + ' 0 15').repeat(3);
      return `<path ${S} d="M${x} ${y}H${x + 22}V${y + 10}${arcos(1)}V${y + 80}H${x}"/>` +
        `<path ${S} d="M${x + 70} ${y}H${x + 48}V${y + 10}${arcos(0)}V${y + 80}H${x + 70}"/>` +
        `<path ${S} d="M${x + 32} ${y + 6}V${y + 74}M${x + 38} ${y + 6}V${y + 74}"/>` +
        (ct ? `<path ${S} d="M${x + 48} ${y + 40}H${x + 70}"/>` : '') +
        (t ? `<text x="${x + 35}" y="${y - 8}" text-anchor="middle" font-size="13" font-weight="600">${esc(t)}</text>` : '');
    },
    /** BJT NPN (o PNP). Centro (x,y). Terminales: B(x-30,y) C(x+12,y-30) E(x+12,y+30) */
    bjt(x, y, tipo = 'NPN', t = '') {
      const pnp = tipo === 'PNP';
      const arrow = pnp
        ? `<path d="M${x - 4} ${y + 7}l9 1l-4 7z" fill="currentColor" stroke="currentColor" stroke-width="1"/>`
        : `<path d="M${x + 12} ${y + 18}l-9 -1.5l4.5 -6.5z" fill="currentColor" stroke="currentColor" stroke-width="1"/>`;
      return `<circle cx="${x + 3}" cy="${y}" r="21" ${S} stroke-width="1.6"/><path ${S} d="M${x - 30} ${y}H${x - 6}M${x - 6} ${y - 13}V${y + 13}M${x - 6} ${y - 6}L${x + 12} ${y - 18}V${y - 30}M${x - 6} ${y + 6}L${x + 12} ${y + 18}V${y + 30}"/>${arrow}` +
        (t ? `<text x="${x + 30}" y="${y + 5}" font-size="13" font-weight="600">${esc(t)}</text>` : '');
    },
    /** MOSFET canal N (o P) de enriquecimiento. Terminales: G(x-30,y+8) D(x+12,y-30) S(x+12,y+30) */
    mosfet(x, y, tipo = 'N', t = '') {
      const p = tipo === 'P';
      const arr = p
        ? `<path d="M${x + 4} ${y}l8 -4v8z" fill="currentColor"/>`
        : `<path d="M${x - 2} ${y}l8 -4v8z" fill="currentColor"/>`;
      return `<circle cx="${x + 3}" cy="${y}" r="21" ${S} stroke-width="1.6"/><path ${S} d="M${x - 30} ${y + 8}H${x - 9}M${x - 9} ${y - 12}V${y + 12}M${x - 3} ${y - 14}V${y - 7}M${x - 3} ${y - 3}V${y + 3}M${x - 3} ${y + 7}V${y + 14}M${x - 3} ${y - 10}H${x + 12}V${y - 30}M${x - 3} ${y + 10}H${x + 12}V${y + 30}M${x - 3} ${y}H${x + 12}V${y + 10}"/>${arr}` +
        (t ? `<text x="${x + 30}" y="${y + 5}" font-size="13" font-weight="600">${esc(t)}</text>` : '');
    },
    /** SCR vertical: Ánodo (x,y-30) arriba, Cátodo (x,y+30) abajo, Compuerta (x+26,y+22) */
    scr(x, y, t = '') {
      return `<path ${S} d="M${x} ${y - 30}V${y - 9}M${x} ${y + 9}V${y + 30}M${x - 11} ${y + 9}H${x + 11}M${x + 4} ${y + 9}L${x + 14} ${y + 22}H${x + 26}"/><path d="M${x - 10} ${y - 8}L${x + 10} ${y - 8}L${x} ${y + 8}Z" fill="currentColor" stroke="currentColor" stroke-width="1.5"/>` +
        (t ? `<text x="${x + 16}" y="${y - 6}" font-size="13" font-weight="600">${esc(t)}</text>` : '');
    },
    /** TRIAC vertical: MT2 (x,y-30), MT1 (x,y+30), G (x+26,y+22) */
    triac(x, y, t = '') {
      return `<path ${S} d="M${x} ${y - 30}V${y - 10}M${x} ${y + 10}V${y + 30}M${x - 16} ${y - 10}H${x + 16}M${x - 16} ${y + 10}H${x + 16}M${x + 8} ${y + 10}L${x + 16} ${y + 22}H${x + 26}"/><path d="M${x - 15} ${y - 10}L${x - 1} ${y - 10}L${x - 8} ${y + 10}Z" fill="currentColor"/><path d="M${x + 1} ${y + 10}L${x + 15} ${y + 10}L${x + 8} ${y - 10}Z" fill="currentColor"/>` +
        (t ? `<text x="${x + 20}" y="${y - 4}" font-size="13" font-weight="600">${esc(t)}</text>` : '');
    },
    /** DIAC entre (x1,y1)-(x2,y2) */
    diac(x1, y1, x2, y2, t, v, lado) {
      return dos(x1, y1, x2, y2, 22, c => `<path ${S} d="M${c - 10} -16V16M${c + 10} -16V16"/><path d="M${c - 10} -15L${c + 10} -7.5L${c - 10} 0Z" fill="currentColor"/><path d="M${c + 10} 0L${c - 10} 7.5L${c + 10} 15Z" fill="currentColor"/>`, t, v, lado);
    },
  };
  return api;
})();
