/* Tema 08 — LDR (fotorresistencia)
   IMPORTANTE: los textos con LaTeX usan String.raw`...` para que "\frac" no se rompa.
   Todo va dentro de una IIFE para no ensuciar el ámbito global (otros temas usan sus propios helpers). */
(() => {
  /* ---------- modelo físico de la LDR ---------- */
  const R_SAT = 50;                       // ohms: la curva real se aplana con mucha luz
  /** Ley de potencia pura: R = R10·(L/10)^(−γ) */
  const Rpot = (L, R10, g) => R10 * Math.pow(L / 10, -g);
  /** R "real": ley de potencia limitada por la R de oscuridad (paralelo) y por un piso de saturación */
  const Rreal = (L, R10, g, Rdark) => {
    const rp = Rpot(L, R10, g);
    const r = (rp * Rdark) / (rp + Rdark);
    return Math.pow(Math.pow(r, 4) + Math.pow(R_SAT, 4), 0.25);
  };
  const fmtLux = (L) => {
    if (L >= 1000) return H.num(L / 1000, L >= 10000 ? 0 : 1) + ' k';
    return H.num(L, L < 1 ? 2 : L < 10 ? 1 : 0);
  };
  const situacion = (L) =>
    L < 1 ? 'Noche (luna)' : L < 20 ? 'Crepúsculo / calle' : L < 200 ? 'Interior de casa' :
      L < 1000 ? 'Aula / oficina' : L < 20000 ? 'Día nublado / sombra' : 'Sol directo';

  /** Mezcla dos colores hex (t de 0 a 1) */
  function mezcla(a, b, t) {
    const pa = [1, 3, 5].map(i => parseInt(a.substr(i, 2), 16)), pb = [1, 3, 5].map(i => parseInt(b.substr(i, 2), 16));
    return 'rgb(' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',') + ')';
  }

  /** Ejes con eje X logarítmico de iluminancia (0,1 a 100 000 lux). Devuelve P (coordenada x = log10(lux)). */
  function ejesLux(ctx, W, Hh, op) {
    const P = H.ejes(ctx, W, Hh, Object.assign({
      xmin: -1, xmax: 5, xticks: [-1, 0, 1, 2, 3, 4, 5], xfmt: t => fmtLux(Math.pow(10, t)),
    }, op));
    ctx.save(); ctx.fillStyle = H.col('muted'); ctx.font = '600 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('iluminancia (lux, escala logarítmica)', P.x0 + P.w / 2, P.y0 + P.h + 18); ctx.restore();
    // grilla menor (2..9 de cada década)
    P.clip(() => {
      ctx.strokeStyle = H.col('grid'); ctx.globalAlpha = 0.55; ctx.lineWidth = 1; ctx.beginPath();
      for (let d = -1; d < 5; d++) for (let k = 2; k < 10; k++) {
        const x = Math.round(P.X(d + Math.log10(k))) + .5; ctx.moveTo(x, P.y0); ctx.lineTo(x, P.y0 + P.h);
      }
      ctx.stroke();
    });
    return P;
  }

  /** Dibuja la "escena": cielo según la luz, fuente de luz (luna / lámpara / sol) y la LDR */
  function escena(ctx, x, y, w, h, L, Rtxt) {
    const t = Math.max(0, Math.min(1, (Math.log10(L) + 1) / 6));      // 0 (0,1 lux) a 1 (100 k lux)
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, mezcla('#060b1d', '#5aa9ef', t)); g.addColorStop(1, mezcla('#1b2440', '#d8ecff', t));
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    const fx = x + w * 0.5, fy = y + h * 0.24, fr = Math.min(w, h) * 0.11;
    if (L < 1) {                                   // luna
      ctx.fillStyle = '#e9e6d0'; ctx.globalAlpha = 0.5 + 0.5 * t * 6;
      ctx.beginPath(); ctx.arc(fx, fy, fr, 0, 7); ctx.fill();
      ctx.globalAlpha = 1; ctx.fillStyle = mezcla('#060b1d', '#5aa9ef', t);
      ctx.beginPath(); ctx.arc(fx + fr * 0.45, fy - fr * 0.2, fr * 0.85, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff';
      [[0.15, 0.15], [0.8, 0.1], [0.3, 0.45], [0.9, 0.4], [0.1, 0.6]].forEach(([a, b]) => { ctx.fillRect(x + a * w, y + b * h, 2, 2); });
    } else if (L < 1000) {                         // lámpara
      const nivel = (Math.log10(L)) / 3;          // 0..1
      const halo = ctx.createRadialGradient(fx, fy, fr * 0.3, fx, fy, fr * 4);
      halo.addColorStop(0, 'rgba(255,214,120,' + (0.25 + 0.6 * nivel) + ')'); halo.addColorStop(1, 'rgba(255,214,120,0)');
      ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(fx, fy, fr * 4, 0, 7); ctx.fill();
      ctx.fillStyle = mezcla('#6b5a2e', '#fff3b0', nivel); ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(fx, fy, fr, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#888'; ctx.fillRect(fx - fr * 0.45, fy - fr * 1.6, fr * 0.9, fr * 0.7);
      ctx.strokeStyle = '#666'; ctx.beginPath(); ctx.moveTo(fx, y); ctx.lineTo(fx, fy - fr * 1.6); ctx.stroke();
    } else {                                       // sol
      const nivel = (Math.log10(L) - 3) / 2;      // 0..1
      ctx.strokeStyle = 'rgba(255,200,40,' + (0.5 + 0.5 * nivel) + ')'; ctx.lineWidth = 3;
      for (let k = 0; k < 12; k++) {
        const a = k * Math.PI / 6;
        ctx.beginPath(); ctx.moveTo(fx + Math.cos(a) * fr * 1.35, fy + Math.sin(a) * fr * 1.35);
        ctx.lineTo(fx + Math.cos(a) * fr * (1.8 + 0.6 * nivel), fy + Math.sin(a) * fr * (1.8 + 0.6 * nivel)); ctx.stroke();
      }
      ctx.fillStyle = mezcla('#ffd34d', '#fff6c4', nivel);
      ctx.beginPath(); ctx.arc(fx, fy, fr * (1 + 0.15 * nivel), 0, 7); ctx.fill();
    }
    // rayos hacia la LDR
    const lx = x + w * 0.5, ly = y + h * 0.66, lr = Math.min(w, h) * 0.12;
    const nRay = Math.round(1 + t * 5);
    ctx.strokeStyle = 'rgba(255,215,90,' + (0.15 + 0.75 * t) + ')'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
    for (let k = 0; k < nRay; k++) {
      const dx = (k - (nRay - 1) / 2) * lr * 0.45;
      ctx.beginPath(); ctx.moveTo(fx + dx * 0.4, fy + fr * 1.3); ctx.lineTo(lx + dx, ly - lr * 1.05); ctx.stroke();
    }
    ctx.setLineDash([]);
    // LDR: disco cerámico con pista serpenteante de CdS y dos patas
    ctx.fillStyle = '#e8dcc0'; ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(lx, ly, lr, 0, 7); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = mezcla('#7a2c12', '#ff8a3d', t); ctx.lineWidth = Math.max(2, lr * 0.13);
    ctx.beginPath();
    const n = 5;
    for (let k = 0; k <= n; k++) {
      const yy = ly - lr * 0.6 + k * (1.2 * lr / n);
      const xa = lx - lr * 0.62, xb = lx + lr * 0.62;
      if (k === 0) ctx.moveTo(xa, yy);
      ctx.lineTo(k % 2 ? xa : xb, yy);
      if (k < n) ctx.lineTo(k % 2 ? xa : xb, yy + 1.2 * lr / n);
    }
    ctx.stroke();
    ctx.strokeStyle = '#999'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(lx - lr * 0.4, ly + lr * 0.95); ctx.lineTo(lx - lr * 0.4, y + h); ctx.moveTo(lx + lr * 0.4, ly + lr * 0.95); ctx.lineTo(lx + lr * 0.4, y + h); ctx.stroke();
    // texto
    ctx.fillStyle = t > 0.55 ? '#10202f' : '#f3f6fa'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.font = '700 13px sans-serif'; ctx.fillText(fmtLux(L) + ' lux', x + w / 2, y + 6);
    if (Rtxt) {
      ctx.textBaseline = 'bottom'; ctx.font = '700 13px sans-serif';
      const tw = ctx.measureText(Rtxt).width + 12;
      ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(x + w / 2 - tw / 2, y + h - 22, tw, 19);
      ctx.fillStyle = '#fff'; ctx.fillText(Rtxt, x + w / 2, y + h - 6);
    }
    ctx.restore();
  }

  /* ---------- esquemas ---------- */
  function opamp(x, y) {
    return `<path d="M${x} ${y - 30}L${x} ${y + 30}L${x + 60} ${y}Z" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/>` +
      `<text x="${x + 9}" y="${y - 9}" font-size="15" font-weight="700" text-anchor="middle">+</text>` +
      `<text x="${x + 9}" y="${y + 19}" font-size="17" font-weight="700" text-anchor="middle">−</text>`;
  }
  /** Divisor con la LDR arriba o abajo (para la teoría) */
  function esqDivisor(pos) {
    const arriba = pos === 'arriba';
    return Esq.svg(230, 205, [
      Esq.borne(90, 18, '+5 V', 0, -8), Esq.cable([[90, 22], [90, 30]]),
      arriba ? Esq.LDR(90, 30, 90, 100, 'LDR', '', -1) : Esq.R(90, 30, 90, 100, 'R fija', '10 kΩ', -1),
      Esq.nodo(90, 100),
      arriba ? Esq.R(90, 100, 90, 170, 'R fija', '10 kΩ', -1) : Esq.LDR(90, 100, 90, 170, 'LDR', '', -1),
      Esq.masa(90, 170),
      Esq.cable([[90, 100], [180, 100]]), Esq.borne(180, 100, 'Vout', 0, -12),
      Esq.texto(185, 150, arriba ? 'más luz → Vout ↑' : 'más luz → Vout ↓', { size: 12, color: arriba ? 'var(--c3)' : 'var(--c2)' }),
    ], arriba ? 'LDR arriba (hacia +5 V): con luz la salida sube.' : 'LDR abajo (hacia masa): con luz la salida baja.');
  }
  /** Luz nocturna completa: etapa 'transistor' o 'comparador'. v = textos de valores opcionales */
  function esqNoche(pos, etapa, v = {}) {
    const arriba = pos === 'arriba';
    const ldr = (a, b, c, d) => Esq.LDR(a, b, c, d, 'LDR', v.rl || '', -1);
    const rf = (a, b, c, d) => Esq.R(a, b, c, d, 'R fija', v.rf || '', -1);
    const p = [
      Esq.borne(40, 30, '+5 V', 0, -10), Esq.cable([[90, 30], [90, 45]]),
      arriba ? ldr(90, 45, 90, 135) : rf(90, 45, 90, 135), Esq.nodo(90, 135),
      arriba ? rf(90, 135, 90, 225) : ldr(90, 135, 90, 225), Esq.cable([[90, 225], [90, 245]]),
      etapa === 'transistor'
        ? Esq.texto(97, 127, v.vout ? 'Vout ' + v.vout : 'Vout', { size: 12, color: 'var(--accent)', anchor: 'start' })
        : Esq.texto(97, 127, v.vout ? 'Vout ' + v.vout : 'Vout', { size: 12, color: 'var(--accent)', anchor: 'start' }),
    ];
    let xr;
    if (etapa === 'transistor') {
      xr = 232;
      p.push(
        Esq.cable([[44, 30], [232, 30]]),
        Esq.cable([[90, 135], [150, 135], [150, 180], [190, 180]]), Esq.bjt(220, 180, 'NPN', 'Q1'),
        Esq.R(232, 30, 232, 90, 'R LED', '220 Ω', -1), Esq.LED(232, 90, 232, 150, 'LED', '', -1, 'var(--red)'),
        Esq.cable([[232, 210], [232, 245]]),
      );
    } else {
      xr = 370;
      p.push(
        Esq.cable([[44, 30], [90, 30]]),
        Esq.cable([[90, 135], [160, 135], [160, 121], [190, 121]]), opamp(190, 135),
        Esq.cable([[190, 149], [165, 149], [165, 185]]), Esq.bat(165, 185, 165, 235, 'Vref', v.vref || '', 1),
        Esq.cable([[165, 235], [165, 245]]), Esq.nodo(165, 245),
        Esq.R(250, 135, 330, 135, 'R LED', '220 Ω', 1), Esq.cable([[330, 135], [370, 135]]),
        Esq.LED(370, 135, 370, 215, 'LED', '', -1, 'var(--red)'), Esq.cable([[370, 215], [370, 245]]),
        Esq.texto(220, 182, 'comparador', { size: 11, peso: 400 }),
      );
    }
    p.push(Esq.cable([[90, 245], [xr, 245]]), Esq.nodo(90, 245), Esq.masa(xr === 232 ? 160 : 260, 245));
    return Esq.svg(xr + 40, 272, p, v.pie || '');
  }

  registrarTema({
    id: 'ldr',
    orden: 8,
    titulo: 'LDR',
    resumen: 'Fotorresistencia: resistencia que baja con la luz',
    confirmar: false,

    teoria: String.raw`
<p>La <b>LDR</b> (<em>Light Dependent Resistor</em>, resistencia dependiente de la luz) o <b>fotorresistencia</b> es el sensor de luz más simple y barato que existe: una resistencia cuyo valor <b>baja cuando le da luz</b>. En oscuridad puede tener cerca de <b>1 MΩ</b> y a pleno día apenas unos <b>cientos de ohms</b>. Es la que está en las luces de calle que se prenden solas al anochecer, en los juguetes que reaccionan a la luz y en un montón de proyectos con Arduino.</p>
<p>Igual que el termistor (tema anterior), por sí sola no “da” una tensión: hay que meterla en un circuito (casi siempre un <b>divisor de tensión</b>) para convertir el cambio de resistencia en un cambio de tensión que podamos medir o comparar.</p>

<h2>1. Cómo está hecha y por qué funciona</h2>
<p>Una LDR típica es un disquito cerámico con una <b>pista en zigzag</b> de un material semiconductor, el <b>sulfuro de cadmio (CdS)</b>, entre dos electrodos metálicos. El zigzag sirve para que la pista sea larga y angosta entre los electrodos: así se logra una resistencia grande en poco espacio y mucha superficie expuesta a la luz.</p>
<div class="dos-col">
<div>
<h3>Efecto fotoconductivo, explicado simple</h3>
<p>En un semiconductor como el CdS, los electrones están casi todos “atados” a sus átomos: hay muy pocos electrones libres para conducir, por eso <b>en oscuridad conduce muy poco</b> (R alta).</p>
<p>Cuando llega luz, cada <b>fotón</b> (paquetito de luz) con energía suficiente puede “arrancar” un electrón y dejarlo libre para moverse (y deja un <em>hueco</em>, que también conduce). <b>Más luz = más fotones = más portadores libres = menos resistencia.</b></p>
<p>Analogía: pensá en una ruta donde casi todos los autos están estacionados. Si nadie los mueve, el tránsito (corriente) es mínimo. La luz es como alguien que va dando arranque a los autos: cuantos más arrancan, más tránsito circula.</p>
</div>
<div>
<svg class="esq" viewBox="0 0 240 200" width="240" height="200" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:10px auto">
  <circle cx="120" cy="110" r="70" fill="none" stroke="currentColor" stroke-width="2"/>
  <path d="M75 70H165V86H75V102H165V118H75V134H165V150H75" fill="none" stroke="var(--amber)" stroke-width="7" stroke-linejoin="round"/>
  <rect x="62" y="60" width="10" height="100" rx="2" fill="currentColor" opacity=".55"/>
  <rect x="168" y="60" width="10" height="100" rx="2" fill="currentColor" opacity=".55"/>
  <path d="M95 8l12 30M125 8l12 30M155 8l12 30" stroke="var(--amber)" stroke-width="2" fill="none"/>
  <path d="M107 38l-1 -8l-5 3zM137 38l-1 -8l-5 3zM167 38l-1 -8l-5 3z" fill="var(--amber)" stroke="var(--amber)" stroke-width="2"/>
  <text x="120" y="196" text-anchor="middle" font-size="12" font-weight="600">pista de CdS (naranja) entre electrodos</text>
</svg>
</div>
</div>
<div class="caja idea"><span class="caja-titulo">Símbolo</span>
Se dibuja como una resistencia (rectángulo o zigzag) con <b>dos flechas que entran</b> (la luz llega al componente). No la confundas con el LED, que tiene flechas que <b>salen</b>.
${Esq.svg(220, 70, [Esq.cable([[20, 40], [70, 40]]), Esq.LDR(70, 40, 150, 40, '', ''), Esq.cable([[150, 40], [200, 40]])])}
</div>

<h2>2. Resistencia en función de la luz</h2>
<p>La luz que llega a una superficie se mide en <b>lux</b> (iluminancia). Para tener una idea de los valores:</p>
<div class="tabla-wrap"><table class="tabla">
<tr><th>Situación</th><th>Iluminancia aproximada</th><th>R de una LDR típica (GL5528)</th></tr>
<tr><td>Noche sin luna</td><td>0,001 lux</td><td>≈ 1 MΩ (resistencia de oscuridad)</td></tr>
<tr><td>Noche con luna llena</td><td>0,1 – 0,3 lux</td><td>cientos de kΩ</td></tr>
<tr><td>Calle con alumbrado público</td><td>5 – 20 lux</td><td>≈ 10 – 30 kΩ</td></tr>
<tr><td>Interior de una casa (living)</td><td>50 – 200 lux</td><td>≈ 2 – 5 kΩ</td></tr>
<tr><td>Aula u oficina bien iluminada</td><td>300 – 500 lux</td><td>≈ 1 kΩ</td></tr>
<tr><td>Día nublado</td><td>1 000 – 10 000 lux</td><td>≈ 100 – 300 Ω</td></tr>
<tr><td>Sol directo</td><td>30 000 – 100 000 lux</td><td>decenas de ohms</td></tr>
</table></div>
<p>Fijate que la luz varía en <b>¡seis órdenes de magnitud!</b> (de 0,1 a 100 000). Por eso, para graficar, se usan <b>escalas logarítmicas</b> en los dos ejes (gráfico log‑log): cada división es “×10”.</p>

<div class="caja formula"><span class="caja-titulo">Ley aproximada de la LDR</span>
$$R(L) = R_{10}\cdot\left(\frac{L}{10\,\text{lux}}\right)^{-\gamma}$$
<ul>
<li>$R_{10}$: resistencia a 10 lux (dato de la hoja de datos; en la GL5528 está entre 8 y 20 kΩ).</li>
<li>$\gamma$ (gamma): qué tan “sensible” es. Típicamente $\gamma \approx 0{,}7$ a $0{,}9$ (algunos modelos chinos GL55xx declaran 0,5 – 0,7).</li>
</ul>
<p>Tomando logaritmo: $\log R = \log R_{10} - \gamma\,\log\!\left(\frac{L}{10}\right)$. ¡Es una <b>recta</b> en escala log‑log, con pendiente $-\gamma$! Por eso el fabricante da la curva así.</p>
<p>Despejando la luz: $L = 10\cdot\left(\dfrac{R}{R_{10}}\right)^{-1/\gamma}$ lux.</p>
</div>
<div class="caja tip"><span class="caja-titulo">Para calcular rápido</span>
Con $\gamma = 1$: si la luz se multiplica por 10, la resistencia se divide por 10. Con $\gamma = 0{,}8$: luz ×10 → R se divide por $10^{0{,}8}\approx 6{,}3$. Con $\gamma=0{,}7$: R se divide por $\approx 5$.
</div>
<div class="caja ejemplo"><span class="caja-titulo">Ejemplo resuelto</span>
Una LDR tiene $R_{10}=10\,\text{k}\Omega$ y $\gamma=0{,}8$. ¿Cuánto vale a 1 lux, a 100 lux y a 1000 lux?
$$R(1)=10\,\text{k}\Omega\cdot(0{,}1)^{-0{,}8}=10\,\text{k}\Omega\cdot 6{,}31=63{,}1\,\text{k}\Omega$$
$$R(100)=10\,\text{k}\Omega\cdot(10)^{-0{,}8}=10\,\text{k}\Omega\cdot0{,}158=1{,}58\,\text{k}\Omega\qquad R(1000)=10\,\text{k}\Omega\cdot(100)^{-0{,}8}=251\,\Omega$$
</div>
<div class="caja ojo"><span class="caja-titulo">Ojo: es una aproximación</span>
<ul>
<li>La ley vale en el rango medio (≈ 1 a 10 000 lux). En oscuridad total la R <b>no crece al infinito</b>: se queda en la <b>resistencia de oscuridad</b> (≈ 1 MΩ). Con sol muy fuerte se “aplana” en unas decenas de ohms.</li>
<li>Hay <b>mucha dispersión</b> entre unidades: dos LDR del mismo modelo pueden diferir ×2. Por eso los circuitos con LDR casi siempre llevan un <b>preset (potenciómetro) para calibrar</b>.</li>
<li>No sirve como luxómetro de precisión: sirve para detectar “hay luz / no hay luz” o “más / menos luz”.</li>
</ul>
</div>

<h2>3. Tiempo de respuesta y respuesta espectral</h2>
<p><b>Es un sensor lento.</b> Los portadores liberados por la luz tardan en “recombinarse” (volver a atarse). Valores típicos (GL5528): tarda unos <b>20 ms en bajar</b> la resistencia cuando se prende la luz y unos <b>30 ms en subir</b> cuando se apaga; y para llegar del todo a la resistencia de oscuridad puede tardar <b>segundos</b>. Moraleja: <b>siempre es más lenta al pasar de luz a oscuridad</b>.</p>
<ul>
<li>Para una luz de calle o un detector de “día/noche” esto no importa (¡hasta es bueno, filtra parpadeos!).</li>
<li>No sirve para recibir datos rápidos (un control remoto infrarrojo modula a 38 kHz: imposible con una LDR).</li>
<li>Con lámparas que parpadean a 100 Hz (red de 50 Hz rectificada) la LDR “ve” el promedio, igual que nuestro ojo.</li>
</ul>
<p><b>Respuesta espectral:</b> no todos los colores la afectan igual. La de CdS tiene su máxima sensibilidad en el <b>verde‑amarillo (≈ 540 nm)</b>, muy parecido al ojo humano: por eso “ve” la luz casi como nosotros. Casi no responde al infrarrojo ni al ultravioleta. Las de seleniuro de cadmio (CdSe) se corren hacia el rojo (≈ 700 nm).</p>

<h2>4. LDR, fotodiodo y fototransistor</h2>
<div class="tabla-wrap"><table class="tabla">
<tr><th></th><th>LDR (CdS)</th><th>Fotodiodo</th><th>Fototransistor</th></tr>
<tr><td>Qué es</td><td>Resistencia que baja con la luz</td><td>Diodo que genera una corriente proporcional a la luz (en inversa)</td><td>Transistor cuya “base” es la luz: amplifica la corriente del fotodiodo</td></tr>
<tr><td>Velocidad</td><td>Lenta (ms a decenas de ms)</td><td>Muy rápida (ns a µs)</td><td>Rápida (µs)</td></tr>
<tr><td>Sensibilidad</td><td>Alta (cambia mucho)</td><td>Baja (µA): necesita amplificador</td><td>Alta (mA)</td></tr>
<tr><td>Linealidad</td><td>Mala (ley de potencia)</td><td>Excelente (I ∝ luz)</td><td>Regular</td></tr>
<tr><td>Polaridad</td><td>No tiene (se conecta en cualquier sentido)</td><td>Sí</td><td>Sí</td></tr>
<tr><td>Usos</td><td>Luz nocturna, juguetes, detectores de día/noche</td><td>Luxómetros, fibra óptica, comunicaciones</td><td>Barreras infrarrojas, encoders, optoacopladores</td></tr>
</table></div>
<div class="caja ojo"><span class="caja-titulo">Contiene cadmio (RoHS)</span>
El cadmio es un metal pesado tóxico. La directiva europea <b>RoHS</b> (restricción de sustancias peligrosas) limita su uso, así que en productos nuevos se reemplazan por fotodiodos, fototransistores o sensores integrados (TEMT6000, BH1750). En la escuela y en prototipos se siguen usando sin problema, pero <b>no se tiran a la basura común</b>: van a residuos electrónicos.
</div>

<h2>5. Divisor de tensión con LDR: dos configuraciones</h2>
<p>Ponemos la LDR en serie con una resistencia fija y sacamos la tensión del punto medio. Según dónde esté la LDR, el comportamiento <b>se invierte</b>:</p>
<div class="dos-col">
<div>${esqDivisor('arriba')}
$$V_{out}=V_{CC}\cdot\frac{R_{fija}}{R_{fija}+R_{LDR}}$$
<p>Con luz, $R_{LDR}$ baja → el numerador “pesa” más → <b>Vout sube</b>.</p>
</div>
<div>${esqDivisor('abajo')}
$$V_{out}=V_{CC}\cdot\frac{R_{LDR}}{R_{fija}+R_{LDR}}$$
<p>Con luz, $R_{LDR}$ baja → <b>Vout baja</b>. En oscuridad Vout sube: ideal para prender algo cuando oscurece.</p>
</div>
</div>
<div class="caja tip"><span class="caja-titulo">Truco para recordarlo</span>
La tensión de salida “se parece” a la que tiene <b>más cerca la resistencia más chica</b>. Si la LDR (iluminada, chica) está pegada a +5 V, Vout se acerca a 5 V. Si está pegada a masa, Vout se acerca a 0 V.
</div>
<div class="caja formula"><span class="caja-titulo">¿Qué resistencia fija elijo?</span>
<p>La mayor sensibilidad (el mayor cambio de Vout para un cambio de luz) se logra cuando $R_{fija}$ es <b>igual a la resistencia de la LDR en el nivel de luz que te interesa detectar</b>. En ese punto $V_{out}=V_{CC}/2$.</p>
<p>Si querés distinguir entre dos niveles de luz con resistencias $R_a$ y $R_b$, un buen valor es la media geométrica: $R_{fija}\approx\sqrt{R_a\cdot R_b}$.</p>
</div>
<div class="caja ejemplo"><span class="caja-titulo">Ejemplo resuelto</span>
LDR con $R_{10}=10\,\text{k}\Omega$, $\gamma = 0{,}8$, $R_{fija}=10\,\text{k}\Omega$, $V_{CC}=5\,\text{V}$, <b>LDR arriba</b>:
<ul>
<li>A 1 lux ($R_{LDR}=63{,}1\,\text{k}\Omega$): $V_{out}=5\cdot\frac{10}{10+63{,}1}=0{,}68\,\text{V}$.</li>
<li>A 100 lux ($R_{LDR}=1{,}58\,\text{k}\Omega$): $V_{out}=5\cdot\frac{10}{10+1{,}58}=4{,}32\,\text{V}$.</li>
</ul>
Con la LDR abajo los valores se intercambian: 4,32 V a 1 lux y 0,68 V a 100 lux. En los dos casos, a 10 lux da exactamente 2,5 V (porque $R_{LDR}=R_{fija}$).
</div>

<h2>6. Luz nocturna automática</h2>
<p>Queremos que un LED (o una lámpara) se prenda <b>solo cuando oscurece</b>. Hay dos formas clásicas de hacerlo.</p>
<h3>6.1 Con un transistor</h3>
${esqNoche('abajo', 'transistor', { pie: 'R fija arriba, LDR abajo: al oscurecer sube la tensión de base y el transistor conduce.' })}
<ul>
<li>De día, la LDR tiene poca resistencia: la base queda casi a 0 V. Como un transistor de silicio necesita <b>$V_{BE}\approx0{,}6$–$0{,}7\,\text{V}$</b> para conducir, está cortado: LED apagado.</li>
<li>Al oscurecer, $R_{LDR}$ sube, la tensión de base sube; cuando supera ≈ 0,65 V circula corriente de base, el transistor conduce y el LED se prende (se va prendiendo <b>de a poco</b>).</li>
<li>Se prende aproximadamente cuando $V_{CC}\frac{R_{LDR}}{R_{fija}+R_{LDR}}=0{,}65\,\text{V}$, o sea cuando $R_{LDR}\approx 0{,}15\cdot R_{fija}$ (con 5 V).</li>
</ul>
<div class="caja ojo"><span class="caja-titulo">Limitaciones del circuito con transistor</span>
El divisor queda <b>cargado</b> por la base (la corriente de base sale del divisor), así que la cuenta es aproximada. Y como el encendido es gradual, en el atardecer el LED queda “a media luz”. Para un encendido neto se usa un comparador.
</div>
<h3>6.2 Con un comparador</h3>
${esqNoche('abajo', 'comparador', { pie: 'El comparador prende el LED cuando Vout (entrada +) supera Vref (entrada −).' })}
<p>Un <b>comparador</b> (por ejemplo LM393, o un operacional como LM358) compara dos tensiones: si $V_+ > V_-$ su salida va a “alto” ($\approx V_{CC}$), si no, a “bajo” (≈ 0 V). Conectamos el divisor a la entrada + y una tensión de referencia $V_{ref}$ (otro divisor o un preset) a la entrada −.</p>
<ul>
<li>Con la LDR <b>abajo</b>, Vout sube al oscurecer → cuando pasa $V_{ref}$, el LED se prende <b>de golpe</b>: luz nocturna.</li>
<li>Si ponés la LDR <b>arriba</b>, el mismo circuito se prende <b>con luz</b>: un detector de luz (por ejemplo, una alarma que suena si abren un cajón).</li>
<li>Cambiando $V_{ref}$ (con un preset) se ajusta el nivel de luz al que conmuta.</li>
</ul>
<div class="caja idea"><span class="caja-titulo">Histéresis (para el que quiere más)</span>
Justo en el umbral, cualquier ruido o una sombra pasajera hace que la salida “tiemble” entre prendido y apagado. Se soluciona con una realimentación positiva (una resistencia de la salida a la entrada +) que crea dos umbrales distintos: uno para prender y otro para apagar. Es un <b>disparador Schmitt</b>. Las luces de calle además usan un retardo para no prenderse si pasa una nube.
</div>

<h2>7. LDR con Arduino</h2>
${Esq.svg(320, 200, [
  Esq.borne(70, 18, '+5 V', 0, -8), Esq.cable([[70, 22], [70, 30]]), Esq.LDR(70, 30, 70, 100, 'LDR', '', -1), Esq.nodo(70, 100),
  Esq.R(70, 100, 70, 170, 'R', '10 kΩ', -1), Esq.masa(70, 170),
  Esq.cable([[70, 100], [200, 100]]),
  '<rect x="200" y="60" width="100" height="80" rx="8" fill="none" stroke="currentColor" stroke-width="2"/>',
  Esq.texto(250, 92, 'Arduino', { size: 13 }), Esq.texto(250, 112, 'A0 (ADC 10 bits)', { size: 11, peso: 400 }), Esq.nodo(200, 100),
], 'LDR arriba y 10 kΩ a masa: más luz → número más alto en analogRead().')}
<p>El Arduino UNO tiene un conversor analógico‑digital (ADC) de 10 bits: convierte 0 a 5 V en un número de <b>0 a 1023</b>.</p>
$$N = 1023\cdot\frac{V_{out}}{5\,\text{V}}\qquad\Rightarrow\qquad V_{out}=\frac{N\cdot5\,\text{V}}{1023}$$
<pre class="caja" style="overflow-x:auto;font-size:.85rem"><code style="border:0;background:none;padding:0">const int pinLDR = A0, pinLED = 13;
void setup() { pinMode(pinLED, OUTPUT); Serial.begin(9600); }
void loop() {
  int lectura = analogRead(pinLDR);   // 0 (oscuro) ... 1023 (mucha luz)
  Serial.println(lectura);
  if (lectura &lt; 400) digitalWrite(pinLED, HIGH);   // oscuro: prendo
  else if (lectura &gt; 450) digitalWrite(pinLED, LOW); // claro: apago (histéresis)
  delay(100);
}</code></pre>
<div class="caja ejemplo"><span class="caja-titulo">¿A cuántos lux corresponde una lectura de 400?</span>
$V_{out}=\frac{400\cdot5}{1023}=1{,}955\,\text{V}$. Del divisor (LDR arriba): $R_{LDR}=R\left(\frac{V_{CC}}{V_{out}}-1\right)=10\,\text{k}\Omega\cdot(2{,}558-1)=15{,}6\,\text{k}\Omega$.<br>
Con $R_{10}=10\,\text{k}\Omega$ y $\gamma=0{,}8$: $L=10\cdot\left(\frac{15{,}6}{10}\right)^{-1/0{,}8}\approx5{,}7\,\text{lux}$: el LED se prende cuando la luz baja de unos 6 lux (crepúsculo).
</div>
<div class="caja tip"><span class="caja-titulo">Calibrá con el monitor serie</span>
No hace falta hacer cuentas para ajustar el umbral: abrí el monitor serie, tapá la LDR con la mano, mirá los números, y elegí el umbral entre el valor “de día” y el “de noche”. La dispersión entre LDR hace que esto sea lo más práctico.
</div>
`,

    simulaciones: [
      {
        titulo: 'Curva de la LDR: resistencia vs. luz (log‑log)',
        descripcion: 'Mové la luz desde una noche de luna hasta el sol del mediodía y mirá cómo cae la resistencia. Cambiá R10 y γ para ver otros modelos de LDR.',
        montar(cont, H) {
          const { controles, vista } = H.layout(cont);
          const luz = H.slider(controles, { label: 'Iluminancia', min: 0.1, max: 100000, log: true, value: 10, fmt: v => fmtLux(v) + ' lux', onInput: upd });
          const auto = H.check(controles, { label: 'Ciclo día ↔ noche automático', value: false, onChange: upd });
          H.sep(controles);
          H.titulo(controles, 'Parámetros de la LDR');
          const r10 = H.slider(controles, { label: 'R10 (a 10 lux)', min: 2000, max: 50000, log: true, value: 10000, unidad: 'Ω', onInput: upd });
          const gam = H.slider(controles, { label: 'γ (pendiente)', min: 0.5, max: 1, step: 0.05, value: 0.8, fmt: v => H.num(v, 2), onInput: upd });
          const rdk = H.slider(controles, { label: 'R de oscuridad', min: 100000, max: 10e6, log: true, value: 1e6, unidad: 'Ω', onInput: upd });
          const verLey = H.check(controles, { label: 'Mostrar ley de potencia pura', value: true, onChange: upd });
          const cv = H.canvas(vista, { alto: w => w >= 560 ? 330 : 520, dibujar });
          const lec = H.lecturas(vista);
          const nota = H.nota(vista);
          let fase = 0;
          H.loop(() => {
            if (!auto.value) return;
            fase += 0.004;
            luz.value = Math.pow(10, -1 + 6 * (0.5 - 0.5 * Math.cos(fase)));
            upd();
          });

          function dibujar(ctx, w, h) {
            const L = luz.value, R10 = r10.value, g = gam.value, Rd = rdk.value;
            const R = Rreal(L, R10, g, Rd);
            const ancho = w >= 560;
            const sx = 0, sy = 0, sw = ancho ? 190 : w, sh = ancho ? h : 190;
            escena(ctx, sx, sy, sw, sh, L, 'R = ' + H.fmt(R, 'Ω'));
            const P = ejesLux(ctx, w, h, {
              x0: ancho ? sw + 58 : 52, y0: ancho ? 14 : sh + 16, w: ancho ? w - sw - 72 : w - 66, h: ancho ? h - 48 : h - sh - 50,
              ymin: 1, ymax: 7, yticks: [1, 2, 3, 4, 5, 6, 7], yfmt: t => H.fmt(Math.pow(10, t), 'Ω', 2),
            });
            // marcas de situaciones típicas
            const marcas = [[0.2, 'luna'], [10, 'calle'], [100, 'casa'], [500, 'aula'], [10000, 'nublado'], [60000, 'sol']];
            marcas.forEach(([lx, txt], i) => {
              P.texto(Math.log10(lx), 7, txt, { color: H.col('muted'), font: '10px sans-serif', align: 'center', base: 'top', dy: 3 + (i % 2) * 12 });
            });
            if (verLey.value) P.fn(x => Math.log10(Rpot(Math.pow(10, x), R10, g)), { color: H.col('muted'), ancho: 1.5, guiones: [6, 4] });
            P.hline(Math.log10(Rd), { color: H.col('c4'), label: 'R oscuridad', labelX: 4.9 });
            P.fn(x => Math.log10(Rreal(Math.pow(10, x), R10, g, Rd)), { color: H.col('c1'), ancho: 2.5 });
            P.vline(1, { color: H.col('amber'), label: 'R10', labelY: 1.6 });
            P.punto(Math.log10(L), Math.log10(R), { color: H.col('c2'), r: 6 });
          }

          function upd() {
            const L = luz.value, R10 = r10.value, g = gam.value, Rd = rdk.value;
            const R = Rreal(L, R10, g, Rd), Rp = Rpot(L, R10, g);
            cv.redibujar();
            lec.set([
              { k: 'Iluminancia', v: fmtLux(L) + ' lux' },
              { k: 'Situación', v: situacion(L) },
              { k: 'R (ley de potencia)', v: H.fmt(Rp, 'Ω') },
              { k: 'R real (con límites)', v: H.fmt(R, 'Ω'), estado: 'ok' },
              { k: 'Luz ×10 → R se divide por', v: H.num(Math.pow(10, g), 2) },
            ]);
            let txt;
            if (L < 1) txt = `<b>Casi oscuridad:</b> la ley de potencia daría ${H.fmt(Rp, 'Ω')}, pero la LDR real no supera su resistencia de oscuridad (${H.fmt(Rd, 'Ω')}): la curva azul se aplana.`;
            else if (L > 20000) txt = `<b>Sol fuerte:</b> la resistencia ya es de unas decenas de ohms y casi no baja más (la curva se aplana abajo). Mucha luz más casi no cambia nada: la LDR “saturó”.`;
            else txt = `<b>Zona útil:</b> en escala log‑log la curva es casi una recta de pendiente −γ = −${H.num(g, 2)}. Cada vez que la luz se multiplica por 10, R se divide por 10<sup>${H.num(g, 2)}</sup> ≈ ${H.num(Math.pow(10, g), 1)}.`;
            nota.innerHTML = txt + ' Probá subir γ: la recta se hace más empinada (LDR más sensible).';
          }
          upd();
        },
      },
      {
        titulo: 'Luz nocturna automática',
        descripcion: 'La LDR va en un divisor. Elegí su posición, la resistencia fija y si el LED lo maneja un transistor o un comparador. LDR simulada: R10 = 10 kΩ, γ = 0,8; VCC = 5 V.',
        montar(cont, H) {
          const { controles, vista } = H.layout(cont);
          const R10 = 10000, G = 0.8, RD = 1e6, VCC = 5, VBE = 0.65, BETA = 100, RLED = 220, VF = 2.0;
          const luz = H.slider(controles, { label: 'Iluminancia', min: 0.1, max: 100000, log: true, value: 200, fmt: v => fmtLux(v) + ' lux', onInput: upd });
          const auto = H.check(controles, { label: 'Ciclo día ↔ noche automático', value: false, onChange: upd });
          H.sep(controles);
          const pos = H.select(controles, { label: 'Posición de la LDR', opciones: [{ v: 'abajo', t: 'LDR abajo (entre Vout y masa)' }, { v: 'arriba', t: 'LDR arriba (entre +5 V y Vout)' }], value: 'abajo', onChange: upd });
          const rf = H.slider(controles, { label: 'R fija', min: 1000, max: 1e6, log: true, value: 47000, unidad: 'Ω', onInput: upd });
          const etapa = H.select(controles, { label: 'Etapa de salida', opciones: [{ v: 'transistor', t: 'Transistor NPN (Vout a la base)' }, { v: 'comparador', t: 'Comparador (Vout a la entrada +)' }], value: 'transistor', onChange: upd });
          const vref = H.slider(controles, { label: 'Vref del comparador', min: 0.2, max: 4.8, step: 0.05, value: 2.5, unidad: 'V', onInput: upd });
          const fig = H.el('div'); vista.append(fig);
          const cv = H.canvas(vista, { alto: w => w >= 560 ? 280 : 430, dibujar });
          const lec = H.lecturas(vista);
          const nota = H.nota(vista);

          const RL = (L) => Rreal(L, R10, G, RD);
          const vout = (L) => {
            const rl = RL(L), r = rf.value;
            return pos.value === 'abajo' ? VCC * rl / (r + rl) : VCC * r / (r + rl);
          };
          /** Estado del LED para una luz dada: { ib, ic, brillo, vb } */
          function estado(L) {
            const vth = vout(L);
            if (etapa.value === 'comparador') {
              const on = vth > vref.value;
              const ic = on ? (VCC - VF) / RLED : 0;
              return { vb: vth, ib: 0, ic, brillo: on ? 1 : 0 };
            }
            const rl = RL(L), rth = rl * rf.value / (rl + rf.value);
            const ib = Math.max(0, (vth - VBE) / rth);
            const icsat = (VCC - VF - 0.2) / RLED;
            const ic = Math.min(BETA * ib, icsat);
            return { vb: ib > 0 ? VBE : vth, ib, ic, brillo: ic / icsat };
          }
          let fase = Math.PI;
          H.loop(() => {
            if (!auto.value) return;
            fase += 0.004;
            luz.value = Math.pow(10, -1 + 6 * (0.5 - 0.5 * Math.cos(fase)));
            upd();
          });

          function dibujar(ctx, w, h) {
            const L = luz.value, e = estado(L);
            const ancho = w >= 560;
            const sw = ancho ? 150 : w, sh = ancho ? h : 150;
            // escena: cielo + farol con el LED
            const t = Math.max(0, Math.min(1, (Math.log10(L) + 1) / 6));
            const g = ctx.createLinearGradient(0, 0, 0, sh);
            g.addColorStop(0, mezcla('#060b1d', '#5aa9ef', t)); g.addColorStop(1, mezcla('#1b2440', '#d8ecff', t));
            ctx.fillStyle = g; ctx.fillRect(0, 0, sw, sh);
            ctx.fillStyle = mezcla('#1a1f14', '#5c7a3a', t); ctx.fillRect(0, sh * 0.86, sw, sh * 0.14);
            const px = sw * 0.5, py = sh * 0.3;
            ctx.fillStyle = '#555'; ctx.fillRect(px - 3, py + 12, 6, sh * 0.86 - py - 12);
            H.brillo(ctx, px, py, Math.min(sw, sh) * 0.1, e.brillo, '#ff3b30');
            ctx.fillStyle = t > 0.55 ? '#10202f' : '#f3f6fa'; ctx.font = '700 12px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(fmtLux(L) + ' lux', sw / 2, 16);
            ctx.fillText(e.brillo > 0.95 ? 'LED prendido' : e.brillo > 0.05 ? 'LED a media luz' : 'LED apagado', sw / 2, sh * 0.86 - 8);
            // gráfico Vout vs lux
            const x0 = ancho ? sw + 52 : 46, y0 = ancho ? 14 : sh + 14, pw = ancho ? w - sw - 64 : w - 58, ph = (ancho ? h : h - sh) - 14 - 40 - 26;
            const P = ejesLux(ctx, w, h, { x0, y0, w: pw, h: ph, ymin: 0, ymax: VCC, yticks: [0, 1, 2, 3, 4, 5], yfmt: t => t + ' V', ylabel: 'Vout (divisor)' });
            const umbral = etapa.value === 'comparador' ? vref.value : VBE;
            // sombreado de la zona donde el LED está prendido
            P.clip(() => {
              ctx.fillStyle = H.col('red'); ctx.globalAlpha = 0.10;
              const n = 300;
              for (let i = 0; i < n; i++) {
                const xa = -1 + 6 * i / n, xb = -1 + 6 * (i + 1) / n;
                const b = estado(Math.pow(10, (xa + xb) / 2)).brillo;
                if (b > 0.02) { ctx.globalAlpha = 0.18 * b; ctx.fillRect(P.X(xa), P.y0, P.X(xb) - P.X(xa) + 0.5, P.h); }
              }
            });
            P.hline(umbral, { color: H.col('amber'), label: etapa.value === 'comparador' ? 'Vref' : 'VBE ≈ 0,65 V', labelX: 4.95 });
            P.fn(x => vout(Math.pow(10, x)), { color: H.col('c1'), ancho: 2.5 });
            if (etapa.value === 'transistor') P.fn(x => estado(Math.pow(10, x)).vb, { color: H.col('c2'), ancho: 1.6, guiones: [5, 4] });
            P.punto(Math.log10(L), vout(L), { color: H.col('c2'), r: 6 });
            // franja de brillo del LED debajo del gráfico
            const fy = y0 + ph + 38;
            ctx.save();
            ctx.font = '600 10px sans-serif'; ctx.fillStyle = H.col('muted'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
            ctx.fillText('LED', x0 - 6, fy + 7);
            for (let i = 0; i < pw; i += 2) {
              const lx = -1 + 6 * i / pw, b = estado(Math.pow(10, lx)).brillo;
              ctx.fillStyle = b > 0.02 ? 'rgba(255,59,48,' + (0.15 + 0.85 * b) + ')' : H.col('panel2');
              ctx.fillRect(x0 + i, fy, 2, 14);
            }
            ctx.strokeStyle = H.col('line'); ctx.strokeRect(x0 + .5, fy + .5, pw, 14);
            ctx.restore();
          }

          function upd() {
            const L = luz.value, e = estado(L), Vo = vout(L), rl = RL(L);
            vref.el.style.display = etapa.value === 'comparador' ? '' : 'none';
            fig.innerHTML = esqNoche(pos.value, etapa.value, { rf: H.fmt(rf.value, 'Ω'), rl: H.fmt(rl, 'Ω'), vout: H.fmt(Vo, 'V'), vref: H.fmt(vref.value, 'V') });
            cv.redibujar();
            const comp = etapa.value === 'comparador';
            lec.set([
              { k: 'R de la LDR', v: H.fmt(rl, 'Ω') },
              { k: 'Vout del divisor (sin carga)', v: H.fmt(Vo, 'V') },
              comp ? { k: 'Comparación', v: Vo > vref.value ? 'V+ > V− → alto' : 'V+ < V− → bajo' } : { k: 'Corriente de base', v: H.fmt(e.ib, 'A') },
              { k: 'Corriente del LED', v: H.fmt(e.ic, 'A'), estado: e.brillo > 0.95 ? 'ok' : e.brillo > 0.05 ? 'alerta' : '' },
            ]);
            // umbral de luz: dónde cruza
            const umbral = comp ? vref.value : VBE;
            let Lu = null;
            const f = (x) => vout(Math.pow(10, x)) - umbral;
            if (f(-1) * f(5) < 0) Lu = Math.pow(10, H.biseccion(f, -1, 5));
            const sube = pos.value === 'abajo';      // Vout sube al oscurecer
            let txt = '';
            if (Lu === null) txt = `<b>Nunca cruza el umbral</b> en todo el rango de luz: con esta R fija ${H.fmt(rf.value, 'Ω')} la curva azul queda siempre ${f(0) > 0 ? 'por encima' : 'por debajo'} de la línea naranja. Cambiá R fija${comp ? ' o Vref' : ''}.`;
            else if (sube) txt = `<b>LDR abajo:</b> al oscurecer R<sub>LDR</sub> sube y Vout sube. Cruza el umbral a ≈ <b>${fmtLux(Lu)} lux</b>: por debajo de esa luz el LED se prende → <b>luz nocturna</b>.`;
            else txt = `<b>LDR arriba:</b> el comportamiento se invierte: Vout sube con la luz. Cruza el umbral a ≈ <b>${fmtLux(Lu)} lux</b> y el LED se prende <b>cuando hay luz</b> → es un <b>detector de luz</b>, no una luz nocturna.`;
            if (!comp && Lu !== null) txt += ' Con transistor el encendido es <b>gradual</b> (mirá la franja del LED): la línea punteada es la tensión real de base, que el transistor “clava” en ≈ 0,65 V.';
            if (comp && Lu !== null) txt += ' Con comparador el encendido es <b>neto</b>: o prendido o apagado. Mové Vref y fijate cómo se corre el punto de cruce.';
            txt += ` Para que el cambio sea más sensible, elegí R fija ≈ R<sub>LDR</sub> en el nivel de luz que querés detectar.`;
            nota.innerHTML = txt;
          }
          upd();
        },
      },
    ],

    ejercicios: [
      {
        nivel: 'Básico',
        enunciado: String.raw`Una LDR tiene $R_{10}=10\,\text{k}\Omega$ y $\gamma=0{,}8$. Calculá su resistencia en un aula (500 lux) y en una calle de noche con alumbrado (10 lux). ¿Cuántas veces cambia?`,
        pista: String.raw`Usá $R=R_{10}\left(\frac{L}{10}\right)^{-\gamma}$. A 10 lux la cuenta es inmediata.`,
        solucion: String.raw`A 10 lux: $R=R_{10}=10\,\text{k}\Omega$ (por definición).<br>A 500 lux: $R=10\,\text{k}\Omega\cdot 50^{-0{,}8}$. Como $50^{0{,}8}=e^{0{,}8\ln 50}=e^{3{,}13}=22{,}9$, queda $R=\frac{10\,\text{k}\Omega}{22{,}9}=437\,\Omega$.<br>Cambia $10\,000/437\approx 23$ veces.`,
      },
      {
        nivel: 'Básico',
        enunciado: String.raw`Con la LDR del ejercicio anterior, una resistencia fija de $10\,\text{k}\Omega$ y $V_{CC}=5\,\text{V}$, armás un divisor con la <b>LDR abajo</b> (entre Vout y masa). ¿Cuánto vale Vout en el aula (500 lux) y en la calle (10 lux)? ¿Sirve para una luz nocturna?`,
        pista: String.raw`LDR abajo: $V_{out}=V_{CC}\frac{R_{LDR}}{R_{fija}+R_{LDR}}$.`,
        solucion: String.raw`Aula: $V_{out}=5\cdot\frac{0{,}437}{10+0{,}437}=0{,}21\,\text{V}$.<br>Calle: $V_{out}=5\cdot\frac{10}{10+10}=2{,}5\,\text{V}$.<br>Sí: con menos luz Vout <b>sube</b>, que es lo que necesitamos para activar algo al oscurecer.`,
      },
      {
        nivel: 'Intermedio',
        enunciado: String.raw`En un Arduino UNO conectás la LDR ($R_{10}=10\,\text{k}\Omega$, $\gamma=0{,}8$) <b>arriba</b> (a 5 V) y una resistencia de $10\,\text{k}\Omega$ a masa; el punto medio va a A0. El monitor serie muestra <code>analogRead = 400</code>. ¿Cuánto vale la tensión, la resistencia de la LDR y la iluminancia aproximada?`,
        pista: String.raw`$V=N\cdot5/1023$. Del divisor despejá $R_{LDR}=R\left(\frac{V_{CC}}{V}-1\right)$. Después $L=10\left(\frac{R}{R_{10}}\right)^{-1/\gamma}$.`,
        solucion: String.raw`$V=\frac{400\cdot5}{1023}=1{,}955\,\text{V}$.<br>$R_{LDR}=10\,\text{k}\Omega\left(\frac{5}{1{,}955}-1\right)=10\cdot1{,}558=15{,}6\,\text{k}\Omega$.<br>$L=10\cdot1{,}558^{-1/0{,}8}=10\cdot1{,}558^{-1{,}25}=10\cdot0{,}575=5{,}7\,\text{lux}$ (crepúsculo).`,
      },
      {
        nivel: 'Intermedio',
        enunciado: String.raw`Querés que un comparador con $V_{ref}=2{,}5\,\text{V}$ (la mitad de 5 V) prenda una luz nocturna cuando la luz baja de <b>20 lux</b>. La LDR tiene $R_{10}=10\,\text{k}\Omega$ y $\gamma=0{,}8$ y va abajo. ¿Qué resistencia fija ponés? Elegí un valor comercial E12 y calculá a cuántos lux conmuta realmente.`,
        pista: String.raw`Con $V_{ref}=V_{CC}/2$, el divisor conmuta cuando $R_{LDR}=R_{fija}$. Calculá $R_{LDR}$ a 20 lux. E12: 1 – 1,2 – 1,5 – 1,8 – 2,2 – 2,7 – 3,3 – 3,9 – 4,7 – 5,6 – 6,8 – 8,2.`,
        solucion: String.raw`$R_{LDR}(20)=10\,\text{k}\Omega\cdot2^{-0{,}8}=10\cdot0{,}574=5{,}74\,\text{k}\Omega$. Entonces $R_{fija}=5{,}74\,\text{k}\Omega$ → comercial <b>5,6 kΩ</b>.<br>Conmuta cuando $R_{LDR}=5{,}6\,\text{k}\Omega$: $L=10\cdot0{,}56^{-1{,}25}=10\cdot2{,}06=20{,}6\,\text{lux}$. Prácticamente lo pedido. (En la realidad, por la dispersión de la LDR, se pone un preset para ajustar.)`,
      },
      {
        nivel: 'Avanzado',
        enunciado: String.raw`No tenés la hoja de datos de una LDR, así que la medís: a 10 lux da $12\,\text{k}\Omega$ y a 1000 lux da $480\,\Omega$. Calculá $\gamma$ y estimá su resistencia a 200 lux.`,
        pista: String.raw`Dividí las dos ecuaciones: $\frac{R_1}{R_2}=\left(\frac{L_2}{L_1}\right)^{\gamma}$, y tomá logaritmo.`,
        solucion: String.raw`$\frac{12\,000}{480}=25=\left(\frac{1000}{10}\right)^{\gamma}=100^{\gamma}$ → $\gamma=\frac{\log 25}{\log 100}=\frac{1{,}398}{2}=0{,}70$.<br>$R(200)=12\,\text{k}\Omega\cdot20^{-0{,}70}$. $20^{0{,}70}=10^{0{,}70\cdot1{,}301}=10^{0{,}909}=8{,}11$ → $R(200)=\frac{12\,000}{8{,}11}\approx1{,}48\,\text{k}\Omega$.`,
      },
      {
        nivel: 'Avanzado',
        enunciado: String.raw`Luz nocturna con transistor: $V_{CC}=5\,\text{V}$, resistencia fija de $47\,\text{k}\Omega$ arriba (de +5 V a la base) y la LDR ($R_{10}=10\,\text{k}\Omega$, $\gamma=0{,}8$) abajo (de base a masa). En el colector: $220\,\Omega$ y un LED rojo ($V_F=2\,\text{V}$). Suponiendo $V_{BE}=0{,}65\,\text{V}$ y despreciando la corriente de base, ¿por debajo de qué iluminancia empieza a prender? ¿Cuánta corriente tiene el LED con el transistor saturado ($V_{CE(sat)}=0{,}2\,\text{V}$)?`,
        pista: String.raw`Planteá $5\cdot\frac{R_{LDR}}{47\,\text{k}+R_{LDR}}=0{,}65$ y despejá $R_{LDR}$. Para el LED: malla del colector.`,
        solucion: String.raw`$5R_{LDR}=0{,}65(47+R_{LDR})\Rightarrow 4{,}35R_{LDR}=30{,}55\Rightarrow R_{LDR}=7{,}02\,\text{k}\Omega$ (en kΩ).<br>$L=10\cdot\left(\frac{7{,}02}{10}\right)^{-1{,}25}=10\cdot1{,}556=15{,}6\,\text{lux}$: empieza a prender cuando la luz baja de ≈ 16 lux.<br>LED saturado: $I=\frac{5-2-0{,}2}{220}=12{,}7\,\text{mA}$. (Como la base carga al divisor, en la práctica prende a una luz algo menor; por eso se usa un preset en lugar de la R fija.)`,
      },
    ],

    quiz: [
      { pregunta: '¿Qué le pasa a la resistencia de una LDR cuando aumenta la luz?', opciones: ['Aumenta', 'Disminuye', 'No cambia', 'Se hace negativa'], correcta: 1, explicacion: 'La luz libera portadores de carga en el CdS: conduce más, la resistencia baja.' },
      { pregunta: 'En el gráfico de la hoja de datos, R vs. lux aparece como una recta. ¿Por qué?', opciones: ['Porque la LDR es lineal', 'Porque los dos ejes están en escala logarítmica y la relación es una potencia', 'Porque el gráfico está mal', 'Porque se mide en corriente alterna'], correcta: 1, explicacion: 'R = R10·(L/10)^(−γ): tomando logaritmos queda log R = cte − γ·log L, una recta de pendiente −γ en escala log‑log.' },
      { pregunta: 'Un divisor tiene la LDR entre +5 V y Vout, y una R fija entre Vout y masa. Al oscurecer, Vout…', opciones: ['Sube', 'Baja', 'Se queda en 2,5 V', 'Se hace negativa'], correcta: 1, explicacion: 'LDR arriba: Vout = VCC·Rfija/(Rfija + RLDR). En oscuridad RLDR crece, el denominador crece y Vout baja.' },
      { pregunta: '¿Por qué una LDR no sirve para recibir la señal de un control remoto infrarrojo?', opciones: ['Porque es muy lenta (ms) y casi no responde al infrarrojo', 'Porque tiene polaridad', 'Porque necesita corriente alterna', 'Porque se quema con el infrarrojo'], correcta: 0, explicacion: 'Responde en decenas de milisegundos y su sensibilidad máxima está en el verde (~540 nm). Para IR rápido se usan fotodiodos o fototransistores.' },
      { pregunta: 'Para que el divisor sea lo más sensible posible al nivel de luz que querés detectar, la R fija debe ser…', opciones: ['Mucho mayor que la LDR', 'Mucho menor que la LDR', 'Igual a la R de la LDR en ese nivel de luz', 'Cero'], correcta: 2, explicacion: 'La pendiente de Vout respecto de log(RLDR) es máxima cuando Rfija = RLDR; en ese punto Vout = VCC/2.' },
      { pregunta: '¿Por qué las LDR de CdS están restringidas por la norma RoHS?', opciones: ['Porque consumen mucha energía', 'Porque contienen cadmio, un metal pesado tóxico', 'Porque emiten radiación', 'Porque se calientan'], correcta: 1, explicacion: 'El sulfuro de cadmio contiene Cd. RoHS limita el cadmio en productos electrónicos; se reemplazan por fotodiodos o sensores integrados.' },
    ],

    docente: String.raw`
<h3>Objetivo de la clase</h3>
<p>Que el alumno entienda que la LDR es una resistencia que baja con la luz, que sepa leer la curva log‑log, y sobre todo que sepa <b>convertir resistencia en tensión con un divisor</b> y elegir la posición de la LDR según quiera que el circuito reaccione a la luz o a la oscuridad. <b>Duración sugerida:</b> 1 clase (60–80 min).</p>
<h3>Secuencia sugerida</h3>
<ol>
<li><b>Disparador (5 min):</b> “¿Cómo sabe una luz de calle que se hizo de noche?”. Dejá que proponga ideas (reloj, sensor…). Mostrale una LDR (o una foto) y el símbolo.</li>
<li><b>Física intuitiva (10 min):</b> sección 1. Analogía de los autos estacionados que arrancan. Remarcá: más luz → más portadores → menos R.</li>
<li><b>Simulación 1 (15 min):</b> antes de mover nada, preguntale: “si la luz pasa de 10 a 100 lux, ¿la resistencia baja a la mitad, a la décima…?”. Mové el slider y verificá con la lectura “Luz ×10 → R se divide por”. Activá el ciclo día ↔ noche y mostrá cómo la curva se aplana en los extremos (R de oscuridad y saturación). Cambiá γ para ver la pendiente. Explicá por qué se usa escala log‑log (el slider va de 0,1 a 100 000).</li>
<li><b>Divisor (15 min):</b> resolvé el ejemplo de la sección 5 en la pizarra. Preguntá “¿qué pasa si intercambio la LDR y la R fija?” antes de mostrarlo.</li>
<li><b>Simulación 2 (15 min):</b> empezá con transistor y LDR abajo; activá el ciclo automático: el LED se prende de a poco al anochecer. Cambiá a LDR arriba: “¿qué hace ahora?” (detector de luz). Pasá a comparador y mostrá el encendido neto; moviendo Vref se corre el umbral. Pedile que encuentre la R fija que hace conmutar a 10 lux con Vref = 2,5 V (respuesta: 10 kΩ).</li>
<li><b>Cierre (5 min):</b> autoevaluación; tarea: ejercicios 3, 4 y 6.</li>
</ol>
<h3>Errores frecuentes</h3>
<ul>
<li>Pensar que la LDR “genera” tensión. Es pasiva: hay que alimentarla.</li>
<li>Confundir el símbolo con el del LED (flechas entrando vs. saliendo).</li>
<li>Usar escala lineal y no ver nada (toda la curva queda pegada a los ejes).</li>
<li>Elegir una R fija absurda (100 Ω con una LDR de decenas de kΩ): Vout casi no cambia.</li>
<li>Olvidar que la base del transistor carga al divisor.</li>
</ul>
<h3>Preguntas para hacerle pensar</h3>
<ul>
<li>¿Por qué la luz de calle no se apaga cuando pasa un auto con las luces altas? (respuesta lenta + retardo + histéresis)</li>
<li>Si la LDR del farol queda iluminada por su propia lámpara, ¿qué pasa? (oscila: se prende, se ilumina, se apaga…)</li>
<li>¿Qué sensor elegirías para contar objetos que pasan rápido por una cinta transportadora? (fototransistor)</li>
</ul>
<h3>Recordatorio rápido para vos</h3>
<ul>
<li>GL5528 (la más común en kits): $R_{10}$ = 8–20 kΩ, R oscuridad ≥ 1 MΩ, γ ≈ 0,6–0,7, pico espectral 540 nm, tiempo de subida 20 ms / bajada 30 ms, 100 mW, 150 V máx.</li>
<li>$\log R = \log R_{10} - \gamma\log(L/10)$; $\gamma = \dfrac{\log(R_1/R_2)}{\log(L_2/L_1)}$.</li>
<li>Divisor: sensibilidad máxima con $R_{fija}=R_{LDR}$ en el punto de interés.</li>
<li>ADC Arduino UNO: 10 bits, $N = 1023\cdot V/5$; ESP32: 12 bits (0–4095) y 3,3 V.</li>
<li>Comparadores típicos: LM393 (salida a colector abierto: necesita resistencia de pull‑up), LM358 (operacional usado como comparador).</li>
</ul>
<h3>Experiencia práctica</h3>
<p><b>Tinkercad Circuits</b> tiene “fotorresistor” y un control deslizante de luz al hacer clic en la simulación. Armá: LDR arriba + 10 kΩ a masa → A0, y el sketch de la sección 7. Que el alumno anote la lectura con distintos niveles de luz y ajuste el umbral. Variante: el circuito con BC547 y LED (sin Arduino). Si tiene el componente en casa: medí la LDR con el multímetro en Ω tapándola con el dedo y con la linterna del celular.</p>
`,
  });
})();
