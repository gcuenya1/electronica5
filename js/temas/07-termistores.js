/* Tema 07 — Termistores (NTC y PTC)
   IMPORTANTE: los textos con LaTeX usan String.raw`...` para que "\frac" no se rompa.
   Todo va dentro de una IIFE para no ensuciar el ámbito global. */
(() => {
  /* ---------- modelo físico ---------- */
  const K0 = 273.15, T25 = 298.15;
  /** NTC, ecuación Beta: R(T) = R25·exp(B·(1/T − 1/T25)), T en °C a la entrada */
  const Rntc = (tC, R25 = 10000, B = 3950) => R25 * Math.exp(B * (1 / (tC + K0) - 1 / T25));
  /** Inversa de la ecuación Beta: devuelve °C */
  const Tntc = (R, R25 = 10000, B = 3950) => 1 / (1 / T25 + Math.log(R / R25) / B) - K0;
  /** PTC cerámica (conmutadora): casi constante (levemente NTC) hasta Tc; ahí la R se duplica
      y sube ~×1,3 por °C, hasta saturar en ≈ 10 000·R25 */
  function Rptc(tC, R25, Tc) {
    const lnR = Math.log(R25) - 0.006 * (tC - 25) + Math.log(1 + Math.exp((tC - Tc) / 3.5)) - Math.log(1 + Math.exp((25 - Tc) / 3.5));
    const r = Math.exp(Math.min(lnR, 60));
    const rmax = R25 * 1e4;
    return 1 / (1 / r + 1 / rmax);
  }
  const fmtT = (t, d = 1) => H.num(t, d) + ' °C';

  /** Mezcla dos colores hex (t de 0 a 1) */
  function mezcla(a, b, t) {
    t = Math.max(0, Math.min(1, t));
    const pa = [1, 3, 5].map(i => parseInt(a.substr(i, 2), 16)), pb = [1, 3, 5].map(i => parseInt(b.substr(i, 2), 16));
    return 'rgb(' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',') + ')';
  }
  const colorTemp = (t) => t < 0.5 ? mezcla('#2f7fe0', '#f2b52b', t * 2) : mezcla('#f2b52b', '#e0362f', (t - 0.5) * 2);

  /** Termómetro vertical: tubo entre yTop y yBot (centro del bulbo en yBot), escala tmin..tmax */
  function termometro(ctx, cx, yTop, yBot, T, tmin = -20, tmax = 120) {
    const tw = 12, br = 15, y0 = yBot - br - 4;            // y0 = posición de tmin
    const Yt = (t) => y0 - (t - tmin) / (tmax - tmin) * (y0 - yTop - 6);
    const fr = (T - tmin) / (tmax - tmin);
    const c = colorTemp(fr);
    ctx.save();
    ctx.lineWidth = 2; ctx.strokeStyle = H.col('ink'); ctx.fillStyle = H.col('panel2');
    ctx.beginPath();
    ctx.moveTo(cx - tw / 2, yBot - br + 2); ctx.lineTo(cx - tw / 2, yTop + tw / 2);
    ctx.arc(cx, yTop + tw / 2, tw / 2, Math.PI, 0); ctx.lineTo(cx + tw / 2, yBot - br + 2);
    ctx.arc(cx, yBot, br, -Math.PI / 2 + 0.42, -Math.PI / 2 - 0.42 + 2 * Math.PI);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // líquido
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.arc(cx, yBot, br - 4, 0, 7); ctx.fill();
    const yl = Yt(T);
    ctx.fillRect(cx - tw / 2 + 3, yl, tw - 6, yBot - yl);
    // escala
    ctx.strokeStyle = H.col('muted'); ctx.fillStyle = H.col('muted'); ctx.lineWidth = 1;
    ctx.font = '10px sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (let t = tmin; t <= tmax; t += 10) {
      const y = Yt(t), largo = t % 20 === 0;
      ctx.beginPath(); ctx.moveTo(cx - tw / 2 - 2, y); ctx.lineTo(cx - tw / 2 - (largo ? 9 : 5), y); ctx.stroke();
      if (largo) ctx.fillText(t, cx - tw / 2 - 11, y);
    }
    ctx.restore();
  }

  /* ---------- esquemas ---------- */
  function opamp(x, y) {
    return `<path d="M${x} ${y - 30}L${x} ${y + 30}L${x + 60} ${y}Z" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/>` +
      `<text x="${x + 9}" y="${y - 9}" font-size="15" font-weight="700" text-anchor="middle">+</text>` +
      `<text x="${x + 9}" y="${y + 19}" font-size="17" font-weight="700" text-anchor="middle">−</text>`;
  }
  /** Divisor con la NTC arriba o abajo */
  function esqDivisor(pos) {
    const arriba = pos === 'arriba';
    return Esq.svg(240, 205, [
      Esq.borne(90, 18, '+5 V', 0, -8), Esq.cable([[90, 22], [90, 30]]),
      arriba ? Esq.termistor(90, 30, 90, 100, 'NTC', '10 kΩ', -1) : Esq.R(90, 30, 90, 100, 'R fija', '10 kΩ', -1),
      Esq.nodo(90, 100),
      arriba ? Esq.R(90, 100, 90, 170, 'R fija', '10 kΩ', -1) : Esq.termistor(90, 100, 90, 170, 'NTC', '10 kΩ', -1),
      Esq.masa(90, 170),
      Esq.cable([[90, 100], [180, 100]]), Esq.borne(180, 100, 'Vout', 0, -12),
      Esq.texto(180, 150, arriba ? 'más calor → Vout ↑' : 'más calor → Vout ↓', { size: 12, color: arriba ? 'var(--red)' : 'var(--c1)' }),
    ], arriba ? 'NTC arriba (hacia +5 V): al calentarse, la salida sube.' : 'NTC abajo (hacia masa): al calentarse, la salida baja.');
  }
  /** Termostato: NTC + comparador + transistor + ventilador */
  function esqTermostato() {
    return Esq.svg(450, 280, [
      Esq.borne(40, 30, '+5 V', 0, -10), Esq.cable([[44, 30], [410, 30]]),
      Esq.cable([[90, 30], [90, 45]]), Esq.nodo(90, 30),
      Esq.termistor(90, 45, 90, 135, 'NTC', '10 kΩ', -1), Esq.nodo(90, 135),
      Esq.R(90, 135, 90, 225, 'R fija', '10 kΩ', -1), Esq.cable([[90, 225], [90, 245]]),
      Esq.texto(97, 127, 'Vout', { size: 12, color: 'var(--accent)', anchor: 'start' }),
      Esq.cable([[90, 135], [160, 135], [160, 121], [190, 121]]), opamp(190, 135),
      Esq.cable([[190, 149], [165, 149], [165, 175]]), Esq.bat(165, 175, 165, 235, 'Vref', '3 V', 1),
      Esq.cable([[165, 235], [165, 245]]), Esq.nodo(165, 245),
      Esq.texto(222, 182, 'comparador', { size: 11, peso: 400 }),
      Esq.R(250, 135, 320, 135, 'RB', '1 kΩ', 1), Esq.bjt(350, 135, 'NPN', ''),
      Esq.texto(372, 160, 'Q1', { size: 12, anchor: 'start' }),
      Esq.motor(362, 30, 362, 105, 'Ventilador', '5 V', -1), Esq.nodo(362, 30),
      Esq.cable([[362, 105], [410, 105]]), Esq.nodo(362, 105),
      Esq.D(410, 105, 410, 30, 'D', '1N4148', 1),
      Esq.cable([[362, 165], [362, 245]]),
      Esq.cable([[90, 245], [362, 245]]), Esq.nodo(90, 245), Esq.masa(270, 245),
    ], 'Termostato: cuando la temperatura sube, Vout supera Vref, el comparador satura a Q1 y el ventilador arranca. El diodo protege al transistor del pico inductivo del motor.');
  }

  registrarTema({
    id: 'termistores',
    orden: 7,
    titulo: 'Termistores',
    resumen: 'NTC y PTC: resistencias que cambian con la temperatura',
    confirmar: false,

    teoria: String.raw`
<p>Un <b>termistor</b> (de <em>thermal resistor</em>) es una resistencia cuyo valor <b>cambia mucho con la temperatura</b>. Todas las resistencias cambian un poquito con el calor (una de carbón o de metal varía milésimas por grado), pero en el termistor el efecto está buscado y es enorme: una NTC típica cambia alrededor de un <b>4 % por cada grado</b>. Es el sensor de temperatura más barato que hay y está en todos lados: el termómetro digital de fiebre, la heladera, el aire acondicionado, el cargador del celular, la batería de la notebook, la impresora 3D, el auto (sensor de temperatura del agua)…</p>
<p>Como pasa con la LDR (tema siguiente), el termistor <b>no genera tensión</b>: es un componente pasivo. Para “leerlo” hay que meterlo en un circuito, casi siempre un <b>divisor de tensión</b>, que convierte el cambio de resistencia en un cambio de tensión que un Arduino o un comparador pueden medir.</p>

<h2>1. NTC y PTC</h2>
<p>Hay dos grandes familias, según hacia dónde se mueve la resistencia cuando sube la temperatura:</p>
<div class="dos-col">
<div>
<h3>NTC — coeficiente negativo</h3>
<p><b>N</b>egative <b>T</b>emperature <b>C</b>oefficient: <b>la resistencia BAJA cuando la temperatura SUBE</b>. Se fabrican con <b>óxidos metálicos semiconductores</b> (de manganeso, níquel, cobalto, cobre) prensados y sinterizados como una cerámica, en forma de “gotita” de epoxi, disco o encapsulado de vidrio.</p>
<p><b>Por qué baja:</b> en un semiconductor casi todos los electrones están “atados”. El calor es agitación: cuanto más caliente, más electrones logran soltarse y quedan libres para conducir. <b>Más temperatura → más portadores libres → menos resistencia.</b> (Es lo contrario de un metal, donde los electrones ya están libres y el calor sólo los hace chocar más.)</p>
<p>Son <b>las que se usan para medir</b> temperatura.</p>
</div>
<div>
<h3>PTC — coeficiente positivo</h3>
<p><b>P</b>ositive <b>T</b>emperature <b>C</b>oefficient: <b>la resistencia SUBE cuando la temperatura SUBE</b>. Las más comunes son cerámicas de <b>titanato de bario</b> (o polímeros cargados con carbón, las “polyfuse”).</p>
<p>Lo interesante de las PTC cerámicas es que casi no cambian hasta una temperatura llamada <b>temperatura de conmutación o de Curie ($T_c$)</b>, y ahí la resistencia <b>se dispara</b>: puede multiplicarse por 1000 o más en 20 – 30 °C. Funcionan casi como una <b>llave que se abre sola por calor</b>.</p>
<p>Se usan sobre todo como <b>protección</b> y para <b>arranque</b> (ver sección 4).</p>
</div>
</div>
<div class="caja idea"><span class="caja-titulo">Símbolos</span>
Una resistencia (rectángulo) atravesada por una línea con un “codito” (indica que su valor cambia solo, por una magnitud física) y la leyenda <b>−t°</b> (NTC) o <b>+t°</b> (PTC).
${Esq.svg(360, 70, [
  Esq.cable([[20, 36], [60, 36]]), Esq.termistor(60, 36, 130, 36, '', '', 1, 'NTC'), Esq.cable([[130, 36], [160, 36]]),
  Esq.texto(95, 66, 'NTC', { size: 12 }),
  Esq.cable([[200, 36], [240, 36]]), Esq.termistor(240, 36, 310, 36, '', '', 1, 'PTC'), Esq.cable([[310, 36], [340, 36]]),
  Esq.texto(275, 66, 'PTC', { size: 12 }),
])}
</div>
<div class="tabla-wrap"><table class="tabla">
<tr><th></th><th>NTC</th><th>PTC (cerámica)</th></tr>
<tr><td>Si T sube, R…</td><td>baja (de forma suave, exponencial)</td><td>casi no cambia, y al pasar $T_c$ sube bruscamente</td></tr>
<tr><td>Material</td><td>óxidos de Mn, Ni, Co, Cu</td><td>titanato de bario (BaTiO₃) / polímero con carbón</td></tr>
<tr><td>Uso principal</td><td>medir temperatura, compensar, limitar corriente de arranque</td><td>protección contra sobrecorriente (fusible rearmable), arranque de motores, calefactores autorregulados</td></tr>
<tr><td>Valor típico</td><td>10 kΩ a 25 °C (también 2,2 k; 47 k; 100 k)</td><td>de décimas de ohm a cientos de ohms a 25 °C</td></tr>
</table></div>

<h2>2. La curva de la NTC: no es lineal</h2>
<p>La NTC más usada en electrónica de aficionados (la de los kits de Arduino y las impresoras 3D) es la <b>“10 k, B = 3950”</b>: mide 10 kΩ a 25 °C. Mirá cómo cambia:</p>
<div class="tabla-wrap"><table class="tabla">
<tr><th>Temperatura</th><th>−20 °C</th><th>0 °C</th><th>25 °C</th><th>37 °C</th><th>50 °C</th><th>80 °C</th><th>100 °C</th><th>120 °C</th></tr>
<tr><td>R (NTC 10 k, B 3950)</td><td>105 kΩ</td><td>33,6 kΩ</td><td>10,0 kΩ</td><td>5,99 kΩ</td><td>3,59 kΩ</td><td>1,27 kΩ</td><td>698 Ω</td><td>407 Ω</td></tr>
</table></div>
<p>Fijate dos cosas: (1) entre −20 °C y 120 °C la resistencia cambia <b>más de 250 veces</b>; (2) <b>no cambia lo mismo por cada grado</b>: de 0 a 25 °C baja 23,6 kΩ, pero de 75 a 100 °C baja menos de 1 kΩ. Si la graficás en escala lineal, la curva se parece a un tobogán: muy empinada en frío y casi plana en caliente. <b>Es una curva exponencial, no una recta.</b></p>
<div class="caja formula"><span class="caja-titulo">Sensibilidad (coeficiente de temperatura)</span>
<p>Lo que sí es casi constante es el <b>cambio porcentual</b> por grado:</p>
$$\alpha = \frac{1}{R}\frac{dR}{dT} = -\frac{B}{T^2}$$
<p>Con $B = 3950\,\text{K}$ y $T = 298{,}15\,\text{K}$ (25 °C): $\alpha = -\frac{3950}{298{,}15^2} = -0{,}0444 = -4{,}4\,\%/°\text{C}$. A 50 °C baja a −3,8 %/°C. Para comparar: el cobre tiene +0,39 %/°C. <b>La NTC es unas 10 veces más sensible que un metal.</b></p>
</div>

<h2>3. La ecuación Beta</h2>
<p>El fabricante describe la curva con dos números: $R_{25}$ (la resistencia a 25 °C) y la constante $B$ (o $\beta$), en kelvin. Con eso:</p>
<div class="caja formula"><span class="caja-titulo">Ecuación Beta de la NTC</span>
$$R(T) = R_{25}\cdot e^{\,B\left(\frac{1}{T}-\frac{1}{T_{25}}\right)}$$
<ul>
<li>$T$ y $T_{25}$ <b>en kelvin</b>: $T[\text{K}] = T[°\text{C}] + 273{,}15$; $T_{25} = 298{,}15\,\text{K}$.</li>
<li>$B$ típico: 3000 a 4500 K. Cuanto más grande, más sensible (la curva cae más rápido).</li>
</ul>
<p><b>Despejando T</b> (lo que hace el Arduino: mide R y calcula la temperatura):</p>
$$\frac{1}{T} = \frac{1}{T_{25}} + \frac{1}{B}\ln\!\left(\frac{R}{R_{25}}\right)\qquad\Rightarrow\qquad T = \frac{1}{\dfrac{1}{T_{25}} + \dfrac{1}{B}\ln\dfrac{R}{R_{25}}}$$
</div>
<div class="caja ojo"><span class="caja-titulo">El error número uno: usar °C</span>
En la ecuación Beta la temperatura va <b>siempre en kelvin</b>. Si ponés 25 en lugar de 298,15, $1/T$ da cualquier cosa y el resultado no tiene sentido. Al final, para mostrar el resultado, le restás 273,15.
</div>
<div class="caja ejemplo"><span class="caja-titulo">Ejemplo resuelto</span>
NTC de 10 kΩ, B = 3950 K. ¿Cuánto vale a 0 °C? ¿Y a qué temperatura mide 6 kΩ?
<p><b>a) A 0 °C</b> ($T = 273{,}15\,\text{K}$):</p>
$$\frac{1}{273{,}15}-\frac{1}{298{,}15} = 0{,}0036610 - 0{,}0033540 = 0{,}000307\,\text{K}^{-1}$$
$$R = 10\,\text{k}\Omega\cdot e^{3950\cdot0{,}000307} = 10\,\text{k}\Omega\cdot e^{1{,}213} = 10\,\text{k}\Omega\cdot3{,}36 = 33{,}6\,\text{k}\Omega$$
<p><b>b) Con 6 kΩ:</b></p>
$$\frac{1}{T} = 0{,}0033540 + \frac{\ln 0{,}6}{3950} = 0{,}0033540 - 0{,}0001293 = 0{,}0032247 \Rightarrow T = 310{,}1\,\text{K} = 37{,}0\,°\text{C}$$
<p>¡Temperatura del cuerpo humano! Así funciona un termómetro digital de fiebre.</p>
</div>
<div class="caja idea"><span class="caja-titulo">Steinhart–Hart (para más precisión)</span>
La ecuación Beta es una aproximación: es muy buena en un rango de unos 50 °C alrededor de 25 °C, pero se va corriendo de a poco (un error de 1 – 2 °C en los extremos). Cuando se necesita precisión en un rango amplio se usa la <b>ecuación de Steinhart–Hart</b>, con tres coeficientes que se obtienen midiendo la NTC a tres temperaturas:
$$\frac{1}{T} = a + b\ln R + c\,(\ln R)^3$$
La ecuación Beta es el caso particular con $c = 0$. Para la escuela y la mayoría de los proyectos, Beta alcanza y sobra.
</div>

<h2>4. PTC: protección y arranque</h2>
<p>La PTC cerámica tiene una curva muy distinta: plana hasta $T_c$ (típicamente entre 60 y 120 °C) y después un salto de varios órdenes de magnitud. Se aprovecha <b>calentándola con su propia corriente</b>:</p>
<ul>
<li><b>Fusible rearmable (polyfuse):</b> va en serie con la carga. Con corriente normal está fría y tiene muy poca resistencia (no molesta). Si hay un cortocircuito, la corriente alta la calienta ($P = I^2R$), pasa $T_c$, su resistencia se dispara y <b>limita la corriente</b> a un valor chiquito. Cuando sacás el corto y se enfría, <b>vuelve sola a conducir</b>: no hay que cambiar nada. Las tienen los puertos USB de las computadoras, las placas Arduino (la de 500 mA en el USB), los cargadores y las baterías.</li>
<li><b>Arranque de motores:</b> en el compresor de la heladera hay una PTC en serie con el bobinado de arranque. Al encender, está fría y deja pasar corriente (el motor arranca); en uno o dos segundos se calienta, su resistencia sube y “desconecta” ese bobinado.</li>
<li><b>Calefactores autorregulados:</b> un calefactor cerámico o un pegamento termofusible con PTC no se pasa de temperatura: si se calienta de más, su R sube, la potencia $V^2/R$ baja y se estabiliza solo.</li>
<li><b>Protección de motores y transformadores:</b> una PTC pegada al bobinado detecta sobretemperatura y corta (dispara un relé).</li>
</ul>
<div class="caja tip"><span class="caja-titulo">Y la NTC como limitador de arranque</span>
Las fuentes conmutadas de PC tienen a la entrada una NTC grande (un disco negro de algunos ohms). Al enchufar, está fría, su resistencia limita el pico de carga de los capacitores; con el uso se calienta, baja a décimas de ohm y casi no consume. Es el mismo truco al revés.
</div>

<h2>5. Termistor, RTD (PT100) y LM35</h2>
<div class="tabla-wrap"><table class="tabla">
<tr><th></th><th>Termistor NTC</th><th>RTD (PT100)</th><th>LM35 (integrado)</th></tr>
<tr><td>Qué es</td><td>Cerámica semiconductora</td><td>Alambre o película de <b>platino</b>: 100 Ω a 0 °C</td><td>Circuito integrado con 3 patas</td></tr>
<tr><td>Salida</td><td>Resistencia (exponencial)</td><td>Resistencia (casi lineal: +0,385 Ω/°C, 138,5 Ω a 100 °C)</td><td>Tensión lineal: <b>10 mV/°C</b> (250 mV a 25 °C)</td></tr>
<tr><td>Sensibilidad</td><td>Muy alta (−4 %/°C)</td><td>Baja (0,39 %/°C): hay que amplificar</td><td>Media (10 mV/°C, directo al ADC)</td></tr>
<tr><td>Rango típico</td><td>−40 a 125 °C (vidrio: hasta 250 °C)</td><td>−200 a 600 °C</td><td>−55 a 150 °C</td></tr>
<tr><td>Precisión / costo</td><td>±1 °C / muy barato</td><td>±0,3 °C o mejor / caro</td><td>±0,5 °C / barato</td></tr>
<tr><td>Dónde se usa</td><td>Electrodomésticos, baterías, impresoras 3D</td><td>Industria, laboratorio, hornos</td><td>Proyectos escolares, equipos simples</td></tr>
</table></div>
<p>Moraleja: el termistor gana en <b>precio y sensibilidad</b>; la PT100 en <b>precisión y rango</b>; el LM35 en <b>comodidad</b> (ya da una tensión lineal, sin cuentas).</p>

<h2>6. Divisor de tensión con NTC</h2>
<p>Ponemos la NTC en serie con una resistencia fija y sacamos la tensión del punto medio. Igual que con la LDR, según dónde va la NTC el comportamiento <b>se invierte</b>:</p>
<div class="dos-col">
<div>${esqDivisor('arriba')}
$$V_{out}=V_{CC}\cdot\frac{R_{fija}}{R_{fija}+R_{NTC}}$$
<p>Al calentarse, $R_{NTC}$ baja → <b>Vout sube</b>. Es la más intuitiva: “más grados, más volts”.</p>
</div>
<div>${esqDivisor('abajo')}
$$V_{out}=V_{CC}\cdot\frac{R_{NTC}}{R_{fija}+R_{NTC}}$$
<p>Al calentarse, <b>Vout baja</b>. Es la conexión que usan muchos ejemplos de Arduino y placas de impresoras 3D.</p>
</div>
</div>
<div class="caja ejemplo"><span class="caja-titulo">Ejemplo resuelto</span>
NTC 10 kΩ / B 3950 <b>arriba</b>, $R_{fija}=10\,\text{k}\Omega$, $V_{CC}=5\,\text{V}$:
<ul>
<li>0 °C ($R_{NTC}=33{,}6\,\text{k}\Omega$): $V_{out}=5\cdot\frac{10}{10+33{,}6}=1{,}15\,\text{V}$</li>
<li>25 °C ($R_{NTC}=10\,\text{k}\Omega$): $V_{out}=5\cdot\frac{10}{20}=2{,}50\,\text{V}$</li>
<li>50 °C ($R_{NTC}=3{,}59\,\text{k}\Omega$): $V_{out}=5\cdot\frac{10}{10+3{,}59}=3{,}68\,\text{V}$</li>
</ul>
</div>

<h2>7. Leer la temperatura con Arduino</h2>
${Esq.svg(330, 200, [
  Esq.borne(70, 18, '+5 V', 0, -8), Esq.cable([[70, 22], [70, 30]]), Esq.termistor(70, 30, 70, 100, 'NTC', '10 kΩ', -1), Esq.nodo(70, 100),
  Esq.R(70, 100, 70, 170, 'R fija', '10 kΩ', -1), Esq.masa(70, 170),
  Esq.cable([[70, 100], [200, 100]]),
  '<rect x="200" y="60" width="110" height="80" rx="8" fill="none" stroke="currentColor" stroke-width="2"/>',
  Esq.texto(255, 92, 'Arduino', { size: 13 }), Esq.texto(255, 112, 'A0 (ADC 10 bits)', { size: 11, peso: 400 }), Esq.nodo(200, 100),
], 'NTC arriba y R fija a masa: cuanto más caliente, más alto el número de analogRead().')}
<p>El ADC del Arduino UNO es de <b>10 bits</b>: convierte de 0 a 5 V en un número $N$ de <b>0 a 1023</b>. El camino para llegar a la temperatura es <b>de atrás para adelante</b>: número → tensión → resistencia → temperatura.</p>
<div class="caja formula"><span class="caja-titulo">De la lectura a la temperatura (NTC arriba)</span>
<ol>
<li>Tensión: $V_{out} = \dfrac{N\cdot 5\,\text{V}}{1023}$</li>
<li>Resistencia (despejando el divisor): $R_{NTC} = R_{fija}\left(\dfrac{V_{CC}}{V_{out}}-1\right) = R_{fija}\left(\dfrac{1023}{N}-1\right)$</li>
<li>Temperatura (ecuación Beta invertida): $T = \dfrac{1}{\frac{1}{298{,}15}+\frac{1}{B}\ln\frac{R_{NTC}}{R_{25}}} - 273{,}15$ (en °C)</li>
</ol>
<p>Si la NTC va <b>abajo</b>, el paso 2 cambia a $R_{NTC} = R_{fija}\dfrac{N}{1023-N}$.</p>
<p>Fijate algo lindo: la tensión de alimentación se simplifica. Como el ADC mide en proporción a los mismos 5 V que alimentan el divisor (medición <b>ratiométrica</b>), si la fuente es 4,9 V en lugar de 5 V el resultado no cambia.</p>
</div>
<pre class="caja" style="overflow-x:auto;font-size:.85rem"><code style="border:0;background:none;padding:0">const float R_FIJA = 10000.0;   // R fija a masa (NTC arriba)
const float R25 = 10000.0, BETA = 3950.0, T25 = 298.15;
const int pinVentilador = 7;

void setup() { pinMode(pinVentilador, OUTPUT); Serial.begin(9600); }

void loop() {
  int n = analogRead(A0);                        // 0 ... 1023
  float rNTC = R_FIJA * (1023.0 / n - 1.0);      // resistencia de la NTC
  float tK = 1.0 / (1.0 / T25 + log(rNTC / R25) / BETA);
  float tC = tK - 273.15;                        // a grados Celsius
  Serial.println(tC);
  if (tC &gt; 35.0) digitalWrite(pinVentilador, HIGH);        // termostato con
  else if (tC &lt; 33.0) digitalWrite(pinVentilador, LOW);    // histéresis de 2 °C
  delay(500);
}</code></pre>
<div class="caja ejemplo"><span class="caja-titulo">¿Qué temperatura es analogRead = 600?</span>
$V_{out}=\frac{600\cdot5}{1023}=2{,}93\,\text{V}$. $R_{NTC}=10\,\text{k}\Omega\left(\frac{1023}{600}-1\right)=10\,\text{k}\Omega\cdot0{,}705=7{,}05\,\text{k}\Omega$.<br>
$\frac{1}{T}=0{,}0033540+\frac{\ln 0{,}705}{3950}=0{,}0033540-0{,}0000885=0{,}0032655\Rightarrow T=306{,}2\,\text{K}=33{,}1\,°\text{C}$.
</div>
<div class="caja ojo"><span class="caja-titulo">La resolución no es pareja</span>
Como la curva no es lineal, cada “cuenta” del ADC equivale a distinta cantidad de grados. Con 10 kΩ + 10 kΩ, cerca de 25 °C la lectura cambia unas <b>11 cuentas por grado</b> (resolución ≈ 0,09 °C), pero a 100 °C apenas <b>1,8 cuentas por grado</b> (≈ 0,6 °C por cuenta). Por eso la R fija se elige según el rango que interesa.
</div>

<h2>8. Linealizar: elegir bien la resistencia fija</h2>
<p>La NTC sola es muy no lineal, pero <b>el divisor la “endereza” bastante</b>. La curva de $V_{out}$ contra $T$ tiene forma de “S” acostada: plana en los extremos y casi recta en el medio. La zona más recta (y además la más sensible, donde Vout cambia más por grado) queda alrededor de la temperatura en la que $R_{NTC}=R_{fija}$, o sea donde $V_{out}=V_{CC}/2$.</p>
<div class="caja formula"><span class="caja-titulo">Regla práctica</span>
<p>Para medir entre $T_1$ y $T_2$, elegí $R_{fija}$ igual a la resistencia de la NTC <b>a la temperatura media</b> del rango:</p>
$$R_{fija} \approx R_{NTC}\!\left(\frac{T_1+T_2}{2}\right)$$
<p>Ejemplo: para 0 – 50 °C, temperatura media 25 °C → $R_{fija} = 10\,\text{k}\Omega$. Para una impresora 3D (150 – 250 °C) se necesita una R fija mucho menor (en las placas suele ser 4,7 kΩ con NTC de 100 k).</p>
</div>
<div class="caja ejemplo"><span class="caja-titulo">¿Qué tan recta queda?</span>
Con 10 k + 10 k, ya calculamos 1,15 V a 0 °C, 2,50 V a 25 °C y 3,68 V a 50 °C. Si fuera una recta perfecta, a 25 °C daría el promedio de los extremos: $\frac{1{,}15+3{,}68}{2}=2{,}41\,\text{V}$. La diferencia es de solo 0,09 V (equivale a ≈ 1,7 °C): ¡bastante recta para una curva exponencial! Si se acepta ese error, se podría usar directamente una fórmula lineal sin logaritmos.
</div>
<div class="caja idea"><span class="caja-titulo">Para el que quiere más</span>
El punto de inflexión exacto de la “S” (máxima linealidad) se logra con $R_{fija}=R_{NTC}(T_m)\cdot\frac{B-2T_m}{B+2T_m}$ ($T_m$ en kelvin). Con B = 3950 y 25 °C da 7,4 kΩ: la regla práctica de usar 10 kΩ queda muy cerca.
</div>

<h2>9. Autocalentamiento</h2>
<p>Para medir la NTC le hacemos circular corriente, y esa corriente <b>la calienta</b> ($P = I^2 R$). El termistor termina midiendo un poquito más que el ambiente. El fabricante da la <b>constante de disipación</b> $\delta$: cuántos mW hacen falta para calentarla 1 °C por encima del ambiente (típico: 1 a 2 mW/°C en aire quieto para una gotita de epoxi).</p>
$$\Delta T = \frac{P}{\delta}$$
<div class="caja ejemplo"><span class="caja-titulo">Ejemplo</span>
NTC de 10 kΩ con R fija de 10 kΩ y 5 V, a 25 °C: $I = \frac{5}{20\,\text{k}\Omega}=0{,}25\,\text{mA}$, $P = (0{,}25\,\text{mA})^2\cdot10\,\text{k}\Omega = 0{,}625\,\text{mW}$. Con $\delta = 1{,}5\,\text{mW/°C}$: $\Delta T = 0{,}42\,°\text{C}$ de error. Aceptable para un termostato, molesto para un termómetro clínico.
</div>
<div class="caja tip"><span class="caja-titulo">Cómo achicarlo</span>
Usar NTC de valor alto (100 kΩ), alimentar el divisor con menos tensión (3,3 V), o alimentarlo solo en el momento de medir (desde un pin digital del Arduino). En la PTC de protección pasa lo contrario: el autocalentamiento <b>es</b> el principio de funcionamiento.
</div>

<h2>10. Aplicación: termostato que prende un ventilador</h2>
${esqTermostato()}
<ul>
<li>La NTC va <b>arriba</b>: al subir la temperatura, $V_{out}$ sube.</li>
<li>El <b>comparador</b> (LM393, o un LM358 usado como comparador) compara $V_{out}$ (entrada +) con $V_{ref}$ (entrada −). Si $V_{out} > V_{ref}$ la salida va a alto, satura a Q1 y el ventilador arranca.</li>
<li>¿A qué temperatura? Cuando $V_{out}=V_{ref}$. Con $V_{ref}=3\,\text{V}$: $R_{NTC}=10\,\text{k}\Omega\left(\frac{5}{3}-1\right)=6{,}67\,\text{k}\Omega$, que en la NTC 10 k / B 3950 corresponde a <b>≈ 34,5 °C</b>. En la práctica $V_{ref}$ sale de un preset para poder ajustar el punto.</li>
<li>El <b>diodo en paralelo con el motor</b> (diodo “volante” o de rueda libre) es obligatorio: al cortar la corriente de una bobina aparece un pico de tensión que quemaría al transistor.</li>
<li>Si el ventilador consume más de unos 100 mA, conviene un transistor más grande (TIP120) o un MOSFET de nivel lógico.</li>
</ul>
<div class="caja ojo"><span class="caja-titulo">Sin histéresis, el ventilador “tartamudea”</span>
Justo en el umbral, el ventilador arranca, enfría un poquito, la temperatura baja una décima, se apaga, vuelve a subir… y queda prendiendo y apagando muy seguido (y cualquier ruido lo empeora). La solución es la <b>histéresis</b>: dos umbrales distintos, por ejemplo <b>prende a 35 °C y apaga a 33 °C</b>. En el circuito analógico se logra con una resistencia de la salida a la entrada + (disparador Schmitt); en el Arduino, con el <code>if / else if</code> de dos valores que viste en el código. Los termostatos de heladera, estufa y aire acondicionado funcionan todos así.
</div>
`,

    simulaciones: [
      {
        titulo: 'Curva del termistor: resistencia vs. temperatura',
        descripcion: 'Mové la temperatura y mirá cómo se mueve el punto sobre la curva. Compará una NTC (baja suave, exponencial) con una PTC cerámica (casi plana hasta Tc y después se dispara). Cambiá R25 y B.',
        montar(cont, H) {
          const { controles, vista } = H.layout(cont);
          const temp = H.slider(controles, { label: 'Temperatura', min: -20, max: 120, step: 0.5, value: 25, fmt: v => fmtT(v), onInput: upd });
          const tipo = H.select(controles, { label: 'Tipo de termistor', opciones: [{ v: 'NTC', t: 'NTC (coeficiente negativo)' }, { v: 'PTC', t: 'PTC cerámica (conmutadora)' }], value: 'NTC', onChange: upd });
          H.sep(controles);
          H.titulo(controles, 'Parámetros');
          const r25 = H.slider(controles, { label: 'R25 (a 25 °C)', min: 100, max: 100000, log: true, value: 10000, unidad: 'Ω', onInput: upd });
          const bb = H.slider(controles, { label: 'B (constante Beta)', min: 3000, max: 4500, step: 50, value: 3950, fmt: v => H.num(v, 0) + ' K', onInput: upd });
          const tc = H.slider(controles, { label: 'Tc (temperatura de conmutación)', min: 50, max: 110, step: 1, value: 80, fmt: v => fmtT(v, 0), onInput: upd });
          const logy = H.check(controles, { label: 'Eje de R en escala logarítmica', value: false, onChange: upd });
          const tang = H.check(controles, { label: 'Mostrar recta tangente en el punto', value: true, onChange: upd });
          const cv = H.canvas(vista, { alto: w => w >= 560 ? 340 : 500, dibujar });
          const lec = H.lecturas(vista);
          const nota = H.nota(vista);

          const Rf = (t) => tipo.value === 'NTC' ? Rntc(t, r25.value, bb.value) : Rptc(t, r25.value, tc.value);

          function dibujar(ctx, w, h) {
            const T = temp.value, R = Rf(T), ntc = tipo.value === 'NTC';
            const ancho = w >= 560;
            // panel del termómetro
            const pw = ancho ? 150 : w, ph = ancho ? h : 150;
            ctx.save();
            ctx.fillStyle = H.col('panel2'); ctx.fillRect(0, 0, pw, ph);
            ctx.restore();
            const tx = ancho ? 62 : 50;
            termometro(ctx, tx, 14, ph - 22, T);
            ctx.save();
            ctx.fillStyle = H.col('ink'); ctx.textBaseline = 'top';
            if (ancho) {
              ctx.textAlign = 'left'; ctx.font = '700 15px sans-serif';
              ctx.fillText(fmtT(T), 86, 40);
              ctx.font = '600 11px sans-serif'; ctx.fillStyle = H.col('muted'); ctx.fillText(tipo.value, 86, 62);
              ctx.fillStyle = H.col('c1'); ctx.font = '700 14px sans-serif';
              ctx.fillText('R =', 86, 92); ctx.fillText(H.fmt(R, 'Ω'), 86, 110);
            } else {
              ctx.textAlign = 'left'; ctx.font = '700 22px sans-serif';
              ctx.fillText(fmtT(T), 110, 30);
              ctx.font = '600 12px sans-serif'; ctx.fillStyle = H.col('muted'); ctx.fillText(ntc ? 'NTC' : 'PTC', 110, 60);
              ctx.fillStyle = H.col('c1'); ctx.font = '700 20px sans-serif'; ctx.fillText('R = ' + H.fmt(R, 'Ω'), 110, 86);
            }
            ctx.restore();
            // rango de R
            let rmin = Infinity, rmax = 0;
            for (let t = -20; t <= 120; t += 1) { const r = Rf(t); rmin = Math.min(rmin, r); rmax = Math.max(rmax, r); }
            const lg = logy.value;
            let ymin, ymax, yfmt, yv;
            if (lg) {
              ymin = Math.floor(Math.log10(rmin)); ymax = Math.ceil(Math.log10(rmax));
              if (ymax - ymin < 2) ymax = ymin + 2;
              yfmt = t => H.fmt(Math.pow(10, t), 'Ω', 2); yv = r => Math.log10(r);
            } else {
              const top = ntc ? rmax : r25.value * 20;
              const tk = H.ticks(0, top * 1.05, 5);
              ymin = 0; ymax = tk[tk.length - 1] < top ? tk[tk.length - 1] + (tk[1] - tk[0]) : tk[tk.length - 1];
              yfmt = t => H.fmt(t, 'Ω', 2); yv = r => r;
            }
            const yticks = lg ? Array.from({ length: ymax - ymin + 1 }, (_, i) => ymin + i) : undefined;
            const P = H.ejes(ctx, w, h, {
              x0: ancho ? pw + 62 : 58, y0: ancho ? 14 : ph + 16, w: ancho ? w - pw - 76 : w - 72, h: ancho ? h - 50 : h - ph - 52,
              xmin: -20, xmax: 120, xticks: ancho ? [-20, 0, 20, 40, 60, 80, 100, 120] : [-20, 20, 60, 100], xfmt: t => t + ' °C',
              ymin, ymax, yticks, yfmt, ylabel: 'R (' + tipo.value + ')',
            });
            ctx.save(); ctx.fillStyle = H.col('muted'); ctx.font = '600 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            ctx.fillText('temperatura', P.x0 + P.w / 2, P.y0 + P.h + 18); ctx.restore();
            P.vline(25, { color: H.col('amber'), label: '25 °C', labelY: ymax });
            if (!ntc) P.vline(tc.value, { color: H.col('red'), label: 'Tc', labelY: ymax - (ymax - ymin) * 0.12 });
            if (!lg && ntc) P.hline(r25.value, { color: H.col('amber'), guiones: [2, 4] });
            P.fn(t => yv(Rf(t)), { color: ntc ? H.col('c1') : H.col('c3'), ancho: 2.5 });
            if (tang.value) {
              const d = 0.05, m = (yv(Rf(T + d)) - yv(Rf(T - d))) / (2 * d), y0 = yv(R);
              P.fn(t => y0 + m * (t - T), { color: H.col('muted'), ancho: 1.4, guiones: [6, 4], desde: Math.max(-20, T - 40), hasta: Math.min(120, T + 40) });
            }
            // líneas guía al punto
            P.clip(() => {
              ctx.strokeStyle = H.col('c2'); ctx.globalAlpha = 0.5; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
              ctx.beginPath(); ctx.moveTo(P.X(T), P.Y(ymin)); ctx.lineTo(P.X(T), P.Y(yv(R))); ctx.lineTo(P.X(-20), P.Y(yv(R))); ctx.stroke();
            });
            P.punto(T, yv(R), { color: H.col('c2'), r: 6 });
          }

          function upd() {
            const ntc = tipo.value === 'NTC', T = temp.value, R = Rf(T);
            bb.el.style.display = ntc ? '' : 'none';
            tc.el.style.display = ntc ? 'none' : '';
            cv.redibujar();
            const d = 0.05, alfa = (Rf(T + d) - Rf(T - d)) / (2 * d) / R;
            lec.set([
              { k: 'Temperatura', v: fmtT(T) + ' = ' + H.num(T + K0, 2) + ' K' },
              { k: 'Resistencia', v: H.fmt(R, 'Ω'), estado: 'ok' },
              { k: 'R / R25', v: H.num(R / r25.value, R / r25.value < 0.1 ? 3 : 2) },
              { k: 'Sensibilidad α', v: (alfa > 0 ? '+' : '') + H.num(alfa * 100, 2) + ' %/°C' },
              { k: 'Cambio por °C', v: H.fmt(alfa * R, 'Ω') + '/°C' },
            ]);
            let txt;
            if (ntc) {
              txt = `<b>NTC:</b> al subir la temperatura la resistencia <b>baja</b>. La ecuación Beta da R = R25·e<sup>B(1/T − 1/298,15)</sup> con T en kelvin. `;
              txt += T < 25 ? `En frío la curva es muy empinada: cada grado cambia ${H.fmt(Math.abs(alfa * R), 'Ω')}.` : `En caliente la curva se aplana: ahora cada grado cambia solo ${H.fmt(Math.abs(alfa * R), 'Ω')}, aunque en porcentaje sigue siendo ≈ ${H.num(Math.abs(alfa * 100), 1)} %.`;
              txt += ' La recta tangente (punteada) se separa enseguida de la curva: <b>no es lineal</b>. Probá el eje logarítmico: la curva se vuelve casi una recta, porque es una exponencial.';
            } else {
              txt = `<b>PTC cerámica:</b> casi constante (incluso baja un poquito) hasta Tc = ${fmtT(tc.value, 0)}. Al pasar Tc la resistencia se <b>dispara</b> (×1,3 por grado, más de ×1000 en 30 °C). `;
              txt += T > tc.value + 5 ? 'Estás en la zona “abierta”: si fuera un fusible rearmable, ahora estaría limitando la corriente.' : 'Por debajo de Tc conduce normalmente: es la zona de trabajo de un fusible rearmable.';
              txt += logy.value ? '' : ' Con eje lineal el salto se sale del gráfico: activá la escala logarítmica para verlo entero.';
            }
            nota.innerHTML = txt;
          }
          upd();
        },
      },
      {
        titulo: 'NTC en un divisor + Arduino + termostato',
        descripcion: 'NTC 10 kΩ / B 3950 en un divisor con VCC = 5 V. Mirá la tensión de salida, la lectura del ADC (0–1023), la temperatura que calcula el Arduino y un termostato que prende un ventilador con histéresis.',
        montar(cont, H) {
          const { controles, vista } = H.layout(cont);
          const VCC = 5;
          const temp = H.slider(controles, { label: 'Temperatura', min: -20, max: 120, step: 0.5, value: 25, fmt: v => fmtT(v), onInput: () => { auto.value = false; upd(); } });
          const auto = H.check(controles, { label: 'Ambiente automático (se calienta solo; el ventilador lo enfría)', value: false, onChange: upd });
          H.sep(controles);
          const pos = H.select(controles, { label: 'Posición de la NTC', opciones: [{ v: 'arriba', t: 'NTC arriba (entre +5 V y Vout)' }, { v: 'abajo', t: 'NTC abajo (entre Vout y masa)' }], value: 'arriba', onChange: upd });
          const rf = H.slider(controles, { label: 'R fija', min: 1000, max: 100000, log: true, value: 10000, unidad: 'Ω', onInput: upd });
          H.sep(controles);
          H.titulo(controles, 'Termostato (en el Arduino)');
          const ton = H.slider(controles, { label: 'Prende el ventilador a', min: 20, max: 90, step: 0.5, value: 35, fmt: v => fmtT(v), onInput: upd });
          const hist = H.slider(controles, { label: 'Histéresis', min: 0, max: 6, step: 0.5, value: 2, fmt: v => H.num(v, 1) + ' °C', onInput: upd });
          const cv = H.canvas(vista, { alto: w => w >= 560 ? 380 : 580, dibujar });
          const lec = H.lecturas(vista);
          const nota = H.nota(vista);

          let fan = false, ang = 0, tPrev = 0;
          const hist0 = [];          // historial de temperatura [t, T, fan]
          let tiempo = 0;

          const vout = (t, r = rf.value) => {
            const rn = Rntc(t);
            return pos.value === 'arriba' ? VCC * r / (r + rn) : VCC * rn / (r + rn);
          };
          const adc = (v) => Math.max(0, Math.min(1023, Math.round(1023 * v / VCC)));
          function tDesdeN(N) {
            if (N <= 0 || N >= 1023) return NaN;
            const rn = pos.value === 'arriba' ? rf.value * (1023 / N - 1) : rf.value * N / (1023 - N);
            return Tntc(rn);
          }
          function termostato() {
            const Tm = tDesdeN(adc(vout(temp.value)));
            const T = Number.isFinite(Tm) ? Tm : temp.value;
            const toff = ton.value - hist.value;
            if (hist.value === 0) fan = T >= ton.value;
            else if (T >= ton.value) fan = true;
            else if (T <= toff) fan = false;
          }

          H.loop((t) => {
            const dt = Math.min(0.1, t - tPrev); tPrev = t;
            if (fan) ang += dt * 14;
            if (auto.value) {
              tiempo += dt;
              const objetivo = fan ? ton.value - 15 : ton.value + 15;   // sin ventilador se calienta, con ventilador se enfría
              temp.value = Math.max(-20, Math.min(120, temp.value + (objetivo - temp.value) * dt / 6));
              upd(true);
            } else if (fan) cv.redibujar();
          });

          function dibujar(ctx, w, h) {
            const T = temp.value, Vo = vout(T), N = adc(Vo);
            const ancho = w >= 560;
            const sw = ancho ? 150 : w, hHist = 84;
            const sh = ancho ? h - hHist - 8 : 140;
            // ---- panel del ventilador ----
            ctx.save();
            ctx.fillStyle = H.col('panel2'); ctx.fillRect(0, 0, sw, sh);
            const cx = sw / 2, cy = ancho ? sh * 0.42 : sh * 0.5, rr = Math.min(sw, sh) * (ancho ? 0.3 : 0.32);
            const fx = ancho ? cx : sw * 0.3;
            ctx.strokeStyle = H.col('ink'); ctx.lineWidth = 2;
            ctx.strokeRect(fx - rr - 6, cy - rr - 6, 2 * rr + 12, 2 * rr + 12);
            ctx.beginPath(); ctx.arc(fx, cy, rr + 2, 0, 7); ctx.stroke();
            ctx.fillStyle = fan ? H.col('c1') : H.col('muted');
            for (let k = 0; k < 5; k++) {
              const a = ang + k * 2 * Math.PI / 5;
              ctx.beginPath();
              ctx.ellipse(fx + Math.cos(a) * rr * 0.55, cy + Math.sin(a) * rr * 0.55, rr * 0.42, rr * 0.17, a + 0.5, 0, 7);
              ctx.fill();
            }
            ctx.fillStyle = H.col('ink'); ctx.beginPath(); ctx.arc(fx, cy, rr * 0.18, 0, 7); ctx.fill();
            if (fan) {   // líneas de aire
              ctx.strokeStyle = H.col('c1'); ctx.globalAlpha = 0.5; ctx.lineWidth = 1.5;
              for (let k = 0; k < 3; k++) {
                const off = ((ang * 8 + k * 12) % 36);
                const yy = cy - rr * 0.6 + k * rr * 0.6;
                const xa = fx + rr + 10 + off * 0.5;
                if (xa + 14 < sw) { ctx.beginPath(); ctx.moveTo(xa, yy); ctx.lineTo(xa + 14, yy); ctx.stroke(); }
              }
              ctx.globalAlpha = 1;
            }
            ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            const lx = ancho ? cx : sw * 0.68;
            const ly = ancho ? cy + rr + 16 : 22;
            ctx.font = '700 13px sans-serif'; ctx.fillStyle = fan ? H.col('green') : H.col('muted');
            ctx.fillText(fan ? 'VENTILADOR ON' : 'ventilador off', lx, ly);
            ctx.font = '700 ' + (ancho ? 18 : 22) + 'px sans-serif'; ctx.fillStyle = colorTemp((T + 20) / 140);
            ctx.fillText(fmtT(T), lx, ly + 20);
            ctx.font = '600 11px sans-serif'; ctx.fillStyle = H.col('muted');
            ctx.fillText('analogRead = ' + N, lx, ly + (ancho ? 44 : 50));
            ctx.fillText('Arduino: ' + (Number.isFinite(tDesdeN(N)) ? fmtT(tDesdeN(N), 2) : '—'), lx, ly + (ancho ? 60 : 66));
            ctx.restore();
            // ---- gráfico Vout vs T ----
            const gx = ancho ? sw + 52 : 48, gy = ancho ? 14 : sh + 14;
            const gw = ancho ? w - sw - 52 - 44 : w - 48 - 40;
            const gh = (ancho ? h - hHist - 8 : h - hHist - 8 - sh) - 14 - 40;
            const P = H.ejes(ctx, w, h, {
              x0: gx, y0: gy, w: gw, h: gh, xmin: -20, xmax: 120, xticks: ancho ? [-20, 0, 20, 40, 60, 80, 100, 120] : [-20, 20, 60, 100], xfmt: t => t + ' °C',
              ymin: 0, ymax: 5, yticks: [0, 1, 2, 3, 4, 5], yfmt: t => t + ' V', ylabel: 'Vout',
            });
            ctx.save(); ctx.fillStyle = H.col('muted'); ctx.font = '10px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
            [0, 1, 2, 3, 4, 5].forEach(v => ctx.fillText(String(Math.round(1023 * v / 5)), gx + gw + 4, P.Y(v)));
            ctx.font = '600 10px sans-serif'; ctx.textBaseline = 'top'; ctx.fillText('ADC', gx + gw + 4, gy + gh + 14);
            ctx.font = '600 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            ctx.fillText('temperatura', gx + gw / 2, gy + gh + 18);
            ctx.restore();
            // zona lineal: pendiente ≥ 80 % de la máxima
            const der = (t) => (vout(t + 0.1) - vout(t - 0.1)) / 0.2;
            let smax = 0, tinf = 25;
            for (let t = -20; t <= 120; t += 0.25) { const s = Math.abs(der(t)); if (s > smax) { smax = s; tinf = t; } }
            P.clip(() => {
              ctx.fillStyle = H.col('green'); ctx.globalAlpha = 0.10;
              for (let t = -20; t < 120; t += 0.5) if (Math.abs(der(t + 0.25)) >= 0.8 * smax) ctx.fillRect(P.X(t), P.y0, P.X(t + 0.5) - P.X(t) + 0.5, P.h);
            });
            // banda de histéresis
            const toff = ton.value - hist.value;
            if (hist.value > 0) P.clip(() => { ctx.fillStyle = H.col('amber'); ctx.globalAlpha = 0.16; ctx.fillRect(P.X(toff), P.y0, P.X(ton.value) - P.X(toff), P.h); });
            P.vline(ton.value, { color: H.col('red'), label: 'ON', labelY: 5 });
            if (hist.value > 0) P.vline(toff, { color: H.col('c1'), label: 'OFF', labelY: 4.55 });
            // tangente en el punto de máxima pendiente
            const v0 = vout(tinf), m = der(tinf);
            P.fn(t => v0 + m * (t - tinf), { color: H.col('muted'), ancho: 1.3, guiones: [6, 4] });
            P.fn(t => vout(t), { color: H.col('c3'), ancho: 2.5 });
            // punto y guía al eje ADC
            P.clip(() => {
              ctx.strokeStyle = H.col('c2'); ctx.globalAlpha = 0.55; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
              ctx.beginPath(); ctx.moveTo(P.X(T), P.Y(0)); ctx.lineTo(P.X(T), P.Y(Vo)); ctx.lineTo(P.X(120), P.Y(Vo)); ctx.stroke();
            });
            P.punto(T, Vo, { color: fan ? H.col('red') : H.col('c2'), r: 6 });
            // ---- historial ----
            const hy = h - hHist + 4, hx = ancho ? 52 : 48;
            const tmin = Math.min(ton.value - 18, ...hist0.map(p => p[1])), tmax = Math.max(ton.value + 18, ...hist0.map(p => p[1]));
            const Q = H.ejes(ctx, w, h, {
              x0: hx, y0: hy, w: w - hx - 44, h: hHist - 26, xmin: -30, xmax: 0, xticks: [-30, -20, -10, 0], xfmt: t => t ? t + ' s' : 'ahora',
              ymin: Math.floor(tmin / 10) * 10, ymax: Math.ceil(tmax / 10) * 10, ny: 2, yfmt: t => t + '°',
            });
            Q.hline(ton.value, { color: H.col('red'), guiones: [3, 3] });
            if (hist.value > 0) Q.hline(toff, { color: H.col('c1'), guiones: [3, 3] });
            if (hist0.length > 1) {
              const t1 = hist0[hist0.length - 1][0];
              Q.clip(() => {
                ctx.fillStyle = H.col('c1'); ctx.globalAlpha = 0.18;
                for (let i = 1; i < hist0.length; i++) if (hist0[i][2]) ctx.fillRect(Q.X(hist0[i - 1][0] - t1), Q.y0, Q.X(hist0[i][0] - t1) - Q.X(hist0[i - 1][0] - t1) + 0.5, Q.h);
              });
              Q.pts(hist0.map(p => [p[0] - t1, p[1]]), { color: H.col('c3'), ancho: 2 });
            } else {
              Q.texto(-15, Math.ceil(tmax / 10) * 10, 'Activá “ambiente automático” para ver el historial', { color: H.col('muted'), font: '11px sans-serif', align: 'center', base: 'top', dy: 3 });
            }
          }

          function upd(desdeLoop) {
            const T = temp.value, Vo = vout(T), N = adc(Vo), Tm = tDesdeN(N), rn = Rntc(T);
            termostato();
            if (auto.value) { hist0.push([tiempo, T, fan]); while (hist0.length && hist0[0][0] < tiempo - 31) hist0.shift(); }
            else if (desdeLoop !== true && hist0.length) { hist0.length = 0; tiempo = 0; }
            cv.redibujar();
            if (desdeLoop === true && Math.round(tiempo * 10) % 3) return;   // lecturas: ~3 veces por segundo
            const dNdT = Math.abs(1023 * (vout(T + 0.05) - vout(T - 0.05)) / VCC / 0.1);
            const toff = ton.value - hist.value;
            const Non = adc(vout(ton.value));
            lec.set([
              { k: 'R de la NTC', v: H.fmt(rn, 'Ω') },
              { k: 'Vout', v: H.fmt(Vo, 'V') },
              { k: 'analogRead()', v: String(N) },
              { k: 'T calculada', v: Number.isFinite(Tm) ? fmtT(Tm, 2) : '— (fuera de rango)', estado: Number.isFinite(Tm) && Math.abs(Tm - T) < 0.5 ? 'ok' : 'alerta' },
              { k: 'Resolución', v: dNdT > 0.01 ? H.num(1 / dNdT, 2) + ' °C/cuenta' : '—', estado: dNdT >= 5 ? 'ok' : dNdT >= 2 ? '' : 'mal' },
              { k: 'Ventilador', v: fan ? 'ON' : 'OFF', estado: fan ? 'ok' : '' },
              { k: 'Umbral ON en cuentas', v: String(Non) },
            ]);
            // temperatura donde R_NTC = R fija
            const tIgual = Tntc(rf.value);
            let txt = pos.value === 'arriba'
              ? `<b>NTC arriba:</b> al calentarse R<sub>NTC</sub> baja y <b>Vout sube</b>. `
              : `<b>NTC abajo:</b> al calentarse R<sub>NTC</sub> baja y <b>Vout baja</b> (curva descendente). `;
            txt += `La curva tiene forma de “S”: la zona verde es la más <b>lineal y sensible</b>, y queda alrededor de ${fmtT(tIgual, 0)}, donde R<sub>NTC</sub> = R fija = ${H.fmt(rf.value, 'Ω')} y Vout = 2,5 V. `;
            txt += `Ahí cada grado mueve muchas cuentas del ADC; lejos de esa zona la resolución empeora (ahora: ${H.num(dNdT, 1)} cuentas por °C). Probá subir R fija: la zona útil se corre a temperaturas más bajas. `;
            if (hist.value > 0) txt += `<b>Termostato:</b> prende a ${fmtT(ton.value)} y recién apaga a ${fmtT(toff)} (banda amarilla). Con el ambiente automático mirá cómo la temperatura oscila dentro de esa banda.`;
            else txt += `<b>Sin histéresis</b> el ventilador prende y apaga en el mismo valor: activá el ambiente automático y fijate qué seguido conmuta.`;
            nota.innerHTML = txt;
          }
          upd();
        },
      },
    ],

    ejercicios: [
      {
        nivel: 'Básico',
        enunciado: String.raw`Una NTC tiene $R_{25}=10\,\text{k}\Omega$ y $B=3950\,\text{K}$. Calculá su resistencia a 0 °C y a 50 °C. ¿Cuántas veces cambia entre esas dos temperaturas?`,
        pista: String.raw`Pasá a kelvin: $T = t + 273{,}15$. Usá $R = R_{25}\,e^{B\left(\frac{1}{T}-\frac{1}{298{,}15}\right)}$.`,
        solucion: String.raw`<b>0 °C</b> → $T=273{,}15\,\text{K}$: $\frac{1}{273{,}15}-\frac{1}{298{,}15}=0{,}0003070$; $B\cdot0{,}0003070=1{,}213$; $R=10\,\text{k}\Omega\cdot e^{1{,}213}=10\cdot3{,}362=33{,}6\,\text{k}\Omega$.<br>
<b>50 °C</b> → $T=323{,}15\,\text{K}$: $\frac{1}{323{,}15}-\frac{1}{298{,}15}=-0{,}0002595$; $B\cdot(-0{,}0002595)=-1{,}025$; $R=10\,\text{k}\Omega\cdot e^{-1{,}025}=10\cdot0{,}359=3{,}59\,\text{k}\Omega$.<br>
Cambia $33{,}6/3{,}59\approx 9{,}4$ veces en solo 50 °C.`,
      },
      {
        nivel: 'Básico',
        enunciado: String.raw`Medís con el multímetro la NTC del ejercicio anterior (10 kΩ, B = 3950) metida en un vaso de agua y da $25\,\text{k}\Omega$. ¿A qué temperatura está el agua?`,
        pista: String.raw`$\frac{1}{T}=\frac{1}{298{,}15}+\frac{1}{B}\ln\frac{R}{R_{25}}$. Como R es mayor que $R_{25}$, tiene que estar más fría que 25 °C.`,
        solucion: String.raw`$\ln\frac{25}{10}=\ln 2{,}5=0{,}9163$; $\frac{0{,}9163}{3950}=0{,}0002320$.<br>
$\frac{1}{T}=0{,}0033540+0{,}0002320=0{,}0035860\Rightarrow T=278{,}9\,\text{K}$.<br>
$t = 278{,}9-273{,}15=5{,}7\,°\text{C}$: agua bien fría (de heladera).`,
      },
      {
        nivel: 'Intermedio',
        enunciado: String.raw`Un Arduino UNO lee una NTC (10 kΩ, B = 3950) conectada <b>arriba</b> (a 5 V) con una resistencia de 10 kΩ a masa; el punto medio va a A0. El monitor serie muestra <code>analogRead = 700</code>. ¿Qué tensión hay en A0, cuánto vale la NTC y qué temperatura hay?`,
        pista: String.raw`$V=\frac{N\cdot5}{1023}$; $R_{NTC}=R_{fija}\left(\frac{1023}{N}-1\right)$; después la ecuación Beta invertida.`,
        solucion: String.raw`$V=\frac{700\cdot5}{1023}=3{,}42\,\text{V}$.<br>
$R_{NTC}=10\,\text{k}\Omega\left(\frac{1023}{700}-1\right)=10\,\text{k}\Omega\cdot0{,}4614=4{,}61\,\text{k}\Omega$.<br>
$\ln 0{,}4614=-0{,}7734$; $\frac{-0{,}7734}{3950}=-0{,}0001958$; $\frac{1}{T}=0{,}0033540-0{,}0001958=0{,}0031582\Rightarrow T=316{,}6\,\text{K}=43{,}5\,°\text{C}$.`,
      },
      {
        nivel: 'Intermedio',
        enunciado: String.raw`Tenés una NTC sin hoja de datos. La medís a 25 °C y da $10{,}0\,\text{k}\Omega$; en agua a 50 °C da $3{,}60\,\text{k}\Omega$. Calculá su constante B y estimá cuánto medirá a 80 °C.`,
        pista: String.raw`De la ecuación Beta: $B=\dfrac{\ln(R_1/R_2)}{\frac{1}{T_1}-\frac{1}{T_2}}$ (temperaturas en kelvin).`,
        solucion: String.raw`$\ln\frac{10}{3{,}6}=\ln 2{,}778=1{,}0217$. $\frac{1}{298{,}15}-\frac{1}{323{,}15}=0{,}0033540-0{,}0030945=0{,}0002595$.<br>
$B=\frac{1{,}0217}{0{,}0002595}\approx 3937\,\text{K}$ (muy parecida a una “3950”).<br>
A 80 °C ($353{,}15\,\text{K}$): $\frac{1}{353{,}15}-\frac{1}{298{,}15}=-0{,}0005224$; $R=10\,\text{k}\Omega\cdot e^{3937\cdot(-0{,}0005224)}=10\cdot e^{-2{,}057}=10\cdot0{,}128=1{,}28\,\text{k}\Omega$.`,
      },
      {
        nivel: 'Intermedio',
        enunciado: String.raw`Autocalentamiento: la NTC (10 kΩ a 25 °C) tiene una constante de disipación $\delta=1{,}5\,\text{mW/°C}$. ¿Cuánto error introduce a 25 °C si el divisor usa una R fija de 10 kΩ con 5 V? ¿Y si alguien pone una R fija de 1 kΩ?`,
        pista: String.raw`Calculá la corriente del divisor, después $P=I^2R_{NTC}$ y $\Delta T=P/\delta$.`,
        solucion: String.raw`<b>Con 10 kΩ:</b> $I=\frac{5}{20\,\text{k}\Omega}=0{,}25\,\text{mA}$; $P=(0{,}25\cdot10^{-3})^2\cdot10\,000=0{,}625\,\text{mW}$; $\Delta T=\frac{0{,}625}{1{,}5}=0{,}42\,°\text{C}$.<br>
<b>Con 1 kΩ:</b> $I=\frac{5}{11\,\text{k}\Omega}=0{,}455\,\text{mA}$; $P=(0{,}455\cdot10^{-3})^2\cdot10\,000=2{,}07\,\text{mW}$; $\Delta T=1{,}38\,°\text{C}$.<br>
Con la R fija chica no solo se pierde linealidad: la NTC se calienta más del triple.`,
      },
      {
        nivel: 'Avanzado',
        enunciado: String.raw`Querés que un comparador prenda un ventilador a <b>40 °C</b>. Usás la NTC 10 kΩ / B 3950 <b>arriba</b>, una R fija abajo, y $V_{ref}=2{,}5\,\text{V}$ (dos resistencias iguales). ¿Qué R fija hace falta? Elegí un valor E12 y calculá a qué temperatura prende realmente.`,
        pista: String.raw`Con $V_{ref}=V_{CC}/2$ el comparador conmuta cuando $R_{NTC}=R_{fija}$. Calculá $R_{NTC}(40\,°\text{C})$. E12: 1 – 1,2 – 1,5 – 1,8 – 2,2 – 2,7 – 3,3 – 3,9 – 4,7 – 5,6 – 6,8 – 8,2.`,
        solucion: String.raw`$R_{NTC}(40)$: $\frac{1}{313{,}15}-\frac{1}{298{,}15}=-0{,}0001607$; $R=10\,\text{k}\Omega\cdot e^{-0{,}6346}=5{,}30\,\text{k}\Omega$.<br>
Valor comercial más cercano: <b>5,6 kΩ</b>. Conmuta cuando $R_{NTC}=5{,}6\,\text{k}\Omega$: $\frac{1}{T}=0{,}0033540+\frac{\ln0{,}56}{3950}=0{,}0033540-0{,}0001468=0{,}0032072\Rightarrow T=311{,}8\,\text{K}=38{,}6\,°\text{C}$.<br>
Prende a ≈ 38,6 °C. Para clavar los 40 °C se usa un preset en lugar de la R fija (o un preset para ajustar $V_{ref}$).`,
      },
      {
        nivel: 'Avanzado',
        enunciado: String.raw`Con la NTC 10 kΩ / B 3950 arriba y $R_{fija}=10\,\text{k}\Omega$ ($V_{CC}=5\,\text{V}$), un compañero propone no usar logaritmos y calcular la temperatura con una recta que pase por los puntos de 0 °C y 50 °C. ¿Cuánto se equivoca a 25 °C?`,
        pista: String.raw`Calculá Vout a 0, 25 y 50 °C. La recta da a 25 °C el promedio de los extremos; convertí la diferencia de tensión en grados usando la pendiente de la recta.`,
        solucion: String.raw`$V(0)=5\cdot\frac{10}{43{,}62}=1{,}146\,\text{V}$; $V(25)=2{,}500\,\text{V}$; $V(50)=5\cdot\frac{10}{13{,}59}=3{,}680\,\text{V}$.<br>
Pendiente de la recta: $\frac{3{,}680-1{,}146}{50}=0{,}0507\,\text{V/°C}$. La recta a 25 °C da $\frac{1{,}146+3{,}680}{2}=2{,}413\,\text{V}$.<br>
A 25 °C reales la tensión es 2,500 V, que la recta interpreta como $0+\frac{2{,}500-1{,}146}{0{,}0507}=26{,}7\,°\text{C}$: error de ≈ <b>1,7 °C</b>. Para un termostato puede alcanzar; para un termómetro, mejor usar la ecuación Beta.`,
      },
    ],

    quiz: [
      { pregunta: 'En una NTC, cuando la temperatura sube, la resistencia…', opciones: ['Sube', 'Baja', 'No cambia', 'Primero sube y después baja'], correcta: 1, explicacion: 'NTC = coeficiente de temperatura negativo: el calor libera portadores en el semiconductor y la resistencia baja (≈ −4 %/°C).' },
      { pregunta: 'En la ecuación Beta, R = R25·e^(B(1/T − 1/T25)), la temperatura T se pone en…', opciones: ['Grados Celsius', 'Kelvin', 'Grados Fahrenheit', 'Da igual'], correcta: 1, explicacion: 'Siempre en kelvin (°C + 273,15). Con °C el término 1/T no tiene sentido y el resultado es disparatado.' },
      { pregunta: '¿Para qué se usa típicamente una PTC cerámica o polimérica?', opciones: ['Para medir temperatura con mucha precisión', 'Como fusible rearmable o para el arranque de motores', 'Como sensor de luz', 'Para filtrar la tensión de una fuente'], correcta: 1, explicacion: 'Al superar Tc su resistencia se dispara: limita la corriente en un corto (y se rearma sola al enfriarse) o desconecta el bobinado de arranque del compresor.' },
      { pregunta: 'NTC arriba (a +5 V) y R fija a masa. Si la temperatura sube, la lectura de analogRead()…', opciones: ['Sube', 'Baja', 'No cambia', 'Se va a 0'], correcta: 0, explicacion: 'Vout = 5·Rfija/(Rfija + RNTC). La NTC baja con el calor, el denominador baja y Vout sube; el número del ADC sube con él.' },
      { pregunta: 'Para que el divisor sea lo más lineal posible entre 0 y 50 °C, la R fija conviene que sea…', opciones: ['Muy chica (100 Ω)', 'Igual a la R de la NTC a la temperatura media (25 °C)', 'Muy grande (1 MΩ)', 'Igual a la R de la NTC a 0 °C'], correcta: 1, explicacion: 'La curva Vout(T) es una “S”; su zona central (más recta y sensible) queda donde RNTC ≈ Rfija. Con la R a la temperatura media, el rango cae en esa zona.' },
      { pregunta: '¿Para qué sirve la histéresis en un termostato?', opciones: ['Para medir más rápido', 'Para que el ventilador no prenda y apague muchas veces seguidas cerca del umbral', 'Para ahorrar cuentas del ADC', 'Para linealizar la NTC'], correcta: 1, explicacion: 'Con dos umbrales (por ejemplo prende a 35 °C y apaga a 33 °C) el ruido y las pequeñas variaciones no hacen conmutar la salida una y otra vez.' },
    ],

    docente: String.raw`
<h3>Objetivo de la clase</h3>
<p>Que el alumno entienda qué es un termistor, distinga NTC de PTC y sus usos, sepa usar la <b>ecuación Beta</b> en los dos sentidos (T → R y R → T) y, sobre todo, sepa <b>leer una NTC con un divisor y un Arduino</b> y armar un termostato con histéresis. <b>Duración sugerida:</b> 1 a 2 clases (80–120 min en total). Si hay poco tiempo, priorizá secciones 2, 3, 6, 7 y 10.</p>
<h3>Secuencia sugerida</h3>
<ol>
<li><b>Disparador (5 min):</b> “¿Cómo sabe el termómetro digital que tenés fiebre? ¿Y la heladera cuándo cortar?”. Mostrá una NTC (o foto: gotita negra con dos patas) y su símbolo.</li>
<li><b>NTC y PTC (10 min):</b> sección 1, con la explicación de los portadores que se liberan con el calor. Remarcá la diferencia con un metal.</li>
<li><b>Simulación 1 (15 min):</b> antes de mover nada, preguntá: “si de 0 a 25 °C la NTC baja 23 kΩ, ¿cuánto baja de 25 a 50?”. Que arriesgue (la mayoría dice “otros 23”). Mové el slider y mostrá que baja solo 6,4 kΩ: <b>no es lineal</b>. Dejá la tangente activada y mostrá cómo se separa de la curva. Activá el eje logarítmico: queda casi recta → es una exponencial. Cambiá B y mostrá que la curva se empina. Pasá a PTC: con eje lineal el salto se sale del gráfico; con log se ve la meseta y el salto en Tc.</li>
<li><b>Ecuación Beta (15 min):</b> resolvé en el pizarrón el ejemplo de la sección 3 (0 °C y 6 kΩ). Insistí con el kelvin. Pedile que verifique con la simulación 1.</li>
<li><b>PTC y comparación (10 min):</b> sección 4 (fusible del USB, heladera) y tabla de la sección 5.</li>
<li><b>Simulación 2 (20 min):</b> empezá con NTC arriba y R fija 10 k: mové la temperatura y leé Vout, el número del ADC y la temperatura que calcula el Arduino. Preguntá: “¿dónde conviene medir, a 25 °C o a 100 °C?” y mostrá la lectura de resolución (°C por cuenta). Cambiá la R fija a 1 kΩ y a 100 kΩ: la zona verde se corre. Pasá la NTC abajo: la curva se invierte. Después, el termostato: poné histéresis 0 y activá el ambiente automático → el ventilador conmuta muchísimo (mirá el historial). Subí la histéresis a 2–3 °C: oscila tranquilo dentro de la banda.</li>
<li><b>Arduino (10 min):</b> recorré el sketch de la sección 7 y el ejemplo de analogRead = 600.</li>
<li><b>Cierre (5 min):</b> autoevaluación; tarea: ejercicios 3, 4 y 6.</li>
</ol>
<h3>Errores frecuentes</h3>
<ul>
<li>Usar °C en la ecuación Beta (o olvidarse de restar 273,15 al final).</li>
<li>Confundir <code>log</code> con <code>ln</code>: en la ecuación va el logaritmo natural. En Arduino/C, <code>log()</code> <b>es</b> el natural (el decimal es <code>log10()</code>); en la calculadora, la tecla es “ln”.</li>
<li>Pensar que la NTC es lineal y hacer “regla de tres” con la resistencia.</li>
<li>Usar en el código la fórmula del divisor de la otra posición (NTC arriba vs. abajo): da temperaturas absurdas o que bajan cuando calentás.</li>
<li>Hacer la cuenta con enteros en Arduino: <code>1023/n</code> con <code>n</code> entero da un entero; hay que escribir <code>1023.0/n</code>.</li>
<li>Olvidar el diodo en paralelo con el ventilador o el relé.</li>
</ul>
<h3>Preguntas para hacerle pensar</h3>
<ul>
<li>Si tocás la NTC con los dedos, ¿qué le pasa a la lectura? ¿Por qué tarda unos segundos en estabilizarse? (inercia térmica)</li>
<li>¿Por qué un fusible común se tiene que cambiar y una polyfuse no?</li>
<li>¿Qué pasaría si la NTC del termostato queda justo en la corriente de aire del ventilador? (mide el aire que sopla, no el ambiente: el control oscila)</li>
<li>¿Qué sensor usarías en un horno de pizza a 300 °C? (PT100 o termocupla, no una NTC de epoxi)</li>
</ul>
<h3>Recordatorio rápido para vos</h3>
<ul>
<li>NTC 10 k / B 3950 (la de los kits, “MF52” o encapsulada en acero para impresoras): 33,6 k a 0 °C; 10 k a 25 °C; 3,59 k a 50 °C; 698 Ω a 100 °C. Para impresoras 3D se usa la “100 k, B 3950” con pull‑up de 4,7 k.</li>
<li>$R=R_{25}e^{B(1/T-1/T_{25})}$; $\;1/T=1/T_{25}+\ln(R/R_{25})/B$; $\;B=\dfrac{\ln(R_1/R_2)}{1/T_1-1/T_2}$.</li>
<li>Sensibilidad $\alpha=-B/T^2\approx-4{,}4\,\%/°\text{C}$ a 25 °C. Constante de disipación típica 1–2 mW/°C; constante de tiempo térmica ≈ 5–15 s en aire.</li>
<li>Steinhart–Hart: $1/T=a+b\ln R+c(\ln R)^3$ (para una NTC 10 k típica: $a\approx1{,}13\cdot10^{-3}$, $b\approx2{,}34\cdot10^{-4}$, $c\approx8{,}8\cdot10^{-8}$).</li>
<li>Divisor: NTC arriba → $R=R_f(1023/N-1)$; NTC abajo → $R=R_f\,N/(1023-N)$. Lineal y sensible alrededor de $R_{NTC}=R_f$. Punto de inflexión exacto: $R_f=R(T_m)\frac{B-2T_m}{B+2T_m}$.</li>
<li>PT100: $R=100(1+0{,}00385\,t)$; LM35: 10 mV/°C; ADC UNO 10 bits a 5 V (4,9 mV por cuenta), ESP32 12 bits a 3,3 V.</li>
<li>PTC: $T_c$ se define donde la resistencia vale el doble de la mínima. Polyfuse: se especifica con I<sub>hold</sub> (corriente que soporta sin disparar) e I<sub>trip</sub> (corriente a la que dispara).</li>
</ul>
<h3>Experiencia práctica</h3>
<p><b>Tinkercad Circuits</b> no tiene NTC, pero sí el sensor TMP36 (lineal, para comparar) y un potenciómetro que puede “hacer de NTC”. Mejor: <b>Wokwi</b> (wokwi.com) tiene el módulo “NTC Temperature Sensor” (10 k, B 3950) con un control de temperatura al simular: armá el sketch de la sección 7 y verificá que coincide con la simulación 2. <b>En casa con componentes:</b> NTC de 10 k + resistencia de 10 k + Arduino; medí agua con hielo (debe dar ≈ 0 °C), agua de la canilla y agua tibia comparando con un termómetro de cocina. Sin Arduino: medí la NTC con el multímetro en Ω mientras la apretás entre los dedos: el alumno ve bajar la resistencia en tiempo real. Para el termostato analógico: LM393 + preset para Vref + BC337 + ventilador de PC de 5 V (o un LED) + 1N4148.</p>
`,
  });
})();
