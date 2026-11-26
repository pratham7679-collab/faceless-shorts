/* Dream Quest — reading quest types: phonics (sound match, rhyme, sight words, read & find)
 * and build (word builder). Content (words, pictures, sounds) comes from packs. */
(function () {
  'use strict';
  const DQ = window.DQ, U = DQ.util, h = U.h;

  const lex = () => DQ.Packs.data('lexicon') || [];
  const snd = (g) => (DQ.Packs.data('sounds') || {})[g] || g;
  const graphemes = (w) => (w.g ? w.g.split('|') : w.w.split(''));
  const inPool = (w, pool) => !pool || pool.some((t) => w.t.includes(t));

  /** Pick n-1 distractors whose key differs from the answer's and from each other. */
  function distinct(cands, key, answerKey, n, prefer) {
    const out = [], used = new Set([answerKey]);
    const order = (prefer || []).concat(U.shuffle(cands));
    for (const w of order) {
      const k = key(w);
      if (used.has(k)) continue;
      used.add(k); out.push(w);
      if (out.length >= n) break;
    }
    return out;
  }

  function letterCard(g, label) {
    return h('div', { class: 'letter-card pop-in', 'aria-label': label || ('letter ' + g) },
      h('span', { class: 'lc-big' }, g.length === 1 ? g.toUpperCase() : g), h('span', { class: 'lc-small' }, g));
  }

  DQ.Engines.phonics = {
    generate(p, ctx) {
      const n = ctx.support ? Math.max(2, p.choices - 1) : p.choices;
      const L = lex();
      if (p.mode === 'begin' || p.mode === 'end' || p.mode === 'vowel') {
        const pool = L.filter((w) => inPool(w, p.pool));
        const key = p.mode === 'begin' ? (w) => graphemes(w)[0]
          : p.mode === 'end' ? (w) => { const g = graphemes(w); return g[g.length - 1]; }
            : (w) => w.w[1];
        const target = U.pick(pool);
        const k = key(target);
        let prefer = [];
        if (p.similar) {
          const grp = (DQ.Packs.data('lookAlike') || []).find((g) => g.includes(k)) || [];
          prefer = U.shuffle(pool.filter((w) => grp.includes(key(w)) && key(w) !== k));
        }
        const others = distinct(pool.filter((w) => w !== target), key, k, n - 1, prefer);
        const ex = (DQ.Packs.data('examples') || {})[k];
        let prompt;
        if (p.mode === 'begin') prompt = `Which picture starts with ${snd(k)}? ${k.length === 1 ? k.toUpperCase() + ',' : ''} ${snd(k)}${ex ? ', like ' + ex : ''}.`;
        else if (p.mode === 'end') prompt = `Which picture ends with ${snd(k)}? Listen to the very end of each word.`;
        else prompt = `Which picture has the ${snd(k)}, in the middle?`;
        return {
          kind: 'pics', key: k, target, answer: target.w,
          options: U.shuffle([target].concat(others)),
          prompt,
          hint: `Say each name slowly. ${p.mode === 'begin' ? 'Listen to the first sound.' : p.mode === 'end' ? 'Listen to the last sound.' : 'Listen to the middle sound.'}`,
          visual: () => letterCard(k),
          speakOptions: true,
        };
      }
      if (p.mode === 'rhyme') {
        const fam = {};
        L.filter((w) => w.r).forEach((w) => (fam[w.r] = fam[w.r] || []).push(w));
        const fams = Object.keys(fam).filter((f) => fam[f].length >= 2);
        const f = U.pick(fams);
        const [target, answer] = U.sample(fam[f], 2);
        const others = distinct(L.filter((w) => w.r && w.r !== f), (w) => w.r, f, n - 1);
        return {
          kind: p.words ? 'words' : 'pics', target, answer: answer.w,
          options: U.shuffle([answer].concat(others)),
          prompt: `Which one rhymes with ${target.w}? ${target.w}.`,
          hint: `${target.w} ends with ${target.r}. Find the word that ends the same way.`,
          visual: () => h('div', { class: 'pic-card pop-in' }, h('span', { class: 'pic' }, target.p), h('span', { class: 'pic-word' }, target.w)),
          speakOptions: !p.words,
        };
      }
      if (p.mode === 'sight') {
        const lists = DQ.Packs.data('sightWords') || {};
        const list = lists[p.list] || [];
        const target = U.pick(list);
        const prefer = U.shuffle(list.filter((w) => w.w !== target.w && (w.w[0] === target.w[0] || w.w.length === target.w.length)));
        const others = distinct(list.filter((w) => w.w !== target.w), (w) => w.w, target.w, n - 1, prefer);
        return {
          kind: 'lanterns', target, answer: target.w,
          options: U.shuffle([target].concat(others)),
          prompt: `Find the word: ${target.w}. ${target.s} ... ${target.w}.`,
          hint: `${target.w} starts with the letter ${target.w[0].toUpperCase()}. Look for it.`,
          visual: () => h('div', { class: 'hoot-mini pop-in', html: DQ.Art.hoot({ lantern: true }) }),
          speakOptions: false,
        };
      }
      if (p.mode === 'decode') {
        const pool = L.filter((w) => inPool(w, p.pool));
        const target = U.pick(pool);
        let prefer = [];
        if (p.similar) prefer = U.shuffle(pool.filter((w) => w !== target && w.w.length === target.w.length && [...w.w].filter((c, i) => target.w[i] === c).length >= 1));
        const others = distinct(pool.filter((w) => w !== target), (w) => w.w, target.w, n - 1, prefer);
        return {
          kind: 'pics', target, answer: target.w,
          options: U.shuffle([target].concat(others)),
          prompt: 'Read the word by yourself. Which picture matches it?',
          hint: 'Touch each letter and say its sound. Then blend the sounds together.',
          hintFx: (stage) => U.$$('.dw-g', stage).forEach((el, i) => { el.style.animationDelay = i * 0.6 + 's'; el.classList.add('blend'); }),
          visual: () => h('div', { class: 'decode-word pop-in', 'aria-label': 'word to read' }, graphemes(target).map((g) => h('span', { class: 'dw-g' }, g))),
          speakOptions: false,
        };
      }
      throw new Error('unknown phonics mode ' + p.mode);
    },

    render(item, stage, api) {
      stage.appendChild(h('div', { class: 'q-visual' }, item.visual()));
      api.prompt(item.prompt);
      return api.choose({
        layout: item.kind,
        answer: item.answer,
        hint: item.hint,
        onHint: item.hintFx ? () => item.hintFx(stage) : null,
        options: item.options.map((w) => ({
          value: w.w,
          aria: item.kind === 'pics' ? 'picture' : w.w,
          html: item.kind === 'pics' ? `<span class="pic">${w.p}</span>` : item.kind === 'lanterns' ? `${DQ.Art.lantern(true)}<span class="lan-word">${U.esc(w.w)}</span>` : `<span class="opt-word">${U.esc(w.w)}</span>`,
          speak: item.speakOptions ? w.w : null,
        })),
      });
    },
  };

  /* ---------------- Word Builder ---------------- */
  const EXTRA = 'bdfglmnprstw'.split('');

  DQ.Engines.build = {
    generate(p, ctx) {
      const pool = lex().filter((w) => inPool(w, p.pool));
      const target = U.pick(pool);
      const gs = graphemes(target);
      const extras = ctx.support ? 0 : p.extras;
      const extraTiles = U.sample(EXTRA.filter((c) => !gs.includes(c)), extras);
      return { target, gs, silentE: target.t.includes('silente'), tiles: U.shuffle(gs.concat(extraTiles).map((g, i) => ({ g, k: i }))) };
    },

    render(item, stage, api) {
      const { target, gs } = item;
      let pos = 0, mistakes = 0, slotMisses = 0;
      const slots = gs.map(() => h('div', { class: 'slot' }));
      const hear = h('button', { class: 'chip-btn', type: 'button', 'aria-label': 'Hear the word', html: DQ.Art.speaker() + '<span>Hear it</span>', onclick: () => api.say(target.w) });
      stage.appendChild(h('div', { class: 'q-visual build-top' },
        h('div', { class: 'pic-card pop-in' }, h('span', { class: 'pic' }, target.p)), hear));
      stage.appendChild(h('div', { class: 'slots' }, slots));
      const tray = h('div', { class: 'tiles' });
      stage.appendChild(tray);
      api.prompt(`Let's build the word ${target.w}. ${target.w}! Tap the letter stones in order.`);
      const soundOf = (g, i) => (item.silentE && i === gs.length - 1 && g === 'e' ? 'magic e! It stays quiet and helps the vowel say its name' : snd(g));

      return new Promise((resolve) => {
        item.tiles.forEach((t) => {
          const b = h('button', { class: 'tile', type: 'button', 'aria-label': 'letter ' + t.g }, t.g);
          b.addEventListener('click', () => {
            if (b.disabled) return;
            if (t.g === gs[pos]) {
              DQ.Sfx.play('count');
              b.disabled = true; b.classList.add('used');
              slots[pos].textContent = t.g; slots[pos].classList.add('filled', 'pop-in');
              api.say(soundOf(t.g, pos), { caption: false });
              pos++; slotMisses = 0;
              U.$$('.tile.glow', tray).forEach((x) => x.classList.remove('glow'));
              if (pos === gs.length) {
                stage.querySelector('.slots').classList.add('done');
                api.right(stage.querySelector('.slots'));
                setTimeout(() => api.say(`${gs.join(' ')}... ${target.w}!`).then(() => resolve(mistakes === 0)), 300);
              }
            } else {
              mistakes++; slotMisses++;
              DQ.Sfx.play('soft');
              b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
              api.think();
              if (slotMisses === 1) api.say(`Listen... ${target.w}. The next sound is ${soundOf(gs[pos], pos)}.`);
              else {
                const right = U.$$('.tile', tray).find((x) => !x.disabled && x.textContent === gs[pos]);
                if (right) right.classList.add('glow');
                api.say('Here it is. Tap the glowing stone.');
              }
            }
          });
          tray.appendChild(b);
        });
      });
    },
  };
})();
