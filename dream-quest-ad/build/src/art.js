// Original vector art + character rigs for the Dream Quest ad. All drawn with canvas 2D.
export const W = 1080, H = 1920;
let c; export function setCtx(x) { c = x; }
let G; const CUES = [];
export const RIG = { on: false, rows: [] };
function rig(who, o, e, armA, armB) { if (RIG.on) RIG.rows.push({ who, bl: o.bl || 0, smile: e.smile, happy: e.happy || 0, open: (e.open || 0) + (o.talk || 0), brow: e.brow || 0, tilt: (o.tilt || 0) + (o.lean || 0), nod: o.nod || 0, gx: o.gx || 0, gy: o.gy || 0, arms: (armA || 0) + (armB || 0), y: o.bob || 0 }); }
export function cues() { return CUES.slice(); }

// ---------- math ----------
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const eo = (x) => 1 - Math.pow(1 - clamp(x), 3);
export const eio = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const back = (x) => { x = clamp(x); const s = 1.9; x -= 1; return x * x * ((s + 1) * x + s) + 1; };
export const k = (t, a, d) => clamp((t - a) / d);
const lerp = (a, b, x) => a + (b - a) * x;
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const smooth = (x) => x * x * (3 - 2 * x);
// piecewise-smooth noise in [-1,1]: new target every 1/rate s
function noise(t, seed, rate = 1) { const u = t * rate + seed * 13.7, i = Math.floor(u), f = smooth(u - i); return lerp(hash(i + seed * 7.1), hash(i + 1 + seed * 7.1), f) * 2 - 1; }
// saccade-style gaze: holds, then darts
function dart(t, seed, rate = 0.8) { const u = t * rate + seed * 3.3, i = Math.floor(u), f = clamp((u - i) / 0.12); return lerp(hash(i + seed), hash(i + 1 + seed), smooth(f)) * 2 - 1; }
// natural blinks: irregular intervals 2.2-4.6 s, 0.15 s long, occasional double blink
export function blink(t, seed = 0) {
  let acc = -seed * 1.37 % 3; let i = 0;
  while (acc < t + 5 && i < 200) {
    const p = 2.2 + hash(i * 3.1 + seed) * 2.4;
    const b0 = acc + p; const dt = t - b0;
    if (dt >= 0 && dt < 0.16) return Math.sin(Math.PI * dt / 0.16);
    if (hash(i + seed * 9) > 0.75) { const d2 = t - (b0 + 0.28); if (d2 >= 0 && d2 < 0.14) return Math.sin(Math.PI * d2 / 0.14); }
    acc = b0; i++;
  }
  return 0;
}
const wave = (t, f, ph = 0) => Math.sin(t * f * Math.PI * 2 + ph);

// ---------- drawing helpers ----------
export function rr(x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }
function circ(x, y, r, fill) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); if (fill) { c.fillStyle = fill; c.fill(); } }
function ell(x, y, rx, ry, rot, fill) { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, Math.PI * 2); if (fill) { c.fillStyle = fill; c.fill(); } }
export function txt(s, x, y, size, color, o = {}) {
  c.save();
  c.font = `${o.w || 700} ${size}px Fredoka`; c.textAlign = o.align || 'center'; c.textBaseline = o.base || 'middle';
  if (o.ls) c.letterSpacing = o.ls + 'px';
  let sc = 1; if (o.maxW) { const mw = c.measureText(s).width; if (mw > o.maxW) sc = o.maxW / mw; }
  c.translate(x, y); c.scale(sc, sc);
  if (o.shadow) { c.shadowColor = o.shadow; c.shadowBlur = o.blur ?? 20; c.shadowOffsetY = o.sy ?? 6; }
  if (o.stroke) { c.lineJoin = 'round'; c.lineWidth = o.sw || 12; c.strokeStyle = o.stroke; c.strokeText(s, 0, 0); c.shadowColor = 'transparent'; }
  if (o.drop) { c.fillStyle = o.drop; c.fillText(s, 0, o.dropY || 8); }
  c.fillStyle = color; c.fillText(s, 0, 0);
  c.restore();
}
const tw = (s, size, w = 700) => { c.save(); c.font = `${w} ${size}px Fredoka`; const m = c.measureText(s).width; c.restore(); return m; };
function card(x, y, w, h, o = {}) {
  c.save();
  c.shadowColor = o.shadowC || 'rgba(10,16,58,.35)'; c.shadowBlur = o.blur ?? 40; c.shadowOffsetY = o.sy ?? 16;
  rr(x, y, w, h, o.r ?? 44);
  if (o.grad) { const g = c.createLinearGradient(x, y, x + w, y + h); o.grad.forEach((cc, i) => g.addColorStop(i / (o.grad.length - 1), cc)); c.fillStyle = g; } else c.fillStyle = o.fill || '#fff';
  c.fill(); c.restore();
}
function pill(x, y, label, o = {}) {
  const size = o.size || 40, pad = o.pad || 26, w = tw(label, size, o.w || 700) + pad * 2 + (o.icon ? size * 1.1 : 0), h = size * 1.7;
  const x0 = o.align === 'left' ? x : x - w / 2;
  c.save(); if (o.shadow !== false) { c.shadowColor = 'rgba(10,16,58,.3)'; c.shadowBlur = 16; c.shadowOffsetY = 6; }
  rr(x0, y - h / 2, w, h, h / 2); c.fillStyle = o.bg || '#fff'; c.fill(); c.restore();
  if (o.icon) o.icon(x0 + pad + size * 0.45, y, size * 0.5);
  txt(label, x0 + w / 2 + (o.icon ? size * 0.55 : 0), y + size * 0.04, size, o.color || '#1c2452', { w: o.w || 700 });
  return w;
}
function check(x, y, r, col = '#fff') { c.save(); c.strokeStyle = col; c.lineWidth = r * 0.35; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(x - r * 0.6, y); c.lineTo(x - r * 0.15, y + r * 0.5); c.lineTo(x + r * 0.65, y - r * 0.5); c.stroke(); c.restore(); }
function cross(x, y, r, col = '#fff') { c.save(); c.strokeStyle = col; c.lineWidth = r * 0.32; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - r * .5, y - r * .5); c.lineTo(x + r * .5, y + r * .5); c.moveTo(x + r * .5, y - r * .5); c.lineTo(x - r * .5, y + r * .5); c.stroke(); c.restore(); }
export function star(x, y, r, fill, rot = 0, inner = 0.48) {
  c.beginPath();
  for (let i = 0; i < 10; i++) { const a = rot - Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r * inner : r; c.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); }
  c.closePath(); if (fill) { c.fillStyle = fill; c.fill(); }
}
function sparkle(x, y, r, col = '#fff', a = 1) {
  if (r <= 0 || a <= 0) return;
  c.save(); c.globalAlpha *= a; c.fillStyle = col; c.shadowColor = col; c.shadowBlur = r;
  c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.fill(); c.restore();
}
function glow(x, y, r, col, a = 1) {
  if (a <= 0) return;
  const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.save(); c.globalAlpha *= a; c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore();
}
function orb(x, y, r, a = 1) {
  c.save(); c.globalAlpha *= a;
  glow(x, y, r * 2.2, 'rgba(255,214,107,.7)');
  const g = c.createRadialGradient(x - r * .35, y - r * .4, r * .1, x, y, r); g.addColorStop(0, '#fffbe6'); g.addColorStop(0.45, '#ffd36b'); g.addColorStop(1, '#ff8ac9');
  circ(x, y, r, g); circ(x - r * .35, y - r * .4, r * .22, 'rgba(255,255,255,.9)'); c.restore();
}
function bubble(x, y, w, h, fill, tail = 'left', o = {}) {
  c.save(); c.shadowColor = 'rgba(10,16,58,.3)'; c.shadowBlur = 24; c.shadowOffsetY = 8;
  rr(x, y, w, h, 40); c.fillStyle = fill; c.fill();
  c.beginPath();
  if (tail === 'left') { c.moveTo(x + 50, y + h - 4); c.lineTo(x + 20, y + h + 40); c.lineTo(x + 110, y + h - 4); }
  else if (tail === 'right') { c.moveTo(x + w - 50, y + h - 4); c.lineTo(x + w - 20, y + h + 40); c.lineTo(x + w - 110, y + h - 4); }
  else if (tail === 'upleft') { c.moveTo(x + 60, y + 4); c.lineTo(x + 10, y - 44); c.lineTo(x + 130, y + 4); }
  c.fill(); c.restore();
}
function wrapText(s, x, y, size, color, maxW, lh = 1.25, o = {}) {
  c.save(); c.font = `${o.w || 600} ${size}px Fredoka`;
  const words = s.split(' '); const lines = []; let cur = '';
  for (const w of words) { const tst = cur ? cur + ' ' + w : w; if (c.measureText(tst).width > maxW && cur) { lines.push(cur); cur = w; } else cur = tst; }
  if (cur) lines.push(cur); c.restore();
  lines.forEach((ln, i) => txt(ln, x, y + i * size * lh, size, color, { w: o.w || 600, align: o.align || 'left' }));
  return lines.length;
}

// ---------- colours ----------
const SKIN = '#b8794f', SKIN_D = '#9a5f3a', HAIR = '#2b1b12', PSKIN = '#a96f48', PHAIR = '#3a2418';
const GOLD = '#ffc93c', GOLD2 = '#ffb000', INK = '#1c2452', GOOD = '#20b985', BLUE = '#49b6ff', CORAL = '#ff6b6b';

// ---------- background: Dream Valley ----------
let STARS = [], FIREFLIES = [];
function valley(t, o = {}) {
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#1d0c44'); g.addColorStop(0.45, '#6a2a9c'); g.addColorStop(0.78, '#e46fa6'); g.addColorStop(1, '#f6a0c0');
  c.fillStyle = g; c.fillRect(-60, -60, W + 120, H + 120);
  for (const s of STARS) { const a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * s.f + s.p)); if (s.big) sparkle(s.x, s.y, s.r * 3.2, '#fff', a); else { c.globalAlpha = a; circ(s.x, s.y, s.r, '#fff'); c.globalAlpha = 1; } }
  if (o.moon !== false) { glow(860, 260, 160, 'rgba(255,240,200,.35)'); circ(860, 260, 62, '#fff6d8'); circ(888, 244, 56, '#c6a0e6'); c.globalAlpha = 1; }
  // shooting star
  const sp = (t * 0.17) % 1; if (sp < 0.12) { const u = sp / 0.12, x = -100 + u * 900, y = 180 + u * 300; c.save(); c.globalAlpha = Math.sin(Math.PI * u); const gg = c.createLinearGradient(x - 160, y - 54, x, y); gg.addColorStop(0, 'rgba(255,255,255,0)'); gg.addColorStop(1, '#fff'); c.strokeStyle = gg; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - 160, y - 54); c.lineTo(x, y); c.stroke(); c.restore(); }
  // hills
  const hy = o.hillY ?? 1330;
  const hill = (y0, amp, ph, c1, c2) => {
    const gg = c.createLinearGradient(0, y0 - amp, 0, H); gg.addColorStop(0, c1); gg.addColorStop(1, c2); c.fillStyle = gg;
    c.beginPath(); c.moveTo(-60, H + 60); for (let x = -60; x <= W + 60; x += 20) c.lineTo(x, y0 - amp * Math.sin((x / W) * Math.PI * 1.3 + ph) - amp * 0.4 * Math.sin(x / 170 + ph * 2)); c.lineTo(W + 60, H + 60); c.fill();
  };
  hill(hy - 120, 70, 0.6, '#4a9a8a', '#2f6e6a');
  hill(hy - 20, 60, 2.2, '#5fc79a', '#3a9a72');
  hill(hy + 110, 40, 4.1, '#86e3b4', '#45b583');
  // tiny lantern lights on far hills
  for (let i = 0; i < 7; i++) { const x = 90 + i * 150 + hash(i) * 40, y = hy - 130 - 40 * Math.sin((x / W) * Math.PI * 1.3 + 0.6) + hash(i + 3) * 30; glow(x, y, 26, 'rgba(255,214,107,.8)', 0.6 + 0.4 * Math.sin(t * 2 + i)); circ(x, y, 5, '#ffe9a6'); }
  for (const f of FIREFLIES) { const x = f.x + 40 * Math.sin(t * f.f + f.p), y = f.y + 30 * Math.cos(t * f.f * 0.8 + f.p) - (t * 12) % 60; const a = 0.4 + 0.6 * Math.max(0, Math.sin(t * 2.3 + f.p)); glow(x, y, 22, 'rgba(255,220,120,.9)', a); circ(x, y, 4, '#fff3c2'); }
}
function dim(a, col = '10,4,30') { c.fillStyle = `rgba(${col},${a})`; c.fillRect(-60, -60, W + 120, H + 120); }
function vignette(a = 0.5) { const g = c.createRadialGradient(540, 900, 500, 540, 960, 1250); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`); c.fillStyle = g; c.fillRect(-60, -60, W + 120, H + 120); }

// ---------- the gold lantern ----------
export function lantern(x, y, s, lit = 1, t = 0) {
  c.save(); c.translate(x, y); c.scale(s, s);
  const fl = 1 + 0.06 * Math.sin(t * 9) + 0.04 * Math.sin(t * 13.7);
  if (lit > 0) { glow(0, 10, 330 * fl, 'rgba(255,201,60,.55)', lit); glow(0, 10, 140, 'rgba(255,240,180,.9)', lit); }
  c.strokeStyle = '#b77a00'; c.lineWidth = 12; c.beginPath(); c.arc(0, -120, 34, Math.PI, 0); c.stroke();
  c.fillStyle = '#c98a10'; c.beginPath(); c.moveTo(-70, -84); c.lineTo(70, -84); c.lineTo(46, -118); c.lineTo(-46, -118); c.fill();
  rr(-62, -88, 124, 16, 8); c.fillStyle = GOLD; c.fill();
  // glass
  const gg = c.createLinearGradient(0, -80, 0, 90); gg.addColorStop(0, lit > 0 ? '#fff3c4' : '#d9c79a'); gg.addColorStop(1, lit > 0 ? '#ffc93c' : '#a8915c');
  rr(-56, -78, 112, 160, 26); c.fillStyle = gg; c.globalAlpha = 0.95; c.fill(); c.globalAlpha = 1;
  // flame
  if (lit > 0) {
    c.save(); c.globalAlpha = lit; c.translate(0, 26); c.scale(fl, fl * (1 + 0.05 * Math.sin(t * 11)));
    const fg = c.createRadialGradient(0, 0, 2, 0, -10, 52); fg.addColorStop(0, '#ffffff'); fg.addColorStop(0.4, '#ffe27a'); fg.addColorStop(1, 'rgba(255,140,40,0)');
    c.fillStyle = fg; c.beginPath(); c.moveTo(0, -64); c.bezierCurveTo(34, -20, 34, 30, 0, 34); c.bezierCurveTo(-34, 30, -34, -20, 0, -64); c.fill(); c.restore();
  }
  c.strokeStyle = GOLD2; c.lineWidth = 9; [-56, 0, 56].forEach((bx) => { c.beginPath(); c.moveTo(bx, -78); c.lineTo(bx, 82); c.stroke(); });
  rr(-56, -78, 112, 160, 26); c.lineWidth = 10; c.strokeStyle = GOLD2; c.stroke();
  c.fillStyle = '#c98a10'; c.beginPath(); c.moveTo(-66, 82); c.lineTo(66, 82); c.lineTo(50, 112); c.lineTo(-50, 112); c.fill();
  rr(-70, 78, 140, 16, 8); c.fillStyle = GOLD; c.fill();
  c.restore();
}
function badge(x, y, r, t) { // gold lantern badge
  c.save(); glow(x, y, r * 2, 'rgba(255,201,60,.6)', 0.8 + 0.2 * Math.sin(t * 3));
  const g = c.createRadialGradient(x - r * .3, y - r * .35, r * .1, x, y, r); g.addColorStop(0, '#fff3c2'); g.addColorStop(0.6, GOLD); g.addColorStop(1, '#e09500');
  circ(x, y, r, g); c.lineWidth = r * 0.08; c.strokeStyle = 'rgba(255,255,255,.6)'; c.stroke();
  c.restore(); lantern(x, y + r * 0.05, r / 190, 0.0, t);
}

// ---------- characters ----------
// life(): shared "alive" layer -> blink, breathing, idle head sway, darting gaze
function life(t, seed) {
  return { bl: blink(t, seed), br: wave(t, 0.28, seed) * 0.5 + 0.5, sway: noise(t, seed, 0.35) * 0.05, gx: dart(t, seed, 0.7) * 0.35, gy: dart(t, seed + 5, 0.55) * 0.25, bob: wave(t, 0.4, seed) * 3 };
}
const lerpObj = (a, b, x) => { const o = { ...a }; for (const key in b) if (typeof b[key] === 'number' && typeof a[key] === 'number') o[key] = lerp(a[key], b[key], x); else if (x > 0.5) o[key] = b[key]; return o; };

// expression params: mouth: smile amount (-1 frown..1 big smile), open 0..1, brow: -1 sad/worried..+1 raised, eyeHappy 0..1 (closed arcs), eyeBig 0..1
const EXP = {
  sad: { smile: -0.7, open: 0, brow: -1, happy: 0, big: 0, lid: 0.35 },
  worried: { smile: -0.25, open: 0, brow: -0.8, happy: 0, big: 0, lid: 0.15 },
  neutral: { smile: 0.2, open: 0, brow: 0, happy: 0, big: 0, lid: 0 },
  warm: { smile: 0.75, open: 0.05, brow: 0.25, happy: 0.35, big: 0, lid: 0 },
  happy: { smile: 0.9, open: 0.25, brow: 0.35, happy: 0.1, big: 0.1, lid: 0 },
  wonder: { smile: 0.1, open: 0.55, brow: 0.9, happy: 0, big: 1, lid: 0 },
  excited: { smile: 1, open: 0.85, brow: 0.8, happy: 0.75, big: 0.2, lid: 0 },
  think: { smile: 0, open: 0, brow: 0.4, happy: 0, big: 0, lid: 0.1, asym: 1 },
  proud: { smile: 0.85, open: 0.15, brow: 0.3, happy: 0.75, big: 0, lid: 0 },
  concern: { smile: 0.05, open: 0, brow: -0.6, happy: 0, big: 0.3, lid: 0 },
  talk: { smile: 0.5, open: 0.1, brow: 0.6, happy: 0, big: 0.15, lid: 0 },
};
export function E(name, name2, x) { const a = EXP[name]; return name2 ? lerpObj(a, EXP[name2], clamp(x)) : { ...a }; }

function faceEyes(ex, ey, r, e, gx, gy, bl, col = '#1b1020', o = {}) {
  // eyes with pupils that follow gaze, lids that blink, "happy" arcs
  const close = clamp(Math.max(bl, e.lid || 0));
  for (const sx of [-1, 1]) {
    const x = ex * sx, y = ey;
    if (e.happy > 0.6 && bl < 0.5) {
      c.save(); c.strokeStyle = col; c.lineWidth = r * 0.42; c.lineCap = 'round';
      c.beginPath(); c.arc(x, y + r * 0.35, r * 0.85, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); c.restore();
      continue;
    }
    const rh = r * (1 + 0.25 * (e.big || 0)) * (1 - 0.92 * close), rw = r * 0.82 * (1 + 0.2 * (e.big || 0));
    if (close > 0.85) { c.save(); c.strokeStyle = col; c.lineWidth = r * 0.3; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - rw, y + r * 0.2); c.quadraticCurveTo(x, y + r * 0.55, x + rw, y + r * 0.2); c.stroke(); c.restore(); continue; }
    ell(x + gx * r * 0.25, y + gy * r * 0.25 + r * close * 0.4, rw, rh, 0, col);
    if (close < 0.6) { circ(x + gx * r * 0.25 - rw * 0.32, y + gy * r * 0.25 - rh * 0.35, r * 0.3, '#fff'); circ(x + gx * r * 0.25 + rw * 0.3, y + gy * r * 0.25 + rh * 0.3, r * 0.14, 'rgba(255,255,255,.8)'); }
  }
}
function mouth(x, y, w, e, col = '#5a1f1f', talk = 0) {
  const open = clamp((e.open || 0) + talk), sm = e.smile;
  c.save(); c.lineCap = 'round';
  if (open > 0.12) {
    c.beginPath(); c.moveTo(x - w, y - sm * w * 0.1); c.quadraticCurveTo(x, y + w * (0.35 + sm * 0.25) + open * w * 0.9, x + w, y - sm * w * 0.1);
    c.quadraticCurveTo(x, y + w * 0.15 * sm - open * w * 0.05, x - w, y - sm * w * 0.1); c.fillStyle = col; c.fill();
    c.save(); c.clip(); ell(x, y + w * 0.5 + open * w * 0.6, w * 0.55, w * 0.35, 0, '#ff7f8f'); c.restore();
  } else {
    c.strokeStyle = col; c.lineWidth = w * 0.22; c.beginPath(); c.moveTo(x - w * 0.8, y - sm * w * 0.15 * -1 * -1 - sm * w * 0.12);
    c.quadraticCurveTo(x, y + sm * w * 0.6, x + w * 0.8, y - sm * w * 0.12); c.stroke();
  }
  c.restore();
}
function brows(ex, ey, r, e, col, asym = 0) {
  c.save(); c.strokeStyle = col; c.lineWidth = r * 0.32; c.lineCap = 'round';
  for (const sx of [-1, 1]) {
    const b = e.brow + (asym && sx > 0 ? 0.5 : 0) * (e.asym || 0);
    const inner = -b * r * 0.5, outer = b * r * 0.15;
    c.beginPath(); c.moveTo(sx * (ex - r * 0.9), ey - r * 1.7 - b * r * 0.35 + inner * 0.3 * -1); c.lineTo(sx * (ex + r * 0.9), ey - r * 1.6 - b * r * 0.35 + outer);
    c.beginPath(); c.moveTo(sx * (ex - r * 0.85), ey - r * 1.75 - b * r * 0.45 - (b < 0 ? -b * r * 0.5 : 0)); c.quadraticCurveTo(sx * ex, ey - r * 2 - b * r * 0.45, sx * (ex + r * 0.9), ey - r * 1.65 - b * r * 0.3 + (b < 0 ? -b * r * 0.35 : 0)); c.stroke();
  }
  c.restore();
}
function arm(sx, sy, len, ang, wdt, col, handCol, bend = 0) {
  // ang 0 = straight down; positive swings outward (away from body side given by sign of sx)
  const side = Math.sign(sx) || 1;
  c.save(); c.translate(sx, sy); c.rotate(-ang * side);
  c.strokeStyle = col; c.lineWidth = wdt; c.lineCap = 'round';
  const ex = -bend * side * len * 0.5, ey = len * 0.55;
  c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(ex * 0.2, ey * 0.6, ex, ey); c.lineTo(ex * 0.6 + side * bend * len * 0.25, len); c.stroke();
  circ(ex * 0.6 + side * bend * len * 0.25, len, wdt * 0.62, handCol);
  c.restore();
}

// THE CHILD (same child all film). (x,y) = head centre. o: e (expression), gx, gy, bl, tilt, nod, armL, armR, bendL, bendR, outfit, legs, talk, seed, tear
export function kid(x, y, s, o = {}) {
  const e = o.e || EXP.neutral, outfit = o.outfit || 'hoodie';
  rig('kid', o, e, o.armL, o.armR);
  const OC = { hoodie: '#ff8a6b', tee: '#49b6ff', vest: '#3fae7a', cape: '#7b5cff', pajama: '#9fd0ff' }[outfit];
  c.save(); c.translate(x, y + (o.bob || 0)); c.scale(s, s);
  // cape behind
  if (outfit === 'cape') { c.fillStyle = '#e0457b'; c.beginPath(); c.moveTo(-95, 120); c.quadraticCurveTo(-170 + 12 * Math.sin((o.t || 0) * 4), 330, -150, 380); c.lineTo(150, 380); c.quadraticCurveTo(170 + 12 * Math.sin((o.t || 0) * 4 + 1), 330, 95, 120); c.fill(); }
  // legs
  if (o.legs) {
    const lk = o.legKick || 0;
    c.fillStyle = '#2f3b78'; rr(-70, 300, 60, 120 - lk * 20, 26); c.fill(); rr(10, 300, 60, 120 + 0, 26); c.fill();
    c.fillStyle = '#fff'; rr(-82, 400 - lk * 20, 80, 34, 17); c.fill(); rr(4, 400, 80, 34, 17); c.fill();
    c.fillStyle = CORAL; rr(-82, 414 - lk * 20, 80, 20, 10); c.fill(); rr(4, 414, 80, 20, 10); c.fill();
  }
  // arms behind torso
  const sh = 1 + 0.03 * (o.breath || 0);
  arm(-100, 150, 165, o.armL ?? 0.12, 50, OC, SKIN, o.bendL || 0);
  arm(100, 150, 165, o.armR ?? 0.12, 50, OC, SKIN, o.bendR || 0);
  // torso
  c.save(); c.scale(1, sh); c.translate(0, -(sh - 1) * 150);
  c.fillStyle = OC; c.beginPath(); c.moveTo(-105, 330); c.lineTo(-112, 170); c.quadraticCurveTo(-110, 115, -60, 108); c.lineTo(60, 108); c.quadraticCurveTo(110, 115, 112, 170); c.lineTo(105, 330); c.quadraticCurveTo(0, 345, -105, 330); c.fill();
  if (outfit === 'hoodie') { c.strokeStyle = '#e56e52'; c.lineWidth = 8; c.beginPath(); c.moveTo(-60, 250); c.quadraticCurveTo(0, 270, 60, 250); c.stroke(); c.fillStyle = '#fff'; circ(-22, 150, 6, '#fff'); circ(22, 150, 6, '#fff'); }
  if (outfit === 'vest') { c.fillStyle = '#f4e3c1'; rr(-34, 110, 68, 220, 10); c.fill(); c.fillStyle = '#2f7a55'; circ(-60, 210, 14); c.fill(); star(60, 190, 22, GOLD); }
  if (outfit === 'cape') { star(0, 200, 40, GOLD); }
  if (outfit === 'tee') { star(0, 210, 30, '#fff'); }
  if (outfit === 'pajama') { for (let i = 0; i < 5; i++) star(-60 + (i % 3) * 60, 160 + Math.floor(i / 3) * 80, 14, '#fff'); }
  c.restore();
  // head (tilt around neck)
  c.translate(0, 100); c.rotate(o.tilt || 0); c.translate(0, -100 + (o.nod || 0));
  circ(0, 92, 30, SKIN_D);
  // hair back puffs
  circ(-98, -70, 52, HAIR); circ(98, -70, 52, HAIR);
  circ(-100, 10, 20, SKIN); circ(100, 10, 20, SKIN); // ears
  circ(0, 0, 104, SKIN);
  // hair cap
  c.fillStyle = HAIR; c.beginPath(); c.arc(0, 0, 106, Math.PI * 1.05, Math.PI * 1.95); c.quadraticCurveTo(60, -55, 0, -62); c.quadraticCurveTo(-60, -50, -101, -32); c.fill();
  for (let i = 0; i < 7; i++) circ(-80 + i * 27, -78 - 14 * Math.sin(i * 1.3), 26, HAIR);
  if (o.clip) star(70, -70, 22, GOLD);
  // face
  const fx = (o.gx || 0) * 10, fy = (o.gy || 0) * 6; // face shifts slightly toward gaze (3/4 turn feel)
  c.translate(fx, fy);
  circ(-58, 40, 18, 'rgba(255,120,140,.35)'); circ(58, 40, 18, 'rgba(255,120,140,.35)');
  brows(38, 6, 9, e, HAIR, 1);
  faceEyes(38, 4, 17, e, o.gx || 0, o.gy || 0, o.bl || 0);
  mouth(0, 50, 26, e, '#5a1f1f', o.talk || 0);
  if (o.tear) { const ty = 20 + o.tear * 60; c.globalAlpha = clamp(1.4 - o.tear); c.fillStyle = '#9fd8ff'; c.beginPath(); c.moveTo(-46, ty - 14); c.quadraticCurveTo(-36, ty + 4, -46, ty + 8); c.quadraticCurveTo(-56, ty + 4, -46, ty - 14); c.fill(); c.globalAlpha = 1; }
  c.restore();
}
// THE PARENT
export function parent(x, y, s, o = {}) {
  const e = o.e || EXP.warm;
  rig('parent', o, e, o.armL, o.armR);
  c.save(); c.translate(x, y + (o.bob || 0)); c.scale(s, s);
  if (o.legs) { c.fillStyle = '#3b3f6b'; rr(-78, 380, 68, 200, 28); c.fill(); rr(10, 380, 68, 200, 28); c.fill(); c.fillStyle = '#2a2140'; rr(-90, 560, 88, 36, 18); c.fill(); rr(2, 560, 88, 36, 18); c.fill(); }
  arm(-110, 150, 220, o.armL ?? 0.1, 56, '#3a9e9b', PSKIN, o.bendL || 0);
  arm(110, 150, 220, o.armR ?? 0.1, 56, '#3a9e9b', PSKIN, o.bendR || 0);
  const sh = 1 + 0.025 * (o.breath || 0);
  c.save(); c.scale(1, sh);
  c.fillStyle = '#3a9e9b'; c.beginPath(); c.moveTo(-118, 400); c.lineTo(-124, 180); c.quadraticCurveTo(-120, 112, -64, 106); c.lineTo(64, 106); c.quadraticCurveTo(120, 112, 124, 180); c.lineTo(118, 400); c.quadraticCurveTo(0, 412, -118, 400); c.fill();
  c.fillStyle = '#fff1d6'; c.beginPath(); c.moveTo(-40, 108); c.lineTo(40, 108); c.lineTo(26, 400); c.lineTo(-26, 400); c.fill();
  c.restore();
  c.translate(0, 100); c.rotate(o.tilt || 0); c.translate(0, -100 + (o.nod || 0));
  circ(0, 90, 30, '#8f5a38');
  circ(0, -118, 50, PHAIR); // bun
  circ(-92, 12, 18, PSKIN); circ(92, 12, 18, PSKIN);
  ell(0, 0, 94, 102, 0, PSKIN);
  c.fillStyle = PHAIR; c.beginPath(); c.ellipse(0, -10, 100, 98, 0, Math.PI * 1.02, Math.PI * 1.98); c.quadraticCurveTo(40, -70, -10, -58); c.quadraticCurveTo(-70, -48, -98, -10); c.fill();
  c.beginPath(); c.moveTo(-98, -10); c.quadraticCurveTo(-112, 60, -90, 110); c.lineTo(-82, 20); c.fill();
  c.beginPath(); c.moveTo(98, -10); c.quadraticCurveTo(112, 60, 90, 110); c.lineTo(82, 20); c.fill();
  const fx = (o.gx || 0) * 9, fy = (o.gy || 0) * 5; c.translate(fx, fy);
  circ(-52, 42, 15, 'rgba(255,120,140,.3)'); circ(52, 42, 15, 'rgba(255,120,140,.3)');
  brows(34, 8, 8, e, PHAIR, 1);
  faceEyes(34, 6, 14, e, o.gx || 0, o.gy || 0, o.bl || 0, '#1b1020');
  mouth(0, 50, 24, e, '#6a2525', o.talk || 0);
  c.restore();
}
// HOOT the owl. (x,y) = body centre. stage: hatch | explorer | guardian. wings: angles (0 down, 1 up-cheer)
export function hoot(x, y, s, o = {}) {
  const e = o.e || EXP.happy, stg = o.stage || 'explorer', t = o.t || 0;
  rig('hoot', o, e, o.wingL, o.wingR);
  c.save(); c.translate(x, y + (o.bob || 0)); c.rotate(o.lean || 0); c.scale(s * (o.sqx || 1), s * (o.sqy || 1));
  if (stg === 'guardian') { glow(0, 0, 230, 'rgba(255,214,107,.55)'); c.fillStyle = '#ffb000'; c.beginPath(); c.moveTo(-70, -40); c.quadraticCurveTo(-150 + 10 * Math.sin(t * 5), 90, -120, 130); c.lineTo(120, 130); c.quadraticCurveTo(150 + 10 * Math.sin(t * 5 + 1), 90, 70, -40); c.fill(); }
  // feet
  c.fillStyle = '#ff9a3c'; ell(-34, 102, 24, 12, 0); c.fill(); ell(34, 102, 24, 12, 0); c.fill();
  // body
  const bg = c.createRadialGradient(-30, -50, 20, 0, 0, 120); bg.addColorStop(0, '#d39a6c'); bg.addColorStop(1, '#a8714a');
  ell(0, 0, 92, 104, 0, bg);
  ell(0, 34, 58, 64, 0, '#ffe7c2');
  c.strokeStyle = '#e8c497'; c.lineWidth = 5; for (let r = 0; r < 3; r++) for (let i = -1; i <= 1; i++) { c.beginPath(); c.arc(i * 26, 20 + r * 26, 10, 0.2, Math.PI - 0.2); c.stroke(); }
  // wings (in front, so flaps/cheers read clearly)
  for (const sd of [-1, 1]) {
    const a = (sd < 0 ? o.wingL : o.wingR) ?? 0.1;
    c.save(); c.translate(sd * 80, -2); c.rotate(-sd * (0.18 + a * 2.1)); ell(sd * 4, 50, 30, 64, 0, '#8c5c3a'); ell(sd * 2, 46, 18, 50, 0, '#a8714a'); c.restore();
  }
  // ear tufts
  c.save(); c.rotate(o.tilt || 0);
  c.fillStyle = '#a8714a';
  for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 40, -88); c.lineTo(sd * (78 + 8 * (e.brow || 0)), -130 - 10 * (e.brow || 0)); c.lineTo(sd * 82, -64); c.fill(); }
  // eye discs
  for (const sd of [-1, 1]) { circ(sd * 38, -34, 38, '#f3b24a'); circ(sd * 38, -34, 31, '#fff'); }
  // eyelids / pupils
  const gx = o.gx || 0, gy = o.gy || 0, bl = clamp(Math.max(o.bl || 0, e.lid || 0));
  for (const sd of [-1, 1]) {
    const ex = sd * 38, ey = -34;
    if (e.happy > 0.6 && (o.bl || 0) < 0.5) { c.save(); c.strokeStyle = '#2a1a10'; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.arc(ex, ey + 12, 18, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); c.restore(); continue; }
    const pr = 15 * (1 + 0.2 * (e.big || 0));
    circ(ex + gx * 11, ey + gy * 9, pr, '#2a1a10'); circ(ex + gx * 11 - 5, ey + gy * 9 - 6, 5.5, '#fff');
    if (bl > 0.02) { c.save(); circ(ex, ey, 31); c.clip(); c.fillStyle = '#b9835a'; c.fillRect(ex - 34, ey - 34, 68, 66 * bl); c.restore(); }
  }
  // brows (feather ridge)
  c.save(); c.strokeStyle = '#7a4f30'; c.lineWidth = 7; c.lineCap = 'round';
  for (const sd of [-1, 1]) { const b = e.brow || 0; c.beginPath(); c.moveTo(sd * 14, -74 - b * 8 + (b < 0 ? -b * 10 : 0)); c.quadraticCurveTo(sd * 38, -84 - b * 12, sd * 62, -74 - b * 4); c.stroke(); }
  c.restore();
  // beak (opens to "talk"/cheer)
  const op = clamp((e.open || 0) * 0.8 + (o.talk || 0));
  c.fillStyle = '#ff9a3c'; c.beginPath(); c.moveTo(-14, -12); c.lineTo(14, -12); c.lineTo(0, 10 - op * 4); c.fill();
  if (op > 0.05) { c.fillStyle = '#e0752a'; c.beginPath(); c.moveTo(-11, -4 + op * 6); c.lineTo(11, -4 + op * 6); c.lineTo(0, 12 + op * 14); c.fill(); }
  // stage extras
  if (stg === 'hatch') { c.fillStyle = '#fffaf0'; c.beginPath(); c.moveTo(-40, -86); for (let i = 0; i <= 6; i++) c.lineTo(-40 + i * 13.3, -96 - (i % 2 ? 16 : 0)); c.lineTo(42, -86); c.quadraticCurveTo(0, -70, -40, -86); c.fill(); }
  c.restore();
  if (stg === 'hatch') { c.fillStyle = '#fffaf0'; c.beginPath(); c.moveTo(-96, 30); for (let i = 0; i <= 8; i++) c.lineTo(-96 + i * 24, 30 - (i % 2 ? 22 : 0)); c.lineTo(96, 30); c.quadraticCurveTo(100, 130, 0, 132); c.quadraticCurveTo(-100, 130, -96, 30); c.fill(); c.strokeStyle = '#e6d9bf'; c.lineWidth = 4; c.stroke(); }
  if (stg === 'explorer') { c.fillStyle = BLUE; rr(-70, 40, 140, 26, 13); c.fill(); c.beginPath(); c.moveTo(40, 52); c.lineTo(74, 110 + 6 * Math.sin(t * 6)); c.lineTo(50, 112); c.fill(); }
  if (stg === 'guardian') { star(0, 40, 26, '#fff7d0'); c.strokeStyle = '#ffb000'; c.lineWidth = 4; star(0, 40, 26); c.stroke(); }
  c.restore();
}
// WISE OWL tutor: blue-violet, gold glasses, scholar cap
export function wiseOwl(x, y, s, o = {}) {
  const e = o.e || EXP.warm, t = o.t || 0;
  rig('wiseOwl', o, e, o.wingL, o.wingR);
  c.save(); c.translate(x, y + (o.bob || 0)); c.scale(s, s);
  c.fillStyle = '#ff9a3c'; ell(-40, 140, 30, 14); c.fill(); ell(40, 140, 30, 14); c.fill();
  c.rotate((o.tilt || 0) * 0.45 + (o.lean || 0));
  const bg = c.createRadialGradient(-40, -60, 20, 0, 0, 160); bg.addColorStop(0, '#8d86e8'); bg.addColorStop(1, '#5a52c0');
  ell(0, 10, 118, 138, 0, bg);
  ell(0, 54, 74, 82, 0, '#e4deff');
  c.strokeStyle = '#c7bff5'; c.lineWidth = 6; for (let r = 0; r < 3; r++) for (let i = -1; i <= 1; i++) { c.beginPath(); c.arc(i * 32, 36 + r * 32, 12, 0.2, Math.PI - 0.2); c.stroke(); }
  // wings in FRONT of the body so every gesture reads: L = explain / point up, R = wave / thumbs-up
  for (const sd of [-1, 1]) {
    const a = (sd < 0 ? o.wingL : o.wingR) ?? 0.1;
    c.save(); c.translate(sd * 96, -6); c.rotate(-sd * (0.12 + a * 2.3));
    ell(sd * 6, 70, 40, 96, 0, '#3f3896'); ell(sd * 2, 70, 26, 80, 0, '#554cc0');
    for (let i = 0; i < 3; i++) ell(sd * (i * 13 - 13) + sd * 6, 158 + (i === 1 ? 6 : 0), 13, 24, sd * (0.3 - i * 0.3), '#3f3896');
    c.restore();
  }
  c.save(); c.translate(0, 0); c.rotate(o.tilt || 0); c.translate(0, o.nod || 0);
  for (const sd of [-1, 1]) { circ(sd * 48, -40, 46, '#fff'); }
  const gx = o.gx || 0, gy = o.gy || 0, bl = clamp(Math.max(o.bl || 0, e.lid || 0));
  for (const sd of [-1, 1]) {
    const ex = sd * 48, ey = -40;
    if (e.happy > 0.6 && (o.bl || 0) < 0.5) { c.save(); c.strokeStyle = '#1e1640'; c.lineWidth = 10; c.lineCap = 'round'; c.beginPath(); c.arc(ex, ey + 14, 22, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); c.restore(); }
    else {
      circ(ex + gx * 14, ey + gy * 11, 19, '#1e1640'); circ(ex + gx * 14 - 6, ey + gy * 11 - 7, 7, '#fff');
      if (bl > 0.02) { c.save(); circ(ex, ey, 44); c.clip(); c.fillStyle = '#6f68d0'; c.fillRect(ex - 46, ey - 46, 92, 90 * bl); c.restore(); }
    }
    c.strokeStyle = GOLD2; c.lineWidth = 9; circ(ex, ey, 46); c.stroke();
  }
  c.strokeStyle = GOLD2; c.lineWidth = 8; c.beginPath(); c.moveTo(-6, -44); c.quadraticCurveTo(0, -52, 6, -44); c.stroke();
  // brows
  c.strokeStyle = '#3b3390'; c.lineWidth = 9; c.lineCap = 'round';
  for (const sd of [-1, 1]) { const b = e.brow || 0; c.beginPath(); c.moveTo(sd * 18, -98 - b * 10 + (b < 0 ? -b * 10 : 0)); c.quadraticCurveTo(sd * 48, -112 - b * 14, sd * 80, -96 - b * 6); c.stroke(); }
  // beak talk
  const op = clamp((e.open || 0) * 0.6 + (o.talk || 0));
  c.fillStyle = '#ff9a3c'; c.beginPath(); c.moveTo(-17, -10); c.lineTo(17, -10); c.lineTo(0, 16 - op * 6); c.fill();
  if (op > 0.05) { c.fillStyle = '#d9672a'; c.beginPath(); c.moveTo(-13, 0 + op * 6); c.lineTo(13, 0 + op * 6); c.lineTo(0, 16 + op * 18); c.fill(); }
  // scholar cap
  c.save(); c.translate(0, -128); c.rotate(-0.08 + (o.tilt || 0) * 0.3);
  c.fillStyle = '#2a2350'; rr(-60, -10, 120, 40, 12); c.fill();
  c.beginPath(); c.moveTo(-110, -14); c.lineTo(0, -54); c.lineTo(110, -14); c.lineTo(0, 24); c.fill();
  c.strokeStyle = GOLD; c.lineWidth = 6; c.beginPath(); c.moveTo(0, -16); c.quadraticCurveTo(70, -10, 84 + 6 * Math.sin(t * 3), 40); c.stroke(); circ(84 + 6 * Math.sin(t * 3), 46, 10, GOLD);
  c.restore();
  c.restore();
  c.restore();
}

// ---------- kitchen (hook + parent beat) ----------
function kitchen(t, o = {}) {
  const warm = o.warm || 0;
  c.fillStyle = '#cdb795'; c.fillRect(-60, -60, W + 120, H + 120);
  // wallpaper stripes
  c.fillStyle = 'rgba(255,255,255,.08)'; for (let x = -60; x < W + 60; x += 90) c.fillRect(x, -60, 40, 1400);
  // window (night)
  c.save(); rr(560, 300, 420, 520, 26); c.fillStyle = '#1b2350'; c.fill(); c.clip();
  for (let i = 0; i < 18; i++) { const x = 560 + hash(i) * 420, y = 300 + ((hash(i + 9) * 520 + t * 420 * (0.8 + hash(i + 4) * 0.4)) % 560); c.strokeStyle = 'rgba(180,200,255,.35)'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 6, y + 34); c.stroke(); }
  circ(860, 420, 40, 'rgba(230,230,255,.25)');
  c.restore();
  c.strokeStyle = '#efe4cf'; c.lineWidth = 18; rr(560, 300, 420, 520, 26); c.stroke(); c.beginPath(); c.moveTo(770, 300); c.lineTo(770, 820); c.moveTo(560, 560); c.lineTo(980, 560); c.stroke();
  // clock
  circ(250, 330, 92, '#f6efe2'); c.lineWidth = 12; c.strokeStyle = '#8a6a4a'; c.stroke();
  const mins = 47 + t / 60 * 6; c.save(); c.translate(250, 330); c.strokeStyle = '#3a2a1a'; c.lineCap = 'round';
  c.lineWidth = 10; c.save(); c.rotate((8 + mins / 60) / 12 * Math.PI * 2); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -45); c.stroke(); c.restore();
  c.lineWidth = 7; c.save(); c.rotate(mins / 60 * Math.PI * 2); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -68); c.stroke(); c.restore();
  c.lineWidth = 3; c.strokeStyle = CORAL; c.save(); c.rotate(Math.floor(t) / 60 * Math.PI * 2 + 2); c.beginPath(); c.moveTo(0, 12); c.lineTo(0, -74); c.stroke(); c.restore(); c.restore();
  // pendant lamp
  c.strokeStyle = '#4a3a2a'; c.lineWidth = 5; c.beginPath(); c.moveTo(430, -60); c.lineTo(430, 160); c.stroke();
  c.fillStyle = '#5a6a5a'; c.beginPath(); c.moveTo(350, 230); c.quadraticCurveTo(430, 120, 510, 230); c.fill();
  glow(430, 250, 520 + warm * 200, `rgba(255,${200 + warm * 20},${120},${0.35 + warm * 0.3})`);
  circ(430, 236, 20, '#fff2c0');
  if (o.drawing) { // kid's drawing on the wall (parent beat) — lantern + star
    c.save(); c.translate(150, 620); c.rotate(-0.06); rr(-80, -100, 160, 190, 8); c.fillStyle = '#fff'; c.fill(); lantern(0, 0, 0.42, 0.6, t); star(-48, -66, 16, GOLD); c.restore();
  }
}
function table(t, o = {}) {
  const ty = o.y || 1180;
  c.fillStyle = '#9a6a42'; c.fillRect(-60, ty, W + 120, 70); c.fillStyle = '#7a4f2e'; c.fillRect(-60, ty + 70, W + 120, H);
  c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(-60, ty, W + 120, 10);
}
function worksheet(x, y, rot, o = {}) {
  c.save(); c.translate(x, y); c.rotate(rot);
  c.fillStyle = '#fbf8ef'; c.shadowColor = 'rgba(0,0,0,.25)'; c.shadowBlur = 14; c.fillRect(-170, -110, 340, 220); c.shadowColor = 'transparent';
  c.strokeStyle = '#bcd0ee'; c.lineWidth = 3; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-150, -70 + i * 40); c.lineTo(150, -70 + i * 40); c.stroke(); }
  txt('7 + 5 =', -40, -40, 48, '#3a3a5a', { w: 600 });
  if (o.scribble) { c.strokeStyle = 'rgba(60,60,80,.55)'; c.lineWidth = 4; c.beginPath(); for (let i = 0; i < 9; i++) c.lineTo(70 + i * 7, -56 + (i % 2) * 26); c.stroke(); }
  if (o.solved) { txt('12', 90, -40, 52, GOOD, { w: 700 }); star(130, 50, 34, GOLD); }
  c.fillStyle = '#e8c0a8'; for (let i = 0; i < 6; i++) circ(-120 + hash(i) * 240, 60 + hash(i + 2) * 30, 4); // eraser crumbs
  c.restore();
}
function tablet(x, y, w, h, rot, glowA = 0) {
  c.save(); c.translate(x, y); c.rotate(rot);
  rr(-w / 2, -h / 2, w, h, 26); c.fillStyle = '#2a2440'; c.fill();
  rr(-w / 2 + 14, -h / 2 + 14, w - 28, h - 28, 16);
  const g = c.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, glowA > 0 ? '#3a1878' : '#262a3a'); g.addColorStop(1, glowA > 0 ? '#c95aa4' : '#1d2030');
  c.fillStyle = g; c.fill();
  if (glowA > 0) glow(0, 0, w * 0.6, 'rgba(255,201,60,.8)', glowA);
  c.restore();
}

// ---------- scenes ----------
// Each scene: (lt, d, t, G). All character performance is keyed to G.Wd(word, line) timings.
const tap = (t, at) => clamp(1 - Math.abs(t - at) / 0.25);
function cue(t, type, v = 1) { CUES.push({ t: +t.toFixed(3), type, v }); }

export function sceneHook(lt, d, t) {
  const { Wd, ls, le } = G;
  c.save(); c.filter = 'saturate(0.2) brightness(0.78) contrast(0.95)';
  kitchen(t);
  // parent standing behind, holding mug, worried; looks at child, sympathetic head tilt on "I can't do it"
  const lp = life(t, 2), lk = life(t, 7);
  const cant = Wd('can\'t', 1), sighs = Wd('sighs', 1), tears = Wd('tears', 1);
  const pTilt = -0.06 + lp.sway * 0.5 - 0.12 * eio(k(t, cant - 0.2, 0.6));
  parent(800, 600, 1.12, { e: E('worried', 'sad', k(t, cant, 0.6) * 0.5), bl: lp.bl, gx: -0.7 + lp.gx * 0.2, gy: 0.6, tilt: pTilt, nod: 6 * Math.sin(t * 0.9), armR: 0.15, armL: 0.55, bendL: 0.9, breath: lp.br, legs: false });
  // mug in parent's hand
  c.save(); c.translate(690, 900); rr(-34, -40, 68, 80, 12); c.fillStyle = '#e9e2d0'; c.fill(); c.restore();
  table(t, { y: 1180 });
  // child slumped at table: head low, eyes down at worksheet, sigh (shoulders rise/fall), tear, head shake on "can't"
  const sigh = Math.sin(Math.PI * k(t, sighs - 0.3, 1.1));
  const shake = Math.sin((t - cant) * 18) * 0.07 * clamp(1 - Math.abs(t - cant - 0.35) / 0.5);
  const slump = 40 + 30 * eio(k(t, 0, 2.5)) - 26 * sigh;
  kid(430, 820 + slump * 0.6, 1.05, { e: E('worried', 'sad', k(t, 1.2, 2)), bl: lk.bl, gx: 0.15 + lk.gx * 0.15, gy: 0.9, tilt: 0.14 + lk.sway * 0.5 + shake, nod: slump * 0.4, armL: 0.9, armR: 0.95, bendL: 1.2, bendR: 1.2, breath: sigh, tear: k(t, tears - 0.1, 1.6) > 0 && k(t, tears - 0.1, 1.6) < 1 ? k(t, tears - 0.1, 1.6) : 0 });
  worksheet(430, 1300, -0.04, { scribble: true });
  tablet(800, 1320, 260, 180, 0.12, 0);
  // pencil rolling
  c.save(); c.translate(230, 1290); c.rotate(0.5 + 0.05 * Math.sin(t)); c.fillStyle = '#ffcd4a'; c.fillRect(-90, -9, 180, 18); c.fillStyle = '#f7c7a0'; c.beginPath(); c.moveTo(90, -9); c.lineTo(120, 0); c.lineTo(90, 9); c.fill(); c.restore();
  c.restore(); c.filter = 'none';
  vignette(0.6);
  // HOOK TITLE: visible from frame 0, words light up as they are spoken
  const words = ['Homework', 'battles', 'every', 'night?'];
  const lines = [['Homework', 'battles'], ['every', 'night?']];
  const ws = G.WORDS.filter((w) => w.line === 0);
  let wi = 0;
  lines.forEach((ln, li) => {
    const size = 112, sp = 30, wds = ln.map((w) => tw(w, size)), tot = wds.reduce((a, b) => a + b, 0) + sp * (ln.length - 1);
    let x = 540 - tot / 2;
    ln.forEach((w, j) => {
      const wd = ws[wi++], on = t >= wd.s - 0.03, cur = on && t < wd.e + 0.15;
      const pop = on ? 1 + 0.08 * Math.sin(Math.PI * k(t, wd.s - 0.03, 0.25)) : 1;
      c.save(); c.translate(x + wds[j] / 2, 330 + li * 150); c.scale(pop, pop);
      txt(w, 0, 0, size, on ? (cur ? GOLD : '#fff') : 'rgba(255,255,255,.92)', { stroke: '#1a0c35', sw: 20, shadow: 'rgba(0,0,0,.6)', blur: 30, sy: 10 });
      c.restore(); x += wds[j] + sp;
    });
  });
  if (t < 0.02) { cue(0, 'tick'); }
}

export function sceneTurn(lt, d, t) {
  const { Wd } = G;
  const adv = Wd('adventure', 2);
  const sat = 0.2 + 0.8 * eio(k(lt, 0.4, 1.5));
  const reveal = eio(k(t, adv + 0.15, 0.95));
  const lx = 800, ly0 = 1290, ly = lerp(ly0, 760, eio(k(lt, 0.35, 1.2)));
  const lit = eio(k(lt, 0.1, 0.6));
  const lp = life(t, 2), lk = life(t, 7);
  c.save(); c.filter = `saturate(${sat}) brightness(${0.78 + 0.22 * sat})`;
  kitchen(t, { warm: sat - 0.2 });
  // parent turns to the light, surprised -> smiling
  parent(800, 600, 1.12, { e: E('worried', 'wonder', k(lt, 0.3, 0.6)), bl: lp.bl, gx: 0.1, gy: 0.9 - 1.4 * eio(k(lt, 0.4, 1)), tilt: -0.06 + 0.08 * eio(k(lt, 0.3, 0.8)), armL: 0.55, bendL: 0.9, breath: lp.br });
  c.save(); c.translate(690, 900); rr(-34, -40, 68, 80, 12); c.fillStyle = '#e9e2d0'; c.fill(); c.restore();
  table(t, { y: 1180 });
  // child lifts head, eyes widen, looks up at the lantern
  const up = eio(k(lt, 0.15, 0.8));
  kid(430, 844 - up * 60, 1.05, { e: E('sad', 'wonder', up), bl: lk.bl * (1 - up), gx: 0.2 + 0.6 * up, gy: 0.9 - 1.8 * up, tilt: 0.14 * (1 - up) - 0.08 * up, nod: 28 * (1 - up), armL: 0.9 - up * 0.6, armR: 0.95, bendL: 1.2, bendR: 1.2 });
  worksheet(430, 1300, -0.04, { scribble: true });
  tablet(800, 1320, 260, 180, 0.12, lit);
  c.restore(); c.filter = 'none';
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2 + lt * 0.8, r = 120 + 60 * Math.sin(lt * 3 + i); sparkle(lx + Math.cos(a) * r, ly + Math.sin(a) * r, 10 + 8 * hash(i), '#fff4c2', lit * (0.5 + 0.5 * Math.sin(lt * 6 + i))); }
  lantern(lx, ly, 0.75 + 0.15 * eio(k(lt, 0.3, 1)), lit, t);
  vignette(0.6 * (1 - sat) + 0.2);
  // colour floods in: Dream Valley grows out of the lantern
  if (reveal > 0) {
    c.save(); c.beginPath(); c.arc(lx, ly, reveal * 2300, 0, Math.PI * 2); c.clip();
    valley(t); lantern(lx, ly, 0.9, 1, t);
    c.restore();
  }
}
export function sceneTitle(lt, d, t) {
  const { Wd } = G;
  valley(t);
  const lp = life(t, 2), lk = life(t, 7), lh = life(t, 4);
  const ly = lerp(760, 470, eio(k(lt, 0, 1.2))), lx = lerp(800, 540, eio(k(lt, 0, 1.2)));
  lantern(lx, ly, lerp(0.9, 1.15, eio(k(lt, 0, 1.2))), 1, t);
  for (let i = 0; i < 10; i++) sparkle(540 + Math.cos(i * 0.63 + t) * 260, 470 + Math.sin(i * 0.63 + t) * 220, 9 + 6 * Math.sin(t * 3 + i), '#fff6cc', 0.8);
  // title
  const ti = back(k(lt, 0.2, 0.6));
  c.save(); c.translate(540, 840); c.scale(ti, ti);
  txt('Dream Quest', 0, 0, 150, GOLD, { drop: '#b36b00', dropY: 10, shadow: 'rgba(255,201,60,.7)', blur: 40, sy: 0 });
  c.restore();
  // tagline word-by-word on the voice
  const tg = ['Learning', 'that', 'grows', 'with', 'your', 'child.'];
  const ws = G.WORDS.filter((w) => w.line === 4); const size = 58; const sp = 16;
  const wds = tg.map((w) => tw(w, size, 600)); const tot = wds.reduce((a, b) => a + b, 0) + sp * 5; let x = 540 - tot / 2;
  tg.forEach((w, j) => { const a = eo(k(t, ws[j].s - 0.05, 0.3)); c.save(); c.globalAlpha = a; txt(w, x + wds[j] / 2, 1000 + 20 * (1 - a), size, '#fff', { w: 600, shadow: 'rgba(40,0,60,.6)', blur: 16 }); c.restore(); x += wds[j] + sp; });
  // family + Hoot on the hill: excited, looking up at the lantern
  const jump = Math.abs(Math.sin(Math.max(0, lt - 0.4) * 5.2)) * 30 * clamp(1 - (lt - 0.4) / 2.6) * (lt > 0.4 ? 1 : 0);
  parent(790, 1180, 0.6, { e: E('wonder', 'warm', k(lt, 0.6, 0.8)), bl: lp.bl, gx: -0.4, gy: -0.9 + 0.5 * k(lt, 1.8, 0.6), tilt: 0.08 + lp.sway, legs: true, armL: 0.5, bendL: 0.6, breath: lp.br });
  kid(330, 1240 - jump, 0.6, { e: E('wonder', 'excited', k(lt, 0.4, 0.4)), bl: lk.bl, gx: 0.4, gy: -1, tilt: -0.1 + lk.sway, legs: true, armL: 2.2 * eo(k(lt, 0.4, 0.3)), armR: 2.3 * eo(k(lt, 0.45, 0.3)), outfit: 'hoodie' });
  if (lt < 0.02) { cue(t, 'chime'); }
}

function appBg(t, a = 0.3) { valley(t, { moon: true }); dim(a); }
export function sceneHero(lt, d, t) {
  const { Wd } = G; appBg(t, 0.25);
  const lp = life(t, 2);
  const cin = back(k(lt, 0, 0.5));
  c.save(); c.translate(0, 80 * (1 - cin)); c.globalAlpha = clamp(cin);
  card(60, 230, 720, 1120, { r: 56 });
  badge(160, 330, 52, t);
  txt('Create your hero', 245, 330, 56, INK, { align: 'left' });
  txt('Set up by a parent', 245, 384, 34, '#626b98', { align: 'left', w: 500 });
  // avatar preview bubble (the same child)
  c.save(); circ(420, 600, 150); const pg = c.createRadialGradient(420, 560, 20, 420, 600, 160); pg.addColorStop(0, '#bfe9ff'); pg.addColorStop(1, '#3f6fd8'); c.fillStyle = pg; c.fill(); c.clip();
  const lk = life(t, 7);
  kid(420, 600, 0.82, { e: E('happy', 'excited', k(t, Wd('only', 5), 0.4)), bl: lk.bl, gx: lk.gx, gy: lk.gy * 0.5, tilt: lk.sway + 0.05 * Math.sin(t * 2) });
  c.restore();
  txt('Hero name', 120, 815, 40, INK, { align: 'left' });
  rr(110, 850, 620, 120, 30); c.fillStyle = '#f3f5ff'; c.fill(); c.lineWidth = 5; c.strokeStyle = BLUE; c.stroke();
  const name = 'Captain Sky', t0 = Wd('hero', 5, 0) - 0.1, n = clamp(Math.floor((t - t0) * 11), 0, name.length);
  txt(name.slice(0, n), 150, 912, 56, INK, { align: 'left' });
  if (Math.floor(t * 2.4) % 2 === 0 || (n > 0 && n < name.length)) { const cx = 150 + tw(name.slice(0, n), 56) + 6; c.fillStyle = BLUE; c.fillRect(cx, 880, 5, 64); }
  for (let i = 0; i < name.length; i++) if (lt < 0.02 || false) {} // (typing cues added in init)
  const ch = back(k(t, Wd('only', 5) - 0.5, 0.45));
  if (ch > 0) { c.save(); c.translate(420, 1050); c.scale(ch, ch); pill(0, 0, 'Hero names only', { bg: GOOD, color: '#fff', size: 44, icon: (x, y, r) => check(x, y, r) }); c.restore(); }
  const tg = eo(k(t, Wd('only', 5), 0.5));
  c.globalAlpha = clamp(cin) * tg;
  ['No real names', 'No birthdays', 'No photos'].forEach((s, i) => pill(170 + i * 250 - 40 + (i === 0 ? 30 : 0), 1160, s, { bg: '#f3f5ff', color: '#4f5683', size: 28, pad: 18, shadow: false }));
  c.globalAlpha = clamp(cin);
  rr(260, 1230, 320, 90, 30); c.fillStyle = GOLD; c.fill(); txt('Next  ›', 420, 1277, 46, '#4a3000');
  c.restore();
  // the parent, beside the card: warm, watching the screen, nods when the name is done
  const done = t0 + name.length / 11;
  const nodv = 14 * Math.sin(Math.PI * 2 * clamp((t - done) / 0.9)) * (t > done && t < done + 0.9 ? 1 : 0);
  parent(905, 1070, 0.78, { e: E('warm', 'proud', k(t, done, 0.5)), bl: lp.bl, gx: -0.9 + 0.3 * Math.sin(t * 0.7), gy: 0.3, tilt: 0.1 + lp.sway, nod: nodv, armL: 0.9, bendL: 1.1, breath: lp.br });
}
export function sceneAvatar(lt, d, t) {
  const { Wd } = G; appBg(t, 0.25);
  const cin = back(k(lt, 0, 0.5));
  c.save(); c.translate(0, 60 * (1 - cin)); c.globalAlpha = clamp(cin);
  card(70, 200, 940, 1220, { r: 56 });
  txt('Avatar Customizer', 540, 290, 62, INK);
  // preview stage
  c.save(); rr(120, 350, 840, 650, 40); const pg = c.createRadialGradient(540, 560, 40, 540, 680, 520); pg.addColorStop(0, '#bfe9ff'); pg.addColorStop(0.55, '#7ab8ff'); pg.addColorStop(1, '#3f6fd8'); c.fillStyle = pg; c.fill(); c.clip();
  ell(540, 960, 230, 40, 0, 'rgba(255,255,255,.35)');
  const sw1 = Wd('dress', 6), sw2 = Wd('avatar', 6);
  const outfit = t < sw1 ? 'tee' : t < sw2 ? 'vest' : 'cape';
  const hop = Math.max(Math.sin(Math.PI * k(t, sw1, 0.45)), Math.sin(Math.PI * k(t, sw2, 0.45)));
  const lk = life(t, 7);
  const gaze = Math.sin(t * 1.3) > 0.3 ? 0 : -0.5; // looks at self, then at viewer
  kid(540, 560 - hop * 50, 0.95, { t, e: E('happy', 'excited', hop + (t > sw2 ? 0.6 : 0)), bl: lk.bl, gx: gaze + lk.gx * 0.3, gy: 0.2 + lk.gy * 0.3, tilt: lk.sway + 0.12 * Math.sin(t * 2.2), legs: true, legKick: hop, outfit, clip: true, armL: 0.25 + hop * 1.8 + (t > sw2 ? 0.4 : 0), armR: 0.25 + hop * 1.9 + 0.2 * Math.sin(t * 4), breath: lk.br });
  for (const sw of [sw1, sw2]) { const a = k(t, sw, 0.7); if (a > 0 && a < 1) for (let i = 0; i < 12; i++) { const an = i / 12 * Math.PI * 2; sparkle(540 + Math.cos(an) * (120 + a * 220), 640 + Math.sin(an) * (120 + a * 220), 16, '#fff', 1 - a); } }
  c.restore();
  pill(540, 1040, 'Captain Sky', { bg: '#fff1c4', color: '#8a5a00', size: 40 });
  // tabs
  ['Hair', 'Outfit', 'Extras'].forEach((s, i) => { rr(150 + i * 270, 1100, 240, 70, 35); c.fillStyle = i === 1 ? GOLD : '#f3f5ff'; c.fill(); txt(s, 270 + i * 270, 1136, 38, i === 1 ? '#4a3000' : INK); });
  const items = [['Comfy Tee', 'tee', BLUE], ['Explorer Vest', 'vest', '#3fae7a'], ['Hero Cape', 'cape', '#7b5cff']];
  items.forEach(([n, id, col], i) => {
    const x = 120 + i * 290, y = 1200; rr(x, y, 260, 180, 30); c.fillStyle = id === outfit ? '#e8f6ff' : '#f3f5ff'; c.fill();
    if (id === outfit) { c.lineWidth = 7; c.strokeStyle = BLUE; c.stroke(); }
    c.fillStyle = col; rr(x + 95, y + 30, 70, 70, 16); c.fill(); if (id === 'cape') star(x + 130, y + 65, 20, GOLD);
    txt(n, x + 130, y + 140, 32, INK);
  });
  c.restore();
}
function buddyFace(x, y, r, kind, a = 1, t = 0) {
  c.save(); c.globalAlpha *= a;
  const bg = c.createRadialGradient(x, y, r * .2, x, y, r); bg.addColorStop(0, 'rgba(191,233,255,.95)'); bg.addColorStop(1, 'rgba(73,182,255,.35)');
  circ(x, y, r, bg);
  const col = { bee: '#ffd24a', kitten: '#ffb3d1', whale: '#6fb8ff', fox: '#ff9a4a', bunny: '#f4f0ff' }[kind];
  const bob = Math.sin(t * 3 + x) * 4;
  if (kind === 'egg') { ell(x, y + 8 + bob, r * 0.5, r * 0.64, 0, '#fffaf0'); for (let i = 0; i < 4; i++) circ(x - r * .2 + (i % 2) * r * .4, y - r * .1 + Math.floor(i / 2) * r * .4 + bob, r * .09, '#c9a37a'); }
  else {
    if (kind === 'fox' || kind === 'kitten') { c.fillStyle = col; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(x + s * r * .45, y - r * .2 + bob); c.lineTo(x + s * r * .5, y - r * .75 + bob); c.lineTo(x + s * r * .1, y - r * .4 + bob); c.fill(); } }
    if (kind === 'bunny') { for (const s of [-1, 1]) ell(x + s * r * .2, y - r * .6 + bob, r * .12, r * .35, s * .15, col); }
    circ(x, y + bob, r * .48, col);
    if (kind === 'bee') { c.fillStyle = '#3a2a1a'; c.fillRect(x - r * .45, y + r * .12 + bob, r * .9, r * .1); ell(x - r * .35, y - r * .45 + bob, r * .2, r * .13, -.5, 'rgba(255,255,255,.8)'); ell(x + r * .35, y - r * .45 + bob, r * .2, r * .13, .5, 'rgba(255,255,255,.8)'); }
    if (kind === 'whale') { ell(x + r * .5, y - r * .1 + bob, r * .15, r * .08, .5, col); }
    const bl = blink(t, x) > 0.5;
    for (const s of [-1, 1]) { if (bl) { c.fillStyle = '#2a1a2a'; c.fillRect(x + s * r * .17 - 6, y - r * .05 + bob, 12, 3); } else circ(x + s * r * .17, y - r * .05 + bob, r * .07, '#2a1a2a'); }
    c.strokeStyle = '#2a1a2a'; c.lineWidth = 3; c.beginPath(); c.arc(x, y + r * .08 + bob, r * .1, 0.2, Math.PI - 0.2); c.stroke();
  }
  c.restore();
}
export function sceneBuddy(lt, d, t) {
  const { Wd } = G; valley(t); dim(0.15);
  const pick = Wd('Hoot', 7), hatch = Wd('hatches', 8), cheer = Wd('cheers', 8);
  const lk = life(t, 7);
  const toC = eio(k(t, pick - 0.1, 0.8));
  txt('Pick your buddy', 540, 250, 76, '#fff', { stroke: '#2a0f55', sw: 14 });
  const pw = pill(540, 345, '30+ buddies', { bg: GOLD, color: '#4a3000', size: 40 });
  const kinds = ['egg', 'bee', 'kitten', 'whale', 'fox', 'bunny'];
  kinds.forEach((kd, i) => {
    const gx = 230 + (i % 3) * 310, gy = 560 + Math.floor(i / 3) * 330;
    const ap = back(k(lt, 0.1 + i * 0.08, 0.4));
    if (kd === 'egg') return;
    buddyFace(gx, gy, 130 * ap, kd, 1 - toC * 0.85, t);
  });
  // the owl egg: wobbles, then flies to centre and hatches
  const ex = lerp(230, 540, toC), ey = lerp(560, 860, toC), er = lerp(130, 260, toC);
  const ap = back(k(lt, 0.1, 0.4));
  if (t < hatch) {
    if (toC > 0) { c.save(); c.globalAlpha = toC; glow(ex, ey, er * 1.8, 'rgba(255,201,60,.6)'); c.restore(); }
    c.lineWidth = 10; c.strokeStyle = toC > 0 || t > pick - 0.3 ? GOLD : 'rgba(0,0,0,0)'; circ(ex, ey, er * ap + 8); c.stroke();
    const wob = Math.sin(t * 22) * 0.12 * k(t, pick + 0.5, 0.6);
    c.save(); c.translate(ex, ey); c.rotate(wob); c.translate(-ex, -ey); buddyFace(ex, ey, er * ap, 'egg', 1, 0); c.restore();
    if (t > hatch - 0.5) { c.strokeStyle = '#8a6a4a'; c.lineWidth = 5; c.beginPath(); c.moveTo(ex - 60, ey - 20); c.lineTo(ex - 20, ey + 10); c.lineTo(ex + 10, ey - 25); c.lineTo(ex + 50, ey + 5); c.stroke(); }
  } else {
    const hp = k(t, hatch, 0.35);
    // shell halves fly apart
    for (const s of [-1, 1]) { c.save(); c.globalAlpha = 1 - k(t, hatch + 0.2, 0.5); c.translate(ex + s * 140 * eo(hp), ey - 80 * Math.sin(Math.PI * hp) + 60 * hp); c.rotate(s * 0.9 * hp); ell(0, 0, 70, 90, 0, '#fffaf0'); c.restore(); }
    for (let i = 0; i < 16; i++) { const an = i / 16 * Math.PI * 2; sparkle(ex + Math.cos(an) * (80 + hp * 260), ey + Math.sin(an) * (80 + hp * 260), 18, i % 2 ? GOLD : '#fff', 1 - k(t, hatch, 0.8)); }
    // Hoot alive: pops, looks around, blinks, then CHEERS (jump, wings up, happy eyes)
    const lh = life(t, 4);
    const ch = k(t, cheer - 0.1, 0.25), cheering = t > cheer - 0.1;
    const jump = cheering ? Math.abs(Math.sin((t - cheer + 0.1) * 6.5)) * 70 : 0;
    const look = t < cheer - 0.1 ? Math.sin((t - hatch) * 4) * 0.8 : lh.gx;
    const sq = 1 + 0.12 * Math.sin(Math.PI * clamp(hp * 1.5));
    hoot(ex, ey + 30 - jump, 1.25 * back(hp), { t, stage: 'hatch', e: cheering ? E('excited') : E('wonder', 'happy', k(t, hatch + 0.4, 0.4)), bl: cheering ? 0 : lh.bl, gx: look, gy: lh.gy, tilt: cheering ? 0.12 * Math.sin(t * 6.5) : 0.15 * Math.sin((t - hatch) * 3), wingL: cheering ? 0.85 + 0.15 * Math.sin(t * 16) : 0.1, wingR: cheering ? 0.85 + 0.15 * Math.sin(t * 16 + 1) : 0.1, sqx: 2 - sq, sqy: sq });
    if (cheering) { const a = clamp(ch); c.save(); c.globalAlpha = a; bubble(ex + 120, ey - 330, 260, 110, '#fff', 'left'); txt('Yay!', ex + 250, ey - 275, 64, '#7a2f8c'); c.restore(); }
  }
  // the child, bottom-left: points at the owl egg, then cheers with Hoot
  const pointing = k(t, pick - 0.4, 0.3) * (1 - k(t, hatch, 0.3));
  const kc = t > cheer - 0.15;
  const kj = kc ? Math.abs(Math.sin((t - cheer) * 6.5)) * 30 : 0;
  kid(170, 1260 - kj, 0.62, { e: kc ? E('excited') : t > hatch ? E('wonder') : E('happy', 'think', 0.3), bl: kc ? 0 : lk.bl, gx: 0.6 + lk.gx * 0.2, gy: -0.6, tilt: -0.08 + lk.sway, legs: true, armR: kc ? 2.4 : 0.15 + pointing * 2.0, armL: kc ? 2.4 : 0.15, outfit: 'cape' });
}
export function sceneGrow(lt, d, t) {
  const { Wd } = G; valley(t); dim(0.12);
  txt('Grows with your child', 540, 300, 72, '#fff', { stroke: '#2a0f55', sw: 14 });
  const stages = [['Hatchling', 'hatch', 0.8, 'Day 1'], ['Explorer', 'explorer', 1.0, 'Day 3'], ['Guardian', 'guardian', 1.2, 'Day 7']];
  stages.forEach(([nm, stg, sc, day], i) => {
    const at = i === 0 ? G.ls(9) + 0.15 : Wd(nm, 9), ap = back(k(t, at - 0.15, 0.45)), x = 190 + i * 350, base = 1200;
    if (i > 0) { c.save(); c.globalAlpha = eo(k(t, at - 0.3, 0.3)); c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.moveTo(x - 195, 960); c.lineTo(x - 155, 985); c.lineTo(x - 195, 1010); c.fill(); c.restore(); }
    ell(x, base, 140, 34, 0, `rgba(255,255,255,${0.25 * ap})`);
    if (ap <= 0.01) return;
    const lh = life(t, 11 + i * 3);
    const hop = stg === 'explorer' ? Math.abs(Math.sin((t - at) * 4.2)) * 46 : 0; // "Explorer Hop"
    const rise = stg === 'guardian' ? 10 * Math.sin(t * 2) : 0;
    const lookNext = i < 2 && t > Wd(stages[i + 1][0], 9) - 0.2 ? 0.8 : 0; // glances at the next stage as it appears
    hoot(x, base - 104 * sc - hop - rise, sc * ap, { t, stage: stg, e: stg === 'guardian' ? E('proud') : stg === 'explorer' ? E('happy', 'excited', 0.4) : E('wonder', 'happy', k(t, at + 0.4, 0.4)), bl: lh.bl, gx: lookNext || lh.gx * 0.6, gy: lh.gy * 0.4, tilt: 0.1 * Math.sin(t * 1.7 + i), wingL: stg === 'explorer' ? 0.3 + 0.3 * Math.sin(t * 8.4) : stg === 'guardian' ? 0.55 : 0.1, wingR: stg === 'explorer' ? 0.3 + 0.3 * Math.sin(t * 8.4 + 1) : stg === 'guardian' ? 0.55 : 0.1, sqy: 1 + (stg === 'explorer' ? 0.06 * Math.cos((t - at) * 8.4) : 0), sqx: 1 - (stg === 'explorer' ? 0.06 * Math.cos((t - at) * 8.4) : 0) });
    c.save(); c.globalAlpha = clamp(ap); pill(x, base + 90, nm, { bg: i === 2 ? GOLD : '#fff', color: i === 2 ? '#4a3000' : INK, size: 42 }); txt(day, x, base + 165, 34, '#fff', { w: 600 }); c.restore();
  });
}
function bookCover(x, y, w, h, title, col, icon, t) {
  c.save(); c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 20; c.shadowOffsetY = 10; rr(x, y, w, h, 18); c.fillStyle = col; c.fill(); c.restore();
  c.fillStyle = 'rgba(0,0,0,.15)'; c.fillRect(x + w - 16, y + 6, 10, h - 12);
  icon(x + w / 2, y + h * 0.34);
  const n = wrapText(title, x + w / 2, y + h * 0.66, 30, '#fff', w - 30, 1.15, { w: 700, align: 'center' });
}
const ICON = {
  moon: (x, y) => { circ(x, y, 40, '#fff6d8'); circ(x + 18, y - 10, 36, '#5b3fb0'); },
  lantern: (x, y) => lantern(x, y, 0.3, 0.8, 0),
  seed: (x, y) => { ell(x, y + 24, 30, 18, 0, '#8a5a2a'); c.strokeStyle = '#4bd38a'; c.lineWidth = 8; c.beginPath(); c.moveTo(x, y + 14); c.lineTo(x, y - 24); c.stroke(); ell(x - 20, y - 30, 20, 11, -0.5, '#4bd38a'); ell(x + 20, y - 34, 20, 11, 0.5, '#4bd38a'); },
  wizard: (x, y) => { c.fillStyle = '#2a2350'; c.beginPath(); c.moveTo(x - 46, y + 34); c.lineTo(x, y - 50); c.lineTo(x + 46, y + 34); c.fill(); star(x + 4, y - 4, 14, GOLD); txt('1+2', x, y + 34, 22, '#fff'); },
};
export function sceneStory(lt, d, t) {
  const { Wd } = G;
  // bedroom at night
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2a1260'); g.addColorStop(1, '#5a2a8c'); c.fillStyle = g; c.fillRect(-60, -60, W + 120, H + 120);
  c.save(); rr(700, 180, 300, 360, 150); c.fillStyle = '#16093a'; c.fill(); c.clip(); for (const s of STARS.slice(0, 30)) circ(700 + (s.x % 300), 180 + (s.y % 360), s.r, '#fff'); circ(880, 280, 46, '#fff6d8'); c.restore();
  c.strokeStyle = '#efe4cf'; c.lineWidth = 14; rr(700, 180, 300, 360, 150); c.stroke();
  for (let i = 0; i < 9; i++) sparkle(60 + i * 120, 120 + 40 * Math.sin(i), 8, '#ffd86b', 0.4 + 0.4 * Math.sin(t * 2 + i));
  // bed
  c.fillStyle = '#7b4bb5'; rr(-40, 1180, 1160, 900, 60); c.fill();
  c.fillStyle = '#fff'; ell(270, 1130, 220, 90, 0); c.fill();
  const lk = life(t, 7), lh = life(t, 4);
  const read = Wd('reads', 10), quiz = Wd('quiz', 11), newS = Wd('new', 11);
  const right = quiz + 1.0, won = t > right;
  const listen = t > read - 0.3 && t < quiz;
  // child sits up in bed with the tablet: listening (gentle nods), then answers the quiz, then cheers
  const nodL = listen ? 8 * Math.sin(t * 3.2) : 0;
  const cheer = won ? Math.abs(Math.sin((t - right) * 6)) * clamp(1 - (t - right) / 1.6) : 0;
  kid(330, 1010 - cheer * 26, 0.85, { e: won ? (t < right + 1.4 ? E('excited') : E('happy')) : t > quiz ? E('think') : E('happy', 'warm', 0.5), bl: lk.bl, gx: t > quiz && !won ? 0.5 + 0.3 * Math.sin(t * 2.3) : 0.8, gy: t > quiz && !won ? -0.6 : -0.1, tilt: (t > quiz && !won ? -0.14 : 0.06) + lk.sway, nod: nodL, armL: 0.6 + cheer * 1.8, armR: 0.7 + cheer * 1.9, bendL: 0.7 * (1 - cheer), bendR: 0.7 * (1 - cheer), outfit: 'pajama', breath: lk.br });
  // blanket over lap
  c.fillStyle = '#ff8fb8'; c.beginPath(); c.moveTo(-40, 1260); c.quadraticCurveTo(300, 1180, 700, 1250); c.lineTo(1120, 1240); c.lineTo(1120, 2000); c.lineTo(-40, 2000); c.fill();
  c.fillStyle = 'rgba(255,255,255,.25)'; for (let i = 0; i < 8; i++) star(80 + i * 140, 1380 + (i % 2) * 70, 18, 'rgba(255,255,255,.35)');
  // Hoot snuggled on the pillow, also listening, cheering on the right answer
  const hj = won ? Math.abs(Math.sin((t - right) * 6.5)) * 30 * clamp(1 - (t - right) / 1.6) : 0;
  hoot(120, 1140 - hj, 0.5, { t, stage: 'explorer', e: won ? E('excited') : listen ? E('warm') : E('happy'), bl: lh.bl, gx: 0.7, gy: -0.2, tilt: 0.12 * Math.sin(t * 1.5), wingL: won ? 0.9 : 0.1, wingR: won ? 0.9 : 0.1 });
  // the Dream Book card (above, as the tablet screen)
  const cin = back(k(lt, 0.1, 0.5));
  c.save(); c.globalAlpha = clamp(cin); c.translate(0, 40 * (1 - cin));
  if (t < quiz - 0.15) {
    card(420, 600, 600, 560, { r: 44 });
    pill(720, 650, 'Dream Books', { bg: '#efe8ff', color: '#5b3fb0', size: 30, shadow: false });
    txt('Hoot and the', 720, 730, 48, INK); txt('Missing Moon', 720, 790, 52, INK);
    for (let i = 0; i < 4; i++) { rr(480, 850 + i * 46, 480 - (i === 3 ? 160 : 0), 20, 10); c.fillStyle = '#e3e7fb'; c.fill(); }
    const sw = clamp((t - read + 0.2) / 2.6) * 4; for (let i = 0; i < 4; i++) { const f = clamp(sw - i); if (f > 0) { rr(480, 850 + i * 46, (480 - (i === 3 ? 160 : 0)) * f, 20, 10); c.fillStyle = GOLD; c.fill(); } }
    const pulse = 1 + 0.05 * Math.sin(t * 7) * (listen ? 1 : 0);
    c.save(); c.translate(720, 1080); c.scale(pulse, pulse); rr(-200, -48, 400, 96, 48); c.fillStyle = BLUE; c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-150, -14); c.lineTo(-132, -14); c.lineTo(-110, -32); c.lineTo(-110, 32); c.lineTo(-132, 14); c.lineTo(-150, 14); c.fill();
    if (listen) { c.strokeStyle = '#fff'; c.lineWidth = 6; for (let i = 0; i < 2; i++) { c.globalAlpha = 0.5 + 0.5 * Math.sin(t * 8 - i); c.beginPath(); c.arc(-104, 0, 22 + i * 16, -0.8, 0.8); c.stroke(); } c.globalAlpha = 1; }
    txt('Read to me', 30, 2, 46, '#fff'); c.restore();
  } else if (t < newS - 0.2) {
    const qi = back(k(t, quiz - 0.15, 0.4));
    c.save(); c.translate(720, 880); c.scale(qi, qi); c.translate(-720, -880);
    card(420, 600, 600, 560, { r: 44 });
    pill(720, 660, 'Story quiz', { bg: '#fff1c4', color: '#8a5a00', size: 34, shadow: false });
    txt('What did Hoot lose?', 720, 760, 48, INK, { maxW: 540 });
    [['The moon', true], ['A hat', false]].forEach(([s, ok], i) => {
      const y = 850 + i * 140; const on = ok && won;
      rr(470, y, 500, 110, 30); c.fillStyle = on ? GOOD : '#f3f5ff'; c.fill(); txt(s, 720, y + 56, 46, on ? '#fff' : INK);
      if (on) check(910, y + 55, 30);
    });
    c.restore();
  } else {
    // weekly shelf
    const si = eo(k(t, newS - 0.2, 0.45));
    card(60, 200, 960, 560, { r: 44, grad: ['#fff7dc', '#ffe6f3'] });
    const books = [['Hoot and the Missing Moon', '#5b3fb0', ICON.moon], ['Lantern of Dream Valley', '#c0509c', ICON.lantern], ['Brave Little Seed', '#2f9a6a', ICON.seed], ['Math Wizard', '#3a6fd8', ICON.wizard]];
    books.forEach(([ti, col, ic], i) => { const a = back(k(t, newS - 0.3 + i * 0.06, 0.35)); c.save(); c.translate(160 + i * 253, 520); c.scale(a, a); bookCover(-105, -230, 210, 300, ti, col, ic, t); c.restore(); });
    const rb = back(k(t, Wd('week', 11) - 0.3, 0.4));
    c.save(); c.translate(540, 700); c.scale(rb, rb); pill(0, 0, 'New story every week', { bg: GOLD, color: '#4a3000', size: 42 }); c.restore();
  }
  c.restore();
}
function comets(t, a = 1) {
  for (let i = 0; i < 5; i++) {
    const u = ((t * 0.32 + i * 0.21) % 1), x = -150 + u * 1400, y = 200 + i * 220 + u * 160;
    c.save(); c.globalAlpha = a * Math.sin(Math.PI * u);
    const g = c.createLinearGradient(x - 220, y - 25, x, y); g.addColorStop(0, 'rgba(255,214,107,0)'); g.addColorStop(1, 'rgba(255,240,200,.9)');
    c.strokeStyle = g; c.lineWidth = 14; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - 220, y - 25); c.lineTo(x, y); c.stroke();
    glow(x, y, 50, 'rgba(255,214,107,.9)'); circ(x, y, 12, '#fff8dc'); c.restore();
  }
}
function questCard(t, prog, lvl) {
  card(60, 200, 960, 300, { r: 44, grad: ['#fff7dc', '#ffe6f3'] });
  pill(110, 255, 'Daily Quest', { align: 'left', bg: GOLD, color: '#4a3000', size: 32, shadow: false });
  txt('Counting Comets', 110, 335, 62, INK, { align: 'left' });
  txt('Solve 5 math puzzles', 110, 395, 38, '#4f5683', { align: 'left', w: 500 });
  rr(110, 435, 520, 26, 13); c.fillStyle = '#e3e7fb'; c.fill(); if (prog > 0) { rr(110, 435, 520 * prog / 5, 26, 13); const g = c.createLinearGradient(110, 0, 630, 0); g.addColorStop(0, GOLD); g.addColorStop(1, '#ff9d3c'); c.fillStyle = g; c.fill(); }
  txt(`${Math.floor(prog)}/5`, 690, 448, 36, INK);
  txt('Math level', 960, 290, 30, '#4f5683', { align: 'right', w: 600 });
  for (let i = 0; i < 6; i++) { rr(820 + i * 24, 320, 16, 34, 5); c.fillStyle = i < lvl ? CORAL : '#e3e7fb'; c.fill(); }
}
export function sceneMission(lt, d, t) {
  const { Wd } = G; valley(t, { moon: false }); dim(0.35); comets(t, 0.9);
  const lvlAt = Wd('level', 12);
  const cin = back(k(lt, 0, 0.5));
  c.save(); c.globalAlpha = clamp(cin); c.translate(0, -60 * (1 - cin));
  questCard(t, lerp(0, 4, eio(k(t, Wd('five', 12), 1.6))), 1 + (t > lvlAt ? 1 : 0));
  if (t > lvlAt && t < lvlAt + 0.6) glow(870, 337, 120, 'rgba(255,107,107,.6)', 1 - k(t, lvlAt, 0.6));
  c.restore();
  const pin = back(k(lt, 0.3, 0.5));
  c.save(); c.translate(540, 830); c.scale(pin, pin); c.translate(-540, -830);
  card(140, 560, 800, 560, { r: 44 });
  txt('7 + 5 = ?', 540, 700, 130, INK);
  const opts = ['10', '11', '12', '13'];
  opts.forEach((s, i) => { const x = 190 + (i % 2) * 360, y = 820 + Math.floor(i / 2) * 140; rr(x, y, 340, 116, 32); c.fillStyle = '#f3f5ff'; c.fill(); txt(s, x + 170, y + 60, 64, INK); });
  c.restore();
  missionCast(t, lt, null);
}
function missionCast(t, lt, win) {
  // child thinking (finger to chin, eyes searching) -> taps 12; Hoot encourages
  const { Wd } = G; const lk = life(t, 7), lh = life(t, 4);
  if (!win) {
    const think = Math.sin(t * 1.9);
    kid(180, 1300, 0.6, { e: E('think'), bl: lk.bl, gx: 0.5 + 0.4 * think, gy: -0.7 + 0.2 * Math.sin(t * 2.7), tilt: -0.12 + 0.06 * think, nod: 4 * Math.sin(t * 2), legs: true, armR: 2.6, bendR: 1.6, armL: 0.15, outfit: 'cape', breath: lk.br });
    hoot(900, 1440, 0.62, { t, stage: 'explorer', e: E('warm'), bl: lh.bl, gx: -0.8, gy: -0.3, tilt: 0.14 * Math.sin(t * 1.6), nod: 0, wingL: 0.3 + 0.2 * Math.sin(t * 3), wingR: 0.1 });
  }
}
export function sceneWin(lt, d, t) {
  const { Wd } = G; valley(t, { moon: false }); dim(0.3); comets(t, 0.5);
  const solved = Wd('Solved', 13), orbsAt = Wd('Orbs', 13), dance = Wd('dance', 14), path = Wd('Path', 14), hootAt = Wd('Hoot', 14);
  const lk = life(t, 7), lh = life(t, 4);
  // quest card -> Dream Path card
  const toPath = eio(k(t, path - 0.4, 0.5));
  c.save(); c.globalAlpha = 1 - toPath; questCard(t, 4 + eo(k(t, solved, 0.5)), 2); c.restore();
  if (toPath > 0) {
    c.save(); c.globalAlpha = toPath;
    card(60, 200, 960, 300, { r: 44, grad: ['#fff7dc', '#ffe6f3'] });
    txt('Dream Path', 110, 260, 52, INK, { align: 'left' }); txt('7-day streak', 960, 262, 36, '#8a5a00', { align: 'right', w: 600 });
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    c.strokeStyle = '#e3d6ff'; c.lineWidth = 12; c.beginPath(); c.moveTo(140, 400); for (let i = 0; i < 7; i++) c.lineTo(140 + i * 133, 400 + (i % 2 ? -26 : 0)); c.stroke();
    c.strokeStyle = GOLD; c.beginPath(); c.moveTo(140, 400); for (let i = 0; i < 5; i++) c.lineTo(140 + i * 133, 400 + (i % 2 ? -26 : 0)); c.stroke();
    days.forEach((dd, i) => { const x = 140 + i * 133, y = 400 + (i % 2 ? -26 : 0), lit = i < 5; const pop = i === 4 ? 1 + 0.12 * Math.sin(t * 6) : 1; if (i === 4) glow(x, y, 90, 'rgba(255,201,60,.8)'); circ(x, y, 40 * pop, lit ? GOLD : '#efe9ff'); txt(dd, x, y + 2, 34, lit ? '#4a3000' : '#8a86b0'); });
    c.restore();
  }
  // orb counter (top-right pill)
  const orbs = 120 + Math.round(50 * eo(k(t, orbsAt + 0.3, 0.9)));
  c.save(); c.globalAlpha = 1 - toPath * 0.0; const pw = 300; rr(1080 - pw - 40, 530, pw, 84, 42); c.fillStyle = '#fff'; c.fill(); orb(1080 - pw - 40 + 48, 572, 24); txt(`${orbs}`, 1080 - pw - 40 + 165, 574, 46, INK); txt('Orbs', 1080 - 40 - 62, 576, 30, '#4f5683', { w: 600 }); c.restore();
  // puzzle card: 12 turns green, "Solved!" stamp; then shrinks away for the dance
  const away = eio(k(t, hootAt - 0.3, 0.5));
  if (away < 1) {
    c.save(); c.globalAlpha = 1 - away; c.translate(540, 830); c.scale(1 - 0.3 * away, 1 - 0.3 * away); c.translate(-540, -830);
    card(140, 640, 800, 480, { r: 44 });
    txt('7 + 5 = 12', 540, 760, 110, GOOD);
    ['10', '11', '12', '13'].forEach((s, i) => { const x = 190 + (i % 2) * 360, y = 860 + Math.floor(i / 2) * 120; rr(x, y, 340, 100, 32); c.fillStyle = s === '12' ? GOOD : '#f3f5ff'; c.fill(); txt(s, x + 170, y + 52, 58, s === '12' ? '#fff' : INK); });
    const st = back(k(t, solved - 0.05, 0.35));
    c.save(); c.translate(540, 700); c.rotate(-0.12); c.scale(st, st); txt('Solved!', 0, -30, 130, GOLD, { stroke: '#7a2f8c', sw: 18, shadow: 'rgba(0,0,0,.4)' }); c.restore();
    c.restore();
  }
  // orbs fly from the puzzle into the counter
  for (let i = 0; i < 7; i++) { const u = k(t, orbsAt - 0.1 + i * 0.09, 0.7); if (u > 0 && u < 1) { const e = eio(u); orb(lerp(540 + (i - 3) * 60, 790, e), lerp(820, 572, e) - 160 * Math.sin(Math.PI * u), 26 * (1 - 0.4 * e)); } }
  // confetti
  for (let i = 0; i < 70; i++) { const u = t - solved; if (u < 0 || u > 4) continue; const x = 540 + (hash(i) - 0.5) * 1100 * eo(clamp(u * 1.5)) + Math.sin(u * 3 + i) * 30, y = 700 - 500 * hash(i + 3) * Math.max(0, 1 - u) + 900 * u * u * 0.25 + u * 200; c.save(); c.translate(x, y); c.rotate(u * 6 + i); c.fillStyle = [GOLD, CORAL, BLUE, GOOD, '#c38bff'][i % 5]; c.globalAlpha = clamp(4 - u); c.fillRect(-10, -6, 20, 12); c.restore(); }
  // Hoot's happy dance (centre): bounce, side-steps, spin-squash, flapping wings, closed happy eyes
  const dn = eo(k(t, hootAt - 0.2, 0.4));
  if (dn > 0) {
    const u = t - hootAt, beat = u * 2.3 * Math.PI * 2;
    const step = Math.sin(beat / 2) * 60, b = Math.abs(Math.sin(beat)) * 60, lean = Math.sin(beat / 2) * 0.2;
    hoot(540 + step, 1100 - b, 0.95 * dn, { t, stage: 'explorer', e: E('excited'), bl: 0, gx: 0, gy: 0, lean, tilt: -lean * 0.5, wingL: 0.6 + 0.4 * Math.sin(beat), wingR: 0.6 + 0.4 * Math.sin(beat + Math.PI), sqx: 1 + 0.08 * Math.cos(beat * 2), sqy: 1 - 0.08 * Math.cos(beat * 2) });
    for (let i = 0; i < 3; i++) sparkle(540 + step + Math.cos(t * 3 + i * 2) * 170, 1050 + Math.sin(t * 3 + i * 2) * 120, 18, '#fff', 0.8);
  }
  // the child: excited win (jumps, both arms up, big open smile), looks at Hoot dancing then at the Dream Path
  const cj = Math.abs(Math.sin((t - solved) * 6)) * 40 * clamp(1 - (t - solved) / 2.2) + (t > hootAt ? Math.abs(Math.sin((t - hootAt) * 2.3 * Math.PI * 2)) * 18 : 0);
  kid(180, 1300 - cj, 0.6, { e: t < solved ? E('think') : E('excited'), bl: t > solved ? 0 : lk.bl, gx: t > path ? 0.3 : 0.7, gy: t > path ? -1 : -0.3, tilt: 0.1 * Math.sin(t * 5), legs: true, armL: t > solved ? 2.5 + 0.2 * Math.sin(t * 10) : 0.15, armR: t > solved ? 2.5 + 0.2 * Math.sin(t * 10 + 1) : 2.6, bendR: t > solved ? 0 : 1.6, outfit: 'cape' });
  if (dn <= 0) hoot(900, 1440, 0.62, { t, stage: 'explorer', e: t > solved ? E('excited') : E('warm'), bl: lh.bl, gx: -0.8, gy: -0.3, wingL: t > solved ? 0.9 : 0.3, wingR: t > solved ? 0.9 : 0.1 });
}
export function sceneOwl(lt, d, t) {
  const { Wd } = G; valley(t); dim(0.2);
  const stuck = Wd('Stuck', 15), expl = Wd('explains', 15), pat = Wd('patiently', 15), kind = Wd('kind', 15), grades = Wd('grades', 16), starW = Wd('star', 16);
  const lo = life(t, 21), lk = life(t, 7);
  // explaining: beak moves while the explanation bubble types; wing gestures; nods on "patiently"; warm eyes
  const typing = t > expl - 0.2 && t < expl + 2.6;
  const talk = typing ? clamp(0.5 + 0.5 * Math.sin(t * 19) * Math.sin(t * 7.3)) * 0.8 : 0;
  const nodP = 14 * Math.sin(Math.PI * 2 * clamp((t - pat) / 0.9)) * (t > pat && t < pat + 0.9 ? 1 : 0);
  const point = t > expl && t < grades - 0.2 ? 0.75 + 0.1 * Math.sin(t * 2.5) : t > starW ? 0.95 : 0.15;
  const thumbs = t > starW;
  // emotional arc: kind concern at "Stuck?" -> engaged, eyebrows-up explaining -> warm smile (eyes close) at "kind teacher" -> proud on the stars
  const oe = t > starW ? E('proud') : t > kind - 0.1 && t < kind + 1.3 ? E('warm', 'proud', k(t, kind - 0.1, 0.3)) : t > expl - 0.2 ? E('talk', 'warm', k(t, expl + 2.4, 0.6)) : E('neutral', 'concern', k(t, stuck, 0.4));
  const gazeOwl = t < expl ? 0.8 : (Math.sin(t * 0.9) > 0.2 ? -0.2 : 0.8); // looks at the child, then at the viewer
  // gestures: hand-on-heart lean-in at "Stuck?", explaining wing beats on the stressed words, open-wing "you've got this", thumbs-up for the stars
  const beatG = t > expl && t < expl + 2.6 ? 0.18 * Math.abs(Math.sin((t - expl) * 5.2)) : 0;
  const lean = t > stuck - 0.1 && t < expl ? 0.12 * eo(k(t, stuck - 0.1, 0.4)) : t > kind && t < grades ? -0.05 : 0;
  const wR = thumbs ? 1.15 + 0.08 * Math.sin(t * 8) : t > kind && t < grades ? 0.75 : t > stuck && t < expl ? -0.5 * eo(k(t, stuck, 0.3)) : 0.15 + 0.08 * Math.sin(t * 2);
  wiseOwl(280, 620, 1.15, { t, e: oe, bl: lo.bl, gx: gazeOwl, gy: 0.5, tilt: 0.12 * Math.sin(t * 0.8) + (t > stuck && t < expl ? 0.22 : 0) - (t > starW ? 0.15 : 0), nod: nodP + 4 * Math.sin(t * 1.4), lean, wingL: point + beatG, wingR: wR, talk, bob: 6 * Math.sin(t * 1.6) - 18 * Math.sin(Math.PI * clamp((t - starW) / 0.5)) * (t > starW && t < starW + 0.5 ? 1 : 0) });
  // child: puzzled at "Stuck?", gradually understands -> smiles, nods
  const understand = eo(k(t, expl + 1.6, 1.2));
  kid(820, 1270, 0.68, { e: t < expl + 1.6 ? E('worried', 'think', k(t, stuck, 0.6)) : t > starW ? E('happy', 'excited', k(t, starW, 0.4)) : E('think', 'happy', understand), bl: lk.bl, gx: -0.9 + lk.gx * 0.2, gy: -0.6, tilt: (t < expl + 1.6 ? 0.18 : -0.05) + lk.sway, nod: understand > 0.5 && t < grades ? 10 * Math.sin(t * 6) * (1 - k(t, expl + 3, 0.8)) : 0, legs: true, armR: t < expl ? 2.5 : 0.2, bendR: t < expl ? 1.6 : 0, armL: t > starW ? 2.4 : 0.2, outfit: 'cape' });
  // chat bubbles -> homework feedback card
  const toCard = eio(k(t, grades - 0.3, 0.45));
  if (toCard < 1) {
    c.save(); c.globalAlpha = 1 - toCard;
    const kb = back(k(t, stuck - 0.2, 0.35));
    if (kb > 0) { c.save(); c.translate(780, 930); c.scale(kb, kb); bubble(-260, -70, 520, 140, '#e1f2ff', 'right'); txt('I’m stuck on 8 + 6…', 0, 0, 44, INK); c.restore(); }
    const ob = back(k(t, expl - 0.2, 0.35));
    if (ob > 0) {
      c.save(); c.translate(0, 30 * (1 - ob)); c.globalAlpha *= clamp(ob);
      bubble(470, 220, 560, 330, '#fff7dc', 'left');
      const full = 'Let’s go slowly. Make a ten first: 8 + 2 = 10, then 4 more. 14!';
      const n = Math.floor(clamp((t - expl) / 2.4) * full.length);
      wrapText(full.slice(0, n), 510, 280, 44, INK, 490, 1.25, { w: 600 });
      c.restore();
    }
    c.restore();
  }
  if (toCard > 0) {
    c.save(); c.globalAlpha = toCard; c.translate(0, 40 * (1 - toCard));
    card(470, 200, 560, 520, { r: 44 });
    txt('Homework check', 750, 270, 48, INK);
    [['3 + 4 = 7', true], ['9 + 2 = 11', true], ['8 + 6 = 13', false]].forEach(([s, ok], i) => { txt(s, 520, 350 + i * 70, 42, '#3a3a5a', { align: 'left', w: 600 }); circ(960, 350 + i * 70, 24, ok ? GOOD : '#ffb347'); ok ? check(960, 352 + i * 70, 18) : txt('?', 960, 352 + i * 70, 34, '#fff'); });
    for (let i = 0; i < 5; i++) { const a = back(k(t, starW - 0.15 + i * 0.13, 0.35)); c.save(); c.translate(600 + i * 75, 590); c.scale(a, a); star(0, 0, 34, i < 4 ? GOLD : '#e3e7fb'); c.restore(); }
    txt('Great work! Let’s fix one together.', 750, 670, 32, '#4f5683', { w: 600, maxW: 500 });
    c.restore();
  }
}
export function sceneParent(lt, d, t) {
  const { Wd } = G;
  const pin = Wd('PIN', 17), wk = Wd('weekly', 17), learned = Wd('learned', 17), noads = Wd('No', 18, 0), str = Wd('strangers', 18), safe = Wd('safe', 18);
  kitchen(t, { warm: 1, drawing: true });
  vignette(0.25);
  // phone UI (big inset)
  const cin = back(k(lt, 0.05, 0.5));
  c.save(); c.globalAlpha = clamp(cin); c.translate(0, 50 * (1 - cin));
  c.save(); c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = 50; c.shadowOffsetY = 20; rr(150, 150, 780, 1090, 70); c.fillStyle = '#1e1a30'; c.fill(); c.restore();
  c.save(); rr(172, 172, 736, 1046, 54); c.clip();
  const g = c.createLinearGradient(0, 172, 0, 1218); g.addColorStop(0, '#2a1260'); g.addColorStop(1, '#c0509c'); c.fillStyle = g; c.fillRect(172, 172, 736, 1046);
  if (t < wk - 0.2) {
    // Parent Zone lock: masked PIN dots only (no digits shown)
    txt('Parent Zone', 540, 360, 66, '#fff');
    c.save(); c.translate(540, 520); rr(-60, -30, 120, 100, 20); c.fillStyle = GOLD; c.fill(); c.strokeStyle = GOLD; c.lineWidth = 16; c.beginPath(); c.arc(0, -30, 40, Math.PI, 0); c.stroke(); circ(0, 15, 14, '#4a3000'); c.restore();
    txt('Enter parent PIN', 540, 680, 40, 'rgba(255,255,255,.85)', { w: 500 });
    for (let i = 0; i < 4; i++) { const f = t > pin - 0.3 + i * 0.18; circ(390 + i * 100, 780, 24, f ? '#fff' : 'rgba(0,0,0,0)'); c.lineWidth = 5; c.strokeStyle = '#fff'; circ(390 + i * 100, 780, 24); c.stroke(); }
    for (let i = 0; i < 9; i++) { rr(300 + (i % 3) * 170, 860 + Math.floor(i / 3) * 110, 140, 90, 24); c.fillStyle = 'rgba(255,255,255,.14)'; c.fill(); }
  } else {
    const ri = eo(k(t, wk - 0.2, 0.4));
    c.save(); c.globalAlpha *= ri;
    txt('Weekly Report', 540, 260, 62, '#fff');
    pill(540, 335, 'Captain Sky', { bg: '#fff1c4', color: '#8a5a00', size: 32, shadow: false });
    const stats = [['Stories read', '4'], ['Missions done', '12'], ['Minutes played', '95'], ['Dream Orbs', '240'], ['Skills mastered', '3']];
    stats.forEach(([lab, v], i) => { const x = 200 + (i % 2) * 345, y = 400 + Math.floor(i / 2) * 140, a = back(k(t, wk + i * 0.12, 0.35)); c.save(); c.translate(x + 162, y + 60); c.scale(a, a); rr(-162, -60, 325, 122, 26); c.fillStyle = '#fff'; c.fill(); txt(v, 0, -16, 54, INK); txt(lab, 0, 36, 28, '#4f5683', { w: 600 }); c.restore(); });
    const la = eo(k(t, learned - 0.4, 0.4));
    c.save(); c.globalAlpha *= la; rr(200, 830, 680, 330, 30); c.fillStyle = '#fff7dc'; c.fill();
    txt('What your child learned this week', 540, 880, 34, '#8a5a00', { maxW: 640 });
    ['Adding numbers to 20', 'Five new spelling words', 'Why the moon changes shape'].forEach((s, i) => { circ(250, 950 + i * 66, 10, GOOD); txt(s, 280, 952 + i * 66, 36, INK, { align: 'left', w: 600 }); });
    c.restore(); c.restore();
  }
  c.restore(); c.restore();
  // trust badges
  [['No ads', noads], ['No strangers', str], ['Kid-safe by design', safe]].forEach(([s, at], i) => { const a = back(k(t, at - 0.1, 0.35)); if (a <= 0) return; c.save(); c.translate(540, 1300 + i * 0 - 0); c.restore(); });
  const bx = [[260, 1290, 'No ads', noads], [760, 1290, 'No strangers', str], [540, 1400, 'Kid-safe by design', safe]];
  // parent at the table with the phone: warm smile reading, nods, then looks up at the viewer on the trust lines
  table(t, { y: 1480 });
  const lp = life(t, 2);
  const lookUp = t > noads - 0.2;
  const nodv = 10 * Math.sin((t - learned) * 5) * (t > learned && t < learned + 1.2 ? 1 : 0) + (lookUp ? 8 * Math.sin(Math.PI * 2 * clamp((t - safe) / 0.8)) * (t > safe && t < safe + 0.8 ? 1 : 0) : 0);
  parent(540, 1340, 0.62, { e: t > wk ? E('warm', 'proud', k(t, learned, 0.6)) : E('warm'), bl: lp.bl, gx: lookUp ? lp.gx * 0.3 : 0.1, gy: lookUp ? 0 : 0.9, tilt: 0.1 * Math.sin(t * 0.6) + lp.sway, nod: nodv, armL: 0.6, armR: 0.6, bendL: 1.3, bendR: 1.3, breath: lp.br });
  c.save(); c.translate(540, 1500); rr(-70, -40, 140, 80, 14); c.fillStyle = '#1e1a30'; c.fill(); c.restore();
  bx.forEach(([x, y, s, at]) => { const a = back(k(t, at - 0.1, 0.35)); if (a <= 0) return; c.save(); c.translate(x, y); c.scale(a, a); pill(0, 0, s, { bg: '#fff', color: INK, size: 44, icon: (ix, iy, r) => { circ(ix, iy, r * 1.1, GOOD); check(ix, iy, r * 0.8); } }); c.restore(); });
}
export function scenePrice(lt, d, t) {
  const { Wd } = G; valley(t);
  const four = Wd('Four', 19), once = Wd('once', 19), sub = Wd('subscription', 19), ads = Wd('ads', 19);
  badge(540, 300, 110, t);
  const p = back(k(t, four - 0.1, 0.45));
  c.save(); c.translate(540, 560); c.scale(p, p); txt('$4.99', 0, 0, 220, GOLD, { drop: '#b36b00', dropY: 12, shadow: 'rgba(255,201,60,.6)', blur: 40, sy: 0 }); c.restore();
  const o = back(k(t, once - 0.1, 0.4)); c.save(); c.translate(540, 720); c.scale(o, o); txt('once.', 0, 0, 96, '#fff', { shadow: 'rgba(40,0,60,.6)' }); c.restore();
  [['No subscription.', sub], ['No ads.', ads]].forEach(([s, at], i) => { const a = back(k(t, at - 0.1, 0.4)); if (a <= 0) return; c.save(); c.translate(540, 860 + i * 110); c.scale(a, a); pill(0, 0, s, { bg: '#fff', color: INK, size: 54, icon: (ix, iy, r) => { circ(ix, iy, r * 1.1, GOOD); check(ix, iy, r * 0.8); } }); c.restore(); });
  const u = eo(k(t, ads + 0.3, 0.4)); c.save(); c.globalAlpha = u; txt('Unlocks all 6 Dream Books · Ages 5–12', 540, 1100, 38, '#fff', { w: 600, shadow: 'rgba(40,0,60,.6)' }); c.restore();
  family(t, 1260, 0.5);
}
function family(t, y, s) {
  // parent + child + Guardian Hoot together on the hill: waving, hugging, blinking, glancing at each other
  const lp = life(t, 2), lk = life(t, 7), lh = life(t, 4);
  const wv = Math.sin(t * 7);
  parent(650, y - 30, s * 1.05, { e: E('warm'), bl: lp.bl, gx: Math.sin(t * 0.8) > 0.3 ? -0.7 : 0, gy: Math.sin(t * 0.8) > 0.3 ? 0.5 : 0, tilt: -0.08 + lp.sway, legs: true, armL: 1.0, bendL: 0.6, breath: lp.br });
  kid(470, y + 50, s * 0.95, { e: E('happy', 'excited', 0.5 + 0.5 * Math.sin(t * 1.3)), bl: lk.bl, gx: Math.sin(t * 0.7 + 1) > 0.4 ? 0.7 : 0, gy: Math.sin(t * 0.7 + 1) > 0.4 ? -0.5 : 0, tilt: 0.08 * Math.sin(t * 2) + lk.sway, legs: true, armL: 2.3 + 0.35 * wv, bendL: 0.3, armR: 0.5, outfit: 'cape' });
  hoot(820, y + 150, s * 0.85, { t, stage: 'guardian', e: E('proud', 'happy', 0.5 + 0.5 * Math.sin(t)), bl: lh.bl, gx: -0.6 + lh.gx * 0.3, gy: lh.gy * 0.4, tilt: 0.1 * Math.sin(t * 1.5), bob: 8 * Math.sin(t * 2.2), wingL: 0.3 + 0.25 * Math.sin(t * 5), wingR: 0.15 });
}
export function sceneEnd(lt, d, t) {
  const { Wd } = G; valley(t);
  const lt2 = lt;
  lantern(540, 380, 1.0, 1, t);
  for (let i = 0; i < 12; i++) sparkle(540 + Math.cos(i * 0.52 + t * 0.6) * 240, 380 + Math.sin(i * 0.52 + t * 0.6) * 200, 8 + 6 * Math.sin(t * 3 + i), '#fff6cc', 0.8);
  const a1 = back(k(lt2, 0.1, 0.5)), a2 = eo(k(t, Wd('Coming', 22) - 0.3, 0.4)), a3 = eo(k(t, Wd('Be', 22) - 0.2, 0.4)), tg = eo(k(t, Wd('Learning', 21) - 0.1, 0.4));
  c.save(); c.translate(540, 700); c.scale(a1, a1);
  txt('Dream Quest:', 0, 0, 132, GOLD, { drop: '#b36b00', dropY: 10, shadow: 'rgba(255,201,60,.6)', blur: 36, sy: 0 });
  txt('Kids Learning —', 0, 130, 96, GOLD, { drop: '#b36b00', dropY: 8 });
  c.restore();
  c.save(); c.globalAlpha = a2; txt('Coming soon.', 540, 960, 100, '#fff', { shadow: 'rgba(40,0,60,.7)', blur: 24 }); c.restore();
  c.save(); c.globalAlpha = a3; txt('Be one of the first families in.', 540, 1075, 58, '#fff', { w: 600, shadow: 'rgba(40,0,60,.7)', blur: 20, maxW: 980 }); c.restore();
  c.save(); c.globalAlpha = tg; txt('Learning that grows with your child.', 540, 1160, 42, '#ffe7a6', { w: 500, maxW: 960 }); c.restore();
  family(t, 1330, 0.42);
}

export function init(g) {
  G = g;
  const rnd = (i) => hash(i * 1.618 + 0.5);
  STARS = Array.from({ length: 110 }, (_, i) => ({ x: rnd(i) * W, y: rnd(i + 500) * 1150, r: 1.2 + rnd(i + 900) * 2.6, f: 0.8 + rnd(i + 77) * 2.2, p: rnd(i + 33) * 6, big: rnd(i + 2) > 0.9 }));
  FIREFLIES = Array.from({ length: 16 }, (_, i) => ({ x: rnd(i + 40) * W, y: 900 + rnd(i + 80) * 700, f: 0.3 + rnd(i + 3) * 0.6, p: rnd(i + 9) * 6 }));
  const { Wd, ls } = G;
  CUES.length = 0;
  for (let s = 0.3; s < ls(2); s += 1.0) cue(s, 'tick', 0.5);
  const adv = Wd('adventure', 2);
  cue(ls(2) + 0.05, 'shimmer'); cue(adv + 0.1, 'whoosh'); cue(ls(3) - 0.2, 'chime');
  const t0 = Wd('hero', 5, 0) - 0.1; for (let i = 0; i < 11; i++) cue(t0 + i / 11, 'tap', 0.5);
  cue(Wd('only', 5) - 0.5, 'pop');
  cue(Wd('dress', 6), 'pop'); cue(Wd('avatar', 6), 'pop'); cue(Wd('avatar', 6), 'sparkle', 0.6);
  cue(Wd('Hoot', 7) - 0.1, 'select'); cue(Wd('hatches', 8) - 0.45, 'crack', 0.6); cue(Wd('hatches', 8), 'pop'); cue(Wd('hatches', 8), 'sparkle'); cue(Wd('cheers', 8), 'yay');
  ['Hatchling', 'Explorer', 'Guardian'].forEach((w, i) => cue((i === 0 ? ls(9) + 0.15 : Wd(w, 9)) - 0.15, 'ding', 0.7 + i * 0.15));
  cue(Wd('quiz', 11) + 1.0, 'correct'); cue(Wd('new', 11) - 0.2, 'whoosh', 0.6);
  cue(ls(12) - 0.3, 'whoosh', 0.5); cue(Wd('Solved', 13) - 0.05, 'success');
  for (let i = 0; i < 7; i++) cue(Wd('Orbs', 13) + 0.55 + i * 0.09, 'orb', 0.5);
  cue(Wd('Path', 14) - 0.3, 'shimmer', 0.7);
  for (let i = 0; i < 5; i++) cue(Wd('star', 16) - 0.15 + i * 0.13, 'ding', 0.5 + i * 0.1);
  for (let i = 0; i < 4; i++) cue(Wd('PIN', 17) - 0.3 + i * 0.18, 'tap', 0.5);
  cue(Wd('weekly', 17) - 0.2, 'whoosh', 0.5);
  cue(Wd('No', 18, 0) - 0.1, 'pop', 0.7); cue(Wd('strangers', 18) - 0.1, 'pop', 0.7); cue(Wd('safe', 18) - 0.1, 'pop', 0.7);
  cue(Wd('Four', 19) - 0.1, 'chime');
  cue(ls(20) - 0.3, 'shimmer');
}
