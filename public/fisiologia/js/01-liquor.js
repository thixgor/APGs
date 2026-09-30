/* 01 · Circulação do líquor */
(function () {
  const { svg, flow, callout, tag, ion, C } = H;

  /* --- cena A: esquema sagital do sistema ventricular --- */
  const brain = 'M160,420 C140,260 300,110 510,105 C720,100 880,210 885,380 C888,470 840,530 770,545 C700,560 640,540 600,560 C560,580 520,600 470,590 C420,580 400,560 350,560 C260,560 175,520 160,420Z';
  const latV = 'M325,352 C350,300 430,275 520,278 C610,281 670,305 690,350 C705,390 680,440 620,462 C590,472 565,470 548,462';
  const occH = 'M688,345 C720,350 760,362 790,385';
  const third = 'M432,338 C470,330 540,336 560,362 C572,392 560,428 532,440 C502,450 472,446 452,430 C432,410 426,372 432,338Z';
  const fourth = 'M598,500 L676,582 L614,642 C600,604 594,552 598,500Z';
  const sss = 'M190,300 C215,190 330,80 510,76 C720,72 902,200 910,390 C912,450 902,510 884,560';
  const plexo = (x, y, s = 1, ex = '') => `<g transform="translate(${x},${y}) scale(${s})" ${ex}>${[[0, 0], [9, -5], [17, 2], [7, 8], [-8, 6], [-4, -8], [14, -12]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="7" fill="#e5707a" stroke="#ffb3b8" stroke-width="1"/>`).join('')}</g>`;

  const esquema = svg(`
    <!-- crânio, dura, espaço subaracnóideo -->
    <path d="${brain}" fill="none" stroke="#c8b99a" stroke-width="64" opacity=".22"/>
    <path d="${brain}" fill="none" stroke="#3b5f52" stroke-width="44"/>
    <path d="${brain}" fill="none" stroke="${C.csf}" stroke-opacity=".45" stroke-width="26" data-hl="=6"/>
    <!-- medula espinal e espaço subaracnóideo espinal -->
    <path d="M548,560 C556,620 566,680 572,780 L646,780 C646,690 652,620 662,560Z" fill="none" stroke="${C.csf}" stroke-opacity=".4" stroke-width="22"/>
    <ellipse cx="730" cy="612" rx="112" ry="72" fill="none" stroke="${C.csf}" stroke-opacity=".4" stroke-width="22"/>
    <ellipse cx="690" cy="700" rx="62" ry="26" fill="${C.csf}" fill-opacity=".55" data-hl="=5"/>
    <!-- encéfalo -->
    <path d="${brain}" fill="#e7a795" stroke="#b86d5e" stroke-width="2"/>
    <path d="M300,240 C340,200 380,230 420,200 M560,160 C600,190 650,170 690,210 M740,260 C780,280 800,320 830,330 M230,380 C260,340 300,360 320,330" stroke="#c07b6b" stroke-width="3" fill="none" opacity=".7"/>
    <ellipse cx="730" cy="612" rx="105" ry="66" fill="#e39a8b" stroke="#b86d5e" stroke-width="2"/>
    <path d="M660,600 C700,590 760,590 820,610 M670,625 C710,618 770,622 815,632 M680,648 C720,645 760,648 800,652" stroke="#c07b6b" stroke-width="2.5" fill="none"/>
    <path d="M548,560 C556,620 566,680 572,780 L646,780 C646,690 652,620 662,560Z" fill="#e8b9a0" stroke="#b86d5e" stroke-width="2"/>
    <!-- seio sagital superior e confluência -->
    <path d="${sss}" fill="none" stroke="${C.vein}" stroke-width="18" stroke-linecap="round" data-hl="7-8"/>
    <circle cx="884" cy="566" r="16" fill="${C.vein}" data-hl="=8"/>
    <!-- granulações aracnóideas -->
    <g data-hl="=7">${[[420, 88], [600, 80], [760, 118]].map(([x, y]) => `<g transform="translate(${x},${y})"><circle r="8" fill="${C.csf}"/><circle cx="-7" cy="4" r="6" fill="${C.csf}"/><circle cx="7" cy="4" r="6" fill="${C.csf}"/></g>`).join('')}</g>
    <!-- ventrículos -->
    <g class="vent" data-cls="big:=9">
      <path d="${latV}" fill="none" stroke="#1f7f70" stroke-width="36" stroke-linecap="round" class="vw"/>
      <path d="${occH}" fill="none" stroke="#1f7f70" stroke-width="30" stroke-linecap="round" class="vw"/>
      <path d="${latV}" fill="none" stroke="${C.csf}" stroke-width="28" stroke-linecap="round" data-hl="=3" class="vi"/>
      <path d="${occH}" fill="none" stroke="${C.csf}" stroke-width="22" stroke-linecap="round" class="vi"/>
      <path d="${third}" fill="${C.csf}" stroke="#1f7f70" stroke-width="3" data-hl="=4"/>
    </g>
    <path d="M462,318 L452,346" stroke="${C.csf}" stroke-width="12" stroke-linecap="round" data-hl="=3"/>
    <path d="M540,436 L602,504" stroke="#1f7f70" stroke-width="12" stroke-linecap="round"/>
    <path d="M540,436 L602,504" stroke="${C.csf}" stroke-width="7" stroke-linecap="round" data-hl="=4"/>
    <path d="${fourth}" fill="${C.csf}" stroke="#1f7f70" stroke-width="3" data-hl="=5"/>
    <path d="M612,642 L608,780" stroke="${C.csf}" stroke-width="4"/>
    <!-- obstrução do aqueduto (hidrocefalia) -->
    <g data-s="=9"><circle cx="571" cy="470" r="15" fill="none" stroke="${C.gaba}" stroke-width="4"/><path d="M560,459 L582,481 M582,459 L560,481" stroke="${C.gaba}" stroke-width="4"/></g>
    <!-- plexos coroides -->
    <g data-hl="=1,=2">${plexo(560, 286)}${plexo(676, 350)}${plexo(626, 452, .9)}${plexo(490, 342, .8)}${plexo(640, 604, .8)}</g>

    <!-- fluxo -->
    <g data-s="1">${flow({ d: 'M560,286 C520,282 470,284 462,318', n: 4, dur: 3, r: 5 })}${flow({ d: 'M676,350 C650,300 560,284 470,300 L456,334', n: 5, dur: 4, r: 5 })}${flow({ d: 'M626,452 C680,420 690,350 620,300 C560,284 480,288 460,330', n: 5, dur: 5, r: 5 })}</g>
    <g data-s="4">${flow({ d: 'M456,340 C480,380 510,410 540,438 L600,504', n: 5, dur: 3.2, r: 5 })}</g>
    <g data-s="5">${flow({ d: 'M600,504 L650,560 L614,640 C640,690 670,700 700,700', n: 5, dur: 3.2, r: 5 })}${flow({ d: 'M612,645 L610,775', n: 3, dur: 3, r: 4 })}</g>
    <g data-s="6">${flow({ d: 'M700,700 C800,700 890,610 905,440 C915,300 800,140 610,98', n: 8, dur: 7, r: 5 })}${flow({ d: 'M700,700 C600,640 520,600 420,592 C300,580 175,530 150,420 C140,300 250,150 420,100', n: 8, dur: 8, r: 5 })}</g>
    <g data-s="7">${flow({ d: 'M600,80 L600,76', n: 1, dur: 1, r: 1 })}</g>
    <g data-s="8">${flow({ d: sss, n: 9, dur: 5, r: 6, fill: C.vein })}</g>

    <!-- rótulos -->
    <g data-s="=1,=2">${callout(560, 286, 470, 190, 'Plexo coroide', { sub: 'ventrículos laterais, 3º e 4º' })}</g>
    <g data-s="3">${callout(340, 345, 230, 300, 'Ventrículo lateral', { sub: 'corno frontal' })}${callout(456, 332, 330, 470, 'Forame interventricular', { sub: '(de Monro)' })}</g>
    <g data-s="4">${callout(500, 390, 385, 650, '3º ventrículo')}${callout(572, 472, 470, 690, 'Aqueduto cerebral', { sub: '(de Sylvius) · 1–2 mm', cls: 'lb lo' })}</g>
    <g data-s="5">${callout(632, 575, 800, 485, '4º ventrículo')}${callout(640, 690, 668, 742, 'Magendie → cisterna magna', { sub: '+ 2 forames de Luschka (laterais)' })}</g>
    <g data-s="6">${callout(210, 470, 110, 560, 'Espaço subaracnóideo', { anchor: 'start', sub: 'envolve encéfalo e medula' })}</g>
    <g data-s="7">${callout(600, 80, 640, 30, 'Granulações aracnóideas', { anchor: 'start', sub: 'válvulas para o seio' })}${callout(300, 150, 150, 120, 'Seio sagital superior', { anchor: 'start' })}</g>
    <g data-s="8">${tag(884, 612, 'Confluência dos seios', { o: 1 })}${tag(830, 740, '→ transverso → sigmoide → jugular interna', { fs: 15 })}</g>
    <g data-s="=9">${tag(300, 700, 'Obstrução no aqueduto → laterais e 3º dilatam', { o: 1, fs: 16 })}</g>
  `);

  /* --- cena B: epitélio do plexo coroide (produção) --- */
  const cell = (x) => `<g transform="translate(${x},0)">
    <rect x="0" y="250" width="180" height="250" rx="16" fill="url(#gCell)" stroke="#3fc584" stroke-opacity=".5" stroke-width="2"/>
    ${Array.from({ length: 9 }, (_, i) => `<rect x="${10 + i * 19}" y="228" width="9" height="26" rx="4.5" fill="#2d8a61"/>`).join('')}
    <ellipse cx="90" cy="420" rx="34" ry="26" fill="#0a2a1f" stroke="#3fc584" stroke-opacity=".4"/>
  </g>`;
  const epitelio = svg(`
    <rect x="40" y="40" width="920" height="150" rx="20" fill="${C.csf}" fill-opacity=".14"/>
    <text x="60" y="80" class="lt lm">Ventrículo (líquor)</text>
    <text x="60" y="108" class="ls">lado apical</text>
    ${cell(170)}${cell(410)}${cell(650)}
    <!-- junções oclusivas -->
    ${[410, 650].map(x => `<rect x="${x - 36}" y="252" width="32" height="18" rx="4" fill="#ffd166"/>`).join('')}
    <g data-s="=2">${callout(394, 262, 385, 150, 'Junção oclusiva', { cls: 'lb', anchor: 'middle', dot: '#ffd166', sub: 'barreira hematoliquórica' })}</g>
    <rect x="40" y="560" width="920" height="170" rx="20" fill="#ff6b5e" fill-opacity=".12"/>
    <path d="M60,640 C300,600 700,690 940,640" stroke="#ff6b5e" stroke-width="30" fill="none" stroke-linecap="round" opacity=".7"/>
    ${[200, 420, 640, 860].map(x => `<circle cx="${x}" cy="${642 + (x % 3) * 4}" r="7" fill="#fff" opacity=".7"/>`).join('')}
    <text x="60" y="600" class="lt" fill="#ffb3aa">Capilar fenestrado (sangue)</text>
    <text x="60" y="712" class="ls">lado basolateral · plasma filtra para o estroma</text>
    <!-- bomba Na/K apical -->
    <g>
      <circle cx="260" cy="250" r="22" fill="#07201a" stroke="#ff8a1f" stroke-width="3"/><text x="260" y="256" text-anchor="middle" class="mono" style="font-size:12px" fill="#ffb567">ATPase</text>
      ${flow({ d: 'M260,330 L260,120', n: 3, dur: 2.6, r: 12, ion: 'na' })}
      ${flow({ d: 'M300,140 L300,320', n: 2, dur: 2.6, r: 12, ion: 'k' })}
    </g>
    <g>${flow({ d: 'M470,330 L470,110', n: 3, dur: 3, r: 12, ion: 'cl' })}${flow({ d: 'M530,340 L530,110', n: 3, dur: 3.4, r: 13, ion: 'hco3' })}</g>
    <g>${flow({ d: 'M740,520 L740,100', n: 5, dur: 3, r: 12, ion: 'h2o' })}<rect x="728" y="236" width="24" height="30" rx="6" fill="none" stroke="#8fd3ff" stroke-width="3"/></g>
    <!-- anidrase carbônica -->
    <g>${tag(530, 400, 'CO₂ + H₂O → H⁺ + HCO₃⁻', { fs: 14 })}${tag(530, 440, 'anidrase carbônica', { fs: 13, o: 1 })}</g>
    ${callout(260, 250, 150, 330, 'Na⁺/K⁺-ATPase', { cls: 'lb lo', anchor: 'end', sub: 'membrana APICAL' })}
    ${callout(740, 250, 850, 205, 'Aquaporina-1', { sub: 'água segue o sal' })}
  `);

  /* --- cena C: granulação aracnóidea (absorção) --- */
  const granul = svg(`
    <rect x="40" y="40" width="920" height="260" rx="26" fill="${C.vein}" fill-opacity=".18" stroke="${C.vein}" stroke-opacity=".6" stroke-width="2"/>
    <text x="70" y="90" class="lt" fill="#b9c5ff">Seio sagital superior</text>
    <text x="70" y="120" class="ls">sangue venoso · pressão ≈ 5–8 mmHg</text>
    ${flow({ d: 'M60,200 L940,200', n: 12, dur: 6, r: 7, fill: C.vein })}
    <rect x="40" y="300" width="920" height="46" fill="#3b5f52"/><text x="940" y="330" text-anchor="end" class="ls">dura-máter</text>
    <rect x="40" y="346" width="920" height="200" fill="${C.csf}" fill-opacity=".16"/>
    <text x="70" y="520" class="lt lm">Espaço subaracnóideo</text>
    <text x="70" y="548" class="ls">líquor · pressão ≈ 10 mmHg (≈ 130 mmH₂O)</text>
    <rect x="40" y="560" width="920" height="170" rx="10" fill="#e7a795" opacity=".85"/><text x="70" y="700" class="lb" fill="#5a2b22">Córtex cerebral (pia-máter aderida)</text>
    <!-- granulação -->
    <path d="M430,560 L430,330 C430,230 470,170 500,170 C530,170 570,230 570,330 L570,560Z" fill="${C.csf}" fill-opacity=".45" stroke="${C.csf}" stroke-width="3"/>
    <path d="M470,260 C480,230 520,230 530,260" stroke="#fff" stroke-width="3" fill="none"/>
    ${flow({ d: 'M200,450 C320,450 460,470 500,380 L500,200 C520,160 600,150 700,190', n: 8, dur: 5, r: 6 })}
    ${callout(500, 200, 650, 250, 'Granulação aracnóidea', { anchor: 'start', sub: 'abre só em um sentido' })}
    <g>${tag(250, 400, 'P líquor > P seio  ⇒  fluxo em massa', { o: 1, fs: 16 })}</g>
  `);

  /* --- cena D: peça anatômica com marcadores --- */
  const pins = [
    [560, 462, 'Ventrículo lateral (atrás do septo)'],
    [592, 540, 'Forame interventricular'],
    [690, 565, '3º ventrículo'],
    [796, 662, 'Aqueduto cerebral'],
    [842, 812, '4º ventrículo'],
    [852, 1015, 'Cisterna magna'],
    [628, 840, 'Cisterna pontina (subaracnóideo)'],
    [640, 72, 'Seio sagital superior'],
    [765, 1112, 'Canal central / medula']
  ];
  const peca = svg(`<image href="img/ventriculos.webp" x="0" y="0" width="1290" height="1148"/>
    ${pins.map(([x, y], i) => `<g data-s="10" style="transition-delay:${i * 0.15}s"><circle cx="${x}" cy="${y}" r="21" fill="#ff8a1f" stroke="#fff" stroke-width="3.5"/><text x="${x}" y="${y + 8}" text-anchor="middle" class="mono" style="font-size:22px;stroke:none" fill="#1a0d00">${i + 1}</text></g>`).join('')}`, '0 0 1290 1148');
  const pecaLeg = `<div class="chipset">${pins.map(([, , t], i) => `<span>${i + 1} · ${t}</span>`).join('')}</div>`;

  DA.topic({
    short: 'Circulação do líquor',
    title: 'Circulação do <em>líquor</em>',
    card: 'Da fábrica (plexo coroide) ao ralo (seio sagital superior)',
    lede: 'O líquor é produzido, circula e é reabsorvido o tempo todo. São cerca de 150 mL no sistema, 500 mL fabricados por dia: ele se renova 3 a 4 vezes a cada 24 h.',
    fig: () => `
      <div class="scene" data-s="0-1,3-9">${esquema}</div>
      <div class="scene" data-s="=2">${epitelio}</div>
      <div class="scene" data-s="=7">${granul}</div>
      <div class="scene" data-s="=10">${peca}</div>
      <style>.fig .vent .vw,.fig .vent .vi{transition:stroke-width .9s ease}.fig .vent.big .vw{stroke-width:58px}.fig .vent.big .vi{stroke-width:50px}</style>`,
    steps: [
      {
        k: 'Onde nasce', t: 'A fábrica: <em>plexos coroides</em>',
        p: 'Cerca de <b>70–80%</b> do líquor sai dos plexos coroides: tufos de capilares cobertos por epitélio ependimário modificado. Ficam nos ventrículos laterais (corpo, átrio e corno temporal), no teto do 3º e no teto do 4º ventrículo. O resto vem do epêndima e do líquido intersticial do cérebro.',
        why: 'Produzir ali faz sentido porque o plexo junta as duas coisas necessárias: <b>muito sangue perto</b> (capilares fenestrados, que deixam o plasma vazar) e <b>um epitélio que bombeia íons</b>, que decide o que passa.',
        deep: '<p>Os cornos frontal e occipital dos ventrículos laterais <b>não têm plexo coroide</b>. Por isso o líquor que aparece no corno frontal chegou lá por circulação.</p><p>Volume total: cerca de 150 mL, sendo uns 25 mL nos ventrículos e o resto no espaço subaracnóideo. Produção: cerca de 0,35 mL/min, ou 500 mL/dia.</p>',
        say: 'Todo mundo acha que o líquor fica parado. Ele é trocado de 3 a 4 vezes por dia, e a fábrica é essa estrutura vermelha: o plexo coroide.'
      },
      {
        k: 'Como é feito', t: 'Secreção ativa: <em>a água segue o sal</em>',
        p: 'O líquor é <b>secretado</b>, não simplesmente filtrado. A Na⁺/K⁺-ATPase fica na membrana <b>apical</b> (virada para o ventrículo) e empurra Na⁺ para dentro do ventrículo. Cl⁻ e HCO₃⁻ vão atrás pelo equilíbrio de cargas. A água segue por osmose através da <b>aquaporina-1</b>.',
        why: 'A prova de que é secreção está na composição: o líquor tem <b>muito menos proteína</b>, menos glicose (cerca de 60% da plasmática) e menos K⁺ que o plasma, e mais Cl⁻. Um filtro simples copiaria o plasma. As <b>junções oclusivas</b> entre as células impedem o vazamento entre elas, e essa é a barreira hematoliquórica.',
        an: 'É como adoçar a água do outro lado de um filtro de café: você bombeia sal para um lado e a água atravessa sozinha para diluí-lo.',
        clin: '<b>Acetazolamida</b> inibe a anidrase carbônica: com menos HCO₃⁻ sai menos água e cai a produção de líquor. É usada na hipertensão intracraniana idiopática.',
        deep: '<p>No lado basolateral, trocadores Na⁺/H⁺ e Cl⁻/HCO₃⁻ carregam íons do estroma para dentro da célula. No lado apical, a Na⁺/K⁺-ATPase (um caso raro de bomba apical), canais de Cl⁻/HCO₃⁻ e cotransportadores levam os íons para o ventrículo. A anidrase carbônica forma H⁺ e HCO₃⁻ a partir de CO₂ + H₂O.</p><p>Os capilares do plexo são fenestrados, então a barreira não está no vaso, está no <b>epitélio</b> (junções oclusivas). No cérebro, a barreira hematoencefálica fica no endotélio.</p>'
      },
      {
        k: 'Laterais → 3º', t: 'Ventrículos laterais → <em>forame interventricular</em>',
        p: 'Dos dois ventrículos laterais (um em cada hemisfério), o líquor desce pelos <b>forames interventriculares de Monro</b>, um de cada lado, até o 3º ventrículo, que fica na linha média entre os dois tálamos.',
        why: 'O líquor anda porque é produzido sem parar, e o que é produzido empurra o que já estava lá. Somam-se a isso as <b>pulsações arteriais</b> transmitidas ao cérebro a cada batimento e o batimento dos <b>cílios ependimários</b>. O fluxo vai da alta pressão (produção) para a baixa pressão (absorção).',
        an: 'Uma fonte que nunca desliga: a água não para no primeiro tanque, transborda para o próximo.',
        deep: '<p>Tumores próximos ao forame (colóide do 3º ventrículo) podem ocluí-lo e dilatar só os ventrículos laterais, com cefaleia postural e risco de morte súbita.</p>'
      },
      {
        k: 'O gargalo', t: '3º ventrículo → <em>aqueduto cerebral</em>',
        p: 'Do 3º ventrículo o líquor entra no <b>aqueduto cerebral (de Sylvius)</b>, um canal fino que atravessa o mesencéfalo, com <b>1 a 2 mm</b> de diâmetro, até o 4º ventrículo.',
        why: 'É o ponto mais estreito de todo o trajeto. Pela lei de Poiseuille, a resistência ao fluxo sobe com a <b>4ª potência</b> da redução do raio: pouca compressão já para tudo. Por isso é o local mais comum de <b>hidrocefalia obstrutiva</b> (estenose congênita, tumores da pineal ou do teto).',
        an: 'O gargalo de uma ampulheta: se ele entope, a parte de cima enche e a de baixo fica vazia.',
        clin: 'Estenose do aqueduto: <b>laterais e 3º ventrículo dilatados, 4º ventrículo normal</b>. Esse padrão aponta o local exato do bloqueio.'
      },
      {
        k: 'Saída para fora', t: '4º ventrículo → <em>Luschka e Magendie</em>',
        p: 'O 4º ventrículo (entre ponte/bulbo e cerebelo) é a única saída do sistema ventricular para fora. São <b>dois forames de Luschka</b> (laterais) e <b>um de Magendie</b> (mediano), que abrem para a <b>cisterna magna</b> (cerebelobulbar). Um pouco segue ainda para o canal central da medula.',
        why: 'Até aqui o líquor estava <b>dentro</b> do encéfalo, nos ventrículos. Ele só consegue banhar a superfície do cérebro e da medula depois de sair por esses três orifícios.',
        an: 'Memorize: <b>L</b>uschka = <b>L</b>ateral, <b>M</b>agendie = <b>M</b>ediano.',
        clin: 'Malformação de Dandy-Walker: atresia desses forames, com um 4º ventrículo cístico e gigante.'
      },
      {
        k: 'O colchão d’água', t: 'O <em>espaço subaracnóideo</em>',
        p: 'Fora dos ventrículos, o líquor ocupa o <b>espaço subaracnóideo</b>, entre a aracnoide e a pia-máter. Envolve todo o encéfalo e a medula e se alarga nas <b>cisternas</b>. A partir da cisterna magna ele sobe pela convexidade dos hemisférios e desce em volta da medula.',
        why: 'O líquor <b>faz o cérebro flutuar</b> (empuxo de Arquimedes). O encéfalo pesa cerca de 1.400 g no ar e só uns 50 g imerso. Sem isso, o próprio peso comprimiria vasos e nervos da base do crânio. Ele também amortece impactos e leva metabólitos embora.',
        an: 'Um ovo dentro de um pote cheio de água: você pode chacoalhar o pote que o ovo não quebra.',
        clin: '<b>Punção lombar</b> entre L3–L4 ou L4–L5: a medula termina em L1–L2 (cone medular), então abaixo disso a agulha encontra só as raízes da cauda equina, que se afastam dela.'
      },
      {
        k: 'O ralo', t: '<em>Granulações aracnóideas</em> → seio sagital superior',
        p: 'O líquor volta ao sangue principalmente pelas <b>granulações (vilosidades) aracnóideas</b>: projeções da aracnoide que furam a dura-máter e se abrem dentro do <b>seio sagital superior</b>.',
        why: 'Não há bomba nesse ponto. O fluxo é <b>passivo, em massa</b>, a favor do gradiente de pressão: líquor (cerca de 10 mmHg) é maior que seio venoso (cerca de 5–8 mmHg). A granulação funciona como <b>válvula de mão única</b> e abre quando a pressão do líquor supera a venosa em cerca de 1,5 mmHg. Se a pressão venosa sobe, ela fecha e o sangue não reflui para o líquor.',
        an: 'Um ralo com válvula de retenção: a água da pia desce, mas o esgoto não sobe.',
        deep: '<p>Vias acessórias de drenagem: ao longo das bainhas dos nervos cranianos (placa cribiforme até os linfáticos nasais), <b>vasos linfáticos meníngeos</b> e o <b>sistema glinfático</b> (troca líquor–líquido intersticial pelos espaços perivasculares, com aquaporina-4 nos astrócitos), que é mais ativo durante o sono.</p>'
      },
      {
        k: 'De volta ao coração', t: 'Seio sagital → <em>veia jugular interna</em>',
        p: 'Já dentro do sangue venoso, o líquor segue o caminho dos seios durais: <b>seio sagital superior → confluência dos seios → seios transversos → seios sigmoides → veias jugulares internas</b> → veia cava superior → coração.',
        why: 'Fecha-se o ciclo. Produção e absorção precisam ser iguais (cerca de 500 mL/dia). Com o crânio fechado e rígido, um desequilíbrio pequeno já aumenta a pressão intracraniana.',
        deep: '<p><b>Doutrina de Monro-Kellie:</b> o volume dentro do crânio é fixo (encéfalo + sangue + líquor). Se um aumenta, outro precisa diminuir. O líquor é o primeiro tampão: ele é deslocado para o saco dural espinal.</p>'
      },
      {
        k: 'Quando dá errado', t: '<em>Hidrocefalia</em>: onde está o problema?',
        html: `<table><tr><th>Tipo</th><th>Mecanismo</th><th>Exemplo</th></tr>
          <tr><td><b>Não comunicante</b> (obstrutiva)</td><td>Bloqueio <b>dentro</b> do sistema ventricular</td><td>Estenose do aqueduto, tumor da fossa posterior</td></tr>
          <tr><td><b>Comunicante</b></td><td>Ventrículos livres, mas a <b>absorção</b> falha nas granulações</td><td>Pós-meningite, pós-hemorragia subaracnóidea</td></tr>
          <tr><td><b>De pressão normal</b></td><td>Absorção lenta, pressão média normal com picos</td><td>Idoso: marcha, incontinência, demência</td></tr></table>`,
        why: 'O ventrículo dilata <b>antes</b> do ponto de bloqueio, porque a fábrica continua produzindo. O plexo coroide não sabe que o ralo entupiu.',
        clin: 'Tríade da hidrocefalia de pressão normal: <b>marcha magnética</b>, <b>incontinência urinária</b> e <b>demência</b>. Em inglês: “wet, wobbly and wacky”.'
      },
      {
        k: 'Na peça real', t: 'Revisão na <em>anatomia real</em>',
        p: 'Agora no corte sagital mediano: siga os números na ordem do fluxo.',
        html: pecaLeg,
        why: 'O caminho inteiro em uma frase: <b>plexo coroide → ventrículos laterais → Monro → 3º → aqueduto → 4º → Luschka/Magendie → espaço subaracnóideo → granulações → seio sagital superior → jugular interna</b>.'
      }
    ],
    legend: [
      ['Plexo coroide', 'Capilares fenestrados + epitélio ependimário modificado. Secreta 70–80% do líquor por transporte ativo de Na⁺ (bomba apical), com Cl⁻, HCO₃⁻ e água logo atrás. Suas junções oclusivas formam a barreira hematoliquórica.'],
      ['Epêndima', 'Epitélio ciliado que reveste os ventrículos. Produz uma pequena parte do líquor, e os cílios ajudam a mover o fluxo.'],
      ['Ventrículos laterais', 'Um em cada hemisfério, em forma de “C”: corno frontal, corpo, átrio, corno occipital e corno temporal. Têm plexo coroide no corpo, no átrio e no corno temporal.'],
      ['Forame interventricular (Monro)', 'Liga cada ventrículo lateral ao 3º ventrículo.'],
      ['3º ventrículo', 'Fenda mediana entre os tálamos e o hipotálamo. Tem plexo coroide no teto.'],
      ['Aqueduto cerebral (Sylvius)', 'Canal de 1–2 mm no mesencéfalo que liga o 3º ao 4º ventrículo. É o ponto mais estreito e o que mais obstrui.'],
      ['4º ventrículo', 'Entre a ponte/bulbo (assoalho) e o cerebelo (teto). Tem plexo coroide no teto e sai pelos forames de Luschka e Magendie.'],
      ['Forames de Luschka (2) e Magendie (1)', 'Aberturas laterais e mediana do 4º ventrículo para o espaço subaracnóideo (cisterna magna).'],
      ['Cisternas subaracnóideas', 'Dilatações do espaço subaracnóideo (magna, pontina, interpeduncular, quiasmática, ambiens). A cisterna magna pode ser puncionada.'],
      ['Espaço subaracnóideo', 'Entre a aracnoide e a pia-máter. Contém líquor e as grandes artérias. Dá flutuação (1.400 g → 50 g) e amortecimento.'],
      ['Granulações aracnóideas', 'Projeções da aracnoide para dentro do seio sagital superior. São válvulas de mão única movidas pelo gradiente de pressão (fluxo em massa).'],
      ['Seio sagital superior', 'Seio venoso dural na margem superior da foice do cérebro. Recebe o líquor e o sangue cortical e drena para a confluência dos seios.'],
      ['Confluência → transverso → sigmoide → jugular interna', 'Caminho do sangue venoso (e do líquor já absorvido) de volta ao coração.'],
      ['Canal central da medula', 'Continuação do 4º ventrículo pela medula espinal.']
    ],
    clinic: [
      'Composição normal do líquor: límpido, até 5 leucócitos/mm³, proteína 15–45 mg/dL, glicose cerca de 2/3 da glicemia. Na meningite bacteriana: glicose baixa, proteína alta e neutrófilos.',
      'Obstrução no aqueduto: laterais + 3º dilatados, 4º normal. Obstrução na saída do 4º: todos dilatados.',
      'Hidrocefalia comunicante: os ventrículos se comunicam com o espaço subaracnóideo e a falha é na absorção. Não comunicante: bloqueio interno.',
      'Tríade de Hakim (HPN): marcha, incontinência e demência. Melhora após punção de alívio (tap test).',
      'Acetazolamida reduz a produção (inibe a anidrase carbônica).',
      'Punção lombar em L3–L4/L4–L5, abaixo do cone medular (L1–L2). Antes dela, excluir hipertensão intracraniana com efeito de massa (risco de herniação).',
      'Pegadinha: a barreira hematoliquórica fica no EPITÉLIO do plexo (junções oclusivas). A hematoencefálica fica no ENDOTÉLIO dos capilares cerebrais.'
    ]
  });
})();
