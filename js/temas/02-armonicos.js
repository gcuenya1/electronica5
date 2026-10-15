/* Tema 02 — Armónicos (series de Fourier, espectro, THD)
   IMPORTANTE: los textos con LaTeX usan String.raw`...` para que "\frac" no se rompa.
   Todo va dentro de una IIFE para no ensuciar el espacio global (otros temas usan nombres parecidos). */
(() => {
  /* ---------- coeficientes de Fourier (normalizados por A) ----------
     v(t) = A · Σ b_n · sen(n·ω·t)                                     */
  function coef(forma, n) {
    if (forma === 'cuad') return n % 2 ? 4 / (Math.PI * n) : 0;
    if (forma === 'tri') return n % 2 ? (8 / (Math.PI * Math.PI * n * n)) * (((n - 1) / 2) % 2 ? -1 : 1) : 0;
    return (2 / (Math.PI * n)) * (n % 2 ? 1 : -1);          // diente de sierra
  }
  /* señal ideal, x = t/T (adimensional), amplitud 1 */
  function ideal(forma, x) {
    const u = x - Math.floor(x);
    if (forma === 'cuad') return u < 0.5 ? 1 : -1;
    if (forma === 'tri') return u < 0.25 ? 4 * u : u < 0.75 ? 2 - 4 * u : 4 * u - 4;
    const s = u + 0.5; return 2 * (s - Math.floor(s)) - 1;   // rampa de −1 a 1, cruza 0 en t = 0
  }
  /* primeros N armónicos NO nulos: [[n, b_n], ...] */
  function armonicos(forma, N) {
    const out = [];
    for (let n = 1; out.length < N && n < 400; n++) { const b = coef(forma, n); if (b !== 0) out.push([n, b]); }
    return out;
  }
  const THD_IDEAL = { cuad: 48.34, tri: 12.12, sierra: 80.31 };
  const NOMBRE = { cuad: 'cuadrada', tri: 'triangular', sierra: 'diente de sierra' };

  /* ---------- mini‑gráfico SVG estático para la teoría ---------- */
  function miniGraf(op) {
    const { w, h, xmin, xmax, ymin, ymax } = op;
    const ml = 30, mr = 10, mt = 12, mb = 24;
    const X = x => ml + (x - xmin) / (xmax - xmin) * (w - ml - mr);
    const Y = y => mt + (ymax - y) / (ymax - ymin) * (h - mt - mb);
    let s = `<line x1="${ml}" y1="${Y(0)}" x2="${w - mr}" y2="${Y(0)}" stroke="currentColor" stroke-width="1" opacity=".6"/>`;
    s += `<line x1="${ml}" y1="${mt}" x2="${ml}" y2="${h - mb}" stroke="currentColor" stroke-width="1" opacity=".6"/>`;
    for (const c of op.curvas || []) {
      let d = '';
      for (let i = 0; i <= 400; i++) { const x = xmin + (xmax - xmin) * i / 400; d += (i ? 'L' : 'M') + X(x).toFixed(1) + ' ' + Y(c.f(x)).toFixed(1); }
      s += `<path d="${d}" fill="none" stroke="${c.color}" stroke-width="${c.ancho || 2}" ${c.guiones ? `stroke-dasharray="${c.guiones}"` : ''}/>`;
    }
    for (const b of op.barras || []) {
      s += `<rect x="${X(b.x) - 7}" y="${Y(b.y)}" width="14" height="${Y(0) - Y(b.y)}" fill="${b.color}" opacity=".85"/>`;
      if (b.t) s += `<text x="${X(b.x)}" y="${Y(b.y) - 4}" text-anchor="middle" font-size="11" font-weight="600">${b.t}</text>`;
    }
    for (const [x, t] of op.ex || []) s += `<text x="${X(x)}" y="${h - 7}" text-anchor="middle" font-size="11">${t}</text>`;
    if (op.xl) s += `<text x="${w - mr}" y="${Y(0) - 6}" text-anchor="end" font-size="11" font-weight="700">${op.xl}</text>`;
    if (op.yl) s += `<text x="${ml + 5}" y="${mt + 10}" font-size="11" font-weight="700">${op.yl}</text>`;
    return `<svg class="esq" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
  }
  const sq3 = x => 4 / Math.PI * (Math.sin(2 * Math.PI * x) + Math.sin(6 * Math.PI * x) / 3 + Math.sin(10 * Math.PI * x) / 5);
  const figTiempoFrec = `<figure class="figura"><div class="dos-col" style="align-items:center">
    <div>${miniGraf({
      w: 320, h: 170, xmin: 0, xmax: 2, ymin: -1.5, ymax: 1.5, xl: 't', yl: 'v(t)',
      curvas: [
        { f: x => ideal('cuad', x), color: 'var(--muted)', ancho: 1.5, guiones: '4 3' },
        { f: x => 4 / Math.PI * Math.sin(2 * Math.PI * x), color: 'var(--c2)', ancho: 1.3 },
        { f: x => 4 / Math.PI * Math.sin(6 * Math.PI * x) / 3, color: 'var(--c3)', ancho: 1.3 },
        { f: x => 4 / Math.PI * Math.sin(10 * Math.PI * x) / 5, color: 'var(--c4)', ancho: 1.3 },
        { f: sq3, color: 'var(--c1)', ancho: 2.4 },
      ], ex: [[0.5, 'T/2'], [1, 'T'], [2, '2T']],
    })}</div>
    <div>${miniGraf({
      w: 320, h: 170, xmin: 0, xmax: 8, ymin: 0, ymax: 1.75, xl: 'f', yl: 'amplitud',
      barras: [
        { x: 1, y: 4 / Math.PI, color: 'var(--c2)', t: '1,27' }, { x: 3, y: 4 / Math.PI / 3, color: 'var(--c3)', t: '0,42' },
        { x: 5, y: 4 / Math.PI / 5, color: 'var(--c4)', t: '0,25' }, { x: 7, y: 4 / Math.PI / 7, color: 'var(--muted)', t: '0,18' },
      ], ex: [[1, 'f'], [2, '2f'], [3, '3f'], [4, '4f'], [5, '5f'], [6, '6f'], [7, '7f']],
    })}</div></div>
    <figcaption>Izquierda (dominio del tiempo): la fundamental (naranja), el 3.º (verde) y el 5.º armónico (magenta) sumados dan la curva azul, que ya se parece a la cuadrada punteada. Derecha (dominio de la frecuencia): la misma información como “barras” de amplitud. Amplitudes relativas a A = 1.</figcaption></figure>`;

  /* forma de la corriente de un rectificador con capacitor (pulsos angostos) */
  const figPulsos = miniGraf({
    w: 340, h: 160, xmin: 0, xmax: 2, ymin: -1.3, ymax: 1.3, xl: 't', yl: 'v e i',
    curvas: [
      { f: x => Math.sin(2 * Math.PI * x), color: 'var(--c1)', ancho: 1.6, guiones: '5 3' },
      { f: x => { const u = x - Math.floor(x); const g = (c) => Math.exp(-Math.pow((u - c) / 0.035, 2)); return 1.15 * (g(0.22) - g(0.72)); }, color: 'var(--c2)', ancho: 2.2 },
    ], ex: [[0.5, 'T/2'], [1, 'T'], [1.5, '3T/2'], [2, '2T']],
  });

  registrarTema({
    id: 'armonicos',
    orden: 2,
    titulo: 'Armónicos',
    resumen: 'Señales periódicas, series de Fourier, espectro y distorsión armónica (THD)',
    confirmar: false,

    teoria: String.raw`
<p>Si tocás la misma nota (por ejemplo un <em>La</em> de 440 Hz) con una guitarra y con una flauta, el oído reconoce enseguida cuál es cuál, aunque la nota sea la misma. ¿Por qué? Porque ninguna de las dos produce una senoidal pura: cada instrumento suma a la nota principal otras “notitas” de frecuencia <b>2, 3, 4, 5… veces</b> mayor, con distinta intensidad. Esas componentes se llaman <b>armónicos</b>, y la mezcla particular de cada instrumento es su <em>timbre</em>.</p>
<p>En electrónica pasa exactamente lo mismo: una onda cuadrada, la corriente que consume una fuente de PC o la salida de un rectificador son señales periódicas que <b>se pueden descomponer en senoidales</b>. Entender esto explica por qué los filtros funcionan, por qué las fuentes conmutadas “ensucian” la red y qué mide la función FFT de un osciloscopio.</p>

<h2>1. Señales periódicas</h2>
<p>Una señal es <b>periódica</b> si se repite idéntica cada cierto tiempo $T$, llamado <b>período</b>: $v(t+T)=v(t)$ para cualquier $t$.</p>
<div class="caja formula"><span class="caja-titulo">Período, frecuencia y pulsación</span>
$$f=\frac{1}{T}\qquad\qquad \omega = 2\pi f = \frac{2\pi}{T}$$
<p>$T$ en segundos, $f$ en hertz (Hz = ciclos por segundo), $\omega$ en radianes por segundo (rad/s). La senoidal general es</p>
$$v(t)=V_p\,\text{sen}(\omega t+\varphi)$$
<p>donde $V_p$ es la amplitud (valor pico) y $\varphi$ la fase inicial.</p>
</div>
<div class="caja ejemplo"><span class="caja-titulo">Ejemplo: la red eléctrica</span>
En Argentina la red es de $f=50\,\text{Hz}$, entonces $T=\frac{1}{50}=0{,}02\,\text{s}=20\,\text{ms}$ y $\omega=2\pi\cdot50\approx314\,\text{rad/s}$. Cada 20 ms la tensión hace un ciclo completo; en 1 segundo hace 50.
</div>

<h2>2. La idea de Fourier</h2>
<p>A principios del siglo XIX, Joseph Fourier mostró algo sorprendente: <b>toda señal periódica</b> (por “cuadrada” o “rara” que sea) se puede escribir como una <b>suma de senoidales</b> cuyas frecuencias son <b>múltiplos enteros</b> de la frecuencia de la señal, más un posible valor constante.</p>
<div class="caja formula"><span class="caja-titulo">Serie de Fourier (forma práctica)</span>
$$v(t)=V_0+V_1\,\text{sen}(\omega t+\varphi_1)+V_2\,\text{sen}(2\omega t+\varphi_2)+V_3\,\text{sen}(3\omega t+\varphi_3)+\dots$$
$$v(t)=V_0+\sum_{n=1}^{\infty}V_n\,\text{sen}(n\omega t+\varphi_n)$$
<ul>
<li>$V_0$: <b>componente continua</b> (el valor medio de la señal; lo vemos a fondo en el tema 3).</li>
<li>$n=1$: <b>fundamental</b>. Tiene la misma frecuencia $f$ que la señal.</li>
<li>$n=2,3,4\dots$: <b>armónicos</b>. El armónico $n$ tiene frecuencia $n\cdot f$.</li>
</ul>
</div>
<div class="caja idea"><span class="caja-titulo">Analogía: una receta</span>
Pensá en la señal como una torta y en las senoidales como los ingredientes. La serie de Fourier es la <b>receta</b>: “tanto de fundamental, tanto de 3.º armónico, tanto de 5.º…”. Con la receta completa reconstruís la torta exacta; con los primeros ingredientes ya tenés algo bastante parecido.
</div>
<div class="caja ojo"><span class="caja-titulo">Error típico</span>
Los armónicos <b>no</b> son frecuencias cualesquiera: son siempre <b>múltiplos exactos</b> de la fundamental. Para una señal de 50 Hz, los armónicos están en 100, 150, 200, 250 Hz… Nunca en 75 Hz ni en 120 Hz.
</div>

<h2>3. Dominio del tiempo y dominio de la frecuencia</h2>
<p>Hay dos formas de “mirar” la misma señal:</p>
<ul>
<li><b>Dominio del tiempo</b>: graficás $v$ en función de $t$. Es lo que muestra el <b>osciloscopio</b>.</li>
<li><b>Dominio de la frecuencia</b> (espectro): graficás la amplitud $V_n$ de cada armónico en función de su frecuencia $n\cdot f$. Son “barras” o rayas. Es lo que muestra un <b>analizador de espectro</b> o la función <b>FFT</b> de un osciloscopio digital.</li>
</ul>
${figTiempoFrec}
<p>Una senoidal pura tiene <b>una sola raya</b> en el espectro. Cuanto más se aleja la forma de una senoidal, más rayas aparecen.</p>

<h2>4. Armónicos pares e impares: la simetría manda</h2>
<p>No todas las señales tienen todos los armónicos. Hay una regla muy útil basada en la forma:</p>
<div class="caja formula"><span class="caja-titulo">Simetría de media onda → solo armónicos impares</span>
Si la segunda mitad del período es la primera mitad “dada vuelta” (invertida), es decir $v\!\left(t+\tfrac{T}{2}\right)=-v(t)$, la señal tiene <b>solo armónicos impares</b> (1, 3, 5, 7…) y no tiene componente continua.
</div>
<div class="tabla-wrap"><table class="tabla">
<tr><th>Señal</th><th>Armónicos presentes</th><th>Cómo decaen</th><th>Comentario</th></tr>
<tr><td>Senoidal</td><td>Solo la fundamental</td><td>—</td><td>Una única raya.</td></tr>
<tr><td>Cuadrada (simétrica)</td><td>Impares: 1, 3, 5, 7…</td><td>$1/n$ (lento)</td><td>Tiene saltos bruscos → muchos armónicos altos.</td></tr>
<tr><td>Triangular</td><td>Impares: 1, 3, 5, 7…</td><td>$1/n^2$ (rápido)</td><td>Es continua (sin saltos) → se parece mucho a una senoidal.</td></tr>
<tr><td>Diente de sierra</td><td>Todos: 1, 2, 3, 4…</td><td>$1/n$</td><td>No tiene simetría de media onda.</td></tr>
<tr><td>Rectificada de onda completa</td><td>Continua + pares: 2, 4, 6…</td><td>$\approx 1/n^2$</td><td>Su período es la mitad: por eso la “fundamental” del ripple es 100 Hz (tema 11).</td></tr>
<tr><td>Corriente de fuente con capacitor</td><td>Impares: 3, 5, 7… fuertes</td><td>lento</td><td>Pulsos angostos: la más problemática para la red.</td></tr>
</table></div>
<div class="caja tip"><span class="caja-titulo">Regla de oro</span>
<b>Cuanto más brusca es una señal, más armónicos de alta frecuencia tiene.</b> Un salto vertical (cuadrada, sierra) hace que las amplitudes caigan como $1/n$; un “quiebre” sin salto (triangular) las hace caer como $1/n^2$; una curva suave (senoidal) no tiene armónicos. Por eso los flancos muy rápidos de una señal digital generan interferencias (EMI) en radio.
</div>

<h2>5. Las series de las tres señales clásicas</h2>
<p>Con amplitud (valor pico) $A$ y $\omega=2\pi f$:</p>
<div class="caja formula"><span class="caja-titulo">Onda cuadrada (±A)</span>
$$v(t)=\frac{4A}{\pi}\left[\text{sen}(\omega t)+\frac{1}{3}\text{sen}(3\omega t)+\frac{1}{5}\text{sen}(5\omega t)+\dots\right]=\frac{4A}{\pi}\sum_{n\ \text{impar}}\frac{\text{sen}(n\omega t)}{n}$$
</div>
<div class="caja formula"><span class="caja-titulo">Onda triangular (±A)</span>
$$v(t)=\frac{8A}{\pi^2}\left[\text{sen}(\omega t)-\frac{1}{9}\text{sen}(3\omega t)+\frac{1}{25}\text{sen}(5\omega t)-\dots\right]=\frac{8A}{\pi^2}\sum_{n\ \text{impar}}(-1)^{\frac{n-1}{2}}\frac{\text{sen}(n\omega t)}{n^2}$$
</div>
<div class="caja formula"><span class="caja-titulo">Diente de sierra (rampa de −A a +A)</span>
$$v(t)=\frac{2A}{\pi}\left[\text{sen}(\omega t)-\frac{1}{2}\text{sen}(2\omega t)+\frac{1}{3}\text{sen}(3\omega t)-\dots\right]=\frac{2A}{\pi}\sum_{n=1}^{\infty}(-1)^{n+1}\frac{\text{sen}(n\omega t)}{n}$$
</div>
<div class="tabla-wrap"><table class="tabla">
<tr><th>Armónico $n$</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>7</th></tr>
<tr><td>Cuadrada: $V_n/A$</td><td>1,273</td><td>0</td><td>0,424</td><td>0</td><td>0,255</td><td>0,182</td></tr>
<tr><td>Triangular: $V_n/A$</td><td>0,811</td><td>0</td><td>0,090</td><td>0</td><td>0,032</td><td>0,017</td></tr>
<tr><td>Sierra: $V_n/A$</td><td>0,637</td><td>0,318</td><td>0,212</td><td>0,159</td><td>0,127</td><td>0,091</td></tr>
</table></div>
<div class="caja ejemplo"><span class="caja-titulo">Ejemplo: cuadrada de ±10 V y 1 kHz</span>
$$V_1=\frac{4\cdot10}{\pi}=12{,}73\,\text{V a 1 kHz}\qquad V_3=\frac{12{,}73}{3}=4{,}24\,\text{V a 3 kHz}$$
$$V_5=\frac{12{,}73}{5}=2{,}55\,\text{V a 5 kHz}\qquad V_7=\frac{12{,}73}{7}=1{,}82\,\text{V a 7 kHz}$$
Fijate algo curioso: <b>la fundamental (12,73 V) es más grande que la propia cuadrada (10 V)</b>. No hay contradicción: los demás armónicos “recortan” la senoidal para dejarla plana arriba.
</div>
<div class="caja idea"><span class="caja-titulo">Para qué sirve esto en la práctica</span>
Si pasás esa cuadrada de 1 kHz por un <b>filtro pasa bajos</b> que corta en 2 kHz, quedan solo los 12,73 V de la fundamental: <b>¡convertiste una cuadrada en una senoidal!</b> Así funcionan muchos generadores de señal y los inversores de “onda senoidal pura”. Con el PWM (tema 4) se usa la misma idea.
</div>

<h2>6. Fenómeno de Gibbs</h2>
<p>Si sumás muchos armónicos de una cuadrada, la aproximación mejora en casi todos lados… pero justo al lado de cada salto aparece un <b>sobrepico</b> (“cuernito”) que <b>no desaparece</b> aunque agregues infinitos términos: solo se hace más angosto. Su altura es de aproximadamente el <b>9 % del salto</b>. Para una cuadrada de ±A el salto es $2A$, así que el pico llega a $\approx 1{,}18\,A$.</p>
<div class="caja tip"><span class="caja-titulo">Dónde lo vas a ver</span>
En el osciloscopio, una cuadrada que pasó por un circuito que “corta” las frecuencias altas de forma abrupta muestra esas oscilaciones en los flancos (<em>ringing</em>). En la simulación 1 subí N a 50 y fijate en las esquinas.
</div>

<h2>7. Distorsión armónica total (THD)</h2>
<p>Muchas veces queremos una senoidal “limpia” (la tensión de la red, la salida de un amplificador de audio, un inversor). Para medir <b>cuánto se aleja de una senoidal pura</b> se usa la <b>distorsión armónica total</b>:</p>
<div class="caja formula"><span class="caja-titulo">THD</span>
$$\text{THD}=\frac{\sqrt{V_2^2+V_3^2+V_4^2+\dots}}{V_1}\cdot100\,\%$$
<p>Arriba: el “tamaño” de todos los armónicos juntos (se suman como cuadrados, porque lo que se suma es potencia). Abajo: la fundamental. Se puede usar con valores pico o eficaces, siempre que todos sean del mismo tipo.</p>
</div>
<div class="caja ejemplo"><span class="caja-titulo">Ejemplo</span>
Una señal tiene $V_1=10\,\text{V}$, $V_3=2\,\text{V}$ y $V_5=1\,\text{V}$:
$$\text{THD}=\frac{\sqrt{2^2+1^2}}{10}=\frac{\sqrt5}{10}=0{,}224\Rightarrow 22{,}4\,\%$$
</div>
<div class="tabla-wrap"><table class="tabla">
<tr><th>Señal / equipo</th><th>THD típica</th></tr>
<tr><td>Senoidal pura</td><td>0 %</td></tr>
<tr><td>Amplificador de audio de buena calidad</td><td>&lt; 0,1 %</td></tr>
<tr><td>Tensión de la red (límite usual de calidad)</td><td>&lt; 5 % a 8 %</td></tr>
<tr><td>Triangular</td><td>12,1 %</td></tr>
<tr><td>Cuadrada</td><td>48,3 %</td></tr>
<tr><td>Diente de sierra</td><td>80,3 %</td></tr>
<tr><td>Corriente de una fuente de PC sin PFC</td><td>80 % a 150 %</td></tr>
</table></div>

<h3>¿Por qué importa?</h3>
<p>Una <b>carga lineal</b> (resistencia, lámpara incandescente, motor) consume una corriente senoidal si la tensión es senoidal. Una <b>carga no lineal</b> no: consume corriente “a los tirones”. El caso típico es un <b>rectificador con capacitor</b> (adentro de cargadores, TV, PC, lámparas LED): el capacitor solo se recarga cerca del pico de la tensión, así que la corriente son <b>pulsos angostos</b>.</p>
<div class="dos-col" style="align-items:center">
${Esq.svg(340, 175, [
  Esq.fuenteAC(60, 70, 60, 140, 'Red', '220 V', -1), Esq.cable([[60, 70], [60, 55], [110, 55]]), Esq.cable([[60, 140], [60, 155], [110, 155]]),
  '<rect x="110" y="40" width="70" height="130" rx="6" fill="none" stroke="currentColor" stroke-width="2"/>',
  Esq.texto(145, 100, 'Puente', { size: 12 }), Esq.texto(145, 115, 'rectif.', { size: 12 }),
  Esq.texto(120, 60, '~', { size: 14 }), Esq.texto(120, 160, '~', { size: 14 }), Esq.texto(170, 60, '+', { size: 14 }), Esq.texto(170, 162, '−', { size: 14 }),
  Esq.cable([[180, 55], [310, 55], [310, 70]]), Esq.nodo(230, 55), Esq.cable([[230, 55], [230, 70]]),
  Esq.C(230, 70, 230, 140, 'C', '', -1, true), Esq.R(310, 70, 310, 140, 'Carga', '', -1),
  Esq.cable([[230, 140], [230, 155], [180, 155]]), Esq.cable([[310, 140], [310, 155], [230, 155]]), Esq.nodo(230, 155),
  Esq.flecha(70, 40, 100, 40, 'i', 'var(--c2)'),
], 'Fuente con puente rectificador y capacitor: una carga no lineal.')}
<figure class="figura">${figPulsos}<figcaption>Tensión de red (azul, punteada) y corriente consumida (naranja): pulsos angostos cerca de los picos, llenos de armónicos impares.</figcaption></figure>
</div>
<ul>
<li><b>Calentamiento:</b> los armónicos de corriente circulan por cables y transformadores sin hacer trabajo útil, pero calientan ($I^2R$). Los transformadores de distribución se recalientan.</li>
<li><b>El neutro sobrecargado:</b> en una instalación trifásica, las fundamentales de las tres fases se cancelan en el neutro, pero los <b>3.º armónicos (150 Hz) están en fase</b> y se <b>suman</b>. En edificios llenos de computadoras, ¡el neutro puede llevar más corriente que las fases!</li>
<li><b>Deforma la tensión:</b> esa corriente pulsante produce caídas en la impedancia de la red y la tensión deja de ser senoidal para todos los vecinos (se “aplana” arriba).</li>
<li><b>Interferencias:</b> los armónicos altos de fuentes conmutadas y motores con PWM se acoplan a equipos de audio, radio y sensores. Por eso existen normas (IEC 61000‑3‑2) y las fuentes buenas traen <b>PFC</b> (corrección del factor de potencia).</li>
<li><b>Audio:</b> si un amplificador <b>satura</b> (recorta la senoidal), aparecen armónicos que el oído percibe como “sonido sucio”. Los pedales de distorsión de guitarra hacen esto a propósito.</li>
</ul>
<div class="caja ojo"><span class="caja-titulo">No confundir</span>
Los armónicos <b>no se crean</b> en un circuito lineal (resistencias, capacitores, bobinas): un filtro RC puede achicar o agrandar armónicos que ya existen, pero nunca inventa frecuencias nuevas. Los armónicos nuevos aparecen cuando hay <b>componentes no lineales</b>: diodos, transistores saturando, núcleos magnéticos saturados, llaves que conmutan.
</div>

<!-- AMPLIACION-CARPETA -->
<h2>8. Filtros: elegir qué armónicos pasan</h2>
<p>Mirar una señal en el dominio de la frecuencia tiene una ventaja enorme: un <b>filtro</b> es simplemente un circuito que deja pasar algunas “rayas” del espectro y atenúa otras. Según qué parte deja pasar, hay cuatro tipos:</p>
${(() => {
  const barras = [1, 2, 3, 4, 5];
  const alt = [60, 0, 20, 0, 12];
  const tipos = [
    ['Pasa bajos', 'deja pasar lo de baja frecuencia', (k) => k <= 1.5, [[0, 1.6]]],
    ['Pasa altos', 'deja pasar lo de alta frecuencia', (k) => k >= 2.5, [[2.4, 6]]],
    ['Pasa banda', 'deja pasar solo una franja', (k) => k >= 2.5 && k <= 3.5, [[2.4, 3.6]]],
    ['Rechaza banda', 'elimina una franja (ej.: zumbido de 50 Hz)', (k) => !(k >= 2.5 && k <= 3.5), [[0, 2.4], [3.6, 6]]],
  ];
  const fig = ([nom, desc, pasa, zonas]) => {
    const X = (k) => 20 + k * 30, y0 = 95;
    const z = zonas.map(([a, b]) => `<rect x="${X(a)}" y="20" width="${X(Math.min(b, 5.6)) - X(a)}" height="${y0 - 20}" style="fill:var(--accent-soft)"/>`).join('');
    const bs = barras.map((k, i) => `<line x1="${X(k)}" y1="${y0}" x2="${X(k)}" y2="${y0 - Math.max(alt[i], 0)}" stroke-width="5" style="stroke:${pasa(k) ? 'var(--c1)' : 'var(--muted)'};opacity:${pasa(k) ? 1 : 0.35}"/>`).join('');
    return `<figure class="figura" style="margin:4px"><svg class="esq" viewBox="0 0 200 125" width="200" height="125">${z}${bs}<path d="M20 ${y0}H190M20 ${y0}V14" stroke="currentColor" stroke-width="1.5" fill="none"/><text x="186" y="${y0 + 14}" font-size="11" text-anchor="end">f</text><text x="${X(1)}" y="${y0 + 14}" font-size="10" text-anchor="middle">f₁</text><text x="${X(3)}" y="${y0 + 14}" font-size="10" text-anchor="middle">3f₁</text><text x="${X(5)}" y="${y0 + 14}" font-size="10" text-anchor="middle">5f₁</text></svg><figcaption><b>${nom}</b>: ${desc}</figcaption></figure>`;
  };
  return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:6px;text-align:center">${tipos.map(fig).join('')}</div>`;
})()}
<p>En los dibujos, las barras son los armónicos de una <b>onda cuadrada</b> (solo impares: $f_1$, $3f_1$, $5f_1$…) y la zona coloreada es la que el filtro deja pasar.</p>
<div class="caja ejemplo"><span class="caja-titulo">Ejemplo: una cuadrada de 1 kHz pasa por cada filtro</span>
<ul>
<li><b>Pasa bajos que corta en 2 kHz:</b> solo sobrevive la fundamental de 1 kHz → sale una <b>senoidal</b> de 1 kHz.</li>
<li><b>Pasa altos que corta en 2 kHz:</b> se pierde la fundamental; salen 3, 5, 7 kHz… La señal queda con “picos” en los flancos.</li>
<li><b>Pasa banda de 2,5 a 3,5 kHz:</b> sale una senoidal de <b>3 kHz</b> (el 3.º armónico), con un tercio de la amplitud de la fundamental. ¡Así se puede “sacar” un armónico de una señal!</li>
<li><b>Rechaza banda:</b> se usa para eliminar una frecuencia molesta, como el zumbido de 50 Hz de la red en un equipo de audio.</li>
</ul>
</div>
<div class="caja tip"><span class="caja-titulo">¿Dónde aparecen?</span>
El capacitor de una fuente (tema 12) es un <b>pasa bajos</b>: deja la continua (0 Hz) y frena el rizado de 100 Hz. Los controles de graves y agudos de un equipo de audio son pasa bajos y pasa altos. Una radio usa un <b>pasa banda</b> para quedarse con una sola emisora.
</div>

<h2>9. Longitud de onda: de la red eléctrica a la radio</h2>
<p>Cuando una señal viaja (por el aire como onda de radio, por un cable, o como sonido), cada ciclo ocupa un cierto <b>espacio</b>. Esa distancia es la <b>longitud de onda</b> $\lambda$ (letra griega “lambda”): lo que avanza la onda durante un período.</p>
<div class="caja formula"><span class="caja-titulo">Longitud de onda</span>
$$\lambda=\frac{v}{f}\qquad\Longleftrightarrow\qquad f\cdot\lambda=v$$
<p>$v$ = velocidad de propagación [m/s], $f$ = frecuencia [Hz], $\lambda$ en metros.</p>
<ul>
<li>Ondas electromagnéticas (radio, luz) en el aire o el vacío: $v=c=3\cdot10^8\,\text{m/s}$ (la velocidad de la luz).</li>
<li>Señal eléctrica en un cable coaxial: $v\approx0{,}66\,c\approx2\cdot10^8\,\text{m/s}$.</li>
<li>Sonido en el aire: $v\approx343\,\text{m/s}$ (¡casi un millón de veces más lento!).</li>
</ul>
</div>
<p><b>Cuanto mayor es la frecuencia, más corta es la onda</b>: si $f$ se duplica, $\lambda$ se reduce a la mitad.</p>
<div class="caja ejemplo"><span class="caja-titulo">Ejemplos (los de la carpeta)</span>
<b>Radio AM</b> (amplitud modulada) en 1015 kHz:
$$\lambda_{AM}=\frac{3\cdot10^8\,\text{m/s}}{1015\cdot10^3\,\text{Hz}}=295{,}6\,\text{m}$$
<b>Radio FM</b> (frecuencia modulada) en 101,5 MHz:
$$\lambda_{FM}=\frac{3\cdot10^8}{101{,}5\cdot10^6}=2{,}96\,\text{m}$$
<b>La red eléctrica</b> de 50 Hz: $\lambda=\frac{3\cdot10^8}{50}=6\,000\,\text{km}$. Por eso en un circuito común nunca pensamos en la longitud de onda: el circuito es muchísimo más chico que $\lambda$.
</div>
<div class="tabla-wrap"><table class="tabla">
<tr><th>Señal</th><th>Frecuencia</th><th>λ (en el aire)</th></tr>
<tr><td>Red eléctrica</td><td>50 Hz</td><td>6 000 km</td></tr>
<tr><td>Radio AM (onda media)</td><td>530 – 1710 kHz</td><td>570 – 175 m</td></tr>
<tr><td>Radio FM</td><td>88 – 108 MHz</td><td>3,4 – 2,8 m</td></tr>
<tr><td>Celular</td><td>700 MHz – 2,6 GHz</td><td>43 – 12 cm</td></tr>
<tr><td>WiFi</td><td>2,4 GHz / 5 GHz</td><td>12,5 cm / 6 cm</td></tr>
<tr><td>Luz roja</td><td>≈ 460 THz</td><td>≈ 650 nm</td></tr>
</table></div>
<div class="caja idea"><span class="caja-titulo">¿Para qué sirve saberlo? Las antenas</span>
Una antena funciona bien cuando su tamaño es comparable con la longitud de onda; la más común mide $\lambda/4$ (un cuarto de onda). Para FM: $2{,}96/4\approx0{,}74\,\text{m}$, el largo de la antena telescópica de una radio. Para AM: $296/4=74\,\text{m}$… ¡por eso las emisoras de AM usan torres enormes y las radios usan una antena de ferrite enrollada en vez de un cable estirado!
</div>

<h2>10. Cómo se conecta con el resto del curso</h2>
<ul>
<li><b>Tema 3 (área e integrales):</b> el valor medio es justamente $V_0$, el término constante de la serie. El valor eficaz total se calcula sumando en cuadratura: $V_{rms}=\sqrt{V_0^2+V_{1,rms}^2+V_{2,rms}^2+\dots}$.</li>
<li><b>Tema 4 (PWM):</b> una señal PWM es continua (lo que queremos) + armónicos en $f_{PWM}$, $2f_{PWM}$… que el filtro (o la inercia del motor) elimina.</li>
<li><b>Temas 11 y 12 (rectificadores y filtrado):</b> el ripple es la suma de armónicos de 100 Hz, 200 Hz…; el capacitor de filtro los atenúa.</li>
</ul>
`,

    simulaciones: [
      {
        titulo: 'Síntesis de Fourier: armá una señal sumando senoidales',
        descripcion: 'Elegí la forma de onda y cuántos armónicos sumar. Arriba ves la suma en el tiempo; abajo, el espectro (las “barras” de cada armónico).',
        montar(cont, H) {
          const { controles, vista } = H.layout(cont);
          const forma = H.select(controles, { label: 'Forma de onda', opciones: [{ v: 'cuad', t: 'Cuadrada' }, { v: 'tri', t: 'Triangular' }, { v: 'sierra', t: 'Diente de sierra' }], value: 'cuad', onChange: upd });
          const nS = H.slider(controles, { label: 'Armónicos sumados (N)', min: 1, max: 50, step: 1, value: 3, fmt: v => String(v), onInput: upd });
          const amp = H.slider(controles, { label: 'Amplitud A', min: 1, max: 10, step: 0.5, value: 5, unidad: 'V', onInput: upd });
          const fr = H.slider(controles, { label: 'Frecuencia fundamental f', min: 10, max: 10000, log: true, value: 1000, unidad: 'Hz', onInput: upd });
          H.sep(controles);
          const verInd = H.check(controles, { label: 'Mostrar armónicos individuales (hasta 6)', value: true, onChange: upd });
          const verIdeal = H.check(controles, { label: 'Mostrar la señal ideal (punteada)', value: true, onChange: upd });
          const leyenda = H.nota(controles, '');

          const PAL = ['c2', 'c3', 'c4', 'amber', 'red', 'green'];
          let lista = [];
          const suma = (x) => { let s = 0; for (const [n, b] of lista) s += b * Math.sin(2 * Math.PI * n * x); return s; };

          const cv = H.canvas(vista, {
            alto: (w) => Math.round(Math.max(220, Math.min(300, w * 0.45))),
            dibujar(ctx, w, h) {
              const A = amp.value, T = 1 / fr.value, ym = A * 1.5;
              const xt = w < 500 ? [0, 0.5, 1, 1.5, 2] : [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
              const P = H.ejes(ctx, w, h, { xmin: 0, xmax: 2, ymin: -ym, ymax: ym, xticks: xt, xfmt: x => H.fmt(x * T, 's'), yfmt: y => H.num(y, 1), xlabel: 't', ylabel: 'v (V)' });
              if (verIdeal.value) P.fn(x => A * ideal(forma.value, x), { color: H.col('muted'), ancho: 1.5, guiones: [5, 4], n: 1600 });
              if (verInd.value) lista.slice(0, 6).forEach(([n, b], i) => P.fn(x => A * b * Math.sin(2 * Math.PI * n * x), { color: H.col(PAL[i]), ancho: 1.2, n: 800 }));
              P.fn(x => A * suma(x), { color: H.col('c1'), ancho: 2.6, n: 1600 });
            },
          });
          const cvE = H.canvas(vista, {
            alto: 170,
            dibujar(ctx, w, h) {
              const A = amp.value;
              const nmax = lista.length ? lista[lista.length - 1][0] : 1;
              const nshow = Math.min(100, Math.max(15, nmax + 2));
              const P = H.ejes(ctx, w, h, { xmin: 0.3, xmax: nshow + 0.7, ymin: 0, ymax: A * 1.75, mb: 30, xticks: H.ticks(1, nshow, w < 500 ? 5 : 10).filter(t => t >= 1 && Number.isInteger(t)), xfmt: t => t + 'f', yfmt: y => H.num(y, 1), ylabel: 'Vn (V)  ·  frecuencia = n·f', grid: true });
              const bw = Math.max(1.5, Math.min(16, P.w / nshow * 0.6));
              const incl = new Set(lista.map(l => l[0]));
              for (let n = 1; n <= nshow; n++) {
                const v = Math.abs(coef(forma.value, n)) * A;
                if (v === 0) continue;
                const x = P.X(n) - bw / 2, y = P.Y(v), hh = P.Y(0) - y;
                if (incl.has(n)) {
                  const i = lista.findIndex(l => l[0] === n);
                  ctx.fillStyle = verInd.value && i < 6 ? H.col(PAL[i]) : H.col('c1');
                  ctx.fillRect(x, y, bw, hh);
                } else {
                  ctx.strokeStyle = H.col('muted'); ctx.lineWidth = 1; ctx.setLineDash([2, 2]);
                  ctx.strokeRect(x + .5, y + .5, bw - 1, hh - 1); ctx.setLineDash([]);
                }
              }
            },
          });
          const lec = H.lecturas(vista);
          const nota = H.nota(vista);

          function upd() {
            const f = forma.value, A = amp.value, F = fr.value;
            lista = armonicos(f, nS.value);
            cv.redibujar(); cvE.redibujar();
            // métricas numéricas sobre un período
            const M = 4000; let e2 = 0, i2 = 0, pico = 0;
            for (let k = 0; k < M; k++) {
              const x = (k + 0.5) / M, s = suma(x), id = ideal(f, x);
              e2 += (s - id) ** 2; i2 += id * id; pico = Math.max(pico, Math.abs(s));
            }
            const errRms = Math.sqrt(e2 / i2) * 100;
            const b1 = Math.abs(lista[0][1]);
            const thd = Math.sqrt(lista.slice(1).reduce((a, [, b]) => a + b * b, 0)) / b1 * 100;
            const nmax = lista[lista.length - 1][0];
            lec.set([
              { k: 'Armónico más alto', v: nmax + '.º → ' + H.fmt(nmax * F, 'Hz') },
              { k: 'Amplitud fundamental', v: H.fmt(b1 * A, 'V') },
              { k: 'Pico de la suma', v: H.fmt(pico * A, 'V'), estado: pico > 1.05 ? 'alerta' : '' },
              { k: 'Error vs. ideal (rms)', v: H.num(errRms, 1) + ' %', estado: errRms < 10 ? 'ok' : '' },
              { k: 'THD de la suma', v: H.num(thd, 1) + ' %' },
              { k: 'THD de la ' + NOMBRE[f] + ' ideal', v: H.num(THD_IDEAL[f], 1) + ' %' },
            ]);
            leyenda.innerHTML = '<b>Azul grueso:</b> suma. <b>Punteada:</b> señal ideal. ' + (verInd.value ? '<b>Colores finos:</b> cada armónico por separado (los mismos colores en el espectro).' : '') + ' En el espectro, las barras punteadas son los armónicos que todavía no sumaste.';
            let t;
            if (nS.value === 1) t = f === 'cuad'
              ? `<b>Un solo término = una senoidal pura.</b> Su amplitud es $\\frac{4A}{\\pi}\\approx${H.num(4 / Math.PI * A, 2)}$ V: <b>más grande que la cuadrada</b>. Subí N y mirá cómo los armónicos la “aplastan” arriba.`
              : `<b>Un solo término = una senoidal pura</b> de frecuencia f. Todavía no se parece a la ${NOMBRE[f]}: subí N.`;
            else if (f === 'cuad') t = nS.value >= 12
              ? `<b>Fenómeno de Gibbs:</b> mirá los “cuernitos” junto a cada salto. El pico de la suma es ${H.num(pico, 3)}·A (≈ 1,18·A) y <b>no baja</b> aunque sumes más armónicos: solo se angosta.`
              : `Sumaste los armónicos impares 1, 3, 5… hasta el ${nmax}.º. Cada uno tiene amplitud $\\frac{4A}{n\\pi}$: caen <b>lento</b> (como 1/n) porque la cuadrada tiene saltos bruscos.`;
            else if (f === 'tri') t = `La triangular converge <b>muy rápido</b>: sus armónicos caen como $1/n^2$ (el 3.º es 1/9 de la fundamental). Con N = 3 ya casi no se distingue de la ideal. Ojo con los signos: el 3.º y el 7.º van <b>restando</b> (fase 180°).`;
            else t = `El diente de sierra tiene <b>todos</b> los armónicos (pares e impares), porque no tiene simetría de media onda. Caen como 1/n: es la que más distorsión tiene (THD ≈ 80 %).`;
            nota.innerHTML = t;
            if (window.renderMathInElement) renderMathInElement(nota, { delimiters: [{ left: '$', right: '$', display: false }], throwOnError: false });
          }
          upd();
        },
      },
      {
        titulo: 'Constructor de señales: vos elegís los armónicos',
        descripcion: 'Ajustá la amplitud (y si querés la fase) de los armónicos 1 a 7 de una señal de 1 kHz. Mirá la forma resultante, su espectro y la distorsión armónica total.',
        montar(cont, H) {
          const { controles, vista } = H.layout(cont);
          H.titulo(controles, 'Amplitudes (valor pico)');
          const Am = [], Fa = [];
          for (let n = 1; n <= 7; n++) Am.push(H.slider(controles, { label: n === 1 ? 'A1 (fundamental, 1 kHz)' : `A${n} (${n} kHz)`, min: 0, max: 10, step: 0.01, value: n === 1 ? 10 : 0, unidad: 'V', onInput: upd }));
          H.sep(controles);
          const verF = H.check(controles, { label: 'Ajustar también las fases', value: false, onChange: () => { cajaF.style.display = verF.value ? 'flex' : 'none'; } });
          const cajaF = H.el('div', { style: 'display:none;flex-direction:column;gap:12px' });
          controles.append(cajaF);
          for (let n = 1; n <= 7; n++) Fa.push(H.slider(cajaF, { label: `Fase φ${n}`, min: -180, max: 180, step: 5, value: 0, fmt: v => v + '°', onInput: upd }));
          H.sep(controles);
          H.titulo(controles, 'Recetas para probar');
          const fila = H.el('div', { style: 'display:flex;flex-wrap:wrap;gap:6px' }); controles.append(fila);
          const receta = (a, f = []) => { a.forEach((v, i) => { Am[i].value = v; }); Fa.forEach((s, i) => { s.value = f[i] || 0; }); upd(); };
          H.boton(fila, 'Senoidal', () => receta([10, 0, 0, 0, 0, 0, 0]), 'btn chico');
          H.boton(fila, '≈ Cuadrada', () => receta([10, 0, 10 / 3, 0, 2, 0, 10 / 7]), 'btn chico');
          H.boton(fila, '≈ Triangular', () => receta([10, 0, 10 / 9, 0, 0.4, 0, 10 / 49], [0, 0, 180, 0, 0, 0, 180]), 'btn chico');
          H.boton(fila, '≈ Sierra', () => receta([10, 5, 10 / 3, 2.5, 2, 10 / 6, 10 / 7], [0, 180, 0, 180, 0, 180, 0]), 'btn chico');
          H.boton(fila, 'Recortada', () => receta([10, 0, 1.5, 0, 0.6, 0, 0.3], [0, 0, 180, 0, 0, 0, 180]), 'btn chico');

          const PAL = ['c1', 'c2', 'c3', 'c4', 'amber', 'red', 'green'];
          const v = (x) => { let s = 0; for (let i = 0; i < 7; i++) s += Am[i].value * Math.sin(2 * Math.PI * (i + 1) * x + Fa[i].value * Math.PI / 180); return s; };
          let pico = 0;
          const cv = H.canvas(vista, {
            alto: (w) => Math.round(Math.max(220, Math.min(290, w * 0.42))),
            fondo: 'scope-bg',
            dibujar(ctx, w, h) {
              const sum = Am.reduce((a, s) => a + s.value, 0);
              const ym = Math.max(5, Math.ceil(Math.max(pico, 1) * 1.15 / 5) * 5, 0);
              const P = H.ejes(ctx, w, h, { xmin: 0, xmax: 2, ymin: -ym, ymax: ym, oscuro: true, xticks: w < 500 ? [0, 0.5, 1, 1.5, 2] : [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2], xfmt: x => H.num(x, 2) + ' ms', yfmt: y => H.num(y, 1), xlabel: 't', ylabel: 'v (V)' });
              if (sum > 0) P.fn(v, { color: H.col('scope-c1'), ancho: 2.6, n: 1200 });
            },
          });
          const cvE = H.canvas(vista, {
            alto: 140,
            dibujar(ctx, w, h) {
              const P = H.ejes(ctx, w, h, { xmin: 0.4, xmax: 7.6, ymin: 0, ymax: 13, xticks: [1, 2, 3, 4, 5, 6, 7], yticks: [0, 5, 10], xfmt: t => t + ' kHz', yfmt: y => H.num(y, 0), ylabel: 'Vn (V)', mb: 26 });
              const bw = Math.min(30, P.w / 7 * 0.5);
              for (let i = 0; i < 7; i++) {
                const a = Am[i].value; if (a <= 0) continue;
                ctx.fillStyle = H.col(PAL[i]);
                ctx.fillRect(P.X(i + 1) - bw / 2, P.Y(a), bw, P.Y(0) - P.Y(a));
              }
            },
          });
          const lec = H.lecturas(vista);
          const nota = H.nota(vista);

          function upd() {
            pico = 0; for (let k = 0; k < 2000; k++) pico = Math.max(pico, Math.abs(v(k / 2000)));
            cv.redibujar(); cvE.redibujar();
            const a = Am.map(s => s.value);
            const arm2 = a.slice(1).reduce((s, x) => s + x * x, 0);
            const rms = Math.sqrt((a[0] * a[0] + arm2) / 2);
            const thd = a[0] > 0 ? Math.sqrt(arm2) / a[0] * 100 : NaN;
            lec.set([
              { k: 'THD', v: a[0] > 0 ? H.num(thd, 1) + ' %' : '— (sin fundamental)', estado: a[0] > 0 ? (thd < 5 ? 'ok' : thd > 40 ? 'mal' : 'alerta') : '' },
              { k: 'Valor eficaz total', v: H.fmt(rms, 'V') },
              { k: 'Eficaz de la fundamental', v: H.fmt(a[0] / Math.SQRT2, 'V') },
              { k: 'Eficaz de los armónicos', v: H.fmt(Math.sqrt(arm2 / 2), 'V') },
              { k: 'Pico de la señal', v: H.fmt(pico, 'V') },
              { k: 'Factor de cresta (pico/eficaz)', v: rms > 0 ? H.num(pico / rms, 2) : '—' },
            ]);
            let t = '';
            if (a[0] === 0) t = '<b>Sin fundamental</b> el THD no está definido (se divide por cero). Además, la frecuencia que vas a ver repetirse ya no es 1 kHz.';
            else if (arm2 === 0) t = '<b>Senoidal pura:</b> THD = 0 % y factor de cresta $\\sqrt2\\approx1{,}41$. Ahora subí un poco A3 y mirá cómo se deforma.';
            else if (thd < 5) t = `Con ${H.num(thd, 1)} % de THD la señal todavía “parece” senoidal a simple vista. En la red eléctrica, menos de 5 % se considera buena calidad. <b>El oído, en cambio, ya escucha algo de distorsión</b> por encima de ~1 %.`;
            else t = `THD = ${H.num(thd, 1)} %. Fijate que el THD solo depende de las <b>amplitudes</b>. Probá ahora tocar solo las <b>fases</b>: la forma cambia muchísimo (y el pico también), pero el THD y el valor eficaz <b>no cambian</b>.`;
            if (a[0] > 0 && Math.abs(a[2] - 10 / 3) < 0.02 && Math.abs(a[4] - 2) < 0.02 && a[1] === 0) t += ' Esta es la cuadrada hasta el 7.º armónico: THD ≈ 41 % (la cuadrada completa tiene 48,3 %; falta el aporte del 9.º, 11.º…).';
            nota.innerHTML = t;
            if (window.renderMathInElement) renderMathInElement(nota, { delimiters: [{ left: '$', right: '$', display: false }], throwOnError: false });
          }
          upd();
        },
      },
      {
        titulo: 'Longitud de onda: ¿cuánto mide una onda?',
        descripcion: 'Elegí una frecuencia (o un ejemplo) y el medio por donde viaja. El dibujo muestra dos ciclos con una regla en escala real, y te dice con qué objeto se puede comparar.',
        montar(cont, H) {
          const { controles, vista } = H.layout(cont);
          const MEDIOS = { aire: { v: 3e8, t: 'Aire / vacío (onda de radio o luz)' }, coax: { v: 0.66 * 3e8, t: 'Cable coaxial (0,66·c)' }, sonido: { v: 343, t: 'Sonido en el aire (343 m/s)' } };
          const EJ = [
            { t: 'Red eléctrica (50 Hz)', f: 50, m: 'aire' }, { t: 'Nota La del piano (440 Hz, sonido)', f: 440, m: 'sonido' },
            { t: 'Radio AM 1015 kHz', f: 1015e3, m: 'aire' }, { t: 'Radio FM 101,5 MHz', f: 101.5e6, m: 'aire' },
            { t: 'Celular 850 MHz', f: 850e6, m: 'aire' }, { t: 'WiFi 2,4 GHz', f: 2.4e9, m: 'aire' }, { t: 'Luz roja (460 THz)', f: 4.6e14, m: 'aire' },
          ];
          const ej = H.select(controles, { label: 'Ejemplos', value: '3', opciones: EJ.map((e, i) => ({ v: String(i), t: e.t })), onChange: (v) => { const e = EJ[+v]; frec = e.f; fs.value = e.f; med.value = e.m; upd(); } });
          let frec = 101.5e6;
          const fs = H.slider(controles, { label: 'Frecuencia f', min: 1, max: 1e15, log: true, value: frec, unidad: 'Hz', onInput: (v) => { frec = v; upd(); } });
          const med = H.select(controles, { label: 'Medio', value: 'aire', opciones: Object.entries(MEDIOS).map(([k, o]) => ({ v: k, t: o.t })), onChange: upd });
          H.nota(controles, String.raw`$\lambda = v/f$: con el mismo medio, si la frecuencia sube 10 veces, la onda es 10 veces más corta.`);
          const cv = H.canvas(vista, { alto: 210, dibujar });
          const lec = H.lecturas(vista);
          const comp = H.nota(vista, '');
          const REF = [[1.27e7, 'el diámetro de la Tierra'], [7e5, 'la distancia Córdoba – Buenos Aires'], [2e5, 'la distancia Río Cuarto – Córdoba'], [1e4, 'cien cuadras'], [1e3, 'diez cuadras'], [100, 'una cancha de fútbol'], [10, 'un aula'], [1.7, 'una persona'], [0.3, 'una regla escolar'], [0.12, 'un celular'], [0.02, 'una moneda'], [0.005, 'un grano de arroz'], [1e-3, 'un grano de arena'], [7e-5, 'el grosor de un pelo'], [5e-6, 'una bacteria'], [5e-7, 'un virus grande (casi nada)']];
          const UNI = [[1e3, 'km'], [1, 'm'], [1e-2, 'cm'], [1e-3, 'mm'], [1e-6, 'µm'], [1e-9, 'nm']];
          const largo = (m) => { for (const [f, u] of UNI) if (m >= f * 0.999) return H.num(m / f, m / f < 10 ? 2 : m / f < 100 ? 1 : 0) + ' ' + u; return H.num(m / 1e-9, 2) + ' nm'; };
          function banda(f, m) {
            if (m === 'sonido') return f < 20 ? 'Infrasonido (no se oye)' : f <= 20000 ? 'Sonido audible' : 'Ultrasonido (no se oye)';
            const B = [[3e3, 'Red eléctrica / audio (ELF–VLF)'], [5.3e5, 'Ondas largas (LF)'], [1.71e6, 'Radio AM (onda media)'], [3e7, 'Onda corta (HF)'], [8.8e7, 'VHF (TV, radioaficionados)'], [1.08e8, 'Radio FM'], [7e8, 'UHF (TV digital)'], [2.4e9, 'Telefonía celular'], [6e9, 'WiFi / Bluetooth / microondas'], [3e11, 'Microondas (radar, satélites)'], [4e14, 'Infrarrojo'], [7.5e14, 'Luz visible'], [Infinity, 'Ultravioleta']];
            for (const [lim, t] of B) if (f < lim) return t; return '';
          }
          function dibujar(ctx, w, h) {
            const v = MEDIOS[med.value].v, lam = v / frec;
            // escala de la regla: potencia de 10 "linda" para que 2 ciclos entren
            const total = 2 * lam;
            const x0 = 30, x1 = w - 30, yc = 85, A = 45;
            ctx.strokeStyle = H.col('c1'); ctx.lineWidth = 2.5; ctx.beginPath();
            for (let i = 0; i <= 400; i++) { const u = i / 400; const x = x0 + (x1 - x0) * u; const y = yc - A * Math.sin(2 * Math.PI * 2 * u); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
            ctx.stroke();
            // cota de lambda
            const xa = x0 + (x1 - x0) * 0.25, xb = x0 + (x1 - x0) * 0.75, yl = yc - A - 14;
            ctx.strokeStyle = H.col('c2'); ctx.fillStyle = H.col('c2'); ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(xa, yl); ctx.lineTo(xb, yl); ctx.stroke();
            [[xa, 1], [xb, -1]].forEach(([x, s]) => { ctx.beginPath(); ctx.moveTo(x, yl); ctx.lineTo(x + 8 * s, yl - 4); ctx.lineTo(x + 8 * s, yl + 4); ctx.fill(); });
            ctx.font = '700 13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('λ = ' + largo(lam), (xa + xb) / 2, yl - 8);
            // regla
            const yr = 170; ctx.strokeStyle = H.col('ink'); ctx.fillStyle = H.col('muted'); ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(x0, yr); ctx.lineTo(x1, yr); ctx.stroke();
            const paso = Math.pow(10, Math.floor(Math.log10(total / 2)));
            const n = Math.floor(total / paso);
            ctx.font = '11px sans-serif';
            for (let k = 0; k <= n; k++) {
              const x = x0 + (x1 - x0) * (k * paso / total);
              ctx.beginPath(); ctx.moveTo(x, yr - 6); ctx.lineTo(x, yr + 6); ctx.stroke();
              if (n <= 12 || k % 2 === 0) ctx.fillText(largo(k * paso).replace(/^0 \S+$/, '0'), x, yr + 18);
            }
          }
          function upd() {
            const v = MEDIOS[med.value].v, lam = v / frec;
            lec.set([
              { k: 'Frecuencia', v: H.fmt(frec, 'Hz') },
              { k: 'Período T = 1/f', v: H.fmt(1 / frec, 's') },
              { k: 'Velocidad v', v: v >= 1e8 ? H.num(v / 1e8, 2) + '·10⁸ m/s' : H.num(v, 0) + ' m/s' },
              { k: 'Longitud de onda λ', v: largo(lam), estado: 'ok' },
              { k: 'Antena λ/4', v: med.value === 'sonido' ? '—' : largo(lam / 4) },
            ]);
            let mejor = REF[0], dmin = Infinity;
            for (const r of REF) { const d = Math.abs(Math.log10(r[0] / lam)); if (d < dmin) { dmin = d; mejor = r; } }
            comp.innerHTML = `<b>${banda(frec, med.value)}.</b> Cada ciclo de la onda mide aproximadamente lo mismo que <b>${mejor[1]}</b>.`;
            cv.redibujar();
          }
          upd();
        },
      },
    ],

    ejercicios: [
      {
        nivel: 'Básico',
        enunciado: String.raw`La tensión de la red tiene $f=50\,\text{Hz}$. Calculá el período y la pulsación $\omega$. ¿A qué frecuencias están el 3.º, el 5.º y el 7.º armónico?`,
        pista: String.raw`$T=1/f$, $\omega=2\pi f$. El armónico $n$ está en $n\cdot f$.`,
        solucion: String.raw`$T=\frac{1}{50}=0{,}02\,\text{s}=20\,\text{ms}$; $\omega=2\pi\cdot50=314{,}2\,\text{rad/s}$.<br>3.º armónico: $3\cdot50=150\,\text{Hz}$; 5.º: $250\,\text{Hz}$; 7.º: $350\,\text{Hz}$. Son los armónicos típicos que inyectan en la red las fuentes de computadoras y las lámparas LED.`,
      },
      {
        nivel: 'Básico',
        enunciado: String.raw`Un generador entrega una onda cuadrada de $\pm5\,\text{V}$ y $1\,\text{kHz}$. Calculá la amplitud de la fundamental, del 3.º y del 5.º armónico, e indicá sus frecuencias. ¿Tiene 2.º armónico?`,
        pista: String.raw`Usá $V_n=\frac{4A}{n\pi}$ para $n$ impar. Pensá en la simetría de media onda.`,
        solucion: String.raw`$V_1=\frac{4\cdot5}{\pi}=6{,}37\,\text{V}$ a 1 kHz; $V_3=\frac{6{,}37}{3}=2{,}12\,\text{V}$ a 3 kHz; $V_5=\frac{6{,}37}{5}=1{,}27\,\text{V}$ a 5 kHz.<br>No tiene 2.º armónico (ni ningún par): la cuadrada simétrica cumple $v(t+T/2)=-v(t)$, así que solo tiene impares. Comprobalo en la simulación 1 con A = 5 V.`,
      },
      {
        nivel: 'Intermedio',
        enunciado: String.raw`Con un analizador de calidad de energía se mide la tensión de un tablero y se obtienen estos valores eficaces: fundamental $220\,\text{V}$, 3.º armónico $11\,\text{V}$, 5.º armónico $8{,}8\,\text{V}$ y 7.º armónico $4{,}4\,\text{V}$. Calculá el THD. ¿Cumple el límite usual de 5 %?`,
        pista: String.raw`$\text{THD}=\sqrt{V_3^2+V_5^2+V_7^2}\,/\,V_1$.`,
        solucion: String.raw`$\sqrt{11^2+8{,}8^2+4{,}4^2}=\sqrt{121+77{,}44+19{,}36}=\sqrt{217{,}8}=14{,}76\,\text{V}$.<br>$\text{THD}=\frac{14{,}76}{220}=0{,}0671\Rightarrow 6{,}7\,\%$. <b>No cumple</b> el 5 %: hay demasiadas cargas no lineales (fuentes, variadores) en esa instalación. Ojo: no se suman 11 + 8,8 + 4,4 = 24,2 V directamente; se suman los cuadrados.`,
      },
      {
        nivel: 'Intermedio',
        enunciado: String.raw`Una onda triangular de $4\,\text{V}$ pico y $500\,\text{Hz}$ entra a un amplificador. Calculá las amplitudes de los armónicos 1, 3 y 5. Compará con lo que darían para una cuadrada de igual amplitud. ¿Cuál de las dos es más fácil de convertir en senoidal con un filtro?`,
        pista: String.raw`Triangular: $V_n=\frac{8A}{\pi^2 n^2}$. Cuadrada: $V_n=\frac{4A}{\pi n}$.`,
        solucion: String.raw`Triangular: $V_1=\frac{8\cdot4}{\pi^2}=3{,}24\,\text{V}$ (500 Hz); $V_3=\frac{3{,}24}{9}=0{,}36\,\text{V}$ (1,5 kHz); $V_5=\frac{3{,}24}{25}=0{,}13\,\text{V}$ (2,5 kHz).<br>Cuadrada: $V_1=5{,}09\,\text{V}$; $V_3=1{,}70\,\text{V}$; $V_5=1{,}02\,\text{V}$.<br>En la triangular el 3.º armónico es solo el 11 % de la fundamental (en la cuadrada, el 33 %). La <b>triangular</b> es mucho más fácil de “redondear”: con un filtro sencillo ya queda casi senoidal. Por eso muchos generadores de funciones obtienen la senoidal a partir de la triangular.`,
      },
      {
        nivel: 'Intermedio',
        enunciado: String.raw`Una cuadrada de $\pm5\,\text{V}$ y $1\,\text{kHz}$ pasa por un filtro pasa bajos ideal que deja pasar todo hasta $4\,\text{kHz}$ y elimina lo demás. ¿Qué componentes salen? Calculá la tensión de salida en $t=T/4$ (el centro del semiciclo positivo) y en $t=T/8$.`,
        pista: String.raw`Solo pasan 1 kHz y 3 kHz. Evaluá $v(t)=\frac{4A}{\pi}\left[\text{sen}(\omega t)+\frac13\text{sen}(3\omega t)\right]$ con $\omega t=\pi/2$ y $\omega t=\pi/4$.`,
        solucion: String.raw`Pasan la fundamental (1 kHz) y el 3.º (3 kHz); el 5.º (5 kHz) y siguientes se eliminan.<br>En $t=T/4$: $\omega t=\frac{\pi}{2}$ → $v=\frac{20}{\pi}\left[1+\frac13\,\text{sen}\frac{3\pi}{2}\right]=6{,}366\cdot\left(1-\frac13\right)=4{,}24\,\text{V}$.<br>En $t=T/8$: $\omega t=\frac{\pi}{4}$ → $v=6{,}366\cdot\left[0{,}7071+\frac13\cdot0{,}7071\right]=6{,}366\cdot0{,}9428=6{,}00\,\text{V}$.<br>La salida tiene dos “jorobas” por semiciclo, con picos de 6 V (más que los 5 V de entrada) y un valle de 4,24 V en el medio. Es exactamente lo que muestra la simulación 1 con N = 2.`,
      },
      {
        nivel: 'Avanzado',
        enunciado: String.raw`Demostrá que el THD de una onda cuadrada ideal es ≈ 48,3 % sin sumar infinitos términos. Dato: el valor eficaz de una cuadrada de $\pm A$ es $A$, y el valor eficaz total cumple $V_{rms}^2=V_{1,rms}^2+V_{arm,rms}^2$.`,
        pista: String.raw`El eficaz de la fundamental es $\frac{4A}{\pi\sqrt2}$. Despejá el eficaz de “todos los armónicos juntos” y dividí.`,
        solucion: String.raw`$V_{1,rms}=\frac{4A}{\pi\sqrt2}=0{,}9003\,A$.<br>$V_{arm,rms}=\sqrt{V_{rms}^2-V_{1,rms}^2}=\sqrt{A^2-0{,}8106\,A^2}=\sqrt{0{,}1894}\,A=0{,}4352\,A$.<br>$\text{THD}=\frac{0{,}4352}{0{,}9003}=0{,}4834\Rightarrow 48{,}3\,\%$.<br>Interpretación: el 90 % del valor eficaz de una cuadrada está en la fundamental; los infinitos armónicos juntos aportan “solo” el resto. (Este truco es el teorema de Parseval.)`,
      },
      {
        nivel: 'Avanzado',
        enunciado: String.raw`Un edificio de oficinas tiene una instalación trifásica con las tres fases igualmente cargadas con computadoras. En cada fase circulan $10\,\text{A}$ eficaces de fundamental y $6\,\text{A}$ eficaces de 3.º armónico. ¿Cuánta corriente lleva cada fase en total? ¿Y el neutro? ¿Qué problema hay si el neutro se dimensionó igual que las fases?`,
        pista: String.raw`Las fundamentales de las tres fases están desfasadas 120° y se cancelan en el neutro. Los 3.º armónicos (desfasados $3\cdot120°=360°$) quedan en fase y se suman.`,
        solucion: String.raw`Cada fase: $I=\sqrt{10^2+6^2}=\sqrt{136}=11{,}7\,\text{A}$.<br>Neutro: las fundamentales suman cero; los 3.º armónicos se suman directamente: $I_N=3\cdot6=18\,\text{A}$ (a 150 Hz).<br>¡El neutro lleva <b>más</b> corriente que cualquier fase (18 A contra 11,7 A)! Si es del mismo calibre, se recalienta, y como el neutro no lleva protección, puede llegar a quemarse. Por eso en instalaciones con muchas cargas electrónicas se sobredimensiona el neutro.`,
      },
      {
        nivel: 'Básico',
        enunciado: String.raw`Una emisora de AM transmite en 1015 kHz y una de FM en 101,5 MHz. Calculá la longitud de onda de cada una. ¿Cuántas veces más larga es la onda de AM?`,
        pista: String.raw`$\lambda=c/f$ con $c=3\cdot10^8\,\text{m/s}$. Pasá todo a Hz antes de dividir.`,
        solucion: String.raw`$\lambda_{AM}=\frac{3\cdot10^8}{1{,}015\cdot10^6}=295{,}6\,\text{m}$; $\lambda_{FM}=\frac{3\cdot10^8}{101{,}5\cdot10^6}=2{,}96\,\text{m}$. La de AM es 100 veces más larga, porque su frecuencia es 100 veces menor.`,
      },
      {
        nivel: 'Básico',
        enunciado: String.raw`¿Cuál es la longitud de onda de la tensión de la red (50 Hz)? ¿Y la de un sonido de 50 Hz (un bajo muy grave)?`,
        pista: String.raw`Misma frecuencia, distinta velocidad: $c=3\cdot10^8\,\text{m/s}$ para la onda eléctrica y $343\,\text{m/s}$ para el sonido.`,
        solucion: String.raw`Red: $\lambda=\frac{3\cdot10^8}{50}=6\cdot10^6\,\text{m}=6\,000\,\text{km}$. Sonido: $\lambda=\frac{343}{50}=6{,}86\,\text{m}$. Misma frecuencia, ondas de tamaños completamente distintos: manda la velocidad del medio.`,
      },
      {
        nivel: 'Intermedio',
        enunciado: String.raw`Calculá el largo de una antena de cuarto de onda ($\lambda/4$) para: a) una radio FM de 100 MHz; b) un router WiFi de 2,4 GHz; c) una radio AM de 1 MHz. ¿Cuál es práctica de construir?`,
        pista: String.raw`Primero $\lambda=c/f$ y después dividí por 4.`,
        solucion: String.raw`a) $\lambda=3\,\text{m}$ → $\lambda/4=75\,\text{cm}$ (la antena telescópica). b) $\lambda=12{,}5\,\text{cm}$ → $3{,}1\,\text{cm}$ (las antenitas del router o una pista del circuito impreso). c) $\lambda=300\,\text{m}$ → $75\,\text{m}$: imposible en una radio portátil; por eso usan una antena de ferrite y las emisoras, torres altísimas.`,
      },
      {
        nivel: 'Intermedio',
        enunciado: String.raw`Por un cable coaxial (velocidad $0{,}66\,c$) viaja una señal de 100 MHz. ¿Cuál es la longitud de onda dentro del cable? ¿Y en el aire?`,
        pista: String.raw`$v=0{,}66\cdot3\cdot10^8=1{,}98\cdot10^8\,\text{m/s}$.`,
        solucion: String.raw`En el cable: $\lambda=\frac{1{,}98\cdot10^8}{10^8}=1{,}98\,\text{m}$. En el aire: $3\,\text{m}$. La frecuencia no cambia al pasar de un medio a otro; lo que cambia es la velocidad y, con ella, la longitud de onda.`,
      },
      {
        nivel: 'Intermedio',
        enunciado: String.raw`Una onda cuadrada de 1 kHz y amplitud $A=10\,\text{V}$ pasa por: a) un pasa bajos ideal que corta en 2 kHz; b) un pasa banda ideal de 2,5 a 3,5 kHz. ¿Qué señal sale en cada caso (forma, frecuencia y amplitud)?`,
        pista: String.raw`Cuadrada: solo armónicos impares, $V_n=\frac{4A}{n\pi}$.`,
        solucion: String.raw`a) Solo pasa la fundamental: senoidal de 1 kHz con $V_1=\frac{4\cdot10}{\pi}=12{,}7\,\text{V}$ de pico. b) Solo pasa el 3.º armónico: senoidal de 3 kHz con $V_3=\frac{4\cdot10}{3\pi}=4{,}24\,\text{V}$ de pico.`,
      },
      {
        nivel: 'Avanzado',
        enunciado: String.raw`Una señal tiene una componente continua de 2 V, una fundamental de 3 V eficaces y un 3.º armónico de 1 V eficaz. ¿Cuánto vale su valor eficaz total? ¿Qué marcaría un multímetro true RMS en V⎓ y en V~?`,
        pista: String.raw`Los eficaces se suman en cuadratura: $V^2=V_{CC}^2+V_1^2+V_3^2$.`,
        solucion: String.raw`$V=\sqrt{2^2+3^2+1^2}=\sqrt{14}=3{,}74\,\text{V}$. En V⎓ marca la continua: 2 V. En V~ (true RMS, que bloquea la continua): $\sqrt{3^2+1^2}=3{,}16\,\text{V}$.`,
      },
    ],

    quiz: [
      { pregunta: 'Una señal periódica de 200 Hz puede tener armónicos en…', opciones: ['300 Hz y 500 Hz', '400 Hz, 600 Hz, 800 Hz…', '100 Hz y 50 Hz', 'Cualquier frecuencia mayor a 200 Hz'], correcta: 1, explicacion: 'Los armónicos son múltiplos enteros de la fundamental: 2·200, 3·200, 4·200…' },
      { pregunta: 'Una onda cuadrada simétrica tiene…', opciones: ['Solo armónicos pares', 'Solo armónicos impares', 'Todos los armónicos', 'Ningún armónico'], correcta: 1, explicacion: 'Tiene simetría de media onda (la segunda mitad es la primera invertida): solo aparecen 1, 3, 5, 7…' },
      { pregunta: '¿Por qué la triangular se parece más a una senoidal que la cuadrada?', opciones: ['Porque tiene menos amplitud', 'Porque sus armónicos caen como 1/n², mucho más rápido', 'Porque no tiene fundamental', 'Porque tiene armónicos pares'], correcta: 1, explicacion: 'La triangular no tiene saltos: sus armónicos son mucho más chicos (el 3.º es 1/9 de la fundamental, en la cuadrada es 1/3).' },
      { pregunta: String.raw`Una señal tiene $V_1=20\,\text{V}$ y un único armónico $V_3=2\,\text{V}$. Su THD es…`, opciones: ['2 %', '10 %', '20 %', '90 %'], correcta: 1, explicacion: 'THD = 2/20 = 0,1 → 10 %.' },
      { pregunta: 'Al sumar cada vez más armónicos de una cuadrada, el sobrepico junto a los saltos (fenómeno de Gibbs)…', opciones: ['Desaparece', 'Se hace más angosto, pero mantiene su altura (≈ 9 % del salto)', 'Crece sin límite', 'Se mueve al centro del semiciclo'], correcta: 1, explicacion: 'Es una propiedad de las series de Fourier en una discontinuidad: el cuernito no baja de altura, solo se angosta.' },
      { pregunta: '¿Cuál de estas cargas genera más armónicos de corriente en la red?', opciones: ['Una estufa de cuarzo (resistiva)', 'Una lámpara incandescente', 'Una fuente de PC con rectificador y capacitor', 'Un capacitor solo'], correcta: 2, explicacion: 'El rectificador con capacitor solo consume corriente en pulsos angostos cerca del pico: una carga no lineal, llena de armónicos impares.' },
      { pregunta: 'Si la frecuencia de una onda de radio se duplica, su longitud de onda…', opciones: ['Se duplica', 'Se reduce a la mitad', 'No cambia', 'Se cuadruplica'], correcta: 1, explicacion: 'λ = c/f: son inversamente proporcionales.' },
      { pregunta: '¿Cuál es aproximadamente la longitud de onda de una emisora de FM (100 MHz)?', opciones: ['3 mm', '3 cm', '3 m', '300 m'], correcta: 2, explicacion: 'λ = 3·10⁸ / 10⁸ = 3 m. Las de AM (≈ 1 MHz) miden unos 300 m.' },
      { pregunta: 'El capacitor de filtro de una fuente se comporta como un filtro…', opciones: ['Pasa altos', 'Pasa bajos', 'Pasa banda', 'Rechaza banda'], correcta: 1, explicacion: 'Deja pasar la continua (0 Hz) y atenúa el rizado de 100 Hz y sus armónicos.' },
      { pregunta: 'Una onda cuadrada de 1 kHz pasa por un pasa bajos ideal que corta en 1,5 kHz. A la salida hay…', opciones: ['Una cuadrada de 1 kHz', 'Una senoidal de 1 kHz', 'Una senoidal de 3 kHz', 'Nada'], correcta: 1, explicacion: 'Solo la fundamental está por debajo de 1,5 kHz: sale una senoidal pura de 1 kHz.' },
      { pregunta: '¿Por qué en los circuitos de una fuente de 50 Hz no hace falta pensar en la longitud de onda?', opciones: ['Porque no hay ondas', 'Porque λ = 6000 km es enorme comparada con el circuito', 'Porque la luz es más rápida', 'Porque el cable es de cobre'], correcta: 1, explicacion: 'Si el circuito mide centímetros y la onda miles de km, la tensión es prácticamente la misma en todo el cable en cada instante.' },
    ],

    docente: String.raw`
<h3>Objetivo de la clase</h3>
<p>Que el alumno entienda que <b>cualquier señal periódica es una suma de senoidales de frecuencias múltiplo de la fundamental</b>, que sepa leer un espectro, reconocer qué armónicos tiene cada forma de onda y calcular el THD. Es la base conceptual para filtros, rectificadores y PWM. <b>Duración sugerida:</b> 1 clase (70–80 min).</p>

<h3>Secuencia sugerida</h3>
<ol>
<li><b>Disparador (5 min):</b> preguntale “¿por qué una guitarra y un piano suenan distinto tocando la misma nota?”. Si podés, abrí en el celular una app de afinador o un analizador de espectro gratuito (por ejemplo <em>Spectroid</em> en Android) y silbá (casi senoidal: una raya) y después decí “aaaa” (muchas rayas). Impacta mucho.</li>
<li><b>Período y frecuencia (5 min):</b> ejercicio 1 de cabeza. Remarcá $\omega=2\pi f$.</li>
<li><b>Síntesis de Fourier (20 min):</b> simulación 1 con la cuadrada.
  <ul>
  <li>N = 1: <em>“¿Esto se parece a la cuadrada? ¿Cuánto vale el pico?”</em> → que lea 6,37 V con A = 5 V. Preguntá cómo puede ser mayor que 5 V.</li>
  <li>Subí N de a uno hasta 5 sin decir nada y preguntá qué ve. Que note que <b>solo aparecen barras impares</b>.</li>
  <li>N = 50: mostrá los cuernitos de Gibbs y la lectura “Pico de la suma ≈ 5,9 V”.</li>
  <li>Cambiá a triangular: con N = 2 o 3 ya está. <em>“¿Por qué converge tan rápido?”</em> → no tiene saltos.</li>
  <li>Diente de sierra: aparecen los pares. Discutí la simetría.</li>
  </ul></li>
<li><b>Series (10 min):</b> escribí en la pizarra la serie de la cuadrada y hacé el ejemplo de ±10 V. Usá la tabla de $V_n/A$ de la teoría.</li>
<li><b>Constructor y THD (15 min):</b> simulación 2. Pedile que “arme una cuadrada” sin usar la receta (pista: impares con amplitud 10/n). Después tocá solo las fases y mostrá que el THD y el eficaz no cambian. Hacé el ejemplo de THD de la teoría y el ejercicio 3.</li>
<li><b>Por qué importa (10 min):</b> rectificador con capacitor y pulsos de corriente; neutro sobrecargado (ejercicio 7 como desafío).</li>
<li><b>Cierre (5 min):</b> autoevaluación. Tarea: ejercicios 2, 4, 5 y 6.</li>
</ol>

<h3>Errores frecuentes del alumno</h3>
<ul>
<li>Sumar las amplitudes de los armónicos directamente para el THD (hay que sumar cuadrados y sacar raíz).</li>
<li>Creer que los armónicos pueden estar en cualquier frecuencia (ej. 75 Hz para una de 50 Hz).</li>
<li>Pensar que la fundamental de una cuadrada tiene la misma amplitud que la cuadrada (es 4/π ≈ 1,27 veces mayor).</li>
<li>Confundir “armónico n” con “término n” de la serie: en la cuadrada, el segundo término es el <b>3.º</b> armónico.</li>
<li>Creer que un filtro RC “crea” armónicos. Solo los atenúan; los crean los elementos no lineales.</li>
</ul>

<h3>Preguntas disparadoras</h3>
<ul>
<li>Si un parlante solo puede reproducir hasta 5 kHz, ¿cómo suena una cuadrada de 2 kHz? (solo pasan la fundamental: suena como una senoidal).</li>
<li>¿Por qué los cables de señales digitales rápidas generan interferencia en la radio?</li>
<li>¿Por qué una fuente de PC “ensucia” la red y una estufa no?</li>
</ul>

<h3>Recordatorio rápido para vos</h3>
<ul>
<li>Coeficientes con amplitud A: cuadrada $\frac{4A}{n\pi}$ (impares); triangular $\frac{8A}{n^2\pi^2}$ (impares, signo alternado); sierra $\frac{2A}{n\pi}$ (todos, signo alternado).</li>
<li>Serie general: $a_0=\frac1T\int_T v\,dt$, $a_n=\frac2T\int_T v\cos(n\omega t)\,dt$, $b_n=\frac2T\int_T v\,\text{sen}(n\omega t)\,dt$. Función impar → solo senos; par → solo cosenos.</li>
<li>THD ideales: cuadrada 48,3 %; triangular 12,1 %; sierra 80,3 %. Gibbs: sobrepico ≈ 8,95 % del salto.</li>
<li>Parseval: $V_{rms}^2=V_0^2+\sum V_{n,rms}^2$.</li>
<li>Hay dos definiciones de THD: respecto de la fundamental (THD<sub>F</sub>, la que usamos) y respecto del eficaz total (THD<sub>R</sub>). Para distorsiones chicas dan casi igual.</li>
<li>Armónicos de secuencia cero (3, 9, 15…) son los que se suman en el neutro.</li>
</ul>

<h3>Experiencia práctica</h3>
<ul>
<li><b>Falstad</b> (falstad.com/fourier): applet de series de Fourier, permite escuchar cada señal y ver el espectro. Muy recomendable para que el alumno juegue en casa.</li>
<li><b>Falstad circuit</b> (falstad.com/circuit): generador de cuadrada de 1 kHz → filtro RC pasa bajos de 1,6 kHz (R = 1 kΩ, C = 100 nF) → osciloscopio. Se ve cómo se “redondea” la cuadrada. Con dos RC en cascada queda casi senoidal.</li>
<li>Si tiene osciloscopio digital con FFT (o una app de osciloscopio por la entrada de audio de la PC), mirar el espectro de una cuadrada generada por un Arduino con <code>tone(8, 500)</code>: rayas en 500, 1500, 2500 Hz…</li>
</ul>

<h3>Ampliación: filtros y longitud de onda (secciones 8 y 9 de la teoría)</h3>
<p><b>Por qué está:</b> en la carpeta, en la clase de armónicos, aparecen los cuatro tipos de filtro sobre el espectro y el cálculo de $\lambda$ para AM (1015 kHz) y FM. <b>Duración sugerida:</b> 30 min.</p>
<ol>
<li><b>Filtros (10 min):</b> volvé a la simulación de síntesis de Fourier con la cuadrada y preguntá: “si borro todas las barras menos la primera, ¿qué queda?”. Después mostrá los cuatro dibujos de la teoría. Conectalo con el capacitor de la fuente (pasa bajos) y con los controles de graves/agudos.</li>
<li><b>Longitud de onda (10 min):</b> preguntá “¿cuánto mide una onda de radio?” antes de dar la fórmula. Hacé AM y FM en el pizarrón.</li>
<li><b>Simulación (10 min):</b> recorré los ejemplos de la lista; que comparen la red de 50 Hz (6000 km) con el sonido de 440 Hz (78 cm). Cerrá con la antena de λ/4.</li>
</ol>
<p><b>Errores frecuentes:</b> no pasar kHz o MHz a Hz; confundir período (tiempo) con longitud de onda (distancia); creer que al cambiar de medio cambia la frecuencia.</p>
<p><b>Repaso para vos:</b> $c=3\cdot10^8\,\text{m/s}$; atajo: $\lambda[\text{m}]=\frac{300}{f[\text{MHz}]}$. AM: 530–1710 kHz; FM: 88–108 MHz. Antena de cuarto de onda: $\lambda/4$; dipolo: $\lambda/2$. Sonido en aire: 343 m/s a 20 °C.</p>
`,
  });
})();
