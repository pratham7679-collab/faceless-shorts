/* Dream Quest — family account + lifelong player profiles (device-local, COPPA-minded).
 *
 * One family account holds many players. A player keeps ONE profile for life:
 * hero name (picked from word tiles, never typed), age in years (set by a grown-up),
 * band state, the lifelong skill map, and rewards. No real names, birthdays, photos,
 * emails or locations are ever stored.
 */
(function () {
  'use strict';
  const DQ = window.DQ, U = DQ.util;
  const SCHEMA = 2;

  function freshFamily() {
    return {
      schema: SCHEMA,
      created: U.today(),
      parent: { pinHash: null, salt: U.uid() },
      settings: { rate: 0.85, voiceName: null, sfx: true, music: true, autoRead: true, dailyMinutes: 0 },
      players: [],
      active: null,
    };
  }

  function freshPlayer(opts) {
    return {
      id: U.uid(),
      created: U.today(),
      heroName: opts.heroName || 'Brave Explorer',
      buddy: opts.buddy || 'pip',
      // Age is a whole number of years entered by the grown-up, plus the day it was entered.
      // The current age is derived from it, so bands advance on their own as the years pass.
      age: { years: opts.age || 7, setOn: U.today() },
      // Band: where the player is now. `hold` lets a grown-up keep them in a band.
      band: { current: opts.band || 1, hold: false, pending: null, ceremonies: [] },
      // Lifelong skill map: skillId -> mastery state (see skillgraph.js).
      skills: {},
      rewards: { orbs: 0, paws: 0, lanterns: [], companions: [opts.buddy || 'pip'], trail: {}, storiesRead: [] },
      play: { minutes: {}, quests: 0, log: [] },
      flagsOverride: {}, // per-player feature-flag overrides set by a grown-up
      questSeq: 0,
    };
  }

  /** Forward-only migrations so profiles survive every future app version. */
  const MIGRATIONS = {
    1: (d) => { // v1 -> v2: band became an object; flags override added
      d.players.forEach((p) => {
        if (typeof p.band === 'number') p.band = { current: p.band, hold: false, pending: null, ceremonies: [] };
        p.flagsOverride = p.flagsOverride || {};
      });
      d.schema = 2;
      return d;
    },
  };

  const Store = (DQ.Store = {
    data: null,
    persistent: true,

    load() {
      const raw = U.lsGet(DQ.config.storageKey);
      let d = null;
      if (raw) { try { d = JSON.parse(raw); } catch (e) { d = null; } }
      if (!d || typeof d !== 'object') d = freshFamily();
      while (d.schema < SCHEMA && MIGRATIONS[d.schema]) d = MIGRATIONS[d.schema](d);
      d.settings = Object.assign(freshFamily().settings, d.settings || {});
      this.data = d;
      this.persistent = U.lsSet(DQ.config.storageKey + '.probe', '1');
      U.lsDel(DQ.config.storageKey + '.probe');
      return d;
    },

    save() { U.lsSet(DQ.config.storageKey, JSON.stringify(this.data)); },

    get settings() { return this.data.settings; },
    hasFamily() { return !!this.data.parent.pinHash; },
    setPin(pin) { this.data.parent.pinHash = U.hash(this.data.parent.salt + ':' + pin); this.save(); },
    checkPin(pin) { return this.data.parent.pinHash === U.hash(this.data.parent.salt + ':' + pin); },

    player() { return this.data.players.find((p) => p.id === this.data.active) || null; },
    addPlayer(opts) {
      const p = freshPlayer(opts);
      this.data.players.push(p);
      this.data.active = p.id;
      this.save();
      return p;
    },
    setActive(id) { this.data.active = id; this.save(); },
    removePlayer(id) {
      this.data.players = this.data.players.filter((p) => p.id !== id);
      if (this.data.active === id) this.data.active = this.data.players[0] ? this.data.players[0].id : null;
      this.save();
    },
    resetPlayer(id) {
      const p = this.data.players.find((x) => x.id === id);
      if (!p) return;
      const fresh = freshPlayer({ heroName: p.heroName, buddy: p.buddy, age: p.age.years, band: p.band.current });
      fresh.id = p.id; fresh.age = p.age;
      Object.assign(p, fresh);
      this.save();
    },

    /** Current age in whole years, derived from the grown-up's entry. */
    ageNow(p) {
      const set = new Date(p.age.setOn + 'T12:00:00');
      const years = Math.floor((Date.now() - set.getTime()) / (365.25 * 864e5));
      return p.age.years + Math.max(0, years);
    },

    addMinutes(p, mins) {
      const d = U.today();
      p.play.minutes[d] = (p.play.minutes[d] || 0) + mins;
    },
    minutesToday(p) { return p.play.minutes[U.today()] || 0; },

    exportFamily() { return JSON.stringify(this.data, null, 2); },
  });

  Store.freshPlayer = freshPlayer;
})();
