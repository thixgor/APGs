/* 08 · Neurônios de 1ª, 2ª e 3ª ordem: sensitivo e motor */
(function () {
  const { svg, flow, callout, tag } = H;
  const C1 = '#62dcc8', C2 = '#ffd166', C3 = '#ff8a1f', MS = '#ff6b5e', MI = '#3fc584';

  /* níveis (y) */
  const L = { cx: 110, th: 250, mes: 350, bulbo: 450, med: 610 };
  const level = (y, name, shape) => `<g><text x="30" y="${y + 6}" class="ls" style="font-size:14px">${name}</text>${shape}</g>`;
  const cord = (y, s = 1) => `<g transform="translate(500,${y}) scale(${s})"><ellipse rx="130" ry="62" fill="#efe2cc" opacity=".9"/><path d="M-60,-8 C-40,-50 -20,-50 0,-10 C20,-50 40,-50 60,-8 C50,30 20,40 0,10 C-20,40 -50,30 -60,-8Z" fill="#c98f74"/><line x1="0" y1="-62" x2="0" y2="-18" stroke="#c9b99b" stroke-width="2"/></g>`;
  const bulbo = (y) => `<g transform="translate(500,${y})"><path d="M-150,-40 C-150,-70 150,-70 150,-40 L130,40 C100,70 -100,70 -130,40Z" fill="#efe2cc" opacity=".85"/><ellipse cx="-40" cy="-20" rx="18" ry="12" fill="#c98f74"/><ellipse cx="40" cy="-20" rx="18" ry="12" fill="#c98f74"/><ellipse cx="-20" cy="35" rx="14" ry="20" fill="#c9b99b"/><ellipse cx="20" cy="35" rx="14" ry="20" fill="#c9b99b"/></g>`;
  const mes = (y) => `<g transform="translate(500,${y})"><path d="M-170,-30 C-170,-60 170,-60 170,-30 L150,30 C100,55 -100,55 -150,30Z" fill="#efe2cc" opacity=".85"/><path d="M-120,20 C-90,40 -60,40 -40,20" stroke="#3a2a26" stroke-width="10" fill="none"/><path d="M120,20 C90,40 60,40 40,20" stroke="#3a2a26" stroke-width="10" fill="none"/></g>`;
  const talamo = (y) => `<g transform="translate(500,${y})"><ellipse cx="-80" cy="0" rx="70" ry="42" fill="#c7b1ff" opacity=".8"/><ellipse cx="80" cy="0" rx="70" ry="42" fill="#c7b1ff" opacity=".8"/><rect x="-6" y="-30" width="12" height="60" fill="#62dcc8" opacity=".6"/></g>`;
  const cortex = (y) => `<path d="M160,${y + 40} C200,${y - 60} 800,${y - 60} 840,${y + 40}" stroke="#e7a795" stroke-width="44" fill="none" opacity=".8"/><path d="M500,${y - 40} L500,${y + 30}" stroke="#07201a" stroke-width="6"/>`;
  const soma = (x, y, c, r = 12) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="#fff" stroke-width="2.5"/>`;
  const anat = `${cortex(L.cx)}${talamo(L.th)}${mes(L.mes)}${bulbo(L.bulbo)}${cord(L.med)}
    ${level(L.cx - 10, 'CÓRTEX', '')}${level(L.th, 'TÁLAMO', '')}${level(L.mes, 'MESENCÉFALO', '')}${level(L.bulbo, 'BULBO', '')}${level(L.med, 'MEDULA', '')}
    <line x1="500" y1="40" x2="500" y2="720" stroke="#9fc0ae" stroke-dasharray="4 8" opacity=".6"/><text x="508" y="734" class="lx">linha média</text>`;

  /* ---------- coluna dorsal – lemnisco medial ---------- */
  const cd1 = 'M900,720 C860,690 800,650 760,620 L700,620 C640,620 540,600 520,560 L520,450';
  const cd2 = 'M520,450 C470,420 480,380 480,350 L470,270';
  const cd3 = 'M580,250 C600,200 640,160 650,120';
  const dorsal = svg(`${anat}
    <path class="draw" data-s="1" d="${cd1}" stroke="${C1}" stroke-width="6" fill="none"/>
    <path class="draw" data-s="2" d="M520,450 C470,420 470,380 480,350 L560,260" stroke="${C2}" stroke-width="6" fill="none"/>
    <path class="draw" data-s="3" d="${cd3}" stroke="${C3}" stroke-width="6" fill="none"/>
    ${soma(760, 620, C1)}<g data-s="2">${soma(520, 450, C2)}</g><g data-s="3">${soma(580, 252, C3)}</g>
    <path d="M880,705 l24,22 M890,700 l24,22" stroke="${C1}" stroke-width="3"/>
    <g data-s="=1">${flow({ d: cd1, n: 5, dur: 2.2, r: 7, fill: C1 })}
      ${callout(760, 620, 770, 530, '1ª ordem: gânglio da raiz dorsal', { anchor: 'middle', cls: 'lb', sub: 'sobe no fascículo grácil/cuneiforme (mesmo lado)' })}
      ${tag(880, 760, 'tato fino · vibração · propriocepção', { fs: 14, fill: C1 })}</g>
    <g data-s="=2">${flow({ d: 'M520,450 C470,420 470,380 480,350 L560,260', n: 4, dur: 1.8, r: 7, fill: C2 })}
      ${callout(520, 450, 790, 380, '2ª ordem: grácil e cuneiforme', { anchor: 'middle', cls: 'lb', sub: 'no BULBO → CRUZA (arqueadas internas)' })}
      ${tag(330, 400, 'lemnisco medial', { fs: 15, fill: C2 })}</g>
    <g data-s="=3">${flow({ d: cd3, n: 3, dur: 1.4, r: 7, fill: C3 })}
      ${callout(580, 252, 720, 300, '3ª ordem: tálamo VPL', { anchor: 'start', cls: 'lb' })}
      ${callout(650, 118, 720, 40, 'Córtex somatossensorial (3,1,2)', { anchor: 'middle', cls: 'lb lo' })}</g>
  `);

  /* ---------- espinotalâmico ---------- */
  const st1 = 'M900,720 C860,690 800,650 760,625 L560,625';
  const st2 = 'M560,625 C500,640 460,640 440,600 L440,450 C440,420 440,380 450,350 L430,260';
  const espino = svg(`${anat}
    <path class="draw" data-s="4" d="${st1}" stroke="${C1}" stroke-width="6" fill="none"/>
    <path class="draw" data-s="5" d="${st2}" stroke="${C2}" stroke-width="6" fill="none"/>
    <path class="draw" data-s="6" d="M420,250 C400,200 360,160 350,120" stroke="${C3}" stroke-width="6" fill="none"/>
    ${soma(760, 625, C1)}<g data-s="5">${soma(560, 625, C2)}</g><g data-s="6">${soma(420, 252, C3)}</g>
    <path d="M880,705 l24,22 M890,700 l24,22" stroke="${C1}" stroke-width="3"/>
    <g data-s="=4">${flow({ d: st1, n: 4, dur: 2, r: 7, fill: C1 })}
      ${callout(760, 625, 770, 530, '1ª ordem: gânglio da raiz dorsal', { anchor: 'middle', cls: 'lb', sub: 'entra e sobe 1–2 segmentos (trato de Lissauer)' })}
      ${tag(880, 760, 'dor · temperatura · tato grosseiro', { fs: 14, fill: C1 })}</g>
    <g data-s="=5">${flow({ d: st2, n: 6, dur: 3, r: 7, fill: C2 })}
      ${callout(560, 625, 720, 712, '2ª ordem: corno posterior', { anchor: 'middle', cls: 'lb', sub: 'CRUZA na MEDULA (comissura branca ant.)' })}
      ${tag(300, 520, 'trato espinotalâmico lateral', { fs: 15, fill: C2 })}</g>
    <g data-s="=6">${flow({ d: 'M420,250 C400,200 360,160 350,120', n: 3, dur: 1.4, r: 7, fill: C3 })}
      ${callout(420, 252, 260, 300, '3ª ordem: tálamo VPL', { anchor: 'end', cls: 'lb' })}
      ${callout(350, 118, 250, 60, 'Córtex somatossensorial', { anchor: 'end', cls: 'lb lo' })}</g>
  `);

  /* ---------- Brown-Séquard ---------- */
  const bs = svg(`
    ${cord(260, 1.6)}
    <rect x="500" y="150" width="210" height="220" fill="#ff6b5e" opacity=".35" class="pulse"/>
    <text x="605" y="130" text-anchor="middle" class="lb" fill="#ff9a90">hemissecção direita</text>
    <g transform="translate(0,20)">
      <rect x="130" y="440" width="350" height="240" rx="24" fill="#07201a" stroke="rgba(165,232,198,.25)"/>
      <rect x="520" y="440" width="350" height="240" rx="24" fill="#07201a" stroke="rgba(255,138,31,.45)"/>
      <text x="305" y="478" text-anchor="middle" class="lb">Lado ESQUERDO (oposto)</text>
      <text x="695" y="478" text-anchor="middle" class="lb lo">Lado DIREITO (da lesão)</text>
      <text x="155" y="540" class="lb" fill="#ffd166">✕ dor e temperatura</text>
      <text x="155" y="580" class="lx">o espinotalâmico já tinha cruzado</text>
      <text x="545" y="530" class="lb" fill="#62dcc8">✕ vibração e propriocepção</text>
      <text x="545" y="560" class="lx">coluna dorsal ainda não cruzou</text>
      <text x="545" y="610" class="lb" fill="#ff6b5e">✕ força (paralisia espástica)</text>
      <text x="545" y="640" class="lx">corticoespinal já cruzou no bulbo</text>
    </g>
  `);

  /* ---------- motor ---------- */
  const ms = 'M360,110 C380,180 420,230 440,300 L450,440 C460,470 520,490 560,500 L580,560';
  const motor = svg(`${anat}
    <path class="draw" data-s="8" d="${ms}" stroke="${MS}" stroke-width="7" fill="none"/>
    <path class="draw" data-s="9" d="M590,610 C640,640 720,660 800,680 L920,700" stroke="${MI}" stroke-width="7" fill="none"/>
    ${soma(360, 110, MS, 15)}<g data-s="9">${soma(590, 610, MI, 15)}</g>
    <g data-s="9"><rect x="900" y="670" width="70" height="56" rx="18" fill="#e0736b"/><text x="935" y="760" text-anchor="middle" class="lx">músculo</text></g>
    <g data-s="=8">${flow({ d: ms + ' L590,605', n: 7, dur: 3, r: 7, fill: MS })}
      ${callout(360, 110, 220, 40, 'NMS: córtex motor (4)', { anchor: 'middle', cls: 'lb', sub: 'células piramidais' })}
      ${callout(440, 300, 270, 330, 'Cápsula interna → pedúnculo', { anchor: 'end', cls: 'ls' })}
      ${callout(505, 480, 660, 400, 'Decussação das pirâmides', { anchor: 'start', cls: 'lb lo', sub: '≈ 85–90% cruza no BULBO' })}
      ${tag(250, 560, 'corticoespinal lateral', { fs: 15, fill: MS })}</g>
    <g data-s="=9">${flow({ d: 'M590,610 C640,640 720,660 800,680 L920,700', n: 4, dur: 1.6, r: 7, fill: MI })}
      ${callout(590, 610, 770, 540, 'NMI: motoneurônio α (corno anterior)', { anchor: 'middle', cls: 'lb', sub: '“via final comum” · ACh' })}</g>
    <g data-s="=10">
      ${tag(290, 520, 'NMS lesado: sem FREIO', { fs: 16, o: 1 })}
      ${tag(760, 520, 'NMI lesado: sem FIO', { fs: 16, fill: MI })}
    </g>
  `);

  DA.topic({
    id: 'vias-neuronais', section: 'Sinal nervoso',
    short: 'Neurônios de 1ª, 2ª e 3ª ordem',
    title: 'Neurônios de <em>1ª, 2ª e 3ª</em> ordem',
    card: 'Coluna dorsal, espinotalâmico, NMS × NMI e onde cruza',
    lede: 'Toda sensação consciente chega ao córtex numa corrida de revezamento com três corredores. Saber onde cada um passa o bastão, e onde a via cruza a linha média, é o que permite localizar uma lesão pelo exame físico.',
    fig: () => `
      <div class="scene" data-s="0-3">${dorsal}</div>
      <div class="scene" data-s="4-6">${espino}</div>
      <div class="scene" data-s="=7">${bs}</div>
      <div class="scene" data-s="8-10">${motor}</div>`,
    steps: [
      {
        k: 'Coluna dorsal · 1ª', t: '1ª ordem: do receptor ao <em>bulbo</em>',
        p: 'Via da <b>coluna dorsal – lemnisco medial</b>: tato fino (discriminativo), vibração, pressão e <b>propriocepção consciente</b>. O neurônio de 1ª ordem é <b>pseudounipolar</b>, com corpo no <b>gânglio da raiz dorsal</b>. Ele entra na medula e <b>sobe sem fazer sinapse</b> pelo mesmo lado, no fascículo <b>grácil</b> (membros inferiores, medial) ou <b>cuneiforme</b> (membros superiores, lateral, acima de T6).',
        why: 'São fibras grossas e mielinizadas (Aβ), rápidas, que levam informação precisa. Por isso sobem direto e só param no bulbo: menos sinapses significam menos perda de detalhe. A organização em camadas (somatotopia) mantém o “mapa” do corpo.',
        an: 'O 1º corredor do revezamento pega o bastão no pé e corre o caminho todo até o pescoço sem entregar a ninguém.'
      },
      {
        k: 'Coluna dorsal · 2ª', t: '2ª ordem: <em>cruza no bulbo</em>',
        p: 'No bulbo, a fibra faz sinapse nos <b>núcleos grácil e cuneiforme</b> (2ª ordem). O axônio do 2º neurônio <b>cruza a linha média</b> (fibras arqueadas internas) e sobe do outro lado como <b>lemnisco medial</b>, até o tálamo.',
        why: 'Todo neurônio de 2ª ordem de via sensitiva cruza. É por isso que o hemisfério esquerdo sente o lado direito do corpo. O ponto que importa é <b>onde</b> ele cruza: na coluna dorsal, o cruzamento acontece <b>no bulbo</b>, então abaixo dele a via é do mesmo lado do corpo.',
        an: 'O 2º corredor recebe o bastão e atravessa a pista para o lado oposto antes de seguir.'
      },
      {
        k: 'Coluna dorsal · 3ª', t: '3ª ordem: <em>tálamo</em> → córtex',
        p: 'O lemnisco medial termina no <b>núcleo ventral posterolateral (VPL) do tálamo</b> (a face vai para o VPM, pelo trigêmeo). O neurônio de 3ª ordem sai do tálamo, passa pela cápsula interna e chega ao <b>córtex somatossensorial primário (3, 1, 2)</b> no giro pós-central.',
        why: 'O tálamo é o “porteiro” de quase toda sensação (o olfato é a exceção). Ele filtra, prioriza e distribui a informação antes do córtex. A consciência da sensação só acontece no córtex.',
        an: 'O 3º corredor sai do tálamo, o centro de distribuição, e entrega o bastão na linha de chegada: o córtex.'
      },
      {
        k: 'Espinotalâmico · 1ª', t: 'Espinotalâmico: <em>dor e temperatura</em>',
        p: 'Via <b>anterolateral (espinotalâmica)</b>: dor, temperatura, tato grosseiro e prurido. O neurônio de 1ª ordem também está no gânglio da raiz dorsal, mas suas fibras são <b>finas</b> (Aδ e C). Elas entram, sobem ou descem 1–2 segmentos no <b>trato de Lissauer</b> e fazem sinapse logo no <b>corno posterior</b>.',
        why: 'Dor e temperatura precisam de <b>processamento local</b> (reflexos de retirada, modulação da dor pela “comporta” medular). Por isso a sinapse acontece já na medula, e não no bulbo.'
      },
      {
        k: 'Espinotalâmico · 2ª', t: '2ª ordem: <em>cruza na medula</em>',
        p: 'O neurônio de 2ª ordem fica no <b>corno posterior</b> (lâminas I, II e V). Seu axônio <b>cruza na própria medula</b>, pela <b>comissura branca anterior</b>, no mesmo nível ou 1–2 segmentos acima, e sobe pelo <b>trato espinotalâmico lateral</b> do lado oposto até o tálamo.',
        why: 'É a diferença-chave para as provas. <b>Coluna dorsal cruza no bulbo. Espinotalâmico cruza na medula.</b> Numa lesão medular, as duas vias estão em lados opostos, e o exame mostra perda de tato fino de um lado e de dor do outro.',
        clin: '<b>Siringomielia</b>: uma cavidade central na medula cervical destrói a comissura branca anterior. Perda de dor e temperatura “em capa” (ombros e braços, bilateral), com tato fino preservado.'
      },
      {
        k: 'Espinotalâmico · 3ª', t: '3ª ordem: tálamo <em>VPL</em> → córtex',
        p: 'Assim como na coluna dorsal, o 3º neurônio fica no <b>VPL do tálamo</b> e projeta para o córtex somatossensorial (e também para a ínsula e o cíngulo, que dão o componente <b>emocional</b> da dor).',
        why: 'Por isso a dor não é só “onde e quanto”: também tem “o quanto isso me incomoda”. Ramos da via anterolateral vão à formação reticular (alerta) e ao sistema límbico (sofrimento).'
      },
      {
        k: 'Hemissecção', t: 'A prova: <em>Brown-Séquard</em>',
        p: 'Hemissecção da medula (por exemplo, facada) à direita. Abaixo da lesão:',
        keys: ['<b>Mesmo lado</b>: perda de propriocepção e vibração (coluna dorsal ainda não cruzou) + paralisia espástica (corticoespinal já cruzou lá em cima, no bulbo).', '<b>Lado oposto</b>: perda de dor e temperatura (o espinotalâmico cruzou na medula, abaixo, e sobe do outro lado).'],
        why: 'Não precisa decorar a síndrome. Basta saber <b>onde cada via cruza</b>: se ela cruza acima da lesão, o déficit é do mesmo lado. Se ela já cruzou abaixo da lesão, o déficit é do lado oposto.'
      },
      {
        k: 'Motor · NMS', t: 'Via motora: <em>neurônio motor superior</em>',
        p: 'A via motora tem dois neurônios. O <b>neurônio motor superior (NMS)</b> fica no córtex motor (área 4, células piramidais). O axônio desce pela <b>cápsula interna</b>, pedúnculo cerebral e ponte e, no bulbo, forma as <b>pirâmides</b>. Ali, cerca de <b>85–90% cruza</b> (decussação das pirâmides) e desce pelo trato <b>corticoespinal lateral</b>.',
        why: 'A via motora cruza no bulbo e a sensitiva de tato também, e por isso um AVC no hemisfério esquerdo tira força e sensibilidade do lado direito. Os 10–15% que não cruzam (corticoespinal anterior) controlam a musculatura axial, que é bilateral.'
      },
      {
        k: 'Motor · NMI', t: '<em>Neurônio motor inferior</em>: a via final comum',
        p: 'O NMS faz sinapse (direta ou por interneurônios) no <b>neurônio motor inferior (NMI)</b>: o motoneurônio α do corno anterior (ou dos núcleos motores dos nervos cranianos). O axônio sai pela raiz ventral e pelo nervo e libera <b>acetilcolina</b> na placa motora.',
        why: 'É chamado de <b>via final comum</b> porque todo comando que chega ao músculo (voluntário, reflexo, postural) passa obrigatoriamente por ele. Sem o NMI, o músculo não recebe nada e atrofia.'
      },
      {
        k: 'NMS × NMI', t: 'Lesão: <em>NMS × NMI</em>',
        html: `<table><tr><th></th><th>NMS (central)</th><th>NMI (periférico)</th></tr>
          <tr><td>Força</td><td>↓ (padrão piramidal)</td><td>↓ (território do nervo/raiz)</td></tr>
          <tr><td>Tônus</td><td><b>↑ espasticidade</b> (canivete)</td><td><b>↓ flacidez</b></td></tr>
          <tr><td>Reflexos</td><td><b>↑ hiperreflexia</b>, clônus</td><td><b>↓ ou abolidos</b></td></tr>
          <tr><td>Babinski</td><td><b>Presente</b></td><td>Ausente</td></tr>
          <tr><td>Trofismo</td><td>Atrofia leve (desuso)</td><td><b>Atrofia importante</b> + fasciculações</td></tr></table>`,
        why: 'O NMS é o <b>freio</b>: sem ele, os reflexos da medula ficam soltos (hiperreflexia e espasticidade). O NMI é o <b>fio</b>: sem ele, nada chega ao músculo (flacidez, arreflexia e atrofia por perda do estímulo trófico).',
        clin: '<b>ELA</b> (esclerose lateral amiotrófica) destrói <b>os dois</b>: sinais de NMS e NMI no mesmo paciente, com sensibilidade preservada.'
      }
    ],
    legend: [
      ['Neurônio de 1ª ordem (sensitivo)', 'Pseudounipolar no gânglio da raiz dorsal (ou gânglio de nervo craniano). Leva o sinal do receptor ao SNC.'],
      ['Neurônio de 2ª ordem (sensitivo)', 'No SNC (núcleos grácil/cuneiforme ou corno posterior). Seu axônio cruza a linha média.'],
      ['Neurônio de 3ª ordem (sensitivo)', 'No tálamo (VPL para o corpo, VPM para a face). Projeta ao córtex somatossensorial.'],
      ['Fascículo grácil / cuneiforme', 'Colunas dorsais: grácil (membros inferiores, medial) e cuneiforme (membros superiores, lateral, acima de T6). Sobem ipsilaterais.'],
      ['Núcleos grácil e cuneiforme', '2ª ordem da coluna dorsal, no bulbo. As fibras arqueadas internas cruzam.'],
      ['Lemnisco medial', 'Continuação cruzada da coluna dorsal, do bulbo ao tálamo VPL.'],
      ['Trato de Lissauer', 'Fibras finas de dor que sobem/descem 1–2 segmentos antes da sinapse.'],
      ['Comissura branca anterior', 'Onde cruzam as fibras do espinotalâmico. Lesada na siringomielia.'],
      ['Trato espinotalâmico lateral', 'Dor e temperatura contralaterais, da medula ao tálamo.'],
      ['Tálamo VPL / VPM', 'Retransmissão somatossensorial do corpo (VPL) e da face (VPM).'],
      ['Córtex somatossensorial (3, 1, 2)', 'Giro pós-central, com homúnculo sensitivo.'],
      ['Neurônio motor superior (NMS)', 'Córtex motor (área 4) e tratos descendentes. Lesão: espasticidade, hiperreflexia, Babinski.'],
      ['Decussação das pirâmides', 'Na transição bulbo-medula, onde cruzam cerca de 85–90% das fibras corticoespinais.'],
      ['Neurônio motor inferior (NMI)', 'Motoneurônio α do corno anterior ou de núcleo motor de nervo craniano. Lesão: flacidez, arreflexia, atrofia, fasciculação.']
    ],
    clinic: [
      'Coluna dorsal cruza no BULBO. Espinotalâmico cruza na MEDULA. Corticoespinal cruza no BULBO (pirâmides).',
      'Brown-Séquard: mesmo lado perde propriocepção/vibração + força. Lado oposto perde dor/temperatura.',
      'Siringomielia: perda de dor e temperatura em capa, com tato fino preservado.',
      'Tabes dorsalis (sífilis terciária): lesão da coluna dorsal. Ataxia sensitiva, Romberg positivo.',
      'Deficiência de B12 (degeneração combinada subaguda): coluna dorsal + corticoespinal.',
      'Síndrome da artéria espinal anterior: perde força e dor/temperatura bilateral, com coluna dorsal (posterior) preservada.',
      'ELA: sinais de NMS e NMI juntos, com sensibilidade normal.'
    ]
  });
})();
