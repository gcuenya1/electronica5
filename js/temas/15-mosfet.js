/* Tema 15 — MOSFET
   IMPORTANTE: los textos con LaTeX usan String.raw`...` para que "\frac" no se rompa. */
(() => {
  /* ---------- helpers propios del tema (no globales) ---------- */

  // Modelo cuadrático del MOSFET canal N de enriquecimiento (sin modulación de canal)
  function idMOS(vds, vgs, vth, k) {
    const ov = vgs - vth;
    if (ov <= 0 || vds <= 0) return 0;
    return vds < ov ? k * (2 * ov * vds - vds * vds) : k * ov * ov;
  }
  // Punto Q con resistencia de drenador RD y fuente VDD (bisección sobre Vds)
  function puntoQ(vdd, rd, vgs, vth, k) {
    if (vgs <= vth) return { vds: vdd, id: 0 };
    let a = 0, b = vdd;
    for (let n = 0; n < 80; n++) {
      const m = (a + b) / 2;
      if (idMOS(m, vgs, vth, k) - (vdd - m) / rd > 0) b = m; else a = m;
    }
    const vds = (a + b) / 2;
    return { vds, id: (vdd - vds) / rd };
  }

  // Corte transversal del MOSFET (SVG propio)
  function corteSVG() {
    const s = [];
    s.push(`<rect x="40" y="110" width="360" height="110" rx="4" fill="var(--c4)" fill-opacity=".14" stroke="currentColor" stroke-width="1.5"/>`);
    s.push(`<text x="220" y="200" text-anchor="middle" font-size="13" font-weight="700">Sustrato tipo P (cuerpo)</text>`);
    s.push(`<path d="M70 110 h90 v35 q0 15 -15 15 h-60 q-15 0 -15 -15z" fill="var(--c1)" fill-opacity=".25" stroke="currentColor" stroke-width="1.5"/>`);
    s.push(`<path d="M280 110 h90 v35 q0 15 -15 15 h-60 q-15 0 -15 -15z" fill="var(--c1)" fill-opacity=".25" stroke="currentColor" stroke-width="1.5"/>`);
    s.push(`<text x="115" y="140" text-anchor="middle" font-size="13" font-weight="700">N+</text><text x="325" y="140" text-anchor="middle" font-size="13" font-weight="700">N+</text>`);
    // óxido y compuerta
    s.push(`<rect x="150" y="100" width="140" height="10" fill="var(--amber)" fill-opacity=".45" stroke="currentColor" stroke-width="1"/>`);
    s.push(`<rect x="150" y="78" width="140" height="22" fill="var(--muted)" fill-opacity=".55" stroke="currentColor" stroke-width="1.5"/>`);
    s.push(`<text x="220" y="94" text-anchor="middle" font-size="12" font-weight="700">metal / polisilicio</text>`);
    s.push(`<text x="300" y="108" font-size="11" font-weight="600" style="fill:var(--amber)">óxido SiO₂ (aislante)</text>`);
    // canal inducido
    s.push(`<path d="M160 116 H280" stroke="var(--c2)" stroke-width="4" stroke-dasharray="4 3"/>`);
    s.push(`<text x="220" y="133" text-anchor="middle" font-size="11" font-weight="700" style="fill:var(--c2)">canal N inducido (si VGS &gt; Vth)</text>`);
    // contactos
    s.push(`<rect x="95" y="96" width="40" height="14" fill="var(--muted)" fill-opacity=".55" stroke="currentColor"/><rect x="305" y="96" width="40" height="14" fill="var(--muted)" fill-opacity=".55" stroke="currentColor"/>`);
    s.push(`<path d="M115 96 V40 M220 78 V40 M325 96 V40" stroke="currentColor" stroke-width="2"/>`);
    s.push(`<circle cx="115" cy="36" r="4" fill="var(--panel)" stroke="currentColor" stroke-width="2"/><circle cx="220" cy="36" r="4" fill="var(--panel)" stroke="currentColor" stroke-width="2"/><circle cx="325" cy="36" r="4" fill="var(--panel)" stroke="currentColor" stroke-width="2"/>`);
    s.push(`<text x="115" y="24" text-anchor="middle" font-size="13" font-weight="700">S (fuente)</text><text x="220" y="24" text-anchor="middle" font-size="13" font-weight="700">G (compuerta)</text><text x="325" y="24" text-anchor="middle" font-size="13" font-weight="700">D (drenador)</text>`);
    // cuerpo unido a S
    s.push(`<path d="M115 50 H30 V230 H220 V220" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 4" fill="none"/>`);
    s.push(`<text x="34" y="245" font-size="11">en los MOSFET discretos el cuerpo va unido a S</text>`);
    return `<figure class="figura"><svg class="esq" viewBox="0 0 440 255" width="440" height="255" xmlns="http://www.w3.org/2000/svg">${s.join('')}</svg><figcaption>Corte de un MOSFET canal N de enriquecimiento. La compuerta es una “placa de capacitor”: el óxido no deja pasar corriente.</figcaption></figure>`;
  }

  // Curvas Id-Vds estáticas para la teoría
  function curvasSVG() {
    const W = 460, Hh = 250, x0 = 50, y0 = 15, w = 380, h = 195;
    const vth = 2, k = 0.25, vmax = 10, imax = 5;
    const X = (v) => x0 + v / vmax * w, Y = (i) => y0 + h - i / imax * h;
    let s = '';
    for (let v = 0; v <= vmax; v += 2) s += `<path d="M${X(v)} ${y0}V${y0 + h}" stroke="currentColor" stroke-opacity=".12"/><text x="${X(v)}" y="${y0 + h + 16}" font-size="11" text-anchor="middle">${v}</text>`;
    for (let i = 0; i <= imax; i += 1) s += `<path d="M${x0} ${Y(i)}H${x0 + w}" stroke="currentColor" stroke-opacity=".12"/><text x="${x0 - 6}" y="${Y(i) + 4}" font-size="11" text-anchor="end">${i}</text>`;
    s += `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="none" stroke="currentColor" stroke-opacity=".5"/>`;
    [3, 4, 5, 6].forEach((vgs) => {
      let d = '';
      for (let n = 0; n <= 150; n++) { const v = vmax * n / 150; d += (n ? 'L' : 'M') + X(v).toFixed(1) + ' ' + Y(idMOS(v, vgs, vth, k)).toFixed(1); }
      s += `<path d="${d}" fill="none" stroke="var(--c1)" stroke-width="2"/>`;
      s += `<text x="${X(vmax) - 4}" y="${Y(k * (vgs - vth) ** 2) - 5}" font-size="11" text-anchor="end" style="fill:var(--c1)">VGS = ${vgs} V</text>`;
    });
    // frontera Vds = Vgs - Vth
    let d = '';
    for (let n = 0; n <= 60; n++) { const v = 4.4 * n / 60; d += (n ? 'L' : 'M') + X(v).toFixed(1) + ' ' + Y(k * v * v).toFixed(1); }
    s += `<path d="${d}" fill="none" stroke="var(--c2)" stroke-width="1.6" stroke-dasharray="5 4"/>`;
    s += `<text x="${X(0.5)}" y="${Y(4.6)}" font-size="11" font-weight="700" style="fill:var(--c2)">óhmica</text>`;
    s += `<text x="${X(6.5)}" y="${Y(1.6)}" font-size="11" font-weight="700" style="fill:var(--c2)">saturación (Id constante)</text>`;
    s += `<text x="${X(4.6)}" y="${Y(4.75)}" font-size="11" style="fill:var(--c2)">VDS = VGS − Vth</text>`;
    s += `<text x="${X(5)}" y="${Y(0) - 5}" font-size="11" font-weight="700" text-anchor="middle" style="fill:var(--c4)">corte (VGS ≤ Vth = 2 V)</text>`;
    s += `<text x="${x0 + w}" y="${y0 + h + 30}" font-size="12" font-weight="700" text-anchor="end">VDS (V)</text><text x="${x0 + 6}" y="${y0 + 12}" font-size="12" font-weight="700">ID (A)</text>`;
    return `<figure class="figura"><svg class="esq" viewBox="0 0 ${W} ${Hh}" width="${W}" height="${Hh}" xmlns="http://www.w3.org/2000/svg">${s}</svg><figcaption>Curvas de salida de un MOSFET con Vth = 2 V y k = 0,25 A/V². Cada curva es una tensión de compuerta fija.</figcaption></figure>`;
  }

  // Esquema típico Arduino → MOSFET → carga
  function esqArduino(op = {}) {
    const motor = op.carga === 'motor';
    const parts = [
      `<rect x="8" y="150" width="58" height="56" rx="6" fill="none" stroke="currentColor" stroke-width="2"/>`,
      Esq.texto(37, 173, 'Arduino', { size: 11 }), Esq.texto(37, 190, op.pin || 'pin D9 (PWM)', { size: 10, peso: 400 }),
      Esq.cable([[66, 178], [80, 178]]), Esq.R(80, 178, 160, 178, 'Rg', op.rg || '100 Ω', 1), Esq.cable([[160, 178], [190, 178]]), Esq.nodo(172, 178),
      Esq.R(172, 178, 172, 238, 'Rpd', '10 kΩ', -1),
      Esq.mosfet(220, 170, 'N'),
      Esq.cable([[232, 200], [232, 238]]), Esq.cable([[37, 206], [37, 238], [232, 238]]), Esq.nodo(172, 238), Esq.masa(232, 238),
      // diodo interno
      Esq.cable([[232, 140], [282, 140]]), Esq.cable([[232, 200], [282, 200]]), Esq.nodo(232, 140), Esq.nodo(232, 200),
      Esq.D(282, 200, 282, 140, '', '', 1), Esq.texto(296, 168, 'diodo', { size: 10, anchor: 'start', color: 'var(--muted)' }), Esq.texto(296, 180, 'interno', { size: 10, anchor: 'start', color: 'var(--muted)' }),
      Esq.borne(232, 22, op.vdd || '+12 V', 0, -10),
    ];
    if (motor) {
      parts.push(Esq.cable([[232, 26], [232, 45]]), Esq.motor(232, 45, 232, 120, 'Motor', op.vcarga || '12 V', -1), Esq.cable([[232, 120], [232, 140]]),
        Esq.nodo(232, 45), Esq.nodo(232, 120), Esq.cable([[232, 45], [320, 45]]), Esq.D(320, 120, 320, 45, 'D', 'rueda libre', 1), Esq.cable([[232, 120], [320, 120]]));
    } else {
      parts.push(Esq.R(232, 26, 232, 82, 'R', '', -1), Esq.LED(232, 82, 232, 140, op.nomCarga || 'Tira LED', op.vcarga || '12 V', -1));
    }
    if (op.extra) parts.push(...op.extra);
    return Esq.svg(400, 262, parts, op.pie || '');
  }

  registrarTema({
    id: 'mosfet',
    orden: 15,
    titulo: 'MOSFETs',
    resumen: 'Transistor de efecto de campo: control por tensión, Rds(on), llave y PWM con Arduino',
    confirmar: true,

    teoria: String.raw`
<p>El <b>MOSFET</b> (transistor de efecto de campo metal‑óxido‑semiconductor) es hoy el transistor más fabricado del planeta: hay miles de millones en cada procesador, y es el rey de las <b>llaves de potencia</b> (fuentes conmutadas, control de motores, tiras de LED, inversores). La gran diferencia con el BJT: <b>se controla por tensión, no por corriente</b>.</p>
<div class="caja idea"><span class="caja-titulo">Analogía: la canilla con sensor</span>
El BJT es una canilla de manija: para mantenerla abierta tenés que seguir empujando (corriente de base permanente). El MOSFET es como una canilla que se abre por <b>presión</b>: apoyás la mano (aplicás tensión en la compuerta), la canilla se abre, y mientras mantengas la presión sigue abierta <b>sin gastar energía</b>. Solo cuesta un poquito de esfuerzo en el momento de apoyar o sacar la mano (cargar o descargar la compuerta).
</div>

<h2>1. Estructura</h2>
${corteSVG()}
<ul>
<li>Sobre un sustrato tipo P hay dos islas N+: la <b>fuente (S, source)</b> y el <b>drenador (D, drain)</b>.</li>
<li>Entre ellas, por arriba, está la <b>compuerta (G, gate)</b>: una placa metálica separada del silicio por una capa finísima de <b>óxido de silicio</b> (decenas de nanómetros), que es <b>aislante</b>.</li>
<li>Sin tensión en la compuerta, entre S y D hay dos junturas PN enfrentadas: <b>no conduce</b>.</li>
<li>Si aplicamos una tensión positiva entre G y S, el campo eléctrico atraviesa el óxido, empuja los huecos del sustrato y <b>atrae electrones</b> justo debajo de la compuerta. Cuando hay suficientes, se forma un <b>canal N</b> que une S con D: el MOSFET conduce. A esto se le llama <b>enriquecimiento</b> (el canal no existe, se “crea” con la tensión).</li>
</ul>
<div class="caja formula"><span class="caja-titulo">La consecuencia más importante</span>
Como la compuerta está aislada, <b>en continua no circula corriente de compuerta</b>: $I_G\approx0$ (nanoamperes). La compuerta se comporta como un <b>capacitor</b>: solo consume corriente mientras se carga o se descarga.
</div>

<h2>2. Símbolos, terminales y diodo interno</h2>
<div class="dos-col">
<div>
${Esq.svg(240, 140, [
  Esq.mosfet(110, 70, 'N'), Esq.borne(80, 78, 'G', -12, 4), Esq.borne(122, 40, 'D', 14, 4), Esq.borne(122, 100, 'S', 14, 4),
  Esq.cable([[122, 40], [170, 40]]), Esq.cable([[122, 100], [170, 100]]), Esq.D(170, 100, 170, 40, '', '', 1),
  Esq.texto(185, 74, 'diodo', { size: 11, anchor: 'start', color: 'var(--muted)' }), Esq.texto(185, 87, 'interno', { size: 11, anchor: 'start', color: 'var(--muted)' }),
], 'Canal N: conduce de D a S cuando VGS es positiva y mayor que Vth.')}
</div>
<div>
${Esq.svg(240, 140, [
  Esq.mosfet(110, 70, 'P'), Esq.borne(80, 78, 'G', -12, 4), Esq.borne(122, 40, 'D', 14, 4), Esq.borne(122, 100, 'S', 14, 4),
  Esq.cable([[122, 40], [170, 40]]), Esq.cable([[122, 100], [170, 100]]), Esq.D(170, 40, 170, 100, '', '', 1),
  Esq.texto(185, 74, 'diodo', { size: 11, anchor: 'start', color: 'var(--muted)' }), Esq.texto(185, 87, 'interno', { size: 11, anchor: 'start', color: 'var(--muted)' }),
], 'Canal P: todo invertido (VGS negativa). Se usa para conmutar “del lado del +”.')}
</div>
</div>
<div class="tabla-wrap"><table class="tabla">
<tr><th>Terminal</th><th>Nombre</th><th>Equivalente en el BJT</th><th>En un canal N como llave</th></tr>
<tr><td><b>G</b></td><td>Compuerta (gate)</td><td>Base</td><td>Va al pin del Arduino (a través de Rg)</td></tr>
<tr><td><b>D</b></td><td>Drenador (drain)</td><td>Colector</td><td>Va a la carga</td></tr>
<tr><td><b>S</b></td><td>Fuente (source)</td><td>Emisor</td><td>Va a masa</td></tr>
</table></div>
<div class="caja ojo"><span class="caja-titulo">El diodo interno (body diode)</span>
Como el sustrato va unido a la fuente, queda formado un diodo PN entre S y D (en el canal N: <b>ánodo en S, cátodo en D</b>). No se puede evitar: viene “de regalo”. Consecuencias: el MOSFET <b>solo bloquea en un sentido</b>; si invertís la tensión entre D y S, conduce por el diodo aunque la compuerta esté apagada. A veces es útil (hace de diodo de rueda libre en puentes H), pero nunca reemplaza al diodo de protección de un motor en una llave simple.
</div>

<h2>3. Tensión umbral $V_{GS(th)}$</h2>
<p>Es la tensión compuerta‑fuente a partir de la cual empieza a formarse el canal. Valores típicos: <b>1 a 2 V</b> en MOSFET “logic level”, <b>2 a 4 V</b> en los estándar.</p>
<div class="caja ojo"><span class="caja-titulo">Error típico: “con Vth ya conduce”</span>
En la hoja de datos, $V_{GS(th)}$ se define con una corriente ridícula (típicamente $I_D=250\,\mu\text{A}$). <b>En el umbral el MOSFET recién empieza a conducir</b>: para que sea una buena llave hace falta bastante más tensión (2 a 3 veces Vth). Lo que importa es la tensión a la que el fabricante garantiza la $R_{DS(on)}$.
</div>

<h2>4. Regiones de trabajo</h2>
<p>Llamamos <b>tensión de sobreexcitación</b> a $V_{ov}=V_{GS}-V_{th}$ (cuánto “sobra” por encima del umbral).</p>
<div class="tabla-wrap"><table class="tabla">
<tr><th>Región</th><th>Condición</th><th>Corriente de drenador</th><th>Se comporta como…</th><th>Uso</th></tr>
<tr><td><b>Corte</b></td><td>$V_{GS}\le V_{th}$</td><td>$I_D=0$</td><td>Llave abierta</td><td>Apagado</td></tr>
<tr><td><b>Óhmica (lineal, triodo)</b></td><td>$V_{GS}>V_{th}$ y $V_{DS}\lt V_{GS}-V_{th}$</td><td>$I_D=k\left[2(V_{GS}-V_{th})V_{DS}-V_{DS}^2\right]$</td><td>Resistencia chica controlada por $V_{GS}$: $R_{DS}\approx\dfrac{1}{2k(V_{GS}-V_{th})}$</td><td><b>Llave cerrada</b></td></tr>
<tr><td><b>Saturación</b></td><td>$V_{GS}>V_{th}$ y $V_{DS}\ge V_{GS}-V_{th}$</td><td>$I_D=k\,(V_{GS}-V_{th})^2$</td><td>Fuente de corriente controlada por tensión</td><td>Amplificador</td></tr>
</table></div>
<p>El parámetro $k$ (en A/V²) depende de la geometría del transistor: los MOSFET de potencia tienen $k$ enorme (miles de canales en paralelo), los de señal, chico.</p>
<div class="caja ojo"><span class="caja-titulo">¡Cuidado con los nombres!</span>
La palabra “saturación” significa cosas <b>opuestas</b> en los dos transistores:<br>
• <b>BJT saturado</b> = llave cerrada (V<sub>CE</sub> ≈ 0,2 V). &nbsp; • <b>MOSFET en saturación</b> = corriente constante, amplificador (equivale a la región <em>activa</em> del BJT).<br>
La llave cerrada del MOSFET es la región <b>óhmica</b>. Cuando alguien dice “el MOSFET está saturado” en un circuito de potencia, casi siempre quiere decir “totalmente encendido”: preguntá.
</div>
${curvasSVG()}
<div class="caja ejemplo"><span class="caja-titulo">Ejemplo: ¿en qué región está?</span>
MOSFET con $V_{th}=2\,\text{V}$, $k=0{,}5\,\text{A/V}^2$, con $R_D=10\,\Omega$ a $V_{DD}=12\,\text{V}$.
<p><b>a) $V_{GS}=3\,\text{V}$.</b> Suponemos saturación: $I_D=0{,}5\cdot(3-2)^2=0{,}5\,\text{A}$. Entonces $V_{DS}=12-0{,}5\cdot10=7\,\text{V}$. Verificamos: $7\ge3-2=1$ ✔ → <b>saturación</b>. Disipa $P=7\cdot0{,}5=3{,}5\,\text{W}$: ¡calienta mucho!</p>
<p><b>b) $V_{GS}=5\,\text{V}$.</b> En saturación daría $0{,}5\cdot3^2=4{,}5\,\text{A}$, pero la resistencia solo deja pasar $12/10=1{,}2\,\text{A}$ como máximo → tiene que estar en <b>óhmica</b>. Planteando $0{,}5\,[2\cdot3\,V_{DS}-V_{DS}^2]=\frac{12-V_{DS}}{10}$ y resolviendo la cuadrática: $V_{DS}=0{,}415\,\text{V}$, $I_D=1{,}16\,\text{A}$, $R_{DS}=0{,}36\,\Omega$ y $P=0{,}48\,\text{W}$. <b>Más corriente y 7 veces menos calor</b>: así se usa como llave.</p>
</div>

<h2>5. Recta de carga</h2>
<p>Igual que en el BJT: $V_{DD}=I_D R_D+V_{DS}$ → recta entre $(V_{DD};\,0)$ y $(0;\,V_{DD}/R_D)$. El punto Q es el cruce con la curva de la $V_{GS}$ aplicada. Como llave, queremos el punto Q <b>bien abajo a la izquierda</b> (región óhmica, $V_{DS}$ muy chica). Probalo en la simulación 1.</p>

<h2>6. El MOSFET como llave: $R_{DS(on)}$ y pérdidas</h2>
<p>Totalmente encendido, el MOSFET es básicamente una <b>resistencia muy chica</b>, la $R_{DS(on)}$, que el fabricante especifica para una cierta $V_{GS}$ (por ejemplo, 10 V o 4,5 V). Valores típicos: de 2 mΩ a 0,5 Ω.</p>
<div class="caja formula"><span class="caja-titulo">Pérdidas de conducción</span>
$$V_{DS}=I_D\cdot R_{DS(on)}\qquad P=I_D^2\cdot R_{DS(on)}\qquad T_j=T_{amb}+P\cdot R_{th(j-a)}$$
<p>Con PWM de ciclo útil $D$: $P_{media}\approx D\cdot I_D^2\,R_{DS(on)}$ (más unas pérdidas de conmutación que a 490 Hz son despreciables).</p>
</div>
<div class="caja ejemplo"><span class="caja-titulo">Ejemplo: tira de LED de 12 V y 2 A desde Arduino</span>
<b>Con IRLZ44N</b> ($R_{DS(on)}=25\,\text{m}\Omega$ a $V_{GS}=5\,\text{V}$): $P=2^2\cdot0{,}025=0{,}1\,\text{W}$. Sin disipador (TO‑220, $R_{th}\approx62\,°\text{C/W}$): $\Delta T=0{,}1\cdot62=6{,}2\,°\text{C}$. Apenas tibio.<br>
<b>Con un TIP122</b> (Darlington, $V_{CE(sat)}\approx1\,\text{V}$): $P=1\cdot2=2\,\text{W}$ → $\Delta T=124\,°\text{C}$: necesita disipador. <b>20 veces más pérdidas</b>, y además le pide corriente al pin.
</div>
<div class="tabla-wrap"><table class="tabla">
<tr><th></th><th>BJT</th><th>MOSFET</th></tr>
<tr><td>Se controla con</td><td>Corriente de base ($I_B=I_C/\beta$, permanente)</td><td><b>Tensión</b> de compuerta ($I_G\approx0$ en CC)</td></tr>
<tr><td>Caída como llave</td><td>$V_{CE(sat)}\approx0{,}2$–$2\,\text{V}$ (casi fija)</td><td>$I_D\cdot R_{DS(on)}$ (con mΩ, muy chica)</td></tr>
<tr><td>Pérdidas a alta corriente</td><td>Altas ($P=V_{CE(sat)}I_C$)</td><td><b>Bajas</b> (pero crecen con $I^2$)</td></tr>
<tr><td>Velocidad de conmutación</td><td>Media (tarda en salir de saturación)</td><td><b>Muy alta</b>: ideal para PWM</td></tr>
<tr><td>Sensibilidad</td><td>Robusto</td><td>Sensible a la <b>estática</b> en la compuerta</td></tr>
<tr><td>Ideal para</td><td>Señales chicas, relés, amplificadores simples</td><td>Motores, tiras de LED, LED de potencia, fuentes conmutadas</td></tr>
</table></div>

<h2>7. Manejarlo desde Arduino: “logic level” vs estándar</h2>
<div class="tabla-wrap"><table class="tabla">
<tr><th>Modelo</th><th>Tipo</th><th>$V_{GS(th)}$</th><th>$R_{DS(on)}$</th><th>$I_D$ máx</th><th>¿Desde Arduino 5 V?</th></tr>
<tr><td><b>IRLZ44N</b></td><td>Logic level (la “L” en el nombre)</td><td>1–2 V</td><td>22 mΩ @10 V · <b>25 mΩ @5 V</b> · 35 mΩ @4 V</td><td>47 A</td><td>✔ Sí, conduce totalmente</td></tr>
<tr><td><b>IRF540N</b></td><td>Estándar</td><td>2–4 V</td><td>44 mΩ <b>solo garantizada @10 V</b></td><td>33 A</td><td>✘ Puede quedar a medio conducir</td></tr>
<tr><td>IRLML2502 / AO3400</td><td>Logic level SMD chico</td><td>0,6–1,2 V</td><td>~45 mΩ @2,5 V</td><td>4–5 A</td><td>✔ Incluso con 3,3 V (ESP32)</td></tr>
<tr><td>2N7000</td><td>Señal, TO‑92</td><td>0,8–3 V</td><td>~5 Ω @4,5 V</td><td>200 mA</td><td>Para cargas chicas</td></tr>
</table></div>
<div class="caja ojo"><span class="caja-titulo">Por qué el IRF540N “anda pero calienta”</span>
Con 5 V en la compuerta y un $V_{th}$ que puede llegar a 4 V, sobra apenas 1 V de sobreexcitación: el MOSFET queda en la zona de saturación (corriente limitada) o con una $R_{DS}$ alta. Resultado: la carga no recibe toda la corriente y el MOSFET disipa watts. Con <b>3,3 V</b> (ESP32) directamente puede no encender. Soluciones: usar un MOSFET logic level, o un “driver” (un transistor o un integrado) que lleve la compuerta a 10–12 V.
</div>

<h2>8. Las dos resistencias de la compuerta</h2>
${esqArduino({ pie: 'Circuito típico: Rg limita el pico de corriente de carga de la compuerta; Rpd la mantiene apagada cuando el pin queda “flotando”.' })}
<div class="dos-col">
<div class="caja tip"><span class="caja-titulo">Rg ≈ 100 Ω (en serie con la compuerta)</span>
La compuerta es un capacitor ($C_{iss}\approx1$–$2\,\text{nF}$ en un TO‑220). Al conmutar, el pin intenta cargarlo de golpe: sin resistencia, el pico de corriente puede superar lo que aguanta el pin. Con 100 Ω: $I_{pico}=5\,\text{V}/100\,\Omega=50\,\text{mA}$ durante unos cientos de nanosegundos (el pin lo tolera). También amortigua oscilaciones de alta frecuencia por la inductancia de los cables.
</div>
<div class="caja tip"><span class="caja-titulo">Rpd ≈ 10 kΩ (de compuerta a masa)</span>
Mientras el Arduino arranca, se resetea o se carga un programa, los pines quedan como <b>entradas de alta impedancia</b>: la compuerta queda “flotando” y, como es un capacitor, puede cargarse con cualquier ruido y encender a medias el MOSFET (¡calor!) o arrancar el motor sin querer. La pull‑down descarga la compuerta y asegura <b>apagado por defecto</b>.
</div>
</div>
<div class="caja formula"><span class="caja-titulo">Capacidad de compuerta y tiempo de conmutación</span>
$$\tau=R_g\cdot C_{iss}\qquad\text{IRLZ44N: }\tau=100\,\Omega\cdot1{,}7\,\text{nF}=170\,\text{ns}$$
<p>La conmutación dura unos pocos τ (menos de 1 µs). Con el PWM del Arduino (490 Hz → período de 2 ms) es despreciable. A frecuencias altas (fuentes conmutadas de 100 kHz) ya no: ahí se usan drivers de compuerta que dan amperes.</p>
</div>

<h2>9. Manipulación: cuidado con la estática</h2>
<div class="caja ojo"><span class="caja-titulo">El óxido es finísimo</span>
La capa de óxido de la compuerta tiene decenas de nanómetros y se perfora con unas decenas de volts ($V_{GS}$ máx típico ±20 V; IRLZ44N: ±16 V). Una descarga electrostática de tu cuerpo (¡miles de volts!) la destruye sin que lo notes: el MOSFET queda en corto o con fugas.
<ul>
<li>Tocá algo metálico conectado a tierra antes de manipularlos; idealmente, pulsera antiestática.</li>
<li>Guardalos en su espuma conductora o bolsa antiestática.</li>
<li>Nunca dejes la compuerta al aire en un circuito armado: siempre una resistencia a S (la pull‑down).</li>
<li>No superes nunca la $V_{GS}$ máxima (cuidado al manejarlo con 24 V: hace falta un divisor o un zener de 12–15 V entre G y S).</li>
</ul>
</div>
<div class="caja tip"><span class="caja-titulo">Probarlo con el multímetro</span>
En prueba de diodos: entre S (rojo) y D (negro) tiene que aparecer el diodo interno (~0,5 V). Para encenderlo, tocá un instante G con la punta roja (con la negra en S): la compuerta queda cargada y ahora entre D y S marca casi 0. Cortocircuitá G con S para descargarla y vuelve a bloquear. Esta prueba muestra muy bien que la compuerta “guarda” la carga.
</div>
`,

    simulaciones: [
      {
        titulo: 'Curvas ID–VDS, recta de carga y punto Q',
        descripcion: 'Mové VGS y fijate cómo el punto Q pasa de corte a saturación y después a la región óhmica. Probá cambiar Vth y k.',
        montar(cont, H) {
          const { controles, vista } = H.layout(cont);
          const vgs = H.slider(controles, { label: 'VGS (compuerta)', min: 0, max: 10, step: 0.05, value: 3, unidad: 'V', onInput: upd });
          const vth = H.slider(controles, { label: 'Vth (umbral)', min: 0.5, max: 4, step: 0.1, value: 2, unidad: 'V', onInput: upd });
          const kk = H.slider(controles, { label: 'k', min: 0.02, max: 2, log: true, value: 0.5, fmt: v => H.num(v, 3) + ' A/V²', onInput: upd });
          H.sep(controles);
          const vdd = H.slider(controles, { label: 'VDD', min: 1, max: 24, step: 0.5, value: 12, unidad: 'V', onInput: upd });
          const rd = H.slider(controles, { label: 'RD (carga)', min: 1, max: 1000, log: true, value: 10, unidad: 'Ω', onInput: upd });
          const fig = H.el('div'); vista.append(fig);
          let S = {};
          const canvas = H.canvas(vista, {
            alto: (w) => Math.max(240, Math.min(340, w * 0.55)),
            dibujar(ctx, w, h) {
              const ymax = Math.max(S.vdd / S.rd, S.id) * 1.3;
              const xmax = S.vdd * 1.05;
              const P = H.ejes(ctx, w, h, { xmin: 0, xmax, ymin: 0, ymax, xlabel: 'VDS (V)', ylabel: 'ID (A)', ml: 50, yfmt: v => H.fmt(v, 'A', 2) });
              // frontera óhmica/saturación: Id = k·Vds²
              P.fn(v => S.k * v * v, { color: H.col('c4'), ancho: 1.2, guiones: [4, 4] });
              // familia de curvas para VGS enteros
              for (let g = Math.floor(S.vth) + 1; g <= 10; g++) {
                if (Math.abs(g - S.vgs) < 0.05) continue;
                const isat = S.k * (g - S.vth) ** 2;
                P.fn(v => idMOS(v, g, S.vth, S.k), { color: H.col('muted'), ancho: 1.1 });
                if (isat < ymax * 0.95) P.texto(xmax, isat, g + ' V', { color: H.col('muted'), align: 'right', base: 'bottom', dy: -2, font: '11px sans-serif' });
              }
              if (S.vgs > S.vth) {
                P.fn(v => idMOS(v, S.vgs, S.vth, S.k), { color: H.col('c1'), ancho: 2.6 });
                const isat = S.k * (S.vgs - S.vth) ** 2;
                if (isat < ymax * 0.95) P.texto(xmax * 0.62, isat, 'VGS = ' + H.fmt(S.vgs, 'V'), { color: H.col('c1'), base: 'bottom', dy: -4 });
              }
              P.pts([[0, S.vdd / S.rd], [S.vdd, 0]], { color: H.col('c2'), ancho: 2, guiones: [7, 5] });
              P.texto(0, S.vdd / S.rd, ' VDD/RD', { color: H.col('c2'), base: 'bottom', dy: -2 });
              const cq = S.reg === 'óhmica' ? H.col('green') : S.reg === 'saturación' ? H.col('amber') : H.col('muted');
              P.vline(S.vds, { color: cq }); P.hline(S.id, { color: cq });
              P.punto(S.vds, S.id, { color: cq, r: 6, label: 'Q' });
            },
          });
          const lec = H.lecturas(vista);
          const nota = H.nota(vista);
          function upd() {
            const q = puntoQ(vdd.value, rd.value, vgs.value, vth.value, kk.value);
            const ov = vgs.value - vth.value;
            const reg = ov <= 0 ? 'corte' : q.vds < ov ? 'óhmica' : 'saturación';
            S = { vgs: vgs.value, vth: vth.value, k: kk.value, vdd: vdd.value, rd: rd.value, vds: q.vds, id: q.id, reg, P: q.vds * q.id };
            const colR = reg === 'óhmica' ? 'var(--green)' : reg === 'saturación' ? 'var(--amber)' : 'var(--muted)';
            fig.innerHTML = Esq.svg(440, 215, [
              Esq.bat(60, 128, 60, 190, 'VGS', H.fmt(S.vgs, 'V'), -1), Esq.cable([[60, 128], [210, 128]]), Esq.cable([[60, 190], [60, 200], [380, 200]]),
              Esq.mosfet(240, 120, 'N'), Esq.R(252, 25, 252, 90, 'RD', H.fmt(S.rd, 'Ω'), -1), Esq.cable([[252, 150], [252, 200]]), Esq.nodo(252, 200),
              Esq.cable([[252, 25], [380, 25], [380, 70]]), Esq.bat(380, 70, 380, 170, 'VDD', H.fmt(S.vdd, 'V'), 1), Esq.cable([[380, 170], [380, 200]]),
              Esq.texto(135, 118, 'IG = 0', { color: 'var(--c2)', size: 12 }),
              Esq.texto(266, 58, 'ID = ' + H.fmt(S.id, 'A'), { color: 'var(--c2)', size: 12, anchor: 'start' }),
              Esq.texto(272, 124, 'VDS = ' + H.fmt(S.vds, 'V'), { color: 'var(--c1)', size: 12, anchor: 'start' }),
              Esq.texto(170, 165, reg.toUpperCase(), { color: colR, size: 13 }),
            ]);
            canvas.redibujar();
            lec.set([
              { k: 'Región', v: reg, estado: reg === 'óhmica' ? 'ok' : reg === 'saturación' ? 'alerta' : '' },
              { k: 'VGS − Vth', v: H.fmt(ov, 'V') },
              { k: 'ID', v: H.fmt(S.id, 'A') },
              { k: 'VDS', v: H.fmt(S.vds, 'V') },
              { k: 'RDS = VDS / ID', v: S.id > 1e-9 ? H.fmt(S.vds / S.id, 'Ω') : '∞ (abierto)' },
              { k: 'P en el MOSFET', v: H.fmt(S.P, 'W'), estado: S.P > 2 ? 'mal' : S.P > 1 ? 'alerta' : '' },
            ]);
            let t;
            if (reg === 'corte') t = `<b>Corte:</b> VGS = ${H.fmt(S.vgs, 'V')} no supera el umbral Vth = ${H.fmt(S.vth, 'V')}: no hay canal, ID = 0 y toda la tensión queda entre D y S. Fijate que la compuerta <b>no consume corriente</b> en ningún caso.`;
            else if (reg === 'saturación') t = `<b>Saturación (corriente constante):</b> ID = k·(VGS − Vth)² = ${H.num(S.k, 3)} × ${H.num(ov, 2)}² = ${H.fmt(S.id, 'A')}. VDS = ${H.fmt(S.vds, 'V')} es mayor que VGS − Vth, así que Q está a la derecha de la parábola punteada. Sirve para amplificar, pero como llave <b>disipa ${H.fmt(S.P, 'W')}</b>. Subí VGS para llevarlo a la región óhmica.`;
            else t = `<b>Óhmica (llave cerrada):</b> la carga limita la corriente a casi VDD/RD y el MOSFET queda como una resistencia de ${H.fmt(S.vds / S.id, 'Ω')} (≈ 1/(2k(VGS − Vth)) = ${H.fmt(1 / (2 * S.k * ov), 'Ω')} para VDS chicas). Disipa solo ${H.fmt(S.P, 'W')}. ¡Así se usa en potencia!`;
            nota.innerHTML = t;
          }
          upd();
        },
      },
      {
        titulo: 'Llave con PWM: logic level vs estándar',
        descripcion: 'Elegí el MOSFET, la tensión de compuerta y la carga. ¿Conduce totalmente? ¿Cuánto calienta sin disipador?',
        montar(cont, H) {
          const { controles, vista } = H.layout(cont);
          // Modelos calibrados con la hoja de datos (canal cuadrático + resistencia serie fija)
          const MOS = {
            irlz: { t: 'IRLZ44N (logic level)', vth: 1.5, k: 10.86, rf: 0.01659 },
            irf: { t: 'IRF540N (estándar, Vth peor caso 4 V)', vth: 4, k: 2, rf: 0.004 },
          };
          const CARGAS = {
            led: { t: 'Tira LED 12 V / 2 A', R: 6, inom: 2 },
            motor: { t: 'Motor 12 V / 3 A', R: 4, inom: 3 },
          };
          const mos = H.select(controles, { label: 'MOSFET', opciones: Object.entries(MOS).map(([v, m]) => ({ v, t: m.t })), value: 'irlz', onChange: upd });
          const vg = H.select(controles, { label: 'Tensión en la compuerta', opciones: [{ v: '3.3', t: '3,3 V (ESP32)' }, { v: '5', t: '5 V (Arduino UNO)' }, { v: '10', t: '10 V (con driver)' }], value: '5', onChange: upd });
          const carga = H.select(controles, { label: 'Carga', opciones: Object.entries(CARGAS).map(([v, c]) => ({ v, t: c.t })), value: 'led', onChange: upd });
          const duty = H.slider(controles, { label: 'Ciclo útil (analogWrite)', min: 0, max: 100, step: 1, value: 50, fmt: v => H.num(v, 0) + ' %  (' + Math.round(v * 2.55) + ')', onInput: upd });
          H.sep(controles);
          H.boton(controles, 'Probar el error clásico (IRF540N a 5 V con motor)', () => { mos.value = 'irf'; vg.value = '5'; carga.value = 'motor'; duty.value = 100; upd(); }, 'btn chico');
          const fig = H.el('div'); vista.append(fig);
          let S = {}, ang = 0, tPrev = 0;
          const canvas = H.canvas(vista, {
            alto: 230,
            dibujar(ctx, w, h) {
              const der = Math.min(150, w * 0.3);
              const ws = w - der - 8;
              ctx.fillStyle = H.col('scope-bg'); ctx.fillRect(0, 0, ws, h);
              const T = 1 / 490 * 1e3; // ms
              const D = S.D;
              const sq = (t) => (D > 0 && ((t % T) + T) % T < D * T) ? 1 : 0;
              const hh = (h - 30) / 2;
              const P1 = H.ejes(ctx, ws, h, { x0: 44, y0: 8, w: ws - 54, h: hh - 6, xmin: 0, xmax: 3 * T, ymin: 0, ymax: 12, oscuro: true, ylabel: 'VGS (V)', etiquetas: true, xfmt: () => '', ny: 3 });
              P1.fn(t => sq(t) * S.vg, { color: H.col('scope-c1'), ancho: 2, n: 900 });
              P1.hline(S.vth, { color: '#d9a441', label: 'Vth', labelX: 3 * T });
              const imax = S.inom * 1.25;
              const P2 = H.ejes(ctx, ws, h, { x0: 44, y0: 8 + hh + 4, w: ws - 54, h: hh - 6, xmin: 0, xmax: 3 * T, ymin: 0, ymax: imax, oscuro: true, ylabel: 'ID (A)', xlabel: 't (ms)', ny: 3, xfmt: v => H.num(v, 1) });
              P2.fn(t => sq(t) * S.id, { color: H.col('scope-c2'), ancho: 2, n: 900 });
              P2.hline(S.inom, { color: '#9cc7b4', label: 'nominal', labelX: 3 * T });
              // panel derecho: carga y termómetro
              const cx = ws + 8 + der * 0.42, cy = 70;
              const nivel = S.inom ? S.D * S.id / S.inom : 0;
              ctx.save();
              if (carga.value === 'led') {
                for (let i = 0; i < 4; i++) H.brillo(ctx, cx - 36 + i * 24, cy, 8, nivel, '#ffd34d');
                ctx.fillStyle = H.col('muted'); ctx.font = '600 11px sans-serif'; ctx.textAlign = 'center';
                ctx.fillText('brillo ' + H.num(nivel * 100, 0) + ' %', cx, cy + 40);
              } else {
                ctx.strokeStyle = H.col('ink'); ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(cx, cy, 28, 0, 7); ctx.stroke();
                ctx.translate(cx, cy); ctx.rotate(ang); ctx.fillStyle = H.col('c1');
                for (let k = 0; k < 3; k++) { ctx.rotate(2.094); ctx.beginPath(); ctx.ellipse(0, -13, 6, 13, 0, 0, 7); ctx.fill(); }
                ctx.setTransform(ctx.getTransform().a, 0, 0, ctx.getTransform().d, 0, 0);
                ctx.restore(); ctx.save();
                ctx.fillStyle = H.col('muted'); ctx.font = '600 11px sans-serif'; ctx.textAlign = 'center';
                ctx.fillText('velocidad ' + H.num(nivel * 100, 0) + ' %', cx, cy + 46);
              }
              ctx.restore();
              // termómetro
              const tx = ws + der - 22, ty0 = 20, ty1 = h - 40;
              const frac = Math.max(0, Math.min(1, (S.Tj - 20) / (200 - 20)));
              const cT = S.Tj > 150 ? H.col('red') : S.Tj > 100 ? H.col('amber') : H.col('green');
              ctx.save();
              ctx.strokeStyle = H.col('ink'); ctx.lineWidth = 1.5;
              ctx.strokeRect(tx - 6, ty0, 12, ty1 - ty0);
              ctx.fillStyle = cT; ctx.fillRect(tx - 5, ty1 - frac * (ty1 - ty0), 10, frac * (ty1 - ty0));
              ctx.beginPath(); ctx.arc(tx, ty1 + 10, 10, 0, 7); ctx.fill(); ctx.stroke();
              ctx.fillStyle = H.col('ink'); ctx.font = '700 12px sans-serif'; ctx.textAlign = 'center';
              ctx.fillText(S.Tj > 999 ? '>999 °C' : H.num(S.Tj, 0) + ' °C', tx - 14, h - 8);
              ctx.restore();
            },
          });
          const lec = H.lecturas(vista);
          const nota = H.nota(vista);

          function resolver() {
            const m = MOS[mos.value], c = CARGAS[carga.value];
            const Vg = parseFloat(vg.value), D = duty.value / 100, Vdd = 12;
            const ov = Vg - m.vth;
            let id = 0, vds = Vdd, reg = 'corte';
            if (ov > 0) {
              const fch = (v) => (v < ov ? m.k * (2 * ov * v - v * v) : m.k * ov * ov);
              let a = 0, b = Vdd / c.R;
              for (let n = 0; n < 90; n++) {
                const I = (a + b) / 2;
                const vch = Vdd - I * (c.R + m.rf);
                if (vch < 0) { b = I; continue; }
                if (fch(vch) > I) a = I; else b = I;
              }
              id = a; vds = Vdd - id * c.R;
              const vch = vds - id * m.rf;
              reg = vch < ov ? 'óhmica' : 'saturación';
            }
            const Pon = vds * id;
            const Pavg = D * Pon;
            return { m, c, vg: Vg, vth: m.vth, D, id, vds, reg, rds: id > 0 ? vds / id : Infinity, Pon, Pavg, Tj: 25 + Pavg * 62, inom: c.inom, Pcarga: D * id * id * c.R };
          }
          function upd() {
            S = resolver();
            const total = S.reg === 'óhmica' && S.vds < 0.5;
            fig.innerHTML = esqArduino({
              carga: carga.value, rg: '100 Ω', pin: 'D9: PWM ' + H.num(S.D * 100, 0) + ' %', vcarga: carga.value === 'led' ? '2 A' : '3 A', nomCarga: 'Tira LED',
              extra: [Esq.texto(262, 228, mos.value === 'irlz' ? 'IRLZ44N' : 'IRF540N', { size: 12, anchor: 'start' }), Esq.texto(110, 140, 'VGS = ' + H.num(S.vg, 1) + ' V', { color: 'var(--c1)', size: 12 })],
            });
            canvas.redibujar();
            const estado = S.reg === 'corte' ? 'no enciende' : total ? 'totalmente encendido' : S.reg === 'óhmica' ? 'conduce a medias' : 'NO satura (limita I)';
            lec.set([
              { k: 'Estado con el pulso en alto', v: estado, estado: total ? 'ok' : 'mal' },
              { k: 'ID (pulso en alto)', v: H.fmt(S.id, 'A') },
              { k: 'RDS efectiva', v: Number.isFinite(S.rds) ? H.fmt(S.rds, 'Ω') : '∞' },
              { k: 'VDS encendido', v: H.fmt(S.vds, 'V'), estado: S.vds > 0.5 ? 'alerta' : '' },
              { k: 'P media en el MOSFET', v: H.fmt(S.Pavg, 'W'), estado: S.Pavg > 1.2 ? 'mal' : S.Pavg > 0.5 ? 'alerta' : '' },
              { k: 'Temperatura sin disipador', v: S.Tj > 999 ? '> 999 °C' : H.num(S.Tj, 0) + ' °C', estado: S.Tj > 150 ? 'mal' : S.Tj > 100 ? 'alerta' : 'ok' },
              { k: 'P media en la carga', v: H.fmt(S.Pcarga, 'W') },
            ]);
            let t = '';
            if (S.reg === 'corte') t = `<b>No enciende:</b> la compuerta recibe ${H.num(S.vg, 1)} V y el umbral de este MOSFET puede ser de ${H.num(S.vth, 1)} V. Con ${S.vg < 4 ? 'un ESP32 (3,3 V)' : 'esta tensión'} hace falta un MOSFET logic level.`;
            else if (total) t = `<b>Totalmente encendido:</b> con ${H.num(S.vg, 1)} V en la compuerta el MOSFET queda en la región óhmica con R<sub>DS</sub> ≈ ${H.fmt(S.rds, 'Ω')}. Pérdidas: I²·R = ${H.num(S.id, 2)}² × ${H.fmt(S.rds, 'Ω')} = ${H.fmt(S.Pon, 'W')} con el pulso en alto, ${H.fmt(S.Pavg, 'W')} de promedio. Sin disipador sube a ≈ ${H.num(S.Tj, 0)} °C (Rth ≈ 62 °C/W). Variá el ciclo útil: la carga recibe más o menos potencia, el MOSFET casi no se entera.`;
            else t = `<b>¡No conduce totalmente!</b> Con solo ${H.num(S.vg - S.vth, 1)} V por encima del umbral, el canal no alcanza: ${S.reg === 'saturación' ? 'el MOSFET limita la corriente a ' + H.fmt(S.id, 'A') + ' (región de saturación)' : 'la resistencia del canal es alta'} y quedan ${H.fmt(S.vds, 'V')} entre D y S. Disipa ${H.fmt(S.Pavg, 'W')} de promedio → ${S.Tj > 999 ? 'más de 999' : H.num(S.Tj, 0)} °C sin disipador.`;
            if (S.Tj > 150) t += ' <b>Se destruye</b> (Tj máx 175 °C). Usá un IRLZ44N o llevá la compuerta a 10 V.';
            else if (S.Tj > 100) t += ' <b>Demasiado caliente:</b> necesita disipador o un MOSFET mejor.';
            t += ' <span style="opacity:.75">(Modelo simplificado; no incluye pérdidas de conmutación, despreciables a 490 Hz.)</span>';
            nota.innerHTML = t;
          }
          H.loop((t) => {
            const dt = t - tPrev; tPrev = t;
            if (carga.value === 'motor') { ang += dt * 25 * (S.inom ? S.D * S.id / S.inom : 0); canvas.redibujar(); }
          });
          upd();
        },
      },
    ],

    ejercicios: [
      {
        nivel: 'Básico',
        enunciado: String.raw`Un MOSFET canal N tiene $V_{th}=2\,\text{V}$ y $k=0{,}25\,\text{A/V}^2$. (a) ¿Cuánto vale $I_D$ con $V_{GS}=1{,}5\,\text{V}$? (b) ¿Y con $V_{GS}=4\,\text{V}$ y $V_{DS}=10\,\text{V}$?`,
        pista: String.raw`Primero compará $V_{GS}$ con $V_{th}$. Si conduce, fijate si $V_{DS}\ge V_{GS}-V_{th}$ (saturación).`,
        solucion: String.raw`(a) $V_{GS}\lt V_{th}$ → <b>corte</b>, $I_D=0$. (b) $V_{GS}-V_{th}=2\,\text{V}$ y $V_{DS}=10\ge2$ → <b>saturación</b>: $I_D=0{,}25\cdot2^2=1\,\text{A}$.`,
      },
      {
        nivel: 'Básico',
        enunciado: String.raw`Un IRF540N totalmente encendido ($R_{DS(on)}=44\,\text{m}\Omega$, con $V_{GS}=10\,\text{V}$) conduce 5 A. Calculá $V_{DS}$, la potencia disipada y la temperatura sin disipador ($R_{th}=62\,°\text{C/W}$, ambiente 25 °C).`,
        pista: String.raw`$V_{DS}=I_D R_{DS(on)}$, $P=I_D^2R_{DS(on)}$, $T_j=T_a+P\,R_{th}$.`,
        solucion: String.raw`$V_{DS}=5\cdot0{,}044=0{,}22\,\text{V}$; $P=25\cdot0{,}044=1{,}1\,\text{W}$; $T_j=25+1{,}1\cdot62=93\,°\text{C}$. Funciona, pero muy caliente (quema al tocarlo): conviene un disipador chico.`,
      },
      {
        nivel: 'Intermedio',
        enunciado: String.raw`Un MOSFET con $V_{th}=2\,\text{V}$ y $k=0{,}2\,\text{A/V}^2$ tiene una carga de $24\,\Omega$ a $12\,\text{V}$. Calculá el punto Q y la potencia en el MOSFET para (a) $V_{GS}=3\,\text{V}$ y (b) $V_{GS}=6\,\text{V}$.`,
        pista: String.raw`Suponé saturación y verificá. Si no se cumple, planteá la ecuación de la región óhmica igualada a la recta de carga: $k[2V_{ov}V_{DS}-V_{DS}^2]=\frac{12-V_{DS}}{24}$.`,
        solucion: String.raw`(a) Saturación: $I_D=0{,}2\cdot1^2=0{,}2\,\text{A}$; $V_{DS}=12-0{,}2\cdot24=7{,}2\,\text{V}\ge1$ ✔. $P=7{,}2\cdot0{,}2=1{,}44\,\text{W}$.<br>
        (b) En saturación daría $0{,}2\cdot4^2=3{,}2\,\text{A}$, imposible (máximo $12/24=0{,}5\,\text{A}$) → óhmica. $0{,}2(8V_{DS}-V_{DS}^2)=0{,}5-\frac{V_{DS}}{24}$ → $0{,}2V_{DS}^2-1{,}642V_{DS}+0{,}5=0$ → $V_{DS}=\frac{1{,}642-\sqrt{2{,}295}}{0{,}4}=0{,}317\,\text{V}$. $I_D=\frac{12-0{,}317}{24}=0{,}487\,\text{A}$; $P=0{,}154\,\text{W}$; $R_{DS}=0{,}65\,\Omega$. Verificalo en la simulación 1.`,
      },
      {
        nivel: 'Intermedio',
        enunciado: String.raw`Tenés que encender desde un Arduino UNO una tira de LED de 12 V que consume 3 A. En el cajón hay un IRF540N y un IRLZ44N. ¿Cuál usás y por qué? Calculá la potencia y la temperatura del elegido sin disipador.`,
        pista: 'Fijate a qué VGS está garantizada la RDS(on) de cada uno.',
        solucion: String.raw`El <b>IRLZ44N</b>: es logic level y tiene $R_{DS(on)}=25\,\text{m}\Omega$ garantizada a 5 V. El IRF540N solo garantiza su $R_{DS(on)}$ a 10 V y su $V_{th}$ puede llegar a 4 V: con 5 V puede quedar a medio conducir.<br>$P=3^2\cdot0{,}025=0{,}225\,\text{W}$; $T_j=25+0{,}225\cdot62=39\,°\text{C}$. No necesita disipador.`,
      },
      {
        nivel: 'Avanzado',
        enunciado: String.raw`Con un IRLZ44N ($R_{DS(on)}=25\,\text{m}\Omega$ a 5 V) controlás por PWM un motor de 12 V y 4 A con ciclo útil del 60 %. Calculá la potencia media en el MOSFET, su temperatura sin disipador y la potencia media aproximada que recibe el motor. ¿Qué componente no puede faltar?`,
        pista: String.raw`$P_{media}=D\cdot I^2 R_{DS(on)}$. Para el motor, $P\approx D\cdot V\cdot I$.`,
        solucion: String.raw`$P_{media}=0{,}6\cdot4^2\cdot0{,}025=0{,}24\,\text{W}$; $T_j=25+0{,}24\cdot62=40\,°\text{C}$. Motor: $P\approx0{,}6\cdot12\cdot4=28{,}8\,\text{W}$. No puede faltar el <b>diodo de rueda libre</b> en paralelo con el motor (rápido, tipo Schottky: con PWM conmuta cientos de veces por segundo). Tampoco Rg y la pull‑down.`,
      },
      {
        nivel: 'Avanzado',
        enunciado: String.raw`La compuerta del IRLZ44N tiene $C_{iss}\approx1{,}7\,\text{nF}$ y la manejás con $R_g=100\,\Omega$ desde 5 V. Calculá la constante de tiempo, cuánto dura aproximadamente la conmutación (5τ) y qué fracción del período del PWM de Arduino (490 Hz) representa. ¿Cuál es el pico de corriente del pin? ¿Qué pasaría sin la resistencia de 10 kΩ a masa al resetear el Arduino?`,
        pista: String.raw`$\tau=R_gC_{iss}$, $T=1/f$, $I_{pico}=V/R_g$.`,
        solucion: String.raw`$\tau=100\cdot1{,}7\cdot10^{-9}=170\,\text{ns}$; $5\tau=0{,}85\,\mu\text{s}$. $T=1/490=2{,}04\,\text{ms}$ → la transición ocupa el $0{,}04\,\%$ del período: despreciable. $I_{pico}=5/100=50\,\text{mA}$, solo durante nanosegundos (el pin lo tolera).<br>Sin pull‑down, durante el reset el pin queda como entrada (alta impedancia): la compuerta flota, puede cargarse con ruido y encender el MOSFET a medias (calienta) o arrancar el motor sin control.`,
      },
    ],

    quiz: [
      { pregunta: '¿Cuánta corriente consume la compuerta de un MOSFET en continua?', opciones: ['Igual que la base de un BJT', 'Prácticamente cero: está aislada por óxido', 'ID / β', 'Depende de la carga'], correcta: 1, explicacion: 'La compuerta es un capacitor: solo toma corriente para cargarse o descargarse al conmutar.' },
      { pregunta: 'Para usar un MOSFET como llave, conviene que trabaje en la región…', opciones: ['De corte siempre', 'De saturación', 'Óhmica (con RDS(on) muy chica)', 'De ruptura'], correcta: 2, explicacion: 'En la región óhmica se comporta como una resistencia de pocos mΩ: poca caída y poco calor. (¡Ojo! En el BJT la llave cerrada se llama saturación.)' },
      { pregunta: 'Un MOSFET con RDS(on) = 20 mΩ conduce 10 A. ¿Cuánto disipa?', opciones: ['0,2 W', '2 W', '20 W', '0,02 W'], correcta: 1, explicacion: 'P = I²·R = 100 × 0,02 = 2 W.' },
      { pregunta: '¿Por qué el IRF540N no es buena opción para manejarlo directo desde un Arduino a 5 V?', opciones: ['Porque es canal P', 'Porque su RDS(on) está garantizada a 10 V y su Vth puede llegar a 4 V', 'Porque consume mucha corriente de compuerta', 'Porque no tiene diodo interno'], correcta: 1, explicacion: 'Con 5 V puede quedar a medio conducir y calentar. Para 5 V se usan MOSFET logic level (IRLZ44N).' },
      { pregunta: 'La resistencia de 10 kΩ entre compuerta y fuente sirve para…', opciones: ['Limitar la corriente de drenador', 'Mantener el MOSFET apagado si el pin queda flotando', 'Aumentar la velocidad', 'Proteger contra cortocircuitos en la carga'], correcta: 1, explicacion: 'Durante el reset los pines son entradas de alta impedancia: la pull‑down descarga la compuerta.' },
      { pregunta: 'La tensión umbral VGS(th) de la hoja de datos indica…', opciones: ['La tensión a la que el MOSFET conduce totalmente', 'La tensión a la que recién empieza a conducir (ej. ID = 250 µA)', 'La tensión máxima de compuerta', 'La caída VDS en conducción'], correcta: 1, explicacion: 'En el umbral apenas conduce. Para una buena llave hace falta bastante más tensión.' },
    ],

    docente: String.raw`
<p><b>Tema marcado “a confirmar”:</b> revisá si entra en el programa antes de habilitarlo.</p>
<h3>Objetivo de la clase</h3>
<p>Que el alumno entienda que el MOSFET se controla por tensión (compuerta aislada), distinga las regiones (y la trampa del nombre “saturación”), y sepa <b>elegir y conectar un MOSFET para manejar cargas de potencia con PWM desde Arduino</b>: logic level, Rg, pull‑down, diodo de rueda libre y cálculo de temperatura. <b>Duración sugerida:</b> 1 clase larga (80 min) o 2 cortas.</p>
<h3>Secuencia sugerida</h3>
<ol>
<li><b>Disparador (5 min):</b> “El TIP122 del tema anterior disipaba 2 W con una tira de LED de 2 A. ¿Habrá algo mejor?”. Contale que en un celular hay miles de millones de MOSFET.</li>
<li><b>Estructura (10 min):</b> con el corte transversal: la compuerta es un capacitor, el canal se “crea” con el campo. Remarcá $I_G=0$. Mostrá el diodo interno.</li>
<li><b>Simulación 1 (20 min):</b> arrancá con VGS = 0 (corte). Antes de mover, preguntá: “¿a partir de qué tensión va a conducir?”. Subí VGS despacio: cruza Vth, aparece la curva, Q en saturación con varios watts. Seguí subiendo: Q baja por la recta a la región óhmica y la potencia cae. Preguntá: “¿dónde lo querés como llave?”. Cambiá Vth y k para ver que el mismo VGS no sirve para todos los MOSFET.</li>
<li><b>Nombres (5 min):</b> tabla BJT ↔ MOSFET. Insistí: saturación del MOSFET ≠ saturación del BJT.</li>
<li><b>Simulación 2 (20 min):</b> IRLZ44N, 5 V, tira LED: totalmente encendido, ~30 °C. Mové el ciclo útil y mostrá que la tira cambia de brillo pero el MOSFET casi no calienta. Pasá a 3,3 V: sigue andando. Ahora tocá “Probar el error clásico”: IRF540N a 5 V con motor → limita la corriente y se recalienta. Pasá a 10 V: se arregla. Volvé a 3,3 V con IRF540N: no enciende.</li>
<li><b>Circuito real (10 min):</b> esquema con Rg, Rpd y diodo. Ejercicios 4 y 6.</li>
<li><b>Cierre (5 min):</b> autoevaluación. Tarea: ejercicios 2, 3 y 5.</li>
</ol>
<h3>Errores frecuentes</h3>
<ul>
<li>Creer que con VGS = Vth ya conduce totalmente.</li>
<li>Comprar un IRF540N/IRFZ44N (sin la L) para usar con Arduino “porque es el que aparece en todos los videos”.</li>
<li>Olvidar la pull‑down (el motor arranca solo al enchufar) o la Rg.</li>
<li>Olvidar unir masas entre Arduino y la fuente de 12 V.</li>
<li>Poner la carga entre S y masa (configuración “source follower”): el MOSFET canal N necesita VGS respecto de S, y S sube con la carga → nunca enciende del todo. La carga va en el drenador.</li>
<li>Tocar las patas sin cuidado: daño por estática.</li>
</ul>
<h3>Preguntas disparadoras</h3>
<ul>
<li>Si la compuerta no consume corriente, ¿por qué el pin necesita entregar corriente al conmutar?</li>
<li>¿Por qué un MOSFET con el doble de RDS(on) disipa el doble, pero con el doble de corriente disipa el cuádruple?</li>
<li>¿Qué pasa si el diodo interno queda en directa?</li>
<li>Si quiero conmutar el positivo de la carga, ¿qué MOSFET uso?</li>
</ul>
<h3>Recordatorio rápido para vos</h3>
<ul>
<li>Modelo cuadrático (Shichman‑Hodges): saturación $I_D=k(V_{GS}-V_{th})^2$ (a veces escrito $\frac{1}{2}\mu_nC_{ox}\frac{W}{L}(V_{GS}-V_{th})^2$, o sea $k=\frac{1}{2}\mu_nC_{ox}W/L$); óhmica $I_D=k[2V_{ov}V_{DS}-V_{DS}^2]$; límite $V_{DS}=V_{ov}$. Los MOSFET de potencia no siguen bien la ley cuadrática (saturación de velocidad), pero sirve para entender.</li>
<li>$R_{DS(on)}$ aumenta con la temperatura (~+50 % a 100 °C), coeficiente positivo: por eso se pueden poner en paralelo.</li>
<li>IRLZ44N: Vth 1–2 V, 22/25/35 mΩ a 10/5/4 V, VGS máx ±16 V, Ciss 1700 pF, Qg 48 nC, Rth j‑a 62 °C/W. IRF540N: Vth 2–4 V, 44 mΩ a 10 V, VGS máx ±20 V.</li>
<li>Pinout TO‑220 (IRLZ44N, IRF540N): <b>G‑D‑S</b> mirando de frente, aleta = D.</li>
<li>Pérdidas de conmutación ≈ ½·V·I·(tr + tf)·f; a 490 Hz y 100 ns son microwatts.</li>
<li>analogWrite: 490 Hz en la mayoría de los pines del UNO, 980 Hz en D5 y D6.</li>
</ul>
<h3>Experiencia práctica</h3>
<p><b>Tinkercad:</b> Arduino + MOSFET N (el genérico de Tinkercad) + motor de CC con fuente de 9 V, Rg 100 Ω, pull‑down 10 kΩ y diodo. Un potenciómetro en A0 controla el PWM: <code>analogWrite(9, analogRead(A0)/4);</code>. Medir con el osciloscopio de Tinkercad la tensión de compuerta y en el drenador. <b>Casero:</b> si tienen un IRLZ44N, hacer la prueba del multímetro de la teoría (cargar la compuerta con la punta y ver que “queda encendido”): es la mejor demostración de que la compuerta es un capacitor.</p>
`,
  });
})();
