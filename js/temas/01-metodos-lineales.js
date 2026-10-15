/* Tema 01 — Métodos lineales (repaso)
   IMPORTANTE: los textos con LaTeX usan String.raw`...` para que "\frac" no se rompa. */
registrarTema({
  id: 'metodos-lineales',
  orden: 1,
  titulo: 'Métodos lineales (repaso)',
  resumen: 'Ohm, Kirchhoff, divisores, mallas y Thévenin',
  confirmar: false,

  teoria: String.raw`
<p>Antes de meternos con diodos y transistores, repasamos las herramientas para <b>resolver circuitos</b>. Se llaman <em>lineales</em> porque los componentes (resistencias y fuentes ideales) cumplen que <b>si duplicás la causa, se duplica el efecto</b>: si duplicás la tensión, se duplica la corriente. Eso es lo que permite usar sumas, divisores y sistemas de ecuaciones.</p>

<h2>1. Magnitudes básicas</h2>
<div class="tabla-wrap"><table class="tabla">
<tr><th>Magnitud</th><th>Símbolo</th><th>Unidad</th><th>Qué representa</th></tr>
<tr><td>Tensión (diferencia de potencial)</td><td>$V$</td><td>volt (V)</td><td>El “empuje” que mueve las cargas. Siempre se mide <b>entre dos puntos</b>.</td></tr>
<tr><td>Corriente</td><td>$I$</td><td>ampere (A)</td><td>Cantidad de carga que pasa por segundo. Se mide <b>a través</b> de un cable.</td></tr>
<tr><td>Resistencia</td><td>$R$</td><td>ohm (Ω)</td><td>Oposición al paso de la corriente.</td></tr>
<tr><td>Potencia</td><td>$P$</td><td>watt (W)</td><td>Energía por segundo (lo que calienta la resistencia).</td></tr>
</table></div>
<p>Prefijos que vamos a usar todo el tiempo: <b>M</b> = 10⁶, <b>k</b> = 10³, <b>m</b> = 10⁻³, <b>µ</b> = 10⁻⁶, <b>n</b> = 10⁻⁹. Ejemplo: 4,7 kΩ = 4700 Ω; 20 mA = 0,02 A.</p>

<h2>2. Ley de Ohm y potencia</h2>
<div class="caja formula"><span class="caja-titulo">Fórmulas clave</span>
$$V = I\cdot R \qquad I = \frac{V}{R} \qquad R = \frac{V}{I}$$
$$P = V\cdot I = I^2 R = \frac{V^2}{R}$$
</div>
<div class="caja tip"><span class="caja-titulo">Truco de unidades</span>
Si ponés la resistencia en <b>kΩ</b> y la tensión en <b>V</b>, la corriente sale directamente en <b>mA</b>: $\frac{12\,\text{V}}{2\,\text{k}\Omega}=6\,\text{mA}$.
</div>

<h2>3. Serie y paralelo</h2>
<div class="dos-col">
<div>
<h3>Serie</h3>
<p>Una sola “vía”: <b>la misma corriente</b> pasa por todas. Las tensiones se reparten.</p>
$$R_{eq} = R_1 + R_2 + \dots$$
${Esq.svg(260, 70, [
  Esq.borne(15, 35, 'A', 0, -12), Esq.R(15, 35, 125, 35, 'R1', '', 1), Esq.R(125, 35, 245, 35, 'R2', '', 1), Esq.borne(245, 35, 'B', 0, -12),
])}
</div>
<div>
<h3>Paralelo</h3>
<p>Todas conectadas entre los mismos dos nodos: <b>la misma tensión</b> en todas. Las corrientes se reparten.</p>
$$\frac{1}{R_{eq}} = \frac{1}{R_1} + \frac{1}{R_2} + \dots \qquad\text{(dos: } R_{eq}=\frac{R_1 R_2}{R_1+R_2}\text{)}$$
${Esq.svg(260, 120, [
  Esq.borne(20, 60, 'A', 0, -12), Esq.cable([[20, 60], [70, 60]]), Esq.nodo(70, 60), Esq.cable([[70, 25], [70, 95]]),
  Esq.R(70, 25, 190, 25, 'R1', '', 1), Esq.R(70, 95, 190, 95, 'R2', '', -1),
  Esq.cable([[190, 25], [190, 95]]), Esq.nodo(190, 60), Esq.cable([[190, 60], [240, 60]]), Esq.borne(240, 60, 'B', 0, -12),
])}
</div>
</div>
<div class="caja ojo"><span class="caja-titulo">Error típico</span>
El paralelo de dos resistencias <b>siempre da menos que la menor</b>. Si te da más, hay un error. Dos iguales en paralelo: la mitad ($10\,\text{k}\parallel10\,\text{k}=5\,\text{k}$).
</div>

<h2>4. Divisor de tensión</h2>
<p>Dos resistencias en serie conectadas a una fuente: la tensión de salida (sobre $R_2$) es una fracción de la entrada.</p>
${Esq.svg(320, 190, [
  Esq.bat(40, 50, 40, 150, 'Vin', '', -1), Esq.cable([[40, 50], [40, 25], [180, 25], [180, 30]]),
  Esq.R(180, 30, 180, 95, 'R1', '', 1), Esq.nodo(180, 95), Esq.R(180, 95, 180, 160, 'R2', '', 1),
  Esq.cable([[180, 160], [180, 170], [40, 170], [40, 150]]),
  Esq.cable([[180, 95], [270, 95]]), Esq.borne(270, 95, 'Vout', 18, -10), Esq.cable([[180, 170], [270, 170]]), Esq.borne(270, 170),
], 'Divisor de tensión: Vout es la tensión sobre R2.')}
<div class="caja formula"><span class="caja-titulo">Divisor de tensión</span>
$$V_{out} = V_{in}\cdot\frac{R_2}{R_1+R_2}$$
<p>Válido <b>solo si no hay carga</b> (o la carga es mucho mayor que $R_2$). Si conectás una carga $R_L$, en la fórmula reemplazás $R_2$ por $R_2\parallel R_L$ y $V_{out}$ baja.</p>
</div>
<p><b>Divisor de corriente</b> (dos ramas en paralelo): la corriente se va más por la rama de <b>menor</b> resistencia: $I_1 = I_T\cdot\frac{R_2}{R_1+R_2}$ (ojo: arriba va la resistencia de la <em>otra</em> rama).</p>

<h2>5. Leyes de Kirchhoff</h2>
<div class="dos-col">
<div class="caja formula"><span class="caja-titulo">LKC — Ley de nodos (corrientes)</span>
La suma de corrientes que <b>entran</b> a un nodo es igual a la suma de las que <b>salen</b>: $\sum I_{entran}=\sum I_{salen}$.<br>Es conservación de la carga: no se acumula ni se pierde en un nodo.
</div>
<div class="caja formula"><span class="caja-titulo">LKT — Ley de mallas (tensiones)</span>
Recorriendo un camino cerrado, la suma algebraica de tensiones es cero: $\sum V = 0$.<br>Lo que “suben” las fuentes, lo “bajan” las resistencias.
</div>
</div>

<h2>6. Método de mallas (paso a paso)</h2>
<p>Sirve para circuitos con más de una fuente o que no se reducen con serie/paralelo. Usamos este circuito de ejemplo:</p>
${Esq.svg(420, 210, [
  Esq.bat(40, 70, 40, 150, 'V1', '', -1), Esq.cable([[40, 70], [40, 40], [70, 40]]), Esq.R(70, 40, 190, 40, 'R1', '', 1),
  Esq.cable([[190, 40], [230, 40]]), Esq.nodo(210, 40), Esq.R(230, 40, 350, 40, 'R2', '', 1), Esq.cable([[350, 40], [380, 40], [380, 70]]),
  Esq.bat(380, 70, 380, 150, 'V2', '', 1), Esq.cable([[380, 150], [380, 180], [40, 180], [40, 150]]),
  Esq.R(210, 40, 210, 180, 'R3', '', 1), Esq.nodo(210, 180),
  Esq.texto(125, 115, '↻ I1', { color: 'var(--c2)', size: 18 }), Esq.texto(300, 115, '↻ I2', { color: 'var(--c4)', size: 18 }),
], 'Dos mallas. I1 e I2 son corrientes de malla (ambas en sentido horario).')}
<ol>
<li><b>Asigná una corriente de malla</b> a cada “ventana” del circuito, todas en sentido horario ($I_1$, $I_2$).</li>
<li><b>Escribí LKT en cada malla.</b> Para cada resistencia: corriente propia por $R$. Si la resistencia es compartida, restás la corriente de la otra malla.</li>
<li><b>Fuentes:</b> si la corriente de malla sale por el <b>+</b> de la fuente, la fuente va positiva del lado derecho de la ecuación; si entra por el +, va negativa.</li>
<li><b>Resolvé el sistema</b> (sustitución, igualación o Cramer).</li>
<li><b>Corriente real en la rama compartida</b>: $I_{R3}=I_1-I_2$ (si da negativa, va al revés de lo supuesto: no está mal).</li>
</ol>
<div class="caja formula"><span class="caja-titulo">Sistema del ejemplo</span>
$$\begin{cases}(R_1+R_3)\,I_1 - R_3\,I_2 = V_1\\ -R_3\,I_1+(R_2+R_3)\,I_2 = -V_2\end{cases}$$
<p>Con Cramer: $\Delta = (R_1+R_3)(R_2+R_3)-R_3^2$, &nbsp; $I_1=\dfrac{V_1(R_2+R_3)-R_3V_2}{\Delta}$, &nbsp; $I_2=\dfrac{R_3V_1-(R_1+R_3)V_2}{\Delta}$.</p>
</div>
<div class="caja ejemplo"><span class="caja-titulo">Ejemplo numérico</span>
$V_1=12\,\text{V}$, $V_2=6\,\text{V}$, $R_1=1\,\text{k}\Omega$, $R_2=2\,\text{k}\Omega$, $R_3=3\,\text{k}\Omega$ (en kΩ → corrientes en mA):
$$\begin{cases}4I_1-3I_2=12\\-3I_1+5I_2=-6\end{cases}\quad\Delta=4\cdot5-(-3)(-3)=11$$
$$I_1=\frac{12\cdot5-(-3)(-6)}{11}=\frac{42}{11}=3{,}82\,\text{mA}\qquad I_2=\frac{4\cdot(-6)-(-3)\cdot12}{11}=\frac{12}{11}=1{,}09\,\text{mA}$$
$I_{R3}=I_1-I_2=2{,}73\,\text{mA}$ (hacia abajo). Podés comprobarlo en la simulación.
</div>

<!-- AMPLIACION-CARPETA -->
<h2>7. Método de nodos (tensiones de nodo)</h2>
<p>Mallas usa como incógnitas <b>corrientes</b> que “giran” por cada ventana del circuito. El método de nodos hace lo contrario: las incógnitas son las <b>tensiones de los nodos</b> medidas respecto de un nodo de referencia (masa). Es el método ideal cuando el circuito tiene <b>fuentes de corriente</b>, y es el que usan internamente los simuladores como Falstad o LTspice.</p>
<div class="caja idea"><span class="caja-titulo">La idea en una frase</span>
En cada nodo, <b>lo que entra = lo que sale</b> (LKC). Y la corriente que sale por una resistencia se escribe con Ohm usando las tensiones de sus dos extremos: $I=\frac{V_{\text{acá}}-V_{\text{allá}}}{R}$.
</div>
${Esq.svg(400, 215, [
  Esq.cable([[40, 150], [40, 190], [340, 190], [340, 150]]), Esq.cable([[40, 80], [40, 40], [340, 40], [340, 80]]),
  Esq.fuenteI(40, 150, 40, 80, 'IF1', '', -1),
  Esq.R(120, 40, 120, 190, 'R1', '', 1),
  Esq.R(170, 40, 230, 40, 'R3', '', 1),
  Esq.R(260, 40, 260, 190, 'R2', '', -1),
  Esq.fuenteI(340, 150, 340, 80, 'IF2', '', 1),
  Esq.nodo(120, 40), Esq.nodo(260, 40), Esq.nodo(120, 190), Esq.nodo(260, 190),
  Esq.cable([[120, 40], [170, 40]]), Esq.cable([[230, 40], [260, 40]]),
  Esq.texto(120, 25, 'V1', { color: 'var(--c2)' }), Esq.texto(260, 25, 'V2', { color: 'var(--c4)' }),
  Esq.masa(190, 190), Esq.texto(230, 207, 'referencia (0 V)', { size: 11, peso: 400, anchor: 'start' }),
], 'Dos fuentes de corriente “inyectan” corriente en los nodos 1 y 2. Hay 3 nodos: el de abajo es la referencia, así que quedan 2 incógnitas: V1 y V2.')}
<div class="caja formula"><span class="caja-titulo">Receta en 5 pasos</span>
<ol>
<li><b>Elegí la referencia</b> (masa): conviene el nodo donde se juntan más ramas. Vale 0 V.</li>
<li><b>Nombrá las tensiones</b> de los otros nodos: $V_1$, $V_2$… Con $n$ nodos hay $n-1$ incógnitas.</li>
<li><b>Escribí LKC en cada nodo</b> (menos la referencia): corrientes de fuentes que entran = corrientes que salen por las resistencias.</li>
<li><b>Ordená</b> el sistema: términos con $V_1$, términos con $V_2$, y las fuentes a la derecha.</li>
<li><b>Resolvé</b> (Cramer, sustitución o igualación) y con las tensiones calculá cualquier corriente: $I=\Delta V/R$.</li>
</ol>
</div>
<p>Para el circuito de la figura:</p>
$$\text{Nodo 1:}\quad I_{F1}=\frac{V_1}{R_1}+\frac{V_1-V_2}{R_3}\qquad\qquad \text{Nodo 2:}\quad I_{F2}+\frac{V_1-V_2}{R_3}=\frac{V_2}{R_2}$$
<p>Ordenando (agrupamos lo que multiplica a cada incógnita):</p>
$$\begin{cases}\left(\dfrac1{R_1}+\dfrac1{R_3}\right)V_1-\dfrac1{R_3}\,V_2=I_{F1}\\[2mm] -\dfrac1{R_3}\,V_1+\left(\dfrac1{R_2}+\dfrac1{R_3}\right)V_2=I_{F2}\end{cases}$$
<div class="caja tip"><span class="caja-titulo">Truco para armar el sistema “a ojo”</span>
<ul>
<li>En la <b>diagonal</b> va la suma de las conductancias ($1/R$) que tocan ese nodo.</li>
<li><b>Fuera de la diagonal</b> va <b>menos</b> la conductancia que une los dos nodos.</li>
<li>A la <b>derecha</b>, la suma de las corrientes de fuente que <b>entran</b> al nodo (si sale, va con signo −).</li>
</ul>
Es el mismo truco que en mallas, pero con conductancias y corrientes en vez de resistencias y tensiones.
</div>
<div class="caja ejemplo"><span class="caja-titulo">Ejemplo numérico (el de la carpeta)</span>
$I_{F1}=3{,}1\,\text{mA}$, $I_{F2}=1{,}4\,\text{mA}$, $R_1=2\,\text{k}\Omega$, $R_2=4\,\text{k}\Omega$, $R_3=5\,\text{k}\Omega$. Trabajando en kΩ, mA y V:
$$\begin{cases}\left(\tfrac12+\tfrac15\right)V_1-\tfrac15V_2=3{,}1\\[1mm]-\tfrac15V_1+\left(\tfrac14+\tfrac15\right)V_2=1{,}4\end{cases}\Rightarrow\begin{cases}0{,}7\,V_1-0{,}2\,V_2=3{,}1\\-0{,}2\,V_1+0{,}45\,V_2=1{,}4\end{cases}$$
$$\Delta=0{,}7\cdot0{,}45-(-0{,}2)(-0{,}2)=0{,}275=\tfrac{11}{40}$$
$$V_1=\frac{\begin{vmatrix}3{,}1&-0{,}2\\1{,}4&0{,}45\end{vmatrix}}{\Delta}=\frac{1{,}395+0{,}28}{0{,}275}=6{,}09\,\text{V}\qquad V_2=\frac{\begin{vmatrix}0{,}7&3{,}1\\-0{,}2&1{,}4\end{vmatrix}}{\Delta}=\frac{0{,}98+0{,}62}{0{,}275}=5{,}82\,\text{V}$$
Corrientes: $I_{R1}=\frac{6{,}09}{2}=3{,}05\,\text{mA}$, $I_{R2}=\frac{5{,}82}{4}=1{,}45\,\text{mA}$, $I_{R3}=\frac{6{,}09-5{,}82}{5}=0{,}055\,\text{mA}$ (de 1 hacia 2).<br>
<b>Control:</b> en el nodo 1 entran 3,1 mA y salen $3{,}05+0{,}055=3{,}1\,\text{mA}$ ✓.
</div>
<div class="caja ojo"><span class="caja-titulo">¿Y si hay una fuente de tensión?</span>
Si la fuente de tensión $V$ está <b>en serie con una resistencia</b> $R$, la cambiás por una fuente de corriente $I=V/R$ con la misma $R$ en paralelo (<b>transformación de fuentes</b>, es el equivalente de Norton). Si la fuente de tensión va directo entre un nodo y masa, ese nodo ya tiene tensión conocida: una incógnita menos.
</div>
<div class="tabla-wrap"><table class="tabla">
<tr><th></th><th>Mallas</th><th>Nodos</th></tr>
<tr><td>Incógnitas</td><td>Corrientes de malla</td><td>Tensiones de nodo</td></tr>
<tr><td>Ley que se usa</td><td>LKT (suma de tensiones = 0)</td><td>LKC (lo que entra = lo que sale)</td></tr>
<tr><td>Conviene cuando hay…</td><td>fuentes de tensión, pocas mallas</td><td>fuentes de corriente, pocos nodos</td></tr>
<tr><td>Diagonal del sistema</td><td>suma de R de la malla</td><td>suma de 1/R del nodo</td></tr>
</table></div>

<h2>8. Superposición</h2>
<p>Con varias fuentes, la respuesta total es la <b>suma</b> de las respuestas de cada fuente actuando sola. Para “apagar” una fuente de tensión se la reemplaza por un <b>cortocircuito</b> (una de corriente, por un <b>circuito abierto</b>). Es la consecuencia directa de que el circuito sea lineal.</p>

<h2>9. Teorema de Thévenin</h2>
<p>Cualquier circuito lineal visto desde dos bornes A‑B se puede reemplazar por <b>una fuente $V_{th}$ en serie con una resistencia $R_{th}$</b>. Es muy útil cuando queremos ver qué pasa al cambiar solo la carga.</p>
<ol>
<li>Sacá la carga. <b>$V_{th}$</b> = tensión entre A y B a circuito abierto.</li>
<li>Apagá las fuentes (tensión → corto). <b>$R_{th}$</b> = resistencia vista desde A‑B.</li>
<li>Volvé a poner la carga: $I_L = \dfrac{V_{th}}{R_{th}+R_L}$.</li>
</ol>
<div class="caja idea"><span class="caja-titulo">Para qué lo vamos a usar</span>
El divisor de tensión que polariza la base de un transistor (tema 14) se simplifica con Thévenin: $V_{th}=V_{CC}\frac{R_2}{R_1+R_2}$ y $R_{th}=R_1\parallel R_2$.
</div>
`,

  simulaciones: [
    {
      titulo: 'Divisor de tensión con y sin carga',
      descripcion: 'Mové las resistencias y conectá una carga RL para ver cómo “se cae” la tensión de salida.',
      montar(cont, H) {
        const { controles, vista } = H.layout(cont);
        const vin = H.slider(controles, { label: 'Vin', min: 1, max: 24, step: 0.5, value: 12, unidad: 'V', onInput: upd });
        const r1 = H.slider(controles, { label: 'R1', min: 100, max: 100e3, log: true, value: 10e3, unidad: 'Ω', onInput: upd });
        const r2 = H.slider(controles, { label: 'R2', min: 100, max: 100e3, log: true, value: 10e3, unidad: 'Ω', onInput: upd });
        H.sep(controles);
        const conCarga = H.check(controles, { label: 'Conectar carga RL', value: false, onChange: upd });
        const rl = H.slider(controles, { label: 'RL', min: 100, max: 1e6, log: true, value: 10e3, unidad: 'Ω', onInput: upd });
        const fig = H.el('div');
        vista.append(fig);
        const lec = H.lecturas(vista);
        const nota = H.nota(vista);
        function upd() {
          const Vin = vin.value, R1 = r1.value, R2 = r2.value, RL = rl.value;
          const R2ef = conCarga.value ? (R2 * RL) / (R2 + RL) : R2;
          const Vsin = Vin * R2 / (R1 + R2);
          const Vout = Vin * R2ef / (R1 + R2ef);
          const I = Vin / (R1 + R2ef);
          const caida = (1 - Vout / Vsin) * 100;
          fig.innerHTML = Esq.svg(360, 200, [
            Esq.bat(40, 55, 40, 155, 'Vin', H.fmt(Vin, 'V'), -1), Esq.cable([[40, 55], [40, 25], [170, 25], [170, 32]]),
            Esq.R(170, 32, 170, 100, 'R1', H.fmt(R1, 'Ω'), 1), Esq.nodo(170, 100), Esq.R(170, 100, 170, 168, 'R2', H.fmt(R2, 'Ω'), -1),
            Esq.cable([[170, 168], [170, 180], [40, 180], [40, 155]]),
            Esq.cable([[170, 100], [290, 100], [290, 106]]),
            conCarga.value ? Esq.R(290, 106, 290, 174, 'RL', H.fmt(RL, 'Ω'), 1) : Esq.llave(290, 106, 290, 174, 'RL', 'desconectada', 1),
            Esq.cable([[290, 174], [290, 180], [170, 180]]), Esq.nodo(170, 180),
            Esq.texto(235, 92, 'Vout = ' + H.fmt(Vout, 'V'), { color: 'var(--accent)' }),
          ]);
          lec.set([
            { k: 'Vout sin carga', v: H.fmt(Vsin, 'V') },
            { k: 'Vout real', v: H.fmt(Vout, 'V'), estado: conCarga.value && caida > 10 ? 'alerta' : 'ok' },
            { k: 'Corriente por R1', v: H.fmt(I, 'A') },
            { k: 'Potencia en R1', v: H.fmt(I * I * R1, 'W') },
            { k: 'Caída por la carga', v: conCarga.value ? H.num(caida, 1) + ' %' : '—' },
          ]);
          nota.innerHTML = conCarga.value
            ? (RL >= 10 * R2 ? '<b>RL ≥ 10·R2:</b> la carga casi no afecta; la fórmula del divisor sigue sirviendo.' : '<b>RL comparable con R2:</b> la carga queda en paralelo con R2, baja la resistencia equivalente y Vout cae. Por eso un divisor no es una buena “fuente”.')
            : 'Sin carga: $V_{out}=V_{in}\\cdot R_2/(R_1+R_2)$. Probá R1 = R2: la salida es la mitad.';
          if (window.renderMathInElement) renderMathInElement(nota, { delimiters: [{ left: '$', right: '$', display: false }] });
        }
        upd();
      },
    },
    {
      titulo: 'Resolución por mallas (2 mallas)',
      descripcion: 'El sistema de ecuaciones y la resolución por Cramer se actualizan con los valores que elijas.',
      montar(cont, H) {
        const { controles, vista } = H.layout(cont);
        const v1 = H.slider(controles, { label: 'V1', min: 0, max: 24, step: 0.5, value: 12, unidad: 'V', onInput: upd });
        const v2 = H.slider(controles, { label: 'V2', min: 0, max: 24, step: 0.5, value: 6, unidad: 'V', onInput: upd });
        const r1 = H.slider(controles, { label: 'R1', min: 0.1, max: 10, step: 0.1, value: 1, fmt: v => H.num(v, 1) + ' kΩ', onInput: upd });
        const r2 = H.slider(controles, { label: 'R2', min: 0.1, max: 10, step: 0.1, value: 2, fmt: v => H.num(v, 1) + ' kΩ', onInput: upd });
        const r3 = H.slider(controles, { label: 'R3', min: 0.1, max: 10, step: 0.1, value: 3, fmt: v => H.num(v, 1) + ' kΩ', onInput: upd });
        const fig = H.el('div'); vista.append(fig);
        const lec = H.lecturas(vista);
        const pasos = H.nota(vista);
        function upd() {
          const V1 = v1.value, V2 = v2.value, R1 = r1.value, R2 = r2.value, R3 = r3.value;
          const a = R1 + R3, b = -R3, c = -R3, d = R2 + R3;
          const D = a * d - b * c;
          const I1 = (V1 * d - b * (-V2)) / D;
          const I2 = (a * (-V2) - c * V1) / D;
          const I3 = I1 - I2;
          const n = (x) => H.num(x, 3);
          fig.innerHTML = Esq.svg(420, 210, [
            Esq.bat(40, 70, 40, 150, 'V1', n(V1) + ' V', -1), Esq.cable([[40, 70], [40, 40], [70, 40]]), Esq.R(70, 40, 190, 40, 'R1', n(R1) + ' kΩ', 1),
            Esq.cable([[190, 40], [230, 40]]), Esq.nodo(210, 40), Esq.R(230, 40, 350, 40, 'R2', n(R2) + ' kΩ', 1), Esq.cable([[350, 40], [380, 40], [380, 70]]),
            Esq.bat(380, 70, 380, 150, 'V2', n(V2) + ' V', 1), Esq.cable([[380, 150], [380, 180], [40, 180], [40, 150]]),
            Esq.R(210, 40, 210, 180, 'R3', n(R3) + ' kΩ', 1), Esq.nodo(210, 180),
            Esq.texto(125, 115, '↻ I1', { color: 'var(--c2)', size: 18 }), Esq.texto(300, 115, '↻ I2', { color: 'var(--c4)', size: 18 }),
          ]);
          lec.set([
            { k: 'I1 (malla 1)', v: H.num(I1, 3) + ' mA' },
            { k: 'I2 (malla 2)', v: H.num(I2, 3) + ' mA', estado: I2 < 0 ? 'alerta' : '' },
            { k: 'I por R3 (↓) = I1 − I2', v: H.num(I3, 3) + ' mA' },
            { k: 'V sobre R3', v: H.num(I3 * R3, 3) + ' V' },
            { k: 'P total entregada', v: H.num(V1 * I1 - V2 * I2, 3) + ' mW' },
          ]);
          pasos.innerHTML = String.raw`<b>Sistema (en kΩ, V y mA):</b>
            $$\begin{cases}${n(a)}\,I_1 ${b < 0 ? '-' : '+'} ${n(Math.abs(b))}\,I_2 = ${n(V1)}\\ -${n(R3)}\,I_1 + ${n(d)}\,I_2 = ${n(-V2)}\end{cases}$$
            $$\Delta = ${n(a)}\cdot${n(d)} - (${n(b)})(${n(c)}) = ${n(D)}$$
            $$I_1=\frac{${n(V1)}\cdot${n(d)} - (${n(b)})(${n(-V2)})}{${n(D)}} = ${n(I1)}\,\text{mA}\qquad I_2=\frac{${n(a)}\cdot(${n(-V2)}) - (${n(c)})\cdot ${n(V1)}}{${n(D)}} = ${n(I2)}\,\text{mA}$$
            ${I2 < 0 ? '<p><b>I2 dio negativa:</b> la corriente de la malla 2 circula en sentido antihorario. El método no falla: el signo te dice el sentido real.</p>' : ''}`;
          if (window.renderMathInElement) renderMathInElement(pasos, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }], throwOnError: false });
        }
        upd();
      },
    },
    {
      titulo: 'Resolución por nodos (2 nodos)',
      descripcion: 'Cambiá las fuentes de corriente y las resistencias: el sistema, Cramer y las corrientes de cada rama se actualizan solos. Probá poner una fuente negativa (sale del nodo en vez de entrar).',
      montar(cont, H) {
        const { controles, vista } = H.layout(cont);
        const i1 = H.slider(controles, { label: 'IF1 (entra al nodo 1)', min: -10, max: 10, step: 0.1, value: 3.1, fmt: v => H.num(v, 1) + ' mA', onInput: upd });
        const i2 = H.slider(controles, { label: 'IF2 (entra al nodo 2)', min: -10, max: 10, step: 0.1, value: 1.4, fmt: v => H.num(v, 1) + ' mA', onInput: upd });
        const r1 = H.slider(controles, { label: 'R1', min: 0.1, max: 10, step: 0.1, value: 2, fmt: v => H.num(v, 1) + ' kΩ', onInput: upd });
        const r2 = H.slider(controles, { label: 'R2', min: 0.1, max: 10, step: 0.1, value: 4, fmt: v => H.num(v, 1) + ' kΩ', onInput: upd });
        const r3 = H.slider(controles, { label: 'R3 (entre nodos)', min: 0.1, max: 10, step: 0.1, value: 5, fmt: v => H.num(v, 1) + ' kΩ', onInput: upd });
        H.nota(controles, 'Unidades cómodas: kΩ, mA y V. Así 1/R queda en mS (milisiemens) y no hay que andar con potencias de 10.');
        const fig = H.el('div'); vista.append(fig);
        const lec = H.lecturas(vista);
        const pasos = H.nota(vista);
        function upd() {
          const I1 = i1.value, I2 = i2.value, R1 = r1.value, R2 = r2.value, R3 = r3.value;
          const a = 1 / R1 + 1 / R3, b = -1 / R3, c = -1 / R3, d = 1 / R2 + 1 / R3;
          const D = a * d - b * c;
          const V1 = (I1 * d - b * I2) / D;
          const V2 = (a * I2 - c * I1) / D;
          const IR1 = V1 / R1, IR2 = V2 / R2, IR3 = (V1 - V2) / R3;
          const n = (x, k = 3) => H.num(x, k);
          const L = (x, k = 3) => H.num(x, k).replace(',', '{,}');
          const flecha3 = IR3 >= 0 ? Esq.flecha(175, 62, 225, 62, '', 'var(--c3)') : Esq.flecha(225, 62, 175, 62, '', 'var(--c3)');
          fig.innerHTML = Esq.svg(400, 215, [
            Esq.cable([[40, 150], [40, 190], [340, 190], [340, 150]]), Esq.cable([[40, 80], [40, 40], [340, 40], [340, 80]]),
            I1 >= 0 ? Esq.fuenteI(40, 150, 40, 80, 'IF1', n(Math.abs(I1), 1) + ' mA', -1) : Esq.fuenteI(40, 80, 40, 150, 'IF1', n(Math.abs(I1), 1) + ' mA', -1),
            Esq.R(120, 40, 120, 190, 'R1', n(R1, 1) + ' kΩ', 1),
            Esq.R(170, 40, 230, 40, 'R3', n(R3, 1) + ' kΩ', 1),
            Esq.R(260, 40, 260, 190, 'R2', n(R2, 1) + ' kΩ', -1),
            I2 >= 0 ? Esq.fuenteI(340, 150, 340, 80, 'IF2', n(Math.abs(I2), 1) + ' mA', 1) : Esq.fuenteI(340, 80, 340, 150, 'IF2', n(Math.abs(I2), 1) + ' mA', 1),
            Esq.nodo(120, 40), Esq.nodo(260, 40), Esq.nodo(120, 190), Esq.nodo(260, 190),
            Esq.cable([[120, 40], [170, 40]]), Esq.cable([[230, 40], [260, 40]]),
            Esq.texto(120, 22, 'V1 = ' + n(V1, 2) + ' V', { color: 'var(--c2)', size: 12 }), Esq.texto(275, 22, 'V2 = ' + n(V2, 2) + ' V', { color: 'var(--c4)', size: 12 }),
            flecha3, Esq.masa(190, 190),
          ]);
          lec.set([
            { k: 'V1', v: n(V1) + ' V' },
            { k: 'V2', v: n(V2) + ' V' },
            { k: 'I por R1 (↓)', v: n(IR1) + ' mA', estado: IR1 < 0 ? 'alerta' : '' },
            { k: 'I por R2 (↓)', v: n(IR2) + ' mA', estado: IR2 < 0 ? 'alerta' : '' },
            { k: 'I por R3 (1 → 2)', v: n(IR3) + ' mA', estado: IR3 < 0 ? 'alerta' : '' },
            { k: 'Control nodo 1', v: n(I1, 2) + ' = ' + n(IR1 + IR3, 2) + ' ✓', estado: 'ok' },
          ]);
          pasos.innerHTML = String.raw`<b>Sistema (conductancias en mS, corrientes en mA):</b>
            $$\begin{cases}${L(a)}\,V_1 - ${L(-b)}\,V_2 = ${L(I1, 2)}\\ -${L(-c)}\,V_1 + ${L(d)}\,V_2 = ${L(I2, 2)}\end{cases}$$
            $$\Delta = ${L(a)}\cdot${L(d)} - (${L(b)})(${L(c)}) = ${L(D, 4)}$$
            $$V_1=\frac{${L(I1, 2)}\cdot${L(d)} - (${L(b)})\cdot${L(I2, 2)}}{${L(D, 4)}} = ${L(V1)}\,\text{V}$$
            $$V_2=\frac{${L(a)}\cdot${L(I2, 2)} - (${L(c)})\cdot${L(I1, 2)}}{${L(D, 4)}} = ${L(V2)}\,\text{V}$$
            ${IR3 < 0 ? '<p><b>La corriente por R3 dio negativa:</b> en realidad circula del nodo 2 al nodo 1 (V2 &gt; V1). La flecha verde del esquema ya muestra el sentido real.</p>' : ''}
            ${(V1 < 0 || V2 < 0) ? '<p><b>Hay una tensión de nodo negativa:</b> ese nodo está por debajo de la masa. Es perfectamente posible cuando una fuente de corriente “saca” corriente del nodo.</p>' : ''}`;
          if (window.renderMathInElement) renderMathInElement(pasos, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }], throwOnError: false });
        }
        upd();
      },
    },
    ],

  ejercicios: [
    {
      nivel: 'Básico',
      enunciado: String.raw`Una resistencia de $470\,\Omega$ se conecta a $9\,\text{V}$. Calculá la corriente y la potencia disipada. ¿Alcanza una resistencia de 1/4 W?`,
      pista: String.raw`$I=V/R$ y después $P=V\cdot I$. Compará con 0,25 W.`,
      solucion: String.raw`$I=\frac{9}{470}=19{,}1\,\text{mA}$. $P=9\cdot0{,}0191=0{,}172\,\text{W}$. Como 0,172 W < 0,25 W, alcanza, aunque con poco margen (conviene trabajar por debajo del 70 % de la potencia nominal → 0,175 W: justo).`,
    },
    {
      nivel: 'Básico',
      enunciado: String.raw`Calculá la resistencia equivalente entre A y B: $R_1=1\,\text{k}\Omega$ en serie con el paralelo de $R_2=2{,}2\,\text{k}\Omega$ y $R_3=3{,}3\,\text{k}\Omega$.`,
      pista: String.raw`Primero el paralelo: producto sobre suma. Después sumá $R_1$.`,
      solucion: String.raw`$R_2\parallel R_3=\frac{2{,}2\cdot3{,}3}{2{,}2+3{,}3}=\frac{7{,}26}{5{,}5}=1{,}32\,\text{k}\Omega$. $R_{eq}=1+1{,}32=2{,}32\,\text{k}\Omega$.`,
    },
    {
      nivel: 'Intermedio',
      enunciado: String.raw`Se quiere obtener $5\,\text{V}$ a partir de $12\,\text{V}$ con un divisor. Si $R_2=10\,\text{k}\Omega$, ¿cuánto vale $R_1$? Luego se conecta una carga de $10\,\text{k}\Omega$: ¿cuánto queda en la salida?`,
      pista: String.raw`Despejá $R_1$ de $V_{out}=V_{in}\frac{R_2}{R_1+R_2}$. Con carga, $R_2$ pasa a ser $R_2\parallel R_L$.`,
      solucion: String.raw`$5=12\frac{10}{R_1+10}\Rightarrow R_1+10=24\Rightarrow R_1=14\,\text{k}\Omega$. Con carga: $R_2\parallel R_L=5\,\text{k}\Omega$, $V_{out}=12\frac{5}{14+5}=3{,}16\,\text{V}$. ¡Cae casi 2 V! El divisor solo sirve con cargas mucho mayores que $R_2$.`,
    },
    {
      nivel: 'Intermedio',
      enunciado: String.raw`Por un nodo entran $I_1=25\,\text{mA}$ e $I_2=10\,\text{mA}$, y salen $I_3=12\,\text{mA}$ e $I_4$. Calculá $I_4$.`,
      pista: 'Lo que entra es igual a lo que sale (LKC).',
      solucion: String.raw`$25+10=12+I_4\Rightarrow I_4=23\,\text{mA}$.`,
    },
    {
      nivel: 'Avanzado',
      enunciado: String.raw`Resolvé por mallas el circuito de la teoría con $V_1=10\,\text{V}$, $V_2=5\,\text{V}$, $R_1=2\,\text{k}\Omega$, $R_2=1\,\text{k}\Omega$, $R_3=2\,\text{k}\Omega$. Calculá $I_1$, $I_2$ y la corriente en $R_3$. Verificá con la simulación.`,
      pista: String.raw`Sistema: $(R_1+R_3)I_1-R_3I_2=V_1$ y $-R_3I_1+(R_2+R_3)I_2=-V_2$.`,
      solucion: String.raw`$\begin{cases}4I_1-2I_2=10\\-2I_1+3I_2=-5\end{cases}$, $\Delta=12-4=8$.
      $I_1=\frac{10\cdot3-(-2)(-5)}{8}=\frac{20}{8}=2{,}5\,\text{mA}$; $I_2=\frac{4(-5)-(-2)10}{8}=0\,\text{mA}$.
      $I_{R3}=2{,}5\,\text{mA}$. Interesante: por $R_2$ no circula corriente porque la tensión en $R_3$ ($2{,}5\cdot2=5\,\text{V}$) es exactamente igual a $V_2$.`,
    },
    {
      nivel: 'Avanzado',
      enunciado: String.raw`Hallá el equivalente de Thévenin de un divisor con $V_{CC}=12\,\text{V}$, $R_1=47\,\text{k}\Omega$ y $R_2=10\,\text{k}\Omega$ visto desde la salida. ¿Qué corriente circula por una carga de $22\,\text{k}\Omega$?`,
      pista: String.raw`$V_{th}$ es la salida sin carga. Para $R_{th}$ cortocircuitá la fuente: quedan $R_1$ y $R_2$ en paralelo.`,
      solucion: String.raw`$V_{th}=12\cdot\frac{10}{57}=2{,}105\,\text{V}$; $R_{th}=\frac{47\cdot10}{57}=8{,}25\,\text{k}\Omega$. $I_L=\frac{2{,}105}{8{,}25+22}=69{,}6\,\mu\text{A}$ y $V_L=1{,}53\,\text{V}$.`,
    },
    {
      nivel: 'Básico',
      enunciado: String.raw`Una fuente de corriente de $12\,\text{mA}$ alimenta dos resistencias en paralelo, $R_1=1\,\text{k}\Omega$ y $R_2=3\,\text{k}\Omega$ (un solo nodo además de masa). Planteá la ecuación de nodo y calculá la tensión del nodo y la corriente por cada resistencia.`,
      pista: String.raw`Un solo nodo: $I_F=\frac{V}{R_1}+\frac{V}{R_2}$. Sacá $V$ factor común.`,
      solucion: String.raw`$12=V\left(\frac11+\frac13\right)=1{,}333\,V\Rightarrow V=9\,\text{V}$. $I_{R1}=\frac{9}{1}=9\,\text{mA}$, $I_{R2}=\frac93=3\,\text{mA}$. Control: $9+3=12\,\text{mA}$ ✓ (es el divisor de corriente: la R más chica se lleva más corriente).`,
    },
    {
      nivel: 'Intermedio',
      enunciado: String.raw`Resolvé por nodos el circuito de la teoría con $I_{F1}=3{,}1\,\text{mA}$, $I_{F2}=1{,}4\,\text{mA}$, $R_1=2\,\text{k}\Omega$, $R_2=4\,\text{k}\Omega$, $R_3=5\,\text{k}\Omega$. Calculá $V_1$, $V_2$ y las corrientes en las tres resistencias. Verificá LKC en el nodo 2.`,
      pista: String.raw`Diagonal: $\frac1{R_1}+\frac1{R_3}$ y $\frac1{R_2}+\frac1{R_3}$; fuera de la diagonal $-\frac1{R_3}$. $\Delta=0{,}275$.`,
      solucion: String.raw`$\begin{cases}0{,}7V_1-0{,}2V_2=3{,}1\\-0{,}2V_1+0{,}45V_2=1{,}4\end{cases}$, $\Delta=0{,}275$. $V_1=\frac{3{,}1\cdot0{,}45+0{,}2\cdot1{,}4}{0{,}275}=6{,}09\,\text{V}$; $V_2=\frac{0{,}7\cdot1{,}4+0{,}2\cdot3{,}1}{0{,}275}=5{,}82\,\text{V}$. $I_{R1}=3{,}05\,\text{mA}$, $I_{R2}=1{,}45\,\text{mA}$, $I_{R3}=0{,}055\,\text{mA}$ (de 1 a 2). Nodo 2: entran $1{,}4+0{,}055=1{,}455\,\text{mA}$ y sale $I_{R2}=1{,}455\,\text{mA}$ ✓.`,
    },
    {
      nivel: 'Intermedio',
      enunciado: String.raw`En el mismo circuito, la fuente $I_{F2}$ se da vuelta (ahora <b>saca</b> 1,4 mA del nodo 2). ¿Qué cambia en el sistema? Calculá de nuevo $V_1$ y $V_2$. ¿Hacia dónde circula ahora la corriente por $R_3$?`,
      pista: String.raw`Solo cambia el signo del término independiente del nodo 2: $-1{,}4$. La matriz (y $\Delta$) quedan iguales.`,
      solucion: String.raw`$V_1=\frac{3{,}1\cdot0{,}45+0{,}2\cdot(-1{,}4)}{0{,}275}=\frac{1{,}395-0{,}28}{0{,}275}=4{,}05\,\text{V}$; $V_2=\frac{0{,}7\cdot(-1{,}4)+0{,}2\cdot3{,}1}{0{,}275}=\frac{-0{,}98+0{,}62}{0{,}275}=-1{,}31\,\text{V}$. $I_{R3}=\frac{4{,}05-(-1{,}31)}{5}=1{,}07\,\text{mA}$ de 1 hacia 2. El nodo 2 quedó <b>por debajo de masa</b>: la fuente le saca más corriente de la que le llega. Verificalo en la simulación poniendo IF2 = −1,4 mA.`,
    },
    {
      nivel: 'Intermedio',
      enunciado: String.raw`Una batería de $9\,\text{V}$ con una resistencia en serie de $1\,\text{k}\Omega$ alimenta un nodo del que salen a masa $R_2=2\,\text{k}\Omega$ y $R_3=2\,\text{k}\Omega$. Transformá la fuente en una fuente de corriente y resolvé por nodos. Compará con el divisor de tensión.`,
      pista: String.raw`Transformación: $I=\frac{9\,\text{V}}{1\,\text{k}\Omega}=9\,\text{mA}$ con $1\,\text{k}\Omega$ en paralelo.`,
      solucion: String.raw`Queda una fuente de 9 mA y tres resistencias en paralelo (1 k, 2 k y 2 k): $9=V\left(1+\frac12+\frac12\right)=2V\Rightarrow V=4{,}5\,\text{V}$. Con el divisor: $R_2\parallel R_3=1\,\text{k}\Omega$, $V=9\cdot\frac{1}{1+1}=4{,}5\,\text{V}$ ✓. Mismo resultado por dos caminos.`,
    },
    {
      nivel: 'Avanzado',
      enunciado: String.raw`En el circuito de la teoría ($R_1=2\,\text{k}\Omega$, $R_2=4\,\text{k}\Omega$, $R_3=5\,\text{k}\Omega$, $I_{F2}=1{,}4\,\text{mA}$), ¿qué valor tiene que tener $I_{F1}$ para que <b>no circule corriente por $R_3$</b>? Pensalo antes de hacer cuentas.`,
      pista: String.raw`Si $I_{R3}=0$, entonces $V_1=V_2$, y cada fuente alimenta solo “su” resistencia.`,
      solucion: String.raw`Con $I_{R3}=0$ los nodos quedan desacoplados: $V_2=I_{F2}\cdot R_2=1{,}4\cdot4=5{,}6\,\text{V}$. Para que $V_1=5{,}6\,\text{V}$: $I_{F1}=\frac{5{,}6}{R_1}=\frac{5{,}6}{2}=2{,}8\,\text{mA}$. Comprobalo en la simulación: con IF1 = 2,8 mA la corriente por R3 da 0.`,
    },
    ],

  quiz: [
    { pregunta: 'En un circuito serie, ¿qué magnitud es igual en todos los componentes?', opciones: ['La tensión', 'La corriente', 'La potencia', 'La resistencia'], correcta: 1, explicacion: 'Hay un solo camino, así que la corriente es la misma en todos; las tensiones se reparten.' },
    { pregunta: 'Dos resistencias de 10 kΩ en paralelo equivalen a…', opciones: ['20 kΩ', '10 kΩ', '5 kΩ', '100 kΩ'], correcta: 2, explicacion: 'Dos iguales en paralelo: la mitad. Siempre menor que la menor.' },
    { pregunta: String.raw`Si en un divisor $R_1=R_2$ y $V_{in}=10\,\text{V}$, sin carga $V_{out}$ vale…`, opciones: ['10 V', '5 V', '2,5 V', '0 V'], correcta: 1, explicacion: 'Con resistencias iguales la tensión se reparte a la mitad.' },
    { pregunta: 'Al resolver por mallas, una corriente da negativa. Eso significa que…', opciones: ['Hay un error de cálculo seguro', 'La corriente real circula en sentido contrario al supuesto', 'La fuente está en cortocircuito', 'La resistencia es negativa'], correcta: 1, explicacion: 'El signo indica el sentido. El método sigue siendo correcto.' },
    { pregunta: 'Para calcular la resistencia de Thévenin, las fuentes de tensión se reemplazan por…', opciones: ['Un circuito abierto', 'Un cortocircuito', 'Una resistencia de 1 kΩ', 'No se tocan'], correcta: 1, explicacion: 'Una fuente de tensión ideal apagada (0 V) es un cable: cortocircuito. Las de corriente se abren.' },
    { pregunta: 'En el método de nodos, las incógnitas son…', opciones: ['Las corrientes de malla', 'Las tensiones de los nodos respecto de la referencia', 'Las resistencias', 'Las potencias'], correcta: 1, explicacion: 'Se elige un nodo de referencia (0 V) y se calculan las tensiones de los demás nodos. Con ellas sale cualquier corriente: I = ΔV/R.' },
    { pregunta: 'Un circuito tiene 4 nodos. ¿Cuántas ecuaciones de nodo hay que plantear?', opciones: ['4', '3', '2', 'Depende de las mallas'], correcta: 1, explicacion: 'Con n nodos hay n − 1 incógnitas: uno de ellos es la referencia y vale 0 V.' },
    { pregunta: String.raw`En el sistema de nodos, el coeficiente de $V_1$ en la ecuación del nodo 1 es…`, opciones: ['La suma de las resistencias conectadas al nodo 1', 'La suma de las conductancias (1/R) conectadas al nodo 1', 'Menos la conductancia entre los nodos 1 y 2', 'La corriente de la fuente'], correcta: 1, explicacion: 'En la diagonal va la suma de 1/R de todas las ramas que tocan ese nodo; fuera de la diagonal, menos la conductancia que une los dos nodos.' },
    { pregunta: '¿Cuándo conviene usar nodos en vez de mallas?', opciones: ['Cuando hay muchas fuentes de tensión', 'Cuando hay fuentes de corriente y pocos nodos', 'Nunca, mallas siempre es mejor', 'Solo si no hay resistencias'], correcta: 1, explicacion: 'Las fuentes de corriente entran directo en el término independiente de la ecuación de nodo. Con mallas complican el planteo.' },
    { pregunta: 'Al resolver, V2 da un valor negativo. Eso significa que…', opciones: ['Hay un error seguro', 'El nodo 2 está a menor tensión que la referencia', 'La resistencia R2 es negativa', 'La fuente está rota'], correcta: 1, explicacion: 'Es perfectamente posible: si una fuente de corriente saca corriente del nodo, este puede quedar por debajo de masa.' },
    ],

  docente: String.raw`
<h3>Objetivo de la clase</h3>
<p>Que el alumno recupere fluidez en Ohm, serie/paralelo, divisor y mallas, porque todo lo que sigue (rectificadores, zener, polarización de transistores) se resuelve con esto. <b>Duración sugerida:</b> 1 clase (60–80 min).</p>
<h3>Secuencia sugerida</h3>
<ol>
<li><b>Diagnóstico (5 min):</b> preguntale qué es tensión y qué es corriente “con sus palabras”. Pedile que calcule 12 V / 4,7 kΩ de cabeza (≈ 2,55 mA). Si duda con unidades, insistí con el truco V/kΩ = mA.</li>
<li><b>Serie/paralelo (10 min):</b> ejercicio 2. Remarcá “el paralelo da menos que la menor” como chequeo.</li>
<li><b>Divisor (15 min):</b> abrí la simulación 1. Primero sin carga con R1 = R2. Después conectá RL = R2 y preguntá “¿por qué bajó?” antes de explicarlo. Ese “por qué” es el corazón de Thévenin y del efecto de carga del voltímetro (tema 5).</li>
<li><b>Mallas (20 min):</b> hacé el ejemplo de la teoría en pizarra compartida y después verificá con la simulación 2. Poné V2 alto (ej. 20 V) para que I2 dé negativa y discutan el signo.</li>
<li><b>Cierre (5 min):</b> autoevaluación juntos. Dejar ejercicios 3, 5 y 6 de tarea.</li>
</ol>
<h3>Errores frecuentes</h3>
<ul>
<li>Mezclar kΩ con Ω sin convertir (corrientes 1000 veces mal).</li>
<li>Usar la fórmula del divisor con carga conectada sin hacer el paralelo.</li>
<li>En mallas, olvidarse de restar la corriente de la malla vecina en la resistencia compartida.</li>
<li>Signo de las fuentes: si la corriente de malla <em>entra</em> por el + la fuente se resta.</li>
</ul>
<h3>Preguntas para hacerle pensar</h3>
<ul>
<li>¿Por qué en tu casa los artefactos están en paralelo y no en serie?</li>
<li>Si un divisor fuera una buena fuente de tensión, ¿para qué existirían los reguladores? (prepara el tema zener)</li>
</ul>
<h3>Recordatorio rápido para vos</h3>
<p>Cramer 2×2: $\begin{vmatrix}a&b\\c&d\end{vmatrix}=ad-bc$. $I_1$ = reemplazás la 1.ª columna por los términos independientes; $I_2$ = la 2.ª.</p>

<h3>Ampliación: método de nodos (sección 7 de la teoría)</h3>
<p><b>Por qué está:</b> en la carpeta (clase del 6/3) se resolvió un circuito con dos fuentes de corriente por nodos y Cramer ($\Delta=11/40$, $V_1=6{,}09\,\text{V}$, $V_2=5{,}82\,\text{V}$). <b>Duración sugerida:</b> 30–40 min.</p>
<ol>
<li><b>Arranque (5 min):</b> preguntá “¿qué pasa si en vez de una pila tengo una fuente que entrega siempre 3 mA, haga lo que haga?”. Presentá el símbolo de la fuente de corriente (círculo con flecha) y aclarale que la tensión en sus bornes la decide el resto del circuito.</li>
<li><b>Receta (10 min):</b> los 5 pasos. Remarcá que todo sale de LKC + Ohm escrito con <b>diferencias</b> de tensión.</li>
<li><b>Ejemplo de la carpeta (10 min):</b> hacelo en el pizarrón con kΩ y mA. Que el alumno arme la matriz con el “truco” (diagonal = suma de 1/R; afuera = −1/R común).</li>
<li><b>Simulación (10 min):</b> invertí IF2 y que prediga qué pasa con V2 antes de mirar. Buscá juntos el valor de IF1 que anula la corriente en R3 (2,8 mA).</li>
</ol>
<p><b>Errores frecuentes:</b> escribir $\frac{V_1}{R_3}$ en vez de $\frac{V_1-V_2}{R_3}$; cambiar los signos de las fuentes; usar Ω y A mezclados con kΩ y mA.</p>
<p><b>Repaso para vos:</b> conductancia $G=1/R$ (siemens). Cramer 2×2: $\Delta=ad-bc$, $x=\frac{e\,d-b\,f}{\Delta}$, $y=\frac{a\,f-c\,e}{\Delta}$. Transformación de fuentes: $V$ en serie con $R$ ⇔ $I=V/R$ en paralelo con $R$.</p>
`,
});
