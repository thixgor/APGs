/* 03 · Potencial de ação e hiperpolarização */
(function () {
  const { svg, flow, callout, tag, ion, C } = H;
  const Y = v => 40 + (40 - v) * 2.3;           // mV → y
  const X = t => 90 + t * 105;                   // ms → x

  /* ---------- gráfico ---------- */
  const seg = (d, s, c, w = 5) => `<path class="draw" data-s="${s}" d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const dot = (x, y, s) => `<g data-s="=${s}"><circle cx="${x}" cy="${y}" r="16" fill="#ff8a1f" opacity=".25" class="pulse"/><circle cx="${x}" cy="${y}" r="7" fill="#ff8a1f" stroke="#fff" stroke-width="2"/></g>`;
  const readings = { 1: '−70', 2: '−70', 5: '−40 ↑', 6: '+30', 7: '+32', 8: '−20 ↓', 9: '−85', 10: '−70', 11: '', 13: '−76' };
  const grafico = `
    <rect x="20" y="10" width="960" height="360" rx="18" fill="#07201a" stroke="rgba(165,232,198,.18)"/>
    <line x1="90" y1="30" x2="90" y2="350" stroke="#5f8a75"/><line x1="90" y1="350" x2="940" y2="350" stroke="#5f8a75"/>
    <text x="60" y="${Y(0) + 5}" text-anchor="end" class="lx mono">0</text>
    <text x="60" y="${Y(-70) + 5}" text-anchor="end" class="lx mono">−70</text>
    <text x="60" y="${Y(-55) + 5}" text-anchor="end" class="lx mono">−55</text>
    <text x="60" y="${Y(30) + 5}" text-anchor="end" class="lx mono">+30</text>
    <text x="60" y="${Y(-90) + 5}" text-anchor="end" class="lx mono">−90</text>
    <text x="940" y="366" text-anchor="end" class="lx">tempo (ms)</text>
    <text x="36" y="24" class="lx">mV</text>
    <line x1="90" x2="940" y1="${Y(0)}" y2="${Y(0)}" stroke="#5f8a75" stroke-dasharray="3 6"/>
    <line x1="90" x2="940" y1="${Y(-55)}" y2="${Y(-55)}" stroke="#ff8a1f" stroke-dasharray="8 6" opacity=".8" data-hl="=4,=5"/>
    <text x="938" y="${Y(-55) - 8}" text-anchor="end" class="lx lo">limiar −55</text>
    <line x1="90" x2="940" y1="${Y(-90)}" y2="${Y(-90)}" stroke="#3fc584" stroke-dasharray="4 6" opacity=".7"/>
    <text x="938" y="${Y(-90) - 7}" text-anchor="end" class="lx lm">E<tspan baseline-shift="sub" style="font-size:10px">K</tspan> −90</text>
    <text x="938" y="46" text-anchor="end" class="lx lo">E<tspan baseline-shift="sub" style="font-size:10px">Na</tspan> +60 ↑</text>
    <!-- refratários -->
    <g data-s="=11"><rect x="${X(2.3)}" y="30" width="${X(3.9) - X(2.3)}" height="320" fill="#ff6b5e" opacity=".16"/><rect x="${X(3.9)}" y="30" width="${X(5.6) - X(3.9)}" height="320" fill="#ffd166" opacity=".13"/>
      <text x="${(X(2.3) + X(3.9)) / 2}" y="345" text-anchor="middle" class="lx" fill="#ff9a90">absoluto</text><text x="${(X(3.9) + X(5.6)) / 2}" y="345" text-anchor="middle" class="lx" fill="#ffd166">relativo</text></g>
    ${seg(`M${X(0)},${Y(-70)} L${X(1)},${Y(-70)}`, '1', '#cfe2d7')}
    ${seg(`M${X(1)},${Y(-70)} C${X(1.2)},${Y(-70)} ${X(1.25)},${Y(-64)} ${X(1.4)},${Y(-64)} C${X(1.55)},${Y(-64)} ${X(1.65)},${Y(-68)} ${X(1.8)},${Y(-68)} C${X(2)},${Y(-68)} ${X(2.15)},${Y(-60)} ${X(2.3)},${Y(-55)}`, '3', '#a5e8c6')}
    ${seg(`M${X(2.3)},${Y(-55)} C${X(2.45)},${Y(-45)} ${X(2.6)},${Y(10)} ${X(2.8)},${Y(30)}`, '5', '#ff8a1f', 6)}
    ${seg(`M${X(2.8)},${Y(30)} C${X(2.86)},${Y(35)} ${X(3.0)},${Y(35)} ${X(3.1)},${Y(28)}`, '7', '#ffb567', 6)}
    ${seg(`M${X(3.1)},${Y(28)} C${X(3.35)},${Y(-10)} ${X(3.6)},${Y(-60)} ${X(3.9)},${Y(-70)}`, '8', '#3fc584', 6)}
    ${seg(`M${X(3.9)},${Y(-70)} C${X(4.05)},${Y(-82)} ${X(4.2)},${Y(-84)} ${X(4.4)},${Y(-84)} C${X(4.8)},${Y(-84)} ${X(5)},${Y(-81)} ${X(5.2)},${Y(-80)}`, '9', '#c7b1ff', 6)}
    ${seg(`M${X(5.2)},${Y(-80)} C${X(5.6)},${Y(-75)} ${X(6.1)},${Y(-70)} ${X(6.5)},${Y(-70)} L${X(8)},${Y(-70)}`, '10', '#cfe2d7')}
    ${seg(`M${X(6.6)},${Y(-70)} C${X(6.8)},${Y(-70)} ${X(6.9)},${Y(-76)} ${X(7.1)},${Y(-76)} C${X(7.4)},${Y(-76)} ${X(7.6)},${Y(-71)} ${X(7.9)},${Y(-70.5)}`, '=13', '#c7b1ff', 5)}
    ${dot(X(0.5), Y(-70), 1)}${dot(X(0.5), Y(-70), 2)}${dot(X(2.3), Y(-55), 4)}${dot(X(2.55), Y(-20), 5)}${dot(X(2.8), Y(30), 6)}${dot(X(2.98), Y(34), 7)}${dot(X(3.45), Y(-30), 8)}${dot(X(4.4), Y(-84), 9)}${dot(X(6.3), Y(-70), 10)}${dot(X(7.1), Y(-76), 13)}
    <g data-s="=4">${tag(X(2.3), Y(-55) + 36, 'somação atinge o limiar', { o: 1, fs: 14 })}</g>
    ${Object.entries(readings).map(([s, v]) => v ? `<text x="930" y="112" text-anchor="end" class="mono" style="font-size:44px" fill="#ff8a1f" data-s="=${s}">${v}<tspan style="font-size:20px" fill="#9fc0ae"> mV</tspan></text>` : '').join('')}
  `;

  /* ---------- membrana ---------- */
  const heads = (y) => Array.from({ length: 48 }, (_, i) => `<circle cx="${30 + i * 20}" cy="${y}" r="8" fill="#e8d7b7"/>`).join('');
  const chan = (x, c) => `<rect x="${x - 34}" y="542" width="26" height="76" rx="12" fill="${c}"/><rect x="${x + 8}" y="542" width="26" height="76" rx="12" fill="${c}"/>`;
  const membrana = `
    <text x="30" y="420" class="ls">EXTRACELULAR · Na⁺ 145 · K⁺ 5 · Cl⁻ 110 mM</text>
    <text x="30" y="742" class="ls">INTRACELULAR · K⁺ 140 · Na⁺ 15 mM · ânions proteicos (A⁻)</text>
    ${[[60, 470], [250, 455], [300, 510], [470, 470], [560, 505], [700, 460], [760, 515], [930, 470]].map(([x, y]) => ion('na', x, y, 12)).join('')}
    ${[[120, 500], [520, 450], [900, 510]].map(([x, y]) => ion('cl', x, y, 11)).join('')}
    ${[[70, 670], [250, 700], [320, 655], [480, 690], [700, 670], [760, 700], [950, 660]].map(([x, y]) => ion('k', x, y, 12)).join('')}
    ${[[130, 690], [560, 660], [900, 700]].map(([x, y]) => `<g transform="translate(${x},${y})"><rect x="-18" y="-12" width="36" height="24" rx="8" fill="#5f8a75"/><text x="0" y="5" text-anchor="middle" class="mono" style="font-size:12px;stroke:none" fill="#e8f1ff">A⁻</text></g>`).join('')}
    <rect x="20" y="552" width="960" height="56" fill="#8a7a5c" opacity=".35"/>
    ${heads(552)}${heads(608)}
    <!-- canal de vazamento de K+ -->
    ${chan(170, '#2d8a61')}
    <text x="170" y="535" text-anchor="middle" class="lx lm">vazamento K⁺</text>
    ${flow({ d: 'M170,700 L170,440', n: 2, dur: 3.6, r: 11, ion: 'k' })}
    <!-- canal de Na+ voltagem-dependente -->
    <g data-hl="=5,=6,=7">${chan(400, '#d9661a')}</g>
    <text x="400" y="535" text-anchor="middle" class="lx lo">Nav (Na⁺)</text>
    <rect x="378" y="536" width="44" height="12" rx="4" fill="#ffd166" data-s="<5,10"/>
    <rect x="378" y="536" width="12" height="12" rx="4" fill="#ffd166" data-s="5-9"/>
    <g data-s="7-9"><path d="M430,618 C440,640 420,640 410,632" stroke="#ffb567" stroke-width="3" fill="none"/><circle cx="400" cy="606" r="13" fill="#ffb567"/></g>
    <g data-s="<7,10"><path d="M430,618 C450,650 440,672 424,676" stroke="#ffb567" stroke-width="3" fill="none"/><circle cx="416" cy="680" r="13" fill="#ffb567"/></g>
    <g data-s="5-6">${flow({ d: 'M400,430 L400,720', n: 6, dur: 1.1, r: 12, ion: 'na' })}</g>
    <!-- canal de K+ voltagem-dependente -->
    <g data-hl="=7,=8,=9">${chan(640, '#1f7f70')}</g>
    <text x="640" y="535" text-anchor="middle" class="lx lm">Kv (K⁺)</text>
    <rect x="618" y="604" width="44" height="12" rx="4" fill="#a5e8c6" data-s="<7,11"/>
    <g data-s="7-10">${flow({ d: 'M640,720 L640,430', n: 5, dur: 1.5, r: 12, ion: 'k' })}</g>
    <!-- bomba Na/K -->
    <g data-hl="=1,=10"><rect x="812" y="540" width="72" height="80" rx="20" fill="#7a4fd1"/><text x="848" y="585" text-anchor="middle" class="mono" style="font-size:12px;stroke:none" fill="#fff">ATPase</text></g>
    ${flow({ d: 'M830,720 L830,430', n: 3, dur: 3.4, r: 10, ion: 'na' })}${flow({ d: 'M866,430 L866,720', n: 2, dur: 3.4, r: 10, ion: 'k' })}
    <text x="848" y="535" text-anchor="middle" class="lx" fill="#c7b1ff">3 Na⁺ fora · 2 K⁺ dentro</text>
    <!-- receptor GABA-A -->
    <g data-s="=13">${chan(520, '#9b7ae0')}<text x="520" y="535" text-anchor="middle" class="lx" fill="#c7b1ff">GABA-A (Cl⁻)</text>${flow({ d: 'M520,430 L520,720', n: 4, dur: 1.6, r: 11, ion: 'cl' })}</g>
    <!-- rótulos de estado -->
    <g data-s="=5,=6">${tag(400, 760, 'portão de ativação ABERTO: Na⁺ entra', { o: 1, fs: 14 })}</g>
    <g data-s="7-9">${tag(400, 760, 'bola de inativação tampa o canal', { fs: 14, fill: '#ffb567' })}</g>
    <g data-s="=2">${tag(400, 495, 'Na⁺: química ↓ + elétrica ↓', { o: 1, fs: 14 })}${tag(170, 760, 'K⁺: química ↑ × elétrica ↓', { fs: 14, fill: '#a5e8c6' })}</g>
  `;
  const principal = svg(`${grafico}<g transform="translate(0,0)">${membrana}</g>`, '0 0 1000 790');

  /* ---------- neurônio (graduado, somação, propagação) ---------- */
  const nodes = [420, 520, 620, 720, 820];
  const neur = svg(`
    <!-- dendritos -->
    <g stroke="#ffb567" stroke-width="12" stroke-linecap="round" fill="none">
      <path d="M250,380 C200,320 150,280 90,220"/><path d="M150,280 C120,300 90,320 60,320"/>
      <path d="M250,380 C200,430 150,480 80,540"/><path d="M160,470 C130,440 90,430 60,440"/>
      <path d="M240,340 C230,280 230,220 250,160"/>
    </g>
    <circle cx="260" cy="380" r="62" fill="url(#gSoma)"/>
    <circle cx="255" cy="378" r="20" fill="#7a3a0c" opacity=".55"/>
    <path d="M318,360 L360,372 L360,388 L318,400Z" fill="#ff8a1f" data-hl="=4"/>
    <line x1="360" y1="380" x2="940" y2="380" stroke="#ffd9b0" stroke-width="10"/>
    ${nodes.map((x, i) => i < nodes.length - 0 ? `<rect x="${x - 88}" y="360" width="80" height="40" rx="18" fill="#efe2c8" opacity=".92"/>` : '').join('')}
    <rect x="828" y="360" width="80" height="40" rx="18" fill="#efe2c8" opacity=".92"/>
    <g fill="#ffd166">${[[940, 350], [960, 380], [940, 410]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10"/>`).join('')}</g>
    <!-- sinapses nos dendritos -->
    <g data-s="3-4">
      ${[[90, 220], [80, 540], [250, 160]].map(([x, y], i) => `<g><circle cx="${x}" cy="${y}" r="10" fill="#e8f1ff"/>
        <circle cx="${x}" cy="${y}" r="10" fill="none" stroke="#a5e8c6" stroke-width="4"><animate attributeName="r" values="10;95" dur="1.8s" begin="${i * .5}s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="1.8s" begin="${i * .5}s" repeatCount="indefinite"/></circle></g>`).join('')}
    </g>
    <g data-s="=3">
      ${tag(150, 190, '+6 mV na sinapse', { o: 1, fs: 14 })}${tag(205, 255, '+3 mV', { fs: 14 })}${tag(262, 300, '+1 mV no soma', { fs: 14 })}
      ${tag(560, 520, 'decai com a distância · sem limiar · pode somar', { fs: 15 })}
    </g>
    <g data-s="=4">${callout(340, 380, 380, 250, 'Cone de implantação', { anchor: 'start', cls: 'lb lo', sub: 'zona de gatilho: muitos canais Nav' })}
      ${tag(560, 540, 'espacial: várias sinapses ao mesmo tempo', { fs: 15 })}${tag(560, 590, 'temporal: a mesma sinapse, várias vezes seguidas', { fs: 15 })}</g>
    <!-- propagação saltatória -->
    <g data-s="=12">
      ${nodes.map(x => `<rect x="${x - 8}" y="358" width="16" height="44" rx="4" fill="#ff8a1f" opacity=".35"/>`).join('')}
      <circle cx="${nodes[0]}" cy="380" r="18" fill="#ff8a1f" filter="url(#glow)"><animate attributeName="cx" values="${nodes.concat([940]).join(';')}" dur="2.4s" calcMode="discrete" repeatCount="indefinite"/></circle>
      ${callout(520, 400, 540, 470, 'Nodo de Ranvier', { anchor: 'start', cls: 'lb lo', sub: 'só aqui há canais Nav' })}
      ${callout(470, 362, 470, 280, 'Mielina', { anchor: 'middle', sub: 'isolante: a corrente “pula” por dentro' })}
      ${tag(560, 620, 'atrás do PA: canais inativados → não volta', { fs: 15, o: 1 })}
      ${tag(560, 670, 'até 120 m/s na fibra mielinizada grossa', { fs: 15 })}
    </g>
  `);

  DA.topic({
    short: 'Potencial de ação',
    title: 'Potencial de ação e <em>hiperpolarização</em>',
    card: 'Repouso, graduado, limiar, fases, refratário, condução',
    lede: 'Um neurônio é uma pilha que se descarrega e recarrega em 2 milissegundos. Cada fase acontece porque um canal específico abre ou fecha, e o gráfico só registra o que os íons fazem.',
    fig: () => `<div class="scene" data-s="0-2,5-11,=13">${principal}</div><div class="scene" data-s="3-4,=12">${neur}</div>`,
    steps: [
      {
        k: 'Repouso', t: 'Repouso: por que o neurônio é <em>negativo</em>?',
        p: 'Parado, o interior do neurônio fica em cerca de <b>−70 mV</b> em relação ao exterior. A membrana em repouso é muito mais permeável ao <b>K⁺</b> (canais de vazamento sempre abertos) do que ao Na⁺. O K⁺ sai a favor do gradiente e deixa para trás ânions (proteínas A⁻) que não conseguem sair.',
        why: 'Cada K⁺ que sai leva uma carga positiva, e o lado de dentro fica negativo. Essa negatividade começa a <b>puxar o K⁺ de volta</b>. Quando o puxão elétrico empata com a vontade química de sair, o K⁺ para (é o <b>potencial de equilíbrio do K⁺, E<sub>K</sub> ≈ −90 mV</b>). O repouso fica em −70 e não em −90 porque um pouquinho de Na⁺ vaza para dentro e “puxa” o valor para cima.',
        an: 'Uma sala onde só as pessoas com balões positivos (K⁺) conseguem sair pela porta. Quanto mais saem, mais negativa fica a sala, até que a sala negativa segura quem ficou.',
        deep: '<p><b>Bomba Na⁺/K⁺-ATPase</b>: tira 3 Na⁺ e põe 2 K⁺ para dentro a cada ATP. Ela <b>mantém os gradientes</b> a longo prazo e contribui diretamente com só cerca de −3 a −5 mV (é eletrogênica). Quem cria o potencial de repouso é a <b>permeabilidade seletiva ao K⁺</b>.</p><p>Equação de Goldman: o potencial de repouso é a média dos potenciais de equilíbrio (E<sub>K</sub>, E<sub>Na</sub>, E<sub>Cl</sub>), ponderada pela permeabilidade de cada íon.</p>'
      },
      {
        k: 'Duas forças', t: 'Cada íon sofre <em>duas forças</em>',
        p: 'Todo íon é empurrado por duas forças: a <b>química</b> (do mais concentrado para o menos concentrado) e a <b>elétrica</b> (cargas opostas se atraem). A soma das duas é o <b>gradiente eletroquímico</b>.',
        keys: ['<b>Na⁺</b>: mais concentrado fora → química para <b>dentro</b>. Dentro é negativo → elétrica também para <b>dentro</b>. As duas somam: Na⁺ “quer muito” entrar (E<sub>Na</sub> ≈ +60 mV).', '<b>K⁺</b>: mais concentrado dentro → química para <b>fora</b>. Dentro é negativo → elétrica para <b>dentro</b>. As forças brigam e, em −70 mV, ganha um pouco a química: sai K⁺.'],
        why: 'Isso explica a ordem das fases. Quando os canais de Na⁺ abrem, o Na⁺ entra com força enorme. Quando os de K⁺ abrem, ele sai. O gráfico do potencial de ação é só a consequência de <b>qual porta está aberta</b>.',
        an: 'Um escorregador (química) com um ímã no final (elétrica). Para o Na⁺, os dois ajudam. Para o K⁺, o escorregador desce para fora e o ímã puxa para dentro.'
      },
      {
        k: 'Potencial graduado', t: 'O que é <em>potencial graduado</em>?',
        p: '<b>Técnico:</b> é uma variação <b>local</b> do potencial de membrana cuja amplitude é <b>proporcional ao estímulo</b>. Ele <b>diminui com a distância</b> (condução eletrotônica, decremental), não tem limiar nem período refratário, pode ser <b>despolarizante (PEPS)</b> ou <b>hiperpolarizante (PIPS)</b> e <b>pode somar</b>. Acontece nos dendritos e no soma, e também são graduados os potenciais receptores (célula ciliada, fotorreceptor).',
        why: 'Ele diminui porque a corrente que entra na sinapse <b>vaza pela membrana</b> (canais de repouso) e encontra resistência no citoplasma pelo caminho. Não há canais dependentes de voltagem suficientes ali para <b>regenerar</b> o sinal, então ele vai morrendo.',
        an: 'Jogue uma pedra num lago: a onda é maior perto de onde a pedra caiu e vai sumindo. Pedra maior faz onda maior (graduado). Duas pedras juntas fazem uma onda maior (somação).',
        deep: '<p>Constante de comprimento (λ): a distância em que o potencial cai para 37% do valor inicial. Aumenta com diâmetro maior e com resistência de membrana maior (mielina). Por isso axônios grossos e mielinizados conduzem melhor.</p><table><tr><th>Graduado</th><th>Potencial de ação</th></tr><tr><td>Amplitude variável</td><td>Tudo ou nada (sempre igual)</td></tr><tr><td>Decai com a distância</td><td>Regenera, não decai</td></tr><tr><td>Sem limiar</td><td>Limiar ≈ −55 mV</td></tr><tr><td>Soma</td><td>Não soma (tem refratário)</td></tr><tr><td>Dendritos/soma</td><td>Cone de implantação e axônio</td></tr></table>'
      },
      {
        k: 'Somação', t: '<em>Somação</em> no cone de implantação',
        p: 'Os potenciais graduados de todos os dendritos convergem para o <b>cone de implantação</b> (segmento inicial do axônio). Se a soma deles levar a membrana dali até o <b>limiar (≈ −55 mV)</b>, nasce um potencial de ação. <b>Somação espacial</b>: várias sinapses ao mesmo tempo. <b>Somação temporal</b>: a mesma sinapse, várias vezes seguidas, antes do potencial anterior sumir.',
        why: 'O cone de implantação tem a <b>maior densidade de canais Nav</b> do neurônio, então ali é mais fácil atingir o limiar. É onde o neurônio “decide”: cada PEPS e cada PIPS é um voto, e o cone apura a votação.',
        an: 'Uma votação: cada sinapse excitatória é um voto “sim” e cada inibitória um voto “não”. Se os “sim” passam do quórum (limiar), o potencial de ação acontece.'
      },
      {
        k: 'Limiar', t: 'Limiar: a <em>avalanche</em> começa',
        p: 'Em −55 mV, <b>canais de Na⁺ dependentes de voltagem (Nav)</b> abrem o portão de ativação. O Na⁺ entra, o que despolariza mais, o que abre <b>mais</b> canais Nav, que deixam entrar mais Na⁺. É uma <b>retroalimentação positiva</b> (ciclo de Hodgkin).',
        why: 'Abaixo do limiar, o Na⁺ que entra é compensado pelo K⁺ que sai pelos canais de vazamento e o potencial volta. No limiar, a entrada de Na⁺ <b>passa a vencer</b> a saída de K⁺, e a partir daí o processo se alimenta sozinho. Por isso o PA é <b>tudo ou nada</b>: ou não dispara, ou dispara inteiro.',
        an: 'A descarga do vaso sanitário: aperte de leve e nada acontece. Passou do ponto, a descarga vai até o fim, e você não consegue dar “meia descarga”.'
      },
      {
        k: 'Despolarização', t: '<em>Despolarização</em> e overshoot',
        p: 'Com milhares de canais Nav abertos, o Na⁺ entra em massa e o potencial sobe de −55 até cerca de <b>+30 mV</b>. O interior fica <b>positivo</b> (overshoot). O valor tende ao potencial de equilíbrio do Na⁺ (<b>E<sub>Na</sub> ≈ +60 mV</b>).',
        why: 'Ele não chega a +60 porque, no meio do caminho, duas coisas freiam: os canais Nav começam a <b>inativar</b> e os canais de K⁺ começam a abrir. Entram poucos íons: menos de 1 em 10 milhões muda de lado. As concentrações praticamente não mudam. O que muda é a <b>distribuição de cargas</b> bem junto à membrana.',
        an: 'Um estádio em que as portas se abrem de uma vez e a torcida (Na⁺) invade o campo.'
      },
      {
        k: 'Pico', t: 'Pico: <em>inativação</em> do canal de Na⁺',
        p: 'Cerca de 1 ms depois de abrir, o canal Nav é tampado por dentro pelo <b>portão de inativação</b> (a “bola e corrente”, parte da proteína). O Na⁺ para de entrar mesmo com o portão de ativação ainda aberto. Ao mesmo tempo, os <b>canais de K⁺ dependentes de voltagem (Kv)</b>, mais lentos, terminam de abrir.',
        why: 'O canal Nav tem <b>três estados</b>: fechado (pronto para abrir), aberto e <b>inativado</b> (fechado e <b>incapaz</b> de abrir). Ele só volta ao “fechado e pronto” quando a membrana repolariza. Esse detalhe molecular explica o período refratário e por que o PA não volta para trás.',
        an: 'Uma porta automática com trava de segurança: depois de abrir, ela trava sozinha e só destrava quando o ambiente volta ao normal.'
      },
      {
        k: 'Repolarização', t: '<em>Repolarização</em>: o K⁺ sai',
        p: 'Com o Nav inativado e os canais <b>Kv abertos</b>, o K⁺ sai da célula a favor do gradiente (dentro está positivo e com muito K⁺). A saída de cargas positivas faz o potencial <b>despencar</b> de volta para valores negativos.',
        why: 'No pico o interior está positivo, então agora a força <b>elétrica também empurra o K⁺ para fora</b>. Química e elétrica se somam e a saída é rápida e forte. Não é a bomba que repolariza: são os canais de K⁺.',
        clin: 'Bloqueadores de canal de K⁺ (amiodarona, no coração) prolongam a repolarização. Excesso de K⁺ extracelular (hipercalemia) reduz o gradiente e deixa as células mais excitáveis no início, depois inexcitáveis (Nav presos em inativação).'
      },
      {
        k: 'Hiperpolarização', t: '<em>Hiperpolarização</em> pós-potencial',
        p: 'Os canais Kv são <b>lentos para fechar</b>. Por um tempo ficam abertos mais canais de K⁺ do que no repouso, e o potencial passa do ponto: cai abaixo de −70 até cerca de <b>−80 a −90 mV</b>, perto de E<sub>K</sub>. É a hiperpolarização pós-potencial (undershoot).',
        why: 'Com muitos canais de K⁺ abertos, a membrana fica ainda mais permeável ao K⁺ do que no repouso, e o potencial se aproxima do <b>E<sub>K</sub> (−90 mV)</b>, o ponto em que o K⁺ para de sair. Essa fase deixa o neurônio mais longe do limiar e ajuda a <b>limitar a frequência de disparo</b>.',
        an: 'Um pêndulo que, ao voltar, passa um pouco do ponto de equilíbrio antes de parar.'
      },
      {
        k: 'Volta ao repouso', t: 'De volta ao <em>repouso</em>',
        p: 'Os canais Kv terminam de fechar e os canais de vazamento restabelecem os <b>−70 mV</b>. Os canais Nav já saíram da inativação e estão “fechados e prontos” para um novo disparo.',
        why: '<b>Mito comum</b>: “a bomba de Na⁺/K⁺ repolariza a célula”. Errado. Um único PA mexe numa fração tão pequena dos íons que os gradientes quase não mudam. A bomba trabalha <b>continuamente, em segundo plano</b>, para que milhares de PAs seguidos não esgotem os gradientes.',
        an: 'A bomba é o carregador do celular: você não precisa dele para cada ligação, mas sem ele a bateria acaba.'
      },
      {
        k: 'Refratário', t: 'Períodos <em>refratários</em>',
        keys: ['<b>Absoluto</b> (do limiar até quase o fim da repolarização): <b>nenhum</b> estímulo, por maior que seja, dispara outro PA, porque os canais Nav estão abertos ou inativados.', '<b>Relativo</b> (durante a hiperpolarização): um estímulo <b>mais forte que o normal</b> consegue disparar, porque parte dos Nav já recuperou, mas a célula está mais negativa e ainda há K⁺ saindo.'],
        why: 'O refratário absoluto garante que (1) o PA <b>não se some</b> nem vire tetania no neurônio, (2) haja um <b>limite máximo de frequência</b> de disparo e (3) a propagação seja <b>unidirecional</b>: o trecho que acabou de disparar não consegue disparar de novo.',
        an: 'Depois de dar descarga, você precisa esperar a caixa encher de novo. Com a caixa meio cheia (relativo), só uma apertada mais forte funciona.'
      },
      {
        k: 'Propagação', t: 'Propagação e <em>condução saltatória</em>',
        p: 'O Na⁺ que entra num ponto se espalha por dentro do axônio e leva o trecho vizinho ao limiar, e assim sucessivamente. No axônio <b>mielinizado</b>, a mielina isola a membrana e os canais Nav ficam concentrados nos <b>nodos de Ranvier</b>. O PA “pula” de nodo em nodo: é a <b>condução saltatória</b>.',
        why: 'A mielina aumenta a resistência e diminui a capacitância da membrana: a corrente não vaza e chega longe. Só os nodos precisam regenerar o sinal. Isso dá <b>mais velocidade</b> (até cerca de 120 m/s, contra cerca de 1 m/s na fibra C amielínica) e <b>economiza energia</b>, porque menos íons atravessam e a bomba trabalha menos.',
        clin: '<b>Esclerose múltipla</b> (desmielinização central) e <b>Guillain-Barré</b> (periférica): a condução fica lenta ou bloqueada. Anestésicos locais (lidocaína) bloqueiam os canais Nav e o PA não se propaga.'
      },
      {
        k: 'Inibição', t: 'Hiperpolarização <em>inibitória</em> (PIPS)',
        p: 'Hiperpolarizar também é a forma de <b>inibir</b> um neurônio. O <b>GABA</b> (no encéfalo) e a <b>glicina</b> (na medula) abrem canais de <b>Cl⁻</b> (GABA-A, receptor de glicina). O Cl⁻ entra e o interior fica mais negativo, de −70 para cerca de −76 mV. É o <b>potencial pós-sináptico inibitório</b>. O GABA-B abre canais de K⁺, que saem e também hiperpolarizam.',
        why: 'Hiperpolarizar <b>afasta a membrana do limiar</b>: agora são necessários mais PEPS para disparar. Mesmo quando o potencial quase não muda, abrir canais de Cl⁻ “curto-circuita” os PEPS (inibição por derivação). É assim que o sistema nervoso ajusta o ganho de cada neurônio.',
        an: 'Cada PIPS é um voto “não” que aumenta o número de votos “sim” necessários para aprovar o PA.',
        clin: '<b>Benzodiazepínicos</b> e barbitúricos potencializam o GABA-A (ansiolíticos e anticonvulsivantes). A <b>estricnina</b> bloqueia o receptor de glicina e causa convulsões. A <b>toxina tetânica</b> impede a liberação de glicina/GABA e causa espasmos.'
      }
    ],
    legend: [
      ['Potencial de repouso (−70 mV)', 'Criado sobretudo pela saída de K⁺ pelos canais de vazamento. Fica perto de E_K (−90 mV) e um pouco acima por causa do vazamento de Na⁺.'],
      ['Canais de vazamento de K⁺ (K2P)', 'Sempre abertos. São a principal causa da negatividade de repouso.'],
      ['Bomba Na⁺/K⁺-ATPase', '3 Na⁺ para fora e 2 K⁺ para dentro por ATP. Mantém os gradientes a longo prazo. Não é ela que repolariza.'],
      ['Potencial graduado', 'Local, proporcional ao estímulo, decremental, sem limiar e somável (PEPS/PIPS/potencial receptor).'],
      ['Cone de implantação / segmento inicial', 'Zona de gatilho com muitos canais Nav. É onde a soma dos potenciais graduados vira (ou não) um PA.'],
      ['Limiar (≈ −55 mV)', 'Ponto em que a entrada de Na⁺ supera a saída de K⁺ e começa a retroalimentação positiva.'],
      ['Canal Nav', 'Tem portão de ativação (abre rápido com despolarização) e de inativação (fecha cerca de 1 ms depois). Estados: fechado, aberto e inativado.'],
      ['Canal Kv (retificador tardio)', 'Abre devagar com a despolarização e fecha devagar. Causa a repolarização e a hiperpolarização pós-potencial.'],
      ['Overshoot', 'Fase em que o interior fica positivo (até cerca de +30 mV), tendendo a E_Na (+60 mV).'],
      ['Hiperpolarização pós-potencial', 'Queda abaixo do repouso (até cerca de −85 mV) porque os Kv demoram a fechar.'],
      ['Período refratário absoluto', 'Nenhum estímulo dispara PA (Nav abertos ou inativados).'],
      ['Período refratário relativo', 'Só um estímulo maior dispara (parte dos Nav recuperada e K⁺ ainda saindo).'],
      ['Mielina e nodos de Ranvier', 'Oligodendrócitos (SNC) ou células de Schwann (SNP) isolam o axônio. Os nodos concentram Nav e permitem a condução saltatória.'],
      ['PIPS', 'Hiperpolarização por entrada de Cl⁻ (GABA-A, glicina) ou saída de K⁺ (GABA-B). Afasta a membrana do limiar.']
    ],
    clinic: [
      'Tudo ou nada: aumentar o estímulo acima do limiar NÃO aumenta a amplitude do PA. A intensidade é codificada pela FREQUÊNCIA de disparo.',
      'Hipercalemia: despolariza o repouso. Primeiro facilita o disparo, depois prende os Nav em inativação (arritmias, fraqueza).',
      'Hipocalcemia: aumenta a excitabilidade (o Ca²⁺ extracelular estabiliza os Nav) e causa tetania, sinais de Chvostek e Trousseau.',
      'Lidocaína e tetrodotoxina bloqueiam Nav. A lidocaína age melhor em fibras finas e muito ativas (dor).',
      'Esclerose múltipla (SNC) e Guillain-Barré (SNP): desmielinização, condução lenta ou bloqueada.',
      'Benzodiazepínicos aumentam a frequência de abertura do GABA-A. Barbitúricos aumentam a duração da abertura.',
      'Pegadinha: potencial graduado ≠ potencial de ação. Fotorreceptores e células ciliadas só fazem potenciais graduados.'
    ]
  });
})();
