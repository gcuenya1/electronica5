/* Tema 11 — Rectificadores
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
    const ondas = [
      onda(sen, 35, 56, 115, 18),        // red
      onda(sen, 160, 96, 115, 9),        // trafo
      onda(rect, 320, 96, 127, 24),      // rectificador
      onda(riz, 480, 96, 127, 24),       // filtro
      onda(u.map(() => 0.75), 640, 96, 127, 24), // regulador
    ];
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

  /* ---------- Esquemas de los tres rectificadores ----------
     pol: 'pos' | 'neg' | null (polaridad del secundario) ; conduce: si hay corriente */
  const glow = (pts) => `<polyline points="${pts.map(q => q.join(',')).join(' ')}" fill="none" style="stroke:var(--accent)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`;
  const A = (on, s) => on ? `<g style="color:var(--accent)">${s}</g>` : s;
  const ACC = 'var(--accent)';
  const ALTO = { mo: 180, pm: 210, pu: 215 };

  function esqRect(conf, pol, conduce, v = {}) {
    const g = [], p = [];
    p.push(Esq.cable([[40, 80], [40, 60], [80, 60]]), Esq.fuenteAC(40, 80, 40, 120), Esq.cable([[40, 120], [40, 140], [80, 140]]),
      Esq.texto(40, 165, '220 V~', { size: 12 }), Esq.trafo(80, 60, conf === 'pm', 'T1'));
    if (pol) { const pos = pol === 'pos'; p.push(Esq.pm(140, pos ? 70 : 126, 140, pos ? 126 : 70, 'var(--c2)')); }
    if (conf === 'mo') {
      const on = pol === 'pos' && conduce;
      const w1 = [[150, 60], [175, 60]], w2 = [[255, 60], [310, 60], [310, 70]], w3 = [[310, 130], [310, 140], [150, 140]];
      if (on) g.push(glow(w1), glow([[175, 60], [255, 60]]), glow(w2), glow([[310, 70], [310, 130]]), glow(w3));
      const d1 = Esq.D(175, 60, 255, 60, 'D1', '', 1);
      p.push(A(on, Esq.cable(w1)), pol === 'neg' ? `<g style="color:var(--red)">${d1}</g>` : A(on, d1), A(on, Esq.cable(w2)),
        A(on, Esq.R(310, 70, 310, 130, 'RL', v.rl || '', 1)), A(on, Esq.cable(w3)), Esq.pm(293, 76, 293, 124, 'var(--c1)'));
      if (on) p.push(Esq.flecha(262, 47, 298, 47, '', ACC));
      if (pol === 'neg') p.push(Esq.texto(228, 98, 'D1 en inversa:', { size: 11, color: 'var(--red)' }), Esq.texto(228, 113, 'no hay corriente', { size: 11, color: 'var(--red)' }));
    } else if (conf === 'pm') {
      const on1 = pol === 'pos' && conduce, on2 = pol === 'neg' && conduce, on = on1 || on2;
      const w1 = [[150, 60], [165, 60], [165, 35], [185, 35]], w1b = [[265, 35], [305, 35], [305, 100]];
      const w2 = [[150, 140], [165, 140], [165, 165], [185, 165]], w2b = [[265, 165], [305, 165], [305, 100]];
      const wct = [[150, 100], [215, 100]], wr = [[285, 100], [305, 100]];
      if (on1) g.push(glow(w1), glow([[185, 35], [265, 35]]), glow(w1b));
      if (on2) g.push(glow(w2), glow([[185, 165], [265, 165]]), glow(w2b));
      if (on) g.push(glow(wr), glow([[285, 100], [215, 100]]), glow(wct));
      p.push(A(on1, Esq.cable(w1)), A(on1, Esq.D(185, 35, 265, 35, 'D1', '', 1)), A(on1, Esq.cable(w1b)),
        A(on2, Esq.cable(w2)), A(on2, Esq.D(185, 165, 265, 165, 'D2', '', -1)), A(on2, Esq.cable(w2b)),
        A(on, Esq.cable(wct)), A(on, Esq.R(215, 100, 285, 100, 'RL', v.rl || '', 1)), A(on, Esq.cable(wr)),
        Esq.nodo(305, 100), Esq.pm(293, 84, 205, 84, 'var(--c1)'), Esq.texto(172, 94, 'CT', { size: 10, peso: 700 }));
      if (on) p.push(Esq.flecha(272, 118, 228, 118, '', ACC));
    } else {
      const on1 = pol === 'pos' && conduce, on2 = pol === 'neg' && conduce, on = on1 || on2;
      const wS1 = [[150, 60], [170, 60], [170, 25], [250, 25], [250, 45]], wS2 = [[150, 140], [170, 140], [170, 175], [250, 175], [250, 155]];
      const wo = [[305, 100], [360, 100], [360, 110]], wret = [[360, 180], [360, 200], [195, 200], [195, 100]];
      if (on) g.push(glow(wS1), glow(wS2), glow(wo), glow([[360, 110], [360, 180]]), glow(wret));
      if (on1) g.push(glow([[250, 45], [305, 100]]), glow([[195, 100], [250, 155]]));
      if (on2) g.push(glow([[250, 155], [305, 100]]), glow([[195, 100], [250, 45]]));
      p.push(A(on, Esq.cable(wS1)), A(on, Esq.cable(wS2)),
        A(on1, Esq.D(250, 45, 305, 100)), A(on2, Esq.D(250, 155, 305, 100)), A(on2, Esq.D(195, 100, 250, 45)), A(on1, Esq.D(195, 100, 250, 155)),
        A(on, Esq.cable(wo)), A(on, Esq.R(360, 110, 360, 180, 'RL', v.rl || '', 1)),
        A(on, `<path ${S} d="M360 180V200H195V181A6 6 0 0 0 195 169V100"/>`),
        Esq.nodo(250, 45), Esq.nodo(250, 155), Esq.nodo(195, 100), Esq.nodo(305, 100),
        Esq.texto(291, 63, 'D1', { size: 12, color: on1 ? ACC : '' }), Esq.texto(210, 63, 'D3', { size: 12, color: on2 ? ACC : '' }),
        Esq.texto(291, 146, 'D2', { size: 12, color: on2 ? ACC : '' }), Esq.texto(210, 146, 'D4', { size: 12, color: on1 ? ACC : '' }),
        Esq.pm(345, 124, 345, 168, 'var(--c1)'));
      if (on1) p.push(Esq.flecha(196, 13, 232, 13, '', ACC), Esq.flecha(232, 188, 196, 188, '', ACC));
      if (on2) p.push(Esq.flecha(232, 13, 196, 13, '', ACC), Esq.flecha(196, 188, 232, 188, '', ACC));
    }
    return [g.length ? `<g style="opacity:.22">${g.join('')}</g>` : '', ...p];
  }
  const figRect = (conf, pol, pie) => Esq.svg(420, ALTO[conf], esqRect(conf, pol, true), pie);

  /* ---------- Formas de onda chiquitas para la teoría ---------- */
  function ondasSVG(conf) {
    const x0 = 34, x1 = 410, y0 = 96, Am = 56, N = 240;
    const X = (u) => x0 + (x1 - x0) * u, sen = (u) => Math.sin(4 * Math.PI * u);
    const path = (f, a, b) => { let d = ''; for (let i = 0; i <= N; i++) { const uu = a + (b - a) * i / N; d += (i ? 'L' : 'M') + X(uu).toFixed(1) + ' ' + (y0 - Am * f(uu)).toFixed(1); } return d; };
    const out = (u) => conf === 'mo' ? Math.max(0, sen(u)) : Math.abs(sen(u));
    const p = [`<path ${S} stroke-width="1" d="M${x0} ${y0}H${x1 + 4}M${x0} 22V${y0 + 64}"/>`];
    p.push(`<path d="${path(sen, 0, 1)}" fill="none" style="stroke:var(--muted)" stroke-width="1.6" stroke-dasharray="5 4"/>`);
    for (let k = 0; k < 4; k++) {
      const col = k % 2 === 0 ? 'var(--c1)' : (conf === 'mo' ? 'var(--muted)' : 'var(--c2)');
      p.push(`<path d="${path(out, k / 4, (k + 1) / 4)}" fill="none" style="stroke:${col}" stroke-width="3" stroke-linejoin="round"/>`);
    }
    const ley = conf === 'mo' ? [['var(--c1)', 'D1 conduce'], ['var(--muted)', 'nadie conduce']]
      : conf === 'pm' ? [['var(--c1)', 'D1 conduce'], ['var(--c2)', 'D2 conduce']] : [['var(--c1)', 'D1 y D4'], ['var(--c2)', 'D2 y D3']];
    p.push(`<path d="M${x0 + 10} 12h22" style="stroke:var(--muted)" stroke-width="1.6" stroke-dasharray="5 4"/>`, Esq.texto(x0 + 36, 16, 'entrada (secundario)', { size: 11, anchor: 'start', peso: 400 }));
    ley.forEach(([c, t], i) => p.push(`<path d="M${x0 + 170 + i * 110} 12h22" style="stroke:${c}" stroke-width="3"/>`, Esq.texto(x0 + 196 + i * 110, 16, t, { size: 11, anchor: 'start', peso: 400 })));
    p.push(Esq.texto(x1 + 6, y0 + 16, 't', { size: 12, anchor: 'end' }), Esq.texto(x0 - 6, 30, 'v', { size: 12, anchor: 'end' }),
      Esq.texto(x0 - 6, y0 - Am + 4, '+Vp', { size: 10, anchor: 'end', peso: 400 }), Esq.texto(x0 - 6, y0 + Am + 4, '−Vp', { size: 10, anchor: 'end', peso: 400 }));
    return p;
  }

  registrarTema({
    id: 'rectificadores',
    orden: 11,
    titulo: 'Rectificadores',
    resumen: 'De la alterna de la red a una continua pulsante: transformador, media onda, punto medio y puente',
    confirmar: false,

    teoria: String.raw`
<p>Casi todo lo electrónico (un Arduino, un cargador de celular, un amplificador) funciona con <b>corriente continua</b>: una tensión que no cambia de signo. Pero el enchufe nos da <b>alterna</b>: 220 V eficaces que cambian de polaridad 50 veces por segundo. La <b>fuente de alimentación</b> es el circuito que hace esa conversión, y se arma en etapas. En los próximos tres temas vamos a recorrer esa cadena bloque por bloque:</p>
${cadena('rect')}
<p>En este tema vemos los dos primeros bloques: el <b>transformador</b> (baja la tensión a un valor manejable) y el <b>rectificador</b> (con diodos, “da vuelta” los semiciclos negativos para que la corriente por la carga circule siempre en el mismo sentido). Lo que obtenemos todavía no es una continua “lisa”: es una <b>continua pulsante</b>. El filtro (tema 12) y el regulador (tema 13) la terminan de alisar.</p>

<h2>1. ¿Qué significa rectificar?</h2>
<p>Rectificar es convertir una tensión alterna (que tiene semiciclos positivos y negativos) en una tensión que tenga <b>siempre la misma polaridad</b>. No es todavía una continua constante como la de una pila: sube y baja, pero <b>nunca cambia de signo</b>. Por eso se la llama <b>continua pulsante</b>: tiene un <em>valor medio</em> distinto de cero (que es lo que nos interesa) más una parte alterna (el “zumbido” que después hay que filtrar).</p>
<div class="caja idea"><span class="caja-titulo">Analogía: válvulas en una cañería</span>
Imaginá una bomba de agua que empuja para un lado y para el otro (la alterna). Si ponés una <b>válvula antirretorno</b> (el diodo), el agua solo pasa en un sentido. Con una válvula aprovechás la mitad de los empujones (media onda); con un arreglo de cuatro válvulas podés hacer que <b>los dos</b> empujones terminen moviendo el agua en el mismo sentido por la carga (puente).
</div>

<h2>2. El transformador</h2>
<p>Es el primer bloque. Tiene dos bobinados sobre un núcleo de hierro: el <b>primario</b> (se conecta a la red) y el <b>secundario</b> (alimenta al circuito). Además de bajar la tensión, cumple una función de seguridad clave: <b>aísla</b> el circuito de la red (no hay conexión eléctrica entre primario y secundario, solo magnética).</p>
<div class="caja formula"><span class="caja-titulo">Relación de transformación</span>
$$\frac{V_1}{V_2} = \frac{N_1}{N_2} = a \qquad\qquad \frac{I_2}{I_1}\approx a \quad(\text{la potencia se conserva: } V_1 I_1 \approx V_2 I_2)$$
<p>$N_1$, $N_2$: número de espiras del primario y del secundario. Si el secundario tiene menos vueltas, la tensión baja y la corriente disponible sube.</p>
</div>
<p>Muy importante: los transformadores se especifican en <b>valor eficaz</b> (RMS). Un transformador “de 12 V” entrega 12 V eficaces, pero los diodos y capacitores “ven” el <b>valor pico</b>:</p>
<div class="caja formula"><span class="caja-titulo">Eficaz y pico de una senoidal</span>
$$V_p = \sqrt{2}\cdot V_{ef} \approx 1{,}414\cdot V_{ef} \qquad\qquad V_{ef} = \frac{V_p}{\sqrt 2}\approx 0{,}707\cdot V_p$$
</div>
<div class="caja ejemplo"><span class="caja-titulo">Ejemplo: de 220 V a 12 V</span>
<p>Red: $V_{1,ef}=220\,\text{V}$ → $V_{1,p}=\sqrt2\cdot220 = 311\,\text{V}$ (sí: el enchufe llega a 311 V en cada pico).</p>
<p>Transformador de 12 V: $V_{2,p}=\sqrt2\cdot12=16{,}97\approx17\,\text{V}$.</p>
<p>Relación: $a=\dfrac{220}{12}=18{,}3$. El primario tiene unas 18 veces más espiras que el secundario. Si la carga toma 1 A del secundario, del primario se toman aprox. $1/18{,}3\approx55\,\text{mA}$.</p>
</div>
<p><b>Transformador con punto medio (toma central):</b> el secundario tiene un cable extra en la mitad del bobinado. Se lo designa por ejemplo “12 V + 12 V” o “12‑0‑12 V”: entre cada extremo y el centro hay 12 V eficaces, y entre los dos extremos 24 V. Lo vamos a usar en el rectificador de onda completa con 2 diodos.</p>
<div class="caja ojo"><span class="caja-titulo">Seguridad</span>
El primario está a 220 V: es <b>peligroso</b>. En el taller, los transformadores van con fusible en el primario, bornes aislados y nunca se mide del lado de la red sin supervisión. Todo lo que hagamos en clase es del lado del secundario (baja tensión).
</div>

<h2>3. Repaso relámpago del diodo</h2>
<ul>
<li><b>Polarizado en directa</b> (ánodo más positivo que el cátodo): conduce y cae aproximadamente <b>0,7 V</b> (silicio). En la “aproximación ideal” lo tomamos como un cable (0 V).</li>
<li><b>Polarizado en inversa</b>: no conduce (circuito abierto). Pero <b>soporta</b> toda la tensión inversa que le aplique el circuito: si esa tensión supera su máximo ($V_{RRM}$), se rompe.</li>
</ul>
<p>Cuando la tensión del transformador es grande (12 V o más), los 0,7 V casi no cambian el resultado; cuando es chica (3 V, 5 V), sí importan.</p>

<h2>4. Rectificador de media onda (1 diodo)</h2>
<p>Es el más simple: un diodo en serie entre el secundario y la carga.</p>
<div class="dos-col">
<div>${figRect('mo', 'pos', 'Semiciclo positivo: S1 es + → D1 en directa, la corriente recorre el camino resaltado.')}</div>
<div>${figRect('mo', 'neg', 'Semiciclo negativo: S1 es − → D1 en inversa: circuito abierto, la salida es 0 V.')}</div>
</div>
<ol>
<li><b>Semiciclo positivo:</b> el extremo superior del secundario (S1) es positivo respecto del inferior. El ánodo de D1 queda más positivo que su cátodo → D1 conduce. La corriente sale por S1, atraviesa D1, baja por $R_L$ (de + a −) y vuelve al secundario por S2. Sobre la carga aparece la senoidal menos 0,7 V.</li>
<li><b>Semiciclo negativo:</b> S1 es negativo. D1 queda en inversa: no hay corriente, la salida es 0 V. Toda la tensión del secundario queda aplicada sobre el diodo.</li>
</ol>
${Esq.svg(420, 170, ondasSVG('mo'), 'Media onda: la salida (color) solo aprovecha los semiciclos positivos de la entrada (punteada).')}
<div class="caja formula"><span class="caja-titulo">Media onda — fórmulas</span>
$$V_{p,sal}=V_p-0{,}7\,\text{V}\qquad V_{med}=\frac{V_{p,sal}}{\pi}\approx0{,}318\,V_{p,sal}\qquad V_{rms}=\frac{V_{p,sal}}{2}$$
$$f_{sal}=f_{red}=50\,\text{Hz}\qquad PIV = V_p\qquad I_D=I_{carga}$$
</div>
<p><b>¿De dónde sale $V_p/\pi$?</b> El valor medio es el área bajo la curva en un período dividida por el período. Durante medio período el área de la senoidal es $\int_0^{T/2} V_p\sin(\omega t)\,dt = \dfrac{V_p T}{\pi}$; en el otro medio período el área es 0. Entonces $V_{med}=\dfrac{1}{T}\cdot\dfrac{V_pT}{\pi}=\dfrac{V_p}{\pi}$. (Para la onda completa hay dos “jorobas” por período: el doble, $2V_p/\pi$.)</p>
<p><b>PIV (tensión inversa de pico):</b> es la máxima tensión inversa que soporta el diodo. En media onda, en el pico negativo el diodo tiene el secundario entero aplicado en inversa: $PIV = V_p$. El diodo que elijas debe tener $V_{RRM}$ mayor que la PIV, con margen (el doble es una buena regla).</p>
<div class="caja ejemplo"><span class="caja-titulo">Ejemplo numérico — media onda</span>
Transformador de 12 V, diodo de silicio, carga de 100 Ω:
$$V_p=16{,}97\,\text{V}\;\Rightarrow\;V_{p,sal}=16{,}27\,\text{V}\qquad V_{med}=\frac{16{,}27}{\pi}=5{,}18\,\text{V}\qquad V_{rms}=\frac{16{,}27}{2}=8{,}13\,\text{V}$$
$I_{med}=5{,}18/100=51{,}8\,\text{mA}$, $I_{pico}=163\,\text{mA}$, $f_{sal}=50\,\text{Hz}$, $PIV\approx17\,\text{V}$ → un 1N4001 (50 V, 1 A) alcanza.
</div>
<div class="caja ojo"><span class="caja-titulo">Desventajas de la media onda</span>
Desperdicia la mitad de la energía, el valor medio es bajo (apenas el 32 % del pico), la frecuencia del “zumbido” es de 50 Hz (más difícil de filtrar) y la corriente por el secundario circula siempre en el mismo sentido (magnetiza el núcleo del transformador). Se usa solo en circuitos de muy bajo consumo.
</div>

<h2>5. Onda completa con punto medio (2 diodos)</h2>
<p>Usa un transformador con <b>toma central</b>. Cada mitad del secundario trabaja con su propio diodo, una en cada semiciclo. La carga se conecta entre los cátodos unidos (+) y la toma central (−).</p>
<div class="dos-col">
<div>${figRect('pm', 'pos', 'Semiciclo positivo: conduce D1 con la mitad superior del secundario.')}</div>
<div>${figRect('pm', 'neg', 'Semiciclo negativo: conduce D2 con la mitad inferior. ¡La corriente por RL va en el mismo sentido!')}</div>
</div>
<ol>
<li><b>Semiciclo positivo:</b> S1 es + respecto de la toma central (CT) y S2 es −. D1 conduce: la corriente sale de S1, pasa por D1, atraviesa $R_L$ de derecha a izquierda (del + al −) y vuelve por la CT. D2 tiene el cátodo a $V_p$ y el ánodo a $-V_p$: está en inversa.</li>
<li><b>Semiciclo negativo:</b> ahora S2 es + respecto de la CT. Conduce D2, y la corriente vuelve a atravesar $R_L$ <b>en el mismo sentido</b>. D1 queda en inversa.</li>
</ol>
${Esq.svg(420, 170, ondasSVG('pm'), 'Onda completa: cada semiciclo lo “atiende” un diodo distinto, y la salida tiene el doble de jorobas.')}
<div class="caja formula"><span class="caja-titulo">Punto medio — fórmulas ($V_p$ = pico de <u>cada mitad</u> del secundario)</span>
$$V_{p,sal}=V_p-0{,}7\,\text{V}\qquad V_{med}=\frac{2V_{p,sal}}{\pi}\approx0{,}637\,V_{p,sal}\qquad V_{rms}=\frac{V_{p,sal}}{\sqrt2}$$
$$f_{sal}=2f_{red}=100\,\text{Hz}\qquad PIV = 2V_p - 0{,}7\approx 2V_p\qquad I_{D,med}=\frac{I_{carga}}{2}$$
</div>
<p><b>¿Por qué la PIV es $2V_p$?</b> Mirá D2 en el semiciclo positivo: su cátodo está conectado (a través de D1 que conduce) a $+V_p$ y su ánodo está en S2, que vale $-V_p$ respecto de la CT. La diferencia es $2V_p$ (menos los 0,7 V de D1). Es la gran desventaja de este circuito: los diodos tienen que aguantar el doble.</p>
<div class="caja ejemplo"><span class="caja-titulo">Ejemplo numérico — punto medio</span>
Transformador 12‑0‑12 V, carga 100 Ω: $V_p=16{,}97\,\text{V}$, $V_{p,sal}=16{,}27\,\text{V}$,
$$V_{med}=\frac{2\cdot16{,}27}{\pi}=10{,}36\,\text{V}\qquad V_{rms}=\frac{16{,}27}{\sqrt2}=11{,}5\,\text{V}\qquad PIV=2\cdot16{,}97-0{,}7=33{,}2\,\text{V}$$
$I_{med}=103{,}6\,\text{mA}$ en la carga, pero cada diodo conduce la mitad del tiempo: $I_{D,med}=51{,}8\,\text{mA}$.
</div>

<h2>6. Puente de Graetz (4 diodos)</h2>
<p>Logra onda completa <b>con un transformador común</b> (sin toma central). Los cuatro diodos forman un rombo: dos vértices van al secundario (entrada de alterna, “~”) y los otros dos son la salida (+ y −).</p>
<div class="dos-col">
<div>${figRect('pu', 'pos', 'Semiciclo positivo: conducen D1 y D4 (en serie con la carga).')}</div>
<div>${figRect('pu', 'neg', 'Semiciclo negativo: conducen D2 y D3. La corriente por RL sigue bajando de + a −.')}</div>
</div>
<ol>
<li><b>Semiciclo positivo</b> (S1 +): la corriente sale de S1, llega al vértice superior, pasa por <b>D1</b> hacia el vértice + , baja por $R_L$, llega al vértice − y vuelve por <b>D4</b> al vértice inferior y a S2. D2 y D3 quedan en inversa.</li>
<li><b>Semiciclo negativo</b> (S2 +): la corriente sale de S2, sube por <b>D2</b> al vértice +, baja por $R_L$ (¡mismo sentido!), y vuelve por <b>D3</b> al vértice superior y a S1. D1 y D4 en inversa.</li>
</ol>
<p>En cada semiciclo la corriente atraviesa <b>dos diodos en serie</b>: se pierden $2\cdot0{,}7=1{,}4\,\text{V}$. A cambio, cada diodo bloqueado solo soporta $V_p$ (el otro par queda en paralelo con el secundario a través de los que conducen).</p>
${Esq.svg(420, 170, ondasSVG('pu'), 'Puente: misma forma de onda que el punto medio, pero con un transformador sin toma central.')}
<div class="caja formula"><span class="caja-titulo">Puente — fórmulas</span>
$$V_{p,sal}=V_p-1{,}4\,\text{V}\qquad V_{med}=\frac{2V_{p,sal}}{\pi}\qquad V_{rms}=\frac{V_{p,sal}}{\sqrt2}$$
$$f_{sal}=100\,\text{Hz}\qquad PIV = V_p\qquad I_{D,med}=\frac{I_{carga}}{2}$$
</div>
<div class="caja ejemplo"><span class="caja-titulo">Ejemplo numérico — puente</span>
Transformador de 12 V, carga 100 Ω: $V_{p,sal}=16{,}97-1{,}4=15{,}57\,\text{V}$,
$$V_{med}=\frac{2\cdot15{,}57}{\pi}=9{,}91\,\text{V}\qquad V_{rms}=\frac{15{,}57}{\sqrt2}=11{,}0\,\text{V}\qquad PIV\approx17\,\text{V}$$
$I_{med}=99{,}1\,\text{mA}$; por cada diodo, $49{,}6\,\text{mA}$ de media.
</div>
<div class="caja tip"><span class="caja-titulo">Corriente por cada diodo</span>
En los rectificadores de onda completa cada diodo conduce solo en un semiciclo, así que su corriente media es la <b>mitad</b> de la de la carga. Pero la corriente <b>pico</b> es la misma que la de la carga: $I_{pico}=V_{p,sal}/R_L$. Ojo: cuando agreguemos el capacitor (tema 12) los picos se hacen mucho más grandes.
</div>

<h2>7. Resumen de fórmulas</h2>
<div class="tabla-wrap"><table class="tabla">
<tr><th></th><th>Media onda</th><th>Punto medio</th><th>Puente</th></tr>
<tr><td>Diodos</td><td>1</td><td>2</td><td>4</td></tr>
<tr><td>Transformador</td><td>común</td><td>con toma central</td><td>común</td></tr>
<tr><td>$V_{p,sal}$</td><td>$V_p-0{,}7$</td><td>$V_p-0{,}7$ (de media bobina)</td><td>$V_p-1{,}4$</td></tr>
<tr><td>$V_{med}$ (lo que mide el multímetro en CC)</td><td>$V_{p,sal}/\pi$</td><td>$2V_{p,sal}/\pi$</td><td>$2V_{p,sal}/\pi$</td></tr>
<tr><td>$V_{rms}$</td><td>$V_{p,sal}/2$</td><td>$V_{p,sal}/\sqrt2$</td><td>$V_{p,sal}/\sqrt2$</td></tr>
<tr><td>Frecuencia de salida</td><td>50 Hz</td><td>100 Hz</td><td>100 Hz</td></tr>
<tr><td>PIV de cada diodo</td><td>$V_p$</td><td>$2V_p$</td><td>$V_p$</td></tr>
<tr><td>Corriente media por diodo</td><td>$I_L$</td><td>$I_L/2$</td><td>$I_L/2$</td></tr>
</table></div>

<h2>8. Comparación: ¿cuál conviene?</h2>
<div class="tabla-wrap"><table class="tabla">
<tr><th>Configuración</th><th>Ventajas</th><th>Desventajas</th></tr>
<tr><td><b>Media onda</b></td><td>Un solo diodo, lo más barato y simple.</td><td>Aprovecha medio ciclo; $V_{med}$ bajo; rizado de 50 Hz difícil de filtrar; continua por el transformador (lo calienta).</td></tr>
<tr><td><b>Punto medio</b></td><td>Onda completa con 2 diodos; solo una caída de 0,7 V (bueno para tensiones bajas).</td><td>Requiere toma central; cada mitad del bobinado trabaja medio ciclo (transformador más grande); diodos con PIV = 2Vp.</td></tr>
<tr><td><b>Puente</b></td><td>Onda completa con transformador común; PIV = Vp; aprovecha todo el bobinado todo el tiempo. Es el más usado.</td><td>4 diodos (hoy viene integrado y es barato); pierde 1,4 V (molesta solo en fuentes de pocos volts).</td></tr>
</table></div>

<h2>9. Puentes rectificadores integrados</h2>
<p>En la práctica casi nunca se arman los 4 diodos sueltos: se compra el puente en un solo encapsulado con cuatro patas marcadas <b>~ ~ + −</b> (las dos “~” van al transformador, sin importar el orden).</p>
<div class="tabla-wrap"><table class="tabla">
<tr><th>Modelo</th><th>Encapsulado</th><th>Corriente</th><th>Tensión inversa</th></tr>
<tr><td>W04 / W10</td><td>redondo, 4 patas</td><td>1,5 A</td><td>400 V / 1000 V</td></tr>
<tr><td>DB107 / MB6S</td><td>DIP / SMD</td><td>0,5–1 A</td><td>600–1000 V</td></tr>
<tr><td>KBP206 / KBP310</td><td>plano en línea</td><td>2 A / 3 A</td><td>600 V / 1000 V</td></tr>
<tr><td>GBU / KBPC3510</td><td>plano / cuadrado con agujero para disipador</td><td>4–35 A</td><td>hasta 1000 V</td></tr>
</table></div>
<div class="caja tip"><span class="caja-titulo">Cómo identificar las patas</span>
La pata <b>+</b> suele ser más larga o estar en una esquina biselada; el cuerpo tiene impresos los símbolos. Con el multímetro en prueba de diodos: de <b>−</b> a cada <b>~</b> marca ≈ 0,5–0,6 V (punta roja en −), y de cada <b>~</b> a <b>+</b> también. De <b>−</b> a <b>+</b> (roja en −) marca ≈ 1,1 V (dos diodos en serie).
</div>

<h2>10. ¿Y ahora qué falta?</h2>
<p>La salida del rectificador nunca cambia de signo, pero <b>baja a cero 100 veces por segundo</b>. Si alimentás un Arduino con eso, se reinicia; si alimentás un amplificador, se escucha un zumbido. Hace falta “guardar” energía en los picos para entregarla cuando la tensión baja: ese es el trabajo del <b>capacitor de filtro</b> (tema 12). Y para que la tensión no dependa de la carga ni de la red, al final va el <b>regulador</b> (tema 13).</p>
`,

    simulaciones: [
      {
        titulo: 'Rectificador animado: ¿por dónde circula la corriente?',
        descripcion: 'Elegí la configuración y mirá el cursor recorrer la onda: el esquema resalta el camino de la corriente en cada instante. Podés pausar o hacer clic en el gráfico para mover el cursor.',
        montar(cont, H) {
          const { controles, vista } = H.layout(cont);
          let fase = 0.12, pausado = false, tPrev = 0, clave = '', R = null;
          const conf = H.select(controles, {
            label: 'Configuración', value: 'pu', onChange: cambio,
            opciones: [{ v: 'mo', t: 'Media onda (1 diodo)' }, { v: 'pm', t: 'Onda completa, punto medio (2 diodos)' }, { v: 'pu', t: 'Puente de Graetz (4 diodos)' }],
          });
          const vs = H.slider(controles, { label: 'V secundario (eficaz)', min: 3, max: 24, step: 0.5, value: 12, unidad: 'V', onInput: cambio });
          const fr = H.select(controles, { label: 'Frecuencia de la red', value: '50', onChange: cambio, opciones: [{ v: '50', t: '50 Hz (Argentina)' }, { v: '60', t: '60 Hz (EE. UU., Brasil)' }] });
          const real = H.check(controles, { label: 'Diodos reales (0,7 V cada uno)', value: true, onChange: cambio });
          const rl = H.slider(controles, { label: 'R de carga', min: 10, max: 10000, log: true, value: 100, unidad: 'Ω', onInput: cambio });
          H.sep(controles);
          H.titulo(controles, 'Animación');
          const vel = H.slider(controles, { label: 'Velocidad', min: 0.05, max: 1, step: 0.05, value: 0.25, fmt: v => H.num(v, 2) + ' ciclos/s' });
          const bP = H.boton(controles, '⏸ Pausar', () => { pausado = !pausado; bP.textContent = pausado ? '▶ Seguir' : '⏸ Pausar'; });
          H.nota(controles, 'En la realidad cada ciclo dura 20 ms: acá lo vemos en cámara lenta.');

          const cv = H.canvas(vista, { alto: (w) => w < 500 ? 250 : 290, dibujar });
          const fig = H.el('div', { style: 'max-width:470px;width:100%;margin:0 auto' });
          vista.append(fig);
          const lec = H.lecturas(vista);
          const nota = H.nota(vista);
          let PP = null;

          function calc() {
            const c = conf.value, f = +fr.value, T = 1 / f, Vp = vs.value * Math.SQRT2, Vd = real.value ? 0.7 : 0;
            const caida = c === 'pu' ? 2 * Vd : Vd;
            const vin = (t) => Vp * Math.sin(2 * Math.PI * f * t);
            const out = (t) => { const s = vin(t); return c === 'mo' ? Math.max(0, s - Vd) : Math.max(0, Math.abs(s) - caida); };
            let sm = 0, s2 = 0; const N = 4000;
            for (let i = 0; i < N; i++) { const v = out(i * T / N); sm += v; s2 += v * v; }
            const Vmed = sm / N, Vrms = Math.sqrt(s2 / N), Vpo = Math.max(0, Vp - caida);
            const PIV = c === 'mo' ? Vp : c === 'pm' ? 2 * Vp - Vd : Vp - Vd;
            const RL = rl.value;
            return { c, f, T, Vp, Vd, caida, vin, out, Vmed, Vrms, Vpo, PIV, RL, fo: c === 'mo' ? f : 2 * f, Ip: Vpo / RL, Imed: Vmed / RL };
          }

          function dibujar(ctx, w, h) {
            if (!R) return;
            const tms = R.T * 1000, ym = R.Vp * 1.2;
            const P = H.ejes(ctx, w, h, { xmin: 0, xmax: 2 * tms, ymin: -ym, ymax: ym, xlabel: 't (ms)', ylabel: 'V', mt: 26 });
            PP = P;
            const c1 = H.col('c1'), c2 = H.col('c2'), mu = H.col('muted');
            P.fn(x => R.vin(x / 1000), { color: mu, guiones: [6, 4], ancho: 1.5 });
            if (R.c === 'pm') P.fn(x => -R.vin(x / 1000), { color: mu, guiones: [2, 4], ancho: 1.2 });
            for (let k = 0; k < 4; k++) {
              const a = k * tms / 2, b = a + tms / 2, pos = k % 2 === 0;
              const col = pos ? c1 : (R.c === 'mo' ? mu : c2);
              P.area(x => R.out(x / 1000), { desde: a, hasta: b, color: col, alfa: 0.14 });
              P.fn(x => R.out(x / 1000), { desde: a, hasta: b, color: col, ancho: 2.6 });
            }
            P.hline(R.Vpo, { color: c1, label: 'Vp sal', labelX: 2 * tms });
            P.hline(R.Vrms, { color: H.col('amber'), label: 'Vrms', labelX: 1.56 * tms });
            P.hline(R.Vmed, { color: H.col('green'), label: 'Vmed', labelX: 0.56 * tms });
            const tc = fase * tms, acc = H.col('accent');
            P.vline(tc, { color: acc, guiones: [], ancho: 2 });
            P.punto(tc, R.vin(tc / 1000), { color: mu, r: 4 });
            P.punto(tc, R.out(tc / 1000), { color: acc, r: 6 });
            // leyenda
            const ley = [[mu, R.c === 'pm' ? 'v1 / v2 (½ secundario)' : 'entrada vs', true]].concat(
              R.c === 'mo' ? [[c1, 'D1 conduce'], [mu, 'nadie']] : R.c === 'pm' ? [[c1, 'D1 conduce'], [c2, 'D2 conduce']] : [[c1, 'D1 y D4'], [c2, 'D2 y D3']]);
            ctx.save(); ctx.font = '11px sans-serif'; ctx.textBaseline = 'middle';
            let x = P.x0;
            for (const [col, t, dash] of ley) {
              ctx.strokeStyle = col; ctx.lineWidth = dash ? 1.5 : 3; ctx.setLineDash(dash ? [6, 4] : []);
              ctx.beginPath(); ctx.moveTo(x, 12); ctx.lineTo(x + 18, 12); ctx.stroke();
              ctx.fillStyle = H.col('ink'); ctx.fillText(t, x + 22, 12);
              x += 32 + ctx.measureText(t).width;
            }
            ctx.restore();
          }

          function estado() {
            const v = R.vin(fase * R.T);
            const pol = v >= 0 ? 'pos' : 'neg';
            let conduce;
            if (R.c === 'mo') conduce = v > R.Vd && v > 0;
            else conduce = Math.abs(v) > R.caida && Math.abs(v) > 0;
            return { pol, conduce, v };
          }

          function textoNota(e) {
            const c = R.c, n = (x) => H.fmt(x, 'V');
            if (!e.conduce && !(c === 'mo' && e.pol === 'neg')) {
              return `<b>Zona muerta:</b> la tensión del secundario todavía no supera ${c === 'pu' ? 'los 1,4 V que necesitan los dos diodos en serie' : 'los 0,7 V que necesita el diodo'} para conducir. Ningún diodo conduce y la salida es 0 V: por eso la onda de salida “despega” un poquito tarde y es más baja que la entrada.`;
            }
            if (c === 'mo') return e.pol === 'pos'
              ? `<b>Semiciclo positivo:</b> S1 es + respecto de S2. D1 queda en directa y conduce: la corriente sale de S1, pasa por D1, baja por RL (de + a −) y vuelve por S2. En la carga aparece la entrada menos ${R.Vd ? '0,7 V' : '0 V (diodo ideal)'}.`
              : `<b>Semiciclo negativo:</b> S1 es −, así que D1 queda en <b>inversa</b> (circuito abierto). No hay corriente y la salida es 0 V. Toda la tensión del secundario queda sobre el diodo: en el pico es la <b>PIV = ${n(R.PIV)}</b>.`;
            if (c === 'pm') return e.pol === 'pos'
              ? `<b>Semiciclo positivo:</b> S1 es + respecto de la toma central. Conduce <b>D1</b> con la mitad superior del secundario; la corriente atraviesa RL y vuelve por la toma central. D2 está en inversa y, en el pico, soporta casi el doble: <b>PIV = ${n(R.PIV)}</b>.`
              : `<b>Semiciclo negativo:</b> ahora S2 es + respecto de la toma central. Conduce <b>D2</b> con la mitad inferior. Fijate que la corriente por RL va <b>en el mismo sentido</b> que antes: eso es rectificar en onda completa.`;
            return e.pol === 'pos'
              ? `<b>Semiciclo positivo:</b> S1 es +. Conducen <b>D1 y D4</b>, en serie con la carga (por eso se pierden ${R.Vd ? '1,4 V' : '0 V con diodos ideales'}). D2 y D3 quedan en inversa, cada uno con una PIV de ${n(R.PIV)}.`
              : `<b>Semiciclo negativo:</b> S2 es +. Conducen <b>D2 y D3</b>; la corriente por RL sigue bajando de + a −. Las flechas del secundario cambiaron de sentido, pero en la carga no: ¡eso hace el puente!`;
          }

          function actualizarEsquema(forzar) {
            const e = estado();
            const k = R.c + e.pol + e.conduce;
            if (!forzar && k === clave) return;
            clave = k;
            fig.innerHTML = Esq.svg(420, ALTO[R.c], esqRect(R.c, e.pol, e.conduce, { rl: H.fmt(R.RL, 'Ω') }));
            nota.innerHTML = textoNota(e);
          }

          function cambio() {
            R = calc();
            lec.set([
              { k: 'Vp del secundario' + (R.c === 'pm' ? ' (c/ mitad)' : ''), v: H.fmt(R.Vp, 'V') },
              { k: 'Vp en la carga', v: H.fmt(R.Vpo, 'V') },
              { k: 'Vmed (CC)', v: H.fmt(R.Vmed, 'V'), estado: 'ok' },
              { k: 'Vrms en la carga', v: H.fmt(R.Vrms, 'V') },
              { k: 'Frecuencia de salida', v: H.num(R.fo, 0) + ' Hz' },
              { k: 'PIV de cada diodo', v: H.fmt(R.PIV, 'V'), estado: R.c === 'pm' ? 'alerta' : '' },
              { k: 'I pico (carga y diodo)', v: H.fmt(R.Ip, 'A') },
              { k: 'I media por diodo', v: H.fmt(R.c === 'mo' ? R.Imed : R.Imed / 2, 'A') },
            ]);
            actualizarEsquema(true);
            cv.redibujar();
          }

          function moverCursor(ev) {
            if (!PP) return;
            const r = cv.cv.getBoundingClientRect();
            const x = ev.clientX - r.left;
            fase = Math.max(0, Math.min(1.999, (x - PP.x0) / PP.w * 2));
            if (!pausado) { pausado = true; bP.textContent = '▶ Seguir'; }
          }
          cv.cv.style.cursor = 'pointer';
          cv.cv.addEventListener('pointerdown', (ev) => { moverCursor(ev); cv.cv.setPointerCapture(ev.pointerId); });
          cv.cv.addEventListener('pointermove', (ev) => { if (ev.buttons) moverCursor(ev); });

          cambio();
          H.loop((t) => {
            const dt = Math.min(0.1, t - tPrev); tPrev = t;
            if (!pausado) fase = (fase + dt * vel.value) % 2;
            cv.redibujar();
            actualizarEsquema(false);
          });
        },
      },
      {
        titulo: 'Medí con el multímetro: ¿qué marca en CC y en CA?',
        descripcion: 'El mismo rectificador medido con el multímetro en distintas posiciones. Elegí la señal y la posición de la perilla, y compará las lecturas.',
        montar(cont, H) {
          const { controles, vista } = H.layout(cont);
          const sen = H.select(controles, {
            label: 'Señal sobre la carga', value: 'mo', onChange: upd,
            opciones: [{ v: 'ca', t: 'Alterna pura (el secundario)' }, { v: 'mo', t: 'Media onda' }, { v: 'pm', t: 'Onda completa (punto medio)' }, { v: 'pu', t: 'Onda completa (puente)' }, { v: 'cc', t: 'Continua pura (pila), para comparar' }],
          });
          const vs = H.slider(controles, { label: 'V secundario (eficaz)', min: 3, max: 24, step: 0.5, value: 12, unidad: 'V', onInput: upd });
          const real = H.check(controles, { label: 'Diodos reales (0,7 V)', value: true, onChange: upd });
          H.sep(controles);
          const modo = H.select(controles, {
            label: 'Perilla del multímetro', value: 'dc', onChange: upd,
            opciones: [{ v: 'dc', t: 'V⎓ (continua)' }, { v: 'ac', t: 'V~ true RMS' }, { v: 'avg', t: 'V~ multímetro económico (promedio)' }],
          });
          const cv = H.canvas(vista, { alto: (w) => w < 560 ? 470 : 280, dibujar });
          const lec = H.lecturas(vista);
          const nota = H.nota(vista);
          let R = null;

          function calc() {
            const s = sen.value, Vp = vs.value * Math.SQRT2, Vd = real.value ? 0.7 : 0, T = 0.02;
            const x = (t) => {
              const v = Vp * Math.sin(2 * Math.PI * 50 * t);
              if (s === 'ca') return v;
              if (s === 'cc') return vs.value;
              if (s === 'mo') return Math.max(0, v - Vd);
              return Math.max(0, Math.abs(v) - (s === 'pu' ? 2 * Vd : Vd));
            };
            const N = 4000; let m = 0, q = 0;
            for (let i = 0; i < N; i++) { const v = x(i * T / N); m += v; q += v * v; }
            const dc = m / N, rms = Math.sqrt(q / N), ac = Math.sqrt(Math.max(0, rms * rms - dc * dc));
            let ab = 0; for (let i = 0; i < N; i++) ab += Math.abs(x(i * T / N) - dc);
            const avg = (Math.PI / (2 * Math.SQRT2)) * ab / N;
            return { s, Vp, x, dc, rms, ac: ac < 1e-6 ? 0 : ac, avg: avg < 1e-6 ? 0 : avg, T };
          }

          function multimetro(ctx, x, y, w, h, val, md) {
            ctx.save();
            const rr = (X, Y, W, Hh, r) => { ctx.beginPath(); ctx.moveTo(X + r, Y); ctx.arcTo(X + W, Y, X + W, Y + Hh, r); ctx.arcTo(X + W, Y + Hh, X, Y + Hh, r); ctx.arcTo(X, Y + Hh, X, Y, r); ctx.arcTo(X, Y, X + W, Y, r); ctx.closePath(); };
            ctx.fillStyle = '#e9a92a'; rr(x, y, w, h, 16); ctx.fill();
            ctx.fillStyle = '#2b2f33'; rr(x + 8, y + 8, w - 16, h - 16, 11); ctx.fill();
            // display
            ctx.fillStyle = '#b9c7a6'; rr(x + 18, y + 18, w - 36, 62, 6); ctx.fill();
            ctx.fillStyle = '#1b2414'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
            ctx.font = 'bold 30px "JetBrains Mono", monospace';
            ctx.fillText(Math.abs(val) < 0.005 ? '0.00' : val.toFixed(2), x + w - 46, y + 52);
            ctx.font = 'bold 15px sans-serif'; ctx.fillText('V', x + w - 26, y + 55);
            ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'left';
            ctx.fillText(md === 'dc' ? 'DC' : md === 'ac' ? 'AC  TRUE RMS' : 'AC', x + 24, y + 28);
            // perilla
            const cx = x + w / 2, cy = y + 80 + (h - 130) / 2 + 12, r = Math.min(34, (h - 140) / 2);
            const pos = { off: -90, dc: -30, ac: 30, ohm: 90 };
            ctx.fillStyle = '#d6d9dc'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
            for (const [k, a] of Object.entries(pos)) {
              const rad = (a - 90) * Math.PI / 180;
              const lab = k === 'off' ? 'OFF' : k === 'dc' ? 'V⎓' : k === 'ac' ? 'V~' : 'Ω';
              ctx.fillStyle = (k === md || (k === 'ac' && md === 'avg')) ? '#ffd24a' : '#c5c9cd';
              ctx.fillText(lab, cx + Math.cos(rad) * (r + 16), cy + Math.sin(rad) * (r + 14));
            }
            ctx.fillStyle = '#4a4f55'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.lineCap = 'round';
            const ang = ((md === 'dc' ? pos.dc : pos.ac) - 90) * Math.PI / 180;
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ang) * (r - 6), cy + Math.sin(ang) * (r - 6)); ctx.stroke();
            // bornes
            const by = y + h - 26;
            [['COM', '#111', x + w * 0.32], ['VΩ', '#c62828', x + w * 0.68]].forEach(([t, c, bx]) => {
              ctx.fillStyle = c; ctx.beginPath(); ctx.arc(bx, by, 8, 0, 7); ctx.fill();
              ctx.fillStyle = '#c5c9cd'; ctx.font = 'bold 9px sans-serif'; ctx.fillText(t, bx, by - 15);
            });
            if (md === 'avg') { ctx.fillStyle = '#ffd24a'; ctx.font = '10px sans-serif'; ctx.fillText('(económico)', cx, y + 92); }
            ctx.restore();
          }

          function dibujar(ctx, W, Hh) {
            if (!R) return;
            const ancho = W >= 560;
            const gw = ancho ? W - 52 - 210 : W - 52 - 14, gh = ancho ? Hh - 48 : 230;
            const ym = R.Vp * 1.15;
            const P = H.ejes(ctx, W, Hh, { x0: 52, y0: 14, w: gw, h: gh, xmin: 0, xmax: 40, ymin: R.s === 'ca' ? -ym : -ym * 0.15, ymax: ym, xlabel: 't (ms)', ylabel: 'V' });
            P.area(t => R.x(t / 1000), { color: H.col('c1'), alfa: 0.12 });
            P.fn(t => R.x(t / 1000), { color: H.col('c1'), ancho: 2.4 });
            P.hline(R.dc, { color: H.col('green'), label: 'valor medio ' + H.num(R.dc, 2) + ' V', labelX: 20, ancho: 2 });
            P.hline(R.rms, { color: H.col('amber'), label: 'eficaz total ' + H.num(R.rms, 2) + ' V', labelX: 40, ancho: 2 });
            const val = modo.value === 'dc' ? R.dc : modo.value === 'ac' ? R.ac : R.avg;
            if (ancho) multimetro(ctx, W - 196, 10, 182, Hh - 20, val, modo.value);
            else multimetro(ctx, W / 2 - 100, gh + 40, 200, Hh - gh - 48, val, modo.value);
          }

          function upd() {
            R = calc();
            const err = R.ac > 0.01 ? (R.avg - R.ac) / R.ac * 100 : 0;
            lec.set([
              { k: 'V⎓ (valor medio)', v: H.fmt(R.dc, 'V'), estado: modo.value === 'dc' ? 'ok' : '' },
              { k: 'V~ true RMS (solo la parte alterna)', v: H.fmt(R.ac, 'V'), estado: modo.value === 'ac' ? 'ok' : '' },
              { k: 'V~ económico (promedio × 1,11)', v: H.fmt(R.avg, 'V'), estado: modo.value === 'avg' ? 'ok' : '' },
              { k: 'Eficaz total (CA+CC)', v: H.fmt(R.rms, 'V') },
              { k: 'Error del económico', v: R.ac > 0.01 ? H.num(err, 1) + ' %' : '—', estado: Math.abs(err) > 3 ? 'alerta' : '' },
            ]);
            const s = R.s, md = modo.value;
            const porSenal = {
              ca: 'Una senoidal pura tiene valor medio <b>cero</b> (el semiciclo positivo compensa al negativo): en V⎓ el multímetro marca 0. En V~ marca el eficaz, que es lo que dice la chapa del transformador.',
              mo: 'La media onda tiene un valor medio de Vp/π y un eficaz total de Vp/2. Ojo: tiene <b>mucha</b> parte alterna (casi tanto como continua), por eso en V~ también marca bastante.',
              pm: 'En onda completa el valor medio se duplica (2Vp/π) y la parte alterna es menor que en media onda: la tensión está “más cerca” de una continua.',
              pu: 'Igual que el punto medio pero con 1,4 V menos de pico (dos diodos en serie). La parte alterna que queda es lo que el capacitor de filtro va a tener que eliminar.',
              cc: 'Una continua pura no tiene parte alterna: en V~ marca 0 y en V⎓ marca su valor. El valor medio y el eficaz son iguales.',
            }[s];
            const porModo = md === 'dc'
              ? 'En <b>V⎓</b> el multímetro promedia: muestra el <b>valor medio</b> (la componente continua). Es el número que usamos para calcular la corriente media por la carga.'
              : md === 'ac'
                ? 'En <b>V~ true RMS</b> el instrumento bloquea la continua con un capacitor interno y calcula el eficaz de lo que queda: la <b>parte alterna</b> (el “rizado”). Por eso no muestra el eficaz total sino $\\sqrt{V_{rms}^2-V_{med}^2}$.'
                : 'Un multímetro <b>económico</b> no calcula el eficaz: rectifica, promedia y multiplica por 1,11 (relación eficaz/medio de una senoidal). Con una senoidal pura acierta; con cualquier otra forma de onda se equivoca. Compará con la lectura true RMS.';
            nota.innerHTML = porSenal + '<br>' + porModo;
            if (window.renderMathInElement) renderMathInElement(nota, { delimiters: [{ left: '$', right: '$', display: false }], throwOnError: false });
            cv.redibujar();
          }
          upd();
        },
      },
    ],

    ejercicios: [
      {
        nivel: 'Básico',
        enunciado: String.raw`Un transformador de 220 V / 9 V alimenta un cargador. Calculá la relación de transformación, la tensión pico del secundario y la tensión pico del primario.`,
        pista: String.raw`$a=V_1/V_2$ con valores eficaces. Para el pico: $V_p=\sqrt2\,V_{ef}$.`,
        solucion: String.raw`$a=\frac{220}{9}=24{,}4$. Secundario: $V_{2p}=\sqrt2\cdot9=12{,}73\,\text{V}$. Primario: $V_{1p}=\sqrt2\cdot220=311\,\text{V}$. (Verificación: $311/12{,}73=24{,}4$, la relación se mantiene también para los picos.)`,
      },
      {
        nivel: 'Básico',
        enunciado: String.raw`Un rectificador de media onda con un transformador de 12 V y un diodo de silicio alimenta una carga de $1\,\text{k}\Omega$. Calculá $V_{p,sal}$, $V_{med}$, la corriente media, la frecuencia de salida y la PIV del diodo.`,
        pista: String.raw`$V_{p,sal}=\sqrt2\cdot12-0{,}7$; en media onda $V_{med}=V_{p,sal}/\pi$.`,
        solucion: String.raw`$V_p=16{,}97\,\text{V}$, $V_{p,sal}=16{,}27\,\text{V}$. $V_{med}=\frac{16{,}27}{\pi}=5{,}18\,\text{V}$. $I_{med}=\frac{5{,}18\,\text{V}}{1\,\text{k}\Omega}=5{,}18\,\text{mA}$. $f_{sal}=50\,\text{Hz}$. $PIV=V_p\approx17\,\text{V}$.`,
      },
      {
        nivel: 'Intermedio',
        enunciado: String.raw`Un puente de Graetz con transformador de 15 V alimenta una carga resistiva de $47\,\Omega$. Calculá $V_{p,sal}$, $V_{med}$, la corriente media en la carga, la corriente media y pico por cada diodo y la PIV. ¿Sirven diodos 1N4007 (1 A, 1000 V)?`,
        pista: String.raw`En el puente se restan 1,4 V. Cada diodo conduce un semiciclo: $I_{D,med}=I_L/2$, pero el pico es el de la carga.`,
        solucion: String.raw`$V_p=\sqrt2\cdot15=21{,}21\,\text{V}$; $V_{p,sal}=21{,}21-1{,}4=19{,}81\,\text{V}$. $V_{med}=\frac{2\cdot19{,}81}{\pi}=12{,}61\,\text{V}$. $I_L=\frac{12{,}61}{47}=268\,\text{mA}$. Por diodo: $I_{D,med}=134\,\text{mA}$ e $I_{pico}=\frac{19{,}81}{47}=421\,\text{mA}$. $PIV\approx21\,\text{V}$. El 1N4007 sobra: 1 A de media y 1000 V de inversa.`,
      },
      {
        nivel: 'Intermedio',
        enunciado: String.raw`Se arma un rectificador de onda completa con transformador de punto medio 9‑0‑9 V y carga de $100\,\Omega$. Calculá $V_{med}$, la corriente media por cada diodo y la PIV. Un compañero propone usar 1N4148 (75 V, 200 mA): ¿y si tuviera solo diodos de 20 V?`,
        pista: String.raw`$V_p$ es el de <b>media</b> bobina (9 V eficaces). La PIV en punto medio es $2V_p-0{,}7$.`,
        solucion: String.raw`$V_p=\sqrt2\cdot9=12{,}73\,\text{V}$, $V_{p,sal}=12{,}03\,\text{V}$. $V_{med}=\frac{2\cdot12{,}03}{\pi}=7{,}66\,\text{V}$; $I_L=76{,}6\,\text{mA}$ → $I_{D,med}=38{,}3\,\text{mA}$; $I_{pico}=120\,\text{mA}$. $PIV=2\cdot12{,}73-0{,}7=24{,}8\,\text{V}$. El 1N4148 aguanta (75 V, 200 mA), aunque en fuentes se prefiere un 1N4001. Diodos de 20 V <b>no</b> sirven: la PIV de casi 25 V los rompería.`,
      },
      {
        nivel: 'Intermedio',
        enunciado: String.raw`Querés obtener $V_{med}=12\,\text{V}$ (sin filtro) con un puente de diodos de silicio. ¿Qué tensión eficaz debe tener el secundario? Elegí un transformador comercial (6, 9, 12, 15, 18, 24 V).`,
        pista: String.raw`Despejá: $V_{p,sal}=\frac{\pi\,V_{med}}{2}$, después sumá 1,4 V y dividí por $\sqrt2$.`,
        solucion: String.raw`$V_{p,sal}=\frac{\pi\cdot12}{2}=18{,}85\,\text{V}$; $V_p=18{,}85+1{,}4=20{,}25\,\text{V}$; $V_{ef}=\frac{20{,}25}{\sqrt2}=14{,}3\,\text{V}$. Se elige el de <b>15 V</b> (da $V_{med}=12{,}61\,\text{V}$, ver ejercicio 3).`,
      },
      {
        nivel: 'Avanzado',
        enunciado: String.raw`Medís con el multímetro la salida de un puente (transformador de 12 V, sin capacitor). En V⎓ marca 9,9 V y en V~ (true RMS) marca unos 4,8 V. Tu compañero dice “el eficaz tiene que ser 11 V, el multímetro está roto”. ¿Quién tiene razón?`,
        pista: String.raw`En V~ el multímetro bloquea la continua. Calculá $\sqrt{V_{rms}^2-V_{med}^2}$.`,
        solucion: String.raw`$V_{p,sal}=15{,}57\,\text{V}$; $V_{rms}=\frac{15{,}57}{\sqrt2}=11{,}01\,\text{V}$ (el eficaz <b>total</b>) y $V_{med}=9{,}91\,\text{V}$. En V~ el true RMS muestra solo la parte alterna: $\sqrt{11{,}01^2-9{,}91^2}=4{,}8\,\text{V}$. El multímetro está bien: el eficaz total sería $\sqrt{9{,}91^2+4{,}8^2}=11{,}0\,\text{V}$. (Probalo en la simulación 2.)`,
      },
      {
        nivel: 'Avanzado',
        enunciado: String.raw`En el puente del ejercicio 3 (15 V, $47\,\Omega$) se abre (se corta) el diodo D2. ¿Qué pasa con la forma de onda, el valor medio y la frecuencia? ¿Y si en vez de abrirse, D2 queda en cortocircuito?`,
        pista: String.raw`Si D2 está abierto, el par D2‑D3 ya no puede conducir: pensá qué semiciclo se pierde.`,
        solucion: String.raw`<b>D2 abierto:</b> en el semiciclo negativo no hay camino, y el circuito queda como <b>media onda</b> (con 2 diodos en serie): $V_{med}=\frac{19{,}81}{\pi}=6{,}31\,\text{V}$ (la mitad) y $f_{sal}=50\,\text{Hz}$. Con un osciloscopio se ve una “joroba” sí y otra no. <b>D2 en corto:</b> en el semiciclo positivo D1 conduce y D2 (en corto) une el vértice inferior con el + → el secundario queda en cortocircuito a través de D1 y D2. Circula una corriente enorme: se quema D1, el fusible o el transformador. Por eso las fuentes llevan fusible.`,
      },
    ],

    quiz: [
      { pregunta: 'Un transformador “de 12 V” entrega en el secundario una tensión pico de aproximadamente…', opciones: ['12 V', '8,5 V', '17 V', '24 V'], correcta: 2, explicacion: 'Los transformadores se especifican en valor eficaz: Vp = √2 · 12 ≈ 17 V.' },
      { pregunta: '¿Cuál es la frecuencia de la tensión a la salida de un puente de diodos conectado a la red de 50 Hz?', opciones: ['25 Hz', '50 Hz', '100 Hz', '0 Hz, es continua'], correcta: 2, explicacion: 'Cada semiciclo produce una “joroba”: hay dos por período, así que la salida pulsa a 100 Hz.' },
      { pregunta: 'En un rectificador de onda completa con punto medio, la tensión inversa de pico de cada diodo es…', opciones: ['Vp', '2·Vp', 'Vp/2', '0,7 V'], correcta: 1, explicacion: 'El diodo bloqueado tiene el cátodo a +Vp y el ánodo a −Vp (respecto de la toma central): 2Vp.' },
      { pregunta: 'En el puente de Graetz, durante el semiciclo positivo conducen…', opciones: ['Los cuatro diodos', 'Un solo diodo', 'Dos diodos en serie con la carga', 'Ninguno'], correcta: 2, explicacion: 'Siempre conducen dos (D1 y D4, o D2 y D3), en serie con la carga. Por eso se pierden 1,4 V.' },
      { pregunta: String.raw`El multímetro en V⎓ sobre la salida de un rectificador de media onda (sin filtro) marca…`, opciones: ['El valor pico', 'El valor medio, Vp/π', 'El valor eficaz, Vp/√2', 'Cero'], correcta: 1, explicacion: 'En continua el instrumento promedia: muestra el valor medio, que en media onda es Vp/π ≈ 0,32·Vp.' },
      { pregunta: '¿Por qué el puente es la configuración más usada?', opciones: ['Porque usa un solo diodo', 'Porque da onda completa con un transformador común y PIV = Vp', 'Porque no tiene caída de tensión', 'Porque da una continua sin rizado'], correcta: 1, explicacion: 'No necesita toma central, sus diodos soportan solo Vp y viene integrado y barato. Su única contra es perder 1,4 V.' },
    ],

    docente: String.raw`
<h3>Objetivo de la clase</h3>
<p>Que el alumno entienda <b>cómo circula la corriente</b> en cada rectificador, semiciclo por semiciclo, y que sepa calcular $V_{p}$, $V_{med}$, $V_{rms}$, frecuencia y PIV. Es la base de los temas 12 (filtro) y 13 (zener). <b>Duración sugerida:</b> 1 a 2 clases de 60–80 min (la primera hasta media onda y punto medio; la segunda puente, comparación y multímetro).</p>

<h3>Secuencia sugerida</h3>
<ol>
<li><b>Motivación (5 min):</b> mostrá el diagrama de bloques. Preguntá: “¿Qué tensión sale del enchufe? ¿Qué tensión usa un Arduino? ¿Cómo pasamos de una a otra?”. Que vea que es una cadena de pasos.</li>
<li><b>Transformador (10 min):</b> eficaz vs pico. Preguntale cuánto vale el pico de la red antes de decírselo (311 V suele sorprender). Hacé el ejemplo 220 → 12 V.</li>
<li><b>Media onda (15 min):</b> abrí la simulación 1 en “Media onda”, <b>pausada</b>. Poné el cursor en el semiciclo positivo y preguntá “¿el diodo conduce?, ¿por dónde va la corriente?”. Después mové el cursor al negativo. Recién entonces mostrá las fórmulas. Destildá “diodos reales” y mostrá que la salida “despega” antes (zona muerta de 0,7 V).</li>
<li><b>Punto medio (15 min):</b> antes de mostrar la simulación, dibujá el circuito y pedile que te diga qué diodo conduce en cada semiciclo y <b>en qué sentido</b> pasa la corriente por RL. Verificá con la animación. Discutí la PIV = 2Vp con la lectura en amarillo.</li>
<li><b>Puente (15 min):</b> igual: pedile que siga con el dedo el camino de la corriente en el esquema de la teoría, después verificá con la animación. Remarcá que los dos semiciclos atraviesan RL en el mismo sentido.</li>
<li><b>Multímetro (10 min):</b> simulación 2. Preguntá: “Si medís la salida del puente en V⎓, ¿qué número vas a ver: el pico, el medio o el eficaz?”. Después pasá a V~ true RMS y pedile que explique por qué da menos que el eficaz. Mostrá que el multímetro económico ya no coincide con el true RMS (en onda completa se equivoca ≈ 3 %; con formas de onda más “raras”, como un PWM, el error es mucho mayor).</li>
<li><b>Cierre (5 min):</b> tabla comparativa y autoevaluación. Tarea: ejercicios 2, 3, 5 y 7.</li>
</ol>

<h3>Errores frecuentes del alumno</h3>
<ul>
<li>Usar el valor eficaz (12 V) como si fuera el pico en las fórmulas de $V_{med}$.</li>
<li>En el punto medio, tomar como $V_p$ el de todo el secundario (24 V) en lugar del de media bobina.</li>
<li>Olvidar restar 1,4 V (y no 0,7) en el puente.</li>
<li>Pensar que la salida del rectificador “ya es continua” y que se puede alimentar cualquier cosa con ella.</li>
<li>Confundir la corriente media por diodo ($I_L/2$) con la corriente pico.</li>
<li>Creer que el multímetro en V~ sobre una tensión rectificada muestra el eficaz total.</li>
</ul>

<h3>Preguntas disparadoras</h3>
<ul>
<li>Si un diodo deja pasar la corriente en un solo sentido, ¿cómo hacemos para aprovechar también el semiciclo negativo?</li>
<li>¿Por qué el transformador no se puede usar con continua? (No hay variación de flujo → no hay inducción.)</li>
<li>Si se abre un diodo del puente, ¿la fuente deja de andar? (No: queda en media onda, con la mitad de tensión media y 50 Hz.)</li>
<li>¿Qué le pasaría a un Arduino alimentado directamente con la salida del puente? (Se reinicia 100 veces por segundo: prepara el tema 12.)</li>
</ul>

<h3>Recordatorio rápido para vos</h3>
<ul>
<li>$V_p=\sqrt2\,V_{ef}$; red: 220 V ef → 311 V pico, 622 V pico a pico.</li>
<li>Media onda: $V_{med}=V_p/\pi=0{,}318V_p$, $V_{rms}=V_p/2$. Onda completa: $V_{med}=2V_p/\pi=0{,}637V_p$, $V_{rms}=V_p/\sqrt2$.</li>
<li>Factor de forma ($V_{rms}/V_{med}$): senoidal 1,11; media onda 1,57; onda completa 1,11.</li>
<li>Parte alterna (lo que ve un true RMS con acople CA): media onda $0{,}386\,V_p$, onda completa $0{,}308\,V_p$.</li>
<li>PIV: media onda $V_p$; punto medio $2V_p$; puente $V_p$.</li>
<li>Diodos típicos: 1N4001…1N4007 (1 A; 50…1000 V), 1N5400…1N5408 (3 A), 1N4148 (señal, 200 mA). Puentes: W04 (1,5 A/400 V), KBP206 (2 A/600 V).</li>
<li>Transformador para fuente con filtro capacitivo: la corriente eficaz del secundario es ≈ 1,6–1,8 veces la corriente continua de la carga; dimensioná los VA con eso.</li>
</ul>

<h3>Experiencia práctica</h3>
<p><b>En simulador (Falstad, circuitjs):</b> menú Circuits → Diodes → Full‑Wave Rectifier. Cambiá a media onda borrando diodos, y mirá la corriente animada (los puntitos amarillos) en cada semiciclo. Agregá un osciloscopio sobre la carga y compará con lo que ves en la simulación 1.</p>
<p><b>En Tinkercad:</b> generador de funciones (senoidal 10 V pico, 50 Hz) + puente con 4 1N4007 + resistencia de 1 kΩ + osciloscopio y multímetro. Medí en V⎓ y comparalo con $2V_{p,sal}/\pi$.</p>
<p><b>Real (con supervisión):</b> transformador de 9 o 12 V ya cableado con fusible, puente W04, lámpara de 12 V o resistencia de 100 Ω/2 W. Medí con el multímetro el secundario en V~ y la salida en V⎓ y V~. Si tenés osciloscopio, ver las “jorobas” de 100 Hz es muy convincente.</p>
`,
  });
})();
