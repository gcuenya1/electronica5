/* Tema 13 — Diodos zener (estabilizadores y recortadores)
   IMPORTANTE: los textos con LaTeX usan String.raw`...` para que "\frac" no se rompa.
   Todo va dentro de una IIFE para que las funciones auxiliares no choquen con otros temas. */
(() => {
  const S = 'stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"';

  /* ---------- Diagrama de bloques de la fuente (igual que en los temas 11 y 12) ---------- */
  function cadena(activo) {
    const cajas = [
      { k: 'trafo', t: 'Transformador', s: 'baja la tensión' },
      { k: 'rect', t: 'Rectificador', s: 'diodos' },
      { k: 'filtro', t: 'Filtro', s: 'capacitor' },
      { k: 'reg', t: 'Regulador', s: 'zener' },
    ];
    const N = 80;
    const onda = (vals, cx, w, y0, a) => {
      let d = '';
      vals.forEach((v, i) => { const x = cx - w / 2 + w * i / (vals.length - 1); d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + (y0 - a * v).toFixed(1); });
      return `<path d="M${cx - w / 2} ${y0}H${cx + w / 2}" style="stroke:var(--axis)" stroke-width="1" fill="none"/><path d="${d}" fill="none" style="stroke:var(--c1)" stroke-width="2" stroke-linejoin="round"/>`;
    };
    const u = [...Array(N + 1).keys()].map(i => i / N);
    const sen = u.map(x => Math.sin(4 * Math.PI * x));
    const rect = u.map(x => Math.abs(Math.sin(4 * Math.PI * x)));
    let c = 0.2; const riz = u.map(x => { const e = Math.abs(Math.sin(4 * Math.PI * x)); c = Math.max(e, c - 0.012); return c; });
    const ondas = [onda(sen, 35, 56, 115, 18), onda(sen, 160, 96, 115, 9), onda(rect, 320, 96, 127, 24), onda(riz, 480, 96, 127, 24), onda(u.map(() => 0.75), 640, 96, 127, 24)];
    const p = [];
    p.push(Esq.texto(35, 40, 'Red', { size: 13 }), Esq.texto(35, 57, '220 V~', { size: 11, peso: 400 }), ondas[0]);
    cajas.forEach((b, i) => {
      const x = 100 + i * 160, on = b.k === activo;
      p.push(`<rect x="${x}" y="18" width="120" height="54" rx="9" style="stroke:${on ? 'var(--accent)' : 'currentColor'};fill:${on ? 'var(--accent-soft)' : 'var(--panel)'}" stroke-width="${on ? 3 : 1.5}"/>`);
      p.push(Esq.texto(x + 60, 42, b.t, { size: 13, color: on ? 'var(--accent)' : '' }), Esq.texto(x + 60, 60, b.s, { size: 11, peso: 400 }));
      if (on) p.push(Esq.texto(x + 60, 12, '◆ este tema', { size: 10, color: 'var(--accent)' }));
      p.push(ondas[i + 1]);
    });
    const fl = (x1, x2) => `<path ${S} d="M${x1} 45H${x2 - 2}"/><path d="M${x2} 45l-8 -4.5v9z" fill="currentColor"/>`;
    p.push(fl(70, 100), fl(220, 260), fl(380, 420), fl(540, 580), fl(700, 728));
    p.push(Esq.texto(752, 40, 'Carga', { size: 13 }), Esq.texto(752, 57, 'CC estable', { size: 11, peso: 400 }));
    return Esq.svg(780, 145, p, 'Cadena de una fuente de alimentación lineal. Debajo de cada bloque: la forma de onda que sale de él.');
  }

  /* ---------- Datos reales de zeners comerciales ----------
     1 W: serie 1N4728…1N4742 (Izt y Zzt de hoja de datos). 0,5 W: serie 1N5226…1N5242 (Izt = 20 mA). */
  const ZENER = {
    '3.3': { w1: { nombre: '1N4728A', izt: 0.076, rz: 10 }, w05: { nombre: '1N5226B', izt: 0.020, rz: 28 } },
    '5.1': { w1: { nombre: '1N4733A', izt: 0.049, rz: 7 }, w05: { nombre: '1N5231B', izt: 0.020, rz: 17 } },
    '6.2': { w1: { nombre: '1N4735A', izt: 0.041, rz: 2 }, w05: { nombre: '1N5234B', izt: 0.020, rz: 7 } },
    '9.1': { w1: { nombre: '1N4739A', izt: 0.028, rz: 5 }, w05: { nombre: '1N5239B', izt: 0.020, rz: 10 } },
    '12': { w1: { nombre: '1N4742A', izt: 0.021, rz: 9 }, w05: { nombre: '1N5242B', izt: 0.020, rz: 30 } },
  };

  /* ---------- Resolución del estabilizador zener ----------
     Thevenin visto desde el zener: Vth = Vin·RL/(Rs+RL), Rth = Rs∥RL.
     Modelo ideal: zener = fuente Vz si Vth > Vz. Modelo real: Vz0 + rz·Iz (Vz nominal a Izt). */
  function resolverZ({ Vin, Rs, RL, Vz, rz = 0, izt = 0 }) {
    const conCarga = Number.isFinite(RL);
    const Vth = conCarga ? Vin * RL / (Rs + RL) : Vin;
    const Rth = conCarga ? Rs * RL / (Rs + RL) : Rs;
    const Vz0 = rz > 0 ? Vz - rz * izt : Vz;
    let Vout, Iz;
    if (Vth <= Vz0) { Vout = Vth; Iz = 0; }
    else if (rz > 0) { Iz = (Vth - Vz0) / (Rth + rz); Vout = Vz0 + Iz * rz; }
    else { Vout = Vz; Iz = (Vth - Vz) / Rth; }
    const Is = (Vin - Vout) / Rs, IL = conCarga ? Vout / RL : 0;
    return { Vth, Vout, Iz, Is, IL, Pz: Vout * Iz, PRs: Is * Is * Rs, PL: Vout * IL, Pin: Vin * Is };
  }

  /* ---------- Esquemas ---------- */
  // Estabilizador: Vin – Rs – (DZ ∥ RL)
  function estabSVG(v = {}) {
    const sinCarga = v.sinCarga;
    const p = [
      Esq.fuenteV(70, 75, 70, 145, 'Vin', v.vin || '', -1),
      Esq.cable([[70, 75], [70, 40], [120, 40]]), Esq.R(120, 40, 200, 40, 'Rs', v.rs || '', 1),
      Esq.cable([[200, 40], [490, 40]]), Esq.cable([[70, 145], [70, 180], [490, 180]]),
      Esq.nodo(280, 40), Esq.nodo(280, 180),
      Esq.cable([[280, 40], [280, 75]]), Esq.Dz(280, 145, 280, 75, 'DZ', v.vz || '', 1), Esq.cable([[280, 145], [280, 180]]),
      Esq.flecha(212, 26, 252, 26, '', 'var(--c2)'), Esq.texto(232, 18, 'Is' + (v.is ? ' = ' + v.is : ''), { size: 12, color: 'var(--c2)' }),
      Esq.flecha(258, 90, 258, 130, '', 'var(--c3)'), Esq.texto(252, 114, 'Iz', { size: 12, anchor: 'end', color: 'var(--c3)' }),
      Esq.borne(490, 40, '+', 12, 5), Esq.borne(490, 180, '−', 12, 5),
    ];
    if (v.iz) p.push(Esq.texto(252, 129, v.iz, { size: 11, anchor: 'end', peso: 400, color: 'var(--c3)' }));
    if (!sinCarga) {
      p.push(Esq.nodo(410, 40), Esq.nodo(410, 180), Esq.cable([[410, 40], [410, 75]]), Esq.R(410, 75, 410, 145, 'RL', v.rl || '', 1), Esq.cable([[410, 145], [410, 180]]),
        Esq.flecha(388, 90, 388, 130, '', 'var(--c4)'), Esq.texto(382, 114, 'IL', { size: 12, anchor: 'end', color: 'var(--c4)' }));
      if (v.il) p.push(Esq.texto(382, 129, v.il, { size: 11, anchor: 'end', peso: 400, color: 'var(--c4)' }));
    } else {
      p.push(Esq.texto(420, 112, 'sin carga', { size: 12, peso: 400, color: 'var(--muted)' }));
    }
    p.push(Esq.texto(498, 104, 'Vout', { size: 13, anchor: 'start', color: 'var(--c1)' }));
    if (v.vout) p.push(Esq.texto(498, 121, v.vout, { size: 12, anchor: 'start', color: 'var(--c1)' }));
    return p;
  }

  // Recortadores. cfg: 'd' diodo común, 'z' zener simple, 'zz' dos zener en antiserie, 'b' diodo + batería
  function recSVG(cfg, inv, v = {}) {
    const x = 280;
    const p = [
      Esq.fuenteAC(60, 75, 60, 145, 'vin', v.vin || '', -1),
      Esq.cable([[60, 75], [60, 40], [100, 40]]), Esq.R(100, 40, 180, 40, 'R', v.r || '1 kΩ', 1),
      Esq.cable([[180, 40], [400, 40]]), Esq.cable([[60, 145], [60, 180], [400, 180]]),
      Esq.nodo(x, 40), Esq.nodo(x, 180),
      Esq.borne(400, 40, '+', 12, 5), Esq.borne(400, 180, '−', 12, 5),
      Esq.texto(408, 115, 'vout', { size: 13, anchor: 'start', color: 'var(--c1)' }),
    ];
    if (cfg === 'd') {
      p.push(Esq.cable([[x, 40], [x, 75]]), inv ? Esq.D(x, 145, x, 75, 'D', '1N4148', 1) : Esq.D(x, 75, x, 145, 'D', '1N4148', 1), Esq.cable([[x, 145], [x, 180]]));
    } else if (cfg === 'z') {
      p.push(Esq.cable([[x, 40], [x, 75]]), inv ? Esq.Dz(x, 75, x, 145, 'DZ', v.vz || '', 1) : Esq.Dz(x, 145, x, 75, 'DZ', v.vz || '', 1), Esq.cable([[x, 145], [x, 180]]));
    } else if (cfg === 'zz') {
      p.push(Esq.cable([[x, 40], [x, 50]]), Esq.Dz(x, 110, x, 50, 'DZ1', v.vz || '', 1), Esq.Dz(x, 110, x, 170, 'DZ2', v.vz || '', 1), Esq.cable([[x, 170], [x, 180]]));
    } else {
      p.push(Esq.cable([[x, 40], [x, 48]]), inv ? Esq.D(x, 102, x, 48, 'D', '', 1) : Esq.D(x, 48, x, 102, 'D', '', 1), Esq.cable([[x, 102], [x, 116]]),
        inv ? Esq.bat(x, 168, x, 116, 'Vref', v.vref || '', 1) : Esq.bat(x, 116, x, 168, 'Vref', v.vref || '', 1), Esq.cable([[x, 168], [x, 180]]));
    }
    if (v.onda) {   // miniatura de formas de onda a la derecha
      const { A, hi, lo } = v.onda, x0 = 505, x1 = 680, yc = 110, k = 55 / A;
      const pth = (f) => { let d = ''; for (let i = 0; i <= 120; i++) { const t = i / 120, val = f(A * Math.sin(4 * Math.PI * t)); d += (i ? 'L' : 'M') + (x0 + (x1 - x0) * t).toFixed(1) + ' ' + (yc - val * k).toFixed(1); } return d; };
      p.push(`<path d="M${x0} ${yc}H${x1}M${x0} 45V175" style="stroke:var(--axis)" stroke-width="1" fill="none"/>`,
        `<path d="${pth(z => z)}" fill="none" style="stroke:var(--muted)" stroke-width="1.5" stroke-dasharray="5 4"/>`,
        `<path d="${pth(z => Math.min(hi, Math.max(lo, z)))}" fill="none" style="stroke:var(--c1)" stroke-width="3" stroke-linejoin="round"/>`);
      if (Number.isFinite(hi)) p.push(Esq.texto(x0 - 5, yc - hi * k + 4, v.onda.thi, { size: 11, anchor: 'end', color: 'var(--c1)' }));
      if (Number.isFinite(lo)) p.push(Esq.texto(x0 - 5, yc - lo * k + 4, v.onda.tlo, { size: 11, anchor: 'end', color: 'var(--c1)' }));
      p.push(Esq.texto(x1, 195, 'punteada: vin · azul: vout', { size: 10, anchor: 'end', peso: 400 }));
    }
    return p;
  }

  // Curva característica del zener (no a escala)
  function curvaSVG() {
    const ox = 300, oy = 100;
    const p = [
      `<path d="M98 125h-5V245h5" style="stroke:var(--c3)" stroke-width="2" fill="none"/>`,
      `<path ${S} stroke-width="1.2" d="M40 ${oy}H440M${ox} 12V272"/>`, `<path d="M440 ${oy}l-8 -4v8z" fill="currentColor"/><path d="M${ox} 12l-4 8h8z" fill="currentColor"/>`,
      Esq.texto(446, oy + 4, 'V', { size: 13, anchor: 'start' }), Esq.texto(ox + 8, 20, 'I', { size: 13, anchor: 'start' }),
      `<path d="M${ox} ${oy}L322 99Q333 96 337 70L343 14" fill="none" style="stroke:var(--c1)" stroke-width="3" stroke-linecap="round"/>`,
      `<path d="M${ox} ${oy}L136 102Q121 104 118 125L110 265" fill="none" style="stroke:var(--c1)" stroke-width="3" stroke-linecap="round"/>`,
      Esq.texto(346, oy - 6, '≈ 0,7 V', { size: 11, anchor: 'start', peso: 400 }), Esq.texto(372, 52, 'directa', { size: 12, anchor: 'start', peso: 400 }), Esq.texto(372, 67, '(como un diodo común)', { size: 11, anchor: 'start', peso: 400 }),
      Esq.texto(118, oy - 8, '−Vz', { size: 13, color: 'var(--c2)' }), `<path d="M118 ${oy - 4}V${oy + 4}" style="stroke:var(--c2)" stroke-width="2"/>`,
      Esq.texto(215, oy - 8, 'casi no conduce (fuga)', { size: 11, peso: 400 }),
    ];
    const marca = (y, xr, t, c) => p.push(`<path d="M${xr} ${y}H${ox}" style="stroke:${c}" stroke-width="1.2" stroke-dasharray="4 3" fill="none"/>`, Esq.texto(ox + 8, y + 4, t, { size: 12, anchor: 'start', color: c }));
    marca(125, 118, 'Izk = Izmin (codo)', 'var(--c4)');
    marca(180, 114, 'Izt (corriente de prueba)', 'var(--muted)');
    marca(245, 111, 'Izmax = Pz / Vz', 'var(--red)');
    p.push(Esq.texto(86, 170, 'zona de', { size: 12, anchor: 'end', color: 'var(--c3)' }), Esq.texto(86, 185, 'regulación', { size: 12, anchor: 'end', color: 'var(--c3)' }),
      Esq.texto(86, 200, '(V ≈ Vz)', { size: 11, anchor: 'end', peso: 400, color: 'var(--c3)' }),
      Esq.texto(124, 282, 'ruptura inversa: acá trabaja el zener', { size: 11, anchor: 'start', peso: 400 }));
    return p;
  }

  // Zener + transistor (seguidor por emisor)
  function zenerTrSVG() {
    return [
      Esq.fuenteV(60, 75, 60, 145, 'Vin', '', -1),
      Esq.cable([[60, 75], [60, 40], [272, 40], [272, 80]]), Esq.nodo(170, 40),
      Esq.cable([[170, 40], [170, 45]]), Esq.R(170, 45, 170, 105, 'Rs', '', -1), Esq.cable([[170, 105], [170, 110], [230, 110]]), Esq.nodo(170, 110),
      Esq.cable([[170, 110], [170, 125]]), Esq.Dz(170, 195, 170, 125, 'DZ', '', -1), Esq.cable([[170, 195], [170, 230]]),
      Esq.bjt(260, 110, 'NPN', 'Q1'),
      Esq.cable([[272, 140], [272, 150], [420, 150]]), Esq.nodo(360, 150),
      Esq.cable([[360, 150], [360, 160]]), Esq.R(360, 160, 360, 220, 'RL', '', 1), Esq.cable([[360, 220], [360, 230]]),
      Esq.cable([[60, 145], [60, 230], [420, 230]]), Esq.nodo(170, 230), Esq.nodo(360, 230),
      Esq.borne(420, 150, 'Vz − 0,7 V', 0, -12), Esq.borne(420, 230, '−', 0, 22),
      Esq.texto(200, 128, 'IB chica', { size: 11, peso: 400, color: 'var(--c2)' }),
    ];
  }

  registrarTema({
    id: 'zener',
    orden: 13,
    titulo: 'Diodos zener (estabilizadores y recortadores)',
    resumen: 'El diodo que trabaja en ruptura: tensión fija para estabilizar y para recortar señales',
    confirmar: false,

    teoria: String.raw`
<p>En el tema anterior llegamos a una continua con rizado: unos 15 V que suben y bajan un poco, y que además cambian si la carga consume más o si la red sube. Muchos circuitos (un microcontrolador, un sensor, una referencia para medir) necesitan una tensión <b>fija</b>. El último bloque de la fuente es el <b>regulador</b>, y el más simple de todos se arma con un solo componente especial: el <b>diodo zener</b> (y una resistencia).</p>
${cadena('reg')}

<h2>1. Un diodo hecho para trabajar “al revés”</h2>
<p>En el tema de diodos vimos que, en inversa, un diodo casi no conduce… hasta que la tensión supera la <b>tensión de ruptura</b>. En un diodo común (1N4007) eso pasa a 1000 V y lo destruye. El <b>zener</b> es un diodo fabricado (con un dopaje mucho mayor) para que la ruptura ocurra a una tensión baja y <b>precisa</b> —por ejemplo 5,1 V— y para que pueda <b>trabajar ahí todo el tiempo</b> sin dañarse, siempre que no se pase de su potencia.</p>
<p>La propiedad clave: <b>en ruptura, la tensión entre sus terminales queda prácticamente fija en $V_Z$, aunque la corriente que lo atraviesa cambie mucho</b>. Eso es exactamente lo que necesita un estabilizador.</p>
<div class="dos-col">
<div>
${Esq.svg(260, 120, [
      Esq.cable([[20, 50], [70, 50]]), Esq.Dz(70, 50, 150, 50, '', '', 1), Esq.cable([[150, 50], [230, 50]]),
      Esq.texto(30, 38, 'A (ánodo)', { size: 12, anchor: 'start' }), Esq.texto(230, 38, 'K (cátodo)', { size: 12, anchor: 'end' }),
      Esq.texto(130, 92, 'la raya del cátodo tiene “alitas” (una Z)', { size: 11, peso: 400 }),
      Esq.texto(130, 108, 'en el cuerpo: franja del lado del cátodo', { size: 11, peso: 400 }),
    ], 'Símbolo del zener.')}
</div>
<div>
${Esq.svg(260, 150, [
      Esq.bat(40, 40, 40, 110, '', '', -1), Esq.cable([[40, 40], [40, 20], [80, 20]]), Esq.R(80, 20, 160, 20, 'R', '', 1), Esq.cable([[160, 20], [200, 20], [200, 40]]),
      Esq.Dz(200, 110, 200, 40, '', '', 1), Esq.cable([[200, 110], [200, 130], [40, 130], [40, 110]]),
      Esq.texto(212, 50, 'K', { size: 12, anchor: 'start' }), Esq.texto(212, 108, 'A', { size: 12, anchor: 'start' }),
      Esq.texto(222, 80, 'Vz', { size: 13, anchor: 'start', color: 'var(--c1)' }), Esq.pm(190, 52, 190, 102),
    ], 'Uso normal: polarizado en inversa (+ al cátodo) y siempre con una resistencia en serie.')}
</div>
</div>
<div class="caja ojo"><span class="caja-titulo">Se conecta al revés que un diodo común</span>
Para que estabilice, el zener va con el <b>cátodo hacia el positivo</b>. Si lo ponés “derecho” (ánodo al +), se comporta como un diodo común y te da 0,7 V. Es el error más típico en el armado.
</div>
<div class="caja idea"><span class="caja-titulo">Dos mecanismos de ruptura (curiosidad útil)</span>
Por debajo de unos 5 V domina el <b>efecto zener</b> (los electrones atraviesan la juntura por efecto túnel); por encima de unos 6 V domina la <b>avalancha</b>. A todos se los llama “zener”. Dato práctico: los de <b>5,6 a 6,2 V</b> son los más estables con la temperatura, porque los dos efectos se compensan; los de 3,3 V tienen un codo muy “blando”.
</div>

<h2>2. La curva característica</h2>
${Esq.svg(460, 290, curvaSVG(), 'Curva I–V del zener (no está a escala: la parte inversa está agrandada). En el tercer cuadrante, la tensión casi no cambia aunque la corriente varíe mucho.')}
<ul>
<li><b>Directa:</b> igual que cualquier diodo, conduce a partir de ≈ 0,7 V.</li>
<li><b>Inversa, por debajo de $V_Z$:</b> solo circula una corriente de fuga minúscula.</li>
<li><b>Ruptura:</b> al llegar a $V_Z$ la corriente crece muchísimo con un mínimo aumento de tensión. La recta es casi vertical; su pequeña inclinación es la <b>resistencia dinámica</b> $r_z$ (unos pocos ohms).</li>
</ul>
<div class="caja formula"><span class="caja-titulo">Los tres límites de corriente que importan</span>
$$I_{Z\max}=\frac{P_Z}{V_Z}\qquad\qquad I_{Z\min}\approx I_{ZK}\quad(\text{criterio de diseño: }I_{Z\min}\approx 0{,}1\,I_{Z\max})$$
$$V_Z\approx V_{Z,nom}+r_z\,(I_Z-I_{ZT})$$
<ul>
<li>$I_{Z\min}$ (o $I_{ZK}$, “corriente de codo”): por debajo, el zener sale de la zona recta y la tensión ya no es firme.</li>
<li>$I_{ZT}$: corriente a la que el fabricante mide la $V_Z$ nominal.</li>
<li>$I_{Z\max}$: por encima, se supera la potencia $P_Z$ y se quema.</li>
</ul>
</div>
<div class="caja ejemplo"><span class="caja-titulo">Ejemplo: ¿cuánta corriente aguanta?</span>
Zener de 5,1 V – 0,5 W: $I_{Z\max}=\dfrac{0{,}5}{5{,}1}=98\,\text{mA}$, y tomamos $I_{Z\min}\approx9{,}8\,\text{mA}$. El de 5,1 V – 1 W aguanta el doble: $196\,\text{mA}$.
</div>
<div class="caja tip"><span class="caja-titulo">¿Por qué 10 % de Izmax si la hoja dice Izk = 1 mA?</span>
En la hoja de datos, $I_{ZK}$ suele ser 0,25–1 mA, pero cerca de ese codo la tensión ya cae bastante y $r_z$ es enorme. Por eso en clase y en el taller se diseña con un margen: que por el zener circule <b>como mínimo un 10 % de $I_{Z\max}$</b> (o algo cercano a $I_{ZT}$). Es el criterio que usa la simulación.
</div>

<h2>3. Datos de hoja de datos (valores reales)</h2>
<div class="tabla-wrap"><table class="tabla">
<tr><th>Vz</th><th>1 W</th><th>Izt</th><th>rz (Zzt)</th><th>Izmax</th><th>0,5 W</th><th>rz (Zzt)</th><th>Izmax</th></tr>
<tr><td>3,3 V</td><td>1N4728A</td><td>76 mA</td><td>10 Ω</td><td>303 mA</td><td>1N5226B</td><td>28 Ω</td><td>152 mA</td></tr>
<tr><td>5,1 V</td><td>1N4733A</td><td>49 mA</td><td>7 Ω</td><td>196 mA</td><td>1N5231B</td><td>17 Ω</td><td>98 mA</td></tr>
<tr><td>6,2 V</td><td>1N4735A</td><td>41 mA</td><td>2 Ω</td><td>161 mA</td><td>1N5234B</td><td>7 Ω</td><td>81 mA</td></tr>
<tr><td>9,1 V</td><td>1N4739A</td><td>28 mA</td><td>5 Ω</td><td>110 mA</td><td>1N5239B</td><td>10 Ω</td><td>55 mA</td></tr>
<tr><td>12 V</td><td>1N4742A</td><td>21 mA</td><td>9 Ω</td><td>83 mA</td><td>1N5242B</td><td>30 Ω</td><td>42 mA</td></tr>
</table></div>
<p>Los de 0,5 W tienen $I_{ZT}=20\,\text{mA}$. También son muy comunes los BZX55 / BZX79 (0,5 W) y BZX85 (1,3 W), marcados por ejemplo “C5V1” = 5,1 V con ±5 % de tolerancia. Valores normales de la serie: 2,7 – 3,3 – 3,9 – 4,7 – 5,1 – 5,6 – 6,2 – 6,8 – 8,2 – 9,1 – 10 – 12 – 15 – 18 – 24 V.</p>

<h2>4. El estabilizador zener: cómo funciona</h2>
<p>El circuito tiene solo dos componentes: una <b>resistencia serie $R_s$</b> y el zener <b>en paralelo con la carga</b>.</p>
${Esq.svg(550, 200, estabSVG({ vin: '12 V', rs: '220 Ω', vz: '5,1 V', rl: '470 Ω', vout: '5,1 V' }), 'Estabilizador zener: Rs limita la corriente; el zener mantiene Vout = Vz y se lleva la corriente que la carga no usa.')}
<p>La idea es simple: <b>$R_s$ deja pasar más corriente de la que la carga necesita, y el zener “se come” la diferencia</b>. Como la tensión del zener es fija, la de la carga (que está en paralelo) también.</p>
<div class="caja formula"><span class="caja-titulo">Las tres corrientes (con el zener en ruptura)</span>
$$I_s=\frac{V_{in}-V_Z}{R_s}\qquad\qquad I_L=\frac{V_Z}{R_L}\qquad\qquad I_Z=I_s-I_L$$
$$P_Z=V_Z\cdot I_Z\qquad\qquad P_{R_s}=\frac{(V_{in}-V_Z)^2}{R_s}$$
</div>
<ul>
<li><b>Si sube $V_{in}$</b> (rizado, red alta): $V_{out}$ no puede subir, así que toda la tensión extra cae en $R_s$. $I_s$ aumenta, $I_L$ no cambia, y <b>el aumento se va por el zener</b>.</li>
<li><b>Si la carga consume más</b> ($R_L$ menor): $I_s$ es la misma (depende solo de $V_{in}$ y $V_Z$), así que <b>la corriente extra de la carga se la “saca” al zener</b>: $I_Z$ baja.</li>
<li><b>Si la carga se desconecta:</b> toda $I_s$ pasa por el zener. Es el momento de <b>máxima potencia en el zener</b>.</li>
</ul>
<div class="caja idea"><span class="caja-titulo">Analogía: el tanque con rebalse</span>
Imaginá un tanque con un caño de rebalse a cierta altura. La canilla ($R_s$) siempre echa un poco más de agua de la que se consume. El nivel nunca supera el rebalse: lo que sobra se va por ahí. El rebalse es el zener; la altura del rebalse, $V_Z$. Si abrís menos la canilla de lo que la casa consume, el nivel baja del rebalse y deja de regular. Y si la canilla echa demasiado, el caño de rebalse no da abasto (el zener se quema).
</div>
<div class="caja ojo"><span class="caja-titulo">¿Está en ruptura? Primero, verificalo</span>
Las fórmulas de arriba valen solo si el zener conduce. Para saberlo, <b>sacá mentalmente el zener</b> y calculá la tensión que tendría la carga con el divisor $R_s$–$R_L$:
$$V_{th}=V_{in}\,\frac{R_L}{R_s+R_L}\qquad\begin{cases}V_{th}>V_Z & \Rightarrow \text{ruptura: } V_{out}=V_Z\\ V_{th}\le V_Z & \Rightarrow \text{el zener no conduce: } V_{out}=V_{th}\end{cases}$$
Si da $I_Z$ negativa en la fórmula, es la misma señal: el zener no está conduciendo.
</div>
<div class="caja ejemplo"><span class="caja-titulo">Ejemplo: análisis del circuito de la figura</span>
$V_{in}=12\,\text{V}$, $R_s=220\,\Omega$, $V_Z=5{,}1\,\text{V}$ (0,5 W), $R_L=470\,\Omega$.
<ol>
<li>¿Ruptura? $V_{th}=12\cdot\dfrac{470}{690}=8{,}17\,\text{V}>5{,}1\,\text{V}$ ✓ → $V_{out}=5{,}1\,\text{V}$.</li>
<li>$I_s=\dfrac{12-5{,}1}{220}=31{,}4\,\text{mA}$; $I_L=\dfrac{5{,}1}{470}=10{,}9\,\text{mA}$; $I_Z=31{,}4-10{,}9=20{,}5\,\text{mA}$.</li>
<li>$P_Z=5{,}1\cdot0{,}0205=105\,\text{mW}$ (de 500 mW ✓). Sin carga: $P_Z=5{,}1\cdot0{,}0314=160\,\text{mW}$ ✓.</li>
<li>$P_{R_s}=\dfrac{6{,}9^2}{220}=0{,}216\,\text{W}$ → resistencia de 0,5 W.</li>
<li>Si conectamos $R_L=100\,\Omega$: $V_{th}=12\cdot\frac{100}{320}=3{,}75\,\text{V}<5{,}1$ → el zener <b>no conduce</b> y $V_{out}=3{,}75\,\text{V}$. La carga pide más de lo que $R_s$ deja pasar.</li>
</ol>
</div>

<h2>5. Diseño paso a paso</h2>
<p>Al diseñar hay que pensar en los <b>dos peores casos</b>, que tiran para lados opuestos:</p>
<div class="dos-col">
<div class="caja formula"><span class="caja-titulo">① Que regule siempre → Rs máxima</span>
<p>Peor caso: <b>$V_{in}$ mínima</b> (valle del rizado, red baja) y <b>carga máxima</b> ($I_{L\max}$). Aun así debe quedar $I_{Z\min}$ para el zener:</p>
$$R_{s\max}=\frac{V_{in\,\min}-V_Z}{I_{L\max}+I_{Z\min}}$$
<p>Se elige el valor comercial <b>inmediato inferior</b>.</p>
</div>
<div class="caja formula"><span class="caja-titulo">② Que no se queme → verificar Pz</span>
<p>Peor caso: <b>$V_{in}$ máxima</b> y <b>sin carga</b> (toda la corriente por el zener):</p>
$$I_{Z}=\frac{V_{in\,\max}-V_Z}{R_s}\qquad P_Z=V_Z\,I_Z \lt P_{Z\max}$$
<p>Conviene no pasar del 70–80 % de $P_Z$. Si no alcanza: zener de más watts.</p>
</div>
</div>
<p>Y además: ③ <b>potencia en $R_s$</b> en el peor caso, $P_{R_s}=(V_{in\max}-V_Z)^2/R_s$, y se elige una resistencia de al menos el doble de esa potencia.</p>
<div class="caja ejemplo"><span class="caja-titulo">Diseño completo: 5,1 V para un circuito de hasta 20 mA</span>
Datos: la salida del filtro varía entre $9\,\text{V}$ (valle) y $12\,\text{V}$ (sin carga, red alta). La carga consume de 0 a 20 mA. Probamos con un zener de <b>5,1 V – 0,5 W</b> (1N5231B).
<ol>
<li>Límites del zener: $I_{Z\max}=\dfrac{0{,}5}{5{,}1}=98\,\text{mA}$; $I_{Z\min}\approx9{,}8\,\text{mA}$.</li>
<li>$R_{s\max}=\dfrac{9-5{,}1}{0{,}020+0{,}0098}=\dfrac{3{,}9}{0{,}0298}=131\,\Omega$ → comercial inferior: <b>120 Ω</b>.</li>
<li>Verificación en el peor caso ② ($V_{in}=12\,\text{V}$, sin carga): $I_Z=\dfrac{12-5{,}1}{120}=57{,}5\,\text{mA}$ → $P_Z=5{,}1\cdot0{,}0575=0{,}293\,\text{W}$: el 59 % de 0,5 W ✓.</li>
<li>Comprobación del caso ①: con 9 V, $I_s=\dfrac{3{,}9}{120}=32{,}5\,\text{mA}$, $I_Z=32{,}5-20=12{,}5\,\text{mA}>9{,}8\,\text{mA}$ ✓.</li>
<li>Potencia en $R_s$: $\dfrac{6{,}9^2}{120}=0{,}40\,\text{W}$ → resistencia de <b>1 W</b>.</li>
</ol>
Resultado: <b>Rs = 120 Ω – 1 W, zener 5,1 V – 0,5 W</b>. Probá exactamente estos valores en la simulación 1 (RL = 255 Ω equivale a 20 mA).
</div>
<div class="caja ojo"><span class="caja-titulo">Fijate el rendimiento</span>
En ese diseño, con 12 V la fuente entrega $12\cdot57{,}5\,\text{mA}=0{,}69\,\text{W}$ y la carga usa como mucho $5{,}1\cdot0{,}02=0{,}10\,\text{W}$: <b>rendimiento ≈ 15 %</b>. El resto se calienta en $R_s$ y en el zener, <b>consuma o no la carga</b>. Por eso el zener solo se usa para cargas chicas.
</div>

<h2>6. ¿Qué tan bien regula? Regulación de línea y de carga</h2>
<p>Con un zener ideal, $V_{out}$ sería exactamente $V_Z$ siempre. El zener real tiene una resistencia dinámica $r_z$: cuando su corriente cambia, su tensión cambia un poco ($\Delta V = r_z\,\Delta I_Z$).</p>
<div class="caja formula"><span class="caja-titulo">Regulación de línea (cambios de Vin) y de carga (cambios de IL)</span>
$$\Delta V_{out}\approx \Delta V_{in}\cdot\frac{r_z}{R_s+r_z}\qquad\qquad \Delta V_{out}\approx -\Delta I_L\cdot(r_z\parallel R_s)$$
$$\text{Reg. de línea}=\frac{\Delta V_{out}}{\Delta V_{in}}\cdot100\,\%\qquad\qquad \text{Reg. de carga}=\frac{V_{sin\,carga}-V_{plena\,carga}}{V_{plena\,carga}}\cdot100\,\%$$
</div>
<div class="caja ejemplo"><span class="caja-titulo">En el diseño anterior</span>
El 1N5231B tiene $r_z=17\,\Omega$. Si $V_{in}$ va de 9 a 12 V: $\Delta V_{out}\approx3\cdot\frac{17}{137}=0{,}37\,\text{V}$ (12 % del cambio de entrada). Si la carga pasa de 0 a 20 mA: $\Delta V_{out}\approx-0{,}02\cdot(17\parallel120)=-0{,}02\cdot14{,}9=-0{,}30\,\text{V}$. O sea, “5,1 V” significa en realidad <b>entre 4,8 y 5,5 V</b>. Activá “zener real (rz)” en la simulación para verlo. Con un 1N4733A (1 W, $r_z=7\,\Omega$) mejora bastante.
</div>
<div class="caja tip"><span class="caja-titulo">Más Rs, mejor regulación de línea… pero</span>
Un $R_s$ grande atenúa más los cambios de $V_{in}$ (divisor $r_z/(R_s+r_z)$), pero deja menos corriente para la carga. Siempre es un compromiso, y por eso se diseña con $R_{s\max}$ ajustado.
</div>

<h2>7. Limitaciones y reguladores “de verdad”</h2>
<ul>
<li><b>Solo para corrientes chicas</b> (decenas de mA): el zener disipa todo lo que la carga no usa.</li>
<li><b>Bajo rendimiento</b> y regulación modesta (decenas a cientos de mV).</li>
<li><b>La tensión de salida es la que viene en el zener</b> (con tolerancia ±5 %) y varía con la temperatura.</li>
</ul>
<p><b>Zener + transistor:</b> si se agrega un transistor como <b>seguidor por emisor</b>, el zener solo tiene que dar la pequeña corriente de base y el transistor entrega la corriente de la carga (multiplicada por β). La salida queda en $V_Z-0{,}7\,\text{V}$. Es el “regulador serie” clásico, y es lo que hay adentro de los integrados.</p>
${Esq.svg(480, 255, zenerTrSVG(), 'Regulador serie con zener y transistor: el zener fija la tensión de base y el transistor entrega la corriente.')}
<p><b>Reguladores integrados:</b> en la práctica, para una fuente de 5 o 12 V se usa un <b>7805 / 7812</b> (serie 78xx, hasta 1 A, tres patas: entrada–masa–salida) o el ajustable <b>LM317</b> ($V_{out}=1{,}25\,\text{V}\cdot(1+R_2/R_1)$). Adentro tienen una referencia tipo zener, un amplificador de error y un transistor de potencia, con protección térmica y contra cortocircuito. Necesitan que la entrada esté unos <b>2–2,5 V por encima</b> de la salida (por eso en el tema 12 pedíamos 14,5 V para un 7812). Los 79xx son la versión para tensiones negativas.</p>
<div class="caja tip"><span class="caja-titulo">¿Entonces el zener ya no se usa?</span>
Se usa muchísimo, pero para otras cosas: <b>referencias de tensión</b> de bajo consumo, polarización, <b>protección contra sobretensión</b> y <b>recortadores</b>, que es lo que vemos ahora.
</div>

<h2>8. Recortadores (limitadores)</h2>
<p>Un <b>recortador</b> deja pasar la señal mientras está dentro de ciertos límites y la “recorta” si se pasa. Se arma con una resistencia en serie y diodos o zeners en paralelo con la salida. Mientras los diodos no conducen, $v_{out}=v_{in}$ (la resistencia no tiene caída porque no circula corriente, sin carga). Cuando un diodo conduce, fija la tensión de salida y la diferencia cae en $R$.</p>
<div class="caja formula"><span class="caja-titulo">Niveles de recorte (modelo diodo = 0,7 V)</span>
<div class="tabla-wrap"><table class="tabla">
<tr><th>Configuración</th><th>Semiciclo +</th><th>Semiciclo −</th></tr>
<tr><td>Diodo común en paralelo (ánodo a la salida)</td><td>recorta en +0,7 V</td><td>pasa entero</td></tr>
<tr><td>Zener simple (cátodo a la salida)</td><td>recorta en $+V_Z$</td><td>recorta en −0,7 V</td></tr>
<tr><td>Dos zener en antiserie</td><td>recorta en $+(V_Z+0{,}7)$</td><td>recorta en $-(V_Z+0{,}7)$</td></tr>
<tr><td>Diodo + batería $V_{ref}$</td><td>recorta en $V_{ref}+0{,}7$</td><td>pasa entero</td></tr>
</table></div>
<p>Dando vuelta los diodos (y la batería) se recorta el otro semiciclo.</p>
</div>
${Esq.svg(690, 205, recSVG('z', false, { vz: '5,1 V', onda: { A: 10, hi: 5.1, lo: -0.7, thi: '+5,1', tlo: '−0,7' } }), 'Recortador con un zener: en el semiciclo positivo el zener entra en ruptura (5,1 V); en el negativo conduce en directa como un diodo común (−0,7 V).')}
<p><b>¿Por qué −0,7 V?</b> En el semiciclo negativo el ánodo del zener (abajo, a masa) queda más positivo que el cátodo: está en <b>directa</b> y se comporta como un diodo común.</p>
${Esq.svg(690, 205, recSVG('zz', false, { vz: '5,1 V', onda: { A: 10, hi: 5.8, lo: -5.8, thi: '+5,8', tlo: '−5,8' } }), 'Dos zener en antiserie (ánodo con ánodo): en cada semiciclo uno está en ruptura y el otro en directa → recorte simétrico en ±(Vz + 0,7).')}
<div class="caja ejemplo"><span class="caja-titulo">Ejemplo: dos zener de 5,1 V en antiserie</span>
En el semiciclo positivo, DZ1 está en ruptura (5,1 V) y DZ2 en directa (0,7 V): $v_{out}=+5{,}8\,\text{V}$. En el negativo se invierten los papeles: $-5{,}8\,\text{V}$. Con una senoidal de 10 V de pico y $R=1\,\text{k}\Omega$, en el pico circulan $\frac{10-5{,}8}{1000}=4{,}2\,\text{mA}$.
</div>
${Esq.svg(690, 205, recSVG('b', false, { vref: '3 V', onda: { A: 10, hi: 3.7, lo: -Infinity, thi: '+3,7' } }), 'Diodo con batería de referencia: el diodo conduce recién cuando vin supera Vref + 0,7 V.')}

<h2>9. Aplicaciones: proteger entradas</h2>
<ul>
<li><b>Entrada de un microcontrolador</b> (Arduino, 0–5 V): una resistencia de 1–10 kΩ en serie y un zener de 4,7 V a masa. Si llega una tensión de 12 V o negativa, la entrada queda entre −0,7 V y 4,7 V.</li>
<li><b>Entrada de un instrumento o de un amplificador:</b> dos diodos 1N4148 en antiparalelo recortan en ±0,7 V (micrófonos, entradas de audio). Con zeners en antiserie, a niveles mayores.</li>
<li><b>Protección contra sobretensión (transitorios):</b> los diodos <b>TVS</b> (por ejemplo, la serie P6KE o SMBJ) son “zeners de potencia” rapidísimos que absorben picos en líneas de datos y de alimentación.</li>
<li><b>Generar una onda casi cuadrada</b> a partir de una senoidal grande: con amplitud mucho mayor que el nivel de recorte, la salida queda trapezoidal.</li>
</ul>
<div class="caja ojo"><span class="caja-titulo">La resistencia en serie no es opcional</span>
Sin $R$, el zener (o el diodo) en ruptura sería un cortocircuito para la fuente: corriente enorme y componente quemado. $R$ limita la corriente: $I_{\max}=\frac{V_{in,pico}-V_{recorte}}{R}$. Y verificá la potencia: $P_Z=V_Z\cdot I$.
</div>
`,

    simulaciones: [
      {
        titulo: 'Estabilizador zener: ¿regula, no alcanza o se quema?',
        descripcion: 'Resolución exacta del circuito Rs + zener + carga. Mové la tensión de entrada y la carga, y mirá cuánta corriente se lleva el zener. Probá los dos peores casos: Vin mínima con carga máxima, y Vin máxima sin carga.',
        montar(cont, H) {
          const { controles, vista } = H.layout(cont);
          const vin = H.slider(controles, { label: 'Vin (entrada)', min: 0, max: 30, step: 0.1, value: 12, unidad: 'V', onInput: upd });
          const rs = H.slider(controles, { label: 'Rs (resistencia serie)', min: 10, max: 10000, log: true, value: 120, unidad: 'Ω', onInput: upd });
          const rl = H.slider(controles, { label: 'RL (carga)', min: 50, max: 10000, log: true, value: 255, unidad: 'Ω', onInput: upd });
          const sc = H.check(controles, { label: 'Sin carga (RL desconectada)', value: false, onChange: upd });
          const vz = H.select(controles, { label: 'Vz del zener', value: '5.1', onChange: upd, opciones: [{ v: '3.3', t: '3,3 V' }, { v: '5.1', t: '5,1 V' }, { v: '6.2', t: '6,2 V' }, { v: '9.1', t: '9,1 V' }, { v: '12', t: '12 V' }] });
          const pz = H.select(controles, { label: 'Potencia del zener', value: '0.5', onChange: upd, opciones: [{ v: '0.5', t: '0,5 W' }, { v: '1', t: '1 W' }] });
          const real = H.check(controles, { label: 'Zener real (incluir rz)', value: false, onChange: upd });
          H.nota(controles, 'Criterio: Izmin = 10 % de Izmax. Los datos de rz e Izt son de hoja de datos.');
          const fig = H.el('div', { style: 'max-width:560px;width:100%;margin:0 auto' }); vista.append(fig);
          const cv1 = H.canvas(vista, { alto: (w) => w < 500 ? 210 : 240, dibujar: dib1 });
          const cv2 = H.canvas(vista, { alto: (w) => w < 500 ? 170 : 190, dibujar: dib2 });
          const lec = H.lecturas(vista);
          const nota = H.nota(vista);

          const par = () => {
            const Vz = parseFloat(vz.value), Pmax = parseFloat(pz.value), d = ZENER[vz.value][Pmax === 1 ? 'w1' : 'w05'];
            const Izmax = Pmax / Vz;
            return { Vz, Pmax, d, Izmax, Izmin: 0.1 * Izmax, rz: real.value ? d.rz : 0, izt: d.izt, RL: sc.value ? Infinity : rl.value, Rs: rs.value };
          };
          const sol = (V, q) => resolverZ({ Vin: V, Rs: q.Rs, RL: q.RL, Vz: q.Vz, rz: q.rz, izt: q.izt });
          const estado = (r, q) => r.Iz <= 1e-9 ? 'off' : r.Pz > q.Pmax ? 'quema' : r.Iz < q.Izmin ? 'bajo' : 'ok';
          const colEst = { off: 'muted', bajo: 'amber', ok: 'green', quema: 'red' };

          function bandas(P, q, ym) {
            P.clip(() => {
              const n = 300; let ini = 0, e0 = estado(sol(0, q), q);
              const ctx = P.ctx;
              const pinta = (a, b, e) => { ctx.globalAlpha = e === 'off' ? 0.06 : 0.13; ctx.fillStyle = H.col(colEst[e]); ctx.fillRect(P.X(a), P.y0, P.X(b) - P.X(a), P.h); };
              for (let i = 1; i <= n; i++) {
                const V = 30 * i / n, e = estado(sol(V, q), q);
                if (e !== e0 || i === n) { pinta(ini, V, e0); ini = V; e0 = e; }
              }
              ctx.globalAlpha = 1;
            });
          }
          function dib1(ctx, w, h) {
            const q = par(), ym = Math.max(6, q.Vz * 1.7);
            const P = H.ejes(ctx, w, h, { xmin: 0, xmax: 30, ymin: 0, ymax: ym, xlabel: 'Vin (V)', ylabel: 'Vout (V)', mt: 22 });
            bandas(P, q, ym);
            const k = Number.isFinite(q.RL) ? q.RL / (q.Rs + q.RL) : 1;
            P.fn(V => V * k, { color: H.col('muted'), ancho: 1.4, guiones: [6, 4] });
            P.hline(q.Vz, { color: H.col('c3'), guiones: [3, 3], ancho: 1, label: 'Vz nominal', labelX: 29.5 });
            P.fn(V => sol(V, q).Vout, { color: H.col('c1'), ancho: 3 });
            const r = sol(vin.value, q);
            P.vline(vin.value, { color: H.col('accent'), guiones: [2, 3], ancho: 1 });
            P.punto(vin.value, r.Vout, { color: H.col('accent'), r: 6 });
            ctx.save(); ctx.font = '11px sans-serif'; ctx.textBaseline = 'middle';
            let x = P.x0;
            for (const [c, t, d] of [[H.col('c1'), 'Vout con zener', false], [H.col('muted'), 'sin zener (divisor Rs–RL)', true]]) {
              ctx.strokeStyle = c; ctx.lineWidth = d ? 1.5 : 3; ctx.setLineDash(d ? [6, 4] : []);
              ctx.beginPath(); ctx.moveTo(x, 10); ctx.lineTo(x + 18, 10); ctx.stroke();
              ctx.fillStyle = H.col('ink'); ctx.fillText(t, x + 22, 10); x += 34 + ctx.measureText(t).width;
            }
            ctx.restore();
          }
          function dib2(ctx, w, h) {
            const q = par(), Iz30 = sol(30, q).Iz;
            const ym = Math.min(q.Izmax * 1.6, Math.max(q.Izmax * 0.4, Iz30 * 1.1)) * 1000;
            const P = H.ejes(ctx, w, h, { xmin: 0, xmax: 30, ymin: 0, ymax: ym, xlabel: 'Vin (V)', ylabel: 'Iz (mA)', ny: 4 });
            bandas(P, q, ym);
            P.hline(q.Izmax * 1000, { color: H.col('red'), label: 'Izmax = Pz/Vz', labelX: 29.5 });
            P.hline(q.Izmin * 1000, { color: H.col('amber'), label: 'Izmin', labelX: 3 });
            P.fn(V => sol(V, q).Iz * 1000, { color: H.col('c3'), ancho: 3 });
            const r = sol(vin.value, q);
            P.vline(vin.value, { color: H.col('accent'), guiones: [2, 3], ancho: 1 });
            P.punto(vin.value, Math.min(r.Iz * 1000, ym), { color: H.col('accent'), r: 6 });
          }

          function upd() {
            const q = par(), r = sol(vin.value, q), e = estado(r, q);
            const etq = { off: 'NO REGULA', bajo: 'Iz < Izmin', ok: 'OK', quema: '¡SE QUEMA!' }[e];
            const est = { off: 'mal', bajo: 'alerta', ok: 'ok', quema: 'mal' }[e];
            fig.innerHTML = Esq.svg(550, 200, estabSVG({
              vin: H.fmt(vin.value, 'V'), rs: H.fmt(q.Rs, 'Ω'), vz: H.num(q.Vz, 1) + ' V', rl: H.fmt(rl.value, 'Ω'), sinCarga: sc.value,
              vout: H.fmt(r.Vout, 'V'), is: H.fmt(r.Is, 'A'), iz: H.fmt(r.Iz, 'A'), il: H.fmt(r.IL, 'A'),
            }));
            lec.set([
              { k: { off: 'Estado: zener apagado', bajo: 'Estado: fuera de regulación', ok: 'Estado: regulando', quema: 'Estado: Pz > Pz máx' }[e], v: etq, estado: est },
              { k: 'Vout', v: H.fmt(r.Vout, 'V'), estado: e === 'off' ? 'mal' : '' },
              { k: 'Is (por Rs)', v: H.fmt(r.Is, 'A') },
              { k: 'IL (carga)', v: H.fmt(r.IL, 'A') },
              { k: 'Iz (zener)', v: H.fmt(r.Iz, 'A'), estado: e === 'bajo' || e === 'off' ? 'alerta' : '' },
              { k: 'Pz (' + H.num(r.Pz / q.Pmax * 100, 0) + ' % del máx.)', v: H.fmt(r.Pz, 'W'), estado: e === 'quema' ? 'mal' : r.Pz > 0.8 * q.Pmax ? 'alerta' : '' },
              { k: 'P en Rs', v: H.fmt(r.PRs, 'W') },
              { k: 'Izmin (10 %)', v: H.fmt(q.Izmin, 'A') },
              { k: 'Izmax = Pz/Vz', v: H.fmt(q.Izmax, 'A') },
              { k: 'Rendimiento', v: r.Pin > 0 ? H.num(r.PL / r.Pin * 100, 0) + ' %' : '—' },
              { k: real.value ? 'Modelo (rz = ' + q.rz + ' Ω)' : 'Modelo (ideal)', v: q.d.nombre },
            ]);
            let t = '';
            const Vth = r.Vth;
            if (e === 'off') t = `<b>El zener no conduce:</b> sin él, el divisor Rs–RL daría ${H.fmt(Vth, 'V')}, menos que Vz = ${H.num(q.Vz, 1)} V. La carga pide más corriente de la que Rs deja pasar (o Vin es muy baja). Subí Vin, bajá Rs o aumentá RL.`;
            else if (e === 'bajo') t = `<b>Al límite:</b> el zener conduce solo ${H.fmt(r.Iz, 'A')}, menos que Izmin = ${H.fmt(q.Izmin, 'A')}. Está cerca del codo: la tensión todavía es parecida a Vz, pero ante un poco más de carga o un valle del rizado deja de regular. Es el peor caso ① del diseño: Rs es demasiado grande para esta carga.`;
            else if (e === 'quema') t = `<b>¡Se quema!</b> Por el zener pasan ${H.fmt(r.Iz, 'A')} y disipa ${H.fmt(r.Pz, 'W')}, más que sus ${pz.value.replace('.', ',')} W (Izmax = ${H.fmt(q.Izmax, 'A')}). Es el peor caso ② (Vin alta y poca carga). Aumentá Rs o usá un zener de más potencia.`;
            else t = `<b>Regulando:</b> Rs deja pasar ${H.fmt(r.Is, 'A')}; la carga usa ${H.fmt(r.IL, 'A')} y el zener absorbe el resto (${H.fmt(r.Iz, 'A')}). Mové Vin: Vout casi no cambia, lo que cambia es Iz.`;
            if (real.value && e !== 'off') t += ` Con rz = ${q.rz} Ω, Vout se aparta un poco de ${H.num(q.Vz, 1)} V (Vz nominal a Izt = ${H.fmt(q.izt, 'A')}): mirá la leve pendiente de la curva azul.`;
            if (sc.value && e !== 'off') t += ' Sin carga, <b>toda</b> la corriente pasa por el zener: es el caso de máxima potencia.';
            nota.innerHTML = t;
            cv1.redibujar(); cv2.redibujar();
          }
          upd();
        },
      },
      {
        titulo: 'Recortadores con diodos y zeners',
        descripcion: 'Una senoidal de 50 Hz entra por una resistencia de 1 kΩ y la salida se toma sobre los diodos. Elegí la configuración y mirá la forma de onda de salida y la característica de transferencia vout–vin. El punto de color recorre las dos gráficas a la vez.',
        montar(cont, H) {
          const { controles, vista } = H.layout(cont);
          const cfg = H.select(controles, { label: 'Configuración', value: 'z', onChange: upd, opciones: [{ v: 'd', t: 'Diodo común en paralelo' }, { v: 'z', t: 'Zener simple' }, { v: 'zz', t: 'Dos zener en antiserie' }, { v: 'b', t: 'Diodo + batería de referencia' }] });
          const amp = H.slider(controles, { label: 'Amplitud de la entrada (pico)', min: 0, max: 20, step: 0.5, value: 10, unidad: 'V', onInput: upd });
          const vz = H.select(controles, { label: 'Vz', value: '5.1', onChange: upd, opciones: [{ v: '3.3', t: '3,3 V' }, { v: '4.7', t: '4,7 V' }, { v: '5.1', t: '5,1 V' }, { v: '6.2', t: '6,2 V' }, { v: '9.1', t: '9,1 V' }, { v: '12', t: '12 V' }] });
          const vref = H.slider(controles, { label: 'Vref (batería)', min: 0, max: 12, step: 0.5, value: 3, unidad: 'V', onInput: upd });
          const inv = H.check(controles, { label: 'Invertir los diodos (recorta el otro semiciclo)', value: false, onChange: upd });
          const fig = H.el('div', { style: 'max-width:470px;width:100%;margin:0 auto' }); vista.append(fig);
          const cv1 = H.canvas(vista, { alto: (w) => w < 500 ? 210 : 240, fondo: 'scope-bg', dibujar: dib1 });
          const cv2 = H.canvas(vista, { alto: (w) => w < 500 ? 240 : 260, dibujar: dib2 });
          const lec = H.lecturas(vista);
          const nota = H.nota(vista);
          const R = 1000, f = 50, Tms = 1000 / f;
          let fase = 0;

          function lims() {
            const Vz = parseFloat(vz.value), Vr = vref.value;
            let hi, lo;
            if (cfg.value === 'd') { hi = 0.7; lo = -Infinity; }
            else if (cfg.value === 'z') { hi = Vz; lo = -0.7; }
            else if (cfg.value === 'zz') { hi = Vz + 0.7; lo = -(Vz + 0.7); }
            else { hi = Vr + 0.7; lo = -Infinity; }
            if (inv.value && cfg.value !== 'zz') [hi, lo] = [-lo, -hi];
            return { hi, lo };
          }
          const vout = (v, L) => Math.min(L.hi, Math.max(L.lo, v));
          const ymax = () => Math.max(2, amp.value * 1.15, 1);

          function dib1(ctx, w, h) {
            const L = lims(), A = amp.value, ym = ymax();
            const P = H.ejes(ctx, w, h, { xmin: 0, xmax: 2 * Tms, ymin: -ym, ymax: ym, xlabel: 't (ms)', ylabel: 'V', oscuro: true, mt: 22 });
            const vi = (t) => A * Math.sin(2 * Math.PI * t / Tms);
            for (const [v, t] of [[L.hi, 'recorte'], [L.lo, 'recorte']]) if (Number.isFinite(v) && Math.abs(v) < ym) P.hline(v, { color: H.col('amber'), guiones: [3, 4], ancho: 1 });
            P.fn(vi, { color: H.col('scope-c1'), ancho: 1.6, guiones: [6, 4] });
            P.fn(t => vout(vi(t), L), { color: H.col('scope-c2'), ancho: 3 });
            const tc = fase * 2 * Tms;
            P.punto(tc, vi(tc), { color: H.col('scope-c1'), r: 4 });
            P.punto(tc, vout(vi(tc), L), { color: H.col('accent'), r: 6 });
            ctx.save(); ctx.font = '11px sans-serif'; ctx.textBaseline = 'middle';
            let x = P.x0;
            for (const [c, t, d] of [[H.col('scope-c1'), 'vin (entrada)', true], [H.col('scope-c2'), 'vout (salida)', false]]) {
              ctx.strokeStyle = c; ctx.lineWidth = d ? 1.6 : 3; ctx.setLineDash(d ? [6, 4] : []);
              ctx.beginPath(); ctx.moveTo(x, 10); ctx.lineTo(x + 18, 10); ctx.stroke();
              ctx.fillStyle = '#cfe8dc'; ctx.fillText(t, x + 22, 10); x += 34 + ctx.measureText(t).width;
            }
            ctx.restore();
          }
          function dib2(ctx, w, h) {
            const L = lims(), A = amp.value, ym = Math.max(ymax(), 3);
            const lado = Math.min(w - 70, h - 50);
            const x0 = Math.max(52, (w - lado) / 2);
            const P = H.ejes(ctx, w, h, { x0, y0: 14, w: lado, h: lado, xmin: -ym, xmax: ym, ymin: -ym, ymax: ym, xlabel: 'vin', ylabel: 'vout' });
            P.fn(v => v, { color: H.col('muted'), ancho: 1, guiones: [4, 4] });
            P.fn(v => vout(v, L), { color: H.col('c1'), ancho: 2, guiones: [2, 3] });
            P.fn(v => vout(v, L), { color: H.col('c1'), ancho: 3.5, desde: -A, hasta: A });
            if (Number.isFinite(L.hi) && Math.abs(L.hi) < ym) P.texto(-ym, L.hi, ' ' + H.num(L.hi, 2) + ' V', { color: H.col('amber'), base: 'bottom', dy: -2 });
            if (Number.isFinite(L.lo) && Math.abs(L.lo) < ym) P.texto(ym, L.lo, H.num(L.lo, 2) + ' V ', { color: H.col('amber'), align: 'right', base: 'top', dy: 3 });
            const vi = A * Math.sin(2 * Math.PI * fase * 2);
            P.punto(vi, vout(vi, L), { color: H.col('accent'), r: 6 });
          }

          function upd() {
            const L = lims(), A = amp.value, Vz = parseFloat(vz.value);
            const tz = H.num(Vz, 1) + ' V';
            fig.innerHTML = Esq.svg(460, 200, recSVG(cfg.value, inv.value, { vin: H.num(A, 1) + ' V pico', vz: tz, vref: H.num(vref.value, 1) + ' V' }));
            const vmax = vout(A, L), vmin = vout(-A, L);
            const ipos = (A - vmax) / R, ineg = (-A - vmin) / R, Ipk = Math.max(ipos, -ineg);
            // potencia pico en el elemento que recorta (tensión en él × corriente)
            const Ppk = Math.max(Math.abs(vmax * ipos), Math.abs(vmin * ineg));
            const frac = (lim) => (!Number.isFinite(lim) || A <= Math.abs(lim)) ? 0 : (Math.PI - 2 * Math.asin(Math.abs(lim) / A)) / (2 * Math.PI);
            const recortado = (frac(L.hi > 0 ? L.hi : NaN) + frac(L.lo < 0 ? L.lo : NaN)) * 100;
            lec.set([
              { k: 'Nivel de recorte +', v: Number.isFinite(L.hi) ? H.fmt(L.hi, 'V') : 'no recorta' },
              { k: 'Nivel de recorte −', v: Number.isFinite(L.lo) ? H.fmt(L.lo, 'V') : 'no recorta' },
              { k: 'vout máxima', v: H.fmt(vmax, 'V') },
              { k: 'vout mínima', v: H.fmt(vmin, 'V') },
              { k: 'I pico por R', v: H.fmt(Ipk, 'A') },
              { k: 'P pico en diodo/zener', v: H.fmt(Ppk, 'W') },
              { k: '% del ciclo recortado', v: H.num(recortado, 0) + ' %' },
            ]);
            let t;
            if (cfg.value === 'd') t = `Diodo común: conduce en directa cuando su ánodo supera al cátodo en 0,7 V. ${inv.value ? 'Invertido, recorta el semiciclo negativo en −0,7 V.' : 'Recorta el semiciclo positivo en +0,7 V; el negativo pasa entero.'} Así protegen las entradas de audio dos 1N4148 en antiparalelo.`;
            else if (cfg.value === 'z') t = `Zener simple: en un semiciclo está en <b>ruptura</b> (${tz}) y en el otro en <b>directa</b> (0,7 V), como un diodo común. ${inv.value ? 'Invertido: recorta en +0,7 V y en −' + tz + '.' : ''}`;
            else if (cfg.value === 'zz') t = `Dos zener en antiserie: en cada semiciclo uno está en ruptura y el otro en directa, así que recortan simétrico en ±(Vz + 0,7) = ±${H.num(Vz + 0.7, 1)} V. (Invertir no cambia nada: es simétrico.)`;
            else t = `Diodo + batería: el diodo solo conduce cuando vin supera Vref + 0,7 = ${H.num(vref.value + 0.7, 1)} V. Cambiando Vref elegís el nivel de recorte (con un potenciómetro se puede hacer ajustable).`;
            if (A <= Math.min(Math.abs(L.hi), Math.abs(L.lo))) t += ' <b>Con esta amplitud no recorta nada:</b> la señal nunca llega al nivel de conducción y la salida es igual a la entrada.';
            else if (A > 3 * Math.max(Number.isFinite(L.hi) ? Math.abs(L.hi) : 0, Number.isFinite(L.lo) ? Math.abs(L.lo) : 0)) t += ' Con amplitud mucho mayor que los niveles de recorte, la salida se parece a una onda cuadrada.';
            nota.innerHTML = t;
            cv1.redibujar(); cv2.redibujar();
          }
          upd();
          H.loop((t) => { fase = (t / 4) % 1; cv1.redibujar(); cv2.redibujar(); });
        },
      },
    ],

    ejercicios: [
      {
        nivel: 'Básico',
        enunciado: String.raw`Un zener de 9,1 V – 1 W (1N4739A). Calculá la corriente máxima que soporta y la corriente mínima con la que conviene diseñar (criterio del 10 %).`,
        pista: String.raw`$I_{Z\max}=P_Z/V_Z$.`,
        solucion: String.raw`$I_{Z\max}=\dfrac{1}{9{,}1}=0{,}110\,\text{A}=110\,\text{mA}$. $I_{Z\min}\approx0{,}1\cdot110=11\,\text{mA}$. El zener trabaja bien con corrientes entre unos 11 mA y 110 mA.`,
      },
      {
        nivel: 'Básico',
        enunciado: String.raw`Un estabilizador tiene $V_{in}=15\,\text{V}$, $R_s=470\,\Omega$, zener de 6,2 V – 0,5 W y una carga de $1\,\text{k}\Omega$. Verificá que el zener está en ruptura y calculá $I_s$, $I_L$, $I_Z$, $P_Z$ y la potencia en $R_s$.`,
        pista: String.raw`Primero $V_{th}=V_{in}R_L/(R_s+R_L)$. Si supera $V_Z$: $V_{out}=V_Z$ y aplicás las tres corrientes.`,
        solucion: String.raw`$V_{th}=15\cdot\frac{1000}{1470}=10{,}2\,\text{V}>6{,}2\,\text{V}$ ✓. $I_s=\frac{15-6{,}2}{470}=18{,}7\,\text{mA}$; $I_L=\frac{6{,}2}{1000}=6{,}2\,\text{mA}$; $I_Z=18{,}7-6{,}2=12{,}5\,\text{mA}$. $P_Z=6{,}2\cdot0{,}0125=78\,\text{mW}$ (muy por debajo de 0,5 W). $P_{R_s}=\frac{8{,}8^2}{470}=0{,}165\,\text{W}$ → resistencia de 0,5 W.`,
      },
      {
        nivel: 'Intermedio',
        enunciado: String.raw`En el circuito del ejercicio anterior, ¿cuál es la carga más chica (menor $R_L$) con la que el zener todavía conduce? ¿Qué tensión de salida hay si se conecta una carga de $220\,\Omega$?`,
        pista: String.raw`El límite es cuando el divisor da justo $V_Z$: $V_{in}\frac{R_L}{R_s+R_L}=V_Z$. Por debajo, el zener está apagado y queda un simple divisor.`,
        solucion: String.raw`$R_{L\min}=\dfrac{V_Z\,R_s}{V_{in}-V_Z}=\dfrac{6{,}2\cdot470}{8{,}8}=331\,\Omega$ (equivale a $I_L=18{,}7\,\text{mA}$: toda la $I_s$). Para regular de verdad (con $I_Z\ge I_{Z\min}$) hace falta algo más. Con $220\,\Omega$: el zener no conduce y $V_{out}=15\cdot\frac{220}{690}=4{,}78\,\text{V}$: <b>se perdió la regulación</b>.`,
      },
      {
        nivel: 'Intermedio',
        enunciado: String.raw`Diseñá un estabilizador de 5,1 V para un módulo con sensor que consume entre 5 y 25 mA. La salida del filtro varía entre 10 V (valle) y 14 V (red alta). Usá un zener de 5,1 V – 1 W. Calculá $R_s$ (valor comercial), verificá el zener en el peor caso (contemplá que el módulo se pueda desconectar) y elegí la potencia de $R_s$.`,
        pista: String.raw`$R_{s\max}=(V_{in\min}-V_Z)/(I_{L\max}+I_{Z\min})$; peor caso de potencia: $V_{in\max}$ y sin carga.`,
        solucion: String.raw`$I_{Z\max}=\frac{1}{5{,}1}=196\,\text{mA}$; $I_{Z\min}\approx19{,}6\,\text{mA}$. $R_{s\max}=\dfrac{10-5{,}1}{0{,}025+0{,}0196}=\dfrac{4{,}9}{0{,}0446}=110\,\Omega$ → <b>100 Ω</b>. Peor caso (14 V, sin carga): $I_Z=\frac{14-5{,}1}{100}=89\,\text{mA}$, $P_Z=5{,}1\cdot0{,}089=0{,}454\,\text{W}$ (45 % de 1 W ✓). Comprobación con 10 V y 25 mA: $I_s=49\,\text{mA}$, $I_Z=24\,\text{mA}>19{,}6$ ✓. $P_{R_s}=\frac{8{,}9^2}{100}=0{,}79\,\text{W}$ → resistencia de <b>2 W</b>.`,
      },
      {
        nivel: 'Avanzado',
        enunciado: String.raw`En el diseño del ejercicio 4, el 1N4733A tiene $r_z=7\,\Omega$. Estimá cuánto cambia $V_{out}$ cuando la entrada va de 10 a 14 V (regulación de línea) y cuando la carga pasa de 5 a 25 mA (regulación de carga).`,
        pista: String.raw`$\Delta V_{out}\approx\Delta V_{in}\,\frac{r_z}{R_s+r_z}$ y $\Delta V_{out}\approx-\Delta I_L\,(r_z\parallel R_s)$.`,
        solucion: String.raw`Línea: $\Delta V_{out}\approx4\cdot\frac{7}{107}=0{,}26\,\text{V}$ (≈ 5 % de 5,1 V; la entrada cambió un 40 %). Carga: $r_z\parallel R_s=\frac{7\cdot100}{107}=6{,}5\,\Omega$; $\Delta V_{out}\approx-0{,}020\cdot6{,}5=-0{,}13\,\text{V}$. Regula, pero no es perfecto: por eso para algo preciso se usa un 7805 o un LM317.`,
      },
      {
        nivel: 'Avanzado',
        enunciado: String.raw`Querés proteger una entrada analógica de Arduino (admite 0 a 5 V) de una señal que puede llegar a ±12 V. Proponés una resistencia de $1\,\text{k}\Omega$ en serie y un zener de 4,7 V a masa (cátodo a la entrada). ¿Entre qué valores queda la tensión en el pin? ¿Qué corriente y potencia maneja el zener en el peor caso?`,
        pista: String.raw`Es un recortador con zener simple: $+V_Z$ en un semiciclo y $-0{,}7\,\text{V}$ en el otro.`,
        solucion: String.raw`El pin queda entre <b>−0,7 V y +4,7 V</b>. Con +12 V: $I=\frac{12-4{,}7}{1000}=7{,}3\,\text{mA}$, $P_Z=4{,}7\cdot0{,}0073=34\,\text{mW}$. Con −12 V (zener en directa): $I=\frac{12-0{,}7}{1000}=11{,}3\,\text{mA}$, $P=0{,}7\cdot0{,}0113=8\,\text{mW}$. Un zener de 0,5 W sobra. Se elige 4,7 V y no 5,1 V porque con la tolerancia (±5 %) un 5,1 V puede dar 5,36 V, por encima de los 5 V del pin.`,
      },
      {
        nivel: 'Avanzado',
        enunciado: String.raw`Dos zener de 6,2 V en antiserie recortan una senoidal de 10 V de pico (con $R=1\,\text{k}\Omega$). ¿A qué niveles recorta? ¿Qué porcentaje del tiempo está recortando la salida? ¿Cuál es la corriente pico?`,
        pista: String.raw`Nivel: $\pm(V_Z+0{,}7)$. Recorta cuando $10\sin\theta>6{,}9$: buscá ese ángulo con arcoseno.`,
        solucion: String.raw`Recorta en $\pm6{,}9\,\text{V}$. $\theta=\arcsin\frac{6{,}9}{10}=43{,}6^\circ$: en cada semiciclo recorta desde 43,6° hasta 136,4°, o sea $92{,}7^\circ$ de 180°: <b>51,5 % del tiempo</b>. $I_{pico}=\frac{10-6{,}9}{1000}=3{,}1\,\text{mA}$. Comprobalo en la simulación 2 (Vz = 6,2 V, 10 V de pico).`,
      },
    ],

    quiz: [
      { pregunta: '¿En qué zona de su curva trabaja un zener cuando estabiliza?', opciones: ['En directa, a 0,7 V', 'En inversa, antes de la ruptura', 'En ruptura inversa', 'En cualquier zona'], correcta: 2, explicacion: 'El zener está diseñado para trabajar en ruptura inversa, donde la tensión queda casi fija en Vz aunque la corriente cambie.' },
      { pregunta: 'Un zener de 12 V y 0,5 W soporta como máximo…', opciones: ['6 mA', '42 mA', '240 mA', '0,5 A'], correcta: 1, explicacion: 'Izmax = Pz/Vz = 0,5/12 ≈ 0,042 A = 42 mA.' },
      { pregunta: 'En un estabilizador zener funcionando, si la carga consume más corriente…', opciones: ['Aumenta la corriente por Rs', 'Disminuye la corriente por el zener', 'Aumenta la tensión de salida', 'Aumenta la corriente por el zener'], correcta: 1, explicacion: 'Is = (Vin − Vz)/Rs no cambia; la corriente extra de la carga se la saca al zener (Iz = Is − IL).' },
      { pregunta: '¿En qué condición el zener disipa la máxima potencia?', opciones: ['Vin mínima y carga máxima', 'Vin máxima y sin carga', 'Vin mínima y sin carga', 'Vin máxima y carga máxima'], correcta: 1, explicacion: 'Con Vin máxima, Is es máxima; sin carga, toda Is pasa por el zener. Es el peor caso para verificar Pz.' },
      { pregunta: 'Una senoidal de 10 V de pico pasa por un recortador con R y un zener de 5,1 V (cátodo a la salida). La salida queda entre…', opciones: ['−5,1 V y +5,1 V', '−0,7 V y +5,1 V', '0 V y +5,1 V', '−5,8 V y +5,8 V'], correcta: 1, explicacion: 'En el semiciclo positivo el zener está en ruptura (5,1 V); en el negativo conduce en directa (−0,7 V).' },
      { pregunta: 'Para alimentar un circuito de 12 V que consume 800 mA, lo más adecuado es…', opciones: ['Un zener de 12 V de 0,5 W', 'Un zener de 12 V de 1 W', 'Un regulador integrado 7812 (o zener + transistor)', 'Una resistencia en serie'], correcta: 2, explicacion: 'Con un zener solo, el zener debería poder absorber toda esa corriente (≈ 10 W): inviable. Un 7812 entrega hasta 1 A con buena regulación.' },
    ],

    docente: String.raw`
<h3>Objetivo de la clase</h3>
<p>Que el alumno entienda que el zener trabaja en <b>ruptura inversa</b> manteniendo una tensión casi fija, que sepa <b>analizar y diseñar</b> un estabilizador (verificar ruptura, Rs máxima, potencia en el peor caso) y que reconozca los <b>recortadores</b> y su uso como protección. Cierra la secuencia de la fuente lineal (temas 11–12–13). <b>Duración sugerida:</b> 2 clases de 60–80 min (la primera: curva + estabilizador + análisis; la segunda: diseño, limitaciones y recortadores).</p>

<h3>Secuencia sugerida</h3>
<ol>
<li><b>Disparador (5 min):</b> “La fuente del tema 12 da entre 14 y 19 V según la carga y la red. ¿Cómo hacemos para que un Arduino reciba 5 V fijos?”. Recordá la ruptura del tema de diodos: “¿y si hubiera un diodo que se rompe a 5 V sin quemarse?”.</li>
<li><b>Curva y símbolo (10 min):</b> la figura de la sección 2. Insistí en que se conecta <b>al revés</b> (cátodo al +) y en los tres límites: Izmin, Izt, Izmax. Calculen juntos Izmax de un par de zeners de la tabla.</li>
<li><b>Estabilizador con la simulación 1 (20 min):</b> arrancá con los valores por defecto (Vin = 12 V, Rs = 120 Ω, RL = 255 Ω). Antes de mover: “si subo Vin, ¿qué pasa con Vout? ¿y con Iz?”. Mové Vin de 0 a 30 V despacio: hasta ~7 V el zener está apagado (franja gris), después aparece la zona amarilla (Iz < Izmin), la verde (OK) y finalmente la roja (se quema). Después dejá Vin fija y bajá RL: “¿quién le da la corriente extra a la carga?”. Tildá “sin carga” y preguntá por qué sube Pz.</li>
<li><b>Análisis en el pizarrón (15 min):</b> el ejemplo de la sección 4, con el paso de “sacar el zener y ver el divisor”. Después el caso RL = 100 Ω (no conduce). Corroboren con la simulación.</li>
<li><b>Diseño (20 min, 2.ª clase):</b> el ejemplo de la sección 5. Que el alumno identifique solo los dos peores casos. Luego, en la simulación, cargá esos valores y probá: Vin = 9 V con RL = 255 Ω (debe quedar verde, justo) y Vin = 12 V sin carga (Pz ≈ 59 %). Tildá “zener real (rz)” para mostrar la regulación de línea y carga.</li>
<li><b>Limitaciones (10 min):</b> rendimiento ≈ 15 %. Mostrá el esquema zener + transistor y un 7805 real si tenés uno. Contá que el LM317 es ajustable.</li>
<li><b>Recortadores con la simulación 2 (20 min):</b> empezá con “zener simple”, 10 V de pico. Preguntá antes: “¿qué va a pasar en el semiciclo negativo?” (muchos dicen −5,1 V). Pasá por las cuatro configuraciones, usá “invertir” y mirá la característica de transferencia: “la parte con pendiente 1 es donde no conduce nadie”. Bajá la amplitud por debajo del nivel de recorte: deja de recortar. Cerrá con la protección de la entrada del Arduino (ejercicio 6).</li>
</ol>

<h3>Errores frecuentes del alumno</h3>
<ul>
<li>Usar $V_{out}=V_Z$ sin verificar que el zener está en ruptura (si el divisor da menos de Vz, no conduce).</li>
<li>Calcular la potencia del zener con carga y no en el peor caso (sin carga, Vin máxima).</li>
<li>Pensar que si la carga consume más, aumenta la corriente por Rs (no: Is depende solo de Vin y Vz).</li>
<li>Conectar el zener como un diodo común (ánodo al +) y medir 0,7 V.</li>
<li>Olvidar la resistencia en serie en un recortador o un estabilizador.</li>
<li>En el recortador con zener, poner −Vz en el semiciclo negativo (es −0,7 V: ahí está en directa).</li>
<li>Elegir el valor comercial de Rs <b>superior</b> en lugar del inferior (con más Rs, no alcanza la corriente).</li>
</ul>

<h3>Preguntas para hacerle pensar</h3>
<ul>
<li>¿Por qué el zener se calienta más cuando desconectás la carga?</li>
<li>Si un zener de 5,1 V se quema, ¿suele quedar en corto o abierto? (Suele quedar en corto: la salida cae a 0 V y Rs se recalienta.)</li>
<li>¿Por qué no armamos una fuente de 12 V – 2 A con un zener? Calculá la potencia.</li>
<li>¿Qué ventaja tiene que la carga reciba siempre la misma tensión aunque haya rizado en la entrada? (El rizado queda dividido por ≈ Rs/rz.)</li>
<li>¿Cómo harías un recortador que limite una señal entre −3 V y +5 V? (Zener + diodo con batería, o dos ramas diodo + batería.)</li>
</ul>

<h3>Recordatorio rápido para vos</h3>
<ul>
<li>$I_{Z\max}=P_Z/V_Z$; criterio $I_{Z\min}\approx0{,}1\,I_{Z\max}$ (o $I_{ZK}$ de hoja de datos, 0,25–1 mA).</li>
<li>Ruptura si $V_{in}\frac{R_L}{R_s+R_L}>V_Z$. $I_s=(V_{in}-V_Z)/R_s$, $I_Z=I_s-I_L$.</li>
<li>Diseño: $R_{s\max}=(V_{in\min}-V_Z)/(I_{L\max}+I_{Z\min})$ → comercial inferior. Verificar $P_Z$ con $V_{in\max}$ y sin carga. $P_{R_s}=(V_{in\max}-V_Z)^2/R_s$, ×2 de margen.</li>
<li>Regulación: $\Delta V_{out}\approx\Delta V_{in}\,r_z/(R_s+r_z)$; $\Delta V_{out}\approx-\Delta I_L\,(r_z\parallel R_s)$.</li>
<li>Series: 1N4728–1N4764 (1 W), 1N5221–1N5267 (0,5 W, Izt 20 mA), BZX55/BZX79 (0,5 W, “C5V1”), BZX85 (1,3 W). Tolerancia típica ±5 %.</li>
<li>Coef. de temperatura: negativo por debajo de ~5 V (efecto zener), positivo por encima de ~6 V (avalancha); mínimo cerca de 5,6–6,2 V.</li>
<li>78xx: caída mínima ≈ 2 V, 1 A (TO-220), patas E–GND–S; 79xx: E y GND intercambiadas (GND–E–S). LM317: $V_{out}=1{,}25(1+R_2/R_1)$, típico $R_1=240\,\Omega$.</li>
<li>Recortes: diodo común +0,7; zener +Vz / −0,7; antiserie ±(Vz+0,7); diodo + batería Vref+0,7.</li>
</ul>

<h3>Experiencia práctica</h3>
<p><b>Curva casera:</b> fuente variable (o batería de 9 V + potenciómetro), resistencia de 470 Ω, zener de 5,1 V y dos multímetros. Subí la tensión de a 0,5 V y anotá V del zener e I. Graficá: se ve clarito el codo y la zona casi vertical. Repetí con el zener al revés (0,7 V).</p>
<p><b>Estabilizador:</b> batería de 9 V (o la fuente del tema 12), Rs = 220 Ω, zener 5,1 V y como carga un LED con resistencia o un potenciómetro de 1 kΩ en serie con 100 Ω. Medí Vout mientras variás la carga: se mantiene hasta que la carga pide más de lo que Rs deja pasar, y ahí cae de golpe. ¡Ojo con el potenciómetro en cero!</p>
<p><b>En Tinkercad o Falstad:</b> Falstad tiene zener y generador de señales: armá los cuatro recortadores con una senoidal de 10 V y un osciloscopio con dos canales; en modo X‑Y se ve la característica de transferencia, igual que en la simulación 2.</p>
`,
  });
})();
