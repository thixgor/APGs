/* 06 · Áreas de Brodmann, Broca, Wernicke e afasias */
(function () {
  const { svg, flow, callout, tag, box } = H;
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const brain = (cls = '') => `<image href="img/lobos-base.webp" x="0" y="0" width="1100" height="775" class="${cls}"/>`;
  const chip = (x, y, n, c = '#ff8a1f', s = '0-3') => `<g data-s="${s}"><circle cx="${x}" cy="${y}" r="24" fill="${c}" stroke="#07201a" stroke-width="3"/><text x="${x}" y="${y + 7}" text-anchor="middle" class="mono" style="font-size:${n.length > 3 ? 13 : 17}px;stroke:none" fill="#07201a">${n}</text></g>`;
  const P = { a41: [560, 385], w: [740, 390], b: [320, 410], m1: [455, 300], ang: [850, 300], v1: [1050, 430], v2: [960, 320] };
  const arc = 'M740,390 C720,300 560,270 450,320 C400,345 360,375 320,410';

  /* ---------- cena A: mapa de Brodmann ---------- */
  const mapa = svg(`
    <style>.fig .dimb{opacity:.45;filter:grayscale(.5) brightness(.75)}</style>
    ${brain('dimb')}
    ${chip(505, 170, '4')}${chip(430, 110, '6')}${chip(360, 180, '8')}${chip(130, 280, '9·10·46', '#a5e8c6')}
    ${chip(335, 400, '44', '#ffd166')}${chip(280, 430, '45', '#ffd166')}
    ${chip(580, 150, '3·1·2')}${chip(740, 110, '5·7', '#a5e8c6')}${chip(700, 290, '40', '#a5e8c6')}${chip(850, 300, '39', '#a5e8c6')}
    ${chip(560, 385, '41·42')}${chip(740, 395, '22', '#ffd166')}${chip(430, 350, '43', '#c7b1ff')}
    ${chip(1050, 430, '17')}${chip(960, 320, '18·19', '#a5e8c6')}
    <g data-s="=3">
      ${tag(170, -10, 'laranja = primárias', { o: 1, fs: 15 })}${tag(420, -10, 'verde = associação', { fs: 15, fill: '#a5e8c6' })}${tag(680, -10, 'amarelo = linguagem', { fs: 15, fill: '#ffd166' })}${tag(920, -10, 'lilás = gustação', { fs: 15, fill: '#c7b1ff' })}
    </g>
  `, '-40 -60 1180 860');

  /* ---------- cena B: citoarquitetura ---------- */
  const col = (x0, layers, title, sub, hi) => {
    let y = 120, s = `<text x="${x0 + 120}" y="70" text-anchor="middle" class="lt">${title}</text><text x="${x0 + 120}" y="98" text-anchor="middle" class="ls">${sub}</text>`;
    layers.forEach(([nome, h, dens, big], i) => {
      const hl = hi === i;
      s += `<rect x="${x0}" y="${y}" width="240" height="${h}" fill="${hl ? 'rgba(255,138,31,.16)' : i % 2 ? '#0e3326' : '#123b2d'}" ${hl ? 'stroke="#ff8a1f" stroke-width="2"' : ''}/>`;
      s += `<text x="${x0 - 12}" y="${y + h / 2 + 6}" text-anchor="end" class="mono" style="font-size:15px" fill="${hl ? '#ff8a1f' : '#9fc0ae'}">${nome}</text>`;
      for (let k = 0; k < dens * h / 10; k++) s += `<circle cx="${x0 + 8 + rnd() * 224}" cy="${y + 4 + rnd() * (h - 8)}" r="${1.8 + rnd() * 1.4}" fill="#cfe2d7" opacity=".7"/>`;
      if (big) for (let k = 0; k < big; k++) { const cx = x0 + 25 + k * (190 / big) + rnd() * 10, cy = y + h * 0.35 + rnd() * h * 0.4; s += `<path d="M${cx},${cy - 16} L${cx + 11},${cy + 10} L${cx - 11},${cy + 10}Z" fill="#ff8a1f"/><line x1="${cx}" y1="${cy + 10}" x2="${cx}" y2="${y + h + 30}" stroke="#ff8a1f" stroke-width="2"/>`; }
      y += h;
    });
    return s;
  };
  const cito = svg(`
    ${col(150, [['I', 40, 1], ['II', 30, 5], ['III', 110, 3], ['IV', 12, 6], ['V', 160, 1.5, 5], ['VI', 90, 3]], 'Área 4 · motora', 'agranular', 4)}
    ${col(610, [['I', 40, 1], ['II', 55, 6], ['III', 80, 3], ['IV', 150, 12], ['V', 50, 2], ['VI', 67, 3]], 'Área 17 / 3 · sensitiva', 'granular (koniocórtex)', 3)}
    ${tag(270, 620, 'camada V grossa: células de Betz → SAÍDA', { o: 1, fs: 15 })}
    ${tag(730, 620, 'camada IV grossa: recebe o tálamo → ENTRADA', { fs: 15, fill: '#a5e8c6' })}
    <path d="M730,700 L730,640" stroke="#a5e8c6" stroke-width="3" marker-end="url(#arrG)" transform="rotate(180 730 670)"/>
    <text x="760" y="712" class="ls">aferência talâmica chega na IV</text>
  `);

  /* ---------- cena C: circuito da linguagem + lesões ---------- */
  const node = (k, label, s, extra = '') => `<g data-s="${s}" ${extra}><circle cx="${P[k][0]}" cy="${P[k][1]}" r="34" fill="#ff8a1f" opacity=".25"/><circle cx="${P[k][0]}" cy="${P[k][1]}" r="13" fill="#ff8a1f" stroke="#fff" stroke-width="3"/></g>`;
  const lesion = (x, y, rx, ry, s) => `<g data-s="${s}"><ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#ff6b5e" opacity=".45" class="pulse"/><path d="M${x - 18},${y - 18} L${x + 18},${y + 18} M${x + 18},${y - 18} L${x - 18},${y + 18}" stroke="#fff" stroke-width="5" stroke-linecap="round"/></g>`;
  const bubble = (lines, s, color = '#fff6ea') => `<g data-s="${s}"><rect x="-20" y="-40" width="560" height="${40 + lines.length * 34}" rx="22" fill="${color}"/><path d="M60,${lines.length * 34} l30,40 l10,-40z" fill="${color}"/>${lines.map((l, i) => `<text x="0" y="${i * 34}" style="font-size:24px;stroke:none;font-style:italic" fill="#07201a">${l}</text>`).join('')}</g>`;
  const circuito = svg(`
    <style>.fig .dimc{opacity:.4;filter:grayscale(.6) brightness(.7)}</style>
    ${brain('dimc')}
    <!-- caminho de ouvir e falar -->
    <g data-s="4-5">
      <path d="M560,760 L560,420" stroke="#62dcc8" stroke-width="5" fill="none" marker-end="url(#arrC)"/>
      <path d="M590,385 L705,390" stroke="#ffd166" stroke-width="5" marker-end="url(#arrY)"/>
      <path d="${arc}" stroke="#ff8a1f" stroke-width="7" fill="none" class="draw" data-s="4-5"/>
      <path d="M335,385 C370,350 410,320 440,305" stroke="#ff8a1f" stroke-width="5" marker-end="url(#arrO)" fill="none"/>
      <path d="M445,310 C380,420 260,520 160,600" stroke="#cfe2d7" stroke-width="4" stroke-dasharray="8 7" marker-end="url(#arr)" fill="none"/>
      ${flow({ d: 'M560,760 L560,385 L740,390 ' + arc.slice(arc.indexOf('C')) + ' L455,300', n: 7, dur: 4.5, r: 8, fill: '#ffd166' })}
    </g>
    <g data-s="=5">
      <path d="M1040,420 L975,335" stroke="#a5e8c6" stroke-width="5" marker-end="url(#arrG)"/>
      <path d="M945,315 L870,302" stroke="#a5e8c6" stroke-width="5" marker-end="url(#arrG)"/>
      <path d="M835,315 L760,375" stroke="#a5e8c6" stroke-width="5" marker-end="url(#arrG)"/>
      ${node('v1', '', '=5')}${node('v2', '', '=5')}${node('ang', '', '=5')}
      ${callout(850, 300, 900, 170, 'Giro angular (39)', { anchor: 'middle', cls: 'lb', sub: 'converte letra em som' })}
      ${callout(1050, 430, 1060, 600, 'V1 (17)', { anchor: 'middle', cls: 'lb' })}
    </g>
    ${node('a41', '', '4-5')}${node('w', '', '4-5')}${node('b', '', '4-5')}${node('m1', '', '4-5')}
    <g data-s="=4">
      ${callout(560, 385, 520, 560, 'A1 (41/42): ouve', { anchor: 'end', cls: 'lb' })}
      ${callout(740, 390, 820, 520, 'Wernicke (22): entende', { anchor: 'start', cls: 'lb' })}
      ${callout(600, 290, 700, 200, 'Fascículo arqueado', { anchor: 'start', cls: 'lb lo', sub: 'leva a palavra para trás→frente' })}
      ${callout(320, 410, 250, 690, 'Broca (44/45): programa', { anchor: 'middle', cls: 'lb' })}
      ${callout(455, 300, 400, 190, 'M1 (4) face/laringe: executa', { anchor: 'end', cls: 'lb' })}
    </g>
    <!-- lesões -->
    ${lesion(310, 410, 80, 55, '=6')}${lesion(750, 395, 85, 50, '=7')}
    <g data-s="=8"><path d="${arc}" stroke="#ff6b5e" stroke-width="10" fill="none" stroke-dasharray="14 10"/>${lesion(640, 300, 40, 30, '=8')}</g>
    ${lesion(520, 380, 300, 150, '=9')}
    <g data-s="=9"><ellipse cx="200" cy="260" rx="90" ry="70" fill="none" stroke="#ffd166" stroke-width="4" stroke-dasharray="10 8"/><ellipse cx="940" cy="440" rx="80" ry="70" fill="none" stroke="#ffd166" stroke-width="4" stroke-dasharray="10 8"/>${tag(200, 360, 'zona de fronteira anterior', { fs: 14, fill: '#ffd166' })}${tag(940, 540, 'zona de fronteira posterior', { fs: 14, fill: '#ffd166' })}</g>
    <g transform="translate(40,20)">
      ${bubble(['“Eu… ontem… médico…', 'perna… não… andar.”'], '=6')}
      ${bubble(['“Então o negócio da coisa, sabe,', 'a mesa pintou o cachorro no dia', 'da pobreta que eu falei e tal…”'], '=7')}
      ${bubble(['Médico: “Repita: casa amarela.”', 'Paciente: “Casa… a… ma… lera?”'], '=8')}
    </g>
    <g data-s="=6">${tag(310, 520, 'não fluente · entende · repete mal', { o: 1, fs: 15 })}</g>
    <g data-s="=7">${tag(750, 520, 'fluente · NÃO entende · repete mal', { o: 1, fs: 15 })}</g>
    <g data-s="=8">${tag(640, 420, 'fluente · entende · REPETIÇÃO muito ruim', { o: 1, fs: 15 })}</g>
  `, '-40 -60 1180 860');

  /* ---------- cena D: algoritmo ---------- */
  const lf = [['Broca', 1], ['Transc. motora', 0], ['Global', 1], ['Transc. mista', 0], ['Condução', 1], ['Anômica', 0], ['Wernicke', 1], ['Transc. sensitiva', 0]];
  const e = (x1, y1, x2, y2, t) => `<path d="M${x1},${y1} L${x2},${y2}" stroke="#5f8a75" stroke-width="2.5"/><text x="${(x1 + x2) / 2 + (x2 < x1 ? -8 : 8)}" y="${(y1 + y2) / 2}" text-anchor="${x2 < x1 ? 'end' : 'start'}" class="lx" fill="${t === 'sim' ? '#3fc584' : '#ff6b5e'}">${t}</text>`;
  const arvore = svg(`
    ${e(500, 95, 250, 180, 'não')}${e(500, 95, 750, 180, 'sim')}
    ${[250, 750].map(x => e(x, 225, x - 125, 320, 'sim') + e(x, 225, x + 125, 320, 'não')).join('')}
    ${[125, 375, 625, 875].map(x => e(x, 365, x - 62, 470, 'não') + e(x, 365, x + 62, 470, 'sim')).join('')}
    ${box(380, 40, 240, 56, 'Fala fluente?', '', { fs: 20, stroke: '#ff8a1f' })}
    ${[250, 750].map(x => box(x - 105, 180, 210, 46, 'Compreende?', '', { fs: 17 })).join('')}
    ${[125, 375, 625, 875].map(x => box(x - 80, 320, 160, 46, 'Repete?', '', { fs: 17 })).join('')}
    ${lf.map(([n, bad], i) => { const x = 63 + i * 125; return box(x - 58, 470, 116, 64, n, '', { fs: 14, fill: bad ? 'rgba(255,138,31,.2)' : '#123f2f', stroke: bad ? '#ff8a1f' : 'rgba(165,232,198,.45)' }); }).join('')}
    <text x="250" y="160" text-anchor="middle" class="ls">NÃO FLUENTES (anteriores)</text>
    <text x="750" y="160" text-anchor="middle" class="ls">FLUENTES (posteriores)</text>
    ${tag(500, 610, 'repetição preservada = transcortical (circuito intacto, isolado)', { fs: 15 })}
    ${tag(500, 660, 'repetição alterada = lesão NO circuito perisylviano', { o: 1, fs: 15 })}
  `);

  DA.topic({
    id: 'linguagem', section: 'Encéfalo e motricidade',
    short: 'Brodmann, Broca e Wernicke',
    title: 'Brodmann, <em>Broca</em>, <em>Wernicke</em> e afasias',
    card: 'Mapa citoarquitetônico, circuito da fala e tipos de afasia',
    lede: 'Por que a lesão num ponto do cérebro tira a fala e, 5 cm atrás, tira a compreensão? A resposta está no mapa de Brodmann e no circuito que liga ouvir, entender e falar.',
    fig: () => `<div class="scene" data-s="0-1,=3">${mapa}</div><div class="scene" data-s="=2">${cito}</div><div class="scene" data-s="4-9">${circuito}</div><div class="scene" data-s="10-11">${arvore}</div>`,
    steps: [
      {
        k: 'O mapa', t: 'Brodmann: <em>52 áreas</em> pela citoarquitetura',
        p: 'Em 1909, Korbinian Brodmann corou o córtex (coloração de Nissl), observou ao microscópio a <b>arquitetura das células</b> em cada região (espessura das 6 camadas, tipo e densidade de neurônios) e dividiu o córtex em <b>52 áreas numeradas</b>.',
        why: 'Ele dividiu só pelo que via ao microscópio, sem saber função nenhuma. Décadas depois, lesões e neuroimagem mostraram que as fronteiras dele coincidem com <b>fronteiras funcionais</b>. A forma do tecido acompanha a função.',
        an: 'É como mapear uma cidade pelo tipo de prédio: onde só há fábricas, é o polo industrial, e onde só há casas, é bairro residencial. Não é preciso entrar para saber o que se faz ali.'
      },
      {
        k: 'Estrutura → função', t: 'O porquê: <em>granular × agranular</em>',
        p: 'O neocórtex tem 6 camadas. A <b>camada IV</b> (granular interna) <b>recebe</b> as fibras do tálamo, e a <b>camada V</b> (piramidal interna) <b>envia</b> fibras para fora (tronco, medula).',
        keys: ['<b>Córtex motor (4)</b>: <b>agranular</b>. A camada IV quase some e a <b>V é enorme</b>, com as células gigantes de <b>Betz</b> que formam o trato corticoespinal.', '<b>Córtex sensitivo (3, 17, 41)</b>: <b>granular (koniocórtex)</b>. A <b>IV é muito espessa</b> porque recebe muita informação do tálamo.'],
        why: 'Uma área que <b>manda ordens</b> precisa de muitas células de saída (V). Uma área que <b>recebe dados</b> precisa de muitas células de entrada (IV). Sabendo disso, dá para olhar a lâmina e dizer se o córtex é motor ou sensitivo.',
        an: 'Um estúdio de rádio (motor) tem uma antena de transmissão enorme. Uma central de monitoramento (sensitivo) tem um paredão de telas recebendo imagens.'
      },
      {
        k: 'Áreas-chave', t: 'As áreas que <em>caem em prova</em>',
        html: `<table><tr><th>Área</th><th>Função</th></tr>
          <tr><td><b>3, 1, 2</b></td><td>Somatossensorial primária (pós-central)</td></tr>
          <tr><td><b>4</b></td><td>Motora primária (pré-central)</td></tr>
          <tr><td><b>6</b> · <b>8</b></td><td>Pré-motora/suplementar · campo ocular frontal</td></tr>
          <tr><td><b>44, 45</b></td><td><b>Broca</b> (giro frontal inferior)</td></tr>
          <tr><td><b>9, 10, 46</b></td><td>Pré-frontal dorsolateral</td></tr>
          <tr><td><b>17</b> · <b>18, 19</b></td><td>Visual primária · associação visual</td></tr>
          <tr><td><b>22</b></td><td><b>Wernicke</b> (giro temporal superior posterior)</td></tr>
          <tr><td><b>39</b> · <b>40</b></td><td>Giro angular · supramarginal</td></tr>
          <tr><td><b>41, 42</b></td><td>Auditiva primária (Heschl)</td></tr>
          <tr><td><b>43</b></td><td>Gustativa (opérculo/ínsula)</td></tr></table>`,
        why: 'Truque para decorar: as áreas <b>primárias</b> ficam ao lado de uma fissura (central, calcarina, lateral) e as de <b>associação</b> ficam em volta delas, como anéis.'
      },
      {
        k: 'Circuito da fala', t: 'Ouvir e repetir: o <em>circuito da linguagem</em>',
        p: 'Modelo de Wernicke-Geschwind: o som chega ao <b>córtex auditivo (41/42)</b> → <b>Wernicke (22)</b> reconhece a palavra e seu significado → o <b>fascículo arqueado</b> leva a representação da palavra para a frente → <b>Broca (44/45)</b> monta o programa motor → o <b>córtex motor (4)</b> da face, língua e laringe executa a fala.',
        why: 'Compreender e falar são tarefas diferentes, feitas em lugares diferentes e ligadas por um “cabo” (o fascículo arqueado). Cada tipo de afasia é uma falha num desses três pontos: na <b>entrada</b> (Wernicke), na <b>saída</b> (Broca) ou no <b>cabo</b> (condução).',
        an: 'Um tradutor simultâneo: um ouve e entende (Wernicke), passa o recado por um fone (fascículo arqueado) e o outro fala (Broca).'
      },
      {
        k: 'Leitura', t: 'Ler em voz alta: o <em>giro angular</em>',
        p: 'Na leitura, a palavra entra pelos olhos: <b>V1 (17)</b> → <b>associação visual (18/19)</b> → <b>giro angular (39)</b>, que converte a forma escrita no código sonoro da palavra → Wernicke → fascículo arqueado → Broca → fala.',
        why: 'O giro angular fica na encruzilhada entre os córtices visual, auditivo e somatossensorial. É o lugar ideal para ligar <b>símbolo visual a som</b>. Lesão ali causa <b>alexia com agrafia</b> (não lê nem escreve).',
        clin: 'Alexia <b>sem</b> agrafia (a pessoa escreve mas não consegue ler o que escreveu): lesão do occipital esquerdo + esplênio do corpo caloso, que desconecta o córtex visual do giro angular.'
      },
      {
        k: 'Afasia de Broca', t: 'Afasia de <em>Broca</em> (expressiva)',
        p: '<b>Lesão</b>: giro frontal inferior dominante (44/45), divisão <b>superior</b> da artéria cerebral média esquerda. <b>Fala</b>: <b>não fluente</b>, lenta, com esforço, <b>telegráfica</b> (só substantivos e verbos, sem artigos e preposições: agramatismo). <b>Compreensão</b>: relativamente preservada. <b>Repetição</b>: prejudicada.',
        why: 'Quem sabe <b>o que</b> quer dizer é Wernicke, que está intacta. Broca, que <b>programa os movimentos</b> e a gramática da frase, está lesada. O paciente sabe o que quer dizer, entende o que ouve e percebe os próprios erros, por isso fica muito <b>frustrado</b>. Como Broca fica vizinha do córtex motor da face e do braço, é comum haver <b>hemiparesia direita</b> braquiofacial.',
        an: 'Um pianista que sabe a música de cor mas está com as mãos engessadas.'
      },
      {
        k: 'Afasia de Wernicke', t: 'Afasia de <em>Wernicke</em> (receptiva)',
        p: '<b>Lesão</b>: giro temporal superior posterior dominante (22), divisão <b>inferior</b> da ACM esquerda. <b>Fala</b>: <b>fluente</b>, com ritmo normal, porém <b>vazia de sentido</b>: parafasias (trocas de palavras ou sílabas), neologismos, “salada de palavras”. <b>Compreensão</b>: gravemente prejudicada. <b>Repetição</b>: prejudicada.',
        why: 'Broca está intacta e produz frases com melodia e gramática. Mas quem escolhe o <b>significado</b> (Wernicke) está lesado, e as palavras saem erradas. Como o paciente também não entende a própria fala, ele <b>não percebe o erro</b> (anosognosia) e costuma estar tranquilo ou até eufórico. Geralmente <b>não há hemiparesia</b>, mas pode haver quadrantanopsia superior direita (alça de Meyer).',
        an: 'Um pianista com mãos perfeitas tocando uma partitura rasgada e embaralhada, sem ouvir o que está tocando.'
      },
      {
        k: 'Afasia de condução', t: 'Afasia de <em>condução</em>: o cabo cortado',
        p: '<b>Lesão</b>: fascículo arqueado (giro supramarginal, 40, e ínsula). <b>Fala</b>: fluente, com parafasias fonêmicas (troca de sons). <b>Compreensão</b>: boa. <b>Repetição</b>: <b>muito ruim</b>, e esse é o sinal-chave.',
        why: 'Wernicke entende e Broca fala. Para <b>repetir</b> uma frase ouvida, porém, a informação tem que ir diretamente de trás (Wernicke) para a frente (Broca) pelo fascículo arqueado, e ele está cortado. Na fala espontânea existem caminhos alternativos, mas na repetição não.',
        an: 'Duas pessoas que se entendem, mas o fone entre elas está com defeito: cada uma fala bem sozinha, e nenhuma consegue repassar o recado da outra.'
      },
      {
        k: 'Global e transcorticais', t: 'Global e <em>transcorticais</em>',
        keys: ['<b>Global</b>: lesão grande do território da ACM esquerda, que pega Broca, Wernicke e o fascículo. Tudo prejudicado: fluência, compreensão e repetição.', '<b>Transcortical motora</b>: como Broca, <b>mas repete bem</b>. Lesão na zona de fronteira anterior (entre ACA e ACM).', '<b>Transcortical sensitiva</b>: como Wernicke, <b>mas repete bem</b>. Lesão na zona de fronteira posterior (entre ACM e ACP).', '<b>Anômica</b>: só dificuldade de achar palavras. É a mais leve e aparece em várias lesões e na recuperação das outras.'],
        why: 'Nas transcorticais, o circuito <b>Wernicke–arqueado–Broca está intacto</b>, mas desconectado do resto do córtex. O paciente repete como um papagaio (às vezes até de forma compulsiva, a ecolalia), sem conseguir usar isso para falar ou entender. A causa típica é a <b>hipoperfusão das zonas de fronteira</b> (choque, hipotensão, estenose carotídea).'
      },
      {
        k: 'Algoritmo', t: 'Classifique em <em>3 perguntas</em>',
        p: '1) A fala é <b>fluente</b>? 2) Ele <b>compreende</b>? 3) Ele <b>repete</b>? As três respostas levam direto ao tipo de afasia.',
        why: 'Cada pergunta testa um ponto do circuito: <b>fluência</b> testa a parte anterior (Broca), <b>compreensão</b> testa a posterior (Wernicke) e <b>repetição</b> testa o circuito perisylviano inteiro, incluindo o fascículo arqueado. Não fluente = lesão anterior. Fluente = lesão posterior.'
      },
      {
        k: 'Pegadinha', t: 'Afasia ≠ <em>disartria</em>',
        keys: ['<b>Afasia</b>: distúrbio da <b>linguagem</b> (escolher, organizar e compreender palavras). Afeta também escrita e leitura.', '<b>Disartria</b>: distúrbio da <b>articulação</b> (músculos da fala). A linguagem está perfeita e a pessoa escreve normalmente. A lesão é motora: cerebelo, tronco, nervos cranianos, via corticobulbar.', '<b>Mutismo, dislalia e apraxia da fala</b> são outras categorias.'],
        why: 'Peça para o paciente <b>escrever</b>. Na afasia, a escrita tem os mesmos erros da fala, porque a linguagem é uma só. Na disartria, a escrita sai perfeita, porque o problema está só na “boca”.',
        clin: 'A afasia é um sinal de <b>localização cortical</b> no hemisfério dominante. No pronto-socorro, afasia súbita = AVC até prova em contrário e ativa o protocolo de trombólise.'
      }
    ],
    legend: [
      ['Brodmann (1909)', '52 áreas definidas pela citoarquitetura (Nissl). As fronteiras coincidem com as funcionais.'],
      ['Camada IV (granular interna)', 'Recebe aferências talâmicas. Espessa nos córtices sensitivos primários (koniocórtex).'],
      ['Camada V (piramidal interna)', 'Principal saída do córtex. Espessa no córtex motor, com as células de Betz.'],
      ['Área de Broca (44 opercular, 45 triangular)', 'Giro frontal inferior dominante. Programa motor da fala e sintaxe.'],
      ['Área de Wernicke (22 posterior)', 'Giro temporal superior dominante. Reconhecimento das palavras e compreensão.'],
      ['Fascículo arqueado', 'Feixe de substância branca que liga Wernicke a Broca, passando sob o giro supramarginal.'],
      ['Giro angular (39)', 'Integra visão, audição e tato. Leitura, escrita e cálculo.'],
      ['Giro supramarginal (40)', 'Processamento fonológico e praxia. Fica sobre o fascículo arqueado.'],
      ['Córtex auditivo primário (41/42)', 'Giro de Heschl. Primeira estação cortical do som.'],
      ['Córtex motor da face/laringe (4 inferior)', 'Executa os movimentos articulatórios da fala.'],
      ['Divisão superior da ACM', 'Irriga o frontal lateral (Broca, motor). Oclusão causa afasia de Broca + hemiparesia braquiofacial.'],
      ['Divisão inferior da ACM', 'Irriga o temporal/parietal (Wernicke). Oclusão causa afasia de Wernicke + quadrantanopsia superior.']
    ],
    clinic: [
      'Broca: não fluente, compreende, repete mal, frustrado, hemiparesia direita.',
      'Wernicke: fluente, não compreende, repete mal, anosognosia, geralmente sem hemiparesia.',
      'Condução: fluente, compreende, repetição MUITO ruim (lesão do fascículo arqueado/supramarginal).',
      'Global: tudo ruim, com lesão extensa da ACM esquerda e hemiplegia.',
      'Transcorticais: a repetição é preservada. Lesões nas zonas de fronteira vascular.',
      'Anômica: dificuldade de nomear, com o resto normal.',
      'Afasia ≠ disartria: peça para escrever.',
      'A dominância para linguagem é esquerda em cerca de 95% dos destros e 70% dos canhotos.'
    ]
  });
})();
