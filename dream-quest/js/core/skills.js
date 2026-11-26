/* Dream Quest — lifelong skill graph + mastery gates (the adaptive heart).
 *
 * SKILL GRAPH: every skill (read.sounds, math.add, story.listen …) is a ladder of levels.
 * Packs contribute ladders; a later band's pack can `extends` an existing skill and add
 * higher rungs, so one skill line runs for life (math.add L1 "within 5" … L12 "decimals").
 * Skills unlock through prerequisites (`requires: [{skill, level}]`) and the band ceiling.
 *
 * MASTERY GATE (per skill, per level):
 *   - step UP exactly one level when at least 5 of the last 6 first-try answers at this level
 *     are right AND they came from at least 2 different quests (consistent, not a lucky streak);
 *   - SUPPORT mode after 2 misses in a row: fewer choices + a companion hint up front;
 *   - step BACK one level when 3 of the last 4 at this level are missed, practise there, and
 *     try the harder level again 2 quests later ("tries again later");
 *   - first quest of a new day opens with one warm-up item a level below;
 *   - ~20% of items revisit an already-mastered lower level (spaced review).
 */
(function () {
  'use strict';
  const DQ = window.DQ, U = DQ.util;

  const GATE = { window: 6, need: 5, minQuests: 2, backWindow: 4, backMisses: 3, retryAfter: 2, review: 0.2 };

  const Skills = (DQ.Skills = {
    GATE,
    defs: {},

    reset() { this.defs = {}; },

    addPack(pack) {
      for (const s of pack.skills || []) {
        if (s.extends) {
          const base = this.defs[s.extends];
          if (!base) continue;
          base.levels = base.levels.concat(s.levels).sort((a, b) => a.n - b.n);
          base.packs.push(pack.id);
          continue;
        }
        this.defs[s.id] = Object.assign({ requires: [], items: null }, JSON.parse(JSON.stringify(s)), { packs: [pack.id] });
        this.defs[s.id].levels.sort((a, b) => a.n - b.n);
      }
    },

    def(id) { return this.defs[id]; },
    inArea(area) { return Object.values(this.defs).filter((d) => d.area === area); },
    byDomain() {
      const out = {};
      Object.values(this.defs).forEach((d) => { (out[d.domain] = out[d.domain] || []).push(d); });
      return out;
    },
    planned() { return (DQ.World.skillGraph && DQ.World.skillGraph.planned) || []; },

    /** Highest level allowed in the player's current band. */
    maxLevel(p, id) {
      const d = this.defs[id]; if (!d) return 0;
      const ok = d.levels.filter((l) => l.band <= p.band.current);
      return ok.length ? ok[ok.length - 1].n : 0;
    },
    totalLevels(id) { const d = this.defs[id]; return d ? d.levels.length : 0; },
    level(id, n) { const d = this.defs[id]; return d && (d.levels.find((l) => l.n === n) || d.levels[0]); },

    state(p, id) {
      if (!p.skills[id]) p.skills[id] = { level: 1, hist: [], mastered: [], retry: null, quests: 0, last: null, support: false, missRow: 0, warm: false };
      return p.skills[id];
    },
    isMastered(p, id, level) { const s = p.skills[id]; return !!s && s.mastered.includes(level); },

    unlocked(p, id) {
      const d = this.defs[id];
      if (!d || this.maxLevel(p, id) < 1) return false;
      return (d.requires || []).every((r) => this.isMastered(p, r.skill, r.level));
    },
    lockReason(p, id) {
      const d = this.defs[id];
      const r = (d.requires || []).find((r) => !this.isMastered(p, r.skill, r.level));
      if (!r) return '';
      const rd = this.defs[r.skill];
      return rd ? 'Opens when ' + rd.name + ' glows' : 'Opens later';
    },

    /* ---------- quest lifecycle ---------- */

    beginQuest(p, id) {
      const s = this.state(p, id);
      const events = [];
      s.quests++;
      p.questSeq = (p.questSeq || 0) + 1;
      if (s.retry && s.quests > s.retry.after) {
        s.level = s.retry.level; s.retry = null; s.support = false; s.missRow = 0;
        events.push({ type: 'retry', level: s.level });
      }
      s.warm = !!s.last && s.last !== U.today() && s.level > 1;
      return events;
    },

    pickLevel(p, id, index) {
      const s = this.state(p, id);
      if (index === 0 && s.warm) return s.level - 1;
      const lower = s.mastered.filter((l) => l < s.level);
      if (index > 0 && lower.length && Math.random() < GATE.review) return U.pick(lower);
      return s.level;
    },

    record(p, id, level, ok) {
      const s = this.state(p, id);
      const events = [];
      s.hist.push({ l: level, ok: !!ok, q: p.questSeq, d: U.today() });
      if (s.hist.length > 60) s.hist.splice(0, s.hist.length - 60);
      s.last = U.today();
      s.missRow = ok ? 0 : s.missRow + 1;
      if (s.missRow >= 2 && !s.support) { s.support = true; events.push({ type: 'support' }); }
      if (ok && s.support && s.missRow === 0) {
        const lastTwo = s.hist.slice(-2);
        if (lastTwo.length === 2 && lastTwo.every((h) => h.ok)) s.support = false;
      }
      if (level !== s.level) return events; // warm-up or review item: tracked, not gating

      const at = s.hist.filter((h) => h.l === s.level);
      const recent = at.slice(-GATE.window);
      const right = recent.filter((h) => h.ok).length;
      const quests = new Set(recent.map((h) => h.q)).size;

      if (!s.retry && recent.length >= GATE.window && right >= GATE.need && quests >= GATE.minQuests) {
        if (!s.mastered.includes(level)) { s.mastered.push(level); events.push({ type: 'mastered', level }); }
        if (level < this.maxLevel(p, id)) {
          s.level = level + 1; s.support = false; s.missRow = 0;
          events.push({ type: 'levelUp', from: level, to: s.level });
        } else events.push({ type: 'bandTop', level });
        return events;
      }
      const tail = at.slice(-GATE.backWindow);
      if (s.level > 1 && tail.length >= GATE.backWindow && tail.filter((h) => !h.ok).length >= GATE.backMisses) {
        s.retry = { level: s.level, after: s.quests + GATE.retryAfter - 1 };
        s.level -= 1; s.support = true;
        // While a retry is pending the up-gate is paused; beginQuest() restores the harder level later.
        events.push({ type: 'stepBack', from: s.level + 1, to: s.level });
      }
      return events;
    },

    /** Grown-up override from the Parent Zone. */
    setLevel(p, id, n) {
      const s = this.state(p, id);
      const max = this.maxLevel(p, id);
      n = U.clamp(n, 1, max);
      if (n > s.level) for (let l = s.level; l < n; l++) if (!s.mastered.includes(l)) s.mastered.push(l);
      if (n < s.level) s.mastered = s.mastered.filter((l) => l < n);
      s.level = n; s.retry = null; s.support = false; s.missRow = 0;
      DQ.Store.save();
    },

    /* ---------- reading the skill map ---------- */

    summary(p, id) {
      const d = this.defs[id];
      const s = p.skills[id];
      const max = this.maxLevel(p, id);
      const unlocked = this.unlocked(p, id);
      const level = s ? s.level : 1;
      const recent = s ? s.hist.slice(-10) : [];
      const acc = recent.length ? Math.round((100 * recent.filter((h) => h.ok).length) / recent.length) : null;
      let status = 'new';
      if (!unlocked) status = 'locked';
      else if (s && max && s.mastered.includes(max)) status = 'mastered';
      else if (s && (s.retry || s.support)) status = 'needs-help';
      else if (s && s.hist.length) status = 'practicing';
      const progress = max ? ((s ? s.mastered.filter((l) => l <= max).length : 0) / max) : 0;
      return { id, name: d.name, domain: d.domain, level, max, total: d.levels.length, label: this.level(id, level).label, acc, status, progress, mastered: s ? s.mastered.slice() : [], retry: s && s.retry, plays: s ? s.quests : 0 };
    },

    /** Hoot's pick for "Today's Quest": due retries, untouched domains, weakest skills. */
    recommend(p) {
      const today = U.today();
      const doneDomains = (p.rewards.trail[today] || []);
      const list = Object.keys(this.defs).filter((id) => this.unlocked(p, id));
      let best = null, bestScore = -1;
      for (const id of list) {
        const s = p.skills[id];
        const sum = this.summary(p, id);
        let score = Math.random();
        if (s && s.retry && s.quests >= s.retry.after) score += 5;
        if (!doneDomains.includes(this.defs[id].domain)) score += 3;
        if (!s || s.last !== today) score += 1.5;
        score += 1 - sum.progress;
        if (sum.status === 'mastered') score -= 3;
        if (score > bestScore) { bestScore = score; best = id; }
      }
      return best;
    },
  });
})();
