/* Dream Quest — child-facing screens. */
(function () {
  'use strict';
  const DQ = window.DQ, U = DQ.util, h = U.h, UI = DQ.UI, S = UI.screens;
  const stageOf = (p) => (DQ.Bands.current(p).companionStage || 1);
  const comp = (id) => DQ.Rewards.companion(id);

  /* ---------- Grown-up setup (first run, or adding another explorer) ---------- */
  S.welcome = function (root, args) {
    const adding = !!args.adding;
    let step = adding ? 'age' : 'gate';
    let pin1 = '', age = 7;
    render();

    function render() {
      root.innerHTML = '';
      const card = h('div', { class: 'grown-card' });
      root.append(h('div', { class: 'welcome-hoot bob', html: DQ.Art.hoot({ lantern: true }) }), card);
      if (step === 'gate') {
        const digits = U.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 3);
        const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
        card.append(h('h1', {}, 'Hello, grown-up!'),
          h('p', {}, 'Dream Quest is set up by a parent or carer. To continue, tap these numbers in order:'),
          h('p', { class: 'gate-words' }, digits.map((d) => words[d]).join(' · ')));
        keypad(card, 3, (v) => { if (v === digits.join('')) { step = 'pin'; render(); } else { card.classList.add('shake'); setTimeout(render, 500); } });
      } else if (step === 'pin' || step === 'pin2') {
        card.append(h('h1', {}, step === 'pin' ? 'Make a Parent Zone PIN' : 'Type the PIN again'),
          h('p', {}, 'Four numbers that only grown-ups know. It opens the Parent Zone: skill map, bands, play time and settings.'));
        keypad(card, 4, (v) => {
          if (step === 'pin') { pin1 = v; step = 'pin2'; render(); }
          else if (v === pin1) { DQ.Store.setPin(v); step = 'age'; render(); }
          else { pin1 = ''; step = 'pin'; render(); }
        }, true);
      } else if (step === 'age') {
        const live = DQ.Bands.all().filter((b) => DQ.Bands.isLive(b.id));
        const bandLine = h('p', { class: 'band-line' });
        const update = () => {
          const b = DQ.Bands.forAge(age);
          const startB = DQ.Bands.isLive(b.id) ? b : live[live.length - 1];
          bandLine.innerHTML = `Age ${age} belongs in the <b>${b.name}</b> band (${b.ages}).` + (startB.id !== b.id ? ` That band's content packs are still on their way, so your child starts in <b>${startB.name}</b> and moves up automatically when they arrive.` : '');
          U.$$('.age-btn', card).forEach((x) => x.classList.toggle('on', +x.dataset.age === age));
        };
        card.append(h('h1', {}, adding ? 'Add another explorer' : "How old is your explorer?"),
          h('p', {}, 'Only the age in years is saved, never a birthday. Dream Quest grows with your child: as the years pass, new bands open new parts of the world.'),
          h('div', { class: 'age-grid' }, [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((a) => h('button', { class: 'age-btn', type: 'button', 'data-age': a, onclick: () => { age = a; update(); } }, a))),
          bandLine,
          h('div', { class: 'privacy' }, h('b', {}, 'Privacy: '), 'Your child picks a hero name from word tiles, so no real name is typed. No photos, emails, locations or chat. Progress stays on this device.'),
          h('button', { class: 'big-btn', type: 'button', onclick: () => UI.go('hero', { age }) }, 'Hand it to your explorer'));
        update();
      }
    }
  };

  function keypad(card, len, done, mask) {
    let v = '';
    const disp = h('div', { class: 'pin-dots' }, Array.from({ length: len }, () => h('i')));
    const pad = h('div', { class: 'keypad' }, [1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((k) => k === '' ? h('span') : h('button', {
      type: 'button', class: 'key', 'aria-label': k === '⌫' ? 'delete' : String(k), onclick: () => {
        if (k === '⌫') v = v.slice(0, -1); else if (v.length < len) v += k;
        U.$$('i', disp).forEach((d, i) => { d.classList.toggle('on', i < v.length); d.textContent = !mask && i < v.length ? v[i] : ''; });
        if (v.length === len) setTimeout(() => done(v), 150);
      },
    }, k)));
    card.append(disp, pad);
  }
  UI.keypad = keypad;

  /* ---------- Hero creation (child, voice-first) ---------- */
  S.hero = function (root, args) {
    const starters = DQ.World.starterCompanions;
    let buddy = null, first = null, second = null;
    const W = DQ.World.heroNames;
    pickBuddy();

    function pickBuddy() {
      root.innerHTML = '';
      const next = h('button', { class: 'big-btn', type: 'button', disabled: true, onclick: pickName }, 'Next');
      const grid = h('div', { class: 'buddy-grid' }, starters.map((id) => {
        const c = comp(id);
        const b = h('button', { class: 'buddy-card', type: 'button', 'aria-label': c.name + ' the ' + c.kind }, h('span', { class: 'bc-art', html: DQ.Art.companion(id) }), h('span', { class: 'bc-name' }, c.name));
        b.onclick = () => {
          buddy = id; DQ.Sfx.play('tap');
          U.$$('.buddy-card', grid).forEach((x) => x.classList.toggle('on', x === b));
          b.classList.remove('dance'); void b.offsetWidth; b.classList.add('dance');
          DQ.Voice.say(`I'm ${c.name} the ${c.kind}! ${c.line}`);
          next.disabled = false; next.classList.add('pulse');
        };
        return b;
      }));
      root.append(h('div', { class: 'hero-head' }, h('div', { class: 'hoot-mini', html: DQ.Art.hoot({}) }), h('h1', {}, 'Pick your buddy')), grid, next);
      DQ.Voice.say("Hello, I'm Hoot! Welcome to Dream Valley. Pick a buddy to go on quests with you. Tap a friend to meet them.");
    }

    function pickName() {
      root.innerHTML = '';
      const preview = h('div', { class: 'name-preview' }, '…');
      const go = h('button', { class: 'big-btn', type: 'button', disabled: true, onclick: finish }, "Let's go!");
      const row = (list, set, cls) => h('div', { class: 'name-row ' + cls }, list.map((n) => {
        const b = h('button', { class: 'name-tile', type: 'button' }, n.c ? h('span', { class: 'nt-art', html: n.c === 'hoot' ? DQ.Art.hoot({}) : DQ.Art.companion(n.c) }) : h('span', { class: 'nt-art word-art ' + n.art }), h('span', {}, n.w));
        b.onclick = () => { set(n.w); DQ.Sfx.play('tap'); U.$$('.name-tile', b.parentNode).forEach((x) => x.classList.toggle('on', x === b)); DQ.Voice.say(n.w); upd(); };
        return b;
      }));
      const upd = () => { preview.textContent = (first || '…') + ' ' + (second || '…'); if (first && second) { go.disabled = false; go.classList.add('pulse'); } };
      root.append(h('div', { class: 'hero-head' }, h('span', { class: 'hero-face big', html: DQ.Art.companion(buddy) }), h('h1', {}, 'Make your hero name')),
        row(W.first, (w) => (first = w), 'first'), row(W.second, (w) => (second = w), 'second'), preview, go);
      DQ.Voice.say('Now make your secret hero name. Pick one word from the top, and one word from the bottom.');
    }

    function finish() {
      const p = DQ.Store.addPlayer({ heroName: first + ' ' + second, buddy, age: args.age || 7, band: 1 });
      DQ.Bands.check(p);
      DQ.Store.save();
      DQ.Sfx.play('levelup');
      UI.go('valley', { welcome: true });
    }
  };

  /* ---------- Title / who's playing ---------- */
  S.title = function (root) {
    const players = DQ.Store.data.players;
    root.append(
      h('div', { class: 'title-art' }, h('div', { class: 'title-hoot bob', html: DQ.Art.hoot({ lantern: true }) })),
      h('h1', { class: 'logo' }, h('span', {}, 'Dream'), h('span', {}, 'Quest')),
      h('p', { class: 'tagline' }, players.length > 1 ? "Who's playing today?" : 'Tap to play!'),
      h('div', { class: 'player-row' }, players.map((p) => h('button', {
        class: 'player-btn pulse', type: 'button', onclick: () => { DQ.Sfx.unlock(); DQ.Store.setActive(p.id); UI.go('valley', { hello: true }); },
      }, h('span', { class: 'pb-art', html: DQ.Art.companion(p.buddy, { stage: stageOf(p) }) }), h('span', {}, p.heroName)))),
      h('button', { class: 'text-btn', type: 'button', onclick: () => UI.go('parent') }, 'Grown-ups'));
  };

  /* ---------- Dream Valley home ---------- */
  S.valley = function (root, args) {
    const p = DQ.Store.player();
    if (!p) return UI.go('title');
    const status = DQ.Bands.check(p);
    if (p.band.pending) return UI.go('grow', { to: p.band.pending });
    const band = DQ.Bands.current(p);
    const rec = DQ.Skills.recommend(p);
    const recDef = rec && DQ.Skills.def(rec);
    const trail = DQ.Rewards.trailToday(p);

    root.append(UI.topbar(p));
    const greet = h('section', { class: 'today' },
      h('div', { class: 'today-hoot bob', html: DQ.Art.hoot({ lantern: true }) }),
      h('div', { class: 'today-body' },
        h('div', { class: 'eyebrow' }, "Hoot's pick for today"),
        recDef ? h('button', { class: 'today-btn pulse', type: 'button', onclick: () => startSkill(rec) },
          h('span', { class: 'tb-icon', html: DQ.Art.skillIcon(recDef.art) }), h('span', { class: 'tb-name' }, recDef.name), h('span', { class: 'tb-go', html: DQ.Art.arrow('right') })) : null,
        h('div', { class: 'trail', 'aria-label': 'Daily trail' }, ['reading', 'math', 'stories'].map((d) => h('span', { class: 'trail-stone ' + (trail.includes(d) ? 'lit' : '') }, { reading: 'Read', math: 'Math', stories: 'Story' }[d])))));
    root.append(greet);

    const places = band.areas.map((aid) => {
      const a = DQ.World.areas[aid];
      const b = h('button', { class: 'place place-' + aid, type: 'button', onclick: () => openArea(aid) },
        h('span', { class: 'place-art', html: DQ.Art.place(a.art) }), h('span', { class: 'place-name' }, a.name));
      if (aid === 'story-grove') b.appendChild(h('span', { class: 'place-tag' }, 'Story Time'));
      return b;
    });
    root.append(h('section', { class: 'places' }, places));

    // Misty lands of the next band: visible, never playable yet.
    const nb = DQ.Bands.next(p);
    if (nb) {
      root.append(h('section', { class: 'far-lands' },
        h('div', { class: 'far-art', html: DQ.Art.place('mist') }),
        h('div', {}, h('div', { class: 'far-name' }, nb.region), h('div', { class: 'far-note' }, 'Far across the valley. It comes out of the mist as you grow.'))));
    }

    const name = p.heroName;
    if (args.welcome) DQ.Voice.say(`Welcome to Dream Valley, ${name}! I'm Hoot. Tap the glowing button to start my pick for today, or tap any place to explore.`);
    else if (args.hello) DQ.Voice.say(`Welcome back, ${name}! ${recDef ? 'Today I picked ' + recDef.name + ' for you.' : ''}`);
    else DQ.Voice.say(recDef ? `Where to next, ${name}? I picked ${recDef.name}.` : `Where to next, ${name}?`);
    void status;

    function openArea(aid) {
      DQ.Sfx.play('tap');
      if (aid === 'story-grove') return UI.go('shelf');
      if (aid === 'lantern-hill') return UI.go('hill');
      if (aid === 'dream-path') return UI.go('path');
      UI.go('area', { area: aid });
    }
  };

  function startSkill(id, opts) {
    DQ.Sfx.play('tap');
    const p = DQ.Store.player();
    const lim = DQ.Store.settings.dailyMinutes;
    if (lim && DQ.Store.minutesToday(p) >= lim) return UI.go('rest');
    UI.go('quest', Object.assign({ skill: id }, opts || {}));
  }
  UI.startSkill = startSkill;

  /* ---------- Area (Word Woods / Number Meadow) ---------- */
  S.area = function (root, args) {
    const p = DQ.Store.player();
    const a = DQ.World.areas[args.area];
    root.append(UI.topbar(p, { back: true }),
      h('div', { class: 'area-head' }, h('span', { class: 'area-art', html: DQ.Art.place(a.art) }), h('h1', {}, a.name)));
    const grid = h('div', { class: 'quest-grid' });
    DQ.Skills.inArea(args.area).forEach((d) => {
      const sum = DQ.Skills.summary(p, d.id);
      const open = sum.status !== 'locked';
      const pips = h('span', { class: 'pips', 'aria-label': `${sum.mastered.length} of ${sum.max} lanterns lit` }, Array.from({ length: sum.max }, (_, i) => h('i', { class: sum.mastered.includes(i + 1) ? 'lit' : (i + 1 === sum.level ? 'now' : '') })));
      const card = h('button', { class: 'quest-card ' + (open ? '' : 'locked') + (sum.status === 'mastered' ? ' mastered' : ''), type: 'button', 'aria-label': d.name },
        h('span', { class: 'qc-icon', html: DQ.Art.skillIcon(d.art) }),
        h('span', { class: 'qc-name' }, d.name),
        open ? pips : h('span', { class: 'qc-lock' }, h('span', { html: DQ.Art.lock() }), DQ.Skills.lockReason(p, d.id)));
      card.onclick = () => {
        if (!open) { DQ.Sfx.play('soft'); card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake'); DQ.Voice.say(`${d.name} is still sleeping. ${DQ.Skills.lockReason(p, d.id)}.`); return; }
        startSkill(d.id);
      };
      grid.appendChild(card);
    });
    root.append(grid);
    DQ.Voice.say(a.say + ' Pick a quest.');
  };

  /* ---------- Story Grove shelf (story in two taps) ---------- */
  S.shelf = function (root) {
    const p = DQ.Store.player();
    const pick = DQ.Story.pick(p);
    root.append(UI.topbar(p, { back: true }),
      h('div', { class: 'area-head' }, h('span', { class: 'area-art', html: DQ.Art.place('grove') }), h('h1', {}, 'Story Grove')));
    const big = h('button', { class: 'story-hero pulse-soft', type: 'button', 'aria-label': 'Read ' + pick.title, onclick: () => startSkill('story.listen', { story: pick }) },
      h('div', { class: 'sh-cover', html: DQ.Art.scene(pick.cover, { stage: stageOf(p) }) }),
      h('div', { class: 'sh-body' }, h('div', { class: 'eyebrow' }, "Hoot's story for you"), h('div', { class: 'sh-title' }, pick.title), h('span', { class: 'sh-go' }, h('span', { html: DQ.Art.arrow('right') }), 'Read it')));
    root.append(big);
    const shelf = h('div', { class: 'shelf' });
    DQ.Story.all().filter((s) => s !== pick).forEach((s) => {
      const open = DQ.Story.isOpen(p, s);
      const read = p.rewards.storiesRead.includes(s.id);
      const b = h('button', { class: 'book ' + (open ? '' : 'seed'), type: 'button', 'aria-label': s.title },
        open ? h('div', { class: 'book-cover', html: DQ.Art.scene(s.cover, { stage: stageOf(p) }) }) : h('div', { class: 'book-cover seed-cover', html: DQ.Art.place('mist') }),
        h('div', { class: 'book-title' }, open ? s.title : 'A story is growing…'),
        read ? h('span', { class: 'book-read', html: DQ.Art.paw() }) : null);
      b.onclick = () => {
        if (!open) { DQ.Voice.say('This story grows when your listening grows. Keep reading with me!'); return; }
        startSkill('story.listen', { story: s });
      };
      shelf.appendChild(b);
    });
    root.append(shelf);
    DQ.Voice.say(`Story Grove! I picked ${pick.title} for you. Tap it to read.`);
  };

  /* ---------- Quest ---------- */
  S.quest = function (root, args) {
    UI.runQuest(root, args.skill, { story: args.story }).catch((e) => { console.error(e); UI.go('valley'); });
  };

  /* ---------- Celebration ---------- */
  S.celebrate = async function (root, args) {
    const p = DQ.Store.player();
    const def = DQ.Skills.def(args.skillId);
    const beats = DQ.Rewards.questDone(p, args);
    DQ.Bands.check(p);
    DQ.Store.save();
    const stage = stageOf(p);
    const bar = UI.topbar(p);
    U.$('b', bar.orbs).textContent = p.rewards.orbs - beats.filter((b) => b.type === 'orbs' || b.type === 'moonrise').reduce((n, b) => n + b.n, 0);
    const buddy = h('div', { class: 'celebrate-buddy dance-loop', html: DQ.Art.companion(p.buddy, { stage, closedHappy: true, open: true }) });
    const hoot = h('div', { class: 'celebrate-hoot cheer-loop', html: DQ.Art.hoot({}) });
    const reveal = h('div', { class: 'reveal' });
    const actions = h('div', { class: 'celebrate-actions', hidden: true },
      h('button', { class: 'big-btn', type: 'button', onclick: () => startSkill(args.skillId) }, 'Play again'),
      h('button', { class: 'big-btn alt', type: 'button', onclick: () => UI.go('valley') }, 'Dream Valley'));
    root.append(bar, h('div', { class: 'celebrate-stage' }, h('div', { class: 'orb-rain' }), hoot, buddy), reveal, actions);
    const rain = U.$('.orb-rain', root);
    if (!U.reducedMotion()) for (let i = 0; i < 14; i++) rain.appendChild(h('span', { style: { left: (i * 7.3) % 100 + '%', animationDelay: (i % 7) * 0.35 + 's' }, html: DQ.Art.orb(22) }));
    DQ.Sfx.play('levelup');
    const cName = comp(p.buddy).name;

    for (const b of beats) {
      const card = h('div', { class: 'beat pop-in' });
      reveal.appendChild(card);
      let line = '';
      if (b.type === 'orbs') {
        card.append(h('span', { class: 'beat-art', html: DQ.Art.orb(48) }), h('span', { class: 'beat-text' }, `+${b.n} Dream Orbs`));
        line = b.right === b.total ? `Amazing! You got every one! ${comp(p.buddy).line} You collected ${b.n} Dream Orbs.` : `Great questing! You collected ${b.n} Dream Orbs.`;
        let n = +U.$('b', bar.orbs).textContent;
        const target = n + b.n;
        const t = setInterval(() => { n++; U.$('b', bar.orbs).textContent = n; if (n >= target) clearInterval(t); }, 60);
      } else if (b.type === 'paw') {
        card.append(h('span', { class: 'beat-art stamp', html: DQ.Art.paw() }), h('span', { class: 'beat-text' }, `Paw print ${b.n} on your Dream Path`));
        line = 'Stamp! A new paw print on your Dream Path.';
      } else if (b.type === 'levelUp') {
        card.append(h('span', { class: 'beat-art', html: DQ.Art.skillIcon(def.art) }), h('span', { class: 'beat-text' }, `${def.name} grew a step!`));
        line = `${def.name} grew a step. You're getting so good at this!`;
      } else if (b.type === 'lantern') {
        card.append(h('span', { class: 'beat-art lantern-light', html: DQ.Art.lantern(true) }), h('span', { class: 'beat-text' }, `Dream Lantern lit: ${def.name}`));
        DQ.Sfx.play('lantern');
        line = `You lit a Dream Lantern for ${def.name}! It will glow on Lantern Hill.`;
      } else if (b.type === 'companion') {
        const c = comp(b.id);
        card.classList.add('beat-friend');
        card.append(h('span', { class: 'beat-art friend-in', html: DQ.Art.companion(b.id, { stage }) }), h('span', { class: 'beat-text' }, `New friend: ${c.name} the ${c.kind}`));
        line = `Look who you met on the Dream Path! This is ${c.name} the ${c.kind}. ${c.line}`;
      } else if (b.type === 'moonrise') {
        card.append(h('span', { class: 'beat-art moon', html: '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="15" fill="#fff6d0"/><circle cx="26" cy="15" r="13" fill="#3b2f7a"/></svg>' }), h('span', { class: 'beat-text' }, `Daily Trail walked! +${b.n} orbs`));
        line = `You walked the whole Daily Trail today: reading, math and a story! Moonrise bonus!`;
      }
      if (line) await DQ.Voice.say(line);
      if (UI.current !== 'celebrate') return;
      await U.sleep(200);
    }
    actions.hidden = false;
    U.$('.big-btn', actions).classList.add('pulse');
    void cName;
  };

  /* ---------- Rest (daily play time reached) ---------- */
  S.rest = function (root) {
    const p = DQ.Store.player();
    root.append(h('div', { class: 'rest' },
      h('div', { class: 'rest-hoot', html: DQ.Art.hoot({}) }),
      h('h1', {}, 'Time to rest your wings'),
      h('p', {}, 'You played so well today. Your companions are getting sleepy too. Come back tomorrow for more quests!'),
      h('div', { class: 'rest-buddy', html: DQ.Art.companion(p.buddy, { stage: stageOf(p), closedHappy: true }) }),
      h('button', { class: 'big-btn alt', type: 'button', onclick: () => UI.go('hill') }, 'Visit Lantern Hill'),
      h('button', { class: 'text-btn', type: 'button', onclick: () => UI.go('parent') }, 'Grown-ups')));
    DQ.Voice.say("Time to rest your wings. You played so well today! Come back tomorrow for more quests. Goodnight!");
  };

  /* ---------- Dream Path ---------- */
  S.path = function (root) {
    const p = DQ.Store.player();
    const every = DQ.World.companionEvery || 3;
    const total = Math.max(30, p.rewards.paws + 15);
    root.append(UI.topbar(p, { back: true }), h('div', { class: 'area-head' }, h('span', { class: 'area-art', html: DQ.Art.place('path') }), h('h1', {}, 'Dream Path')));
    const STEP = 74;
    const W = 340;
    const pts = Array.from({ length: total + 1 }, (_, i) => [W / 2 + Math.sin(i * 0.62) * (W * 0.32), (total - i) * STEP + 60]);
    const H = total * STEP + 120;
    const wrap = h('div', { class: 'path-wrap', style: { height: H + 'px' } });
    wrap.innerHTML = `<svg class="path-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><polyline points="${pts.map((q) => q.join(',')).join(' ')}" fill="none" stroke="#f3d9a6" stroke-opacity=".35" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const stage = stageOf(p);
    const companionsMet = p.rewards.companions.slice(1);
    for (let i = 1; i <= total; i++) {
      const [x, y] = pts[i];
      const done = i <= p.rewards.paws;
      const ang = Math.atan2(pts[i - 1][1] - y, pts[i - 1][0] - x) * 180 / Math.PI + 90;
      wrap.appendChild(h('div', { class: 'path-paw ' + (done ? 'done' : ''), style: { left: (x / W) * 100 + '%', top: y + 'px', transform: `translate(-50%,-50%) rotate(${ang + 180}deg)` }, html: DQ.Art.paw() }));
      if (i % every === 0) {
        const idx = i / every - 1;
        const cid = companionsMet[idx];
        const side = Math.sin(i * 0.62) > 0 ? -1 : 1;
        wrap.appendChild(h('div', { class: 'path-friend ' + (cid ? 'met' : ''), style: { left: `calc(${(x / W) * 100}% + ${side * 70}px)`, top: y + 'px' }, html: cid ? DQ.Art.companion(cid, { stage }) : '<span>?</span>' }));
      }
    }
    const [hx, hy] = pts[Math.min(p.rewards.paws, total)];
    const me = h('div', { class: 'path-me bob', style: { left: (hx / W) * 100 + '%', top: hy + 'px' }, html: DQ.Art.companion(p.buddy, { stage }) });
    wrap.appendChild(me);
    const nb = DQ.Bands.next(p);
    if (nb) wrap.prepend(h('div', { class: 'path-gate' }, h('span', { html: DQ.Art.place('mist') }), h('b', {}, nb.region), h('small', {}, 'Opens as you grow')));
    root.append(h('div', { class: 'path-scroll' }, wrap));
    setTimeout(() => me.scrollIntoView({ block: 'center', behavior: U.reducedMotion() ? 'auto' : 'smooth' }), 200);
    const toNext = every - (p.rewards.paws % every);
    DQ.Voice.say(`You have ${p.rewards.paws} paw prints on your Dream Path. ${toNext === every ? 'Finish a quest to stamp a new one!' : `${toNext} more ${toNext === 1 ? 'quest' : 'quests'} until you meet a new friend!`}`);
  };

  /* ---------- Lantern Hill ---------- */
  S.hill = function (root) {
    const p = DQ.Store.player();
    const stage = stageOf(p);
    root.append(UI.topbar(p, { back: true }), h('div', { class: 'area-head' }, h('span', { class: 'area-art', html: DQ.Art.place('lantern') }), h('h1', {}, 'Lantern Hill')));
    const lanterns = h('section', { class: 'lantern-rows' }, h('h2', {}, 'Dream Lanterns'));
    const hues = { reading: '#ffb347', math: '#8fd8ff', stories: '#c9a6ff' };
    Object.values(DQ.Skills.defs).forEach((d) => {
      const max = DQ.Skills.maxLevel(p, d.id);
      lanterns.appendChild(h('div', { class: 'lantern-row' }, h('span', { class: 'lr-name' }, d.name),
        h('span', { class: 'lr-lanterns' }, Array.from({ length: max }, (_, i) => h('span', { class: 'lr-l ' + (p.rewards.lanterns.includes(d.id + ':' + (i + 1)) ? 'on' : ''), html: DQ.Art.lantern(p.rewards.lanterns.includes(d.id + ':' + (i + 1)), hues[d.domain]) })))));
    });
    const met = p.rewards.companions;
    const friends = h('section', { class: 'friends' }, h('h2', {}, `Companions: ${met.length} of ${DQ.World.companions.length}`),
      h('div', { class: 'friend-grid' }, DQ.World.companions.map((c) => {
        const has = met.includes(c.id);
        const b = h('button', { class: 'friend ' + (has ? 'met' : 'unmet'), type: 'button', 'aria-label': has ? c.name : 'Not met yet', html: DQ.Art.companion(c.id, { stage, silhouette: !has }) });
        b.appendChild(h('span', { class: 'friend-name' }, has ? c.name : '?'));
        b.onclick = () => {
          if (!has) return DQ.Voice.say('A friend you have not met yet. Keep walking the Dream Path!');
          b.classList.remove('dance'); void b.offsetWidth; b.classList.add('dance');
          DQ.Voice.say(`${c.name} the ${c.kind}. ${c.line}`);
        };
        return b;
      })));
    root.append(lanterns, friends);
    DQ.Voice.say(`Lantern Hill! You have lit ${p.rewards.lanterns.length} Dream ${p.rewards.lanterns.length === 1 ? 'Lantern' : 'Lanterns'}, and met ${met.length} companions.`);
  };

  /* ---------- Growing-up moment (band change) ---------- */
  S.grow = async function (root, args) {
    const p = DQ.Store.player();
    const preview = !!args.preview;
    const from = DQ.Bands.current(p);
    const to = DQ.Bands.get(args.to || from.id + 1);
    if (!to) return UI.go('valley');
    const c = comp(p.buddy);
    const buddyBox = h('div', { class: 'grow-buddy', html: DQ.Art.companion(p.buddy, { stage: from.companionStage }) });
    const title = h('h1', { class: 'grow-title' }, '');
    const lands = h('div', { class: 'grow-lands' });
    const done = h('button', { class: 'big-btn', type: 'button', hidden: true }, preview ? 'Back to Parent Zone' : 'Explore!');
    root.append(h('div', { class: 'grow-sky' }, Array.from({ length: 30 }, (_, i) => h('i', { style: { left: (i * 37) % 100 + '%', top: (i * 53) % 100 + '%', animationDelay: (i % 9) * 0.3 + 's' } }))),
      preview ? h('div', { class: 'preview-ribbon' }, 'Preview for grown-ups. Nothing changes.') : null,
      h('div', { class: 'grow-hoot', html: DQ.Art.hoot({ lantern: true }) }), buddyBox, title, lands, done);
    DQ.Sfx.play('whoosh');
    title.textContent = `Look how much you've grown, ${p.heroName}!`;
    await DQ.Voice.say(title.textContent);
    buddyBox.classList.add('grow-glow');
    await U.sleep(900);
    buddyBox.innerHTML = DQ.Art.companion(p.buddy, { stage: to.companionStage });
    buddyBox.classList.add('grown');
    await DQ.Voice.say(`${c.name} grew up a little too!`);
    title.textContent = `${to.region} is opening!`;
    DQ.Sfx.play('lantern');
    await DQ.Voice.say(`The mist is lifting. A new part of Dream Valley is opening: ${to.region}. Welcome to the ${to.name} band!`);
    to.courses.forEach((cname, i) => lands.appendChild(h('div', { class: 'grow-course pop-in', style: { animationDelay: i * 0.15 + 's' } }, cname)));
    if (!preview) DQ.Bands.advance(p);
    done.hidden = false; done.classList.add('pulse');
    done.onclick = () => UI.go(preview ? 'parent' : 'valley', preview ? { unlocked: true, tab: 'bands' } : {});
  };
})();
