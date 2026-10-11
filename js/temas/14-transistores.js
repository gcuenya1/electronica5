/* Tema 14 — Transistores bipolares (BJT)
   IMPORTANTE: los textos con LaTeX usan String.raw`...` para que "\frac" no se rompa. */
(() => {
  /* ---------- helpers propios del tema (no globales) ---------- */

  // Modelo de salida del BJT usado en la teoría y en la simulación:
  // Ic = β·Ib·(1 + Vce/VA)·tanh(max(0, Vce − 0,1)/0,08)  → codo en ~0,2 V, leve efecto Early.
  const VA = 120;
  const icBJT = (vce, ib, beta, va = VA) => {
    if (ib <= 0 || vce <= 0.1) return 0;
    return beta * ib * (1 + vce / va) * Math.tanh((vce - 0.1) / 0.08);
  };

  // Gráfico estático de curvas de salida (SVG) para la teoría
  function curvasSVG() {
    const W = 460, Hh = 250, x0 = 50, y0 = 15, w = 380, h = 195;
    const vmax = 12, imax = 12; // V y mA
    const X = (v) => x0 + v / vmax * w, Y = (i) => y0 + h - i / imax * h;
    let s = '';
    // grilla
    for (let v = 0; v <= vmax; v += 2) s += `<path d="M${X(v)} ${y0}V${y0 + h}" stroke="currentColor" stroke-opacity=".12"/><text x="${X(v)}" y="${y0 + h + 16}" font-size="11" text-anchor="middle">${v}</text>`;
    for (let i = 0; i <= imax; i += 2) s += `<path d="M${x0} ${Y(i)}H${x0 + w}" stroke="currentColor" stroke-opacity=".12"/><text x="${x0 - 6}" y="${Y(i) + 4}" font-size="11" text-anchor="end">${i}</text>`;
    s += `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="none" stroke="currentColor" stroke-opacity=".5"/>`;
    // zona de saturación y corte
    s += `<rect x="${x0}" y="${y0}" width="${X(0.35) - x0}" height="${h}" fill="var(--red)" opacity=".13"/>`;
    s += `<rect x="${x0}" y="${Y(0.35)}" width="${w}" height="${y0 + h - Y(0.35)}" fill="var(--c4)" opacity=".18"/>`;
    // curvas: β = 100, Ib = 20..100 µA
    [20, 40, 60, 80, 100].forEach((ib) => {
      let d = '';
      for (let k = 0; k <= 120; k++) {
        const v = vmax * k / 120;
        const i = icBJT(v, ib * 1e-6, 100) * 1e3;
        d += (k ? 'L' : 'M') + X(v).toFixed(1) + ' ' + Y(Math.min(i, imax)).toFixed(1);
      }
      s += `<path d="${d}" fill="none" stroke="var(--c1)" stroke-width="2"/>`;
      s += `<text x="${X(vmax) - 4}" y="${Y(icBJT(vmax, ib * 1e-6, 100) * 1e3) - 5}" font-size="11" text-anchor="end" style="fill:var(--c1)">Ib = ${ib} µA</text>`;
    });
    // recta de carga Vcc = 12 V, Rc = 1,5 kΩ  →  Ic(sat) = 8 mA
    s += `<path d="M${X(0)} ${Y(8)}L${X(12)} ${Y(0)}" stroke="var(--c2)" stroke-width="2" stroke-dasharray="6 4"/>`;
    s += `<text x="${X(1.2)}" y="${Y(8) - 6}" font-size="11" style="fill:var(--c2)" font-weight="700">recta de carga</text>`;
    // punto Q (Ib = 40 µA): Vce ≈ 6 V
    const q = (() => { let a = 0.1, b = 12; for (let n = 0; n < 60; n++) { const m = (a + b) / 2; const g = icBJT(m, 40e-6, 100) * 1e3 - (12 - m) / 1.5; if (g > 0) b = m; else a = m; } return a; })();
    s += `<circle cx="${X(q)}" cy="${Y((12 - q) / 1.5)}" r="5" fill="var(--c2)"/><text x="${X(q) + 8}" y="${Y((12 - q) / 1.5) - 8}" font-size="12" font-weight="700" style="fill:var(--c2)">Q</text>`;
    s += `<text x="${X(0.2) + 2}" y="${y0 + 85}" font-size="11" font-weight="700" style="fill:var(--red)" transform="rotate(90 ${X(0.2) + 2} ${y0 + 85})">saturación</text>`;
    s += `<text x="${X(6)}" y="${Y(0) - 4}" font-size="11" font-weight="700" text-anchor="middle" style="fill:var(--c4)">corte (Ib = 0)</text>`;
    s += `<text x="${X(7)}" y="${Y(2.9)}" font-size="12" font-weight="700" text-anchor="middle" opacity=".7">región activa</text>`;
    s += `<text x="${x0 + w}" y="${y0 + h + 30}" font-size="12" font-weight="700" text-anchor="end">Vce (V)</text><text x="${x0 + 6}" y="${y0 + 12}" font-size="12" font-weight="700">Ic (mA)</text>`;
    return `<figure class="figura"><svg class="esq" viewBox="0 0 ${W} ${Hh}" width="${W}" height="${Hh}" xmlns="http://www.w3.org/2000/svg">${s}</svg><figcaption>Curvas de salida de un NPN con β ≈ 100. Cada curva corresponde a una corriente de base fija. La recta de carga es la de Vcc = 12 V y Rc = 1,5 kΩ.</figcaption></figure>`;
  }

  // "20,9 mA" -> "20{,}9\,\text{mA}" para KaTeX
  function tex(str) {
    const [n, u = ''] = String(str).split(' ');
    return n.replace(',', '{,}') + '\\,' + uni(u);
  }
  function uni(u) {
    let pre = '', base = u;
    if (/^[µmkMn]/.test(u) && u.length > 1) { pre = u[0]; base = u.slice(1); }
    const preT = pre === 'µ' ? '\\mu' : pre ? '\\text{' + pre + '}' : '';
    const baseT = base === 'Ω' ? '\\Omega' : '\\text{' + base + '}';
    return preT + baseT;
  }

  // Redondeo a un valor comercial E12 hacia abajo (para Rb)
  const E12 = [1, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2];
  function e12Abajo(r) {
    const dec = Math.pow(10, Math.floor(Math.log10(r)));
    const m = r / dec;
    let best = E12[0];
    for (const e of E12) if (e <= m + 1e-9) best = e;
    return best * dec;
  }

  registrarTema({
    id: 'transistores',
    orden: 14,
    titulo: 'Transistores',
    resumen: 'BJT NPN/PNP, regiones, recta de carga, polarización y el transistor como llave',
    confirmar: false,

    teoria: String.raw`
<p>El transistor es el componente que cambió el mundo: con él se construyen amplificadores, fuentes, y los miles de millones de llaves que hay adentro de un microcontrolador. En este tema vemos el <b>transistor bipolar de juntura (BJT)</b>. La idea central es una sola: <b>una corriente chiquita (la de base) controla una corriente mucho más grande (la de colector)</b>.</p>

<div class="caja idea"><span class="caja-titulo">La analogía de la canilla</span>
Pensá en una canilla de agua. El caño grande que viene del tanque es el <b>colector</b>, la salida es el <b>emisor</b> y la manija es la <b>base</b>. Con un esfuerzo chiquito en la manija (corriente de base) controlás un chorro grande de agua (corriente de colector). Si no tocás la manija, no pasa nada (<b>corte</b>). Si la abrís un poco, el chorro es proporcional a cuánto la abriste (<b>región activa</b>: el transistor <em>amplifica</em>). Si la abrís a fondo, sale todo lo que da el caño, y abrirla más no cambia nada (<b>saturación</b>: el transistor es una <em>llave cerrada</em>).
</div>

<h2>1. Estructura y terminales</h2>
<p>Un BJT son <b>tres capas</b> de semiconductor alternadas: N‑P‑N o P‑N‑P. Eso forma <b>dos junturas</b> (dos diodos “espalda con espalda”). Los tres terminales son:</p>
<ul>
<li><b>Emisor (E):</b> “emite” los portadores. Está muy dopado.</li>
<li><b>Base (B):</b> la capa del medio, <b>muy fina</b> y poco dopada. Es la “manija”.</li>
<li><b>Colector (C):</b> “recoge” casi todos los portadores que salen del emisor. Es la capa más grande (disipa el calor).</li>
</ul>
<div class="dos-col">
<div>
${Esq.svg(220, 130, [
  Esq.bjt(110, 65, 'NPN'), Esq.borne(80, 65, 'B', -12, 4), Esq.borne(122, 35, 'C', 14, 4), Esq.borne(122, 95, 'E', 14, 4),
  Esq.flecha(150, 30, 150, 55, 'Ic', 'var(--c2)'), Esq.flecha(150, 78, 150, 103, 'Ie', 'var(--c2)'), Esq.flecha(40, 52, 70, 52, 'Ib', 'var(--c2)'),
], 'NPN: la flecha del emisor apunta hacia afuera. La corriente entra por B y C y sale por E.')}
</div>
<div>
${Esq.svg(220, 130, [
  Esq.bjt(110, 65, 'PNP'), Esq.borne(80, 65, 'B', -12, 4), Esq.borne(122, 35, 'C', 14, 4), Esq.borne(122, 95, 'E', 14, 4),
  Esq.flecha(150, 55, 150, 30, 'Ic', 'var(--c4)'), Esq.flecha(150, 103, 150, 78, 'Ie', 'var(--c4)'), Esq.flecha(70, 52, 40, 52, 'Ib', 'var(--c4)'),
], 'PNP: la flecha apunta hacia adentro. Todas las corrientes y tensiones se invierten.')}
</div>
</div>
<div class="caja tip"><span class="caja-titulo">Para no confundirlos</span>
La flecha está siempre en el <b>emisor</b> e indica el sentido de la corriente convencional (como en un diodo: de P a N). Regla para acordarse: <b>PNP = “Pincha”</b> (la flecha entra, pincha al transistor); en el NPN “No Pincha” (sale).
</div>

<h2>2. Cómo funciona: las tres relaciones básicas</h2>
<p>Para que un NPN conduzca hay que <b>polarizar en directa la juntura base‑emisor</b> (base unos 0,7 V más positiva que el emisor, como cualquier diodo de silicio) y la juntura base‑colector en inversa (colector más positivo que la base). Los electrones que entran por el emisor cruzan la base, que es tan fina que casi ninguno se queda: <b>la gran mayoría es “chupada” por el colector</b>. Solo una pequeña fracción sale por la base. Esa proporción es fija para cada transistor y se llama <b>ganancia de corriente β</b> (en las hojas de datos, $h_{FE}$).</p>
<div class="caja formula"><span class="caja-titulo">Relaciones del BJT (región activa)</span>
$$I_C = \beta\cdot I_B \qquad I_E = I_C + I_B = (\beta+1)\,I_B \qquad V_{BE}\approx 0{,}7\,\text{V}$$
<p>β típico: 100 a 400 en transistores chicos (BC547, 2N2222), 20 a 50 en los de potencia (TIP31). Como β es grande, $I_E\approx I_C$.</p>
</div>
<div class="caja ejemplo"><span class="caja-titulo">Ejemplo</span>
Un BC547 con $\beta=200$ recibe $I_B=50\,\mu\text{A}$. Entonces $I_C=200\cdot50\,\mu\text{A}=10\,\text{mA}$ y $I_E=10{,}05\,\text{mA}$. Con 50 µA en la base (lo que da un pin de Arduino a través de 86 kΩ) controlamos 10 mA: la base es la “manija”.
</div>
<div class="caja ojo"><span class="caja-titulo">Ojo con β</span>
β <b>no es un número confiable</b>: varía muchísimo entre transistores del mismo modelo (un BC547 puede tener de 110 a 800), cambia con la temperatura y con la corriente. Un buen circuito <b>no tiene que depender del valor exacto de β</b>. Esa idea guía todo lo que sigue.
</div>
<p>En el <b>PNP</b> todo es igual pero dado vuelta: el emisor va al positivo, la base tiene que estar unos 0,7 V <em>por debajo</em> del emisor ($V_{EB}\approx0{,}7\,\text{V}$) y la corriente sale por la base y por el colector.</p>

<h2>3. Regiones de trabajo</h2>
<div class="tabla-wrap"><table class="tabla">
<tr><th>Región</th><th>Juntura B‑E</th><th>Juntura B‑C</th><th>Qué pasa</th><th>Cómo la reconocés midiendo</th><th>Uso</th></tr>
<tr><td><b>Corte</b></td><td>sin polarizar o inversa</td><td>inversa</td><td>$I_B\approx0$, $I_C\approx0$. Llave abierta.</td><td>$V_{BE}<0{,}5\,\text{V}$ y $V_{CE}\approx V_{CC}$</td><td>Llave apagada</td></tr>
<tr><td><b>Activa</b></td><td>directa</td><td>inversa</td><td>$I_C=\beta\,I_B$. El transistor “dosifica”.</td><td>$V_{BE}\approx0{,}7\,\text{V}$ y $0{,}3\,\text{V}\lt V_{CE}\lt V_{CC}$</td><td>Amplificador</td></tr>
<tr><td><b>Saturación</b></td><td>directa</td><td>directa</td><td>$I_C\lt \beta\,I_B$: el circuito externo no deja pasar más. Llave cerrada.</td><td>$V_{BE}\approx0{,}7$–$0{,}8\,\text{V}$ y $V_{CE(sat)}\approx0{,}2\,\text{V}$</td><td>Llave encendida</td></tr>
</table></div>
<div class="caja formula"><span class="caja-titulo">Método para saber en qué región está</span>
<ol>
<li>Si $V_{BB}<0{,}7\,\text{V}$ (no alcanza a polarizar la base) → <b>corte</b>.</li>
<li>Si no, <b>suponé región activa</b>: calculá $I_B$, luego $I_C=\beta I_B$ y $V_{CE}=V_{CC}-I_C R_C$.</li>
<li>Si te dio $V_{CE}>0{,}2\,\text{V}$ → la suposición era correcta: <b>activa</b>.</li>
<li>Si te dio $V_{CE}<0{,}2\,\text{V}$ (¡o negativa!) → es imposible: está <b>saturado</b>. Recalculá con $V_{CE}=0{,}2\,\text{V}$: $I_C=\dfrac{V_{CC}-0{,}2}{R_C}$ (y ahora $I_C\lt \beta I_B$).</li>
</ol>
</div>

<h2>4. Curvas características de salida</h2>
<p>Si fijamos una corriente de base y vamos subiendo $V_{CE}$, medimos $I_C$. Repitiendo con varias $I_B$ obtenemos una <b>familia de curvas</b>:</p>
${curvasSVG()}
<ul>
<li>A partir de unos pocos décimos de volt, cada curva es <b>casi horizontal</b>: $I_C$ no depende de $V_{CE}$, solo de $I_B$. Esa es la región activa (el transistor se comporta como una <b>fuente de corriente controlada</b>).</li>
<li>Las curvas están separadas en forma pareja: cada 20 µA de base suman unos 2 mA de colector (β ≈ 100).</li>
<li>Pegado al eje vertical (zona roja) todas las curvas se juntan: es la <b>saturación</b>, con $V_{CE}$ de unas décimas de volt.</li>
<li>Sobre el eje horizontal ($I_B=0$) está el <b>corte</b>.</li>
<li>La leve pendiente de las curvas se llama <b>efecto Early</b>; para nuestras cuentas la despreciamos.</li>
</ul>

<h2>5. Recta de carga en CC y punto Q</h2>
<p>El transistor no trabaja solo: tiene una resistencia de colector $R_C$ conectada a la fuente. Por la malla de salida (LKT): $V_{CC} = I_C R_C + V_{CE}$. Despejando:</p>
<div class="caja formula"><span class="caja-titulo">Recta de carga</span>
$$I_C = \frac{V_{CC}-V_{CE}}{R_C}$$
<p>Es una recta con dos puntos fáciles: si $I_C=0$ → $V_{CE}=V_{CC}$ (<b>punto de corte</b>, sobre el eje horizontal); si $V_{CE}=0$ → $I_C=V_{CC}/R_C$ (<b>punto de saturación</b>, sobre el eje vertical).</p>
</div>
<p>La recta dice <b>todas las combinaciones posibles</b> que permite el circuito externo; la curva de $I_B$ dice lo que impone el transistor. Donde se cruzan está el <b>punto de trabajo o punto Q</b> (quiescente = “de reposo”): los valores de $I_C$ y $V_{CE}$ con los que realmente queda el transistor.</p>
<div class="caja idea"><span class="caja-titulo">¿Dónde conviene el punto Q?</span>
<b>Amplificador:</b> en el medio de la recta ($V_{CE}\approx V_{CC}/2$), así la señal puede subir y bajar sin “chocar” contra el corte ni contra la saturación (si choca, la señal sale recortada = distorsión).<br>
<b>Llave:</b> en los extremos: o bien en corte (apagado) o bien en saturación (encendido). Nunca en el medio, porque ahí disipa mucho.
</div>

<h2>6. Polarización fija</h2>
<p>Polarizar es elegir resistencias para ubicar el punto Q. La forma más simple es poner una resistencia $R_B$ desde una fuente $V_{BB}$ (o la misma $V_{CC}$) a la base:</p>
${Esq.svg(400, 215, [
  Esq.bat(50, 120, 50, 185, 'VBB', '', -1), Esq.cable([[50, 120], [90, 120]]), Esq.R(90, 120, 200, 120, 'RB', '', 1),
  Esq.bjt(230, 120, 'NPN'), Esq.R(242, 25, 242, 90, 'RC', '', -1), Esq.cable([[242, 25], [330, 25], [330, 60]]),
  Esq.bat(330, 60, 330, 160, 'VCC', '', 1), Esq.cable([[330, 160], [330, 195], [50, 195], [50, 185]]),
  Esq.cable([[242, 150], [242, 195]]), Esq.nodo(242, 195),
  Esq.flecha(110, 145, 150, 145, ''), Esq.texto(130, 165, 'IB', { color: 'var(--c2)' }), Esq.flecha(262, 40, 262, 70, 'IC'), Esq.texto(275, 125, 'VCE', { anchor: 'start', color: 'var(--c1)' }),
], 'Polarización fija: la corriente de base la fija RB.')}
<div class="caja formula"><span class="caja-titulo">Polarización fija</span>
$$I_B=\frac{V_{BB}-0{,}7}{R_B}\qquad I_C=\beta\,I_B\qquad V_{CE}=V_{CC}-I_C\,R_C\qquad P=V_{CE}\cdot I_C$$
</div>
<div class="caja ejemplo"><span class="caja-titulo">Ejemplo resuelto</span>
$V_{BB}=V_{CC}=12\,\text{V}$, $R_B=470\,\text{k}\Omega$, $R_C=2{,}2\,\text{k}\Omega$, $\beta=100$.
$$I_B=\frac{12-0{,}7}{470\,\text{k}\Omega}=24{,}0\,\mu\text{A}\qquad I_C=100\cdot24{,}0\,\mu\text{A}=2{,}40\,\text{mA}$$
$$V_{CE}=12-2{,}40\,\text{mA}\cdot2{,}2\,\text{k}\Omega=12-5{,}29=6{,}71\,\text{V}\;\Rightarrow\;\text{activa (bien centrado)}$$
<p>Ahora cambiamos el transistor por otro del mismo modelo con $\beta=200$: $I_C=4{,}81\,\text{mA}$ y $V_{CE}=1{,}42\,\text{V}$. ¡El punto Q se fue casi a saturación! <b>La polarización fija depende totalmente de β</b>: sirve para entender, pero no para fabricar en serie.</p>
</div>

<h2>7. Polarización por divisor de tensión (la que se usa de verdad)</h2>
<p>Se agrega un divisor $R_1$–$R_2$ en la base y, sobre todo, una <b>resistencia de emisor $R_E$</b>:</p>
${Esq.svg(420, 250, [
  Esq.cable([[110, 25], [360, 25]]), Esq.nodo(240, 25),
  Esq.R(110, 25, 110, 120, 'R1', '', -1), Esq.nodo(110, 130), Esq.cable([[110, 120], [110, 140]]), Esq.R(110, 140, 110, 225, 'R2', '', -1),
  Esq.cable([[110, 130], [198, 130]]), Esq.bjt(228, 130, 'NPN'),
  Esq.R(240, 25, 240, 100, 'RC', '', 1), Esq.R(240, 160, 240, 225, 'RE', '', 1),
  Esq.cable([[110, 225], [360, 225]]), Esq.nodo(240, 225),
  Esq.cable([[360, 25], [360, 85]]), Esq.bat(360, 85, 360, 165, 'VCC', '', 1), Esq.cable([[360, 165], [360, 225]]),
  Esq.texto(165, 120, 'VB', { color: 'var(--c1)' }), Esq.texto(228, 176, 'VE', { color: 'var(--c1)', anchor: 'end' }),
], 'Polarización por divisor de tensión con resistencia de emisor.')}
<p><b>Paso 1 — Thévenin en la base</b> (lo vimos en el tema 1). Desde la base, el divisor “se ve” como una fuente con su resistencia:</p>
<div class="caja formula"><span class="caja-titulo">Divisor con Thévenin</span>
$$V_{th}=V_{CC}\frac{R_2}{R_1+R_2}\qquad R_{th}=R_1\parallel R_2=\frac{R_1R_2}{R_1+R_2}$$
<p><b>Paso 2 — Malla de entrada:</b> $V_{th}=I_B R_{th}+0{,}7+I_E R_E$, con $I_E=(\beta+1)I_B$:</p>
$$I_B=\frac{V_{th}-0{,}7}{R_{th}+(\beta+1)R_E}\qquad I_C=\beta I_B\qquad V_{CE}=V_{CC}-I_C R_C-I_E R_E$$
<p><b>Aproximación rápida</b> (válida si $(\beta+1)R_E\gg R_{th}$, por ejemplo 10 veces mayor): la base queda prácticamente a $V_{th}$, entonces</p>
$$V_E\approx V_{th}-0{,}7\qquad I_C\approx I_E\approx\frac{V_{th}-0{,}7}{R_E}\quad\text{(no aparece }\beta\text{)}$$
</div>
<div class="caja ejemplo"><span class="caja-titulo">Ejemplo resuelto completo</span>
$V_{CC}=12\,\text{V}$, $R_1=39\,\text{k}\Omega$, $R_2=8{,}2\,\text{k}\Omega$, $R_C=3{,}3\,\text{k}\Omega$, $R_E=1\,\text{k}\Omega$, $\beta=100$.
<ol>
<li>Thévenin: $V_{th}=12\cdot\frac{8{,}2}{47{,}2}=2{,}085\,\text{V}$; &nbsp; $R_{th}=\frac{39\cdot8{,}2}{47{,}2}=6{,}78\,\text{k}\Omega$.</li>
<li>Corriente de base: $I_B=\dfrac{2{,}085-0{,}7}{6{,}78+101\cdot1}\,\text{mA}=\dfrac{1{,}385}{107{,}8}=12{,}85\,\mu\text{A}$.</li>
<li>$I_C=100\cdot12{,}85\,\mu\text{A}=1{,}285\,\text{mA}$; &nbsp; $I_E=1{,}298\,\text{mA}$.</li>
<li>$V_{CE}=12-1{,}285\cdot3{,}3-1{,}298\cdot1=12-4{,}24-1{,}30=6{,}46\,\text{V}$ → <b>activa, bien centrado</b>.</li>
<li>Aproximación rápida: $I_C\approx\frac{1{,}385\,\text{V}}{1\,\text{k}\Omega}=1{,}39\,\text{mA}$ (error de 8 %: alcanza para diseñar).</li>
</ol>
<p><b>Prueba de estabilidad:</b> con $\beta=200$ da $I_C=1{,}333\,\text{mA}$ y $V_{CE}=6{,}26\,\text{V}$; con $\beta=400$, $I_C=1{,}358\,\text{mA}$. <b>Cuadruplicamos β y la corriente cambió solo un 6 %</b>, contra el 100 % de la polarización fija.</p>
</div>
<div class="caja idea"><span class="caja-titulo">¿Por qué es estable? (realimentación)</span>
Si por algún motivo $I_C$ quiere subir (otro β, más temperatura), sube la caída en $R_E$, sube $V_E$. Como la base está “clavada” por el divisor, $V_{BE}=V_B-V_E$ <b>baja</b>, y eso reduce $I_B$, que frena la subida de $I_C$. El transistor se “autocorrige”. Esto se llama <b>realimentación negativa</b> y es una de las ideas más importantes de toda la electrónica.
</div>

<h2>8. El transistor como llave</h2>
<p>Un pin de Arduino da como mucho <b>20 mA</b> (máximo absoluto 40 mA) a 5 V. Un relé de 12 V, una tira de LED o un motorcito necesitan más corriente y/o más tensión. El transistor hace de “intermediario”: el pin maneja la base con muy poca corriente, y el transistor conmuta la carga desde otra fuente.</p>
${Esq.svg(420, 260, [
  `<rect x="8" y="160" width="58" height="56" rx="6" fill="none" stroke="currentColor" stroke-width="2"/>`, Esq.texto(37, 185, 'Arduino', { size: 11 }), Esq.texto(37, 202, 'pin D8', { size: 11, peso: 400 }),
  Esq.cable([[66, 190], [80, 190]]), Esq.R(80, 190, 170, 190, 'RB', '', 1), Esq.bjt(200, 190, 'NPN'),
  Esq.borne(212, 22, '+12 V', 0, -10), Esq.cable([[212, 26], [212, 45], [290, 45]]), Esq.nodo(212, 45),
  Esq.L(212, 45, 212, 140, 'Bobina', 'relé', -1), Esq.D(290, 140, 290, 45, 'D', '1N4007', 1),
  Esq.cable([[212, 140], [290, 140]]), Esq.nodo(212, 140), Esq.cable([[212, 140], [212, 160]]),
  Esq.cable([[212, 220], [212, 236]]), Esq.masa(212, 236), Esq.cable([[37, 216], [37, 236], [212, 236]]),
  Esq.texto(300, 165, 'diodo de', { size: 11, anchor: 'start', color: 'var(--c4)' }), Esq.texto(300, 179, 'rueda libre', { size: 11, anchor: 'start', color: 'var(--c4)' }),
], 'Arduino manejando un relé de 12 V con un NPN. Las masas del Arduino y de la fuente de 12 V tienen que estar unidas.')}
<div class="caja formula"><span class="caja-titulo">Receta de diseño (llave con NPN)</span>
<ol>
<li><b>Corriente de colector necesaria</b>, la que pide la carga: $I_C=\dfrac{V_{CC}-V_{carga}-V_{CE(sat)}}{R}$ o directamente el dato (relé de 12 V / 30 mA → $I_C=30\,\text{mA}$).</li>
<li><b>Corriente de base mínima</b> con el <b>β mínimo</b> de la hoja de datos: $I_{B,min}=I_C/\beta_{min}$.</li>
<li><b>Factor de saturación</b>: multiplicá por 2 a 5 para asegurar saturación aunque el transistor tenga β bajo o esté frío: $I_B=k\cdot I_C/\beta_{min}$.</li>
<li>$R_B=\dfrac{V_{pin}-0{,}7}{I_B}$ y elegís el <b>valor comercial inmediato inferior</b> (más corriente de base = más saturado).</li>
<li>Verificá que $I_B$ no pase de los 20 mA del pin, y que $I_C$ y $P$ estén dentro de lo que aguanta el transistor.</li>
</ol>
</div>
<div class="caja ejemplo"><span class="caja-titulo">Ejemplo: relé de 12 V / 30 mA desde Arduino con BC547</span>
$\beta_{min}=110$, factor 3: $I_B=3\cdot\frac{30\,\text{mA}}{110}=0{,}82\,\text{mA}$. &nbsp; $R_B=\frac{5-0{,}7}{0{,}82\,\text{mA}}=5{,}26\,\text{k}\Omega$ → usamos <b>4,7 kΩ</b> ($I_B=0{,}91\,\text{mA}$, β forzado $=30/0{,}91\approx33$, muy por debajo de 110: satura seguro). El pin entrega menos de 1 mA. El transistor disipa $P\approx0{,}2\,\text{V}\cdot30\,\text{mA}=6\,\text{mW}$: nada.
</div>
<div class="caja ojo"><span class="caja-titulo">Diodo de rueda libre: ¡no te lo olvides!</span>
Una bobina (relé, motor, solenoide) se opone a los cambios de corriente: $v_L=L\,\frac{di}{dt}$. Cuando el transistor se apaga, la corriente quiere cortarse de golpe y la bobina genera un <b>pico de tensión de cientos de volts</b> en el colector, que perfora el transistor. El diodo en paralelo con la bobina (<b>cátodo hacia el +12 V</b>) le da un camino a esa corriente para que se descargue despacio. En CC normal el diodo está en inversa y no hace nada.
</div>
<div class="caja tip"><span class="caja-titulo">¿Y para un LED?</span>
Un LED de 20 mA lo maneja directamente el pin. Pero si son varios LED en serie a 12 V, o un LED de potencia, ponés el LED con su resistencia en el colector: $R=\frac{V_{CC}-V_{LED}-0{,}2}{I_{LED}}$. Ejemplo: LED rojo a 12 V y 20 mA → $R=\frac{12-2-0{,}2}{0{,}02}=490\,\Omega$ → 470 Ω.
</div>

<h2>9. Transistores comunes, encapsulados y patas</h2>
<div class="tabla-wrap"><table class="tabla">
<tr><th>Modelo</th><th>Tipo</th><th>$I_C$ máx</th><th>$V_{CE}$ máx</th><th>$P$ máx</th><th>β (hFE)</th><th>Encapsulado y patas</th></tr>
<tr><td>BC547 / BC548</td><td>NPN señal</td><td>100 mA</td><td>45 V</td><td>0,5 W</td><td>110–800</td><td>TO‑92, cara plana al frente: <b>C‑B‑E</b></td></tr>
<tr><td>BC557 / BC558</td><td>PNP (complementario)</td><td>100 mA</td><td>45 V</td><td>0,5 W</td><td>110–800</td><td>TO‑92: <b>C‑B‑E</b></td></tr>
<tr><td>2N2222A</td><td>NPN uso general</td><td>600 mA</td><td>40 V</td><td>0,5 W</td><td>100–300</td><td>TO‑92 (cara plana al frente): <b>E‑B‑C</b></td></tr>
<tr><td>TIP31C (TIP32C PNP)</td><td>NPN potencia</td><td>3 A</td><td>100 V</td><td>40 W con disipador</td><td>25 mín</td><td>TO‑220: <b>B‑C‑E</b>, aleta = C</td></tr>
<tr><td>TIP122 (TIP127 PNP)</td><td>NPN <b>Darlington</b></td><td>5 A</td><td>100 V</td><td>65 W con disipador</td><td>1000 mín</td><td>TO‑220: <b>B‑C‑E</b>, aleta = C</td></tr>
</table></div>
<div class="caja idea"><span class="caja-titulo">Darlington</span>
Son dos transistores encadenados en un solo encapsulado: el emisor del primero alimenta la base del segundo, así $\beta_{total}\approx\beta_1\cdot\beta_2$ (≥ 1000). Ventaja: con 2–4 mA de un pin manejás amperes. Desventajas: $V_{BE}\approx1{,}4\,\text{V}$ (dos junturas) y $V_{CE(sat)}\approx1$–$2\,\text{V}$, o sea, <b>disipa bastante</b> como llave.
</div>
<div class="caja ojo"><span class="caja-titulo">Las patas cambian según el fabricante</span>
El 2N2222 en TO‑92 tiene las patas al revés que el BC547. Y hay versiones “P2N2222” con otro orden. <b>Siempre</b> mirá la hoja de datos del modelo exacto, o identificalas con el multímetro.
</div>
<h3>Identificar patas con el multímetro (prueba de diodos)</h3>
<p>Como el BJT son <b>dos diodos con el ánodo (NPN) o el cátodo (PNP) en común en la base</b>:</p>
<ol>
<li>Buscá la pata que conduce hacia las otras dos: esa es la <b>base</b>.</li>
<li>Si conduce con la punta <b>roja</b> en la base → es <b>NPN</b>. Si conduce con la <b>negra</b> en la base → <b>PNP</b>.</li>
<li>Vas a leer unos 0,6–0,7 V en cada juntura. La juntura <b>B‑E da un poco más</b> (ej. 0,68 V) que la B‑C (ej. 0,65 V), porque el emisor está más dopado.</li>
<li>Entre C y E no debe conducir en ningún sentido (OL). Si marca algo cercano a 0 → transistor en corto (quemado).</li>
</ol>
<p>Muchos multímetros tienen además un zócalo <b>hFE</b> para medir β directamente.</p>

<h2>10. Disipación de potencia</h2>
<div class="caja formula"><span class="caja-titulo">Potencia en el transistor</span>
$$P\approx V_{CE}\cdot I_C\qquad(\text{la potencia de base }V_{BE}I_B\text{ es despreciable})$$
</div>
<ul>
<li><b>En corte</b>: $I_C\approx0$ → $P\approx0$.</li>
<li><b>En saturación</b>: $V_{CE}\approx0{,}2\,\text{V}$ → $P$ chica. Por eso la llave bien saturada no calienta.</li>
<li><b>En activa</b>: puede ser grande. Ejemplo: $V_{CE}=6\,\text{V}$ e $I_C=100\,\text{mA}$ → $P=0{,}6\,\text{W}$: ¡un BC547 (0,5 W) se quema!</li>
</ul>
<p>La temperatura de la juntura sube según $T_j=T_{amb}+P\cdot R_{th}$. Un TO‑92 al aire tiene $R_{th}\approx200\,°\text{C/W}$; un TO‑220 sin disipador, unos $62\,°\text{C/W}$. El silicio aguanta hasta 150 °C.</p>
<div class="caja ojo"><span class="caja-titulo">Error típico: la llave que calienta</span>
Si un transistor usado como llave calienta, casi seguro <b>no está saturado</b> (le falta corriente de base, $R_B$ muy grande) y está trabajando en activa, con varios volts entre C y E. Probalo en la simulación 2.
</div>
`,

    simulaciones: [
      {
        titulo: 'Polarización fija: curvas, recta de carga y punto Q',
        descripcion: 'Mové VBB, RB, RC, VCC y β. Fijate cómo el punto Q se mueve sobre la recta de carga y en qué región queda el transistor.',
        montar(cont, H) {
          const { controles, vista } = H.layout(cont);
          const vcc = H.slider(controles, { label: 'VCC', min: 1, max: 24, step: 0.5, value: 12, unidad: 'V', onInput: upd });
          const vbb = H.slider(controles, { label: 'VBB (fuente de base)', min: 0, max: 12, step: 0.05, value: 5, unidad: 'V', onInput: upd });
          const rb = H.slider(controles, { label: 'RB', min: 1e3, max: 2.2e6, log: true, value: 180e3, unidad: 'Ω', onInput: upd });
          const rc = H.slider(controles, { label: 'RC', min: 100, max: 47e3, log: true, value: 2.2e3, unidad: 'Ω', onInput: upd });
          const beta = H.slider(controles, { label: 'β (ganancia)', min: 50, max: 400, step: 5, value: 150, fmt: v => H.num(v, 0), onInput: upd });
          H.sep(controles);
          H.titulo(controles, 'Probá');
          H.boton(controles, 'Duplicar β (otro transistor)', () => { beta.value = Math.min(400, beta.value * 2); upd(); }, 'btn chico');
          H.boton(controles, 'Llevar a saturación', () => { rb.value = 10e3; upd(); }, 'btn chico');
          H.boton(controles, 'Cortar (VBB = 0,5 V)', () => { vbb.value = 0.5; upd(); }, 'btn chico');

          const fig = H.el('div'); vista.append(fig);
          let S = {};
          const canvas = H.canvas(vista, {
            alto: (w) => Math.max(240, Math.min(340, w * 0.55)),
            dibujar(ctx, w, h) {
              const Icmax0 = Math.max(S.Vcc / S.Rc, S.Ic, S.beta * S.Ib * 1.05) * 1.25 * 1e3; // mA
              const ymax = H.ticks(0, Icmax0, 5).slice(-1)[0] < Icmax0 ? Icmax0 : H.ticks(0, Icmax0, 5).slice(-1)[0];
              const xmax = S.Vcc * 1.08;
              const P = H.ejes(ctx, w, h, { xmin: 0, xmax, ymin: 0, ymax, xlabel: 'VCE (V)', ylabel: 'IC (mA)', ml: 48 });
              // zonas
              ctx.save(); ctx.globalAlpha = 0.1; ctx.fillStyle = H.col('red');
              ctx.fillRect(P.X(0), P.y0, P.X(0.3) - P.X(0), P.h); ctx.restore();
              // familia de curvas
              const ibRef = Math.max(S.Ib, 1e-9);
              const paso = (ymax / 1e3) / S.beta / 6;
              const mag = Math.pow(10, Math.floor(Math.log10(paso)));
              const dIb = [1, 2, 5, 10].map(m => m * mag).find(v => v >= paso) || paso;
              for (let k = 1; k <= 8; k++) {
                const ib = k * dIb;
                if (S.beta * ib * 1e3 > ymax * 1.3) break;
                P.fn(v => icBJT(v, ib, S.beta, Infinity) * 1e3, { color: H.col('muted'), ancho: 1.2 });
                const iy = icBJT(xmax * 0.98, ib, S.beta, Infinity) * 1e3;
                if (iy < ymax * 0.97) P.texto(xmax, iy, H.fmt(ib, 'A', 2), { color: H.col('muted'), align: 'right', base: 'bottom', dy: -2, font: '11px sans-serif' });
              }
              // curva de la Ib actual
              if (S.Ib > 0) {
                P.fn(v => icBJT(v, S.Ib, S.beta, Infinity) * 1e3, { color: H.col('c1'), ancho: 2.5 });
                const iy = icBJT(xmax * 0.6, S.Ib, S.beta, Infinity) * 1e3;
                if (iy < ymax) P.texto(xmax * 0.6, iy, 'IB = ' + H.fmt(S.Ib, 'A'), { color: H.col('c1'), base: 'bottom', dy: -4 });
              }
              // recta de carga
              P.pts([[0, S.Vcc / S.Rc * 1e3], [S.Vcc, 0]], { color: H.col('c2'), ancho: 2, guiones: [7, 5] });
              P.texto(S.Vcc, 0, 'VCC', { color: H.col('c2'), align: 'center', base: 'bottom', dy: -18 });
              P.texto(0, S.Vcc / S.Rc * 1e3, ' VCC/RC', { color: H.col('c2'), base: 'bottom', dy: -2 });
              // punto Q
              const cq = S.region === 'activa' ? H.col('green') : S.region === 'saturación' ? H.col('red') : H.col('amber');
              P.vline(S.Vce, { color: cq }); P.hline(S.Ic * 1e3, { color: cq });
              P.punto(S.Vce, S.Ic * 1e3, { color: cq, r: 6, label: 'Q' });
            },
          });
          const lec = H.lecturas(vista);
          const nota = H.nota(vista);

          function resolver() {
            const Vcc = vcc.value, Vbb = vbb.value, Rb = rb.value, Rc = rc.value, b = beta.value;
            const Ib = Vbb > 0.7 ? (Vbb - 0.7) / Rb : 0;
            let Vce = Vcc, Ic = 0;
            if (Ib > 0) {
              // intersección curva-recta por bisección
              let a = 0, c = Vcc;
              for (let n = 0; n < 70; n++) {
                const m = (a + c) / 2;
                if (icBJT(m, Ib, b, Infinity) - (Vcc - m) / Rc > 0) c = m; else a = m;
              }
              Vce = (a + c) / 2; Ic = (Vcc - Vce) / Rc;
            }
            let region = 'corte';
            if (Ib > 0) region = Ic < 0.9 * b * Ib ? 'saturación' : 'activa';
            return { Vcc, Vbb, Rb, Rc, beta: b, Ib, Ic, Vce, region, P: Vce * Ic + (Ib > 0 ? 0.7 * Ib : 0) };
          }

          function upd() {
            S = resolver();
            const colReg = S.region === 'activa' ? 'var(--green)' : S.region === 'saturación' ? 'var(--red)' : 'var(--amber)';
            fig.innerHTML = Esq.svg(440, 215, [
              Esq.bat(50, 120, 50, 185, 'VBB', H.fmt(S.Vbb, 'V'), -1), Esq.cable([[50, 120], [90, 120]]), Esq.R(90, 120, 200, 120, 'RB', H.fmt(S.Rb, 'Ω'), 1),
              Esq.bjt(230, 120, 'NPN'), Esq.R(242, 25, 242, 90, 'RC', H.fmt(S.Rc, 'Ω'), -1), Esq.cable([[242, 25], [380, 25], [380, 60]]),
              Esq.bat(380, 60, 380, 160, 'VCC', H.fmt(S.Vcc, 'V'), 1), Esq.cable([[380, 160], [380, 195], [50, 195], [50, 185]]),
              Esq.cable([[242, 150], [242, 195]]), Esq.nodo(242, 195),
              Esq.texto(145, 150, 'IB = ' + H.fmt(S.Ib, 'A'), { color: 'var(--c2)', size: 12 }),
              Esq.texto(256, 58, 'IC = ' + H.fmt(S.Ic, 'A'), { color: 'var(--c2)', size: 12, anchor: 'start' }),
              Esq.texto(262, 128, 'VCE = ' + H.fmt(S.Vce, 'V'), { color: 'var(--c1)', size: 12, anchor: 'start' }),
              Esq.texto(200, 212, S.region.toUpperCase(), { color: colReg, size: 13 }),
            ]);
            canvas.redibujar();
            const est = S.region === 'activa' ? 'ok' : S.region === 'saturación' ? 'mal' : 'alerta';
            lec.set([
              { k: 'Región', v: S.region, estado: est },
              { k: 'IB', v: H.fmt(S.Ib, 'A') },
              { k: 'IC', v: H.fmt(S.Ic, 'A') },
              { k: 'β·IB (lo que “pediría”)', v: H.fmt(S.beta * S.Ib, 'A') },
              { k: 'VCE', v: H.fmt(S.Vce, 'V') },
              { k: 'P en el transistor', v: H.fmt(S.P, 'W'), estado: S.P > 0.5 ? 'mal' : S.P > 0.3 ? 'alerta' : '' },
            ]);
            let t;
            if (S.region === 'corte') t = '<b>Corte:</b> VBB no alcanza los 0,7 V que necesita la juntura base‑emisor, así que IB = 0 e IC = 0. Toda la tensión queda entre colector y emisor (VCE = VCC): es una <b>llave abierta</b>.';
            else if (S.region === 'activa') t = `<b>Activa:</b> IC = β·IB = ${H.num(S.beta, 0)} × ${H.fmt(S.Ib, 'A')} ≈ ${H.fmt(S.Ic, 'A')}. El punto Q está sobre la recta, ${S.Vce > 0.35 * S.Vcc && S.Vce < 0.65 * S.Vcc ? '<b>bien centrado</b>: ideal para amplificar.' : 'pero no centrado: como amplificador recortaría la señal de un lado.'} Probá duplicar β: ¿cuánto se mueve Q?`;
            else t = `<b>Saturación:</b> β·IB pediría ${H.fmt(S.beta * S.Ib, 'A')}, pero RC solo deja pasar como mucho VCC/RC ≈ ${H.fmt(S.Vcc / S.Rc, 'A')}. El transistor “se abre a fondo” y queda VCE ≈ ${H.fmt(S.Vce, 'V')}: es una <b>llave cerrada</b>. Subir más IB ya no cambia IC.`;
            if (S.P > 0.5) t += ' <b>¡Ojo!</b> Disipa más de 0,5 W: un BC547 se quemaría.';
            nota.innerHTML = t;
          }
          upd();
        },
      },
      {
        titulo: 'Transistor como llave desde un pin de Arduino',
        descripcion: 'Elegí la carga, ajustá RB y β, y prendé o apagá el pin. ¿Satura? ¿Cuánta corriente le pide al pin? Probá el botón “Calcular RB ideal”.',
        montar(cont, H) {
          const { controles, vista } = H.layout(cont);
          const CARGAS = {
            led: { t: 'LED rojo + 470 Ω a 12 V', vcc: 12, vd: 2, R: 470, inom: 0.02 },
            rele: { t: 'Relé 12 V / 30 mA (bobina 400 Ω)', vcc: 12, vd: 0, R: 400, inom: 0.03 },
            motor: { t: 'Motorcito 5 V (≈ 20 Ω, 250 mA)', vcc: 5, vd: 0, R: 20, inom: 0.25 },
          };
          const carga = H.select(controles, { label: 'Carga en el colector', opciones: Object.entries(CARGAS).map(([v, c]) => ({ v, t: c.t })), value: 'led', onChange: upd });
          const vpinSel = H.select(controles, { label: 'Placa', opciones: [{ v: '5', t: 'Arduino UNO (pin de 5 V)' }, { v: '3.3', t: 'ESP32 (pin de 3,3 V)' }], value: '5', onChange: upd });
          const rb = H.slider(controles, { label: 'RB', min: 100, max: 220e3, log: true, value: 47e3, unidad: 'Ω', onInput: upd });
          const beta = H.slider(controles, { label: 'β del transistor (mín. de hoja de datos)', min: 50, max: 400, step: 5, value: 100, fmt: v => H.num(v, 0), onInput: upd });
          const diodo = H.check(controles, { label: 'Diodo de rueda libre (relé/motor)', value: true, onChange: upd });
          H.sep(controles);
          let pinHigh = true;
          const bPin = H.boton(controles, '', () => { pinHigh = !pinHigh; if (!pinHigh) apagado(); upd(); }, 'btn primario');
          H.boton(controles, 'Calcular RB ideal', calcular, 'btn');

          const fig = H.el('div'); vista.append(fig);
          // historial de VCE para mostrar el pico inductivo
          const hist = []; let pico = 0, t0 = 0, S = {}; const picoMax = { t: -99, v: 0 };
          function apagado() { const c = CARGAS[carga.value]; if (c.vd === 0 && S.Ic > 0.002) pico = diodo.value ? 0.7 : 1; }
          const canvas = H.canvas(vista, {
            alto: 200,
            dibujar(ctx, w, h) {
              const c = CARGAS[carga.value];
              const izq = Math.min(170, w * 0.32);
              // dibujo de la carga
              const cx = izq / 2, cy = h / 2 - 8;
              ctx.fillStyle = H.col('muted'); ctx.font = '600 12px sans-serif'; ctx.textAlign = 'center';
              if (carga.value === 'led') {
                H.brillo(ctx, cx, cy, 20, S.Ic / c.inom, '#ff3b30');
                ctx.fillText('LED: ' + H.num(Math.min(100, S.Ic / c.inom * 100), 0) + ' %', cx, h - 18);
              } else if (carga.value === 'rele') {
                const on = S.Ic >= 0.75 * c.inom;
                ctx.strokeStyle = H.col('ink'); ctx.lineWidth = 2;
                ctx.strokeRect(cx - 34, cy - 30, 68, 60);
                ctx.beginPath(); ctx.arc(cx - 18, cy + 10, 3, 0, 7); ctx.arc(cx + 18, cy + 10, 3, 0, 7); ctx.fillStyle = H.col('ink'); ctx.fill();
                ctx.beginPath(); ctx.moveTo(cx - 18, cy + 10); ctx.lineTo(cx + 16, on ? cy + 8 : cy - 12); ctx.stroke();
                ctx.fillStyle = on ? H.col('green') : H.col('muted');
                ctx.fillText(on ? 'relé ENGANCHADO' : (S.Ic > 0.001 ? 'no engancha' : 'relé suelto'), cx, h - 18);
              } else {
                const vel = Math.min(1, S.Ic / c.inom);
                ctx.strokeStyle = H.col('ink'); ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(cx, cy, 30, 0, 7); ctx.stroke();
                ctx.save(); ctx.translate(cx, cy); ctx.rotate(t0 * 12 * vel);
                ctx.fillStyle = H.col('c1');
                for (let k = 0; k < 3; k++) { ctx.rotate(2.094); ctx.beginPath(); ctx.ellipse(0, -14, 6, 14, 0, 0, 7); ctx.fill(); }
                ctx.restore();
                ctx.fillStyle = H.col('muted');
                ctx.fillText('motor: ' + H.num(vel * 100, 0) + ' % vel.', cx, h - 18);
              }
              // gráfico VCE(t)
              const ymax = c.vcc * 1.6;
              const P = H.ejes(ctx, w, h, { x0: izq + 44, w: w - izq - 56, xmin: -4, xmax: 0, ymin: 0, ymax, xlabel: 't (s)', ylabel: 'VCE (V)', nx: 4, ny: 4 });
              P.hline(c.vcc, { color: H.col('muted'), label: 'VCC' });
              const pts = hist.map(([t, v]) => [t - t0, Math.min(v, ymax * 0.98)]);
              if (pts.length > 1) P.pts(pts, { color: H.col('c1'), ancho: 2 });
              if (picoMax.v > ymax && t0 - picoMax.t < 3.5) P.texto(picoMax.t - t0, ymax * 0.78, '¡pico de ' + H.num(picoMax.v, 0) + ' V!', { color: H.col('red'), align: picoMax.t - t0 < -2 ? 'left' : 'right', dx: picoMax.t - t0 < -2 ? 6 : -6 });
            },
          });
          const lec = H.lecturas(vista);
          const nota = H.nota(vista);

          function resolver() {
            const c = CARGAS[carga.value];
            const Vpin = parseFloat(vpinSel.value);
            const b = beta.value, Rb = rb.value;
            const Ib = pinHigh && Vpin > 0.7 ? (Vpin - 0.7) / Rb : 0;
            const IcSat = Math.max(0, (c.vcc - c.vd - 0.2) / c.R);
            let Ic, Vce, sat = false;
            if (Ib <= 0) { Ic = 0; Vce = c.vcc - c.vd; }
            else if (b * Ib >= IcSat) { Ic = IcSat; Vce = 0.2; sat = true; }
            else { Ic = b * Ib; Vce = c.vcc - c.vd - Ic * c.R; }
            if (Ib <= 0 && carga.value === 'led') Vce = c.vcc - 1.6; // LED apagado: casi toda la tensión en el transistor
            return { c, Vpin, b, Rb, Ib, IcSat, Ic, Vce, sat, P: Vce * Ic };
          }

          function upd() {
            S = resolver();
            const c = S.c;
            bPin.textContent = pinHigh ? 'Pin en HIGH → pasar a LOW' : 'Pin en LOW → pasar a HIGH';
            const carg = carga.value === 'led'
              ? [Esq.R(212, 26, 212, 92, 'R', '470 Ω', 1), Esq.LED(212, 92, 212, 160, 'LED', '', -1)]
              : [Esq.cable([[212, 26], [212, 45]]),
                carga.value === 'rele' ? Esq.L(212, 45, 212, 140, 'Relé', '400 Ω', -1) : Esq.motor(212, 45, 212, 140, 'Motor', '20 Ω', -1),
                Esq.cable([[212, 140], [212, 160]]),
                ...(diodo.value ? [Esq.nodo(212, 45), Esq.nodo(212, 140), Esq.cable([[212, 45], [290, 45]]), Esq.D(290, 140, 290, 45, 'D', '1N4007', 1), Esq.cable([[212, 140], [290, 140]])] : [])];
            const colEst = !pinHigh ? 'var(--muted)' : S.sat ? 'var(--green)' : 'var(--red)';
            fig.innerHTML = Esq.svg(420, 255, [
              `<rect x="8" y="160" width="58" height="56" rx="6" fill="none" stroke="currentColor" stroke-width="2"/>`,
              Esq.texto(37, 183, 'Arduino', { size: 11 }), Esq.texto(37, 200, 'D8: ' + (pinHigh ? 'HIGH' : 'LOW'), { size: 11, color: pinHigh ? 'var(--green)' : 'var(--muted)' }),
              Esq.cable([[66, 190], [80, 190]]), Esq.R(80, 190, 170, 190, 'RB', H.fmt(S.Rb, 'Ω'), 1), Esq.bjt(200, 190, 'NPN'),
              Esq.borne(212, 22, '+' + H.num(c.vcc, 1) + ' V', 0, -10), ...carg,
              Esq.cable([[212, 220], [212, 236]]), Esq.masa(212, 236), Esq.cable([[37, 216], [37, 236], [212, 236]]),
              Esq.texto(125, 228, 'IB = ' + H.fmt(S.Ib, 'A'), { color: 'var(--c2)', size: 12 }),
              Esq.texto(232, 186, 'VCE = ' + H.fmt(S.Vce, 'V'), { color: 'var(--c1)', size: 12, anchor: 'start' }),
              Esq.texto(232, 204, 'IC = ' + H.fmt(S.Ic, 'A'), { color: 'var(--c2)', size: 12, anchor: 'start' }),
              Esq.texto(330, 238, !pinHigh ? 'CORTE' : S.sat ? 'SATURADO' : 'NO SATURA', { color: colEst, size: 14 }),
            ]);
            const ibMal = S.Ib > 0.02;
            lec.set([
              { k: 'Estado', v: !pinHigh ? 'corte (apagado)' : S.sat ? 'saturado ✔' : 'activa ✘', estado: !pinHigh ? '' : S.sat ? 'ok' : 'mal' },
              { k: 'IB (sale del pin)', v: H.fmt(S.Ib, 'A'), estado: ibMal ? 'mal' : '' },
              { k: 'IC necesaria (saturado)', v: H.fmt(S.IcSat, 'A') },
              { k: 'β·IB disponible', v: H.fmt(S.b * S.Ib, 'A'), estado: pinHigh ? (S.b * S.Ib >= S.IcSat ? 'ok' : 'mal') : '' },
              { k: 'IC real', v: H.fmt(S.Ic, 'A') },
              { k: 'P en el transistor', v: H.fmt(S.P, 'W'), estado: S.P > 0.5 ? 'mal' : S.P > 0.25 ? 'alerta' : '' },
            ]);
            let t = '';
            if (ibMal) t += `<b>¡Alerta!</b> El pin estaría entregando ${H.fmt(S.Ib, 'A')}: más de los 20 mA recomendados (40 mA es el máximo absoluto). Subí RB. `;
            if (!pinHigh) t += '<b>Pin en LOW:</b> no hay corriente de base, el transistor está en corte y la carga apagada. ';
            else if (S.sat) t += `<b>Saturado:</b> el transistor podría dar hasta ${H.fmt(S.b * S.Ib, 'A')}, más que los ${H.fmt(S.IcSat, 'A')} que pide la carga, así que se comporta como una llave cerrada (VCE ≈ 0,2 V) y casi no calienta. Factor de saturación: ${H.num(S.b * S.Ib / S.IcSat, 1)}${S.b * S.Ib / S.IcSat < 2 ? ' (justo: con un transistor de β más bajo podría no saturar).' : '.'} `;
            else t += `<b>No satura:</b> con RB = ${H.fmt(S.Rb, 'Ω')} la base recibe ${H.fmt(S.Ib, 'A')} y el transistor solo puede dar β·IB = ${H.fmt(S.b * S.Ib, 'A')}, menos que lo que pide la carga. Queda en región activa con VCE = ${H.fmt(S.Vce, 'V')}, la carga funciona “a medias” y el transistor disipa ${H.fmt(S.P, 'W')}. Bajá RB. `;
            if (carga.value === 'motor' && S.Ic > 0.1) t += '(Un BC547 no aguanta más de 100 mA: para esta carga usá un 2N2222 o un TIP31.) ';
            if (c.vd === 0 && !diodo.value) t += '<b>Sin diodo de rueda libre:</b> apagá el pin y mirá el gráfico: la bobina genera un pico enorme en el colector.';
            nota.innerHTML = t;
            canvas.redibujar();
          }

          function calcular() {
            const c = CARGAS[carga.value];
            const Vpin = parseFloat(vpinSel.value);
            const Ic = (c.vcc - c.vd - 0.2) / c.R, b = beta.value, k = 3;
            const Ib = k * Ic / b;
            const Rcalc = (Vpin - 0.7) / Ib;
            const Rcom = e12Abajo(Rcalc);
            rb.value = Rcom;
            pinHigh = true;
            upd();
            nota.innerHTML = String.raw`<b>Cómo se calcula RB:</b><br>
              1) Corriente que pide la carga: $I_C=\frac{${H.num(c.vcc, 1)}${c.vd ? ' - ' + H.num(c.vd, 1) : ''} - 0{,}2}{${H.num(c.R, 0)}\,\Omega}=${tex(H.fmt(Ic, 'A'))}$<br>
              2) Con β mínimo ${H.num(b, 0)} y factor de saturación ${k}: $I_B=${k}\cdot\frac{I_C}{\beta}=${tex(H.fmt(Ib, 'A'))}$<br>
              3) $R_B=\frac{V_{pin}-0{,}7}{I_B}=\frac{${H.num(Vpin, 1).replace(',', '{,}')} - 0{,}7}{I_B}=${tex(H.fmt(Rcalc, 'Ω'))}$ → valor comercial inferior: <b>${H.fmt(Rcom, 'Ω')}</b>.<br>
              ${Ib > 0.02 ? '<b>Atención:</b> la base necesitaría más de 20 mA: este transistor no sirve con este pin; usá un Darlington (TIP122) o un MOSFET logic level.' : 'El pin entrega ' + H.fmt((Vpin - 0.7) / Rcom, 'A') + ', bien por debajo de 20 mA.'}`;
            if (window.renderMathInElement) renderMathInElement(nota, { delimiters: [{ left: '$', right: '$', display: false }], throwOnError: false });
          }

          // animación: historial de VCE y pico inductivo al apagar
          let ultimo = 0, pico_t = 0;
          H.loop((t) => {
            t0 = t;
            const c = CARGAS[carga.value];
            let v = S.Vce;
            if (pico) {
              // decaimiento del pico: sin diodo, cientos de volts; con diodo, VCC + 0,7 V
              const sinD = pico === 1;
              v = sinD ? c.vcc + 300 * Math.exp(-(pico_t += 1 / 60) * 15) : c.vcc + 0.7 * Math.exp(-(pico_t += 1 / 60) * 8);
              if (v > picoMax.v || t - picoMax.t > 1) { picoMax.v = v; picoMax.t = t; }
              if (pico_t > 0.6) { pico = 0; pico_t = 0; }
            }
            if (t - ultimo > 1 / 30) { hist.push([t, v]); ultimo = t; while (hist.length && hist[0][0] < t - 4.2) hist.shift(); }
            canvas.redibujar();
          });
          upd();
        },
      },
    ],

    ejercicios: [
      {
        nivel: 'Básico',
        enunciado: String.raw`Un transistor NPN con $\beta=150$ tiene una corriente de base de $40\,\mu\text{A}$ y trabaja en región activa. Calculá $I_C$ e $I_E$.`,
        pista: String.raw`$I_C=\beta I_B$ y $I_E=I_C+I_B$.`,
        solucion: String.raw`$I_C=150\cdot40\,\mu\text{A}=6000\,\mu\text{A}=6\,\text{mA}$. &nbsp; $I_E=6\,\text{mA}+0{,}04\,\text{mA}=6{,}04\,\text{mA}$. Como ves, $I_E\approx I_C$.`,
      },
      {
        nivel: 'Básico',
        enunciado: String.raw`Con el multímetro medís tres transistores NPN en un circuito con $V_{CC}=12\,\text{V}$: (a) $V_{BE}=0{,}1\,\text{V}$, $V_{CE}=12\,\text{V}$; (b) $V_{BE}=0{,}68\,\text{V}$, $V_{CE}=5{,}2\,\text{V}$; (c) $V_{BE}=0{,}75\,\text{V}$, $V_{CE}=0{,}15\,\text{V}$. ¿En qué región está cada uno?`,
        pista: 'Mirá primero si la juntura base‑emisor conduce (≈ 0,7 V) y después cuánto vale VCE.',
        solucion: String.raw`(a) $V_{BE}$ muy chico → no conduce la base → <b>corte</b> (y toda la tensión cae en el transistor). (b) $V_{BE}\approx0{,}7$ y $V_{CE}$ intermedio → <b>activa</b>. (c) $V_{BE}\approx0{,}7$ y $V_{CE}<0{,}2\,\text{V}$ → <b>saturación</b> (llave cerrada).`,
      },
      {
        nivel: 'Intermedio',
        enunciado: String.raw`Polarización fija: $V_{CC}=V_{BB}=9\,\text{V}$, $R_B=330\,\text{k}\Omega$, $R_C=1\,\text{k}\Omega$, $\beta=150$. Calculá $I_B$, $I_C$, $V_{CE}$ y la potencia en el transistor. Indicá los dos extremos de la recta de carga.`,
        pista: String.raw`$I_B=(V_{BB}-0{,}7)/R_B$. Para la recta: $V_{CE}$ con $I_C=0$, e $I_C$ con $V_{CE}=0$.`,
        solucion: String.raw`$I_B=\frac{9-0{,}7}{330\,\text{k}\Omega}=25{,}2\,\mu\text{A}$; $I_C=150\cdot25{,}2\,\mu\text{A}=3{,}77\,\text{mA}$; $V_{CE}=9-3{,}77\cdot1=5{,}23\,\text{V}$ → activa. $P=5{,}23\cdot3{,}77\,\text{mA}=19{,}7\,\text{mW}$.<br>Recta de carga: corte en $(9\,\text{V};\,0)$ y saturación en $(0;\,9\,\text{mA})$. El punto Q está cerca del medio. Verificalo en la simulación 1.`,
      },
      {
        nivel: 'Intermedio',
        enunciado: String.raw`Querés prender con un Arduino UNO (5 V) un ventilador de 12 V que consume 80 mA, usando un BC547 ($\beta_{min}=110$). Calculá $R_B$ con un factor de saturación de 3, elegí el valor comercial y verificá la corriente del pin. ¿Qué componente extra hace falta?`,
        pista: String.raw`$I_B=3\cdot I_C/\beta_{min}$; $R_B=(5-0{,}7)/I_B$ y redondeás hacia abajo.`,
        solucion: String.raw`$I_B=3\cdot\frac{80\,\text{mA}}{110}=2{,}18\,\text{mA}$. $R_B=\frac{4{,}3\,\text{V}}{2{,}18\,\text{mA}}=1{,}97\,\text{k}\Omega$ → comercial <b>1,8 kΩ</b> → $I_B=\frac{4{,}3}{1{,}8\,\text{k}}=2{,}39\,\text{mA}$ (el pin lo da sin problema, < 20 mA). Disipación: $0{,}2\,\text{V}\cdot80\,\text{mA}=16\,\text{mW}$. Como el ventilador es un motor (bobina), hace falta un <b>diodo de rueda libre</b> (1N4007) en paralelo, cátodo al +12 V. Ojo: 80 mA está cerca del límite de 100 mA del BC547; un 2N2222 da más margen.`,
      },
      {
        nivel: 'Avanzado',
        enunciado: String.raw`Polarización por divisor: $V_{CC}=15\,\text{V}$, $R_1=56\,\text{k}\Omega$, $R_2=10\,\text{k}\Omega$, $R_C=2{,}2\,\text{k}\Omega$, $R_E=680\,\Omega$, $\beta=150$. Calculá el punto Q en forma exacta (con Thévenin) y con la aproximación rápida. ¿Cuánto difieren?`,
        pista: String.raw`$V_{th}=V_{CC}\frac{R_2}{R_1+R_2}$, $R_{th}=R_1\parallel R_2$, $I_B=\frac{V_{th}-0{,}7}{R_{th}+(\beta+1)R_E}$. Aproximado: $I_E\approx(V_{th}-0{,}7)/R_E$.`,
        solucion: String.raw`$V_{th}=15\cdot\frac{10}{66}=2{,}273\,\text{V}$; $R_{th}=\frac{56\cdot10}{66}=8{,}48\,\text{k}\Omega$.<br>
        Exacto: $I_B=\frac{1{,}573}{8{,}48+151\cdot0{,}68}\,\text{mA}=\frac{1{,}573}{111{,}2}=14{,}1\,\mu\text{A}$; $I_C=2{,}12\,\text{mA}$; $I_E=2{,}14\,\text{mA}$; $V_{CE}=15-2{,}12\cdot2{,}2-2{,}14\cdot0{,}68=8{,}88\,\text{V}$.<br>
        Aproximado: $I_C\approx\frac{1{,}573}{0{,}68}=2{,}31\,\text{mA}$; $V_{CE}\approx15-2{,}31\cdot(2{,}2+0{,}68)=8{,}34\,\text{V}$.<br>
        Diferencia en $I_C$ ≈ 9 %. La aproximación es buena porque $(\beta+1)R_E=102{,}7\,\text{k}\Omega$ es unas 12 veces $R_{th}$.`,
      },
      {
        nivel: 'Avanzado',
        enunciado: String.raw`Un TIP31 (TO‑220, sin disipador, $R_{th}=62{,}5\,°\text{C/W}$) maneja una lámpara de 0,5 A. Si por un error de diseño queda en región activa con $V_{CE}=6\,\text{V}$, ¿qué temperatura alcanza (ambiente 25 °C)? ¿Y si está bien saturado con $V_{CE(sat)}=0{,}3\,\text{V}$?`,
        pista: String.raw`$P=V_{CE}I_C$ y $T_j=T_{amb}+P\cdot R_{th}$.`,
        solucion: String.raw`Activa: $P=6\cdot0{,}5=3\,\text{W}$ → $T_j=25+3\cdot62{,}5=212{,}5\,°\text{C}$: se quema (máx 150 °C).<br>Saturado: $P=0{,}3\cdot0{,}5=0{,}15\,\text{W}$ → $T_j=25+9{,}4=34{,}4\,°\text{C}$: apenas tibio. <b>Moraleja:</b> la llave tiene que estar bien saturada.`,
      },
      {
        nivel: 'Avanzado',
        enunciado: String.raw`Con un TIP122 (Darlington, $\beta_{min}=1000$, $V_{BE}\approx1{,}4\,\text{V}$, $V_{CE(sat)}\approx1\,\text{V}$) querés manejar desde Arduino una tira de LED de 12 V y 2 A. Calculá $R_B$ con factor de saturación 2 y la potencia que disipa el transistor.`,
        pista: String.raw`Igual que con un transistor común, pero con $V_{BE}=1{,}4\,\text{V}$.`,
        solucion: String.raw`$I_B=2\cdot\frac{2\,\text{A}}{1000}=4\,\text{mA}$; $R_B=\frac{5-1{,}4}{4\,\text{mA}}=900\,\Omega$ → <b>820 Ω</b> ($I_B=4{,}39\,\text{mA}$, aceptable para el pin). $P=1\,\text{V}\cdot2\,\text{A}=2\,\text{W}$: <b>necesita disipador</b> (sin él llegaría a $25+2\cdot62{,}5=150\,°\text{C}$). Un MOSFET logic level (tema 15) disiparía unas 20 veces menos.`,
      },
    ],

    quiz: [
      { pregunta: 'En un BJT en región activa, la corriente de colector depende principalmente de…', opciones: ['La tensión VCE', 'La corriente de base (IC = β·IB)', 'La resistencia de base solamente', 'La tensión de la fuente VCC'], correcta: 1, explicacion: 'En activa las curvas de salida son casi horizontales: IC la fija IB (y β), no VCE.' },
      { pregunta: 'Medís VBE = 0,72 V y VCE = 0,15 V en un NPN. Está en…', opciones: ['Corte', 'Activa', 'Saturación', 'Ruptura'], correcta: 2, explicacion: 'Base conduciendo y VCE menor a 0,2 V: saturación, llave cerrada.' },
      { pregunta: '¿Por qué la polarización por divisor con RE es más estable que la fija?', opciones: ['Porque usa más resistencias', 'Porque RE produce realimentación negativa e IC ≈ (Vth − 0,7)/RE no depende de β', 'Porque el divisor aumenta β', 'Porque el transistor trabaja en saturación'], correcta: 1, explicacion: 'Si IC sube, sube VE, baja VBE y baja IB: el circuito se autocorrige y casi no depende de β.' },
      { pregunta: 'Para usar un transistor como llave, la corriente de base se calcula con…', opciones: ['El β típico', 'El β máximo', 'El β mínimo y un factor de saturación de 2 a 5', 'No importa β'], correcta: 2, explicacion: 'Con el peor caso (β mínimo) y margen extra, cualquier transistor del lote satura.' },
      { pregunta: 'El diodo en paralelo con la bobina de un relé sirve para…', opciones: ['Que el relé enganche más rápido', 'Proteger el transistor del pico de tensión al apagar', 'Rectificar la tensión', 'Bajar la corriente del relé'], correcta: 1, explicacion: 'Al cortar la corriente, la bobina genera L·di/dt de cientos de volts. El diodo le da un camino de descarga.' },
      { pregunta: 'Con la prueba de diodos, la punta roja en una pata marca ≈ 0,65 V hacia las otras dos. Esa pata es…', opciones: ['El colector de un PNP', 'La base de un NPN', 'El emisor de un NPN', 'La base de un PNP'], correcta: 1, explicacion: 'En el NPN la base es el ánodo común de las dos junturas: conduce con el + (rojo) en la base.' },
    ],

    docente: String.raw`
<h3>Objetivo de la clase</h3>
<p>Que el alumno entienda el BJT como “corriente chica controla corriente grande”, sepa identificar las tres regiones, ubicar el punto Q con la recta de carga y, sobre todo, <b>diseñar una llave con transistor desde un Arduino</b>, que es lo que más va a usar en la práctica. <b>Duración sugerida:</b> 2 clases de 60–80 min (1: BJT, regiones, recta de carga y polarización; 2: llave, transistores reales y multímetro).</p>
<h3>Secuencia sugerida — Clase 1</h3>
<ol>
<li><b>Disparador (5 min):</b> “Un pin de Arduino da 20 mA. ¿Cómo prendo un motor que consume 1 A?” Dejalo pensar. Introducí la analogía de la canilla.</li>
<li><b>Estructura y relaciones (15 min):</b> NPN/PNP, flecha del emisor, $I_C=\beta I_B$, $I_E=I_C+I_B$. Ejercicio 1 de cabeza.</li>
<li><b>Simulación 1 — regiones (15 min):</b> arrancá con los valores por defecto (activa, Q cerca del medio). Antes de tocar, preguntá: “si bajo RB, ¿qué pasa con IB? ¿y con IC? ¿y con VCE?”. Bajá RB de a poco y mostrá cómo Q sube por la recta hasta pegarse a saturación; ahí IC deja de crecer aunque IB siga subiendo. Después tocá “Cortar”.</li>
<li><b>Recta de carga (10 min):</b> mostrá que al cambiar RC la recta pivota sobre VCC, y que al cambiar VCC se desplaza paralela. Que el alumno calcule los extremos de la recta y los compare con el gráfico.</li>
<li><b>El problema de β (10 min):</b> con Q centrado, tocá “Duplicar β”. Q se va a saturación. Preguntá: “si fabricás 1000 aparatos con transistores distintos, ¿qué pasa?”. Ahí presentás el divisor con RE y hacés en pizarra el ejemplo resuelto (β = 100, 200, 400).</li>
<li><b>Cierre (5 min):</b> ejercicio 2 (identificar regiones). Tarea: ejercicios 3 y 5.</li>
</ol>
<h3>Secuencia sugerida — Clase 2</h3>
<ol>
<li><b>Simulación 2 (20 min):</b> carga LED, RB = 47 kΩ, β = 100: no satura, el LED brilla poco y el transistor disipa. Preguntá por qué. Bajá RB hasta que satura. Después tocá “Calcular RB ideal” y recorré el razonamiento. Cambiá a relé y mostrá “no engancha” con RB grande. Sacá el diodo y apagá el pin: mirá el pico en el gráfico. Probá RB = 100 Ω para ver la alerta del pin.</li>
<li><b>ESP32 a 3,3 V (5 min):</b> cambiá la placa: con la misma RB baja IB. Hay que recalcular.</li>
<li><b>Transistores reales (15 min):</b> tabla de modelos, patas, Darlington. Si tenés transistores a mano, hacé la prueba de diodos con el multímetro en vivo por cámara.</li>
<li><b>Ejercicios 4, 6 y 7</b> (llave y disipación). Cierre con la autoevaluación.</li>
</ol>
<h3>Errores frecuentes</h3>
<ul>
<li>Creer que el transistor “genera” corriente: la corriente sale de la fuente VCC; el transistor solo la dosifica.</li>
<li>Usar $I_C=\beta I_B$ en saturación (da VCE negativa). Siempre verificar la región.</li>
<li>Calcular RB con el β típico en vez del mínimo, o sin factor de saturación.</li>
<li>Olvidar unir las masas del Arduino y de la fuente de la carga.</li>
<li>Olvidar el diodo de rueda libre en relés y motores.</li>
<li>Conectar la base directo al pin sin RB (corriente enorme: quema el pin y la base).</li>
<li>Confundir el orden de patas entre BC547 (C‑B‑E) y 2N2222 (E‑B‑C).</li>
</ul>
<h3>Preguntas disparadoras</h3>
<ul>
<li>Si una llave con transistor calienta, ¿qué está mal?</li>
<li>¿Por qué el amplificador no puede trabajar en saturación ni en corte?</li>
<li>¿Por qué el colector es la capa más grande y la base la más fina?</li>
<li>Un PNP para “prender por arriba” (del lado de +): ¿qué nivel lógico enciende la carga?</li>
</ul>
<h3>Recordatorio rápido para vos</h3>
<ul>
<li>$V_{BE}\approx0{,}6$–$0{,}7\,\text{V}$ (baja ≈ 2 mV/°C con la temperatura). $V_{CE(sat)}\approx0{,}1$–$0{,}3\,\text{V}$ (BC547 a 10 mA con $I_B$ = 0,5 mA: ~0,1 V). Darlington: $V_{BE}\approx1{,}2$–$1{,}4\,\text{V}$, $V_{CE(sat)}\approx0{,}9$–$2\,\text{V}$.</li>
<li>BC547 grupos de ganancia: A (110–220), B (200–450), C (420–800).</li>
<li>Thévenin del divisor: $V_{th}=V_{CC}R_2/(R_1+R_2)$, $R_{th}=R_1\parallel R_2$. Regla de diseño: $V_E\approx V_{CC}/10$, $R_2\le\beta_{min}R_E/10$, $V_{CE}\approx V_{CC}/2$.</li>
<li>Recta de carga con RE: extremos $V_{CC}$ y $V_{CC}/(R_C+R_E)$.</li>
<li>Pines Arduino UNO: 20 mA recomendado por pin, 40 mA absoluto, 200 mA total del chip. ESP32: 3,3 V, ~12–20 mA por pin.</li>
<li>Rueda libre: 1N4148 alcanza para relés chicos; 1N4007 / 1N5819 (Schottky, más rápido) para motores.</li>
</ul>
<h3>Experiencia práctica</h3>
<p><b>Tinkercad Circuits</b> (gratis, en el navegador): Arduino UNO + BC547 + LED con 470 Ω en el colector alimentado a 9 V. Con RB = 100 kΩ medir VCE (no satura), cambiar a 4,7 kΩ y volver a medir (≈ 0,1–0,2 V). Medir IB e IC con el amperímetro y calcular el β forzado. Variante: reemplazar el LED por un motor de CC con su diodo de rueda libre y controlar con <code>digitalWrite</code>. En <b>Falstad</b> (falstad.com/circuit) se puede ver el pico inductivo al sacar el diodo de un relé.</p>
`,
  });
})();
