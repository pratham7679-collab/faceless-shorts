# Dream Quest: Explorer band (ages 7–8)

A playable, voice-first learning adventure in Dream Valley with Hoot the Wise Owl and 33 companions.
This is **Band 1 of a lifelong app** (ages 7 to 30+). Every system is built so later bands
arrive as **data and content packs**, not as a new app.

## Run it

Serve the folder with any static web server and open it in a browser:

```bash
cd dream-quest && python3 -m http.server 8000
```

Then open http://localhost:8000. Opening `index.html` directly from disk also works. In that case
the app uses the packs bundled into `js/packs-bundled.js` instead of downloading them.

First run: a grown-up passes a short adult check, sets a 4-digit Parent Zone PIN and picks the
child's age. The child then picks a buddy and builds a hero name from word tiles.

## What a child can play

| Place | Quest | What it teaches | Levels (one small step each) |
|---|---|---|---|
| Word Woods | **Sound Match** | Phonemic awareness | first sounds (3 pics) → look-alike sounds → 4 pics → ending sounds → short vowels → vowels with 4 pics |
| Word Woods | **Rhyme Time** | Rhyme | 2 pictures → 3 pictures → read 3 words → read 4 words |
| Word Woods | **Sight Word Lanterns** | High-frequency words | first list (3, then 4 lanterns) → second list → tricky words |
| Word Woods | **Read & Find** | Decoding | CVC (2, then 3 pics) → blends → sh/ch/ck → magic-e → mixed |
| Word Woods | **Word Builder** | Encoding / spelling | CVC → CVC + extra stones → blends → digraph tiles → magic-e |
| Number Meadow | **Firefly Count** | Counting | to 5 (tap to count) → to 10 → ten-frames to 20 → next number → tens & ones to 50 → skip-count by 2, 5, 10 |
| Number Meadow | **Orb Adding** | Addition | within 5 with pictures → 10 with pictures → 10 numbers → 20 → missing addend → 2-digit + 1-digit |
| Number Meadow | **Fly-Away Take Away** | Subtraction | the same ladder, with orbs floating away |
| Number Meadow | **Shape Hunt** | Geometry | basic shapes → more shapes → count sides → shape by sides → solids → solids in real things |
| Story Grove | **Story Time** | Listening comprehension | who/what → where & sequence → longer stories → why → feelings → inference & prediction |

Six illustrated stories in three tiers are read aloud with word-by-word highlighting.
Hoot's story is two taps away: **Story Grove**, then **Read it**.

## How it adapts: skill map and mastery gates (`js/core/skills.js`)

- Every answer updates the child's **skill map**: one entry per skill, with level, answer history,
  mastered levels and any pending retry.
- **Step up exactly one level** when 5 of the last 6 first-try answers at the current level are
  right **and** they came from at least 2 different quests. One lucky streak is not enough.
- **Support mode** starts after 2 misses in a row. Questions get one fewer choice, the buddy
  companion offers help, and maths shows counting dots.
- **Step back one level** when 3 of the last 4 answers at a level are missed. The child practises
  there for a quest, then the harder level comes back automatically ("try again later").
- The first quest of a new day opens with a warm-up item from one level down.
- About 20% of items revisit mastered levels (spaced review).
- Inside a question: a wrong tap gives a gentle spoken hint. A second wrong tap makes the right
  answer glow. A child never gets stuck and never sees a red X.

## Rewards, the Dream Quest way (`js/core/rewards.js`)

- **Dream Orbs**: 2 for a first-try answer, 1 after a hint. They fly to the counter.
- **Paw prints** on the **Dream Path**: one per quest. Every 3rd paw print, the child meets a new
  companion (33 in all).
- **Dream Lanterns** on **Lantern Hill**: one lights for every skill level mastered.
- **Daily Trail**: reading, math and a story in one day earns a Moonrise bonus.
- Companions dance, hop, spin and wink on every right answer. Hoot flaps and cheers.

## Grow With Me: the lifelong structure

See [`docs/GROW_WITH_ME.md`](docs/GROW_WITH_ME.md) for the full design. In short:

1. **Bands are data.** `packs/core-world.json` defines all seven life bands, from Explorer (7–8)
   to Life (25–30+). Each band has a theme, region, areas, courses, a companion growth stage,
   difficulty ranges and **feature flags** (`socialMode`, `groupChat`, `languages`,
   `accountOwner`, `addChild` and more). The code only asks questions like
   `Bands.flag(player, 'groupChat')`.
2. **One profile and one skill graph for life.** Skill ladders span bands. A Band 2 pack adds
   higher rungs to the same `math.add` skill with `"extends"`. Planned Band 2–7 skills
   (multiplication, languages, coding, finance…) are already nodes in the graph, with
   prerequisites that point back at Band 1 skills.
3. **Content packs from a server.** `packs/manifest.json` lists packs with versions. On launch the
   app downloads new or changed packs, validates them, checks the app version and required quest
   types, caches them on the device, and falls back to the cache or the bundled copy when offline.
   Point `DQ_CONFIG.packBase` at a CDN to ship content without an app release.
4. **Growing-up moments.** The grown-up enters an age at sign-up. The age advances by itself over
   the years. When it crosses into a new band and that band's packs are installed, the child gets
   an in-game ceremony: the buddy matures, the mist lifts on a new region and new courses appear.
   Parents can **hold** a band or **move up** early in the Parent Zone.
5. **Parent Zone** (PIN): skill map with per-skill ladders and manual "ease back / move up", progress
   and play time, bands and flags, content packs with "check for new content", multiple explorers
   in one family account, narrator voice and speed, daily time limit, PIN change.

## Privacy (COPPA-minded)

Hero names come from word tiles, so no free text is typed. Only an age in years is stored.
There are no photos, emails, locations or social features in the Explorer band. Everything is
saved on the device.

## Files

```
index.html               app shell
css/app.css              Explorer look (night valley, big rounded buttons, Andika reading font)
js/core/                 util, store (family + profiles + migrations), voice + sfx, packs loader,
                         bands, skills (skill graph + mastery gates), rewards
js/engines/              quest types: phonics, build, count, math, shapes, story
js/ui/                   art (all SVG), ui shell + quest runner, child screens, parent zone
packs/                   server content: manifest + world + Band 1 reading, math, stories
js/packs-bundled.js      generated offline copy of packs (node tools/bundle-packs.mjs)
```
