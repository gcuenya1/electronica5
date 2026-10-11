/* Tema 10 — LEDs
   IMPORTANTE: los textos con LaTeX usan String.raw`...` para que "\frac" no se rompa.
   Todo va dentro de una IIFE para no ensuciar el ámbito global. */
(() => {
  const VT = 0.02585;     // tensión térmica a 300 K
  /** Colores de LED: vf = tensión directa típica a 20 mA; n y rs = parámetros del modelo (Shockley + resistencia serie) */
  const COLORES = {
    ir: { nombre: 'Infrarrojo (940 nm)', corto: 'IR', vf: 1.3, lam: 940, hex: '#b04aff', n: 1.8, rs: 3 },
    rojo: { nombre: 'Rojo (625 nm)', corto: 'rojo', vf: 1.9, lam: 625, hex: '#ff3b30', n: 2, rs: 5 },
    amarillo: { nombre: 'Amarillo (590 nm)', corto: 'amarillo', vf: 2.05, lam: 590, hex: '#ffc400', n: 2, rs: 5 },
    verde: { nombre: 'Verde clásico GaP (570 nm)', corto: 'verde', vf: 2.2, lam: 570, hex: '#7ed321', n: 2, rs: 6 },
    verdeb: { nombre: 'Verde brillante InGaN (525 nm)', corto: 'verde InGaN', vf: 3.1, lam: 525, hex: '#00d26a', n: 3, rs: 10 },
    azul: { nombre: 'Azul (465 nm)', corto: 'azul', vf: 3.2, lam: 465, hex: '#2f6bff', n: 3, rs: 10 },
    blanco: { nombre: 'Blanco (azul + fósforo)', corto: 'blanco', vf: 3.2, lam: 0, hex: '#cfe0ff', n: 3, rs: 10 },
  };
  /** Parámetros de un LED concreto (color + corrimiento de Vf, para simular dispersión entre unidades) */
  function led(c, off = 0) {
    const vf = c.vf + off;
    return { vf, n: c.n, rs: c.rs, is: 0.02 / (Math.exp((vf - 0.02 * c.rs) / (c.n * VT)) - 1) };
  }
  /** Tensión del LED para una corriente I (Shockley + Rs) */
  const Vled = (I, p) => I <= 0 ? 0 : p.n * VT * Math.log(I / p.is + 1) + I * p.rs;
  /** Corriente del LED para una tensión V (inversa numérica) */
  function Iled(V, p) {
    if (V <= 0) return 0;
    return H.biseccion(I => Vled(I, p) - V, 0, V / p.rs, 70);
  }
  /** Fuente Vcc + R + LEDs en serie → corriente */
  function serie(Vcc, R, ps) {
    if (Vcc <= 0) return 0;
    return H.biseccion(I => Vcc - I * R - ps.reduce((s, p) => s + Vled(I, p), 0), 0, Vcc / R, 80);
  }
  /** E12 inmediato superior */
  const E12 = [1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2];
  function e12Sup(R) {
    if (!(R > 0)) return NaN;
    const dec = Math.pow(10, Math.floor(Math.log10(R)));
    for (const m of E12) if (m * dec >= R * (1 - 1e-9)) return Math.round(m * dec * 100) / 100;
    return 10 * dec;
  }
  /** Potencia comercial recomendada (regla: al menos el doble de la calculada) */
  function potCom(P) {
    for (const [p, t] of [[0.25, '1/4 W'], [0.5, '1/2 W'], [1, '1 W'], [2, '2 W'], [5, '5 W']]) if (2 * P <= p) return t;
    return 'más de 5 W: replanteá el circuito';
  }
  const mA = (I) => H.num(I * 1000, I < 0.01 ? 2 : 1) + ' mA';

  /* ---------- helpers de dibujo en canvas ---------- */
  function linea(ctx, pts, color) {
    ctx.save(); ctx.strokeStyle = color || H.col('ink'); ctx.lineWidth = 2; ctx.lineJoin = 'round';
    ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); ctx.restore();
  }
  /** Resistencia en zigzag entre dos puntos (horizontal o vertical) con cuerpo de largo L */
  function resCv(ctx, x1, y1, x2, y2, L = 30, etiqueta = '') {
    const dx = x2 - x1, dy = y2 - y1, D = Math.hypot(dx, dy), ux = dx / D, uy = dy / D, nx = -uy, ny = ux;
    const a = (D - L) / 2;
    const pts = [[x1, y1], [x1 + ux * a, y1 + uy * a]];
    for (let k = 1; k <= 6; k++) {
      const t = a + L * (k - 0.5) / 6, s = (k % 2 ? 1 : -1) * 6;
      pts.push([x1 + ux * t + nx * s, y1 + uy * t + ny * s]);
    }
    pts.push([x1 + ux * (a + L), y1 + uy * (a + L)], [x2, y2]);
    linea(ctx, pts);
    if (etiqueta) {
      ctx.save(); ctx.fillStyle = H.col('ink'); ctx.font = '600 11px sans-serif';
      if (Math.abs(dx) >= Math.abs(dy)) { ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText(etiqueta, (x1 + x2) / 2, Math.min(y1, y2) - 9); }
      else { ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(etiqueta, x1 + 9, (y1 + y2) / 2); }
      ctx.restore();
    }
  }
  /** Batería vertical: + arriba */
  function batCv(ctx, x, yT, yB, txt) {
    const ym = (yT + yB) / 2;
    linea(ctx, [[x, yT], [x, ym - 5]]); linea(ctx, [[x, ym + 5], [x, yB]]);
    ctx.save(); ctx.strokeStyle = H.col('ink');
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 13, ym - 5); ctx.lineTo(x + 13, ym - 5); ctx.stroke();
    ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 7, ym + 5); ctx.lineTo(x + 7, ym + 5); ctx.stroke();
    ctx.fillStyle = H.col('ink'); ctx.font = '700 12px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('+', x + 9, ym - 15);
    ctx.font = '600 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(txt, x, yB + 6);
    ctx.restore();
  }
  /** LED con brillo según corriente; devuelve el nivel usado */
  function ledCv(ctx, x, y, r, I, hex) {
    const quemado = I > 0.06;
    let nivel = I / 0.02;
    if (I > 2e-4) nivel = Math.max(0.07, nivel);
    if (quemado) {
      H.brillo(ctx, x, y, r, 0, '#555');
      ctx.save(); ctx.strokeStyle = H.col('red'); ctx.lineWidth = 2.5; ctx.beginPath();
      ctx.moveTo(x - r * .6, y - r * .6); ctx.lineTo(x + r * .6, y + r * .6); ctx.moveTo(x + r * .6, y - r * .6); ctx.lineTo(x - r * .6, y + r * .6); ctx.stroke(); ctx.restore();
    } else H.brillo(ctx, x, y, r, Math.min(1, nivel), hex);
    return quemado;
  }

  /** Ejes con las etiquetas FUERA del área */
  function ejesF(ctx, W, Hh, op) {
    const o = Object.assign({}, op, { xlabel: '', ylabel: '' });
    const P = H.ejes(ctx, W, Hh, o);
    ctx.save(); ctx.fillStyle = H.col('muted'); ctx.font = '600 11px sans-serif';
    if (op.ylabel) { ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText(op.ylabel, P.x0, P.y0 - 4); }
    if (op.xlabel) { ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(op.xlabel, P.x0 + P.w / 2, P.y0 + P.h + 19); }
    ctx.restore();
    return P;
  }

  /* ---------- dibujos SVG propios para la teoría ---------- */
  const SV = 'stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"';
  /** Curvas I‑V de varios colores (calculadas con el mismo modelo que la simulación) */
  function curvasSVG() {
    const X = v => 50 + v / 3.6 * 330, Y = i => 190 - i / 0.03 * 170;
    let s = `<svg class="esq" viewBox="0 0 420 240" width="420" height="240" xmlns="http://www.w3.org/2000/svg" style="max-width:100%">`;
    for (let i = 0; i <= 30; i += 10) s += `<path d="M50 ${Y(i / 1000)}H380" stroke="var(--grid)" stroke-width="1"/><text x="44" y="${Y(i / 1000) + 4}" font-size="10.5" text-anchor="end" class="val">${i}</text>`;
    for (let v = 0; v <= 3.5; v += 0.5) s += `<path d="M${X(v)} 20V190" stroke="var(--grid)" stroke-width="1"/><text x="${X(v)}" y="204" font-size="10.5" text-anchor="middle" class="val">${String(v).replace('.', ',')}</text>`;
    s += `<rect x="50" y="20" width="330" height="170" fill="none" stroke="var(--axis)" stroke-width="1.2"/>`;
    s += `<text x="52" y="14" font-size="11" font-weight="600">I (mA)</text><text x="215" y="226" font-size="11" font-weight="600" text-anchor="middle">V (tensión directa del LED)</text>`;
    const IL = { ir: 0.026, rojo: 0.012, verde: 0.026, azul: 0.026 };
    ['ir', 'rojo', 'verde', 'azul'].forEach((k) => {
      const c = COLORES[k], p = led(c);
      const pts = [];
      for (let j = 0; j <= 80; j++) { const I = 0.031 * Math.pow(j / 80, 2); pts.push(X(Vled(I, p)).toFixed(1) + ',' + Y(Math.min(I, 0.0305)).toFixed(1)); }
      const col = k === 'ir' ? '#9b3fe0' : k === 'verde' ? '#3fa320' : c.hex;
      s += `<polyline points="${pts.join(' ')}" stroke="${col}" stroke-width="2.6" fill="none"/>`;
      s += `<text x="${X(Vled(IL[k], p)) - 6}" y="${Y(IL[k])}" font-size="11.5" font-weight="700" text-anchor="end" style="fill:${col}">${c.corto}</text>`;
    });
    s += `<path d="M50 ${Y(0.02)}H380" stroke="var(--muted)" stroke-width="1.2" stroke-dasharray="5 4"/><text x="378" y="${Y(0.02) - 4}" font-size="10.5" text-anchor="end" class="val">20 mA</text>`;
    s += `</svg>`;
    return `<figure class="figura">${s}<figcaption>Curvas I‑V típicas de LEDs de 5 mm. Todas tienen la misma forma (exponencial), pero “arrancan” a distinta tensión según el color.</figcaption></figure>`;
  }
  /** LED de 5 mm físico con sus patas y el símbolo */
  function ledFisico() {
    return `<figure class="figura"><svg class="esq" viewBox="0 0 400 220" width="400" height="220" xmlns="http://www.w3.org/2000/svg" style="max-width:100%">
      <path d="M60 110V60a30 30 0 0 1 60 0V110Z" fill="#ff3b30" opacity=".35" stroke="currentColor" stroke-width="2"/>
      <path d="M52 110H128V118H52Z" fill="#ff3b30" opacity=".45" stroke="currentColor" stroke-width="2"/>
      <path d="M128 106V122" stroke="var(--accent)" stroke-width="3"/>
      <path d="M72 70V118M100 62V118" stroke="#888" stroke-width="2"/>
      <path d="M100 62h12v20h-12z" fill="#888"/>
      <path d="M78 118V200" stroke="#9a9a9a" stroke-width="4"/>
      <path d="M104 118V176" stroke="#9a9a9a" stroke-width="4"/>
      <text x="78" y="214" font-size="12" font-weight="700" text-anchor="middle">larga</text>
      <text x="112" y="190" font-size="12" font-weight="700" text-anchor="start">corta</text>
      <text x="140" y="112" font-size="11.5" style="fill:var(--accent)" font-weight="700">lado plano</text>
      <text x="140" y="74" font-size="11" class="val">placa grande</text><text x="140" y="87" font-size="11" class="val">(suele ser el cátodo)</text>
      <path d="M230 120H290M330 120H380" ${SV}/>
      <path d="M290 106L318 120L290 134Z" fill="currentColor" stroke="currentColor" stroke-width="1.5"/>
      <path d="M320 104V136" ${SV}/>
      <g style="color:var(--red)"><path ${SV} d="M300 100l9 -12M312 103l9 -12"/><path d="M309 88l-5 1.5l3.5 2.6zM321 91l-5 1.5l3.5 2.6z" fill="currentColor" stroke="currentColor" stroke-width="1.5"/></g>
      <text x="250" y="150" font-size="13" font-weight="700" text-anchor="middle">Ánodo (+)</text>
      <text x="250" y="166" font-size="11" text-anchor="middle" class="val">pata larga</text>
      <text x="360" y="150" font-size="13" font-weight="700" text-anchor="middle">Cátodo (−)</text>
      <text x="360" y="166" font-size="11" text-anchor="middle" class="val">pata corta, lado plano</text>
    </svg><figcaption>LED de 5 mm: la pata larga es el ánodo; el lado plano de la cápsula y la pata corta marcan el cátodo.</figcaption></figure>`;
  }
  /** Display de 7 segmentos mostrando el "2" */
  function sieteSeg() {
    const on = 'var(--red)', off = 'var(--line)';
    const seg = { a: [52, 20, 56, 11], b: [110, 32, 11, 56], c: [110, 102, 11, 56], d: [52, 160, 56, 11], e: [39, 102, 11, 56], f: [39, 32, 11, 56], g: [52, 90, 56, 11] };
    const lit = new Set(['a', 'b', 'g', 'e', 'd']);
    let s = `<svg class="esq" viewBox="0 0 330 190" width="330" height="190" xmlns="http://www.w3.org/2000/svg" style="max-width:100%"><rect x="22" y="8" width="125" height="176" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>`;
    for (const [k, [x, y, w, h]] of Object.entries(seg)) {
      s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${lit.has(k) ? on : off}"/>`;
      const tx = w > h ? x + w / 2 : (x < 80 ? x - 9 : x + w + 9), ty = w > h ? (k === 'd' ? y - 4 : y + h + 12) : y + h / 2 + 4;
      s += `<text x="${tx}" y="${ty}" font-size="11.5" font-weight="700" text-anchor="middle">${k}</text>`;
    }
    s += `<circle cx="133" cy="166" r="5" fill="${off}"/><text x="133" y="182" font-size="10" text-anchor="middle">dp</text>`;
    s += `<text x="170" y="40" font-size="12.5" font-weight="700">Para mostrar “2”:</text><text x="170" y="58" font-size="12">a, b, g, e, d prendidos</text>`;
    s += `<text x="170" y="92" font-size="12.5" font-weight="700">Cátodo común:</text><text x="170" y="108" font-size="12">común a GND,</text><text x="170" y="122" font-size="12">segmento = 1 → prende</text>`;
    s += `<text x="170" y="150" font-size="12.5" font-weight="700">Ánodo común:</text><text x="170" y="166" font-size="12">común a +5 V,</text><text x="170" y="180" font-size="12">segmento = 0 → prende</text></svg>`;
    return `<figure class="figura">${s}<figcaption>Display de 7 segmentos: siete LEDs (a–g) más el punto decimal (dp), con un terminal común.</figcaption></figure>`;
  }

  registrarTema({
    id: 'leds',
    orden: 10,
    titulo: 'LEDs',
    resumen: 'Diodo emisor de luz, resistencia limitadora, serie/paralelo, RGB y PWM',
    confirmar: false,

    teoria: String.raw`
<p>El <b>LED</b> (<i>Light Emitting Diode</i>, diodo emisor de luz) es un diodo que, cuando conduce, <b>emite luz</b>. Está en todos lados: el indicador de “encendido” de cualquier aparato, las pantallas, los semáforos, las lámparas de casa, el control remoto de la tele (ese emite infrarrojo, que no vemos). Eléctricamente se comporta como un diodo común: conduce de ánodo a cátodo, con una curva exponencial. La diferencia es que su tensión directa es <b>mayor</b> (de 1,2 a 3,3 V según el color) y que <b>siempre</b> hay que limitarle la corriente.</p>
<p>Si hay una sola cosa para llevarse de este tema es esta: <b>un LED se controla por corriente, no por tensión</b>. La resistencia en serie no es un accesorio: es la que decide cuánta corriente pasa.</p>

<h2>1. ¿Cómo emite luz un LED?</h2>
<p>Acordate de la unión PN del tema 9: en directa, los electrones de la zona N cruzan hacia la zona P y se <b>recombinan</b> con los huecos. Al recombinarse, el electrón “cae” desde la <b>banda de conducción</b> (donde estaba libre) a la <b>banda de valencia</b> (donde queda atado) y pierde una energía igual al <b>ancho de la banda prohibida</b> $E_g$.</p>
<ul>
<li>En el <b>silicio</b>, esa energía se va casi toda en <b>calor</b> (vibraciones del cristal). Por eso un 1N4148 no ilumina.</li>
<li>En materiales como el <b>arseniuro de galio (GaAs)</b>, el <b>fosfuro de galio (GaP)</b> o el <b>nitruro de galio e indio (InGaN)</b>, la energía sale como un <b>fotón</b>: un “paquetito” de luz.</li>
</ul>
<div class="caja idea"><span class="caja-titulo">Analogía: la escalera</span>
Pensá en una pelota que cae de un escalón. Cuanto más alto el escalón ($E_g$), más energía tiene el golpe. En el LED, esa energía es la del fotón, y <b>la energía del fotón decide el color</b>: escalón bajo → luz roja o infrarroja; escalón alto → luz azul o violeta.
</div>
<div class="caja formula"><span class="caja-titulo">Energía del fotón y color</span>
$$E = h\,f = \frac{h\,c}{\lambda}\qquad\Longrightarrow\qquad \lambda\,[\text{nm}] \approx \frac{1240}{E_g\,[\text{eV}]}$$
$h$: constante de Planck; $c$: velocidad de la luz; $\lambda$: longitud de onda. Un electronvolt (eV) es la energía que gana un electrón al atravesar 1 V. Por eso, <b>la tensión directa de un LED es aproximadamente $E_g/q$</b>: para “subir” al electrón al escalón hay que darle, como mínimo, esos volts.
</div>
<div class="tabla-wrap"><table class="tabla">
<tr><th>Color</th><th>Material típico</th><th>$\lambda$</th><th>$E_g$ aprox.</th><th>$V_F$ típica (a 20 mA)</th></tr>
<tr><td>Infrarrojo</td><td>GaAs</td><td>850 – 940 nm</td><td>1,3 – 1,45 eV</td><td>1,2 – 1,5 V</td></tr>
<tr><td>Rojo</td><td>AlGaInP / GaAsP</td><td>620 – 660 nm</td><td>≈ 1,9 – 2,0 eV</td><td>1,8 – 2,0 V</td></tr>
<tr><td>Amarillo / naranja</td><td>AlGaInP / GaAsP</td><td>585 – 610 nm</td><td>≈ 2,1 eV</td><td>2,0 – 2,1 V</td></tr>
<tr><td>Verde “clásico” (amarillento)</td><td>GaP</td><td>565 – 570 nm</td><td>≈ 2,2 eV</td><td>2,1 – 2,4 V</td></tr>
<tr><td>Verde brillante (“verde puro”)</td><td>InGaN</td><td>520 – 530 nm</td><td>≈ 2,4 eV</td><td>2,9 – 3,2 V</td></tr>
<tr><td>Azul</td><td>InGaN</td><td>460 – 470 nm</td><td>≈ 2,7 eV</td><td>3,0 – 3,3 V</td></tr>
<tr><td>Blanco</td><td>InGaN azul + fósforo amarillo</td><td>(espectro amplio)</td><td>—</td><td>3,0 – 3,3 V</td></tr>
</table></div>
<div class="caja ojo"><span class="caja-titulo">Ojo con el verde y el blanco</span>
“Verde” puede ser un LED de 2,2 V (el verde amarillento de los equipos viejos) o uno de 3,1 V (el verde intenso moderno). Fijate en la hoja de datos o medilo. Y el LED <b>blanco no existe como tal</b>: es un LED azul con una capa de fósforo que absorbe parte del azul y reemite amarillo; azul + amarillo se ve blanco. Por eso tiene la misma $V_F$ que el azul.
</div>
<p>En los LEDs azules y blancos la $V_F$ es algo mayor que $E_g/q$ porque el material tiene más resistencia interna y la estructura es más compleja; la regla “$V_F\approx E_g/q$” es una aproximación, no una ley exacta.</p>

<h2>2. Curva I‑V: por qué un LED NUNCA va sin resistencia</h2>
${curvasSVG()}
<p>La curva es <b>exponencial</b>, como la de cualquier diodo (Shockley). En un LED típico, el factor de idealidad es $n\approx 2$ o más, así que la corriente se multiplica por 10 cada ≈ 120 mV (en vez de 60 mV). Igual es una pendiente brutal: entre “apenas brilla” (1 mA) y “se quema” (50 mA o más) hay solamente unas décimas de volt.</p>
<div class="caja ojo"><span class="caja-titulo">¿Qué pasa si conecto un LED rojo directo a 5 V?</span>
El LED “quiere” ≈ 2 V. Si le imponés 5 V, la exponencial pide una corriente enorme; lo único que la limita son la resistencia interna del LED (unos pocos ohms) y la de la fuente. Con $r\approx5\,\Omega$, la corriente sería del orden de $\frac{5-1{,}8}{5}\approx 0{,}6\,\text{A}$: el LED se quema en un instante (a veces con un “pop” y olor a plástico). Con una pila chiquita de 3 V tipo botón “funciona” porque la propia pila tiene mucha resistencia interna: no es una buena práctica.
</div>
<div class="caja idea"><span class="caja-titulo">Analogía: la canilla y el balde agujereado</span>
Un LED es como una compuerta que, a partir de cierto nivel de agua, se abre completamente. Si no ponés una “canilla” antes (la resistencia), entra toda el agua de golpe. La resistencia es la canilla: fija el caudal (la corriente) y el LED solo “se queda” con su tensión casi fija.
</div>
<p>Además, $V_F$ <b>baja con la temperatura</b> (≈ −2 mV/°C, como en cualquier diodo). Si alimentás el LED con una tensión fija sin resistencia, al calentarse conduce más, se calienta más… y se embala. La resistencia en serie corta ese círculo vicioso.</p>

<h2>3. Polaridad: cuál es cada pata</h2>
${ledFisico()}
<ul>
<li><b>Ánodo (+): pata larga.</b> Va hacia el positivo (a través de la resistencia o no, da igual de qué lado esté la R).</li>
<li><b>Cátodo (−): pata corta y lado plano</b> del borde de la cápsula. Adentro, la placa más grande (el “yunque”) suele ser el cátodo, pero hay fabricantes que lo hacen al revés: confiá en el lado plano y la pata corta.</li>
<li>Si las patas ya están cortadas: probalo con el multímetro en modo diodo (punta roja en el ánodo → muchos LEDs prenden tenuemente y el instrumento marca ≈ 1,6 – 2,6 V).</li>
<li>Un LED conectado al revés <b>no prende</b> y, mientras la tensión inversa sea menor que ≈ 5 V (el máximo típico de la hoja de datos), no se rompe. Con más tensión inversa sí puede dañarse.</li>
</ul>

<h2>4. Cálculo de la resistencia limitadora</h2>
${Esq.svg(320, 190, [
  Esq.bat(40, 65, 40, 135, 'Vcc', '5 V', -1), Esq.cable([[40, 65], [40, 30], [80, 30]]),
  Esq.R(80, 30, 170, 30, 'R', '220 Ω', 1), Esq.cable([[170, 30], [240, 30], [240, 65]]),
  Esq.LED(240, 65, 240, 135, 'LED rojo', 'VF ≈ 2 V', -1, 'var(--red)'),
  Esq.cable([[240, 135], [240, 165], [40, 165], [40, 135]]), Esq.flecha(105, 58, 145, 58, 'I'),
  Esq.pm(268, 75, 268, 125),
], 'El circuito más básico: fuente, resistencia limitadora y LED.')}
<p>Usamos el modelo de “caída constante” del tema 9: el LED es una pila de $V_F$ volts. Por LKT en la malla: $V_{CC} = I\,R + V_F$. Despejando:</p>
<div class="caja formula"><span class="caja-titulo">Resistencia limitadora</span>
$$R = \frac{V_{CC}-V_F}{I_F}\qquad P_R = I_F^{\,2}\,R = (V_{CC}-V_F)\,I_F\qquad P_{LED}=V_F\,I_F$$
</div>
<p><b>Receta en 5 pasos:</b></p>
<ol>
<li><b>Elegí la corriente.</b> Un LED de 5 mm común admite 20 mA continuos (máximo absoluto ≈ 25 – 30 mA). Para indicadores alcanza con <b>5 – 10 mA</b> (los LEDs modernos brillan muchísimo con 2 mA). Trabajar por debajo del máximo alarga su vida.</li>
<li><b>Buscá $V_F$</b> en la tabla o en la hoja de datos (para la cuenta, usá el valor típico).</li>
<li><b>Calculá $R$</b> con la fórmula.</li>
<li><b>Elegí el valor comercial</b> de la serie E12 (1,0 – 1,2 – 1,5 – 1,8 – 2,2 – 2,7 – 3,3 – 3,9 – 4,7 – 5,6 – 6,8 – 8,2 × potencia de 10). Si no coincide, tomá el <b>inmediato superior</b>: da un poco menos de corriente, que es lo seguro. Recalculá la corriente real.</li>
<li><b>Verificá la potencia</b> de la resistencia y elegí una que aguante al menos el <b>doble</b> (1/4 W es lo más común).</li>
</ol>
<div class="caja ejemplo"><span class="caja-titulo">Ejemplo 1: LED rojo con 5 V (USB o Arduino), 15 mA</span>
$R=\frac{5-2}{0{,}015}=200\,\Omega$ → valor E12 superior: <b>220 Ω</b>.<br>
Corriente real: $I=\frac{5-2}{220}=13{,}6\,\text{mA}$ (prácticamente el mismo brillo).<br>
$P_R=3\cdot0{,}0136=40{,}9\,\text{mW}$ → una de 1/4 W sobra. $P_{LED}=2\cdot0{,}0136=27{,}3\,\text{mW}$.
</div>
<div class="caja ejemplo"><span class="caja-titulo">Ejemplo 2: LED azul con 12 V, 20 mA</span>
$R=\frac{12-3{,}2}{0{,}02}=440\,\Omega$ → E12 superior: <b>470 Ω</b>. $I=\frac{8{,}8}{470}=18{,}7\,\text{mA}$.<br>
$P_R=8{,}8\cdot0{,}0187=0{,}165\,\text{W}$. ¡Ojo! Una de 1/4 W trabaja al 66 % y calienta: conviene <b>1/2 W</b>. Fijate que la resistencia disipa <b>casi 3 veces más</b> que el LED ($3{,}2\cdot0{,}0187=60\,\text{mW}$): con fuentes altas, la mayor parte de la energía se pierde en la R.
</div>
<div class="caja tip"><span class="caja-titulo">Valores de memoria (LED de 5 mm, ≈ 10 – 15 mA)</span>
Con 5 V: <b>220 – 330 Ω</b> para rojo/amarillo/verde clásico, <b>100 – 150 Ω</b> para azul/blanco. Con 3,3 V (ESP32): ≈ 100 Ω para rojo, y un azul/blanco apenas prende (3,3 − 3,2 = 0,1 V para la R: la corriente queda muy incierta). Con 12 V: ≈ 680 Ω – 1 kΩ.
</div>
<div class="caja ojo"><span class="caja-titulo">Error típico</span>
Calcular $R = V_{CC}/I$ olvidándose de restar $V_F$. Con el ejemplo 1 darías 333 Ω → 330 Ω y la corriente real sería 9 mA: no se quema, pero el error crece mucho cuando $V_{CC}$ se parece a $V_F$.
</div>

<h2>5. LEDs en serie y en paralelo</h2>
<div class="dos-col">
<div>
<h3>En serie: una sola R</h3>
${Esq.svg(390, 200, [
  Esq.bat(30, 70, 30, 130, 'Vcc', '12 V', -1), Esq.cable([[30, 70], [30, 30], [60, 30]]),
  Esq.R(60, 30, 130, 30, 'R', '120 Ω', 1), Esq.cable([[130, 30], [150, 30]]),
  Esq.LED(150, 30, 210, 30, '', '', 1, 'var(--amber)'), Esq.cable([[210, 30], [220, 30]]),
  Esq.LED(220, 30, 280, 30, '', '', 1, 'var(--amber)'), Esq.cable([[280, 30], [290, 30]]),
  Esq.LED(290, 30, 350, 30, '', '', 1, 'var(--amber)'), Esq.cable([[350, 30], [370, 30], [370, 170], [30, 170], [30, 130]]),
  Esq.texto(250, 70, '3 LEDs blancos de 3,2 V', { size: 12 }), Esq.flecha(230, 145, 170, 145, 'I (la misma en todos)'),
])}
<p>Por todos pasa <b>la misma corriente</b>. Las $V_F$ se suman:</p>
$$R=\frac{V_{CC}-N\,V_F}{I}$$
<p>Ejemplo: 3 blancos con 12 V y 20 mA: $R=\frac{12-9{,}6}{0{,}02}=120\,\Omega$. Es la forma <b>más eficiente</b> (menos energía perdida en R). Condición: $N\,V_F$ tiene que ser bastante menor que $V_{CC}$ (dejá al menos 1,5 – 2 V para la R, si no la corriente queda muy sensible a cualquier variación de la fuente). Si uno se abre, se apagan todos (como las guirnaldas de navidad viejas).</p>
</div>
<div>
<h3>En paralelo: una R por LED</h3>
${Esq.svg(360, 230, [
  Esq.bat(30, 80, 30, 140, 'Vcc', '5 V', -1), Esq.cable([[30, 80], [30, 30], [290, 30]]),
  Esq.nodo(110, 30), Esq.nodo(200, 30),
  Esq.R(110, 30, 110, 95, 'R1', '150 Ω', 1), Esq.cable([[110, 95], [110, 110]]), Esq.LED(110, 110, 110, 170, '', '', 1, 'var(--red)'),
  Esq.R(200, 30, 200, 95, 'R2', '150 Ω', 1), Esq.cable([[200, 95], [200, 110]]), Esq.LED(200, 110, 200, 170, '', '', 1, 'var(--red)'),
  Esq.R(290, 30, 290, 95, 'R3', '150 Ω', 1), Esq.cable([[290, 95], [290, 110]]), Esq.LED(290, 110, 290, 170, '', '', 1, 'var(--red)'),
  Esq.cable([[110, 170], [110, 200]]), Esq.cable([[200, 170], [200, 200]]), Esq.cable([[290, 170], [290, 200], [30, 200], [30, 140]]),
  Esq.nodo(110, 200), Esq.nodo(200, 200),
])}
<p>Cada rama es un circuito independiente: $R_k=\frac{V_{CC}-V_F}{I}$. La corriente total es la suma. Si uno se quema, los demás siguen.</p>
</div>
</div>
<div class="caja ojo"><span class="caja-titulo">¿Por qué no una sola resistencia para varios LEDs en paralelo?</span>
<p>Parece lógico: “si cada LED quiere 20 mA, pongo una R para 60 mA y listo”. <b>No funciona bien</b>, por dos razones:</p>
<ol>
<li><b>Dispersión de fabricación:</b> dos LEDs “iguales” pueden tener $V_F$ que difieren 0,1 V o más. Como la curva es exponencial y los LEDs en paralelo tienen <b>la misma tensión</b>, el de menor $V_F$ se lleva mucha más corriente. Ejemplo (ejercicio 7): con 0,1 V de diferencia, uno puede llevar 30 mA y el otro 10 mA.</li>
<li><b>Embalamiento térmico:</b> el que lleva más corriente se calienta, su $V_F$ baja, se lleva todavía más corriente… hasta que se quema. Y cuando se quema (abierto), toda la corriente se reparte entre los que quedan, que ahora reciben de más: efecto dominó.</li>
</ol>
<p>Con una R por LED, cada resistencia “absorbe” la diferencia de $V_F$ y las corrientes quedan casi iguales. Lo vas a ver en la simulación 2.</p>
</div>

<h2>6. LED RGB</h2>
<p>Un LED RGB tiene <b>tres LEDs en la misma cápsula</b>: rojo (R), verde (G) y azul (B), y 4 patas. Una pata es <b>común</b> (la más larga) y las otras tres son una por color. Mezclando intensidades sale cualquier color (rojo + verde = amarillo; los tres = blanco “más o menos”).</p>
<div class="dos-col">
<div>
${Esq.svg(300, 215, [
  Esq.borne(60, 20, 'pin R', 0, -8), Esq.borne(150, 20, 'pin G', 0, -8), Esq.borne(240, 20, 'pin B', 0, -8),
  Esq.R(60, 24, 60, 90, '330 Ω', '', 1), Esq.R(150, 24, 150, 90, '220 Ω', '', 1), Esq.R(240, 24, 240, 90, '180 Ω', '', 1),
  Esq.LED(60, 100, 60, 160, '', '', 1, 'var(--red)'), Esq.LED(150, 100, 150, 160, '', '', 1, 'var(--green)'), Esq.LED(240, 100, 240, 160, '', '', 1, 'var(--c1)'),
  Esq.cable([[60, 90], [60, 100]]), Esq.cable([[150, 90], [150, 100]]), Esq.cable([[240, 90], [240, 100]]),
  Esq.cable([[60, 160], [60, 180], [240, 180], [240, 160]]), Esq.cable([[150, 160], [150, 180]]), Esq.nodo(150, 180), Esq.masa(150, 180),
], 'Cátodo común: el común a GND; cada color prende con un 1 (HIGH).')}
</div>
<div>
${Esq.svg(300, 215, [
  Esq.borne(150, 14, '+5 V', 30, 5), Esq.cable([[150, 18], [150, 30]]), Esq.cable([[60, 50], [60, 30], [240, 30], [240, 50]]), Esq.nodo(150, 30),
  Esq.cable([[150, 30], [150, 50]]),
  Esq.LED(60, 50, 60, 110, '', '', 1, 'var(--red)'), Esq.LED(150, 50, 150, 110, '', '', 1, 'var(--green)'), Esq.LED(240, 50, 240, 110, '', '', 1, 'var(--c1)'),
  Esq.cable([[60, 110], [60, 120]]), Esq.cable([[150, 110], [150, 120]]), Esq.cable([[240, 110], [240, 120]]),
  Esq.R(60, 120, 60, 185, '330 Ω', '', 1), Esq.R(150, 120, 150, 185, '220 Ω', '', 1), Esq.R(240, 120, 240, 185, '180 Ω', '', 1),
  Esq.borne(60, 189, '', 0, 0), Esq.borne(150, 189, '', 0, 0), Esq.borne(240, 189, '', 0, 0),
  Esq.texto(60, 210, 'pin R', { size: 12 }), Esq.texto(150, 210, 'pin G', { size: 12 }), Esq.texto(240, 210, 'pin B', { size: 12 }),
], 'Ánodo común: el común a +5 V; cada color prende con un 0 (LOW).')}
</div>
</div>
<ul>
<li><b>Cátodo común:</b> común a GND. El pin en HIGH prende el color (lógica directa).</li>
<li><b>Ánodo común:</b> común a +V. El pin en <b>LOW</b> prende (lógica invertida: con PWM, <code>analogWrite(pin, 255 - brillo)</code>).</li>
<li><b>Una resistencia por color</b>, y de distinto valor: el rojo tiene $V_F\approx2\,\text{V}$ y el verde y azul ≈ 3,1 – 3,2 V. Nunca una sola R en la pata común (sería el problema del paralelo con R común, ¡con LEDs distintos!).</li>
<li>Para identificar qué tipo es: con el multímetro en modo diodo, punta roja en la pata larga → si prenden los colores tocando las otras con la negra, es <b>ánodo común</b>.</li>
</ul>

<h2>7. Manejar LEDs desde un Arduino</h2>
<p>Un pin digital de Arduino UNO en HIGH da ≈ 5 V y puede entregar (o absorber en LOW) corriente. Límites del ATmega328P:</p>
<div class="tabla-wrap"><table class="tabla">
<tr><th>Parámetro</th><th>Valor</th></tr>
<tr><td>Corriente recomendada por pin</td><td><b>≤ 20 mA</b></td></tr>
<tr><td>Máximo absoluto por pin</td><td>40 mA (no trabajes ahí: la tensión del pin cae y se degrada)</td></tr>
<tr><td>Total del chip (VCC/GND)</td><td>≈ 200 mA</td></tr>
<tr><td>ESP32 (3,3 V)</td><td>≈ 20 – 40 mA por pin según configuración; ojo con LEDs azules/blancos</td></tr>
</table></div>
<p>Un LED de indicación a 10 – 15 mA se conecta directo al pin con su resistencia (220 – 330 Ω). Puede ir <b>pin → R → LED → GND</b> (prende con HIGH, el pin “entrega” corriente) o <b>+5 V → R → LED → pin</b> (prende con LOW, el pin “absorbe”).</p>
<h3>Más corriente: un transistor como llave</h3>
<p>Si necesitás más de 20 mA (varios LEDs, una tira, un LED de potencia) el pin solo da la orden y la corriente la maneja un <b>transistor</b> (tema 14) o un <b>MOSFET</b> (tema 15). Además así podés alimentar los LEDs con 12 V aunque el Arduino trabaje con 5 V.</p>
${Esq.svg(400, 430, [
  Esq.borne(240, 14, '+12 V', -34, 5), Esq.cable([[240, 18], [240, 30]]), Esq.cable([[240, 30], [320, 30], [320, 40]]), Esq.nodo(240, 30),
  Esq.cable([[240, 30], [240, 40]]),
  Esq.R(240, 40, 240, 100, 'R', '330 Ω', -1), Esq.R(320, 40, 320, 100, 'R', '330 Ω', 1),
  Esq.LED(240, 110, 240, 160, '', '', -1, 'var(--red)'), Esq.LED(240, 170, 240, 220, '', '', -1, 'var(--red)'), Esq.LED(240, 230, 240, 280, '', '', -1, 'var(--red)'),
  Esq.LED(320, 110, 320, 160, '', '', 1, 'var(--red)'), Esq.LED(320, 170, 320, 220, '', '', 1, 'var(--red)'), Esq.LED(320, 230, 320, 280, '', '', 1, 'var(--red)'),
  Esq.cable([[240, 100], [240, 110]]), Esq.cable([[240, 160], [240, 170]]), Esq.cable([[240, 220], [240, 230]]),
  Esq.cable([[320, 100], [320, 110]]), Esq.cable([[320, 160], [320, 170]]), Esq.cable([[320, 220], [320, 230]]),
  Esq.cable([[240, 280], [240, 330]]), Esq.cable([[320, 280], [320, 310], [240, 310]]), Esq.nodo(240, 310),
  Esq.bjt(228, 360, 'NPN', ''), Esq.texto(275, 365, 'BC337', { anchor: 'start', size: 12 }),
  Esq.borne(60, 360, 'pin 9', 0, -10), Esq.cable([[64, 360], [90, 360]]), Esq.R(90, 360, 170, 360, 'RB', '1 kΩ', 1), Esq.cable([[170, 360], [198, 360]]),
  Esq.cable([[240, 390], [240, 400]]), Esq.masa(240, 400),
  Esq.texto(120, 200, '3 LEDs rojos', { size: 12 }), Esq.texto(120, 216, 'por rama', { size: 12 }),
  Esq.flecha(262, 318, 262, 340, 'IC'),
], 'Arduino manejando 6 LEDs rojos (2 ramas de 3 en serie) a 12 V con un transistor NPN.')}
<div class="caja ejemplo"><span class="caja-titulo">Ejemplo 3: diseño del circuito de la figura</span>
<ul>
<li><b>Cada rama:</b> 3 rojos de 1,9 V y el transistor saturado ($V_{CE(sat)}\approx0{,}2\,\text{V}$): $R=\frac{12-3\cdot1{,}9-0{,}2}{0{,}02}=\frac{6{,}1}{0{,}02}=305\,\Omega$ → <b>330 Ω</b>, $I=\frac{6{,}1}{330}=18{,}5\,\text{mA}$.</li>
<li><b>Colector:</b> $I_C=2\cdot18{,}5=37\,\text{mA}$. ¡Ya es más de lo que conviene pedirle al pin!</li>
<li><b>Base:</b> para asegurar saturación se usa $\beta_{forzado}=10$: $I_B=\frac{37}{10}=3{,}7\,\text{mA}$ → $R_B=\frac{5-0{,}7}{0{,}0037}=1{,}16\,\text{k}\Omega$ → <b>1 kΩ</b> (el valor menor, para que sobre corriente de base: $I_B=4{,}3\,\text{mA}$). El pin ahora entrega solo 4,3 mA.</li>
</ul>
</div>

<h2>8. Control de brillo con PWM</h2>
<p>¿Cómo se regula el brillo de un LED? Podrías cambiar la resistencia, pero lo práctico es el <b>PWM</b> (tema 4): el pin prende y apaga el LED cientos de veces por segundo y el ojo <b>promedia</b>. El brillo percibido es proporcional al <b>ciclo de trabajo</b> $D$:</p>
$$I_{media}=D\cdot I_{pico}\qquad\text{(por ejemplo, } D=25\,\%\text{ con } I_{pico}=15\,\text{mA} \Rightarrow I_{media}=3{,}75\,\text{mA)}$$
<ul>
<li>En Arduino: <code>analogWrite(9, 64);</code> → $D=64/255\approx25\,\%$ (pines con “~”: 3, 5, 6, 9, 10, 11; frecuencias de ≈ 490 Hz y 980 Hz).</li>
<li><b>Ventaja:</b> el LED siempre trabaja a su corriente nominal cuando está prendido, así que el color no cambia, y la R se calcula una sola vez para $I_{pico}$.</li>
<li><b>El ojo no es lineal:</b> percibe el brillo de forma aproximadamente logarítmica. Pasar de $D=$ 5 % a 10 % se nota muchísimo; de 80 % a 100 % casi nada. Por eso en los efectos de “fade” se usa una <b>corrección gamma</b> (por ejemplo $D = (x/255)^{2{,}2}$).</li>
<li>Frecuencia mínima para no ver parpadeo: más de ≈ 200 Hz (mejor > 1 kHz si se filma con el celular).</li>
</ul>

<h2>9. Display de 7 segmentos (breve)</h2>
${sieteSeg()}
<ul>
<li>Son <b>7 LEDs</b> con forma de barrita (a a g) más el punto (dp), con todos los ánodos o todos los cátodos unidos (<b>ánodo común</b> o <b>cátodo común</b>), igual que el RGB.</li>
<li><b>Una resistencia por segmento</b> (no una sola en el común): si no, el brillo dependería de cuántos segmentos estén prendidos (el “1” brillaría mucho más que el “8”). Es exactamente el problema del paralelo con R común.</li>
<li>Para varios dígitos se usa <b>multiplexado</b>: se prende un dígito por vez, muy rápido, y el ojo los ve todos (persistencia, como el PWM). También hay integrados que lo resuelven: el decodificador <b>CD4511</b> (BCD → 7 segmentos) o el <b>MAX7219</b>, o módulos con el <b>TM1637</b>.</li>
</ul>
`,

    simulaciones: [
      {
        titulo: 'Calculadora de la resistencia limitadora (y qué pasa si te equivocás)',
        descripcion: 'Elegí el color, la tensión de la fuente y la corriente deseada: se calcula R, el valor comercial E12 y las potencias. Abajo podés probar cualquier resistencia y ver cómo brilla (o se quema) el LED; esa parte usa el modelo exponencial real.',
        montar(cont, H) {
          const { controles, vista } = H.layout(cont);
          H.titulo(controles, 'Diseño');
          const color = H.select(controles, { label: 'Color del LED', opciones: Object.entries(COLORES).map(([v, c]) => ({ v, t: c.nombre + ' — ' + H.num(c.vf, 2) + ' V' })), value: 'rojo', onChange: upd });
          const vcc = H.slider(controles, { label: 'Tensión de la fuente Vcc', min: 1, max: 24, step: 0.1, value: 5, unidad: 'V', onInput: upd });
          const ides = H.slider(controles, { label: 'Corriente deseada', min: 1, max: 30, step: 0.5, value: 15, fmt: v => H.num(v, 1) + ' mA', onInput: upd });
          H.sep(controles);
          H.titulo(controles, 'Probá vos');
          const rman = H.slider(controles, { label: 'Resistencia que ponés (R manual)', min: 10, max: 10000, log: true, value: 220, unidad: 'Ω', onInput: upd });
          H.boton(controles, 'Usar la R comercial calculada', () => { if (Number.isFinite(S.Rc)) { rman.value = S.Rc; upd(); } });
          const cv = H.canvas(vista, { alto: w => w >= 560 ? 300 : 500, dibujar });
          const lec = H.lecturas(vista);
          const lec2 = H.lecturas(vista);
          const nota = H.nota(vista);
          let S = {};

          function dibujar(ctx, w, h) {
            const { c, p, V, R, I } = S;
            const ancho = w >= 560;
            // ---- circuito ----
            const cw = ancho ? Math.min(250, w * 0.38) : w, ch = ancho ? h : 200;
            const xB = 34, yT = 50, yB = ch - 50, xL = cw - 50;
            batCv(ctx, xB, yT, yB, H.fmt(V, 'V'));
            linea(ctx, [[xB, yT], [xB + 20, yT]]);
            resCv(ctx, xB + 20, yT, xL - 20, yT, 34, H.fmt(R, 'Ω'));
            linea(ctx, [[xL - 20, yT], [xL, yT], [xL, yB], [xB, yB]]);
            const yLed = (yT + yB) / 2;
            const quemado = ledCv(ctx, xL, yLed, 17, I, c.hex);
            ctx.save(); ctx.font = '700 12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            ctx.fillStyle = I > 0.03 ? H.col('red') : I < 0.001 ? H.col('amber') : H.col('ink');
            ctx.fillText('I = ' + mA(I), (xB + xL) / 2, yB + 8);
            if (I > 0.03) { ctx.font = '800 14px sans-serif'; ctx.fillStyle = H.col('red'); ctx.textBaseline = 'bottom'; ctx.fillText(quemado ? '¡QUEMADO!' : '¡SE QUEMA!', xL - 10, yLed - 34); }
            ctx.font = '600 11px sans-serif'; ctx.fillStyle = H.col('muted'); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
            ctx.fillText(c.corto, Math.min(xL + 24, cw - 4) - (xL + 24 > cw - 30 ? 30 : 0), yLed + 28);
            if (c === COLORES.ir && I > 2e-4 && !quemado) { ctx.textAlign = 'center'; ctx.fillText('(así lo ve la cámara;', xL - 20, yLed + 44); ctx.fillText('el ojo no ve nada)', xL - 20, yLed + 57); }
            ctx.restore();
            // ---- gráfico I‑V ----
            const gx = ancho ? cw + 20 : 0, gy = ancho ? 0 : ch + 10;
            const gw = ancho ? w - cw - 20 : w, gh = ancho ? h : h - ch - 10;
            const Isc = V / R;
            const ymax = Math.min(0.06, Math.max(0.01, 1.35 * I, 1.2 * Math.min(Isc, 0.04)));
            const xmax = Math.max(V * 1.04, c.vf + 0.6);
            const P = ejesF(ctx, w, h, { x0: gx + 56, y0: gy + 24, w: gw - 56 - 12, h: gh - 24 - 50, xmin: 0, xmax, ymin: 0, ymax, xfmt: t => H.num(t, 1), yfmt: t => H.num(t * 1000, 1), ylabel: 'I (mA)', xlabel: 'V del LED (V)', nx: 6, ny: 5 });
            if (ymax > 0.03) P.clip(() => { ctx.fillStyle = H.col('red'); ctx.globalAlpha = 0.1; ctx.fillRect(P.x0, P.y0, P.w, P.Y(0.03) - P.y0); });
            if (ymax > 0.03) P.texto(0, 0.03, 'zona de peligro (> 30 mA)', { color: H.col('red'), base: 'bottom', dx: 6, dy: -3, font: '600 10.5px sans-serif' });
            const pts = [];
            for (let j = 0; j <= 200; j++) { const Ii = ymax * 1.1 * Math.pow(j / 200, 2); pts.push([Vled(Ii, p), Ii]); }
            P.pts(pts, { color: c === COLORES.blanco ? H.col('c1') : c.hex, ancho: 2.6 });
            P.fn(v => (V - v) / R, { color: H.col('muted'), ancho: 1.8, guiones: [6, 4] });
            P.punto(Vled(I, p), I, { color: H.col('accent'), r: 5, label: 'Q' });
          }

          function upd() {
            const c = COLORES[color.value], p = led(c), V = vcc.value, Id = ides.value / 1000;
            // ---- diseño (modelo de caída constante) ----
            const ok = V > c.vf + 0.05;
            const Rcalc = ok ? (V - c.vf) / Id : NaN;
            const Rc = ok ? e12Sup(Rcalc) : NaN;
            const Ir = ok ? (V - c.vf) / Rc : NaN;
            const PR = Ir * Ir * Rc, PL = c.vf * Ir;
            // ---- prueba (modelo exponencial) ----
            const R = rman.value;
            const I = serie(V, R, [p]);
            S = { c, p, V, R, I, Rc };
            cv.redibujar();
            lec.set(ok ? [
              { k: 'R calculada = (Vcc − VF)/I', v: H.fmt(Rcalc, 'Ω') },
              { k: 'R comercial E12 (superior)', v: H.fmt(Rc, 'Ω'), estado: 'ok' },
              { k: 'Corriente real con esa R', v: mA(Ir) },
              { k: 'Potencia en R', v: H.fmt(PR, 'W') + ' → usar ' + potCom(PR), estado: PR > 0.125 ? 'alerta' : '' },
              { k: 'Potencia en el LED', v: H.fmt(PL, 'W') },
              { k: 'Rendimiento (P LED / P total)', v: H.num(100 * c.vf / V, 0) + ' %' },
            ] : [{ k: 'Diseño', v: 'Vcc debe superar VF = ' + H.num(c.vf, 2) + ' V', estado: 'mal' }]);
            const est = I > 0.03 ? 'mal' : I < 0.001 ? 'alerta' : 'ok';
            lec2.set([
              { k: 'Con tu R: corriente del LED', v: mA(I), estado: est },
              { k: 'Tensión real del LED', v: H.fmt(Vled(I, p), 'V') },
              { k: 'Potencia en tu R', v: H.fmt(I * I * R, 'W'), estado: I * I * R > 0.25 ? 'mal' : I * I * R > 0.125 ? 'alerta' : '' },
              { k: 'Estado', v: I > 0.06 ? '¡Quemado!' : I > 0.03 ? '¡Se quema!' : I < 0.001 ? 'Muy tenue / apagado' : I > 0.02 ? 'Al límite' : 'Bien' },
            ]);
            let t;
            if (!ok) t = `<b>La fuente no alcanza:</b> con ${H.fmt(V, 'V')} no se llega a la tensión directa del LED ${c.corto} (≈ ${H.num(c.vf, 2)} V). No hay resistencia que lo arregle: necesitás más tensión (o un LED de menor VF). Probá un rojo con 3,3 V y después un azul con 3,3 V.`;
            else if (I > 0.03) t = `<b>¡Se quema!</b> Con ${H.fmt(R, 'Ω')} circulan ${mA(I)}: más de lo que aguanta un LED de 5 mm (20 mA nominal, ≈ 30 mA máximo). Fijate en el gráfico: la recta de carga corta la curva en la zona roja. Subí R o usá la R comercial calculada.`;
            else if (I < 0.001) t = `<b>Muy tenue:</b> solo ${mA(I)}. ${V < c.vf + 0.3 ? 'La fuente apenas supera la VF del LED: casi no queda tensión para la resistencia.' : 'La resistencia es demasiado grande.'} Un LED moderno puede verse con 1 mA, pero apenas.`;
            else t = `<b>Funciona:</b> el LED toma ≈ ${H.fmt(Vled(I, p), 'V')} y los ${H.fmt(V - Vled(I, p), 'V')} restantes caen en la resistencia, que es la que fija la corriente (${mA(I)}). Mové R y fijate que la tensión del LED casi no cambia, pero la corriente sí. ${V > 3 * c.vf ? 'Con una fuente tan alta, la mayor parte de la potencia se pierde en R.' : ''}`;
            nota.innerHTML = t;
          }
          // arranca con la R comercial calculada
          (() => { const c = COLORES.rojo; rman.value = e12Sup((5 - c.vf) / 0.015); })();
          upd();
        },
      },
      {
        titulo: 'LEDs en serie y en paralelo: ¿quién se lleva la corriente?',
        descripcion: 'Elegí cuántos LEDs, cómo conectarlos y la dispersión de VF entre unidades (en la realidad dos LEDs “iguales” nunca son idénticos). Cada LED se modela con la ecuación de Shockley más una pequeña resistencia interna y el circuito se resuelve numéricamente.',
        montar(cont, H) {
          const { controles, vista } = H.layout(cont);
          const conf = H.select(controles, { label: 'Configuración', opciones: [{ v: 'serie', t: 'Serie (una R)' }, { v: 'comun', t: 'Paralelo con R común' }, { v: 'indiv', t: 'Paralelo con R individual' }], value: 'comun', onChange: () => { sugerir(); upd(); } });
          const nled = H.slider(controles, { label: 'Cantidad de LEDs', min: 1, max: 5, step: 1, value: 3, fmt: v => String(v), onInput: () => { sugerir(); upd(); } });
          const color = H.select(controles, { label: 'Color', opciones: Object.entries(COLORES).filter(([k]) => k !== 'ir').map(([v, c]) => ({ v, t: c.nombre })), value: 'rojo', onChange: () => { sugerir(); upd(); } });
          const vcc = H.slider(controles, { label: 'Tensión de la fuente Vcc', min: 1, max: 24, step: 0.1, value: 5, unidad: 'V', onInput: upd });
          const rs = H.slider(controles, { label: 'Resistencia R (cada una, si son individuales)', min: 10, max: 4700, log: true, value: 56, unidad: 'Ω', onInput: upd });
          const disp = H.slider(controles, { label: 'Dispersión de VF entre LEDs', min: 0, max: 200, step: 5, value: 80, fmt: v => v + ' mV', onInput: upd });
          H.boton(controles, 'Calcular R para 20 mA por LED', () => { sugerir(true); upd(); });
          const cv = H.canvas(vista, { alto: w => w >= 560 ? 300 : 320, dibujar });
          const lec = H.lecturas(vista);
          const nota = H.nota(vista);
          const OFF = [-0.5, 0.5, 0, 1, -1];
          let S = { I: [] };

          function sugerir(forzar) {
            const c = COLORES[color.value], N = nled.value, V = vcc.value;
            let R;
            if (conf.value === 'serie') R = (V - N * c.vf) / 0.02;
            else if (conf.value === 'comun') R = (V - c.vf) / (0.02 * N);
            else R = (V - c.vf) / 0.02;
            if (forzar && R > 0) rs.value = Math.min(4700, Math.max(10, e12Sup(R)));
            S.Rsug = R;
          }

          function resolverCirc() {
            const c = COLORES[color.value], N = nled.value, V = vcc.value, R = rs.value, d = disp.value / 1000;
            const ps = Array.from({ length: N }, (_, k) => led(c, OFF[k] * d));
            let I = [], Vn = 0;
            if (conf.value === 'serie') { const i = serie(V, R, ps); I = ps.map(() => i); }
            else if (conf.value === 'indiv') I = ps.map(p => serie(V, R, [p]));
            else {
              Vn = H.biseccion(v => (V - v) / R - ps.reduce((s, p) => s + Iled(v, p), 0), 0, V, 60);
              I = ps.map(p => Iled(Vn, p));
            }
            return { c, N, V, R, ps, I, Vn };
          }

          function dibujar(ctx, w, h) {
            const { c, N, V, R, ps, I } = S;
            const tipo = conf.value;
            const xB = 30, yT = 46, yB = h - 46;
            batCv(ctx, xB, yT, yB, H.fmt(V, 'V'));
            const lbl = (x, y, i, p) => {
              ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
              ctx.fillStyle = H.col('panel'); ctx.fillRect(x - 19, y - 1, 38, 38);
              ctx.font = '700 11px sans-serif';
              ctx.fillStyle = i > 0.03 ? H.col('red') : i < 0.001 ? H.col('amber') : H.col('ink');
              ctx.fillText(H.num(i * 1000, i < 0.01 ? 2 : 1), x, y);
              ctx.font = '600 10px sans-serif'; ctx.fillStyle = H.col('muted');
              ctx.fillText('mA', x, y + 13);
              ctx.fillText(H.num(p.vf, 2) + ' V', x, y + 25);
              if (i > 0.03) { ctx.fillStyle = H.col('red'); ctx.font = '800 11px sans-serif'; ctx.textBaseline = 'bottom'; ctx.fillText(i > 0.06 ? '¡quemado!' : '¡se quema!', x, y - 34); }
              ctx.restore();
            };
            const hex = c.hex;
            if (tipo === 'serie') {
              linea(ctx, [[xB, yT], [xB + 18, yT]]);
              resCv(ctx, xB + 18, yT, xB + 88, yT, 30, H.fmt(R, 'Ω'));
              const x0 = xB + 100, x1 = w - 34;
              linea(ctx, [[xB + 88, yT], [w - 18, yT], [w - 18, yB], [xB, yB]]);
              for (let k = 0; k < N; k++) {
                const x = x0 + (k + 0.5) * (x1 - x0) / N;
                ledCv(ctx, x, yT, 12, I[k], hex);
                lbl(x, yT + 22, I[k], ps[k]);
              }
              ctx.save(); ctx.fillStyle = H.col('muted'); ctx.font = '600 11px sans-serif'; ctx.textAlign = 'center';
              ctx.fillText('ΣVF ≈ ' + H.fmt(ps.reduce((s, p) => s + Vled(I[0], p), 0), 'V') + ' (tensión total en los LEDs)', (x0 + x1) / 2, (yT + yB) / 2 + 40);
              ctx.restore();
            } else {
              const comun = tipo === 'comun';
              let xs = xB + 18;
              linea(ctx, [[xB, yT], [xs, yT]]);
              if (comun) { resCv(ctx, xs, yT, xs + 70, yT, 30, H.fmt(R, 'Ω')); xs += 70; }
              const x0 = xs + 14, x1 = w - 14;
              const xk = k => x0 + (k + 0.5) * (x1 - x0) / N;
              linea(ctx, [[xs, yT], [xk(N - 1), yT]]);
              linea(ctx, [[xB, yB], [xk(N - 1), yB]]);
              const yL = comun ? (yT + yB) / 2 - 18 : yT + 100;
              for (let k = 0; k < N; k++) {
                const x = xk(k);
                if (comun) linea(ctx, [[x, yT], [x, yB]]);
                else { resCv(ctx, x, yT, x, yT + 70, 28, k === 0 ? H.fmt(R, 'Ω') : ''); linea(ctx, [[x, yT + 70], [x, yB]]); }
                ledCv(ctx, x, yL, 12, I[k], hex);
                lbl(x, yL + 18, I[k], ps[k]);
              }
            }
          }

          function upd() {
            S = Object.assign(S, resolverCirc());
            sugerir(false);
            cv.redibujar();
            const { N, V, R, ps, I, c } = S;
            const tipo = conf.value;
            const Itot = tipo === 'serie' ? I[0] : I.reduce((a, b) => a + b, 0);
            const Imax = Math.max(...I), Imin = Math.min(...I);
            const PR = tipo === 'indiv' ? I.reduce((s, i) => s + i * i * R, 0) : Itot * Itot * R;
            lec.set([
              { k: 'Corriente total de la fuente', v: mA(Itot) },
              { k: tipo === 'serie' ? 'Corriente en cada LED' : 'LED con más / menos corriente', v: tipo === 'serie' ? mA(Imax) : mA(Imax) + ' / ' + mA(Imin), estado: Imax > 0.03 ? 'mal' : Imax < 0.001 ? 'alerta' : 'ok' },
              { k: 'Desbalance (máx/mín)', v: tipo === 'serie' ? '—' : (Imin > 1e-6 ? H.num(Imax / Imin, 2) + ' veces' : '∞'), estado: tipo !== 'serie' && Imax / Math.max(Imin, 1e-9) > 1.5 ? 'alerta' : '' },
              { k: 'Potencia total en R', v: PR < 1e-6 ? '0 W' : H.fmt(PR, 'W') },
              { k: 'R sugerida para 20 mA/LED', v: S.Rsug > 0 ? H.fmt(S.Rsug, 'Ω') : 'imposible' },
            ]);
            let t;
            const sumVf = N * c.vf;
            if (tipo === 'serie') {
              if (V < sumVf * 0.97) t = `<b>No prenden:</b> la suma de las tensiones directas (${N} × ${H.num(c.vf, 2)} V ≈ ${H.num(sumVf, 2)} V) es mayor que la fuente (${H.fmt(V, 'V')}). En serie las VF se suman. Sacá un LED o subí Vcc.`;
              else if (Imax > 0.03) t = `<b>Demasiada corriente:</b> ${mA(Imax)} por todos los LEDs. Subí R (tocá “Calcular R”).`;
              else t = `<b>Serie:</b> por todos los LEDs pasa la misma corriente (${mA(Imax)}), aunque sus VF sean distintas: la dispersión no importa. Es la conexión más eficiente. ${V - sumVf < 1.5 ? '<b>Ojo:</b> queda muy poca tensión para la R (' + H.num(V - sumVf, 2) + ' V): cualquier variación de la fuente o de VF cambia mucho la corriente. Probá subir y bajar Vcc un poco.' : 'Fijate cuánto cambia la corriente si movés Vcc: con más tensión “sobrante” en la R, el circuito es más estable.'}`;
            } else if (tipo === 'comun') {
              if (N === 1) t = 'Con un solo LED no hay diferencia entre las configuraciones. Subí la cantidad.';
              else if (disp.value === 0) t = `<b>LEDs idénticos (dispersión 0):</b> la corriente se reparte perfecto. Pero eso no existe en la realidad: subí la dispersión a 50 – 100 mV y mirá qué pasa.`;
              else t = `<b>Paralelo con R común:</b> todos los LEDs tienen la <b>misma tensión</b> (${H.fmt(S.Vn, 'V')}), y como la curva es exponencial, el de menor VF se lleva ${mA(Imax)} mientras que el de mayor VF apenas ${mA(Imin)} (${H.num(Imax / Math.max(Imin, 1e-9), 1)} veces más). ${Imax > 0.03 ? '<b>El más “glotón” se quema</b>, y después la corriente se reparte entre los que quedan, que también terminan sobrecargados.' : 'Encima, el que más conduce se calienta, su VF baja y se lleva todavía más corriente (embalamiento térmico).'} Cambiá a “R individual” para comparar.`;
            } else {
              t = `<b>Paralelo con R individual:</b> cada resistencia absorbe la diferencia de VF. Con ${disp.value} mV de dispersión, las corrientes van de ${mA(Imin)} a ${mA(Imax)} (diferencia de solo ${H.num((Imax / Math.max(Imin, 1e-9) - 1) * 100, 0)} %). Es la forma correcta de poner LEDs en paralelo. ${Imax > 0.03 ? '<b>Pero la R es muy chica:</b> tocá “Calcular R”.' : ''}`;
            }
            nota.innerHTML = t;
          }
          upd();
        },
      },
    ],

    ejercicios: [
      {
        nivel: 'Básico',
        enunciado: String.raw`Querés usar un LED verde clásico ($V_F=2{,}2\,\text{V}$) como indicador de encendido en un equipo alimentado con una batería de $9\,\text{V}$, a $15\,\text{mA}$. Calculá la resistencia, elegí el valor E12 y verificá corriente real y potencia.`,
        pista: String.raw`$R=(V_{CC}-V_F)/I$. Tomá el E12 inmediato superior y recalculá $I$.`,
        solucion: String.raw`$R=\frac{9-2{,}2}{0{,}015}=\frac{6{,}8}{0{,}015}=453\,\Omega$ → E12 superior: <b>470 Ω</b>.<br>$I=\frac{6{,}8}{470}=14{,}5\,\text{mA}$.<br>$P_R=6{,}8\cdot0{,}0145=98{,}4\,\text{mW}$ → 1/4 W está bien (trabaja al 39 %). $P_{LED}=2{,}2\cdot0{,}0145=31{,}8\,\text{mW}$.`,
      },
      {
        nivel: 'Básico',
        enunciado: String.raw`Un LED azul ($V_F=3{,}2\,\text{V}$) se conecta a un pin de Arduino (5 V) y querés $10\,\text{mA}$. ¿Qué resistencia ponés? ¿Está dentro de lo que puede dar el pin?`,
        pista: 'Restá la VF del azul, no la del rojo.',
        solucion: String.raw`$R=\frac{5-3{,}2}{0{,}01}=180\,\Omega$, que ya es un valor E12. $I=10\,\text{mA}$, por debajo de los 20 mA recomendados por pin: OK.<br>$P_R=1{,}8\cdot0{,}01=18\,\text{mW}$. (Si hubieras usado 2 V de $V_F$ te daría 300 Ω → 330 Ω y la corriente real sería solo $\frac{1{,}8}{330}=5{,}5\,\text{mA}$.)`,
      },
      {
        nivel: 'Básico',
        enunciado: String.raw`Un LED tiene un material con banda prohibida $E_g=1{,}9\,\text{eV}$. ¿Qué longitud de onda emite y de qué color se ve? ¿Y uno de $2{,}7\,\text{eV}$? ¿Qué tensión directa mínima esperás en cada caso?`,
        pista: String.raw`$\lambda\,[\text{nm}]\approx 1240/E_g\,[\text{eV}]$ y $V_F\gtrsim E_g/q$.`,
        solucion: String.raw`$\lambda=\frac{1240}{1{,}9}=653\,\text{nm}$ → <b>rojo</b>. $V_F\gtrsim1{,}9\,\text{V}$.<br>$\lambda=\frac{1240}{2{,}7}=459\,\text{nm}$ → <b>azul</b>. $V_F\gtrsim2{,}7\,\text{V}$ (en la práctica ≈ 3,1 – 3,3 V por la resistencia interna del material).`,
      },
      {
        nivel: 'Intermedio',
        enunciado: String.raw`Para una luz de posición de un auto se ponen LEDs rojos ($V_F=2\,\text{V}$, 20 mA) en serie. (a) Un compañero propone 5 LEDs y $R=100\,\Omega$ calculado para 12 V. ¿Qué corriente circula cuando el motor está en marcha y el alternador lleva la tensión a $14{,}4\,\text{V}$? (b) Proponé un diseño con 4 LEDs que no supere 20 mA en el peor caso.`,
        pista: 'Diseñá para la tensión máxima (14,4 V) y verificá con la mínima (12 V).',
        solucion: String.raw`(a) A 12 V: $\frac{12-10}{100}=20\,\text{mA}$. A 14,4 V: $\frac{14{,}4-10}{100}=44\,\text{mA}$: ¡más del doble! Los LEDs se degradan o queman. El problema: solo quedaban 2 V para la R y cualquier aumento de la fuente se traslada entero a la corriente.<br>(b) 4 LEDs ($8\,\text{V}$), diseñando para 14,4 V: $R=\frac{14{,}4-8}{0{,}02}=320\,\Omega$ → <b>330 Ω</b>. A 14,4 V: $\frac{6{,}4}{330}=19{,}4\,\text{mA}$; a 12 V: $\frac{4}{330}=12{,}1\,\text{mA}$. Brilla un poco menos con el motor parado, pero nunca se pasa. $P_R=0{,}0194^2\cdot330=0{,}124\,\text{W}$ → 1/2 W (o 1/4 W muy justa).`,
      },
      {
        nivel: 'Intermedio',
        enunciado: String.raw`Un LED RGB de cátodo común se maneja con tres pines de Arduino (5 V). Datos: rojo $2{,}0\,\text{V}$, verde $3{,}1\,\text{V}$, azul $3{,}2\,\text{V}$. Querés unos $10\,\text{mA}$ por color. Calculá las tres resistencias (E12 superior) y las corrientes reales. ¿Por qué no se usa una sola resistencia en la pata común?`,
        pista: 'Cada color es un LED distinto con su propia VF.',
        solucion: String.raw`Rojo: $\frac{5-2}{0{,}01}=300\,\Omega$ → <b>330 Ω</b>, $I=\frac{3}{330}=9{,}1\,\text{mA}$.<br>Verde: $\frac{5-3{,}1}{0{,}01}=190\,\Omega$ → <b>220 Ω</b>, $I=\frac{1{,}9}{220}=8{,}6\,\text{mA}$.<br>Azul: $\frac{5-3{,}2}{0{,}01}=180\,\Omega$ → <b>180 Ω</b>, $I=10\,\text{mA}$.<br>Con una sola R en el común, los tres LEDs quedarían en paralelo con la misma tensión: el rojo (VF mucho menor) se llevaría casi toda la corriente y el verde y el azul casi no prenderían. Además el brillo de cada color dependería de cuáles estén prendidos.`,
      },
      {
        nivel: 'Avanzado',
        enunciado: String.raw`Querés que un Arduino prenda 9 LEDs blancos ($V_F=3{,}2\,\text{V}$, 20 mA) alimentados con $12\,\text{V}$, armados en 3 ramas de 3 LEDs en serie, con un transistor NPN BC337 ($\beta_{min}=100$, $V_{CE(sat)}=0{,}2\,\text{V}$, $V_{BE}=0{,}7\,\text{V}$). Calculá la R de cada rama, la corriente de colector, la resistencia de base (con $\beta_{forzado}=10$) y la corriente que entrega el pin.`,
        pista: String.raw`Rama: $R=(12-3\cdot3{,}2-0{,}2)/0{,}02$. Para la base, elegí el E12 <b>inferior</b> para asegurar la saturación.`,
        solucion: String.raw`Rama: $R=\frac{12-9{,}6-0{,}2}{0{,}02}=\frac{2{,}2}{0{,}02}=110\,\Omega$ → <b>120 Ω</b>; $I=\frac{2{,}2}{120}=18{,}3\,\text{mA}$; $P_R=2{,}2\cdot0{,}0183=40\,\text{mW}$.<br>$I_C=3\cdot18{,}3=55\,\text{mA}$ (el pin solo no podría).<br>$I_B=\frac{55}{10}=5{,}5\,\text{mA}$ → $R_B=\frac{5-0{,}7}{0{,}0055}=782\,\Omega$ → <b>680 Ω</b> (E12 inferior). $I_B=\frac{4{,}3}{680}=6{,}3\,\text{mA}$: el pin entrega 6,3 mA, bien por debajo de 20 mA.<br>Potencia en el transistor: $0{,}2\cdot0{,}055=11\,\text{mW}$ (despreciable).<br>Observación: con solo 2,2 V para la R, la corriente es sensible a la dispersión de VF; si se puede, mejor 2 LEDs por rama.`,
      },
      {
        nivel: 'Avanzado',
        enunciado: String.raw`Dos LEDs rojos se modelan como una fuente de tensión más una resistencia interna de $5\,\Omega$: $V_1=1{,}85\,\text{V}+I_1\cdot5\,\Omega$ y $V_2=1{,}95\,\text{V}+I_2\cdot5\,\Omega$ (o sea, 1,95 V y 2,05 V a 20 mA). (a) Se conectan en paralelo con una R común de $75\,\Omega$ a $5\,\text{V}$ (calculada “para 40 mA”). Hallá la corriente de cada LED. (b) Repetí con una resistencia de $150\,\Omega$ en cada LED.`,
        pista: String.raw`(a) Llamá $V$ a la tensión del nodo de los ánodos y planteá LKC: $\frac{5-V}{75}=\frac{V-1{,}85}{5}+\frac{V-1{,}95}{5}$.`,
        solucion: String.raw`(a) Multiplicando por 75: $5-V=15(V-1{,}85)+15(V-1{,}95)=30V-57$ → $31V=62$ → $V=2{,}00\,\text{V}$.<br>$I_1=\frac{2-1{,}85}{5}=30\,\text{mA}$, $I_2=\frac{2-1{,}95}{5}=10\,\text{mA}$. ¡Con solo 0,1 V de diferencia, uno lleva el triple que el otro! El de 30 mA está al límite y además se calienta (su VF baja y la cosa empeora).<br>(b) Cada rama es independiente: $I_1=\frac{5-1{,}85}{150+5}=20{,}3\,\text{mA}$, $I_2=\frac{5-1{,}95}{155}=19{,}7\,\text{mA}$. Diferencia de solo 3 %.`,
      },
    ],

    quiz: [
      { pregunta: '¿Qué determina el color de la luz que emite un LED?', opciones: ['La corriente que circula', 'El color del plástico de la cápsula', 'La energía de la banda prohibida del material semiconductor', 'La tensión de la fuente'], correcta: 2, explicacion: 'Cada recombinación emite un fotón de energía ≈ Eg; λ ≈ 1240/Eg. El plástico solo difunde o tiñe; hay LEDs de cápsula transparente que emiten rojo, verde o azul.' },
      { pregunta: 'Un LED rojo (VF ≈ 2 V) se alimenta con 5 V y se quieren 15 mA. La resistencia comercial adecuada es…', opciones: ['100 Ω', '220 Ω', '330 Ω', '1 kΩ'], correcta: 1, explicacion: 'R = (5 − 2)/0,015 = 200 Ω → E12 inmediato superior: 220 Ω (13,6 mA).' },
      { pregunta: '¿Por qué no se conecta un LED directo a una fuente de 5 V sin resistencia?', opciones: ['Porque prende al revés', 'Porque su curva es exponencial: con más tensión que VF la corriente se dispara y se quema', 'Porque el LED necesita corriente alterna', 'Porque no prende con 5 V'], correcta: 1, explicacion: 'Unas décimas de volt por encima de VF significan decenas o cientos de mA. La resistencia fija la corriente.' },
      { pregunta: '¿Cuál es el cátodo de un LED de 5 mm?', opciones: ['La pata larga', 'La pata corta, del lado plano de la cápsula', 'Cualquiera, el LED no tiene polaridad', 'La pata del medio'], correcta: 1, explicacion: 'Pata larga = ánodo (+). Pata corta y lado plano = cátodo (−).' },
      { pregunta: 'Tres LEDs en paralelo con una sola resistencia común. ¿Qué pasa en la práctica?', opciones: ['Cada uno lleva exactamente un tercio de la corriente', 'El de menor VF se lleva la mayor parte de la corriente y puede quemarse', 'No prende ninguno', 'Brillan más que con una R cada uno'], correcta: 1, explicacion: 'Tienen la misma tensión; por la curva exponencial, una pequeña diferencia de VF produce una gran diferencia de corriente (y encima aparece el embalamiento térmico).' },
      { pregunta: 'Con analogWrite(9, 64) en un LED con resistencia calculada para 16 mA, la corriente media es aproximadamente…', opciones: ['16 mA', '8 mA', '4 mA', '64 mA'], correcta: 2, explicacion: 'D = 64/255 ≈ 25 %; I media = 0,25 · 16 mA = 4 mA. La corriente de pico sigue siendo 16 mA.' },
    ],

    docente: String.raw`
<h3>Objetivo de la clase</h3>
<p>Que el alumno entienda que <b>el LED es un diodo que emite luz</b>, que <b>se controla por corriente</b> y que sepa diseñar el circuito completo: elegir corriente, calcular la resistencia, llevarla a un valor comercial y verificar potencias. Que pueda armar LEDs en serie/paralelo correctamente, conectar un RGB y manejar LEDs desde un Arduino (directo y con transistor). <b>Duración sugerida:</b> 1 clase larga (90 min) o 2 de 60 min si se incluye la parte de Arduino/transistor y RGB.</p>
<h3>Secuencia sugerida</h3>
<ol>
<li><b>Disparador (5 min):</b> “¿Por qué el control remoto de la tele parece no hacer nada, pero si lo mirás con la cámara del celular se ve una lucecita violeta?” (LED infrarrojo; el sensor de la cámara sí lo ve). Si tiene un control a mano, que lo pruebe en vivo.</li>
<li><b>Física y color (10 min):</b> sección 1. Repasá recombinación (tema 9) y contá la analogía del escalón. Hacé la cuenta $\lambda=1240/E_g$ para rojo y azul (ejercicio 3). Pregunta: <em>“¿por qué el LED azul necesita más tensión que el rojo?”</em> (el fotón azul tiene más energía).</li>
<li><b>La resistencia (20 min):</b> simulación 1. Antes de tocar nada, preguntá: <em>“¿qué pasa si conecto un LED rojo directo a 5 V?”</em>. Bajá la R manual a 10 Ω: aparece “¡QUEMADO!”. Después subila de a poco: que el alumno vea que la <b>tensión del LED casi no cambia</b> (1,8 – 2,1 V) mientras la corriente varía muchísimo. En el gráfico, mostrá cómo la recta de carga pivota alrededor de Vcc. Luego hacé con él la receta de 5 pasos (sección 4) y verificá con la calculadora.</li>
<li><b>Casos interesantes con la calculadora (10 min):</b> azul a 3,3 V (no se puede o queda muy justo); azul a 12 V (mirá la potencia en R: pide 1/2 W y el rendimiento es 27 %); IR a 5 V.</li>
<li><b>Serie y paralelo (20 min):</b> simulación 2. Empezá en <b>serie</b> con 3 rojos a 5 V: no prenden (5,7 V &gt; 5 V). Preguntá por qué antes de subir Vcc a 9 V y tocar “Calcular R”. Pasá a <b>paralelo con R común</b>, 3 LEDs, dispersión 0: todo perfecto. Subí la dispersión a 80 mV y preguntá <em>“¿qué esperás que pase?”</em>. Uno se lleva casi el doble que otro. Cambiá a <b>R individual</b>: se equilibra. Cerrá con el ejercicio 7 hecho a mano.</li>
<li><b>RGB, Arduino y transistor (15 min):</b> secciones 6 y 7. Insistí en “una R por color” y en el límite de 20 mA por pin. Hacé el ejemplo 3 en el pizarrón.</li>
<li><b>PWM y 7 segmentos (5 min):</b> secciones 8 y 9; conectá con el tema 4 (la simulación de PWM con LED).</li>
<li><b>Cierre:</b> autoevaluación; tarea: ejercicios 1, 4 y 6.</li>
</ol>
<h3>Errores frecuentes</h3>
<ul>
<li>Calcular $R = V_{CC}/I$ sin restar $V_F$.</li>
<li>Pensar que “el LED es de 2 V” y que entonces se lo puede conectar a una fuente de 2 V sin resistencia (la tolerancia de VF y la temperatura lo hacen inviable).</li>
<li>Usar la VF del rojo para un LED azul o blanco.</li>
<li>Poner una sola R para varios LEDs en paralelo o en la pata común del RGB/7 segmentos.</li>
<li>Elegir el valor E12 <b>inferior</b> (da más corriente de la calculada); para la R del LED se elige el superior.</li>
<li>Olvidarse de la potencia de la resistencia con fuentes de 12 – 24 V.</li>
<li>Pedirle a un pin de Arduino más de 20 mA (o la suma de muchos LEDs en varios pines por encima de ≈ 200 mA en total).</li>
</ul>
<h3>Preguntas para hacerle pensar</h3>
<ul>
<li>¿Por qué las lámparas LED de casa no tienen una resistencia sino un circuito (“driver”) de corriente constante? (eficiencia: con 220 V la resistencia disiparía casi toda la potencia).</li>
<li>Si un LED rojo y uno azul se conectan en paralelo a 5 V con una sola R, ¿cuál prende? (solo el rojo: el azul queda con ≈ 2 V, por debajo de su VF).</li>
<li>¿Puede un LED funcionar como sensor de luz? (sí: iluminado genera una pequeña tensión, como una celda solar, y es más sensible a colores de λ algo menor que la que emite).</li>
<li>¿Por qué en las guirnaldas viejas si se quemaba una lamparita se apagaban todas?</li>
</ul>
<h3>Recordatorio rápido para vos</h3>
<ul>
<li>$V_F$ típicas a 20 mA: IR 1,2 – 1,5 V; rojo 1,8 – 2,0; amarillo 2,0 – 2,1; verde GaP 2,1 – 2,4; verde InGaN 2,9 – 3,2; azul/blanco 3,0 – 3,3 V.</li>
<li>LED de 5 mm: 20 mA nominal, ≈ 30 mA máx. continuo, pico ≈ 100 mA en pulsos de 0,1 ms; tensión inversa máxima ≈ 5 V. LED SMD 0603/0805: 5 – 20 mA. LED de potencia de 1 W: 350 mA (con driver de corriente constante y disipador).</li>
<li>$\lambda[\text{nm}]\cdot E[\text{eV}]\approx1240$. $E_g$: GaAs 1,42 eV; GaP 2,26 eV; GaN 3,4 eV.</li>
<li>Factor de idealidad de LEDs: $n\approx 2$ (rojos) a 3 – 5 (InGaN azul/blanco). Coeficiente térmico de VF ≈ −2 mV/°C (−1,5 a −4).</li>
<li>Serie E12: 10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82. Para la R del LED: inmediato superior; para la $R_B$ de un transistor en saturación: inmediato inferior.</li>
<li>Arduino UNO: 20 mA por pin recomendado, 40 mA máximo absoluto, ≈ 200 mA total. PWM: 490 Hz (pines 3, 9, 10, 11) y 980 Hz (5, 6).</li>
<li>Saturación de un BJT como llave: $\beta_{forzado}\approx10$, $V_{CE(sat)}\approx0{,}1$ – $0{,}3\,\text{V}$.</li>
</ul>
<h3>Experiencia práctica</h3>
<p><b>En casa (con un kit básico):</b> protoboard, pila de 9 V (o fuente USB de 5 V), LEDs de varios colores y resistencias de 220 Ω, 470 Ω, 1 kΩ y 10 kΩ. (1) Medir con el multímetro en modo diodo la VF de cada color y comparar con la tabla. (2) Armar LED rojo + 470 Ω a 9 V y medir la tensión en el LED y en la R; calcular la corriente con la ley de Ohm en la R. (3) Cambiar a 10 kΩ y a 220 Ω: ver que la VF casi no cambia y la corriente sí. (4) Mirar un LED IR (o el control remoto) con la cámara del celular.</p>
<p><b>Simulador:</b> en <b>Tinkercad Circuits</b> el LED se quema (aparece una “explosión”) si se pasa de corriente: es ideal para mostrar qué pasa sin resistencia sin gastar componentes. Armar también el RGB de cátodo común con Arduino y <code>analogWrite</code> en los pines 9, 10 y 11 para mezclar colores. En <b>Falstad</b> (falstad.com/circuit) se puede armar el paralelo con R común con LEDs de distinto color y ver cómo se reparte la corriente.</p>
`,
  });
})();
