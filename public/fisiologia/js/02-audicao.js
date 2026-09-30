/* 02 · Transdução sonora e células ciliadas da cóclea */
(function () {
  const { svg, flow, callout, tag, ion, box, C } = H;
  const PERI = 'rgba(255,138,31,.16)', ENDO = 'rgba(63,197,132,.24)';

  /* onda viajante na membrana basilar: gera quadros para <animate> */
  function wave(xp, w, amp, color = '#fff', y0 = 400, x0 = 380, x1 = 930) {
    const frames = [];
    for (let f = 0; f < 12; f++) {
      const ph = (f / 12) * Math.PI * 2;
      let d = '', phase = 0;
      for (let x = x0; x <= x1; x += 4) {
        const t = (x - x0) / (xp - x0);
        phase += (2 * Math.PI / 150) * (1 + 2.5 * Math.min(t, 1.2)) * 4;
        // envelope: cresce devagar até o pico e cai abruptamente depois dele
        const env = x < xp ? Math.exp(-Math.pow((x - xp) / w, 2) * 0.5) : Math.exp(-Math.pow((x - xp) / (w * 0.35), 2));
        const y = y0 + amp * env * Math.sin(phase - ph);
        d += (d ? ' L' : 'M') + x + ',' + y.toFixed(1);
      }
      frames.push(d);
    }
    frames.push(frames[0]);
    return `<path d="${frames[0]}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><animate attributeName="d" dur="1s" repeatCount="indefinite" values="${frames.join(';')}"/></path>`;
  }

  /* ---------- cena A: visão geral orelha → cóclea desenrolada ---------- */
  const visao = svg(`
    <text x="40" y="60" class="lt">Orelha externa → média → interna</text>
    <!-- pavilhão e meato -->
    <path d="M40,220 C120,210 170,270 180,330 L180,430 C170,480 120,540 40,540" fill="none" stroke="#e7a795" stroke-width="16" stroke-linecap="round"/>
    <rect x="60" y="352" width="160" height="56" fill="#e7a795" opacity=".22"/>
    ${flow({ d: 'M50,380 L215,380', n: 5, dur: 1.6, r: 5, fill: '#cfe2d7' })}
    <!-- orelha média -->
    <rect x="222" y="250" width="148" height="230" rx="24" fill="#0a2a1f" stroke="rgba(165,232,198,.3)"/>
    <path d="M222,320 Q238,380 222,440" stroke="#ffd166" stroke-width="7" fill="none" data-hl="=1"/>
    <g data-hl="=1" stroke="#efe2c8" stroke-linecap="round" fill="none">
      <path d="M230,382 L262,300" stroke-width="12"/><circle cx="266" cy="292" r="12" fill="#efe2c8"/>
      <path d="M278,292 L318,300 L322,318" stroke-width="12"/>
      <path d="M322,318 L352,300 M322,318 L352,340 M352,296 L352,344" stroke-width="7"/>
    </g>
    <path d="M300,480 L262,570" stroke="#9fc0ae" stroke-width="14" stroke-linecap="round" opacity=".5"/>
    <!-- cóclea desenrolada -->
    <rect x="370" y="270" width="590" height="80" rx="10" fill="${PERI}" stroke="rgba(255,138,31,.5)"/>
    <rect x="370" y="350" width="560" height="50" fill="${ENDO}" stroke="rgba(63,197,132,.6)"/>
    <rect x="370" y="400" width="590" height="80" rx="10" fill="${PERI}" stroke="rgba(255,138,31,.5)"/>
    <rect x="930" y="350" width="30" height="50" fill="${PERI}"/>
    <line x1="370" y1="350" x2="930" y2="350" stroke="#a5e8c6" stroke-width="2"/>
    <g data-s="<4">${wave(560, 110, 0)}</g>
    <g data-s="=4">${wave(470, 80, 20, '#ff8a1f')}</g>
    <g data-s="=4">${wave(840, 170, 24, '#a5e8c6')}</g>
    <rect x="364" y="285" width="10" height="50" rx="4" fill="#efe2c8" data-hl="=1"/>
    <path d="M372,420 Q360,440 372,460" stroke="#ffd166" stroke-width="5" fill="none"/>
    <g data-s="1">${flow({ d: 'M380,310 L945,310 L945,440 L380,440', n: 10, dur: 4, r: 4.5, fill: '#ffb567' })}</g>
    <!-- rótulos -->
    ${callout(222, 330, 100, 250, 'Membrana timpânica', { anchor: 'middle' })}
    ${callout(290, 300, 290, 190, 'Ossículos', { anchor: 'middle', sub: 'martelo · bigorna · estribo' })}
    ${callout(369, 300, 470, 245, 'Janela oval', { anchor: 'start' })}
    ${callout(368, 440, 330, 540, 'Janela redonda', { anchor: 'middle' })}
    ${callout(282, 525, 150, 600, 'Tuba auditiva', { anchor: 'middle' })}
    <g data-s="2">
      <text x="640" y="316" text-anchor="middle" class="lb" fill="#ffb567">Rampa vestibular · perilinfa</text>
      <text x="640" y="382" text-anchor="middle" class="lb lm">Rampa média (ducto coclear) · endolinfa</text>
      <text x="640" y="452" text-anchor="middle" class="lb" fill="#ffb567">Rampa timpânica · perilinfa</text>
      ${callout(945, 375, 940, 540, 'Helicotrema', { anchor: 'middle', sub: 'une vestibular e timpânica' })}
    </g>
    <g data-s="=4">
      ${tag(470, 520, 'BASE: estreita e rígida → AGUDOS', { o: 1, fs: 15 })}
      ${tag(830, 520, 'ÁPICE: larga e flexível → GRAVES', { fs: 15 })}
      <text x="470" y="580" text-anchor="middle" class="mono lo" style="font-size:20px">20 kHz</text>
      <text x="830" y="580" text-anchor="middle" class="mono lm" style="font-size:20px">20 Hz</text>
    </g>
    <g data-s="=1">${tag(640, 640, 'Área da membrana timpânica ≈ 17× a da janela oval', { o: 1, fs: 16 })}${tag(640, 690, 'alavanca dos ossículos ≈ 1,3× → pressão ≈ 22× maior', { fs: 15 })}</g>
  `);

  /* ---------- cena B: corte transversal da cóclea e órgão de Corti ---------- */
  const ohc = (x) => `<g><rect x="${x - 11}" y="398" width="22" height="58" rx="10" fill="#ffb567" stroke="#ff8a1f" stroke-width="1.5"/>
    ${[-7, -1, 5].map((d, i) => `<rect x="${x + d - 1.5}" y="${388 - i * 5}" width="3" height="${12 + i * 5}" fill="#fff"/>`).join('')}</g>`;
  const corte = svg(`
    <rect x="130" y="120" width="740" height="600" rx="120" fill="${PERI}" stroke="rgba(239,226,200,.5)" stroke-width="10"/>
    <!-- lâmina espiral óssea e modíolo -->
    <rect x="60" y="455" width="330" height="26" rx="8" fill="#efe2c8" opacity=".85"/>
    <circle cx="140" cy="540" r="34" fill="#ffd166" opacity=".35"/><circle cx="140" cy="540" r="18" fill="#ffd166" opacity=".7"/>
    <!-- rampa média (triângulo) -->
    <polygon points="370,410 815,215 815,482 392,482 360,445" fill="${ENDO}" stroke="#3fc584" stroke-width="2"/>
    <path d="M815,215 C850,300 850,400 815,482" fill="none" stroke="#ff6b5e" stroke-width="16" stroke-linecap="round" data-hl="=3"/>
    <line x1="370" y1="410" x2="815" y2="215" stroke="#cfe2d7" stroke-width="3"/>
    <line x1="390" y1="482" x2="815" y2="482" stroke="#fff" stroke-width="5" data-hl="=4"/>
    <!-- órgão de Corti -->
    <g data-hl="=5">
      <path d="M430,482 L430,452 C470,440 700,440 720,452 L720,482Z" fill="#1d5a45"/>
      <path d="M520,482 L548,420 L576,482" fill="none" stroke="#a5e8c6" stroke-width="5"/>
      <g class="ihc"><path d="M470,470 C448,470 448,420 470,405 C492,420 492,470 470,470Z" fill="#62dcc8" stroke="#1f7f70" stroke-width="2"/>${[-6, 0, 6].map((d, i) => `<rect x="${470 + d - 1.5}" y="${392 - i * 4}" width="3" height="${12 + i * 4}" fill="#fff"/>`).join('')}</g>
      <g class="ohc">${ohc(612)}${ohc(648)}${ohc(684)}</g>
    </g>
    <!-- membrana tectória -->
    <path d="M352,410 C420,392 560,380 712,378 L714,392 C560,396 430,402 360,428Z" fill="#c7b1ff" opacity=".8" data-hl="=5"/>
    <!-- fibras nervosas -->
    <path d="M470,470 C420,500 250,480 158,530" stroke="#ffd166" stroke-width="3" fill="none"/>
    <path d="M470,470 C420,506 250,490 160,540" stroke="#ffd166" stroke-width="3" fill="none"/>
    <path d="M648,458 C600,520 300,520 165,552" stroke="#ffd166" stroke-width="1.4" fill="none" stroke-dasharray="4 4"/>
    <g data-s="=10"><path d="M100,640 C300,640 560,560 648,460" stroke="#ff6b5e" stroke-width="3" fill="none" class="dashflow"/>${tag(260, 660, 'eferente olivococlear medial → CCE', { fs: 14 })}</g>
    <g data-s="=3">${flow({ d: 'M820,300 C760,300 700,330 640,340', n: 4, dur: 2.5, r: 11, ion: 'k' })}</g>
    <!-- rótulos -->
    <g data-s="2">
      <text x="560" y="190" text-anchor="middle" class="lb" fill="#ffb567">Rampa vestibular</text>
      <text x="700" y="308" text-anchor="middle" class="lb lm">Rampa média</text>
      <text x="560" y="620" text-anchor="middle" class="lb" fill="#ffb567">Rampa timpânica</text>
      ${callout(590, 313, 470, 260, 'Membrana de Reissner', { anchor: 'end', cls: 'ls' })}
      ${callout(760, 482, 760, 560, 'Membrana basilar', { anchor: 'middle', cls: 'ls' })}
    </g>
    <g data-s="=3">
      ${tag(560, 240, 'PERILINFA · Na⁺ 140 · K⁺ 5 mM · 0 mV', { o: 1, fs: 15 })}
      ${tag(600, 360, 'ENDOLINFA · K⁺ 150 · Na⁺ 1 mM · +80 mV', { fs: 15, fill: '#a5e8c6' })}
      ${tag(560, 660, 'PERILINFA · Na⁺ 140 · K⁺ 5 mM', { o: 1, fs: 15 })}
      ${callout(840, 340, 890, 300, 'Estria vascular', { anchor: 'start', cls: 'lb', sub: 'bombeia K⁺' })}
    </g>
    <g data-s="=5">
      ${callout(470, 440, 390, 560, 'CCI (1 fileira)', { anchor: 'end', cls: 'lb lm' })}
      ${callout(648, 440, 690, 560, 'CCE (3 fileiras)', { anchor: 'start', cls: 'lb lo' })}
      ${callout(560, 388, 560, 290, 'Membrana tectória', { anchor: 'middle', cls: 'lb' })}
      ${callout(140, 540, 90, 620, 'Gânglio espiral', { anchor: 'middle', cls: 'ls' })}
    </g>
    <g data-s="=10">
      ${tag(330, 600, 'CCI: 95% das fibras aferentes (tipo I)', { fs: 15, fill: '#a5e8c6' })}
      ${tag(700, 560, 'CCE: 5% aferentes (tipo II) + eferentes', { o: 1, fs: 15 })}
    </g>
    <g data-s="=5">${tag(560, 700, 'membrana basilar sobe → cisalhamento contra a tectória', { o: 1, fs: 15 })}</g>
  `);

  /* ---------- cena C: célula ciliada interna em zoom ---------- */
  const bundle = `<g class="bundle" data-cls="pos:=7;neg:=8">
      <rect x="455" y="190" width="18" height="60" rx="9" fill="#e9f5ef"/>
      <rect x="495" y="150" width="18" height="100" rx="9" fill="#e9f5ef"/>
      <rect x="535" y="100" width="18" height="150" rx="9" fill="#e9f5ef"/>
      <path d="M464,192 L500,164 M504,152 L540,118" stroke="#ff8a1f" stroke-width="3"/>
      <circle cx="464" cy="194" r="6" fill="#07201a" stroke="#ffd166" stroke-width="2.5" class="met"/>
      <circle cx="504" cy="154" r="6" fill="#07201a" stroke="#ffd166" stroke-width="2.5" class="met"/>
    </g>`;
  const celula = svg(`
    <rect x="40" y="40" width="920" height="210" rx="20" fill="${ENDO}"/>
    <text x="64" y="84" class="lt lm">Endolinfa</text><text x="64" y="112" class="ls">K⁺ 150 mM · +80 mV</text>
    <rect x="40" y="250" width="920" height="470" rx="20" fill="${PERI}"/>
    <text x="940" y="700" text-anchor="end" class="lt" fill="#ffb567">Perilinfa (em volta da célula)</text><text x="940" y="670" text-anchor="end" class="ls">K⁺ 5 mM · 0 mV</text>
    <line x1="40" y1="250" x2="960" y2="250" stroke="#a5e8c6" stroke-width="3" stroke-dasharray="10 6"/>
    <text x="950" y="240" text-anchor="end" class="ls">lâmina reticular (junções oclusivas)</text>
    <!-- corpo da célula -->
    <path d="M400,250 L600,250 C620,380 610,520 560,590 C530,620 470,620 440,590 C390,520 380,380 400,250Z" fill="url(#gCell)" stroke="#62dcc8" stroke-width="2.5"/>
    <rect x="410" y="252" width="180" height="16" rx="6" fill="#1f7f70"/>
    <ellipse cx="500" cy="400" rx="46" ry="38" fill="#0a2a1f" stroke="#62dcc8" stroke-opacity=".5"/>
    <text x="500" y="406" text-anchor="middle" class="ls">núcleo</text>
    <style>.fig .bundle{transform-box:view-box;transform-origin:504px 250px;transition:transform .7s cubic-bezier(.3,1.4,.5,1)}.fig .bundle.pos{transform:rotate(14deg)}.fig .bundle.neg{transform:rotate(-14deg)}.fig .bundle.pos .met{fill:#ffd166}</style>
    ${bundle}
    <!-- K+ entra pelo topo -->
    <g data-s="=7">${flow({ d: 'M468,110 L468,196 L490,320 L500,520', n: 5, dur: 2.2, r: 12, ion: 'k' })}</g>
    <g data-s="=6">${flow({ d: 'M468,150 L468,196 L490,320 L500,520', n: 1, dur: 5, r: 11, ion: 'k' })}</g>
    <!-- base: Ca2+ e glutamato -->
    <rect x="455" y="585" width="18" height="18" rx="4" fill="#07201a" stroke="#ffd166" stroke-width="2"/>
    <rect x="527" y="585" width="18" height="18" rx="4" fill="#07201a" stroke="#ffd166" stroke-width="2"/>
    <g data-s="=7">${flow({ d: 'M440,660 L464,594 L480,560', n: 3, dur: 1.6, r: 10, ion: 'ca' })}${flow({ d: 'M500,600 L500,660', n: 4, dur: 1, r: 6, fill: '#e8f1ff' })}</g>
    <path d="M470,668 C480,650 520,650 530,668 L530,740 L470,740Z" fill="#ffd166" opacity=".85"/>
    <text x="455" y="728" text-anchor="end" class="lb" fill="#ffd166">fibra aferente tipo I (VIII par)</text>
    <g data-s="=7">${flow({ d: 'M500,680 L500,760', n: 3, dur: .6, r: 7, fill: '#ff8a1f' })}</g>
    <!-- K+ sai pela base -->
    <g data-s="7">${flow({ d: 'M600,470 L720,500', n: 3, dur: 2.2, r: 11, ion: 'k' })}</g>
    <!-- voltímetro -->
    <g transform="translate(760,330)">
      <rect x="0" y="0" width="190" height="112" rx="16" fill="#07201a" stroke="rgba(165,232,198,.35)"/>
      <text x="16" y="30" class="ls">potencial da célula</text>
      <text x="16" y="84" class="mono" style="font-size:40px" fill="#cfe2d7" data-s="<7,9">−60 mV</text>
      <text x="16" y="84" class="mono lo" style="font-size:40px" data-s="=7">−40 mV</text>
      <text x="16" y="84" class="mono" style="font-size:40px" fill="#c7b1ff" data-s="=8">−70 mV</text>
    </g>
    <g data-s="=6">
      ${callout(504, 158, 640, 150, 'Tip link (ponte apical)', { anchor: 'start', cls: 'lb lo' })}
      ${callout(464, 194, 330, 175, 'Canal MET', { anchor: 'end', sub: 'mecanotransdutor (TMC1)' })}
      ${callout(544, 104, 640, 90, 'Estereocílio mais alto', { anchor: 'start', cls: 'ls' })}
    </g>
    <g data-s="=7">${tag(740, 150, 'desvio → MAIOR: canais abrem', { o: 1, fs: 16 })}${tag(250, 520, 'Ca²⁺ voltagem-dependente', { fs: 14, fill: '#ffd166' })}${tag(250, 600, 'glutamato → PA no nervo', { fs: 14 })}</g>
    <g data-s="=8">${tag(740, 150, 'desvio → menor: canais fecham', { fs: 16, fill: '#c7b1ff' })}</g>
    <g data-s="7">${tag(780, 520, 'K⁺ sai (KCNQ4)', { fs: 14, fill: '#a5e8c6' })}</g>
  `);

  /* ---------- cena D: CCE e prestina ---------- */
  const cce = svg(`
    <text x="40" y="60" class="lt">Eletromotilidade das CCE</text>
    <style>@keyframes ohcBeat{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.8)}}.fig .beat{transform-box:fill-box;transform-origin:50% 100%;animation:ohcBeat .5s ease-in-out infinite}</style>
    ${[150, 290, 430].map((x, i) => `<g class="beat" style="animation-delay:${i * .08}s"><rect x="${x}" y="150" width="70" height="300" rx="32" fill="#ffb567" stroke="#ff8a1f" stroke-width="3"/>
      ${Array.from({ length: 10 }, (_, j) => `<circle cx="${x + 4}" cy="${175 + j * 27}" r="5" fill="#fff"/><circle cx="${x + 66}" cy="${175 + j * 27}" r="5" fill="#fff"/>`).join('')}
      ${[14, 30, 46].map((d, k) => `<rect x="${x + d}" y="${120 - k * 10}" width="6" height="${32 + k * 10}" fill="#fff"/>`).join('')}</g>`).join('')}
    <line x1="120" y1="460" x2="540" y2="460" stroke="#fff" stroke-width="5"/>
    ${callout(154, 256, 110, 520, 'Prestina na parede lateral', { anchor: 'start', cls: 'lb lo' })}
    ${tag(330, 600, 'despolariza → ENCURTA · hiperpolariza → ALONGA', { o: 1, fs: 15 })}
    <!-- curvas de sintonia -->
    <g transform="translate(600,120)">
      <rect x="0" y="0" width="360" height="420" rx="18" fill="#07201a" stroke="rgba(165,232,198,.25)"/>
      <text x="20" y="34" class="lb">Sensibilidade da cóclea</text>
      <line x1="40" y1="370" x2="340" y2="370" stroke="#5f8a75"/><line x1="40" y1="60" x2="40" y2="370" stroke="#5f8a75"/>
      <text x="190" y="400" text-anchor="middle" class="lx">frequência</text>
      <text x="20" y="215" transform="rotate(-90 20 215)" text-anchor="middle" class="lx">resposta</text>
      <path d="M50,350 C120,340 160,300 180,270 C200,240 215,240 230,270 C250,305 290,345 330,352" fill="none" stroke="#9fc0ae" stroke-width="3" stroke-dasharray="6 5"/>
      <path class="draw" data-s="=9" d="M50,355 C130,350 170,320 184,250 C190,190 194,90 200,86 C206,90 210,190 216,250 C224,320 280,352 330,356" fill="none" stroke="#ff8a1f" stroke-width="4"/>
      <text x="212" y="100" class="lx lo">com CCE:</text><text x="212" y="118" class="lx lo">pico alto e estreito</text>
      <text x="244" y="300" class="lx">sem CCE:</text><text x="244" y="318" class="lx">40–60 dB menor</text>
    </g>
    ${tag(780, 610, 'Emissões otoacústicas = som que a CCE produz', { fs: 15 })}
    ${tag(780, 660, 'base do “teste da orelhinha”', { o: 1, fs: 15 })}
  `);

  /* ---------- cena E: vista de superfície e perda irreversível ---------- */
  const top = svg(`
    <text x="40" y="60" class="lt">Órgão de Corti visto de cima</text>
    <text x="40" y="92" class="ls">base (agudos) à esquerda · ápice (graves) à direita</text>
    ${Array.from({ length: 12 }, (_, i) => {
      const x = 140 + i * 68;
      const dead = i < 4;
      const row = (y, cls, c, deadCell) => deadCell
        ? `<g data-s="=11"><circle cx="${x}" cy="${y}" r="17" fill="#2a3b34"/><path d="M${x - 8},${y - 8} L${x + 8},${y + 8} M${x + 8},${y - 8} L${x - 8},${y + 8}" stroke="#ff6b5e" stroke-width="3"/></g><g data-s="<11"><circle cx="${x}" cy="${y}" r="17" fill="${c}" opacity=".85"/><path d="M${x - 11},${y + 4} L${x},${y - 8} L${x + 11},${y + 4}" stroke="#fff" stroke-width="3" fill="none"/></g>`
        : `<circle cx="${x}" cy="${y}" r="17" fill="${c}" opacity=".85"/><path d="M${x - 11},${y + 4} L${x},${y - 8} L${x + 11},${y + 4}" stroke="#fff" stroke-width="3" fill="none"/>`;
      return row(200, 'ihc', '#62dcc8', false) + row(340, 'ohc', '#ffb567', dead) + row(400, 'ohc', '#ffb567', dead) + row(460, 'ohc', '#ffb567', dead && i < 3);
    }).join('')}
    <text x="40" y="206" class="lb lm" text-anchor="start" dx="-10" style="font-size:15px">CCI</text>
    <text x="40" y="405" class="lb lo" style="font-size:15px">CCE</text>
    <line x1="60" y1="270" x2="940" y2="270" stroke="#a5e8c6" stroke-width="2" stroke-dasharray="8 6"/>
    <text x="940" y="262" text-anchor="end" class="lx">túnel de Corti</text>
    <g data-s="=11">${tag(250, 540, 'ruído / aminoglicosídeos atingem a BASE primeiro', { o: 1, fs: 15 })}${tag(640, 600, 'mamíferos: a célula ciliada morta NÃO volta', { fs: 16, fill: '#ff6b5e' })}${tag(640, 660, 'o espaço vira cicatriz de célula de suporte', { fs: 14 })}</g>
  `);

  /* ---------- cena F: via auditiva ---------- */
  const lv = [['Córtex auditivo primário', 'giro de Heschl · áreas 41/42', 110], ['Corpo geniculado medial', 'tálamo', 210], ['Colículo inferior', 'mesencéfalo', 310], ['Lemnisco lateral', 'ponte', 400], ['Complexo olivar superior', 'ponte · 1º cruzamento', 490], ['Núcleos cocleares', 'bulbo · ipsilaterais', 590]];
  const via = svg(`
    ${lv.map(([t, s, y], i) => `<g data-s="12" style="transition-delay:${(5 - i) * .15}s">${box(330, y - 34, 340, 68, t, s, { fs: 18, sfs: 13, fill: i === 0 ? 'rgba(255,138,31,.2)' : '#123f2f', stroke: i === 0 ? '#ff8a1f' : 'rgba(165,232,198,.45)' })}</g>`).join('')}
    <circle cx="140" cy="690" r="46" fill="none" stroke="#62dcc8" stroke-width="10" stroke-dasharray="200 90"/><text x="140" y="755" text-anchor="middle" class="ls">cóclea E</text>
    <circle cx="860" cy="690" r="46" fill="none" stroke="#62dcc8" stroke-width="10" stroke-dasharray="200 90"/><text x="860" y="755" text-anchor="middle" class="ls">cóclea D</text>
    <path d="M180,670 C250,640 300,610 330,596" stroke="#ffd166" stroke-width="4" fill="none" marker-end="url(#arrY)"/>
    <path d="M820,670 C760,640 700,610 670,596" stroke="#62dcc8" stroke-width="4" fill="none" marker-end="url(#arrC)"/>
    <path d="M430,556 L430,524" stroke="#ffd166" stroke-width="4" marker-end="url(#arrY)"/>
    <path d="M450,556 C520,540 560,530 600,524" stroke="#ffd166" stroke-width="3" marker-end="url(#arrY)" data-hl="=12"/>
    <path d="M570,556 C500,540 460,530 420,524" stroke="#62dcc8" stroke-width="3" marker-end="url(#arrC)" data-hl="=12"/>
    <path d="M500,456 L500,434 M500,366 L500,344 M500,276 L500,244 M500,176 L500,144" stroke="#cfe2d7" stroke-width="4" marker-end="url(#arr)"/>
    ${flow({ d: 'M180,670 C250,640 300,610 330,596 L430,556 L430,500 L500,456 L500,110', n: 7, dur: 4, r: 6, fill: '#ffd166' })}
    ${tag(840, 480, 'aqui nasce a localização do som', { o: 1, fs: 14 })}
    ${tag(840, 110, 'representação bilateral', { fs: 14 })}
    <text x="40" y="60" class="lt">Mnemônico: <tspan fill="#ff8a1f">E · CO · L · I · M · A</tspan></text>
  `);

  DA.topic({
    short: 'Transdução sonora',
    title: 'Transdução <em>sonora</em> e células ciliadas',
    card: 'Rampas, perilinfa × endolinfa, CCI e CCE, estereocílios',
    lede: 'Como uma vibração do ar vira potencial de ação no nervo coclear. O segredo está em um líquido diferente de todos os outros do corpo: a endolinfa.',
    fig: () => `
      <div class="scene" data-s="0-1,=4">${visao}</div>
      <div class="scene" data-s="2-3,=5,=10">${corte}</div>
      <div class="scene" data-s="6-8">${celula}</div>
      <div class="scene" data-s="=9">${cce}</div>
      <div class="scene" data-s="=11">${top}</div>
      <div class="scene" data-s="=12">${via}</div>`,
    steps: [
      {
        k: 'Ar → líquido', t: 'O problema: <em>ar para líquido</em>',
        p: 'O som chega pelo ar, mas a cóclea é cheia de líquido. A membrana timpânica vibra e move <b>martelo → bigorna → estribo</b>. O estribo empurra a <b>janela oval</b> como um pistão e gera uma onda de pressão na perilinfa.',
        why: 'Quando o som passa direto do ar para a água, <b>cerca de 99,9% da energia é refletida</b>, porque a água resiste muito mais ao movimento (impedância maior). A orelha média resolve isso concentrando força: a membrana timpânica tem cerca de <b>17×</b> a área da janela oval e os ossículos funcionam como alavanca (1,3×). A pressão sobe cerca de <b>22×</b>.',
        an: 'Um salto agulha afunda no chão e um tênis não, com o mesmo peso. Concentrar a força numa área pequena aumenta a pressão.',
        deep: '<p>A <b>janela redonda</b> é a válvula de escape: o líquido é incompressível, então quando o estribo empurra a oval para dentro, a redonda abaula para fora. Sem ela, nada se moveria.</p><p>Reflexo estapédico (VII par, músculo estapédio) e tensor do tímpano (V par) enrijecem a cadeia diante de sons fortes. Na paralisia facial, o paciente tem <b>hiperacusia</b>.</p>'
      },
      {
        k: 'As 3 rampas', t: 'As três <em>rampas</em> da cóclea',
        p: 'Em corte, a cóclea tem três tubos enrolados juntos (cerca de 2,5 voltas): <b>rampa vestibular</b> (em cima), <b>rampa média ou ducto coclear</b> (no meio) e <b>rampa timpânica</b> (embaixo). A <b>membrana de Reissner</b> separa vestibular e média. A <b>membrana basilar</b> separa média e timpânica, e sobre ela fica o órgão de Corti.',
        why: 'A vestibular e a timpânica se comunicam no ápice, pelo <b>helicotrema</b>, e por isso têm o mesmo líquido (perilinfa). A rampa média é um saco fechado, com um líquido próprio (endolinfa). Os dois líquidos precisam ficar separados, porque a diferença entre eles é a “bateria” da audição.',
        an: 'Um sanduíche enrolado como caracol: pão de cima (vestibular), recheio (média) e pão de baixo (timpânica). As duas fatias de pão se encostam na ponta (helicotrema).'
      },
      {
        k: 'Perilinfa × endolinfa', t: '<em>Perilinfa × Endolinfa</em>: a pegadinha clássica',
        html: `<table><tr><th></th><th>Perilinfa</th><th>Endolinfa</th></tr>
          <tr><td>Onde</td><td>Rampas vestibular e timpânica</td><td>Rampa média (ducto coclear)</td></tr>
          <tr><td>Parece com</td><td><b>Líquido extracelular</b></td><td><b>Líquido intracelular</b></td></tr>
          <tr><td>Íon dominante</td><td><b style="color:#ff8a1f">Na⁺ alto</b> (≈140 mM), K⁺ baixo</td><td><b style="color:#3fc584">K⁺ alto</b> (≈150 mM), Na⁺ ≈1 mM</td></tr>
          <tr><td>Potencial</td><td>≈ 0 mV</td><td><b>+80 mV</b> (endococlear)</td></tr>
          <tr><td>Quem produz</td><td>Filtrado do plasma/líquor</td><td><b>Estria vascular</b></td></tr></table>`,
        why: 'A <b>estria vascular</b>, na parede lateral da rampa média, bombeia K⁺ para dentro da endolinfa sem parar. Por isso ela é rica em K⁺ e fica <b>+80 mV</b> mais positiva que a perilinfa. É o maior potencial de repouso do corpo, e ele alimenta a transdução.',
        an: 'Para decorar: <b>PERI</b>linfa fica na <b>PERI</b>feria, do lado de fora, então parece extracelular (<b>sódio</b>). <b>ENDO</b>linfa fica dentro, então parece intracelular (<b>potássio</b>).',
        clin: '<b>Doença de Ménière</b>: excesso de endolinfa (hidropsia endolinfática). Causa vertigem em crises, zumbido, plenitude auricular e perda auditiva flutuante.'
      },
      {
        k: 'Tonotopia', t: 'Onda viajante: <em>cada frequência tem seu lugar</em>',
        p: 'A pressão na perilinfa deforma a membrana basilar em uma <b>onda viajante</b> que sai da base e vai para o ápice. Ela cresce até um ponto máximo e morre logo depois. Sons <b>agudos</b> têm o pico <b>perto da base</b> e sons <b>graves</b> têm o pico <b>perto do ápice</b>.',
        why: 'A membrana basilar muda ao longo do caminho. Na base ela é <b>estreita e rígida</b> e vibra melhor em alta frequência. No ápice é <b>larga e frouxa</b> (cerca de 5× mais larga e 100× menos rígida) e vibra melhor em baixa frequência. Cada trecho “entra em ressonância” com uma frequência. O cérebro sabe qual célula ciliada disparou e, por isso, sabe qual foi a frequência: é o <b>código de lugar</b>.',
        an: 'Um piano deitado: cordas curtas e tensas de um lado (agudos) e longas e frouxas do outro (graves).',
        clin: 'Perda por ruído e presbiacusia começam nos <b>agudos</b>, porque toda onda passa primeiro pela base, que “apanha” de todos os sons.'
      },
      {
        k: 'Órgão de Corti', t: 'O <em>órgão de Corti</em> e o cisalhamento',
        p: 'Sobre a membrana basilar ficam <b>1 fileira de células ciliadas internas (CCI)</b>, cerca de 3.500, e <b>3 fileiras de externas (CCE)</b>, cerca de 12.000, sustentadas por células de suporte. Por cima fica a <b>membrana tectória</b>. Os estereocílios das CCE ficam cravados nela. Os das CCI ficam soltos, logo abaixo.',
        why: 'A membrana basilar e a tectória giram em torno de <b>eixos diferentes</b> (uma presa na lâmina espiral óssea, a outra no limbo). Quando a basilar sobe, uma desliza sobre a outra: é o <b>cisalhamento</b>, que dobra os estereocílios. Nas CCI, quem dobra é o <b>fluxo de endolinfa</b> no espaço entre elas e a tectória.',
        an: 'Duas páginas de um livro presas em lombadas diferentes: quando você fecha o livro, uma escorrega sobre a outra.'
      },
      {
        k: 'Estereocílios', t: '<em>Estereocílios</em> em escada e tip links',
        p: 'No topo de cada célula ciliada, os <b>estereocílios</b> estão em fileiras de altura crescente, como uma escada. A ponta de cada um se liga ao vizinho mais alto por um filamento, o <b>tip link</b>. Na ponta do estereocílio mais baixo fica o <b>canal de mecanotransdução (MET)</b>.',
        why: 'O tip link funciona como uma <b>mola presa à porta</b> do canal. Esticá-lo abre o canal e afrouxá-lo fecha. Em repouso, cerca de <b>10–15% dos canais já estão abertos</b>. Por isso a célula consegue sinalizar para os dois lados: abrir mais (despolarizar) ou fechar os que estavam abertos (hiperpolarizar).',
        an: 'Uma porta de saloon presa por um barbante: puxe o barbante e ela abre, solte e ela fecha.',
        deep: '<p>Tip links são formados por <b>caderina-23</b> (parte superior) e <b>protocaderina-15</b> (parte inferior). Mutações causam a síndrome de Usher (surdez + retinose pigmentar). O canal MET depende de <b>TMC1/TMC2</b>. Na cóclea madura <b>não há cinocílio</b> (ele some no desenvolvimento). No vestíbulo ele persiste.</p>'
      },
      {
        k: 'K⁺ entra', t: 'Para o lado do maior: <em>K⁺ entra e despolariza</em>',
        p: 'Quando o feixe se inclina <b>para o estereocílio mais alto</b>, os tip links esticam, os canais MET abrem e o <b>K⁺ da endolinfa entra</b>. A célula despolariza (de cerca de −60 para −40 mV). Na base, canais de <b>Ca²⁺ dependentes de voltagem</b> abrem, o Ca²⁺ entra e dispara a liberação de <b>glutamato</b> na fibra aferente, que gera potenciais de ação no nervo coclear.',
        why: 'Em qualquer neurônio, abrir canal de K⁺ faz o K⁺ <b>sair</b>. Aqui ele <b>entra</b>, porque o topo da célula está na endolinfa: fora, o K⁺ é tão alto quanto dentro (quase não há gradiente químico), mas fora está a <b>+80 mV</b> e dentro a <b>−60 mV</b>. São cerca de <b>140 mV</b> empurrando o K⁺ para dentro. A célula despolariza <b>sem gastar ATP</b>, usando a bateria da estria vascular.',
        an: 'Uma represa (estria vascular) mantém a água lá no alto. A célula ciliada só abre a comporta e a energia já está pronta.',
        deep: '<p>A mudança na célula ciliada é um <b>potencial receptor (graduado)</b>: quanto mais o feixe inclina, maior a despolarização. Ela não dispara potencial de ação. Quem dispara é a fibra do gânglio espiral.</p><p>O K⁺ que entrou sai pela membrana basolateral (canais <b>KCNQ4</b>) para um meio pobre em K⁺ e volta à estria vascular por células de suporte ligadas por junções comunicantes (<b>conexina 26</b>). Mutações em GJB2 (conexina 26) são a <b>causa genética mais comum de surdez</b> não sindrômica.</p><p>A sinapse da CCI é uma <b>sinapse em fita (ribbon)</b>, especializada em liberar glutamato de forma contínua e muito rápida.</p>'
      },
      {
        k: 'Hiperpolariza', t: 'Para o lado do menor: <em>canais fecham</em>',
        p: 'Na outra metade da vibração, o feixe inclina <b>para o estereocílio menor</b>. Os tip links afrouxam e até os canais que estavam abertos em repouso <b>fecham</b>. Menos K⁺ entra e a célula <b>hiperpolariza</b> (cerca de −70 mV). Liberando menos glutamato, a fibra dispara menos.',
        why: 'O som é uma oscilação, então o feixe vai e volta centenas ou milhares de vezes por segundo. O potencial da célula acompanha esse vaivém, e a frequência de disparo da fibra, que sobe e desce, carrega a informação de <b>intensidade e tempo</b> do som.',
        an: 'Uma torneira que já vive meio aberta: você pode abrir mais ou fechar, e assim o sinal funciona nos dois sentidos.'
      },
      {
        k: 'Amplificador', t: 'CCE: o <em>amplificador coclear</em>',
        p: 'As CCE quase não mandam informação ao cérebro. O trabalho delas é <b>mecânico</b>. A proteína <b>prestina</b>, na parede lateral, faz a célula <b>encurtar quando despolariza</b> e <b>alongar quando hiperpolariza</b>, milhares de vezes por segundo. Isso empurra a membrana basilar no ritmo do som.',
        why: 'O líquido da cóclea amortece a vibração (atrito viscoso). As CCE devolvem energia no lugar exato do pico, o que dá cerca de <b>40–50 dB</b> de ganho (até 100× em amplitude) e deixa o pico <b>estreito</b>. É isso que permite distinguir frequências muito próximas.',
        an: 'Empurrar uma criança no balanço bem no tempo certo: um empurrão pequeno a cada ida faz o balanço subir alto.',
        clin: 'As CCE geram sons próprios, as <b>emissões otoacústicas</b>. O “teste da orelhinha” capta esses sons. Se há emissão, as CCE estão vivas.'
      },
      {
        k: 'CCI × CCE', t: '<em>CCI × CCE</em>: quem faz o quê',
        html: `<table><tr><th></th><th>CCI (internas)</th><th>CCE (externas)</th></tr>
          <tr><td>Quantidade</td><td>≈ 3.500 · 1 fileira</td><td>≈ 12.000 · 3 fileiras</td></tr>
          <tr><td>Função</td><td><b>Receptor sensorial</b>: transforma som em sinal</td><td><b>Amplificador</b>: prestina e eletromotilidade</td></tr>
          <tr><td>Aferência</td><td>≈ 95% das fibras (tipo I)</td><td>≈ 5% (tipo II)</td></tr>
          <tr><td>Eferência</td><td>Pouca (lateral, nas fibras)</td><td>Muita (olivococlear medial)</td></tr>
          <tr><td>Estereocílios</td><td>Livres</td><td>Cravados na tectória</td></tr>
          <tr><td>Se perder</td><td>Surdez naquela faixa</td><td>Perda de 40–60 dB e da seletividade</td></tr></table>`,
        why: 'Divisão de trabalho: poucas células (CCI) “escutam”, cada uma ligada a 10–20 fibras nervosas, e muitas células (CCE) “aumentam o volume”. O cérebro ainda ajusta esse volume pela via eferente (olivococlear medial), o que protege contra ruído e ajuda a ouvir em ambientes barulhentos.'
      },
      {
        k: 'Irregeneráveis', t: 'Células ciliadas <em>não regeneram</em>',
        p: 'Nos mamíferos, as células ciliadas da cóclea são <b>pós-mitóticas</b>: param de se dividir antes do nascimento. As células de suporte não conseguem virar células ciliadas novas. Toda <b>CCI</b> ou CCE perdida é perdida para sempre, e o lugar dela vira uma cicatriz de célula de suporte.',
        why: 'Aves e peixes regeneram células ciliadas: as células de suporte reativam genes do desenvolvimento (como <b>Atoh1</b>) e se transformam. Nos mamíferos essa via fica bloqueada depois do nascimento, possivelmente em troca da estrutura extremamente precisa do órgão de Corti. A perda da <b>CCI</b> é a mais grave, porque sem ela não há sinal nenhum para o nervo.',
        an: 'Um teclado sem tecla reserva: a tecla que quebrou nunca mais toca.',
        clin: 'Causas: <b>ruído</b> (entalhe em 4 kHz na audiometria), <b>aminoglicosídeos</b>, <b>cisplatina</b>, idade (presbiacusia). O <b>implante coclear</b> pula as células ciliadas e estimula direto o gânglio espiral.'
      },
      {
        k: 'Via central', t: 'Do nervo ao córtex: <em>E-CO-L-I-M-A</em>',
        p: '<b>E</b>spiral (gânglio) → <b>CO</b>cleares (núcleos, no bulbo) → o<b>L</b>ivar superior (ponte, onde as vias cruzam) → lemn<b>I</b>sco lateral → colículo <b>I</b>nferior → <b>M</b>edial (corpo geniculado, no tálamo) → <b>A</b>uditivo primário (áreas <b>41/42</b>, giro de Heschl).',
        why: 'O <b>complexo olivar superior</b> é o primeiro lugar que recebe as duas orelhas. Ele compara o <b>tempo de chegada</b> (graves) e a <b>intensidade</b> (agudos) entre elas para localizar a fonte do som. Como a informação cruza e sobe pelos dois lados, uma lesão em um único córtex auditivo <b>não</b> deixa a pessoa surda de um ouvido.',
        clin: 'Surdez unilateral indica lesão <b>periférica</b> (cóclea, nervo ou núcleo coclear). Exemplo clássico: <b>schwannoma vestibular</b> no ângulo pontocerebelar.'
      }
    ],
    legend: [
      ['Membrana timpânica', 'Vibra com o ar. Tem cerca de 17× a área da janela oval, o que concentra a pressão.'],
      ['Martelo, bigorna, estribo', 'Alavanca (1,3×) que leva a vibração até a janela oval. Casamento de impedância ar → líquido.'],
      ['Janela oval / janela redonda', 'Entrada (estribo) e saída de pressão da perilinfa. A redonda abaula para compensar, porque o líquido é incompressível.'],
      ['Rampa vestibular', 'Tubo superior com perilinfa. Começa na janela oval.'],
      ['Rampa média (ducto coclear)', 'Tubo do meio, fechado, com endolinfa (K⁺ alto, +80 mV). Contém o órgão de Corti.'],
      ['Rampa timpânica', 'Tubo inferior com perilinfa. Termina na janela redonda.'],
      ['Helicotrema', 'Comunicação entre as rampas vestibular e timpânica no ápice.'],
      ['Membrana de Reissner', 'Separa a rampa vestibular da média.'],
      ['Membrana basilar', 'Separa a rampa média da timpânica e sustenta o órgão de Corti. É estreita e rígida na base (agudos) e larga e flexível no ápice (graves).'],
      ['Estria vascular', 'Epitélio vascularizado da parede lateral. Secreta K⁺ na endolinfa e gera o potencial endococlear de +80 mV.'],
      ['Membrana tectória', 'Gel acelular sobre o órgão de Corti. O cisalhamento contra ela inclina os estereocílios.'],
      ['Células ciliadas internas (CCI)', 'Receptor sensorial verdadeiro: 1 fileira, cerca de 3.500. Recebem 95% das fibras aferentes (tipo I). Não regeneram.'],
      ['Células ciliadas externas (CCE)', 'Amplificador coclear: 3 fileiras, cerca de 12.000. A prestina dá eletromotilidade (+40–50 dB e seletividade). Recebem eferência olivococlear. Não regeneram.'],
      ['Estereocílios', 'Microvilosidades rígidas de actina em escada. Inclinar para o mais alto abre os canais e despolariza. Inclinar para o menor fecha os canais e hiperpolariza.'],
      ['Tip links', 'Filamentos (caderina-23 + protocaderina-15) que puxam a porta do canal MET.'],
      ['Canal MET (TMC1/2)', 'Canal de mecanotransdução na ponta dos estereocílios. Deixa entrar K⁺ (e Ca²⁺) da endolinfa.'],
      ['Prestina', 'Proteína motora da parede lateral das CCE. Encurta a célula na despolarização e a alonga na hiperpolarização.'],
      ['Gânglio espiral', 'Corpos dos neurônios bipolares aferentes, no modíolo. Formam o nervo coclear (VIII).'],
      ['Complexo olivar superior', 'Primeiro núcleo binaural. Localiza o som. Origina a via eferente olivococlear.'],
      ['Colículo inferior / corpo geniculado medial', 'Estações mesencefálica e talâmica da via auditiva.'],
      ['Córtex auditivo primário (41/42)', 'Giro temporal transverso de Heschl, com organização tonotópica.']
    ],
    clinic: [
      'Endolinfa = K⁺ alto (parece intracelular). Perilinfa = Na⁺ alto (parece extracelular). Pegadinha frequente em prova.',
      'Na célula ciliada, o K⁺ ENTRA e despolariza, graças ao potencial endococlear de +80 mV.',
      'Base = agudos; ápice = graves. Perda por ruído: entalhe em 4 kHz.',
      'Aminoglicosídeos (gentamicina, amicacina), cisplatina e furosemida em dose alta são ototóxicos. A lesão começa pelas CCE da base.',
      'Emissões otoacústicas avaliam as CCE (triagem neonatal). O PEATE (BERA) avalia a via neural.',
      'Rinne e Weber: na perda condutiva, o Weber lateraliza para o ouvido doente. Na neurossensorial, para o ouvido bom.',
      'Conexina 26 (GJB2) é a causa genética mais comum de surdez não sindrômica, por falha na reciclagem do K⁺.',
      'Lesão cortical unilateral não causa surdez unilateral, porque a via é bilateral a partir do olivar superior.',
      'Células ciliadas de mamíferos não regeneram. O implante coclear estimula direto o gânglio espiral.'
    ]
  });
})();
