/* 04 · Arco reflexo monossináptico e polissináptico */
(function () {
  const { svg, flow, callout, tag, sign, C } = H;
  const SEN = '#62dcc8', MOT = '#ff8a1f', INB = '#ff6b5e', EXC = '#ffd166';

  const medula = (cx, cy, s = 1) => `<g transform="translate(${cx},${cy}) scale(${s})">
      <ellipse cx="0" cy="0" rx="150" ry="118" fill="#efe2cc" stroke="#c9b99b" stroke-width="3"/>
      <path d="M0,-118 L0,-60" stroke="#c9b99b" stroke-width="3"/><path d="M-8,118 L0,78 L8,118" fill="#07201a" stroke="#c9b99b" stroke-width="2"/>
      <g fill="#c98f74">
        <ellipse cx="-44" cy="-58" rx="18" ry="58" transform="rotate(-24 -44 -58)"/><ellipse cx="44" cy="-58" rx="18" ry="58" transform="rotate(24 44 -58)"/>
        <ellipse cx="-56" cy="52" rx="50" ry="42"/><ellipse cx="56" cy="52" rx="50" ry="42"/>
        <rect x="-60" y="-10" width="120" height="36" rx="16"/>
      </g>
      <circle cx="0" cy="8" r="6" fill="#62dcc8"/>
    </g>`;

  /* ---------- cena A: reflexo patelar ---------- */
  const Ia = 'M470,268 C510,220 560,190 612,196 L650,205 C682,214 690,250 688,300 L680,352';
  const alfa = 'M680,352 C640,395 590,405 556,404 C500,402 470,320 440,284';
  const isq = 'M650,382 C620,430 580,436 548,434 C500,432 480,360 450,330';
  const patelar = svg(`
    <style>
      .fig .shank{transform-box:view-box;transform-origin:250px 300px}
      .fig .shank.kick{animation:kick 2.4s ease-in-out infinite}
      @keyframes kick{0%,18%{transform:rotate(0)}32%{transform:rotate(38deg)}62%,100%{transform:rotate(0)}}
      .fig .hammer{transform-box:view-box;transform-origin:110px 420px}
      .fig .hammer.tap{animation:tap 2.4s ease-in-out infinite}
      @keyframes tap{0%{transform:rotate(-28deg)}14%{transform:rotate(0)}22%,100%{transform:rotate(-28deg)}}
    </style>
    ${medula(760, 300)}
    <text x="760" y="455" text-anchor="middle" class="ls">medula espinal · L2–L4</text>
    <!-- raízes -->
    <path d="M612,196 C640,200 660,205 700,215" stroke="${SEN}" stroke-width="10" opacity=".25" fill="none"/>
    <ellipse cx="605" cy="196" rx="30" ry="18" fill="${SEN}" opacity=".35" data-hl="=2"/>
    <!-- coxa -->
    <rect x="250" y="250" width="260" height="46" rx="20" fill="#e0736b" data-hl="=3,=4"/>
    <rect x="250" y="296" width="260" height="46" rx="20" fill="#9c4a55" data-hl="=5"/>
    <text x="268" y="280" class="lb" fill="#3a0f0c" style="stroke:none">Quadríceps</text>
    <text x="268" y="327" class="lb" style="stroke:none" fill="#f7dada">Isquiotibiais</text>
    <!-- fuso muscular -->
    <g data-hl="=2"><path d="M420,268 C435,258 465,258 480,268 C465,278 435,278 420,268Z" fill="#fff4e6" stroke="${SEN}" stroke-width="2"/><path d="M440,268 q3,-7 6,0 q3,7 6,0 q3,-7 6,0" stroke="${SEN}" stroke-width="2" fill="none"/></g>
    <!-- joelho, perna -->
    <circle cx="250" cy="300" r="30" fill="#e8b9a0"/>
    <g class="shank" data-cls="kick:3-6">
      <rect x="226" y="300" width="50" height="300" rx="22" fill="#e8b9a0"/>
      <path d="M232,600 C200,600 170,610 170,624 L260,624 C272,624 272,606 262,600Z" fill="#e8b9a0"/>
      <path d="M232,288 L236,368" stroke="#fff4e6" stroke-width="7" stroke-linecap="round" data-hl="=3"/>
    </g>
    <ellipse cx="226" cy="284" rx="12" ry="18" fill="#fff4e6"/>
    <!-- martelo -->
    <g data-s="3"><g class="hammer" data-cls="tap:3-6"><g transform="rotate(-41.6 110 420)"><rect x="110" y="415" width="120" height="10" rx="4" fill="#cfe2d7"/><rect x="222" y="394" width="28" height="52" rx="8" fill="#ff8a1f"/></g></g></g>
    <!-- vias -->
    <path d="${Ia}" stroke="${SEN}" stroke-width="4" fill="none"/>
    <path d="${alfa}" stroke="${MOT}" stroke-width="4" fill="none"/>
    <path d="${isq}" stroke="${MOT}" stroke-width="3" fill="none" opacity=".55"/>
    <circle cx="680" cy="352" r="13" fill="${MOT}" data-hl="=4"/>
    <circle cx="650" cy="382" r="11" fill="${MOT}" opacity=".7"/>
    <g data-s="5"><path d="M688,300 C700,320 712,330 716,340" stroke="${SEN}" stroke-width="3" fill="none"/><circle cx="716" cy="344" r="10" fill="${INB}"/><path d="M716,344 C700,370 680,380 662,382" stroke="${INB}" stroke-width="3" fill="none"/>${sign(700, 395, false)}</g>
    <g data-s="=2"><path d="M700,372 C640,440 540,300 465,268" stroke="${MOT}" stroke-width="2" stroke-dasharray="4 5" fill="none"/>${tag(560, 480, 'motoneurônio γ regula a sensibilidade do fuso', { fs: 14 })}</g>
    <!-- fluxos -->
    <g data-s="3">${flow({ d: Ia, n: 5, dur: 1.6, r: 6, fill: SEN })}</g>
    <g data-s="4">${flow({ d: alfa, n: 5, dur: 1.6, r: 6, fill: MOT })}</g>
    <g data-s="5">${flow({ d: 'M688,300 C700,320 712,330 716,344 C700,370 680,380 662,382', n: 3, dur: 1.2, r: 5, fill: INB })}</g>
    <!-- rótulos -->
    <g data-s="1">
      ${callout(450, 268, 400, 190, 'Fuso muscular', { anchor: 'middle', cls: 'lb', sub: '1 · receptor' })}
      ${callout(605, 196, 560, 120, 'Gânglio da raiz dorsal', { anchor: 'middle', sub: '2 · via aferente (fibra Ia)' })}
      ${callout(688, 300, 850, 150, 'Sinapse na substância cinzenta', { anchor: 'middle', sub: '3 · centro integrador' })}
      ${callout(556, 404, 480, 520, 'Motoneurônio α → raiz ventral', { anchor: 'middle', sub: '4 · via eferente' })}
      ${callout(380, 262, 200, 200, 'Efetor', { anchor: 'middle', sub: '5 · quadríceps contrai' })}
    </g>
    <g data-s="=5">${callout(716, 344, 880, 480, 'Interneurônio inibitório Ia', { anchor: 'middle', cls: 'lb', sub: 'isquiotibiais relaxam' })}</g>
    <g data-s="=4">${tag(720, 560, '1 sinapse só · latência ≈ 20–30 ms', { o: 1, fs: 16 })}</g>
    <g data-s="=6">${tag(560, 560, 'bicipital C5–C6 · tricipital C7', { fs: 16 })}${tag(560, 610, 'patelar L3–L4 · aquileu S1', { o: 1, fs: 16 })}</g>
  `);

  /* ---------- cena B: retirada + extensor cruzado ---------- */
  const legL = (x, id) => `<g class="${id}">
      <rect x="${x - 26}" y="470" width="52" height="130" rx="22" fill="#e8b9a0"/>
      <rect x="${x - 22}" y="590" width="44" height="120" rx="20" fill="#e8b9a0"/>
      <path d="M${x - 22},706 L${x + 50},706 C${x + 60},706 ${x + 60},724 ${x + 50},724 L${x - 22},724Z" fill="#e8b9a0"/></g>`;
  const noci = 'M728,700 C780,600 820,420 800,320 C790,260 720,230 646,226 L585,222';
  const flexR = 'M590,300 C640,360 700,420 720,520';
  const extL = 'M410,312 C360,370 300,420 286,520';
  const retirada = svg(`
    <style>
      .fig .legR{transition:transform .8s cubic-bezier(.3,1.3,.5,1);transform-box:view-box;transform-origin:700px 470px}
      .fig .legR.up{transform:translate(0,-70px) rotate(-8deg)}
      .fig .push rect{fill:#ffb567}
    </style>
    ${medula(500, 250, .9)}
    <text x="500" y="378" text-anchor="middle" class="ls">medula espinal (corte)</text>
    <rect x="240" y="440" width="520" height="40" rx="20" fill="#e8b9a0" opacity=".8"/>
    <g data-cls="push:9">${legL(300, 'legL')}</g>
    <g class="legR" data-cls="up:7">${legL(700, 'legR2')}</g>
    <line x1="80" y1="730" x2="920" y2="730" stroke="#5f8a75" stroke-width="3"/>
    <path d="M720,728 L740,690 L760,728Z" fill="#cfe2d7"/><text x="770" y="720" class="ls">prego</text>
    <!-- vias -->
    <path d="${noci}" stroke="${SEN}" stroke-width="4" fill="none"/>
    <circle cx="560" cy="250" r="10" fill="${EXC}" data-hl="=8"/>
    <path d="M585,222 L560,250" stroke="${SEN}" stroke-width="3"/>
    <circle cx="590" cy="300" r="12" fill="${MOT}"/>
    <path d="M560,250 L590,300" stroke="${EXC}" stroke-width="3"/>
    <path d="${flexR}" stroke="${MOT}" stroke-width="4" fill="none"/>
    <g data-s="8"><circle cx="545" cy="300" r="9" fill="${INB}"/><path d="M560,250 L545,300" stroke="${EXC}" stroke-width="2.5"/>${sign(520, 330, false)}</g>
    <g data-s="9">
      <path d="M560,250 C530,275 470,275 440,290" stroke="${EXC}" stroke-width="3.5" fill="none" data-hl="=9"/>
      <circle cx="440" cy="292" r="9" fill="${EXC}"/>
      <circle cx="410" cy="312" r="12" fill="${MOT}"/>
      <path d="${extL}" stroke="${MOT}" stroke-width="4" fill="none"/>
    </g>
    <g data-s="10"><path d="M560,250 C520,210 470,210 450,190 L450,30" stroke="#c7b1ff" stroke-width="4" fill="none" marker-end="url(#arr)"/>${flow({ d: 'M560,250 C520,210 470,210 450,190 L450,30', n: 4, dur: 3.4, r: 6, fill: '#c7b1ff' })}${tag(300, 60, 'espinotalâmico → córtex: “ai!”', { fs: 15, fill: '#c7b1ff' })}</g>
    <!-- fluxos -->
    <g data-s="7">${flow({ d: noci, n: 5, dur: 1.8, r: 6, fill: SEN })}</g>
    <g data-s="7">${flow({ d: flexR, n: 4, dur: 1.2, r: 6, fill: MOT })}</g>
    <g data-s="9">${flow({ d: 'M560,250 C530,275 470,275 440,290 L410,312 C360,370 300,420 286,520', n: 5, dur: 1.8, r: 6, fill: EXC })}</g>
    <!-- rótulos -->
    <g data-s="7">${callout(740, 700, 870, 640, 'Nociceptor', { anchor: 'middle', cls: 'lb', sub: 'fibras Aδ e C' })}</g>
    <g data-s="8">${callout(560, 250, 700, 130, 'Interneurônios', { anchor: 'middle', cls: 'lb', sub: 'excitatório + inibitório' })}${tag(830, 470, 'flexores CONTRAEM', { o: 1, fs: 15 })}${tag(830, 510, 'extensores relaxam', { fs: 15 })}</g>
    <g data-s="9">${callout(470, 272, 300, 190, 'Interneurônio comissural', { anchor: 'middle', cls: 'lb lo', sub: 'cruza a linha média' })}${tag(160, 470, 'extensores CONTRAEM', { o: 1, fs: 15 })}${tag(160, 510, 'flexores relaxam', { fs: 15 })}</g>
  `);

  DA.topic({
    short: 'Arco reflexo',
    title: 'Arco reflexo: <em>mono</em> e <em>polissináptico</em>',
    card: 'Patelar, inibição recíproca, retirada e extensor cruzado',
    lede: 'Reflexo é uma resposta automática, rápida e sempre igual, que a medula resolve sozinha, sem esperar o cérebro. Aqui estão os dois modelos que caem em prova: o patelar e o de retirada.',
    fig: () => `<div class="scene" data-s="0-6">${patelar}</div><div class="scene" data-s="7-10">${retirada}</div>`,
    steps: [
      {
        k: '5 componentes', t: 'Os <em>5 componentes</em> de todo arco',
        keys: ['<b>1. Receptor</b>: detecta o estímulo (aqui, o fuso muscular).', '<b>2. Via aferente</b>: neurônio sensitivo, com corpo no gânglio da raiz dorsal.', '<b>3. Centro integrador</b>: sinapse(s) na substância cinzenta da medula.', '<b>4. Via eferente</b>: motoneurônio α, que sai pela raiz ventral.', '<b>5. Efetor</b>: o músculo que responde.'],
        why: 'Se qualquer um dos 5 elos falhar, o reflexo some. Por isso o exame de reflexos é tão útil: ele testa um circuito inteiro, do receptor ao músculo, num segmento específico da medula.',
        an: 'Um circuito elétrico simples: sensor → fio → interruptor → fio → lâmpada. Um fio cortado e a lâmpada não acende.'
      },
      {
        k: 'Fuso muscular', t: 'O receptor: <em>fuso muscular</em>',
        p: 'Dentro do músculo há <b>fusos musculares</b>: fibras intrafusais (em saco nuclear e em cadeia nuclear) envolvidas por terminações sensitivas. Quando o músculo é <b>estirado</b>, o fuso também estica, a terminação anuloespiral deforma e a <b>fibra Ia</b> dispara.',
        why: 'O fuso fica <b>em paralelo</b> com as fibras musculares comuns, por isso mede o <b>comprimento</b> e a velocidade de estiramento do músculo. Os <b>motoneurônios γ</b> contraem as pontas do fuso para mantê-lo esticado mesmo quando o músculo encurta, então o fuso nunca fica “frouxo” e cego.',
        an: 'Um elástico com um alarme preso ao músculo: se alguém puxa o músculo, o alarme toca.',
        deep: '<p>Não confunda com o <b>órgão tendinoso de Golgi</b>, que fica <b>em série</b> no tendão, mede <b>tensão</b>, usa fibras <b>Ib</b> e provoca relaxamento do próprio músculo (reflexo miotático inverso, dissináptico). É um mecanismo de proteção contra força excessiva.</p>'
      },
      {
        k: 'O estímulo', t: 'O martelo <em>estira</em> o quadríceps',
        p: 'A martelada no <b>tendão patelar</b> puxa o tendão para baixo por um instante e <b>estira o quadríceps</b>. Os fusos detectam esse estiramento rápido e as <b>fibras Ia</b> (as mais grossas e mielinizadas do corpo, 80–120 m/s) levam a salva de potenciais de ação até a medula, entrando pela raiz dorsal.',
        why: 'Parece estranho bater no tendão para testar o músculo, mas o que o martelo produz é um <b>estiramento súbito</b>. Para o sistema nervoso, isso é como se o joelho estivesse dobrando sem querer (a pessoa estivesse caindo). A resposta automática é contrair para <b>corrigir</b>.'
      },
      {
        k: '1 sinapse', t: 'Monossináptico: <em>uma única sinapse</em>',
        p: 'No corno anterior (segmentos <b>L2–L4</b>), a fibra Ia faz sinapse <b>diretamente</b> no <b>motoneurônio α</b> do quadríceps, sem interneurônio. O motoneurônio dispara, o sinal sai pela raiz ventral e pelo nervo femoral, o quadríceps contrai e a perna chuta.',
        why: 'Cada sinapse atrasa cerca de <b>0,5 ms</b>. Com uma sinapse só, o reflexo miotático é o mais rápido que existe, e precisa ser: é ele que mantém a postura corrigindo pequenas quedas o tempo todo, antes de você perceber.',
        an: 'Uma ligação direta, sem passar pela telefonista: a mensagem chega na hora.'
      },
      {
        k: 'Inibição recíproca', t: '<em>Inibição recíproca</em>: o antagonista relaxa',
        p: 'Um ramo da mesma fibra Ia ativa um <b>interneurônio inibitório Ia</b> (glicinérgico), que inibe o motoneurônio dos <b>isquiotibiais</b> (antagonistas). Enquanto o quadríceps contrai, os isquiotibiais relaxam.',
        why: 'Se o antagonista contraísse junto, os dois músculos brigariam e a articulação travaria. Por isso o “monossináptico” tem um componente <b>dissináptico</b>: a via para o antagonista tem 2 sinapses. É o mesmo princípio que deixa você andar sem esforço.',
        an: 'Cabo de guerra: para um lado ganhar sem esforço, o outro precisa soltar a corda.',
        clin: '<b>Estricnina</b> e <b>toxina tetânica</b> bloqueiam a glicina desses interneurônios: agonistas e antagonistas contraem juntos e surgem rigidez e espasmos (opistótono, trismo).'
      },
      {
        k: 'Na clínica', t: 'Hiporreflexia × <em>hiperreflexia</em>',
        keys: ['<b>Reflexo diminuído ou abolido</b>: lesão no próprio arco (neuropatia, radiculopatia, lesão do motoneurônio inferior, doença muscular).', '<b>Reflexo exaltado</b> (+ clônus, Babinski): lesão do <b>neurônio motor superior</b> (AVC, lesão medular acima do nível).'],
        why: 'O arco reflexo funciona sozinho, mas o encéfalo manda o tempo todo sinais <b>inibitórios</b> descendentes (vias reticuloespinais) que seguram o ganho do reflexo. Quando o neurônio motor superior é lesado, esse freio some e o reflexo fica exagerado. Na fase aguda (choque medular) o reflexo pode sumir antes de exaltar.',
        an: 'O reflexo é um cachorro bravo e o encéfalo é quem segura a coleira. Coleira solta: o cachorro late para tudo (hiperreflexia).'
      },
      {
        k: 'Polissináptico', t: 'Reflexo de <em>retirada</em> (flexor)',
        p: 'Pisou num prego: <b>nociceptores</b> disparam (fibras Aδ e C) e o sinal chega ao corno posterior. Ali ele passa por <b>interneurônios</b> antes de chegar aos motoneurônios. Os <b>flexores</b> da perna agredida contraem e os <b>extensores</b> dela são inibidos. A perna é recolhida.',
        why: 'Com interneurônios no caminho, a medula consegue <b>distribuir</b> o sinal: vários segmentos, vários músculos e os dois lados do corpo. O reflexo fica mais lento que o patelar (várias sinapses), mas muito mais <b>coordenado</b>. É um programa motor inteiro, não uma contração isolada.'
      },
      {
        k: 'Ipsilateral', t: 'Do mesmo lado: <em>flexores contraem</em>',
        p: 'No lado do prego, interneurônios <b>excitatórios</b> ativam os motoneurônios dos flexores (quadril, joelho, tornozelo) e interneurônios <b>inibitórios</b> desligam os extensores. A perna sobe.',
        why: 'É a mesma lógica da inibição recíproca, agora em vários músculos ao mesmo tempo: para dobrar a perna rápido, todos os músculos que a esticam precisam parar de trabalhar.'
      },
      {
        k: 'Extensor cruzado', t: 'Do outro lado: <em>extensor cruzado</em>',
        p: 'Interneurônios <b>comissurais</b> cruzam a linha média da medula e fazem o contrário na outra perna: <b>ativam os extensores</b> e inibem os flexores. A perna de apoio fica rígida.',
        why: 'Se você recolhe uma perna, todo o peso do corpo cai sobre a outra. Sem o extensor cruzado, a perna de apoio dobraria e você cairia no chão (e talvez em cima do prego). A medula já resolve isso antes de você pensar.',
        an: 'Um time bem treinado: quando um jogador sai para desviar, o outro já se posiciona para segurar a defesa.'
      },
      {
        k: 'E a dor?', t: 'Você tira o pé <em>antes</em> de sentir dor',
        p: 'Paralelamente ao reflexo, o sinal sobe pelo <b>trato espinotalâmico</b> (cruza na medula) até o tálamo e o córtex somatossensorial. Só então a dor fica consciente: o “ai!” vem depois do movimento.',
        why: 'O caminho do reflexo tem alguns centímetros e poucas sinapses. O caminho até o córtex tem mais de um metro e várias estações. O reflexo protege primeiro, e a consciência chega depois para você aprender a não pisar ali de novo.',
        html: `<table><tr><th></th><th>Monossináptico</th><th>Polissináptico</th></tr>
          <tr><td>Exemplo</td><td>Patelar (miotático)</td><td>Retirada + extensor cruzado</td></tr>
          <tr><td>Receptor</td><td>Fuso muscular (Ia)</td><td>Nociceptor (Aδ/C)</td></tr>
          <tr><td>Sinapses</td><td>1 (+ inibição recíproca dissináptica)</td><td>Várias (interneurônios)</td></tr>
          <tr><td>Alcance</td><td>1–2 segmentos, 1 músculo</td><td>Vários segmentos, bilateral</td></tr>
          <tr><td>Velocidade</td><td>Muito rápida</td><td>Mais lenta, mais coordenada</td></tr></table>`
      }
    ],
    legend: [
      ['Fuso muscular', 'Receptor de estiramento (comprimento e velocidade), em paralelo às fibras musculares. Fibras intrafusais inervadas por Ia/II (sensitivas) e γ (motoras).'],
      ['Fibra Ia', 'Aferente mais grossa e rápida (Aα, 80–120 m/s). Sai do fuso e faz sinapse direta no motoneurônio α.'],
      ['Gânglio da raiz dorsal', 'Corpos dos neurônios sensitivos pseudounipolares.'],
      ['Corno posterior (dorsal)', 'Região sensitiva da substância cinzenta. Recebe as aferências.'],
      ['Corno anterior (ventral)', 'Contém os motoneurônios α e γ (neurônios motores inferiores).'],
      ['Motoneurônio α', 'Inerva as fibras extrafusais (as que fazem força). Via final comum.'],
      ['Motoneurônio γ', 'Inerva as fibras intrafusais e ajusta a sensibilidade do fuso.'],
      ['Interneurônio inibitório Ia', 'Glicinérgico. Inibe o antagonista (inibição recíproca).'],
      ['Órgão tendinoso de Golgi', 'Receptor de tensão em série no tendão. Fibras Ib. Relaxa o próprio músculo (reflexo miotático inverso).'],
      ['Nociceptor', 'Terminação livre sensível a lesão tecidual. Aδ (dor rápida, em pontada) e C (dor lenta, em queimação).'],
      ['Interneurônio comissural', 'Cruza a linha média da medula e coordena o lado oposto (extensor cruzado).'],
      ['Trato espinotalâmico', 'Leva dor e temperatura ao tálamo e ao córtex. Cruza na própria medula.']
    ],
    clinic: [
      'Níveis: bicipital C5–C6 · estilorradial C6 · tricipital C7 · patelar L3–L4 (L2–L4) · aquileu S1.',
      'Hiporreflexia: lesão do arco (neurônio motor inferior, raiz, nervo, músculo). Hiperreflexia: lesão do neurônio motor superior.',
      'Sinal de Babinski (extensão do hálux) indica lesão piramidal. É normal até cerca de 1–2 anos, antes da mielinização completa.',
      'Choque medular: na fase aguda de uma lesão medular os reflexos somem abaixo do nível. Depois voltam exaltados.',
      'Manobra de Jendrassik (puxar as mãos entrelaçadas) aumenta o reflexo por aumentar a atividade γ e reduzir a inibição.',
      'Pegadinha: o reflexo patelar é monossináptico para o agonista, mas a inibição do antagonista é dissináptica.'
    ]
  });
})();
