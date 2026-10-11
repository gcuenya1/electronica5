/* Tema 03 — Área de señales con integrales (valor medio y valor eficaz)
   IMPORTANTE: los textos con LaTeX usan String.raw`...` para que "\frac" no se rompa. */
(() => {
  const PI = Math.PI, R2 = Math.SQRT2, R3 = Math.sqrt(3);
  const T = 0.02;   // 50 Hz → 20 ms

  /* Señales: x = t/T (adimensional). p = { Vp, D, Vdc } */
  const SENALES = {
    sen: {
      t: 'Senoidal', f: (x, p) => p.Vp * Math.sin(2 * PI * x),
      med: p => 0, rms: p => p.Vp / R2, fmed: '0', frms: String.raw`\frac{V_p}{\sqrt2}`,
      paso: String.raw`$$V_{med}=\frac1T\int_0^T V_p\,\text{sen}(\omega t)\,dt=0$$$$V_{rms}=\sqrt{\frac1T\int_0^T V_p^2\,\text{sen}^2(\omega t)\,dt}=\sqrt{\frac{V_p^2}{2}}=\frac{V_p}{\sqrt2}$$<p>El área verde (positiva) y la roja (negativa) son iguales: se cancelan y el valor medio es cero. Pero al elevar al cuadrado todo queda positivo, por eso el eficaz <b>no</b> es cero.</p>`,
    },
    media: {
      t: 'Rectificada media onda', f: (x, p) => Math.max(0, p.Vp * Math.sin(2 * PI * x)),
      med: p => p.Vp / PI, rms: p => p.Vp / 2, fmed: String.raw`\frac{V_p}{\pi}`, frms: String.raw`\frac{V_p}{2}`,
      paso: String.raw`$$V_{med}=\frac1T\int_0^{T/2} V_p\,\text{sen}(\omega t)\,dt=\frac1T\cdot\frac{V_pT}{\pi}=\frac{V_p}{\pi}$$$$V_{rms}=\sqrt{\frac1T\int_0^{T/2} V_p^2\,\text{sen}^2(\omega t)\,dt}=\sqrt{\frac{V_p^2}{4}}=\frac{V_p}{2}$$<p>Hay área solo en medio período; en el otro medio la tensión es cero (el diodo no conduce). Por eso el valor medio es la mitad que en onda completa.</p>`,
    },
    completa: {
      t: 'Rectificada onda completa', f: (x, p) => Math.abs(p.Vp * Math.sin(2 * PI * x)),
      med: p => 2 * p.Vp / PI, rms: p => p.Vp / R2, fmed: String.raw`\frac{2V_p}{\pi}`, frms: String.raw`\frac{V_p}{\sqrt2}`,
      paso: String.raw`$$V_{med}=\frac{2V_p}{\pi}\approx0{,}637\,V_p$$$$V_{rms}=\frac{V_p}{\sqrt2}\approx0{,}707\,V_p$$<p>El rectificador “da vuelta” los semiciclos negativos: el área roja pasa a ser verde. El valor eficaz es <b>el mismo</b> que el de la senoidal original (el cuadrado no distingue el signo), pero ahora el medio ya no es cero.</p>`,
    },
    cuad: {
      t: 'Cuadrada 0 a Vp (con ciclo de trabajo D)', f: (x, p) => ((x - Math.floor(x)) < p.D ? p.Vp : 0),
      med: p => p.D * p.Vp, rms: p => p.Vp * Math.sqrt(p.D), fmed: String.raw`D\cdot V_p`, frms: String.raw`V_p\sqrt{D}`,
      paso: String.raw`$$V_{med}=\frac1T\,(V_p\cdot DT)=D\,V_p$$$$V_{rms}=\sqrt{\frac1T\,(V_p^2\cdot DT)}=V_p\sqrt D$$<p>El área es un rectángulo de alto $V_p$ y ancho $D\cdot T$. ¡Es exactamente el PWM del tema 4!</p>`,
    },
    tri: {
      t: 'Triangular ±Vp', f: (x, p) => { const u = x - Math.floor(x); return p.Vp * (u < 0.25 ? 4 * u : u < 0.75 ? 2 - 4 * u : 4 * u - 4); },
      med: p => 0, rms: p => p.Vp / R3, fmed: '0', frms: String.raw`\frac{V_p}{\sqrt3}`,
      paso: String.raw`$$V_{rms}^2=\frac{1}{T/4}\int_0^{T/4}\left(V_p\frac{t}{T/4}\right)^2dt=\frac{V_p^2}{(T/4)^3}\cdot\frac{(T/4)^3}{3}=\frac{V_p^2}{3}\Rightarrow V_{rms}=\frac{V_p}{\sqrt3}\approx0{,}577\,V_p$$<p>Alcanza con calcular un cuarto de período: los otros tres cuartos son la misma rampa (al cuadrado) dada vuelta.</p>`,
    },
    sierra: {
      t: 'Diente de sierra 0 a Vp', f: (x, p) => p.Vp * (x - Math.floor(x)),
      med: p => p.Vp / 2, rms: p => p.Vp / R3, fmed: String.raw`\frac{V_p}{2}`, frms: String.raw`\frac{V_p}{\sqrt3}`,
      paso: String.raw`$$V_{med}=\frac1T\cdot\frac{V_p\,T}{2}=\frac{V_p}{2}$$$$V_{rms}=\sqrt{\frac1T\int_0^T\left(V_p\frac tT\right)^2dt}=\frac{V_p}{\sqrt3}$$<p>El área es un triángulo: base por altura sobre dos. Tiene el <b>mismo</b> eficaz que la triangular, aunque su valor medio sea distinto.</p>`,
    },
    offset: {
      t: 'Senoidal con offset (continua + alterna)', f: (x, p) => p.Vdc + p.Vp * Math.sin(2 * PI * x),
      med: p => p.Vdc, rms: p => Math.sqrt(p.Vdc * p.Vdc + p.Vp * p.Vp / 2), fmed: String.raw`V_{DC}`, frms: String.raw`\sqrt{V_{DC}^2+\frac{V_p^2}{2}}`,
      paso: String.raw`$$V_{med}=V_{DC}$$$$V_{rms}=\sqrt{V_{DC}^2+\left(\frac{V_p}{\sqrt2}\right)^2}$$<p>Los eficaces de la continua y de la alterna <b>no se suman directamente</b>: se suman sus cuadrados (como potencias). Es el caso típico de un sensor o de la salida de un amplificador polarizado.</p>`,
    },
  };

  /* mini‑gráfico SVG para la teoría */
  function miniGraf(op) {
    const { w, h, xmin, xmax, ymin, ymax } = op;
    const ml = op.ml ?? 26, mr = 8, mt = 10, mb = op.mb ?? 20;
    const X = x => ml + (x - xmin) / (xmax - xmin) * (w - ml - mr);
    const Y = y => mt + (ymax - y) / (ymax - ymin) * (h - mt - mb);
    let s = '';
    for (const r of op.rects || []) s += `<rect x="${X(r.x)}" y="${Math.min(Y(r.y), Y(0))}" width="${X(r.x + r.w) - X(r.x)}" height="${Math.abs(Y(0) - Y(r.y))}" fill="${r.color}" fill-opacity=".28" stroke="${r.color}" stroke-width="1"/>`;
    for (const a of op.areas || []) {
      let d = `M${X(a.desde)} ${Y(0)}`;
      for (let i = 0; i <= 300; i++) { const x = a.desde + (a.hasta - a.desde) * i / 300; d += `L${X(x).toFixed(1)} ${Y(a.f(x)).toFixed(1)}`; }
      s += `<path d="${d}L${X(a.hasta)} ${Y(0)}Z" fill="${a.color}" fill-opacity=".3"/>`;
    }
    s += `<line x1="${ml}" y1="${Y(0)}" x2="${w - mr}" y2="${Y(0)}" stroke="currentColor" opacity=".6"/><line x1="${ml}" y1="${mt}" x2="${ml}" y2="${h - mb}" stroke="currentColor" opacity=".6"/>`;
    for (const c of op.curvas || []) {
      let d = '';
      const xh = c.hasta ?? xmax; for (let i = 0; i <= 400; i++) { const x = xmin + (xh - xmin) * i / 400; d += (i ? 'L' : 'M') + X(x).toFixed(1) + ' ' + Y(c.f(x)).toFixed(1); }
      s += `<path d="${d}" fill="none" stroke="${c.color}" stroke-width="${c.ancho || 2}" ${c.guiones ? `stroke-dasharray="${c.guiones}"` : ''}/>`;
    }
    for (const l of op.hl || []) s += `<line x1="${ml}" y1="${Y(l.y)}" x2="${w - mr}" y2="${Y(l.y)}" stroke="${l.color}" stroke-width="1.5" stroke-dasharray="5 3"/><text x="${w - mr - 2}" y="${Y(l.y) + (l.abajo ? 13 : -4)}" text-anchor="end" font-size="11" font-weight="700" style="fill:${l.color}">${l.t}</text>`;
    for (const [x, t] of op.ex || []) s += `<text x="${X(x)}" y="${h - 5}" text-anchor="middle" font-size="11">${t}</text>`;
    for (const [y, t] of op.ey || []) s += `<text x="${ml - 4}" y="${Y(y) + 4}" text-anchor="end" font-size="11">${t}</text>`;
    return `<svg class="esq" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
  }
  /* mini‑señal para la tabla */
  const spark = (f) => miniGraf({ w: 90, h: 40, xmin: 0, xmax: 2, ymin: -1.15, ymax: 1.15, ml: 2, mb: 2, curvas: [{ f, color: 'var(--c1)', ancho: 1.8 }] });
  const P1 = { Vp: 1, D: 0.3, Vdc: 0 };
  const sp = (k, p = P1) => spark(x => SENALES[k].f(x, p));

  const sen = x => Math.sin(PI * x);
  const rects = (n) => Array.from({ length: n }, (_, i) => ({ x: i / n, w: 1 / n, y: sen((i + 0.5) / n), color: 'var(--c1)' }));
  const figRect = `<div class="dos-col" style="align-items:center">
  <figure class="figura">${miniGraf({ w: 300, h: 150, xmin: 0, xmax: 1, ymin: 0, ymax: 1.12, rects: rects(6), curvas: [{ f: sen, color: 'var(--c2)', ancho: 2.4 }], ex: [[0, '0'], [0.5, 'T/4'], [1, 'T/2']] })}<figcaption>6 rectángulos: la suma de sus áreas se parece al área bajo la curva, pero sobra y falta un poco.</figcaption></figure>
  <figure class="figura">${miniGraf({ w: 300, h: 150, xmin: 0, xmax: 1, ymin: 0, ymax: 1.12, rects: rects(30), curvas: [{ f: sen, color: 'var(--c2)', ancho: 2.4 }], ex: [[0, '0'], [0.5, 'T/4'], [1, 'T/2']] })}<figcaption>30 rectángulos: ya casi no se nota la diferencia. Con infinitos, es la integral.</figcaption></figure>
  </div>`;
  const figMedio = `<figure class="figura">${miniGraf({
    w: 480, h: 170, xmin: 0, xmax: 2.65, ymin: -0.15, ymax: 1.2,
    areas: [{ f: x => Math.abs(Math.sin(2 * PI * x)), desde: 0, hasta: 2, color: 'var(--c3)' }],
    curvas: [{ f: x => Math.abs(Math.sin(2 * PI * x)), color: 'var(--c1)', ancho: 2.2, hasta: 2 }],
    hl: [{ y: 2 / PI, color: 'var(--c2)', t: 'Vmed = 0,637·Vp', abajo: true }, { y: 1 / R2, color: 'var(--c4)', t: 'Vrms = 0,707·Vp' }],
    ex: [[0.5, 'T/2'], [1, 'T'], [1.5, '3T/2'], [2, '2T']], ey: [[1, 'Vp']],
  })}<figcaption>Onda completa: el valor medio es la altura del rectángulo que tiene la misma área que la curva (“nivelar la arena”). El eficaz siempre queda por encima del medio.</figcaption></figure>`;

  registrarTema({
    id: 'area-integrales',
    orden: 3,
    titulo: 'Área de señales con integrales',
    resumen: 'La integral como área: valor medio, valor eficaz (rms), factores de forma y de cresta',
    confirmar: false,

    teoria: String.raw`
<p>Cuando decimos que en casa tenemos “220 V”, ¿qué significa, si la tensión de la red va y viene entre +311 V y −311 V cincuenta veces por segundo? ¿Y qué marca el multímetro cuando medimos la salida de un rectificador o un PWM? Para responder necesitamos dos números que resumen una señal variable: el <b>valor medio</b> y el <b>valor eficaz</b>. Los dos salen de calcular <b>áreas</b> bajo la curva, y la herramienta matemática para calcular áreas es la <b>integral</b>.</p>

<h2>1. La integral como área</h2>
<p>Si la tensión fuera constante (una pila de 9 V durante 2 s), el área bajo la gráfica $v(t)$ sería un rectángulo: $9\,\text{V}\cdot2\,\text{s}=18\,\text{V}\cdot\text{s}$. Pero si la tensión varía, el área tiene forma curva. ¿Cómo la calculamos?</p>
<p>La idea es <b>cortarla en rectángulos angostos</b>: cada uno de ancho $\Delta t$ y alto $v(t_i)$. Sumamos sus áreas y obtenemos una aproximación. Cuanto más angostos los rectángulos, mejor la aproximación:</p>
${figRect}
<div class="caja formula"><span class="caja-titulo">Definición intuitiva de integral</span>
$$\int_a^b v(t)\,dt=\lim_{\Delta t\to0}\sum_i v(t_i)\,\Delta t$$
<p>El símbolo $\int$ es una “S” estirada de <b>suma</b>, y $dt$ es el ancho infinitamente chico de cada rectángulo. Las áreas por debajo del eje cuentan <b>negativas</b>.</p>
</div>
<div class="caja tip"><span class="caja-titulo">Las dos integrales que vamos a necesitar</span>
$$\int_0^{T/2}\text{sen}(\omega t)\,dt=\frac{2}{\omega}=\frac{T}{\pi}\qquad\qquad \int_0^{T}\text{sen}^2(\omega t)\,dt=\frac{T}{2}$$
<p>La primera sale de que la primitiva de $\text{sen}(\omega t)$ es $-\frac{\cos(\omega t)}{\omega}$. La segunda, de la identidad $\text{sen}^2\alpha=\frac{1-\cos 2\alpha}{2}$: el coseno promedia cero en un período y queda la mitad.</p>
</div>

<h2>2. Valor medio</h2>
<p>El <b>valor medio</b> es la altura que debería tener un rectángulo del mismo ancho (un período) para tener <b>la misma área</b> que la señal. Es como tener arena amontonada con forma de ola y <b>nivelarla</b>: la altura que queda pareja es el valor medio.</p>
<div class="caja formula"><span class="caja-titulo">Valor medio</span>
$$V_{med}=\frac{1}{T}\int_0^T v(t)\,dt=\frac{\text{área en un período}}{T}$$
<p>Es la <b>componente continua</b> de la señal. Es lo que mide un multímetro en la escala de <b>continua (DC)</b>, y lo que “ve” una carga lenta (un motor, un capacitor grande, un instrumento de aguja).</p>
</div>
${figMedio}
<div class="caja ojo"><span class="caja-titulo">Error típico</span>
El valor medio de una senoidal completa es <b>cero</b> (el área positiva cancela la negativa). Por eso, cuando se habla del “valor medio de una senoidal” casi siempre se refiere al de <b>medio ciclo</b> (o al de la señal rectificada): $\frac{2V_p}{\pi}\approx0{,}637\,V_p$.
</div>

<h2>3. Valor eficaz (rms)</h2>
<p>El <b>valor eficaz</b> responde a otra pregunta: <b>¿qué tensión continua calentaría igual una resistencia?</b> Si conectás una estufa a la red de 220 V eficaces, calienta exactamente igual que si la conectaras a una batería (imaginaria) de 220 V de continua.</p>
${Esq.svg(460, 150, [
  Esq.fuenteAC(40, 40, 40, 120, 'Red', '220 V ef.', -1), Esq.cable([[40, 40], [40, 20], [150, 20], [150, 40]]),
  Esq.R(150, 40, 150, 120, 'R', '48,4 Ω', 1), Esq.cable([[150, 120], [150, 140], [40, 140], [40, 120]]),
  Esq.texto(230, 85, '=', { size: 26 }), Esq.texto(230, 110, 'mismo calor', { size: 11, peso: 400 }),
  Esq.bat(330, 40, 330, 120, 'CC', '220 V', -1), Esq.cable([[330, 40], [330, 20], [430, 20], [430, 40]]),
  Esq.R(430, 40, 430, 120, 'R', '48,4 Ω', 1), Esq.cable([[430, 120], [430, 140], [330, 140], [330, 120]]),
], 'Las dos resistencias disipan 1000 W. Eso define “220 V eficaces”.')}
<p>Como la potencia en una resistencia es $p=\frac{v^2}{R}$, para encontrar la potencia media hay que promediar $v^2$, no $v$. De ahí sale la receta, que se lee <b>al revés</b> del nombre en inglés <em>root mean square</em>: <b>raíz</b> de la <b>media</b> del <b>cuadrado</b>.</p>
<div class="caja formula"><span class="caja-titulo">Valor eficaz (rms)</span>
$$V_{rms}=\sqrt{\frac{1}{T}\int_0^T v^2(t)\,dt}\qquad\qquad P=\frac{V_{rms}^2}{R}=I_{rms}^2\,R$$
<ol>
<li><b>Cuadrado:</b> elevás la señal al cuadrado (todo queda positivo).</li>
<li><b>Media:</b> calculás el valor medio de ese cuadrado (área de $v^2$ sobre $T$).</li>
<li><b>Raíz:</b> sacás la raíz para volver a tener volts.</li>
</ol>
</div>
<div class="caja ejemplo"><span class="caja-titulo">La red de 220 V</span>
Los 220 V son <b>eficaces</b>. El pico es $V_p=220\cdot\sqrt2=311\,\text{V}$, y la tensión pico a pico, $622\,\text{V}$.<br>
Una plancha de $48{,}4\,\Omega$: $P=\frac{220^2}{48{,}4}=1000\,\text{W}$. La potencia instantánea varía entre 0 y $\frac{311^2}{48{,}4}=2000\,\text{W}$; su promedio es 1000 W.
</div>
<div class="caja idea"><span class="caja-titulo">Para recordar</span>
Siempre que alguien diga una tensión alterna sin aclarar (“un transformador de 12 V”, “la red de 220 V”), <b>es el valor eficaz</b>. Un trafo de 12 V tiene un pico de $12\sqrt2=16{,}97\,\text{V}$: eso es lo que va a ver el capacitor del filtro (tema 12).
</div>

<h2>4. Cálculo paso a paso: la senoidal</h2>
<p>Con $v(t)=V_p\,\text{sen}(\omega t)$ y $\omega T=2\pi$:</p>
<div class="caja formula"><span class="caja-titulo">Valor medio de medio ciclo</span>
$$V_{med}=\frac{1}{T/2}\int_0^{T/2}V_p\,\text{sen}(\omega t)\,dt=\frac{2V_p}{T}\left[-\frac{\cos(\omega t)}{\omega}\right]_0^{T/2}=\frac{2V_p}{T\omega}\big(1-\cos\pi\big)=\frac{2V_p}{2\pi}\cdot2=\frac{2V_p}{\pi}$$
</div>
<div class="caja formula"><span class="caja-titulo">Valor eficaz</span>
$$V_{rms}^2=\frac{1}{T}\int_0^T V_p^2\,\text{sen}^2(\omega t)\,dt=\frac{V_p^2}{T}\int_0^T\frac{1-\cos(2\omega t)}{2}\,dt=\frac{V_p^2}{T}\cdot\frac{T}{2}=\frac{V_p^2}{2}$$
$$\boxed{V_{rms}=\frac{V_p}{\sqrt2}\approx0{,}707\,V_p}$$
</div>

<h2>5. Las demás señales</h2>
<h3>Rectificada de media onda</h3>
<p>Solo hay semiciclo positivo; el otro medio período vale 0. El área es la misma que la de medio ciclo senoidal ($V_pT/\pi$), pero se reparte en todo el período $T$:</p>
$$V_{med}=\frac1T\cdot\frac{V_pT}{\pi}=\frac{V_p}{\pi}\approx0{,}318\,V_p\qquad V_{rms}=\sqrt{\frac1T\cdot\frac{V_p^2\,T}{4}}=\frac{V_p}{2}$$
<h3>Rectificada de onda completa</h3>
<p>Los dos semiciclos son positivos: el doble de área que en media onda.</p>
$$V_{med}=\frac{2V_p}{\pi}\approx0{,}637\,V_p\qquad V_{rms}=\frac{V_p}{\sqrt2}\ \text{(igual que la senoidal: } v^2\text{ no cambia)}$$
<h3>Cuadrada de 0 a $V_p$ con ciclo de trabajo $D$</h3>
<p>Vale $V_p$ durante un tiempo $D\cdot T$ y 0 el resto ($D$ entre 0 y 1; $D=0{,}5$ es 50 %). El área es un rectángulo:</p>
$$V_{med}=\frac{V_p\cdot DT}{T}=D\,V_p\qquad V_{rms}=\sqrt{\frac{V_p^2\cdot DT}{T}}=V_p\sqrt D$$
<h3>Triangular y diente de sierra</h3>
<p>Una rampa al cuadrado da una parábola, cuya área es un tercio del rectángulo que la contiene:</p>
$$V_{rms}=\frac{V_p}{\sqrt3}\approx0{,}577\,V_p$$
<p>La triangular simétrica (±$V_p$) tiene valor medio 0; el diente de sierra de 0 a $V_p$ tiene valor medio $V_p/2$.</p>

<h2>6. Tabla resumen</h2>
<div class="tabla-wrap"><table class="tabla">
<tr><th>Señal</th><th>Forma</th><th>$V_{med}$</th><th>$V_{rms}$</th><th>Factor de forma</th><th>Factor de cresta</th></tr>
<tr><td>Senoidal ±$V_p$</td><td>${sp('sen')}</td><td>0 (medio ciclo: $\frac{2V_p}{\pi}$)</td><td>$\frac{V_p}{\sqrt2}=0{,}707V_p$</td><td>1,11</td><td>1,41</td></tr>
<tr><td>Media onda</td><td>${sp('media')}</td><td>$\frac{V_p}{\pi}=0{,}318V_p$</td><td>$\frac{V_p}{2}$</td><td>1,57</td><td>2</td></tr>
<tr><td>Onda completa</td><td>${sp('completa')}</td><td>$\frac{2V_p}{\pi}=0{,}637V_p$</td><td>$\frac{V_p}{\sqrt2}$</td><td>1,11</td><td>1,41</td></tr>
<tr><td>Cuadrada 0 a $V_p$, ciclo $D$</td><td>${sp('cuad')}</td><td>$D\,V_p$</td><td>$V_p\sqrt D$</td><td>$\frac{1}{\sqrt D}$</td><td>$\frac{1}{\sqrt D}$</td></tr>
<tr><td>Cuadrada ±$V_p$ (simétrica)</td><td>${spark(x => ((x - Math.floor(x)) < 0.5 ? 1 : -1))}</td><td>0</td><td>$V_p$</td><td>1</td><td>1</td></tr>
<tr><td>Triangular ±$V_p$</td><td>${sp('tri')}</td><td>0</td><td>$\frac{V_p}{\sqrt3}=0{,}577V_p$</td><td>1,15</td><td>1,73</td></tr>
<tr><td>Diente de sierra 0 a $V_p$</td><td>${sp('sierra')}</td><td>$\frac{V_p}{2}$</td><td>$\frac{V_p}{\sqrt3}$</td><td>1,15</td><td>1,73</td></tr>
</table></div>
<p style="font-size:.88rem;color:var(--muted)">Para las señales de valor medio cero, el factor de forma se calcula con el valor medio <b>rectificado</b> (el de $|v|$): senoidal $\frac{2V_p}{\pi}$, cuadrada $V_p$, triangular $\frac{V_p}{2}$.</p>

<h2>7. Factor de forma y factor de cresta</h2>
<div class="dos-col">
<div class="caja formula"><span class="caja-titulo">Factor de forma</span>
$$FF=\frac{V_{rms}}{|V|_{med}}$$
Para la senoidal: $\frac{V_p/\sqrt2}{2V_p/\pi}=\frac{\pi}{2\sqrt2}=1{,}11$. Indica cuánto más grande es el eficaz que el medio.
</div>
<div class="caja formula"><span class="caja-titulo">Factor de cresta</span>
$$FC=\frac{V_p}{V_{rms}}$$
Para la senoidal: $\sqrt2=1{,}41$. Un factor de cresta alto indica <b>picos angostos</b> (por ejemplo, la corriente de una fuente con capacitor: $FC\approx3$).
</div>
</div>

<h2>8. ¿Por qué un multímetro “común” mide mal?</h2>
<p>Calcular un eficaz de verdad (cuadrado, media, raíz) requiere un circuito especial. Los multímetros baratos hacen trampa: en la escala de alterna <b>rectifican la señal, miden su valor medio y lo multiplican por 1,11</b> (el factor de forma de la senoidal). Si la señal <b>es senoidal</b>, la lectura es correcta. Si no lo es, el error puede ser grande.</p>
<div class="caja ejemplo"><span class="caja-titulo">Ejemplo: cuadrada de ±10 V</span>
Medio rectificado: $|V|_{med}=10\,\text{V}$. El multímetro común muestra $1{,}11\cdot10=11{,}1\,\text{V}$. El eficaz verdadero es $10\,\text{V}$: <b>error de +11 %</b>.<br>
Con una triangular de ±10 V: muestra $1{,}11\cdot5=5{,}55\,\text{V}$ en lugar de $5{,}77\,\text{V}$ (−3,8 %). Con los pulsos de corriente de una fuente de PC el error puede superar el 30 %.
</div>
<div class="caja tip"><span class="caja-titulo">Cómo darse cuenta</span>
Los multímetros que calculan el eficaz real dicen <b>“TRUE RMS”</b> en el frente. Además, casi todos en la escala AC <b>bloquean la continua</b> (miden solo la parte alterna): para una señal con offset, el eficaz total es $\sqrt{V_{DC}^2+V_{AC,rms}^2}$.
</div>
<div class="caja ojo"><span class="caja-titulo">Medir un PWM</span>
Un PWM de 0 a 5 V con $D=25\,\%$, medido en <b>DC</b>, da 1,25 V (el valor medio: lo correcto si te interesa la velocidad de un motor). Su eficaz es $5\sqrt{0{,}25}=2{,}5\,\text{V}$ (lo que importa para el calentamiento de una resistencia). ¡El doble!
</div>
`,

    simulaciones: [
      {
        titulo: 'Área, valor medio y valor eficaz de distintas señales',
        descripcion: 'Elegí una señal (50 Hz). El área positiva se pinta de verde y la negativa de rojo. Compará el valor integrado numéricamente con la fórmula y mirá qué mostraría un multímetro común.',
        montar(cont, H) {
          const { controles, vista } = H.layout(cont);
          const sel = H.select(controles, { label: 'Señal', opciones: Object.entries(SENALES).map(([v, s]) => ({ v, t: s.t })), value: 'sen', onChange: () => { mostrarCtrls(); upd(); } });
          const vp = H.slider(controles, { label: 'Valor pico Vp', min: 1, max: 350, log: true, value: 10, unidad: 'V', onInput: upd });
          const fila = H.el('div', { style: 'display:flex;gap:6px;flex-wrap:wrap' }); controles.append(fila);
          H.boton(fila, 'Vp = 5 V', () => { vp.value = 5; upd(); }, 'btn chico');
          H.boton(fila, 'Trafo 12 V (16,97 Vp)', () => { vp.value = 16.97; upd(); }, 'btn chico');
          H.boton(fila, 'Red 220 V (311 Vp)', () => { vp.value = 311; upd(); }, 'btn chico');
          const dd = H.slider(controles, { label: 'Ciclo de trabajo D', min: 0, max: 100, step: 1, value: 30, fmt: v => v + ' %', onInput: upd });
          const off = H.slider(controles, { label: 'Offset VDC (en % de Vp)', min: -100, max: 100, step: 5, value: 50, fmt: v => v + ' % → ' + H.fmt(v / 100 * vp.value, 'V'), onInput: upd });
          H.sep(controles);
          const verMed = H.check(controles, { label: 'Línea de Vmed', value: true, onChange: upd });
          const verRms = H.check(controles, { label: 'Línea de Vrms', value: true, onChange: upd });
          function mostrarCtrls() {
            dd.el.style.display = sel.value === 'cuad' ? '' : 'none';
            off.el.style.display = sel.value === 'offset' ? '' : 'none';
          }
          const par = () => ({ Vp: vp.value, D: dd.value / 100, Vdc: off.value / 100 * vp.value });
          const cv = H.canvas(vista, {
            alto: (w) => Math.round(Math.max(230, Math.min(300, w * 0.45))),
            dibujar(ctx, w, h) {
              const S = SENALES[sel.value], p = par();
              const f = t => S.f(t / T, p);
              let mn = 0, mx = 0; for (let i = 0; i <= 400; i++) { const v = S.f(i / 400, p); mn = Math.min(mn, v); mx = Math.max(mx, v); }
              const span = Math.max(mx - mn, 1e-9);
              const P = H.ejes(ctx, w, h, { xmin: 0, xmax: 2 * T, ymin: mn - span * 0.12, ymax: mx + span * 0.15, xticks: w < 500 ? [0, 0.01, 0.02, 0.03, 0.04] : [0, 0.005, 0.01, 0.015, 0.02, 0.025, 0.03, 0.035, 0.04], xfmt: t => H.num(t * 1000, 1) + ' ms', yfmt: y => H.fmt(y, 'V', 3).replace(' ', ''), ml: 58, xlabel: 't', ylabel: 'v(t)' });
              P.area(t => Math.max(0, f(t)), { color: H.col('c3'), alfa: 0.3, n: 1200 });
              P.area(t => Math.min(0, f(t)), { color: H.col('red'), alfa: 0.3, n: 1200 });
              P.fn(f, { color: H.col('c1'), ancho: 2.4, n: 1600 });
              const med = S.med(p), rms = S.rms(p);
              if (verMed.value) P.hline(med, { color: H.col('c2'), ancho: 2, label: 'Vmed = ' + H.fmt(med, 'V'), labelX: 0.019 });
              if (verRms.value) P.hline(rms, { color: H.col('c4'), ancho: 2, label: 'Vrms = ' + H.fmt(rms, 'V') });
            },
          });
          const lec = H.lecturas(vista);
          const nota = H.nota(vista);
          function upd() {
            const S = SENALES[sel.value], p = par();
            const f = x => S.f(x, p);
            const N = 20000;
            let med = H.integrar(f, 0, 1, N);
            if (Math.abs(med) < 1e-9 * p.Vp) med = 0;
            const rms = Math.sqrt(H.integrar(x => f(x) ** 2, 0, 1, N));
            const absMed = H.integrar(x => Math.abs(f(x)), 0, 1, N);
            const acTrue = Math.sqrt(Math.max(0, rms * rms - med * med));
            const acMed = H.integrar(x => Math.abs(f(x) - med), 0, 1, N);
            const comun = acMed * PI / (2 * R2);
            let pk = 0; for (let i = 0; i <= 2000; i++) pk = Math.max(pk, Math.abs(f(i / 2000)));
            const errM = acTrue > 1e-9 ? (comun - acTrue) / acTrue * 100 : 0;
            cv.redibujar();
            lec.set([
              { k: 'Vmed integrado', v: H.fmt(med, 'V') },
              { k: 'Vmed por fórmula', v: H.fmt(S.med(p), 'V'), estado: 'ok' },
              { k: 'Vrms integrado', v: H.fmt(rms, 'V') },
              { k: 'Vrms por fórmula', v: H.fmt(S.rms(p), 'V'), estado: 'ok' },
              { k: '|v| medio (rectificado)', v: H.fmt(absMed, 'V') },
              { k: 'Factor de forma Vrms/|v|med', v: absMed > 0 ? H.num(rms / absMed, 3) : '—' },
              { k: 'Factor de cresta Vp/Vrms', v: rms > 0 ? H.num(pk / rms, 3) : '—' },
              { k: 'Potencia en 100 Ω', v: H.fmt(rms * rms / 100, 'W') },
              { k: 'Multímetro TRUE RMS (AC)', v: H.fmt(acTrue, 'V') },
              { k: 'Multímetro común (AC)', v: H.fmt(comun, 'V'), estado: Math.abs(errM) > 2 ? 'mal' : 'ok' },
              { k: 'Error del multímetro común', v: acTrue > 1e-9 ? (errM >= 0 ? '+' : '') + H.num(errM, 1) + ' %' : '—', estado: Math.abs(errM) > 2 ? 'mal' : 'ok' },
            ]);
            nota.innerHTML = `<b>Fórmulas:</b> $V_{med}=${S.fmed}$, $V_{rms}=${S.frms}$.` + S.paso +
              (Math.abs(errM) > 2 ? `<p><b>Ojo con el multímetro común:</b> mide el medio rectificado de la parte alterna y lo multiplica por 1,11. Como esta señal no es senoidal, se equivoca un ${H.num(Math.abs(errM), 1)} %.</p>` : '') +
              ((sel.value === 'media' || sel.value === 'completa' || sel.value === 'sierra' || sel.value === 'offset' || sel.value === 'cuad') ? '<p style="margin-bottom:0">Los multímetros en AC bloquean la continua: solo miden la parte alterna, $\\sqrt{V_{rms}^2-V_{med}^2}$. La continua se mide aparte, en DC.</p>' : '');
            if (window.renderMathInElement) renderMathInElement(nota, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }], throwOnError: false });
          }
          mostrarCtrls(); upd();
        },
      },
      {
        titulo: 'La integral como suma de rectángulos',
        descripcion: 'Aproximá el área bajo medio ciclo de una senoidal (50 Hz) con rectángulos. Activá “v²” para ver cómo se calcula el valor eficaz.',
        montar(cont, H) {
          const { controles, vista } = H.layout(cont);
          const vp = H.slider(controles, { label: 'Valor pico Vp', min: 1, max: 20, step: 0.5, value: 10, unidad: 'V', onInput: upd });
          const nR = H.slider(controles, { label: 'Cantidad de rectángulos', min: 2, max: 200, step: 1, value: 6, fmt: v => String(v), onInput: upd });
          const met = H.select(controles, { label: 'Altura de cada rectángulo', opciones: [{ v: 'izq', t: 'Extremo izquierdo' }, { v: 'medio', t: 'Punto medio' }, { v: 'der', t: 'Extremo derecho' }], value: 'izq', onChange: upd });
          H.sep(controles);
          const cuad = H.check(controles, { label: 'Mostrar v² (para el valor eficaz)', value: false, onChange: upd });
          const Tm = 20, semi = Tm / 2;   // en ms
          let suma = 0;
          const g = (t) => { const v = vp.value * Math.sin(PI * t / semi); return cuad.value ? v * v : v; };
          const cv = H.canvas(vista, {
            alto: (w) => Math.round(Math.max(230, Math.min(300, w * 0.45))),
            dibujar(ctx, w, h) {
              const Vp = vp.value, ymax = (cuad.value ? Vp * Vp : Vp) * 1.18;
              const P = H.ejes(ctx, w, h, { xmin: 0, xmax: semi, ymin: 0, ymax, xfmt: t => H.num(t, 1) + ' ms', yfmt: y => H.num(y, 1), ml: 50, xlabel: 't', ylabel: cuad.value ? 'v² (V²)' : 'v (V)' });
              const n = nR.value, dt = semi / n;
              const colR = cuad.value ? H.col('c4') : H.col('c1');
              suma = 0;
              for (let i = 0; i < n; i++) {
                const tt = met.value === 'izq' ? i * dt : met.value === 'der' ? (i + 1) * dt : (i + 0.5) * dt;
                const y = g(tt); suma += y * dt;
                const x0 = P.X(i * dt), x1 = P.X((i + 1) * dt), yy = P.Y(y), y0 = P.Y(0);
                ctx.save(); ctx.globalAlpha = 0.28; ctx.fillStyle = colR; ctx.fillRect(x0, yy, x1 - x0, y0 - yy); ctx.restore();
                if (n <= 80) { ctx.strokeStyle = colR; ctx.lineWidth = 1; ctx.strokeRect(x0 + .5, yy + .5, x1 - x0, y0 - yy); }
              }
              P.fn(g, { color: H.col('c2'), ancho: 2.6 });
              if (cuad.value) {
                P.hline(Vp * Vp / 2, { color: H.col('c3'), ancho: 2, label: 'media de v² = Vp²/2' });
              } else {
                P.hline(2 * Vp / PI, { color: H.col('c3'), ancho: 2, label: 'Vmed = 2Vp/π' });
              }
            },
          });
          const lec = H.lecturas(vista);
          const nota = H.nota(vista);
          function upd() {
            cv.redibujar();
            const Vp = vp.value;
            const exacta = cuad.value ? Vp * Vp * semi / 2 : Vp * Tm / PI;
            const err = (suma - exacta) / exacta * 100;
            const u = cuad.value ? 'V²·ms' : 'V·ms';
            const items = [
              { k: 'Suma de rectángulos', v: H.num(suma, 4) + ' ' + u },
              { k: 'Área exacta (integral)', v: H.num(exacta, 4) + ' ' + u, estado: 'ok' },
              { k: 'Error', v: (err >= 0 ? '+' : '') + H.num(err, 3) + ' %', estado: Math.abs(err) < 0.5 ? 'ok' : Math.abs(err) < 5 ? 'alerta' : 'mal' },
            ];
            if (cuad.value) {
              items.push({ k: 'Media de v² = área / 10 ms', v: H.num(suma / semi, 4) + ' V²' });
              items.push({ k: 'Vrms = √(media de v²)', v: H.fmt(Math.sqrt(suma / semi), 'V') });
              items.push({ k: 'Vp/√2 (exacto)', v: H.fmt(Vp / R2, 'V'), estado: 'ok' });
            } else {
              items.push({ k: 'Vmed = área / 10 ms', v: H.fmt(suma / semi, 'V') });
              items.push({ k: '2Vp/π (exacto)', v: H.fmt(2 * Vp / PI, 'V'), estado: 'ok' });
            }
            lec.set(items);
            let t = cuad.value
              ? String.raw`<b>Paso a paso del rms:</b> 1) elevamos al cuadrado (curva naranja, siempre positiva); 2) el área bajo $v^2$ dividida por el tiempo da la <b>media</b> del cuadrado, $\frac{V_p^2}{2}$; 3) la <b>raíz</b> devuelve volts: $\frac{V_p}{\sqrt2}$. Fijate que la línea verde corta a $v^2$ justo a la mitad de su altura: lo que “sobra” arriba llena exactamente los huecos de abajo.`
              : String.raw`El área exacta es $\int_0^{T/2}V_p\,\text{sen}(\omega t)\,dt=\frac{V_pT}{\pi}$. Dividida por el ancho (10 ms) da el valor medio del semiciclo, $\frac{2V_p}{\pi}$.`;
            if (met.value !== 'medio' && nR.value < 30) t += ' <b>Probá cambiar a “punto medio”:</b> con la misma cantidad de rectángulos el error baja muchísimo, porque lo que sobra de un lado del rectángulo compensa lo que falta del otro.';
            if (met.value !== 'medio') t += ' (Curiosidad: izquierda y derecha dan lo mismo acá, porque la senoidal empieza y termina en cero.)';
            nota.innerHTML = t;
            if (window.renderMathInElement) renderMathInElement(nota, { delimiters: [{ left: '$', right: '$', display: false }], throwOnError: false });
          }
          upd();
        },
      },
    ],

    ejercicios: [
      {
        nivel: 'Básico',
        enunciado: String.raw`La red domiciliaria es de $220\,\text{V}$ eficaces. Calculá la tensión pico y la pico a pico. Hacé lo mismo para el secundario de un transformador de $12\,\text{V}$.`,
        pista: String.raw`$V_p=V_{rms}\cdot\sqrt2$; $V_{pp}=2V_p$.`,
        solucion: String.raw`Red: $V_p=220\cdot1{,}414=311\,\text{V}$; $V_{pp}=622\,\text{V}$.<br>Trafo: $V_p=12\cdot1{,}414=16{,}97\,\text{V}$; $V_{pp}=33{,}9\,\text{V}$.<br>Importante: los componentes (diodos, capacitores) se eligen por la tensión <b>pico</b>, no por la eficaz. Un capacitor de 16 V en la salida de ese trafo rectificado ¡explota!`,
      },
      {
        nivel: 'Básico',
        enunciado: String.raw`Un Arduino genera una cuadrada de $0$ a $5\,\text{V}$ con ciclo de trabajo $D=30\,\%$. Calculá el valor medio y el valor eficaz. ¿Qué indicaría un multímetro en la escala de continua?`,
        pista: String.raw`$V_{med}=D\,V_p$ y $V_{rms}=V_p\sqrt D$, con $D=0{,}3$.`,
        solucion: String.raw`$V_{med}=0{,}3\cdot5=1{,}5\,\text{V}$; $V_{rms}=5\sqrt{0{,}3}=5\cdot0{,}5477=2{,}74\,\text{V}$.<br>En DC el multímetro muestra el valor medio: <b>1,5 V</b>. Verificalo en la simulación 1 eligiendo “Cuadrada”, Vp = 5 V y D = 30 %.`,
      },
      {
        nivel: 'Intermedio',
        enunciado: String.raw`Un transformador de $12\,\text{V}$ ($V_p\approx17\,\text{V}$, despreciá la caída en los diodos) alimenta una resistencia de $100\,\Omega$ a través de un rectificador. Calculá $V_{med}$, $V_{rms}$, la corriente media y la potencia en la resistencia para (a) media onda y (b) onda completa.`,
        pista: String.raw`Media onda: $\frac{V_p}{\pi}$ y $\frac{V_p}{2}$. Onda completa: $\frac{2V_p}{\pi}$ y $\frac{V_p}{\sqrt2}$. La potencia se calcula con el eficaz: $P=V_{rms}^2/R$.`,
        solucion: String.raw`(a) Media onda: $V_{med}=\frac{17}{\pi}=5{,}41\,\text{V}$; $V_{rms}=\frac{17}{2}=8{,}5\,\text{V}$; $I_{med}=\frac{5{,}41}{100}=54{,}1\,\text{mA}$; $P=\frac{8{,}5^2}{100}=0{,}72\,\text{W}$.<br>(b) Onda completa: $V_{med}=\frac{2\cdot17}{\pi}=10{,}82\,\text{V}$; $V_{rms}=\frac{17}{\sqrt2}=12{,}02\,\text{V}$; $I_{med}=108{,}2\,\text{mA}$; $P=\frac{12{,}02^2}{100}=1{,}44\,\text{W}$.<br>La potencia en onda completa es el doble (y es la misma que sin rectificar). Ojo: <b>no</b> se calcula $P=V_{med}^2/R$.`,
      },
      {
        nivel: 'Intermedio',
        enunciado: String.raw`Con un multímetro común (no true RMS) en la escala de alterna se mide (a) una cuadrada simétrica de $\pm10\,\text{V}$ y (b) una triangular de $\pm10\,\text{V}$. ¿Qué indica en cada caso y cuál es el valor eficaz real? Calculá el error porcentual.`,
        pista: String.raw`El multímetro común muestra $1{,}11\cdot|V|_{med}$. Cuadrada: $|V|_{med}=V_p$, $V_{rms}=V_p$. Triangular: $|V|_{med}=V_p/2$, $V_{rms}=V_p/\sqrt3$.`,
        solucion: String.raw`(a) Indica $1{,}11\cdot10=11{,}1\,\text{V}$; real $10\,\text{V}$ → error $+11\,\%$.<br>(b) Indica $1{,}11\cdot5=5{,}55\,\text{V}$; real $\frac{10}{\sqrt3}=5{,}77\,\text{V}$ → error $\frac{5{,}55-5{,}77}{5{,}77}=-3{,}8\,\%$.<br>Conclusión: solo con senoidales el multímetro común es confiable. Para variadores, fuentes conmutadas o dimmers hace falta un true RMS.`,
      },
      {
        nivel: 'Intermedio',
        enunciado: String.raw`La salida de un sensor tiene una continua de $2{,}5\,\text{V}$ con una senoidal de $1\,\text{V}$ pico superpuesta. Calculá el valor medio y el valor eficaz total. ¿Qué indica un true RMS en la escala AC (que bloquea la continua)?`,
        pista: String.raw`Los eficaces se suman en cuadratura: $V_{rms}=\sqrt{V_{DC}^2+V_{AC,rms}^2}$.`,
        solucion: String.raw`$V_{med}=2{,}5\,\text{V}$. $V_{AC,rms}=\frac{1}{\sqrt2}=0{,}707\,\text{V}$.<br>$V_{rms}=\sqrt{2{,}5^2+0{,}707^2}=\sqrt{6{,}25+0{,}5}=\sqrt{6{,}75}=2{,}60\,\text{V}$.<br>El true RMS en AC muestra solo la parte alterna: <b>0,707 V</b>; en DC, 2,5 V. (No es 2,5 + 0,707 = 3,2 V.) En la simulación 1 (“Senoidal con offset”) probá otra combinación: Vp = 2 V y offset 50 % (VDC = 1 V) da $V_{rms}=\sqrt{1^2+2^2/2}=\sqrt3=1{,}73\,\text{V}$.`,
      },
      {
        nivel: 'Avanzado',
        enunciado: String.raw`Demostrá, integrando, que el valor eficaz de una onda triangular de $\pm V_p$ es $\frac{V_p}{\sqrt3}$.`,
        pista: String.raw`Por simetría, alcanza un cuarto de período: en $0\le t\le T/4$ la señal es la rampa $v=V_p\frac{t}{T/4}$. Promediá $v^2$ en ese tramo.`,
        solucion: String.raw`Llamemos $\tau=T/4$. En $[0,\tau]$: $v(t)=V_p\frac{t}{\tau}$.<br>$$V_{rms}^2=\frac1\tau\int_0^\tau V_p^2\frac{t^2}{\tau^2}dt=\frac{V_p^2}{\tau^3}\left[\frac{t^3}{3}\right]_0^\tau=\frac{V_p^2}{\tau^3}\cdot\frac{\tau^3}{3}=\frac{V_p^2}{3}$$
        $V_{rms}=\frac{V_p}{\sqrt3}=0{,}577\,V_p$. Los otros tres cuartos de período dan lo mismo porque $v^2$ es la misma rampa reflejada.`,
      },
      {
        nivel: 'Avanzado',
        enunciado: String.raw`Muchos secadores de pelo tienen una posición “baja” que solo agrega un diodo en serie con la resistencia calefactora (media onda). Si la resistencia es de $48{,}4\,\Omega$ y la red de $220\,\text{V}$, calculá la potencia en posición alta y en posición baja. ¿La potencia baja a la mitad o a menos?`,
        pista: String.raw`Sin diodo: $V_{rms}=220\,\text{V}$. Con diodo (media onda): $V_{rms}=\frac{V_p}{2}$ con $V_p=311\,\text{V}$.`,
        solucion: String.raw`Alta: $P=\frac{220^2}{48{,}4}=1000\,\text{W}$.<br>Baja: $V_{rms}=\frac{311}{2}=155{,}6\,\text{V}$; $P=\frac{155{,}6^2}{48{,}4}=500\,\text{W}$.<br>La potencia baja <b>exactamente a la mitad</b>: se elimina la mitad de los semiciclos y cada uno aporta la misma energía. Notá que la tensión eficaz no baja a la mitad (baja a $1/\sqrt2$): el que baja a la mitad es $V_{rms}^2$.`,
      },
    ],

    quiz: [
      { pregunta: '“220 V” en la red domiciliaria es…', opciones: ['El valor pico', 'El valor pico a pico', 'El valor eficaz', 'El valor medio'], correcta: 2, explicacion: 'Es el eficaz. El pico es 220·√2 ≈ 311 V.' },
      { pregunta: 'El valor medio de una senoidal completa (sin rectificar) es…', opciones: ['0,637·Vp', '0,707·Vp', 'Cero', 'Vp/π'], correcta: 2, explicacion: 'El área positiva y la negativa son iguales y se cancelan.' },
      { pregunta: 'El valor eficaz de una tensión variable es…', opciones: ['El promedio de los valores', 'La tensión continua que produciría el mismo calor en una resistencia', 'El valor máximo', 'La mitad del pico a pico'], correcta: 1, explicacion: 'Esa es la definición física: equivalencia térmica (raíz de la media del cuadrado).' },
      { pregunta: 'Un PWM de 0 a 12 V con D = 25 % tiene un valor medio de…', opciones: ['3 V', '6 V', '9 V', '12 V'], correcta: 0, explicacion: 'Vmed = D·Vp = 0,25·12 = 3 V. (Su eficaz sería 12·√0,25 = 6 V.)' },
      { pregunta: 'Medís una onda cuadrada con un multímetro que no es true RMS. La lectura…', opciones: ['Es correcta', 'Tiene un error de alrededor de +11 %', 'Siempre da cero', 'Muestra el valor pico'], correcta: 1, explicacion: 'Mide el medio rectificado (Vp) y lo multiplica por 1,11, el factor de forma de la senoidal.' },
      { pregunta: '¿Cuál de estas señales con el mismo pico tiene MAYOR valor eficaz?', opciones: ['Senoidal', 'Triangular', 'Cuadrada simétrica', 'Media onda'], correcta: 2, explicacion: 'La cuadrada está siempre en ±Vp: su eficaz es Vp. Senoidal 0,707Vp, triangular 0,577Vp, media onda 0,5Vp.' },
    ],

    docente: String.raw`
<h3>Objetivo de la clase</h3>
<p>Que el alumno entienda la integral como <b>área</b> (sin necesidad de dominar técnicas de integración), que distinga <b>valor medio</b> (lo que mide un instrumento en DC, lo que mueve un motor) de <b>valor eficaz</b> (lo que calienta), y que use la tabla de fórmulas con soltura. Es imprescindible para rectificadores, filtros y PWM. <b>Duración sugerida:</b> 1 a 2 clases (80–120 min).</p>

<h3>Secuencia sugerida</h3>
<ol>
<li><b>Disparador (5 min):</b> “Si la tensión de la red va de +311 a −311 V, ¿por qué decimos 220 V?”. Dejalo que intente responder. Muchos dicen “porque es el promedio”: anotalo para desarmarlo después.</li>
<li><b>Integral como área (15 min):</b> simulación 2. Empezá con 2 rectángulos, extremo izquierdo, y andá subiendo. Preguntá: <em>“¿qué pasa con el error?”</em>. Pasá a punto medio. Mostrá que con 200 rectángulos el error es despreciable: eso es la integral. Escribí $\int v\,dt$ como “suma de $v\cdot\Delta t$”.</li>
<li><b>Valor medio (15 min):</b> simulación 1 con senoidal: <em>“¿cuánto da el promedio?”</em> → cero. Ahí se cae la idea de que 220 V es el promedio. Pasá a media onda y onda completa. Usá la analogía de “nivelar la arena”.</li>
<li><b>Valor eficaz (20 min):</b> explicá la equivalencia térmica con el esquema de las dos resistencias. Volvé a la simulación 2 y activá v²: mostrá que la media de v² es Vp²/2 (la línea corta a la curva a media altura) y que la raíz da Vp/√2. Botón “Red 220 V” en la simulación 1: aparece Vrms ≈ 220 V.</li>
<li><b>Tabla y multímetro (15 min):</b> recorré las señales en la simulación 1 mirando la lectura “Multímetro común”. Que descubra que con la senoidal acierta y con la cuadrada no.</li>
<li><b>Ejercicios (resto):</b> 1, 2 y 3 en clase. Tarea: 4, 5, 7. El 6 es para quien se anime con la integral.</li>
</ol>

<h3>Errores frecuentes del alumno</h3>
<ul>
<li>Creer que el eficaz es el promedio (o “el 70 % porque sí”, sin saber de dónde sale).</li>
<li>Calcular potencia con el valor medio: $P=V_{med}^2/R$ está <b>mal</b> salvo en continua pura.</li>
<li>Usar $V_p/\sqrt2$ para cualquier señal (solo vale para senoidal y onda completa).</li>
<li>Sumar eficaces directamente (continua + alterna) en lugar de en cuadratura.</li>
<li>Confundir el $V_{med}$ de media onda ($V_p/\pi$) con el de onda completa ($2V_p/\pi$).</li>
<li>Elegir componentes por la tensión eficaz en vez de la pico.</li>
</ul>

<h3>Preguntas disparadoras</h3>
<ul>
<li>¿Por qué en la escala DC un multímetro marca 0 V en un enchufe? (valor medio cero).</li>
<li>Si un motor CC se alimenta con onda completa de 17 V pico, ¿a qué tensión continua “equivale” para la velocidad? ¿Y para el calentamiento del bobinado?</li>
<li>¿Por qué un diodo en serie con un secador baja la potencia exactamente a la mitad?</li>
</ul>

<h3>Recordatorio rápido para vos</h3>
<ul>
<li>$\int\text{sen}(\omega t)\,dt=-\frac{\cos\omega t}{\omega}$; $\text{sen}^2\alpha=\frac{1-\cos2\alpha}{2}$; $\int_0^{T/2}\text{sen}\,\omega t\,dt=\frac T\pi$.</li>
<li>Senoidal: $V_{med,1/2}=0{,}637V_p$, $V_{rms}=0{,}707V_p$, FF = 1,11, FC = 1,414.</li>
<li>Media onda: $0{,}318V_p$ y $0{,}5V_p$. Onda completa: $0{,}637V_p$ y $0{,}707V_p$.</li>
<li>Cuadrada unipolar: $DV_p$ y $V_p\sqrt D$. Triangular/sierra: $V_p/\sqrt3$.</li>
<li>Con offset: $V_{rms}=\sqrt{V_{DC}^2+V_{AC,rms}^2}$ (Parseval, ver tema 2).</li>
<li>Multímetros de aguja (bobina móvil) en DC miden valor medio; los “promedio calibrados en rms” multiplican por 1,11.</li>
</ul>

<h3>Experiencia práctica</h3>
<ul>
<li><b>Tinkercad Circuits:</b> Arduino con <code>analogWrite(9, 77)</code> (D ≈ 30 %) y un multímetro en DC entre el pin 9 y GND: debe marcar ≈ 1,5 V. Cambiar el valor y comparar con $D\cdot5\,\text{V}$.</li>
<li><b>Con un multímetro real:</b> si tiene un trafo de 12 V, medir la salida en AC (≈ 12–13 V en vacío) y calcular el pico. Luego rectificar con un diodo 1N4007 sobre una resistencia de 1 kΩ y medir en DC: debería dar cerca de $V_p/\pi$ (un poco menos por la caída del diodo, ≈ 0,7 V). <b>Nunca trabajar directo con la red de 220 V.</b></li>
<li><b>Falstad:</b> fuente senoidal + diodo + resistencia, con el “scope” mostrando promedio y rms (clic derecho en el gráfico → mostrar valores).</li>
</ul>
`,
  });
})();
