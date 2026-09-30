/* 05 · Função dos lobos cerebrais */
(function () {
  const { svg, callout, tag } = H;
  const img = (f, extra = '') => `<image href="img/${f}.webp" x="0" y="0" width="1100" height="775" ${extra}/>`;
  const strip = (d, c, s) => `<path d="${d}" stroke="${c}" stroke-width="26" stroke-linecap="round" fill="none" opacity=".55" data-s="${s}"/>`;
  const spot = (x, y, c, s) => `<g data-s="${s}"><circle cx="${x}" cy="${y}" r="30" fill="${c}" opacity=".35" class="pulse"/><circle cx="${x}" cy="${y}" r="11" fill="${c}" stroke="#fff" stroke-width="2.5"/></g>`;

  const cena = svg(`
    <style>
      .fig .base{transition:opacity .6s, filter .6s}
      .fig .base.dimmed{opacity:.28;filter:grayscale(.7) brightness(.7)}
      .fig image.lit{filter:drop-shadow(0 0 14px rgba(255,138,31,.75))}
    </style>
    ${img('lobos-base', 'class="base" data-cls="dimmed:2-6"')}
    ${img('lobo-frontal', 'class="lit" data-s="=2"')}
    ${img('lobo-parietal', 'class="lit" data-s="=3"')}
    ${img('lobo-temporal', 'class="lit" data-s="=4"')}
    ${img('lobo-occipital', 'class="lit" data-s="=5"')}
    ${img('lobo-cerebelo', 'class="lit" data-s="=6"')}
    <!-- sulcos -->
    <g data-s="=1,=7">
      <path d="M612,22 C590,80 540,140 500,210 C480,260 470,300 468,330" stroke="#ff8a1f" stroke-width="7" fill="none" class="draw"  data-s="=1,=7"/>
      <path d="M320,450 C380,400 450,360 520,335 C620,310 760,330 920,350" stroke="#ff8a1f" stroke-width="7" fill="none" class="draw"  data-s="=1,=7"/>
      <path d="M1000,235 C970,300 940,360 930,420" stroke="#ffd166" stroke-width="6" fill="none" stroke-dasharray="10 8"/>
    </g>
    <g data-s="=1">
      ${callout(560, 110, 560, -20, 'Sulco central (de Rolando)', { anchor: 'middle', cls: 'lb lo' })}
      ${callout(420, 380, 330, 760, 'Sulco lateral (de Sylvius)', { anchor: 'middle', cls: 'lb lo' })}
      ${callout(965, 330, 1060, 150, 'Sulco parieto-occipital', { anchor: 'middle', cls: 'ls' })}
    </g>
    <g data-s="=1,=7">
      <text x="230" y="330" text-anchor="middle" class="lt" style="font-size:34px">FRONTAL</text>
      <text x="760" y="190" text-anchor="middle" class="lt" style="font-size:34px">PARIETAL</text>
      <text x="630" y="480" text-anchor="middle" class="lt" style="font-size:34px">TEMPORAL</text>
      <text x="1010" y="390" text-anchor="middle" class="lt" style="font-size:22px">OCCIP.</text>
    </g>
    <!-- frontal -->
    ${strip('M565,40 C540,100 505,170 470,240 C455,275 445,300 440,320', '#ff8a1f', '=2')}
    ${spot(320, 410, '#ffd166', '=2')}${spot(390, 150, '#a5e8c6', '=2')}
    <g data-s="=2">
      ${callout(505, 170, 700, 110, 'Córtex motor primário (4)', { anchor: 'start', cls: 'lb lo', sub: 'giro pré-central · move o lado oposto' })}
      ${callout(390, 150, 330, 30, 'Pré-motor (6) e campo ocular (8)', { anchor: 'middle', sub: 'planeja o movimento' })}
      ${callout(320, 410, 190, 620, 'Área de Broca (44/45)', { anchor: 'middle', cls: 'lb', sub: 'produção da fala' })}
      ${callout(120, 280, 120, 170, 'Córtex pré-frontal', { anchor: 'middle', cls: 'lb', sub: 'decisão · personalidade' })}
    </g>
    <!-- parietal -->
    ${strip('M630,40 C600,100 565,170 530,240 C515,275 505,300 500,320', '#ff8a1f', '=3')}
    ${spot(700, 290, '#a5e8c6', '=3')}${spot(850, 300, '#ffd166', '=3')}
    <g data-s="=3">
      ${callout(570, 170, 380, 110, 'Somatossensorial primário (3,1,2)', { anchor: 'end', cls: 'lb lo', sub: 'giro pós-central · homúnculo' })}
      ${callout(760, 140, 820, 30, 'Associação somatossensorial (5,7)', { anchor: 'middle', sub: 'reconhecer objetos pelo tato' })}
      ${callout(700, 290, 600, 620, 'Supramarginal (40)', { anchor: 'middle', cls: 'lb' })}
      ${callout(850, 300, 900, 620, 'Angular (39)', { anchor: 'middle', cls: 'lb', sub: 'leitura · cálculo' })}
    </g>
    <!-- temporal -->
    ${spot(560, 385, '#ff8a1f', '=4')}${spot(740, 390, '#ffd166', '=4')}
    <g data-s="=4">
      <ellipse cx="560" cy="540" rx="150" ry="36" fill="none" stroke="#c7b1ff" stroke-width="4" stroke-dasharray="10 8"/>
      ${callout(560, 385, 420, 260, 'Auditivo primário (41/42)', { anchor: 'middle', cls: 'lb lo', sub: 'giro de Heschl' })}
      ${callout(740, 390, 800, 260, 'Área de Wernicke (22)', { anchor: 'middle', cls: 'lb', sub: 'compreensão da linguagem' })}
      ${callout(560, 575, 300, 730, 'Hipocampo e amígdala (face medial)', { anchor: 'middle', cls: 'lb', sub: 'memória · medo' })}
      ${callout(820, 510, 950, 700, 'Giro fusiforme (inferior)', { anchor: 'middle', sub: 'reconhecer rostos' })}
    </g>
    <!-- occipital -->
    ${spot(1050, 430, '#ff8a1f', '=5')}
    <g data-s="=5">
      ${callout(1050, 430, 1000, 640, 'Visual primário (17)', { anchor: 'middle', cls: 'lb lo', sub: 'sulco calcarino (face medial)' })}
      ${callout(960, 320, 820, 120, 'Associação visual (18/19)', { anchor: 'middle', cls: 'lb' })}
      <path d="M940,300 C860,200 760,140 650,120" stroke="#a5e8c6" stroke-width="5" fill="none" marker-end="url(#arrG)"/>
      <path d="M930,470 C860,520 760,540 650,540" stroke="#ffd166" stroke-width="5" fill="none" marker-end="url(#arrY)"/>
      ${tag(560, 90, 'via dorsal: ONDE / COMO (parietal)', { fs: 15, fill: '#a5e8c6' })}
      ${tag(520, 580, 'via ventral: O QUÊ (temporal)', { fs: 15, fill: '#ffd166' })}
    </g>
    <!-- ínsula e cerebelo -->
    <g data-s="=6">
      <ellipse cx="470" cy="360" rx="90" ry="34" fill="#c7b1ff" opacity=".35" stroke="#c7b1ff" stroke-width="3" stroke-dasharray="8 6"/>
      ${callout(470, 360, 330, 230, 'Ínsula (escondida no sulco lateral)', { anchor: 'middle', cls: 'lb', sub: 'gustação (43) · interocepção · nojo' })}
      ${callout(780, 640, 950, 730, 'Cerebelo (não é lobo)', { anchor: 'middle', cls: 'lb', sub: 'coordenação · equilíbrio' })}
    </g>
  `, '-40 -60 1180 860');

  DA.topic({
    short: 'Lobos cerebrais',
    title: 'Função dos <em>lobos</em> cerebrais',
    card: 'Frontal, parietal, temporal, occipital, ínsula e límbico',
    lede: 'Cada lobo é um departamento com especialidades, mas nenhum trabalha sozinho. Saber o que cada um faz é saber prever o que o paciente perde quando um deles é lesado.',
    fig: () => `<div class="scene" data-s="0-7">${cena}</div>`,
    steps: [
      {
        k: 'Mapa', t: 'O mapa: <em>sulcos</em> que dividem os lobos',
        p: 'Três fissuras delimitam os lobos na face lateral. O <b>sulco central</b> separa frontal de parietal. O <b>sulco lateral</b> separa o temporal dos lobos de cima. O <b>sulco parieto-occipital</b> separa parietal de occipital. Há ainda dois lobos escondidos: a <b>ínsula</b> (no fundo do sulco lateral) e o <b>límbico</b> (face medial).',
        why: 'O sulco central é a fronteira mais importante do cérebro: <b>na frente dele tudo é motor</b> (executar) e <b>atrás dele tudo é sensitivo</b> (perceber). Essa regra explica boa parte da neuroanatomia funcional.',
        an: 'O cérebro como uma empresa: a frente é a diretoria que decide e executa, e a parte de trás é o setor de inteligência que coleta e interpreta informações.'
      },
      {
        k: 'Frontal', t: 'Lobo <em>frontal</em>: decidir e executar',
        keys: ['<b>Motor primário (4)</b>, giro pré-central: comanda os músculos do lado <b>oposto</b> (homúnculo motor).', '<b>Pré-motor e área motora suplementar (6)</b>: planejam e sequenciam movimentos. <b>Campo ocular frontal (8)</b>: olhar voluntário.', '<b>Broca (44/45)</b>: programa motor da fala (hemisfério dominante).', '<b>Pré-frontal</b>: funções executivas, planejamento, memória de trabalho, controle de impulsos, personalidade, julgamento social.'],
        why: 'O pré-frontal é o último a amadurecer (a mielinização vai até cerca dos 25 anos). Por isso adolescentes têm mais dificuldade de frear impulsos: o freio ainda está sendo instalado.',
        clin: 'Lesão pré-frontal: desinibição, apatia (abulia), perda do julgamento social e reflexos primitivos. Caso clássico: <b>Phineas Gage</b>, que mudou de personalidade após uma barra de ferro atravessar o lobo frontal.'
      },
      {
        k: 'Parietal', t: 'Lobo <em>parietal</em>: sentir e localizar',
        keys: ['<b>Somatossensorial primário (3, 1, 2)</b>, giro pós-central: tato, dor, temperatura e propriocepção do lado oposto (homúnculo sensitivo).', '<b>Associação somatossensorial (5, 7)</b>: reconhecer objetos pelo tato (estereognosia) e integrar o corpo no espaço.', '<b>Lobo parietal inferior</b>: giro supramarginal (40) e angular (39), com linguagem escrita, cálculo e praxia.'],
        why: 'No homúnculo, mão, lábios e língua são enormes porque a área cortical é proporcional à <b>densidade de receptores</b>, e não ao tamanho da parte do corpo. Mais receptores precisam de mais neurônios para serem lidos.',
        clin: 'Lesão parietal <b>não dominante</b> (direita): <b>heminegligência</b>, em que o paciente ignora o lado esquerdo do mundo e do corpo. Lesão parietal <b>dominante</b> (angular): <b>síndrome de Gerstmann</b> (acalculia, agrafia, agnosia digital, confusão direita-esquerda).'
      },
      {
        k: 'Temporal', t: 'Lobo <em>temporal</em>: ouvir, entender, lembrar',
        keys: ['<b>Auditivo primário (41/42)</b>, giro de Heschl.', '<b>Wernicke (22)</b>: compreensão da linguagem falada (dominante).', '<b>Face medial</b>: <b>hipocampo</b> (forma memórias novas) e <b>amígdala</b> (medo e emoção).', '<b>Face inferior</b>: giro fusiforme, que reconhece rostos e objetos (via visual ventral, “o quê”).'],
        why: 'O hipocampo não guarda as memórias antigas. Ele <b>consolida</b> as novas e depois as “transfere” ao córtex. Por isso lesão hipocampal bilateral causa <b>amnésia anterógrada</b> (não forma memórias novas), mas preserva lembranças antigas (paciente H.M.).',
        clin: 'Epilepsia do lobo temporal: aura de déjà vu, medo, cheiro estranho e automatismos. Lesão da alça de Meyer (radiações ópticas no temporal): <b>quadrantanopsia superior</b> contralateral (“torta no céu”). Giro fusiforme: prosopagnosia (não reconhece rostos).'
      },
      {
        k: 'Occipital', t: 'Lobo <em>occipital</em>: ver',
        keys: ['<b>Visual primário (17)</b>, às margens do sulco calcarino, na face medial: recebe o campo visual <b>oposto</b>.', '<b>Associação visual (18, 19)</b>: forma, cor e movimento.', 'Daqui saem duas vias: <b>dorsal</b> (para o parietal, “onde está e como pegar”) e <b>ventral</b> (para o temporal, “o que é”).'],
        why: 'A mácula (visão central) ocupa uma área enorme do polo occipital e recebe sangue de duas artérias (cerebral posterior e ramos da média). Por isso, num AVC da cerebral posterior, a visão central costuma ser <b>poupada</b>.',
        clin: 'Lesão de V1: <b>hemianopsia homônima contralateral com preservação macular</b>. Lesão bilateral: cegueira cortical. Na <b>síndrome de Anton</b>, o paciente cego nega que está cego.'
      },
      {
        k: 'Ocultos', t: 'Os lobos escondidos: <em>ínsula</em> e <em>límbico</em>',
        keys: ['<b>Ínsula</b>: fica no fundo do sulco lateral, coberta pelos opérculos. Faz gustação (43), interocepção (sentir o próprio corpo: batimentos, estômago), dor visceral e <b>nojo</b>.', '<b>Lobo límbico</b> (face medial): giro do cíngulo (emoção, motivação, atenção) e giro para-hipocampal (memória).', '<b>Cerebelo</b>: não é lobo do cérebro. Coordena, calibra e aprende movimentos (tema 7).'],
        why: 'A ínsula faz a ponte entre o que o corpo sente e o que você sente emocionalmente. Por isso “frio na barriga” e ansiedade andam juntos.',
        an: 'A ínsula é o painel de controle do corpo: mostra fome, sede, batimentos e náusea para a consciência.'
      },
      {
        k: 'Revisão', t: 'Revisão e <em>dominância</em> hemisférica',
        html: `<table><tr><th>Lobo</th><th>Faz</th><th>Lesão típica</th></tr>
          <tr><td><b>Frontal</b></td><td>Motor, fala (Broca), executivo</td><td>Hemiparesia, afasia de Broca, desinibição</td></tr>
          <tr><td><b>Parietal</b></td><td>Tato, espaço, cálculo</td><td>Hipoestesia, heminegligência, Gerstmann</td></tr>
          <tr><td><b>Temporal</b></td><td>Audição, compreensão, memória</td><td>Afasia de Wernicke, amnésia, quadrantanopsia superior</td></tr>
          <tr><td><b>Occipital</b></td><td>Visão</td><td>Hemianopsia com preservação macular</td></tr></table>`,
        why: 'Em cerca de <b>95% dos destros</b> e 70% dos canhotos, a <b>linguagem</b> fica no hemisfério <b>esquerdo</b> (dominante). O direito domina a atenção espacial, a prosódia (emoção da fala) e o reconhecimento de rostos. Por isso afasia aponta para o lado esquerdo e heminegligência para o direito.'
      }
    ],
    legend: [
      ['Sulco central (Rolando)', 'Separa frontal (motor, à frente) de parietal (sensitivo, atrás).'],
      ['Sulco lateral (Sylvius)', 'Separa o temporal do frontal e do parietal. Esconde a ínsula.'],
      ['Sulco parieto-occipital', 'Separa parietal de occipital (mais visível na face medial).'],
      ['Córtex motor primário (4)', 'Giro pré-central. Neurônios piramidais (Betz) da via corticoespinal. Comanda o lado contralateral.'],
      ['Pré-motor / motor suplementar (6)', 'Planejamento e sequência de movimentos. A área motora suplementar inicia movimentos internos.'],
      ['Campo ocular frontal (8)', 'Movimento sacádico voluntário dos olhos para o lado oposto.'],
      ['Área de Broca (44/45)', 'Giro frontal inferior dominante. Planejamento motor da fala e gramática.'],
      ['Córtex pré-frontal (9, 10, 11, 46)', 'Funções executivas, memória de trabalho, personalidade, julgamento, controle inibitório.'],
      ['Somatossensorial primário (3, 1, 2)', 'Giro pós-central. Tato, propriocepção, dor e temperatura contralaterais.'],
      ['Associação somatossensorial (5, 7)', 'Estereognosia, esquema corporal, integração visuoespacial.'],
      ['Giro supramarginal (40) / angular (39)', 'Lobo parietal inferior. Linguagem escrita, leitura, cálculo, praxia.'],
      ['Auditivo primário (41/42)', 'Giro de Heschl, com organização tonotópica.'],
      ['Área de Wernicke (22)', 'Parte posterior do giro temporal superior dominante. Compreensão da linguagem.'],
      ['Hipocampo', 'Face medial do temporal. Consolidação de memória declarativa e navegação espacial.'],
      ['Amígdala', 'Processamento emocional, medo e memória emocional.'],
      ['Giro fusiforme', 'Reconhecimento de faces e objetos (via ventral).'],
      ['Visual primário (17)', 'Margens do sulco calcarino. Recebe o campo visual contralateral.'],
      ['Associação visual (18/19)', 'Forma, cor e movimento. Origem das vias dorsal (onde) e ventral (o quê).'],
      ['Ínsula', 'Gustação (43), interocepção, dor visceral, nojo, integração autonômica.'],
      ['Lobo límbico (cíngulo, para-hipocampal)', 'Emoção, motivação e memória.']
    ],
    clinic: [
      'Frontal: hemiparesia contralateral de predomínio braquiofacial (artéria cerebral média), afasia de Broca, desinibição.',
      'Face medial do frontal (artéria cerebral anterior): paresia de predomínio crural (perna), abulia, incontinência.',
      'Parietal direito: heminegligência esquerda, anosognosia, apraxia de vestir-se.',
      'Parietal esquerdo (giro angular): síndrome de Gerstmann.',
      'Temporal: afasia de Wernicke, amnésia anterógrada (hipocampo), quadrantanopsia superior (alça de Meyer), crises com aura.',
      'Occipital: hemianopsia homônima contralateral com preservação macular. Síndrome de Anton na cegueira cortical.',
      'Lesão bilateral da amígdala (síndrome de Klüver-Bucy): hiperoralidade, hipersexualidade, perda do medo.'
    ]
  });
})();
