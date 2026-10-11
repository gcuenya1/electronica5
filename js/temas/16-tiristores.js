/* Tema 16 — Tiristores (SCR, TRIAC, DIAC)
   IMPORTANTE: los textos con LaTeX usan String.raw`...` para que "\frac" no se rompa. */
(() => {
  /* ---------- helpers propios del tema (no globales) ---------- */
  const VRED = 220, VP = 220 * Math.SQRT2, FRED = 50;

  // Fracción de potencia con TRIAC (onda completa) en carga resistiva, α en radianes
  const fracTriac = (a) => 1 - a / Math.PI + Math.sin(2 * a) / (2 * Math.PI);
  // Tensión media con SCR (media onda)
  const vmedSCR = (a) => VP / (2 * Math.PI) * (1 + Math.cos(a));
  // Tensión eficaz con SCR (media onda)
  const vrmsSCR = (a) => VP * Math.sqrt(Math.max(0, (Math.PI - a + Math.sin(2 * a) / 2) / (4 * Math.PI)));
  // Tensión eficaz con TRIAC (onda completa)
  const vrmsTRIAC = (a) => VRED * Math.sqrt(Math.max(0, fracTriac(a)));

  // Estructura PNPN (SVG propio)
  function capasSVG() {
    const s = [];
    const capas = [['P', 'var(--c4)', 'P1'], ['N', 'var(--c1)', 'N1'], ['P', 'var(--c4)', 'P2'], ['N', 'var(--c1)', 'N2']];
    capas.forEach(([t, c, n], i) => {
      const y = 40 + i * 45;
      s.push(`<rect x="70" y="${y}" width="110" height="45" fill="${c}" fill-opacity=".22" stroke="currentColor" stroke-width="1.5"/>`);
      s.push(`<text x="125" y="${y + 28}" text-anchor="middle" font-size="16" font-weight="800">${t}</text>`);
      s.push(`<text x="64" y="${y + 27}" text-anchor="end" font-size="11" style="fill:var(--muted)">${n}</text>`);
    });
    ['J1', 'J2', 'J3'].forEach((j, i) => {
      const y = 85 + i * 45;
      s.push(`<text x="186" y="${y + 4}" font-size="11" font-weight="700" style="fill:var(--c2)">${j}</text>`);
    });
    s.push(`<path d="M125 40V18M125 220V242M180 152H230" stroke="currentColor" stroke-width="2"/>`);
    s.push(`<circle cx="125" cy="14" r="4" fill="var(--panel)" stroke="currentColor" stroke-width="2"/><circle cx="125" cy="246" r="4" fill="var(--panel)" stroke="currentColor" stroke-width="2"/><circle cx="234" cy="152" r="4" fill="var(--panel)" stroke="currentColor" stroke-width="2"/>`);
    s.push(`<text x="138" y="18" font-size="13" font-weight="700">A (ánodo)</text><text x="138" y="250" font-size="13" font-weight="700">K (cátodo)</text><text x="242" y="148" font-size="13" font-weight="700">G</text><text x="242" y="163" font-size="11">(compuerta)</text>`);
    return s.join('');
  }

  // Modelo de dos transistores (PNP arriba invertido, NPN abajo espejado)
  function dosTransistores() {
    return [
      `<g transform="translate(0,160) scale(1,-1)">${Esq.bjt(188, 80, 'PNP')}</g>`,
      `<g transform="translate(340,0) scale(-1,1)">${Esq.bjt(170, 160, 'NPN')}</g>`,
      Esq.cable([[200, 50], [200, 22]]), Esq.borne(200, 18, 'A', 0, -10),
      Esq.cable([[200, 110], [200, 160]]), Esq.cable([[158, 130], [158, 80]]),
      Esq.nodo(200, 160), Esq.cable([[200, 160], [262, 160]]), Esq.borne(266, 160, 'G', 14, 4),
      Esq.cable([[158, 190], [158, 222]]), Esq.borne(158, 226, 'K', 0, 22),
      Esq.texto(222, 72, 'Q1', { anchor: 'start', size: 12 }), Esq.texto(222, 86, 'PNP', { anchor: 'start', size: 11, peso: 400 }),
      Esq.texto(124, 156, 'Q2', { anchor: 'end', size: 12 }), Esq.texto(124, 170, 'NPN', { anchor: 'end', size: 11, peso: 400 }),
      Esq.texto(206, 128, 'IC1 = IB2', { anchor: 'start', size: 11, color: 'var(--c2)' }),
      Esq.texto(152, 112, 'IC2 = IB1', { anchor: 'end', size: 11, color: 'var(--c2)' }),
    ];
  }

  // Curva característica del SCR (SVG propio)
  function curvaSCR() {
    const ox = 220, oy = 190;
    let s = '';
    s += `<path d="M20 ${oy}H445M${ox} 248V14" stroke="currentColor" stroke-opacity=".55" stroke-width="1.3"/>`;
    s += `<path d="M445 ${oy}l-8 -4v8zM${ox} 14l-4 8h8z" fill="currentColor"/>`;
    s += `<text x="450" y="${oy + 4}" font-size="12" font-weight="700">VAK</text><text x="${ox + 8}" y="22" font-size="12" font-weight="700">IA</text>`;
    // bloqueo directo IG = 0, IG1, IG2
    const ramas = [[410, 'var(--c4)', 'VBO (IG = 0)'], [345, 'var(--c1)', 'IG1'], [290, 'var(--c2)', 'IG2']];
    ramas.forEach(([xb, c, t]) => {
      s += `<path d="M${ox} ${oy}Q${(ox + xb) / 2} ${oy - 3} ${xb} ${oy - 12}" fill="none" stroke="${c}" stroke-width="2"/>`;
      s += `<path d="M${xb} ${oy - 12}Q${xb - 30} ${oy - 30} 236 152" fill="none" stroke="${c}" stroke-width="1.5" stroke-dasharray="5 4"/>`;
      s += `<text x="${xb}" y="${oy + 16}" font-size="11" font-weight="700" text-anchor="middle" style="fill:${c}">${t}</text>`;
    });
    // conducción
    s += `<path d="M236 152L240 110L246 30" fill="none" stroke="var(--green)" stroke-width="2.6"/>`;
    s += `<text x="252" y="44" font-size="11" font-weight="700" style="fill:var(--green)">conducción (VT ≈ 1–1,5 V)</text>`;
    s += `<path d="M${ox} 152H262M${ox} 128H262" stroke="var(--amber)" stroke-width="1.2" stroke-dasharray="3 3"/>`;
    s += `<text x="${ox - 6}" y="156" font-size="11" font-weight="700" text-anchor="end" style="fill:var(--amber)">IH</text><text x="${ox - 6}" y="132" font-size="11" font-weight="700" text-anchor="end" style="fill:var(--amber)">IL</text>`;
    // inversa
    s += `<path d="M${ox} ${oy}Q140 ${oy + 3} 62 ${oy + 8}L52 246" fill="none" stroke="var(--red)" stroke-width="2"/>`;
    s += `<text x="70" y="${oy + 26}" font-size="11" font-weight="700" style="fill:var(--red)">VRRM (ruptura)</text>`;
    s += `<text x="130" y="${oy - 8}" font-size="11" text-anchor="middle" style="fill:var(--muted)">bloqueo inverso</text>`;
    s += `<text x="330" y="${oy + 40}" font-size="11" text-anchor="middle" style="fill:var(--muted)">bloqueo directo (no conduce hasta el disparo)</text>`;
    return `<figure class="figura"><svg class="esq" viewBox="0 0 490 260" width="490" height="260" xmlns="http://www.w3.org/2000/svg">${s}</svg><figcaption>Curva IA–VAK del SCR. Con más corriente de compuerta (IG2 &gt; IG1 &gt; 0), antes “salta” a conducción. Una vez arriba, se queda ahí mientras IA &gt; IH.</figcaption></figure>`;
  }

  // Curva del DIAC
  function curvaDIAC() {
    const ox = 170, oy = 110;
    let s = `<path d="M15 ${oy}H325M${ox} 200V15" stroke="currentColor" stroke-opacity=".55" stroke-width="1.3"/>`;
    s += `<text x="322" y="${oy + 18}" font-size="12" font-weight="700" text-anchor="end">V</text><text x="${ox + 8}" y="24" font-size="12" font-weight="700">I</text>`;
    s += `<path d="M${ox} ${oy}L270 ${oy - 6}L246 ${oy - 30}L262 22" fill="none" stroke="var(--c1)" stroke-width="2.4"/>`;
    s += `<path d="M${ox} ${oy}L70 ${oy + 6}L94 ${oy + 30}L78 198" fill="none" stroke="var(--c1)" stroke-width="2.4"/>`;
    s += `<path d="M270 ${oy - 6}V${oy}M70 ${oy + 6}V${oy}" stroke="var(--c2)" stroke-dasharray="3 3"/>`;
    s += `<text x="282" y="${oy - 12}" font-size="11" font-weight="700" style="fill:var(--c2)">+VBO ≈ 30 V</text><text x="64" y="${oy - 8}" font-size="11" font-weight="700" text-anchor="end" style="fill:var(--c2)">−VBO</text>`;
    s += `<text x="232" y="${oy - 40}" font-size="11" text-anchor="end" style="fill:var(--muted)">cae ~10 V</text>`;
    return `<figure class="figura"><svg class="esq" viewBox="0 0 340 210" width="340" height="210" xmlns="http://www.w3.org/2000/svg">${s}</svg><figcaption>DIAC: no conduce hasta ±VBO; al superarla, la tensión cae de golpe (resistencia negativa) y entrega un pulso.</figcaption></figure>`;
  }

  // Dimmer clásico
  function esqDimmer() {
    return Esq.svg(530, 250, [
      Esq.cable([[100, 60], [100, 40], [130, 40]]), Esq.lampara(130, 40, 210, 40, 'Lámpara', '100 W', 1), Esq.cable([[210, 40], [440, 40], [440, 45]]), Esq.nodo(280, 40),
      Esq.triac(280, 108), Esq.texto(258, 100, 'TRIAC', { anchor: 'end', size: 12 }), Esq.texto(258, 114, 'BT136', { anchor: 'end', size: 11, peso: 400 }),
      Esq.cable([[280, 40], [280, 78]]), Esq.cable([[280, 138], [280, 220]]), Esq.nodo(280, 220),
      Esq.fuenteAC(100, 60, 100, 200, 'Red', '220 V 50 Hz', -1), Esq.cable([[100, 200], [100, 220], [440, 220]]),
      Esq.Rvar(440, 45, 440, 120, 'P', '250 kΩ', 1), Esq.cable([[440, 120], [440, 140]]), Esq.C(440, 140, 440, 220, 'C', '100 nF', 1), Esq.nodo(440, 130),
      Esq.cable([[440, 130], [400, 130]]), Esq.diac(336, 130, 400, 130, 'DIAC', 'DB3', 1), Esq.cable([[336, 130], [306, 130]]),
      Esq.texto(372, 168, 'vC', { color: 'var(--c2)', size: 12 }), Esq.flecha(400, 175, 400, 150, '', 'var(--c2)'),
    ], 'Dimmer clásico: P y C atrasan la tensión; cuando vC supera ~32 V el DIAC conduce y le da un pulso a la compuerta del TRIAC.');
  }

  // SCR controlando una carga en CA
  function esqSCRca() {
    return Esq.svg(450, 240, [
      Esq.fuenteAC(70, 70, 70, 190, 'Red', '220 V', -1), Esq.cable([[70, 70], [70, 40], [120, 40]]), Esq.R(120, 40, 200, 40, 'RL', 'carga', 1),
      Esq.cable([[200, 40], [260, 40], [260, 90]]), Esq.scr(260, 120, 'SCR'), Esq.cable([[260, 150], [260, 220], [70, 220], [70, 190]]),
      Esq.cable([[286, 142], [330, 142]]), `<rect x="330" y="118" width="100" height="52" rx="6" fill="none" stroke="currentColor" stroke-width="2"/>`,
      Esq.texto(380, 139, 'circuito de', { size: 11 }), Esq.texto(380, 154, 'disparo (α)', { size: 11 }),
      Esq.cable([[380, 170], [380, 200], [260, 200]]), Esq.nodo(260, 200),
      Esq.texto(200, 100, 'vL', { color: 'var(--c1)', size: 12 }),
    ], 'El circuito de disparo da un pulso en G con un retardo α después de cada cruce por cero.');
  }

  // Control desde Arduino con optoacoplador MOC3021
  function esqMOC() {
    return Esq.svg(600, 270, [
      `<rect x="10" y="80" width="70" height="90" rx="6" fill="none" stroke="currentColor" stroke-width="2"/>`,
      Esq.texto(45, 115, 'Arduino', { size: 11 }), Esq.texto(45, 131, 'pin D7', { size: 10, peso: 400 }), Esq.texto(45, 160, 'GND', { size: 10, peso: 400 }),
      Esq.cable([[80, 105], [90, 105]]), Esq.R(90, 105, 160, 105, 'R1', '220 Ω', 1), Esq.cable([[160, 105], [180, 105]]),
      `<rect x="160" y="82" width="100" height="118" rx="6" fill="none" stroke="currentColor" stroke-width="2"/>`,
      Esq.texto(210, 76, 'MOC3021', { size: 12 }),
      Esq.LED(180, 105, 180, 165, '', '', 1),
      Esq.cable([[180, 165], [180, 215], [45, 215], [45, 170]]),
      Esq.diac(230, 100, 230, 162, '', '', 1),
      Esq.cable([[230, 100], [230, 95], [270, 95]]), Esq.R(270, 95, 350, 95, 'R2', '360 Ω', 1), Esq.cable([[350, 95], [440, 95]]), Esq.nodo(440, 95),
      Esq.cable([[230, 162], [414, 162]]),
      Esq.cable([[556, 30], [440, 30]]), Esq.borne(560, 30, 'L (fase)', 0, -10), Esq.lampara(440, 30, 440, 85, 'Carga', '', 1), Esq.cable([[440, 85], [440, 110]]),
      `<g transform="translate(880,0) scale(-1,1)">${Esq.triac(440, 140)}</g>`, Esq.texto(458, 136, 'BT136', { anchor: 'start', size: 12 }),
      Esq.cable([[440, 170], [440, 230], [556, 230]]), Esq.borne(560, 230, 'N (neutro)', 0, 22),
      `<path d="M205 50V250" stroke="var(--red)" stroke-width="1.5" stroke-dasharray="6 4"/>`,
      Esq.texto(110, 248, 'baja tensión (5 V)', { size: 11, color: 'var(--green)' }),
      Esq.texto(330, 248, '220 V: ¡peligro!', { size: 12, color: 'var(--red)' }),
      Esq.texto(205, 44, 'aislación 7500 V', { size: 10, color: 'var(--red)', peso: 500 }),
    ], 'El LED del optoacoplador enciende un TRIAC chiquito que dispara al TRIAC de potencia. Entre ambos lados no hay ninguna conexión eléctrica: solo luz.');
  }

  registrarTema({
    id: 'tiristores',
    orden: 16,
    titulo: 'Tiristores',
    resumen: 'SCR, TRIAC y DIAC: disparo, enclavamiento y control de fase de cargas de 220 V',
    confirmar: true,

    teoria: String.raw`
<p>Los <b>tiristores</b> son una familia de semiconductores de potencia que funcionan como <b>llaves que se “enganchan”</b>: con un pulsito en la compuerta pasan a conducir y <b>se quedan conduciendo solas</b>, aunque saques el pulso. Son los que están adentro de los dimmers de las lámparas, de los reguladores de velocidad de taladros y licuadoras, de los arrancadores suaves de motores y de los relés de estado sólido. Manejan desde unos pocos amperes hasta miles de amperes a miles de volts.</p>
<div class="caja idea"><span class="caja-titulo">Analogía: la ratonera</span>
Un transistor es como una canilla: si soltás la manija, se cierra. Un tiristor es como una <b>ratonera</b>: con un toquecito (el pulso de compuerta) se dispara, y una vez disparada <b>queda así</b> aunque ya no la toques. Para “rearmarla” no alcanza con dejar de tocarla: hay que <b>cortar la corriente principal</b>. En corriente alterna eso pasa solo 100 veces por segundo, cada vez que la tensión cruza por cero.
</div>

<h2>1. La familia de los tiristores</h2>
<div class="tabla-wrap"><table class="tabla">
<tr><th>Dispositivo</th><th>Terminales</th><th>Conduce en</th><th>Se enciende con</th><th>Uso típico</th></tr>
<tr><td><b>SCR</b> (rectificador controlado de silicio)</td><td>A, K, G</td><td>Un solo sentido (A → K)</td><td>Pulso positivo en G</td><td>Rectificadores controlados, cargadores, crowbar, CC</td></tr>
<tr><td><b>TRIAC</b></td><td>MT1, MT2, G</td><td><b>Ambos sentidos</b></td><td>Pulso en G (+ o −)</td><td>Dimmers, motores universales, relés de estado sólido</td></tr>
<tr><td><b>DIAC</b></td><td>2 (sin compuerta)</td><td>Ambos sentidos</td><td>Superar ±V<sub>BO</sub> ≈ 30 V</td><td>Generar el pulso de disparo del TRIAC</td></tr>
<tr><td>GTO</td><td>A, K, G</td><td>Un sentido</td><td>Pulso + en G (y <b>se apaga</b> con pulso −)</td><td>Tracción eléctrica, grandes inversores</td></tr>
<tr><td>Optotiristor / opto‑TRIAC</td><td>LED + tiristor</td><td>Según el tipo</td><td>Luz (LED interno)</td><td>Aislar el microcontrolador de la red (MOC3021)</td></tr>
</table></div>

<h2>2. El SCR: estructura y terminales</h2>
<div class="dos-col">
<div>
<figure class="figura"><svg class="esq" viewBox="0 0 320 260" width="320" height="260" xmlns="http://www.w3.org/2000/svg">${capasSVG()}</svg><figcaption>Cuatro capas alternadas PNPN: tres junturas J1, J2 y J3.</figcaption></figure>
</div>
<div>
${Esq.svg(220, 200, [
  Esq.scr(100, 100), Esq.cable([[100, 70], [100, 40]]), Esq.borne(100, 36, 'A (ánodo)', 0, -10),
  Esq.cable([[100, 130], [100, 162]]), Esq.borne(100, 166, 'K (cátodo)', 0, 24), Esq.borne(130, 122, 'G', 12, 4),
  Esq.flecha(150, 55, 150, 145, 'IA', 'var(--c2)'),
], 'Símbolo: un diodo con una “patita” de control.')}
</div>
</div>
<ul>
<li>Es un “diodo con compuerta”: conduce de <b>ánodo a cátodo</b>, nunca al revés.</li>
<li>Con $V_{AK}$ positiva pero <b>sin pulso</b>, la juntura del medio (J2) queda en inversa y <b>bloquea</b>: el SCR está “armado”, esperando.</li>
<li>Con $V_{AK}$ negativa, J1 y J3 quedan en inversa: <b>bloquea siempre</b>, haya o no pulso (igual que un diodo).</li>
<li>La compuerta G está conectada a la capa P cercana al cátodo: una corriente que entra por G y sale por K <b>dispara</b> el dispositivo.</li>
</ul>

<h2>3. Encendido, enclavamiento y apagado</h2>
<div class="caja formula"><span class="caja-titulo">Las tres reglas del SCR</span>
<ol>
<li><b>Para encenderlo:</b> $V_{AK}>0$ y un pulso de corriente en la compuerta $I_G\ge I_{GT}$ (de microamperes a decenas de miliamperes, según el modelo).</li>
<li><b>Enclavamiento (latch):</b> si en el momento del pulso la corriente de ánodo llegó a la <b>corriente de enganche</b> $I_L$, el SCR <b>sigue conduciendo aunque saques el pulso</b>. La compuerta pierde el control.</li>
<li><b>Para apagarlo:</b> hay que hacer que la corriente de ánodo baje por debajo de la <b>corriente de mantenimiento</b> $I_H$ (abrir el circuito, invertir la tensión o desviar la corriente). <b>Con la compuerta no se puede apagar.</b></li>
</ol>
<p>Siempre $I_L > I_H$ (típicamente $I_L\approx2$ a $3\cdot I_H$).</p>
</div>
<div class="caja ojo"><span class="caja-titulo">Error típico: “saco el pulso y se apaga”</span>
No. En <b>corriente continua</b>, una vez disparado, el SCR queda encendido para siempre (hasta que abras el circuito o la corriente caiga bajo $I_H$). Por eso en CC hacen falta circuitos de <b>conmutación forzada</b> para apagarlo. En <b>corriente alterna</b>, en cambio, se apaga <b>solo</b> al final de cada semiciclo positivo, cuando la corriente pasa por cero: esto se llama <b>conmutación natural</b>, y es lo que hace a los tiristores ideales para la red de 220 V. Probalo en la simulación 2.
</div>

<h2>4. ¿Por qué se engancha? La analogía de los dos transistores</h2>
<div class="dos-col">
<div>
${Esq.svg(320, 250, dosTransistores(), 'Partiendo el PNPN en dos: un PNP (P1‑N1‑P2) y un NPN (N1‑P2‑N2) realimentados.')}
</div>
<div>
<p>Si cortamos imaginariamente las capas del medio, el SCR equivale a <b>dos transistores conectados en lazo</b>: el colector de cada uno alimenta la base del otro.</p>
<ol>
<li>Entra $I_G$ en la base de Q2 → Q2 conduce: $I_{C2}=\beta_2 I_G$.</li>
<li>Esa corriente sale de la base de Q1 → Q1 conduce: $I_{C1}=\beta_1\beta_2 I_G$.</li>
<li>$I_{C1}$ vuelve a entrar en la base de Q2… ¡y se refuerza a sí misma!</li>
</ol>
<p>Si $\beta_1\beta_2\ge1$, el lazo se sostiene solo y los dos transistores se saturan: <b>ya no hace falta $I_G$</b>. Es una <b>realimentación positiva</b>, como el acople de un micrófono con el parlante.</p>
</div>
</div>
<div class="caja formula"><span class="caja-titulo">En fórmula (con las ganancias alfa = IC/IE de cada transistor)</span>
$$I_A=\frac{\alpha_2\,I_G+I_{fugas}}{1-(\alpha_1+\alpha_2)}$$
<p>Mientras $\alpha_1+\alpha_2<1$, la corriente es chiquita (bloqueo). Como las α de los transistores <b>crecen con la corriente</b>, un pulso de compuerta lleva $\alpha_1+\alpha_2$ hacia 1: el denominador tiende a cero y la corriente “se dispara”, limitada solo por la carga. Si la corriente baja de $I_H$, las α vuelven a achicarse, el lazo se rompe y el SCR se apaga.</p>
</div>

<h2>5. Curva característica y parámetros</h2>
${curvaSCR()}
<ul>
<li><b>Bloqueo inverso:</b> como un diodo en inversa, hasta la tensión de ruptura $V_{RRM}$.</li>
<li><b>Bloqueo directo:</b> no conduce aunque $V_{AK}>0$… hasta la <b>tensión de ruptura directa</b> $V_{BO}$. Si la superás sin pulso, se dispara solo (disparo por sobretensión, no deseado).</li>
<li><b>Con corriente de compuerta</b> la $V_{BO}$ baja muchísimo: con $I_G\ge I_{GT}$ se dispara con apenas unos volts.</li>
<li><b>Conducción:</b> se comporta como un diodo con $V_T\approx1$ a $1{,}5\,\text{V}$. Disipa $P\approx V_T\cdot I_{media}$.</li>
</ul>
<div class="tabla-wrap"><table class="tabla">
<tr><th>Parámetro</th><th>Significado</th><th>TIC106D</th><th>BT151‑500</th></tr>
<tr><td>$V_{DRM}$, $V_{RRM}$</td><td>Tensión máxima que bloquea (directa / inversa)</td><td>400 V</td><td>500 V</td></tr>
<tr><td>$I_{T(RMS)}$</td><td>Corriente eficaz máxima en conducción</td><td>5 A</td><td>12 A</td></tr>
<tr><td>$I_{TSM}$</td><td>Pico de corriente no repetitivo (un semiciclo)</td><td>30 A</td><td>120 A</td></tr>
<tr><td>$I_{GT}$ / $V_{GT}$</td><td>Corriente / tensión de compuerta para disparar</td><td>≤ 200 µA / ≤ 1 V</td><td>2 mA típ. (≤ 15 mA) / ≤ 1,5 V</td></tr>
<tr><td>$I_H$</td><td>Corriente de mantenimiento</td><td>≤ 5 mA</td><td>≈ 7 mA (≤ 20 mA)</td></tr>
<tr><td>$I_L$</td><td>Corriente de enganche</td><td>≈ 8 mA</td><td>≈ 10 mA (≤ 40 mA)</td></tr>
<tr><td>$dv/dt$</td><td>Velocidad máxima de subida de $V_{AK}$ sin dispararse solo</td><td colspan="2">decenas a cientos de V/µs</td></tr>
</table></div>
<div class="caja tip"><span class="caja-titulo">Para tener en cuenta</span>
Elegí $V_{DRM}$ con margen: en la red de 220 V el pico es $311\,\text{V}$, más los picos de la línea; se usan tiristores de <b>600 V</b> o más. Y si la tensión sube muy rápido ($dv/dt$ alto, por ejemplo con cargas inductivas), el tiristor se puede disparar solo: para eso se pone un <b>snubber</b> (R de ~100 Ω en serie con C de ~100 nF en paralelo con el tiristor).
</div>

<h2>6. El SCR en alterna: control de fase</h2>
${esqSCRca()}
<p>En cada semiciclo positivo el SCR arranca bloqueado. El circuito de disparo espera un cierto tiempo después del cruce por cero y recién ahí manda el pulso. Ese retardo, medido en grados del ciclo, es el <b>ángulo de disparo</b> $\alpha$:</p>
<ul>
<li>Desde $0$ hasta $\alpha$: el SCR bloquea, la carga recibe <b>0 V</b>.</li>
<li>Desde $\alpha$ hasta $180°$: el SCR conduce, la carga recibe la tensión de la red.</li>
<li>En $180°$ la corriente se hace cero → el SCR <b>se apaga solo</b>.</li>
<li>Durante todo el semiciclo negativo bloquea (es media onda).</li>
</ul>
<p>El <b>ángulo de conducción</b> es $\theta=180°-\alpha$. Con $\alpha=0$ el SCR se comporta igual que un diodo (rectificador de media onda); con $\alpha=180°$ no entrega nada. Para pasar de ángulo a tiempo, a 50 Hz: $t=\dfrac{\alpha}{360°}\cdot20\,\text{ms}$ (90° = 5 ms).</p>
<div class="caja formula"><span class="caja-titulo">Tensión media en la carga (SCR, media onda, carga resistiva)</span>
$$V_{med}=\frac{1}{2\pi}\int_{\alpha}^{\pi}V_p\,\text{sen}\,\omega t\;d(\omega t)=\frac{V_p}{2\pi}\,(1+\cos\alpha)$$
<p>Con $V_p=220\sqrt2=311\,\text{V}$: $V_{med}$ va de $99\,\text{V}$ ($\alpha=0$) a $0$ ($\alpha=180°$).</p>
$$V_{rms}=V_p\sqrt{\frac{\pi-\alpha+\frac{1}{2}\text{sen}\,2\alpha}{4\pi}}$$
</div>
<div class="caja ejemplo"><span class="caja-titulo">Ejemplo: cargador de batería con SCR</span>
Un SCR con carga resistiva en 220 V, $\alpha=60°$:
$$V_{med}=\frac{311}{2\pi}(1+\cos60°)=49{,}5\cdot1{,}5=74{,}3\,\text{V}$$
Con $\alpha=90°$: $V_{med}=49{,}5\cdot(1+0)=49{,}5\,\text{V}$ (justo la mitad del máximo). Fijate que el SCR permite <b>regular una tensión continua</b> sin resistencias que disipen: solo “recorta” cuánto de cada semiciclo deja pasar.
</div>

<h2>7. El TRIAC: el tiristor de alterna</h2>
<div class="dos-col">
<div>
${Esq.svg(240, 170, [
  Esq.triac(100, 85), Esq.cable([[100, 55], [100, 30]]), Esq.borne(100, 26, 'MT2 (A2)', 0, -10),
  Esq.cable([[100, 115], [100, 140]]), Esq.borne(100, 144, 'MT1 (A1)', 0, 22), Esq.borne(130, 107, 'G', 12, 4),
], 'Símbolo del TRIAC: dos SCR en antiparalelo con una sola compuerta.')}
</div>
<div>
<p>El TRIAC equivale a <b>dos SCR en antiparalelo</b> (uno para cada semiciclo) con una compuerta común. Conduce en <b>ambos sentidos</b>, así que controla los dos semiciclos: es el componente ideal para regular potencia en alterna.</p>
<ul>
<li>Los terminales se llaman <b>MT1</b> y <b>MT2</b> (no hay ánodo y cátodo, porque conduce para los dos lados).</li>
<li>La tensión de compuerta se mide <b>respecto de MT1</b>.</li>
<li>Se dispara con pulsos <b>positivos o negativos</b> en G (los famosos 4 “cuadrantes”; el 4.º es el menos sensible y los TRIAC “3Q” o <em>snubberless</em> directamente no lo usan).</li>
<li>Modelos típicos: <b>BT136</b> (4 A, 600 V), <b>BT137</b> (8 A), <b>BTA16</b> (16 A, aislado).</li>
</ul>
</div>
</div>
<div class="caja formula"><span class="caja-titulo">TRIAC con carga resistiva (onda completa)</span>
<p>Como recorta igual los dos semiciclos, la tensión media es <b>cero</b> (sigue siendo alterna). Lo que importa es la tensión eficaz y la potencia:</p>
$$V_{rms}=V_{red}\sqrt{1-\frac{\alpha}{\pi}+\frac{\text{sen}\,2\alpha}{2\pi}}\qquad\qquad \frac{P}{P_{max}}=1-\frac{\alpha}{\pi}+\frac{\text{sen}\,2\alpha}{2\pi}$$
<p>con $\alpha$ en radianes dentro de la fórmula, $V_{red}=220\,\text{V}$ eficaces y $P_{max}=\dfrac{V_{red}^2}{R}$ (la potencia con el TRIAC siempre encendido).</p>
</div>
<div class="tabla-wrap"><table class="tabla">
<tr><th>α</th><th>0°</th><th>30°</th><th>60°</th><th>90°</th><th>120°</th><th>150°</th><th>180°</th></tr>
<tr><td><b>P / Pmax</b></td><td>100 %</td><td>97 %</td><td>80 %</td><td>50 %</td><td>20 %</td><td>3 %</td><td>0 %</td></tr>
<tr><td><b>Vrms</b></td><td>220 V</td><td>217 V</td><td>197 V</td><td>156 V</td><td>97 V</td><td>37 V</td><td>0 V</td></tr>
</table></div>
<div class="caja ojo"><span class="caja-titulo">La relación no es lineal</span>
Con $\alpha=30°$ ya “cortaste” un sexto de cada semiciclo, pero la potencia apenas bajó un 3 %: es porque lo que se recorta al principio es la parte de <b>tensión chica</b> de la senoide. En cambio, entre 60° y 120° (donde la senoide está cerca del pico) la potencia cae del 80 % al 20 %. Por eso la perilla de un dimmer “hace casi todo” en el medio de su recorrido.
</div>
<div class="caja ejemplo"><span class="caja-titulo">Ejemplo: lámpara de 100 W con dimmer</span>
$R=\dfrac{220^2}{100}=484\,\Omega$. Con $\alpha=90°$:
$$\frac{P}{P_{max}}=1-\frac{\pi/2}{\pi}+\frac{\text{sen}\,180°}{2\pi}=1-0{,}5+0=0{,}5\;\Rightarrow\;P=50\,\text{W}$$
$$V_{rms}=220\sqrt{0{,}5}=155{,}6\,\text{V}$$
Con $\alpha=120°$: $1-0{,}667+\dfrac{\text{sen}\,240°}{2\pi}=0{,}333-0{,}138=0{,}196$ → $P\approx19{,}6\,\text{W}$.
</div>

<h2>8. El DIAC</h2>
<div class="dos-col">
<div>${curvaDIAC()}</div>
<div>
<p>El <b>DIAC</b> es un “tiristor sin compuerta” de dos terminales y simétrico. No conduce hasta que la tensión entre sus terminales supera la <b>tensión de ruptura</b> $V_{BO}$ (en el DB3, entre 28 y 36 V, típico 32 V), en cualquier polaridad. Al superarla, conduce de golpe y su tensión <b>cae unos 10 V</b>: eso hace que el capacitor que lo alimentaba se descargue bruscamente a través de él, generando un <b>pulso de corriente</b> limpio y rápido.</p>
<p>Su única función práctica: <b>disparar TRIACs</b> de manera simétrica en los dos semiciclos.</p>
</div>
</div>

<h2>9. El dimmer clásico: RC + DIAC + TRIAC</h2>
${esqDimmer()}
<ol>
<li>Al empezar cada semiciclo, el capacitor C se carga a través del potenciómetro P. La tensión $v_C$ está <b>atrasada</b> respecto de la red, y el atraso depende de $R\cdot C$.</li>
<li>Cuando $v_C$ llega a ~32 V, el DIAC conduce y descarga C en la compuerta: el TRIAC <b>se dispara</b>.</li>
<li>El TRIAC conduce hasta el final del semiciclo (cuando la corriente pasa por cero) y se apaga solo.</li>
<li>En el semiciclo negativo pasa exactamente lo mismo con las polaridades invertidas (el DIAC es simétrico).</li>
</ol>
<p><b>Más resistencia en P</b> → C se carga más lento → el disparo llega más tarde → <b>α mayor</b> → la lámpara brilla menos.</p>
<div class="caja tip"><span class="caja-titulo">Detalles de los dimmers reales</span>
<ul>
<li>Tienen una resistencia fija en serie con P (~3,3 kΩ) para que, con P en cero, no se queme nada.</li>
<li>Llevan un <b>filtro</b> (una bobina de unos 100 µH y un capacitor clase X2) porque el encendido brusco en mitad de la senoide genera interferencia de radio (el “zumbido” en la radio AM).</li>
<li>Un dimmer simple tiene <b>histéresis</b>: para encender la lámpara desde apagada hay que girar más que para apagarla.</li>
<li><b>No sirven para lámparas LED comunes</b>, solo para las que dicen “dimerizable”; con una LED no dimerizable parpadea o se rompe la fuente interna.</li>
</ul>
</div>

<h2>10. Aplicaciones</h2>
<div class="tabla-wrap"><table class="tabla">
<tr><th>Aplicación</th><th>Dispositivo</th><th>Cómo funciona</th></tr>
<tr><td><b>Dimmer de iluminación</b></td><td>TRIAC + DIAC</td><td>Control de fase de los dos semiciclos.</td></tr>
<tr><td><b>Velocidad de motor universal</b> (taladro, licuadora, aspiradora, amoladora)</td><td>TRIAC</td><td>El motor universal (con escobillas) gira más lento con menos tensión eficaz. Al ser carga inductiva necesita snubber.</td></tr>
<tr><td><b>Arranque suave</b> de motores</td><td>SCR en antiparalelo o TRIAC</td><td>Se arranca con α grande y se lo va bajando en unos segundos: limita el pico de corriente de arranque.</td></tr>
<tr><td><b>Crowbar</b> (protección por sobretensión)</td><td>SCR</td><td>Un zener detecta la sobretensión y dispara un SCR que pone la salida en <b>cortocircuito</b>, quemando el fusible. Protege lo que está alimentado: mejor un fusible quemado que una placa quemada.</td></tr>
<tr><td>Relé de estado sólido (SSR)</td><td>Opto‑TRIAC + TRIAC</td><td>Prende y apaga cargas de 220 V sin contactos mecánicos ni chispas.</td></tr>
<tr><td>Rectificadores controlados, cargadores, soldadoras</td><td>SCR</td><td>Regulan la tensión continua con el ángulo de disparo.</td></tr>
</table></div>

<h2>11. Controlar 220 V desde un microcontrolador: optoacopladores</h2>
${esqMOC()}
<p>Nunca se conecta un pin del Arduino directamente a un circuito de 220 V. Se usa un <b>optoacoplador con salida TRIAC</b>:</p>
<ul>
<li><b>MOC3021</b> (o MOC3020/3023): “random phase”, dispara en cualquier momento. Sirve para <b>control de fase</b> (dimmer digital), junto con un <b>detector de cruce por cero</b> que le avisa al micro cuándo empieza cada semiciclo para contar el retardo α.</li>
<li><b>MOC3041</b> (o MOC3061/3063): tiene <b>detector de cruce por cero interno</b>: solo dispara cerca de 0 V. Sirve para prender y apagar (on/off, control por ciclos enteros), con mucha menos interferencia. No sirve para dimmer por fase.</li>
<li>El LED interno necesita unos 15 mA ($I_{FT}$ del MOC3021): $R_1=\frac{5-1{,}2}{0{,}015}\approx250\,\Omega$ → se usa 220 Ω.</li>
<li>La aislación entre el LED y la salida es de unos <b>7500 V</b>: el lado del micro queda separado de la red.</li>
</ul>
<div class="caja ojo"><span class="caja-titulo">⚠ Seguridad con 220 V: esto no es un chiste</span>
<ul>
<li>La red de 220 V <b>puede matar</b>. Una corriente de 30 mA a través del pecho ya puede provocar fibrilación cardíaca. Los 220 V eficaces son <b>311 V de pico</b>.</li>
<li>En un circuito con TRIAC, <b>todo el lado de potencia está conectado a la red</b>, incluido el disipador del TRIAC (en el BT136 la aleta está unida a MT2) y la perilla del potenciómetro si es metálica. Aunque la lámpara esté apagada, el circuito sigue “vivo”.</li>
<li><b>Nunca</b> midas con el osciloscopio común directamente sobre la red: la masa de la punta está conectada a tierra y provocás un cortocircuito (y podés destruir el osciloscopio).</li>
<li>Para aprender, usá <b>simuladores</b> (Falstad, Tinkercad) o módulos comerciales con optoacoplador ya armados y encapsulados, siempre con un adulto o docente que sepa, con <b>disyuntor diferencial</b> funcionando, fusible, y desenchufando antes de tocar cualquier cosa.</li>
<li>En el aula y en casa: los experimentos con tiristores se hacen con <b>baja tensión</b> (12 V de continua o un transformador de 12 V de alterna).</li>
</ul>
</div>
`,

    simulaciones: [
      {
        titulo: 'Control de fase con SCR y TRIAC',
        descripcion: 'Mové el ángulo de disparo α y mirá qué parte de cada semiciclo llega a la carga. Compará SCR (media onda) con TRIAC (onda completa).',
        montar(cont, H) {
          const { controles, vista } = H.layout(cont);
          const tipo = H.select(controles, { label: 'Dispositivo', opciones: [{ v: 'triac', t: 'TRIAC (onda completa)' }, { v: 'scr', t: 'SCR (media onda)' }], value: 'triac', onChange: upd });
          const alfa = H.slider(controles, { label: 'Ángulo de disparo α', min: 0, max: 180, step: 1, value: 90, fmt: v => H.num(v, 0) + '°  (' + H.num(v / 180 * 10, 2) + ' ms)', onInput: upd });
          const rl = H.slider(controles, { label: 'Carga R', min: 48.4, max: 4840, log: true, value: 484, fmt: v => H.fmt(v, 'Ω') + '  (' + H.num(VRED * VRED / v, 0) + ' W a pleno)', onInput: upd });
          H.sep(controles);
          H.titulo(controles, 'Probá');
          [[0, 'α = 0°'], [60, '60°'], [90, '90°'], [120, '120°'], [150, '150°']].forEach(([a, t]) => H.boton(controles, t, () => { alfa.value = a; upd(); }, 'btn chico'));
          let S = {};
          const canvas = H.canvas(vista, {
            alto: (w) => Math.max(270, Math.min(360, w * 0.55)),
            dibujar(ctx, w, h) {
              const der = Math.max(80, Math.min(130, w * 0.2));
              const ws = w - der;
              const hg = 38;
              const hp = h - hg - 62;
              const tMax = 40; // ms (2 ciclos)
              const w0 = 2 * Math.PI * FRED / 1000; // rad por ms
              const red = (t) => VP * Math.sin(w0 * t);
              const a = S.a;
              const conduce = (t) => {
                const th = ((w0 * t) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
                if (S.tipo === 'scr') return th < Math.PI && th >= a && a < Math.PI;
                return (th % Math.PI) >= a && a < Math.PI;
              };
              const carga = (t) => (conduce(t) ? red(t) : 0);
              const P1 = H.ejes(ctx, ws, h, { x0: 50, y0: 10, w: ws - 60, h: hp, xmin: 0, xmax: tMax, ymin: -360, ymax: 360, ny: 6, nx: 8, ylabel: 'v (V)', xlabel: 't (ms)', xfmt: v => H.num(v, 0) });
              P1.area(carga, { color: H.col('c1'), alfa: 0.28, n: 1600 });
              P1.fn(red, { color: H.col('muted'), ancho: 1.4, guiones: [4, 4], n: 600 });
              P1.fn(carga, { color: H.col('c1'), ancho: 2.2, n: 1600 });
              // marcas de α
              const semis = S.tipo === 'scr' ? [0, 20] : [0, 10, 20, 30];
              if (a < Math.PI) semis.forEach((t0, i) => {
                const ta = t0 + a / w0;
                P1.vline(ta, { color: H.col('c2'), guiones: [2, 3], label: i === 0 ? 'α' : '' });
              });
              P1.texto(tMax, 330, 'red (punteada)', { color: H.col('muted'), align: 'right', font: '11px sans-serif' });
              P1.texto(0.4, -330, 'tensión en la carga', { color: H.col('c1'), align: 'left', font: '600 11px sans-serif' });
              // pulsos de compuerta
              const P2 = H.ejes(ctx, ws, h, { x0: 50, y0: 10 + hp + 24, w: ws - 60, h: hg, xmin: 0, xmax: tMax, ymin: 0, ymax: 1.3, grid: false, etiquetas: false, ylabel: 'iG' });
              const pulso = (t) => {
                if (a >= Math.PI) return 0;
                for (const t0 of semis) { const ta = t0 + a / w0; if (t >= ta && t < ta + 0.5) return 1; }
                return 0;
              };
              P2.area(pulso, { color: H.col('c2'), alfa: 0.85, n: 2000 });
              P2.fn(pulso, { color: H.col('c2'), ancho: 1.5, n: 2000 });
              ctx.save();
              ctx.fillStyle = H.col('muted'); ctx.font = '11px sans-serif'; ctx.textAlign = 'left';
              ctx.fillText('pulsos de compuerta' + (S.tipo === 'scr' ? ' (solo semiciclo +)' : ' (cada semiciclo)'), 54, 10 + hp + 24 + hg + 14);
              ctx.restore();
              // lámpara
              const cx = ws + der / 2, cy = h * 0.38;
              H.brillo(ctx, cx, cy, Math.min(22, der * 0.2), S.frac, '#ffd34d');
              ctx.save();
              ctx.fillStyle = H.col('ink'); ctx.textAlign = 'center'; ctx.font = '700 13px sans-serif';
              ctx.fillText(H.num(S.frac * 100, 0) + ' %', cx, cy + 62);
              ctx.fillStyle = H.col('muted'); ctx.font = '11px sans-serif';
              ctx.fillText('de Pmax', cx, cy + 78);
              ctx.fillText(H.fmt(S.P, 'W'), cx, cy + 94);
              ctx.restore();
            },
          });
          const lec = H.lecturas(vista);
          const nota = H.nota(vista);
          function upd() {
            const aDeg = alfa.value, a = aDeg * Math.PI / 180, R = rl.value, t = tipo.value;
            const vrms = t === 'scr' ? vrmsSCR(a) : vrmsTRIAC(a);
            const vmed = t === 'scr' ? vmedSCR(a) : 0;
            const P = vrms * vrms / R, Pmax = VRED * VRED / R;
            S = { a, tipo: t, P, frac: P / Pmax };
            canvas.redibujar();
            lec.set([
              { k: 'Ángulo de disparo α', v: H.num(aDeg, 0) + '° = ' + H.num(aDeg / 180 * 10, 2) + ' ms' },
              { k: 'Ángulo de conducción', v: H.num(180 - aDeg, 0) + '°' + (t === 'scr' ? ' (solo +)' : ' por semiciclo') },
              { k: 'V media en la carga', v: H.fmt(vmed, 'V') },
              { k: 'V eficaz en la carga', v: H.fmt(vrms, 'V') },
              { k: 'Potencia en la carga', v: H.fmt(P, 'W') },
              { k: 'P / Pmax', v: H.num(S.frac * 100, 1) + ' %', estado: S.frac > 0.6 ? 'ok' : S.frac > 0.2 ? 'alerta' : '' },
            ]);
            let txt;
            if (t === 'scr') {
              txt = `<b>SCR, media onda:</b> el semiciclo negativo nunca pasa. V<sub>med</sub> = (V<sub>p</sub>/2π)(1 + cos α) = 49,5 × (1 + ${H.num(Math.cos(a), 3)}) = <b>${H.fmt(vmed, 'V')}</b>. `;
              txt += aDeg === 0 ? 'Con α = 0 se comporta como un diodo: rectificador de media onda, ¡y la lámpara recibe a lo sumo el 50 % de la potencia!' : `Aunque α = 0, el SCR nunca supera el 50 % de P<sub>max</sub>: le falta todo el semiciclo negativo. Pasá a TRIAC y compará.`;
            } else {
              txt = `<b>TRIAC, onda completa:</b> recorta igual los dos semiciclos, así que la tensión media es 0 (sigue siendo alterna). P/P<sub>max</sub> = 1 − α/π + sen(2α)/(2π) = 1 − ${H.num(a / Math.PI, 3)} + ${H.num(Math.sin(2 * a) / (2 * Math.PI), 3)} = <b>${H.num(S.frac, 3)}</b>. `;
              if (aDeg <= 40) txt += 'Fijate que con α chico la potencia casi no baja: se está recortando la parte de tensión baja de la senoide.';
              else if (aDeg >= 140) txt += 'Con α grande queda solo la “colita” de cada semiciclo: casi nada de potencia.';
              else txt += 'En esta zona (cerca del pico de la senoide) cada grado de α cambia mucho la potencia.';
            }
            txt += ` El pulso de compuerta solo <b>enciende</b>; el apagado ocurre solo, cuando la corriente cruza por cero al final del semiciclo.`;
            nota.innerHTML = txt;
          }
          upd();
        },
      },
      {
        titulo: 'Enclavamiento del SCR en continua',
        descripcion: 'Dale un pulso a la compuerta y soltalo: el SCR sigue conduciendo. Para apagarlo hay que cortar la corriente de ánodo. Probá subir la resistencia de carga.',
        montar(cont, H) {
          const { controles, vista } = H.layout(cont);
          const V = 12, VT = 1, IH = 0.010, IL = 0.020, IGT = 0.005, IGON = (12 - 0.8) / 1000;
          const rl = H.slider(controles, { label: 'Carga RL', min: 100, max: 3000, log: true, value: 220, unidad: 'Ω', onInput: () => { msg = ''; } });
          H.sep(controles);
          H.boton(controles, '⚡ Pulso en G', () => { tPulso = 0.4; msg = ''; });
          H.boton(controles, 'Apagar (abre el ánodo un instante)', () => { tAbierto = 0.6; msg = ''; }, 'btn chico');
          H.boton(controles, 'Borrar gráfico', () => { hist = []; }, 'btn chico');
          const fig = H.el('div'); vista.append(fig);
          let on = false, tPulso = 0, tAbierto = 0, tPrev = 0, tAct = 0, hist = [], msg = '', clave = '', ultimo = 'inicio';
          let ig = 0, ia = 0;
          const VENT = 10;
          const canvas = H.canvas(vista, {
            alto: (w) => Math.max(240, Math.min(300, w * 0.45)),
            dibujar(ctx, w, h) {
              const izq = Math.max(70, Math.min(110, w * 0.17));
              const iamax = Math.max(0.12, V / 100 * 1.1) * 1000;
              const t1 = Math.max(VENT, tAct), t0 = t1 - VENT;
              const hh = (h - 40) / 2;
              const P1 = H.ejes(ctx, w, h, { x0: izq + 40, y0: 8, w: w - izq - 52, h: hh - 8, xmin: t0, xmax: t1, ymin: 0, ymax: 15, ny: 3, ylabel: 'IG (mA)', etiquetas: true, xfmt: () => '' });
              P1.pts(hist.map(p => [p.t, p.ig * 1000]), { color: H.col('c2'), ancho: 2 });
              P1.hline(IGT * 1000, { color: H.col('muted'), label: 'IGT', labelX: t1 });
              const P2 = H.ejes(ctx, w, h, { x0: izq + 40, y0: 8 + hh + 6, w: w - izq - 52, h: hh - 8, xmin: t0, xmax: t1, ymin: 0, ymax: iamax, ny: 4, ylabel: 'IA (mA)', xlabel: 't (s)', xfmt: v => H.num(v, 0) });
              P2.area(() => 0, { alfa: 0 });
              P2.pts(hist.map(p => [p.t, p.ia * 1000]), { color: H.col('c1'), ancho: 2.4 });
              P2.hline(IL * 1000, { color: H.col('amber'), label: 'IL', labelX: t0 + 0.4 });
              P2.hline(IH * 1000, { color: H.col('red'), label: 'IH', labelX: t0 + 1.8 });
              // lámpara + estado
              const cx = izq / 2, cy = h * 0.35;
              H.brillo(ctx, cx, cy, Math.min(20, izq * 0.2), ia / (V / 100 * 0.92), '#ffd34d');
              ctx.save();
              ctx.textAlign = 'center'; ctx.font = '700 12px sans-serif';
              ctx.fillStyle = on ? H.col('green') : H.col('muted');
              ctx.fillText(on ? 'CONDUCE' : 'BLOQUEA', cx, cy + 56);
              ctx.font = '11px sans-serif'; ctx.fillStyle = H.col('muted');
              ctx.fillText(tPulso > 0 ? 'pulso G' : tAbierto > 0 ? 'ánodo abierto' : '', cx, cy + 72);
              ctx.restore();
            },
          });
          const lec = H.lecturas(vista);
          const nota = H.nota(vista);

          function esquema(anodo, pulso) {
            fig.innerHTML = Esq.svg(480, 245, [
              Esq.bat(60, 100, 60, 200, 'V', '12 V', -1),
              Esq.cable([[60, 100], [60, 80], [110, 80]]), Esq.nodo(85, 80),
              Esq.llave(110, 80, 170, 80, 'Apagado', anodo ? '(cerrada)' : 'ABIERTA', -1, anodo), Esq.cable([[170, 80], [200, 80]]),
              Esq.lampara(200, 80, 270, 80, 'RL', H.fmt(rl.value, 'Ω'), -1),
              Esq.cable([[270, 80], [330, 80], [330, 110]]), Esq.scr(330, 140, 'SCR'),
              Esq.cable([[330, 170], [330, 220], [60, 220], [60, 200]]),
              Esq.cable([[85, 80], [85, 30], [200, 30]]), Esq.llave(200, 30, 260, 30, '', '', -1, pulso), Esq.texto(230, 52, 'Pulsador G', { size: 12 }),
              Esq.cable([[260, 30], [410, 30]]), Esq.R(410, 30, 410, 110, 'RG', '1 kΩ', 1), Esq.cable([[410, 110], [410, 162], [356, 162]]),
              Esq.texto(372, 182, 'IG = ' + H.fmt(ig, 'A'), { color: 'var(--c2)', size: 12, anchor: 'start' }),
              Esq.texto(342, 205, 'IA = ' + H.fmt(ia, 'A'), { color: 'var(--c1)', size: 12, anchor: 'start' }),
              Esq.texto(220, 165, on ? 'SCR ENCLAVADO' : 'SCR BLOQUEADO', { color: on ? 'var(--green)' : 'var(--muted)', size: 13 }),
            ]);
          }

          function textoNota() {
            const iaPos = (V - VT) / rl.value;
            if (msg) return msg;
            if (on) return `<b>Conduciendo:</b> I<sub>A</sub> = (12 − 1) V / ${H.fmt(rl.value, 'Ω')} = ${H.fmt(iaPos, 'A')}, mayor que I<sub>H</sub> = 10 mA, así que el SCR <b>se mantiene encendido sin corriente de compuerta</b>. Probá apagarlo con el botón, o subí RL hasta que I<sub>A</sub> baje de 10 mA.`;
            return `<b>Bloqueado:</b> hay 12 V entre ánodo y cátodo pero el SCR no conduce. Apretá <b>Pulso en G</b>. Con esta carga, I<sub>A</sub> sería ${H.fmt(iaPos, 'A')}: ${iaPos >= IL ? 'supera I<sub>L</sub> = 20 mA, así que va a quedar enganchado.' : iaPos >= IH ? 'no llega a I<sub>L</sub> = 20 mA: conducirá solo mientras dure el pulso (no engancha).' : 'ni siquiera llega a I<sub>H</sub>.'}`;
          }

          H.loop((t) => {
            const dt = Math.min(0.1, t - tPrev); tPrev = t; tAct = t;
            const pulso = tPulso > 0, anodo = !(tAbierto > 0);
            const iaPos = anodo ? (V - VT) / rl.value : 0;
            ig = pulso ? IGON : 0;
            if (!on && pulso && anodo && ig >= IGT && iaPos >= IL) { on = true; ultimo = 'disparo'; msg = `<b>¡Disparado!</b> El pulso de ${H.fmt(IGON, 'A')} en la compuerta encendió el SCR y la corriente de ánodo (${H.fmt(iaPos, 'A')}) superó I<sub>L</sub> = 20 mA: quedó <b>enclavado</b>. Fijate en el gráfico: I<sub>G</sub> vuelve a cero y I<sub>A</sub> sigue.`; }
            if (on && (!anodo || iaPos < IH)) {
              on = false;
              msg = !anodo ? `<b>Apagado:</b> al abrir el circuito de ánodo, I<sub>A</sub> cayó a cero (menos que I<sub>H</sub>) y el SCR se desenganchó. Al volver a cerrar la llave <b>sigue apagado</b>: hace falta un nuevo pulso.` : `<b>Se apagó solo:</b> al subir RL, I<sub>A</sub> = ${H.fmt(iaPos, 'A')} quedó por debajo de I<sub>H</sub> = 10 mA. La realimentación interna no alcanza para sostener la conducción.`;
            }
            if (!on && pulso && anodo && iaPos >= IH && iaPos < IL && ultimo !== 'noeng') { ultimo = 'noeng'; msg = `<b>No engancha:</b> durante el pulso circula I<sub>A</sub> = ${H.fmt(iaPos, 'A')}, pero no llega a la corriente de enganche I<sub>L</sub> = 20 mA. Cuando el pulso termina, se apaga. Bajá RL (menos de 550 Ω) y volvé a probar. Ojo: si ya estaba encendido, con esta misma corriente se mantendría (porque supera I<sub>H</sub>).`; }
            if (!pulso && ultimo === 'noeng') ultimo = '';
            ia = on ? iaPos : (pulso && anodo && iaPos >= IH ? iaPos : 0);
            if (tPulso > 0) tPulso -= dt;
            if (tAbierto > 0) tAbierto -= dt;
            hist.push({ t, ig, ia });
            while (hist.length && hist[0].t < t - VENT - 0.5) hist.shift();
            const k = [on, pulso, anodo, rl.value, msg].join('|');
            if (k !== clave) {
              clave = k;
              esquema(anodo, pulso);
              lec.set([
                { k: 'Estado', v: on ? 'conduce (enclavado)' : 'bloqueado', estado: on ? 'ok' : '' },
                { k: 'IG', v: H.fmt(ig, 'A') },
                { k: 'IA', v: H.fmt(ia, 'A') },
                { k: 'VAK', v: !anodo ? '— (abierto)' : ia > 0 ? '≈ 1 V' : '12 V' },
                { k: 'IA posible = 11 V / RL', v: H.fmt((V - VT) / rl.value, 'A'), estado: (V - VT) / rl.value >= IL ? 'ok' : (V - VT) / rl.value >= IH ? 'alerta' : 'mal' },
                { k: 'IH / IL del SCR', v: '10 mA / 20 mA' },
              ]);
              nota.innerHTML = textoNota();
            }
            canvas.redibujar();
          });
        },
      },
    ],

    ejercicios: [
      {
        nivel: 'Básico',
        enunciado: String.raw`Un SCR controla una resistencia de $100\,\Omega$ conectada a la red de 220 V, 50 Hz (media onda). El ángulo de disparo es $\alpha=60°$. Calculá la tensión media y la corriente media en la carga. ¿Cuántos milisegundos después del cruce por cero llega el pulso?`,
        pista: String.raw`$V_p=220\sqrt2$; $V_{med}=\frac{V_p}{2\pi}(1+\cos\alpha)$; $t=\frac{\alpha}{360°}\cdot20\,\text{ms}$.`,
        solucion: String.raw`$V_p=311{,}1\,\text{V}$ → $\frac{V_p}{2\pi}=49{,}5\,\text{V}$.<br>$V_{med}=49{,}5\cdot(1+0{,}5)=74{,}3\,\text{V}$.<br>$I_{med}=\frac{74{,}3}{100}=0{,}743\,\text{A}$.<br>$t=\frac{60}{360}\cdot20=3{,}33\,\text{ms}$.`,
      },
      {
        nivel: 'Básico',
        enunciado: String.raw`Una lámpara incandescente de 100 W / 220 V se controla con un dimmer a TRIAC. (a) ¿Cuál es su resistencia (suponela constante)? (b) ¿Qué potencia y qué tensión eficaz recibe con $\alpha=90°$?`,
        pista: String.raw`$R=V^2/P$; $\frac{P}{P_{max}}=1-\frac{\alpha}{\pi}+\frac{\text{sen}\,2\alpha}{2\pi}$.`,
        solucion: String.raw`(a) $R=\frac{220^2}{100}=484\,\Omega$.<br>(b) $\frac{P}{P_{max}}=1-0{,}5+\frac{\text{sen}\,180°}{2\pi}=0{,}5$ → $P=50\,\text{W}$. $V_{rms}=\sqrt{P\cdot R}=\sqrt{50\cdot484}=155{,}6\,\text{V}$ (o $220\sqrt{0{,}5}$). En la realidad la resistencia del filamento baja cuando está más frío, así que la potencia real es algo mayor.`,
      },
      {
        nivel: 'Intermedio',
        enunciado: String.raw`Una estufa eléctrica de 1000 W se regula con un TRIAC. Calculá la potencia para $\alpha=60°$ y para $\alpha=120°$. ¿Por qué no da 2/3 y 1/3 de la potencia, si con 60° conduce 2/3 de cada semiciclo y con 120°, 1/3?`,
        pista: String.raw`Pasá α a radianes: $60°=\pi/3$, $120°=2\pi/3$. Pensá en qué parte de la senoide hay más tensión.`,
        solucion: String.raw`$\alpha=60°$: $1-\frac13+\frac{\text{sen}\,120°}{2\pi}=0{,}667+\frac{0{,}866}{6{,}283}=0{,}667+0{,}138=0{,}804$ → $P=804\,\text{W}$.<br>$\alpha=120°$: $1-\frac23+\frac{\text{sen}\,240°}{2\pi}=0{,}333-0{,}138=0{,}196$ → $P=196\,\text{W}$.<br>No es proporcional al tiempo de conducción porque la potencia depende de $v^2$: con $\alpha=60°$ se recorta la parte inicial, de tensión baja (aporta poco); con $\alpha=120°$ se recorta incluso el pico, que es lo que más aporta.`,
      },
      {
        nivel: 'Intermedio',
        enunciado: String.raw`En el circuito de la simulación 2 (12 V, SCR con $V_T=1\,\text{V}$, $I_H=10\,\text{mA}$, $I_L=20\,\text{mA}$), analizá qué pasa al dar un pulso en G con $R_L=470\,\Omega$, $820\,\Omega$ y $1{,}5\,\text{k}\Omega$. ¿Cuál es la máxima $R_L$ con la que engancha y la máxima con la que se mantiene encendido?`,
        pista: String.raw`$I_A=\frac{V-V_T}{R_L}$. Compará con $I_L$ (para engancharse) y con $I_H$ (para mantenerse).`,
        solucion: String.raw`$470\,\Omega$: $I_A=\frac{11}{470}=23{,}4\,\text{mA}>I_L$ → <b>engancha</b> y queda encendido.<br>$820\,\Omega$: $I_A=13{,}4\,\text{mA}$: entre $I_H$ e $I_L$ → al dar el pulso <b>no engancha</b> (conduce solo durante el pulso). Pero si ya estaba encendido con una carga menor y subís a 820 Ω, <b>se mantiene</b>.<br>$1{,}5\,\text{k}\Omega$: $I_A=7{,}3\,\text{mA}\lt I_H$ → no se mantiene nunca.<br>Para enganchar: $R_L\le\frac{11}{0{,}02}=550\,\Omega$. Para mantenerse: $R_L\le\frac{11}{0{,}01}=1100\,\Omega$.`,
      },
      {
        nivel: 'Avanzado',
        enunciado: String.raw`Querés hacer un dimmer digital con Arduino, un detector de cruce por cero y un MOC3021 que maneja un BT136. (a) Calculá la resistencia para el LED del MOC3021 ($I_{FT}=15\,\text{mA}$, $V_F=1{,}2\,\text{V}$) desde un pin de 5 V. (b) Para entregar el 30 % de la potencia a una carga resistiva, ¿qué α hace falta y cuántos milisegundos después de cada cruce por cero tiene que mandar el pulso el Arduino?`,
        pista: String.raw`(b) Resolvé $1-\frac{\alpha}{\pi}+\frac{\text{sen}\,2\alpha}{2\pi}=0{,}3$ probando valores (o con la simulación 1). Cada semiciclo dura 10 ms.`,
        solucion: String.raw`(a) $R=\frac{5-1{,}2}{0{,}015}=253\,\Omega$ → se usa <b>220 Ω</b> (da $17{,}3\,\text{mA}$, por encima de $I_{FT}$ y dentro de lo que tolera el pin).<br>(b) Probando: con $105°$ da $0{,}337$; con $110°$ da $0{,}286$; afinando, $\alpha\approx108{,}6°$. Retardo: $t=\frac{108{,}6°}{180°}\cdot10\,\text{ms}\approx6{,}0\,\text{ms}$ después de <b>cada</b> cruce por cero (100 veces por segundo). Se usa el MOC3021 y no el MOC3041 porque este último solo dispara cerca del cruce por cero.`,
      },
      {
        nivel: 'Avanzado',
        enunciado: String.raw`Una resistencia calefactora de $100\,\Omega$ se controla con un SCR (media onda) a $\alpha=90°$. Calculá la tensión eficaz y la potencia. Compará con la potencia que tendría conectada directo a 220 V. ¿Qué porcentaje es?`,
        pista: String.raw`$V_{rms}=V_p\sqrt{\frac{\pi-\alpha+\frac12\text{sen}\,2\alpha}{4\pi}}$, $P=V_{rms}^2/R$.`,
        solucion: String.raw`Con $\alpha=\pi/2$: $V_{rms}=311{,}1\sqrt{\frac{\pi/2}{4\pi}}=311{,}1\sqrt{\frac18}=110\,\text{V}$.<br>$P=\frac{110^2}{100}=121\,\text{W}$. Directo a la red: $P_{max}=\frac{220^2}{100}=484\,\text{W}$.<br>Porcentaje: $\frac{121}{484}=25\,\%$ (la mitad de la mitad: el SCR pierde un semiciclo entero y de lo que queda pasa la mitad).`,
      },
    ],

    quiz: [
      { pregunta: 'Una vez disparado un SCR en un circuito de corriente continua, ¿cómo se apaga?', opciones: ['Sacando el pulso de compuerta', 'Con un pulso negativo en la compuerta', 'Haciendo que la corriente de ánodo baje de IH (por ejemplo, abriendo el circuito)', 'Se apaga solo a los pocos milisegundos'], correcta: 2, explicacion: 'Queda enclavado: la compuerta pierde el control. Solo se apaga si IA < IH. (El GTO es el que sí se apaga por compuerta.)' },
      { pregunta: '¿Por qué en corriente alterna el SCR se apaga solo?', opciones: ['Porque la compuerta se descarga', 'Porque al final de cada semiciclo la corriente pasa por cero (queda por debajo de IH)', 'Porque el DIAC lo apaga', 'Porque se calienta'], correcta: 1, explicacion: 'Es la conmutación natural: 100 veces por segundo la corriente se anula.' },
      { pregunta: 'Con un TRIAC y carga resistiva, α = 90°. ¿Qué fracción de la potencia máxima recibe la carga?', opciones: ['25 %', '50 %', '75 %', '90 %'], correcta: 1, explicacion: '1 − (π/2)/π + sen(180°)/(2π) = 0,5.' },
      { pregunta: 'Un SCR en media onda con α = 0°, ¿a qué componente equivale?', opciones: ['A un cortocircuito', 'A un diodo rectificador', 'A un TRIAC', 'A una llave abierta'], correcta: 1, explicacion: 'Conduce todo el semiciclo positivo y bloquea el negativo: un rectificador de media onda.' },
      { pregunta: 'En el dimmer clásico, ¿qué función cumple el DIAC?', opciones: ['Rectificar la tensión', 'Limitar la corriente de la lámpara', 'Generar un pulso de disparo cuando la tensión del capacitor supera ~32 V', 'Filtrar la interferencia'], correcta: 2, explicacion: 'Al superar VBO conduce de golpe y descarga el capacitor en la compuerta del TRIAC, en los dos semiciclos.' },
      { pregunta: '¿Para qué sirve el MOC3021 en un dimmer con Arduino?', opciones: ['Para aislar eléctricamente el microcontrolador de la red de 220 V', 'Para aumentar la potencia de la lámpara', 'Para detectar el cruce por cero', 'Para reemplazar al fusible'], correcta: 0, explicacion: 'El LED interno dispara un opto‑TRIAC: la única conexión entre los dos lados es la luz (aislación de miles de volts).' },
    ],

    docente: String.raw`
<p><b>Tema marcado “a confirmar”:</b> revisá si entra en el programa antes de habilitarlo.</p>
<h3>Objetivo de la clase</h3>
<p>Que el alumno entienda el comportamiento “enganchable” de los tiristores (se encienden por compuerta, se apagan cuando la corriente baja de I<sub>H</sub>), sepa por qué en alterna se apagan solos, y pueda calcular el efecto del <b>ángulo de disparo</b> sobre la tensión media (SCR) y la potencia (TRIAC). Además, que conozca el dimmer clásico y las <b>normas de seguridad</b> con 220 V. <b>Duración sugerida:</b> 2 clases de 60–80 min (1: SCR y enclavamiento; 2: control de fase, TRIAC, dimmer).</p>
<h3>Secuencia sugerida</h3>
<ol>
<li><b>Disparador (5 min):</b> “¿Cómo hace un dimmer para bajar la luz sin calentarse como una resistencia?”. Que piensen: una resistencia en serie que baje la lámpara a la mitad disiparía decenas de watts.</li>
<li><b>Ratonera y estructura (10 min):</b> la analogía, las cuatro capas, el símbolo. Remarcá: “la compuerta solo enciende”.</li>
<li><b>Simulación 2 (15 min):</b> antes de tocar, preguntá: “si aprieto el pulso y lo suelto, ¿qué pasa con la lámpara?”. Hacelo: sigue encendida. Apretá “Apagar”: se apaga y no vuelve aunque la llave se cierre. Después subí RL a ~800 Ω y probá disparar: conduce solo durante el pulso (no llega a I<sub>L</sub>). Bajá a 220 Ω, disparalo, y subí RL despacio: se apaga solo cuando I<sub>A</sub> cruza los 10 mA. Que lean las dos líneas I<sub>H</sub> e I<sub>L</sub> en el gráfico.</li>
<li><b>Dos transistores (10 min):</b> con el esquema, recorré el lazo de realimentación. Comparalo con el acople de micrófono.</li>
<li><b>Curva característica (5 min):</b> bloqueo directo, V<sub>BO</sub>, efecto de I<sub>G</sub>, I<sub>H</sub>.</li>
<li><b>Simulación 1 con SCR (15 min):</b> preguntá: “¿qué pasa cuando la tensión de la red se hace negativa?”. α = 0: es un diodo. Subí α: mostrá la fórmula de V<sub>med</sub> y comparala con las lecturas en 60° y 90°. Remarcá que aun con α = 0 la potencia es solo el 50 %.</li>
<li><b>TRIAC (15 min):</b> pasá a TRIAC. Preguntá antes: “¿con α = 90° la lámpara recibe la mitad de la potencia?” (sí, 50 %). “¿Y con α = 45°, recibe el 75 %?” (no: 91 %). Usá los botones 60° y 120° para mostrar la no linealidad. Ejercicio 3.</li>
<li><b>Dimmer y DIAC (10 min):</b> esquema RC + DIAC + TRIAC: más R → más atraso → α mayor.</li>
<li><b>Seguridad y MOC3021 (10 min):</b> leé la caja de seguridad completa. Mostrá cómo se aísla el Arduino.</li>
<li><b>Cierre:</b> autoevaluación. Tarea: ejercicios 1, 2, 4 y 6.</li>
</ol>
<h3>Errores frecuentes</h3>
<ul>
<li>Pensar que el SCR se apaga al sacar el pulso (como un transistor).</li>
<li>Creer que la potencia es proporcional al ángulo de conducción (que α = 90° da 50 % porque conduce la mitad del tiempo funciona de casualidad, por simetría; con otros α no).</li>
<li>Confundir α (ángulo de disparo) con θ (ángulo de conducción = 180° − α).</li>
<li>Usar grados en vez de radianes en el término α/π de la fórmula.</li>
<li>Calcular “tensión media” con TRIAC (da cero: hay que usar la eficaz).</li>
<li>Creer que el disipador del TRIAC está aislado (en el BT136 está a la tensión de MT2; los BTA sí son aislados).</li>
</ul>
<h3>Preguntas disparadoras</h3>
<ul>
<li>Si el SCR solo se apaga cortando la corriente, ¿cómo lo usarías como alarma que queda sonando aunque cierren la puerta? (¡aplicación clásica!)</li>
<li>¿Por qué el dimmer interfiere la radio AM y no lo hace una llave común?</li>
<li>¿Por qué un TRIAC no sirve para regular un motor de corriente continua? ¿Y un SCR?</li>
<li>¿Qué pasaría con un dimmer y una carga inductiva sin snubber?</li>
</ul>
<h3>Recordatorio rápido para vos</h3>
<ul>
<li>SCR media onda, carga R: $V_{med}=\frac{V_p}{2\pi}(1+\cos\alpha)$; $V_{rms}=V_p\sqrt{\frac{\pi-\alpha+\frac12\text{sen}2\alpha}{4\pi}}$. SCR onda completa (puente controlado): $V_{med}=\frac{V_p}{\pi}(1+\cos\alpha)$.</li>
<li>TRIAC: $V_{rms}=V\sqrt{1-\frac{\alpha}{\pi}+\frac{\text{sen}2\alpha}{2\pi}}$ (V eficaz de la red). Con carga inductiva el TRIAC sigue conduciendo después del cruce de tensión (la corriente atrasa): la conducción se extiende más allá de 180°.</li>
<li>Valores típicos: V<sub>T</sub> ≈ 1–1,5 V; I<sub>GT</sub> de 200 µA (sensitive gate, TIC106, C106) a 50 mA (grandes); I<sub>H</sub> de pocos mA a decenas de mA. DB3: V<sub>BO</sub> 28–36 V, caída ≈ 10 V.</li>
<li>Pinout: BT136/BT137 (TO‑220): <b>MT1 – MT2 – G</b> mirando de frente, aleta = MT2. BT151 / TIC106: <b>K – A – G</b>, aleta = A.</li>
<li>Cuadrantes del TRIAC: I (MT2+, G+), II (MT2+, G−), III (MT2−, G−), IV (MT2−, G+, poco sensible). Con DIAC y con MOC3021 se trabaja en I y III.</li>
<li>Circuito de aplicación del MOC3021: 360 Ω entre MT2 y pin 6, pin 4 a la compuerta; opcionalmente 330 Ω entre G y MT1; snubber 39 Ω + 10 nF para cargas inductivas (según la hoja de datos).</li>
<li>Seguridad: en el aula, trabajá con 12 V (continua para el enclavamiento, transformador de 12 V para control de fase). Nunca osciloscopio con masa directo a la red.</li>
</ul>
<h3>Experiencia práctica</h3>
<p><b>Segura, con 12 V de continua:</b> un SCR sensible (TIC106 o C106), una lámpara de 12 V o un LED con 470 Ω, un pulsador NA entre +12 V y la compuerta a través de 1 kΩ, y un pulsador NC en serie con el ánodo. Se comprueba el enclavamiento exactamente como en la simulación 2: “alarma que queda sonando”.</p>
<p><b>Control de fase en simulador:</b> en <b>Falstad</b> (falstad.com/circuit) armá el dimmer RC + DIAC + TRIAC (hay ejemplos en Circuits → Thyristors/“Light dimmer”) y mirá con su osciloscopio la tensión en la carga moviendo el potenciómetro. En Tinkercad no hay TRIAC, pero se puede simular el dimmer digital con un Arduino y un LED para entender el retardo desde el cruce por cero.</p>
<p><b>Lo que NO hay que hacer en casa:</b> armar un dimmer de 220 V en protoboard. Si quieren verlo funcionar, que sea un módulo dimmer comercial cerrado, con un adulto que sepa y con disyuntor diferencial.</p>
`,
  });
})();
