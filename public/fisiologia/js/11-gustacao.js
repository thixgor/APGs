/* 11 · Gustação e transdução gustativa (versão simplificada) */
(function () {
  const { svg, flow, callout, tag, box, ion } = H;
  const TASTE = { doce: '#ff9ecf', salgado: '#8fd3ff', azedo: '#ffd166', amargo: '#3fc584', umami: '#ff8a1f' };

  /* ---------- cena A: língua + botão ---------- */
  const lingua = svg(`
    <path d="M140,720 C110,500 130,230 260,120 C330,60 420,50 500,50 C580,50 670,60 740,120 C870,230 890,500 860,720Z" fill="#e8847a" stroke="#b8504a" stroke-width="4"/>
    <path d="M500,70 L500,640" stroke="#b8504a" stroke-width="3" opacity=".6"/>
    ${[[380, 600], [440, 640], [500, 655], [560, 640], [620, 600], [320, 540], [680, 540]].map(([x, y]) => `<g><circle cx="${x}" cy="${y}" r="18" fill="#f3b3a8" stroke="#b8504a" stroke-width="2"/><circle cx="${x}" cy="${y}" r="24" fill="none" stroke="#b8504a" stroke-width="2" stroke-dasharray="4 4"/></g>`).join('')}
    ${Array.from({ length: 70 }, (_, i) => { const a = (i * 137.5) % 360, r = 40 + (i * 53) % 280; const x = 500 + Math.cos(a) * r * .9, y = 330 + Math.sin(a) * r * .8 - 60; return (y > 90 && y < 500) ? `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="7" fill="#ff9e94"/>` : ''; }).join('')}
    ${[[175, 430], [190, 480], [815, 430], [800, 480]].map(([x, y]) => `<path d="M${x},${y} l${x < 500 ? 22 : -22},-8 M${x},${y + 10} l${x < 500 ? 22 : -22},-8 M${x},${y + 20} l${x < 500 ? 22 : -22},-8" stroke="#b8504a" stroke-width="3"/>`).join('')}
    <g data-s="=1">
      ${callout(500, 655, 650, 740, 'Circunvaladas (em V, fundo)', { anchor: 'start', cls: 'lb', sub: 'milhares de botões · IX par' })}
      ${callout(560, 190, 690, 40, 'Fungiformes (ponta e bordas)', { anchor: 'middle', cls: 'lb', sub: 'VII par (corda do tímpano)' })}
      ${callout(815, 440, 960, 330, 'Folhadas (laterais)', { anchor: 'end', cls: 'lb' })}
      ${callout(420, 300, 180, 90, 'Filiformes: SEM botão', { anchor: 'middle', cls: 'ls', sub: 'só textura (atrito)' })}
    </g>
    <g data-s="=2">
      ${tag(500, 250, 'todas as regiões sentem os 5 gostos', { o: 1, fs: 18 })}
      <path d="M340,300 L660,420 M660,300 L340,420" stroke="#ff6b5e" stroke-width="10" stroke-linecap="round" opacity=".85"/>
      ${tag(500, 470, '“mapa da língua” = mito', { fs: 17, fill: '#ff9a90' })}
    </g>
  `);
  const cellB = (x, c, rot = 0) => `<g transform="rotate(${rot} 500 430)"><path d="M${x - 16},600 C${x - 22},480 ${x - 10},330 ${x},250 C${x + 10},330 ${x + 22},480 ${x + 16},600Z" fill="${c}" stroke="#07201a" stroke-opacity=".3"/></g>`;
  const botao = svg(`
    <rect x="40" y="170" width="920" height="80" fill="#f3b3a8"/><rect x="40" y="250" width="920" height="400" fill="#e8847a" opacity=".45"/>
    <path d="M300,250 C300,560 700,560 700,250" fill="#f7d0c4" stroke="#b8504a" stroke-width="3"/>
    ${cellB(420, TASTE.doce, -14)}${cellB(460, TASTE.salgado, -7)}${cellB(500, TASTE.amargo, 0)}${cellB(540, TASTE.azedo, 7)}${cellB(580, TASTE.umami, 14)}
    <rect x="470" y="160" width="60" height="30" fill="#07201a" opacity=".6"/>
    ${[486, 500, 514].map(x => `<rect x="${x - 2}" y="196" width="4" height="40" fill="#fff"/>`).join('')}
    <path d="M500,560 C500,640 420,690 360,740" stroke="#ffd166" stroke-width="6" fill="none"/>
    <path d="M530,560 C540,640 600,690 660,740" stroke="#ffd166" stroke-width="6" fill="none"/>
    ${flow({ d: 'M500,80 L500,210', n: 4, dur: 2, r: 9, fill: TASTE.doce })}
    ${callout(500, 175, 660, 110, 'Poro gustativo', { anchor: 'start', cls: 'lb', sub: 'saliva dissolve a molécula' })}
    ${callout(500, 215, 330, 110, 'Microvilosidades', { anchor: 'end', cls: 'ls' })}
    ${callout(460, 420, 250, 470, 'Células receptoras', { anchor: 'end', cls: 'lb', sub: 'renovadas a cada ≈ 10 dias' })}
    ${callout(560, 640, 740, 640, 'Fibras aferentes', { anchor: 'start', cls: 'lb', dot: '#ffd166' })}
  `);

  /* ---------- cena B: salgado e azedo ---------- */
  const cellShape = (x, c, label) => `<path d="M${x - 120},640 C${x - 140},470 ${x - 110},280 ${x},200 C${x + 110},280 ${x + 140},470 ${x + 120},640Z" fill="${c}" fill-opacity=".22" stroke="${c}" stroke-width="3"/><text x="${x}" y="690" text-anchor="middle" class="lt" fill="${c}">${label}</text>`;
  const ionico = svg(`
    <line x1="40" y1="260" x2="960" y2="260" stroke="#9fc0ae" stroke-dasharray="6 6"/><text x="50" y="248" class="lx">saliva ↑ · célula ↓</text>
    ${cellShape(270, TASTE.salgado, 'SALGADO')}${cellShape(730, TASTE.azedo, 'AZEDO')}
    <g data-s="=3">
      <rect x="248" y="246" width="44" height="30" rx="8" fill="#1f7f70"/><text x="270" y="232" text-anchor="middle" class="lx">ENaC</text>
      ${flow({ d: 'M270,110 L270,420', n: 6, dur: 1.4, r: 12, ion: 'na' })}
      ${tag(270, 470, 'Na⁺ entra → despolariza', { o: 1, fs: 15 })}
      ${tag(270, 520, 'canal direto, sem intermediário', { fs: 13 })}
    </g>
    <g data-s="=4">
      <rect x="696" y="246" width="44" height="30" rx="8" fill="#b8860b"/><text x="718" y="232" text-anchor="middle" class="lx">OTOP1</text>
      ${flow({ d: 'M718,110 L718,420', n: 6, dur: 1.4, r: 12, ion: 'h' })}
      <rect x="790" y="330" width="16" height="56" rx="6" fill="#3fc584"/><path d="M780,340 L816,376 M816,340 L780,376" stroke="#ff6b5e" stroke-width="4"/>
      <text x="830" y="364" class="lx">canal de K⁺ bloqueado pelo H⁺</text>
      ${tag(730, 470, 'H⁺ entra + K⁺ para de sair', { o: 1, fs: 15 })}
      ${tag(730, 520, '= despolarização', { fs: 13 })}
    </g>
  `);

  /* ---------- cena C: GPCR ---------- */
  const gpcr = svg(`
    <line x1="40" y1="200" x2="960" y2="200" stroke="#9fc0ae" stroke-dasharray="6 6"/>
    <path d="M140,720 C110,500 150,260 500,190 C850,260 890,500 860,720Z" fill="#c7b1ff" fill-opacity=".12" stroke="#c7b1ff" stroke-width="3"/>
    ${[['doce', 300, 'T1R2 + T1R3'], ['umami', 500, 'T1R1 + T1R3'], ['amargo', 700, 'T2R (≈ 25 tipos)']].map(([t, x, r]) => `<g><rect x="${x - 34}" y="178" width="68" height="46" rx="14" fill="${TASTE[t]}"/><text x="${x}" y="90" text-anchor="middle" class="lb" fill="${TASTE[t]}">${t.toUpperCase()}</text><text x="${x}" y="66" text-anchor="middle" class="lx">${r}</text>${flow({ d: `M${x},104 L${x},180`, n: 3, dur: 1.6, r: 8, fill: TASTE[t] })}</g>`).join('')}
    <path d="M300,230 C360,290 440,300 500,300 C560,300 640,290 700,230" stroke="#cfe2d7" stroke-width="3" fill="none" stroke-dasharray="6 6"/>
    ${box(400, 280, 200, 50, 'gustducina (Gα)', '', { fs: 16, stroke: '#c7b1ff' })}
    <path d="M500,330 L500,360" stroke="#cfe2d7" stroke-width="3" marker-end="url(#arr)"/>
    ${box(400, 362, 200, 50, 'PLCβ2 → IP₃', '', { fs: 16 })}
    <path d="M500,412 L500,440" stroke="#cfe2d7" stroke-width="3" marker-end="url(#arr)"/>
    <ellipse cx="290" cy="470" rx="70" ry="34" fill="#1f7f70" opacity=".6"/><text x="290" y="430" text-anchor="middle" class="lx">retículo endoplasmático</text>
    ${box(400, 444, 200, 50, 'Ca²⁺ sobe', '', { fs: 16, stroke: '#ffd166' })}
    ${flow({ d: 'M310,470 L396,470', n: 3, dur: 1.2, r: 9, ion: 'ca' })}
    <path d="M500,494 L500,522" stroke="#cfe2d7" stroke-width="3" marker-end="url(#arr)"/>
    ${box(380, 526, 240, 50, 'TRPM5 abre: Na⁺ entra', '', { fs: 16, stroke: '#ff8a1f' })}
    <rect x="770" y="536" width="20" height="46" rx="6" fill="#ff8a1f"/>${flow({ d: 'M900,559 L640,555', n: 3, dur: 1.4, r: 10, ion: 'na' })}
    <path d="M500,576 L500,604" stroke="#cfe2d7" stroke-width="3" marker-end="url(#arr)"/>
    ${box(380, 608, 240, 50, 'despolariza → ATP sai', 'pelo canal CALHM1', { fs: 16, sfs: 12, stroke: '#ffe29a' })}
    <path d="M500,658 C500,700 520,720 560,740" stroke="#ffd166" stroke-width="6" fill="none"/>
    ${flow({ d: 'M500,660 L540,735', n: 3, dur: 1, r: 6, fill: '#ffe29a' })}
    ${tag(760, 700, 'ATP → receptor P2X na fibra → PA', { o: 1, fs: 14 })}
    ${tag(780, 330, 'mesma cascata para os 3', { fs: 14 })}${tag(780, 368, 'o que muda é o RECEPTOR', { o: 1, fs: 14 })}
  `);

  /* ---------- cena D: via ---------- */
  const via = svg(`
    ${box(330, 40, 340, 70, 'Córtex gustativo', 'ínsula anterior + opérculo frontal (43)', { fs: 20, sfs: 13, stroke: '#ff8a1f', fill: 'rgba(255,138,31,.16)' })}
    ${box(360, 190, 280, 64, 'Tálamo VPM', '', { fs: 19, stroke: '#c7b1ff' })}
    ${box(330, 350, 340, 70, 'Núcleo do trato solitário', 'bulbo (parte rostral)', { fs: 18, sfs: 13 })}
    <path d="M500,350 L500,258" stroke="#cfe2d7" stroke-width="5" marker-end="url(#arr)"/><text x="512" y="310" class="lx">sobe do MESMO lado</text>
    <path d="M500,190 L500,114" stroke="#cfe2d7" stroke-width="5" marker-end="url(#arr)"/>
    ${box(60, 560, 240, 90, 'VII · facial', '2/3 anteriores (corda do tímpano)', { fs: 20, sfs: 12, stroke: TASTE.doce })}
    ${box(380, 560, 240, 90, 'IX · glossofaríngeo', '1/3 posterior', { fs: 20, sfs: 12, stroke: TASTE.amargo })}
    ${box(700, 560, 240, 90, 'X · vago', 'epiglote e faringe', { fs: 20, sfs: 12, stroke: TASTE.salgado })}
    <path d="M180,560 C200,470 330,430 380,420" stroke="${TASTE.doce}" stroke-width="5" fill="none" marker-end="url(#arr)"/>
    <path d="M500,560 L500,424" stroke="${TASTE.amargo}" stroke-width="5" marker-end="url(#arr)"/>
    <path d="M820,560 C800,470 670,430 620,420" stroke="${TASTE.salgado}" stroke-width="5" fill="none" marker-end="url(#arr)"/>
    ${flow({ d: 'M500,560 L500,420 L500,254 L500,110', n: 6, dur: 3, r: 7, fill: '#ffd166' })}
    ${tag(500, 710, 'mnemônico: 7 · 9 · 10', { o: 1, fs: 18 })}
    ${tag(830, 290, 'ramos p/ hipotálamo e amígdala', { fs: 13 })}${tag(830, 325, 'prazer · nojo · salivação', { fs: 13 })}
  `);

  /* ---------- cena E: sabor = gosto + cheiro ---------- */
  const sabor = svg(`
    <path d="M200,700 C160,560 170,400 230,300 C290,200 380,150 470,150 C560,150 620,190 650,250 L700,330 L660,350 L680,380 L650,400 L665,430 C660,470 630,490 590,490 L560,520 L520,700Z" fill="#e8b9a0" opacity=".3" stroke="#e8b9a0" stroke-width="3"/>
    <path d="M580,300 C520,280 440,290 380,320" stroke="#8fd3ff" stroke-width="16" fill="none" opacity=".4"/>
    <path d="M600,440 C540,420 480,420 440,440" stroke="#e8847a" stroke-width="18" fill="none" stroke-linecap="round"/>
    <path d="M380,320 C340,360 330,420 350,470" stroke="#8fd3ff" stroke-width="10" fill="none" opacity=".4"/>
    <rect x="400" y="236" width="90" height="14" rx="7" fill="#c7b1ff"/>
    ${flow({ d: 'M620,440 L480,440 C380,450 340,420 350,380 C360,320 420,280 450,250', n: 8, dur: 3.2, r: 7, fill: '#ff9ecf' })}
    ${callout(445, 243, 380, 160, 'Epitélio olfatório', { anchor: 'end', cls: 'lb', dot: '#c7b1ff' })}
    ${callout(560, 435, 720, 470, 'Língua: 5 gostos', { anchor: 'start', cls: 'lb' })}
    ${callout(350, 400, 200, 460, 'via RETRONASAL', { anchor: 'end', cls: 'lb lo', sub: 'aroma sobe pela garganta' })}
    ${tag(500, 620, 'SABOR = gosto + olfato + textura + temperatura', { o: 1, fs: 16 })}
    ${tag(500, 670, 'nariz entupido → comida “sem gosto”', { fs: 15 })}
  `);

  DA.topic({
    id: 'gustacao', section: 'Sentidos especiais',
    short: 'Gustação',
    title: '<em>Gustação</em> sem complicação',
    card: 'Papilas, 5 gostos, 2 mecanismos, via 7-9-10',
    lede: 'Versão enxuta: 5 gostos, 2 mecanismos de transdução e 1 via. Com o porquê de cada um, sem decoreba desnecessária.',
    fig: () => `<div class="scene" data-s="0-2">${lingua}</div><div class="scene" data-s="=3,=4">${ionico}</div><div class="scene" data-s="=5">${gpcr}</div><div class="scene" data-s="=6">${botao}</div><div class="scene" data-s="=7">${via}</div><div class="scene" data-s="=8">${sabor}</div>`,
    steps: [
      {
        k: 'Onde', t: 'Papilas: onde ficam os <em>botões gustativos</em>',
        p: 'Os receptores do gosto ficam em <b>botões gustativos</b>, dentro das papilas: <b>fungiformes</b> (ponta e bordas), <b>folhadas</b> (laterais, atrás) e <b>circunvaladas</b> (7–12 em “V” no fundo da língua, as que têm mais botões). As <b>filiformes</b>, as mais numerosas, <b>não têm botões</b>: dão a aspereza e sentem a textura.',
        why: 'Os botões ficam em sulcos e dobras porque a saliva precisa <b>parar ali por um instante</b> para as moléculas dissolvidas chegarem aos receptores. As circunvaladas têm um fosso em volta, com glândulas (de von Ebner) que lavam o fosso e “zeram” o gosto para a próxima mordida.'
      },
      {
        k: 'Os 5 gostos', t: 'Os <em>5 gostos</em> e para que servem',
        html: `<table><tr><th>Gosto</th><th>Detecta</th><th>Por que existe</th></tr>
          <tr><td style="color:#ff9ecf"><b>Doce</b></td><td>Açúcares</td><td>Energia (carboidrato)</td></tr>
          <tr><td style="color:#8fd3ff"><b>Salgado</b></td><td>Na⁺</td><td>Equilíbrio de eletrólitos</td></tr>
          <tr><td style="color:#ffd166"><b>Azedo</b></td><td>H⁺ (ácidos)</td><td>Alerta de comida estragada ou verde</td></tr>
          <tr><td style="color:#3fc584"><b>Amargo</b></td><td>Alcaloides</td><td><b>Alerta de veneno</b> (limiar mais baixo)</td></tr>
          <tr><td style="color:#ff8a1f"><b>Umami</b></td><td>Glutamato</td><td>Proteína</td></tr></table>`,
        why: 'Cada gosto é um “detector” de algo importante para sobreviver. O amargo tem o <b>limiar mais baixo</b> de todos porque errar ali pode matar: é melhor rejeitar alguns alimentos bons do que engolir um veneno. E o <b>mapa da língua</b> (doce na ponta, amargo no fundo) é um <b>mito</b>: todas as regiões com botões sentem os 5 gostos.'
      },
      {
        k: 'Salgado', t: 'Mecanismo 1 · <em>Salgado</em>: o íon entra direto',
        p: 'O <b>Na⁺</b> da comida entra na célula receptora por um canal que fica <b>sempre aberto</b>, o <b>ENaC</b> (canal epitelial de sódio). Entrou carga positiva, a célula <b>despolariza</b>. Simples assim.',
        why: 'O próprio estímulo é um íon positivo, então ele mesmo carrega a corrente elétrica. Não é preciso receptor nem cascata intermediária. É o mecanismo mais direto de todos.',
        an: 'O gosto salgado é o convidado que já tem a chave: entra direto, sem tocar a campainha.',
        clin: 'A <b>amilorida</b> (diurético) bloqueia o ENaC e diminui a percepção do salgado.'
      },
      {
        k: 'Azedo', t: 'Mecanismo 1 · <em>Azedo</em>: o H⁺ entra e trava o K⁺',
        p: 'O <b>H⁺</b> dos ácidos entra pelo canal de prótons <b>OTOP1</b>. Dentro da célula, ele ainda <b>bloqueia canais de K⁺</b>. Mais carga positiva entrando e menos saindo: a célula <b>despolariza</b>.',
        why: 'O mesmo raciocínio do salgado: o estímulo é um íon positivo. Salgado e azedo são os dois gostos <b>ionotrópicos</b>, em que o próprio íon cria o sinal elétrico.',
        an: 'O azedo entra pela porta e ainda tranca a saída de emergência.'
      },
      {
        k: 'Doce · umami · amargo', t: 'Mecanismo 2 · <em>receptor + proteína G</em>',
        p: 'Doce, umami e amargo são <b>moléculas sem carga</b>, então precisam de um <b>receptor acoplado à proteína G</b> na membrana: <b>T1R2+T1R3</b> (doce), <b>T1R1+T1R3</b> (umami), <b>T2R</b> (amargo). Todos seguem a mesma cascata: <b>gustducina → PLCβ2 → IP₃ → Ca²⁺ sobe → canal TRPM5 abre → Na⁺ entra → despolariza → sai ATP</b>.',
        why: 'Uma molécula de açúcar não carrega corrente elétrica. Ela precisa “tocar a campainha” (receptor) para alguém lá dentro abrir a porta. A cascata também <b>amplifica</b> o sinal, e é por isso que moléculas pequenas em pouca quantidade conseguem ser percebidas.',
        an: 'Os gostos iônicos entram com a chave. Os outros três tocam a campainha, e um mordomo (proteína G) abre a porta por dentro.'
      },
      {
        k: 'Do receptor ao PA', t: 'Do potencial <em>graduado</em> ao potencial de ação',
        p: 'A célula gustativa <b>não tem axônio</b>: ela é uma célula epitelial modificada. A despolarização dela é um <b>potencial receptor (graduado)</b>, maior quanto mais concentrado o gosto. Ela então libera um neurotransmissor (<b>ATP</b> para doce/umami/amargo, <b>serotonina</b> para azedo) sobre a <b>fibra nervosa</b>, e é a fibra que dispara os <b>potenciais de ação</b>.',
        why: 'Mesmo padrão da audição e da visão: o receptor faz sinal graduado e o neurônio seguinte o transforma em disparos. Quanto mais concentrado o gosto, maior a despolarização, mais neurotransmissor e maior a frequência de PA: é assim que o cérebro sabe “muito doce” × “pouco doce”.',
        clin: 'As células gustativas vivem cerca de <b>10 dias</b> e são repostas por células basais. Quimioterapia e radioterapia atrapalham essa reposição e causam alteração de paladar (disgeusia).'
      },
      {
        k: 'A via', t: 'A via: <em>7 · 9 · 10</em> → NTS → tálamo → ínsula',
        p: 'Três nervos cranianos levam o gosto: <b>VII</b> (facial, pela corda do tímpano, 2/3 anteriores), <b>IX</b> (glossofaríngeo, 1/3 posterior) e <b>X</b> (vago, epiglote). Todos chegam ao <b>núcleo do trato solitário</b> (bulbo) → <b>tálamo VPM</b> → <b>córtex gustativo</b> (ínsula anterior e opérculo frontal, área 43).',
        why: 'A via gustativa sobe principalmente do <b>mesmo lado</b> (é exceção entre as vias sensitivas). O núcleo do trato solitário também recebe informação visceral: por isso o gosto se liga tão bem a náusea, salivação e ao reflexo de vômito.',
        clin: 'Paralisia facial (Bell) com lesão acima da corda do tímpano: perda do gosto nos <b>2/3 anteriores</b> do lado afetado.'
      },
      {
        k: 'Sabor', t: 'Gosto ≠ <em>sabor</em>',
        p: 'A língua só reconhece <b>5 gostos</b>. O que chamamos de sabor (morango, café, chocolate) é principalmente <b>olfato</b>: ao mastigar, o aroma sobe por trás, da garganta para o nariz (<b>via retronasal</b>). Somam-se textura, temperatura e ardência (capsaicina via trigêmeo).',
        why: 'Por isso a comida perde o “gosto” no resfriado: os 5 gostos continuam lá, mas o aroma não chega ao epitélio olfatório. Tampe o nariz e tente distinguir suco de maçã de suco de pera: fica quase impossível.',
        clin: '<b>Anosmia</b> (como na COVID-19) costuma ser relatada como perda de paladar, porque o que sumiu foi o componente olfatório do sabor.'
      }
    ],
    legend: [
      ['Papilas fungiformes', 'Ponta e bordas da língua. Têm botões gustativos. Inervação: VII (corda do tímpano).'],
      ['Papilas folhadas', 'Bordas laterais posteriores. Têm botões gustativos.'],
      ['Papilas circunvaladas', '7–12 em V na frente do sulco terminal. Muitos botões. Inervação: IX.'],
      ['Papilas filiformes', 'As mais numerosas. Sem botões gustativos. Textura e atrito.'],
      ['Botão gustativo', '50–100 células receptoras com microvilosidades no poro gustativo. Renovação a cada 10–14 dias.'],
      ['ENaC', 'Canal epitelial de Na⁺. Transduz o salgado (bloqueado pela amilorida).'],
      ['OTOP1', 'Canal de prótons (H⁺). Transduz o azedo. O H⁺ também bloqueia canais de K⁺.'],
      ['T1R2 + T1R3', 'Receptor do doce (GPCR).'],
      ['T1R1 + T1R3', 'Receptor do umami (glutamato) (GPCR).'],
      ['T2R', 'Família de cerca de 25 receptores do amargo (GPCR).'],
      ['Gustducina', 'Proteína G específica das células gustativas.'],
      ['TRPM5', 'Canal de cátions ativado por Ca²⁺. Despolariza a célula nos gostos por GPCR.'],
      ['CALHM1', 'Canal que libera ATP como neurotransmissor para a fibra aferente.'],
      ['Núcleo do trato solitário', 'Bulbo. Recebe o gosto (VII, IX, X) e aferências viscerais.'],
      ['Tálamo VPM', 'Retransmite o gosto ao córtex.'],
      ['Córtex gustativo', 'Ínsula anterior e opérculo frontal (área 43).']
    ],
    clinic: [
      'O mapa da língua é um mito: todas as regiões com botões percebem os 5 gostos.',
      'Salgado e azedo: canais iônicos. Doce, umami e amargo: GPCR + gustducina.',
      'Nervos do gosto: VII (2/3 anteriores), IX (1/3 posterior), X (epiglote). A sensibilidade geral dos 2/3 anteriores é do V (lingual).',
      'Paralisia de Bell proximal: perde o gosto nos 2/3 anteriores + hiperacusia + paralisia facial.',
      'Disgeusia: quimioterapia, radioterapia, deficiência de zinco, medicamentos (metronidazol, captopril).',
      'Anosmia é percebida como “perda de paladar”, porque o sabor depende do olfato retronasal.'
    ]
  });
})();
