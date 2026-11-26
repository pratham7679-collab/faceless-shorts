/* Dream Quest — math quest types: count (fireflies, ten-frames, tens & ones, next number,
 * skip counting), math (adding / taking away with pictures or numbers), shapes. */
(function () {
  'use strict';
  const DQ = window.DQ, U = DQ.util, h = U.h;
  const thingName = { firefly: 'fireflies', orb: 'Dream Orbs', acorn: 'acorns', mushroom: 'mushrooms', berry: 'berries', leaf: 'leaves' };
  const things = () => DQ.Packs.data('things') || ['firefly'];

  function numberOptions(item) {
    return item.choices.map((n) => ({ value: n, aria: String(n), html: `<span class="opt-num">${n}</span>`, speak: null }));
  }

  /* ---------------- Count ---------------- */
  DQ.Engines.count = {
    generate(p, ctx) {
      const n = p.choices;
      const choices = ctx.support ? Math.max(2, n - 1) : n;
      if (p.mode === 'next') {
        const start = U.between(p.min, p.max - 4);
        const seq = [start, start + 1, start + 2];
        const ans = start + 3;
        return { mode: 'next', seq, answer: ans, choices: U.numberChoices(ans, choices, 2), prompt: `${seq.join(', ')}... What number comes next?`, hint: `Count up with me: ${seq.join(', ')}...` };
      }
      if (p.mode === 'skip') {
        const step = U.pick(p.steps);
        const start = step * U.between(1, 3);
        const seq = [0, 1, 2, 3].map((i) => start + i * step);
        const ans = start + 4 * step;
        const ch = new Set([ans]);
        [ans + 1, ans - 1, ans + step, ans - step + 1].forEach((v) => ch.size < choices && v > 0 && ch.add(v));
        return { mode: 'skip', step, seq, answer: ans, choices: U.shuffle(Array.from(ch)), prompt: `Count by ${step}s. ${seq.join(', ')}... What comes next?`, hint: `Add ${step} more each time.` };
      }
      const max = ctx.support ? Math.max(p.min, p.max - 3) : p.max;
      const ans = U.between(p.min, max);
      const thing = p.mode === 'tens' ? 'firefly' : U.pick(things());
      const base = { mode: p.mode, thing, answer: ans, choices: U.numberChoices(ans, choices, p.mode === 'count' ? 2 : 3) };
      if (p.mode === 'frame') return Object.assign(base, { prompt: `How many ${thingName[thing]}? A full frame holds ten.`, hint: 'The full frame is ten. Count on from ten: eleven, twelve…' });
      if (p.mode === 'tens') return Object.assign(base, { prompt: 'Each jar holds ten fireflies. How many fireflies in all?', hint: 'Count the jars by tens, ten, twenty, thirty… then count on the loose ones.' });
      return Object.assign(base, { prompt: `How many ${thingName[thing]}? Tap each one to count it.`, hint: 'Tap each one, slowly, and count out loud.' });
    },

    render(item, stage, api) {
      const vis = h('div', { class: 'q-visual count-field' });
      stage.appendChild(vis);
      if (item.mode === 'next' || item.mode === 'skip') {
        const row = h('div', { class: 'stones' }, item.seq.map((n, i) => h('div', { class: 'stone pop-in', style: { animationDelay: i * 0.15 + 's' } }, n)), h('div', { class: 'stone q pop-in', style: { animationDelay: '0.6s' } }, '?'));
        vis.appendChild(row);
      } else if (item.mode === 'count') {
        let counted = 0;
        const n = item.answer;
        const cols = Math.ceil(Math.sqrt(n * 1.6));
        const rows = Math.ceil(n / cols);
        const cells = U.shuffle(Array.from({ length: cols * rows }, (_, i) => i)).slice(0, n);
        const field = h('div', { class: 'scatter', style: { gridTemplateColumns: `repeat(${cols}, 1fr)` } });
        for (let i = 0; i < cols * rows; i++) {
          if (!cells.includes(i)) { field.appendChild(h('div', { class: 'cell' })); continue; }
          const b = h('button', { class: 'thing tap-count drift', type: 'button', 'aria-label': 'count me', style: { animationDelay: (i % 5) * 0.4 + 's' }, html: DQ.Art.thing(item.thing) });
          b.addEventListener('click', () => {
            if (b.classList.contains('counted')) return;
            counted++;
            b.classList.add('counted');
            b.appendChild(h('span', { class: 'count-badge' }, counted));
            DQ.Sfx.play('count');
            api.say(String(counted), { caption: false });
          });
          field.appendChild(h('div', { class: 'cell' }, b));
        }
        vis.appendChild(field);
      } else if (item.mode === 'frame') {
        const n = item.answer;
        const frames = [0, 1].map((f) => h('div', { class: 'ten-frame' }, Array.from({ length: 10 }, (_, i) => {
          const idx = f * 10 + i;
          return h('div', { class: 'tf-cell' }, idx < n ? h('span', { class: 'tf-thing pop-in', style: { animationDelay: idx * 0.05 + 's' }, html: DQ.Art.thing(item.thing) }) : null);
        })));
        vis.appendChild(h('div', { class: 'frames' }, frames));
      } else if (item.mode === 'tens') {
        const tens = Math.floor(item.answer / 10), ones = item.answer % 10;
        const jars = Array.from({ length: tens }, (_, j) => h('div', { class: 'jar pop-in', style: { animationDelay: j * 0.12 + 's' } }, Array.from({ length: 10 }, () => h('span', { class: 'jar-fly' })), h('span', { class: 'jar-label' }, '10')));
        const loose = h('div', { class: 'loose' }, Array.from({ length: ones }, (_, i) => h('span', { class: 'thing-sm pop-in', style: { animationDelay: 0.4 + i * 0.08 + 's' }, html: DQ.Art.thing('firefly') })));
        vis.appendChild(h('div', { class: 'tens-row' }, jars, loose));
      }
      api.prompt(item.prompt);
      return api.choose({ layout: 'nums', answer: item.answer, hint: item.hint, options: numberOptions(item) });
    },
  };

  /* ---------------- Add / take away ---------------- */
  DQ.Engines.math = {
    generate(p, ctx) {
      const choices = ctx.support ? Math.max(2, p.choices - 1) : p.choices;
      let a, b, ans, show, say, hint;
      const plus = p.op === '+';
      if (p.missing) {
        if (plus) { const c = U.between(3, p.max); a = U.between(1, c - 1); ans = c - a; show = [a, '+', '?', '=', c]; say = `${a} plus what number makes ${c}?`; hint = `Start at ${a} and count up to ${c}. How many steps did you take?`; }
        else { a = U.between(3, p.max); const c = U.between(0, a - 1); ans = a - c; show = [a, '−', '?', '=', c]; say = `${a} take away what number leaves ${c}?`; hint = `Start at ${c} and count up to ${a}. How many steps?`; }
      } else if (p.twoDigit) {
        do { a = U.between(11, p.max); } while (plus ? a % 10 === 9 : a % 10 === 0);
        b = plus ? U.between(1, 9 - (a % 10)) : U.between(1, a % 10);
        ans = plus ? a + b : a - b;
        show = [a, plus ? '+' : '−', b, '=', '?'];
        say = plus ? `What is ${a} plus ${b}?` : `What is ${a} take away ${b}?`;
        hint = plus ? `Keep the tens. Add the ones: ${a % 10} plus ${b}.` : `Keep the tens. Take away from the ones: ${a % 10} take away ${b}.`;
      } else {
        if (plus) { a = U.between(1, p.max - 1); b = U.between(1, p.max - a); ans = a + b; }
        else { a = U.between(2, p.max); b = U.between(1, a - 1 > 0 ? a - 1 : 1); ans = a - b; }
        show = [a, plus ? '+' : '−', b, '=', '?'];
        const tn = thingName.orb;
        if (p.pictures) say = plus ? `${a} ${a === 1 ? 'Dream Orb' : tn}, and ${b} more. How many altogether?` : `${a} ${a === 1 ? 'Dream Orb' : tn}. ${b} float away. How many are left?`;
        else say = plus ? `What is ${a} plus ${b}?` : `What is ${a} take away ${b}?`;
        hint = plus ? `Start at the bigger number, then count on ${Math.min(a, b)} more.` : `Start at ${a} and count back ${b}.`;
      }
      return { plus, a, b, ans, show, say, hint, pictures: !!p.pictures, dots: !!ctx.support && !p.twoDigit, choices: U.numberChoices(ans, choices, 2), answer: ans };
    },

    render(item, stage, api) {
      const vis = h('div', { class: 'q-visual math-vis' });
      stage.appendChild(vis);
      if (item.pictures) {
        const grp = (n, cls) => h('div', { class: 'grp ' + (cls || '') }, Array.from({ length: n }, (_, i) => h('span', { class: 'thing-sm pop-in', style: { animationDelay: i * 0.06 + 's' }, html: DQ.Art.orb(40) })));
        if (item.plus) vis.appendChild(h('div', { class: 'grp-row' }, grp(item.a), h('span', { class: 'op' }, '+'), grp(item.b, 'tint')));
        else {
          const g = grp(item.a);
          vis.appendChild(h('div', { class: 'grp-row' }, g));
          setTimeout(() => { U.$$('.thing-sm', g).slice(-item.b).forEach((el, i) => { el.style.animationDelay = i * 0.12 + 's'; el.classList.add('float-away'); }); }, 1400);
        }
      }
      const eq = h('div', { class: 'equation pop-in' }, item.show.map((t) => h('span', { class: t === '?' ? 'eq-q' : typeof t === 'number' ? 'eq-n' : 'eq-op' }, t)));
      vis.appendChild(eq);
      if (item.dots) {
        const dots = (n) => h('div', { class: 'dots' }, Array.from({ length: n }, () => h('i')));
        vis.appendChild(h('div', { class: 'dot-help' }, item.show.map((t) => (typeof t === 'number' ? dots(t) : h('span', { class: 'dot-gap' })))));
      }
      api.prompt(item.say);
      return api.choose({ layout: 'nums', answer: item.answer, hint: item.hint, options: numberOptions(item) });
    },
  };

  /* ---------------- Shapes ---------------- */
  const DESCR = {
    triangle: 'A triangle has 3 sides and 3 corners.', square: 'A square has 4 sides, all the same length.',
    rectangle: 'A rectangle has 2 long sides and 2 short sides.', circle: 'A circle is round, with no corners.',
    oval: 'An oval is like a stretched circle, an egg shape.', star: 'A star has 5 points.', heart: 'A heart is the shape of love.',
    diamond: 'A diamond has 4 sides and stands on a corner.', pentagon: 'A pentagon has 5 sides.', hexagon: 'A hexagon has 6 sides, like a honeycomb.',
    cube: 'A cube has flat square faces, like a dice.', sphere: 'A sphere is round all over, like a ball.',
    cone: 'A cone is round at the bottom and pointy at the top.', cylinder: 'A cylinder is round at both ends, like a can.',
  };
  const COLORS = ['#ffd36b', '#ff9fb8', '#8fd8ff', '#b6f0a0', '#c9a6ff', '#ffb38a'];
  const article = (w) => (/^[aeiou]/.test(w) ? 'an ' : 'a ') + w;

  DQ.Engines.shapes = {
    generate(p, ctx) {
      const n = ctx.support ? Math.max(2, p.choices - 1) : p.choices;
      const set = p.set;
      if (p.mode === 'sides') {
        const t = U.pick(set);
        const s = DQ.Art.sides[t];
        return { mode: 'sides', target: t, answer: s, choices: U.numberChoices(s, n, 1), prompt: `How many sides does this ${t} have? Count them.`, hint: 'Count each side with me. The pink line shows you where.' };
      }
      if (p.mode === 'real') {
        const r = U.pick(DQ.Packs.data('realWorld3d') || []);
        const others = U.sample(set.filter((s) => s !== r.shape), n - 1);
        return { mode: 'real', thing: r, answer: r.shape, options: U.shuffle([r.shape].concat(others)), labels: true, prompt: `What shape is ${r.thing}?`, hint: DESCR[r.shape] };
      }
      let t = U.pick(set), prompt;
      let pool = set;
      if (p.mode === 'which') {
        const sides = DQ.Art.sides[t];
        pool = set.filter((s) => DQ.Art.sides[s] !== sides);
        prompt = sides ? `Which shape has ${sides} sides?` : 'Which shape has no corners at all?';
      } else prompt = `Find the ${t}.`;
      const others = U.sample(pool.filter((s) => s !== t), n - 1);
      return { mode: p.mode, answer: t, options: U.shuffle([t].concat(others)), labels: p.mode === 'solid', prompt, hint: DESCR[t] };
    },

    render(item, stage, api) {
      const vis = h('div', { class: 'q-visual' });
      stage.appendChild(vis);
      if (item.mode === 'sides') {
        const big = h('div', { class: 'shape-big pop-in', html: DQ.Art.shape(item.target, U.pick(COLORS)) });
        vis.appendChild(big);
        api.prompt(item.prompt);
        return api.choose({
          layout: 'nums', answer: item.answer, hint: item.hint,
          onHint: () => { big.innerHTML = DQ.Art.shape(item.target, '#ffd36b', { sidesHint: true }); },
          options: item.choices.map((n) => ({ value: n, aria: String(n), html: `<span class="opt-num">${n}</span>` })),
        });
      }
      if (item.mode === 'real') vis.appendChild(h('div', { class: 'pic-card pop-in' }, h('span', { class: 'pic' }, item.thing.p)));
      else vis.appendChild(h('div', { class: 'hoot-mini pop-in', html: DQ.Art.hoot({}) }));
      api.prompt(item.prompt);
      const colors = U.shuffle(COLORS);
      return api.choose({
        layout: 'shapes', answer: item.answer, hint: item.hint,
        options: item.options.map((s, i) => ({ value: s, aria: s, speak: item.labels ? s : null, html: DQ.Art.shape(s, colors[i % colors.length]) + (item.labels ? `<span class="shape-label">${s}</span>` : '') })),
      });
    },
  };
  DQ.Engines.shapes.describe = DESCR;
  DQ.Engines.shapes.article = article;
})();
