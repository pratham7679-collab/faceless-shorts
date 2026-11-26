/* Dream Quest — story quest type: a read-aloud picture book with word-by-word highlighting,
 * followed by comprehension questions whose kind (who / what / where / sequence / why /
 * feelings / inference / prediction) follows the child's story.listen level. */
(function () {
  'use strict';
  const DQ = window.DQ, U = DQ.util, h = U.h;

  const Story = (DQ.Story = {
    all() { return DQ.Packs.data('stories') || []; },
    get(id) { return Story.all().find((s) => s.id === id); },
    /** Story tiers the child's current level allows (plus anything below). */
    maxTier(p) {
      const s = DQ.Skills.state(p, 'story.listen');
      const lv = DQ.Skills.level('story.listen', s.level);
      return Math.max.apply(null, lv.params.tiers);
    },
    isOpen(p, st) { return st.tier <= Story.maxTier(p); },
    /** Hoot's pick: an unread story at the child's level, else any open one. */
    pick(p) {
      const s = DQ.Skills.state(p, 'story.listen');
      const tiers = DQ.Skills.level('story.listen', s.level).params.tiers;
      const read = p.rewards.storiesRead;
      const fit = Story.all().filter((st) => tiers.includes(st.tier));
      return fit.find((st) => !read.includes(st.id)) || U.pick(fit) || Story.all()[0];
    },

    /** Read a story aloud. Resolves when the child reaches the end (true) or leaves (false). */
    read(story, host, opts) {
      opts = opts || {};
      return new Promise((resolve) => {
        let page = 0, alive = true;
        DQ.UI.hideCaption();
        const root = h('div', { class: 'reader' });
        host.innerHTML = '';
        host.appendChild(root);
        const top = h('div', { class: 'reader-top' },
          h('button', { class: 'round-btn', type: 'button', 'aria-label': 'Back to Dream Valley', html: DQ.Art.home(), onclick: () => { alive = false; DQ.Voice.stop(); resolve(false); } }),
          h('div', { class: 'reader-title' }, story.title),
          h('button', { class: 'round-btn', type: 'button', 'aria-label': 'Read this page again', html: DQ.Art.speaker(), onclick: () => readPage() }));
        const sceneBox = h('div', { class: 'reader-scene' });
        const textBox = h('p', { class: 'reader-text' });
        const prev = h('button', { class: 'nav-btn', type: 'button', 'aria-label': 'Previous page', html: DQ.Art.arrow('left'), onclick: () => go(-1) });
        const next = h('button', { class: 'nav-btn next', type: 'button', 'aria-label': 'Next page', html: DQ.Art.arrow('right'), onclick: () => go(1) });
        const dots = h('div', { class: 'page-dots' }, story.pages.map(() => h('i')));
        root.append(top, sceneBox, textBox, h('div', { class: 'reader-nav' }, prev, dots, next));

        function words(text) {
          textBox.innerHTML = '';
          const re = /\S+/g; let m;
          while ((m = re.exec(text))) textBox.appendChild(h('span', { class: 'rw', 'data-i': m.index }, m[0])), textBox.appendChild(document.createTextNode(' '));
        }
        function mark(ci) {
          const spans = U.$$('.rw', textBox);
          let cur = null;
          for (const s of spans) if (+s.dataset.i <= ci) cur = s;
          spans.forEach((s) => s.classList.toggle('on', s === cur));
          spans.forEach((s) => s.classList.toggle('read', +s.dataset.i < (cur ? +cur.dataset.i : 0)));
        }
        let fallback = null;
        function readPage() {
          if (!alive) return;
          const text = story.pages[page].text;
          words(text);
          next.classList.remove('pulse');
          let gotBoundary = false;
          clearInterval(fallback);
          // If the voice engine gives no word events, sweep the highlight at reading pace.
          const spans = U.$$('.rw', textBox);
          let k = 0;
          const pace = 380 / (DQ.Store.settings.rate || 0.85);
          fallback = setInterval(() => { if (gotBoundary || k >= spans.length) return clearInterval(fallback); mark(+spans[k++].dataset.i); }, pace);
          DQ.Voice.say(text, { caption: false, onWord: (ci) => { gotBoundary = true; mark(ci); } }).then((fin) => {
            clearInterval(fallback);
            if (!alive || !fin) return;
            U.$$('.rw', textBox).forEach((s) => { s.classList.remove('on'); s.classList.add('read'); });
            next.classList.add('pulse');
          });
        }
        function show() {
          sceneBox.innerHTML = DQ.Art.scene(story.pages[page].scene, { stage: opts.stage });
          U.$$('i', dots).forEach((d, i) => d.classList.toggle('on', i <= page));
          prev.disabled = page === 0;
          next.setAttribute('aria-label', page === story.pages.length - 1 ? 'Answer Hoot\'s questions' : 'Next page');
          readPage();
        }
        function go(d) {
          DQ.Sfx.play('tap');
          if (page + d >= story.pages.length) { alive = false; clearInterval(fallback); DQ.Voice.stop(); resolve(true); return; }
          page = Math.max(0, page + d);
          show();
        }
        show();
      });
    },
  });

  DQ.Engines.story = {
    generate(p, ctx) {
      const st = ctx.story;
      ctx.asked = ctx.asked || [];
      let qs = st.questions.filter((q) => p.types.includes(q.type) && !ctx.asked.includes(q));
      if (!qs.length) qs = st.questions.filter((q) => !ctx.asked.includes(q));
      if (!qs.length) qs = st.questions;
      const q = U.pick(qs);
      ctx.asked.push(q);
      const d = ctx.support ? q.d.slice(0, 1) : q.d;
      return { q, answer: q.a, options: U.shuffle([q.a].concat(d)) };
    },
    render(item, stage, api) {
      stage.appendChild(h('div', { class: 'q-visual story-q' },
        h('div', { class: 'hoot-mini pop-in', html: DQ.Art.hoot({}) }),
        h('div', { class: 'q-text' }, item.q.q)));
      const opts = item.options;
      api.prompt(`${item.q.q} ... Is it: ${opts.slice(0, -1).join('? ... ')}? ... or ${opts[opts.length - 1]}?`);
      return api.choose({
        layout: 'sentences', answer: item.answer, hint: item.q.hint,
        options: opts.map((o) => ({ value: o, aria: o, html: `<span class="opt-sentence">${U.esc(U.cap(o))}</span>`, speak: o })),
      });
    },
  };
})();
