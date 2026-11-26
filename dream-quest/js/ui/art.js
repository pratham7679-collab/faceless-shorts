/* Dream Quest — all artwork as inline SVG (no image files): Hoot, 33 companions with
 * growth stages, Dream Orbs, Dream Lanterns, paw prints, place and quest icons, shapes,
 * counting things and story scenes. */
(function () {
  'use strict';
  const DQ = window.DQ;
  let gid = 0;
  const id = (p) => p + (++gid);

  function shade(hex, amt) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map((x) => x + x).join('');
    const n = parseInt(c, 16);
    const f = (v) => Math.max(0, Math.min(255, Math.round(v + amt * 255)));
    const r = f((n >> 16) & 255), g = f((n >> 8) & 255), b = f(n & 255);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  const mirror = (x) => 120 - x;

  const Art = (DQ.Art = { shade });

  /* ---------------- Hoot the Wise Owl ---------------- */
  Art.hoot = function (opts) {
    opts = opts || {};
    const g = id('hb');
    return `<svg class="hoot-svg" viewBox="0 0 120 132" role="img" aria-label="Hoot the wise owl">
<defs><radialGradient id="${g}" cx="50%" cy="35%" r="70%"><stop offset="0" stop-color="#a87850"/><stop offset="1" stop-color="#6e4630"/></radialGradient></defs>
<g class="h-wing h-wing-l"><ellipse cx="22" cy="82" rx="13" ry="30" transform="rotate(14 22 82)" fill="#5c3b26"/></g>
<g class="h-wing h-wing-r"><ellipse cx="98" cy="82" rx="13" ry="30" transform="rotate(-14 98 82)" fill="#5c3b26"/></g>
<path d="M26 34 L20 8 L44 26 Z" fill="#6e4630"/><path d="M94 34 L100 8 L76 26 Z" fill="#6e4630"/>
<ellipse cx="60" cy="76" rx="42" ry="50" fill="url(#${g})"/>
<ellipse cx="60" cy="94" rx="27" ry="29" fill="#f3dfc1"/>
<path d="M44 86 q4 5 8 0 q4 5 8 0 q4 5 8 0 q4 5 8 0 M48 98 q4 5 8 0 q4 5 8 0 q4 5 8 0 M52 110 q4 5 8 0 q4 5 8 0" stroke="#d9bf98" stroke-width="2" fill="none" stroke-linecap="round"/>
<circle cx="43" cy="56" r="19" fill="#f8ecd8"/><circle cx="77" cy="56" r="19" fill="#f8ecd8"/>
<g class="eye"><circle cx="43" cy="56" r="11" fill="#fff"/><circle cx="45" cy="57" r="7" fill="#2b1d14"/><circle cx="47.5" cy="54" r="2.6" fill="#fff"/></g>
<g class="eye"><circle cx="77" cy="56" r="11" fill="#fff"/><circle cx="79" cy="57" r="7" fill="#2b1d14"/><circle cx="81.5" cy="54" r="2.6" fill="#fff"/></g>
<g class="lid"><ellipse cx="43" cy="56" rx="12" ry="12" fill="#a87850"/><ellipse cx="77" cy="56" rx="12" ry="12" fill="#a87850"/></g>
<circle cx="43" cy="56" r="15.5" fill="none" stroke="#e7b94c" stroke-width="3"/><circle cx="77" cy="56" r="15.5" fill="none" stroke="#e7b94c" stroke-width="3"/>
<path d="M58.5 55 h3" stroke="#e7b94c" stroke-width="3"/>
<path d="M60 64 L53 70 L60 80 L67 70 Z" fill="#f5a623"/>
<ellipse cx="47" cy="126" rx="8" ry="4" fill="#f5a623"/><ellipse cx="73" cy="126" rx="8" ry="4" fill="#f5a623"/>
${opts.lantern ? '<g class="h-lantern"><path d="M100 90 v8" stroke="#3b2a20" stroke-width="2"/><rect x="92" y="98" width="16" height="20" rx="6" fill="#ffd36b"/><rect x="92" y="98" width="16" height="20" rx="6" fill="none" stroke="#c9822b" stroke-width="2"/></g>' : ''}
</svg>`;
  };

  /* ---------------- Companions (parametric, with growth stages) ---------------- */
  function ears(c, body, inner, dark, hy) {
    const out = [];
    switch (c.ear) {
      case 'cat':
        out.push(`<path d="M36 34 L33 10 L54 25 Z" fill="${body}"/><path d="M39 30 L37 16 L50 25 Z" fill="${inner}"/>`);
        out.push(`<path d="M84 34 L87 10 L66 25 Z" fill="${body}"/><path d="M81 30 L83 16 L70 25 Z" fill="${inner}"/>`); break;
      case 'fox':
        out.push(`<path d="M34 38 L28 4 L56 24 Z" fill="${body}"/><path d="M37 32 L33 13 L50 25 Z" fill="#fff4ea"/>`);
        out.push(`<path d="M86 38 L92 4 L64 24 Z" fill="${body}"/><path d="M83 32 L87 13 L70 25 Z" fill="#fff4ea"/>`); break;
      case 'bunny':
        out.push(`<ellipse cx="46" cy="14" rx="8" ry="23" transform="rotate(-12 46 14)" fill="${body}"/><ellipse cx="46" cy="16" rx="4" ry="16" transform="rotate(-12 46 16)" fill="#ffc6d3"/>`);
        out.push(`<ellipse cx="74" cy="14" rx="8" ry="23" transform="rotate(12 74 14)" fill="${body}"/><ellipse cx="74" cy="16" rx="4" ry="16" transform="rotate(12 74 16)" fill="#ffc6d3"/>`); break;
      case 'bear':
        out.push(`<circle cx="36" cy="28" r="10" fill="${body}"/><circle cx="36" cy="28" r="5" fill="${inner}"/><circle cx="84" cy="28" r="10" fill="${body}"/><circle cx="84" cy="28" r="5" fill="${inner}"/>`); break;
      case 'mouse':
        out.push(`<circle cx="33" cy="30" r="15" fill="${body}"/><circle cx="33" cy="30" r="9" fill="#ffc6d3"/><circle cx="87" cy="30" r="15" fill="${body}"/><circle cx="87" cy="30" r="9" fill="#ffc6d3"/>`); break;
      case 'panda':
        out.push(`<circle cx="36" cy="28" r="10" fill="#2c2c34"/><circle cx="84" cy="28" r="10" fill="#2c2c34"/>`); break;
      case 'deer':
        out.push(`<path d="M44 26 q-6 -14 -2 -20 M42 16 q-6 -2 -9 -8 M76 26 q6 -14 2 -20 M78 16 q6 -2 9 -8" stroke="#8a5a34" stroke-width="3.5" fill="none" stroke-linecap="round"/>`);
        out.push(`<ellipse cx="28" cy="40" rx="11" ry="5.5" transform="rotate(-25 28 40)" fill="${body}"/><ellipse cx="92" cy="40" rx="11" ry="5.5" transform="rotate(25 92 40)" fill="${body}"/>`); break;
      case 'horn':
        out.push(`<path d="M54 24 L60 -2 L66 24 Z" fill="#ffd36b"/><path d="M56 16 l8 -2 M57 9 l6 -2" stroke="#e0a52c" stroke-width="1.6"/>`); break;
      case 'frog':
        out.push(`<circle cx="44" cy="28" r="13" fill="${body}"/><circle cx="76" cy="28" r="13" fill="${body}"/>`); break;
      case 'spikes': {
        const pts = [];
        for (let i = 0; i <= 14; i++) { const a = ((190 + i * 11.4) * Math.PI) / 180; const r = i % 2 ? 44 : 30; pts.push((60 + r * Math.cos(a)).toFixed(1) + ' ' + (hy + 4 + r * Math.sin(a)).toFixed(1)); }
        out.push(`<path d="M60 ${hy + 4} L${pts.join(' L')} Z" fill="${dark}"/>`); break;
      }
      case 'lamb':
        out.push(`<ellipse cx="28" cy="48" rx="12" ry="6" transform="rotate(20 28 48)" fill="${inner}"/><ellipse cx="92" cy="48" rx="12" ry="6" transform="rotate(-20 92 48)" fill="${inner}"/>`); break;
      case 'leaf':
        out.push(`<path d="M60 24 q-4 -14 6 -22 q8 12 -6 22" fill="#4caf6e"/><path d="M60 24 q2 -10 5 -18" stroke="#2e7d4f" stroke-width="1.5" fill="none"/>`); break;
      case 'antenna':
        out.push(`<path d="M50 24 q-6 -14 -12 -16 M70 24 q6 -14 12 -16" stroke="#3a3346" stroke-width="2.5" fill="none" stroke-linecap="round"/><circle cx="38" cy="8" r="4" fill="${c.extra === 'wings' ? '#fff3a6' : '#3a3346'}"/><circle cx="82" cy="8" r="4" fill="${c.extra === 'wings' ? '#fff3a6' : '#3a3346'}"/>`); break;
      case 'tuft':
        out.push(`<path d="M56 24 q-6 -12 0 -16 q2 8 4 16 q2 -10 8 -14 q2 8 -4 14" fill="${dark}"/>`); break;
      case 'horns':
        out.push(`<path d="M42 28 q-4 -12 2 -18 q2 10 6 16 Z M78 28 q4 -12 -2 -18 q-2 10 -6 16 Z" fill="#ffe7a3"/>`); break;
      case 'floppy':
        out.push(`<ellipse cx="30" cy="54" rx="9" ry="20" transform="rotate(18 30 54)" fill="${dark}"/><ellipse cx="90" cy="54" rx="9" ry="20" transform="rotate(-18 90 54)" fill="${dark}"/>`); break;
      case 'frills':
        out.push(`<path d="M32 44 l-12 -8 M31 52 l-14 0 M32 60 l-12 8 M88 44 l12 -8 M89 52 l14 0 M88 60 l12 8" stroke="#ff7fa5" stroke-width="5" stroke-linecap="round"/>`); break;
      default: break;
    }
    return out.join('');
  }

  function tail(c, body, belly, dark) {
    switch (c.tail) {
      case 'pom': return `<circle cx="86" cy="104" r="8" fill="${belly}"/>`;
      case 'fluffy': return `<ellipse cx="94" cy="96" rx="12" ry="22" transform="rotate(35 94 96)" fill="${body}"/><ellipse cx="102" cy="82" rx="6" ry="8" transform="rotate(35 102 82)" fill="#fff4ea"/>`;
      case 'stripe': return `<ellipse cx="94" cy="96" rx="11" ry="22" transform="rotate(35 94 96)" fill="${body}"/><path d="M86 104 l10 -6 M91 94 l10 -6 M96 85 l8 -5" stroke="${dark}" stroke-width="4"/>`;
      case 'curl': return `<path d="M84 106 q18 4 16 -12 q-2 -8 -8 -4" stroke="${dark}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
      case 'long': return `<path d="M84 108 q22 2 26 -16" stroke="${body}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
      case 'dragon': return `<path d="M82 104 q20 6 28 -8 l-4 14 z" fill="${dark}"/><path d="M104 92 l8 -6 l-2 10 z" fill="${dark}"/>`;
      case 'swish': return `<path d="M84 104 q18 0 22 -18 q-6 6 -10 4 q4 8 -12 14" fill="#c9a6ff"/>`;
      default: return '';
    }
  }

  /** stage: 1 cub … 6 coach. Companions mature a little with each band. */
  Art.companion = function (cid, opts) {
    opts = opts || {};
    const c = (typeof cid === 'string' ? DQ.World.companions.find((x) => x.id === cid) : cid) || DQ.World.companions[0];
    const stage = Math.max(1, Math.min(6, opts.stage || 1));
    const mood = opts.mood || 'happy';
    const body = c.body, belly = c.belly, dark = shade(body, -0.18), inner = shade(body, 0.12);
    const k = stage - 1;
    const hr = 30 - k * 1.6, hy = 50 - k * 2.2, by = 92 - k * 0.5, bry = 24 + k * 2.6, brx = 26 + k * 0.6;
    const eyeY = c.ear === 'frog' ? 28 : hy + 2;
    const sil = opts.silhouette;
    const parts = [];
    if (c.extra === 'wings') parts.push(`<g class="c-wings"><ellipse cx="26" cy="80" rx="16" ry="10" transform="rotate(-30 26 80)" fill="#ffffffaa"/><ellipse cx="94" cy="80" rx="16" ry="10" transform="rotate(30 94 80)" fill="#ffffffaa"/></g>`);
    parts.push(tail(c, body, belly, dark));
    parts.push(`<ellipse cx="60" cy="${by}" rx="${brx}" ry="${bry}" fill="${body}"/>`);
    if (c.extra === 'shell') parts.push(`<ellipse cx="60" cy="${by - 2}" rx="${brx + 4}" ry="${bry - 2}" fill="#5d9b5f"/><path d="M44 ${by - 6} h32 M50 ${by - 16} l-6 20 M70 ${by - 16} l6 20" stroke="#447a46" stroke-width="2.5" fill="none"/>`);
    else parts.push(`<ellipse cx="60" cy="${by + 5}" rx="${brx - 10}" ry="${bry - 9}" fill="${belly}"/>`);
    parts.push(`<ellipse cx="46" cy="${by + bry - 2}" rx="9" ry="5" fill="${dark}"/><ellipse cx="74" cy="${by + bry - 2}" rx="9" ry="5" fill="${dark}"/>`);
    parts.push(`<g class="c-arm c-arm-l"><ellipse cx="36" cy="${by - 2}" rx="7" ry="12" transform="rotate(28 36 ${by - 2})" fill="${dark}"/></g>`);
    parts.push(`<g class="c-arm c-arm-r"><ellipse cx="84" cy="${by - 2}" rx="7" ry="12" transform="rotate(-28 84 ${by - 2})" fill="${dark}"/></g>`);
    // stage accessories: scarf (2+), satchel strap (3+), headset (4+), badge (5+), coach star pin (6)
    if (stage >= 2) parts.push(`<path d="M${60 - brx + 8} ${by - bry + 6} q${brx - 8} 10 ${2 * brx - 16} 0 l-2 7 q-${brx - 8} 9 -${2 * brx - 20} 0 Z" fill="#ff7a8a"/><path d="M${60 + 8} ${by - bry + 10} l4 16 l7 -2 l-4 -14 Z" fill="#ff5d72"/>`);
    if (stage >= 3) parts.push(`<path d="M${60 - brx + 6} ${by - 10} L${60 + brx - 8} ${by + 14}" stroke="#7a4b2b" stroke-width="3.5"/><rect x="${60 + brx - 16}" y="${by + 10}" width="14" height="11" rx="3" fill="#a46a3f"/>`);
    if (stage >= 5) parts.push(`<circle cx="${60 - 10}" cy="${by - 2}" r="5" fill="#ffd36b" stroke="#d9a12c" stroke-width="1.5"/>`);
    if (!['horn', 'floppy', 'frills'].includes(c.ear)) parts.push(ears(c, body, inner, dark, hy));
    parts.push(`<circle cx="60" cy="${hy}" r="${hr}" fill="${body}"/>`);
    if (['horn', 'floppy', 'frills'].includes(c.ear)) parts.push(ears(c, body, inner, dark, hy));
    if (c.extra === 'mane') parts.push(`<path d="M44 ${hy - hr + 6} q-10 10 -6 22 q6 -8 10 -6 q-6 8 -2 18 q6 -10 10 -10" fill="#c9a6ff"/><circle cx="56" cy="${hy - hr + 4}" r="7" fill="#ffb3d9"/><circle cx="66" cy="${hy - hr + 5}" r="6" fill="#b3e5ff"/>`);
    if (c.extra === 'fluff') parts.push(`<circle cx="50" cy="${hy - hr + 6}" r="9" fill="${belly}"/><circle cx="60" cy="${hy - hr + 2}" r="10" fill="${belly}"/><circle cx="70" cy="${hy - hr + 6}" r="9" fill="${belly}"/>`);
    if (c.extra === 'patches') parts.push(`<ellipse cx="47" cy="${hy + 2}" rx="8" ry="10" transform="rotate(-20 47 ${hy + 2})" fill="#2c2c34"/><ellipse cx="73" cy="${hy + 2}" rx="8" ry="10" transform="rotate(20 73 ${hy + 2})" fill="#2c2c34"/>`);
    if (c.extra === 'mask') parts.push(`<path d="M34 ${hy - 4} q26 -8 52 0 q-4 14 -14 10 q-12 -4 -24 0 q-10 4 -14 -10 Z" fill="#3a3a44"/>`);
    if (c.extra === 'stripe') parts.push(`<path d="M56 ${hy - hr} h8 v${hr - 4} h-8 Z" fill="#fff"/>`);
    if (c.extra === 'spots' && c.ear !== 'frog') parts.push(`<circle cx="46" cy="${hy - 16}" r="3.5" fill="${c.kind === 'ladybug' ? '#2b2b2b' : '#fff7'}"/><circle cx="74" cy="${hy - 14}" r="3" fill="${c.kind === 'ladybug' ? '#2b2b2b' : '#fff7'}"/><circle cx="60" cy="${by - 4}" r="3.5" fill="${c.kind === 'ladybug' ? '#2b2b2b' : '#fff7'}"/>`);
    if (c.extra === 'spots' && c.ear === 'frog') parts.push(`<circle cx="50" cy="${hy + 16}" r="3" fill="${dark}"/><circle cx="72" cy="${hy + 18}" r="2.4" fill="${dark}"/>`);
    // face
    const eyeDx = c.ear === 'frog' ? 16 : 12;
    const eye = (x, cls) => mood === 'happy' && opts.closedHappy
      ? `<path class="${cls}" d="M${x - 5} ${eyeY + 1} q5 -6 10 0" stroke="#2b2130" stroke-width="3" fill="none" stroke-linecap="round"/>`
      : `<g class="${cls}"><ellipse cx="${x}" cy="${eyeY}" rx="4.8" ry="${mood === 'surprised' ? 6 : 5.4}" fill="#2b2130"/><circle cx="${x + 1.6}" cy="${eyeY - 2}" r="1.8" fill="#fff"/></g>`;
    if (c.ear === 'frog') parts.push(`<circle cx="44" cy="28" r="8" fill="#fff"/><circle cx="76" cy="28" r="8" fill="#fff"/>`);
    parts.push(eye(60 - eyeDx, 'c-eye c-eye-l'), eye(60 + eyeDx, 'c-eye c-eye-r'));
    parts.push(`<circle cx="${60 - 20}" cy="${hy + 12}" r="5" fill="#ff8fa8" opacity=".45"/><circle cx="${60 + 20}" cy="${hy + 12}" r="5" fill="#ff8fa8" opacity=".45"/>`);
    const my = hy + 15;
    if (c.extra === 'beak') parts.push(`<ellipse cx="60" cy="${my - 3}" rx="9" ry="4.5" fill="#ff9f1c"/>`);
    else if (c.extra === 'nose') parts.push(`<ellipse cx="60" cy="${my - 5}" rx="6" ry="7" fill="#3a3346"/>`);
    else parts.push(`<ellipse cx="60" cy="${my - 6}" rx="3.2" ry="2.4" fill="#3a3346"/>`);
    if (mood === 'sad') parts.push(`<path d="M53 ${my + 4} q7 -6 14 0" stroke="#3a3346" stroke-width="2.6" fill="none" stroke-linecap="round"/>`);
    else if (mood === 'surprised') parts.push(`<ellipse cx="60" cy="${my + 2}" rx="3.5" ry="4.5" fill="#3a3346"/>`);
    else parts.push(`<path d="M52 ${my - 1} q8 9 16 0" stroke="#3a3346" stroke-width="2.6" fill="${opts.open ? '#c94f6d' : 'none'}" stroke-linecap="round"/>`);
    if (c.extra === 'whiskers') parts.push(`<path d="M44 ${my - 4} l-12 -2 M44 ${my} l-12 2 M76 ${my - 4} l12 -2 M76 ${my} l12 2" stroke="#7a8794" stroke-width="1.4"/>`);
    if (stage >= 4) parts.push(`<path d="M${60 - hr - 1} ${hy} a${hr + 1} ${hr + 1} 0 0 1 ${2 * hr + 2} 0" stroke="#4b5a7a" stroke-width="4" fill="none"/><rect x="${60 - hr - 6}" y="${hy - 4}" width="8" height="12" rx="3" fill="#4b5a7a"/><rect x="${60 + hr - 2}" y="${hy - 4}" width="8" height="12" rx="3" fill="#4b5a7a"/>`);
    let svg = parts.join('');
    if (sil) svg = `<g opacity=".9" filter="url(#sil)">${svg}</g>`;
    return `<svg class="cmp-svg" viewBox="-6 -8 132 142" role="img" aria-label="${c.name} the ${c.kind}">${sil ? '<defs><filter id="sil"><feColorMatrix type="matrix" values="0 0 0 0 0.25  0 0 0 0 0.22  0 0 0 0 0.45  0 0 0 1 0"/></filter></defs>' : ''}${svg}</svg>`;
  };

  /* ---------------- Rewards ---------------- */
  Art.orb = function (size) {
    const g = id('orb');
    return `<svg class="orb-svg" viewBox="0 0 40 40" width="${size || 28}" height="${size || 28}" aria-hidden="true"><defs><radialGradient id="${g}" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#bdf3ff"/><stop offset=".75" stop-color="#7aa8ff"/><stop offset="1" stop-color="#8a6cff"/></radialGradient></defs><circle cx="20" cy="20" r="18" fill="#9fd8ff" opacity=".25"/><circle cx="20" cy="20" r="14" fill="url(#${g})"/><path d="M13 15 q3 -5 8 -5" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".9"/></svg>`;
  };

  Art.lantern = function (lit, hue) {
    const g = id('lan');
    const col = hue || '#ffb347';
    return `<svg class="lantern-svg ${lit ? 'lit' : 'unlit'}" viewBox="0 0 60 84" aria-hidden="true"><defs><radialGradient id="${g}" cx="50%" cy="55%" r="60%"><stop offset="0" stop-color="#fff7c2"/><stop offset=".5" stop-color="${col}"/><stop offset="1" stop-color="${shade(col, -0.25)}"/></radialGradient></defs>
${lit ? `<circle cx="30" cy="46" r="28" fill="${col}" opacity=".22"/>` : ''}
<path d="M30 2 v8" stroke="#6b5a7a" stroke-width="2.5"/><rect x="20" y="10" width="20" height="6" rx="2" fill="#6b5a7a"/>
<path d="M16 18 Q4 46 16 72 H44 Q56 46 44 18 Z" fill="${lit ? `url(#${g})` : '#3b3566'}" stroke="${lit ? shade(col, -0.3) : '#5d5690'}" stroke-width="2"/>
<path d="M30 18 V72 M22 19 Q16 46 22 71 M38 19 Q44 46 38 71" stroke="${lit ? shade(col, -0.2) : '#5d5690'}" stroke-width="1.5" fill="none" opacity=".7"/>
<rect x="20" y="72" width="20" height="6" rx="2" fill="#6b5a7a"/><path d="M30 78 v5" stroke="#6b5a7a" stroke-width="2"/></svg>`;
  };

  Art.paw = function (cls) {
    return `<svg class="paw-svg ${cls || ''}" viewBox="0 0 40 40" aria-hidden="true"><ellipse cx="20" cy="26" rx="10" ry="8.5"/><ellipse cx="9" cy="15" rx="4.2" ry="5.4" transform="rotate(-20 9 15)"/><ellipse cx="16" cy="9" rx="4.2" ry="5.6"/><ellipse cx="24" cy="9" rx="4.2" ry="5.6"/><ellipse cx="31" cy="15" rx="4.2" ry="5.4" transform="rotate(20 31 15)"/></svg>`;
  };

  Art.speaker = () => `<svg viewBox="0 0 24 24" aria-hidden="true" class="ico"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`;
  Art.home = () => `<svg viewBox="0 0 24 24" aria-hidden="true" class="ico"><path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" fill="currentColor"/></svg>`;
  Art.lock = () => `<svg viewBox="0 0 24 24" aria-hidden="true" class="ico"><rect x="5" y="10" width="14" height="11" rx="3" fill="currentColor"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="2.4" fill="none"/></svg>`;
  Art.gear = () => `<svg viewBox="0 0 24 24" aria-hidden="true" class="ico"><path fill="currentColor" d="M19.4 13a7.6 7.6 0 0 0 0-2l2-1.6-2-3.4-2.4 1a7.4 7.4 0 0 0-1.7-1L15 3.5h-4l-.4 2.5a7.4 7.4 0 0 0-1.7 1l-2.4-1-2 3.4L6.6 11a7.6 7.6 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7.4 7.4 0 0 0 1.7 1l.3 2.5h4l.4-2.5a7.4 7.4 0 0 0 1.7-1l2.4 1 2-3.4zM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z" transform="translate(-1 0)"/></svg>`;
  Art.arrow = (dir) => `<svg viewBox="0 0 24 24" aria-hidden="true" class="ico"><path d="${dir === 'left' ? 'M15 4 7 12l8 8' : 'M9 4l8 8-8 8'}" stroke="currentColor" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  /* ---------------- Places & quest icons ---------------- */
  Art.place = function (kind) {
    switch (kind) {
      case 'woods': return `<svg viewBox="0 0 120 90" aria-hidden="true"><ellipse cx="60" cy="84" rx="56" ry="8" fill="#1f4a46"/><path d="M28 80 L44 26 L60 80 Z" fill="#3e9b76"/><path d="M56 82 L76 14 L96 82 Z" fill="#2f8a6a"/><path d="M8 82 L22 40 L36 82 Z" fill="#4fb388"/><rect x="72" y="78" width="8" height="8" fill="#6b4a33"/><text x="76" y="56" font-size="20" font-weight="800" text-anchor="middle" fill="#fff6d8" font-family="Andika, sans-serif">a</text><text x="44" y="64" font-size="15" font-weight="800" text-anchor="middle" fill="#fff6d8" font-family="Andika, sans-serif">b</text><text x="22" y="70" font-size="12" font-weight="800" text-anchor="middle" fill="#fff6d8" font-family="Andika, sans-serif">c</text><circle class="tw" cx="104" cy="20" r="3" fill="#ffe98a"/></svg>`;
      case 'meadow': return `<svg viewBox="0 0 120 90" aria-hidden="true"><path d="M0 70 Q60 40 120 66 V90 H0Z" fill="#4fae6f"/><path d="M0 80 Q60 60 120 78 V90 H0Z" fill="#3c9460"/><g font-family="Baloo 2, sans-serif" font-weight="800" text-anchor="middle"><circle cx="30" cy="62" r="11" fill="#ffd0e0"/><text x="30" y="68" font-size="15" fill="#7a2952">1</text><circle cx="62" cy="52" r="12" fill="#fff1a8"/><text x="62" y="58" font-size="16" fill="#7a5a00">2</text><circle cx="94" cy="62" r="11" fill="#c9e7ff"/><text x="94" y="68" font-size="15" fill="#1b4c7a">3</text></g><g class="fly"><circle cx="44" cy="26" r="4" fill="#fff49a"/><circle cx="44" cy="26" r="9" fill="#fff49a" opacity=".3"/></g><g class="fly fly2"><circle cx="86" cy="20" r="3.5" fill="#fff49a"/><circle cx="86" cy="20" r="8" fill="#fff49a" opacity=".3"/></g></svg>`;
      case 'grove': return `<svg viewBox="0 0 120 90" aria-hidden="true"><ellipse cx="60" cy="84" rx="50" ry="7" fill="#2b2056"/><rect x="54" y="44" width="12" height="40" rx="4" fill="#7a5236"/><circle cx="60" cy="34" r="30" fill="#7c5cc4"/><circle cx="40" cy="40" r="16" fill="#8f6fd6"/><circle cx="82" cy="40" r="16" fill="#8f6fd6"/><path d="M34 70 q13 -8 26 0 q13 -8 26 0 v14 q-13 -8 -26 0 q-13 -8 -26 0z" fill="#fff6e6"/><path d="M60 70 v14" stroke="#c9b48f" stroke-width="2"/><circle class="tw" cx="40" cy="24" r="3" fill="#ffe98a"/><circle class="tw tw2" cx="78" cy="18" r="2.6" fill="#ffe98a"/></svg>`;
      case 'lantern': return `<svg viewBox="0 0 120 90" aria-hidden="true"><path d="M0 80 Q60 30 120 80 V90 H0Z" fill="#3a3270"/><g transform="translate(46 10) scale(.5)">${Art.lantern(true).replace(/<\/?svg[^>]*>/g, '')}</g><g transform="translate(20 42) scale(.32)">${Art.lantern(true, '#ff8fb1').replace(/<\/?svg[^>]*>/g, '')}</g><g transform="translate(82 40) scale(.34)">${Art.lantern(true, '#8fd8ff').replace(/<\/?svg[^>]*>/g, '')}</g></svg>`;
      case 'path': return `<svg viewBox="0 0 120 90" aria-hidden="true"><path d="M10 86 C40 70 20 52 56 46 S100 30 110 6" stroke="#f3d9a6" stroke-width="16" fill="none" stroke-linecap="round" opacity=".5"/>${[[20, 76, -30], [38, 62, -10], [56, 48, 10], [78, 40, 20], [96, 24, 30]].map(([x, y, r]) => `<g transform="translate(${x - 8} ${y - 8}) rotate(${r} 8 8) scale(.4)" fill="#ffffff">${Art.paw().replace(/<\/?svg[^>]*>/g, '')}</g>`).join('')}</svg>`;
      case 'mist': return `<svg viewBox="0 0 120 90" aria-hidden="true"><path d="M0 70 Q30 40 60 60 T120 50 V90 H0Z" fill="#4a4a7a" opacity=".5"/><ellipse cx="40" cy="60" rx="40" ry="10" fill="#c9c9ff" opacity=".18"/><ellipse cx="84" cy="48" rx="34" ry="9" fill="#c9c9ff" opacity=".14"/></svg>`;
      default: return '';
    }
  };

  Art.skillIcon = function (kind) {
    const wrap = (inner) => `<svg viewBox="0 0 64 64" aria-hidden="true">${inner}</svg>`;
    switch (kind) {
      case 'ear': return wrap(`<path d="M20 40 C8 20 26 4 40 10 C54 16 50 32 40 36 C34 40 38 50 30 54 C24 57 22 50 20 40Z" fill="#ffc6a8"/><path d="M28 30 C26 20 38 18 40 26" stroke="#c9775b" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M48 44 q6 4 10 0 M50 52 q6 2 9 -3" stroke="#ffe98a" stroke-width="3" fill="none" stroke-linecap="round"/>`);
      case 'bells': return wrap(`<path d="M14 40 C14 22 22 16 26 16 C30 16 38 22 38 40 Z" fill="#ffd36b"/><circle cx="26" cy="44" r="4" fill="#d99a2b"/><path d="M30 44 C30 26 38 20 42 20 C46 20 54 26 54 44 Z" fill="#ffb3c9"/><circle cx="42" cy="48" r="4" fill="#d9708f"/>`);
      case 'lanternword': return wrap(`<g transform="translate(14 2) scale(.6)">${Art.lantern(true).replace(/<\/?svg[^>]*>/g, '')}</g><text x="32" y="38" font-size="12" font-weight="800" text-anchor="middle" fill="#5a3a00" font-family="Andika, sans-serif">the</text>`);
      case 'book': return wrap(`<path d="M6 16 q13 -6 26 0 q13 -6 26 0 v34 q-13 -6 -26 0 q-13 -6 -26 0z" fill="#fff6e6"/><path d="M32 16 v34" stroke="#c9b48f" stroke-width="2"/><path d="M12 24 h14 M12 30 h14 M12 36 h10 M38 24 h14 M38 30 h14 M38 36 h10" stroke="#9a86c9" stroke-width="2.4" stroke-linecap="round"/>`);
      case 'blocks': return wrap(`<rect x="6" y="30" width="16" height="16" rx="4" fill="#ff9fb8"/><rect x="24" y="30" width="16" height="16" rx="4" fill="#ffd36b"/><rect x="42" y="30" width="16" height="16" rx="4" fill="#8fd8ff"/><g font-family="Andika, sans-serif" font-weight="800" font-size="12" text-anchor="middle" fill="#3a2a50"><text x="14" y="42">c</text><text x="32" y="42">a</text><text x="50" y="42">t</text></g>`);
      case 'fireflies': return wrap([[16, 20], [40, 14], [28, 36], [50, 40], [14, 48]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="#fff49a" opacity=".25"/><circle cx="${x}" cy="${y}" r="4.5" fill="#fff49a"/>`).join(''));
      case 'plus': return wrap(`${[[14, 24], [26, 24], [20, 36]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="#9fd8ff"/>`).join('')}<path d="M32 30 h8 M36 26 v8" stroke="#fff" stroke-width="3" stroke-linecap="round"/>${[[48, 24], [48, 38]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="#c9a6ff"/>`).join('')}`);
      case 'minus': return wrap(`${[[14, 34], [26, 34], [38, 34]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="#9fd8ff"/>`).join('')}<circle cx="48" cy="18" r="6" fill="#9fd8ff" opacity=".5"/><path d="M44 28 l4 -4" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`);
      case 'shapes': return wrap(`<circle cx="18" cy="22" r="10" fill="#ff9fb8"/><rect x="34" y="12" width="20" height="20" rx="3" fill="#8fd8ff"/><path d="M14 54 L24 36 L34 54 Z" fill="#ffd36b"/><path d="M44 36 l3 7 7 .6 -5.4 4.6 1.7 7 -6.3 -3.8 -6.3 3.8 1.7 -7 -5.4 -4.6 7 -.6z" fill="#b6f0a0"/>`);
      default: return wrap('');
    }
  };

  /* ---------------- Shapes ---------------- */
  function poly(n, r, cx, cy, rot) {
    const pts = [];
    for (let i = 0; i < n; i++) { const a = (rot || -Math.PI / 2) + (i * 2 * Math.PI) / n; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
    return pts;
  }
  const SHAPE_PTS = {
    triangle: () => poly(3, 40, 50, 56),
    square: () => [[16, 16], [84, 16], [84, 84], [16, 84]],
    rectangle: () => [[6, 28], [94, 28], [94, 72], [6, 72]],
    pentagon: () => poly(5, 40, 50, 52),
    hexagon: () => poly(6, 40, 50, 50, 0),
    diamond: () => [[50, 6], [86, 50], [50, 94], [14, 50]],
  };
  Art.sides = { circle: 0, oval: 0, triangle: 3, square: 4, rectangle: 4, diamond: 4, pentagon: 5, hexagon: 6, star: 10, heart: 0 };
  Art.shapePoints = (name) => (SHAPE_PTS[name] ? SHAPE_PTS[name]() : null);

  Art.shape = function (name, color, opts) {
    opts = opts || {};
    const col = color || '#ffd36b', st = shade(col, -0.25);
    const s = `fill="${col}" stroke="${st}" stroke-width="3" stroke-linejoin="round"`;
    let inner = '';
    if (SHAPE_PTS[name]) inner = `<polygon points="${SHAPE_PTS[name]().map((p) => p.join(',')).join(' ')}" ${s}/>`;
    else if (name === 'circle') inner = `<circle cx="50" cy="50" r="40" ${s}/>`;
    else if (name === 'oval') inner = `<ellipse cx="50" cy="50" rx="44" ry="28" ${s}/>`;
    else if (name === 'star') {
      const pts = [];
      for (let i = 0; i < 10; i++) { const r = i % 2 ? 18 : 42; const a = -Math.PI / 2 + (i * Math.PI) / 5; pts.push([50 + r * Math.cos(a), 52 + r * Math.sin(a)]); }
      inner = `<polygon points="${pts.map((p) => p.join(',')).join(' ')}" ${s}/>`;
    } else if (name === 'heart') inner = `<path d="M50 86 C10 60 8 30 28 20 C40 14 50 24 50 32 C50 24 60 14 72 20 C92 30 90 60 50 86Z" ${s}/>`;
    else if (name === 'cube') inner = `<path d="M30 30 L62 30 L62 80 L30 80 Z" fill="${col}" stroke="${st}" stroke-width="3"/><path d="M30 30 L46 14 L80 14 L62 30 Z" fill="${shade(col, 0.15)}" stroke="${st}" stroke-width="3" stroke-linejoin="round"/><path d="M62 30 L80 14 L80 64 L62 80 Z" fill="${shade(col, -0.12)}" stroke="${st}" stroke-width="3" stroke-linejoin="round"/>`;
    else if (name === 'sphere') { const g = id('sph'); inner = `<defs><radialGradient id="${g}" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff"/><stop offset=".3" stop-color="${col}"/><stop offset="1" stop-color="${st}"/></radialGradient></defs><circle cx="50" cy="50" r="40" fill="url(#${g})"/><ellipse cx="50" cy="52" rx="40" ry="10" fill="none" stroke="${st}" stroke-width="1.5" stroke-dasharray="4 4" opacity=".6"/>`; }
    else if (name === 'cylinder') inner = `<path d="M24 24 V78 A26 9 0 0 0 76 78 V24" fill="${shade(col, -0.08)}" stroke="${st}" stroke-width="3"/><ellipse cx="50" cy="24" rx="26" ry="9" fill="${shade(col, 0.15)}" stroke="${st}" stroke-width="3"/>`;
    else if (name === 'cone') inner = `<path d="M50 8 L78 78 A28 9 0 0 1 22 78 Z" fill="${col}" stroke="${st}" stroke-width="3" stroke-linejoin="round"/><path d="M22 78 A28 9 0 0 0 78 78" fill="none" stroke="${st}" stroke-width="2" stroke-dasharray="4 4" opacity=".6"/>`;
    const sidesOverlay = opts.sidesHint && SHAPE_PTS[name] ? (() => {
      const p = SHAPE_PTS[name]();
      return p.map((a, i) => { const b = p[(i + 1) % p.length]; return `<line class="side-hint" style="animation-delay:${i * 0.7}s" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#ff4f8b" stroke-width="7" stroke-linecap="round"/>`; }).join('');
    })() : '';
    return `<svg class="shape-svg" viewBox="0 0 100 100" role="img" aria-label="${name}">${inner}${sidesOverlay}</svg>`;
  };

  /* ---------------- Counting things ---------------- */
  Art.thing = function (kind) {
    switch (kind) {
      case 'firefly': return `<svg viewBox="0 0 40 40" class="thing-svg" aria-hidden="true"><circle class="glow" cx="20" cy="22" r="16" fill="#fff49a" opacity=".22"/><ellipse cx="13" cy="15" rx="7" ry="4" transform="rotate(-30 13 15)" fill="#e8f3ff" opacity=".85"/><ellipse cx="27" cy="15" rx="7" ry="4" transform="rotate(30 27 15)" fill="#e8f3ff" opacity=".85"/><ellipse cx="20" cy="22" rx="6" ry="9" fill="#4a3f6b"/><circle class="bulb" cx="20" cy="27" r="5.5" fill="#fff07a"/><circle cx="20" cy="15" r="4" fill="#4a3f6b"/></svg>`;
      case 'orb': return Art.orb(40).replace('class="orb-svg"', 'class="thing-svg"');
      case 'acorn': return `<svg viewBox="0 0 40 40" class="thing-svg" aria-hidden="true"><path d="M10 18 Q20 8 30 18 Z" fill="#7a5236"/><path d="M12 18 Q12 34 20 36 Q28 34 28 18 Z" fill="#d99a5b"/><path d="M20 8 v-4" stroke="#5a3a24" stroke-width="3" stroke-linecap="round"/></svg>`;
      case 'mushroom': return `<svg viewBox="0 0 40 40" class="thing-svg" aria-hidden="true"><path d="M6 20 Q20 2 34 20 Z" fill="#ff6b7a"/><circle cx="15" cy="14" r="2.6" fill="#fff"/><circle cx="25" cy="12" r="2.2" fill="#fff"/><rect x="15" y="20" width="10" height="14" rx="4" fill="#fff4e0"/></svg>`;
      case 'berry': return `<svg viewBox="0 0 40 40" class="thing-svg" aria-hidden="true"><circle cx="20" cy="23" r="12" fill="#7a5cff"/><circle cx="16" cy="19" r="3" fill="#fff" opacity=".6"/><path d="M20 11 l-4 -5 M20 11 l5 -5" stroke="#3c9460" stroke-width="3" stroke-linecap="round"/></svg>`;
      case 'leaf': return `<svg viewBox="0 0 40 40" class="thing-svg" aria-hidden="true"><path d="M6 34 Q6 6 34 6 Q34 34 6 34 Z" fill="#5fcf8a"/><path d="M8 32 L30 10" stroke="#2f8a5a" stroke-width="2.4"/></svg>`;
      default: return '';
    }
  };

  /* ---------------- Story scenes ---------------- */
  const BG = {
    meadow: ['#8fd3ff', '#cdeeff', '#7cc576', '#5aae63', 'sun'],
    pond: ['#9ad8ff', '#d8f1ff', '#7cc576', '#5aae63', 'pond'],
    hill: ['#ffb38a', '#ffe3b8', '#6fae7d', '#4f8f63', 'bighill'],
    night: ['#1d1b4f', '#3b2f7a', '#2f6f68', '#24524f', 'moon'],
    rain: ['#7a8aa8', '#a9b6cc', '#5e9a72', '#4b8060', 'cloud'],
    stream: ['#9ad8ff', '#e0f5ff', '#7cc576', '#5aae63', 'stream'],
  };
  Art.scene = function (spec, opts) {
    opts = opts || {};
    const [s1, s2, h1, h2, feat] = BG[spec.bg] || BG.meadow;
    const g = id('sky');
    let svg = `<svg class="scene-svg" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s1}"/><stop offset="1" stop-color="${s2}"/></linearGradient></defs><rect width="400" height="260" fill="url(#${g})"/>`;
    if (feat === 'sun') svg += `<circle class="sun" cx="340" cy="50" r="26" fill="#ffe66b"/><circle cx="340" cy="50" r="40" fill="#ffe66b" opacity=".25"/>`;
    if (feat === 'moon' || spec.bg === 'night') {
      for (let i = 0; i < 24; i++) svg += `<circle class="tw" style="animation-delay:${(i % 7) * 0.4}s" cx="${(i * 97) % 400}" cy="${(i * 53) % 130}" r="${1 + (i % 3) * 0.7}" fill="#fff"/>`;
      svg += `<circle cx="330" cy="54" r="24" fill="#fff6d0"/><circle cx="340" cy="48" r="22" fill="${s1}"/>`;
    }
    if (feat === 'cloud') svg += `<g fill="#e6ecf6"><ellipse cx="110" cy="50" rx="60" ry="22"/><ellipse cx="150" cy="38" rx="40" ry="22"/><ellipse cx="290" cy="60" rx="70" ry="24"/></g>`;
    if (feat === 'bighill') svg += `<path d="M120 200 Q260 20 400 120 V260 H120Z" fill="${h1}"/>`;
    svg += `<path d="M0 180 Q100 140 200 170 T400 160 V260 H0Z" fill="${h1}"/><path d="M0 210 Q120 180 240 205 T400 200 V260 H0Z" fill="${h2}"/>`;
    if (feat === 'pond') svg += `<ellipse cx="300" cy="226" rx="90" ry="20" fill="#5ab6e6"/><ellipse cx="300" cy="222" rx="70" ry="12" fill="#8fd3ff" opacity=".6"/>`;
    if (feat === 'stream') svg += `<path d="M150 260 Q190 200 170 170 Q160 150 200 130 L250 130 Q215 150 225 170 Q245 205 230 260Z" fill="#5ab6e6"/>`;
    if (spec.fx === 'rain') for (let i = 0; i < 30; i++) svg += `<line class="rain" style="animation-delay:${(i % 10) * 0.1}s" x1="${(i * 41) % 400}" y1="${(i * 29) % 160}" x2="${((i * 41) % 400) - 4}" y2="${((i * 29) % 160) + 12}" stroke="#dfe9ff" stroke-width="2" stroke-linecap="round"/>`;
    if (spec.fx === 'wind') for (let i = 0; i < 4; i++) svg += `<path class="wind" style="animation-delay:${i * 0.5}s" d="M${20 + i * 30} ${60 + i * 28} q60 -16 120 0 t120 0" stroke="#ffffff" stroke-width="3" fill="none" opacity=".7" stroke-linecap="round"/>`;
    if (spec.fx === 'glow') svg += `<rect width="400" height="260" fill="#ffcf5c" opacity=".18" class="glowfx"/>`;
    svg += '</svg>';
    const cast = (spec.cast || []).map((c, i) => {
      const art = c.c === 'hoot' ? Art.hoot({}) : Art.companion(c.c, { mood: c.mood || 'happy', stage: opts.stage || 1 });
      return `<div class="scene-actor ${c.c === 'hoot' ? 'is-hoot' : ''} bob" style="left:${c.x}%;animation-delay:${i * 0.3}s">${art}</div>`;
    }).join('');
    const props = (spec.props || []).map((p) => `<div class="scene-prop ${p.fly ? 'flyaway' : ''} ${p.dim ? 'dim' : ''}" style="left:${p.x}%;top:${p.y}%;font-size:${(p.s || 24) / 10}em">${p.e}</div>`).join('');
    return `<div class="scene">${svg}${cast}${props}</div>`;
  };
})();
