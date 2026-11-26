// Dream Quest ad: every frame is drawn in code on a 1080x1920 canvas. draw(t) is a pure function of film time t.
// OP API (driven by tools/capture.mjs): ready, duration(), draw(t), frame(t,q), shots(), captions(), cues()
import * as A from './art.js';
const { W, H } = A;
const cv = document.getElementById('cv');
const MC = cv.getContext('2d');
let c = MC; A.setCtx(c);
const buf = document.createElement('canvas'); buf.width = W; buf.height = H;
const BC = buf.getContext('2d');
function use(ctx) { c = ctx; A.setCtx(ctx); }
const OP = (window.OP = { ready: false });
const { clamp, eo, eio, back, k, txt, rr } = A;

let L, WORDS, DUR;
const norm = (w) => w.toLowerCase().replace(/[^a-z0-9]/g, '');
const ls = (i) => L[i].start, le = (i) => L[i].end;
function Wd(word, line, nth = 0) {
  const m = WORDS.filter((w) => w.line === line && norm(w.w) === norm(word));
  if (!m.length) throw new Error(`word "${word}" not in line ${line}`);
  return m[Math.min(nth, m.length - 1)].s;
}

// ---------------- captions ----------------
let CAPS = [];
function buildCaptions() {
  // tokens with display text (merge "Four ninety-nine," into "$4.99,", "Kid safe" into "Kid-safe")
  const toks = [];
  for (let i = 0; i < WORDS.length; i++) {
    const w = WORDS[i];
    if (w.line === 19 && norm(w.w) === 'four') { const n = WORDS[i + 1]; toks.push({ txt: '$4.99,', s: w.s, e: n.e, line: w.line }); i++; continue; }
    if (w.line === 18 && norm(w.w) === 'kid') { const n = WORDS[i + 1]; toks.push({ txt: 'Kid-safe', s: w.s, e: n.e, line: w.line }); i++; continue; }
    toks.push({ txt: w.w.replace(/"/g, '“').replace(/^“(.*)“$/, '$1'), s: w.s, e: w.e, line: w.line });
  }
  // fix quote marks: opening " on 'I', closing on 'it.'
  for (const t of toks) { if (t.txt === '“I') t.txt = '“I'; if (t.txt === 'it.“') t.txt = 'it.”'; }
  const chunks = []; let cur = [];
  const flush = () => { if (cur.length) chunks.push(cur); cur = []; };
  for (const t of toks) {
    if (cur.length && (cur[0].line !== t.line || cur.length >= 3 || cur.map((x) => x.txt).join(' ').length + t.txt.length > 17)) flush();
    cur.push(t);
    if (/[.,?!:]["”]?$/.test(t.txt)) flush();
  }
  flush();
  CAPS = chunks.map((ws, i) => {
    const s = ws[0].s, last = ws[ws.length - 1].e, nx = chunks[i + 1] ? chunks[i + 1][0].s : DUR;
    return { words: ws, s, e: nx - last < 0.7 ? nx : last + 0.35, line: ws[0].line };
  });
}
function drawCaption(t) {
  const cp = CAPS.find((x) => t >= x.s && t < x.e);
  if (!cp || cp.line === 0) return; // line 0 is shown as the big word-synced hook title instead
  const lt = t - cp.s, pop = back(clamp(lt / 0.18));
  const size = 96, y = 1610;
  c.save();
  c.font = `700 ${size}px Fredoka`;
  const parts = cp.words.map((w) => w.txt), sp = size * 0.28;
  const widths = parts.map((p) => c.measureText(p).width), tot = widths.reduce((a, b) => a + b, 0) + sp * (parts.length - 1);
  const sc = Math.min(1, 980 / tot);
  c.translate(540, y); c.scale(sc * (0.85 + 0.15 * pop), sc * (0.85 + 0.15 * pop)); c.globalAlpha = clamp(lt / 0.08);
  let x = -tot / 2;
  c.textAlign = 'left'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  parts.forEach((p, j) => {
    const w = cp.words[j], on = t >= w.s - 0.03;
    const cur = t >= w.s - 0.03 && (j === parts.length - 1 || t < cp.words[j + 1].s - 0.03);
    c.save(); c.translate(x + widths[j] / 2, 0); if (cur) c.scale(1.06, 1.06); c.translate(-widths[j] / 2, 0);
    c.lineWidth = 20; c.strokeStyle = '#2a0f55'; c.strokeText(p, 0, 6);
    c.shadowColor = 'rgba(20,5,50,.55)'; c.shadowBlur = 18; c.shadowOffsetY = 8;
    c.strokeText(p, 0, 0); c.shadowColor = 'transparent';
    c.fillStyle = cur ? '#ffc93c' : on ? '#ffffff' : 'rgba(255,255,255,.88)'; c.fillText(p, 0, 0);
    c.restore();
    x += widths[j] + sp;
  });
  c.restore();
}

// ---------------- scenes ----------------
let SC = [];
function buildScenes() {
  const S = (id, at, fn, note, zoom = 0.04, cam = [540, 900]) => ({ id, at, fn, note, zoom, cam });
  SC = [
    S('hook', 0, A.sceneHook, 'grey evening homework, word-synced hook title', 0.05, [540, 1000]),
    S('turn', ls(2) - 0.05, A.sceneTurn, 'lantern lights on the tablet, colour floods in', 0.0),
    S('title', ls(3) - 0.25, A.sceneTitle, 'Dream Valley + Dream Quest title', 0.05, [540, 760]),
    S('hero', ls(5) - 0.25, A.sceneHero, 'parent sets up the hero name', 0.03),
    S('avatar', ls(6) - 0.2, A.sceneAvatar, 'avatar customizer dress-up', 0.03),
    S('buddy', ls(7) - 0.25, A.sceneBuddy, 'pick a buddy, Hoot hatches and cheers', 0.03),
    S('grow', ls(9) - 0.05, A.sceneGrow, 'Hatchling -> Explorer -> Guardian', 0.03),
    S('story', ls(10) - 0.3, A.sceneStory, 'bedtime Dream Book, Read to me, quiz, weekly shelf', 0.03),
    S('mission', ls(12) - 0.3, A.sceneMission, 'Daily Quest Counting Comets', 0.03),
    S('win', ls(13) - 0.12, A.sceneWin, 'Solved! orbs, Hoot dances, Dream Path', 0.03),
    S('owl', ls(15) - 0.3, A.sceneOwl, 'Wise Owl explains + grades homework', 0.03),
    S('parent', ls(17) - 0.3, A.sceneParent, 'Parent Zone, Weekly Report, kid-safe', 0.03),
    S('price', ls(19) - 0.3, A.scenePrice, '$4.99 once', 0.03),
    S('end', ls(20) - 0.3, A.sceneEnd, 'end card held', 0.025, [540, 820]),
  ];
}
const XF = 0.42; // crossfade length
function drawScene(i, t) {
  const sh = SC[i], end = i < SC.length - 1 ? SC[i + 1].at : DUR, d = end - sh.at, lt = t - sh.at;
  c.save();
  const z = 1 + sh.zoom * eio(clamp(lt / Math.max(d, 0.1)));
  c.translate(sh.cam[0], sh.cam[1]); c.scale(z, z); c.translate(-sh.cam[0], -sh.cam[1]);
  sh.fn(lt, d, t, G);
  c.restore();
}
function draw(t) {
  t = clamp(t, 0, DUR - 1e-4);
  use(MC);
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.filter = 'none';
  c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  let i = SC.length - 1; while (i > 0 && SC[i].at > t) i--;
  const lt = t - SC[i].at;
  if (i > 0 && lt < XF && SC[i].id !== 'title') {
    // draw previous scene (continuing in time), then the new one fading in on top
    drawScene(i - 1, t);
    use(BC); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.filter = 'none'; c.clearRect(0, 0, W, H);
    drawScene(i, t);
    use(MC); c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = eio(lt / XF); c.drawImage(buf, 0, 0); c.globalAlpha = 1;
  } else drawScene(i, t);
  drawCaption(t);
}

// globals handed to scenes
const G = {};
(async () => {
  try {
    await document.fonts.load('700 100px Fredoka'); await document.fonts.load('500 100px Fredoka'); await document.fonts.load('600 100px Fredoka');
    const lj = await (await fetch('data/lines.json', { cache: 'no-store' })).json();
    L = lj.lines; DUR = lj.duration;
    WORDS = await (await fetch('data/words.json', { cache: 'no-store' })).json();
    Object.assign(G, { L, WORDS, Wd, ls, le, DUR });
    A.init(G);
    buildCaptions(); buildScenes();
    OP.duration = () => DUR;
    OP.draw = draw;
    OP.frame = (t, q = 0.92) => { draw(t); return cv.toDataURL('image/jpeg', q); };
    OP.shots = () => SC.map((s, i) => ({ id: s.id, at: +s.at.toFixed(3), end: +(i < SC.length - 1 ? SC[i + 1].at : DUR).toFixed(3), note: s.note }));
    OP.captions = () => CAPS.map((cp) => ({ s: +cp.s.toFixed(3), e: +cp.e.toFixed(3), text: cp.words.map((w) => w.txt).join(' ') }));
    OP.cues = () => A.cues().sort((a, b) => a.t - b.t);
    OP.rig = (t0, t1, step) => { const out = []; A.RIG.on = true; for (let t = t0; t < t1; t += step) { A.RIG.rows = []; draw(t); out.push({ t: +t.toFixed(2), rows: A.RIG.rows }); } A.RIG.on = false; return out; };
    OP.ready = true;
    const q = new URLSearchParams(location.search);
    if (q.has('t')) draw(+q.get('t'));
  } catch (e) { OP.bootError = String((e && e.stack) || e); console.error(e); }
})();
