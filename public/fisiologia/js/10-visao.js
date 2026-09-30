/* 10 · Fisiologia da visão */
(function () {
  const { svg, flow, callout, tag, ion, box } = H;
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const ROD = '#a5e8c6', CONE = '#ff8a1f';

  /* ---------- cena A: camadas da retina ---------- */
  const rodCell = (x, h = 1) => `<g><rect x="${x - 7}" y="520" width="14" height="110" rx="6" fill="${ROD}"/>${Array.from({ length: 9 }, (_, i) => `<line x1="${x - 6}" x2="${x + 6}" y1="${528 + i * 11}" y2="${528 + i * 11}" stroke="#1f7f70" stroke-width="1.5"/>`).join('')}<rect x="${x - 5}" y="440" width="10" height="80" rx="4" fill="${ROD}" opacity=".7"/><circle cx="${x}" cy="430" r="7" fill="${ROD}"/></g>`;
  const coneCell = (x) => `<g><path d="M${x - 11},520 L${x + 11},520 L${x + 3},600 L${x - 3},600Z" fill="${CONE}"/><rect x="${x - 9}" y="450" width="18" height="70" rx="7" fill="${CONE}" opacity=".75"/><circle cx="${x}" cy="436" r="9" fill="${CONE}"/></g>`;
  const retina = svg(`
    <rect x="40" y="40" width="920" height="80" rx="12" fill="#8fd3ff" opacity=".1"/><text x="60" y="88" class="ls">vítreo · a luz chega por AQUI</text>
    <rect x="40" y="640" width="920" height="80" rx="12" fill="#3a2a26"/><text x="60" y="690" class="ls" fill="#ffb3aa">epitélio pigmentar (absorve luz, recicla o retinal)</text>
    ${[110, 250, 390, 530, 670, 810].map(x => `<g><circle cx="${x + 40}" cy="170" r="20" fill="#ffd166"/><path d="M${x + 40},150 C${x + 40},130 ${x + 90},130 ${x + 140},130 L940,130" stroke="#ffd166" stroke-width="3" fill="none" opacity=".7"/></g>`).join('')}
    ${[130, 270, 410, 550, 690, 830].map(x => `<g><ellipse cx="${x + 20}" cy="290" rx="14" ry="22" fill="#c7b1ff"/><path d="M${x + 20},268 L${x + 40},190 M${x + 20},312 L${x + 10},420" stroke="#c7b1ff" stroke-width="3"/></g>`).join('')}
    <path d="M80,360 C300,350 600,370 920,356" stroke="#8fd3ff" stroke-width="4" fill="none" opacity=".7"/>
    <path d="M80,230 C300,240 600,222 920,234" stroke="#ff9ecf" stroke-width="4" fill="none" opacity=".7"/>
    ${[90, 120, 180, 210, 240, 300, 330, 390, 420, 480, 510, 540, 600, 630, 660, 720, 750, 780, 840, 870, 900].map((x, i) => i % 3 === 1 ? coneCell(x) : rodCell(x)).join('')}
    <g data-s="=1">
      <path d="M500,40 L500,600" stroke="#fff6ea" stroke-width="10" marker-end="url(#arr)" opacity=".85"/>
      ${flow({ d: 'M500,40 L500,600', n: 5, dur: 1.8, r: 6, fill: '#fff6ea' })}
      <path d="M960,600 L960,160" stroke="#ff8a1f" stroke-width="6" marker-end="url(#arrO)"/>
      ${tag(860, 400, 'sinal volta ↑', { o: 1, fs: 15 })}
    </g>
    ${callout(150, 170, 150, 26, 'Células ganglionares → nervo óptico', { anchor: 'start', cls: 'lb', dot: '#ffd166' })}
    ${callout(290, 290, 210, 400, 'Bipolares', { anchor: 'end', cls: 'lb', dot: '#c7b1ff' })}
    ${callout(920, 234, 860, 206, 'amácrinas', { anchor: 'end', cls: 'lx', dot: '#ff9ecf' })}
    ${callout(920, 356, 860, 330, 'horizontais', { anchor: 'end', cls: 'lx', dot: '#8fd3ff' })}
    ${callout(120, 580, 150, 470, 'Bastonete', { anchor: 'end', cls: 'lb lm', dot: ROD })}
    ${callout(150, 560, 200, 470, 'Cone', { anchor: 'start', cls: 'lb lo', dot: CONE })}
  `);

  /* ---------- cena B: bastonete x cone ---------- */
  const bigRod = `<g transform="translate(260,90)"><rect x="-40" y="0" width="80" height="300" rx="30" fill="${ROD}"/>${Array.from({ length: 22 }, (_, i) => `<rect x="-34" y="${12 + i * 13}" width="68" height="6" rx="3" fill="#1f7f70" opacity=".7"/>`).join('')}<rect x="-6" y="300" width="12" height="30" fill="#9fc0ae"/><rect x="-34" y="330" width="68" height="160" rx="20" fill="${ROD}" opacity=".6"/><ellipse cx="0" cy="530" rx="30" ry="36" fill="${ROD}" opacity=".85"/><path d="M0,566 L0,620" stroke="${ROD}" stroke-width="8"/><circle cx="0" cy="630" r="14" fill="${ROD}"/></g>`;
  const bigCone = `<g transform="translate(700,90)"><path d="M-54,300 L54,300 L14,80 L-14,80Z" fill="${CONE}"/>${Array.from({ length: 15 }, (_, i) => { const y = 92 + i * 14; const w = 14 + (y - 80) * 0.18; return `<path d="M${-w},${y} L${w},${y}" stroke="#7a3a0c" stroke-width="3"/>`; }).join('')}<rect x="-6" y="300" width="12" height="30" fill="#9fc0ae"/><rect x="-48" y="330" width="96" height="160" rx="30" fill="${CONE}" opacity=".6"/><ellipse cx="0" cy="530" rx="32" ry="36" fill="${CONE}" opacity=".85"/><path d="M0,566 L0,620" stroke="${CONE}" stroke-width="10"/><path d="M-26,630 L26,630 L20,650 L-20,650Z" fill="${CONE}"/></g>`;
  const cells = svg(`
    <text x="260" y="60" text-anchor="middle" class="lt lm">BASTONETE</text>
    <text x="700" y="60" text-anchor="middle" class="lt lo">CONE</text>
    ${bigRod}${bigCone}
    ${callout(260, 200, 400, 180, 'discos soltos · RODOPSINA', { anchor: 'start', cls: 'ls' })}
    ${callout(700, 250, 820, 290, 'dobras da membrana · OPSINAS S, M, L', { anchor: 'middle', cls: 'ls' })}
    ${callout(260, 360, 400, 380, 'segmento interno (mitocôndrias)', { anchor: 'start', cls: 'lx' })}
    ${callout(260, 720, 400, 730, 'terminal sináptico: glutamato', { anchor: 'start', cls: 'lx' })}
  `);

  /* ---------- cena C: densidade ---------- */
  const gx = e => 500 + e * 5.2;               // excentricidade (graus) → x
  const gy = d => 690 - d * 2.1;               // densidade (mil/mm²) → y
  const coneD = e => 6 + 160 * Math.exp(-Math.abs(e) / 1.1) + 14 * Math.exp(-Math.abs(e) / 10);
  const rodD = e => { const a = Math.abs(e); if (a < 1) return 0; return Math.min(160, 160 * (1 - Math.exp(-(a - 0.8) / 4.5)) * Math.exp(-Math.max(0, a - 18) / 55)); };
  const bs = e => e > 13 && e < 19;
  const curve = (f) => { let d = ''; for (let e = -80; e <= 80; e += 0.5) { const v = bs(e) ? 0 : f(e); d += (d ? ' L' : 'M') + gx(e).toFixed(1) + ',' + gy(v).toFixed(1); } return d; };
  const densidade = svg(`
    <!-- olho visto de cima -->
    <g transform="translate(500,160)">
      <circle r="120" fill="#fff6ea" opacity=".12" stroke="#cfe2d7" stroke-width="3"/>
      <path d="M-50,-110 C-20,-128 20,-128 50,-110" stroke="#8fd3ff" stroke-width="6" fill="none"/>
      <path d="M-100,60 C-60,112 60,112 100,60" stroke="#e7a795" stroke-width="10" fill="none" opacity=".8"/>
      <circle cx="0" cy="119" r="8" fill="#ff8a1f"/>
      <rect x="42" y="102" width="30" height="18" rx="6" fill="#07201a" stroke="#fff" stroke-width="2" transform="rotate(-22 57 111)"/>
      <path d="M60,118 C70,138 78,152 86,166" stroke="#ffd166" stroke-width="12" fill="none" stroke-linecap="round"/>
      <line x1="0" y1="-160" x2="0" y2="119" stroke="#fff6ea" stroke-dasharray="6 6" opacity=".6"/>
      <text x="-140" y="10" text-anchor="end" class="ls">temporal</text><text x="140" y="10" class="ls">nasal</text>
    </g>
    <g data-s="3">${callout(500, 279, 330, 300, 'Fóvea (0°)', { anchor: 'end', cls: 'lb lo' })}</g>
    <g data-s="5">${callout(557, 271, 700, 300, 'Disco óptico (≈15° nasal)', { anchor: 'start', cls: 'lb', dot: '#fff' })}</g>
    <!-- gráfico -->
    <line x1="${gx(-80)}" y1="${gy(0)}" x2="${gx(80)}" y2="${gy(0)}" stroke="#5f8a75"/>
    <line x1="${gx(-80)}" y1="${gy(0)}" x2="${gx(-80)}" y2="${gy(170)}" stroke="#5f8a75"/>
    ${[-80, -60, -40, -20, 0, 20, 40, 60, 80].map(e => `<text x="${gx(e)}" y="${gy(0) + 24}" text-anchor="middle" class="lx mono">${e}°</text>`).join('')}
    ${[0, 50, 100, 150].map(d => `<text x="${gx(-80) - 10}" y="${gy(d) + 4}" text-anchor="end" class="lx mono">${d}k</text>`).join('')}
    <text x="${gx(-80) - 10}" y="${gy(170) - 10}" text-anchor="start" class="lx">células/mm²</text>
    <text x="${gx(80)}" y="${gy(0) + 50}" text-anchor="end" class="lx">excentricidade (graus a partir da fóvea)</text>
    <rect x="${gx(13)}" y="${gy(170)}" width="${gx(19) - gx(13)}" height="${gy(0) - gy(170)}" fill="#fff" opacity=".08" data-hl="=5"/>
    <g data-s="=5"><rect x="${gx(13)}" y="${gy(170)}" width="${gx(19) - gx(13)}" height="${gy(0) - gy(170)}" fill="#ff6b5e" opacity=".22" class="pulse"/>${tag(gx(46), gy(150), 'PONTO CEGO: zero receptores', { o: 1, fs: 15 })}</g>
    <path class="draw" data-s="3" d="${curve(rodD)}" stroke="${ROD}" stroke-width="4" fill="none"/>
    <path class="draw" data-s="3" d="${curve(coneD)}" stroke="${CONE}" stroke-width="4" fill="none"/>
    <g data-s="3"><text x="${gx(-52)}" y="${gy(150)}" class="lb lm">bastonetes</text><text x="${gx(-3)}" y="${gy(160)}" text-anchor="end" class="lb lo">cones</text></g>
    <g data-s="=4"><rect x="${gx(-2.5)}" y="${gy(170)}" width="${gx(2.5) - gx(-2.5)}" height="${gy(0) - gy(170)}" fill="#ff8a1f" opacity=".2"/>
      ${tag(gx(-30), gy(95), 'fóvea: SÓ cones, zero bastonetes', { o: 1, fs: 15 })}
      ${tag(gx(-44), gy(60), 'pico de bastonetes ≈ 20° fora', { fs: 15, fill: ROD })}</g>
  `);

  /* ---------- cena D: teste do ponto cego ---------- */
  const demo = `<div class="demo interactive"><div class="row"><span class="cross">✚</span><span class="dot"></span></div>
    <div class="hint">Feche o olho ESQUERDO · encare o ✚ com o direito · aproxime ou afaste o rosto devagar</div></div>`;

  /* ---------- cena E: fototransdução ---------- */
  const disc = (y) => `<rect x="150" y="${y}" width="500" height="34" rx="17" fill="#1a4d3b" stroke="${ROD}" stroke-opacity=".5"/>`;
  const cgmp = (pts, s) => `<g data-s="${s}">${pts.map(([x, y]) => `<g transform="translate(${x},${y})"><rect x="-22" y="-11" width="44" height="22" rx="8" fill="#ffd166"/><text x="0" y="5" text-anchor="middle" class="mono" style="font-size:11px;stroke:none" fill="#07201a">GMPc</text></g>`).join('')}</g>`;
  const foto = svg(`
    <rect x="110" y="40" width="580" height="480" rx="60" fill="#0e3326" stroke="${ROD}" stroke-width="3"/>
    ${[90, 190, 290, 390].map(disc).join('')}
    <text x="400" y="30" text-anchor="middle" class="ls">segmento externo do bastonete</text>
    <!-- rodopsina -->
    <g transform="translate(260,207)"><rect x="-18" y="-20" width="36" height="40" rx="10" fill="#c7b1ff"/><path d="M-8,0 L0,-8 L8,0 L0,8" stroke="#07201a" stroke-width="3" fill="none" data-s="<8"/><path d="M-10,0 L10,0" stroke="#07201a" stroke-width="3" data-s="8-9"/></g>
    <g data-s="8-9"><path d="M170,120 L250,195" stroke="#fff6ea" stroke-width="4" stroke-dasharray="6 5" marker-end="url(#arr)"/><circle cx="170" cy="118" r="10" fill="#fff6ea" filter="url(#glow)"/><text x="186" y="112" class="lx">fóton</text></g>
    <!-- transducina e PDE -->
    <g transform="translate(360,207)" class="td" data-cls="mv:8-9"><circle r="16" fill="#62dcc8"/><text y="5" text-anchor="middle" class="mono" style="font-size:12px;stroke:none" fill="#07201a">Gt</text></g>
    <g transform="translate(470,207)"><rect x="-26" y="-18" width="52" height="36" rx="10" fill="#ff9ecf" data-hl="=8"/><text y="5" text-anchor="middle" class="mono" style="font-size:12px;stroke:none" fill="#07201a">PDE</text></g>
    <style>.fig .td{transition:transform .8s}.fig .td.mv{transform:translate(430px,207px)}</style>
    ${cgmp([[220, 150], [330, 160], [540, 150], [610, 260], [240, 350], [400, 350], [560, 350], [300, 450], [470, 460], [610, 450]], '<8')}
    ${cgmp([[610, 260], [300, 450]], '8-9')}
    <g data-s="8-9"><text x="540" y="160" class="mono lx" fill="#9fc0ae">GMP</text><text x="400" y="350" class="mono lx" fill="#9fc0ae">GMP</text></g>
    <!-- canal CNG -->
    <rect x="684" y="210" width="20" height="120" rx="8" fill="#2d8a61"/><rect x="684" y="210" width="20" height="120" rx="8" fill="#ff6b5e" data-s="8-9"/>
    <rect x="686" y="340" width="16" height="24" rx="4" fill="#07201a"/>
    <text x="720" y="200" class="lb">Canal CNG</text><text x="720" y="222" class="lx">aberto pelo GMPc</text>
    <g data-s="<8">${flow({ d: 'M900,250 L700,265 L560,280', n: 4, dur: 1.8, r: 11, ion: 'na' })}${flow({ d: 'M900,310 L700,300 L600,300', n: 2, dur: 1.8, r: 11, ion: 'ca' })}</g>
    <!-- segmento interno e terminal -->
    <rect x="300" y="540" width="200" height="100" rx="30" fill="#0e3326" stroke="${ROD}" stroke-width="2"/>
    <text x="400" y="596" text-anchor="middle" class="lx">segmento interno</text>
    ${flow({ d: 'M500,600 L620,600', n: 2, dur: 2.4, r: 10, ion: 'k' })}
    <circle cx="400" cy="700" r="36" fill="#0e3326" stroke="${ROD}" stroke-width="2"/>
    <g data-s="<8">${flow({ d: 'M400,720 L400,770', n: 5, dur: .8, r: 5, fill: '#e8f1ff' })}</g>
    <g data-s="8-9">${flow({ d: 'M400,720 L400,770', n: 1, dur: 2.5, r: 5, fill: '#e8f1ff' })}</g>
    <text x="450" y="760" class="lx">glutamato</text>
    <!-- voltímetro -->
    <g transform="translate(730,420)"><rect width="230" height="140" rx="18" fill="#07201a" stroke="rgba(165,232,198,.35)"/><text x="18" y="32" class="ls">potencial do bastonete</text>
      <text x="18" y="96" class="mono" style="font-size:46px" fill="#a5e8c6" data-s="<8">−40 mV</text>
      <text x="18" y="96" class="mono" style="font-size:46px" fill="#c7b1ff" data-s="8-9">−70 mV</text>
      <text x="18" y="126" class="lx" data-s="<8">escuro: despolarizado</text><text x="18" y="126" class="lx" data-s="8-9">luz: HIPERpolarizado</text></g>
    <g data-s="=7">${tag(400, 530, '“corrente de escuro”: Na⁺ entra o tempo todo', { o: 1, fs: 15 })}</g>
    <g data-s="=8">${tag(400, 530, 'rodopsina → transducina → PDE → ↓ GMPc', { o: 1, fs: 15 })}</g>
    <g data-s="=9">${tag(400, 530, '1 rodopsina ativa → ~100.000 GMPc destruídos', { o: 1, fs: 15 })}</g>
  `);

  /* ---------- cena F: estrelas (imagem) ---------- */
  const estrelas = svg(`<image href="img/visao-noturna.jpg" width="2112" height="1152"/>
    <rect x="1440" y="425" width="240" height="50" rx="10" fill="#0b1a2a" opacity=".96"/>
    <text x="1560" y="459" text-anchor="middle" style="font:600 26px var(--f-body);stroke:none" fill="#e9f1ff">olhar desviado ≈ 20°</text>
    <g data-s="=10">
      <rect x="600" y="640" width="370" height="260" rx="14" fill="none" stroke="#ff8a1f" stroke-width="6" stroke-dasharray="16 10"/>
      <rect x="1650" y="640" width="370" height="260" rx="14" fill="none" stroke="#3fc584" stroke-width="6" stroke-dasharray="16 10"/>
      <g transform="translate(785,862)"><rect x="-170" y="-34" width="340" height="60" rx="30" fill="#07201a" stroke="#ff8a1f" stroke-width="3"/><text y="6" text-anchor="middle" style="font:700 28px var(--f-body);stroke:none" fill="#ffb567">cones: poucos fótons</text></g>
      <g transform="translate(1835,862)"><rect x="-190" y="-34" width="380" height="60" rx="30" fill="#07201a" stroke="#3fc584" stroke-width="3"/><text y="6" text-anchor="middle" style="font:700 28px var(--f-body);stroke:none" fill="#a5e8c6">bastonetes somam fótons</text></g>
    </g>`, '0 0 2112 1152');

  /* ---------- cena G: adaptação ao escuro ---------- */
  const ax = t => 140 + t * 22, ay = v => 120 + (6 - v) * 90;
  const adapta = svg(`
    <text x="40" y="60" class="lt">Adaptação ao escuro</text>
    <line x1="${ax(0)}" y1="${ay(0)}" x2="${ax(36)}" y2="${ay(0)}" stroke="#5f8a75"/><line x1="${ax(0)}" y1="${ay(0)}" x2="${ax(0)}" y2="${ay(6.2)}" stroke="#5f8a75"/>
    ${[0, 5, 10, 15, 20, 25, 30, 35].map(t => `<text x="${ax(t)}" y="${ay(0) + 26}" text-anchor="middle" class="lx mono">${t}</text>`).join('')}
    <text x="${ax(36)}" y="${ay(0) + 54}" text-anchor="end" class="lx">minutos no escuro</text>
    <text x="${ax(0) - 16}" y="${ay(6)}" text-anchor="end" class="lx">limiar alto</text><text x="${ax(0) - 16}" y="${ay(0.3)}" text-anchor="end" class="lx">limiar baixo</text>
    <text x="${ax(0) - 16}" y="${ay(0.3) + 18}" text-anchor="end" class="lx lm">(mais sensível)</text>
    <path class="draw" data-s="11" d="M${ax(0)},${ay(5.8)} C${ax(2)},${ay(4.2)} ${ax(4)},${ay(3.7)} ${ax(7)},${ay(3.55)} L${ax(12)},${ay(3.5)}" stroke="${CONE}" stroke-width="5" fill="none"/>
    <path class="draw" data-s="11" d="M${ax(7)},${ay(3.55)} C${ax(10)},${ay(3.2)} ${ax(14)},${ay(1.8)} ${ax(20)},${ay(1.0)} C${ax(25)},${ay(0.55)} ${ax(30)},${ay(0.4)} ${ax(35)},${ay(0.35)}" stroke="${ROD}" stroke-width="5" fill="none"/>
    <circle cx="${ax(7.5)}" cy="${ay(3.5)}" r="9" fill="#fff"/>
    ${callout(ax(7.5), ay(3.5), ax(12), ay(5.2), 'Quebra de Kohlrausch (≈ 7–10 min)', { anchor: 'start', cls: 'lb', sub: 'bastonetes passam os cones' })}
    <text x="${ax(3)}" y="${ay(4.3)}" class="ls lo">cones</text><text x="${ax(22)}" y="${ay(1.3)}" class="ls lm">bastonetes</text>
    ${tag(640, 110, 'rodopsina se regenera devagar (11-cis-retinal · vitamina A)', { o: 1, fs: 15 })}
  `);

  /* ---------- cena H: cor e daltonismo ---------- */
  const sx = nm => 120 + (nm - 400) * 2.6, sy = v => 380 - v * 250;
  const spec = (peak, w, c, lab, dash = '') => { let d = ''; for (let nm = 400; nm <= 700; nm += 3) { const v = Math.exp(-Math.pow((nm - peak) / w, 2)); d += (d ? ' L' : 'M') + sx(nm).toFixed(1) + ',' + sy(v).toFixed(1); } return `<path d="${d}" stroke="${c}" stroke-width="4" fill="none" ${dash}/><text x="${sx(peak)}" y="${sy(1) - 12}" text-anchor="middle" class="ls" fill="${c}">${lab}</text>`; };
  const plate = (cx, cy, deutan) => {
    seed = 23; let s = '';
    const seg = [[[-80, -55], [-15, -55]], [[-15, -55], [-55, 60]], [[30, -55], [5, 22]], [[5, 22], [82, 22]], [[58, -55], [58, 62]]];
    const d2 = (px, py, [a, b]) => { const [x1, y1] = a, [x2, y2] = b; const t = Math.max(0, Math.min(1, ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / ((x2 - x1) ** 2 + (y2 - y1) ** 2))); return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1))); };
    for (let i = 0; i < 1300; i++) {
      const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 118; const x = Math.cos(a) * r, y = Math.sin(a) * r;
      const inNum = seg.some(sg => d2(x, y, sg) < 13);
      const shade = rnd();
      let c = inNum ? `hsl(${100 + shade * 30},${45 + shade * 20}%,${42 + shade * 12}%)` : `hsl(${18 + shade * 22},${70 + shade * 15}%,${50 + shade * 10}%)`;
      if (deutan) c = `hsl(${46 + shade * 6},${38 + shade * 10}%,${45 + shade * 12}%)`;
      s += `<circle cx="${(cx + x).toFixed(1)}" cy="${(cy + y).toFixed(1)}" r="${(2.4 + rnd() * 3.2).toFixed(1)}" fill="${c}"/>`;
    }
    return `<circle cx="${cx}" cy="${cy}" r="128" fill="#efe2c8"/>${s}`;
  };
  const cor = svg(`
    <text x="40" y="60" class="lt">Três cones = três curvas</text>
    <defs><linearGradient id="spec" x1="0" x2="1"><stop offset="0" stop-color="#6a3cff"/><stop offset=".25" stop-color="#2f7bff"/><stop offset=".45" stop-color="#20c060"/><stop offset=".62" stop-color="#e8e020"/><stop offset=".8" stop-color="#ff8a1f"/><stop offset="1" stop-color="#e02020"/></linearGradient></defs>
    <rect x="${sx(400)}" y="392" width="${sx(700) - sx(400)}" height="14" rx="7" fill="url(#spec)"/>
    ${[400, 450, 500, 550, 600, 650, 700].map(nm => `<text x="${sx(nm)}" y="430" text-anchor="middle" class="lx mono">${nm}</text>`).join('')}<text x="${sx(700)}" y="452" text-anchor="end" class="lx">nm</text>
    <g data-s="=12">${spec(420, 38, '#7f95ff', 'S (azul) 420')}${spec(534, 55, '#3fc584', 'M (verde) 534')}${spec(564, 60, '#ff6b5e', 'L (vermelho) 564')}${spec(498, 48, '#cfe2d7', 'bastonete 498', 'stroke-dasharray="7 6"')}</g>
    <g data-s="=13">${spec(420, 38, '#7f95ff', 'S')}${spec(560, 58, '#3fc584', 'M → fica colado no L', 'class="pulse"')}${spec(564, 60, '#ff6b5e', '')}</g>
    <g data-s="=13">${plate(260, 620, false)}${plate(740, 620, true)}
      ${tag(260, 770, 'visão normal: “74”', { o: 1, fs: 15 })}${tag(740, 770, 'deuteranopia (simulação)', { fs: 15 })}</g>
    <g data-s="=12">${tag(500, 560, 'cor = COMPARAÇÃO entre cones', { o: 1, fs: 17 })}${tag(500, 610, 'amarelo = L e M juntos, S quase nada', { fs: 15 })}${tag(500, 660, 'à noite só bastonetes (1 tipo) → tudo cinza', { fs: 15, fill: ROD })}</g>
  `);

  /* ---------- cena I: via óptica e lesões ---------- */
  const OR = '#ff8a1f', GRN = '#3fc584';
  const field = (x, y, lb, rb, extra = '') => { // lb/rb: arrays de quadrantes pretos por olho: 'L','R','LU','LL','RU','RL','all'
    const eye = (cx, dark) => { let s = `<circle cx="${cx}" cy="${y}" r="26" fill="#fff6ea"/>`; dark.forEach(q => { if (q === 'all') s += `<circle cx="${cx}" cy="${y}" r="26" fill="#07201a"/>`; else { const L = q[0] === 'L'; const up = q[1]; let d; if (!up) d = L ? `M${cx},${y - 26} A26,26 0 0 0 ${cx},${y + 26}Z` : `M${cx},${y - 26} A26,26 0 0 1 ${cx},${y + 26}Z`; else if (up === 'U') d = L ? `M${cx},${y} L${cx},${y - 26} A26,26 0 0 0 ${cx - 26},${y}Z` : `M${cx},${y} L${cx},${y - 26} A26,26 0 0 1 ${cx + 26},${y}Z`; else d = L ? `M${cx},${y} L${cx - 26},${y} A26,26 0 0 0 ${cx},${y + 26}Z` : `M${cx},${y} L${cx + 26},${y} A26,26 0 0 1 ${cx},${y + 26}Z`; s += `<path d="${d}" fill="#07201a"/>`; } }); s += `<circle cx="${cx}" cy="${y}" r="26" fill="none" stroke="#9fc0ae" stroke-width="2"/>`; return s; };
    return `<g ${extra}>${eye(x - 30, lb)}${eye(x + 30, rb)}</g>`;
  };
  const via = svg(`
    <!-- campos -->
    <circle cx="330" cy="70" r="46" fill="none" stroke="#9fc0ae" stroke-dasharray="4 5"/><circle cx="670" cy="70" r="46" fill="none" stroke="#9fc0ae" stroke-dasharray="4 5"/>
    <path d="M330,24 A46,46 0 0 0 330,116Z" fill="${OR}" opacity=".6"/><path d="M330,24 A46,46 0 0 1 330,116Z" fill="${GRN}" opacity=".6"/>
    <path d="M670,24 A46,46 0 0 0 670,116Z" fill="${OR}" opacity=".6"/><path d="M670,24 A46,46 0 0 1 670,116Z" fill="${GRN}" opacity=".6"/>
    <text x="210" y="76" text-anchor="end" class="ls" fill="${OR}">campo ESQUERDO</text><text x="790" y="76" class="ls" fill="${GRN}">campo DIREITO</text>
    <!-- olhos -->
    <circle cx="330" cy="200" r="58" fill="#fff6ea" opacity=".15" stroke="#cfe2d7" stroke-width="3"/><circle cx="670" cy="200" r="58" fill="#fff6ea" opacity=".15" stroke="#cfe2d7" stroke-width="3"/>
    <path d="M280,228 A58,58 0 0 0 380,228" stroke="#e7a795" stroke-width="8" fill="none"/><path d="M620,228 A58,58 0 0 0 720,228" stroke="#e7a795" stroke-width="8" fill="none"/>
    <!-- fibras -->
    <path d="M300,250 C300,300 330,330 410,420 C430,440 440,470 450,560 C455,640 440,690 400,730" stroke="${GRN}" stroke-width="7" fill="none"/>
    <path d="M360,250 C380,300 460,320 500,330 C540,340 590,380 600,420 C610,470 560,470 560,560 C560,640 580,690 600,730" stroke="${OR}" stroke-width="7" fill="none"/>
    <path d="M640,250 C620,300 540,320 500,330 C460,340 410,380 400,420 C390,470 440,470 440,560 C440,640 420,690 400,730" stroke="${GRN}" stroke-width="7" fill="none" opacity=".85"/>
    <path d="M700,250 C700,300 670,330 590,420 C570,440 560,470 550,560 C545,640 560,690 600,730" stroke="${OR}" stroke-width="7" fill="none" opacity=".85"/>
    <ellipse cx="430" cy="520" rx="34" ry="22" fill="#c7b1ff" opacity=".85"/><ellipse cx="570" cy="520" rx="34" ry="22" fill="#c7b1ff" opacity=".85"/>
    <path d="M300,760 C340,720 420,720 470,740" stroke="#e7a795" stroke-width="16" fill="none"/><path d="M700,760 C660,720 580,720 530,740" stroke="#e7a795" stroke-width="16" fill="none"/>
    <g data-s="=14">
      ${flow({ d: 'M360,250 C380,300 460,320 500,330 C540,340 590,380 600,420 C610,470 560,470 560,560 C560,640 580,690 600,730', n: 5, dur: 3, r: 7, fill: OR })}
      ${flow({ d: 'M700,250 C700,300 670,330 590,420 C570,440 560,470 550,560 C545,640 560,690 600,730', n: 5, dur: 3, r: 7, fill: OR })}
      ${callout(330, 240, 180, 250, 'Nervo óptico', { anchor: 'end', cls: 'lb' })}
      ${callout(500, 330, 500, 290, 'Quiasma óptico', { anchor: 'middle', cls: 'lb lo', sub: '' })}
      ${callout(420, 420, 250, 420, 'Trato óptico', { anchor: 'end', cls: 'lb' })}
      ${callout(430, 520, 250, 520, 'Corpo geniculado lateral', { anchor: 'end', cls: 'lb', dot: '#c7b1ff' })}
      ${callout(450, 620, 250, 630, 'Radiações ópticas', { anchor: 'end', cls: 'lb' })}
      ${callout(400, 735, 250, 740, 'V1 (17) · sulco calcarino', { anchor: 'end', cls: 'lb lo' })}
      ${tag(790, 380, 'fibras NASAIS cruzam', { o: 1, fs: 15 })}${tag(790, 420, 'temporais seguem do mesmo lado', { fs: 14 })}
      ${tag(790, 600, 'hemisfério D vê o campo E', { fs: 15, fill: OR })}
    </g>
    <g data-s="=15">
      ${[[300, 250, '1'], [500, 330, '2'], [410, 440, '3'], [455, 600, '4'], [400, 720, '5']].map(([x, y, n]) => `<g><circle cx="${x}" cy="${y}" r="20" fill="#ff6b5e" stroke="#fff" stroke-width="3"/><text x="${x}" y="${y + 7}" text-anchor="middle" class="mono" style="font-size:18px;stroke:none" fill="#fff">${n}</text></g>`).join('')}
      <g transform="translate(735,190)">
        <text x="0" y="0" class="lx">1 · nervo óptico E</text>${field(170, -6, ['all'], [])}
        <text x="0" y="90" class="lx">2 · quiasma</text>${field(170, 84, ['L'], ['R'])}
        <text x="0" y="180" class="lx">3 · trato E</text>${field(170, 174, ['R'], ['R'])}
        <text x="0" y="270" class="lx">4 · alça de Meyer E</text>${field(170, 264, ['RU'], ['RU'])}
        <text x="0" y="360" class="lx">5 · V1 E</text>${field(170, 354, ['R'], ['R'])}<circle cx="140" cy="354" r="7" fill="#fff6ea"/><circle cx="200" cy="354" r="7" fill="#fff6ea"/>
      </g>
    </g>
  `);

  DA.topic({
    id: 'visao', section: 'Sentidos especiais',
    short: 'Fisiologia da visão',
    title: 'Fisiologia da <em>visão</em>',
    card: 'Cones × bastonetes, fóvea, ponto cego, fototransdução, vias',
    lede: 'Seu olho tem um buraco sem receptores e uma região central que não enxerga no escuro, e você nunca percebeu. Para entender por quê, é preciso saber onde ficam cones e bastonetes e como a luz, curiosamente, DESLIGA o fotorreceptor.',
    fig: () => `
      <div class="scene" data-s="0-1">${retina}</div>
      <div class="scene" data-s="=2">${cells}</div>
      <div class="scene" data-s="3-5">${densidade}</div>
      <div class="scene" data-s="=6">${demo}</div>
      <div class="scene" data-s="7-9">${foto}</div>
      <div class="scene" data-s="=10">${estrelas}</div>
      <div class="scene" data-s="=11">${adapta}</div>
      <div class="scene" data-s="12-13">${cor}</div>
      <div class="scene" data-s="14-15">${via}</div>`,
    steps: [
      {
        k: 'Retina', t: 'A retina é <em>invertida</em>',
        p: 'A luz atravessa <b>todas as camadas</b> da retina (ganglionares → bipolares) antes de chegar aos <b>fotorreceptores</b>, que ficam no fundo, encostados no <b>epitélio pigmentar</b>. O sinal faz o caminho de volta: fotorreceptor → bipolar → ganglionar, e os axônios das ganglionares formam o <b>nervo óptico</b>. Células horizontais e amácrinas fazem conexões laterais.',
        why: 'Parece um defeito de projeto, mas os fotorreceptores gastam muita energia e precisam do <b>epitélio pigmentar</b> colado neles: ele recicla o retinal (ciclo visual), fagocita as pontas gastas dos discos e absorve a luz que sobrou, evitando reflexos que borrariam a imagem. As camadas por cima são quase transparentes.',
        an: 'Como um painel solar instalado com a fiação por cima: a fiação é fina e transparente, e em troca o painel fica encostado na “tomada” que o alimenta.'
      },
      {
        k: 'Cones × bastonetes', t: '<em>Bastonetes</em> × <em>cones</em>',
        html: `<table><tr><th></th><th>Bastonetes</th><th>Cones</th></tr>
          <tr><td>Quantidade</td><td>≈ 120 milhões</td><td>≈ 6 milhões</td></tr>
          <tr><td>Sensibilidade</td><td><b>Altíssima</b> (1 fóton)</td><td>Baixa (precisa de luz)</td></tr>
          <tr><td>Visão</td><td><b>Escotópica</b> (noite), movimento</td><td><b>Fotópica</b> (dia), detalhe</td></tr>
          <tr><td>Cor</td><td>Não (1 pigmento: rodopsina)</td><td><b>Sim</b> (3 opsinas: S, M, L)</td></tr>
          <tr><td>Acuidade</td><td>Baixa (muita convergência)</td><td><b>Alta</b> (1:1 na fóvea)</td></tr>
          <tr><td>Onde</td><td><b>Periferia</b> (pico ≈ 20°)</td><td><b>Fóvea</b> (centro)</td></tr></table>`,
        why: 'Um mesmo sensor não consegue ser, ao mesmo tempo, <b>muito sensível</b> e <b>muito nítido</b>. O olho usa dois sistemas: um para o escuro (bastonetes) e outro para o detalhe e a cor (cones).',
        an: 'Bastonete é a câmera de segurança noturna: vê no escuro, mas em preto e branco e granulado. Cone é a câmera 4K: nítida e colorida, mas só com boa luz.'
      },
      {
        k: 'Distribuição', t: 'Onde fica cada um: <em>centro × periferia</em>',
        p: 'O gráfico mostra a densidade ao longo da retina. Os <b>cones</b> formam um pico estreito e altíssimo no centro (<b>fóvea</b>) e caem rapidamente. Os <b>bastonetes</b> são <b>zero na fóvea</b>, sobem até um pico por volta de <b>20°</b> e continuam numerosos na periferia.',
        why: 'Essa distribuição explica tudo o que vem a seguir: por que você lê com o centro do olhar, por que enxerga estrelas melhor olhando de lado e por que percebe movimento “com o canto do olho”.',
        an: 'Um estádio: a arquibancada central (fóvea) tem só câmeras de alta resolução, e o anel externo (periferia) tem sensores de movimento e de luz fraca.'
      },
      {
        k: 'Fóvea', t: '<em>Fóvea</em>: por que ela é tão nítida',
        keys: ['<b>Só cones</b>, finos e bem apertados (até cerca de 150–200 mil/mm²).', '<b>Convergência 1:1</b>: cada cone tem a sua bipolar e a sua ganglionar exclusivas, então o cérebro sabe exatamente de onde veio cada ponto.', 'As camadas de cima são <b>afastadas para os lados</b> (a fóvea é uma “fossa”): a luz chega aos cones sem atravessar quase nada.', 'Não há vasos sanguíneos sobre a fóvea (zona avascular).'],
        why: 'Resolução depende de <b>pixels pequenos e independentes</b>. A fóvea tem só 1,5 mm, mas ocupa uma área enorme do córtex visual. É para lá que você move os olhos quando quer ver algo (leitura, rostos).',
        clin: '<b>Degeneração macular relacionada à idade</b>: perde-se a visão central (não consegue ler nem reconhecer rostos) e a periferia fica preservada.'
      },
      {
        k: 'Ponto cego', t: '<em>Ponto cego</em>: um buraco em cada olho',
        p: 'O <b>disco óptico</b> fica cerca de <b>15° para o lado nasal</b> da fóvea. É por ali que os axônios das ganglionares saem do olho (nervo óptico) e os vasos entram. Nesse ponto <b>não há nenhum fotorreceptor</b>: a luz que cai ali não é detectada.',
        why: 'Você não percebe por dois motivos: (1) os pontos cegos dos dois olhos caem em lugares <b>diferentes</b> do campo visual, e um olho cobre o buraco do outro; (2) mesmo com um olho só, o córtex <b>preenche</b> o buraco com o padrão ao redor (filling-in). O cérebro “inventa” o que deveria estar ali.',
        an: 'É como a mancha de um retrovisor: o outro retrovisor mostra aquele pedaço, e o cérebro emenda as duas imagens.',
        clin: 'No <b>papiledema</b> (hipertensão intracraniana) e no <b>glaucoma</b>, o disco muda de aparência no fundo de olho e o ponto cego aumenta no exame de campo visual.'
      },
      {
        k: 'Teste', t: 'Encontre o <em>seu</em> ponto cego',
        p: 'Tampe o <b>olho esquerdo</b>. Olhe fixamente para a cruz com o olho direito. Mantendo o olhar na cruz, aproxime e afaste o rosto da tela devagar (em torno de 30–50 cm). Em certo ponto, a <b>bolinha laranja some</b>.',
        why: 'Nessa distância, a imagem da bolinha cai exatamente sobre o disco óptico do olho direito, onde não há fotorreceptores. E repare: no lugar da bolinha você não vê um “buraco preto”, e sim o fundo claro. É o cérebro preenchendo a lacuna.'
      },
      {
        k: 'No escuro', t: 'No escuro, o fotorreceptor está <em>ligado</em>',
        p: 'No escuro, o bastonete tem muito <b>GMPc</b>, que mantém abertos os canais <b>CNG</b> (dependentes de nucleotídeo cíclico) do segmento externo. Na⁺ e Ca²⁺ entram o tempo todo: é a <b>corrente de escuro</b>. A célula fica <b>despolarizada (≈ −40 mV)</b> e libera <b>glutamato continuamente</b>.',
        why: 'É o contrário de quase todo receptor: o fotorreceptor fica “ligado” <b>sem estímulo</b>. A bomba Na⁺/K⁺ no segmento interno e a saída de K⁺ fecham o circuito da corrente. O sinal de luz vai ser a <b>interrupção</b> dessa corrente.',
        an: 'Uma torneira que fica aberta o dia inteiro. O aviso de que algo aconteceu é a torneira fechar.'
      },
      {
        k: 'Fototransdução', t: 'Luz: <em>hiperpolarização</em> em cascata',
        p: 'O fóton muda o <b>11-cis-retinal</b> da rodopsina para <b>all-trans</b>. A rodopsina ativada (metarrodopsina II) ativa a proteína G <b>transducina</b>, que ativa a <b>fosfodiesterase (PDE)</b>. A PDE destrói o GMPc (GMPc → GMP). Sem GMPc, os canais CNG <b>fecham</b>, o Na⁺ para de entrar e a célula <b>hiperpolariza (≈ −70 mV)</b>. Resultado: <b>menos glutamato</b> liberado.',
        why: 'A cascata <b>amplifica</b>: uma rodopsina ativa centenas de transducinas, e cada PDE destrói milhares de GMPc. Por isso <b>1 único fóton</b> já muda o potencial de um bastonete. O sinal da luz é “menos glutamato”, e as bipolares interpretam isso.',
        an: 'Uma fileira de dominós que cresce a cada peça: um toque pequeno no início derruba uma parede inteira no fim.'
      },
      {
        k: 'Por que hiperpolarizar?', t: 'Por que a luz <em>desliga</em> a célula?',
        p: 'Porque assim o fotorreceptor informa <b>aumentos e reduções</b> de luz com a mesma resposta graduada (sem potencial de ação). As <b>bipolares ON</b> (receptor mGluR6, inibidas pelo glutamato) são <b>excitadas pela luz</b>, e as <b>bipolares OFF</b> (receptores ionotrópicos) são excitadas pelo escuro. As ganglionares são as primeiras a disparar potenciais de ação.',
        why: 'Com liberação contínua, o fotorreceptor pode <b>aumentar ou diminuir</b> o glutamato de forma fina, como um dimmer. Dividir em ON e OFF logo na primeira sinapse permite ao cérebro detectar <b>contraste</b> (bordas claras em fundo escuro e vice-versa), que é a base de enxergar formas.',
        clin: '<b>Cegueira noturna</b> por falta de <b>vitamina A</b>: sem retinal não há rodopsina, e os bastonetes param de funcionar primeiro.'
      },
      {
        k: 'Estrelas', t: 'Estrelas: veja melhor <em>olhando de lado</em>',
        p: 'À noite, olhe <b>diretamente</b> para uma estrela fraca e ela some. Desvie o olhar cerca de 15–20° e ela reaparece, junto com várias outras. Astrônomos chamam isso de <b>visão desviada</b>.',
        why: 'Olhando direto, a luz cai na <b>fóvea</b>, que só tem cones, e eles não respondem a tão poucos fótons. Olhando de lado, a luz cai na <b>periferia</b>, rica em <b>bastonetes</b>. Além de mais sensível, ali muitos bastonetes <b>convergem</b> numa mesma ganglionar (até cerca de 100:1) e somam seus sinais fracos. O preço é perder detalhe e cor: a estrela aparece, mas borrada e sem cor.',
        an: 'Um balde grande (muitos bastonetes somados) recolhe mais gotas de chuva fina do que um copinho (um cone sozinho).',
        deep: '<p>O mesmo vale para o <b>movimento</b>: a periferia, com campos receptivos grandes e bastonetes rápidos em detectar mudança, é o sistema de alarme que faz você virar a cabeça quando algo se mexe no canto do olho, mesmo sem saber o que é.</p>'
      },
      {
        k: 'Adaptação', t: '<em>Adaptação</em> ao escuro: por que demora?',
        p: 'Entrou no cinema e não vê nada? Nos primeiros <b>5–10 minutos</b>, quem melhora são os <b>cones</b>, até o limite deles. Depois, a curva quebra (<b>quebra de Kohlrausch</b>) e os <b>bastonetes</b> assumem, com a sensibilidade subindo até cerca de <b>20–30 minutos</b>. No fim, você fica cerca de 10.000–1.000.000× mais sensível.',
        why: 'Na luz forte do dia, quase toda a rodopsina está <b>“descorada”</b> (retinal em all-trans), e os bastonetes estão saturados. No escuro, a rodopsina precisa ser <b>regenerada</b>: o all-trans vai ao epitélio pigmentar, volta a 11-cis e se junta de novo à opsina. Esse ciclo é lento. Os cones regeneram seus pigmentos mais depressa, e por isso melhoram primeiro.',
        an: 'Os bastonetes são uma bateria que a luz do dia descarrega. No escuro ela recarrega, mas precisa de meia hora na tomada.',
        deep: '<p><b>Adaptação à luz</b> (sair do cinema para o sol) é rápida, de segundos a minutos: os bastonetes saturam, os cones assumem e o Ca²⁺ intracelular cai (o que acelera a reposição de GMPc e ajusta o ganho). A pupila também ajuda (miose/midríase), mas responde por só cerca de 16× da faixa.</p><p>Pilotos e militares usam luz <b>vermelha</b> à noite: os bastonetes quase não absorvem vermelho (pico em 498 nm), então a rodopsina não se descora e a adaptação ao escuro é preservada.</p>'
      },
      {
        k: 'Cor', t: 'Cones e <em>cor</em>: três curvas',
        p: 'Existem três cones com opsinas diferentes: <b>S</b> (curtos, pico ≈ 420 nm, azul), <b>M</b> (médios, ≈ 534 nm, verde) e <b>L</b> (longos, ≈ 564 nm, vermelho). Nenhum cone “sabe” a cor. A cor surge da <b>comparação</b> entre as respostas dos três (teoria tricromática) e depois das vias de oponência (vermelho × verde, azul × amarelo).',
        why: 'Um cone sozinho não diferencia “luz fraca de cor ideal” de “luz forte de cor ruim”: as duas dão a mesma resposta (princípio da univariância). Só comparando cones diferentes o cérebro separa cor de intensidade. À noite só funcionam os bastonetes, que são <b>um tipo só</b>, e por isso tudo fica cinza.',
        an: 'Três termômetros calibrados diferentes: nenhum sozinho diz onde você está, mas a combinação das três leituras sim.'
      },
      {
        k: 'Daltonismo', t: '<em>Daltonismo</em>: quando um cone falha',
        keys: ['<b>Deuteranomalia/deuteranopia</b> (cone M alterado ou ausente) e <b>protanomalia/protanopia</b> (cone L): confusão <b>vermelho × verde</b>. São as formas mais comuns.', 'Os genes das opsinas M e L ficam no <b>cromossomo X</b>, lado a lado e quase idênticos. Recombinação errada gera genes híbridos ou deleções.', 'Afeta cerca de <b>8% dos homens</b> e 0,5% das mulheres (ligado ao X recessivo).', '<b>Tritanopia</b> (cone S, cromossomo 7): rara, confusão azul × amarelo.'],
        why: 'Na deuteranomalia, a curva do cone M fica deslocada para perto da curva L. Os dois passam a responder quase igual, e a comparação que distingue vermelho de verde perde a força. No teste de <b>Ishihara</b>, o número é formado por pontos que só se diferenciam do fundo nessa comparação, então ele “desaparece”.',
        an: 'Exemplos práticos: dificuldade de distinguir fruta madura e verde, carne mal passada e bem passada, LEDs de carregador (vermelho × verde) e mapas coloridos.',
        clin: 'Homem daltônico com mãe portadora: 50% dos filhos homens afetados e 50% das filhas portadoras. Uma mulher só é daltônica se o pai for daltônico <b>e</b> a mãe for portadora ou afetada.'
      },
      {
        k: 'Via óptica', t: 'Do olho ao córtex: o <em>quiasma</em>',
        p: 'Nervo óptico → <b>quiasma óptico</b> → trato óptico → <b>corpo geniculado lateral</b> (tálamo) → radiações ópticas → <b>córtex visual primário (V1, área 17)</b>, às margens do sulco calcarino. No quiasma, <b>só as fibras da retina nasal cruzam</b>. As da retina temporal seguem do mesmo lado.',
        why: 'A retina nasal enxerga o campo visual <b>temporal</b> (a imagem é invertida pela lente). Cruzando só as fibras nasais, cada hemisfério recebe <b>o campo visual oposto inteiro</b>, com os dois olhos juntos. Assim o hemisfério direito vê o lado esquerdo do mundo, assim como controla e sente o lado esquerdo do corpo, e os dois olhos se juntam no mesmo lugar, o que permite a visão em profundidade (estereopsia).',
        an: 'O quiasma é um trevo rodoviário: só as faixas internas cruzam para o outro lado. As externas seguem em frente.'
      },
      {
        k: 'Lesões', t: 'Onde está a lesão? <em>Leia o campo visual</em>',
        keys: ['<b>1 · Nervo óptico</b>: cegueira do olho inteiro (monocular).', '<b>2 · Quiasma</b>: <b>hemianopsia bitemporal</b> (perde os dois lados de fora). Clássico: <b>adenoma de hipófise</b> comprimindo por baixo.', '<b>3 · Trato óptico</b>: hemianopsia <b>homônima</b> contralateral.', '<b>4 · Alça de Meyer</b> (radiações no lobo temporal): quadrantanopsia <b>superior</b> contralateral (“torta no céu”).', '<b>5 · V1</b> (AVC da cerebral posterior): hemianopsia homônima contralateral <b>com preservação macular</b>.'],
        why: 'Antes do quiasma, a lesão afeta <b>um olho</b>. No quiasma, afeta as fibras que cruzam (<b>nasais → campos temporais</b>). Depois do quiasma, afeta <b>o mesmo lado do campo nos dois olhos</b> (homônima). A mácula é poupada em V1 porque o polo occipital recebe sangue também da artéria cerebral média.',
        clin: 'Paciente com cefaleia, galactorreia/acromegalia que bate o carro nas laterais: pense em tumor hipofisário (hemianopsia bitemporal).'
      }
    ],
    legend: [
      ['Epitélio pigmentar', 'Absorve a luz dispersa, recicla o retinal (all-trans → 11-cis), fagocita discos e nutre os fotorreceptores.'],
      ['Bastonetes', '≈ 120 milhões. Rodopsina (pico 498 nm). Visão noturna, movimento, periferia. Alta convergência.'],
      ['Cones', '≈ 6 milhões. Opsinas S (420), M (534) e L (564 nm). Cor e acuidade. Concentrados na fóvea.'],
      ['Fóvea / mácula', 'Fóvea: fossa central só com cones e convergência 1:1. Mácula: região pigmentada em volta (≈ 5 mm).'],
      ['Disco óptico (ponto cego)', '≈ 15° nasal à fóvea. Saída do nervo óptico, sem fotorreceptores.'],
      ['Células bipolares ON / OFF', 'ON: mGluR6 (glutamato inibe → luz excita). OFF: AMPA/cainato (escuro excita).'],
      ['Células horizontais e amácrinas', 'Conexões laterais: inibição lateral e contraste (centro-periferia).'],
      ['Células ganglionares', 'Primeiras a disparar potenciais de ação. Axônios formam o nervo óptico. Tipos M (movimento) e P (detalhe/cor).'],
      ['Rodopsina', 'Opsina + 11-cis-retinal (derivado da vitamina A). A luz isomeriza o retinal para all-trans.'],
      ['Transducina (Gt)', 'Proteína G ativada pela rodopsina. Ativa a fosfodiesterase.'],
      ['Fosfodiesterase (PDE6)', 'Hidrolisa GMPc → GMP.'],
      ['Canal CNG', 'Canal de cátions aberto pelo GMPc. Responsável pela corrente de escuro.'],
      ['Nervo óptico (II)', 'Axônios das ganglionares de um olho.'],
      ['Quiasma óptico', 'Cruzamento das fibras da retina nasal. Acima da hipófise.'],
      ['Trato óptico', 'Fibras do campo visual contralateral (temporal ipsilateral + nasal contralateral).'],
      ['Corpo geniculado lateral', 'Núcleo talâmico com 6 camadas. Retransmite ao córtex visual.'],
      ['Radiações ópticas / alça de Meyer', 'Do CGL a V1. A alça de Meyer (temporal) leva o campo superior. A parietal leva o inferior.'],
      ['Córtex visual primário (V1, 17)', 'Margens do sulco calcarino. Mapa retinotópico, com a mácula muito representada.']
    ],
    clinic: [
      'Fotorreceptores HIPERpolarizam com a luz. A primeira célula da via visual a disparar PA é a ganglionar.',
      'Vitamina A: deficiência causa cegueira noturna (nictalopia) e xeroftalmia.',
      'Visão desviada: estrelas fracas aparecem na periferia (bastonetes), não na fóvea (cones).',
      'Adaptação ao escuro: cones em 5–10 min, quebra de Kohlrausch, bastonetes até cerca de 30 min.',
      'Daltonismo vermelho-verde: ligado ao X, cerca de 8% dos homens. Teste de Ishihara.',
      'Adenoma de hipófise: hemianopsia bitemporal.',
      'Lesão do trato: hemianopsia homônima contralateral. V1: idem, com preservação macular.',
      'Alça de Meyer (temporal): quadrantanopsia superior (“torta no céu”). Radiação parietal: inferior.',
      'DMRI: perda central. Glaucoma e retinose pigmentar: perda periférica (visão em túnel).'
    ]
  });
})();
