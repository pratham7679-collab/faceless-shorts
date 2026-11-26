/* Dream Quest — rewards the Dream Quest way: Dream Orbs, Dream Lanterns, the paw-print
 * Dream Path and companions met along it. Never stars-for-score or streak flames. */
(function () {
  'use strict';
  const DQ = window.DQ, U = DQ.util;

  const Rewards = (DQ.Rewards = {
    companion(id) { return DQ.World.companions.find((c) => c.id === id); },

    nextCompanion(p) {
      return DQ.World.companions.find((c) => !p.rewards.companions.includes(c.id)) || null;
    },

    /**
     * Apply the results of a finished quest.
     * summary: { skillId, results: [bool...], events: [...], storyId? }
     * Returns a list of celebration beats for the celebration screen.
     */
    questDone(p, summary) {
      const r = p.rewards;
      const beats = [];
      const right = summary.results.filter(Boolean).length;
      // Every answer earns light: 2 orbs first try, 1 orb after a helping hint.
      const orbs = summary.results.reduce((n, ok) => n + (ok ? 2 : 1), 0) + 2;
      r.orbs += orbs;
      beats.push({ type: 'orbs', n: orbs, right, total: summary.results.length });

      r.paws += 1;
      beats.push({ type: 'paw', n: r.paws });

      for (const ev of summary.events) {
        if (ev.type === 'mastered') {
          const id = summary.skillId + ':' + ev.level;
          if (!r.lanterns.includes(id)) {
            r.lanterns.push(id);
            beats.push({ type: 'lantern', skill: summary.skillId, level: ev.level });
          }
        }
        if (ev.type === 'levelUp') beats.push({ type: 'levelUp', skill: summary.skillId, to: ev.to });
      }

      const every = DQ.World.companionEvery || 3;
      if (r.paws % every === 0) {
        const c = Rewards.nextCompanion(p);
        if (c) { r.companions.push(c.id); beats.push({ type: 'companion', id: c.id }); }
      }

      const today = U.today();
      const domain = DQ.Skills.def(summary.skillId).domain;
      const trail = (r.trail[today] = r.trail[today] || []);
      if (!trail.includes(domain)) {
        trail.push(domain);
        if (['reading', 'math', 'stories'].every((d) => trail.includes(d))) {
          r.orbs += 10;
          beats.push({ type: 'moonrise', n: 10 });
        }
      }
      if (summary.storyId && !r.storiesRead.includes(summary.storyId)) r.storiesRead.push(summary.storyId);

      p.play.quests += 1;
      p.play.log.unshift({ d: today, skill: summary.skillId, level: summary.level, right, total: summary.results.length, ev: summary.events.map((e) => e.type) });
      p.play.log = p.play.log.slice(0, 40);
      DQ.Store.save();
      return beats;
    },

    lanternCount(p) { return p.rewards.lanterns.length; },
    trailToday(p) { return p.rewards.trail[U.today()] || []; },
  });
})();
