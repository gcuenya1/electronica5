/* Tema 12 — Filtrado con capacitores
   IMPORTANTE: los textos con LaTeX usan String.raw`...` para que "\frac" no se rompa.
   Todo va dentro de una IIFE para que las funciones auxiliares no choquen con otros temas. */
(() => {
  const S = 'stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"';

  /* ---------- Diagrama de bloques de la fuente (se repite en los temas 11, 12 y 13) ---------- */
  function cadena(activo) {
    const cajas = [
      { k: 'trafo', t: 'Transformador', s: 'baja la tensión' },
      { k: 'rect', t: 'Rectificador', s: 'diodos' },
      { k: 'filtro', t: 'Filtro', s: 'capacitor' },
      { k: 'reg', t: 'Regulador', s: 'zener' },
    ];
    const N = 80;
    const onda = (vals, cx, w, y0, a) => {
      let d = '';
      vals.forEach((v, i) => { const x = cx - w / 2 + w * i / (vals.length - 1); d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + (y0 - a * v).toFixed(1); });
      return `<path d="M${cx - w / 2} ${y0}H${cx + w / 2}" style="stroke:var(--axis)" stroke-width="1" fill="none"/><path d="${d}" fill="none" style="stroke:var(--c1)" stroke-width="2" stroke-linejoin="round"/>`;
    };
    const u = [...Array(N + 1).keys()].map(i => i / N);
    const sen = u.map(x => Math.sin(4 * Math.PI * x));
    const rect = u.map(x => Math.abs(Math.sin(4 * Math.PI * x)));
    let c = 0.2; const riz = u.map(x => { const e = Math.abs(Math.sin(4 * Math.PI * x)); c = Math.max(e, c - 0.012); return c; });
    const ondas = [onda(sen, 35, 56, 115, 18), onda(sen, 160, 96, 115, 9), onda(rect, 320, 96, 127, 24), onda(riz, 480, 96, 127, 24), onda(u.map(() => 0.75), 640, 96, 127, 24)];
    const p = [];
    p.push(Esq.texto(35, 40, 'Red', { size: 13 }), Esq.texto(35, 57, '220 V~', { size: 11, peso: 400 }), ondas[0]);
    cajas.forEach((b, i) => {
      const x = 100 + i * 160, on = b.k === activo;
      p.push(`<rect x="${x}" y="18" width="120" height="54" rx="9" style="stroke:${on ? 'var(--accent)' : 'currentColor'};fill:${on ? 'var(--accent-soft)' : 'var(--panel)'}" stroke-width="${on ? 3 : 1.5}"/>`);
      p.push(Esq.texto(x + 60, 42, b.t, { size: 13, color: on ? 'var(--accent)' : '' }), Esq.texto(x + 60, 60, b.s, { size: 11, peso: 400 }));
      if (on) p.push(Esq.texto(x + 60, 12, '◆ este tema', { size: 10, color: 'var(--accent)' }));
      p.push(ondas[i + 1]);
    });
    const fl = (x1, x2) => `<path ${S} d="M${x1} 45H${x2 - 2}"/><path d="M${x2} 45l-8 -4.5v9z" fill="currentColor"/>`;
    p.push(fl(70, 100), fl(220, 260), fl(380, 420), fl(540, 580), fl(700, 728));
    p.push(Esq.texto(752, 40, 'Carga', { size: 13 }), Esq.texto(752, 57, 'CC estable', { size: 11, peso: 400 }));
    return Esq.svg(780, 145, p, 'Cadena de una fuente de alimentación lineal. Debajo de cada bloque: la forma de onda que sale de él.');
  }

  /* ---------- Simulación numérica rectificador + capacitor ----------
     Diodo ideal con caída Vd en serie con Rs (bobinado + diodos). Paso exacto (exponencial),
     estable para cualquier combinación de R y C. */
  function simFiltro({ Vp, C, RL, Rs = 1, onda = 'oc', Vd = 0, arranque = false, periodos = 3, f = 50, pasos = 1000 }) {
    const T = 1 / f, dt = T / pasos;
    const vr = (t) => { const s = Vp * Math.sin(2 * Math.PI * f * t); return Math.max(0, (onda === 'mo' ? Math.max(0, s) : Math.abs(s)) - Vd); };
    const kD = Math.exp(-dt / (RL * C));
    const Rp = Rs * RL / (Rs + RL), kC = Math.exp(-dt / (Rp * C));
    let vc = arranque ? 0 : vr(T / 4) * RL / (Rs + RL);
    let t = arranque ? 0 : T / 4;
    const paso = () => {
      const vin = vr(t + dt / 2);
      let nuevo, id = 0;
      if (vin > vc) {
        const vth = vin * RL / (Rs + RL);
        nuevo = vth + (vc - vth) * kC;
        id = Math.max(0, (vin - (vc + nuevo) / 2) / Rs);
      } else nuevo = vc * kD;
      vc = nuevo; t += dt;
      return id;
    };
    if (!arranque) { for (let i = 0; i < 60 * pasos; i++) paso(); t = 0; }
    const out = { t: [], vr: [], vc: [], id: [], T, fr: onda === 'mo' ? f : 2 * f };
    const n = periodos * pasos;
    for (let i = 0; i <= n; i++) {
      out.t.push(t); out.vr.push(vr(t)); out.vc.push(vc);
      out.id.push(i < n ? paso() : out.id[out.id.length - 1] || 0);
    }
    // mediciones sobre el último período (régimen)
    const desde = arranque ? n - pasos : 0;
    let mx = -1e9, mn = 1e9, sm = 0, ip = 0, cnt = 0, on = 0;
    for (let i = desde; i <= n; i++) { const v = out.vc[i]; mx = Math.max(mx, v); mn = Math.min(mn, v); sm += v; cnt++; ip = Math.max(ip, out.id[i]); if (out.id[i] > 1e-9) on++; }
    out.vmax = mx; out.vmin = mn; out.vr_pp = mx - mn; out.vmed = sm / cnt; out.ipico = ip; out.frac = on / cnt;
    out.vpe = Math.max(0, Vp - Vd);
    return out;
  }

  /* ---------- Esquemas ---------- */
  function puente(x, y) {   // caja de puente: ~ en (x,y+15) y (x,y+65); + en (x+60,y+15); − en (x+60,y+65)
    return `<rect x="${x}" y="${y}" width="60" height="80" rx="6" ${S}/>` +
      `<g transform="translate(${x + 30},${y + 40}) scale(0.55)"><path ${S} d="M0 -34L34 0L0 34L-34 0Z"/><path d="M-12 -22L-22 -12L-4 -4Z" fill="currentColor"/><path d="M22 -12L12 -22L4 -4Z" fill="currentColor"/><path d="M-22 12L-12 22L-4 4Z" fill="currentColor"/><path d="M12 22L22 12L4 4Z" fill="currentColor"/></g>` +
      Esq.texto(x + 9, y + 19, '~', { size: 13 }) + Esq.texto(x + 9, y + 69, '~', { size: 13 }) + Esq.texto(x + 52, y + 19, '+', { size: 13 }) + Esq.texto(x + 52, y + 70, '−', { size: 13 });
  }
  function fuente(completa) {
    const p = [
      Esq.cable([[40, 80], [40, 60], [80, 60]]), Esq.fuenteAC(40, 80, 40, 120), Esq.cable([[40, 120], [40, 140], [80, 140]]), Esq.texto(40, 165, '220 V~', { size: 12 }),
      Esq.trafo(80, 60, false, completa ? '220/15 V' : 'T1'),
      Esq.cable([[150, 60], [170, 60], [170, 75], [190, 75]]), Esq.cable([[150, 140], [170, 140], [170, 125], [190, 125]]),
      puente(190, 60), Esq.texto(220, 158, completa ? 'KBP206' : 'puente', { size: 11, peso: 400 }),
      Esq.cable([[250, 75], [270, 75], [270, 40], [completa ? 600 : 470, 40]]), Esq.cable([[250, 125], [270, 125], [270, 180], [completa ? 600 : 470, 180]]),
      Esq.nodo(320, 40), Esq.nodo(320, 180),
      Esq.cable([[320, 40], [320, 80]]), Esq.C(320, 80, 320, 140, 'C1', completa ? '3300 µF / 35 V' : '', 1, true), Esq.cable([[320, 140], [320, 180]]),
    ];
    if (completa) {
      p.push(Esq.nodo(440, 40), Esq.nodo(440, 180), Esq.cable([[440, 40], [440, 75]]), Esq.R(440, 75, 440, 145, 'R1', '4,7 kΩ', 1), Esq.cable([[440, 145], [440, 180]]),
        Esq.nodo(530, 40), Esq.nodo(530, 180), Esq.cable([[530, 40], [530, 80]]), Esq.C(530, 80, 530, 140, 'C2', '100 nF', 1), Esq.cable([[530, 140], [530, 180]]),
        Esq.borne(600, 40, '+ ≈ 19 V', 0, -12), Esq.borne(600, 180, '−', 0, 22), Esq.texto(600, 112, '→ regulador', { size: 11, peso: 400 }), Esq.texto(600, 127, '(tema 13)', { size: 11, peso: 400 }));
    } else {
      p.push(Esq.nodo(420, 40), Esq.nodo(420, 180), Esq.cable([[420, 40], [420, 75]]), Esq.R(420, 75, 420, 145, 'RL', '', 1), Esq.cable([[420, 145], [420, 180]]),
        Esq.flecha(286, 28, 316, 28, 'Ic', 'var(--c2)'), Esq.flecha(372, 28, 410, 28, 'IL', 'var(--c3)'));
    }
    return p;
  }

  /* Forma de onda estática del filtro para la teoría */
  function ondaFiltroSVG() {
    const r = simFiltro({ Vp: 16.97, C: 680e-6, RL: 100, Rs: 0.5, onda: 'oc', Vd: 1.4, periodos: 2 });
    const W = 480, Hh = 200, x0 = 40, x1 = 460, y0 = 170, k = 140 / 17;
    const n = r.t.length, X = (i) => x0 + (x1 - x0) * i / (n - 1), Y = (v) => y0 - v * k;
    const pth = (arr) => arr.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1)).filter((_, i) => i % 4 === 0 || i === n - 1).join('');
    const p = [`<path ${S} stroke-width="1" d="M${x0} ${y0}H${x1 + 6}M${x0} 18V${y0}"/>`];
    // bandas donde conducen los diodos
    let ini = -1;
    for (let i = 0; i < n; i++) {
      const on = r.id[i] > 1e-6;
      if (on && ini < 0) ini = i;
      if ((!on || i === n - 1) && ini >= 0) { p.push(`<rect x="${X(ini)}" y="20" width="${Math.max(2, X(i) - X(ini))}" height="${y0 - 20}" style="fill:var(--c2);opacity:.18"/>`); ini = -1; }
    }
    p.push(`<path d="${pth(r.vr)}" fill="none" style="stroke:var(--muted)" stroke-width="1.6" stroke-dasharray="5 4"/>`);
    p.push(`<path d="${pth(r.vc)}" fill="none" style="stroke:var(--c1)" stroke-width="3" stroke-linejoin="round"/>`);
    p.push(`<path d="M${x0} ${Y(r.vmax)}H${x1}M${x0} ${Y(r.vmin)}H${x1}" style="stroke:var(--muted)" stroke-width="1" stroke-dasharray="2 3" fill="none"/>`);
    p.push(Esq.flecha(x1 + 10, (Y(r.vmax) + Y(r.vmin)) / 2, x1 + 10, Y(r.vmax), '', 'var(--c4)'), Esq.flecha(x1 + 10, (Y(r.vmax) + Y(r.vmin)) / 2, x1 + 10, Y(r.vmin), '', 'var(--c4)'));
    p.push(Esq.texto(x1 + 16, (Y(r.vmax) + Y(r.vmin)) / 2 + 4, 'Vr', { size: 12, anchor: 'start', color: 'var(--c4)' }));
    p.push(Esq.texto(x0 - 6, Y(r.vmax) + 4, 'Vp', { size: 11, anchor: 'end', peso: 400 }), Esq.texto(x1 + 6, y0 + 16, 't', { size: 12, anchor: 'end' }));
    p.push(`<path d="M${x0 + 10} 10h22" style="stroke:var(--muted)" stroke-width="1.6" stroke-dasharray="5 4"/>`, Esq.texto(x0 + 36, 14, 'sin capacitor', { size: 11, anchor: 'start', peso: 400 }),
      `<path d="M${x0 + 140} 10h22" style="stroke:var(--c1)" stroke-width="3"/>`, Esq.texto(x0 + 166, 14, 'con capacitor (Vc)', { size: 11, anchor: 'start', peso: 400 }),
      `<rect x="${x0 + 300}" y="4" width="18" height="12" style="fill:var(--c2);opacity:.3"/>`, Esq.texto(x0 + 322, 14, 'conducen los diodos', { size: 11, anchor: 'start', peso: 400 }));
    return p;
  }

  /* Circuito RC con llave inversora (cargar / descargar) */
  function rcSVG(modo, vals = {}) {
    const carga = modo === 'carga', desc = modo === 'descarga';
    const lev = carga ? [114, 33] : desc ? [114, 67] : [118, 50];
    const p = [
      Esq.bat(40, 65, 40, 135, 'V', vals.v || '', -1), Esq.cable([[40, 65], [40, 30], [110, 30]]), Esq.cable([[40, 135], [40, 170], [330, 170]]),
      `<circle cx="110" cy="30" r="3.5" ${S}/><circle cx="110" cy="70" r="3.5" ${S}/><circle cx="150" cy="50" r="3.5" fill="currentColor"/>`,
      `<path ${S} stroke-width="2.6" d="M150 50L${lev[0]} ${lev[1]}"/>`,
      Esq.cable([[110, 73], [110, 170]]), Esq.nodo(110, 170),
      Esq.texto(104, 22, 'cargar', { size: 11, anchor: 'end', color: carga ? 'var(--accent)' : '' }), Esq.texto(104, 92, 'descargar', { size: 11, anchor: 'end', color: desc ? 'var(--accent)' : '' }),
      Esq.cable([[153, 50], [180, 50]]), Esq.R(180, 50, 260, 50, 'R', vals.r || '', 1), Esq.cable([[260, 50], [330, 50], [330, 80]]),
      Esq.C(330, 80, 330, 140, 'C', vals.c || '', 1, true), Esq.cable([[330, 140], [330, 170]]),
    ];
    if (carga) p.push(Esq.flecha(200, 74, 240, 74, 'i', 'var(--accent)'));
    if (desc) p.push(Esq.flecha(240, 74, 200, 74, 'i', 'var(--accent)'));
    if (vals.vc) p.push(Esq.texto(390, 115, 'Vc = ' + vals.vc, { size: 12, color: 'var(--c1)' }));
    return p;
  }

  registrarTema({
    id: 'filtrado',
    orden: 12,
    titulo: 'Filtrado con capacitores',
    resumen: 'El capacitor como “tanque”: de continua pulsante a continua con rizado',
    confirmar: false,

    teoria: String.raw`
<p>En el tema anterior vimos que el rectificador entrega una <b>continua pulsante</b>: nunca cambia de signo, pero baja a cero 100 veces por segundo. Ningún circuito electrónico funciona bien así. El siguiente bloque de la fuente es el <b>filtro</b>: un capacitor grande que se carga en los picos y entrega energía mientras la tensión del rectificador baja.</p>
${cadena('filtro')}

<h2>1. El capacitor: un tanque de carga eléctrica</h2>
<p>Un capacitor son dos placas conductoras separadas por un aislante (dieléctrico). Cuando le aplicás tensión, se acumulan cargas positivas en una placa y negativas en la otra. Cuanta más tensión, más carga guarda:</p>
<div class="caja formula"><span class="caja-titulo">Carga, capacidad y energía</span>
$$Q = C\cdot V \qquad\qquad I = C\,\frac{\Delta V}{\Delta t} \qquad\qquad E=\tfrac12\,C\,V^2$$
<p>$C$ en faradios (F). En fuentes se usan microfaradios: $1\,\mu\text{F}=10^{-6}\,\text{F}$. La segunda fórmula es la clave del filtro: <b>si sacás una corriente $I$ de un capacitor durante un tiempo $\Delta t$, su tensión baja $\Delta V = I\,\Delta t / C$</b>.</p>
</div>
<div class="caja idea"><span class="caja-titulo">Analogía: el tanque de agua</span>
<p>El capacitor es como un <b>tanque de agua</b> en la terraza: la tensión es la <b>altura del agua</b>, la carga es la <b>cantidad de agua</b> y la capacidad es el <b>ancho del tanque</b>. La bomba (el rectificador) llena el tanque a golpes, 100 veces por segundo; la casa (la carga) consume agua todo el tiempo. Si el tanque es ancho (C grande), entre golpe y golpe de la bomba el nivel casi no baja. Si es angosto, el nivel sube y baja mucho: eso es el <b>rizado</b>.</p>
</div>

<h2>2. Carga y descarga a través de una resistencia</h2>
<p>Si cargás un capacitor desde una fuente $V$ a través de una resistencia $R$, la tensión no sube de golpe: al principio sube rápido (el capacitor está “vacío” y la corriente es máxima, $V/R$) y después cada vez más despacio. Lo mismo al descargarlo.</p>
${Esq.svg(440, 195, rcSVG('carga', { r: '10 kΩ', c: '100 µF', v: '9 V' }), 'Circuito RC: con la llave en “cargar”, C se carga a través de R; en “descargar”, se descarga por R.')}
<div class="caja formula"><span class="caja-titulo">Constante de tiempo y curvas exponenciales</span>
$$\tau = R\cdot C \qquad\qquad \text{Carga: } V_C(t)=V\left(1-e^{-t/\tau}\right)\qquad \text{Descarga: } V_C(t)=V_0\,e^{-t/\tau}$$
</div>
<div class="tabla-wrap"><table class="tabla">
<tr><th>Tiempo</th><th>$\tau$</th><th>$2\tau$</th><th>$3\tau$</th><th>$4\tau$</th><th>$5\tau$</th></tr>
<tr><td>Carga (% de V)</td><td>63 %</td><td>86 %</td><td>95 %</td><td>98 %</td><td>99,3 %</td></tr>
<tr><td>Descarga (% de V₀ que queda)</td><td>37 %</td><td>14 %</td><td>5 %</td><td>2 %</td><td>0,7 %</td></tr>
</table></div>
<div class="caja tip"><span class="caja-titulo">Para recordar</span>
En <b>una</b> constante de tiempo se carga al <b>63 %</b>. En <b>cinco</b> constantes de tiempo se considera cargado (o descargado) del todo. Con $R=10\,\text{k}\Omega$ y $C=100\,\mu\text{F}$: $\tau=10\,000\cdot0{,}0001=1\,\text{s}$, y en 5 s está prácticamente lleno. (Truco: kΩ × µF = ms.)
</div>

<h2>3. El filtro: un capacitor en paralelo con la carga</h2>
<p>El filtro más simple es un capacitor electrolítico grande conectado <b>a la salida del rectificador, en paralelo con la carga</b>:</p>
${Esq.svg(500, 200, fuente(false), 'Rectificador en puente + capacitor de filtro C1 en paralelo con la carga RL.')}
<ol>
<li><b>Cerca del pico:</b> la tensión del rectificador supera a la del capacitor. Los diodos conducen y <b>cargan</b> el capacitor hasta casi $V_p$ (además de alimentar la carga).</li>
<li><b>Después del pico:</b> la senoidal baja más rápido que el capacitor. Ahora el capacitor tiene más tensión que el rectificador: los diodos quedan <b>en inversa</b> y dejan de conducir.</li>
<li><b>Entre picos:</b> el capacitor solo se <b>descarga</b> a través de $R_L$, alimentando la carga. Su tensión baja un poco (casi en línea recta, porque $\tau = R_L C$ es mucho mayor que 10 ms).</li>
<li><b>Llega el siguiente pico:</b> cuando la senoidal vuelve a superar a $V_C$, los diodos conducen otra vez y “rellenan” el capacitor. El ciclo se repite.</li>
</ol>
${Esq.svg(480, 200, ondaFiltroSVG(), 'La tensión en el capacitor (azul) sigue a los picos y baja poco entre uno y otro. Los diodos conducen solo en las franjas naranjas.')}
<p>El resultado es una continua con una pequeña ondulación en forma de diente de sierra: el <b>rizado</b> (en inglés, <em>ripple</em>).</p>

<h2>4. Tensión de rizado</h2>
<p>Entre dos picos el capacitor entrega toda la corriente de la carga durante casi un período de rizado $T_r = 1/f_r$. Usando $\Delta V = I\,\Delta t/C$:</p>
<div class="caja formula"><span class="caja-titulo">Rizado pico a pico (aproximación)</span>
$$V_r \approx \frac{I_L}{f_r\cdot C} = \frac{V_p}{f_r\cdot R_L\cdot C}\qquad\qquad V_{CC}\approx V_p-\frac{V_r}{2}$$
<p>$f_r = 50\,\text{Hz}$ en media onda y $f_r = 100\,\text{Hz}$ en onda completa. $V_p$ es el pico a la salida del rectificador (ya restadas las caídas de los diodos). La fórmula vale bien cuando $V_r$ es chico (menos del 20–25 % de $V_p$).</p>
</div>
<div class="caja formula"><span class="caja-titulo">¿Cuánto rizado hay? Dos formas de expresarlo</span>
$$\%\,\text{rizado} = \frac{V_r}{V_{CC}}\cdot100 \qquad\qquad r = \frac{V_{r,ef}}{V_{CC}} = \frac{V_r}{2\sqrt3\,V_{CC}}$$
<p>El <b>factor de rizado</b> $r$ usa el valor eficaz del diente de sierra ($V_r/2\sqrt3$). En la práctica es más común hablar del rizado pico a pico en volts o en %.</p>
</div>
<div class="caja ejemplo"><span class="caja-titulo">Ejemplo numérico</span>
Transformador de 12 V, puente, $R_L=100\,\Omega$, $C=1000\,\mu\text{F}$:
$$V_p=16{,}97-1{,}4=15{,}57\,\text{V}\qquad V_r=\frac{15{,}57}{100\cdot100\cdot0{,}001}=1{,}56\,\text{V}\qquad V_{CC}\approx15{,}57-0{,}78=14{,}8\,\text{V}$$
Con <b>media onda</b> ($f_r=50\,\text{Hz}$) y los mismos componentes el rizado se duplica: $V_r=3{,}11\,\text{V}$. Por eso la onda completa es mucho mejor para filtrar. Comparalo con la simulación (allí se ve que el valor real es un poco menor que el de la fórmula).
</div>
<div class="caja ojo"><span class="caja-titulo">Comparación con antes del filtro</span>
Sin capacitor, ese mismo puente daba $V_{med}=9{,}91\,\text{V}$ (tema 11). Con el capacitor, $V_{CC}\approx14{,}8\,\text{V}$: ¡la tensión continua sube casi hasta el pico! No te sorprendas cuando midas una fuente “de 12 V” sin carga y marque 16–17 V.
</div>

<h2>5. ¿Qué capacitor pongo? Elegir C para un rizado dado</h2>
<p>Despejando de la fórmula del rizado:</p>
<div class="caja formula"><span class="caja-titulo">Capacidad necesaria</span>
$$C = \frac{I_L}{f_r\cdot V_r}\qquad\qquad\text{Regla práctica (}V_r=10\,\%\text{ de }V_p\text{):}\quad C=\frac{10}{f_r\cdot R_L}$$
</div>
<p>Una regla muy usada en el taller: <b>entre 1000 y 2000 µF por cada ampere</b> de carga en onda completa. Después se elige el valor comercial <b>inmediatamente superior</b>: 470, 1000, 2200, 3300, 4700, 6800, 10 000 µF.</p>

<h2>6. El precio del filtro: picos de corriente en los diodos</h2>
<p>Los diodos solo conducen durante un ratito cerca de cada pico (el <b>ángulo de conducción</b>, típicamente 20–40° de cada semiciclo). En ese ratito tienen que reponer <b>toda</b> la carga que el capacitor entregó durante el resto del ciclo. Resultado: la corriente por los diodos viene en <b>pulsos angostos y altos</b>, de 5 a 10 veces la corriente media de la carga.</p>
<div class="caja formula"><span class="caja-titulo">Estimación del pico de corriente</span>
$$\cos\theta = 1-\frac{V_r}{V_p}\qquad t_c=\frac{\theta}{2\pi f_{red}}\qquad I_{D,pico}\approx 2\,I_L\,\frac{T_r}{t_c}$$
<p>(θ: ángulo desde que el diodo empieza a conducir hasta el pico; suponemos un pulso triangular.)</p>
</div>
<ul>
<li>Cuanto más grande el capacitor, menor el rizado… pero <b>más angostos y altos</b> son los pulsos. No conviene exagerar con C.</li>
<li>La corriente <b>eficaz</b> del secundario resulta 1,6–1,8 veces la corriente continua de la carga: el transformador se calienta más de lo que parece. Para 1 A de CC, usá un transformador de al menos 1,8 A.</li>
<li><b>Al encender</b>, el capacitor está descargado y se comporta como un cortocircuito: hay un pico de corriente (<em>inrush</em>) limitado solo por la resistencia del bobinado. Los diodos lo soportan por diseño ($I_{FSM}$ = 30 A en un 1N4007), pero en fuentes grandes se agrega un termistor NTC en serie.</li>
</ul>

<h2>7. El capacitor electrolítico: polaridad y tensión de trabajo</h2>
<p>Para tener miles de µF en un tamaño razonable se usan capacitores <b>electrolíticos</b> de aluminio. Tienen dos datos impresos que hay que respetar sí o sí:</p>
<ul>
<li><b>Polaridad:</b> tienen + y −. La pata más larga es el +, y del lado del − hay una franja con signos “−”. <b>Conectado al revés, se calienta, se infla y puede explotar</b> (literalmente: por eso tienen una cruz marcada arriba, que es una válvula de seguridad).</li>
<li><b>Tensión de trabajo:</b> la máxima tensión que soportan (6,3, 10, 16, 25, 35, 50, 63 V…). Se elige con un margen de <b>al menos 1,5 veces</b> la tensión máxima que va a tener, calculada <b>sin carga</b> y con la red un 10 % alta.</li>
</ul>
<div class="caja ojo"><span class="caja-titulo">¡Peligro: queda cargado!</span>
Un capacitor de filtro puede mantener la tensión varios minutos después de desenchufar la fuente (con 3300 µF y sin carga, ¡muchísimo más!). En fuentes de tensión alta eso es peligroso. Por eso se agrega una <b>resistencia de descarga</b> en paralelo (por ejemplo 4,7 kΩ), y antes de tocar, se mide.
</div>
<p>Otros datos: temperatura máxima (85 °C o 105 °C: preferí 105 °C), y la <b>ESR</b> (resistencia serie equivalente), que en electrolíticos viejos o “secos” aumenta y hace que la fuente tenga más rizado. Un electrolítico inflado es la falla más común en fuentes y monitores.</p>

<h2>8. Capacitores de desacople (100 nF)</h2>
<p>Al lado del electrolítico grande casi siempre vas a ver un capacitor cerámico chiquito de <b>100 nF</b> (marcado “104”). ¿Para qué, si es 30 000 veces más chico? Porque el electrolítico es bueno para frecuencias bajas (100 Hz), pero a frecuencias altas (ruido de conmutación de los integrados, MHz) se comporta mal por su inductancia interna. El cerámico de 100 nF filtra ese ruido rápido.</p>
<div class="caja tip"><span class="caja-titulo">Regla de oro</span>
Un capacitor de 100 nF entre alimentación y masa <b>lo más cerca posible de cada integrado</b> (microcontrolador, operacional, regulador). Fijate en cualquier placa de Arduino: hay varios.
</div>

<h2>9. Ejemplo completo: diseño de una fuente para 12 V – 0,5 A</h2>
<p>Queremos alimentar un circuito de 12 V que consume hasta 0,5 A. La salida del filtro va a alimentar un regulador de 12 V (tema 13), que necesita en su entrada <b>por lo menos unos 14,5 V en todo momento</b> (incluido el valle del rizado).</p>
${Esq.svg(660, 205, fuente(true), 'Fuente completa hasta el filtro: transformador, puente, electrolítico, resistencia de descarga y desacople.')}
<div class="caja ejemplo"><span class="caja-titulo">Diseño paso a paso</span>
<ol>
<li><b>Transformador:</b> probamos con 15 V: $V_{p,sec}=\sqrt2\cdot15=21{,}2\,\text{V}$. Con el puente: $V_p=21{,}2-1{,}4=19{,}8\,\text{V}$.</li>
<li><b>Rizado admitido:</b> el valle debe quedar arriba de 14,5 V. Elegimos $V_r\approx2\,\text{V}$ (10 % de $V_p$), con mucho margen.</li>
<li><b>Capacitor:</b> $C=\dfrac{I_L}{f_r V_r}=\dfrac{0{,}5}{100\cdot2}=2500\,\mu\text{F}$ → comercial: <b>3300 µF</b>.</li>
<li><b>Verificación:</b> $V_r=\dfrac{0{,}5}{100\cdot0{,}0033}=1{,}52\,\text{V}$; $V_{CC}\approx19{,}8-0{,}76=19{,}1\,\text{V}$; valle $=19{,}8-1{,}52=18{,}3\,\text{V}$ (> 14,5 V ✓). Rizado: 8 %.</li>
<li><b>Tensión del capacitor:</b> sin carga y con red alta (+10 %): $21{,}2\cdot1{,}1-1{,}4=21{,}9\,\text{V}$. Con margen 1,5: $32{,}9\,\text{V}$ → <b>35 V</b>. Queda: <b>3300 µF × 35 V, 105 °C</b>.</li>
<li><b>Diodos:</b> pico de corriente estimado: $\cos\theta=1-1{,}52/19{,}8$ → $\theta\approx22{,}6^\circ$, $t_c\approx1{,}25\,\text{ms}$, $I_{D,pico}\approx2\cdot0{,}5\cdot\frac{10}{1{,}25}=8\,\text{A}$ (en la realidad algo menos, por la resistencia del bobinado). Un puente de 2 A (KBP206, $I_{FSM}$ = 60 A) va bien.</li>
<li><b>Transformador:</b> corriente eficaz del secundario ≈ 1,8 × 0,5 A = 0,9 A → transformador de <b>15 V – 1 A</b> (15 VA), con fusible de 100–160 mA en el primario.</li>
<li><b>Extras:</b> resistencia de descarga de 4,7 kΩ (consume solo 4 mA), cerámico de 100 nF y LED piloto si se quiere.</li>
</ol>
</div>

<h2>10. Limitaciones: ¿por qué todavía falta algo?</h2>
<ul>
<li><b>El rizado depende de la carga:</b> con el filtro anterior, a 50 mA el rizado sería de 0,15 V; a 0,5 A, 1,5 V. Cuanto más consume el circuito, más baja y más ondula la tensión.</li>
<li><b>La tensión de salida depende de la red:</b> si la red sube un 10 %, $V_{CC}$ sube un 10 %.</li>
<li><b>Sin carga, la tensión sube hasta el pico</b> (19,8 V en el ejemplo), bastante más que con carga.</li>
</ul>
<p>Para que la tensión sea <b>constante</b> sin importar la carga ni la red, después del filtro va un <b>regulador</b>. El más simple es el <b>diodo zener</b>: es el próximo tema.</p>
`,

    simulaciones: [
      {
        titulo: 'Rectificador + capacitor: el rizado en vivo',
        descripcion: 'Simulación numérica paso a paso (el diodo conduce solo cuando la entrada supera la tensión del capacitor). Variá C y la carga, y mirá el rizado y los picos de corriente de los diodos.',
        montar(cont, H) {
          const { controles, vista } = H.layout(cont);
          const onda = H.select(controles, { label: 'Rectificador', value: 'oc', onChange: upd, opciones: [{ v: 'mo', t: 'Media onda (f rizado = 50 Hz)' }, { v: 'oc', t: 'Onda completa, puente (100 Hz)' }] });
          const vp = H.slider(controles, { label: 'Vp del secundario', min: 5, max: 35, step: 0.5, value: 17, unidad: 'V', onInput: upd });
          const real = H.check(controles, { label: 'Diodos reales (0,7 V c/u)', value: true, onChange: upd });
          const cc = H.slider(controles, { label: 'C (capacitor)', min: 1, max: 10000, log: true, value: 1000, fmt: v => H.fmt(v * 1e-6, 'F'), onInput: upd });
          const rl = H.slider(controles, { label: 'RL (carga)', min: 10, max: 10000, log: true, value: 100, unidad: 'Ω', onInput: upd });
          const rs = H.slider(controles, { label: 'Rs (bobinado + diodos)', min: 0.1, max: 10, log: true, value: 1, unidad: 'Ω', onInput: upd });
          const arr = H.check(controles, { label: 'Ver el encendido (C descargado)', value: false, onChange: upd });
          let R = null;
          const cv1 = H.canvas(vista, { alto: (w) => w < 500 ? 220 : 250, dibujar: dib1 });
          const cv2 = H.canvas(vista, { alto: (w) => w < 500 ? 150 : 170, dibujar: dib2 });
          const lec = H.lecturas(vista);
          const nota = H.nota(vista);

          function sim() {
            return simFiltro({ Vp: vp.value, C: cc.value * 1e-6, RL: rl.value, Rs: rs.value, onda: onda.value, Vd: real.value ? (onda.value === 'mo' ? 0.7 : 1.4) : 0, arranque: arr.value, periodos: arr.value ? 6 : 3, pasos: arr.value ? 600 : 1000 });
          }
          const ms = (i) => (R.t[i] - R.t[0]) * 1000;

          function dib1(ctx, w, h) {
            if (!R) return;
            const n = R.t.length, tmax = ms(n - 1), ym = vp.value * 1.08;
            const P = H.ejes(ctx, w, h, { xmin: 0, xmax: tmax, ymin: 0, ymax: ym, xlabel: 't (ms)', ylabel: 'V', mt: 24 });
            const paso = Math.max(1, Math.floor(n / (P.w * 1.5)));
            const serie = (arr) => { const o = []; for (let i = 0; i < n; i += paso) o.push([ms(i), arr[i]]); return o; };
            P.pts(serie(R.vr), { color: H.col('muted'), ancho: 1.5, guiones: [6, 4] });
            P.pts(serie(R.vc), { color: H.col('c1'), ancho: 2.6 });
            P.hline(R.vmed, { color: H.col('green'), label: 'Vcc media', labelX: tmax * 0.3 });
            if (!arr.value) { P.hline(R.vmax, { color: H.col('c4'), guiones: [2, 3], ancho: 1 }); P.hline(R.vmin, { color: H.col('c4'), guiones: [2, 3], ancho: 1 }); P.texto(tmax, (R.vmax + R.vmin) / 2, 'Vr ', { color: H.col('c4'), align: 'right' }); }
            ctx.save(); ctx.font = '11px sans-serif'; ctx.textBaseline = 'middle';
            let x = P.x0;
            for (const [c, t, d] of [[H.col('muted'), 'rectificada sin filtro', true], [H.col('c1'), 'Vc (con capacitor)', false]]) {
              ctx.strokeStyle = c; ctx.lineWidth = d ? 1.5 : 3; ctx.setLineDash(d ? [6, 4] : []);
              ctx.beginPath(); ctx.moveTo(x, 11); ctx.lineTo(x + 18, 11); ctx.stroke();
              ctx.fillStyle = H.col('ink'); ctx.fillText(t, x + 22, 11); x += 34 + ctx.measureText(t).width;
            }
            ctx.restore();
          }
          function dib2(ctx, w, h) {
            if (!R) return;
            const n = R.t.length, tmax = ms(n - 1), IL = R.vmed / rl.value;
            const ym = Math.max(R.ipico, IL, 1e-6) * 1.12;
            const fmtA = (v) => H.fmt(v, 'A', 2);
            const P = H.ejes(ctx, w, h, { xmin: 0, xmax: tmax, ymin: 0, ymax: ym, xlabel: 't (ms)', ylabel: 'i diodo', yfmt: fmtA, ml: 60, ny: 4 });
            const paso = Math.max(1, Math.floor(n / (P.w * 2)));
            const o = [], oL = [];
            for (let i = 0; i < n; i += paso) { o.push([ms(i), R.id[i]]); oL.push([ms(i), R.vc[i] / rl.value]); }
            P.clip(() => { ctx.globalAlpha = 0.18; ctx.fillStyle = H.col('c2'); ctx.beginPath(); ctx.moveTo(P.X(0), P.Y(0)); o.forEach(([x, y]) => ctx.lineTo(P.X(x), P.Y(y))); ctx.lineTo(P.X(tmax), P.Y(0)); ctx.fill(); });
            P.pts(o, { color: H.col('c2'), ancho: 2 });
            P.pts(oL, { color: H.col('c3'), ancho: 1.6, guiones: [5, 4] });
            P.texto(tmax, IL, 'I carga', { color: H.col('c3'), align: 'right', base: 'bottom', dy: -3 });
          }

          function upd() {
            R = sim();
            const fr = R.fr, IL = R.vmed / rl.value, C = cc.value * 1e-6;
            const vrF = R.vpe / (fr * rl.value * C);
            const pct = R.vmed > 0 ? R.vr_pp / R.vmed * 100 : 0;
            const tc = R.frac / fr, ang = tc * 50 * 360;
            lec.set([
              { k: 'Vr medido (pico a pico)', v: H.fmt(R.vr_pp, 'V'), estado: pct > 25 ? 'mal' : pct > 10 ? 'alerta' : 'ok' },
              { k: 'Vr fórmula Vp/(f·RL·C)', v: H.fmt(vrF, 'V') },
              { k: 'Vcc media', v: H.fmt(R.vmed, 'V') },
              { k: '% de rizado (Vr/Vcc)', v: H.num(pct, 1) + ' %' },
              { k: 'I media de la carga', v: H.fmt(IL, 'A') },
              { k: 'I pico del diodo', v: H.fmt(R.ipico, 'A'), estado: R.ipico > 6 * IL ? 'alerta' : '' },
              { k: 'Pico / media', v: IL > 0 ? '× ' + H.num(R.ipico / IL, 1) : '—' },
              { k: 'Conducción por pico', v: H.num(tc * 1000, 2) + ' ms (' + H.num(ang, 0) + '°)' },
            ]);
            let t = `τ = RL·C = <b>${H.fmt(rl.value * C, 's')}</b>, contra ${onda.value === 'mo' ? '20 ms' : '10 ms'} entre picos. `;
            if (arr.value) t += 'Mirá el encendido: el capacitor arranca descargado y el primer pico de corriente es enorme (solo lo limita Rs). Después de unos ciclos se llega al régimen.';
            else if (pct > 25) t += '<b>Rizado muy grande:</b> el capacitor se descarga casi del todo entre picos. La fórmula ya no es buena (supone rizado chico). Aumentá C o usá onda completa.';
            else if (pct > 10) t += 'Rizado moderado. Para la mayoría de los circuitos hace falta un regulador después. Probá duplicar C: el rizado se reduce a la mitad.';
            else t += 'Rizado chico: la tensión es casi continua. Fijate el precio: los diodos conducen en pulsos cortos y altos (gráfico de abajo), varias veces la corriente media.';
            if (!arr.value && Math.abs(R.vr_pp - vrF) / Math.max(R.vr_pp, 1e-9) > 0.08 && pct <= 25) t += ' La fórmula da un poco más que lo medido porque supone que el capacitor se descarga durante todo el período (en realidad, una parte del tiempo lo están cargando los diodos).';
            nota.innerHTML = t;
            cv1.redibujar(); cv2.redibujar();
          }
          upd();
        },
      },
      {
        titulo: 'Carga y descarga de un capacitor (circuito RC)',
        descripcion: 'Accioná la llave para cargar o descargar el capacitor a través de R. La animación avanza una constante de tiempo τ cada 1,5 segundos, sea τ de milisegundos o de minutos.',
        montar(cont, H) {
          const { controles, vista } = H.layout(cont);
          const vv = H.slider(controles, { label: 'V (batería)', min: 1, max: 24, step: 0.5, value: 9, unidad: 'V', onInput: reiniciar });
          const rr = H.slider(controles, { label: 'R', min: 100, max: 1e6, log: true, value: 10e3, unidad: 'Ω', onInput: reiniciar });
          const cc = H.slider(controles, { label: 'C', min: 1, max: 4700, log: true, value: 100, fmt: v => H.fmt(v * 1e-6, 'F'), onInput: reiniciar });
          const fila = H.el('div', { style: 'display:flex;gap:8px;flex-wrap:wrap' }); controles.append(fila);
          H.boton(fila, '⚡ Cargar', () => accionar('carga'), 'btn primario');
          H.boton(fila, '↓ Descargar', () => accionar('descarga'));
          H.nota(controles, 'Tanque de agua: la altura del agua es la tensión del capacitor.');
          const fig = H.el('div', { style: 'max-width:460px;width:100%;margin:0 auto' }); vista.append(fig);
          const cv = H.canvas(vista, { alto: (w) => w < 500 ? 230 : 260, dibujar });
          const lec = H.lecturas(vista);
          const nota = H.nota(vista);
          let modo = 'reposo', V0 = 0, tSim = 0, tPrev = 0, hist = [];
          const tau = () => rr.value * cc.value * 1e-6;
          const vc = (t) => modo === 'carga' ? vv.value + (V0 - vv.value) * Math.exp(-t / tau()) : modo === 'descarga' ? V0 * Math.exp(-t / tau()) : V0;
          function accionar(m) { V0 = vc(tSim); modo = m; tSim = 0; hist = [[0, V0]]; esquema(); }
          function reiniciar() { V0 = Math.min(vc(tSim), Math.max(vv.value, V0)); if (V0 > vv.value && modo === 'carga') V0 = vv.value; tSim = 0; hist = [[0, V0]]; esquema(); }
          function esquema() {
            fig.innerHTML = Esq.svg(440, 195, rcSVG(modo, { v: H.fmt(vv.value, 'V'), r: H.fmt(rr.value, 'Ω'), c: H.fmt(cc.value * 1e-6, 'F') }));
          }
          function dibujar(ctx, w, h) {
            const T = tau(), tmax = 6 * T, Vm = vv.value;
            const tanque = 70, wg = w - tanque - 10;
            const P = H.ejes(ctx, w, h, { w: wg - 52 - 6, xmin: 0, xmax: tmax, ymin: 0, ymax: Vm * 1.1, xlabel: 't', ylabel: 'Vc (V)', xticks: [0, T, 2 * T, 3 * T, 4 * T, 5 * T, 6 * T], xfmt: (x) => x === 0 ? '0' : H.num(x / T, 0) + 'τ' });
            if (modo !== 'reposo') {
              for (let k = 1; k <= 5; k++) P.vline(k * T, { color: H.col('grid'), guiones: [3, 3] });
              const nivel = modo === 'carga' ? Vm + (V0 - Vm) * Math.exp(-1) : V0 * Math.exp(-1);
              P.hline(nivel, { color: H.col('amber'), label: modo === 'carga' ? '63 % (en t = τ)' : '37 % (en t = τ)', labelX: tmax });
              P.punto(T, nivel, { color: H.col('amber'), r: 4 });
              P.vline(5 * T, { color: H.col('green'), guiones: [5, 4], label: '5τ ≈ ' + (modo === 'carga' ? 'cargado' : 'descargado'), labelY: Vm * 0.5 });
              P.fn((t) => vc(t), { color: H.col('muted'), guiones: [3, 4], ancho: 1 });
              P.pts(hist, { color: H.col('c1'), ancho: 3 });
              const v = vc(tSim); P.punto(Math.min(tSim, tmax), v, { color: H.col('accent') });
            } else {
              P.texto(tmax / 2, Vm * 0.55, 'Tocá “Cargar” para empezar', { color: H.col('muted'), align: 'center' });
            }
            P.hline(Vm, { color: H.col('c4'), label: 'V batería', labelX: tmax * 0.3 });
            // tanque
            const tx = w - tanque, ty = P.y0, th = P.h, frac = Math.max(0, Math.min(1, vc(tSim) / (Vm * 1.1)));
            ctx.save();
            ctx.fillStyle = H.col('c1'); ctx.globalAlpha = 0.35;
            ctx.fillRect(tx + 10, ty + th * (1 - frac), tanque - 20, th * frac);
            ctx.globalAlpha = 1; ctx.strokeStyle = H.col('ink'); ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(tx + 10, ty); ctx.lineTo(tx + 10, ty + th); ctx.lineTo(tx + tanque - 10, ty + th); ctx.lineTo(tx + tanque - 10, ty); ctx.stroke();
            ctx.fillStyle = H.col('ink'); ctx.font = '600 11px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('tanque', tx + tanque / 2, ty + th + 16);
            ctx.restore();
          }
          function lecturas() {
            const T = tau(), v = vc(tSim), Vm = vv.value;
            const i = modo === 'carga' ? (Vm - v) / rr.value : modo === 'descarga' ? -v / rr.value : 0;
            lec.set([
              { k: 'τ = R·C', v: H.fmt(T, 's') },
              { k: 'Vc', v: H.fmt(v, 'V') },
              { k: 'Corriente', v: H.fmt(i, 'A'), estado: Math.abs(i) > 0 ? '' : '' },
              { k: 'Carga', v: H.num(v / Vm * 100, 1) + ' %' },
              { k: 'Tiempo', v: H.fmt(tSim, 's') + ' = ' + H.num(tSim / T, 2) + ' τ' },
            ]);
          }
          let ultNota = '';
          function textoNota() {
            const T = tau(), k = tSim / T;
            let t;
            if (modo === 'reposo') t = 'La llave está en el medio: el capacitor no se carga ni se descarga.';
            else if (modo === 'carga') t = k < 1 ? '<b>Cargando:</b> al principio la corriente es máxima (el capacitor “vacío” es casi un cortocircuito) y la tensión sube rápido.'
              : k < 5 ? '<b>Cargando:</b> a medida que se llena, la diferencia entre la batería y el capacitor es menor: la corriente baja y la tensión sube cada vez más despacio.'
                : '<b>Cargado:</b> después de 5τ la tensión llegó al 99 % de la batería y la corriente es prácticamente cero. Un capacitor cargado no deja pasar continua.';
            else t = k < 5 ? '<b>Descargando por R:</b> el capacitor ahora actúa como “pila”: entrega corriente, pero su tensión baja en forma exponencial. Así se descarga el capacitor de filtro entre dos picos.' : '<b>Descargado:</b> después de 5τ queda menos del 1 %.';
            t += ` Con R = ${H.fmt(rr.value, 'Ω')} y C = ${H.fmt(cc.value * 1e-6, 'F')}: τ = ${H.fmt(T, 's')}.`;
            return t;
          }
          esquema();
          H.loop((t) => {
            const dt = Math.min(0.1, t - tPrev); tPrev = t;
            if (modo !== 'reposo' && tSim < 6 * tau()) {
              tSim = Math.min(6 * tau(), tSim + dt * tau() / 1.5);
              hist.push([tSim, vc(tSim)]);
            }
            cv.redibujar(); lecturas();
            const nt = textoNota(); if (nt !== ultNota) { nota.innerHTML = nt; ultNota = nt; }
          });
        },
      },
    ],

    ejercicios: [
      {
        nivel: 'Básico',
        enunciado: String.raw`Un capacitor de $470\,\mu\text{F}$ se carga desde una batería de 9 V a través de $10\,\text{k}\Omega$. Calculá la constante de tiempo, el tiempo para considerarlo cargado y la tensión que tiene después de una constante de tiempo.`,
        pista: String.raw`$\tau=RC$; “cargado” = $5\tau$; en $t=\tau$ llega al 63 %.`,
        solucion: String.raw`$\tau=10\,000\cdot470\cdot10^{-6}=4{,}7\,\text{s}$. Cargado en $5\tau=23{,}5\,\text{s}$. En $t=\tau$: $V_C=9\,(1-e^{-1})=9\cdot0{,}632=5{,}69\,\text{V}$.`,
      },
      {
        nivel: 'Básico',
        enunciado: String.raw`Una fuente con transformador de 12 V y puente alimenta una carga de $150\,\Omega$. El capacitor de filtro es de $2200\,\mu\text{F}$. Calculá la corriente de carga, el rizado y la tensión continua.`,
        pista: String.raw`$V_p=\sqrt2\cdot12-1{,}4$. Onda completa: $f_r=100\,\text{Hz}$. $V_r=I_L/(f_r C)$.`,
        solucion: String.raw`$V_p=15{,}57\,\text{V}$; $I_L\approx\frac{15{,}57}{150}=104\,\text{mA}$. $V_r=\frac{0{,}104}{100\cdot0{,}0022}=0{,}47\,\text{V}$. $V_{CC}\approx15{,}57-0{,}24=15{,}3\,\text{V}$. Rizado: 3 %.`,
      },
      {
        nivel: 'Intermedio',
        enunciado: String.raw`Con los mismos datos del ejercicio anterior, alguien arma la fuente con un solo diodo (media onda, $V_p\approx16{,}3\,\text{V}$). ¿Cuánto vale ahora el rizado? ¿Qué capacitor haría falta para tener el mismo rizado que con el puente?`,
        pista: String.raw`En media onda $f_r=50\,\text{Hz}$: el capacitor se descarga durante el doble de tiempo.`,
        solucion: String.raw`$I_L\approx16{,}3/150=109\,\text{mA}$. $V_r=\frac{0{,}109}{50\cdot0{,}0022}=0{,}99\,\text{V}$: el doble (y un poco más porque el pico es mayor). Para volver a $\approx0{,}47\,\text{V}$ hace falta el doble de capacidad: $C=\frac{0{,}109}{50\cdot0{,}47}=4600\,\mu\text{F}$ → <b>4700 µF</b>. Moraleja: la onda completa ahorra capacitor.`,
      },
      {
        nivel: 'Intermedio',
        enunciado: String.raw`Diseñá el filtro para una fuente con transformador de 9 V y puente que debe entregar 300 mA con un rizado máximo de 1 V. Elegí el capacitor comercial (capacidad y tensión de trabajo) y calculá la tensión mínima (valle).`,
        pista: String.raw`$C=I_L/(f_rV_r)$. Para la tensión de trabajo: pico sin carga con red +10 %, por 1,5.`,
        solucion: String.raw`$V_p=\sqrt2\cdot9-1{,}4=11{,}33\,\text{V}$. $C=\frac{0{,}3}{100\cdot1}=3000\,\mu\text{F}$ → <b>3300 µF</b>, que da $V_r=\frac{0{,}3}{100\cdot0{,}0033}=0{,}91\,\text{V}$; valle $=11{,}33-0{,}91=10{,}4\,\text{V}$. Tensión de trabajo: $12{,}73\cdot1{,}1-1{,}4=12{,}6\,\text{V}$; $\times1{,}5=18{,}9\,\text{V}$ → <b>25 V</b> (el de 16 V queda sin margen). Capacitor: 3300 µF × 25 V.`,
      },
      {
        nivel: 'Avanzado',
        enunciado: String.raw`Para la fuente del ejercicio 4, estimá el ángulo de conducción, el tiempo que conducen los diodos en cada pico y la corriente pico. ¿Cuántas veces la corriente media de la carga es?`,
        pista: String.raw`$\cos\theta=1-V_r/V_p$; $t_c=\theta/(2\pi\cdot50)$; $I_{pico}\approx2I_L\,T_r/t_c$ con $T_r=10\,\text{ms}$.`,
        solucion: String.raw`$\cos\theta=1-\frac{0{,}91}{11{,}33}=0{,}920$ → $\theta=23{,}1^\circ=0{,}403\,\text{rad}$. $t_c=\frac{0{,}403}{2\pi\cdot50}=1{,}28\,\text{ms}$. $I_{pico}\approx2\cdot0{,}3\cdot\frac{10}{1{,}28}=4{,}7\,\text{A}$: unas <b>16 veces</b> la corriente media (el valor real será menor por la resistencia del bobinado; probalo en la simulación con Rs = 1 Ω). Por eso los diodos y el transformador se eligen “holgados”.`,
      },
      {
        nivel: 'Avanzado',
        enunciado: String.raw`Un alumno arma una fuente con transformador de 12 V, puente y un electrolítico de $1000\,\mu\text{F} \times 16\,\text{V}$. Funciona en el banco, pero a la semana el capacitor está inflado. ¿Por qué? ¿Qué capacitor debió usar? ¿Qué pasa si además lo conectó al revés?`,
        pista: String.raw`Calculá la tensión sin carga con la red un 10 % alta.`,
        solucion: String.raw`Sin carga: $V_p=16{,}97-1{,}4=15{,}57\,\text{V}$; con la red +10 %: $16{,}97\cdot1{,}1-1{,}4=17{,}3\,\text{V}$ → <b>supera los 16 V</b> del capacitor. Trabajando por encima (o muy cerca) de su tensión nominal, el dieléctrico se degrada, se calienta y se infla. Debió ser de $17{,}3\cdot1{,}5=26\,\text{V}$ → <b>35 V</b> (o como mínimo 25 V). Al revés, el electrolítico conduce, se calienta en segundos y puede explotar.`,
      },
      {
        nivel: 'Avanzado',
        enunciado: String.raw`Con transformador de 12 V, puente y $C=2200\,\mu\text{F}$, calculá el rizado y la tensión continua cuando la carga consume 50 mA y cuando consume 500 mA. ¿Qué conclusión sacás?`,
        pista: String.raw`$V_r=I_L/(f_rC)$ y $V_{CC}\approx V_p-V_r/2$, con $V_p=15{,}57\,\text{V}$.`,
        solucion: String.raw`50 mA: $V_r=\frac{0{,}05}{100\cdot0{,}0022}=0{,}23\,\text{V}$, $V_{CC}=15{,}46\,\text{V}$. 500 mA: $V_r=2{,}27\,\text{V}$, $V_{CC}=14{,}43\,\text{V}$. La tensión de salida <b>depende de la carga</b> (y además ondula más). Un circuito que necesita una tensión fija no puede alimentarse solo con el filtro: hace falta un <b>regulador</b> (tema 13).`,
      },
    ],

    quiz: [
      { pregunta: 'En el filtro con capacitor, los diodos del rectificador conducen…', opciones: ['Todo el tiempo', 'Durante todo el semiciclo positivo', 'Solo un ratito cerca de cada pico', 'Nunca, el capacitor los reemplaza'], correcta: 2, explicacion: 'Solo conducen cuando la tensión del rectificador supera a la del capacitor, es decir cerca de los picos. El resto del tiempo el capacitor alimenta la carga.' },
      { pregunta: 'Si duplicás la capacidad del capacitor de filtro (misma carga), el rizado…', opciones: ['Se duplica', 'Se reduce a la mitad', 'No cambia', 'Se reduce a la cuarta parte'], correcta: 1, explicacion: 'Vr ≈ I/(f·C): es inversamente proporcional a C.' },
      { pregunta: 'Con los mismos componentes, ¿qué rectificador da menos rizado?', opciones: ['Media onda', 'Onda completa', 'Dan lo mismo', 'Depende del capacitor'], correcta: 1, explicacion: 'En onda completa los picos llegan cada 10 ms (100 Hz) en lugar de cada 20 ms: el capacitor se descarga la mitad.' },
      { pregunta: 'Un circuito RC tiene R = 1 kΩ y C = 1000 µF. ¿Cuánto tarda en cargarse prácticamente del todo?', opciones: ['1 s', '5 s', '1 ms', '0,2 s'], correcta: 1, explicacion: 'τ = RC = 1000 · 0,001 = 1 s; “cargado” se considera a los 5τ = 5 s.' },
      { pregunta: 'Para un capacitor de filtro en una fuente cuyo pico sin carga es de 17 V, la tensión de trabajo adecuada es…', opciones: ['16 V', '17 V', '25 V o más', 'No importa'], correcta: 2, explicacion: 'Se pide un margen de al menos 1,5×: 17 · 1,5 ≈ 25 V. El de 16 V se dañaría.' },
      { pregunta: '¿Para qué sirve el capacitor cerámico de 100 nF al lado de un integrado?', opciones: ['Para aumentar la tensión', 'Para filtrar el ruido de alta frecuencia cerca del integrado (desacople)', 'Para reemplazar al electrolítico', 'Para limitar la corriente'], correcta: 1, explicacion: 'El electrolítico grande filtra bien a 100 Hz; el cerámico chico, cerca del integrado, filtra el ruido rápido (MHz).' },
    ],

    docente: String.raw`
<h3>Objetivo de la clase</h3>
<p>Que el alumno entienda <b>por qué</b> un capacitor “alisa” la tensión (se carga en los picos y se descarga en la carga), que sepa calcular el rizado y elegir el capacitor (capacidad, tensión y polaridad). <b>Duración sugerida:</b> 1 a 2 clases de 60–80 min.</p>

<h3>Secuencia sugerida</h3>
<ol>
<li><b>Repaso y pregunta disparadora (5 min):</b> “Tenemos la salida del puente, que baja a cero 100 veces por segundo. ¿Qué componente puede guardar energía para cuando la tensión baja?”. Presentá la analogía del tanque.</li>
<li><b>Carga y descarga RC (15 min):</b> simulación 2. Con R = 10 kΩ y C = 100 µF (τ = 1 s), apretá “Cargar” y antes de que llegue preguntá: “¿a qué tensión va a llegar?, ¿sube siempre igual de rápido?”. Marcá el 63 % en τ. Después descargá. Variá R y C y pedile que prediga τ antes de mirarlo (truco: kΩ × µF = ms).</li>
<li><b>El filtro (20 min):</b> simulación 1, empezando con C = 10 µF (casi sin filtro) y RL = 100 Ω. Subí C de a poco y pedile que describa qué pasa. Preguntá: “¿por qué la curva azul sigue a la punteada en un tramo y en otro no?” (ahí conducen o no los diodos). Mostrá el gráfico de corriente: “¿por qué la corriente del diodo es tan alta si la carga toma 150 mA?”.</li>
<li><b>Fórmula del rizado (10 min):</b> deducila en el pizarrón con $\Delta V=I\Delta t/C$. Compará el Vr de la fórmula con el medido en la simulación. Cambiá a media onda: el rizado se duplica.</li>
<li><b>Electrolíticos (10 min):</b> si tenés uno a mano, mostrá la franja del −, la pata larga, la tensión impresa y la cruz de seguridad. Contá (o mostrá un video) de un electrolítico invertido.</li>
<li><b>Diseño (15 min):</b> resolvé juntos el ejemplo de la sección 9 o el ejercicio 4. Cierre: “¿qué pasa con la tensión si la carga consume más?” (ejercicio 7) → motiva el tema 13.</li>
</ol>

<h3>Errores frecuentes del alumno</h3>
<ul>
<li>Usar $f_r = 50\,\text{Hz}$ con un puente (o 100 Hz con media onda).</li>
<li>Calcular la tensión de trabajo del capacitor con la tensión eficaz del transformador (12 V) en lugar del pico.</li>
<li>Pensar que el capacitor “convierte” la alterna en continua por sí solo (sin rectificador, un capacitor en paralelo con la alterna no hace nada útil).</li>
<li>Creer que con más capacitor todo mejora: crecen los picos de corriente y el pico de encendido.</li>
<li>Confundir µF con nF o pF al leer códigos (104 = 100 nF; 1000 µF = 1 mF).</li>
<li>Olvidar que la tensión con filtro es cercana al <b>pico</b> (≈ 15 V con transformador de 12 V), no al valor medio sin filtro.</li>
</ul>

<h3>Preguntas para hacerle pensar</h3>
<ul>
<li>¿Por qué una fuente “de 12 V” barata marca 16 V sin carga y 12 V con carga? (No regulada: el filtro sube hasta el pico.)</li>
<li>¿Qué pasaría si sacamos el capacitor de una fuente que alimenta un Arduino?</li>
<li>¿Por qué al desenchufar un equipo el LED piloto tarda en apagarse?</li>
<li>¿Por qué las fuentes de computadora (conmutadas) usan capacitores mucho más chicos? (Trabajan a decenas de kHz: Vr = I/(f·C) con f enorme.)</li>
</ul>

<h3>Recordatorio rápido para vos</h3>
<ul>
<li>$\tau=RC$; 63 % en τ; 99,3 % en 5τ. kΩ × µF = ms.</li>
<li>$V_r\approx I_L/(f_rC)$, $V_{CC}\approx V_p-V_r/2$; $f_r$ = 50 Hz (media onda) o 100 Hz (onda completa).</li>
<li>Rizado diente de sierra: $V_{r,ef}=V_r/(2\sqrt3)\approx0{,}29\,V_r$; factor de rizado $r=V_{r,ef}/V_{CC}$.</li>
<li>Regla de taller: 1000–2000 µF por ampere en onda completa; tensión de trabajo ≥ 1,5 × pico sin carga.</li>
<li>Electrolíticos: valores E6 (1, 2,2, 3,3, 4,7, 6,8 × 10ⁿ µF); tensiones 6,3/10/16/25/35/50/63/100 V; 85 °C o 105 °C.</li>
<li>Corriente eficaz del secundario con filtro capacitivo: 1,6–1,8 × I_CC (VA del transformador ≈ 1,8 × V·I).</li>
<li>Código de cerámicos: 104 = 10·10⁴ pF = 100 nF; 103 = 10 nF; 473 = 47 nF.</li>
</ul>

<h3>Experiencia práctica</h3>
<p><b>RC casero:</b> batería de 9 V, resistencia de 10 kΩ, electrolítico de 470 µF o 1000 µF (respetá la polaridad), multímetro y cronómetro del celular. Medí Vc cada 5 s durante la carga y graficá en papel o planilla: comparalo con la curva teórica (τ = 4,7 s o 10 s). Después descargalo por la misma resistencia.</p>
<p><b>En Tinkercad o Falstad:</b> puente + capacitor + resistencia de carga + osciloscopio. Cambiá el capacitor (100 µF, 1000 µF, 4700 µF) y medí el rizado con el osciloscopio en acople CA. En Falstad, agregá un amperímetro en serie con un diodo para ver los pulsos de corriente.</p>
<p><b>Real (con supervisión):</b> la fuente del tema 11 (transformador de 12 V + puente) con una lámpara de 12 V. Medí en V⎓ sin y con capacitor de 2200 µF × 25 V: de ≈ 10 V pasa a ≈ 15 V. Si hay osciloscopio, el diente de sierra es muy claro.</p>
`,
  });
})();
