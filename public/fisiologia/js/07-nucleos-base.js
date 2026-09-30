/* 07 · Cerebelo e núcleos da base: vias direta e indireta, Parkinson */
(function () {
  const { svg, flow, callout, tag, box, sign } = H;
  const GL = '#3fc584', GA = '#ff6b5e', DOP = '#ffb567';

  /* ---------- cena A: corte coronal ---------- */
  const coronal = svg(`
    <path d="M880,40 C640,30 300,80 160,250 C90,340 110,470 190,560 C250,630 380,690 520,700 C640,708 760,690 880,700Z" fill="#3a2a26" stroke="#b86d5e" stroke-width="3" opacity=".9"/>
    <path d="M880,58 C650,50 320,98 180,260 C118,345 134,462 206,546 C262,610 384,668 520,680 C640,688 760,672 880,682" fill="none" stroke="#e7a795" stroke-width="22" opacity=".35"/>
    <path d="M870,160 C820,150 770,175 760,215 C752,250 790,270 840,262 C860,258 870,245 872,230Z" fill="#62dcc8" opacity=".75"/>
    <path d="M650,190 L700,200 L745,520 L700,530Z" fill="#efe2cc" opacity=".85"/>
    <g data-hl="=2"><ellipse cx="720" cy="258" rx="42" ry="58" fill="#ffb567"/><ellipse cx="515" cy="390" rx="72" ry="118" fill="#ffb567"/></g>
    <path d="M740,300 C770,340 760,380 730,400" stroke="#ffb567" stroke-width="10" fill="none" opacity=".6"/>
    <ellipse cx="596" cy="400" rx="30" ry="86" fill="#a5e8c6" data-hl="=2"/>
    <ellipse cx="636" cy="408" rx="20" ry="60" fill="#2fa36c" data-hl="=2"/>
    <ellipse cx="808" cy="410" rx="68" ry="72" fill="#c7b1ff" opacity=".9"/>
    <path d="M876,370 L876,500" stroke="#62dcc8" stroke-width="8"/>
    <ellipse cx="770" cy="528" rx="36" ry="13" fill="#ffd166" data-hl="=2"/>
    <path d="M690,596 C730,580 790,572 850,580" stroke="#1a0f0b" stroke-width="16" fill="none" stroke-linecap="round" data-hl="=2"/>
    <path d="M700,616 C740,604 790,598 850,604" stroke="#b5463e" stroke-width="12" fill="none" stroke-linecap="round"/>
    <path d="M420,280 C400,340 400,440 420,500" stroke="#efe2cc" stroke-width="4" fill="none" opacity=".6"/>
    ${callout(720, 240, 620, 120, 'Núcleo caudado', { anchor: 'middle', cls: 'lb lo' })}
    ${callout(500, 330, 330, 180, 'Putâmen', { anchor: 'middle', cls: 'lb lo', sub: 'caudado + putâmen = ESTRIADO' })}
    ${callout(596, 450, 450, 610, 'Globo pálido externo (GPe)', { anchor: 'middle', cls: 'lb lm' })}
    ${callout(640, 420, 560, 740, 'Globo pálido interno (GPi)', { anchor: 'middle', cls: 'lb', dot: '#3fc584' })}
    ${callout(808, 400, 960, 330, 'Tálamo', { anchor: 'end', cls: 'lb', dot: '#c7b1ff' })}
    ${callout(770, 528, 960, 500, 'Núcleo subtalâmico', { anchor: 'end', cls: 'lb', dot: '#ffd166' })}
    ${callout(800, 578, 960, 650, 'Subst. negra compacta', { anchor: 'end', cls: 'lb', dot: '#1a0f0b' })}
    ${callout(820, 603, 960, 720, 'Subst. negra reticulada', { anchor: 'end', cls: 'ls', dot: '#b5463e' })}
    ${callout(700, 360, 800, 180, 'Cápsula interna', { anchor: 'start', cls: 'ls' })}
  `);

  /* ---------- cena B: circuito ---------- */
  const E = {
    cD1: 'M410,100 L410,180', cD2: 'M650,100 L650,180',
    dir: 'M410,262 L410,598', d2gpe: 'M660,262 L700,328',
    gpe2nst: 'M720,392 L720,468', nst2gpi: 'M680,530 C620,560 560,590 522,612',
    gpi2th: 'M300,635 L244,635', th2cx: 'M140,598 L140,70 L296,70',
    da1: 'M240,212 L298,212', da2: 'M240,236 C320,300 500,300 590,264',
    hyper: 'M760,80 C840,200 840,360 800,466'
  };
  const edge = (k, c, w, extra = '') => `<path d="${E[k]}" stroke="${c}" stroke-width="${w}" fill="none" class="edge e-${k}" ${extra}/>`;
  const circuito = svg(`
    <style>
      .fig .edge{transition:stroke-width .6s, opacity .6s}
      .fig .pd .e-dir,.fig .pd .e-th2cx,.fig .pd .e-gpe2nst{stroke-width:2px;opacity:.45}
      .fig .pd .e-d2gpe,.fig .pd .e-nst2gpi,.fig .pd .e-gpi2th{stroke-width:12px}
      .fig .pd .e-da1,.fig .pd .e-da2{opacity:.12}
      .fig .pd .snc rect{fill:#2a2622;stroke:#5f5a55}
    </style>
    <g data-cls="pd:=9">
      ${box(300, 30, 460, 70, 'Córtex motor', 'glutamato (+)', { fs: 22, stroke: '#cfe2d7' })}
      <g class="snc">${box(40, 180, 200, 80, 'SNc', 'dopamina', { fs: 22, fill: 'rgba(255,181,103,.18)', stroke: DOP })}</g>
      ${box(300, 180, 220, 82, 'Estriado · D1', 'via DIRETA', { fs: 20, fill: 'rgba(63,197,132,.16)', stroke: GL })}
      ${box(540, 180, 220, 82, 'Estriado · D2', 'via INDIRETA', { fs: 20, fill: 'rgba(255,107,94,.14)', stroke: GA })}
      ${box(620, 328, 200, 64, 'GPe', 'GABA (−)', { fs: 20 })}
      ${box(620, 468, 200, 64, 'Núcleo subtalâmico', 'glutamato (+)', { fs: 17, stroke: '#ffd166' })}
      ${box(300, 600, 220, 70, 'GPi / SNr', 'GABA (−) · saída', { fs: 20, stroke: '#ff6b5e' })}
      ${box(40, 600, 204, 70, 'Tálamo VA/VL', 'glutamato (+)', { fs: 19, stroke: '#c7b1ff' })}
      ${edge('cD1', '#cfe2d7', 5, 'marker-end="url(#arr)"')}${edge('cD2', '#cfe2d7', 5, 'marker-end="url(#arr)"')}
      ${edge('dir', GL, 6, 'marker-end="url(#arrG)" data-hl="=6"')}
      ${edge('d2gpe', GA, 6, 'marker-end="url(#arrR)" data-hl="=7"')}
      ${edge('gpe2nst', GA, 6, 'marker-end="url(#arrR)" data-hl="=7"')}
      ${edge('nst2gpi', '#ffd166', 6, 'marker-end="url(#arrY)" data-hl="=7"')}
      ${edge('gpi2th', GA, 7, 'marker-end="url(#arrR)" data-hl="=5"')}
      ${edge('th2cx', '#c7b1ff', 6, 'marker-end="url(#arr)"')}
      ${edge('da1', DOP, 5, 'marker-end="url(#arrO)" data-hl="=8"')}
      ${edge('da2', DOP, 5, 'marker-end="url(#arrO)" data-hl="=8" stroke-dasharray="10 7"')}
      <g data-s="=7"><path d="${E.hyper}" stroke="#ffd166" stroke-width="3" stroke-dasharray="6 8" fill="none" marker-end="url(#arrY)"/><text x="850" y="250" class="lx" fill="#ffd166">hiperdireta</text></g>
      ${sign(430, 140, true)}${sign(670, 140, true)}${sign(430, 430, false)}${sign(705, 296, false)}${sign(745, 430, false)}${sign(590, 568, true)}${sign(272, 620, false)}${sign(160, 330, true)}
      <g data-s="8">${sign(268, 196, true)}${tag(268, 160, 'D1: excita', { fs: 13, fill: GL })}${sign(420, 300, false)}${tag(470, 330, 'D2: inibe', { fs: 13, fill: GA })}</g>
      <path d="M760,52 L940,52" stroke="#cfe2d7" stroke-width="4" marker-end="url(#arr)"/><text x="850" y="40" text-anchor="middle" class="ls">→ tronco e medula</text>
    </g>
    <!-- medidor de movimento -->
    <g transform="translate(830,560)">
      <rect x="0" y="0" width="150" height="140" rx="16" fill="#07201a" stroke="rgba(165,232,198,.3)"/>
      <text x="75" y="28" text-anchor="middle" class="lx">movimento</text>
      <rect x="55" y="40" width="40" height="86" rx="8" fill="#123f2f"/>
      <rect x="55" y="96" width="40" height="30" rx="8" fill="#9fc0ae" data-s="<6,=7,10"/>
      <rect x="55" y="48" width="40" height="78" rx="8" fill="#3fc584" data-s="=6,=8"/>
      <rect x="55" y="118" width="40" height="8" rx="4" fill="#ff6b5e" data-s="=9"/>
    </g>
    <!-- fluxos -->
    <g data-s="=6">${flow({ d: 'M410,100 L410,598', n: 5, dur: 2, r: 7, fill: GL })}${flow({ d: E.th2cx, n: 6, dur: 2.6, r: 7, fill: '#c7b1ff' })}</g>
    <g data-s="=7">${flow({ d: 'M650,100 L650,180 L660,262 L700,328 L720,392 L720,468 C620,560 560,590 522,612 L300,635 L244,635', n: 8, dur: 4, r: 7, fill: GA })}</g>
    <g data-s="=5">${flow({ d: E.gpi2th, n: 3, dur: 1, r: 7, fill: GA })}</g>
    <g data-s="=8">${flow({ d: E.da1, n: 3, dur: 1.2, r: 7, fill: DOP })}${flow({ d: E.da2, n: 5, dur: 2.2, r: 7, fill: DOP })}</g>
    <g data-s="=9">${flow({ d: E.gpi2th, n: 5, dur: .8, r: 8, fill: GA })}${flow({ d: 'M720,468 C620,560 560,590 522,612', n: 5, dur: 1.2, r: 7, fill: '#ffd166' })}</g>
    <g data-s="=5">${tag(270, 720, 'GPi dispara sem parar → tálamo freado', { o: 1, fs: 15 })}</g>
    <g data-s="=6">${tag(270, 720, '(−) × (−) = (+): tira o freio do tálamo', { fs: 15, fill: GL })}</g>
    <g data-s="=7">${tag(270, 720, 'mais GPi → tálamo MAIS freado', { fs: 15, fill: GA })}</g>
    <g data-s="=9">${tag(270, 720, 'sem dopamina: freio puxado com força', { o: 1, fs: 15 })}</g>
  `);

  /* ---------- cena C: peças do Parkinson ---------- */
  const pin = (x, y, n, s) => `<g data-s="${s}"><circle cx="${x}" cy="${y}" r="26" fill="#ff8a1f" stroke="#fff" stroke-width="4"/><text x="${x}" y="${y + 9}" text-anchor="middle" class="mono" style="font-size:25px;stroke:none" fill="#1a0d00">${n}</text></g>`;
  const ring = (x, y, r, c, s) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${c}" stroke-width="6" stroke-dasharray="14 8" data-s="${s}"/>`;
  const macro = svg(`<image href="img/pd-macro.jpg" width="1512" height="567"/>
    ${ring(250, 335, 90, '#ff8a1f', '=10')}${ring(480, 330, 60, '#ff8a1f', '=10')}${ring(1022, 335, 90, '#9fc0ae', '=10')}${ring(1242, 330, 60, '#9fc0ae', '=10')}
    ${pin(150, 240, 1, '=10')}${pin(920, 240, 2, '=10')}`, '0 0 1512 567');
  const micro = svg(`<image href="img/pd-nissl.jpg" width="1512" height="468"/><image href="img/pd-th.jpg" y="480" width="1512" height="471"/>
    ${pin(380, 60, 3, '=11')}${pin(1130, 60, 4, '=11')}${pin(380, 545, 5, '=11')}${pin(1130, 545, 6, '=11')}`, '0 0 1512 951');
  const histo = svg(`<image href="img/histo-parkinson.jpg" width="1536" height="1152"/>
    ${[[1362, 912], [587, 138], [272, 912], [866, 885]].map(([x, y]) => ring(x, y, 34, '#ffd166', '=12')).join('')}
    ${[[1160, 300], [430, 245]].map(([x, y]) => ring(x, y, 100, '#62dcc8', '=12')).join('')}
    ${[[533, 480], [193, 473], [853, 673]].map(([x, y]) => ring(x, y, 70, '#ff8a1f', '=12')).join('')}
    ${pin(1440, 830, 'L', '=12')}${pin(1290, 230, 'N', '=12')}${pin(640, 400, 'M', '=12')}`, '0 0 1536 1152');

  /* ---------- cena D: cerebelo ---------- */
  const cereb = svg(`
    <text x="500" y="46" text-anchor="middle" class="lt">Cerebelo (vista posterior, “aberto”)</text>
    <path d="M120,330 C120,170 300,90 500,90 C700,90 880,170 880,330 C880,470 720,540 500,540 C280,540 120,470 120,330Z" fill="#f0a08f" opacity=".2"/>
    <path d="M120,330 C120,170 300,90 380,92 L380,538 C260,530 120,470 120,330Z" fill="#ff8a1f" opacity=".42" data-hl="=14"/>
    <path d="M880,330 C880,170 700,90 620,92 L620,538 C740,530 880,470 880,330Z" fill="#ff8a1f" opacity=".42" data-hl="=14"/>
    <rect x="380" y="92" width="80" height="446" fill="#ffd166" opacity=".45"/><rect x="540" y="92" width="80" height="446" fill="#ffd166" opacity=".45"/>
    <rect x="460" y="92" width="80" height="446" fill="#ffd166" opacity=".7"/>
    <ellipse cx="500" cy="600" rx="44" ry="30" fill="#62dcc8" opacity=".75"/><ellipse cx="330" cy="590" rx="60" ry="26" fill="#62dcc8" opacity=".75"/><ellipse cx="670" cy="590" rx="60" ry="26" fill="#62dcc8" opacity=".75"/>
    ${[160, 220, 280, 400, 460].map(y => `<path d="M140,${y} C300,${y - 20} 700,${y - 20} 860,${y}" stroke="#07201a" stroke-opacity=".35" stroke-width="2" fill="none"/>`).join('')}
    <!-- núcleos profundos -->
    <circle cx="500" cy="330" r="16" fill="#07201a" stroke="#62dcc8" stroke-width="4"/>
    <circle cx="446" cy="336" r="13" fill="#07201a" stroke="#ffd166" stroke-width="4"/><circle cx="554" cy="336" r="13" fill="#07201a" stroke="#ffd166" stroke-width="4"/>
    <path d="M300,300 q20,-20 40,0 q20,20 40,0 q10,40 -20,56 q-30,10 -60,-10 q-16,-24 0,-46z" fill="#07201a" stroke="#ff8a1f" stroke-width="4"/>
    <path d="M700,300 q-20,-20 -40,0 q-20,20 -40,0 q-10,40 20,56 q30,10 60,-10 q16,-24 0,-46z" fill="#07201a" stroke="#ff8a1f" stroke-width="4"/>
    <g data-s="=14">
      ${tag(225, 230, 'CEREBROCEREBELO', { o: 1, fs: 15 })}${tag(225, 262, 'planeja e dá o tempo', { fs: 13 })}
      ${tag(500, 130, 'ESPINOCEREBELO', { fs: 15, fill: '#ffd166' })}${tag(500, 162, 'vermis + intermédia: executa e postura', { fs: 13 })}
      ${tag(500, 660, 'VESTIBULOCEREBELO (floculonodular): equilíbrio e olhos', { fs: 15, fill: '#62dcc8' })}
      ${callout(500, 330, 560, 420, 'Fastigial', { anchor: 'start', cls: 'ls' })}
      ${callout(446, 336, 380, 440, 'Interpósito', { anchor: 'end', cls: 'ls' })}
      ${callout(340, 320, 200, 420, 'Denteado', { anchor: 'end', cls: 'lb lo' })}
    </g>
  `);
  const comp = svg(`
    ${box(60, 40, 300, 76, 'Córtex motor', 'INTENÇÃO (plano)', { fs: 20, stroke: '#cfe2d7' })}
    ${box(60, 250, 300, 64, 'Núcleos pontinos', '', { fs: 18 })}
    ${box(560, 210, 380, 130, '', '', { fs: 18, stroke: '#ff8a1f', fill: 'rgba(255,138,31,.1)' })}
    <text x="750" y="240" text-anchor="middle" class="lb">Córtex cerebelar</text>
    ${[620, 700, 780, 860].map(x => `<path d="M${x},330 L${x},300 M${x},300 C${x - 20},270 ${x - 30},260 ${x - 34},250 M${x},300 C${x + 20},270 ${x + 30},260 ${x + 34},250 M${x},290 L${x},255" stroke="#ff8a1f" stroke-width="2.5" fill="none"/><circle cx="${x}" cy="330" r="8" fill="#ff8a1f"/>`).join('')}
    ${box(560, 450, 380, 64, 'Núcleo denteado', 'saída do cerebelo', { fs: 18, stroke: '#ff8a1f' })}
    ${box(60, 450, 300, 64, 'Tálamo VL', '', { fs: 18, stroke: '#c7b1ff' })}
    ${box(560, 610, 380, 64, 'Oliva inferior', 'sinal de ERRO', { fs: 18, stroke: '#ff6b5e' })}
    ${box(60, 610, 300, 64, 'Medula e músculos', 'EXECUÇÃO real', { fs: 18, stroke: '#62dcc8' })}
    <path d="M210,116 L210,246" stroke="#cfe2d7" stroke-width="4" marker-end="url(#arr)"/>
    <path d="M360,282 L556,282" stroke="#cfe2d7" stroke-width="4" marker-end="url(#arr)"/><text x="458" y="270" text-anchor="middle" class="lx">fibras musgosas (cruzam)</text>
    <path d="M750,340 L750,446" stroke="#ff6b5e" stroke-width="5" marker-end="url(#arrR)"/><text x="762" y="400" class="lx" fill="#ff9a90">Purkinje: GABA (−)</text>
    <path d="M556,482 L364,482" stroke="#ff8a1f" stroke-width="5" marker-end="url(#arrO)"/><text x="458" y="470" text-anchor="middle" class="lx">ped. cerebelar superior (cruza)</text>
    <path d="M110,450 L110,120" stroke="#c7b1ff" stroke-width="4" marker-end="url(#arr)"/><text x="100" y="360" text-anchor="end" class="lx" fill="#c7b1ff" transform="rotate(-90 100 360)">correção</text>
    <path d="M40,78 C10,200 10,560 56,640" stroke="#cfe2d7" stroke-width="3" stroke-dasharray="6 6" fill="none" marker-end="url(#arr)"/>
    <path d="M360,630 C460,560 520,400 600,344" stroke="#62dcc8" stroke-width="4" fill="none" marker-end="url(#arrC)"/><text x="470" y="590" class="lx" fill="#62dcc8">espinocerebelar</text>
    <path d="M750,610 L750,344" stroke="#ff6b5e" stroke-width="3" stroke-dasharray="8 6" marker-end="url(#arrR)" transform="translate(120,0)"/><text x="880" y="560" class="lx" fill="#ff9a90">trepadeiras</text>
    ${flow({ d: 'M210,116 L210,282 L556,282 L750,300 L750,482 L364,482 L110,482 L110,120', n: 8, dur: 5, r: 7, fill: '#ff8a1f' })}
    ${tag(750, 730, 'compara o plano com o que aconteceu e corrige', { o: 1, fs: 16 })}
  `);

  DA.topic({
    id: 'nucleos-da-base', section: 'Encéfalo e motricidade',
    short: 'Núcleos da base e cerebelo',
    title: 'Cerebelo e <em>núcleos da base</em>: vias e Parkinson',
    card: 'Via direta e indireta, D1/D2, SNc/SNr, Parkinson, cerebelo',
    lede: 'O córtex motor dá a ordem, mas dois conselheiros decidem o resto: os núcleos da base escolhem SE e QUANTO se move, e o cerebelo cuida de COMO o movimento sai certo.',
    fig: () => `
      <div class="scene" data-s="=0,2-3">${coronal}</div>
      <div class="scene" data-s="=1,4-9">${circuito}</div>
      <div class="scene" data-s="=10">${macro}</div>
      <div class="scene" data-s="=11">${micro}</div>
      <div class="scene" data-s="=12">${histo}</div>
      <div class="scene" data-s="=13">${circuito.replace('data-cls="pd:=9"', 'class="pd"')}</div>
      <div class="scene" data-s="=14">${cereb}</div>
      <div class="scene" data-s="15-16">${comp}</div>`,
    steps: [
      {
        k: 'Os conselheiros', t: 'Dois <em>conselheiros</em> do córtex motor',
        p: 'Nem os núcleos da base nem o cerebelo mandam fibras direto para a medula. Os dois formam <b>alças</b>: recebem do córtex, processam e devolvem ao córtex motor <b>pelo tálamo</b>, ajustando a ordem antes de ela descer.',
        keys: ['<b>Núcleos da base</b>: <b>seleção</b>. Qual movimento, se ele sai e com que amplitude. Liberam o desejado e freiam os concorrentes.', '<b>Cerebelo</b>: <b>coordenação</b>. Compara o planejado com o executado e corrige força, direção e tempo.'],
        why: 'Por isso as lesões deles não causam paralisia, e sim movimentos <b>mal escolhidos</b> (pouco demais: Parkinson; demais: coreia) ou <b>mal executados</b> (ataxia).',
        an: 'O córtex é o motorista. Os núcleos da base são o <b>acelerador e o freio</b>. O cerebelo é o <b>GPS com correção de rota</b>.'
      },
      {
        k: 'Anatomia', t: 'Quem são os <em>núcleos da base</em>',
        keys: ['<b>Estriado</b> = núcleo caudado + putâmen (o <b>núcleo accumbens</b> é o estriado ventral, ligado à recompensa).', '<b>Globo pálido</b>: externo (<b>GPe</b>) e interno (<b>GPi</b>). Lentiforme = putâmen + globo pálido.', '<b>Núcleo subtalâmico (NST)</b>, abaixo do tálamo.', '<b>Substância negra</b> (mesencéfalo): <b>pars compacta (SNc)</b>, escura, e <b>pars reticulata (SNr)</b>.'],
        why: 'O nome “estriado” vem das pontes de substância cinzenta que cruzam a cápsula interna entre caudado e putâmen: vistas no corte, parecem estrias. Caudado e putâmen são o <b>mesmo núcleo</b>, separado pela cápsula interna durante o desenvolvimento.'
      },
      {
        k: 'Função de cada um', t: 'O papel de <em>cada núcleo</em>',
        html: `<table><tr><th>Núcleo</th><th>Papel no circuito</th><th>Transmissor</th></tr>
          <tr><td><b>Estriado</b></td><td><b>Entrada</b>: recebe o córtex (glutamato) e a SNc (dopamina)</td><td>GABA (−)</td></tr>
          <tr><td><b>GPi</b></td><td><b>Saída</b>: freia o tálamo sem parar</td><td>GABA (−)</td></tr>
          <tr><td><b>SNr</b></td><td><b>Saída</b> “gêmea” do GPi para cabeça e olhos (colículo superior)</td><td>GABA (−)</td></tr>
          <tr><td><b>GPe</b></td><td>Intermediário da via indireta: segura o NST</td><td>GABA (−)</td></tr>
          <tr><td><b>NST</b></td><td>O <b>único excitatório</b>: acelera o GPi (mais freio)</td><td>Glutamato (+)</td></tr>
          <tr><td><b>SNc</b></td><td><b>Moduladora</b>: dopamina para o estriado</td><td>Dopamina</td></tr></table>`,
        why: 'Quase tudo aqui é <b>inibitório</b>. A lógica do circuito é de “inibir quem inibe”. Por isso é preciso contar os sinais em cada etapa: dois “menos” seguidos dão um “mais”.'
      },
      {
        k: 'Neurônios estriatais', t: 'Neurônios do estriado: <em>D1 × D2</em>',
        keys: ['<b>Neurônios espinhosos médios</b> (≈95%), GABAérgicos, de dois tipos:', '<b>D1</b> (+ substância P/dinorfina): formam a <b>via direta</b>. O receptor D1 é acoplado à <b>Gs</b>: ↑ AMPc → <b>excitado</b> pela dopamina.', '<b>D2</b> (+ encefalina): formam a <b>via indireta</b>. O receptor D2 é acoplado à <b>Gi</b>: ↓ AMPc → <b>inibido</b> pela dopamina.', '<b>Interneurônios colinérgicos</b> (grandes, tonicamente ativos): a ACh faz o papel oposto ao da dopamina no estriado.'],
        why: 'A mesma dopamina tem efeitos opostos porque cada neurônio tem um <b>receptor diferente</b>. O mensageiro é o mesmo e a resposta depende de quem recebe. No fim, os dois efeitos empurram para o mesmo lado: <b>mais movimento</b>.',
        an: 'Um único apito do técnico (dopamina): para o atacante (D1) quer dizer “corre!”, para o zagueiro (D2) quer dizer “para de marcar!”. Os dois obedecem e o time avança.'
      },
      {
        k: 'Repouso', t: 'Em repouso, o freio de mão está <em>puxado</em>',
        p: 'O <b>GPi/SNr</b> dispara sem parar (tonicamente, a cerca de 60–80 Hz), liberando GABA sobre o <b>tálamo motor (VA/VL)</b>. Com o tálamo inibido, ele não reforça o córtex motor e nenhum movimento “escapa”.',
        why: 'O padrão do sistema é <b>proibir</b>. Todos os programas motores ficam bloqueados, e a via direta libera apenas o escolhido naquele instante. É mais seguro partir do “tudo freado” do que do “tudo liberado”.',
        an: 'O carro parado com o freio de mão puxado: para andar, alguém precisa soltá-lo.'
      },
      {
        k: 'Via direta', t: 'Via <em>direta</em>: solta o freio',
        p: '<b>Córtex</b> (+) → <b>estriado D1</b> (−) → <b>GPi/SNr</b> (−) → <b>tálamo</b> (+) → <b>córtex motor</b>. O córtex ativa o estriado. O estriado inibe o GPi. O GPi para de inibir o tálamo. O tálamo, liberado, excita o córtex e o movimento sai.',
        why: 'É uma <b>desinibição</b>: inibir quem inibe. (−) × (−) = (+). O estriado não excita o tálamo diretamente: ele desliga o freio que estava sobre ele. Assim o córtex libera <b>só o programa escolhido</b>, sem mexer nos outros.',
        an: 'Você não pisa no acelerador, você solta o freio de mão, e o carro que já estava pronto começa a andar.'
      },
      {
        k: 'Via indireta', t: 'Via <em>indireta</em>: puxa o freio',
        p: '<b>Córtex</b> (+) → <b>estriado D2</b> (−) → <b>GPe</b> (−) → <b>NST</b> (+) → <b>GPi/SNr</b> (−) → <b>tálamo</b>. O estriado inibe o GPe. O GPe para de segurar o NST. O NST, livre, <b>excita o GPi</b>. O GPi inibe ainda mais o tálamo.',
        why: 'Três sinais: (−) × (−) × (+) × (−) = (−) no tálamo. Resultado: <b>menos movimento</b>. A via indireta suprime os programas concorrentes e os movimentos indesejados, deixando o escolhido “limpo”. A <b>via hiperdireta</b> (córtex → NST) é um freio de emergência ainda mais rápido.',
        an: 'Enquanto você pega o copo (via direta), a via indireta segura o resto do braço para ele não sair balançando.'
      },
      {
        k: 'Dopamina', t: 'Dopamina: <em>acelerador</em> nos dois lados',
        p: 'Os neurônios dopaminérgicos da <b>SNc</b> projetam-se ao estriado (via <b>nigroestriatal</b>). A dopamina <b>excita os D1</b>, reforçando a via direta, e <b>inibe os D2</b>, enfraquecendo a via indireta.',
        why: 'Os dois efeitos apontam para o mesmo resultado: <b>facilitar o movimento</b>. Mais via direta (solta o freio) e menos via indireta (puxa menos o freio) significam tálamo mais livre. Por isso, <b>sem dopamina</b>, o movimento fica difícil pelos dois lados ao mesmo tempo.'
      },
      {
        k: 'Parkinson', t: '<em>Parkinson</em>: o circuito sem dopamina',
        p: 'A doença de Parkinson é a morte dos neurônios dopaminérgicos da <b>SNc</b>. Sem dopamina: a via <b>direta</b> enfraquece (D1 sem estímulo) e a via <b>indireta</b> fica hiperativa (D2 sem freio) → o NST dispara demais → o <b>GPi inibe demais o tálamo</b> → o córtex motor fica sem reforço.',
        why: 'Resultado: <b>bradicinesia</b> (movimento lento e pequeno: micrografia, hipomimia, marcha em pequenos passos), <b>rigidez</b> (em roda denteada) e <b>tremor de repouso</b> (4–6 Hz, “contar moedas”), que melhora com o movimento. Os sintomas só aparecem quando já se perdeu cerca de <b>60% dos neurônios</b> da SNc (70–80% da dopamina estriatal): o sistema compensa até não conseguir mais.',
        an: 'Freio de mão puxado com força e acelerador quebrado: o carro até anda, mas devagar, com esforço e aos trancos.'
      },
      {
        k: 'Na peça', t: 'Na peça: a substância negra <em>perde a cor</em>',
        p: 'Mesencéfalo em corte axial. <b>(1) Controle</b>: faixa escura bem visível, que é a substância negra. <b>(2) Parkinson</b>: a faixa quase desaparece (<b>despigmentação</b>). cp = pedúnculo cerebral; xscp = decussação dos pedúnculos cerebelares superiores.',
        why: 'A cor preta vem da <b>neuromelanina</b>, um pigmento formado pela <b>oxidação da dopamina</b> (e da L-DOPA) dentro dos próprios neurônios dopaminérgicos, que se acumula ao longo da vida. Quando esses neurônios morrem, o pigmento some junto. A falta de cor na peça é a <b>ausência dos neurônios</b> que faziam dopamina.'
      },
      {
        k: 'Microscopia', t: 'Ao microscópio: <em>os neurônios sumiram</em>',
        keys: ['<b>(3) × (4) Nissl</b>: cora todos os corpos neuronais. No controle há uma faixa densa de neurônios na SNc. No Parkinson, quase nada.', '<b>(5) × (6) Tirosina hidroxilase (TH)</b>: imuno-histoquímica para a enzima que limita a síntese de dopamina, então só marca neurônios dopaminérgicos. No controle há uma rede marrom densa. No Parkinson, poucos neurônios isolados.'],
        why: 'A TH converte <b>tirosina → L-DOPA</b>, o passo limitante da síntese de dopamina. Marcar a TH é “acender” só os neurônios que fazem dopamina. A queda da marcação mostra que foram exatamente esses que morreram.'
      },
      {
        k: 'Lewy', t: 'Histopatologia: <em>corpúsculos de Lewy</em>',
        keys: ['<b>L · Corpúsculo de Lewy</b> (anéis amarelos): inclusão citoplasmática <b>eosinofílica</b> (rosa), redonda, com núcleo denso e <b>halo claro</b>. É feita de <b>α-sinucleína</b> agregada (e ubiquitina).', '<b>N · Neurônio com neuromelanina</b> (anéis verdes): pigmento castanho no citoplasma.', '<b>M · Neuromelanina livre</b> (anéis laranja): pigmento solto no tecido ou fagocitado por macrófagos/micróglia depois que o neurônio morreu.'],
        why: 'A α-sinucleína mal dobrada se agrega, atrapalha mitocôndrias, lisossomos e o transporte de vesículas, e pode se espalhar de neurônio para neurônio. Os neurônios da SNc são especialmente vulneráveis porque têm axônios <b>enormes e muito ramificados</b>, gasto energético altíssimo e estresse oxidativo da própria dopamina.'
      },
      {
        k: 'Tratamento', t: 'Clínica e tratamento: <em>o porquê de cada droga</em>',
        keys: ['<b>Levodopa + carbidopa</b>: a dopamina <b>não atravessa</b> a barreira hematoencefálica, mas a L-DOPA atravessa (transportador de aminoácidos). A carbidopa impede a conversão em dopamina <b>fora</b> do cérebro, reduz náusea e aumenta a quantidade que chega.', '<b>Agonistas D2</b> (pramipexol), <b>IMAO-B</b> (rasagilina) e <b>inibidores da COMT</b>: ativam o receptor ou reduzem a degradação da dopamina.', '<b>Anticolinérgicos</b>: sem dopamina a ACh estriatal fica relativamente em excesso. Bloquear a ACh reequilibra, e funciona melhor no tremor.', '<b>Estimulação cerebral profunda do NST</b>: o NST está hiperativo e acelera o GPi, então “desligá-lo” eletricamente solta o freio.'],
        clin: 'Contraste: na <b>doença de Huntington</b>, morrem os neurônios D2 da via indireta (caudado), o freio some e surge <b>coreia</b>. No <b>hemibalismo</b>, a lesão do NST (contralateral) causa movimentos amplos e violentos.'
      },
      {
        k: 'Cerebelo', t: '<em>Cerebelo</em>: três partes, três funções',
        keys: ['<b>Vestibulocerebelo</b> (lobo floculonodular) → núcleos vestibulares: equilíbrio e movimentos oculares.', '<b>Espinocerebelo</b> (vermis + zona intermédia) → núcleos <b>fastigial</b> e <b>interpósitos</b>: postura, tônus e execução dos membros.', '<b>Cerebrocerebelo</b> (hemisférios laterais) → núcleo <b>denteado</b>: planejamento, sequência e tempo de movimentos finos.'],
        why: 'Cada parte recebe informação de uma fonte diferente (vestíbulo, medula ou córtex) e por isso controla uma coisa diferente. As lesões são <b>ipsilaterais</b>: as vias cruzam duas vezes (cerebelo → tálamo contralateral e depois corticoespinal de volta), e as duas cruzadas se anulam.',
        an: 'Memorize os núcleos de medial para lateral: “<b>Fast Is Den</b>”: Fastigial, Interpósitos (globoso + emboliforme), Denteado.'
      },
      {
        k: 'Comparador', t: 'Cerebelo: o <em>comparador</em> de erros',
        p: 'O cerebelo recebe uma <b>cópia do plano</b> (córtex → núcleos pontinos → fibras musgosas) e o <b>que realmente aconteceu</b> (tratos espinocerebelares). As <b>fibras trepadeiras</b> da oliva inferior sinalizam o <b>erro</b>. As <b>células de Purkinje</b>, única saída do córtex cerebelar e <b>inibitórias (GABA)</b>, modulam os núcleos profundos, que corrigem o córtex motor pelo tálamo VL.',
        why: 'Comparar plano com execução em tempo real permite corrigir o movimento <b>enquanto ele acontece</b> e ajustar a próxima tentativa (<b>aprendizado motor</b>). É por isso que andar de bicicleta vira automático.',
        an: 'Um GPS que conhece o destino (plano), recebe sua localização a cada segundo (execução) e recalcula a rota quando você erra (erro).'
      },
      {
        k: 'Cerebelo × NB', t: 'Lesão: <em>cerebelo × núcleos da base</em>',
        html: `<table><tr><th></th><th>Cerebelo</th><th>Núcleos da base</th></tr>
          <tr><td>Lado</td><td><b>Ipsilateral</b></td><td>Contralateral</td></tr>
          <tr><td>Tremor</td><td><b>De intenção</b> (piora ao chegar no alvo)</td><td><b>De repouso</b> (some no movimento)</td></tr>
          <tr><td>Sinais</td><td>Ataxia, dismetria, disdiadococinesia, nistagmo, hipotonia, fala escandida</td><td>Bradicinesia, rigidez (Parkinson) ou coreia, balismo, distonia</td></tr>
          <tr><td>Força</td><td>Preservada</td><td>Preservada</td></tr></table>`,
        why: 'O tremor denuncia o circuito. O cerebelo corrige o movimento em curso, então sem ele o erro aparece <b>durante o movimento</b> e cresce perto do alvo. Os núcleos da base selecionam o movimento, então sem eles o problema aparece no <b>repouso</b> e no início do movimento.',
        clin: 'Testes: índex-nariz e calcanhar-joelho (dismetria), movimentos alternados rápidos (disdiadococinesia), marcha em linha (ataxia de tronco: lesão do vermis, típica do álcool).'
      }
    ],
    legend: [
      ['Estriado (caudado + putâmen)', 'Principal entrada dos núcleos da base. Recebe o córtex (glutamato) e a SNc (dopamina). Neurônios espinhosos médios GABAérgicos (D1 e D2).'],
      ['Neurônio espinhoso médio D1', 'Via direta. Receptor D1 acoplado à Gs (↑ AMPc): excitado pela dopamina. Co-transmissores substância P e dinorfina.'],
      ['Neurônio espinhoso médio D2', 'Via indireta. Receptor D2 acoplado à Gi (↓ AMPc): inibido pela dopamina. Co-transmissor encefalina.'],
      ['Interneurônio colinérgico estriatal', 'Tonicamente ativo. A ACh se opõe à dopamina e é o alvo dos anticolinérgicos no Parkinson.'],
      ['Globo pálido externo (GPe)', 'GABA. Inibe o NST. É inibido pelo estriado D2 (via indireta).'],
      ['Globo pálido interno (GPi)', 'GABA. Principal saída, com inibição tônica do tálamo VA/VL.'],
      ['Núcleo subtalâmico (NST)', 'Único núcleo excitatório (glutamato). Excita o GPi/SNr. Alvo da estimulação profunda no Parkinson. Lesão causa hemibalismo contralateral.'],
      ['Substância negra pars compacta (SNc)', 'Neurônios dopaminérgicos com neuromelanina. Via nigroestriatal. Degenera no Parkinson.'],
      ['Substância negra pars reticulata (SNr)', 'GABA. Saída como o GPi, principalmente para o colículo superior (movimentos oculares) e o tálamo.'],
      ['Tálamo VA/VL', 'Retransmite ao córtex motor. Os núcleos da base o freiam ou liberam.'],
      ['Via direta', 'Córtex → estriado D1 → GPi/SNr → tálamo → córtex. Desinibição: facilita o movimento.'],
      ['Via indireta', 'Córtex → estriado D2 → GPe → NST → GPi/SNr → tálamo. Aumenta a inibição: suprime movimentos.'],
      ['Via hiperdireta', 'Córtex → NST → GPi. Freio rápido (parar uma ação).'],
      ['Neuromelanina', 'Pigmento derivado da oxidação da dopamina. Dá a cor negra à SNc.'],
      ['Corpúsculo de Lewy', 'Inclusão eosinofílica intracitoplasmática de α-sinucleína, com halo claro.'],
      ['Tirosina hidroxilase', 'Enzima limitante: tirosina → L-DOPA. Marcador de neurônios dopaminérgicos.'],
      ['Vestibulocerebelo', 'Lobo floculonodular → núcleos vestibulares. Equilíbrio e olhar.'],
      ['Espinocerebelo', 'Vermis + zona intermédia → fastigial/interpósitos. Postura e execução.'],
      ['Cerebrocerebelo', 'Hemisférios laterais → denteado → tálamo VL → córtex. Planejamento e tempo.'],
      ['Célula de Purkinje', 'Única saída do córtex cerebelar. GABAérgica (inibe os núcleos profundos).'],
      ['Fibras musgosas / trepadeiras', 'Musgosas: ponte, medula e vestíbulo, via células granulares. Trepadeiras: oliva inferior, sinal de erro direto na Purkinje.']
    ],
    clinic: [
      'Parkinson (TRAP): Tremor de repouso, Rigidez em roda denteada, Acinesia/bradicinesia, instabilidade Postural. Início assimétrico.',
      'Sintomas aparecem com cerca de 60% de perda neuronal na SNc (≈80% da dopamina estriatal).',
      'Levodopa + carbidopa: a dopamina não cruza a BHE e a carbidopa bloqueia a descarboxilação periférica.',
      'Antipsicóticos (bloqueio D2) causam parkinsonismo medicamentoso. A metoclopramida também.',
      'MPTP (heroína sintética contaminada) destrói a SNc e causa parkinsonismo agudo.',
      'Huntington: perda do estriado (caudado, via indireta D2) e coreia. Autossômica dominante, repetição CAG.',
      'Hemibalismo: lesão do núcleo subtalâmico contralateral (geralmente AVC lacunar).',
      'Cerebelo: sinais ipsilaterais. Tremor de intenção, dismetria, disdiadococinesia, nistagmo, fala escandida.',
      'Álcool: degeneração do vermis e ataxia de marcha com membros superiores relativamente preservados.'
    ]
  });
})();
