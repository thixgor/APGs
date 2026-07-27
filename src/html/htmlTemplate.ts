// Static CSS + JS for the interactive material export.
//
// buildStyles(theme) injects the brand palette into CSS custom properties and
// returns the full stylesheet (glassmorphism, subtle 3D, responsive layout,
// light/dark). RUNTIME_JS is the vanilla-JS behavior layer (TOC scrollspy +
// mobile drawer, answer-key accordion, reading progress, dark-mode toggle,
// per-question "answered" state persisted in localStorage, pointer tilt and
// scroll-reveal — all gated by prefers-reduced-motion).
//
// Everything here is inlined into the single self-contained .html file, so the
// material works offline with no external requests.

import type { ThemeSettings } from "../state/types";

/** Full stylesheet with the theme's colors baked into CSS variables. */
export function buildStyles(theme: ThemeSettings): string {
  const primary = theme.primary;
  const primaryDark = theme.primaryDark;
  const accent = theme.accent;
  return `
:root{
  --primary:${primary};
  --primary-dark:${primaryDark};
  --accent:${accent};
  --ink:#132019;
  --muted:#5a6b62;
  --bg1:#eaf4ee; --bg2:#dbeee3; --bg3:#f4faf6;
  --page:transparent;
  --glass:rgba(255,255,255,.55);
  --glass-strong:rgba(255,255,255,.72);
  --glass-border:rgba(255,255,255,.65);
  --glass-shadow:0 10px 40px rgba(11,43,32,.14);
  --card-radius:20px;
  --toc-w:290px;
  --hi:#fff3a0;
  --correct-bg:#e6f6ec; --correct-bd:#8fd3a8;
  --serif:'Tinos',Georgia,'Times New Roman',serif;
  --sans:'Montserrat',system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
}
[data-theme="dark"]{
  --ink:#e8f2ec;
  --muted:#9db1a6;
  --bg1:#08150f; --bg2:#0c2419; --bg3:#06110c;
  --glass:rgba(20,40,32,.55);
  --glass-strong:rgba(24,48,38,.72);
  --glass-border:rgba(140,190,165,.22);
  --glass-shadow:0 12px 46px rgba(0,0,0,.5);
  --hi:#5b5326;
  --correct-bg:rgba(45,106,79,.28); --correct-bd:#3f8f66;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{
  margin:0; color:var(--ink);
  font-family:var(--serif);
  font-size:clamp(15px,1.05vw,17px); line-height:1.62;
  background:linear-gradient(135deg,var(--bg1),var(--bg2) 55%,var(--bg3));
  background-attachment:fixed; min-height:100vh; overflow-x:hidden;
}
h1,h2,h3,h4,.toc,.brand,.btn,.kicker,.badge,.ex-num{font-family:var(--sans)}
a{color:var(--primary);text-underline-offset:2px}
[data-theme="dark"] a{color:var(--accent)}

/* Animated background orbs (cheaper blur; transform-only animation) */
.bg-orbs{position:fixed;inset:0;z-index:-1;overflow:hidden;pointer-events:none;contain:strict}
.bg-orbs span{position:absolute;border-radius:50%;filter:blur(46px);opacity:.45;will-change:transform;
  background:radial-gradient(circle at 30% 30%,var(--accent),transparent 70%);
  animation:float 22s ease-in-out infinite}
.bg-orbs span:nth-child(1){width:46vw;height:46vw;left:-10vw;top:-8vw}
.bg-orbs span:nth-child(2){width:38vw;height:38vw;right:-8vw;top:30vh;
  background:radial-gradient(circle at 30% 30%,var(--primary),transparent 70%);animation-delay:-6s}
.bg-orbs span:nth-child(3){width:30vw;height:30vw;left:20vw;bottom:-10vw;animation-delay:-11s}
@keyframes float{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(3vw,-4vh) scale(1.12)}}

/* Reading progress */
.progress{position:fixed;top:0;left:0;right:0;height:4px;z-index:60;background:transparent}
.progress>i{display:block;height:100%;width:0;
  background:linear-gradient(90deg,var(--accent),var(--primary));box-shadow:0 0 12px var(--accent)}

/* Top bar */
.topbar{position:sticky;top:0;z-index:50;display:flex;align-items:center;gap:14px;
  padding:12px clamp(14px,3vw,30px);
  background:var(--glass-strong);backdrop-filter:blur(16px) saturate(1.3);
  -webkit-backdrop-filter:blur(16px) saturate(1.3);
  border-bottom:1px solid var(--glass-border)}
.topbar .brand{display:flex;align-items:center;gap:11px;font-weight:700}
.topbar .brand img{height:34px;width:auto;border-radius:8px}
.topbar .brand .mark{width:34px;height:34px;border-radius:9px;display:grid;place-items:center;
  color:#fff;font-weight:800;background:linear-gradient(135deg,var(--primary),var(--accent))}
.topbar .brand small{display:block;font-family:var(--serif);font-weight:400;color:var(--muted);font-size:12px}
.spacer{flex:1}
.icon-btn{cursor:pointer;border:1px solid var(--glass-border);background:var(--glass);
  color:var(--ink);width:40px;height:40px;border-radius:12px;font-size:18px;display:grid;place-items:center;
  transition:transform .15s,box-shadow .15s}
.icon-btn:hover{transform:translateY(-2px);box-shadow:var(--glass-shadow)}
.menu-btn{display:none}

/* Layout */
.layout{display:grid;grid-template-columns:var(--toc-w) 1fr;gap:clamp(14px,3vw,34px);
  max-width:1280px;margin:0 auto;padding:clamp(16px,3vw,34px)}
.toc{position:sticky;top:80px;align-self:start;max-height:calc(100vh - 100px);overflow:auto;
  padding:18px;border-radius:var(--card-radius);
  background:var(--glass);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
  border:1px solid var(--glass-border);box-shadow:var(--glass-shadow)}
.toc h4{margin:0 0 10px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.toc a{display:block;text-decoration:none;color:var(--ink);padding:7px 10px;border-radius:10px;
  font-size:14px;line-height:1.35;transition:background .15s,color .15s;border-left:3px solid transparent}
.toc a:hover{background:var(--glass-strong)}
.toc a.lvl-apg{font-weight:700}
.toc a.lvl-1{padding-left:16px}
.toc a.lvl-2{padding-left:26px;font-size:13px;color:var(--muted)}
.toc a.lvl-3{padding-left:36px;font-size:12.5px;color:var(--muted)}
.toc a.active{background:linear-gradient(90deg,color-mix(in srgb,var(--accent) 22%,transparent),transparent);
  border-left-color:var(--accent);color:var(--primary);font-weight:700}
[data-theme="dark"] .toc a.active{color:var(--accent)}
.toc-backdrop{display:none}

/* Cards / sections */
.content{min-width:0}
.card{position:relative;padding:clamp(18px,3vw,34px);margin:0 0 26px;border-radius:var(--card-radius);
  background:var(--glass);backdrop-filter:blur(14px) saturate(1.2);-webkit-backdrop-filter:blur(14px) saturate(1.2);
  border:1px solid var(--glass-border);box-shadow:var(--glass-shadow);overflow:hidden}
.card::before{content:"";position:absolute;inset:0;pointer-events:none;border-radius:inherit;
  background:linear-gradient(120deg,rgba(255,255,255,.35),transparent 30%,transparent 70%,rgba(255,255,255,.18));
  mix-blend-mode:screen;opacity:.7}
.card>*{position:relative}
/* content-visibility lets the browser skip layout/paint for off-screen APGs —
   a big win on long notebooks. The intrinsic size avoids scrollbar jumps. */
.apg{scroll-margin-top:88px;content-visibility:auto;contain-intrinsic-size:auto 720px}
h2,h3{scroll-margin-top:88px}

/* Cover */
.cover{color:#fff;text-align:center;padding:clamp(34px,6vw,70px) clamp(20px,4vw,50px);
  background:linear-gradient(140deg,var(--primary-dark),var(--primary) 70%,var(--accent));
  border:1px solid rgba(255,255,255,.18)}
.cover::before{background:radial-gradient(circle at 70% 15%,rgba(255,255,255,.28),transparent 45%)}
.cover img{height:84px;margin-bottom:14px;filter:drop-shadow(0 8px 22px rgba(0,0,0,.35))}
.cover h1{font-size:clamp(28px,5vw,48px);margin:.2em 0 .1em;letter-spacing:-.01em;line-height:1.08}
.cover .sub{opacity:.9;font-size:clamp(15px,2vw,19px)}
.cover .chips{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:18px}
.cover .chips span{background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.3);
  padding:6px 13px;border-radius:999px;font-family:var(--sans);font-size:13px}

/* Headings inside content */
.apg-title{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;
  color:var(--primary);border-bottom:2px solid color-mix(in srgb,var(--accent) 45%,transparent);
  padding-bottom:10px;margin:0 0 18px;font-size:clamp(22px,3vw,30px)}
[data-theme="dark"] .apg-title{color:var(--accent)}
.apg-title .badge{font-size:13px;color:#fff;background:var(--primary);padding:4px 11px;border-radius:999px}
.section-h{font-family:var(--sans);font-weight:800;letter-spacing:.02em;color:var(--primary);
  margin:26px 0 10px;font-size:18px;display:flex;align-items:center;gap:9px}
[data-theme="dark"] .section-h{color:var(--accent)}
.section-h::before{content:"";width:7px;height:20px;border-radius:3px;background:linear-gradient(var(--accent),var(--primary))}
.h0{font-size:clamp(20px,2.6vw,26px);color:var(--primary);margin:24px 0 8px;
  padding:10px 14px;border-left:6px solid var(--accent);background:color-mix(in srgb,var(--accent) 10%,transparent);border-radius:0 12px 12px 0}
.h1{font-size:clamp(19px,2.4vw,23px);color:var(--primary);margin:20px 0 6px}
.h2{font-size:clamp(17px,2vw,19px);color:var(--ink);margin:16px 0 5px}
.h3{font-size:16px;color:var(--muted);margin:13px 0 4px;font-weight:700}
.h0 .num,.h1 .num,.h2 .num,.h3 .num{opacity:.7;margin-right:.4em}
[data-theme="dark"] .h1,[data-theme="dark"] .h0{color:var(--accent)}
p{margin:.5em 0}
.content ul,.content ol{margin:.4em 0 .6em;padding-left:1.4em}
.content li{margin:.25em 0}
figure{margin:16px 0;text-align:center}
figure img{max-width:100%;height:auto;border-radius:14px;box-shadow:var(--glass-shadow)}
figure.w-small img{max-width:min(46%,320px)}
figure.w-medium img{max-width:min(72%,560px)}
figcaption{color:var(--muted);font-size:13.5px;margin-top:7px;font-family:var(--sans)}
hr.rule{border:none;height:1px;background:linear-gradient(90deg,transparent,var(--glass-border),transparent);margin:22px 0}
.tbl-wrap{overflow-x:auto;margin:16px 0;border-radius:14px}
table{border-collapse:collapse;width:100%;font-size:14.5px;background:var(--glass-strong)}
caption{caption-side:top;text-align:left;font-family:var(--sans);font-weight:700;color:var(--primary);padding:6px 4px}
th,td{padding:9px 12px;border:1px solid var(--glass-border);text-align:left;vertical-align:top}
thead th{background:var(--primary);color:#fff;font-family:var(--sans)}
tbody tr:nth-child(even){background:color-mix(in srgb,var(--accent) 8%,transparent)}

/* Objectives */
.obj-geral{margin:14px 0;padding:14px 16px;border-radius:14px;
  background:color-mix(in srgb,var(--accent) 9%,transparent);border:1px solid var(--glass-border)}
.obj-geral .lbl{font-family:var(--sans);font-weight:800;color:var(--primary);font-size:13px;letter-spacing:.05em;text-transform:uppercase}
[data-theme="dark"] .obj-geral .lbl{color:var(--accent)}
.obj-geral .desc{font-weight:600;margin-top:3px}
.obj-esp{margin:10px 0 0 2px}
.obj-esp>li{margin:8px 0}
.obj-esp .esp-title{font-weight:700}

/* Exercises */
.ex{margin:16px 0;padding:16px 18px;border-radius:16px;border:1px solid var(--glass-border);
  background:var(--glass-strong)}
.ex.done{border-color:var(--correct-bd)}
.ex-head{display:flex;align-items:center;gap:10px;margin-bottom:8px;flex-wrap:wrap}
.ex-num{font-weight:800;color:#fff;background:var(--primary);border-radius:10px;padding:3px 11px;font-size:14px}
.ex-kind{font-family:var(--sans);font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}
.ex-done-toggle{margin-left:auto;font-family:var(--sans);font-size:13px;color:var(--muted);
  display:inline-flex;align-items:center;gap:6px;cursor:pointer;user-select:none}
.ex-statement{margin:4px 0 10px}
.opts{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.opts li{display:flex;gap:10px;padding:10px 13px;border-radius:12px;border:1px solid var(--glass-border);
  background:var(--glass);transition:background .2s,border-color .2s}
.opts .letter{font-family:var(--sans);font-weight:800;color:var(--primary);min-width:1.4em}
.ex.revealed .opts li.correct{background:var(--correct-bg);border-color:var(--correct-bd)}
.ex.revealed .opts li.correct .letter{color:var(--primary)}
.ex.revealed .opts li.correct::after{content:"✓";margin-left:auto;color:var(--primary);font-weight:800}
.reveal-btn{margin-top:12px;cursor:pointer;font-family:var(--sans);font-weight:700;font-size:14px;
  color:#fff;border:none;border-radius:12px;padding:10px 16px;
  background:linear-gradient(135deg,var(--primary),var(--accent));box-shadow:var(--glass-shadow);
  transition:transform .15s,box-shadow .15s}
.reveal-btn:hover{transform:translateY(-2px)}
.reveal-btn::before{content:"🔑 "}
.ex.revealed .reveal-btn::before{content:"🔒 "}
.answer-key{max-height:0;overflow:hidden;transition:max-height .45s ease;margin-top:0}
.ex.revealed .answer-key{max-height:2200px;margin-top:14px}
.answer-key .ak-inner{padding:14px 16px;border-radius:12px;border:1px solid var(--correct-bd);
  background:var(--correct-bg)}
.answer-key .ak-lbl{font-family:var(--sans);font-weight:800;color:var(--primary);font-size:13px;
  text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}
[data-theme="dark"] .answer-key .ak-lbl{color:var(--accent)}
.answer-key .ak-answer{font-weight:700;margin-bottom:8px}

/* Ads */
.ads{margin-top:30px}
.ads-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px}
.ad-solo{margin:24px 0;text-decoration:none;display:block}
.ad-solo .ad{padding-right:96px}
.ad{padding:18px;border-radius:16px;color:#fff;position:relative;overflow:hidden;
  content-visibility:auto;contain-intrinsic-size:auto 230px;
  background:linear-gradient(140deg,var(--primary-dark),var(--primary) 75%,var(--accent));
  border:1px solid rgba(255,255,255,.18)}
.ad .kicker{font-size:11px;letter-spacing:.12em;opacity:.85;text-transform:uppercase}
.ad h4{margin:6px 0;font-size:18px;line-height:1.2}
.ad p{font-size:13.5px;opacity:.92;margin:0 0 12px}
.ad .cta{display:inline-block;text-decoration:none;color:var(--primary-dark);background:#fff;
  font-family:var(--sans);font-weight:800;font-size:13.5px;padding:9px 15px;border-radius:11px}
.ad .qr{position:absolute;right:14px;bottom:14px;width:58px;height:58px;border-radius:8px;background:#fff;padding:4px}
.ad .url{display:block;font-size:11.5px;opacity:.8;margin-top:8px}

/* Preface */
.preface .lead{font-size:clamp(16px,1.7vw,20px);line-height:1.6}
.preface .creators{margin:16px 0;padding:14px 16px;border-radius:14px;border:1px solid var(--glass-border);
  background:color-mix(in srgb,var(--accent) 9%,transparent)}
.preface .creators .lbl{font-family:var(--sans);font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.preface .creators .names{font-family:var(--sans);font-weight:800;color:var(--primary);font-size:17px;margin-top:2px}
[data-theme="dark"] .preface .creators .names{color:var(--accent)}
.howto{display:grid;gap:12px;margin-top:14px}
.howto .step{display:flex;gap:13px;align-items:flex-start;padding:13px 15px;border-radius:14px;
  border:1px solid var(--glass-border);background:var(--glass)}
.howto .ic{flex:0 0 auto;width:38px;height:38px;border-radius:11px;display:grid;place-items:center;font-size:19px;
  color:#fff;background:linear-gradient(135deg,var(--primary),var(--accent))}
.howto .txt b{font-family:var(--sans);color:var(--primary)}
[data-theme="dark"] .howto .txt b{color:var(--accent)}

/* APGs hub (visual index) */
.hub-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px;margin-top:6px}
.hub-card{display:block;text-decoration:none;color:var(--ink);padding:16px 17px;border-radius:16px;
  border:1px solid var(--glass-border);background:var(--glass);box-shadow:var(--glass-shadow);
  transition:transform .18s,box-shadow .18s,border-color .18s}
.hub-card:hover{transform:translateY(-4px);border-color:var(--accent);box-shadow:0 16px 40px rgba(11,43,32,.2)}
.hub-card .n{display:inline-block;font-family:var(--sans);font-weight:800;color:#fff;background:var(--primary);
  border-radius:999px;padding:3px 11px;font-size:12.5px}
.hub-card h3{margin:9px 0 6px;font-size:17px;color:var(--primary);line-height:1.25}
[data-theme="dark"] .hub-card h3{color:var(--accent)}
.hub-card .meta{display:flex;gap:8px;flex-wrap:wrap;font-family:var(--sans);font-size:12px;color:var(--muted)}
.hub-card .meta span{background:color-mix(in srgb,var(--accent) 12%,transparent);padding:3px 9px;border-radius:999px}
.hub-card .go{margin-top:10px;font-family:var(--sans);font-weight:700;font-size:13px;color:var(--primary)}
[data-theme="dark"] .hub-card .go{color:var(--accent)}

/* Footer */
.foot{margin:34px 0 60px;text-align:center;color:var(--muted);font-size:12.5px;font-family:var(--sans);line-height:1.6}
.foot a{color:var(--primary)}

/* Motion — content is visible by default; only hidden once JS opts in (so a
   failed/blocked script or a stalled observer can never leave it invisible). */
html.js-anim .reveal-anim{opacity:0;transform:translateY(26px) scale(.99);transition:opacity .6s,transform .6s}
html.js-anim .reveal-anim.in{opacity:1;transform:none}
.tilt{transform-style:preserve-3d;transition:transform .25s ease}

/* Responsive: TOC becomes a slide-in drawer under 920px */
@media(max-width:920px){
  :root{--toc-w:0px}
  .menu-btn{display:grid}
  .layout{grid-template-columns:1fr}
  .toc{position:fixed;top:0;left:0;bottom:0;width:min(84vw,320px);max-height:100vh;z-index:70;
    border-radius:0 18px 18px 0;transform:translateX(-105%);transition:transform .3s ease}
  .toc.open{transform:none}
  .toc-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:65;opacity:0;pointer-events:none;transition:opacity .3s}
  .toc-backdrop.open{opacity:1;pointer-events:auto}
}
/* Performance on phones: backdrop-filter is the most expensive effect on
   mobile GPUs, so drop it (using more opaque panels for readability) and stop
   the orb animation. */
@media(max-width:640px){
  .card,.toc,.topbar,.ex,.opts li,.hub-card,.howto .step{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
  :root{--glass:rgba(255,255,255,.9);--glass-strong:rgba(255,255,255,.94)}
  [data-theme="dark"]{--glass:rgba(18,36,29,.92);--glass-strong:rgba(20,40,32,.95)}
  .bg-orbs span{animation:none;opacity:.32}
  .card::before{display:none}
}
@media(prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  .bg-orbs span{animation:none}
  html.js-anim .reveal-anim{opacity:1;transform:none;transition:none}
  .tilt{transition:none}
}
@media print{
  .topbar,.toc,.progress,.bg-orbs,.reveal-btn,.ex-done-toggle{display:none!important}
  .layout{grid-template-columns:1fr;padding:0}
  .answer-key{max-height:none!important}
  body{background:#fff}
}
`.trim();
}

/** Behavior layer, inlined verbatim into a <script> tag. */
export const RUNTIME_JS = String.raw`
(function(){
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mid = document.body.getAttribute('data-material-id') || 'material';
  var LS = 'da-answered:' + mid;

  // ---- Dark mode -----------------------------------------------------------
  var saved = null; try{ saved = localStorage.getItem('da-theme'); }catch(e){}
  var startDark = saved ? saved === 'dark'
    : matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(startDark);
  function setTheme(dark){
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    var b = document.getElementById('themeBtn');
    if(b) b.textContent = dark ? '☀️' : '🌙';
  }
  var tb = document.getElementById('themeBtn');
  if(tb) tb.addEventListener('click', function(){
    var dark = document.documentElement.getAttribute('data-theme') !== 'dark';
    setTheme(dark);
    try{ localStorage.setItem('da-theme', dark ? 'dark' : 'light'); }catch(e){}
  });

  // ---- Reading progress ----------------------------------------------------
  var bar = document.querySelector('.progress>i');
  function onScroll(){
    if(!bar) return;
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
  }
  addEventListener('scroll', onScroll, {passive:true}); onScroll();

  // ---- Mobile TOC drawer ---------------------------------------------------
  var toc = document.getElementById('toc');
  var back = document.querySelector('.toc-backdrop');
  var menu = document.getElementById('menuBtn');
  function drawer(open){ if(toc){toc.classList.toggle('open',open);} if(back){back.classList.toggle('open',open);} }
  if(menu) menu.addEventListener('click', function(){ drawer(!toc.classList.contains('open')); });
  if(back) back.addEventListener('click', function(){ drawer(false); });

  // ---- TOC scrollspy + close drawer on click -------------------------------
  var links = Array.prototype.slice.call(document.querySelectorAll('.toc a'));
  var map = {};
  links.forEach(function(a){
    map[a.getAttribute('href').slice(1)] = a;
    a.addEventListener('click', function(){ if(innerWidth <= 920) drawer(false); });
  });
  var targets = links.map(function(a){ return document.getElementById(a.getAttribute('href').slice(1)); }).filter(Boolean);
  if('IntersectionObserver' in window && targets.length){
    var spy = new IntersectionObserver(function(ents){
      ents.forEach(function(e){
        if(e.isIntersecting){
          links.forEach(function(l){ l.classList.remove('active'); });
          var a = map[e.target.id]; if(a) a.classList.add('active');
        }
      });
    }, {rootMargin:'-45% 0px -50% 0px', threshold:0});
    targets.forEach(function(t){ spy.observe(t); });
  }

  // ---- Answer-key accordion ------------------------------------------------
  document.querySelectorAll('.reveal-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      var ex = btn.closest('.ex');
      var open = ex.classList.toggle('revealed');
      btn.textContent = open ? 'Ocultar gabarito' : 'Ver gabarito comentado';
    });
  });

  // ---- Per-question "answered" state (persisted) ---------------------------
  var doneSet = {};
  try{ doneSet = JSON.parse(localStorage.getItem(LS) || '{}') || {}; }catch(e){ doneSet = {}; }
  function saveDone(){ try{ localStorage.setItem(LS, JSON.stringify(doneSet)); }catch(e){} }
  document.querySelectorAll('.ex').forEach(function(ex){
    var id = ex.getAttribute('data-qid');
    var cb = ex.querySelector('.ex-done-toggle input');
    if(!cb) return;
    if(doneSet[id]){ cb.checked = true; ex.classList.add('done'); }
    cb.addEventListener('change', function(){
      ex.classList.toggle('done', cb.checked);
      if(cb.checked) doneSet[id] = 1; else delete doneSet[id];
      saveDone();
    });
  });

  // ---- Scroll reveal -------------------------------------------------------
  var anim = Array.prototype.slice.call(document.querySelectorAll('.reveal-anim'));
  var revealAll = function(){ anim.forEach(function(el){ el.classList.add('in'); }); };
  if(reduce || !('IntersectionObserver' in window)){
    revealAll(); // no animation: just show everything
  } else {
    // Opt into the hidden-then-reveal effect only now that we can drive it.
    document.documentElement.classList.add('js-anim');
    var io = new IntersectionObserver(function(ents){
      ents.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    }, {rootMargin:'0px 0px -8% 0px', threshold:.08});
    anim.forEach(function(el){ io.observe(el); });
    // Safety net: if the observer never fires (throttled/background render),
    // reveal everything so content is never stuck invisible.
    setTimeout(revealAll, 2500);
  }

  // ---- Pointer tilt (3D) — rAF-throttled so pointermove never floods layout -
  if(!reduce && matchMedia('(pointer:fine)').matches){
    document.querySelectorAll('.tilt').forEach(function(el){
      var raf = 0, px = 0, py = 0;
      el.addEventListener('pointermove', function(ev){
        var r = el.getBoundingClientRect();
        px = (ev.clientX - r.left) / r.width - .5;
        py = (ev.clientY - r.top) / r.height - .5;
        if(raf) return;
        raf = requestAnimationFrame(function(){
          raf = 0;
          el.style.transform = 'perspective(900px) rotateX(' + (-py*4).toFixed(2) + 'deg) rotateY(' + (px*5).toFixed(2) + 'deg)';
        });
      }, {passive:true});
      el.addEventListener('pointerleave', function(){ if(raf){cancelAnimationFrame(raf);raf=0;} el.style.transform = ''; });
    });
  }
})();
`;
