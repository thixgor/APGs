/* 09 · Estímulos primários e receptores */
(function () {
  const { svg, flow, callout, tag, box } = H;

  /* ---------- cena A: transdução genérica ---------- */
  const trans = svg(`
    ${box(40, 300, 190, 110, 'ESTÍMULO', 'energia do ambiente', { fs: 22, stroke: '#ffd166', fill: 'rgba(255,209,102,.12)' })}
    <path d="M232,355 L300,355" stroke="#ffd166" stroke-width="5" marker-end="url(#arrY)"/>
    <!-- terminação -->
    <path d="M320,355 C360,300 400,300 430,355 C460,410 500,410 540,355" fill="none" stroke="#62dcc8" stroke-width="18" stroke-linecap="round"/>
    <circle cx="330" cy="345" r="11" fill="#07201a" stroke="#ffd166" stroke-width="3"/><circle cx="380" cy="318" r="11" fill="#07201a" stroke="#ffd166" stroke-width="3"/>
    <path d="M540,355 L660,355" stroke="#62dcc8" stroke-width="12"/>
    <rect x="600" y="340" width="10" height="30" fill="#ff8a1f"/>
    <path d="M660,355 L940,355" stroke="#efe2c8" stroke-width="12"/>
    ${[700, 780, 860].map(x => `<rect x="${x}" y="340" width="60" height="30" rx="14" fill="#efe2c8"/>`).join('')}
    <!-- potencial receptor -->
    <g transform="translate(300,440)">
      <rect x="0" y="0" width="260" height="170" rx="16" fill="#07201a" stroke="rgba(165,232,198,.25)"/>
      <text x="16" y="28" class="ls">potencial RECEPTOR (graduado)</text>
      <path d="M20,140 L70,140 C90,140 90,80 120,70 C160,60 200,62 240,64" stroke="#62dcc8" stroke-width="4" fill="none" class="draw" data-s="1"/>
      <path d="M20,140 L70,140 C90,140 95,110 120,105 C160,100 200,102 240,104" stroke="#62dcc8" stroke-width="3" fill="none" opacity=".45" class="draw" data-s="1"/>
      <text x="236" y="58" text-anchor="end" class="lx lm">estímulo forte</text><text x="236" y="126" text-anchor="end" class="lx">fraco</text>
    </g>
    <g transform="translate(640,440)">
      <rect x="0" y="0" width="320" height="170" rx="16" fill="#07201a" stroke="rgba(255,138,31,.35)"/>
      <text x="16" y="28" class="ls">potenciais de AÇÃO (frequência)</text>
      ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => `<path d="M${30 + i * 32},140 L${36 + i * 32},60 L${42 + i * 32},150" stroke="#ff8a1f" stroke-width="3" fill="none" class="draw" data-s="1"/>`).join('')}
      <text x="300" y="164" text-anchor="end" class="lx lo">mais forte = mais disparos/s</text>
    </g>
    <g data-s="1">${flow({ d: 'M320,355 L940,355', n: 6, dur: 2, r: 7, fill: '#ff8a1f' })}</g>
    ${callout(355, 330, 340, 230, 'Canais sensíveis ao estímulo', { anchor: 'middle', cls: 'lb', sub: 'mecânico · térmico · químico · luz' })}
    ${callout(605, 355, 650, 250, 'Zona de gatilho', { anchor: 'start', cls: 'lb lo', sub: '1º nodo: se passar do limiar, dispara' })}
    ${tag(500, 690, 'transdução: energia do estímulo → sinal elétrico', { o: 1, fs: 17 })}
  `);

  /* ---------- cena B: modalidades ---------- */
  const mods = [
    ['Mecanorreceptores', 'deformação', 'tato, pressão, vibração, audição, equilíbrio, estiramento', '#62dcc8'],
    ['Termorreceptores', 'temperatura', 'frio (TRPM8) e calor (TRPV1/3/4)', '#ff8a1f'],
    ['Nociceptores', 'lesão tecidual', 'dor: mecânica, térmica, química (terminações livres)', '#ff6b5e'],
    ['Quimiorreceptores', 'moléculas', 'gustação, olfato, O₂/CO₂/pH (corpos carotídeos)', '#ffd166'],
    ['Fotorreceptores', 'luz', 'cones e bastonetes da retina', '#c7b1ff'],
    ['Osmorreceptores', 'osmolaridade', 'hipotálamo (sede, ADH)', '#8fd3ff']
  ];
  const modal = svg(`
    ${mods.map(([n, e, ex, c], i) => { const col = i % 2, row = Math.floor(i / 2); const x = 40 + col * 470, y = 40 + row * 230;
      return `<g data-s="2" style="transition-delay:${i * .1}s"><rect x="${x}" y="${y}" width="450" height="205" rx="22" fill="#07201a" stroke="${c}" stroke-opacity=".6" stroke-width="2"/>
        <circle cx="${x + 50}" cy="${y + 55}" r="26" fill="${c}" opacity=".9"/>
        <text x="${x + 92}" y="${y + 52}" class="lb" style="font-size:24px">${n}</text>
        <text x="${x + 92}" y="${y + 80}" class="ls" fill="${c}">estímulo adequado: ${e}</text>
        <foreignObject x="${x + 24}" y="${y + 104}" width="410" height="96"><div xmlns="http://www.w3.org/1999/xhtml" style="font:500 19px/1.35 var(--f-body);color:#cfe2d7">${ex}</div></foreignObject></g>`; }).join('')}
  `);

  /* ---------- cena C: pele ---------- */
  const pele = svg(`
    <path d="M0,150 C100,130 180,170 260,150 C340,130 420,170 500,150 C580,130 660,170 740,150 C820,130 900,170 1000,150 L1000,320 L0,320Z" fill="#f2c7ae"/>
    <path d="M0,150 C100,130 180,170 260,150 C340,130 420,170 500,150 C580,130 660,170 740,150 C820,130 900,170 1000,150" stroke="#b86d5e" stroke-width="3" fill="none"/>
    <rect x="0" y="320" width="1000" height="300" fill="#e8b9a0"/>
    <rect x="0" y="620" width="1000" height="140" fill="#f4dcb0"/>
    ${[[70, 680], [180, 700], [900, 690], [800, 710]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="34" fill="#f8e7c4" stroke="#e4c48e"/>`).join('')}
    <text x="990" y="185" text-anchor="end" class="ls" fill="#5a2b22" style="stroke:none">epiderme</text>
    <text x="990" y="360" text-anchor="end" class="ls" fill="#5a2b22" style="stroke:none">derme</text>
    <text x="990" y="650" text-anchor="end" class="ls" fill="#5a2b22" style="stroke:none">hipoderme</text>
    <!-- Meissner -->
    <g data-hl="=4"><ellipse cx="180" cy="210" rx="20" ry="42" fill="#fff4e6" stroke="#62dcc8" stroke-width="3"/><path d="M168,180 q12,8 0,16 q12,8 0,16 q12,8 0,16 q12,8 0,16" stroke="#62dcc8" stroke-width="3" fill="none"/><path d="M180,252 L180,760" stroke="#62dcc8" stroke-width="3"/></g>
    <!-- Merkel -->
    <g data-hl="=4"><path d="M380,165 L420,165" stroke="#ffd166" stroke-width="3"/>${[380, 395, 410].map(x => `<circle cx="${x}" cy="160" r="7" fill="#ffd166"/>`).join('')}<path d="M400,168 L400,760" stroke="#ffd166" stroke-width="3"/></g>
    <!-- livres -->
    <g data-hl="=4"><path d="M560,760 L560,280 M560,280 L530,170 M560,280 L575,165 M560,280 L600,180" stroke="#ff6b5e" stroke-width="3" fill="none"/></g>
    <!-- Ruffini -->
    <g data-hl="=4"><rect x="720" y="400" width="80" height="30" rx="14" fill="#fff4e6" stroke="#c7b1ff" stroke-width="3"/><path d="M730,415 l10,-8 l10,16 l10,-16 l10,16 l10,-16 l10,8" stroke="#c7b1ff" stroke-width="2" fill="none"/><path d="M760,430 L760,760" stroke="#c7b1ff" stroke-width="3"/></g>
    <!-- Pacini -->
    <g data-hl="=4">${[46, 38, 30, 22, 14].map((r, i) => `<ellipse cx="470" cy="680" rx="${r}" ry="${r * 1.5}" fill="${i % 2 ? '#fff4e6' : '#f1e0c8'}" stroke="#ff8a1f" stroke-width="1.6"/>`).join('')}<path d="M470,700 L470,760" stroke="#ff8a1f" stroke-width="3"/></g>
    <!-- folículo -->
    <path d="M880,90 L870,500" stroke="#3a2a26" stroke-width="7"/><path d="M852,300 C880,280 900,300 890,500 L850,500 C840,300 852,300 852,300Z" fill="none" stroke="#9fc0ae" stroke-width="2"/>
    <path d="M870,430 C900,440 900,470 870,480" stroke="#8fd3ff" stroke-width="3" fill="none"/><path d="M880,480 L880,760" stroke="#8fd3ff" stroke-width="3"/>
    <g data-s="3-4">
      ${callout(180, 210, 180, 60, 'Meissner', { anchor: 'middle', cls: 'lb', sub: 'toque leve, vibração baixa · RÁPIDA' })}
      ${callout(395, 160, 400, 90, 'Merkel', { anchor: 'middle', cls: 'lb', sub: 'pressão, forma, textura · LENTA' })}
      ${callout(560, 175, 620, 60, 'Terminações livres', { anchor: 'start', cls: 'lb', sub: 'dor, temperatura' })}
      ${callout(760, 415, 700, 530, 'Ruffini', { anchor: 'end', cls: 'lb', sub: 'estiramento da pele · LENTA' })}
      ${callout(500, 660, 580, 590, 'Pacini', { anchor: 'start', cls: 'lb lo', sub: 'vibração alta · RAPIDÍSSIMA' })}
      ${callout(890, 460, 960, 560, 'Folículo piloso', { anchor: 'end', cls: 'ls' })}
    </g>
  `);

  /* ---------- cena D: adaptação ---------- */
  const spikes = (xs, y) => xs.map(x => `<path d="M${x},${y} L${x + 4},${y - 50} L${x + 8},${y + 6}" stroke="#ff8a1f" stroke-width="2.6" fill="none"/>`).join('');
  const adapt = svg(`
    <text x="40" y="60" class="lt">Adaptação ao mesmo estímulo mantido</text>
    <rect x="200" y="100" width="600" height="40" fill="#ffd166" opacity=".25"/><text x="500" y="126" text-anchor="middle" class="ls" fill="#ffd166">estímulo constante (ex.: pressão)</text>
    <text x="180" y="260" text-anchor="end" class="lb">Tônico</text><text x="180" y="284" text-anchor="end" class="lx">adaptação lenta</text>
    <line x1="100" y1="280" x2="950" y2="280" stroke="#5f8a75"/>
    ${spikes([200, 214, 228, 244, 262, 282, 304, 328, 354, 382, 412, 444, 478, 512, 548, 584, 620, 656, 692, 728, 764], 280)}
    <text x="180" y="440" text-anchor="end" class="lb">Fásico</text><text x="180" y="464" text-anchor="end" class="lx">adaptação rápida</text>
    <line x1="100" y1="460" x2="950" y2="460" stroke="#5f8a75"/>
    ${spikes([200, 212, 226, 244], 460)}${spikes([800, 812], 460)}
    <text x="820" y="420" class="lx lo">“off”</text>
    <g data-s="=5">${tag(500, 560, 'tônicos: dor, Merkel, Ruffini, fuso, barorreceptor → avisam enquanto durar', { fs: 15 })}${tag(500, 610, 'fásicos: Pacini, Meissner, folículo → avisam o que MUDOU', { o: 1, fs: 15 })}</g>
  `);

  /* ---------- cena E: campo receptivo e dois pontos ---------- */
  const campo = svg(`
    <text x="40" y="60" class="lt">Campo receptivo e discriminação de dois pontos</text>
    <g transform="translate(60,110)">
      <rect x="0" y="0" width="400" height="300" rx="24" fill="#f2c7ae" opacity=".9"/>
      <text x="200" y="-14" text-anchor="middle" class="lb">Ponta do dedo</text>
      ${Array.from({ length: 24 }, (_, i) => `<circle cx="${40 + (i % 6) * 64}" cy="${40 + Math.floor(i / 6) * 72}" r="26" fill="#62dcc8" opacity=".35" stroke="#1f7f70"/>`).join('')}
      <circle cx="136" cy="150" r="6" fill="#ff8a1f"/><circle cx="200" cy="150" r="6" fill="#ff8a1f"/>
      ${tag(200, 340, '≈ 2 mm → sente DOIS pontos', { o: 1, fs: 15 })}
    </g>
    <g transform="translate(540,110)">
      <rect x="0" y="0" width="400" height="300" rx="24" fill="#f2c7ae" opacity=".9"/>
      <text x="200" y="-14" text-anchor="middle" class="lb">Costas</text>
      ${[[90, 90], [300, 90], [90, 230], [300, 230]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="92" fill="#62dcc8" opacity=".25" stroke="#1f7f70"/>`).join('')}
      <circle cx="60" cy="100" r="6" fill="#ff8a1f"/><circle cx="130" cy="100" r="6" fill="#ff8a1f"/>
      ${tag(200, 340, '≈ 40 mm → sente UM ponto só', { fs: 15 })}
    </g>
    ${tag(500, 560, 'campos pequenos e numerosos = alta resolução', { o: 1, fs: 16 })}
    ${tag(500, 610, 'mais receptores → mais córtex → homúnculo com mão e lábio gigantes', { fs: 15 })}
    ${tag(500, 660, 'inibição lateral deixa as bordas ainda mais nítidas', { fs: 15 })}
  `);

  DA.topic({
    id: 'receptores', section: 'Sinal nervoso',
    short: 'Estímulos e receptores',
    title: 'Estímulos primários e <em>receptores</em>',
    card: 'Transdução, modalidades, pele, adaptação, campo receptivo',
    lede: 'O cérebro não enxerga luz nem ouve som: ele só recebe potenciais de ação. Os receptores são tradutores, cada um especializado numa forma de energia, que convertem o mundo em linguagem elétrica.',
    fig: () => `<div class="scene" data-s="0-1">${trans}</div><div class="scene" data-s="=2">${modal}</div><div class="scene" data-s="3-4">${pele}</div><div class="scene" data-s="=5">${adapt}</div><div class="scene" data-s="6-7">${campo}</div>`,
    steps: [
      {
        k: 'Transdução', t: '<em>Transdução</em>: energia vira sinal elétrico',
        p: 'O estímulo abre (ou fecha) canais iônicos na membrana do receptor. O resultado é o <b>potencial receptor</b>, um <b>potencial graduado</b>: quanto mais forte o estímulo, maior a despolarização. Se ele atingir o limiar na zona de gatilho, surgem <b>potenciais de ação</b>, cuja <b>frequência</b> é proporcional à intensidade.',
        why: 'O potencial de ação é tudo ou nada, não tem como ser “maior”. Então a intensidade precisa ser codificada de outro jeito: pela <b>frequência de disparo</b> e pelo <b>número de receptores recrutados</b> (código de população).',
        an: 'Como o código Morse: cada batida tem sempre o mesmo tamanho, e a mensagem está no ritmo e na quantidade de batidas.'
      },
      {
        k: 'Modalidades', t: 'Cada receptor tem um <em>estímulo adequado</em>',
        p: 'Cada tipo de receptor é muito mais sensível a uma forma de energia: o seu <b>estímulo adequado</b>. São estímulos primários: mecânico, térmico, químico, luminoso e nocivo.',
        why: '<b>Lei das energias nervosas específicas (Müller) e princípio da linha marcada</b>: a sensação que você percebe depende de <b>qual via</b> foi ativada, e não de como ela foi ativada. Aperte o olho fechado (estímulo mecânico) e você verá luzes, porque ativou a via visual.',
        an: 'Cada fio chega a uma lâmpada diferente no cérebro. Não importa o que acende o fio: acende sempre a mesma lâmpada.'
      },
      {
        k: 'Na pele', t: 'Receptores da <em>pele</em>',
        p: 'A pele tem vários mecanorreceptores em profundidades diferentes, cada um especializado:',
        keys: ['<b>Meissner</b> (papilas dérmicas, pele glabra): toque leve e vibração de baixa frequência.', '<b>Merkel</b> (base da epiderme): pressão mantida, forma e textura (leitura em braile).', '<b>Pacini</b> (hipoderme, cápsula em “cebola”): vibração de alta frequência (≈250 Hz).', '<b>Ruffini</b> (derme): estiramento da pele e posição dos dedos.', '<b>Terminações livres</b>: dor, temperatura e coceira.'],
        why: 'A profundidade e a cápsula decidem o que o receptor sente. Os mais <b>superficiais</b> têm campos pequenos (detalhe). Os mais <b>profundos</b> têm campos grandes (vibração, estiramento).'
      },
      {
        k: 'Estrutura', t: 'Por que a <em>cápsula</em> importa',
        p: 'O corpúsculo de <b>Pacini</b> tem uma cápsula de camadas concêntricas cheias de líquido em volta da terminação nervosa. Uma pressão mantida deforma as camadas no início, mas o líquido se redistribui e a terminação no centro deixa de ser comprimida: o receptor se cala.',
        why: 'A cápsula funciona como um <b>filtro</b>: deixa passar só a mudança rápida (vibração) e descarta o constante. Por isso o Pacini é o receptor que se adapta mais rápido. Tire a cápsula em laboratório e a terminação passa a responder a pressão mantida.',
        an: 'Um amortecedor de carro: absorve o peso constante e só transmite os solavancos.'
      },
      {
        k: 'Adaptação', t: '<em>Tônicos</em> × <em>fásicos</em>',
        keys: ['<b>Tônicos</b> (adaptação lenta): continuam disparando enquanto o estímulo dura. Informam <b>quanto e por quanto tempo</b>. Ex.: nociceptores, Merkel, Ruffini, fusos musculares, barorreceptores.', '<b>Fásicos</b> (adaptação rápida): disparam só no início (e às vezes no fim). Informam <b>mudança</b>. Ex.: Pacini, Meissner, folículo piloso.'],
        why: 'É por isso que você para de sentir a roupa segundos depois de vestir (fásicos), mas a dor de um dente continua (tônicos). Não faria sentido o sistema de alarme da dor “se acostumar”: ela precisa continuar avisando enquanto o dano existir.',
        an: 'O fásico é o sensor de presença que acende a luz quando você entra e apaga se você fica parado. O tônico é o interruptor comum.'
      },
      {
        k: 'Campo receptivo', t: '<em>Campo receptivo</em> e acuidade',
        p: 'Campo receptivo é a área do corpo que, estimulada, ativa um neurônio sensitivo. Na ponta dos dedos, os campos são <b>pequenos e muito numerosos</b>. Nas costas, <b>grandes e esparsos</b>. Por isso a distância mínima para perceber dois pontos é de cerca de 2 mm no dedo e cerca de 40 mm nas costas.',
        why: 'Dois pontos só são percebidos como dois quando ativam <b>neurônios diferentes</b>, com um neurônio não ativado entre eles. Campos pequenos permitem isso com pontos próximos. A <b>inibição lateral</b> (o neurônio mais ativado inibe os vizinhos) aumenta ainda mais o contraste.',
        an: 'A resolução de uma câmera: mais pixels, e menores, dão uma imagem mais nítida.'
      },
      {
        k: 'Codificação', t: 'O que o cérebro recebe: <em>4 atributos</em>',
        keys: ['<b>Modalidade</b>: qual receptor/via (linha marcada).', '<b>Localização</b>: qual campo receptivo, mapeado no homúnculo.', '<b>Intensidade</b>: frequência de disparo + número de receptores recrutados.', '<b>Duração</b>: padrão de adaptação (tônico × fásico).'],
        why: 'Com essas quatro informações, e mais nada, o cérebro reconstrói toda a experiência sensorial. Toda sensação é uma <b>interpretação</b> do cérebro: por isso existe o membro fantasma, em que a via é ativada sem o membro existir.',
        clin: '<b>Dor referida</b>: fibras viscerais e cutâneas convergem no mesmo neurônio de 2ª ordem, e o cérebro atribui a dor à pele (infarto sentido no braço esquerdo, apendicite começando no umbigo).'
      }
    ],
    legend: [
      ['Transdução', 'Conversão de uma forma de energia (luz, pressão, química) em sinal elétrico no receptor.'],
      ['Potencial receptor (gerador)', 'Potencial graduado do receptor, proporcional ao estímulo. Se atinge o limiar, gera potenciais de ação.'],
      ['Estímulo adequado', 'Forma de energia para a qual o receptor tem o menor limiar.'],
      ['Linha marcada', 'A modalidade percebida depende da via ativada, não do estímulo.'],
      ['Corpúsculo de Meissner', 'Papilas dérmicas da pele glabra. Toque leve, vibração baixa (≈30 Hz). Adaptação rápida. Campo pequeno.'],
      ['Disco de Merkel', 'Base da epiderme. Pressão mantida, forma, textura. Adaptação lenta. Campo pequeno.'],
      ['Corpúsculo de Pacini', 'Hipoderme, cápsula lamelar. Vibração alta (≈250 Hz). Adaptação muito rápida. Campo grande.'],
      ['Corpúsculo de Ruffini', 'Derme. Estiramento da pele, posição articular. Adaptação lenta. Campo grande.'],
      ['Terminações nervosas livres', 'Nociceptores e termorreceptores (Aδ e C). Canais TRP (TRPV1 = calor/capsaicina, TRPM8 = frio/mentol).'],
      ['Fuso muscular / órgão tendinoso de Golgi', 'Proprioceptores: comprimento/velocidade (fuso) e tensão (Golgi).'],
      ['Receptor tônico', 'Adaptação lenta. Codifica intensidade e duração.'],
      ['Receptor fásico', 'Adaptação rápida. Codifica mudança/velocidade.'],
      ['Campo receptivo', 'Área cuja estimulação altera o disparo de um neurônio sensitivo.'],
      ['Inibição lateral', 'Neurônios ativados inibem os vizinhos, o que aumenta o contraste e a precisão.']
    ],
    clinic: [
      'Teste de discriminação de dois pontos avalia a coluna dorsal e o córtex parietal.',
      'Diapasão de 128 Hz testa a sensibilidade vibratória (Pacini, coluna dorsal). Perde-se cedo na neuropatia diabética.',
      'Capsaicina (TRPV1) dá sensação de calor. Mentol (TRPM8), de frio. Enganam a linha marcada.',
      'Dor referida: convergência víscero-somática no corno posterior.',
      'Membro fantasma: a via central continua ativa e o cérebro atribui a sensação ao membro ausente.',
      'Nociceptores não se adaptam e podem até sensibilizar (hiperalgesia).'
    ]
  });
})();
