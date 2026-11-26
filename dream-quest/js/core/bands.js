/* Dream Quest — life bands (data-driven: theme pack + feature flags + difficulty ranges).
 *
 * Bands are never separate apps. Each band is a record in the world pack. The code asks
 * questions like Bands.flag(player, 'groupChat') or Bands.get(n).areas and never
 * hard-codes "if age is 7". Adding Band 2 means shipping packs; no code fork.
 */
(function () {
  'use strict';
  const DQ = window.DQ;

  const Bands = (DQ.Bands = {
    all() { return DQ.World.bands.slice().sort((a, b) => a.id - b.id); },
    get(id) { return DQ.World.bands.find((b) => b.id === id); },
    current(p) { return Bands.get(p.band.current) || Bands.all()[0]; },
    next(p) { return Bands.get(p.band.current + 1) || null; },

    /** Band the player's age calls for (highest band whose minAge <= age). */
    forAge(age) {
      let pick = Bands.all()[0];
      for (const b of Bands.all()) if (age >= b.minAge) pick = b;
      return pick;
    },

    /** A band is playable when it is marked live AND installed packs give it skills. */
    hasContent(id) {
      return Object.values(DQ.Skills.defs).some((d) => d.levels.some((l) => l.band === id));
    },
    isLive(id) {
      const b = Bands.get(id);
      return !!b && b.status === 'live' && Bands.hasContent(id);
    },

    /** Effective feature flags: catalog defaults <- band flags <- per-player grown-up overrides. */
    flags(p) {
      const out = {};
      const cat = DQ.World.flagCatalog || {};
      for (const k in cat) out[k] = cat[k].default;
      Object.assign(out, (Bands.current(p) || {}).flags || {});
      Object.assign(out, p.flagsOverride || {});
      return out;
    },
    flag(p, name) { return Bands.flags(p)[name]; },

    /**
     * Called on launch and after every quest. Works out whether the player has grown into
     * the next band. Moves one band at a time and only when that band's content is installed.
     * Returns { target, waiting } and sets p.band.pending when a growing-up moment is due.
     */
    check(p) {
      const age = DQ.Store.ageNow(p);
      const target = Bands.forAge(age).id;
      const nextId = p.band.current + 1;
      let waiting = null;
      p.band.pending = null;
      if (target > p.band.current && !p.band.hold) {
        if (Bands.isLive(nextId)) p.band.pending = nextId;
        else waiting = nextId; // content for the next band has not shipped yet
      }
      return { target, waiting };
    },

    /** Move to the next band (growing-up moment). */
    advance(p) {
      const nextId = p.band.current + 1;
      if (!Bands.isLive(nextId)) return false;
      p.band.current = nextId;
      p.band.pending = null;
      p.band.ceremonies.push({ band: nextId, on: DQ.util.today() });
      DQ.Store.save();
      return true;
    },
  });
})();
