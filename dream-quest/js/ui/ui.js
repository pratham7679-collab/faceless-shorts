/* Dream Quest — UI shell: router, narrator caption, sparkle bursts, cast (Hoot + buddy),
 * and the quest runner that every quest type plugs into. */
(function () {
  'use strict';
  const DQ = window.DQ, U = DQ.util, h = U.h;

  const UI = (DQ.UI = { screens: {}, current: null });

  /* ---------- router ---------- */
  UI.go = function (name, args) {
    DQ.Voice.stop();
    const root = U.$('#screen');
    root.innerHTML = '';
    root.className = 'screen screen-' + name;
    UI.current = name;
    root.scrollTop = 0;
    window.scrollTo(0, 0);
    const fn = UI.screens[name];
    if (!fn) throw new Error('No screen ' + name);
    fn(root, args || {});
  };

  /* ---------- narrator caption ---------- */
  let capTimer = null;
  UI.caption = function (text) {
    const c = U.$('#caption');
    if (!c) return;
    clearTimeout(capTimer);
    c.classList.remove('gone');
    U.$('.cap-text', c).textContent = text;
    c.hidden = false;
    c.classList.add('speaking');
  };
  UI.captionDone = function () {
    const c = U.$('#caption');
    if (!c) return;
    c.classList.remove('speaking');
    clearTimeout(capTimer);
    // Let the words linger long enough to read, then clear the screen for little fingers.
    capTimer = setTimeout(() => c.classList.add('gone'), 3500);
  };
  UI.hideCaption = function () { const c = U.$('#caption'); if (c) c.hidden = true; };

  /* ---------- sparkles ---------- */
  UI.burst = function (el, opts) {
    opts = opts || {};
    if (!el || U.reducedMotion()) return;
    const fx = U.$('#fx');
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const n = opts.n || 14;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.4;
      const d = 60 + Math.random() * 70;
      const s = h('span', { class: 'spark ' + (i % 3 === 0 ? 'orbish' : ''), style: { left: cx + 'px', top: cy + 'px', '--dx': Math.cos(a) * d + 'px', '--dy': Math.sin(a) * d + 'px' } });
      if (i % 3 === 0) s.innerHTML = DQ.Art.orb(18);
      fx.appendChild(s);
      setTimeout(() => s.remove(), 1000);
    }
  };
  UI.flyOrb = function (fromEl, toEl) {
    if (!fromEl || !toEl || U.reducedMotion()) return;
    const a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
    const o = h('span', { class: 'fly-orb', html: DQ.Art.orb(30), style: { left: a.left + a.width / 2 + 'px', top: a.top + a.height / 2 + 'px', '--tx': b.left + b.width / 2 - (a.left + a.width / 2) + 'px', '--ty': b.top + b.height / 2 - (a.top + a.height / 2) + 'px' } });
    U.$('#fx').appendChild(o);
    setTimeout(() => { o.remove(); toEl.classList.remove('bump'); void toEl.offsetWidth; toEl.classList.add('bump'); DQ.Sfx.play('orb'); }, 800);
  };

  /* ---------- cast: Hoot + buddy that react ---------- */
  UI.cast = function (p, opts) {
    opts = opts || {};
    const stage = DQ.Bands.current(p).companionStage || 1;
    const hoot = h('div', { class: 'cast-member cast-hoot', html: DQ.Art.hoot({}) });
    const buddy = h('div', { class: 'cast-member cast-buddy', html: DQ.Art.companion(p.buddy, { stage }) });
    const el = h('div', { class: 'cast ' + (opts.cls || '') }, hoot, buddy);
    const play = (who, cls, ms) => { who.classList.remove('dance', 'hop', 'spin', 'wink', 'think', 'cheer'); void who.offsetWidth; who.classList.add(cls); setTimeout(() => who.classList.remove(cls), ms || 1400); };
    return {
      el,
      cheer() { play(buddy, U.pick(['dance', 'hop', 'spin', 'wink'])); play(hoot, 'cheer', 1200); },
      think() { play(buddy, 'think', 1600); },
      dance() { play(buddy, 'dance', 2400); play(hoot, 'cheer', 2400); },
    };
  };

  UI.topbar = function (p, opts) {
    opts = opts || {};
    const stage = DQ.Bands.current(p).companionStage || 1;
    const orbs = h('div', { class: 'counter orbs', 'aria-label': p.rewards.orbs + ' Dream Orbs' }, h('span', { html: DQ.Art.orb(30) }), h('b', {}, p.rewards.orbs));
    const lans = h('div', { class: 'counter lans', 'aria-label': p.rewards.lanterns.length + ' Dream Lanterns' }, h('span', { class: 'mini-lantern', html: DQ.Art.lantern(true) }), h('b', {}, p.rewards.lanterns.length));
    const bar = h('header', { class: 'topbar' },
      opts.back ? h('button', { class: 'round-btn', type: 'button', 'aria-label': 'Back to Dream Valley', html: DQ.Art.home(), onclick: () => UI.go('valley') }) :
        h('div', { class: 'hero-chip' }, h('span', { class: 'hero-face', html: DQ.Art.companion(p.buddy, { stage }) }), h('span', { class: 'hero-name' }, p.heroName)),
      h('div', { class: 'counters' }, orbs, lans),
      h('button', { class: 'round-btn grownup', type: 'button', 'aria-label': 'Grown-ups only: Parent Zone', html: DQ.Art.lock(), onclick: () => UI.go('parent') }));
    bar.orbs = orbs;
    return bar;
  };

  /* ---------- quest runner ---------- */
  const PRAISE = ['Yes! You got it!', 'Wonderful!', "Hoo-ray! That's right!", 'Brilliant thinking!', 'You did it!', 'Super work!', 'Perfect!'];
  const PRAISE_HELPED = ['There you go! Nice work.', 'You figured it out!', 'Yes! Great trying.', "That's it! Well done."];
  const GENTLE = ["Hmm, not that one. Let's try again.", "Good try! Here's a clue.", 'Almost! Listen again.'];

  UI.runQuest = async function (root, skillId, opts) {
    opts = opts || {};
    const p = DQ.Store.player();
    const def = DQ.Skills.def(skillId);
    const eng = DQ.Engines[def.engine];
    const band = DQ.Bands.current(p);
    const startEvents = DQ.Skills.beginQuest(p, skillId);
    DQ.Store.save();
    const ctx = { player: p };

    if (def.engine === 'story') {
      ctx.story = opts.story || DQ.Story.pick(p);
      const finished = await DQ.Story.read(ctx.story, root, { stage: band.companionStage });
      if (!finished) return UI.go('valley');
      root.innerHTML = '';
    }

    const N = def.items || DQ.Bands.flag(p, 'questLength') || 5;
    const paws = Array.from({ length: N }, () => h('span', { class: 'qp', html: DQ.Art.paw() }));
    const orbCount = h('div', { class: 'counter orbs small' }, h('span', { html: DQ.Art.orb(24) }), h('b', {}, '0'));
    let earned = 0;
    let alive = true;
    const header = h('header', { class: 'quest-head' },
      h('button', { class: 'round-btn', type: 'button', 'aria-label': 'Back to Dream Valley', html: DQ.Art.home(), onclick: () => { alive = false; UI.go('valley'); } }),
      h('div', { class: 'quest-paws', 'aria-label': 'quest progress' }, paws),
      orbCount,
      h('button', { class: 'round-btn', type: 'button', 'aria-label': 'Say it again', html: DQ.Art.speaker(), onclick: () => repeat() }));
    const title = h('div', { class: 'quest-title' }, h('span', { class: 'qt-icon', html: DQ.Art.skillIcon(def.art) }), def.name);
    const stage = h('div', { class: 'quest-stage' });
    const cast = UI.cast(p);
    const banner = h('div', { class: 'quest-banner', hidden: true });
    root.append(header, title, stage, banner, cast.el);

    let promptText = '';
    const repeat = () => promptText && DQ.Voice.say(promptText);

    const api = {
      say: (t, o) => DQ.Voice.say(t, o),
      prompt(t) { promptText = t; return DQ.Store.settings.autoRead === false ? Promise.resolve() : DQ.Voice.say(t); },
      think: () => cast.think(),
      right(el) { DQ.Sfx.play('right'); UI.burst(el); cast.cheer(); },
      choose(o) {
        return new Promise((resolve) => {
          let attempts = 0;
          const wrap = h('div', { class: 'answers layout-' + (o.layout || 'pics') + ' n' + o.options.length });
          const buttons = o.options.map((opt, i) => {
            const b = h('button', { class: 'answer pop-in', type: 'button', 'aria-label': opt.aria || String(opt.value), style: { animationDelay: 0.1 + i * 0.08 + 's' }, html: opt.html });
            b._value = opt.value;
            if (opt.speak) {
              const s = h('span', { class: 'say-it', role: 'button', tabindex: '0', 'aria-label': 'Hear it', html: DQ.Art.speaker() });
              const speak = (e) => { e.stopPropagation(); e.preventDefault(); DQ.Voice.say(opt.speak); };
              s.addEventListener('click', speak);
              s.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') speak(e); });
              b.appendChild(s);
            }
            b.addEventListener('click', () => pickIt(b));
            return b;
          });
          wrap.append(...buttons);
          stage.appendChild(wrap);
          const correctBtn = buttons.find((b) => String(b._value) === String(o.answer));

          function pickIt(b) {
            if (b.disabled || !alive) return;
            DQ.Sfx.play('tap');
            if (b === correctBtn) {
              buttons.forEach((x) => (x.disabled = true));
              b.classList.add('right');
              api.right(b);
              if (attempts === 0) { earned += 2; UI.flyOrb(b, orbCount); } else earned += 1;
              setTimeout(() => (U.$('b', orbCount).textContent = earned), 820);
              DQ.Voice.say(U.pick(attempts === 0 ? PRAISE : PRAISE_HELPED)).then(() => setTimeout(() => resolve(attempts === 0), 250));
            } else {
              attempts++;
              b.disabled = true;
              b.classList.add('wrong');
              DQ.Sfx.play('soft');
              cast.think();
              if (attempts === 1) {
                DQ.Voice.say(U.pick(GENTLE) + ' ' + (o.hint || ''));
                o.onHint && o.onHint();
              } else {
                correctBtn.classList.add('glow');
                DQ.Voice.say('Here it is. Tap the glowing one.');
              }
            }
          }
        });
      },
    };

    // Opening line: retry note, support note or the quest intro.
    const s = DQ.Skills.state(p, skillId);
    if (startEvents.some((e) => e.type === 'retry')) await showBanner(`Let's try the trickier ${def.name} again!`, 'levelup');
    else if (s.quests === 1 && def.intro) await DQ.Voice.say(def.intro);

    const results = [], events = startEvents.slice();
    let lastLevel = s.level;
    for (let i = 0; i < N && alive; i++) {
      const level = DQ.Skills.pickLevel(p, skillId, i);
      const lv = DQ.Skills.level(skillId, level);
      ctx.support = DQ.Skills.state(p, skillId).support;
      ctx.level = level;
      const item = eng.generate(lv.params, ctx);
      stage.innerHTML = '';
      stage.classList.remove('enter'); void stage.offsetWidth; stage.classList.add('enter');
      const ok = await eng.render(item, stage, api);
      if (!alive) return;
      const evs = DQ.Skills.record(p, skillId, level, ok);
      DQ.Store.save();
      results.push(ok);
      events.push(...evs);
      lastLevel = level;
      paws[i].classList.add(ok ? 'done' : 'done-helped', 'pop-in');
      for (const ev of evs) {
        if (ev.type === 'levelUp') { DQ.Sfx.play('levelup'); cast.dance(); await showBanner(`You're ready for a tiny bit trickier! ${def.name} grew a step.`, 'levelup'); }
        if (ev.type === 'stepBack') await showBanner("Let's practise this part together. We'll try the trickier ones again soon.", 'gentle');
        if (ev.type === 'support') await showBanner(`${DQ.Rewards.companion(p.buddy).name} will help you. Let's take it slow.`, 'gentle');
      }
    }
    if (!alive) return;
    UI.go('celebrate', { skillId, results, events, level: lastLevel, storyId: ctx.story && ctx.story.id });

    async function showBanner(text, kind) {
      banner.className = 'quest-banner ' + kind;
      banner.innerHTML = '';
      banner.append(h('span', { class: 'qb-buddy', html: DQ.Art.companion(p.buddy, { stage: band.companionStage }) }), h('span', {}, text));
      banner.hidden = false;
      await DQ.Voice.say(text);
      await U.sleep(300);
      banner.hidden = true;
    }
  };
})();
