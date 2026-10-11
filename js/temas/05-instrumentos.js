/* Tema 05 — Instrumentos de medición
   IMPORTANTE: los textos con LaTeX usan String.raw`...` para que "\frac" no se rompa. */
registrarTema({
  id: 'instrumentos',
  orden: 5,
  titulo: 'Instrumentos de medición',
  resumen: 'Multímetro, conexión, escalas, errores, efecto de carga y seguridad',
  confirmar: false,

  teoria: String.raw`
<p>Todo lo que calculamos en la carpeta hay que <b>comprobarlo midiendo</b>. Y medir bien no es solo “poner las puntas”: hay que saber <b>dónde</b> se conecta cada instrumento, <b>qué escala</b> elegir, <b>cuánto le podemos creer</b> al número que aparece y <b>cuánto altera el instrumento</b> al circuito que está midiendo. Un instrumento mal conectado puede dar una lectura absurda… o quemarse (y a veces lastimarnos).</p>
<p>El instrumento estrella del taller es el <b>multímetro</b> (o <em>tester</em>): voltímetro, amperímetro y óhmetro en un solo aparato.</p>

<h2>1. Multímetro digital y analógico</h2>
<div class="tabla-wrap"><table class="tabla">
<tr><th></th><th>Digital (DMM)</th><th>Analógico (de aguja)</th></tr>
<tr><td>Cómo muestra</td><td>Número en un display (LCD)</td><td>Aguja sobre una escala impresa</td></tr>
<tr><td>Resistencia interna como voltímetro</td><td>Alta y fija: típicamente <b>10 MΩ</b> en todas las escalas</td><td>Depende del alcance: <b>sensibilidad × alcance</b> (ej. 20 kΩ/V × 10 V = 200 kΩ)</td></tr>
<tr><td>Precisión</td><td>Mejor: ±(0,5 % lectura + 2 dígitos) es típico</td><td>Según la <b>clase</b> (1,5 o 2,5 son comunes)</td></tr>
<tr><td>Ventajas</td><td>Lectura directa, sin error de paralaje, autorrango, prueba de diodos, continuidad</td><td>Se ven muy bien las <b>tendencias</b> y variaciones (la aguja “se mueve”); no necesita pila para medir tensión</td></tr>
<tr><td>Desventajas</td><td>Si la magnitud varía, los números “bailan”</td><td>Error de paralaje, hay que elegir bien la escala, carga más al circuito</td></tr>
</table></div>
<p>Un multímetro digital común es de <b>“3½ dígitos”</b>: muestra hasta <b>1999</b> (2000 cuentas). Los tres dígitos completos van de 0 a 9 y el “medio dígito” de la izquierda solo puede ser 0 o 1. Por eso las escalas son 200 mV, 2 V, 20 V, 200 V: el máximo que se puede mostrar en cada una es 199,9 mV, 1,999 V, 19,99 V y 199,9 V.</p>

<h2>2. Bornes y selector</h2>
<div class="tabla-wrap"><table class="tabla">
<tr><th>Borne</th><th>Qué va ahí</th><th>Comentario</th></tr>
<tr><td><b>COM</b></td><td>Punta <b>negra</b>, siempre</td><td>Es la referencia (el “−” de la medición).</td></tr>
<tr><td><b>VΩ</b> (a veces VΩmA)</td><td>Punta roja para tensión, resistencia, diodos y continuidad</td><td>Entrada de alta resistencia (10 MΩ).</td></tr>
<tr><td><b>mA</b> (o µA/mA)</td><td>Punta roja para corrientes chicas</td><td>Adentro hay un <b>fusible</b> (ej. 200 mA o 500 mA) y una resistencia muy chica (<em>shunt</em>).</td></tr>
<tr><td><b>10A</b> (o 20A)</td><td>Punta roja para corrientes grandes</td><td>Shunt de centésimas de ohm. Muchas veces <b>sin fusible</b> o con uno de 10 A: mediciones cortas (10–15 s).</td></tr>
</table></div>
<div class="caja tip"><span class="caja-titulo">Cómo elegir la escala</span>
<ol>
<li>Si no tenés idea del valor, empezá por la <b>escala más alta</b> y andá bajando.</li>
<li>Quedate con la <b>escala más chica que no se pase</b>: así tenés más dígitos (mejor resolución) y menos error.</li>
<li>Si el display muestra un <b>“1” solo a la izquierda</b> (o <b>“OL”</b>, <em>overload</em>), el valor es mayor que la escala: subí una.</li>
</ol>
</div>

<h2>3. Cómo se conecta cada instrumento</h2>
<div class="dos-col">
<div>
<h3>Voltímetro: en <u>paralelo</u></h3>
<p>La tensión es una diferencia <b>entre dos puntos</b>, así que el voltímetro se conecta <b>entre</b> esos dos puntos, “abrazando” al componente, sin abrir el circuito. Si el rojo está en el punto de mayor potencial, la lectura es positiva; si invertís las puntas, el digital muestra un signo “−”.</p>
${Esq.svg(300, 170, [
  Esq.bat(30, 50, 30, 130, 'V', '9 V', -1), Esq.cable([[30, 50], [30, 30], [80, 30]]), Esq.nodo(80, 30),
  Esq.R(80, 30, 200, 30, 'R1', '', 1), Esq.nodo(200, 30), Esq.cable([[200, 30], [260, 30], [260, 55]]),
  Esq.R(260, 55, 260, 125, 'R2', '', 1), Esq.cable([[260, 125], [260, 150], [30, 150], [30, 130]]),
  Esq.cable([[80, 30], [80, 85], [110, 85]]), Esq.medidor(110, 85, 170, 85, 'V'), Esq.cable([[170, 85], [200, 85], [200, 30]]),
  Esq.texto(95, 78, '+', { size: 13, color: 'var(--red)' }),
], 'El voltímetro mide la tensión sobre R1: se conecta en paralelo.')}
</div>
<div>
<h3>Amperímetro: en <u>serie</u></h3>
<p>La corriente es lo que <b>pasa por</b> un cable, así que hay que <b>abrir el circuito</b> e intercalar el amperímetro para que la corriente lo atraviese. La punta roja en el borne <b>mA</b> o <b>10A</b>, nunca en VΩ.</p>
${Esq.svg(300, 170, [
  Esq.bat(30, 50, 30, 130, 'V', '9 V', -1), Esq.cable([[30, 50], [30, 30], [80, 30]]),
  Esq.R(80, 30, 200, 30, 'R1', '', 1), Esq.cable([[200, 30], [260, 30], [260, 55]]),
  Esq.R(260, 55, 260, 125, 'R2', '', 1), Esq.cable([[260, 125], [260, 150], [185, 150]]),
  Esq.medidor(185, 150, 115, 150, 'A'), Esq.cable([[115, 150], [30, 150], [30, 130]]),
  Esq.texto(180, 140, '+', { size: 13, color: 'var(--red)' }),
], 'Se abre el cable de abajo y la corriente pasa por el amperímetro.')}
</div>
</div>
<div class="caja ojo"><span class="caja-titulo">¡Nunca un amperímetro en paralelo con una fuente!</span>
Un amperímetro tiene una resistencia interna <b>casi nula</b> (es casi un cable). Si lo ponés en paralelo con una fuente o una batería, es un <b>cortocircuito</b>: con 12 V y 0,1 Ω total circularían ¡120 A! Se quema el fusible (en el mejor caso), se dañan las pistas internas o la batería entrega una corriente peligrosa. Error clásico: dejar la punta roja en el borne mA y después “medir tensión” de un enchufe o una batería.</div>

<h3>Óhmetro: con el circuito <u>desenergizado</u> y el componente <u>aislado</u></h3>
<p>El óhmetro <b>inyecta una corriente chiquita</b> desde su propia pila y mide la tensión que aparece: $R = V/I$. Por eso:</p>
<ul>
<li>El circuito tiene que estar <b>sin alimentación</b>. Si hay otra fuente, su tensión se suma a la del óhmetro y la lectura no tiene sentido (y podés dañar el instrumento).</li>
<li>El componente conviene <b>desconectarlo de un lado</b> (levantar una pata): si no, medís el paralelo con todo lo que esté conectado alrededor.</li>
<li>No toques las dos puntas con los dedos al medir resistencias grandes: tu cuerpo (cientos de kΩ) queda en paralelo.</li>
<li>Con capacitores grandes: <b>descargalos antes</b>.</li>
</ul>
${Esq.svg(420, 130, [
  Esq.texto(95, 14, 'Mal: R1 sigue en el circuito', { size: 12, color: 'var(--red)' }),
  Esq.cable([[20, 62], [50, 62]]), Esq.R(50, 62, 140, 62, 'R1', '', 1), Esq.cable([[140, 62], [170, 62]]),
  Esq.nodo(50, 62), Esq.nodo(140, 62),
  Esq.cable([[50, 62], [50, 107], [70, 107]]), Esq.medidor(70, 107, 120, 107, 'Ω'), Esq.cable([[120, 107], [140, 107], [140, 62]]),
  Esq.texto(315, 14, 'Bien: R1 desconectada y sin tensión', { size: 12, color: 'var(--green)' }),
  Esq.R(265, 62, 365, 62, 'R1', '', 1),
  Esq.cable([[265, 62], [265, 107], [290, 107]]), Esq.medidor(290, 107, 340, 107, 'Ω'), Esq.cable([[340, 107], [365, 107], [365, 62]]),
], 'Midiendo R1 sin desconectarla, en realidad medís R1 en paralelo con el resto del circuito.')}

<h2>4. Medición en continua y en alterna</h2>
<p>El selector tiene posiciones separadas: <b>V⎓</b> (continua, CC/DC) y <b>V~</b> (alterna, CA/AC). En alterna, el multímetro muestra el <b>valor eficaz</b> (RMS): la tensión continua que produciría el mismo calentamiento en una resistencia.</p>
<div class="caja formula"><span class="caja-titulo">Valor eficaz de las formas de onda típicas (sin componente continua)</span>
$$\text{Senoidal: } V_{ef}=\frac{V_p}{\sqrt2}\approx0{,}707\,V_p\qquad\text{Cuadrada: } V_{ef}=V_p\qquad\text{Triangular: } V_{ef}=\frac{V_p}{\sqrt3}\approx0{,}577\,V_p$$
<p>Ejemplo: la red de 220 V es el valor eficaz; el pico es $220\cdot\sqrt2\approx311\,\text{V}$.</p>
</div>
<p><b>¿Qué es “True RMS”?</b> Los multímetros baratos no calculan de verdad el valor eficaz: rectifican la señal, miden su <b>valor medio</b> y lo multiplican por $\frac{\pi}{2\sqrt2}\approx1{,}11$ (el “factor de forma” de la senoidal). Eso da bien <b>solo con senoidales puras</b>. Un multímetro <b>True RMS</b> calcula $\sqrt{\overline{v^2}}$ y acierta con cualquier forma de onda.</p>
<div class="caja ejemplo"><span class="caja-titulo">Ejemplo: cuadrada de ±5 V con un tester común</span>
Valor medio rectificado = 5 V → el tester muestra $1{,}11\cdot5=5{,}55\,\text{V}$, pero el eficaz real es 5 V: <b>error de +11 %</b>. Con una triangular de 5 V de pico: muestra $1{,}11\cdot2{,}5=2{,}78\,\text{V}$ y el real es $5/\sqrt3=2{,}89\,\text{V}$ (−3,8 %). Con señales PWM, dimmers o fuentes conmutadas el error puede ser enorme.
</div>
<div class="caja ojo"><span class="caja-titulo">Ojo con la frecuencia</span>
En alterna, un multímetro común mide bien solo hasta algunos cientos de Hz (mirá el manual: “40–400 Hz” es típico). Para frecuencias más altas, o para ver la forma de onda, se usa el <b>osciloscopio</b> (tema siguiente).</div>

<h2>5. Errores de medición</h2>
<p>Ninguna medición es perfecta. Llamamos $V_v$ al valor verdadero (o el más confiable que tenemos) y $V_m$ al medido.</p>
<div class="caja formula"><span class="caja-titulo">Tipos de error</span>
$$E_a = V_m - V_v\qquad e_r=\frac{E_a}{V_v}\qquad e_\% = \frac{E_a}{V_v}\cdot100\,\%$$
<p>El <b>error absoluto</b> tiene unidades (V, mA…). El <b>relativo</b> no tiene unidades y es el que dice si la medición es buena o mala: 0,1 V de error es muchísimo midiendo 0,5 V (20 %) y nada midiendo 220 V (0,05 %).</p>
</div>
<div class="caja ejemplo"><span class="caja-titulo">Ejemplo</span>
Una fuente de 5,00 V medida da 4,90 V: $E_a=-0{,}10\,\text{V}$, $e_\%=\frac{-0{,}10}{5{,}00}\cdot100=-2\,\%$.
</div>
<p>Fuentes de error: el instrumento en sí (su precisión), el operador (paralaje, escala mal elegida), el <b>efecto de carga</b> (el instrumento cambia el circuito) y el ambiente (temperatura, interferencias).</p>

<h2>6. Precisión de un multímetro digital</h2>
<p>El manual da la precisión así: <b>±(% de la lectura + cantidad de dígitos)</b>. Los “dígitos” son unidades del <b>último dígito</b> del display en esa escala, es decir, múltiplos de la <b>resolución</b>.</p>
<div class="caja formula"><span class="caja-titulo">Error de un digital</span>
$$\Delta V = \pm\left(\frac{p\,\%}{100}\cdot\text{lectura} + n\cdot\text{resolución}\right)$$
<p>Resolución = el valor del último dígito. En 3½ dígitos: escala 2 V → 0,001 V; escala 20 V → 0,01 V; escala 200 V → 0,1 V.</p>
</div>
<div class="caja ejemplo"><span class="caja-titulo">Ejemplo: ±(0,5 % + 2 díg) midiendo una fuente de 12 V</span>
<p><b>Escala 20 V</b> → lectura 12,00 V, resolución 0,01 V: $\Delta V = 0{,}005\cdot12{,}00+2\cdot0{,}01=0{,}06+0{,}02=0{,}08\,\text{V}$. El valor real está entre <b>11,92 V y 12,08 V</b> (error relativo 0,67 %).</p>
<p><b>Escala 200 V</b> → lectura 12,0 V, resolución 0,1 V: $\Delta V = 0{,}06+2\cdot0{,}1=0{,}26\,\text{V}$ → entre 11,74 V y 12,26 V (2,2 %). ¡Más del triple de error por usar una escala grande!</p>
</div>

<h2>7. Clase de un instrumento analógico</h2>
<p>En un instrumento de aguja, la <b>clase</b> es el error máximo expresado como porcentaje <b>del alcance</b> (el fondo de escala), no de la lectura. Ese error absoluto es <b>el mismo en toda la escala</b>.</p>
<div class="caja formula"><span class="caja-titulo">Error de un analógico</span>
$$\Delta V = \pm\frac{\text{clase}\cdot\text{alcance}}{100}\qquad e_\%=\frac{\Delta V}{\text{lectura}}\cdot100$$
</div>
<div class="caja ejemplo"><span class="caja-titulo">Ejemplo: clase 2,5, alcance 10 V</span>
$\Delta V=\frac{2{,}5\cdot10}{100}=0{,}25\,\text{V}$ en cualquier punto de la escala. Si leés 8 V: $e_\%=0{,}25/8=3{,}1\,\%$. Si leés 2 V: $e_\%=0{,}25/2=12{,}5\,\%$.
</div>
<div class="caja tip"><span class="caja-titulo">Por qué conviene medir en el último tercio de la escala</span>
Como el error absoluto es fijo, cuanto más grande la deflexión, menor el error relativo. Si la aguja queda en el último tercio (más de 2/3 del alcance), el error relativo es como mucho $1{,}5\times$ la clase. Por eso se elige el alcance para que la aguja quede “bien arriba”, sin pasarse.
</div>
<p><b>Resolución</b> (o sensibilidad de lectura): el menor cambio que podés distinguir. En un digital, el último dígito; en un analógico, aproximadamente media división de la escala. Ojo: <b>resolución no es precisión</b>. Un display con muchos dígitos puede estar mal calibrado.</p>

<h2>8. Efecto de carga</h2>
<p>Al conectar un instrumento <b>cambiamos el circuito</b>. Un buen instrumento es el que lo cambia lo menos posible.</p>
<h3>Voltímetro: tiene que tener resistencia muy ALTA</h3>
<p>El voltímetro queda <b>en paralelo</b> con lo que medimos, como una resistencia $R_V$. Si $R_V$ no es mucho mayor que las resistencias del circuito, “se roba” corriente y la tensión baja (es exactamente el divisor con carga del tema 1).</p>
<ul>
<li><b>Digital:</b> $R_V\approx10\,\text{M}\Omega$ en todas las escalas.</li>
<li><b>Analógico:</b> $R_V=\text{sensibilidad}\cdot\text{alcance}$. Un tester de 20 kΩ/V en el alcance de 10 V tiene $R_V=200\,\text{k}\Omega$; en 2,5 V, solo 50 kΩ.</li>
</ul>
${Esq.svg(380, 190, [
  Esq.bat(40, 55, 40, 145, 'Vcc', '10 V', -1), Esq.cable([[40, 55], [40, 25], [180, 25], [180, 30]]),
  Esq.R(180, 30, 180, 95, 'R1', '100 kΩ', -1), Esq.nodo(180, 95), Esq.R(180, 95, 180, 160, 'R2', '100 kΩ', -1),
  Esq.cable([[180, 160], [180, 175], [40, 175], [40, 145]]),
  Esq.cable([[180, 95], [270, 95], [270, 100]]), Esq.medidor(270, 100, 270, 160, 'V', 'RV', '', 1),
  Esq.cable([[270, 160], [270, 175], [180, 175]]), Esq.nodo(180, 175),
], 'El voltímetro (RV) queda en paralelo con R2.')}
<div class="caja ejemplo"><span class="caja-titulo">Ejemplo: divisor de 2 × 100 kΩ con 10 V (sin instrumento: 5 V)</span>
<p><b>Analógico 20 kΩ/V, alcance 10 V</b> → $R_V=200\,\text{k}\Omega$. $R_2\parallel R_V=\frac{100\cdot200}{300}=66{,}7\,\text{k}\Omega$ → $V=10\cdot\frac{66{,}7}{100+66{,}7}=4{,}00\,\text{V}$. ¡Error de −20 %!</p>
<p><b>Digital 10 MΩ</b> → $R_2\parallel R_V=99{,}0\,\text{k}\Omega$ → $V=4{,}975\,\text{V}$ (−0,5 %).</p>
<p>Con el analógico en alcance 50 V ($R_V=1\,\text{M}\Omega$) la lectura sería 4,76 V: carga menos, pero la aguja queda muy abajo y se lee peor.</p>
</div>
<div class="caja idea"><span class="caja-titulo">Regla práctica</span>
El instrumento “ve” la resistencia de Thévenin del circuito entre las puntas ($R_{th}$; en un divisor de dos iguales, $R/2$). La lectura es $V_{real}\cdot\frac{R_V}{R_V+R_{th}}$. Si $R_V\geq100\cdot R_{th}$, el error por carga es menor al 1 %.
</div>
<h3>Amperímetro: tiene que tener resistencia muy BAJA</h3>
<p>El amperímetro queda <b>en serie</b>: su resistencia interna (el <em>shunt</em> más el fusible) se suma al circuito y la corriente baja un poco. El multímetro mide la caída en el shunt; en un DMM típico el fondo de escala produce unos 200 mV (“tensión de carga” o <em>burden voltage</em>): shunt de ~1 Ω en 200 mA, ~10 Ω en 20 mA, ~100 Ω en 2 mA.</p>
<div class="caja ejemplo"><span class="caja-titulo">Ejemplo</span>
5 V sobre 100 Ω → 50 mA. Con el amperímetro en 200 mA (1 Ω): $I=\frac{5}{101}=49{,}5\,\text{mA}$ (−1 %), despreciable. Pero con 1 V sobre 10 Ω (100 mA reales) mide $\frac{1}{11}=90{,}9\,\text{mA}$: −9 %. En circuitos de baja tensión el amperímetro molesta más.
</div>

<h2>9. Continuidad y prueba de diodos</h2>
<ul>
<li><b>Continuidad (símbolo de parlante ♪):</b> pita si la resistencia entre puntas es menor que unas decenas de ohm (≈ 30–50 Ω). Sirve para encontrar cables cortados, pistas interrumpidas, fusibles quemados o cortocircuitos. Siempre <b>sin tensión</b>.</li>
<li><b>Prueba de diodos (símbolo ▶|):</b> el tester hace circular ~1 mA y muestra la <b>tensión directa</b> en mV o V. Diodo de silicio sano: <b>0,5–0,7 V</b> en directa (rojo en el ánodo) y <b>“1”/OL</b> en inversa. LED: 1,8–3 V (muchos encienden débilmente). Si da casi 0 en los dos sentidos: diodo en corto; si da OL en los dos: abierto.</li>
</ul>

<h2>10. Seguridad: categorías CAT</h2>
<p>Lo peligroso no es solo la tensión que medís, sino los <b>picos transitorios</b> (rayos, conmutaciones) que pueden aparecer en la instalación. Los multímetros se clasifican por <b>categoría de medición</b> según dónde se pueden usar:</p>
<div class="tabla-wrap"><table class="tabla">
<tr><th>Categoría</th><th>Dónde</th><th>Ejemplos</th></tr>
<tr><td><b>CAT I</b></td><td>Circuitos electrónicos sin conexión directa a la red</td><td>Plaquetas alimentadas por pilas o fuentes aisladas</td></tr>
<tr><td><b>CAT II</b></td><td>Equipos enchufados a tomacorrientes</td><td>Electrodomésticos, herramientas portátiles, el tomacorriente</td></tr>
<tr><td><b>CAT III</b></td><td>Instalación fija del edificio</td><td>Tableros, cableado, motores fijos</td></tr>
<tr><td><b>CAT IV</b></td><td>Origen de la instalación</td><td>Acometida, medidor, líneas exteriores</td></tr>
</table></div>
<div class="caja ojo"><span class="caja-titulo">Reglas de oro</span>
<ul>
<li>Antes de medir, mirá <b>dónde está la punta roja y el selector</b>. Recién después tocá el circuito.</li>
<li>Usá puntas en buen estado, con protector para los dedos. Agarralas por detrás de la protección.</li>
<li>Para medir la red usá un instrumento CAT II o superior, de 600 V como mínimo, y una sola mano si podés.</li>
<li>No cambies el selector con las puntas conectadas a tensión.</li>
<li>Si el fusible de mA se quemó, reemplazalo por uno <b>del mismo tipo y valor</b> (nunca un alambre).</li>
</ul>
</div>

<h2>11. Otros instrumentos del laboratorio</h2>
<ul>
<li><b>Pinza amperométrica:</b> mide corriente <b>sin abrir el circuito</b>, abrazando un conductor. En alterna funciona como un transformador (el cable es el primario); las que miden continua usan un sensor de efecto Hall. Hay que abrazar <b>un solo conductor</b>: si abrazás el cable entero (fase y neutro), las corrientes se cancelan y marca cero.</li>
<li><b>Fuente de laboratorio:</b> entrega una tensión continua ajustable (ej. 0–30 V) con <b>limitación de corriente</b>. Se ajusta la tensión (modo CV, tensión constante) y un límite de corriente: si el circuito intenta consumir más, la fuente pasa a modo CC (corriente constante) y baja la tensión. Es la mejor protección cuando probás un circuito nuevo.</li>
<li><b>Generador de funciones:</b> produce señales senoidales, cuadradas y triangulares de frecuencia, amplitud y <em>offset</em> (nivel de continua) ajustables. Su salida suele tener 50 Ω de resistencia interna.</li>
<li><b>Osciloscopio:</b> muestra la forma de la tensión en función del tiempo. Es el tema siguiente.</li>
</ul>
`,

  simulaciones: [
    {
      titulo: 'Efecto de carga del voltímetro',
      descripcion: 'Divisor con dos resistencias iguales: la tensión real sobre R2 es Vcc/2. Cambiá las resistencias y el voltímetro y mirá cuánto “se equivoca” por cargar al circuito.',
      montar(cont, H) {
        const { controles, vista } = H.layout(cont);
        const vcc = H.slider(controles, { label: 'Vcc', min: 1, max: 30, step: 0.5, value: 10, unidad: 'V', onInput: upd });
        const rr = H.slider(controles, { label: 'R1 = R2', min: 1e3, max: 10e6, log: true, value: 100e3, unidad: 'Ω', onInput: upd });
        H.sep(controles);
        const tipo = H.select(controles, {
          label: 'Voltímetro', value: 'ana10', onChange: upd, opciones: [
            { v: 'ideal', t: 'Ideal (R infinita)' },
            { v: 'dig', t: 'Digital (10 MΩ)' },
            { v: 'ana2.5', t: 'Analógico 20 kΩ/V – alcance 2,5 V' },
            { v: 'ana10', t: 'Analógico 20 kΩ/V – alcance 10 V' },
            { v: 'ana50', t: 'Analógico 20 kΩ/V – alcance 50 V' },
          ],
        });
        const fig = H.el('div'); vista.append(fig);
        const cvMed = H.canvas(vista, { alto: 170, dibujar: dibMedidor });
        const cvG = H.canvas(vista, { alto: 230, dibujar: dibGrafico });
        const lec = H.lecturas(vista);
        const nota = H.nota(vista);

        const RV = (t) => t === 'ideal' ? Infinity : t === 'dig' ? 10e6 : 20e3 * parseFloat(t.slice(3));
        const alcance = (t) => t.startsWith('ana') ? parseFloat(t.slice(3)) : null;
        const medir = (R, Rv, V) => { const p = Number.isFinite(Rv) ? R * Rv / (R + Rv) : R; return V * p / (R + p); };
        let st = {};

        function dibMedidor(ctx, w, h) {
          const { Vm, t } = st; if (Vm === undefined) return;
          const A = alcance(t);
          if (A) {
            // Instrumento de aguja
            const cx = w / 2, cy = h - 24, r = Math.min(w * 0.4, h - 62);
            ctx.fillStyle = '#f7f3e6'; ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.roundRect ? ctx.roundRect(cx - r - 24, 6, 2 * r + 48, h - 12, 10) : ctx.rect(cx - r - 24, 6, 2 * r + 48, h - 12); ctx.fill(); ctx.stroke();
            const a0 = Math.PI * 0.82, a1 = Math.PI * 0.18; // ángulos (y hacia arriba)
            const ang = (f) => a0 + (a1 - a0) * f;
            ctx.strokeStyle = '#222'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, r, -a0, -a1); ctx.stroke();
            // último tercio sombreado
            ctx.strokeStyle = 'rgba(33,122,60,.45)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, r - 4, -ang(2 / 3), -a1); ctx.stroke();
            ctx.fillStyle = '#222'; ctx.font = '600 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            const nDiv = 50;
            for (let i = 0; i <= nDiv; i++) {
              const f = i / nDiv, a = ang(f), L = i % 10 === 0 ? 12 : i % 5 === 0 ? 8 : 4;
              ctx.lineWidth = i % 10 === 0 ? 1.6 : 1; ctx.strokeStyle = '#222';
              ctx.beginPath(); ctx.moveTo(cx + r * Math.cos(a), cy - r * Math.sin(a)); ctx.lineTo(cx + (r - L) * Math.cos(a), cy - (r - L) * Math.sin(a)); ctx.stroke();
              if (i % 10 === 0) ctx.fillText(H.num(A * f, 2), cx + (r + 12) * Math.cos(a), cy - (r + 12) * Math.sin(a));
            }
            ctx.fillText('V⎓  20 kΩ/V', cx, cy - r * 0.45);
            const f = Math.max(-0.02, Math.min(1.04, Vm / A));
            const a = ang(f);
            ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 2.2;
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + (r - 2) * Math.cos(a), cy - (r - 2) * Math.sin(a)); ctx.stroke();
            ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(cx, cy, 6, 0, 7); ctx.fill();
            if (Vm > A) { ctx.fillStyle = '#c0392b'; ctx.font = '700 12px sans-serif'; ctx.fillText('¡FUERA DE ESCALA!', cx, cy - 26); }
          } else {
            // Display digital
            const bw = Math.min(w - 20, 300), bx = (w - bw) / 2;
            ctx.fillStyle = '#f0b429'; ctx.strokeStyle = '#8a6100'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.roundRect ? ctx.roundRect(bx, 8, bw, h - 16, 14) : ctx.rect(bx, 8, bw, h - 16); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#b9c7a3'; ctx.fillRect(bx + 16, 24, bw - 32, h - 62);
            ctx.fillStyle = '#1b2416'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
            const txt = t === 'ideal' ? Vm.toFixed(4) : (Vm < 2 ? Vm.toFixed(3) : Vm < 20 ? Vm.toFixed(2) : Vm.toFixed(1));
            ctx.font = '700 ' + Math.min(52, (bw - 80) / 4.2) + 'px "JetBrains Mono", monospace';
            ctx.fillText(txt, bx + bw - 46, 24 + (h - 62) / 2);
            ctx.font = '700 16px sans-serif'; ctx.fillText('V', bx + bw - 24, 24 + (h - 62) / 2 + 8);
            ctx.font = '600 11px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#3a2a00';
            ctx.fillText(t === 'ideal' ? 'VOLTÍMETRO IDEAL' : 'DMM · Rin = 10 MΩ', bx + bw / 2, h - 24);
          }
        }

        function dibGrafico(ctx, w, h) {
          const { R, t } = st; if (!R) return;
          const P = H.ejes(ctx, w, h, {
            xmin: 3, xmax: 7, ymin: -100, ymax: 5, xticks: [3, 4, 5, 6, 7], yticks: [-100, -80, -60, -40, -20, 0],
            xfmt: v => H.fmt(Math.pow(10, v), 'Ω'), yfmt: v => v + ' %', ml: 50, mr: 24, mt: 26,
          });
          const tipos = [['dig', H.col('c3')], ['ana2.5', H.col('c4')], ['ana10', H.col('c1')], ['ana50', H.col('c2')]];
          for (const [tt, c] of tipos) {
            const Rv = RV(tt);
            P.fn(x => { const Rx = Math.pow(10, x); return (medir(Rx, Rv, 1) - 0.5) / 0.5 * 100; }, { color: c, ancho: tt === t ? 3 : 1.3, guiones: tt === t ? null : [4, 4] });
          }
          P.hline(-1, { color: H.col('muted') });
          ctx.fillStyle = H.col('muted'); ctx.font = '600 11px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
          ctx.fillText('Error de la lectura según R1 = R2 (punteada gris: −1 %)', P.x0, P.y0 - 8);
          const e = (medir(R, RV(t), 1) - 0.5) / 0.5 * 100;
          P.punto(Math.log10(R), e, { color: H.col('red'), r: 6 });
          // leyenda
          ctx.font = '600 11px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          const nombres = { dig: 'Digital 10 MΩ', 'ana2.5': 'Analóg. 2,5 V (50 kΩ)', ana10: 'Analóg. 10 V (200 kΩ)', ana50: 'Analóg. 50 V (1 MΩ)' };
          tipos.forEach(([tt, c], i) => {
            const y = P.y0 + h * 0.36 + i * 15, x = P.x0 + 10;
            ctx.fillStyle = c; ctx.fillRect(x, y - 2, 14, 4); ctx.fillStyle = H.col('ink'); ctx.fillText(nombres[tt], x + 20, y);
          });
        }

        function upd() {
          const V = vcc.value, R = rr.value, t = tipo.value, Rv = RV(t), A = alcance(t);
          const Vr = V / 2, Vm = medir(R, Rv, V), err = (Vm - Vr) / Vr * 100;
          st = { V, R, t, Vm };
          fig.innerHTML = Esq.svg(400, 200, [
            Esq.bat(40, 60, 40, 150, 'Vcc', H.fmt(V, 'V'), -1), Esq.cable([[40, 60], [40, 25], [180, 25], [180, 32]]),
            Esq.R(180, 32, 180, 100, 'R1', H.fmt(R, 'Ω'), -1), Esq.nodo(180, 100), Esq.R(180, 100, 180, 168, 'R2', H.fmt(R, 'Ω'), -1),
            Esq.cable([[180, 168], [180, 182], [40, 182], [40, 150]]),
            Esq.cable([[180, 100], [290, 100], [290, 105]]),
            Esq.medidor(290, 105, 290, 165, 'V', 'RV', Number.isFinite(Rv) ? H.fmt(Rv, 'Ω') : '∞', 1),
            Esq.cable([[290, 165], [290, 182], [180, 182]]), Esq.nodo(180, 182),
            Esq.texto(235, 92, 'Vreal = ' + H.fmt(Vr, 'V'), { color: 'var(--accent)', size: 12 }),
          ]);
          lec.set([
            { k: 'Tensión real sobre R2', v: H.fmt(Vr, 'V') },
            { k: 'Lo que marca', v: H.fmt(Vm, 'V', 4), estado: Math.abs(err) < 1 ? 'ok' : Math.abs(err) < 5 ? 'alerta' : 'mal' },
            { k: 'Error por carga', v: H.num(err, 2) + ' %', estado: Math.abs(err) < 1 ? 'ok' : Math.abs(err) < 5 ? 'alerta' : 'mal' },
            { k: 'R del voltímetro', v: Number.isFinite(Rv) ? H.fmt(Rv, 'Ω') : '∞' },
            { k: 'Rth vista (R/2)', v: H.fmt(R / 2, 'Ω') },
          ]);
          let txt = 'El voltímetro ve $R_{th}=R/2$ = ' + H.fmt(R / 2, 'Ω') + String.raw` y marca $V_{real}\cdot\frac{R_V}{R_V+R_{th}}$. `;
          if (t === 'ideal') txt = 'Voltímetro ideal: no toma corriente, así que no altera el circuito y marca exactamente Vcc/2. No existe, pero es la referencia.';
          else if (Math.abs(err) < 1) txt += '<b>Error menor al 1 %:</b> R_V es más de 100 veces mayor que la Rth del circuito; el instrumento casi no molesta.';
          else if (Math.abs(err) < 5) txt += '<b>Error apreciable:</b> la resistencia del voltímetro empieza a ser comparable con la del circuito.';
          else txt += '<b>Error grande:</b> el voltímetro queda en paralelo con R2 y baja muchísimo la tensión. ¡Lo que medís no es lo que hay cuando el instrumento no está!';
          if (A && Vm > A) txt += ' <b>Además la aguja se pasa del alcance:</b> elegí un alcance mayor.';
          else if (A && Vm < A / 3) txt += ' La aguja queda en el primer tercio de la escala: se lee con mucho error de clase.';
          nota.innerHTML = txt;
          if (window.renderMathInElement) renderMathInElement(nota, { delimiters: [{ left: '$', right: '$', display: false }], throwOnError: false });
          cvMed.redibujar(); cvG.redibujar();
        }
        upd();
      },
    },
    {
      titulo: 'Multímetro virtual',
      descripcion: 'Circuito serie: fuente + R1 + R2. Elegí cómo conectar el multímetro, la posición de la llave y el borne de la punta roja. Probá también las conexiones incorrectas.',
      montar(cont, H) {
        const { controles, vista } = H.layout(cont);
        H.titulo(controles, 'Circuito');
        const vs = H.slider(controles, { label: 'Fuente V', min: 1, max: 24, step: 0.5, value: 12, unidad: 'V', onInput: upd });
        const r1 = H.slider(controles, { label: 'R1', min: 10, max: 1e6, log: true, value: 1e3, unidad: 'Ω', onInput: upd });
        const r2 = H.slider(controles, { label: 'R2', min: 10, max: 1e6, log: true, value: 2.2e3, unidad: 'Ω', onInput: upd });
        H.sep(controles);
        H.titulo(controles, 'Multímetro');
        const modo = H.select(controles, {
          label: 'Conexión de las puntas', value: 'vr1', onChange: upd, opciones: [
            { v: 'vr1', t: 'En paralelo con R1' },
            { v: 'vr2', t: 'En paralelo con R2' },
            { v: 'vf', t: 'En paralelo con la fuente' },
            { v: 'serie', t: 'En serie (abriendo el cable de abajo)' },
            { v: 'ais', t: 'Sobre R1 desconectada y sin tensión' },
          ],
        });
        const POS = [
          { k: 'V200m', g: 'V', FS: 0.2, u: 'mV', m: 1e-3, d: 1, lab: '200m' },
          { k: 'V2', g: 'V', FS: 2, u: 'V', m: 1, d: 3, lab: '2' },
          { k: 'V20', g: 'V', FS: 20, u: 'V', m: 1, d: 2, lab: '20' },
          { k: 'V200', g: 'V', FS: 200, u: 'V', m: 1, d: 1, lab: '200' },
          { k: 'A2m', g: 'A', FS: 0.002, u: 'mA', m: 1e-3, d: 3, lab: '2m' },
          { k: 'A20m', g: 'A', FS: 0.02, u: 'mA', m: 1e-3, d: 2, lab: '20m' },
          { k: 'A200m', g: 'A', FS: 0.2, u: 'mA', m: 1e-3, d: 1, lab: '200m' },
          { k: 'A10', g: 'A', FS: 20, u: 'A', m: 1, d: 2, lab: '10A' },
          { k: 'R200', g: 'R', FS: 200, u: 'Ω', m: 1, d: 1, lab: '200' },
          { k: 'R2k', g: 'R', FS: 2e3, u: 'kΩ', m: 1e3, d: 3, lab: '2k' },
          { k: 'R20k', g: 'R', FS: 20e3, u: 'kΩ', m: 1e3, d: 2, lab: '20k' },
          { k: 'R200k', g: 'R', FS: 200e3, u: 'kΩ', m: 1e3, d: 1, lab: '200k' },
          { k: 'R2M', g: 'R', FS: 2e6, u: 'MΩ', m: 1e6, d: 3, lab: '2M' },
        ];
        const nombreG = { V: 'V⎓', A: 'A⎓', R: 'Ω' };
        const llave = H.select(controles, {
          label: 'Llave selectora', value: 'V20', onChange: upd,
          opciones: POS.map(p => ({ v: p.k, t: nombreG[p.g] + '  ' + (p.k === 'A10' ? '10 A' : p.u === 'kΩ' || p.u === 'MΩ' ? p.lab : H.fmt(p.FS, p.g === 'R' ? 'Ω' : p.g)) })),
        });
        const borne = H.select(controles, {
          label: 'Punta roja en el borne', value: 'VΩ', onChange: upd,
          opciones: [{ v: 'VΩ', t: 'VΩ' }, { v: 'mA', t: 'mA (fusible 200 mA)' }, { v: '10A', t: '10A (fusible 10 A)' }],
        });
        const inv = H.check(controles, { label: 'Invertir las puntas', value: false, onChange: upd });
        const fus = { mA: false, '10A': false };
        let pico = 0;
        H.boton(controles, 'Cambiar fusibles', () => { fus.mA = false; fus['10A'] = false; upd(); }, 'btn chico');

        const fila = H.el('div', { style: 'display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:center' });
        vista.append(fila);
        const fig = H.el('div', { style: 'flex:1 1 320px;min-width:0' });
        const caja = H.el('div', { style: 'flex:0 0 250px;width:250px' });
        fila.append(fig, caja);
        const cvM = H.canvas(caja, { alto: 330, dibujar: dibMulti });
        const lec = H.lecturas(vista);
        const nota = H.nota(vista);

        const rInt = 0.05; // resistencia interna de la fuente (Ω)
        let disp = { txt: '', u: '', ol: false };

        // Resuelve el circuito por nodos. nodos: 0 = masa, 1 = A (+ fuente), 2 = B, 3 = B' (si hay corte abajo)
        function resolver(serie, Vf, iny) {
          const n = serie ? 3 : 2;
          const G = Array.from({ length: n }, () => Array(n).fill(0)), I = Array(n).fill(0);
          const add = (a, b, R) => {
            const g = 1 / R;
            if (a) G[a - 1][a - 1] += g; if (b) G[b - 1][b - 1] += g;
            if (a && b) { G[a - 1][b - 1] -= g; G[b - 1][a - 1] -= g; }
          };
          add(1, 0, rInt); I[0] += Vf / rInt;
          add(1, 2, r1.value);
          add(2, serie ? 3 : 0, r2.value);
          for (let i = 0; i < n; i++) G[i][i] += 1e-15;
          if (iny) { if (iny[0]) I[iny[0] - 1] += 1; if (iny[1]) I[iny[1] - 1] -= 1; }
          const v = H.resolver(G, I) || Array(n).fill(0);
          return [0, ...v];
        }

        function dibMulti(ctx, w, h) {
          const bx = 8, by = 6, bw = w - 16, bh = h - 12;
          ctx.fillStyle = '#f0b429'; ctx.strokeStyle = '#8a6100'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.roundRect ? ctx.roundRect(bx, by, bw, bh, 16) : ctx.rect(bx, by, bw, bh); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#2b2f33'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(bx + 8, by + 8, bw - 16, bh - 16, 12) : ctx.rect(bx + 8, by + 8, bw - 16, bh - 16); ctx.fill();
          // LCD
          ctx.fillStyle = '#b9c7a3'; ctx.fillRect(bx + 20, by + 18, bw - 40, 64);
          ctx.fillStyle = '#1b2416'; ctx.textBaseline = 'middle';
          ctx.font = '700 40px "JetBrains Mono", monospace';
          if (disp.ol) { ctx.textAlign = 'left'; ctx.fillText('1', bx + 32, by + 50); ctx.textAlign = 'right'; ctx.fillText('   ', bx + bw - 54, by + 50); }
          else { ctx.textAlign = 'right'; ctx.fillText(disp.txt, bx + bw - 54, by + 50); }
          ctx.font = '700 14px sans-serif'; ctx.textAlign = 'left'; ctx.fillText(disp.u, bx + bw - 50, by + 60);
          if (disp.fus) { ctx.fillStyle = '#b42318'; ctx.font = '700 10px sans-serif'; ctx.fillText('FUSE', bx + 26, by + 28); }
          // Dial
          const cx = w / 2, cy = by + 186, rk = 34, rl = 70;
          const N = POS.length, idx = POS.findIndex(p => p.k === llave.value);
          const angDeg = (i) => 210 - i * (240 / (N - 1));
          ctx.font = '600 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          const colG = { V: '#ffd166', A: '#ff8f8f', R: '#8fd3ff' };
          POS.forEach((p, i) => {
            const a = angDeg(i) * Math.PI / 180;
            ctx.fillStyle = i === idx ? '#ffffff' : colG[p.g];
            ctx.font = (i === idx ? '800 ' : '600 ') + '10px sans-serif';
            ctx.fillText(p.lab, cx + rl * Math.cos(a), cy - rl * Math.sin(a));
            ctx.strokeStyle = '#777'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(cx + (rk + 6) * Math.cos(a), cy - (rk + 6) * Math.sin(a)); ctx.lineTo(cx + (rk + 12) * Math.cos(a), cy - (rk + 12) * Math.sin(a)); ctx.stroke();
          });
          ctx.font = '800 12px sans-serif';
          ctx.fillStyle = colG.V; ctx.fillText('V⎓', cx - 97, cy);
          ctx.fillStyle = colG.A; ctx.fillText('A⎓', cx, cy - 92);
          ctx.fillStyle = colG.R; ctx.fillText('Ω', cx + 97, cy);
          ctx.fillStyle = '#111'; ctx.strokeStyle = '#555'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(cx, cy, rk, 0, 7); ctx.fill(); ctx.stroke();
          const a = angDeg(idx) * Math.PI / 180;
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(cx + 6 * Math.cos(a), cy - 6 * Math.sin(a)); ctx.lineTo(cx + (rk - 4) * Math.cos(a), cy - (rk - 4) * Math.sin(a)); ctx.stroke();
          // Bornes
          const jacks = ['10A', 'mA', 'COM', 'VΩ'], jy = by + bh - 42;
          jacks.forEach((j, i) => {
            const x = bx + 30 + i * (bw - 60) / 3;
            const roja = j === borne.value, negra = j === 'COM';
            ctx.fillStyle = roja ? '#d62828' : negra ? '#111' : '#555';
            ctx.strokeStyle = (j === 'mA' && fus.mA) || (j === '10A' && fus['10A']) ? '#ff4d4d' : '#999'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(x, jy, 11, 0, 7); ctx.fill(); ctx.stroke();
            if (roja || negra) { ctx.fillStyle = '#ddd'; ctx.beginPath(); ctx.arc(x, jy, 4, 0, 7); ctx.fill(); }
            ctx.fillStyle = '#eee'; ctx.font = '700 10px sans-serif'; ctx.fillText(j, x, jy + 22);
          });
        }

        function esquema(m, rojo, Vf, R1, R2) {
          const X0 = 85, X1 = 315, Y0 = 70, Y1 = 210, ym = (Y0 + Y1) / 2;
          const p = [];
          const sim = { vr1: true, vr2: true, vf: true };
          const letra = { V: 'V', A: 'A', R: 'Ω' }[POS.find(q => q.k === llave.value).g];
          const L = borne.value !== 'VΩ' ? 'A' : letra;
          if (m === 'ais') {
            p.push(Esq.texto(200, 30, 'Circuito apagado; R1 desoldada de un lado', { size: 12, color: 'var(--muted)' }));
            p.push(Esq.R(140, 90, 260, 90, 'R1', H.fmt(R1, 'Ω'), 1));
            p.push(Esq.cable([[140, 90], [140, 150], [170, 150]]), Esq.medidor(170, 150, 230, 150, L), Esq.cable([[230, 150], [260, 150], [260, 90]]));
            p.push(Esq.texto(inv.value ? 245 : 155, 142, '+', { color: 'var(--red)' }));
            return Esq.svg(400, 235, p);
          }
          p.push(Esq.fuenteV(X0, ym - 35, X0, ym + 35, 'V', H.fmt(Vf, 'V'), -1));
          p.push(Esq.cable([[X0, ym - 35], [X0, Y0], [150, Y0]]), Esq.R(150, Y0, 250, Y0, 'R1', H.fmt(R1, 'Ω'), -1));
          p.push(Esq.cable([[250, Y0], [X1, Y0], [X1, ym - 35]]), Esq.R(X1, ym - 35, X1, ym + 35, 'R2', H.fmt(R2, 'Ω'), -1));
          if (m === 'serie') {
            p.push(Esq.cable([[X1, ym + 35], [X1, Y1], [230, Y1]]), Esq.medidor(230, Y1, 170, Y1, L), Esq.cable([[170, Y1], [X0, Y1], [X0, ym + 35]]));
            p.push(Esq.texto(inv.value ? 162 : 238, Y1 - 12, '+', { color: 'var(--red)' }));
          } else {
            p.push(Esq.cable([[X1, ym + 35], [X1, Y1], [X0, Y1], [X0, ym + 35]]));
            if (m === 'vr1') {
              p.push(Esq.nodo(130, Y0), Esq.nodo(270, Y0), Esq.cable([[130, Y0], [130, Y0 - 45], [170, Y0 - 45]]), Esq.medidor(170, Y0 - 45, 230, Y0 - 45, L), Esq.cable([[230, Y0 - 45], [270, Y0 - 45], [270, Y0]]));
              p.push(Esq.texto(inv.value ? 260 : 140, Y0 - 52, '+', { color: 'var(--red)' }));
            } else if (m === 'vr2') {
              p.push(Esq.nodo(X1, Y0 + 18), Esq.nodo(X1, Y1 - 18), Esq.cable([[X1, Y0 + 18], [375, Y0 + 18], [375, ym - 30]]), Esq.medidor(375, ym - 30, 375, ym + 30, L), Esq.cable([[375, ym + 30], [375, Y1 - 18], [X1, Y1 - 18]]));
              p.push(Esq.texto(387, inv.value ? ym + 46 : ym - 42, '+', { color: 'var(--red)' }));
            } else if (m === 'vf') {
              p.push(Esq.nodo(X0, Y0 + 18), Esq.nodo(X0, Y1 - 18), Esq.cable([[X0, Y0 + 18], [22, Y0 + 18], [22, ym - 30]]), Esq.medidor(22, ym - 30, 22, ym + 30, L), Esq.cable([[22, ym + 30], [22, Y1 - 18], [X0, Y1 - 18]]));
              p.push(Esq.texto(10, inv.value ? ym + 46 : ym - 42, '+', { color: 'var(--red)' }));
            }
          }
          return Esq.svg(400, 235, p);
        }

        function upd() {
          const Vf = vs.value, R1 = r1.value, R2 = r2.value, m = modo.value;
          const pos = POS.find(p => p.k === llave.value), b = borne.value;
          const serie = m === 'serie';
          // nodos rojo/negro
          let rn = { vr1: [1, 2], vr2: [2, 0], vf: [1, 0], serie: [3, 0] }[m];
          // Thévenin entre las puntas
          let Voc, Rth;
          if (m === 'ais') { Voc = 0; Rth = R1; }
          else {
            const v = resolver(serie, Vf, null); Voc = v[rn[0]] - v[rn[1]];
            const z = resolver(serie, 0, rn); Rth = z[rn[0]] - z[rn[1]];
          }
          if (inv.value) Voc = -Voc;
          const I0 = Vf / (rInt + R1 + R2);
          // modelo del instrumento
          let Rm, tipo, avisos = [], estado = 'ok';
          if (b === 'VΩ') {
            if (pos.g === 'V') { Rm = 10e6; tipo = 'V'; }
            else if (pos.g === 'R') { Rm = Infinity; tipo = 'R'; }
            else { Rm = Infinity; tipo = 'nada'; avisos.push('La llave está en corriente pero la punta roja está en VΩ: no hay camino para la corriente, el display marca 0. La punta roja va en mA o 10A.'); }
          } else {
            const f = fus[b];
            if (f) { Rm = Infinity; tipo = 'nada'; }
            else {
              Rm = b === '10A' ? 0.01 : (pos.g === 'A' && pos.k !== 'A10' ? 0.2 / pos.FS : 1);
              tipo = (pos.g === 'A' && ((b === '10A') === (pos.k === 'A10'))) ? 'A' : 'shunt';
            }
          }
          let Im = Number.isFinite(Rm) ? Voc / (Rth + Rm) : 0, recien = false;
          // ¿se quema un fusible?
          if (b !== 'VΩ' && !fus[b]) {
            const lim = b === 'mA' ? 0.2 : 10;
            if (Math.abs(Im) > 1.5 * lim) { fus[b] = true; recien = true; pico = Math.abs(Im); Rm = Infinity; Im = 0; tipo = 'nada'; avisos.push(`<b style="color:var(--red)">¡FUSIBLE QUEMADO!</b> Por un instante circularon ${H.fmt(pico, 'A')} por el instrumento (el fusible de ${b === 'mA' ? '200 mA' : '10 A'} se abrió). Un amperímetro es casi un cable: conectado en paralelo con la fuente es un cortocircuito.`); estado = 'mal'; }
          } else if (b !== 'VΩ' && fus[b]) {
            avisos.push(`El fusible del borne ${b} está quemado: el instrumento queda abierto y marca 0. Tocá “Cambiar fusibles”.`); estado = 'mal';
          }
          const Vm = Number.isFinite(Rm) ? Im * Rm : Voc;
          // valor que muestra el display (en unidades SI)
          let val = 0;
          if (tipo === 'V') val = Vm;
          else if (tipo === 'A') val = Im;
          else if (tipo === 'R') {
            const Itest = 0.2 / pos.FS; // corriente de prueba del óhmetro
            val = Rth + Voc / Itest;
            if (Math.abs(Voc) > 1e-6) { avisos.push('<b style="color:var(--red)">¡Óhmetro con el circuito energizado!</b> La tensión del circuito se suma a la de la pila interna del óhmetro: la lectura no tiene sentido (puede dar cualquier número, OL o negativa) y podés dañar el instrumento. Desenergizá y desconectá el componente.'); estado = 'mal'; }
            else if (m === 'ais') avisos.push('Así se mide bien una resistencia: sin tensión y con el componente aislado. El óhmetro inyecta ' + H.fmt(Itest, 'A') + ' y mide la tensión.');
          } else if (tipo === 'shunt') {
            val = 0;
            avisos.push('La punta roja está en un borne de corriente, pero la llave no está en la escala de corriente que corresponde a ese borne. Ojo: aunque marque 0, el instrumento se comporta como un cable entre las puntas.');
          }
          if (tipo !== 'R' && pos.g === 'R' && b !== 'VΩ') val = 0;
          // display 3½ dígitos
          const res = pos.FS / 2000;
          const cuentas = Math.round(val / res);
          const ol = tipo !== 'nada' && Math.abs(cuentas) > 1999;
          const num = (cuentas * res / pos.m);
          disp = { txt: (num < 0 ? '-' : '') + Math.abs(num).toFixed(pos.d), u: pos.u, ol, fus: fus.mA || fus['10A'] };
          if (tipo === 'nada') disp.txt = (0).toFixed(pos.d);

          // diagnósticos de conexión
          if (m === 'serie' && tipo === 'V') avisos.push('<b>Voltímetro en serie:</b> sus 10 MΩ quedan en serie con el circuito, la corriente se hace casi cero (' + H.fmt(Math.abs(Im), 'A') + ') y marca casi toda la tensión de la fuente. No se rompe nada, pero el circuito deja de funcionar.');
          if (m === 'serie' && tipo === 'A') avisos.push('<b>Bien:</b> amperímetro en serie. La corriente sin instrumento sería ' + H.fmt(I0, 'A') + '; con el shunt de ' + H.fmt(Rm, 'Ω') + ' circula ' + H.fmt(Math.abs(Im), 'A') + ' (error ' + H.num((Math.abs(Im) - I0) / I0 * 100, 2) + ' %).');
          if (['vr1', 'vr2'].includes(m) && tipo === 'A') { avisos.push('<b>Amperímetro en paralelo con ' + (m === 'vr1' ? 'R1' : 'R2') + ':</b> la cortocircuita. Lo que marca no es la corriente del circuito original (' + H.fmt(I0, 'A') + ') sino la que pasa por el “cable” que agregaste.'); estado = 'alerta'; }
          if (m === 'vf' && tipo === 'A') { avisos.push('<b>Amperímetro en paralelo con la fuente:</b> ¡cortocircuito!'); estado = 'mal'; }
          if (tipo === 'V' && m !== 'serie' && m !== 'ais') avisos.push('<b>Voltímetro en paralelo:</b> correcto. Su resistencia de 10 MΩ casi no altera el circuito (Rth vista = ' + H.fmt(Rth, 'Ω') + ').');
          if (tipo === 'V' && m === 'ais') avisos.push('No hay tensión: el componente está desconectado.');
          if (ol) avisos.push('El display muestra <b>“1”</b> a la izquierda (otros modelos muestran <b>OL</b>): <b>fuera de rango</b>, el valor supera la escala. Subí de escala.');
          else if (tipo !== 'nada' && Math.abs(cuentas) < 200 && Math.abs(cuentas) > 0 && pos.k !== POS.filter(q => q.g === pos.g)[0].k) avisos.push('Te sobran escalas: con la escala inferior tendrías un dígito más de resolución.');
          if (disp.txt.startsWith('-')) avisos.push('Signo “−”: la punta roja está en el punto de menor potencial (o la corriente entra por COM).');

          fig.innerHTML = esquema(m, rn, Vf, R1, R2);
          const VR1 = I0 * R1, VR2 = I0 * R2;
          lec.set([
            { k: 'Display', v: ol ? '1 (fuera de rango)' : disp.txt + ' ' + disp.u, estado: estado === 'mal' ? 'mal' : ol ? 'alerta' : '' },
            { k: 'Resolución de la escala', v: H.fmt(res, pos.g === 'R' ? 'Ω' : pos.g) },
            { k: 'I del circuito (sin instrumento)', v: H.fmt(I0, 'A') },
            { k: 'VR1 / VR2 (sin instrumento)', v: H.fmt(VR1, 'V') + ' / ' + H.fmt(VR2, 'V') },
            { k: 'Corriente por el instrumento', v: recien ? H.fmt(pico, 'A') + ' (pico)' : H.fmt(Math.abs(Im), 'A'), estado: recien || Math.abs(Im) > 0.2 ? 'mal' : '' },
          ]);
          nota.innerHTML = avisos.join('<br>') || 'Elegí una conexión y una escala.';
          cvM.redibujar();
        }
        upd();
      },
    },
    {
      titulo: 'Calculadora de error de lectura',
      descripcion: 'Ingresá lo que muestra el display y la precisión del manual. Comparalo con un instrumento analógico de cierta clase.',
      montar(cont, H) {
        const { controles, vista } = H.layout(cont);
        function campo(label, value, step, onInput) {
          const w = H.el('div', { class: 'ctrl' });
          w.append(H.el('label', {}, `<span>${label}</span>`));
          const i = H.el('input', { type: 'number', step: String(step), value: String(value) });
          i.addEventListener('input', onInput);
          w.append(i); controles.append(w);
          return { get value() { const x = parseFloat(String(i.value).replace(',', '.')); return Number.isFinite(x) ? x : 0; } };
        }
        H.titulo(controles, 'Multímetro digital');
        const lect = campo('Lectura del display', 12.00, 0.01, upd);
        const res = H.select(controles, {
          label: 'Resolución (último dígito)', value: '0.01', onChange: upd,
          opciones: [{ v: '0.0001', t: '0,0001' }, { v: '0.001', t: '0,001' }, { v: '0.01', t: '0,01' }, { v: '0.1', t: '0,1' }, { v: '1', t: '1' }],
        });
        const pct = campo('% de la lectura', 0.5, 0.1, upd);
        const dig = campo('Dígitos (cuentas)', 2, 1, upd);
        H.sep(controles);
        H.titulo(controles, 'Analógico (comparación)');
        const clase = H.select(controles, { label: 'Clase', value: '2.5', onChange: upd, opciones: [{ v: '1', t: '1' }, { v: '1.5', t: '1,5' }, { v: '2.5', t: '2,5' }] });
        const alc = campo('Alcance', 15, 0.5, upd);
        const cv = H.canvas(vista, { alto: 190, dibujar });
        const lec = H.lecturas(vista);
        const nota = H.nota(vista);
        let st = {};
        function dibujar(ctx, w, h) {
          const { L, eD, eA } = st; if (L === undefined) return;
          const span = Math.max(eD, eA, Math.abs(L) * 0.002, 1e-9) * 1.6;
          const P = H.ejes(ctx, w, h, { xmin: L - span, xmax: L + span, ymin: 0, ymax: 3, yticks: [], xfmt: v => H.num(v, 4), ml: 14, mr: 14, nx: w < 450 ? 4 : 8 });
          const barra = (y, e, c, t) => {
            ctx.fillStyle = c; ctx.globalAlpha = 0.3;
            ctx.fillRect(P.X(L - e), P.Y(y + 0.35), P.X(L + e) - P.X(L - e), P.Y(y - 0.35) - P.Y(y + 0.35));
            ctx.globalAlpha = 1; ctx.strokeStyle = c; ctx.lineWidth = 2;
            ctx.strokeRect(P.X(L - e), P.Y(y + 0.35), P.X(L + e) - P.X(L - e), P.Y(y - 0.35) - P.Y(y + 0.35));
            P.texto(L, y + 0.6, t, { color: c, align: 'center' });
          };
          barra(2, eD, H.col('c1'), 'Digital: ' + H.num(L - eD, 4) + ' … ' + H.num(L + eD, 4));
          barra(0.8, eA, H.col('c2'), 'Analógico: ' + H.num(L - eA, 3) + ' … ' + H.num(L + eA, 3));
          P.vline(L, { color: H.col('ink'), guiones: [3, 3] });
        }
        function upd() {
          const L = lect.value, r = parseFloat(res.value), p = pct.value, d = dig.value, cl = parseFloat(clase.value), A = alc.value;
          const eP = Math.abs(L) * p / 100, eDg = d * r, eD = eP + eDg;
          const eA = cl * A / 100;
          st = { L, eD, eA };
          const rel = (e) => L ? H.num(e / Math.abs(L) * 100, 2) + ' %' : '—';
          lec.set([
            { k: 'Error digital', v: '±' + H.num(eD, 5), estado: 'ok' },
            { k: 'Relativo digital', v: rel(eD), estado: 'ok' },
            { k: 'Error analógico', v: '±' + H.num(eA, 4), estado: Math.abs(L) < A / 3 ? 'mal' : Math.abs(L) < 2 * A / 3 ? 'alerta' : 'ok' },
            { k: 'Relativo analógico', v: rel(eA), estado: Math.abs(L) < A / 3 ? 'mal' : Math.abs(L) < 2 * A / 3 ? 'alerta' : 'ok' },
            { k: 'Deflexión de la aguja', v: A ? H.num(Math.abs(L) / A * 100, 1) + ' %' : '—', estado: Math.abs(L) > A ? 'mal' : '' },
          ]);
          const k = (x, dd) => H.num(x, dd).replace(/\./g, '').replace(/,/g, '{,}');
          nota.innerHTML = String.raw`<b>Digital:</b> $\Delta=\frac{${k(p, 3)}}{100}\cdot${k(L, 5)}+${k(d, 0)}\cdot${k(r, 4)}=${k(eD, 5)}$ → el valor real está entre <b>${H.num(L - eD, 5)}</b> y <b>${H.num(L + eD, 5)}</b>.<br>
            <b>Analógico:</b> $\Delta=\frac{${k(cl, 1)}\cdot${k(A, 2)}}{100}=${k(eA, 4)}$, igual en toda la escala. ${Math.abs(L) > A ? '<b>La lectura supera el alcance: elegí uno mayor.</b>' : Math.abs(L) < 2 * A / 3 ? 'La aguja no llega al último tercio: con un alcance menor el error relativo bajaría.' : 'La aguja está en el último tercio: buena elección de alcance.'}`;
          if (window.renderMathInElement) renderMathInElement(nota, { delimiters: [{ left: '$', right: '$', display: false }], throwOnError: false });
          cv.redibujar();
        }
        upd();
      },
    },
  ],

  ejercicios: [
    {
      nivel: 'Básico',
      enunciado: String.raw`Querés medir una batería de 9 V con un multímetro de 3½ dígitos que tiene las escalas de 200 mV, 2 V, 20 V y 200 V. ¿Qué escala elegís? ¿Qué muestra el display si por error lo dejás en 2 V? ¿Cuál es la resolución en la escala correcta?`,
      pista: String.raw`La escala correcta es la más chica que no se pasa. En 3½ dígitos el máximo es 1999 cuentas.`,
      solucion: String.raw`Escala <b>20 V</b> (máximo 19,99 V). En 2 V el máximo es 1,999 V, así que muestra <b>“1”</b> a la izquierda (u OL): fuera de rango. En 20 V la resolución es $20/2000=0{,}01\,\text{V}$: verías, por ejemplo, 9,35.`,
    },
    {
      nivel: 'Básico',
      enunciado: String.raw`Una fuente regulada de $12{,}0\,\text{V}$ (valor verdadero) se mide y da $11{,}7\,\text{V}$. Calculá el error absoluto, el relativo y el porcentual.`,
      pista: String.raw`$E_a=V_m-V_v$; $e_\%=E_a/V_v\cdot100$.`,
      solucion: String.raw`$E_a=11{,}7-12{,}0=-0{,}3\,\text{V}$. $e_r=-0{,}3/12=-0{,}025$. $e_\%=-2{,}5\,\%$ (el instrumento mide de menos).`,
    },
    {
      nivel: 'Intermedio',
      enunciado: String.raw`El manual de un multímetro dice: “V⎓: ±(0,8 % + 3 díg)”. Medís el pin de un sensor en la escala de 20 V y leés 4,50 V. ¿Entre qué valores está la tensión real? ¿Y si hubieras medido en la escala de 200 V (lectura 4,5 V)?`,
      pista: String.raw`Resolución en 20 V: 0,01 V; en 200 V: 0,1 V. Los “3 dígitos” son 3 veces la resolución.`,
      solucion: String.raw`Escala 20 V: $\Delta=0{,}008\cdot4{,}50+3\cdot0{,}01=0{,}036+0{,}03=0{,}066\,\text{V}$ → entre <b>4,434 V y 4,566 V</b> (1,5 %).<br>
      Escala 200 V: $\Delta=0{,}036+3\cdot0{,}1=0{,}336\,\text{V}$ → entre 4,16 V y 4,84 V (7,5 %). Conviene siempre la escala más chica posible.`,
    },
    {
      nivel: 'Intermedio',
      enunciado: String.raw`Un voltímetro analógico clase 1,5 tiene alcances de 3 V, 10 V y 30 V. Hay que medir una tensión de unos 7 V. Calculá el error absoluto y relativo en los alcances de 10 V y 30 V. ¿Cuál elegís y por qué?`,
      pista: String.raw`$\Delta V=\text{clase}\cdot\text{alcance}/100$, y después dividís por la lectura.`,
      solucion: String.raw`Alcance 10 V: $\Delta V=1{,}5\cdot10/100=0{,}15\,\text{V}$ → $0{,}15/7=2{,}1\,\%$.<br>
      Alcance 30 V: $\Delta V=0{,}45\,\text{V}$ → $6{,}4\,\%$.<br>
      Se elige <b>10 V</b>: la aguja queda al 70 % de la escala (último tercio). En 3 V se pasaría.`,
    },
    {
      nivel: 'Avanzado',
      enunciado: String.raw`Un divisor con dos resistencias de $470\,\text{k}\Omega$ está alimentado con 12 V. Calculá cuánto marca sobre $R_2$: (a) un analógico de 20 kΩ/V en el alcance de 10 V; (b) un digital de 10 MΩ. Calculá el error de cada uno.`,
      pista: String.raw`Sin instrumento hay 6 V. Con el instrumento, $R_2$ queda en paralelo con $R_V$.`,
      solucion: String.raw`(a) $R_V=20\,\text{k}\Omega/\text{V}\cdot10\,\text{V}=200\,\text{k}\Omega$. $R_2\parallel R_V=\frac{470\cdot200}{670}=140{,}3\,\text{k}\Omega$. $V=12\cdot\frac{140{,}3}{470+140{,}3}=2{,}76\,\text{V}$. ¡Error de −54 %!<br>
      (b) $R_2\parallel10\,\text{M}\Omega=448{,}9\,\text{k}\Omega$. $V=12\cdot\frac{448{,}9}{918{,}9}=5{,}86\,\text{V}$: error −2,3 %. Con resistencias tan grandes, hasta el digital carga un poco.`,
    },
    {
      nivel: 'Avanzado',
      enunciado: String.raw`Una carga de $22\,\Omega$ se alimenta con 3 V (dos pilas). Medís la corriente con el multímetro en la escala de 200 mA, cuyo shunt es de $1\,\Omega$. ¿Cuál es la corriente real sin instrumento, cuánto marca y qué tensión “se come” el amperímetro?`,
      pista: String.raw`El amperímetro suma su resistencia en serie: $I=V/(R+R_{sh})$.`,
      solucion: String.raw`Sin instrumento: $I=3/22=136{,}4\,\text{mA}$. Con el amperímetro: $I=3/23=130{,}4\,\text{mA}$ (error −4,3 %). Caída en el amperímetro: $130{,}4\,\text{mA}\cdot1\,\Omega=0{,}13\,\text{V}$. En circuitos de baja tensión, la tensión de carga del amperímetro se nota.`,
    },
    {
      nivel: 'Intermedio',
      enunciado: String.raw`Con un tester común (no True RMS) medís en la escala V~ la salida de un generador que entrega una onda cuadrada de ±10 V. ¿Qué muestra? ¿Cuál es el valor eficaz real? ¿Y si la onda fuera senoidal de 10 V de pico?`,
      pista: String.raw`El tester común mide el valor medio rectificado y lo multiplica por 1,11.`,
      solucion: String.raw`Cuadrada: valor medio rectificado = 10 V → muestra $1{,}11\cdot10=11{,}1\,\text{V}$; eficaz real = 10 V (error +11 %).<br>
      Senoidal: valor medio rectificado $=\frac{2}{\pi}\cdot10=6{,}37\,\text{V}$ → muestra $1{,}11\cdot6{,}37=7{,}07\,\text{V}$, que coincide con $10/\sqrt2=7{,}07\,\text{V}$: con senoidal no hay error.`,
    },
  ],

  quiz: [
    { pregunta: '¿Cómo se conecta un voltímetro para medir la tensión sobre una resistencia?', opciones: ['En serie con la resistencia', 'En paralelo con la resistencia', 'En lugar de la resistencia', 'Entre la resistencia y masa, abriendo el circuito'], correcta: 1, explicacion: 'La tensión es una diferencia entre dos puntos: el voltímetro va entre los extremos del componente, en paralelo.' },
    { pregunta: '¿Qué pasa si conectás un amperímetro directamente en paralelo con una batería?', opciones: ['Mide la corriente de cortocircuito sin problema', 'Mide la tensión de la batería', 'Es un cortocircuito: se quema el fusible o el instrumento', 'No pasa nada porque el amperímetro tiene resistencia alta'], correcta: 2, explicacion: 'El amperímetro tiene resistencia casi nula: en paralelo con una fuente es un cortocircuito.' },
    { pregunta: 'Para medir una resistencia que está soldada en una plaqueta, lo correcto es…', opciones: ['Medir con la plaqueta alimentada', 'Desenergizar y levantar una pata del componente', 'Usar la escala de 10 A', 'Medir con el selector en V~'], correcta: 1, explicacion: 'Sin tensión (para no falsear ni dañar) y con el componente aislado (para no medir paralelos).' },
    { pregunta: 'Un voltímetro analógico clase 2,5 con alcance 10 V tiene un error máximo de…', opciones: ['±2,5 % de la lectura', '±0,25 V en toda la escala', '±0,025 V', '±2,5 V'], correcta: 1, explicacion: 'Clase·alcance/100 = 2,5·10/100 = 0,25 V, el mismo en cualquier punto de la escala.' },
    { pregunta: '¿Por qué un voltímetro debe tener una resistencia interna muy alta?', opciones: ['Para no quemarse', 'Para tomar la menor corriente posible y no alterar el circuito (efecto de carga)', 'Para medir corrientes grandes', 'Para que la aguja se mueva más rápido'], correcta: 1, explicacion: 'En paralelo, su resistencia “roba” corriente; cuanto más alta, menos altera la tensión que mide.' },
    { pregunta: 'Un tester común (no True RMS) mide una onda cuadrada. La lectura en V~…', opciones: ['Es exacta', 'Da un 11 % más que el valor eficaz real', 'Da cero', 'Da el valor pico a pico'], correcta: 1, explicacion: 'Mide valor medio y multiplica por 1,11 (factor de la senoidal). En la cuadrada, el medio rectificado ya es igual al eficaz, así que sobra ese 11 %.' },
  ],

  docente: String.raw`
<h3>Objetivo de la clase</h3>
<p>Que el alumno sepa <b>conectar</b> correctamente el multímetro (V en paralelo, A en serie, Ω sin tensión), elegir escala y borne, <b>estimar el error</b> de una lectura y entender que el instrumento <b>modifica</b> el circuito. <b>Duración sugerida:</b> 1 a 2 clases (60–80 min cada una). Si tiene multímetro en casa, que lo tenga a mano: es el tema ideal para práctica real.</p>
<h3>Secuencia sugerida</h3>
<ol>
<li><b>Disparador (5 min):</b> “Si tuvieras que medir cuánta agua pasa por un caño, ¿dónde ponés el medidor? ¿Y si querés medir la diferencia de presión entre dos puntos?” Caudal → en serie (cortás el caño); presión → entre dos puntos (paralelo). Analogía directa con A y V.</li>
<li><b>Bornes y selector (10 min):</b> mostrá la tabla de bornes. Si tiene tester, que te diga qué bornes y escalas tiene el suyo y cuál es la marca de su fusible.</li>
<li><b>Multímetro virtual (20 min):</b> simulación 2. Arrancá con “En paralelo con R1”, llave en 20 V: que lea VR1 y que verifique con Ohm. Después pedile que mida la corriente: <em>dejalo que se equivoque</em>. Preguntá antes de cada prueba “¿qué va a pasar?”:
  <ul>
  <li>Llave en 200 mA y borne mA, pero conexión “en paralelo con la fuente” → fusible quemado. Que lea la corriente de pico en la nota.</li>
  <li>Conexión en serie con la llave en V → voltímetro en serie (marca casi 12 V y el circuito se “apaga”).</li>
  <li>Llave en 2 mA con 3,75 mA → “1” fuera de rango. Que suba de escala.</li>
  <li>Óhmetro con el circuito conectado → lectura absurda; después “R1 desconectada” → lectura correcta.</li>
  <li>Invertir puntas → signo menos.</li>
  </ul></li>
<li><b>Errores (15 min):</b> en pizarra, el ejemplo del 12 V en escala 20 V y 200 V. Después la calculadora (simulación 3): poné lectura 3,00 con alcance 15 V del analógico y preguntá por qué el error relativo es tan grande (aguja en el primer tercio).</li>
<li><b>Efecto de carga (15 min):</b> simulación 1. Empezá con R = 1 kΩ (todos aciertan) y subí a 1 MΩ: el analógico se derrumba. Preguntá: “¿el instrumento está roto?” No: está bien calibrado, pero cambió el circuito. Conectalo con el divisor con carga del tema 1.</li>
<li><b>Cierre (5 min):</b> seguridad y categorías CAT; autoevaluación.</li>
</ol>
<h3>Errores frecuentes del alumno</h3>
<ul>
<li>Dejar la punta roja en mA después de medir corriente y luego medir tensión de la red o una batería (cortocircuito).</li>
<li>Querer medir corriente “tocando los dos extremos” de la resistencia (eso es paralelo).</li>
<li>Medir resistencias en circuito y con tensión.</li>
<li>Confundir resolución con precisión (“tiene 4 dígitos, entonces es exacto”).</li>
<li>Calcular el error de clase sobre la lectura en vez del alcance.</li>
<li>Olvidar que en V~ un tester común solo es correcto con senoidales.</li>
</ul>
<h3>Preguntas para hacerle pensar</h3>
<ul>
<li>¿Por qué el fusible está en el borne de mA y no en el de VΩ?</li>
<li>Si un voltímetro ideal tiene R infinita, ¿qué resistencia tendría un amperímetro ideal?</li>
<li>¿Qué medirías con la pinza si abrazás el cable de un velador entero (los dos conductores juntos)? ¿Por qué?</li>
<li>Un analógico de 20 kΩ/V en 50 V cargó menos que en 10 V. ¿Entonces conviene siempre el alcance mayor?</li>
</ul>
<h3>Recordatorio rápido para vos</h3>
<ul>
<li>3½ dígitos = 2000 cuentas (1999 máx.); 3¾ = 4000 o 6000 cuentas; 4½ = 20 000 cuentas.</li>
<li>DMM: $R_{in}\approx10\,\text{M}\Omega$ (algunos 1 MΩ en mV; en V~ suele ser 10 MΩ ∥ ~100 pF).</li>
<li>Analógico: sensibilidad típica 20 kΩ/V en CC (inversa de la corriente de fondo de escala: 50 µA → 20 kΩ/V), menos en CA.</li>
<li>Shunts típicos en DMM: 200 mV de caída a fondo de escala (≈1 Ω en 200 mA, 10 mΩ en 10 A).</li>
<li>Factor de forma senoidal: $V_{ef}/V_{med}=\pi/(2\sqrt2)=1{,}111$. Factor de cresta: $V_p/V_{ef}=\sqrt2$.</li>
<li>Error de clase: $\Delta=\text{clase}\cdot\text{alcance}/100$. Último tercio → $e_\%\leq1{,}5\cdot$clase.</li>
<li>Categorías: CAT II = tomas; CAT III = tablero/instalación fija; CAT IV = acometida.</li>
</ul>
<h3>Experiencia práctica</h3>
<p><b>Con tester en casa:</b> medir una pila AA (≈1,5–1,6 V), un cargador de celular (≈5 V), la resistencia de un par de resistores con código de colores (compararlos con la tolerancia), la tensión directa de un LED y de un diodo 1N4007 con la prueba de diodos, y continuidad de un cable. <b>Efecto de carga casero:</b> divisor con dos resistencias de 1 MΩ y una batería de 9 V: el digital marca algo menos de 4,5 V (≈4,29 V con 10 MΩ). <b>En Tinkercad Circuits:</b> el multímetro virtual permite armar el circuito serie y medir V, A y Ω; conviene que lo haga antes de usar uno real.</p>
`,
});
