/* Utilitários para desenhar os esquemas em SVG.
   Convenção de etapas: qualquer elemento com data-s aparece só nas etapas indicadas.
   "3"   -> da etapa 3 em diante      "2-5" -> da 2 até a 5
   "=4"  -> só na etapa 4             "<3"  -> antes da etapa 3
   Vários tokens separados por vírgula funcionam como "ou".
   data-hl usa a mesma sintaxe para acender (brilho laranja).
   A etapa 0 é sempre a capa do tema. */
(function () {
  let uid = 0;
  const C = {
    na: '#ff8a1f', k: '#3fc584', ca: '#ffd166', cl: '#c7b1ff', h: '#ff9ecf',
    hco3: '#8fd3ff', glu: '#e8f1ff', da: '#ffb567', ach: '#9be7ff', atp: '#ffe29a',
    gaba: '#ff6b5e', csf: '#62dcc8', vein: '#7f95ff', h2o: '#8fd3ff'
  };
  const L = { na: 'Na⁺', k: 'K⁺', ca: 'Ca²⁺', cl: 'Cl⁻', h: 'H⁺', hco3: 'HCO₃⁻', h2o: 'H₂O', glu: 'Glu', da: 'DA', ach: 'ACh', atp: 'ATP', gaba: 'GABA' };

  const H = {
    C, L,
    id(p = 'u') { return p + (++uid); },
    svg(content, vb = '0 0 1000 760', extra = '') {
      return `<svg viewBox="${vb}" preserveAspectRatio="xMidYMid meet" ${extra}>${H.defs()}${content}</svg>`;
    },
    defs() {
      const mk = (id, c) => `<marker id="${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${c}"/></marker>`;
      return `<defs>${mk('arr', '#cfe2d7')}${mk('arrO', '#ff8a1f')}${mk('arrG', '#3fc584')}${mk('arrR', '#ff6b5e')}${mk('arrY', '#ffd166')}${mk('arrB', '#7f95ff')}${mk('arrC', '#62dcc8')}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2"/></filter>
        <radialGradient id="gCell" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#1c5a43"/><stop offset="1" stop-color="#0f3a2b"/></radialGradient>
        <radialGradient id="gSoma" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#ffcf9a"/><stop offset="1" stop-color="#e2731c"/></radialGradient>
        <linearGradient id="gBrain" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3b6a4"/><stop offset="1" stop-color="#d98d7c"/></linearGradient>
      </defs>`;
    },
    /* íon: círculo colorido com rótulo */
    ion(t, x, y, r = 13, extra = '') {
      const lab = L[t] || t;
      const fs = lab.length > 3 ? Math.max(8, r * 0.62) : r * 0.85;
      return `<g class="ion" transform="translate(${x},${y})" ${extra}><circle r="${r}" fill="${C[t] || t}"/><text style="font-size:${fs}px">${lab}</text></g>`;
    },
    /* partículas correndo ao longo de um caminho */
    flow({ d, n = 6, dur = 4, r = 6, fill = C.csf, extra = '', ion = null, show = false, op = 1 }) {
      const pid = H.id('p');
      let s = `<g ${extra}><path id="${pid}" d="${d}" fill="none" stroke="${show ? fill : 'none'}" stroke-opacity=".25" stroke-width="${show ? 2 : 0}"/>`;
      for (let i = 0; i < n; i++) {
        const b = (-(dur / n) * i).toFixed(2);
        const body = ion ? H.ion(ion, 0, 0, r) : `<circle r="${r}" fill="${fill}" opacity="${op}"/>`;
        s += `<g>${body}<animateMotion dur="${dur}s" begin="${b}s" repeatCount="indefinite"><mpath href="#${pid}"/></animateMotion></g>`;
      }
      return s + '</g>';
    },
    /* rótulo com linha-guia: ponto em (x,y) e texto em (tx,ty) */
    callout(x, y, tx, ty, text, o = {}) {
      const a = o.anchor || (tx < x ? 'end' : 'start');
      const dx = a === 'end' ? -8 : a === 'start' ? 8 : 0;
      const cls = o.cls || 'lb';
      const sub = o.sub ? `<text x="${tx + dx}" y="${ty + 20}" text-anchor="${a}" class="ls">${o.sub}</text>` : '';
      return `<g ${o.extra || ''}><circle cx="${x}" cy="${y}" r="4.5" fill="${o.dot || '#ff8a1f'}"/><path class="lead" d="M${x},${y} L${tx},${ty}"/><text x="${tx + dx}" y="${ty + 6}" text-anchor="${a}" class="${cls}">${text}</text>${sub}</g>`;
    },
    /* etiqueta em pílula */
    tag(x, y, text, o = {}) {
      const fs = o.fs || 16;
      const w = o.w || Math.round(text.replace(/<[^>]+>/g, '').length * fs * 0.56 + 22);
      const h = fs + 14;
      const a = o.anchor || 'middle';
      const x0 = a === 'middle' ? x - w / 2 : a === 'end' ? x - w : x;
      return `<g class="tag ${o.o ? 'o' : ''}" ${o.extra || ''}><rect x="${x0}" y="${y - h / 2}" width="${w}" height="${h}" rx="${h / 2}"/><text x="${x0 + w / 2}" y="${y + fs * 0.35}" text-anchor="middle" style="font-size:${fs}px" ${o.fill ? `fill="${o.fill}"` : ''}>${text}</text></g>`;
    },
    /* caixa de texto para diagramas de circuito */
    box(x, y, w, h, title, sub, o = {}) {
      const fill = o.fill || '#123f2f', stroke = o.stroke || 'rgba(165,232,198,.45)';
      return `<g ${o.extra || ''}><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.rx || 14}" fill="${fill}" stroke="${stroke}" stroke-width="${o.sw || 1.6}"/>
        <text x="${x + w / 2}" y="${y + (sub ? h / 2 - 3 : h / 2 + 7)}" text-anchor="middle" class="lb" style="font-size:${o.fs || 19}px" ${o.tf ? `fill="${o.tf}"` : ''}>${title}</text>
        ${sub ? `<text x="${x + w / 2}" y="${y + h / 2 + 19}" text-anchor="middle" class="ls" style="font-size:${o.sfs || 14}px">${sub}</text>` : ''}</g>`;
    },
    /* sinal + / − sobre uma seta */
    sign(x, y, plus, extra = '') {
      const c = plus ? '#3fc584' : '#ff6b5e';
      return `<g ${extra}><circle cx="${x}" cy="${y}" r="13" fill="#07201a" stroke="${c}" stroke-width="2.2"/><text x="${x}" y="${y + 6}" text-anchor="middle" class="mono" style="font-size:18px" fill="${c}">${plus ? '+' : '−'}</text></g>`;
    }
  };
  window.H = H;
})();
