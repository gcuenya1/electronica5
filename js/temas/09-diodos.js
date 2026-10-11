/* Tema 09 — Diodos
   IMPORTANTE: los textos con LaTeX usan String.raw`...` para que "\frac" no se rompa.
   Todo va dentro de una IIFE para no ensuciar el ámbito global. */
(() => {
  const VT = 0.02585;     // tensión térmica a 300 K
  /** Parámetros de los diodos simulados (modelos tipo SPICE, simplificados) */
  const TIPOS = {
    si: { nombre: 'Silicio (1N4148)', Is: 2.52e-9, n: 1.752, vg: 0.7 },
    ge: { nombre: 'Germanio (1N34A)', Is: 1e-6, n: 1.2, vg: 0.3 },
    sch: { nombre: 'Schottky (BAT85)', Is: 2e-7, n: 1.0, vg: 0.3 },
    ideal: { nombre: 'Ideal', Is: 0, n: 1, vg: 0 },
  };
  /** Corriente de Shockley */
  const Ishock = (v, d) => d.Is * (Math.exp(Math.min(v / (d.n * VT), 600)) - 1);
  /** Resuelve fuente V + R + diodo (ánodo hacia la fuente). Devuelve { vd, id }. */
  function resolver(V, R, d) {
    if (d.Is === 0) return V > 0 ? { vd: 0, id: V / R } : { vd: V, id: 0 };   // ideal
    const f = (vd) => Ishock(vd, d) - (V - vd) / R;
    const a = Math.min(V, 0) - 0.01, b = Math.max(V, 0) + 0.01;
    const vd = H.biseccion(f, a, b, 120);
    return { vd, id: (V - vd) / R };
  }

  /** Ejes con las etiquetas FUERA del área (ylabel arriba a la izquierda, xlabel abajo centrado) */
  function ejesF(ctx, W, Hh, op) {
    const o = Object.assign({}, op, { xlabel: '', ylabel: '' });
    if (o.y0 === undefined) o.mt = (op.mt ?? 14) + 16;
    o.mb = (op.mb ?? 34) + (op.xlabel ? 14 : 0);
    const P = H.ejes(ctx, W, Hh, o);
    ctx.save(); ctx.fillStyle = H.col('muted'); ctx.font = '600 11px sans-serif';
    if (op.ylabel) { ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText(op.ylabel, P.x0, P.y0 - 4); }
    if (op.xlabel) { ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(op.xlabel, P.x0 + P.w / 2, P.y0 + P.h + 19); }
    ctx.restore();
    return P;
  }

  /* ---------- dibujos SVG propios ---------- */
  const SV = 'stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"';
  /** Mini‑gráfico de un modelo del diodo */
  function miniModelo(titulo, puntos, nota) {
    // ejes: V de -1 a 1,5 → x 20..180 ; I de -0.2 a 1 → y 130..20
    const X = v => 20 + (v + 1) / 2.5 * 160, Y = i => 130 - (i + 0.2) / 1.2 * 110;
    const pl = puntos.map(([v, i]) => X(v).toFixed(1) + ',' + Y(i).toFixed(1)).join(' ');
    return `<svg class="esq" viewBox="0 0 200 175" width="200" height="175" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 ${Y(0)}H185M${X(0)} 130V15" stroke="var(--axis)" stroke-width="1.3" fill="none"/>
      <path d="M185 ${Y(0)}l-7 -3v6zM${X(0)} 15l-3 7h6z" fill="var(--axis)"/>
      <text x="183" y="${Y(0) + 14}" font-size="11" text-anchor="end">V<tspan font-size="8">D</tspan></text>
      <text x="${X(0) + 5}" y="22" font-size="11">I<tspan font-size="8">D</tspan></text>
      <polyline points="${pl}" stroke="var(--c1)" stroke-width="2.6" fill="none" stroke-linejoin="round"/>
      <text x="100" y="150" font-size="12.5" font-weight="700" text-anchor="middle">${titulo}</text>
      <text x="100" y="166" font-size="10.5" text-anchor="middle" class="val">${nota}</text></svg>`;
  }
  const modelosSVG = () => `<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin:14px 0">` +
    miniModelo('1) Ideal', [[-1, 0], [0, 0], [0, 1]], 'llave: cerrada o abierta') +
    miniModelo('2) Con caída de 0,7 V', [[-1, 0], [0.7, 0], [0.7, 1]], 'llave + pila de 0,7 V') +
    miniModelo('3) 0,7 V + resistencia', [[-1, 0], [0.7, 0], [1.2, 1]], 'pendiente 1/r_d') +
    miniModelo('Real (Shockley)', Array.from({ length: 60 }, (_, k) => { const v = -1 + k * 1.95 / 59; return [v, Math.min(1.05, 1e-6 * (Math.exp(v / 0.045) - 1) * 0.4)]; }), 'exponencial') + `</div>`;

  /** Unión PN con zona de agotamiento */
  function unionPN() {
    let s = `<svg class="esq" viewBox="0 0 420 210" width="420" height="210" xmlns="http://www.w3.org/2000/svg" style="max-width:100%">`;
    s += `<rect x="20" y="30" width="190" height="120" fill="var(--c4)" opacity=".10"/><rect x="210" y="30" width="190" height="120" fill="var(--c1)" opacity=".10"/>`;
    s += `<rect x="170" y="30" width="80" height="120" fill="var(--amber)" opacity=".22"/>`;
    s += `<rect x="20" y="30" width="380" height="120" ${SV}/><path d="M210 30V150" stroke="currentColor" stroke-width="1.2" stroke-dasharray="4 3"/>`;
    // huecos en P (círculos vacíos) y electrones en N (puntos)
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const x = 40 + i * 34 + (j % 2) * 12, y = 48 + j * 28;
      s += `<circle cx="${x}" cy="${y}" r="5.5" fill="none" stroke="var(--c4)" stroke-width="2"/>`;
      const xn = 270 + i * 34 + (j % 2) * 12;
      s += `<circle cx="${xn}" cy="${y}" r="4.5" fill="var(--c1)"/>`;
    }
    // iones fijos en la zona de agotamiento
    for (let j = 0; j < 4; j++) {
      const y = 50 + j * 28;
      s += `<text x="${185}" y="${y + 5}" font-size="18" font-weight="700" text-anchor="middle" style="fill:var(--c4)">−</text><text x="${200}" y="${y + 5}" font-size="18" font-weight="700" text-anchor="middle" style="fill:var(--c4)">−</text>`;
      s += `<text x="${222}" y="${y + 5}" font-size="16" font-weight="700" text-anchor="middle" style="fill:var(--c1)">+</text><text x="${237}" y="${y + 5}" font-size="16" font-weight="700" text-anchor="middle" style="fill:var(--c1)">+</text>`;
    }
    s += `<text x="95" y="22" font-size="14" font-weight="700" text-anchor="middle">Zona P (huecos ○)</text>`;
    s += `<text x="325" y="22" font-size="14" font-weight="700" text-anchor="middle">Zona N (electrones ●)</text>`;
    s += `<text x="210" y="170" font-size="12.5" font-weight="700" text-anchor="middle" style="fill:var(--amber)">zona de agotamiento</text>`;
    s += `<text x="210" y="186" font-size="11.5" text-anchor="middle" class="val">(sin portadores libres, solo iones fijos)</text>`;
    s += `<path d="M245 200H175" ${SV} style="color:var(--red)"/><path d="M175 200l8 -4v8z" fill="var(--red)"/><text x="255" y="204" font-size="11.5" style="fill:var(--red)">campo eléctrico interno → barrera ≈ 0,7 V</text>`;
    s += `</svg>`;
    return `<figure class="figura">${s}<figcaption>Al formarse la unión, electrones y huecos cercanos se recombinan y dejan una franja “vacía” con iones fijos.</figcaption></figure>`;
  }
  /** Diodo físico con su banda y el símbolo debajo */
  function diodoFisico() {
    return `<figure class="figura"><svg class="esq" viewBox="0 0 360 150" width="360" height="150" xmlns="http://www.w3.org/2000/svg" style="max-width:100%">
      <path d="M20 40H110M250 40H340" stroke="#9a9a9a" stroke-width="4"/>
      <rect x="110" y="22" width="140" height="36" rx="8" fill="#2a2a2a"/>
      <rect x="215" y="22" width="16" height="36" fill="#d8d8d8"/>
      <text x="165" y="45" font-size="12" font-weight="700" text-anchor="middle" style="fill:#eee">1N4007</text>
      <text x="223" y="76" font-size="11" text-anchor="middle">banda</text>
      <path d="M20 115H160M200 115H340" ${SV}/>
      <path d="M160 101L188 115L160 129Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M190 99V131" ${SV}/>
      <text x="60" y="140" font-size="13" font-weight="700" text-anchor="middle">Ánodo (A)</text>
      <text x="300" y="140" font-size="13" font-weight="700" text-anchor="middle">Cátodo (K)</text>
      <path d="M223 84V96" stroke="var(--accent)" stroke-width="2" stroke-dasharray="3 2"/><path d="M190 96H223" stroke="var(--accent)" stroke-width="2" stroke-dasharray="3 2"/>
    </svg><figcaption>La banda marca el cátodo: es la “rayita” del símbolo.</figcaption></figure>`;
  }

  registrarTema({
    id: 'diodos',
    orden: 9,
    titulo: 'Diodos',
    resumen: 'Semiconductores, unión PN, curva I‑V y modelos',
    confirmar: false,

    teoria: String.raw`
<p>El <b>diodo</b> es el componente semiconductor más simple: tiene dos terminales, <b>ánodo (A)</b> y <b>cátodo (K)</b>, y deja pasar la corriente <b>en un solo sentido</b> (de ánodo a cátodo). Es como una <b>válvula antirretorno</b> en una cañería: el agua pasa para un lado y para el otro la válvula se cierra. Con diodos se hacen rectificadores (convertir alterna en continua), protecciones contra polaridad invertida, detectores de radio, compuertas lógicas… y, cuando emiten luz, ¡LEDs!</p>
<p>Pero el diodo <b>no es lineal</b>: no cumple la ley de Ohm. Para entender por qué, hay que meterse un poco adentro del material.</p>

<h2>1. Conductores, aislantes y semiconductores</h2>
<ul>
<li><b>Conductores</b> (cobre, aluminio): tienen muchísimos electrones libres. Conducen siempre.</li>
<li><b>Aislantes</b> (vidrio, plástico): sus electrones están fuertemente atados. Prácticamente no conducen.</li>
<li><b>Semiconductores</b> (silicio, germanio): están en el medio. Puros conducen muy poco, pero <b>se puede controlar cuánto conducen</b> agregándoles impurezas, calor o luz (¡acordate de la LDR y el termistor!).</li>
</ul>
<p>El <b>silicio (Si)</b> tiene <b>4 electrones de valencia</b> (en su última capa). En un cristal, cada átomo comparte esos 4 electrones con 4 vecinos formando <b>enlaces covalentes</b>: todos quedan “ocupados” y casi no hay portadores libres. A temperatura ambiente, el calor rompe algunos enlaces, pero muy pocos: el silicio puro es mal conductor.</p>

<h2>2. Dopaje: semiconductores N y P</h2>
<p><b>Dopar</b> es agregar una cantidad mínima (una parte en un millón, más o menos) de otro elemento para cambiar cómo conduce.</p>
<div class="dos-col">
<div class="caja formula"><span class="caja-titulo">Tipo N (negativo)</span>
Se agrega un elemento con <b>5 electrones</b> de valencia (fósforo, arsénico). Cuatro forman enlaces y el quinto <b>queda libre</b>. Hay muchos <b>electrones libres</b>: son los <b>portadores mayoritarios</b>.
</div>
<div class="caja formula"><span class="caja-titulo">Tipo P (positivo)</span>
Se agrega un elemento con <b>3 electrones</b> (boro, galio). Falta un electrón para completar un enlace: queda un <b>hueco</b>. Los huecos son los portadores mayoritarios y se comportan como cargas positivas.
</div>
</div>
<div class="caja idea"><span class="caja-titulo">¿Cómo se “mueve” un hueco? (analogía)</span>
Imaginá una fila de butacas del cine todas ocupadas menos una. Si la persona de al lado de la butaca vacía se corre a ocuparla, la butaca vacía “se movió” un lugar en sentido contrario. Las personas (electrones) se mueven hacia un lado y el lugar vacío (hueco) avanza hacia el otro. Por eso decimos que los huecos se mueven como si fueran cargas positivas. Otra imagen: una <b>burbuja de aire</b> en una botella de agua sube, aunque lo que en realidad baja es el agua.
</div>
<div class="caja ojo"><span class="caja-titulo">Error típico</span>
Un material tipo N <b>no tiene carga negativa neta</b>, ni el P positiva: los dos son eléctricamente neutros (cada electrón libre de más viene con un protón de más en el núcleo del fósforo). “N” y “P” indican qué tipo de portador abunda, no la carga total.
</div>

<h2>3. La unión PN y la barrera de potencial</h2>
<p>Un diodo es un cristal de silicio con una zona P y una zona N pegadas. Al formarse la unión pasa esto:</p>
<ol>
<li>Los electrones libres de la zona N cerca de la unión <b>se difunden</b> hacia la zona P (como el perfume que se esparce por la pieza) y llenan huecos. Se “anulan” mutuamente: <b>recombinación</b>.</li>
<li>Queda una franja a cada lado de la unión <b>sin portadores libres</b>: la <b>zona de agotamiento</b> (o de deplexión). En esa franja quedan los átomos de impureza ionizados, fijos en el cristal: negativos del lado P y positivos del lado N.</li>
<li>Esos iones crean un <b>campo eléctrico interno</b> que frena la difusión: aparece una <b>barrera de potencial</b> de aproximadamente <b>0,7 V en silicio</b> (0,3 V en germanio).</li>
</ol>
${unionPN()}
<p>Analogía: la barrera es como un <b>escalón o una lomada</b> en la ruta. Para que los portadores crucen, hay que darles “empuje” desde afuera de al menos la altura del escalón.</p>

<h2>4. Polarización directa e inversa</h2>
<div class="dos-col">
<div>
<h3>Directa: conduce</h3>
${Esq.svg(260, 170, [
  Esq.bat(40, 55, 40, 115, 'V', '', -1), Esq.cable([[40, 55], [40, 30], [70, 30]]), Esq.R(70, 30, 150, 30, 'R', '', 1),
  Esq.cable([[150, 30], [220, 30], [220, 60]]), Esq.D(220, 60, 220, 130, 'A arriba', '', 1),
  Esq.cable([[220, 130], [220, 150], [40, 150], [40, 115]]), Esq.flecha(95, 64, 135, 64, 'I'),
])}
<p>El <b>+ de la fuente al ánodo (P)</b> y el − al cátodo (N). La tensión externa se opone al campo interno: la zona de agotamiento se achica y, cuando superamos la barrera (≈ 0,7 V en Si), la corriente <b>crece muy rápido</b>.</p>
</div>
<div>
<h3>Inversa: no conduce</h3>
${Esq.svg(260, 170, [
  Esq.bat(40, 55, 40, 115, 'V', '', -1), Esq.cable([[40, 55], [40, 30], [70, 30]]), Esq.R(70, 30, 150, 30, 'R', '', 1),
  Esq.cable([[150, 30], [220, 30], [220, 60]]), Esq.D(220, 130, 220, 60, 'K arriba', '', 1),
  Esq.cable([[220, 130], [220, 150], [40, 150], [40, 115]]), Esq.texto(110, 70, 'I ≈ 0', { color: 'var(--red)' }),
])}
<p>El <b>+ al cátodo</b>. La tensión externa refuerza el campo interno: la zona de agotamiento <b>se ensancha</b> y solo circula una corriente ínfima (nA en silicio), la <b>corriente inversa de saturación</b> $I_S$. Toda la tensión de la fuente queda sobre el diodo.</p>
</div>
</div>

<h2>5. Curva característica I‑V y ecuación de Shockley</h2>
<div class="caja formula"><span class="caja-titulo">Ecuación del diodo (Shockley)</span>
$$I_D = I_S\left(e^{\frac{V_D}{n\,V_T}}-1\right)$$
<ul>
<li>$I_S$: corriente inversa de saturación (muy chica: pA a nA en Si; µA en Ge).</li>
<li>$V_T = \dfrac{kT}{q}\approx 25\,\text{mV}$ a temperatura ambiente (26 mV a 27 °C): la <b>tensión térmica</b>.</li>
<li>$n$: factor de idealidad, entre 1 y 2 según el diodo.</li>
</ul>
</div>
<ul>
<li><b>En directa</b> ($V_D$ de algunas décimas de volt), la exponencial domina: $I_D\approx I_S\,e^{V_D/(nV_T)}$. Con $n=1$, <b>cada 60 mV más, la corriente se multiplica por 10</b> ($V_T\ln 10\approx 58\,\text{mV}$). Por eso parece que el diodo “arranca” de golpe en ≈ 0,6–0,7 V: por debajo la corriente es microscópica y por encima crece violentamente.</li>
<li><b>En inversa</b> ($V_D$ negativa de más de unas décimas), $e^{V_D/nV_T}\to 0$ y queda $I_D\approx -I_S$: casi nada.</li>
<li><b>Ruptura:</b> si la tensión inversa supera cierto valor ($V_{BR}$, por ejemplo 100 V en el 1N4148 o 1000 V en el 1N4007), el campo es tan fuerte que arranca electrones en avalancha y la corriente inversa crece de golpe. Un diodo común se destruye; un <b>zener</b> está diseñado para trabajar ahí (tema 13).</li>
</ul>
<div class="tabla-wrap"><table class="tabla">
<tr><th>Tipo</th><th>Tensión umbral típica $V_\gamma$</th><th>Corriente inversa</th><th>Uso típico</th></tr>
<tr><td>Silicio (1N4148, 1N4007)</td><td>≈ 0,6 – 0,7 V</td><td>nA</td><td>Uso general, rectificación</td></tr>
<tr><td>Germanio (1N34A, OA91)</td><td>≈ 0,2 – 0,3 V</td><td>µA (alta)</td><td>Detectores de radio AM, equipos viejos</td></tr>
<tr><td>Schottky (1N5817, BAT85)</td><td>≈ 0,2 – 0,4 V</td><td>µA (alta)</td><td>Fuentes conmutadas, protección, alta velocidad</td></tr>
<tr><td>LED (tema 10)</td><td>≈ 1,2 – 3,3 V según color</td><td>muy baja</td><td>Iluminación, señalización</td></tr>
</table></div>
<div class="caja ojo"><span class="caja-titulo">El diodo y la temperatura</span>
Con la temperatura la tensión directa <b>baja unos 2 mV por cada °C</b> (a corriente constante) y la corriente inversa <b>se duplica cada ≈ 10 °C</b>. Esto se usa para hacer sensores de temperatura (¡un 1N4148 sirve de termómetro!).
</div>

<h2>6. Modelos del diodo: ¿qué tan “fino” calculo?</h2>
<p>Resolver la ecuación exponencial a mano es engorroso. En la práctica se usan <b>modelos simplificados</b>:</p>
${modelosSVG()}
<ol>
<li><b>Ideal:</b> en directa es un cortocircuito (0 V), en inversa un circuito abierto. Sirve para entender qué hace un circuito, o cuando las tensiones son mucho mayores que 0,7 V.</li>
<li><b>Con caída constante (0,7 V):</b> en directa es una “pila” de 0,7 V (0,3 V en Ge/Schottky); en inversa, abierto. <b>Es el que más vamos a usar.</b></li>
<li><b>Con caída + resistencia:</b> agrega una resistencia dinámica $r_d$ en serie (de unos ohms a decenas de ohms). Sirve con corrientes grandes, donde la tensión del diodo sube a 0,8 – 1 V.</li>
</ol>
<div class="caja tip"><span class="caja-titulo">¿Cuándo alcanza cada modelo?</span>
Si la fuente es <b>mucho mayor</b> que 0,7 V (por ejemplo 12 V), el error del modelo ideal es chico (≈ 6 %) y el de 0,7 V es despreciable. Si la fuente es de 1 – 2 V, el ideal da cualquier cosa y hasta el de 0,7 V puede errar bastante: ahí conviene la ecuación o la simulación. Lo vas a ver en la simulación 2.
</div>

<h2>7. Recta de carga y punto Q</h2>
<p>En el circuito más simple (fuente $V$, resistencia $R$ y diodo en serie) tenemos dos condiciones que se tienen que cumplir a la vez:</p>
<ul>
<li>El diodo impone su curva: $I_D = I_S\left(e^{V_D/nV_T}-1\right)$.</li>
<li>La malla (LKT) impone: $V = I_D\,R + V_D$ → $I_D = \dfrac{V - V_D}{R}$. Esta es la <b>recta de carga</b>: corta el eje de corriente en $V/R$ (diodo en corto) y el de tensión en $V$ (diodo abierto).</li>
</ul>
<p>El <b>punto de trabajo Q</b> es donde se cruzan: el único par $(V_D, I_D)$ que satisface las dos cosas. Gráficamente es muy claro, y numéricamente se resuelve por <b>iteración</b> o por <b>bisección</b> (que es lo que hace la simulación).</p>
<div class="caja ejemplo"><span class="caja-titulo">Ejemplo resuelto: V = 5 V, R = 1 kΩ, 1N4148</span>
<ul>
<li><b>Modelo ideal:</b> $I_D=\frac{5}{1\,\text{k}\Omega}=5\,\text{mA}$, $V_D=0$.</li>
<li><b>Modelo 0,7 V:</b> $I_D=\frac{5-0{,}7}{1\,\text{k}\Omega}=4{,}3\,\text{mA}$.</li>
<li><b>Shockley</b> ($I_S=2{,}52\,\text{nA}$, $n=1{,}75$): resolviendo, $V_D=0{,}650\,\text{V}$ e $I_D=4{,}35\,\text{mA}$.</li>
</ul>
Error del ideal: $\frac{5-4{,}35}{4{,}35}=+15\,\%$. Error del modelo 0,7 V: $\frac{4{,}30-4{,}35}{4{,}35}=-1{,}1\,\%$. ¡El modelo de 0,7 V alcanza y sobra!
</div>
<div class="caja idea"><span class="caja-titulo">Resolver por iteración (a mano o con calculadora)</span>
<ol>
<li>Suponé $V_D=0{,}7\,\text{V}$ y calculá $I_D=(V-V_D)/R$.</li>
<li>Con esa corriente, recalculá $V_D=nV_T\ln(I_D/I_S)$.</li>
<li>Repetí 2 o 3 veces: converge enseguida porque el logaritmo cambia muy poco.</li>
</ol>
</div>

<h2>8. La hoja de datos: 1N4148 y 1N4007</h2>
<div class="tabla-wrap"><table class="tabla">
<tr><th>Parámetro</th><th>Significado</th><th>1N4148 (señal)</th><th>1N4007 (rectificador)</th></tr>
<tr><td>$V_{RRM}$</td><td>Máxima tensión inversa repetitiva</td><td>100 V</td><td>1000 V</td></tr>
<tr><td>$I_{F(AV)}$</td><td>Corriente directa promedio máxima</td><td>150 mA (200 mA según fabricante)</td><td>1 A</td></tr>
<tr><td>$I_{FSM}$</td><td>Corriente de pico no repetitiva (sobrecorriente breve)</td><td>2 A (pulso de 1 µs)</td><td>30 A (medio ciclo de 50/60 Hz)</td></tr>
<tr><td>$V_F$</td><td>Tensión directa a una corriente dada</td><td>≤ 1 V a 10 mA</td><td>≤ 1,1 V a 1 A</td></tr>
<tr><td>$I_R$</td><td>Corriente inversa</td><td>≤ 25 nA a 20 V</td><td>≤ 5 µA a 1000 V</td></tr>
<tr><td>$t_{rr}$</td><td>Tiempo de recuperación inversa (velocidad)</td><td>≈ 4 ns (rápido)</td><td>≈ 2 µs (lento)</td></tr>
</table></div>
<p>El <b>1N4148</b> es de señal: chico, rápido, para corrientes bajas (lógica, protección de entradas). El <b>1N4007</b> es de potencia: aguanta 1 A y 1000 V, pero es lento; ideal para rectificar los 50 Hz de la red. La familia 1N4001…1N4007 solo cambia la $V_{RRM}$ (50 V a 1000 V).</p>
<div class="caja ojo"><span class="caja-titulo">Regla de diseño</span>
Trabajá con margen: corriente promedio menor que el 50 – 70 % de $I_{F(AV)}$ y tensión inversa menor que el 70 % de $V_{RRM}$. Y fijate que $V_F$ en la hoja de datos es el <b>máximo</b> a esa corriente: el valor típico es menor.
</div>

<h2>9. Cómo probar un diodo con el multímetro</h2>
<ol>
<li>Poné el multímetro en la posición <b>diodo</b> (símbolo ▶|). En ese modo el instrumento inyecta una corriente chica (≈ 1 mA) y muestra la tensión.</li>
<li><b>Punta roja al ánodo, negra al cátodo</b>: un diodo de silicio sano muestra ≈ <b>0,5 – 0,7 V</b> (en pantalla suele verse “550” a “700”, en mV). Germanio o Schottky: ≈ 0,15 – 0,35 V. Un LED puede llegar a prender tenuemente.</li>
<li><b>Invertí las puntas</b>: tiene que mostrar <b>“OL”</b> o “1” (fuera de rango): no conduce.</li>
</ol>
<div class="tabla-wrap"><table class="tabla">
<tr><th>Directa</th><th>Inversa</th><th>Diagnóstico</th></tr>
<tr><td>≈ 0,6 V</td><td>OL</td><td>Diodo sano</td></tr>
<tr><td>≈ 0 V</td><td>≈ 0 V</td><td>En cortocircuito (quemado)</td></tr>
<tr><td>OL</td><td>OL</td><td>Abierto (cortado). Ojo: también puede ser un LED o algo con $V_F$ mayor que la que puede dar el instrumento</td></tr>
<tr><td>≈ 0,6 V</td><td>valor bajo (no OL)</td><td>Con fugas: no confiable</td></tr>
</table></div>
<div class="caja tip"><span class="caja-titulo">Medir en placa</span>
Si el diodo está soldado, otros componentes en paralelo pueden falsear la medición. Ante la duda, desoldá una pata.
</div>

<h2>10. Identificar el cátodo</h2>
${diodoFisico()}
<ul>
<li>En diodos de vidrio (1N4148) la banda es negra; en los negros (1N4007), gris o plateada.</li>
<li>En SMD hay una línea o una muesca del lado del cátodo.</li>
<li>Para recordar: <b>la flecha del símbolo apunta hacia donde va la corriente convencional</b> (de A a K) y la “rayita” es la banda.</li>
</ul>
`,

    simulaciones: [
      {
        titulo: 'Circuito con diodo: curva I‑V, recta de carga y punto Q',
        descripcion: 'Variá la tensión de la fuente (incluso negativa), la resistencia y el tipo de diodo. El punto Q se calcula resolviendo la ecuación de Shockley con bisección.',
        montar(cont, H) {
          const { controles, vista } = H.layout(cont);
          const vs = H.slider(controles, { label: 'Tensión de la fuente V', min: -10, max: 10, step: 0.05, value: 5, unidad: 'V', onInput: upd });
          const rs = H.slider(controles, { label: 'Resistencia R', min: 10, max: 10000, log: true, value: 1000, unidad: 'Ω', onInput: upd });
          const tipo = H.select(controles, { label: 'Tipo de diodo', opciones: Object.entries(TIPOS).map(([v, d]) => ({ v, t: d.nombre })), value: 'si', onChange: upd });
          const inv = H.check(controles, { label: 'Invertir el diodo (cátodo hacia R)', value: false, onChange: upd });
          H.sep(controles);
          const zoom = H.check(controles, { label: 'Zoom a la “rodilla” (−0,4 V a 1 V)', value: false, onChange: upd });
          const fig = H.el('div'); vista.append(fig);
          vista.append(H.el('div', { style: 'font-size:.82rem;font-weight:600;display:flex;gap:14px;flex-wrap:wrap' },
            '<span style="color:var(--c1)">━ curva del diodo (Shockley)</span><span style="color:var(--c2)">╍ recta de carga: ID = (V − VD)/R</span><span style="color:var(--c4)">● punto Q</span>'));
          const cv = H.canvas(vista, { alto: w => w >= 560 ? 310 : 290, dibujar });
          const lec = H.lecturas(vista);
          const nota = H.nota(vista);
          let S = {};

          function dibujar(ctx, w, h) {
            const { Veff, R, d, q } = S;
            const Isc = Veff / R;
            let xmin, xmax, ymin, ymax;
            if (zoom.value) {
              xmin = -0.4; xmax = 1.0;
              const ref = Math.max(Math.abs(Isc), 1e-4);
              ymin = -0.08 * ref; ymax = 1.2 * ref;
            } else {
              xmin = Veff < 0 ? Veff * 1.08 - 0.2 : -1; xmax = Veff > 0 ? Math.max(1.2, Veff * 1.08) : 1;
              const ref = Math.max(Math.abs(Isc), 1e-5);
              if (Veff > 0) { ymin = -0.08 * ref; ymax = 1.2 * ref; } else { ymin = -1.2 * ref; ymax = 0.25 * ref; }
            }
            const P = ejesF(ctx, w, h, { xmin, xmax, ymin, ymax, yfmt: t => H.fmt(t, 'A', 2), xfmt: t => H.num(t, 2), xlabel: 'VD: tensión del diodo (V)', ylabel: 'ID: corriente del diodo', ml: 62 });
            // curva del diodo
            if (d.Is === 0) {
              P.pts([[xmin, 0], [0, 0], [0, ymax * 2]], { color: H.col('c1'), ancho: 2.5 });
            } else {
              P.fn(v => Ishock(v, d), { color: H.col('c1'), ancho: 2.5, n: 800 });
            }
            // recta de carga: ID = (Veff − VD)/R
            P.fn(v => (Veff - v) / R, { color: H.col('c2'), ancho: 2, guiones: [7, 4] });
            // punto Q y proyecciones
            P.vline(q.vd, { color: H.col('muted'), ancho: 1 });
            P.hline(q.id, { color: H.col('muted'), ancho: 1 });
            P.punto(q.vd, q.id, { color: H.col('c4'), r: 6, label: 'Q' });
          }

          function upd() {
            const V = vs.value, R = rs.value, d = TIPOS[tipo.value], invertido = inv.value;
            const Veff = invertido ? -V : V;          // el diodo "ve" la fuente al revés
            const q = resolver(Veff, R, d);
            S = { Veff, R, d, q };
            const Icirc = invertido ? -q.id : q.id;   // corriente de malla (sentido horario, sale del + de la fuente)
            const VR = Icirc * R;
            const flechaI = Math.abs(Icirc) < 1e-6 ? Esq.texto(155, 62, 'I ≈ 0', { color: 'var(--red)', size: 12 })
              : Icirc > 0 ? Esq.flecha(130, 55, 180, 55, 'I') : Esq.flecha(180, 55, 130, 55, 'I');
            fig.innerHTML = Esq.svg(360, 190, [
              Esq.fuenteV(50, 70, 50, 140, 'V', H.fmt(V, 'V'), -1), Esq.cable([[50, 70], [50, 30], [110, 30]]),
              Esq.R(110, 30, 200, 30, 'R', H.fmt(R, 'Ω'), 1), Esq.cable([[200, 30], [270, 30], [270, 65]]),
              invertido ? Esq.D(270, 135, 270, 65, 'D', d.nombre.split(' ')[0], 1) : Esq.D(270, 65, 270, 135, 'D', d.nombre.split(' ')[0], 1),
              Esq.cable([[270, 135], [270, 170], [50, 170], [50, 140]]), flechaI,
              Esq.texto(225, 105, 'VD', { color: 'var(--c1)', size: 12 }),
              invertido ? Esq.pm(250, 125, 250, 75) : Esq.pm(250, 75, 250, 125),
            ]);
            cv.redibujar();
            const conduce = q.id > 1e-4 * Math.max(Math.abs(Veff) / R, 1e-9) && q.id > 1e-7;
            lec.set([
              { k: 'VD (ánodo − cátodo)', v: H.fmt(q.vd, 'V'), estado: conduce ? 'ok' : '' },
              { k: 'ID (de ánodo a cátodo)', v: H.fmt(q.id, 'A'), estado: conduce ? 'ok' : '' },
              { k: 'VR (sobre la resistencia)', v: H.fmt(VR, 'V') },
              { k: 'Potencia en el diodo', v: H.fmt(Math.abs(q.vd * q.id), 'W') },
              { k: 'Estado', v: Veff > 0 ? (conduce ? 'Directa: conduce' : 'Directa, bajo umbral') : 'Inversa: bloquea' },
            ]);
            let t;
            if (Veff <= 0) t = `<b>Polarización inversa:</b> el cátodo está a mayor tensión que el ánodo. Solo circula la corriente inversa de saturación (${H.fmt(Math.abs(q.id), 'A')}) y <b>casi toda la tensión de la fuente queda sobre el diodo</b> (VD = ${H.fmt(q.vd, 'V')}). ${tipo.value === 'si' ? 'Probá con germanio o Schottky: su corriente inversa es miles de veces mayor.' : tipo.value === 'ideal' ? '' : 'Fijate que la corriente inversa de este diodo es mucho mayor que la del silicio.'}`;
            else if (!conduce || q.vd < 0.8 * d.vg && d.Is) t = `<b>Directa, pero por debajo del umbral:</b> la fuente (${H.fmt(Veff, 'V')}) no alcanza para vencer bien la barrera de ≈ ${H.num(d.vg, 1)} V. La corriente es chica y la recta de carga corta a la curva en la zona “plana”.`;
            else t = `<b>Polarización directa:</b> el diodo conduce y su tensión se queda en ≈ ${H.fmt(q.vd, 'V')}, casi sin importar cuánta corriente pase (la curva es casi vertical). El resto de la tensión (${H.fmt(VR, 'V')}) cae sobre R, que es la que <b>limita la corriente</b>. Con el modelo de ${H.num(d.vg, 1)} V: ID ≈ ${H.fmt(Math.max(0, Veff - d.vg) / R, 'A')}.`;
            if (inv.value) t += ' <b>El diodo está invertido:</b> ahora conduce cuando la fuente es negativa.';
            nota.innerHTML = t;
          }
          upd();
        },
      },
      {
        titulo: 'Comparación de modelos: ¿cuándo alcanza el modelo simple?',
        descripcion: 'Misma configuración (fuente + R + diodo). Se compara la corriente calculada con el modelo ideal, con 0,7 V (o 0,3 V) y con la ecuación de Shockley, que tomamos como “la verdad”.',
        montar(cont, H) {
          const { controles, vista } = H.layout(cont);
          const vs = H.slider(controles, { label: 'Tensión de la fuente V', min: 0.2, max: 20, log: true, value: 2, unidad: 'V', onInput: upd });
          const rs = H.slider(controles, { label: 'Resistencia R', min: 10, max: 10000, log: true, value: 1000, unidad: 'Ω', onInput: upd });
          const tipo = H.select(controles, { label: 'Tipo de diodo', opciones: ['si', 'ge', 'sch'].map(v => ({ v, t: TIPOS[v].nombre })), value: 'si', onChange: upd });
          const cv = H.canvas(vista, { alto: w => w >= 560 ? 380 : 400, dibujar });
          const lec = H.lecturas(vista);
          const nota = H.nota(vista);
          const VMAX = 20;
          const calc = (V, R, d) => {
            const sh = resolver(V, R, d).id;
            const id0 = V / R, id7 = Math.max(0, (V - d.vg) / R);
            return { sh, id0, id7, e0: (id0 - sh) / sh * 100, e7: (id7 - sh) / sh * 100 };
          };

          function dibujar(ctx, w, h) {
            const V = vs.value, R = rs.value, d = TIPOS[tipo.value];
            const h1 = Math.round(h * 0.52);
            const lx = (t) => H.num(t, 0);
            // panel 1: corriente vs. tensión de fuente
            const P = ejesF(ctx, w, h1, { xmin: 0, xmax: VMAX, ymin: 0, ymax: VMAX / R * 1.05, xfmt: lx, yfmt: t => H.fmt(t, 'A', 2), ylabel: 'ID según cada modelo', ml: 62, mb: 22 });
            P.fn(v => v / R, { color: H.col('c2'), ancho: 2 });
            P.fn(v => Math.max(0, (v - d.vg) / R), { color: H.col('c3'), ancho: 2 });
            P.fn(v => resolver(v, R, d).id, { color: H.col('c1'), ancho: 2.5, guiones: [6, 3], n: 250 });
            P.vline(V, { color: H.col('muted') });
            // leyenda
            ctx.save(); ctx.font = '600 11px sans-serif'; ctx.textAlign = 'right';
            const lx0 = P.x0 + P.w - 8;
            [['ideal', 'c2'], ['con ' + H.num(d.vg, 1) + ' V', 'c3'], ['Shockley (real)', 'c1']].forEach(([t, c], i) => { ctx.fillStyle = H.col(c); ctx.fillText(t, lx0, P.y0 + P.h - 12 - 15 * (2 - i)); });
            ctx.restore();
            // panel 2: error %
            const E = ejesF(ctx, w, h, { y0: h1 + 26, h: h - h1 - 74, xmin: 0, xmax: VMAX, ymin: -60, ymax: 100, yticks: [-50, 0, 50, 100], xfmt: lx, yfmt: t => t + ' %', ylabel: 'error respecto de Shockley', xlabel: 'tensión de la fuente (V)', ml: 62 });
            E.clip(() => { ctx.fillStyle = H.col('green'); ctx.globalAlpha = 0.13; ctx.fillRect(E.x0, E.Y(10), E.w, E.Y(-10) - E.Y(10)); });
            E.texto(VMAX, 10, '±10 %: “alcanza”', { color: H.col('green'), align: 'right', base: 'bottom', dx: -4, dy: -2, font: '600 10px sans-serif' });
            E.fn(v => calc(v, R, d).e0, { color: H.col('c2'), ancho: 2, desde: 0.05, n: 300 });
            E.fn(v => calc(v, R, d).e7, { color: H.col('c3'), ancho: 2, desde: 0.05, n: 300 });
            E.vline(V, { color: H.col('muted') });
            const c = calc(V, R, d);
            E.punto(V, Math.max(-60, Math.min(100, c.e0)), { color: H.col('c2'), r: 4 });
            E.punto(V, Math.max(-60, Math.min(100, c.e7)), { color: H.col('c3'), r: 4 });
          }

          function upd() {
            const V = vs.value, R = rs.value, d = TIPOS[tipo.value];
            const c = calc(V, R, d);
            cv.redibujar();
            const est = (e) => Math.abs(e) <= 5 ? 'ok' : Math.abs(e) <= 15 ? 'alerta' : 'mal';
            lec.set([
              { k: 'ID Shockley (real)', v: H.fmt(c.sh, 'A') },
              { k: 'ID ideal = V/R', v: H.fmt(c.id0, 'A') },
              { k: 'Error ideal', v: (c.e0 >= 0 ? '+' : '') + H.num(c.e0, 1) + ' %', estado: est(c.e0) },
              { k: 'ID con ' + H.num(d.vg, 1) + ' V', v: H.fmt(c.id7, 'A') },
              { k: 'Error con ' + H.num(d.vg, 1) + ' V', v: (c.e7 >= 0 ? '+' : '') + H.num(c.e7, 1) + ' %', estado: est(c.e7) },
              { k: 'VD real', v: H.fmt(V - c.sh * R, 'V') },
            ]);
            let t;
            if (V >= 10 * d.vg * 2) t = `<b>V ≫ ${H.num(d.vg, 1)} V:</b> los dos modelos andan bien. Hasta el ideal erra solo ${H.num(c.e0, 1)} %. En estos casos, para entender el circuito, pensar el diodo como una llave alcanza.`;
            else if (V > 3 * d.vg) t = `<b>Zona intermedia:</b> el modelo ideal ya erra ${H.num(c.e0, 0)} %, pero el de ${H.num(d.vg, 1)} V sigue muy bien (${H.num(c.e7, 1)} %). Es el modelo que conviene usar casi siempre.`;
            else t = `<b>Fuente comparable con la tensión del diodo:</b> el ideal no sirve (${H.num(c.e0, 0)} %) y el de ${H.num(d.vg, 1)} V también se equivoca (${H.num(c.e7, 0)} %), porque acá la tensión real del diodo (${H.fmt(V - c.sh * R, 'V')}) no es ${H.num(d.vg, 1)} V. Hay que usar la ecuación o simular.`;
            t += ' Probá cambiar R: con R chica la corriente es grande y la tensión real del diodo sube por encima de 0,7 V (la curva sigue subiendo).';
            nota.innerHTML = t;
          }
          upd();
        },
      },
    ],

    ejercicios: [
      {
        nivel: 'Básico',
        enunciado: String.raw`Un diodo de silicio en serie con una resistencia de $1\,\text{k}\Omega$ se conecta a $12\,\text{V}$ en directa. Calculá la corriente con el modelo ideal y con el de 0,7 V. ¿Qué diferencia porcentual hay entre ellos?`,
        pista: String.raw`Ideal: $I=V/R$. Con caída: $I=(V-0{,}7)/R$.`,
        solucion: String.raw`Ideal: $I=\frac{12}{1}=12\,\text{mA}$. Con 0,7 V: $I=\frac{12-0{,}7}{1}=11{,}3\,\text{mA}$.<br>Diferencia: $\frac{12-11{,}3}{11{,}3}=6{,}2\,\%$. Con Shockley da $11{,}31\,\text{mA}$ ($V_D=0{,}694\,\text{V}$): el modelo de 0,7 V es prácticamente exacto.`,
      },
      {
        nivel: 'Básico',
        enunciado: String.raw`El mismo circuito del ejercicio 1, pero con el diodo dado vuelta (cátodo hacia el + de la fuente). ¿Cuánto vale la corriente, la tensión en la resistencia y la tensión en el diodo?`,
        pista: 'En inversa el diodo es (casi) un circuito abierto.',
        solucion: String.raw`El diodo está en inversa: $I\approx0$ (solo unos nA). Entonces $V_R=I\cdot R\approx0$ y, por LKT, <b>toda la tensión queda sobre el diodo</b>: $V_D=-12\,\text{V}$ (medida de ánodo a cátodo). Como el 1N4148 aguanta 100 V en inversa, no hay problema.`,
      },
      {
        nivel: 'Intermedio',
        enunciado: String.raw`Dos diodos 1N4148 en serie (en directa) y una resistencia de $330\,\Omega$ se alimentan con $5\,\text{V}$. Calculá la corriente con el modelo de 0,7 V y la potencia en cada diodo.`,
        pista: String.raw`Cada diodo resta 0,7 V: $I=(V-2\cdot0{,}7)/R$.`,
        solucion: String.raw`$I=\frac{5-1{,}4}{330}=\frac{3{,}6}{330}=10{,}9\,\text{mA}$.<br>Potencia en cada diodo: $P=0{,}7\cdot0{,}0109=7{,}6\,\text{mW}$ (muy por debajo de lo que aguanta: 500 mW).`,
      },
      {
        nivel: 'Intermedio',
        enunciado: String.raw`Querés poner un 1N4148 en serie con una carga resistiva alimentada con $9\,\text{V}$ como protección contra polaridad invertida. La carga es de $47\,\Omega$. ¿Es adecuado el 1N4148 ($I_{F(AV)}=150\,\text{mA}$)? Si no, ¿qué diodo usarías?`,
        pista: 'Calculá la corriente con el modelo de 0,7 V y comparala con la máxima.',
        solucion: String.raw`$I=\frac{9-0{,}7}{47}=177\,\text{mA}$, más que los 150 mA del 1N4148: <b>no sirve</b> (se calentaría y podría fallar). Hay que usar un 1N4007 (1 A, con margen de sobra). Mejor todavía un Schottky (1N5817, 1 A) porque cae solo ≈ 0,3 V y la carga recibe más tensión.`,
      },
      {
        nivel: 'Avanzado',
        enunciado: String.raw`Un diodo cumple Shockley con $I_S=10^{-14}\,\text{A}$, $n=1$ y $V_T=25\,\text{mV}$. Calculá la tensión directa para $1\,\text{mA}$ y para $10\,\text{mA}$. ¿Cuánto aumentó la tensión al multiplicar la corriente por 10?`,
        pista: String.raw`Para $I\gg I_S$: $V_D=nV_T\ln\frac{I_D}{I_S}$.`,
        solucion: String.raw`$V_D(1\,\text{mA})=0{,}025\ln\frac{10^{-3}}{10^{-14}}=0{,}025\ln(10^{11})=0{,}025\cdot25{,}33=0{,}633\,\text{V}$.<br>$V_D(10\,\text{mA})=0{,}025\ln(10^{12})=0{,}025\cdot27{,}63=0{,}691\,\text{V}$.<br>Aumentó $0{,}025\ln10=57{,}6\,\text{mV}$: ¡corriente ×10 con menos de 60 mV más! Por eso la curva parece vertical.`,
      },
      {
        nivel: 'Avanzado',
        enunciado: String.raw`Resolvé por iteración el circuito $V=2\,\text{V}$, $R=100\,\Omega$ con el diodo del ejercicio anterior. Compará con el modelo de 0,7 V.`,
        pista: String.raw`Arrancá con $V_D=0{,}7\,\text{V}$, calculá $I=(2-V_D)/100$, y con esa $I$ recalculá $V_D=0{,}025\ln(I/10^{-14})$. Repetí.`,
        solucion: String.raw`Iteración 1: $I=\frac{2-0{,}7}{100}=13{,}0\,\text{mA}$ → $V_D=0{,}025\ln(1{,}3\cdot10^{12})=0{,}6974\,\text{V}$.<br>Iteración 2: $I=\frac{2-0{,}6974}{100}=13{,}03\,\text{mA}$ → $V_D=0{,}6974\,\text{V}$ (ya no cambia).<br>Resultado: $V_D\approx0{,}697\,\text{V}$, $I_D\approx13{,}0\,\text{mA}$. El modelo de 0,7 V da $13{,}0\,\text{mA}$: error de 0,2 %.`,
      },
      {
        nivel: 'Avanzado',
        enunciado: String.raw`Un 1N4148 alimentado con corriente constante tiene $V_D=0{,}62\,\text{V}$ a 25 °C. ¿Qué tensión esperás a 75 °C? ¿Cómo podrías usar esto con un Arduino?`,
        pista: String.raw`Coeficiente típico: $-2\,\text{mV/°C}$.`,
        solucion: String.raw`$\Delta T=50\,\text{°C}$ → $\Delta V=-2\cdot50=-100\,\text{mV}$ → $V_D\approx0{,}52\,\text{V}$.<br>Con una resistencia desde 5 V (por ejemplo 4,7 kΩ ≈ 1 mA) y el diodo a masa, se mide $V_D$ con una entrada analógica: cada °C cambia ≈ 2 mV (≈ 0,4 cuentas del ADC de 10 bits, así que conviene amplificar o usar la referencia interna de 1,1 V).`,
      },
    ],

    quiz: [
      { pregunta: '¿Qué portadores son mayoritarios en un semiconductor tipo P?', opciones: ['Electrones', 'Huecos', 'Protones', 'Iones positivos móviles'], correcta: 1, explicacion: 'El dopante (boro, 3 electrones de valencia) deja enlaces incompletos: huecos, que se comportan como cargas positivas móviles.' },
      { pregunta: 'En polarización directa, el + de la fuente se conecta…', opciones: ['Al cátodo', 'Al ánodo', 'A cualquiera de los dos', 'A masa'], correcta: 1, explicacion: 'Directa: ánodo (P) más positivo que el cátodo (N). La flecha del símbolo indica el sentido de la corriente convencional.' },
      { pregunta: 'Según Shockley (n = 1), para multiplicar por 10 la corriente de un diodo hay que subir su tensión aproximadamente…', opciones: ['0,7 V', '60 mV', '10 veces', '1 V'], correcta: 1, explicacion: 'VT·ln(10) ≈ 25 mV · 2,3 ≈ 58 mV. Por eso la curva parece vertical a partir de ~0,6 V.' },
      { pregunta: 'Un multímetro en modo diodo marca 0,62 en un sentido y OL en el otro. El diodo está…', opciones: ['En corto', 'Abierto', 'Sano', 'Con fugas'], correcta: 2, explicacion: 'Conduce en directa con ≈ 0,6 V (silicio) y bloquea en inversa: comportamiento normal.' },
      { pregunta: 'Fuente de 20 V, R = 2 kΩ, diodo de silicio. ¿Qué modelo alcanza para calcular la corriente con error menor al 5 %?', opciones: ['Solo Shockley', 'El de 0,7 V (y casi el ideal)', 'Ninguno', 'Solo el ideal'], correcta: 1, explicacion: 'Con V ≫ 0,7 V: ideal 10 mA (≈ 3,5 % de error), con 0,7 V 9,65 mA (≈ exacto).' },
      { pregunta: 'En la hoja de datos, VRRM indica…', opciones: ['La tensión directa a 1 A', 'La máxima tensión inversa repetitiva que soporta', 'La corriente máxima', 'El tiempo de recuperación'], correcta: 1, explicacion: 'VRRM: tensión inversa máxima repetitiva. 1N4148: 100 V; 1N4007: 1000 V.' },
    ],

    docente: String.raw`
<h3>Objetivo de la clase</h3>
<p>Que el alumno entienda <b>por qué</b> el diodo conduce en un solo sentido (unión PN, barrera), que sepa leer la curva I‑V y que resuelva circuitos con el modelo adecuado (casi siempre el de 0,7 V), sabiendo cuándo ese modelo deja de servir. <b>Duración sugerida:</b> 2 clases (física de semiconductores + circuitos).</p>
<h3>Secuencia sugerida</h3>
<p><b>Clase 1 — física (60–80 min)</b></p>
<ol>
<li><b>Disparador (5 min):</b> “¿Qué tiene que hacer un cargador de celular para convertir 220 V alterna en 5 V continua?” Aparece la idea de “dejar pasar en un sentido”.</li>
<li><b>Semiconductores y dopaje (20 min):</b> secciones 1 y 2. Dibujá la red de silicio con 4 enlaces; agregá un fósforo (sobra un electrón) y un boro (falta uno). Contá la analogía de las butacas para los huecos. Insistí: N y P son neutros.</li>
<li><b>Unión PN (15 min):</b> sección 3 con la figura. Preguntá: “si los electrones se difunden, ¿por qué no se mezclan todos?” → el campo de los iones los frena.</li>
<li><b>Polarización (15 min):</b> sección 4. Usá la simulación 1 con el slider de tensión de −10 a +10 V, sin explicar antes: “¿qué notás cuando la fuente es negativa?”.</li>
</ol>
<p><b>Clase 2 — circuitos (60–80 min)</b></p>
<ol>
<li><b>Curva y Shockley (15 min):</b> mostrá la regla “60 mV por década” con el ejercicio 5. Activá el zoom a la rodilla en la simulación 1 y compará Si, Ge y Schottky.</li>
<li><b>Recta de carga (15 min):</b> en la simulación 1, bajá R a 100 Ω y subila a 10 kΩ: la recta pivota alrededor de V y el punto Q se mueve, pero VD casi no cambia. Pregunta clave: “¿quién decide la corriente, el diodo o la resistencia?” (la resistencia).</li>
<li><b>Modelos (15 min):</b> simulación 2. Poné V = 20 V y bajá hasta 1 V. Que el alumno diga a partir de qué tensión el modelo ideal “se rompe” (≈ 7 V para 10 % de error).</li>
<li><b>Hoja de datos y multímetro (15 min):</b> secciones 8–10. Si tiene diodos y multímetro, que mida en vivo.</li>
<li><b>Cierre:</b> autoevaluación; tarea: ejercicios 3, 4 y 6.</li>
</ol>
<h3>Errores frecuentes</h3>
<ul>
<li>Creer que el diodo “consume” 0,7 V y por eso la corriente es la que él quiere: la corriente la fija el resto del circuito.</li>
<li>Conectar un diodo directo a una fuente sin resistencia (la curva exponencial hace que la corriente se dispare).</li>
<li>Confundir el sentido: la flecha es la corriente convencional (+ a −), no la de electrones.</li>
<li>Pensar que en inversa la tensión del diodo es 0 (es justo al revés: toda la tensión queda sobre él).</li>
<li>Decir que N tiene carga negativa.</li>
</ul>
<h3>Preguntas para hacerle pensar</h3>
<ul>
<li>¿Por qué los equipos con pila suelen tener un diodo en serie con la entrada? (protección de polaridad)</li>
<li>¿Por qué en una fuente conmutada se prefiere un Schottky? (menos caída → menos pérdida, y más rápido)</li>
<li>Si la tensión del diodo baja con la temperatura y la corriente sube… ¿qué pasa si dos diodos en paralelo comparten corriente? (embalamiento: anticipa LEDs en paralelo, tema 10)</li>
</ul>
<h3>Recordatorio rápido para vos</h3>
<ul>
<li>$V_T=kT/q$: 25,85 mV a 300 K. $\ln 10\cdot V_T\approx 59,5\,\text{mV}$.</li>
<li>Parámetros SPICE 1N4148: IS = 2,52 nA, N = 1,752, RS = 0,568 Ω, BV = 100 V, TT = 20 ns. 1N4007: IS ≈ 7 nA, N ≈ 1,8, RS ≈ 0,04 Ω.</li>
<li>Resistencia dinámica: $r_d = nV_T/I_D$ (≈ 26 Ω a 1 mA con n = 1).</li>
<li>Coeficiente térmico de $V_F$: ≈ −2 mV/°C; $I_S$ se duplica cada ≈ 5 °C (la corriente inversa medida, que incluye fugas, cada ≈ 10 °C).</li>
<li>Ancho de banda prohibida: Si 1,12 eV; Ge 0,66 eV; GaAs 1,42 eV.</li>
</ul>
<h3>Experiencia práctica</h3>
<p><b>En casa:</b> con una pila de 9 V, una resistencia de 1 kΩ y un 1N4007 (o 1N4148), medir VD y VR en directa y en inversa. Variante: tres pilas (1,5 / 3 / 9 V) y comparar con el modelo de 0,7 V (repite la simulación 2 en la realidad).</p>
<p><b>Simulador:</b> en <b>Falstad</b> (falstad.com/circuit) el menú “Circuits → Basics → Diode” muestra la curva I‑V en el osciloscopio; en <b>Tinkercad</b> se puede armar fuente + R + diodo con multímetros.</p>
`,
  });
})();
