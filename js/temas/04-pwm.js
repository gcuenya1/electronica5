/* Tema 04 — PWM (modulación por ancho de pulso)
   IMPORTANTE: los textos con LaTeX usan String.raw`...` para que "\frac" no se rompa. */
(() => {
  const S = 'stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round" stroke-linecap="round"';

  /* ---------- figura: señal PWM con T, Ton y Vmed ---------- */
  function figPWM() {
    const x0 = 40, P = 150, D = 0.3, yH = 40, yL = 120;
    let pts = [[x0, yL]];
    for (let k = 0; k < 3; k++) { const a = x0 + k * P; pts.push([a, yL], [a, yH], [a + D * P, yH], [a + D * P, yL], [a + P, yL]); }
    const ymed = yL - D * (yL - yH);
    const fl = (x1, x2, y, t, col) => `<g style="color:${col}"><path ${S} d="M${x1 + 2} ${y}H${x2 - 2}"/><path d="M${x1} ${y}l7 -4v8zM${x2} ${y}l-7 -4v8z" fill="currentColor"/></g><text x="${(x1 + x2) / 2}" y="${y - 6}" text-anchor="middle" font-size="12" font-weight="700" style="fill:${col}">${t}</text>`;
    return `<svg class="esq" viewBox="0 0 520 170" width="520" height="170" xmlns="http://www.w3.org/2000/svg">
      <path d="M${x0} ${yL}H${x0 + 3 * P + 20}M${x0} ${yH - 20}V${yL + 5}" stroke="currentColor" opacity=".5" fill="none"/>
      <text x="${x0 - 6}" y="${yH + 4}" text-anchor="end" font-size="12" font-weight="700">Vcc</text><text x="${x0 - 6}" y="${yL + 4}" text-anchor="end" font-size="12" font-weight="700">0</text>
      <polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="var(--c1)" stroke-width="2.6"/>
      <path d="M${x0} ${ymed}H${x0 + 3 * P}" stroke="var(--c2)" stroke-width="2" stroke-dasharray="6 4"/>
      <text x="${x0 + 3 * P + 4}" y="${ymed + 4}" font-size="12" font-weight="700" style="fill:var(--c2)">Vmed</text>
      ${fl(x0 + P, x0 + P + D * P, yH - 8, 'Ton', 'var(--c3)')}
      ${fl(x0 + P + D * P, x0 + 2 * P, yH - 8, 'Toff', 'var(--muted)')}
      ${fl(x0 + 2 * P, x0 + 3 * P, yL + 26, 'T (período)', 'var(--c4)')}
    </svg>`;
  }
  /* ---------- figura: pulsos de servo ---------- */
  function figServo() {
    const fila = (y, ms, t) => {
      const sx = 22;                          // px por ms
      const x0 = 70, w = ms * sx;
      return `<text x="10" y="${y - 8}" font-size="12" font-weight="700">${t}</text>
        <polyline points="${x0},${y} ${x0},${y - 22} ${x0 + w},${y - 22} ${x0 + w},${y} ${x0 + 20 * sx * 0.55},${y}" fill="none" stroke="var(--c1)" stroke-width="2.2"/>
        <text x="${x0 + w / 2}" y="${y - 27}" text-anchor="middle" font-size="11" font-weight="700" style="fill:var(--c2)">${String(ms).replace('.', ',')} ms</text>
        <text x="${x0 + 20 * sx * 0.55 + 6}" y="${y - 4}" font-size="11" style="fill:var(--muted)">… resto de los 20 ms en 0</text>`;
    };
    return `<svg class="esq" viewBox="0 0 520 165" width="520" height="165" xmlns="http://www.w3.org/2000/svg">
      ${fila(50, 1, '0°')}${fila(100, 1.5, '90°')}${fila(150, 2, '180°')}</svg>`;
  }
  /* ---------- operacional/comparador en SVG ---------- */
  const opamp = (x, y) => `<path ${S} d="M${x} ${y - 40}L${x} ${y + 40}L${x + 70} ${y}Z"/>
    <text x="${x + 10}" y="${y - 15}" font-size="16" font-weight="700">+</text><text x="${x + 10}" y="${y + 26}" font-size="18" font-weight="700">−</text>`;
  const triIcon = (x, y) => `<polyline points="${x},${y} ${x + 10},${y - 14} ${x + 20},${y} ${x + 30},${y - 14} ${x + 40},${y} ${x + 50},${y - 14} ${x + 60},${y}" fill="none" stroke="var(--c2)" stroke-width="1.8"/>`;
  const pwmIcon = (x, y) => `<polyline points="${x},${y} ${x},${y - 14} ${x + 9},${y - 14} ${x + 9},${y} ${x + 22},${y} ${x + 22},${y - 14} ${x + 31},${y - 14} ${x + 31},${y} ${x + 44},${y} ${x + 44},${y - 14} ${x + 53},${y - 14} ${x + 53},${y}" fill="none" stroke="var(--c1)" stroke-width="1.8"/>`;

  const figComparador = Esq.svg(520, 210, [
    Esq.borne(40, 70, 'Vref', 0, -12), Esq.cable([[40, 70], [180, 70]]),
    Esq.borne(40, 110, 'Portadora', 10, 32), triIcon(70, 132), Esq.cable([[40, 110], [180, 110]]),
    opamp(180, 90), Esq.texto(215, 145, 'Comparador', { size: 12, peso: 400 }),
    Esq.cable([[250, 90], [290, 90]]), Esq.nodo(290, 90), pwmIcon(268, 62),
    Esq.R(290, 90, 380, 90, 'R', '', 1), Esq.cable([[380, 90], [470, 90]]), Esq.nodo(410, 90),
    Esq.C(410, 90, 410, 160, 'C', '', -1), Esq.masa(410, 160),
    Esq.borne(470, 90, 'Vmed', 0, -12),
    Esq.texto(345, 190, 'Filtro RC pasa bajos (opcional)', { size: 12, peso: 400 }),
  ], 'Si Vref es mayor que la portadora, la salida está en alto. Cuanto más alta Vref, más ancho el pulso.');

  const figMotor = Esq.svg(420, 290, [
    Esq.borne(250, 20, '+12 V', 30, 4), Esq.cable([[250, 20], [250, 50]]), Esq.nodo(250, 40),
    Esq.motor(250, 50, 250, 130, 'Motor CC', '', -1),
    Esq.cable([[250, 40], [330, 40], [330, 50]]), Esq.D(330, 130, 330, 50, 'D', '1N4007', 1),
    Esq.cable([[330, 130], [330, 140], [250, 140]]), Esq.cable([[250, 130], [250, 170]]), Esq.nodo(250, 140),
    Esq.mosfet(238, 200, 'N', 'Q (IRLZ44N)'), Esq.cable([[250, 230], [250, 245]]), Esq.masa(250, 245),
    Esq.borne(50, 208, 'Pin 9 (PWM)', 10, 26), Esq.cable([[50, 208], [70, 208]]),
    Esq.R(70, 208, 160, 208, 'Rg', '220 Ω', 1), Esq.cable([[160, 208], [208, 208]]), Esq.nodo(185, 208),
    Esq.R(185, 208, 185, 268, 'Rpd', '10 kΩ', -1), Esq.masa(185, 268),
  ], 'Control de velocidad de un motor con PWM: el MOSFET trabaja como llave. El diodo D descarga la energía de la bobina cuando el MOSFET se abre.');

  registrarTema({
    id: 'pwm',
    orden: 4,
    titulo: 'PWM',
    resumen: 'Modulación por ancho de pulso: ciclo de trabajo, valor medio, aplicaciones y generación',
    confirmar: false,

    teoria: String.raw`
<p>Imaginá que querés que una lámpara dé la mitad de luz, pero solo tenés un interruptor. Si lo prendés y apagás <b>muy rápido</b>, la mitad del tiempo prendida y la otra mitad apagada, tu ojo no llega a ver el parpadeo y percibe un brillo promedio: <b>la mitad</b>. Eso es el <b>PWM</b> (<em>Pulse Width Modulation</em>, modulación por ancho de pulso): controlar “cuánta” energía le llega a una carga <b>prendiéndola y apagándola rápidamente</b> y variando cuánto tiempo está prendida en cada ciclo.</p>
<p>Es una de las técnicas más usadas de la electrónica moderna: el brillo de la pantalla del celular, la velocidad de un ventilador de PC, los drones, los autos eléctricos, los cargadores, los inversores solares y el <code>analogWrite()</code> de Arduino funcionan así.</p>

<h2>1. La señal PWM</h2>
<figure class="figura">${figPWM()}<figcaption>Señal PWM con ciclo de trabajo D = 30 %. La línea punteada es su valor medio.</figcaption></figure>
<div class="caja formula"><span class="caja-titulo">Parámetros</span>
<ul>
<li>$T$: <b>período</b> (tiempo de un ciclo completo). $f=\frac1T$: <b>frecuencia</b> del PWM.</li>
<li>$T_{on}$: tiempo en alto (llave cerrada, la carga recibe $V_{cc}$). $T_{off}=T-T_{on}$: tiempo en bajo.</li>
<li><b>Ciclo de trabajo</b> (<em>duty cycle</em>):</li>
</ul>
$$D=\frac{T_{on}}{T}=\frac{T_{on}}{T_{on}+T_{off}}\qquad(0\le D\le1,\ \text{o de }0\text{ a }100\,\%)$$
</div>
<div class="caja tip"><span class="caja-titulo">Lo importante</span>
En PWM la <b>frecuencia queda fija</b> y lo que se varía es el <b>ancho del pulso</b>. D = 0 % es siempre apagado; D = 100 % es siempre prendido.
</div>

<h2>2. Valor medio y valor eficaz</h2>
<p>Es la cuadrada con ciclo de trabajo que vimos en el tema 3:</p>
<div class="caja formula"><span class="caja-titulo">Fórmulas del PWM</span>
$$V_{med}=D\cdot V_{cc}\qquad\qquad V_{rms}=V_{cc}\sqrt D\qquad\qquad P_{R}=\frac{V_{rms}^2}{R}=D\cdot\frac{V_{cc}^2}{R}$$
</div>
<ul>
<li>El <b>valor medio</b> es lo que importa para un <b>motor</b> (su velocidad depende de la tensión media) y lo que obtenés si filtrás la señal con un RC.</li>
<li>El <b>valor eficaz</b> importa para el <b>calentamiento</b> de resistencias. La potencia en una resistencia es proporcional a $D$: con D = 50 % recibe la mitad de la potencia.</li>
</ul>
<div class="caja ejemplo"><span class="caja-titulo">Ejemplo</span>
PWM de $12\,\text{V}$, $f=2\,\text{kHz}$ y $D=25\,\%$:
$$T=\frac{1}{2000}=500\,\mu\text{s}\qquad T_{on}=0{,}25\cdot500=125\,\mu\text{s}\qquad T_{off}=375\,\mu\text{s}$$
$$V_{med}=0{,}25\cdot12=3\,\text{V}\qquad V_{rms}=12\sqrt{0{,}25}=6\,\text{V}$$
</div>

<h2>3. ¿Por qué PWM? La eficiencia</h2>
<p>Para darle “la mitad” a una carga hay dos caminos:</p>
<ul>
<li><b>Control lineal:</b> poner un transistor (o un reóstato) en serie que “se coma” la tensión sobrante. El problema: esa tensión por la corriente es <b>calor desperdiciado</b> en el transistor ($P=V_{CE}\cdot I$).</li>
<li><b>Control PWM:</b> usar el transistor como <b>llave</b>. Cuando está <b>saturado</b> (cerrado) la tensión sobre él es casi cero → $P\approx0$. Cuando está <b>cortado</b> (abierto) la corriente es cero → $P=0$. Casi no disipa nada.</li>
</ul>
<div class="caja ejemplo"><span class="caja-titulo">Ejemplo: lámpara de 12 V / 24 W (R = 6 Ω) a media potencia (12 W)</span>
<b>Lineal:</b> la lámpara necesita $V=\sqrt{P\,R}=\sqrt{12\cdot6}=8{,}49\,\text{V}$, con $I=\frac{8{,}49}{6}=1{,}41\,\text{A}$. El transistor cae $12-8{,}49=3{,}51\,\text{V}$ y disipa $3{,}51\cdot1{,}41=4{,}97\,\text{W}$. Rendimiento: $\frac{12}{12+4{,}97}=71\,\%$, y el transistor necesita un buen disipador.<br>
<b>PWM</b> con D = 50 % y un MOSFET de $R_{DS(on)}=0{,}05\,\Omega$: en conducción circulan $\frac{12}{6{,}05}=1{,}98\,\text{A}$ y el MOSFET disipa $1{,}98^2\cdot0{,}05\cdot0{,}5\approx0{,}1\,\text{W}$. Rendimiento ≈ 99 %. ¡50 veces menos calor!
</div>
<div class="caja ojo"><span class="caja-titulo">Pérdidas de conmutación</span>
El transistor no pasa de cortado a saturado en forma instantánea: durante cada transición tiene tensión y corriente a la vez y disipa. Esas pérdidas se repiten en cada ciclo, así que <b>aumentan con la frecuencia</b>. Por eso no conviene usar frecuencias más altas que las necesarias.
</div>

<h2>4. Aplicaciones</h2>
<h3>Brillo de un LED</h3>
<p>El LED se prende y apaga de verdad, pero si la frecuencia es suficientemente alta, el ojo <b>promedia</b> y ve un brillo proporcional a $D$. Ventaja frente a bajar la corriente: el color del LED no cambia y la eficiencia es máxima.</p>
<h3>Velocidad de un motor de CC</h3>
<p>El motor tiene <b>inercia mecánica</b> (no puede frenar y acelerar 1000 veces por segundo) y su bobinado tiene <b>inductancia</b> (suaviza la corriente). Por las dos cosas, responde al <b>valor medio</b>: su velocidad es aproximadamente proporcional a $D\cdot V_{cc}$.</p>
${figMotor}
<div class="caja ojo"><span class="caja-titulo">El diodo de rueda libre es obligatorio</span>
La bobina del motor se opone a los cambios de corriente. Cuando el MOSFET se abre, la bobina genera un pico de tensión que puede superar los 100 V y destruir el transistor. El diodo D (en antiparalelo con el motor) le da un camino a esa corriente. Lo mismo vale para relés y solenoides.
</div>
<h3>Servomotores</h3>
<p>Un servo de modelismo (SG90, MG996R) usa PWM de forma distinta: la frecuencia es de <b>50 Hz</b> ($T=20\,\text{ms}$) y el <b>ancho del pulso</b> indica la <b>posición</b> (no la potencia): típicamente 1 ms → 0°, 1,5 ms → 90°, 2 ms → 180° (muchos servos aceptan de 0,5 a 2,5 ms).</p>
<figure class="figura">${figServo()}<figcaption>Pulsos de control de un servo (cada 20 ms). El ciclo de trabajo va de 5 % a 10 %.</figcaption></figure>
<h3>Fuentes conmutadas</h3>
<p>Cargadores de celular, fuentes de PC y reguladores <em>buck</em> usan PWM a frecuencias de 50 kHz a 2 MHz: un transistor conmuta, una bobina y un capacitor filtran, y un circuito de control ajusta D para mantener la salida constante. En un buck ideal, $V_{out}=D\cdot V_{in}$. Por eso un cargador de 5 V de 2 A es tan chiquito y casi no calienta.</p>
<h3>Arduino: <code>analogWrite()</code></h3>
<p>Arduino no tiene salidas analógicas de verdad: <code>analogWrite(pin, valor)</code> genera un PWM de 0 a 5 V con</p>
$$D=\frac{\text{valor}}{255}\qquad V_{med}=5\,\text{V}\cdot\frac{\text{valor}}{255}$$
<div class="tabla-wrap"><table class="tabla">
<tr><th>Placa</th><th>Pines PWM</th><th>Frecuencia</th></tr>
<tr><td>Arduino UNO / Nano</td><td>3, 9, 10, 11</td><td>≈ 490 Hz</td></tr>
<tr><td>Arduino UNO / Nano</td><td>5, 6</td><td>≈ 980 Hz</td></tr>
<tr><td>Arduino Mega</td><td>2 a 13, 44 a 46</td><td>≈ 490 Hz (4 y 13: ≈ 980 Hz)</td></tr>
</table></div>
<div class="caja ejemplo"><span class="caja-titulo">Ejemplo</span>
<code>analogWrite(9, 64);</code> → $D=\frac{64}{255}=25{,}1\,\%$, $V_{med}=5\cdot0{,}251=1{,}25\,\text{V}$, a 490 Hz ($T=2{,}04\,\text{ms}$, $T_{on}=0{,}51\,\text{ms}$).
</div>

<h2>5. ¿Qué frecuencia elegir?</h2>
<div class="tabla-wrap"><table class="tabla">
<tr><th>Aplicación</th><th>Frecuencia típica</th><th>Por qué</th></tr>
<tr><td>Hornos, calefactores</td><td>0,1 a 1 Hz (ciclos de segundos)</td><td>La inercia térmica es enorme; conmutar lento reduce desgaste.</td></tr>
<tr><td>Servos</td><td>50 Hz</td><td>Lo fija el estándar de modelismo.</td></tr>
<tr><td>LED</td><td>&gt; 200 Hz (mejor &gt; 1 kHz)</td><td>Por debajo de ~100 Hz se ve el parpadeo; las cámaras del celular lo detectan aun más arriba.</td></tr>
<tr><td>Motores CC chicos</td><td>1 a 20 kHz</td><td>Entre 1 y 15 kHz el motor <b>zumba</b> (audible). Arriba de 20 kHz es silencioso, pero aumentan las pérdidas de conmutación.</td></tr>
<tr><td>Fuentes conmutadas</td><td>50 kHz a 2 MHz</td><td>Más frecuencia → bobinas y capacitores más chicos.</td></tr>
</table></div>
<div class="caja idea"><span class="caja-titulo">La regla general</span>
El período del PWM tiene que ser <b>mucho más corto</b> que el tiempo de respuesta de la carga (inercia del motor, persistencia del ojo, constante de tiempo del filtro). Así la carga “ve” solo el valor medio. Pero no conviene subir la frecuencia de más, por las pérdidas de conmutación.
</div>

<h2>6. Cómo se genera un PWM: el comparador</h2>
<p>Antes de los microcontroladores (y todavía hoy, adentro de los integrados de fuentes como el TL494 o el SG3525) el PWM se genera comparando dos señales:</p>
<ul>
<li>Una <b>portadora</b> triangular o diente de sierra, de frecuencia fija (la frecuencia del PWM).</li>
<li>Una <b>referencia</b> $V_{ref}$ (la “orden”: cuánto queremos).</li>
</ul>
${figComparador}
<div class="caja formula"><span class="caja-titulo">Ciclo de trabajo de un comparador</span>
Si la portadora va de 0 a $V_{pico}$ y la salida está en alto cuando $V_{ref}$ supera a la portadora:
$$D=\frac{V_{ref}}{V_{pico}}$$
Ejemplo: portadora de 0 a 10 V y $V_{ref}=3{,}5\,\text{V}$ → $D=35\,\%$.
</div>
<p>Si en lugar de una referencia fija usamos una <b>senoidal</b>, el ancho de los pulsos sigue a la senoidal: es el <b>PWM senoidal</b> (SPWM), que usan los inversores y los variadores de velocidad para fabricar alterna a partir de continua. Después de filtrar, aparece la senoidal.</p>

<h2>7. Recuperar la tensión media: filtro RC</h2>
<p>Si necesitamos una tensión continua de verdad (por ejemplo, una “salida analógica” de Arduino), filtramos el PWM con un <b>RC pasa bajos</b>. El capacitor se carga durante $T_{on}$ y se descarga durante $T_{off}$; si la constante de tiempo $\tau=RC$ es mucho mayor que $T$, la tensión casi no se mueve y queda en $V_{med}$.</p>
<div class="caja formula"><span class="caja-titulo">Diseño del filtro</span>
$$f_c=\frac{1}{2\pi RC}\ll f_{PWM}\qquad\qquad \Delta V_{pp}\approx V_{cc}\,D\,(1-D)\,\frac{T}{RC}\quad(\text{si }RC\gg T)$$
<p>El ripple es máximo con D = 50 %. El precio de un RC grande es la <b>lentitud</b>: tarda unos $5RC$ en llegar al valor final cuando cambia D.</p>
</div>
<div class="caja ejemplo"><span class="caja-titulo">Ejemplo: Arduino a 490 Hz con R = 10 kΩ y C = 10 µF</span>
$RC=10\,000\cdot10\times10^{-6}=0{,}1\,\text{s}$; $f_c=\frac{1}{2\pi\cdot0{,}1}=1{,}59\,\text{Hz}$ (muy por debajo de 490 Hz).<br>
Ripple con D = 50 %: $\Delta V\approx5\cdot0{,}5\cdot0{,}5\cdot\frac{2{,}04\,\text{ms}}{100\,\text{ms}}=25{,}5\,\text{mV}$. Tiempo de establecimiento: $5RC=0{,}5\,\text{s}$.
</div>
<div class="caja tip"><span class="caja-titulo">Compromiso</span>
RC chico → responde rápido pero con mucho ripple. RC grande → salida lisa pero lenta. Con dos etapas RC en cascada se logra mejor filtrado sin hacerlo tan lento.
</div>
`,

    simulaciones: [
      {
        titulo: 'Generador PWM: LED y motor',
        descripcion: 'Mové el ciclo de trabajo y la frecuencia. Con frecuencias muy bajas (menos de ~30 Hz) el LED parpadea de verdad y el motor gira “a los tirones”.',
        montar(cont, H) {
          const { controles, vista } = H.layout(cont);
          const vcc = H.slider(controles, { label: 'Vcc', min: 1, max: 24, step: 0.5, value: 12, unidad: 'V', onInput: upd });
          const dd = H.slider(controles, { label: 'Ciclo de trabajo D', min: 0, max: 100, step: 1, value: 25, fmt: v => v + ' %', onInput: upd });
          const fr = H.slider(controles, { label: 'Frecuencia', min: 1, max: 20000, log: true, value: 490, unidad: 'Hz', onInput: upd });
          H.titulo(controles, 'Frecuencias típicas');
          const fila = H.el('div', { style: 'display:flex;flex-wrap:wrap;gap:6px' }); controles.append(fila);
          for (const [t, v] of [['2 Hz', 2], ['10 Hz', 10], ['Arduino 490 Hz', 490], ['Arduino 980 Hz', 980], ['20 kHz', 20000]]) H.boton(fila, t, () => { fr.value = v; upd(); }, 'btn chico');
          const nota = H.nota(controles, '');

          let tReal = 0;
          const lento = () => fr.value < 30;
          const vInst = (t) => { const u = t * fr.value; return (u - Math.floor(u)) < dd.value / 100 ? vcc.value : 0; };

          const cv = H.canvas(vista, {
            alto: (w) => Math.round(Math.max(200, Math.min(250, w * 0.38))),
            fondo: 'scope-bg',
            dibujar(ctx, w, h) {
              const T = 1 / fr.value, Vc = vcc.value, D = dd.value / 100, ventana = 3 * T;
              const ym = Math.max(5, Math.ceil(Vc * 1.2 / 5) * 5);
              const P = H.ejes(ctx, w, h, { xmin: 0, xmax: ventana, ymin: -ym * 0.1, ymax: ym, oscuro: true, xticks: [0, 0.5, 1, 1.5, 2, 2.5, 3].filter((_, i) => w >= 500 || i % 2 === 0).map(k => k * T), xfmt: t => H.fmt(t, 's'), yfmt: y => H.num(y, 1), xlabel: 't', ylabel: 'v (V)' });
              const pts = [];
              for (let k = 0; k < 3; k++) {
                const a = k * T;
                if (D <= 0) { pts.push([a, 0], [a + T, 0]); continue; }
                if (D >= 1) { pts.push([a, Vc], [a + T, Vc]); continue; }
                pts.push([a, 0], [a, Vc], [a + D * T, Vc], [a + D * T, 0], [a + T, 0]);
              }
              P.pts(pts, { color: H.col('scope-c1'), ancho: 2.4 });
              P.hline(D * Vc, { color: H.col('scope-c2'), ancho: 2, label: 'Vmed = ' + H.fmt(D * Vc, 'V'), labelX: ventana * 0.6 });
              P.hline(Vc * Math.sqrt(D), { color: '#ff9f6b', ancho: 1.5, guiones: [2, 4], label: 'Vrms = ' + H.fmt(Vc * Math.sqrt(D), 'V') });
              if (lento()) {
                const tc = tReal % ventana;
                P.vline(tc, { color: '#ffffff', ancho: 1.5, guiones: [3, 3] });
                P.punto(tc, vInst(tReal), { color: '#ffffff', r: 4 });
              }
            },
          });
          const cvA = H.canvas(vista, { alto: 190, dibujar: dibujarAnim });
          const lec = H.lecturas(vista);

          // dinámica del motor (primer orden): rpm → k·v con constante de tiempo mecánica tau
          const K_RPM = 6000 / 12, TAU = 0.3;
          let rpm = 0, ang = 0, tPrev = null;
          function dibujarAnim(ctx, w, h) {
            const D = dd.value / 100, Vc = vcc.value;
            const cx1 = w * 0.25, cx2 = w * 0.72, cy = 82;
            const nivel = lento() ? (vInst(tReal) > 0 ? 1 : 0) : D;
            H.brillo(ctx, cx1, cy, Math.min(26, w * 0.06), nivel, '#ff3b30');
            // patitas del LED
            ctx.strokeStyle = H.col('muted'); ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(cx1 - 8, cy + 26); ctx.lineTo(cx1 - 8, cy + 52); ctx.moveTo(cx1 + 8, cy + 26); ctx.lineTo(cx1 + 8, cy + 46); ctx.stroke();
            // motor: estator + rotor que gira
            const r = Math.min(52, w * 0.12);
            ctx.save(); ctx.translate(cx2, cy);
            ctx.fillStyle = H.col('panel2'); ctx.strokeStyle = H.col('ink'); ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.stroke();
            ctx.fillStyle = H.col('c4'); ctx.globalAlpha = 0.25; ctx.fillRect(-r - 2, -r * 0.45, 8, r * 0.9); ctx.fillRect(r - 6, -r * 0.45, 8, r * 0.9); ctx.globalAlpha = 1;
            ctx.rotate(ang);
            for (let i = 0; i < 3; i++) {
              ctx.rotate(2 * Math.PI / 3);
              ctx.fillStyle = H.col('c1'); ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r * 0.75, -0.35, 0.35); ctx.closePath(); ctx.fill();
            }
            ctx.fillStyle = H.col('ink'); ctx.beginPath(); ctx.arc(0, 0, 5, 0, 7); ctx.fill();
            ctx.restore();
            ctx.fillStyle = H.col('ink'); ctx.textAlign = 'center'; ctx.font = '600 13px sans-serif';
            ctx.fillText('LED: ' + (lento() ? (nivel ? 'prendido' : 'apagado') : 'brillo ' + Math.round(D * 100) + ' %'), cx1, cy + 76);
            ctx.fillText('Motor: ' + Math.round(rpm) + ' rpm', cx2, cy + 76);
            ctx.fillStyle = H.col('muted'); ctx.font = '11px sans-serif';
            ctx.fillText(lento() ? 'parpadeo real (f < 30 Hz)' : (fr.value < 100 ? 'el ojo todavía nota parpadeo' : 'el ojo promedia'), cx1, cy + 94);
            ctx.fillText('(animación ralentizada)', cx2, cy + 94);
          }
          H.loop((t) => {
            const dt = tPrev === null ? 0 : Math.min(0.1, t - tPrev); tPrev = t; tReal = t;
            const sub = 20;
            for (let i = 0; i < sub; i++) {
              const ts = t - dt + dt * (i + 1) / sub;
              const v = lento() ? vInst(ts) : vcc.value * dd.value / 100;   // a f alta la inercia ya promedia
              rpm += (K_RPM * v - rpm) * (dt / sub) / TAU;
            }
            ang += (rpm / 6000) * 2.5 * 2 * Math.PI * dt;
            cvA.redibujar();
            if (lento()) cv.redibujar();
          });

          function upd() {
            const T = 1 / fr.value, D = dd.value / 100, Vc = vcc.value, F = fr.value;
            cv.redibujar();
            const val = Math.round(D * 255);
            lec.set([
              { k: 'Período T', v: H.fmt(T, 's') },
              { k: 'Ton / Toff', v: H.fmt(D * T, 's') + ' / ' + H.fmt((1 - D) * T, 's') },
              { k: 'Vmed = D·Vcc', v: H.fmt(D * Vc, 'V') },
              { k: 'Vrms = Vcc·√D', v: H.fmt(Vc * Math.sqrt(D), 'V') },
              { k: 'Velocidad final del motor', v: Math.round(K_RPM * D * Vc) + ' rpm' },
              { k: 'Equivale en Arduino a', v: `analogWrite(9, ${val})` },
            ]);
            let t;
            if (F < 30) t = '<b>Frecuencia muy baja:</b> el período es comparable con la inercia del motor y con la persistencia del ojo. El LED parpadea y el motor acelera y frena en cada ciclo (mirá cómo oscilan las rpm).';
            else if (F < 100) t = '<b>Zona de parpadeo:</b> el motor ya responde al valor medio, pero un LED a esta frecuencia molesta a la vista (y en una filmación se ve horrible). Subí a más de 200 Hz.';
            else if (F <= 15000) t = '<b>Bien para LED.</b> En un motor real, esta frecuencia está en el rango audible: vas a escuchar un zumbido o “silbido” del bobinado.';
            else t = '<b>Frecuencia ultrasónica:</b> el motor es silencioso, pero el transistor conmuta más veces por segundo y aumentan las pérdidas de conmutación.';
            t += ' <br>El motor simulado gira 500 rpm por volt (6000 rpm a 12 V): su velocidad final es proporcional a la tensión media.';
            if (val === 0 || val === 255) t += ` Con <code>analogWrite(9, ${val})</code> Arduino deja la salida fija en ${val ? '5 V' : '0 V'} (sin pulsos).`;
            nota.innerHTML = t;
          }
          upd();
        },
      },
      {
        titulo: 'Generación de PWM con un comparador (y filtrado RC)',
        descripcion: 'Una portadora triangular de 1 kHz (0 a 5 V) se compara con una referencia. Probá una referencia fija o una senoidal (PWM senoidal), y filtrá la salida con un RC.',
        montar(cont, H) {
          const { controles, vista } = H.layout(cont);
          const port = H.select(controles, { label: 'Portadora', opciones: [{ v: 'tri', t: 'Triangular (1 kHz)' }, { v: 'sierra', t: 'Diente de sierra (1 kHz)' }], value: 'tri', onChange: upd });
          const tipo = H.select(controles, { label: 'Referencia', opciones: [{ v: 'cte', t: 'Continua (fija)' }, { v: 'sen', t: 'Senoidal (modulación)' }], value: 'cte', onChange: () => { vis(); upd(); } });
          const vref = H.slider(controles, { label: 'Vref', min: 0, max: 5, step: 0.05, value: 2, unidad: 'V', onInput: upd });
          const mod = H.slider(controles, { label: 'Amplitud de la senoidal', min: 0, max: 2.5, step: 0.05, value: 2, unidad: 'V', onInput: upd });
          const rel = H.slider(controles, { label: 'Pulsos por ciclo de la senoidal', min: 5, max: 40, step: 1, value: 12, fmt: v => v + ' → fm = ' + H.fmt(1000 / v, 'Hz'), onInput: upd });
          H.sep(controles);
          const verRC = H.check(controles, { label: 'Mostrar salida filtrada (RC)', value: true, onChange: upd });
          const tau = H.slider(controles, { label: 'Constante de tiempo RC', min: 0.05e-3, max: 50e-3, log: true, value: 2e-3, unidad: 's', onInput: upd });
          function vis() { vref.el.style.display = tipo.value === 'cte' ? '' : 'none'; mod.el.style.display = rel.el.style.display = tipo.value === 'sen' ? '' : 'none'; }

          const FP = 1000, TP = 1 / FP, VP = 5, VCC = 5;
          const portadora = (t) => { const u = t * FP - Math.floor(t * FP); return port.value === 'tri' ? VP * (u < 0.5 ? 2 * u : 2 - 2 * u) : VP * u; };
          const ref = (t) => tipo.value === 'cte' ? vref.value : 2.5 + mod.value * Math.sin(2 * Math.PI * (FP / rel.value) * t);
          const salida = (t) => ref(t) > portadora(t) ? VCC : 0;
          let datos = { ts: [], y: [], ventana: 4 * TP, rpp: 0 };

          function simular() {
            const ventana = tipo.value === 'cte' ? 4 * TP : rel.value * TP;
            const dt = TP / 400, tc = tau.value;
            const pre = Math.min(Math.max(6 * tc, 2 * TP), 0.3);
            const nPre = Math.ceil(pre / dt), n = Math.ceil(ventana / dt);
            const a = 1 - Math.exp(-dt / tc);
            let y = tipo.value === 'cte' ? Math.min(vref.value / VP, 1) * VCC : 2.5;
            for (let i = -nPre; i < 0; i++) y += (salida(i * dt) - y) * a;
            const ts = [], ys = [];
            let mn = Infinity, mx = -Infinity;
            for (let i = 0; i <= n; i++) {
              const t = i * dt; ts.push(t); ys.push(y);
              if (t >= ventana - TP) { mn = Math.min(mn, y); mx = Math.max(mx, y); }
              y += (salida(t) - y) * a;
            }
            datos = { ts, y: ys, ventana, rpp: mx - mn };
          }

          const xt = (w) => { const v = datos.ventana; const k = H.ticks(0, v * 1000, w < 500 ? 4 : 8); return k.map(x => x / 1000); };
          const cv1 = H.canvas(vista, {
            alto: 170, fondo: 'scope-bg',
            dibujar(ctx, w, h) {
              const P = H.ejes(ctx, w, h, { xmin: 0, xmax: datos.ventana, ymin: -0.3, ymax: 5.6, oscuro: true, xticks: xt(w), xfmt: t => H.num(t * 1000, 2) + ' ms', yticks: [0, 1, 2, 3, 4, 5], ylabel: 'entradas (V)', mb: 26 });
              P.fn(portadora, { color: H.col('scope-c2'), ancho: 1.6, n: 2000 });
              P.fn(ref, { color: H.col('scope-c1'), ancho: 2.4, n: 600 });
            },
          });
          const cv2 = H.canvas(vista, {
            alto: 190, fondo: 'scope-bg',
            dibujar(ctx, w, h) {
              const P = H.ejes(ctx, w, h, { xmin: 0, xmax: datos.ventana, ymin: -0.3, ymax: 5.6, oscuro: true, xticks: xt(w), xfmt: t => H.num(t * 1000, 2) + ' ms', yticks: [0, 1, 2, 3, 4, 5], ylabel: 'salida (V)' });
              P.fn(salida, { color: '#9be89b', ancho: 1.6, n: Math.max(2000, Math.round(datos.ventana / TP) * 200) });
              P.fn(ref, { color: H.col('scope-c1'), ancho: 1.3, guiones: [5, 4], n: 600 });
              if (verRC.value) {
                const st = Math.max(1, Math.floor(datos.ts.length / 1500));
                const pts = []; for (let i = 0; i < datos.ts.length; i += st) pts.push([datos.ts[i], datos.y[i]]);
                P.pts(pts, { color: '#ff7ad9', ancho: 2.6 });
              }
            },
          });
          const ley = H.nota(vista, '<span style="color:#d6b800">■</span> referencia &nbsp; <span style="color:#1fb8e6">■</span> portadora &nbsp; <span style="color:#3fae3f">■</span> salida PWM del comparador &nbsp; <span style="color:#e03fb5">■</span> salida filtrada RC (la referencia también aparece punteada abajo para comparar)');
          const lec = H.lecturas(vista);
          const nota = H.nota(vista);

          function upd() {
            simular(); cv1.redibujar(); cv2.redibujar();
            const fc = 1 / (2 * Math.PI * tau.value);
            const items = [];
            if (tipo.value === 'cte') {
              const D = Math.min(1, Math.max(0, vref.value / VP));
              items.push({ k: 'D = Vref / Vpico', v: H.num(D * 100, 1) + ' %' }, { k: 'Vmed teórica = D·5 V', v: H.fmt(D * VCC, 'V') });
              if (verRC.value) {
                const teo = tau.value > 3 * TP ? VCC * D * (1 - D) * TP / tau.value : NaN;
                items.push({ k: 'Ripple pico a pico (simulado)', v: H.fmt(datos.rpp, 'V'), estado: datos.rpp < 0.1 ? 'ok' : datos.rpp < 0.5 ? 'alerta' : 'mal' });
                items.push({ k: 'Ripple ≈ Vcc·D(1−D)·T/RC', v: Number.isFinite(teo) ? H.fmt(teo, 'V') : '(solo si RC ≫ T)' });
              }
            } else {
              const fm = FP / rel.value;
              items.push({ k: 'D mínimo / máximo', v: H.num(Math.max(0, (2.5 - mod.value) / 5) * 100, 0) + ' % / ' + H.num(Math.min(1, (2.5 + mod.value) / 5) * 100, 0) + ' %' }, { k: 'Frecuencia de la senoidal fm', v: H.fmt(fm, 'Hz') });
            }
            if (verRC.value) items.push({ k: 'fc = 1/(2πRC)', v: H.fmt(fc, 'Hz') }, { k: 'Tiempo de establecimiento 5RC', v: H.fmt(5 * tau.value, 's') });
            lec.set(items);
            let t = '';
            if (tipo.value === 'cte') t = '<b>Mirá el comparador:</b> la salida está en 5 V mientras la línea amarilla (Vref) está por encima de la portadora. Subí Vref y el pulso se ensancha.';
            else t = '<b>PWM senoidal:</b> cuando la senoidal está arriba, los pulsos son anchos; abajo, angostos. El valor medio “local” sigue a la senoidal: después del filtro la recuperás. Así trabaja un inversor.';
            if (verRC.value) {
              if (fc > FP / 5) t += ' <b>RC demasiado chico:</b> el filtro casi no filtra; la salida “copia” los pulsos (mucho ripple).';
              else if (tipo.value === 'sen' && fc < 1.5 * FP / rel.value) t += ' <b>RC demasiado grande para la senoidal:</b> además del ripple, el filtro atenúa y retrasa la propia senoidal (fijate el desfase con la punteada).';
              else if (tipo.value === 'cte' && 5 * tau.value > datos.ventana * 3) t += ' Salida bien lisa, pero el filtro es lento: si cambiás Vref, tarda ' + H.fmt(5 * tau.value, 's') + ' en estabilizarse.';
              else t += ' <b>Buen compromiso:</b> fc bastante menor que la frecuencia del PWM (1 kHz).';
            }
            nota.innerHTML = t;
          }
          vis(); upd();
        },
      },
    ],

    ejercicios: [
      {
        nivel: 'Básico',
        enunciado: String.raw`Una señal PWM de $12\,\text{V}$ y $2\,\text{kHz}$ tiene pulsos de $125\,\mu\text{s}$. Calculá el período, el ciclo de trabajo, la tensión media y la tensión eficaz.`,
        pista: String.raw`$T=1/f$, $D=T_{on}/T$, $V_{med}=D\,V_{cc}$, $V_{rms}=V_{cc}\sqrt D$.`,
        solucion: String.raw`$T=\frac{1}{2000}=500\,\mu\text{s}$. $D=\frac{125}{500}=0{,}25=25\,\%$.<br>$V_{med}=0{,}25\cdot12=3\,\text{V}$; $V_{rms}=12\sqrt{0{,}25}=6\,\text{V}$.`,
      },
      {
        nivel: 'Básico',
        enunciado: String.raw`En un Arduino UNO (5 V) se escribe <code>analogWrite(10, 191)</code>. ¿Cuál es el ciclo de trabajo y la tensión media? ¿Qué valor hay que escribir para obtener $2\,\text{V}$ de valor medio? ¿A qué frecuencia trabaja el pin 10?`,
        pista: String.raw`$D=\text{valor}/255$. Despejá el valor de $V_{med}=5\cdot\text{valor}/255$.`,
        solucion: String.raw`$D=\frac{191}{255}=74{,}9\,\%$; $V_{med}=5\cdot0{,}749=3{,}75\,\text{V}$.<br>Para 2 V: $\text{valor}=\frac{2}{5}\cdot255=102$.<br>El pin 10 del UNO trabaja a ≈ 490 Hz.`,
      },
      {
        nivel: 'Intermedio',
        enunciado: String.raw`Un servo se controla con pulsos de 50 Hz: 1 ms → 0°, 1,5 ms → 90° y 2 ms → 180°. (a) ¿Cuál es el ciclo de trabajo en cada caso? (b) Si intentáramos generarlo con un PWM de 8 bits (256 pasos) a 50 Hz, ¿cuánto dura cada paso y cuántos grados avanza el servo por paso?`,
        pista: String.raw`$T=20\,\text{ms}$. Con 8 bits, cada paso dura $T/255$. El rango útil es de 1 ms (de 1 a 2 ms) para 180°.`,
        solucion: String.raw`(a) $D=\frac{1}{20}=5\,\%$; $\frac{1{,}5}{20}=7{,}5\,\%$; $\frac{2}{20}=10\,\%$.<br>(b) Paso: $\frac{20\,\text{ms}}{255}=78{,}4\,\mu\text{s}$. En 1 ms entran $\frac{1000}{78{,}4}=12{,}75$ pasos → $\frac{180°}{12{,}75}=14{,}1°$ por paso. ¡Muy poca resolución! Por eso la librería <code>Servo.h</code> genera los pulsos con un temporizador de 16 bits en lugar de usar <code>analogWrite()</code>.`,
      },
      {
        nivel: 'Intermedio',
        enunciado: String.raw`Una lámpara de $12\,\text{V}$ / $24\,\text{W}$ (considerala de $6\,\Omega$ constante) debe trabajar al 50 % de su potencia. Compará la potencia disipada en el transistor con (a) control lineal y (b) PWM con un MOSFET de $R_{DS(on)}=0{,}05\,\Omega$.`,
        pista: String.raw`(a) Buscá la tensión que da 12 W en 6 Ω; el resto cae en el transistor. (b) Con D = 0,5: $P_{MOS}=I_{on}^2\,R_{DS(on)}\cdot D$.`,
        solucion: String.raw`(a) $V_L=\sqrt{12\cdot6}=8{,}49\,\text{V}$, $I=1{,}41\,\text{A}$. $V_{CE}=12-8{,}49=3{,}51\,\text{V}$ → $P_T=3{,}51\cdot1{,}41=4{,}97\,\text{W}$. Rendimiento $\frac{12}{16{,}97}=71\,\%$.<br>(b) $I_{on}=\frac{12}{6{,}05}=1{,}98\,\text{A}$; $P_{MOS}=1{,}98^2\cdot0{,}05\cdot0{,}5=0{,}098\,\text{W}$. Rendimiento ≈ 99 %. El PWM disipa unas 50 veces menos (sin contar las pérdidas de conmutación, que son chicas a frecuencias bajas).`,
      },
      {
        nivel: 'Intermedio',
        enunciado: String.raw`Se quiere obtener una tensión continua con el PWM de un Arduino (490 Hz, 5 V) usando un filtro RC con $R=10\,\text{k}\Omega$ y $C=10\,\mu\text{F}$. Calculá la frecuencia de corte, el ripple aproximado con $D=50\,\%$ y el tiempo que tarda en estabilizarse.`,
        pista: String.raw`$f_c=\frac{1}{2\pi RC}$, $\Delta V\approx V_{cc}D(1-D)\frac{T}{RC}$, tiempo ≈ $5RC$.`,
        solucion: String.raw`$RC=10^4\cdot10^{-5}=0{,}1\,\text{s}$; $f_c=\frac{1}{2\pi\cdot0{,}1}=1{,}59\,\text{Hz}$.<br>$T=\frac{1}{490}=2{,}04\,\text{ms}$; $\Delta V\approx5\cdot0{,}5\cdot0{,}5\cdot\frac{2{,}04\times10^{-3}}{0{,}1}=0{,}0255\,\text{V}=25{,}5\,\text{mV}$.<br>Establecimiento: $5\cdot0{,}1=0{,}5\,\text{s}$. Si necesitás que responda más rápido, achicá RC (aumenta el ripple) o usá el pin 5 o 6 a 980 Hz (el ripple baja a la mitad).`,
      },
      {
        nivel: 'Avanzado',
        enunciado: String.raw`Un control de motor usa un comparador: portadora triangular de 0 a 10 V a 20 kHz, y una referencia que sale de un potenciómetro. La etapa de potencia conmuta $24\,\text{V}$. (a) Si $V_{ref}=3{,}5\,\text{V}$, ¿cuál es el ciclo de trabajo y la tensión media en el motor? (b) ¿Qué $V_{ref}$ hace falta para $18\,\text{V}$ medios? (c) ¿Por qué se eligió 20 kHz?`,
        pista: String.raw`$D=V_{ref}/V_{pico}$ y $V_{med}=D\cdot24\,\text{V}$.`,
        solucion: String.raw`(a) $D=\frac{3{,}5}{10}=35\,\%$; $V_{med}=0{,}35\cdot24=8{,}4\,\text{V}$.<br>(b) $D=\frac{18}{24}=0{,}75$ → $V_{ref}=0{,}75\cdot10=7{,}5\,\text{V}$.<br>(c) 20 kHz está en el límite superior del oído humano: el motor no “silba”. Más arriba aumentarían las pérdidas de conmutación sin ganar nada.`,
      },
      {
        nivel: 'Avanzado',
        enunciado: String.raw`Un LED rojo ($V_F=2\,\text{V}$) se conecta a un pin de 5 V con una resistencia de $150\,\Omega$ y se controla con PWM. (a) ¿Cuál es la corriente durante el pulso? (b) Con $D=40\,\%$, ¿cuánto vale la corriente media? (c) ¿Cuánta potencia media disipa la resistencia? (d) Si se usara un PWM de 50 Hz, ¿qué notaría una persona?`,
        pista: String.raw`Durante el pulso: $I=\frac{5-2}{150}$. La corriente media es $D\cdot I$; la potencia media en R es $I^2R\cdot D$.`,
        solucion: String.raw`(a) $I=\frac{3}{150}=20\,\text{mA}$.<br>(b) $I_{med}=0{,}4\cdot20=8\,\text{mA}$.<br>(c) $P=0{,}02^2\cdot150\cdot0{,}4=0{,}024\,\text{W}=24\,\text{mW}$.<br>(d) A 50 Hz el parpadeo se percibe, sobre todo de reojo o al mover la vista, y es muy molesto en fotos y videos. Conviene más de 200 Hz (el Arduino usa 490 o 980 Hz).`,
      },
    ],

    quiz: [
      { pregunta: 'En una señal PWM, ¿qué se varía para controlar la potencia?', opciones: ['La amplitud', 'La frecuencia', 'El ancho del pulso (ciclo de trabajo)', 'La forma de onda'], correcta: 2, explicacion: 'La frecuencia y la amplitud quedan fijas; lo que cambia es Ton, es decir, D.' },
      { pregunta: 'Un PWM de 24 V con D = 75 % tiene un valor medio de…', opciones: ['6 V', '12 V', '18 V', '20,8 V'], correcta: 2, explicacion: 'Vmed = D·Vcc = 0,75·24 = 18 V. (20,8 V sería el eficaz: 24·√0,75.)' },
      { pregunta: '¿Por qué el control PWM es más eficiente que el lineal?', opciones: ['Porque usa tensiones más bajas', 'Porque el transistor está casi siempre saturado o cortado y disipa muy poco', 'Porque la carga consume menos', 'Porque no necesita transistor'], correcta: 1, explicacion: 'Saturado: V ≈ 0; cortado: I = 0. En ambos casos P = V·I ≈ 0.' },
      { pregunta: String.raw`<code>analogWrite(5, 128)</code> en un Arduino UNO produce…`, opciones: ['2,5 V continuos', 'Un PWM de ≈ 980 Hz con D ≈ 50 %', 'Un PWM de 50 Hz', 'Una senoidal de 2,5 V'], correcta: 1, explicacion: 'Arduino no tiene salida analógica real: el pin 5 genera PWM a ≈ 980 Hz con D = 128/255 ≈ 50 %. Su valor medio es ≈ 2,5 V.' },
      { pregunta: 'Para que un motor CC con PWM no emita un zumbido audible, conviene usar…', opciones: ['1 Hz', '50 Hz', '2 kHz', 'Más de 20 kHz'], correcta: 3, explicacion: 'El oído humano escucha hasta ~20 kHz. Por encima el motor es silencioso.' },
      { pregunta: 'En un generador de PWM con comparador, si la portadora va de 0 a 5 V y Vref = 1 V, el ciclo de trabajo es…', opciones: ['1 %', '20 %', '50 %', '80 %'], correcta: 1, explicacion: 'D = Vref/Vpico = 1/5 = 20 %.' },
    ],

    docente: String.raw`
<h3>Objetivo de la clase</h3>
<p>Que el alumno entienda qué es una señal PWM, calcule $T$, $D$, $V_{med}$ y $V_{rms}$, sepa <b>por qué</b> se usa (eficiencia), cómo elegir la frecuencia según la carga y cómo se genera (microcontrolador o comparador). Conecta directamente con el tema 3 (valor medio) y con transistores/MOSFET como llave (temas 14 y 15). <b>Duración sugerida:</b> 1 clase (70–80 min).</p>

<h3>Secuencia sugerida</h3>
<ol>
<li><b>Disparador (5 min):</b> “¿Cómo hace el celular para bajar el brillo de la pantalla?” o “¿cómo bajás la velocidad de un ventilador de PC sin que se caliente nada?”. Si tiene celular a mano: filmar en cámara lenta una lámpara LED con dimmer o un semáforo LED: se ve el parpadeo.</li>
<li><b>Definiciones (10 min):</b> figura de la teoría: T, Ton, D. Ejemplo resuelto de 12 V / 2 kHz.</li>
<li><b>Simulación 1 (20 min):</b>
  <ul>
  <li>Empezá en <b>2 Hz</b> con D = 25 %: el LED parpadea, el motor va a los tirones. Preguntá: <em>“¿qué va a pasar si subo la frecuencia?”</em> antes de hacerlo.</li>
  <li>Pasá a 10 Hz y después a 490 Hz: el LED queda fijo y el motor gira parejo. Que el alumno explique por qué (inercia, persistencia).</li>
  <li>Con 490 Hz, mové D y leé la equivalencia <code>analogWrite</code> y las rpm. Que verifique $V_{med}=D\cdot V_{cc}$ con un par de valores.</li>
  <li>Mostrá que Vrms > Vmed y preguntá cuál importa para el motor y cuál para una resistencia calefactora.</li>
  </ul></li>
<li><b>Eficiencia (10 min):</b> ejemplo de la lámpara (ejercicio 4). Dibujá el MOSFET como llave: cerrado → V ≈ 0; abierto → I = 0.</li>
<li><b>Simulación 2 (15 min):</b> comparador. Primero referencia fija; que prediga D antes de mover el slider. Después senoidal (PWM senoidal), con RC chico (ripple), mediano (bien) y grande (atenúa y desfasa).</li>
<li><b>Cierre (5 min):</b> autoevaluación. Tarea: ejercicios 2, 3, 5 y 7.</li>
</ol>

<h3>Errores frecuentes del alumno</h3>
<ul>
<li>Creer que <code>analogWrite</code> da una tensión continua real (si mide con osciloscopio ve pulsos; con multímetro en DC ve el valor medio).</li>
<li>Confundir frecuencia con ciclo de trabajo (“subí la frecuencia para que gire más rápido”).</li>
<li>Usar $V_{med}$ para calcular potencia en una resistencia (es $D\cdot V_{cc}^2/R$, no $V_{med}^2/R$).</li>
<li>Olvidar el diodo de rueda libre en cargas inductivas.</li>
<li>Pensar que en un servo el D controla la velocidad: controla la <b>posición</b>.</li>
</ul>

<h3>Preguntas disparadoras</h3>
<ul>
<li>Si el transistor está prendido la mitad del tiempo, ¿por qué no se calienta la mitad que en control lineal?</li>
<li>¿Por qué algunos LED de autos “parpadean” en los videos y en persona no?</li>
<li>¿Cómo harías para que un Arduino genere una tensión de 2,5 V “de verdad”?</li>
</ul>

<h3>Recordatorio rápido para vos</h3>
<ul>
<li>$V_{med}=DV_{cc}$; $V_{rms}=V_{cc}\sqrt D$; $P_R=D\,V_{cc}^2/R$.</li>
<li>Arduino UNO: Timer0 (pines 5, 6) ≈ 976,6 Hz; Timer1 (9, 10) y Timer2 (3, 11) ≈ 490,2 Hz. Usar Timer0 para otra cosa rompe <code>millis()</code>. ESP32: <code>ledcWrite</code>, frecuencia y resolución configurables.</li>
<li>Servo: 50 Hz, 1–2 ms (0,5–2,5 ms en muchos modelos). Librería <code>Servo.h</code>.</li>
<li>Ripple RC (RC ≫ T): $\Delta V\approx V_{cc}D(1-D)T/RC$, máximo $V_{cc}T/(4RC)$ en D = 0,5.</li>
<li>Buck ideal: $V_o=DV_i$; boost: $V_o=V_i/(1-D)$.</li>
<li>MOSFET de nivel lógico para 5 V: IRLZ44N, IRL540N (el IRFZ44N necesita ~10 V en el gate para saturar bien). Resistencia de gate 100–220 Ω y pull‑down 10 kΩ.</li>
<li>Espectro de un PWM: continua $DV_{cc}$ + armónicos en $f_{PWM}$, $2f_{PWM}$… (enlazar con tema 2).</li>
</ul>

<h3>Experiencia práctica</h3>
<ul>
<li><b>Tinkercad Circuits:</b> Arduino + potenciómetro en A0 + LED con 220 Ω en el pin 9. Código: <code>analogWrite(9, analogRead(A0) / 4);</code>. Agregar el osciloscopio de Tinkercad en el pin 9 para ver el ancho de pulso cambiar, y un multímetro en DC para ver el valor medio.</li>
<li><b>Motor:</b> en Tinkercad, motor CC con MOSFET (o transistor TIP120) y diodo 1N4007, como el esquema de la teoría.</li>
<li><b>Filtro RC:</b> agregar R = 10 kΩ y C = 10 µF al pin 9 y medir con el multímetro: la tensión sigue a <code>valor·5/255</code>.</li>
<li><b>Falstad:</b> ejemplo “PWM” o armar un comparador con un generador triangular y una fuente variable; ver la salida filtrada.</li>
</ul>
`,
  });
})();
