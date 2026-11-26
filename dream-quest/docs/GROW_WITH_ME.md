# Grow With Me: how Dream Quest runs from age 7 to 30+

Dream Quest is one app that a person keeps for life. The Explorer build (ages 7–8) ships the
whole lifelong skeleton, and later bands plug into it without a rebuild. This document explains
the five mechanics and what a later band has to ship.

## The rule

**Bands are data. One profile and one skill graph for life. Content arrives as server packs.**
Nothing in the code branches on an age or band number. The code asks the data:

| Question the code asks | Where the answer lives |
|---|---|
| Which areas of Dream Valley are open? | `band.areas` in `core-world.json` |
| Can this player chat, have friends, write, learn languages? | `band.flags` + `flagCatalog` (`Bands.flag(p, name)`) |
| How grown-up do companions look? | `band.companionStage` (1 cub … 6 coach) |
| How many items in a quest? | `flags.questLength` |
| Which levels of a skill can this player reach? | each level's `band` field |
| Which skills are open? | `requires: [{skill, level}]` prerequisites on the skill graph |
| Who controls the account? | `flags.accountOwner` (`parent` → `shared` → `self`) |

## 1. Skill map (`js/core/skills.js`)

`player.skills[skillId]` holds the child's level, the last 60 answers (level, first-try right
or not, which quest, which day), mastered levels and any pending retry. Every answer is recorded
the moment it is given, so the map always shows what the child can do right now.

Skill ladders run across bands. Band 2's math pack does not add a new "math 2" skill. It extends
the existing one:

```json
{ "extends": "math.add", "levels": [
  { "n": 7, "band": 2, "label": "Adds 2-digit and 1-digit numbers up to 99", "params": { "op": "+", "twoDigit": true, "max": 99, "choices": 4 } }
]}
```

A child who mastered `math.add` level 6 at age 8 continues at level 7 the day Band 2 opens.
Their history and lanterns stay where they are.

Skills planned for later bands are already nodes in `core-world.json → skillGraph.planned`,
with prerequisites pointing at Band 1 skills (for example `math.multiply` needs `math.add` L6 and
`math.count` L6). The Parent Zone shows them as "Later on the same skill map".

## 2. Mastery gates

| Rule | Setting (`Skills.GATE`) |
|---|---|
| Step up one level | 5 of the last 6 first-try answers right, from at least 2 different quests |
| Support mode | 2 misses in a row: one fewer choice, a companion hint, counting dots |
| Step back one level | 3 of the last 4 missed at the current level |
| Try again later | the harder level returns 2 quests after a step back |
| Warm-up | first quest of a new day starts one level down |
| Spaced review | about 20% of items revisit mastered levels |
| Band ceiling | a skill cannot pass the highest level its band allows |

A grown-up can ease a skill back or move it up a level from the Parent Zone skill map.

## 3. Age bands and growing-up moments (`js/core/bands.js`)

- At sign-up the grown-up enters an **age in years**. No birthday is stored. `Store.ageNow()`
  adds the years that have passed since then, so the age moves on by itself.
- `Bands.check()` runs on launch and after every quest. If the age calls for a higher band, the
  next band is `live` and its packs are installed, `player.band.pending` is set. The next visit
  to the valley plays the **growing-up moment**: Hoot celebrates, the buddy matures one stage,
  the mist lifts on the new region and its courses appear. Then `Bands.advance()` moves the
  player up **one** band.
- If the next band's packs are not installed yet, the player stays and keeps growing in the
  current band, and the Parent Zone says why.
- Grown-ups can **hold** a band (even after a birthday), **move up now**, or **preview** the
  ceremony without changing anything.

The full arc in `core-world.json`:

| # | Band | Ages | Region | Social mode | Companion role | Account |
|---|---|---|---|---|---|---|
| 1 | Explorer | 7–8 | Dawn Meadow | none | buddy | parent |
| 2 | Adventurer | 9–10 | Whispering Falls | family | buddy | parent |
| 3 | Scholar | 11–12 | Starlight Hills | approved friends | guide | parent |
| 4 | Teen | 13–15 | Lantern City | moderated groups (group chat, clubs, parent-visible) | teammate | shared |
| 5 | Launch | 16–18 | Horizon Coast | open, moderated | coach | shared |
| 6 | Adult | 18–25 | Open Skies | open, moderated | coach | self |
| 7 | Life | 25–30+ | Homestead | open, moderated, `addChild` | coach | self |

Group chat exists only as a flag that turns on in Band 4 (`groupChat`, `parentGate:
"pin+visibility"`). Band 1 contains no social code paths at all.

## 4. Content packs from the server (`js/core/packs.js`)

```
packs/manifest.json          { packs: [ { id, version, band, file, minApp, engines } ] }
packs/core-world.json        bands, flags, areas, companions, planned skill graph
packs/b1-reading.json        lexicon, sounds, sight words, 5 reading skills
packs/b1-math.json           4 math skills
packs/b1-stories.json        6 stories in 3 tiers + story skill
```

On every launch, and from "Check for new content" in the Parent Zone, the loader:

1. downloads the manifest (`DQ_CONFIG.packBase`, default `packs/`);
2. reuses the cached pack when the version matches, otherwise downloads it;
3. validates it, and skips it with a reason if it needs a newer app (`minApp`) or a quest type
   this app does not have (`engines`);
4. caches it on the device and registers it: world packs → bands/areas/companions, skill packs →
   skill graph;
5. when offline, uses the cache, then the copy bundled in `js/packs-bundled.js`.

A pack contains data only. Quest **types** (`phonics`, `build`, `count`, `math`, `shapes`,
`story`) are code. New quests, stories, word lists, levels, companions and whole bands ship as
packs. A brand-new kind of interaction (for example speech practice for languages) ships once as
an app update that registers a new engine. After that, all of its content arrives as packs.

## 5. Parent Zone (`js/ui/parent.js`)

Behind an adult check and a 4-digit PIN:

- **Skill map**: every skill, its status, current level, ladder (mastered / now / later band),
  accuracy, retries, plus ease-back / move-up controls, and the planned skills of later bands.
- **Progress**: quests, minutes today, lanterns, companions, orbs, stories; 7-day play time;
  recent quests with moved-up / stepped-back markers.
- **Bands**: age (+/−), age band vs playing band, hold, move up now, preview the growing-up
  moment, the flags the current band turns on, and the whole 7-band road ahead.
- **Content packs**: installed packs, versions, source (downloaded / device / built in),
  skipped packs with reasons, "Check for new content".
- **Explorers**: one family account with many lifelong profiles; switch, add, reset.
- **Settings**: narrator speed and voice, auto read-aloud, sound effects, daily time limit,
  PIN change, privacy summary.

## Adding Band 2 (checklist)

1. Write `b2-*.json` packs: new skills for its areas (`chapter-cove`, `times-tower`, …) and
   `extends` entries that add higher levels to Band 1 skills.
2. If a new interaction is needed, add an engine file and bump the app version. Packs that need
   it declare `"engines": [...]` and `"minApp"`.
3. In `core-world.json`, set Band 2 `"status": "live"` and fill in its area entries.
4. List the packs in `manifest.json`, bump versions, and run `node tools/bundle-packs.mjs` for the
   offline copy.
5. Publish. Nine-year-olds who are not on hold get their growing-up moment on their next visit.
   Everyone else keeps their place.

## Profile schema and migrations (`js/core/store.js`)

The family record has a `schema` number, and `MIGRATIONS[n]` upgrades n → n+1 step by step. A
profile created at age 7 therefore loads in every future version. Band 6 flips `accountOwner` to
`self` (the account becomes the player's own), and Band 7's `addChild` adds a new player to the
same family account, who starts at Band 1 in the same world.
