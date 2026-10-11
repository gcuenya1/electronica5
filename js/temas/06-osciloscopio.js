/* Tema 06 — Osciloscopios
   IMPORTANTE: los textos con LaTeX usan String.raw`...` para que "\frac" no se rompa. */
(() => {
  /* ---------- utilidades propias del tema ---------- */
  const DOSPI = 2 * Math.PI;
  const FORMAS = {
    sen: { t: 'Senoidal', f: (th) => Math.sin(th), rms: 1 / Math.SQRT2 },
    cuad: { t: 'Cuadrada', f: (th) => (((th % DOSPI) + DOSPI) % DOSPI) < Math.PI ? 1 : -1, rms: 1 },
    tri: { t: 'Triangular', f: (th) => (2 / Math.PI) * Math.asin(Math.max(-1, Math.min(1, Math.sin(th)))), rms: 1 / Math.sqrt(3) },
  };
  /** Fase (rad, 0..2π) donde la forma cruza el valor u (−1..1) con el flanco pedido */
  function faseDisparo(forma, u, subida) {
    let th;
    if (forma === 'sen') th = subida ? Math.asin(u) : Math.PI - Math.asin(u);
    else if (forma === 'tri') th = subida ? Math.PI * u / 2 : Math.PI - Math.PI * u / 2;
    else th = subida ? 0 : Math.PI;
    return ((th % DOSPI) + DOSPI) % DOSPI;
  }
  const VDIV = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10];
  const SDIV = [1e-6, 2e-6, 5e-6, 1e-5, 2e-5, 5e-5, 1e-4, 2e-4, 5e-4, 1e-3, 2e-3, 5e-3, 1e-2, 2e-2, 5e-2, 0.1];

  /** Geometría de la pantalla 10×8 dentro del canvas */
  function geo(w, h, franja = 34) {
    const s = Math.min((w - 16) / 10, (h - 14 - franja) / 8, 56);
    return { s, x0: Math.round((w - 10 * s) / 2), y0: 8, franjaY: 8 + 8 * s + 6 };
  }
  /** Cuadrícula estilo osciloscopio */
  function grilla(ctx, g, H) {
    const { s, x0, y0 } = g;
    ctx.save();
    ctx.strokeStyle = H.col('scope-grid'); ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 10; i++) { const x = Math.round(x0 + i * s) + .5; ctx.moveTo(x, y0); ctx.lineTo(x, y0 + 8 * s); }
    for (let j = 0; j <= 8; j++) { const y = Math.round(y0 + j * s) + .5; ctx.moveTo(x0, y); ctx.lineTo(x0 + 10 * s, y); }
    ctx.stroke();
    // ejes centrales con subdivisiones (5 por división)
    ctx.strokeStyle = '#3f7a62'; ctx.lineWidth = 1;
    ctx.beginPath();
    const xc = x0 + 5 * s, yc = y0 + 4 * s;
    for (let i = 0; i <= 50; i++) { const x = x0 + i * s / 5; ctx.moveTo(x, yc - 3); ctx.lineTo(x, yc + 3); }
    for (let j = 0; j <= 40; j++) { const y = y0 + j * s / 5; ctx.moveTo(xc - 3, y); ctx.lineTo(xc + 3, y); }
    ctx.stroke();
    ctx.strokeStyle = '#4f927a'; ctx.lineWidth = 1.2; ctx.strokeRect(x0 + .5, y0 + .5, 10 * s, 8 * s);
    ctx.restore();
  }
  /** Traza una curva yd = f(xd) en divisiones (x: 0..10, y: −4..4 respecto del centro) */
  function traza(ctx, g, f, color, op = {}) {
    const { s, x0, y0 } = g;
    ctx.save();
    ctx.beginPath(); ctx.rect(x0, y0, 10 * s, 8 * s); ctx.clip();
    ctx.globalAlpha = op.alfa ?? 1;
    ctx.strokeStyle = color; ctx.lineWidth = op.ancho || 2;
    ctx.shadowColor = color; ctx.shadowBlur = op.brillo ?? 6;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    const N = op.n || 1000;
    for (let i = 0; i <= N; i++) {
      const xd = 10 * i / N, yd = f(xd);
      const X = x0 + xd * s, Y = Math.max(y0 - 50, Math.min(y0 + 8 * s + 50, y0 + (4 - yd) * s));
      i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
    }
    ctx.stroke();
    ctx.restore();
  }
  /** Banda (cuando hay demasiados ciclos en pantalla y la traza se “empasta”) */
  function banda(ctx, g, ymin, ymax, color) {
    const { s, x0, y0 } = g;
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, 10 * s, 8 * s); ctx.clip();
    ctx.fillStyle = color; ctx.globalAlpha = 0.55; ctx.shadowColor = color; ctx.shadowBlur = 8;
    const Y1 = y0 + (4 - ymax) * s, Y2 = y0 + (4 - ymin) * s;
    ctx.fillRect(x0, Y1, 10 * s, Math.max(2, Y2 - Y1));
    ctx.restore();
  }
  const fmtDiv = (H, v, u) => H.fmt(v, u) + '/div';

  /** Pantalla en SVG (para la teoría). trazas: [{f:(xd)=>yd, c:'scope-c1'}], extra: svg string */
  function pantallaSVG(trazas, extra = '', pie = '', abajo = '', ancho = 400) {
    const s = 36, W = 10 * s + 20, Hh = 8 * s + (abajo ? 36 : 16);
    let g = `<rect x="0" y="0" width="${W}" height="${Hh}" rx="10" style="fill:var(--scope-bg)"/>`;
    const x0 = 10, y0 = 8;
    let lin = '';
    for (let i = 0; i <= 10; i++) lin += `M${x0 + i * s} ${y0}V${y0 + 8 * s}`;
    for (let j = 0; j <= 8; j++) lin += `M${x0} ${y0 + j * s}H${x0 + 10 * s}`;
    g += `<path d="${lin}" style="stroke:var(--scope-grid)" stroke-width="1" fill="none"/>`;
    let tk = '';
    for (let i = 0; i <= 50; i++) tk += `M${x0 + i * s / 5} ${y0 + 4 * s - 3}v6`;
    for (let j = 0; j <= 40; j++) tk += `M${x0 + 5 * s - 3} ${y0 + j * s / 5}h6`;
    g += `<path d="${tk}" stroke="#3f7a62" stroke-width="1" fill="none"/>`;
    for (const t of trazas) {
      let d = '';
      for (let i = 0; i <= 400; i++) { const xd = 10 * i / 400, yd = t.f(xd); if (!Number.isFinite(yd)) continue; d += (d ? 'L' : 'M') + (x0 + xd * s).toFixed(1) + ' ' + (y0 + (4 - yd) * s).toFixed(1); }
      g += `<path d="${d}" style="stroke:var(--${t.c || 'scope-c1'})" stroke-width="2.2" fill="none" stroke-linejoin="round"/>`;
    }
    g += extra;
    if (abajo) g += `<text x="${x0}" y="${y0 + 8 * s + 21}" font-size="12" font-family="monospace" style="fill:#9cc7b4">${abajo}</text>`;
    return `<figure class="figura"><svg viewBox="0 0 ${W} ${Hh}" width="${ancho}" style="max-width:100%;height:auto" xmlns="http://www.w3.org/2000/svg">${g}</svg>${pie ? `<figcaption>${pie}</figcaption>` : ''}</figure>`;
  }
  // coordenadas de la pantalla SVG (s=36, origen 10,8)
  const PX = (xd) => 10 + xd * 36, PY = (yd) => 8 + (4 - yd) * 36;
  const flechaSVG = (x1, y1, x2, y2, color = '#ffffff') => {
    const a = Math.atan2(y2 - y1, x2 - x1), L = 7;
    const p = (ang, x, y) => `${x - L * Math.cos(ang)},${y - L * Math.sin(ang)}`;
    return `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${color}" stroke-width="1.6"/>` +
      `<path d="M${x2} ${y2}L${p(a - .45, x2, y2)}L${p(a + .45, x2, y2)}Z" fill="${color}"/>` +
      `<path d="M${x1} ${y1}L${p(a + Math.PI - .45, x1, y1)}L${p(a + Math.PI + .45, x1, y1)}Z" fill="${color}"/>`;
  };
  const txtSVG = (x, y, t, color = '#ffffff', anchor = 'start') => `<text x="${x}" y="${y}" font-size="13" font-weight="700" text-anchor="${anchor}" fill="${color}" style="fill:${color}">${t}</text>`;

  // ---------- figuras de la teoría ----------
  const figLectura = pantallaSVG(
    [{ f: (x) => 3 * Math.sin(DOSPI * x / 4) }],
    flechaSVG(PX(1), PY(3), PX(1), PY(-3)) + txtSVG(PX(1) + 6, PY(0) - 6, '6 div') +
    flechaSVG(PX(0), PY(-3.55), PX(4), PY(-3.55), '#7ee0b0') + txtSVG(PX(2), PY(-3.55) - 6, '4 div = T', '#7ee0b0', 'middle') +
    `<path d="M${PX(0)} ${PY(3)}H${PX(10)}M${PX(0)} ${PY(-3)}H${PX(10)}" stroke="#ffffff" stroke-dasharray="4 4" stroke-width="1" opacity=".5"/>`,
    'Ejemplo 1: senoidal con 2 V/div y 1 ms/div.', 'CH1 2 V/div DC      M 1 ms/div      T CH1 ↑ 0 V'
  );
  const figDesfase = pantallaSVG(
    [{ f: (x) => 3 * Math.sin(DOSPI * x / 4) }, { f: (x) => 2 * Math.sin(DOSPI * (x - 0.5) / 4), c: 'scope-c2' }],
    flechaSVG(PX(0), PY(-0.6), PX(0.5), PY(-0.6), '#ffffff') + txtSVG(PX(0.6), PY(-0.6) + 16, 'Δt = 0,5 div') +
    `<path d="M${PX(0.5)} ${PY(0)}V${PY(-1)}" stroke="#ffffff" stroke-width="1" stroke-dasharray="3 3"/>` +
    txtSVG(PX(9.9), PY(3.4), 'CH1', '#f5d90a', 'end') + txtSVG(PX(9.9), PY(2.6), 'CH2', '#35d0ff', 'end'),
    'Ejemplo 3: CH2 atrasada 0,5 div respecto de CH1; el período ocupa 4 div.', 'CH1 1 V/div  CH2 1 V/div   M 0,5 ms/div'
  );
  const figAcDc = (ac) => pantallaSVG(
    [{ f: (x) => (ac ? -2.5 : 0) + ((((x / 4) % 1) + 1) % 1 < 0.5 ? 5 : 0) - 2 }],
    `<path d="M${PX(0)} ${PY(-2)}h-8" stroke="#f5d90a" stroke-width="2"/>` + txtSVG(PX(0) + 4, PY(-2) - 5, '1▸ 0 V', '#f5d90a'),
    ac ? 'Acoplamiento AC: se quita la continua y la señal queda centrada en 0.' : 'Acoplamiento DC: se ve la señal completa (0 a 5 V).',
    ac ? 'CH1 1 V/div AC' : 'CH1 1 V/div DC', 330
  );
  const figComp = (tipo) => pantallaSVG(
    [{
      f: (x) => {
        const per = 5, u = ((x % per) + per) % per, alto = u < per / 2, t = alto ? u : u - per / 2;
        const sig = alto ? 1 : -1, amp = 2.5;
        if (tipo === 'ok') return sig * amp;
        const e = Math.exp(-t / 0.35);
        return tipo === 'sub' ? sig * amp * (1 - 0.45 * e) : sig * amp * (1 + 0.45 * e);
      },
    }], '', tipo === 'ok' ? 'Compensada' : tipo === 'sub' ? 'Subcompensada (bordes redondeados)' : 'Sobrecompensada (picos)', '', 220
  );
  const figXY = pantallaSVG(
    [{ f: () => NaN }],
    (() => {
      let d = '';
      for (let i = 0; i <= 200; i++) { const th = DOSPI * i / 200; const x = 3 * Math.sin(th), y = 3 * Math.sin(th + Math.PI / 4); d += (i ? 'L' : 'M') + (10 + (5 + x) * 36).toFixed(1) + ' ' + PY(y).toFixed(1); }
      return `<path d="${d}" style="stroke:var(--scope-c1)" stroke-width="2.2" fill="none"/>` +
        flechaSVG(PX(5) + 14, PY(0), PX(5) + 14, PY(3 * Math.sin(Math.PI / 4))) + txtSVG(PX(5) + 20, PY(1.1), 'Y₀ = 2,1 div') +
        `<path d="M${PX(8.6)} ${PY(3)}H${PX(4.2)}" stroke="#fff" stroke-dasharray="3 3"/>` + txtSVG(PX(8.7), PY(3) + 4, 'Ymáx = 3 div');
    })(),
    'Modo XY con dos senoidales de igual frecuencia desfasadas 45°: sin φ = Y₀/Ymáx = 2,1/3 ≈ 0,707.', 'X = CH1   Y = CH2'
  );

  registrarTema({
    id: 'osciloscopio',
    orden: 6,
    titulo: 'Osciloscopios',
    resumen: 'Pantalla, V/div, s/div, disparo, puntas y cómo medir amplitud, frecuencia y desfase',
    confirmar: false,

    teoria: String.raw`
<p>El multímetro nos da <b>un número</b>. El osciloscopio nos muestra <b>la forma</b> de la tensión: es como un voltímetro que <b>dibuja</b> la tensión en función del tiempo, muy rápido. Con él vemos si una señal es senoidal o cuadrada, cuánto vale su pico, su frecuencia, si tiene ruido, cuánto <em>ripple</em> tiene una fuente, el ancho de un pulso PWM o si un transistor recorta la señal.</p>
<div class="caja idea"><span class="caja-titulo">La idea en una frase</span>
<b>Eje vertical = tensión</b> (volts por división) y <b>eje horizontal = tiempo</b> (segundos por división). Todo lo que se mide en la pantalla es <b>contar divisiones y multiplicar por la escala</b>.</div>

<h2>1. La pantalla y la cuadrícula</h2>
<p>La pantalla tiene una cuadrícula (retícula) de <b>10 divisiones horizontales × 8 verticales</b>. Cada división grande se subdivide en 5 partes (0,2 div) sobre los ejes centrales, para poder leer con más detalle.</p>
${pantallaSVG([{ f: (x) => 2.5 * Math.sin(DOSPI * x / 5) }], txtSVG(PX(10) - 4, PY(4) + 16, '10 div →', '#9cc7b4', 'end') + txtSVG(PX(0) + 6, PY(-4) - 8, '8 div ↑', '#9cc7b4'), 'Pantalla típica: 10 × 8 divisiones. La traza amarilla es el canal 1 (CH1).', 'CH1 1 V/div      M 1 ms/div')}

<h2>2. Controles verticales (uno por canal)</h2>
<ul>
<li><b>V/div (VOLTS/DIV):</b> cuántos volts vale cada división vertical. Los valores siguen la secuencia <b>1‑2‑5</b>: 10 mV, 20 mV, 50 mV, 0,1 V, 0,2 V, 0,5 V, 1 V, 2 V, 5 V… Si la señal se sale de la pantalla, <b>subí</b> los V/div; si se ve chiquita, <b>bajalos</b>.</li>
<li><b>Posición vertical:</b> sube o baja la traza. Una marquita a la izquierda (“1▸”) indica dónde está el <b>0 V</b> de ese canal.</li>
<li><b>Acoplamiento:</b>
  <ul>
  <li><b>DC:</b> entra la señal completa (continua + alterna). Es el modo “honesto”: usalo por defecto.</li>
  <li><b>AC:</b> un capacitor en serie bloquea la continua y se ve solo la parte alterna, centrada en 0. Sirve para ver una variación chica montada sobre una continua grande (ej. el <em>ripple</em> de 0,2 V de una fuente de 12 V).</li>
  <li><b>GND:</b> desconecta la señal y pone la entrada a 0 V: se ve una línea horizontal que marca dónde está el cero. Sirve para ubicar la referencia.</li>
  </ul></li>
</ul>
<div class="dos-col">
<div>${figAcDc(false)}</div>
<div>${figAcDc(true)}</div>
</div>

<h2>3. Controles horizontales</h2>
<ul>
<li><b>s/div (TIME/DIV, base de tiempo):</b> cuánto tiempo representa cada división horizontal; también en secuencia 1‑2‑5 (1 µs … 100 ms o más). Toda la pantalla muestra $10\cdot\text{s/div}$. Si ves demasiados ciclos “apretados”, <b>bajá</b> los s/div; si ves menos de un ciclo, <b>subilos</b>.</li>
<li><b>Posición horizontal:</b> corre la imagen hacia los costados.</li>
</ul>
<div class="caja tip"><span class="caja-titulo">Para elegir s/div rápido</span>
Para ver unos 2 ciclos: $\text{s/div}\approx\frac{2\,T}{10}=\frac{T}{5}$. Ejemplo: red de 50 Hz → $T=20\,\text{ms}$ → unos 4 ms/div → elegís <b>5 ms/div</b> (se ven 2,5 ciclos).
</div>

<h2>4. El disparo (trigger): por qué la imagen “corre”</h2>
<p>El osciloscopio dibuja la señal una y otra vez, barrido tras barrido, muchas veces por segundo. Si cada barrido arrancara en un punto cualquiera de la onda, cada dibujo quedaría corrido respecto del anterior y veríamos la imagen <b>correr</b> o un montón de ondas encimadas.</p>
<p>El <b>disparo</b> hace que cada barrido empiece <b>siempre en el mismo punto de la onda</b>: cuando la señal cruza un <b>nivel</b> de tensión elegido, con un <b>flanco</b> elegido (subiendo ↑ o bajando ↓). Así todos los dibujos coinciden y la imagen queda <b>quieta</b>.</p>
<div class="caja idea"><span class="caja-titulo">Analogía</span>
Pensá en sacar fotos de una calesita. Si sacás fotos en cualquier momento, el caballito aparece cada vez en otro lugar. Si sacás la foto <b>siempre cuando el caballito pasa frente a vos</b>, en todas aparece en el mismo lugar: eso es el disparo.</div>
<ul>
<li><b>Nivel (LEVEL):</b> la tensión a la que se dispara. Tiene que estar <b>dentro</b> del rango de la señal; si lo ponés más arriba del pico, nunca la cruza y no hay disparo.</li>
<li><b>Flanco (SLOPE):</b> ↑ subida o ↓ bajada.</li>
<li><b>Modo AUTO:</b> si no encuentra disparo, barre igual (la imagen corre, pero se ve algo). <b>NORMAL:</b> solo dibuja cuando hay disparo (si no hay, la pantalla queda vacía o congelada). <b>SINGLE:</b> captura una sola vez (ideal para eventos únicos, en digitales).</li>
<li><b>Fuente (SOURCE):</b> qué canal se usa para disparar (CH1, CH2, externo o la red).</li>
</ul>

<h2>5. Puntas ×1 y ×10</h2>
<p>La <b>punta</b> (sonda) conecta el circuito al osciloscopio. Tiene un gancho para la señal y un cocodrilo corto para la <b>masa</b>. Muchas tienen una llave ×1/×10:</p>
<ul>
<li><b>×1:</b> la señal pasa directa. El circuito “ve” la entrada del osciloscopio (1 MΩ en paralelo con unos 20 pF) más el cable (~100 pF): carga bastante y tiene poco ancho de banda.</li>
<li><b>×10:</b> la punta tiene una resistencia de 9 MΩ que forma un divisor con el 1 MΩ de la entrada: la señal llega <b>dividida por 10</b>, pero el circuito ve 10 MΩ y muy poca capacidad. Es la posición recomendada para casi todo.</li>
</ul>
<div class="caja ojo"><span class="caja-titulo">Configurá el osciloscopio igual que la punta</span>
Si usás la punta en ×10, el osciloscopio tiene que estar configurado en ×10 (en los digitales es un menú del canal; en los analógicos, multiplicás vos los V/div por 10). Si no, <b>todas las tensiones te van a dar 10 veces menos</b>.</div>
<p><b>Compensación:</b> la punta ×10 tiene un capacitor ajustable que hay que calibrar con la señal cuadrada de prueba que trae el osciloscopio (≈1 kHz, en un borne “CAL” o “PROBE COMP”). Se gira el tornillito hasta que la cuadrada se vea con bordes rectos:</p>
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px">${figComp('sub')}${figComp('ok')}${figComp('sobre')}</div>

<h2>6. Medir amplitud: $V_p$, $V_{pp}$ y $V_{ef}$</h2>
<div class="caja formula"><span class="caja-titulo">Contar divisiones y multiplicar</span>
$$V_{pp} = n_{div\,(pico\,a\,pico)}\cdot\frac{\text{V}}{\text{div}}\qquad V_p = \frac{V_{pp}}{2}\ \ (\text{si es simétrica})\qquad V_{ef}=\frac{V_p}{\sqrt2}\ \ (\text{solo senoidal})$$
</div>
<p>Conviene medir <b>pico a pico</b> (de la cresta al valle), porque no depende de dónde esté el cero. Para que la lectura sea precisa, ajustá V/div para que la señal ocupe <b>la mayor parte de la pantalla</b> sin salirse (igual que el último tercio del analógico).</p>

<h2>7. Medir período y frecuencia</h2>
<div class="caja formula"><span class="caja-titulo">Período y frecuencia</span>
$$T = n_{div\,(un\ ciclo)}\cdot\frac{\text{s}}{\text{div}}\qquad f=\frac{1}{T}$$
<p>Para medir mejor: contá <b>varios ciclos</b> y dividí. Ej.: si 3 ciclos ocupan 9,0 div, $T=3{,}0$ div por ciclo. Medí entre puntos fáciles de ver: dos cruces por cero subiendo, o dos picos.</p>
</div>
${figLectura}
<div class="caja ejemplo"><span class="caja-titulo">Ejemplo 1, paso a paso (figura de arriba: 2 V/div, 1 ms/div)</span>
<ol>
<li><b>Vertical:</b> de la cresta al valle hay <b>6 divisiones</b>. $V_{pp}=6\cdot2\,\text{V}=12\,\text{V}$ → $V_p=6\,\text{V}$.</li>
<li>Como es senoidal: $V_{ef}=\frac{6}{\sqrt2}=4{,}24\,\text{V}$ (eso marcaría un multímetro en V~).</li>
<li><b>Horizontal:</b> un ciclo completo ocupa <b>4 divisiones</b>. $T=4\cdot1\,\text{ms}=4\,\text{ms}$.</li>
<li>$f=\frac{1}{4\,\text{ms}}=250\,\text{Hz}$.</li>
</ol>
</div>
<div class="caja ejemplo"><span class="caja-titulo">Ejemplo 2: señal cuadrada TTL (las dos figuras de la sección 2)</span>
Con 1 V/div y acoplamiento DC la señal va de 0 a 5 div → <b>de 0 a 5 V</b>: es una señal lógica de 5 V. En AC se ve de −2,5 a +2,5 V: la forma es la misma, pero perdimos la información del nivel de continua. Por eso, <b>para señales digitales y PWM, siempre DC</b>.
</div>

<h2>8. Desfase entre dos canales</h2>
<p>Con dos canales a la misma frecuencia podemos medir cuánto está <b>atrasada o adelantada</b> una señal respecto de la otra (por ejemplo la tensión y la corriente en un circuito RC). Se mide el corrimiento en el tiempo $\Delta t$ entre dos puntos equivalentes (dos cruces por cero subiendo) y se compara con el período: un período completo son 360°.</p>
<div class="caja formula"><span class="caja-titulo">Desfase</span>
$$\varphi = \frac{\Delta t}{T}\cdot360^\circ$$
</div>
${figDesfase}
<div class="caja ejemplo"><span class="caja-titulo">Ejemplo 3 (figura de arriba, 0,5 ms/div)</span>
Período: 4 div → $T=4\cdot0{,}5=2\,\text{ms}$ ($f=500\,\text{Hz}$). Corrimiento entre los cruces por cero: 0,5 div → $\Delta t=0{,}25\,\text{ms}$. $\varphi=\frac{0{,}25}{2}\cdot360^\circ=45^\circ$, CH2 <b>atrasada</b> (cruza el cero después).
</div>

<h2>9. Modo XY y figuras de Lissajous</h2>
<p>En modo XY se apaga la base de tiempo: el canal 1 mueve el punto en horizontal y el canal 2 en vertical. Con dos senoidales aparecen las <b>figuras de Lissajous</b>:</p>
<ul>
<li>Misma frecuencia y en fase → una <b>recta</b> a 45°. Desfasadas 90° (y misma amplitud) → un <b>círculo</b>. Entre medio → una <b>elipse</b>: $\sin\varphi=\frac{Y_0}{Y_{máx}}$, donde $Y_0$ es donde la elipse corta el eje vertical.</li>
<li>Frecuencias distintas en relación entera (1:2, 2:3…) → figuras con “lazos”; la relación de frecuencias es la relación de cantidad de lóbulos que tocan los bordes horizontal y vertical.</li>
</ul>
${figXY}

<h2>10. ¡Cuidado con la masa de la punta!</h2>
<div class="caja ojo"><span class="caja-titulo">El cocodrilo de masa está conectado a tierra</span>
<p>En un osciloscopio de mesa, el cocodrilo de masa de <b>todas</b> las puntas está unido internamente al <b>chasis</b> y a la <b>tierra del tomacorriente</b> (la pata del medio de la ficha). Si conectás ese cocodrilo a un punto del circuito que <b>no</b> está a potencial de tierra (por ejemplo, un punto de un circuito conectado directo a la red, o el lado “negativo” de un puente rectificador sin transformador), hacés un <b>cortocircuito a tierra</b> a través de la punta: se queman pistas, la punta o el osciloscopio, y es peligroso.</p>
<ul>
<li>La masa de las dos puntas es <b>el mismo punto</b>: nunca conectes las dos masas a nodos distintos.</li>
<li>Para medir en circuitos conectados a la red se usa un <b>transformador de aislación</b> o una <b>punta diferencial</b>. Jamás se “desconecta la tierra” del osciloscopio.</li>
<li>Para medir una tensión entre dos puntos que no son masa, usá dos canales y la función <b>CH1 − CH2</b> (modo matemático).</li>
</ul>
</div>

<h2>11. El osciloscopio digital</h2>
<p>Los osciloscopios actuales son <b>digitales</b>: muestrean la señal con un conversor A/D muy rápido y la dibujan en una pantalla. Además de todo lo anterior, tienen:</p>
<ul>
<li><b>Medidas automáticas:</b> botón MEASURE → Vpp, Vmax, Vmin, Vrms, frecuencia, período, ciclo de trabajo, tiempo de subida… <em>Ojo:</em> son confiables solo si la señal está bien encuadrada (varios ciclos y ocupando buena parte de la pantalla).</li>
<li><b>Cursores:</b> dos líneas horizontales (miden ΔV) o verticales (miden Δt y 1/Δt) que movés con una perilla.</li>
<li><b>Botón AUTO (Autoset):</b> elige solo V/div, s/div y disparo. Útil para empezar, pero hay que saber ajustarlo.</li>
<li><b>Captura única (SINGLE), memoria, FFT</b> (espectro, como en el tema de armónicos) y guardado de imágenes en USB.</li>
<li><b>Ancho de banda y muestreo:</b> un osciloscopio de 100 MHz mide bien señales de hasta ~20–30 MHz (regla: ancho de banda ≥ 3–5 veces la frecuencia de la señal). Si la frecuencia de muestreo es baja respecto de la señal, aparece <b>aliasing</b>: se ve una onda falsa de frecuencia más baja.</li>
</ul>

<h2>12. Resumen: qué perilla mover</h2>
<div class="tabla-wrap"><table class="tabla">
<tr><th>Veo…</th><th>Hago…</th></tr>
<tr><td>La señal se sale por arriba/abajo</td><td>Subo V/div (o corrijo la posición)</td></tr>
<tr><td>Una señal chatita</td><td>Bajo V/div</td></tr>
<tr><td>Muchísimos ciclos amontonados (o una banda)</td><td>Bajo s/div</td></tr>
<tr><td>Menos de un ciclo, o una línea casi recta</td><td>Subo s/div</td></tr>
<tr><td>La imagen corre o hay varias ondas encimadas</td><td>Ajusto el nivel de disparo dentro de la señal; reviso la fuente de disparo</td></tr>
<tr><td>Nada en pantalla</td><td>Pruebo modo AUTO, acoplamiento GND para ubicar la traza, posición vertical, punta conectada</td></tr>
<tr><td>Tensiones 10 veces menores de lo esperado</td><td>Punta en ×10 y osciloscopio en ×1</td></tr>
</table></div>
`,

    simulaciones: [
      {
        titulo: 'Osciloscopio virtual + generador de funciones',
        descripcion: 'Elegí la señal del generador y ajustá el osciloscopio como uno real: V/div, s/div, posición, acoplamiento, disparo, punta y segundo canal.',
        montar(cont, H) {
          const { controles, vista } = H.layout(cont);
          H.titulo(controles, 'Generador de funciones');
          const forma = H.select(controles, { label: 'Forma de onda', value: 'sen', onChange: upd, opciones: Object.entries(FORMAS).map(([v, o]) => ({ v, t: o.t })) });
          const frec = H.slider(controles, { label: 'Frecuencia', min: 10, max: 100e3, log: true, value: 1000, unidad: 'Hz', onInput: upd });
          const amp = H.slider(controles, { label: 'Amplitud (pico)', min: 0.01, max: 10, log: true, value: 2, unidad: 'V', onInput: upd });
          const off = H.slider(controles, { label: 'Offset (continua)', min: -5, max: 5, step: 0.1, value: 0, fmt: v => H.num(v, 1) + ' V', onInput: upd });
          H.sep(controles);
          H.titulo(controles, 'Canal 1 (vertical)');
          const vdiv = H.select(controles, { label: 'V/div', value: '1', onChange: upd, opciones: VDIV.map(v => ({ v: String(v), t: fmtDiv(H, v, 'V') })) });
          const pos = H.slider(controles, { label: 'Posición vertical', min: -4, max: 4, step: 0.2, value: 0, fmt: v => H.num(v, 1) + ' div', onInput: upd });
          const acop = H.select(controles, { label: 'Acoplamiento', value: 'DC', onChange: upd, opciones: ['DC', 'AC', 'GND'] });
          const punta = H.select(controles, {
            label: 'Punta', value: 'x1', onChange: upd, opciones: [
              { v: 'x1', t: '×1 (osciloscopio en ×1)' }, { v: 'x10', t: '×10 (osciloscopio en ×10)' }, { v: 'x10mal', t: '×10 (¡osciloscopio en ×1!)' },
            ],
          });
          H.sep(controles);
          H.titulo(controles, 'Horizontal');
          const sdiv = H.select(controles, { label: 's/div', value: '0.0002', onChange: upd, opciones: SDIV.map(v => ({ v: String(v), t: fmtDiv(H, v, 's') })) });
          const hpos = H.slider(controles, { label: 'Posición horizontal', min: -5, max: 5, step: 0.1, value: 0, fmt: v => H.num(v, 1) + ' div', onInput: upd });
          H.sep(controles);
          H.titulo(controles, 'Disparo (trigger) sobre CH1');
          const trigOn = H.check(controles, { label: 'Disparo activado', value: true, onChange: upd });
          const modoT = H.select(controles, { label: 'Modo', value: 'auto', onChange: upd, opciones: [{ v: 'auto', t: 'AUTO' }, { v: 'normal', t: 'NORMAL' }] });
          const nivel = H.slider(controles, { label: 'Nivel', min: -10, max: 10, step: 0.05, value: 0, fmt: v => H.num(v, 2) + ' V', onInput: upd });
          const flanco = H.select(controles, { label: 'Flanco', value: 'sub', onChange: upd, opciones: [{ v: 'sub', t: '↑ Subida' }, { v: 'baj', t: '↓ Bajada' }] });
          H.sep(controles);
          H.titulo(controles, 'Canal 2');
          const ch2 = H.check(controles, { label: 'Mostrar CH2 (misma frecuencia)', value: false, onChange: upd });
          const desf = H.slider(controles, { label: 'Atraso de CH2', min: 0, max: 360, step: 5, value: 45, fmt: v => v + '°', onInput: upd });
          const amp2 = H.slider(controles, { label: 'Amplitud CH2 (pico)', min: 0.01, max: 10, log: true, value: 1.5, unidad: 'V', onInput: upd });
          const vdiv2 = H.select(controles, { label: 'V/div CH2', value: '1', onChange: upd, opciones: VDIV.map(v => ({ v: String(v), t: fmtDiv(H, v, 'V') })) });
          const pos2 = H.slider(controles, { label: 'Posición CH2', min: -4, max: 4, step: 0.2, value: 0, fmt: v => H.num(v, 1) + ' div', onInput: upd });
          const xy = H.check(controles, { label: 'Modo XY (X = CH1, Y = CH2)', value: false, onChange: upd });

          const cv = H.canvas(vista, { alto: (w) => { const s = Math.min((w - 16) / 10, 56); return Math.round(8 * s + 14 + 34); }, fondo: 'scope-bg', dibujar });
          const lec = H.lecturas(vista);
          const nota = H.nota(vista);

          let st = null, tAnim = 0, sucio = true;
          H.loop((t) => { tAnim = t; if (sucio || (st && st.corre)) { cv.redibujar(); sucio = false; } });

          function dibujar(ctx, w, h) {
            if (!st) return;
            const g = geo(w, h);
            grilla(ctx, g, H);
            const c1 = H.col('scope-c1'), c2 = H.col('scope-c2');
            const { T, sd, vd, vd2 } = st;
            // marcas de 0 V
            ctx.save(); ctx.font = '700 11px sans-serif'; ctx.textBaseline = 'middle'; ctx.textAlign = 'right';
            if (!st.xy) {
              const y1 = g.y0 + (4 - st.pos) * g.s; ctx.fillStyle = c1; ctx.fillText('1▸', g.x0 - 1, Math.max(g.y0, Math.min(g.y0 + 8 * g.s, y1)));
              if (st.ch2) { const y2 = g.y0 + (4 - st.pos2) * g.s; ctx.fillStyle = c2; ctx.fillText('2▸', g.x0 - 1, Math.max(g.y0, Math.min(g.y0 + 8 * g.s, y2 + 10))); }
            }
            ctx.restore();

            if (st.xy) {
              // Lissajous: un período
              const { s, x0, y0 } = g;
              ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, 10 * s, 8 * s); ctx.clip();
              ctx.strokeStyle = c1; ctx.lineWidth = 2; ctx.shadowColor = c1; ctx.shadowBlur = 6; ctx.beginPath();
              for (let i = 0; i <= 600; i++) {
                const tt = T * i / 600;
                const X = x0 + (5 + st.v1(tt) / vd + st.pos) * s, Y = y0 + (4 - st.v2(tt) / vd2 - st.pos2) * s;
                i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
              }
              ctx.stroke(); ctx.restore();
            } else {
              const ciclos = 10 * sd / T;
              const empastado = ciclos > 10 * g.s / 4;
              const N = Math.min(9000, Math.max(800, Math.ceil(ciclos * 80)));
              const dibCanal = (v, vdx, p, color, tL, alfa) => {
                if (empastado) { banda(ctx, g, st.vmin(v) / vdx + p, st.vmax(v) / vdx + p, color); return; }
                traza(ctx, g, (xd) => v(tL + xd * sd) / vdx + p, color, { n: N, alfa });
              };
              let tL;
              if (st.disparado) tL = st.tTrig - st.hpos * sd;
              else tL = tAnim * 0.37 * T + 0.123 * T;
              const mostrar = st.disparado || st.modo === 'auto' || !st.trigOn;
              if (mostrar) {
                if (st.corre && !empastado) {
                  dibCanal(st.v1, vd, st.pos, c1, tL + 0.33 * T, 0.25);
                  dibCanal(st.v1, vd, st.pos, c1, tL + 0.71 * T, 0.25);
                }
                dibCanal(st.v1, vd, st.pos, c1, tL, 1);
                if (st.ch2) dibCanal(st.v2, vd2, st.pos2, c2, tL, 1);
              } else {
                ctx.save(); ctx.fillStyle = '#ff8a7a'; ctx.font = '700 14px sans-serif'; ctx.textAlign = 'center';
                ctx.fillText('Trig? — esperando disparo (modo NORMAL)', g.x0 + 5 * g.s, g.y0 + 2 * g.s); ctx.restore();
              }
              // marcadores de disparo
              if (st.trigOn) {
                ctx.save(); ctx.fillStyle = '#ff9f43'; ctx.font = '700 11px sans-serif';
                const yl = g.y0 + (4 - st.nivel / vd - st.pos) * g.s;
                if (yl >= g.y0 && yl <= g.y0 + 8 * g.s) {
                  ctx.beginPath(); ctx.moveTo(g.x0 + 10 * g.s + 1, yl); ctx.lineTo(g.x0 + 10 * g.s + 8, yl - 5); ctx.lineTo(g.x0 + 10 * g.s + 8, yl + 5); ctx.fill();
                }
                const xt = g.x0 + st.hpos * g.s;
                if (xt >= g.x0 && xt <= g.x0 + 10 * g.s) { ctx.beginPath(); ctx.moveTo(xt, g.y0 + 7); ctx.lineTo(xt - 5, g.y0); ctx.lineTo(xt + 5, g.y0); ctx.fill(); }
                ctx.restore();
              }
            }
            // franja de lecturas
            ctx.save(); ctx.font = '600 11px "JetBrains Mono", monospace'; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
            const yF = g.franjaY;
            ctx.fillStyle = c1; ctx.fillText(`CH1 ${fmtDiv(H, vd, 'V')} ${st.acop}${st.punta !== 'x1' ? ' ×10' : ''}`, g.x0, yF);
            if (st.ch2) { ctx.fillStyle = c2; ctx.textAlign = 'right'; ctx.fillText(`CH2 ${fmtDiv(H, vd2, 'V')}`, g.x0 + 10 * g.s, yF); }
            ctx.textAlign = 'left'; ctx.fillStyle = '#9cc7b4';
            ctx.fillText(st.xy ? 'Modo XY' : `M ${fmtDiv(H, sd, 's')}`, g.x0, yF + 14);
            ctx.textAlign = 'right';
            ctx.fillStyle = st.trigOn ? (st.disparado ? '#7ee0b0' : '#ff8a7a') : '#9cc7b4';
            ctx.fillText(st.xy ? '' : st.trigOn ? `T CH1 ${st.flanco === 'sub' ? '↑' : '↓'} ${H.num(st.nivel, 2)} V ${st.disparado ? 'Trig\'d' : 'Trig?'}` : 'Disparo apagado', g.x0 + 10 * g.s, yF + 14);
            ctx.restore();
          }

          function upd() {
            const fo = forma.value, f = frec.value, A = amp.value, O = off.value, T = 1 / f;
            const k = punta.value === 'x10mal' ? 0.1 : 1; // factor de lo que se ve
            const ac = acop.value;
            const dc = ac === 'DC' ? O * k : 0, a = ac === 'GND' ? 0 : A * k, dcv = ac === 'GND' ? 0 : dc;
            const sh = FORMAS[fo].f, w0 = DOSPI * f;
            const v1 = (t) => dcv + a * sh(w0 * t);
            const phi = desf.value * Math.PI / 180;
            const A2 = amp2.value;
            const v2 = (t) => A2 * sh(w0 * t - phi);
            const vd = parseFloat(vdiv.value), vd2 = parseFloat(vdiv2.value), sd = parseFloat(sdiv.value);
            const niv = nivel.value, sub = flanco.value === 'sub';
            let disparado = false, tTrig = 0;
            if (trigOn.value && a > 0 && niv > dcv - a && niv < dcv + a) {
              disparado = true;
              tTrig = faseDisparo(fo, (niv - dcv) / a, sub) / w0;
            }
            const corre = !xy.value && (!trigOn.value || (!disparado && modoT.value === 'auto')) && a > 0;
            st = {
              T, sd, vd, vd2, v1, v2, pos: pos.value, pos2: pos2.value, hpos: hpos.value, ch2: ch2.value, xy: xy.value,
              disparado, tTrig, corre, trigOn: trigOn.value, modo: modoT.value, nivel: niv, flanco: flanco.value, acop: ac, punta: punta.value,
              vmin: (v) => v === v1 ? dcv - a : -A2, vmax: (v) => v === v1 ? dcv + a : A2,
            };
            sucio = true;
            // lecturas
            const Vpp = 2 * a, divpp = Vpp / vd, divT = T / sd, ciclos = 10 * sd / T;
            const rmsAC = a * FORMAS[fo].rms, rmsTot = Math.sqrt(dcv * dcv + rmsAC * rmsAC);
            const fuera = (dcv + a) / vd + pos.value > 4 || (dcv - a) / vd + pos.value < -4;
            const items = [
              { k: 'Vpp en pantalla', v: H.fmt(Vpp, 'V'), estado: fuera ? 'mal' : '' },
              { k: 'Divisiones pico a pico', v: H.num(divpp, 2) + ' div', estado: fuera ? 'mal' : divpp < 2 ? 'alerta' : 'ok' },
              { k: 'Período T', v: H.fmt(T, 's') },
              { k: 'Divisiones por período', v: H.num(divT, 2) + ' div', estado: divT > 10 ? 'alerta' : ciclos > 10 ? 'alerta' : 'ok' },
              { k: 'Frecuencia', v: H.fmt(f, 'Hz') },
              { k: 'Vrms (parte alterna)', v: H.fmt(rmsAC, 'V') },
            ];
            if (ac === 'DC' && Math.abs(dcv) > 1e-9) items.push({ k: 'Vrms total (con continua)', v: H.fmt(rmsTot, 'V') });
            if (ch2.value) items.push({ k: 'Desfase CH2: Δt', v: H.fmt(desf.value / 360 * T, 's') + ' (' + H.num(desf.value / 360 * T / sd, 2) + ' div)' });
            lec.set(items);
            // nota explicativa
            const n = [];
            if (ac === 'GND') n.push('<b>Acoplamiento GND:</b> la entrada está a 0 V; la línea marca dónde está el cero del canal 1. Usalo para ubicar la referencia y volvé a DC.');
            else {
              n.push(`<b>Lectura:</b> la señal ocupa <b>${H.num(divpp, 2)} div</b> de pico a pico × ${fmtDiv(H, vd, 'V')} = <b>${H.fmt(Vpp, 'V')}</b>. Un período ocupa <b>${H.num(divT, 2)} div</b> × ${fmtDiv(H, sd, 's')} = <b>${H.fmt(T, 's')}</b> → f = 1/T = <b>${H.fmt(f, 'Hz')}</b>.`);
              if (fuera) n.push('<b>La señal se sale de la pantalla:</b> subí los V/div (o corregí la posición/offset).');
              else if (divpp < 2) n.push('La señal ocupa poca altura: bajá los V/div para leer con más precisión.');
              if (ciclos > 10 * 8) n.push('<b>Demasiados ciclos en pantalla</b> (' + H.num(ciclos, 0) + '): la traza se “empasta”. Bajá los s/div.');
              else if (divT > 10) n.push('<b>Se ve menos de un ciclo:</b> subí los s/div para ver al menos uno completo.');
              if (ac === 'AC' && Math.abs(O) > 0.05) n.push('Acoplamiento AC: el offset de ' + H.num(O, 1) + ' V no se ve (el capacitor de entrada bloquea la continua). En DC aparecería.');
              if (punta.value === 'x10mal') n.push('<b>Punta en ×10 pero osciloscopio en ×1:</b> todo se ve 10 veces más chico. La señal real tiene ' + H.fmt(2 * A, 'V') + ' pico a pico.');
              if (punta.value === 'x10') n.push('Punta ×10 con el osciloscopio en ×10: la entrada recibe la señal dividida por 10, pero el instrumento lo compensa y los V/div que ves ya son los reales.');
            }
            if (!xy.value) {
              if (!trigOn.value) n.push('<b>Disparo apagado:</b> cada barrido empieza en un punto distinto de la onda y la imagen corre. Activalo.');
              else if (!disparado && ac !== 'GND') n.push(`<b>Sin disparo:</b> el nivel (${H.num(niv, 2)} V) está fuera del rango de la señal (${H.num(dcv - a, 2)} a ${H.num(dcv + a, 2)} V), así que nunca lo cruza. ${modoT.value === 'auto' ? 'En AUTO barre igual y la imagen corre.' : 'En NORMAL no dibuja nada.'} Llevá el nivel dentro de la señal.`);
              else if (disparado) n.push(`Disparo en ${H.num(niv, 2)} V con flanco de ${sub ? 'subida' : 'bajada'}: cada barrido empieza en ese punto (triangulito naranja arriba), por eso la imagen queda quieta.`);
            }
            if (ch2.value && !xy.value) n.push(`CH2 está atrasada ${desf.value}°: Δt = ${desf.value}/360 × T = ${H.fmt(desf.value / 360 * T, 's')}. Verificalo contando divisiones entre los cruces por cero.`);
            if (xy.value) n.push(`<b>Modo XY:</b> figura de Lissajous con desfase ${desf.value}°. ${desf.value % 180 === 0 ? 'En fase (o a 180°) es una recta.' : desf.value % 90 === 0 ? 'A 90° es una elipse con ejes alineados (círculo si los dos canales ocupan lo mismo).' : 'Elipse inclinada: sin φ = Y₀/Ymáx.'}`);
            nota.innerHTML = n.join('<br>');
          }
          upd();
        },
      },
      {
        titulo: 'Desafío de lectura',
        descripcion: 'Leé la pantalla como en un parcial: contá divisiones, multiplicá por la escala y calculá Vpp y frecuencia. Se acepta un error de hasta 5 %.',
        montar(cont, H) {
          const { controles, vista } = H.layout(cont);
          H.titulo(controles, 'Tu respuesta');
          const campo = (label, unidades) => {
            const w = H.el('div', { class: 'ctrl' });
            w.append(H.el('label', {}, `<span>${label}</span>`));
            const fila = H.el('div', { style: 'display:flex;gap:6px' });
            const i = H.el('input', { type: 'text', inputmode: 'decimal', class: 'campo', placeholder: 'ej. 2,5', style: 'flex:1;min-width:0' });
            const s = H.el('select', { class: 'campo', style: 'width:auto' });
            unidades.forEach(([v, t]) => s.append(H.el('option', { value: v }, t)));
            fila.append(i, s); w.append(fila); controles.append(w);
            return {
              get value() { const x = parseFloat(String(i.value).replace(',', '.')); return Number.isFinite(x) ? x * parseFloat(s.value) : NaN; },
              limpiar() { i.value = ''; }, input: i,
            };
          };
          const rVpp = campo('Vpp', [['1', 'V'], ['0.001', 'mV']]);
          const rF = campo('Frecuencia', [['1', 'Hz'], ['1000', 'kHz']]);
          const fila = H.el('div', { style: 'display:flex;gap:6px;flex-wrap:wrap' }); controles.append(fila);
          H.boton(fila, 'Comprobar', comprobar, 'btn primario');
          H.boton(fila, 'Ver respuesta', () => { verResp = true; mostrarResp(); cv.redibujar(); }, 'btn');
          H.boton(controles, 'Nueva señal', nueva, 'btn');
          const marcador = H.el('div', { class: 'sim-nota' }); controles.append(marcador);

          const cv = H.canvas(vista, { alto: (w) => { const s = Math.min((w - 16) / 10, 56); return Math.round(8 * s + 14 + 34); }, fondo: 'scope-bg', dibujar });
          const res = H.nota(vista);
          const VD = [0.05, 0.1, 0.2, 0.5, 1, 2, 5], SD = [1e-5, 2e-5, 5e-5, 1e-4, 2e-4, 5e-4, 1e-3, 2e-3, 5e-3];
          let sg = null, verResp = false, aciertos = 0, intentos = 0;
          const azar = (arr) => arr[Math.floor(Math.random() * arr.length)];
          function nueva() {
            const fo = azar(['sen', 'sen', 'cuad', 'tri']);
            const vd = azar(VD), sd = azar(SD);
            const npp = 2 * (10 + Math.floor(Math.random() * 28)) / 10;   // 2,0 … 7,4 div (pico múltiplo de 0,1)
            const nT = (8 + Math.floor(Math.random() * 33)) / 5;          // 1,6 … 8,0 div
            const fase = Math.random() * 0.6;                              // corrimiento horizontal en div
            sg = { fo, vd, sd, npp, nT, fase, Vpp: npp * vd, T: nT * sd, f: 1 / (nT * sd) };
            verResp = false; rVpp.limpiar(); rF.limpiar();
            res.innerHTML = 'Contá las divisiones de la señal en la pantalla. Las escalas están abajo a la izquierda.';
            cv.redibujar();
          }
          function dibujar(ctx, w, h) {
            if (!sg) return;
            const g = geo(w, h);
            grilla(ctx, g, H);
            const c1 = H.col('scope-c1');
            const sh = FORMAS[sg.fo].f;
            traza(ctx, g, (xd) => (sg.npp / 2) * sh(DOSPI * (xd - sg.fase) / sg.nT), c1, { n: 1200 });
            ctx.save(); ctx.font = '700 11px sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillStyle = c1;
            ctx.fillText('1▸', g.x0 - 1, g.y0 + 4 * g.s); ctx.restore();
            ctx.save(); ctx.font = '600 11px "JetBrains Mono", monospace'; ctx.textBaseline = 'top'; ctx.fillStyle = c1;
            ctx.fillText(`CH1 ${fmtDiv(H, sg.vd, 'V')} DC`, g.x0, g.franjaY);
            ctx.fillStyle = '#9cc7b4'; ctx.fillText(`M ${fmtDiv(H, sg.sd, 's')}`, g.x0, g.franjaY + 14);
            ctx.textAlign = 'right'; ctx.fillStyle = '#7ee0b0'; ctx.fillText(`T CH1 ↑ 0 V Trig'd`, g.x0 + 10 * g.s, g.franjaY + 14);
            ctx.restore();
            if (verResp) {
              const X = (xd) => g.x0 + xd * g.s, Y = (yd) => g.y0 + (4 - yd) * g.s;
              const flecha = (x1, y1, x2, y2, col) => {
                ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
                const a = Math.atan2(y2 - y1, x2 - x1);
                for (const [x, y, an] of [[x2, y2, a], [x1, y1, a + Math.PI]]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 8 * Math.cos(an - .45), y - 8 * Math.sin(an - .45)); ctx.lineTo(x - 8 * Math.cos(an + .45), y - 8 * Math.sin(an + .45)); ctx.fill(); }
              };
              ctx.save();
              ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1;
              ctx.beginPath(); ctx.moveTo(g.x0, Y(sg.npp / 2)); ctx.lineTo(g.x0 + 10 * g.s, Y(sg.npp / 2)); ctx.moveTo(g.x0, Y(-sg.npp / 2)); ctx.lineTo(g.x0 + 10 * g.s, Y(-sg.npp / 2)); ctx.stroke();
              ctx.setLineDash([]);
              const xa = Math.min(9.5, sg.fase + sg.nT / 4 + 0.15);
              flecha(X(xa), Y(sg.npp / 2), X(xa), Y(-sg.npp / 2), '#ffffff');
              ctx.font = '700 12px sans-serif'; ctx.fillStyle = '#ffffff'; ctx.textBaseline = 'middle';
              ctx.fillText(H.num(sg.npp, 1) + ' div', X(xa) + 6, Y(0) + 12);
              const xb = sg.fase, xe = sg.fase + sg.nT, yb = -sg.npp / 2 - 0.35 < -3.8 ? 3.7 : -sg.npp / 2 - 0.35;
              flecha(X(xb), Y(yb), X(Math.min(10, xe)), Y(yb), '#7ee0b0');
              ctx.fillStyle = '#7ee0b0'; ctx.textAlign = 'center'; ctx.fillText('T = ' + H.num(sg.nT, 1) + ' div', X((xb + Math.min(10, xe)) / 2), Y(yb) + (yb > 0 ? 14 : -12));
              ctx.restore();
            }
          }
          function mostrarResp() {
            const rms = sg.Vpp / 2 * FORMAS[sg.fo].rms;
            res.innerHTML = `<b>Razonamiento:</b><br>
              • Vertical: la señal ocupa <b>${H.num(sg.npp, 1)} div</b> de pico a pico → V<sub>pp</sub> = ${H.num(sg.npp, 1)} div × ${fmtDiv(H, sg.vd, 'V')} = <b>${H.fmt(sg.Vpp, 'V')}</b> (V<sub>p</sub> = ${H.fmt(sg.Vpp / 2, 'V')}; como es ${FORMAS[sg.fo].t.toLowerCase()}, V<sub>ef</sub> = ${H.fmt(rms, 'V')}).<br>
              • Horizontal: un ciclo ocupa <b>${H.num(sg.nT, 1)} div</b> → T = ${H.num(sg.nT, 1)} div × ${fmtDiv(H, sg.sd, 's')} = <b>${H.fmt(sg.T, 's')}</b>.<br>
              • Frecuencia: f = 1/T = 1/${H.fmt(sg.T, 's')} = <b>${H.fmt(sg.f, 'Hz')}</b>.`;
          }
          function comprobar() {
            const v = rVpp.value, f = rF.value;
            if (!Number.isFinite(v) || !Number.isFinite(f)) { res.innerHTML = 'Completá los dos valores (podés usar coma decimal) y elegí la unidad.'; return; }
            const eV = Math.abs(v - sg.Vpp) / sg.Vpp, eF = Math.abs(f - sg.f) / sg.f;
            const okV = eV <= 0.05, okF = eF <= 0.05;
            intentos++; if (okV && okF) aciertos++;
            marcador.innerHTML = `<b>Aciertos:</b> ${aciertos} de ${intentos}`;
            const msg = (ok, e, nom) => ok ? `<span style="color:var(--green)"><b>✔ ${nom} correcto</b></span> (diferencia ${H.num(e * 100, 1)} %)` :
              `<span style="color:var(--red)"><b>✘ ${nom} incorrecto</b></span> (te alejaste ${H.num(e * 100, 0)} %)` + (Math.abs(Math.log10(e + 1)) > 0.9 ? ' — ¿revisaste la unidad o el prefijo (m, µ, k)?' : '');
            res.innerHTML = msg(okV, eV, 'Vpp') + '<br>' + msg(okF, eF, 'Frecuencia') +
              (okV && okF ? '<br>¡Muy bien! Probá con otra señal.' : '<br>Pista: contá divisiones grandes y subdivisiones (cada rayita del eje central es 0,2 div). Si no te sale, tocá “Ver respuesta”.');
          }
          [rVpp.input, rF.input].forEach(i => i.addEventListener('keydown', (e) => { if (e.key === 'Enter') comprobar(); }));
          marcador.innerHTML = '<b>Aciertos:</b> 0 de 0';
          nueva();
        },
      },
    ],

    ejercicios: [
      {
        nivel: 'Básico',
        enunciado: String.raw`Una señal senoidal ocupa 6,4 divisiones de pico a pico con el canal en 0,5 V/div. Calculá $V_{pp}$, $V_p$ y el valor eficaz.`,
        pista: String.raw`Divisiones × V/div. Después $V_p=V_{pp}/2$ y $V_{ef}=V_p/\sqrt2$.`,
        solucion: String.raw`$V_{pp}=6{,}4\cdot0{,}5=3{,}2\,\text{V}$; $V_p=1{,}6\,\text{V}$; $V_{ef}=\frac{1{,}6}{\sqrt2}=1{,}13\,\text{V}$.`,
      },
      {
        nivel: 'Básico',
        enunciado: String.raw`Con la base de tiempo en 0,2 ms/div, un ciclo completo de una señal ocupa 5 divisiones. ¿Cuál es el período y la frecuencia?`,
        pista: String.raw`$T=n_{div}\cdot\text{s/div}$ y $f=1/T$.`,
        solucion: String.raw`$T=5\cdot0{,}2\,\text{ms}=1\,\text{ms}$ → $f=\frac{1}{1\,\text{ms}}=1000\,\text{Hz}=1\,\text{kHz}$.`,
      },
      {
        nivel: 'Intermedio',
        enunciado: String.raw`Querés ver en el osciloscopio el secundario de un transformador de 220 V / 12 V (50 Hz). ¿Qué V/div elegís para que entre completa en las 8 divisiones? ¿Y qué s/div para ver entre 2 y 3 ciclos?`,
        pista: String.raw`12 V es el valor eficaz: calculá el pico y el pico a pico. Período de 50 Hz = 20 ms; la pantalla tiene 10 divisiones.`,
        solucion: String.raw`$V_p=12\sqrt2=16{,}97\,\text{V}$, $V_{pp}=33{,}9\,\text{V}$. Necesitás al menos $33{,}9/8=4{,}24\,\text{V/div}$ → <b>5 V/div</b> (ocupa 6,8 div).<br>
        2 a 3 ciclos = 40 a 60 ms en 10 div → 4 a 6 ms/div → <b>5 ms/div</b> (50 ms en pantalla = 2,5 ciclos).`,
      },
      {
        nivel: 'Intermedio',
        enunciado: String.raw`Dos señales de 1 kHz se ven en CH1 y CH2 con 50 µs/div. Los cruces por cero (subiendo) están separados 2 divisiones. ¿Cuál es el desfase en grados?`,
        pista: String.raw`$\Delta t$ = divisiones × s/div. $\varphi=\frac{\Delta t}{T}\cdot360^\circ$.`,
        solucion: String.raw`$\Delta t=2\cdot50\,\mu\text{s}=100\,\mu\text{s}$; $T=1\,\text{ms}$. $\varphi=\frac{0{,}1}{1}\cdot360^\circ=36^\circ$.`,
      },
      {
        nivel: 'Intermedio',
        enunciado: String.raw`Una fuente de 12 V tiene un <em>ripple</em> (ondulación) de unos 0,3 V pico a pico. Con acoplamiento DC y 5 V/div, ¿cuántas divisiones ocupa el ripple? ¿Cómo harías para verlo bien?`,
        pista: String.raw`Calculá 0,3 V / 5 V/div. Pensá qué acoplamiento quita la continua de 12 V.`,
        solucion: String.raw`En DC con 5 V/div: $0{,}3/5=0{,}06\,\text{div}$: invisible (más finito que la traza). Pasando a <b>acoplamiento AC</b> se elimina la continua de 12 V y se puede bajar a <b>0,1 V/div</b>: el ripple ocupa $0{,}3/0{,}1=3\,\text{div}$, se ve perfecto.`,
      },
      {
        nivel: 'Avanzado',
        enunciado: String.raw`Un alumno mide con una punta en ×10, pero dejó el osciloscopio configurado en ×1. Con 1 V/div ve una senoidal de 1,2 div pico a pico. ¿Cuánto cree que mide y cuál es el valor real? ¿Cuál es el valor eficaz real?`,
        pista: String.raw`La punta divide por 10 y el osciloscopio no lo compensa.`,
        solucion: String.raw`Cree que $V_{pp}=1{,}2\cdot1=1{,}2\,\text{V}$. La señal real es 10 veces mayor: $V_{pp}=12\,\text{V}$, $V_p=6\,\text{V}$, $V_{ef}=6/\sqrt2=4{,}24\,\text{V}$.`,
      },
      {
        nivel: 'Avanzado',
        enunciado: String.raw`Se ve una señal PWM con acoplamiento DC, 1 V/div y 0,1 ms/div. Va de 0 a 5 divisiones. El nivel alto dura 1,5 div y el período es de 5 div. Calculá: amplitud, frecuencia, ciclo de trabajo y valor medio. ¿Qué se vería en acoplamiento AC?`,
        pista: String.raw`$D=t_{on}/T$ y $V_{med}=D\cdot V_{alto}$ (tema de PWM). En AC la señal se corre hasta que su valor medio quede en 0.`,
        solucion: String.raw`Amplitud: 0 a 5 V. $T=5\cdot0{,}1=0{,}5\,\text{ms}$ → $f=2\,\text{kHz}$. $t_{on}=0{,}15\,\text{ms}$ → $D=\frac{0{,}15}{0{,}5}=30\,\%$. $V_{med}=0{,}3\cdot5=1{,}5\,\text{V}$.<br>
        En AC se resta el valor medio: el nivel alto queda en $5-1{,}5=+3{,}5\,\text{V}$ y el bajo en $-1{,}5\,\text{V}$. Por eso las señales PWM se miden en DC.`,
      },
    ],

    quiz: [
      { pregunta: 'En un osciloscopio, el eje horizontal representa…', opciones: ['La tensión', 'La corriente', 'El tiempo', 'La frecuencia'], correcta: 2, explicacion: 'Vertical = tensión (V/div), horizontal = tiempo (s/div).' },
      { pregunta: 'La señal ocupa 4 div de pico a pico con 2 V/div. ¿Cuánto vale Vpp?', opciones: ['2 V', '4 V', '8 V', '0,5 V'], correcta: 2, explicacion: '4 div × 2 V/div = 8 V pico a pico (4 V de pico).' },
      { pregunta: 'La imagen “corre” horizontalmente y no se queda quieta. ¿Qué ajustás?', opciones: ['V/div', 'El disparo (nivel dentro de la señal)', 'El acoplamiento a GND', 'La intensidad'], correcta: 1, explicacion: 'Sin disparo cada barrido arranca en otro punto de la onda. Con el nivel dentro del rango de la señal, todos los barridos coinciden.' },
      { pregunta: 'Querés ver un ripple de 50 mV sobre una continua de 12 V. El acoplamiento adecuado es…', opciones: ['DC', 'AC', 'GND', 'Da lo mismo'], correcta: 1, explicacion: 'AC bloquea la continua y permite bajar los V/div para ver la variación chica.' },
      { pregunta: 'Un ciclo ocupa 4 div con 0,5 ms/div. La frecuencia es…', opciones: ['2 kHz', '500 Hz', '200 Hz', '8 kHz'], correcta: 1, explicacion: 'T = 4 × 0,5 ms = 2 ms → f = 1/2 ms = 500 Hz.' },
      { pregunta: '¿Por qué es peligroso conectar el cocodrilo de masa de la punta a cualquier punto de un circuito conectado a la red?', opciones: ['Porque la punta mide mal', 'Porque la masa de la punta está unida a la tierra del enchufe y puede hacer un cortocircuito', 'Porque se descompensa la punta', 'No es peligroso'], correcta: 1, explicacion: 'La masa de la punta es la tierra de protección del osciloscopio: si el punto tiene tensión respecto de tierra, hay cortocircuito por la punta.' },
    ],

    docente: String.raw`
<h3>Objetivo de la clase</h3>
<p>Que el alumno pueda <b>leer</b> una pantalla de osciloscopio (Vpp, Vp, Vef, T, f y desfase) contando divisiones, y que entienda <b>qué hace cada control</b> (V/div, s/div, posición, acoplamiento, disparo, punta). <b>Duración sugerida:</b> 2 clases de 60–80 min (1.ª: pantalla, controles, amplitud y frecuencia; 2.ª: disparo, dos canales, puntas, seguridad, desafío).</p>
<h3>Secuencia sugerida</h3>
<ol>
<li><b>Disparador (5 min):</b> “Un multímetro te dice 5 V en una salida PWM… ¿cómo sabés si es una continua de 5 V o un pulso de 0–10 V con 50 %?” Necesitamos ver la <b>forma</b>.</li>
<li><b>Pantalla y escalas (10 min):</b> figura de la sección 1 y ejemplo 1. Remarcá: “todo es contar divisiones × escala”.</li>
<li><b>Osciloscopio virtual (25 min):</b> con la senoidal de 1 kHz y 2 V de pico, pedile que lea Vpp y f antes de mirar las lecturas. Después:
  <ul>
  <li>Poné V/div en 0,2 V: “¿qué pasó?” (se sale). Pasalo a 5 V: “¿y ahora?” (chatita). Que encuentre la mejor escala.</li>
  <li>s/div en 10 ms: banda empastada. En 10 µs: casi una recta. Que elija para ver 2 ciclos.</li>
  <li>Offset 3 V y alternar DC/AC/GND: “¿dónde está el cero?”.</li>
  <li>Destildá el disparo: la imagen corre. Activalo y llevá el nivel a 5 V (fuera de la señal): vuelve a correr. Probá modo NORMAL.</li>
  <li>Punta ×10 mal configurada: que descubra solo por qué “mide 10 veces menos”.</li>
  <li>CH2 con atraso de 90°: que mida Δt en divisiones y calcule φ. Después modo XY.</li>
  </ul></li>
<li><b>Desafío de lectura (15 min):</b> 4 o 5 señales. Que diga el razonamiento en voz alta (“ocupa 5,2 div por 0,5 V/div…”). Los errores de prefijo (µs vs ms) son los más comunes.</li>
<li><b>Seguridad (5 min):</b> masa de la punta, con la explicación de por qué no se desconecta la tierra.</li>
<li><b>Cierre:</b> autoevaluación y ejercicios 3, 5 y 7 de tarea.</li>
</ol>
<h3>Errores frecuentes del alumno</h3>
<ul>
<li>Contar las líneas en lugar de los espacios (las divisiones son los espacios entre líneas).</li>
<li>Medir “de cero a pico” cuando el cero no está en el centro (por la posición vertical): mejor siempre pico a pico.</li>
<li>Calcular la frecuencia con s/div directamente, sin multiplicar por las divisiones del período.</li>
<li>Prefijos: 0,2 ms/div × 5 div = 1 ms (no 1 s ni 1 µs); f = 1/1 ms = 1 kHz.</li>
<li>Usar $V_p/\sqrt2$ con señales cuadradas o triangulares.</li>
<li>Dejar acoplamiento AC y “perder” la continua en señales lógicas o PWM.</li>
</ul>
<h3>Preguntas para hacerle pensar</h3>
<ul>
<li>¿Por qué los V/div siguen la secuencia 1‑2‑5 y no 1‑2‑3‑4…?</li>
<li>Si el nivel de disparo está más arriba que el pico de la señal, ¿qué va a pasar? ¿Y en modo NORMAL?</li>
<li>¿Qué pasaría si conectás la masa de CH1 a un punto y la masa de CH2 a otro punto distinto del circuito?</li>
<li>Con dos senoidales iguales desfasadas 90°, ¿qué figura ves en XY? ¿Y si las amplitudes son distintas?</li>
</ul>
<h3>Recordatorio rápido para vos</h3>
<ul>
<li>Retícula 10 × 8 div; subdivisiones de 0,2 div en los ejes centrales.</li>
<li>Entrada típica: 1 MΩ ∥ 15–25 pF. Punta ×10: 9 MΩ en la punta + capacitor de compensación (≈ 10 MΩ ∥ ~12 pF vista desde el circuito). Señal de calibración: cuadrada de ~1 kHz, 2–5 Vpp.</li>
<li>Ancho de banda (−3 dB) y tiempo de subida: $t_r\approx\frac{0{,}35}{BW}$ (100 MHz → 3,5 ns).</li>
<li>Desfase: $\varphi=360^\circ\cdot\Delta t/T$. Lissajous: $\sin\varphi=Y_0/Y_{máx}$.</li>
<li>Vef: senoidal $V_p/\sqrt2$; cuadrada $V_p$; triangular $V_p/\sqrt3$. Con continua: $V_{ef}=\sqrt{V_{DC}^2+V_{ef,AC}^2}$.</li>
<li>Para eventos únicos: modo SINGLE (digitales) con disparo NORMAL.</li>
</ul>
<h3>Experiencia práctica</h3>
<p><b>Sin osciloscopio en casa:</b> Falstad (falstad.com/circuit) tiene osciloscopio en cada componente (clic derecho → “View in scope”): armá una fuente de alterna con una RC y medí el desfase entre la tensión de la fuente y la del capacitor. En <b>Tinkercad Circuits</b> hay un osciloscopio y un generador de funciones: se puede ver la salida PWM de un Arduino con <code>analogWrite(9, 77)</code> (≈30 %) y medir frecuencia (≈490 Hz) y ciclo de trabajo. <b>Celular:</b> hay apps de “osciloscopio” que usan la entrada de micrófono: con un generador de tonos en otro celular se puede practicar lectura de período (solo audio, nunca conectar nada de la red).</p>
`,
  });
})();
