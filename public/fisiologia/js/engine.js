/* Motor da apresentação: navegação, escala do palco, etapas das figuras, legenda e modo gravação. */
(function () {
  const T = DA.topics;
  const $ = (s, r = document) => r.querySelector(s);
  const stage = $('#stage'), fig = $('#fig'), txt = $('#txtInner'), prog = $('#prog');
  const cover = $('#cover'), main = $('#main');
  let ti = -1, si = 0, legendTab = 'step';

  const store = {
    get(k, d) { try { const v = localStorage.getItem('da-fisio-' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('da-fisio-' + k, JSON.stringify(v)); } catch (e) { /* sem armazenamento */ } }
  };

  /* ---------- escala do palco ---------- */
  function fit() {
    const port = document.body.classList.contains('portrait');
    const W = port ? 1080 : 1600, Hh = port ? 1920 : 900;
    const vw = window.innerWidth, vh = window.innerHeight;
    const s = Math.min(vw / W, vh / Hh);
    stage.style.transform = `translate(-50%,-50%) scale(${s})`;
  }
  window.addEventListener('resize', () => { fit(); fitText(); });

  /* ---------- etapas ---------- */
  function match(spec, n) {
    return spec.split(',').some(tok => {
      tok = tok.trim();
      if (!tok) return false;
      if (tok[0] === '=') return n === +tok.slice(1);
      if (tok[0] === '<') return n < +tok.slice(1);
      if (tok.includes('-')) { const [a, b] = tok.split('-').map(Number); return n >= a && n <= b; }
      return n >= +tok;
    });
  }
  function applyStep(n) {
    fig.querySelectorAll('[data-s]').forEach(el => el.classList.toggle('on', match(el.dataset.s, n)));
    fig.querySelectorAll('[data-hl]').forEach(el => el.classList.toggle('hl', match(el.dataset.hl, n)));
    fig.querySelectorAll('[data-dim]').forEach(el => el.classList.toggle('dim', match(el.dataset.dim, n)));
    fig.querySelectorAll('[data-cls]').forEach(el => {
      // data-cls="classe:spec;classe2:spec"
      el.dataset.cls.split(';').forEach(p => { const [c, sp] = p.split(':'); if (c && sp) el.classList.toggle(c.trim(), match(sp, n)); });
    });
  }
  function prepDraw() {
    fig.querySelectorAll('.draw').forEach(p => { try { p.style.setProperty('--len', Math.ceil(p.getTotalLength()) + 1); } catch (e) { } });
  }

  /* ---------- texto ---------- */
  function stepsOf(t) { return [{ cover: true }].concat(t.steps); }
  function renderText() {
    const t = T[ti], st = stepsOf(t)[si], total = t.steps.length;
    let h = '';
    if (st.cover) {
      h += `<div class="eyebrow"><span>Tema ${String(ti + 1).padStart(2, '0')} · ${total} etapas</span><span class="ln"></span></div>`;
      h += `<h2>${t.title}</h2>`;
      if (t.lede) h += `<p class="p">${t.lede}</p>`;
      h += `<ol class="roadmap">${t.steps.map(s => `<li>${s.k || s.t}</li>`).join('')}</ol>`;
    } else {
      h += `<div class="eyebrow"><span>Etapa ${si}/${total}${st.k ? ' · ' + st.k : ''}</span><span class="ln"></span></div>`;
      h += `<h2>${st.t}</h2>`;
      if (st.p) h += `<p class="p">${st.p}</p>`;
      if (st.keys) h += `<ul class="keys">${st.keys.map(k => `<li>${k}</li>`).join('')}</ul>`;
      if (st.html) h += st.html;
      if (st.why) h += `<div class="co why"><span class="lbl">Por quê?</span><div>${st.why}</div></div>`;
      if (st.an) h += `<div class="co ana"><span class="lbl">Analogia</span><div>${st.an}</div></div>`;
      if (st.clin) h += `<div class="co clin"><span class="lbl">Na clínica</span><div>${st.clin}</div></div>`;
    }
    txt.classList.remove('enter'); void txt.offsetWidth;
    txt.innerHTML = h; txt.classList.add('enter');
    fitText();
  }
  function fitText() {
    const box = $('#txt');
    let k = 1; box.style.setProperty('--k', k);
    let guard = 0;
    while (txt.scrollHeight > txt.clientHeight + 1 && k > 0.62 && guard++ < 30) {
      k -= 0.03; box.style.setProperty('--k', k.toFixed(2));
    }
  }

  /* ---------- progresso / cabeçalho ---------- */
  function renderChrome() {
    if (ti < 0) {
      $('#tnum').textContent = 'Índice'; $('#tname').textContent = `${T.length} temas`;
      prog.innerHTML = '';
      return;
    }
    const t = T[ti], n = t.steps.length + 1;
    $('#tnum').textContent = String(ti + 1).padStart(2, '0');
    $('#tname').textContent = t.short || t.title.replace(/<[^>]+>/g, '');
    prog.innerHTML = Array.from({ length: n }, (_, i) => `<i class="${i < si ? 'done' : i === si ? 'cur' : ''}"></i>`).join('');
  }

  /* ---------- legenda ---------- */
  function renderLegend() {
    const body = $('#lgBody');
    document.querySelectorAll('#legend .tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === legendTab));
    if (ti < 0) {
      $('#lgK').textContent = 'Legenda'; $('#lgT').textContent = 'Escolha um tema';
      body.innerHTML = shortcuts(); return;
    }
    const t = T[ti], st = stepsOf(t)[si];
    $('#lgK').textContent = `Tema ${String(ti + 1).padStart(2, '0')} · etapa ${si}/${t.steps.length}`;
    $('#lgT').innerHTML = st.cover ? t.title : st.t;
    let h = '';
    if (legendTab === 'step') {
      if (st.cover) {
        h += `<div><h4>Visão geral</h4><div class="deep"><p>${t.lede || ''}</p>${t.overview || ''}</div></div>`;
      } else {
        h += `<div><h4>Aprofundamento desta etapa</h4><div class="deep">${st.deep || '<p>' + (st.p || '') + '</p>'}</div></div>`;
        if (st.why) h += `<div><h4>O porquê</h4><div class="deep"><p>${st.why}</p></div></div>`;
        if (st.an) h += `<div><h4>Analogia</h4><div class="deep"><p>${st.an}</p></div></div>`;
      }
      if (st.say) h += `<div><h4>Roteiro de fala (sugestão)</h4><div class="deep"><p>${st.say}</p></div></div>`;
    } else if (legendTab === 'gl') {
      h += `<div><h4>Estruturas e funções</h4><dl>${(t.legend || []).map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join('')}</dl></div>`;
    } else if (legendTab === 'cl') {
      h += `<div><h4>Clínica, provas e pegadinhas</h4><ul>${(t.clinic || []).map(x => `<li>${x}</li>`).join('')}</ul></div>`;
    } else {
      h += shortcuts();
    }
    body.innerHTML = h; body.scrollTop = 0;
  }
  function shortcuts() {
    return `<div><h4>Atalhos</h4><div class="shortcuts">
      <kbd>→</kbd><span>próxima etapa (também Espaço, clique no palco, botão lateral do mouse)</span>
      <kbd>←</kbd><span>etapa anterior</span>
      <kbd>↑ ↓</kbd><span>tema anterior / próximo</span>
      <kbd>M</kbd><span>menu de temas</span><kbd>Home</kbd><span>índice</span>
      <kbd>L</kbd><span>abrir/fechar legenda</span>
      <kbd>T</kbd><span>mostrar/ocultar texto do palco (figura em tela cheia)</span>
      <kbd>V</kbd><span>formato Reels 9:16</span>
      <kbd>F</kbd><span>tela cheia</span>
      <kbd>G</kbd><span>modo gravação (esconde botões, legenda e cursor)</span>
      <kbd>Esc</kbd><span>sair do modo gravação / fechar painéis</span>
    </div></div>`;
  }

  /* ---------- capa geral ---------- */
  function cards() {
    return T.map((t, i) => `<button class="tcard" data-go="${i}" type="button"><span class="n">${String(i + 1).padStart(2, '0')}</span><span><div class="t">${t.short || t.title}</div><div class="d">${t.card || ''}</div></span></button>`).join('');
  }
  function renderCover() {
    cover.innerHTML = `<div><h1>Neuro<em>fisiologia</em><br>em etapas</h1>
      <p class="lede">Do estímulo ao comportamento, uma etapa por vez e sempre com o porquê do porquê. Avance com a seta → ou clicando no palco.</p>
      <div class="keys-help"><span><kbd>→</kbd> avança</span><span><kbd>←</kbd> volta</span><span><kbd>L</kbd> legenda</span><span><kbd>V</kbd> 9:16</span><span><kbd>G</kbd> gravar</span></div></div>
      <div class="tgrid">${cards()}</div>`;
  }

  /* ---------- navegação ---------- */
  function go(t, s, fromHash) {
    const changedTopic = t !== ti;
    ti = t; si = s;
    if (ti < 0) {
      cover.hidden = false; main.style.visibility = 'hidden';
      renderCover();
    } else {
      cover.hidden = true; main.style.visibility = '';
      const tp = T[ti];
      if (changedTopic) {
        fig.innerHTML = typeof tp.fig === 'function' ? tp.fig() : tp.fig;
        prepDraw();
        fig.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 450, easing: 'ease-out' });
      }
      applyStep(si);
      renderText();
      const st = stepsOf(tp)[si];
      if (st.run) try { st.run(fig); } catch (e) { console.error(e); }
      if (tp.onStep) try { tp.onStep(fig, si); } catch (e) { console.error(e); }
    }
    renderChrome(); renderLegend();
    if (!fromHash) {
      const hsh = ti < 0 ? '' : `t${ti + 1}-e${si}`;
      try { history.replaceState(null, '', hsh ? '#' + hsh : location.pathname + location.search); } catch (e) { }
    }
  }
  function next() {
    if (ti < 0) return go(0, 0);
    const n = T[ti].steps.length;
    if (si < n) go(ti, si + 1);
    else if (ti < T.length - 1) go(ti + 1, 0);
  }
  function prev() {
    if (ti < 0) return;
    if (si > 0) go(ti, si - 1);
    else if (ti > 0) go(ti - 1, T[ti - 1].steps.length);
    else go(-1, 0);
  }
  function topicStep(d) {
    const nt = Math.max(-1, Math.min(T.length - 1, ti + d));
    go(nt, 0);
  }
  window.DAgo = go;

  /* ---------- modos ---------- */
  const body = document.body;
  function toggle(cls, key, force) {
    const on = body.classList.toggle(cls, force);
    store.set(key, on); syncButtons(); fit(); setTimeout(fitText, 30);
    return on;
  }
  function syncButtons() {
    $('#bPort').classList.toggle('on', body.classList.contains('portrait'));
    $('#bText').classList.toggle('on', !body.classList.contains('notext'));
    $('#legendBtn').setAttribute('aria-expanded', body.classList.contains('legend-open'));
  }
  function legend(force) { body.classList.toggle('legend-open', force); syncButtons(); }
  function rec(on) {
    body.classList.toggle('rec', on);
    if (on) { legend(false); closeMenu(); }
  }
  function openMenu() { $('#menuGrid').innerHTML = cards(); $('#menu').hidden = false; const b = $('#menu .tcard'); if (b) b.focus(); }
  function closeMenu() { $('#menu').hidden = true; }
  function full() {
    try {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => { });
      else document.exitFullscreen().catch(() => { });
    } catch (e) { }
  }

  /* ---------- eventos ---------- */
  document.addEventListener('keydown', e => {
    if (e.target.closest && e.target.closest('input,textarea')) return;
    const k = e.key;
    if (!$('#menu').hidden && k === 'Escape') { closeMenu(); return; }
    if (k === 'ArrowRight' || k === ' ' || k === 'PageDown' || k === 'Enter' && !e.target.closest('button')) { e.preventDefault(); next(); }
    else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'Backspace') { e.preventDefault(); prev(); }
    else if (k === 'ArrowDown') { e.preventDefault(); topicStep(1); }
    else if (k === 'ArrowUp') { e.preventDefault(); topicStep(-1); }
    else if (k === 'Home') go(-1, 0);
    else if (k === 'l' || k === 'L') legend();
    else if (k === 't' || k === 'T') toggle('notext', 'notext');
    else if (k === 'v' || k === 'V') toggle('portrait', 'portrait');
    else if (k === 'f' || k === 'F') full();
    else if (k === 'g' || k === 'G') rec(!body.classList.contains('rec'));
    else if (k === 'm' || k === 'M') ($('#menu').hidden ? openMenu() : closeMenu());
    else if (k === 'Escape') { rec(false); legend(false); }
  });
  $('#viewport').addEventListener('click', e => {
    if (e.target.closest('.interactive,a,button,.tcard')) return;
    if (ti < 0) return;
    const r = stage.getBoundingClientRect();
    if (e.clientX < r.left + r.width * 0.18) prev(); else next();
  });
  document.addEventListener('mouseup', e => { if (e.button === 3) { e.preventDefault(); prev(); } if (e.button === 4) { e.preventDefault(); next(); } });
  cover.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) go(+b.dataset.go, 0); });
  $('#menu').addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) { closeMenu(); go(+b.dataset.go, 0); } else if (e.target.id === 'menu') closeMenu(); });
  $('#bPrev').onclick = prev; $('#bNext').onclick = next;
  $('#bMenu').onclick = openMenu; $('#bFull').onclick = full;
  $('#bText').onclick = () => toggle('notext', 'notext');
  $('#bPort').onclick = () => toggle('portrait', 'portrait');
  $('#bRec').onclick = () => rec(true);
  $('#legendBtn').onclick = () => legend();
  document.querySelectorAll('#legend .tabs button').forEach(b => b.onclick = () => { legendTab = b.dataset.tab; renderLegend(); });

  // HUD some sozinho quando o mouse fica parado
  let idleT;
  function wake() { body.classList.remove('idle'); clearTimeout(idleT); idleT = setTimeout(() => body.classList.add('idle'), 2600); }
  document.addEventListener('mousemove', wake); document.addEventListener('keydown', wake); wake();

  /* ---------- início ---------- */
  if (store.get('portrait', false)) body.classList.add('portrait');
  if (store.get('notext', false)) body.classList.add('notext');
  syncButtons(); fit();
  function fromHash() {
    const m = /^#t(\d+)-e(\d+)$/.exec(location.hash);
    if (m) {
      const t = Math.min(T.length - 1, Math.max(0, +m[1] - 1));
      return go(t, Math.min(+m[2], T[t].steps.length), true);
    }
    go(-1, 0, true);
  }
  window.addEventListener('hashchange', fromHash);
  fromHash();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { fitText(); });
})();
