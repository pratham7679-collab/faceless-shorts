/* Dream Quest — Parent Zone (PIN-gated): skill map, progress, bands, content packs,
 * explorers and settings. */
(function () {
  'use strict';
  const DQ = window.DQ, U = DQ.util, h = U.h, UI = DQ.UI;
  let unlockedUntil = 0;
  let tab = 'skills';

  UI.screens.parent = function (root, args) {
    DQ.Voice.stop();
    UI.hideCaption();
    if (args.tab) tab = args.tab;
    if (args.unlocked && Date.now() < unlockedUntil + 60000) unlockedUntil = Date.now() + 5 * 60000;
    if (Date.now() > unlockedUntil) return gate(root);
    unlockedUntil = Date.now() + 5 * 60000;
    dashboard(root);
  };

  function gate(root) {
    const card = h('div', { class: 'grown-card' });
    root.append(card);
    card.append(h('h1', {}, 'Parent Zone'), h('p', {}, 'Grown-ups only. Type your 4-number PIN.'));
    UI.keypad(card, 4, (v) => {
      if (DQ.Store.checkPin(v)) { unlockedUntil = Date.now() + 5 * 60000; UI.go('parent'); }
      else { card.classList.add('shake'); setTimeout(() => UI.go('parent'), 500); }
    }, true);
    card.append(h('button', { class: 'text-btn', type: 'button', onclick: back }, 'Back to the game'));
  }

  function back() { unlockedUntil = 0; UI.go(DQ.Store.player() ? 'valley' : 'title'); }

  function dashboard(root) {
    const p = DQ.Store.player();
    const tabs = [['skills', 'Skill map'], ['progress', 'Progress'], ['bands', 'Bands'], ['packs', 'Content packs'], ['explorers', 'Explorers'], ['settings', 'Settings']];
    root.append(h('header', { class: 'pz-head' },
      h('div', {}, h('div', { class: 'pz-eyebrow' }, 'Parent Zone'), h('h1', {}, p ? p.heroName : 'Family')),
      h('button', { class: 'pz-btn', type: 'button', onclick: back }, 'Lock & return')));
    root.append(h('nav', { class: 'pz-tabs', role: 'tablist' }, tabs.map(([k, label]) => h('button', { class: 'pz-tab' + (tab === k ? ' on' : ''), type: 'button', role: 'tab', 'aria-selected': tab === k ? 'true' : 'false', onclick: () => { tab = k; UI.go('parent'); } }, label))));
    const body = h('div', { class: 'pz-body' });
    root.append(body);
    if (!p && tab !== 'explorers' && tab !== 'settings' && tab !== 'packs') tab = 'explorers';
    ({ skills, progress, bands, packs, explorers, settings })[tab](body, p);
  }

  const chip = (status) => {
    const label = { locked: 'Locked', new: 'Not started', practicing: 'Practising', 'needs-help': 'Needs support', mastered: 'Band complete' }[status];
    return h('span', { class: 'pz-chip st-' + status }, label);
  };

  /* ---------- Skill map ---------- */
  function skills(body, p) {
    body.append(h('p', { class: 'pz-lead' }, 'What your explorer can actually do, updated after every answer. A level is mastered when 5 of the last 6 first-try answers are right, across at least 2 quests. Missing 3 of 4 steps back one level for practice; the harder level comes back 2 quests later.'));
    const doms = DQ.World.skillGraph.domains;
    const byDom = DQ.Skills.byDomain();
    Object.keys(byDom).forEach((dk) => {
      const sec = h('section', { class: 'pz-sec' }, h('h2', {}, doms[dk] ? doms[dk].name : dk));
      byDom[dk].forEach((d) => {
        const s = DQ.Skills.summary(p, d.id);
        const ladder = h('div', { class: 'ladder' }, d.levels.map((l) => {
          const inBand = l.band <= p.band.current;
          const cls = !inBand ? 'future' : s.mastered.includes(l.n) ? 'done' : l.n === s.level && s.status !== 'locked' ? 'now' : '';
          return h('span', { class: 'rung ' + cls, title: `Level ${l.n}: ${l.label}` + (inBand ? '' : ` (band ${l.band})`) }, l.n);
        }));
        const row = h('div', { class: 'pz-skill' },
          h('div', { class: 'pzs-top' }, h('b', {}, d.name), chip(s.status)),
          h('div', { class: 'pzs-now' }, s.status === 'locked' ? DQ.Skills.lockReason(p, d.id) + '.' : `Level ${s.level}: ${s.label}`),
          ladder,
          h('div', { class: 'pzs-meta' },
            h('span', {}, s.acc == null ? 'No answers yet' : `Last 10 answers: ${s.acc}% first try`),
            s.retry ? h('span', {}, `Retrying level ${s.retry.level} soon`) : null,
            h('span', {}, `${s.plays} ${s.plays === 1 ? 'quest' : 'quests'}`)),
          s.status !== 'locked' ? h('div', { class: 'pzs-ctl' },
            h('button', { class: 'pz-btn sm', type: 'button', disabled: s.level <= 1, onclick: () => { DQ.Skills.setLevel(p, d.id, s.level - 1); UI.go('parent'); } }, 'Ease back a level'),
            h('button', { class: 'pz-btn sm', type: 'button', disabled: s.level >= s.max, onclick: () => { DQ.Skills.setLevel(p, d.id, s.level + 1); UI.go('parent'); } }, 'Move up a level')) : null);
        sec.appendChild(row);
      });
      body.appendChild(sec);
    });
    const planned = DQ.Skills.planned();
    if (planned.length) {
      const sec = h('section', { class: 'pz-sec' }, h('h2', {}, 'Later on the same skill map'),
        h('p', { class: 'pz-note' }, 'One skill graph for life. These skills arrive with later bands and build on what your explorer masters now.'));
      const groups = {};
      planned.forEach((s) => (groups[s.band] = groups[s.band] || []).push(s));
      Object.keys(groups).forEach((b) => {
        const band = DQ.Bands.get(+b);
        sec.appendChild(h('div', { class: 'pz-planned' }, h('div', { class: 'pp-band' }, `${band.name} (${band.ages})`),
          h('div', { class: 'pp-list' }, groups[b].map((s) => h('span', { class: 'pp-skill', title: 'Builds on: ' + s.requires.map((r) => r.skill + ' L' + r.level).join(', ') }, s.name)))));
      });
      body.appendChild(sec);
    }
  }

  /* ---------- Progress ---------- */
  function progress(body, p) {
    const r = p.rewards;
    const stat = (n, l) => h('div', { class: 'pz-stat' }, h('b', {}, n), h('span', {}, l));
    body.append(h('div', { class: 'pz-stats' },
      stat(p.play.quests, 'quests played'), stat(DQ.Store.minutesToday(p), 'minutes today'),
      stat(r.lanterns.length, 'lanterns lit'), stat(r.companions.length, 'companions met'), stat(r.orbs, 'Dream Orbs'), stat(r.storiesRead.length, 'stories read')));
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return U.today(d); });
    const max = Math.max(10, ...days.map((d) => p.play.minutes[d] || 0));
    body.append(h('section', { class: 'pz-sec' }, h('h2', {}, 'Play time, last 7 days'),
      h('div', { class: 'pz-bars' }, days.map((d) => h('div', { class: 'pz-bar' }, h('span', { style: { height: ((p.play.minutes[d] || 0) / max) * 100 + '%' } }), h('small', {}, (p.play.minutes[d] || 0) + 'm'), h('i', {}, new Date(d + 'T12:00').toLocaleDateString(undefined, { weekday: 'short' })))))));
    const log = h('section', { class: 'pz-sec' }, h('h2', {}, 'Recent quests'));
    if (!p.play.log.length) log.append(h('p', { class: 'pz-note' }, 'No quests yet.'));
    p.play.log.slice(0, 15).forEach((e) => {
      const d = DQ.Skills.def(e.skill);
      log.append(h('div', { class: 'pz-log' }, h('span', {}, e.d), h('b', {}, d ? d.name : e.skill), h('span', {}, `Level ${e.level} · ${e.right}/${e.total} first try`),
        e.ev.includes('levelUp') ? h('span', { class: 'pz-chip st-mastered' }, 'Moved up') : e.ev.includes('stepBack') ? h('span', { class: 'pz-chip st-needs-help' }, 'Stepped back') : null));
    });
    body.append(log);
  }

  /* ---------- Bands ---------- */
  function bands(body, p) {
    const age = DQ.Store.ageNow(p);
    const st = DQ.Bands.check(p);
    const cur = DQ.Bands.current(p);
    const next = DQ.Bands.next(p);
    const nextLive = next && DQ.Bands.isLive(next.id);
    body.append(h('section', { class: 'pz-sec' }, h('h2', {}, 'Age and band'),
      h('div', { class: 'pz-row' }, h('span', {}, 'Age'),
        h('button', { class: 'pz-btn sm', type: 'button', 'aria-label': 'Younger', onclick: () => { setAge(p, age - 1); } }, '−'),
        h('b', { class: 'pz-age' }, age),
        h('button', { class: 'pz-btn sm', type: 'button', 'aria-label': 'Older', onclick: () => { setAge(p, age + 1); } }, '+'),
        h('span', { class: 'pz-note' }, `Age band: ${DQ.Bands.forAge(age).name}. Playing in: ${cur.name}.`)),
      st.waiting ? h('p', { class: 'pz-note warn' }, `Age ${age} is ready for ${DQ.Bands.get(st.waiting).name}, but its content packs have not arrived yet. Your explorer keeps growing inside ${cur.name} and moves up automatically when they do.`) : null,
      h('label', { class: 'pz-toggle' }, h('input', { type: 'checkbox', id: 'hold-band', checked: p.band.hold, onchange: (e) => { p.band.hold = e.target.checked; DQ.Store.save(); UI.go('parent'); } }), h('span', {}, `Hold at ${cur.name}, even after a birthday`)),
      h('div', { class: 'pz-row' },
        h('button', { class: 'pz-btn', type: 'button', disabled: !nextLive, onclick: () => { p.band.pending = next.id; DQ.Store.save(); unlockedUntil = 0; UI.go('grow', { to: next.id }); } }, next ? `Move up to ${next.name} now` : 'Top band'),
        next ? h('button', { class: 'pz-btn ghost', type: 'button', onclick: () => UI.go('grow', { to: next.id, preview: true }) }, 'Preview the growing-up moment') : null),
      next && !nextLive ? h('p', { class: 'pz-note' }, `${next.name} unlocks when its content packs are published to your pack server.`) : null));

    const flags = DQ.Bands.flags(p);
    const cat = DQ.World.flagCatalog;
    body.append(h('section', { class: 'pz-sec' }, h('h2', {}, `What ${cur.name} turns on`),
      h('div', { class: 'pz-flags' }, Object.keys(cat).map((k) => h('div', { class: 'pz-flag' }, h('span', {}, cat[k].about), h('b', { class: flags[k] === false || flags[k] === 'off' || flags[k] === 'none' ? 'off' : 'on' }, String(flags[k])))))));

    const tl = h('section', { class: 'pz-sec' }, h('h2', {}, 'The road ahead: one profile from 7 to 30+'));
    DQ.Bands.all().forEach((b) => {
      tl.append(h('div', { class: 'pz-band' + (b.id === cur.id ? ' cur' : '') },
        h('div', { class: 'pb-head' }, h('b', {}, `${b.id}. ${b.name}`), h('span', {}, b.ages), h('span', { class: 'pz-chip ' + (DQ.Bands.isLive(b.id) ? 'st-mastered' : 'st-new') }, DQ.Bands.isLive(b.id) ? 'Live' : 'Coming'), b.id === cur.id ? h('span', { class: 'pz-chip st-practicing' }, 'Here now') : null),
        h('div', { class: 'pb-region' }, b.region),
        h('ul', {}, b.courses.map((c) => h('li', {}, c)))));
    });
    body.append(tl);
  }
  function setAge(p, a) {
    a = U.clamp(a, 5, 99);
    p.age = { years: a, setOn: U.today() };
    DQ.Bands.check(p);
    DQ.Store.save();
    UI.go('parent');
  }

  /* ---------- Content packs ---------- */
  function packs(body) {
    const src = { server: 'Downloaded', cache: 'Saved on device', bundled: 'Built into the app' };
    body.append(h('p', { class: 'pz-lead' }, 'Quests, stories, word lists and bands arrive as content packs. New packs reach the app automatically, without an app update.'),
      h('div', { class: 'pz-row' }, h('span', { class: 'pz-note' }, `Pack server: ${DQ.config.packBase} · manifest ${DQ.Packs.manifestSource === 'server' ? 'downloaded' : DQ.Packs.manifestSource === 'cache' ? 'from device cache' : 'built in (offline)'}${DQ.Packs.lastCheck ? ' · checked ' + DQ.Packs.lastCheck.toLocaleTimeString() : ''}`)));
    const status = h('p', { class: 'pz-note', 'aria-live': 'polite' });
    body.append(h('div', { class: 'pz-row' }, h('button', {
      class: 'pz-btn', type: 'button', onclick: async (e) => {
        e.target.disabled = true; status.textContent = 'Checking…';
        try { const r = await DQ.Packs.load(); status.textContent = r.updated.length ? `${r.updated.length} pack(s) updated: ${r.updated.map((x) => x.id + ' ' + x.version).join(', ')}` : 'Everything is up to date.'; }
        catch (err) { status.textContent = 'Could not reach the pack server. The packs already on this device keep working.'; }
        e.target.disabled = false;
        setTimeout(() => UI.go('parent'), 1600);
      },
    }, 'Check for new content'), status));
    const t = h('div', { class: 'pz-table', role: 'table' }, h('div', { class: 'pz-tr th', role: 'row' }, ['Pack', 'Version', 'Band', 'Contains', 'Source'].map((x) => h('span', { role: 'columnheader' }, x))));
    DQ.Packs.list().forEach(({ pack, source }) => {
      const contains = pack.kind === 'world' ? `${pack.bands.length} bands, ${pack.companions.length} companions` : pack.skills.map((s) => s.name || s.extends).join(', ');
      t.append(h('div', { class: 'pz-tr', role: 'row' }, h('b', {}, pack.id), h('span', {}, pack.version), h('span', {}, pack.band || 'all'), h('span', {}, contains), h('span', {}, src[source])));
    });
    body.append(h('div', { class: 'pz-scroll' }, t));
    DQ.Packs.skipped.forEach((s) => body.append(h('p', { class: 'pz-note warn' }, `${s.id} skipped: ${s.reason}`)));
  }

  /* ---------- Explorers (family account) ---------- */
  function explorers(body, p) {
    body.append(h('p', { class: 'pz-lead' }, 'One family account, one lifelong profile per explorer. Each keeps their own skill map, band and rewards.'));
    DQ.Store.data.players.forEach((x) => {
      const confirm = h('div', { class: 'pz-confirm', hidden: true },
        h('span', {}, `Reset all of ${x.heroName}'s progress? This can't be undone.`),
        h('button', { class: 'pz-btn danger sm', type: 'button', onclick: () => { DQ.Store.resetPlayer(x.id); UI.go('parent'); } }, 'Yes, reset'),
        h('button', { class: 'pz-btn sm', type: 'button', onclick: () => (confirm.hidden = true) }, 'Cancel'));
      body.append(h('div', { class: 'pz-explorer' + (p && x.id === p.id ? ' cur' : '') },
        h('span', { class: 'pe-face', html: DQ.Art.companion(x.buddy, { stage: (DQ.Bands.get(x.band.current) || {}).companionStage || 1 }) }),
        h('div', { class: 'pe-body' }, h('b', {}, x.heroName), h('span', {}, `Age ${DQ.Store.ageNow(x)} · ${DQ.Bands.get(x.band.current).name} band · ${x.play.quests} quests`)),
        h('div', { class: 'pe-ctl' },
          p && x.id === p.id ? h('span', { class: 'pz-chip st-practicing' }, 'Playing') : h('button', { class: 'pz-btn sm', type: 'button', onclick: () => { DQ.Store.setActive(x.id); UI.go('parent'); } }, 'Switch to'),
          h('button', { class: 'pz-btn sm ghost', type: 'button', onclick: () => (confirm.hidden = false) }, 'Reset')),
        confirm));
    });
    body.append(h('button', { class: 'pz-btn', type: 'button', onclick: () => { unlockedUntil = 0; UI.go('welcome', { adding: true }); } }, 'Add another explorer'));
  }

  /* ---------- Settings ---------- */
  function settings(body) {
    const s = DQ.Store.settings;
    const save = () => { DQ.Store.save(); UI.go('parent'); };
    const seg = (id, opts, val, set) => h('div', { class: 'pz-seg', role: 'radiogroup', id }, opts.map(([v, l]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(v === val), class: v === val ? 'on' : '', onclick: () => { set(v); save(); } }, l)));
    const voices = DQ.Voice.list();
    const pinMsg = h('span', { class: 'pz-note' });
    body.append(
      h('section', { class: 'pz-sec' }, h('h2', {}, 'Narrator'),
        h('div', { class: 'pz-row' }, h('span', {}, 'Speed'), seg('rate', [[0.75, 'Slow'], [0.85, 'Gentle'], [1, 'Normal']], s.rate, (v) => (s.rate = v))),
        h('div', { class: 'pz-row' }, h('label', { for: 'voice' }, 'Voice'),
          h('select', { id: 'voice', class: 'pz-select', onchange: (e) => { s.voiceName = e.target.value || null; DQ.Store.save(); DQ.Voice.say('Hello! I am Hoot, your narrator.'); } },
            h('option', { value: '' }, 'Warmest available (automatic)'), voices.map((v) => h('option', { value: v.name, selected: s.voiceName === v.name }, `${v.name} (${v.lang})`)))),
        !DQ.Voice.available ? h('p', { class: 'pz-note warn' }, 'This browser has no speech voice. Narration shows as captions instead.') : null,
        h('label', { class: 'pz-toggle' }, h('input', { type: 'checkbox', id: 'autoread', checked: s.autoRead !== false, onchange: (e) => { s.autoRead = e.target.checked; DQ.Store.save(); } }), h('span', {}, 'Read every question aloud automatically')),
        h('label', { class: 'pz-toggle' }, h('input', { type: 'checkbox', id: 'sfx', checked: s.sfx !== false, onchange: (e) => { s.sfx = e.target.checked; DQ.Store.save(); } }), h('span', {}, 'Sound effects'))),
      h('section', { class: 'pz-sec' }, h('h2', {}, 'Daily play time'),
        seg('limit', [[0, 'No limit'], [15, '15 min'], [20, '20 min'], [30, '30 min'], [45, '45 min']], s.dailyMinutes, (v) => (s.dailyMinutes = v)),
        h('p', { class: 'pz-note' }, 'When time is up, Hoot finishes the current quest and says goodnight.')),
      h('section', { class: 'pz-sec' }, h('h2', {}, 'Change PIN'), h('div', { class: 'pin-change' }, (() => {
        const box = h('div');
        UI.keypad(box, 4, (v) => { DQ.Store.setPin(v); pinMsg.textContent = 'PIN changed.'; }, true);
        return box;
      })(), pinMsg)),
      h('section', { class: 'pz-sec' }, h('h2', {}, 'Privacy'),
        h('ul', { class: 'pz-list' },
          h('li', {}, 'Hero names are built from word tiles. Children never type their real name.'),
          h('li', {}, 'Only an age in years is kept. No birthday, photo, email, location or contacts.'),
          h('li', {}, 'No chat, friends or messages in the Explorer band. Social features only exist in later bands, with moderation and parent controls.'),
          h('li', {}, DQ.Store.persistent ? 'Progress is saved on this device only.' : 'This browser blocks saving, so progress lasts until the page is closed.'))));
  }

  /* minutes-played tracker: counts a minute only while the game is visible and not in the Parent Zone */
  setInterval(() => {
    const p = DQ.Store.data && DQ.Store.player();
    if (!p || document.hidden || ['parent', 'welcome', 'title', 'boot'].includes(UI.current)) return;
    DQ.Store.addMinutes(p, 1);
    DQ.Store.save();
  }, 60000);
})();
