# Dream Quest: Kids Learning, 75-second parent ad (vertical)

| File | What it is |
|---|---|
| `dream-quest-ad-1080x1920.mp4` | The finished ad. 1080×1920, H.264 30 fps, AAC 48 kHz stereo 192 kb/s, **76.2 s**, loudness −16 LUFS / −1.5 dBTP |
| `voiceover-script.txt` | The exact narration used, with measured start/end times per line |
| `captions.srt` | The burned-in captions as SRT (85 cues, 1–3 words each, word-timed) |
| `build/` | Full source: re-render with the steps below |

**Story:** grey evening homework fight → lantern lights, colour floods into Dream Valley → the same child: hero name set up by the parent, avatar dress-up → picks Hoot, Hoot hatches, cheers, grows Hatchling → Explorer → Guardian → bedtime Dream Book with "Read to me" + quiz + the four Dream Books → Daily Quest "Counting Comets", Solved!, Dream Orbs, Hoot's dance, Dream Path → Wise Owl explains patiently and gives 1–5 star homework feedback → parent PIN (masked dots, no digits shown) → Weekly Report, "what your child learned this week", No ads / No strangers / Kid-safe by design → "$4.99 once. No subscription. No ads." → end card held ~11 s: "Dream Quest: Kids Learning — Coming soon. Be one of the first families in." Line repeated at start and end: "Learning that grows with your child."

**Honesty:** only features verified in the build; app shown as **Coming soon**, with no app-store claims; no other brands; the PIN is never shown. The Weekly Report numbers and the quiz/homework content on screen are illustrative examples.

## How it was made ($0, all local, no paid APIs)
- **Voice:** Kokoro-82M TTS (Apache-2.0) voice `af_heart`, via this repo's `scripts/voice.py`.
- **Captions:** word timings from local Whisper `small.en` (faster-whisper, MIT) via this repo's `scripts/words.py`, then `build/tools/snap_words.py`. That script moves any word start that Whisper placed inside a pause onto the real speech onset in the waveform.
- **Picture:** every frame drawn in code (HTML canvas, `build/src/art.js`) and captured frame-exactly by headless Chromium (`build/tools/capture.mjs`, adapted from this repo). All art is original vector art in the app's Dream Valley look (purple-pink sky, green hills, gold lantern, Hoot). Font: Fredoka (SIL OFL, `build/fonts/OFL.txt`), the same family the app uses.
- **Character performance:** a procedural rig for the child, parent, Hoot and Wise Owl. It drives irregular blinks (incl. double blinks), eye darts and gaze targets, head tilt and nod, breathing, arm and wing gestures, and blended expressions (sad → wonder → excited; concern → warm → proud), keyed to the word timings. Audit: `build/review/rig-report.txt`.
- **Music & SFX:** original, synthesized with numpy (`build/tools/mix.py`). A muted minor piano for the hook, then a warm major music-box and pad bed after the lantern, ducked ~12 dB under the voice.

## Re-render
```
bash scripts/setup.sh                                 # once: Kokoro + Whisper models
scripts/py scripts/voice.py dream-quest-ad/build
scripts/py scripts/words.py dream-quest-ad/build
cd dream-quest-ad/build && ../../scripts/py tools/snap_words.py
node tools/capture.mjs cues && ../../scripts/py tools/mix.py .
node tools/capture.mjs srt ../captions.srt && node tools/capture.mjs video renders/raw.mp4
ffmpeg -i renders/raw.mp4 -c:v copy -af loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000 -c:a aac -b:a 192k -movflags +faststart ../dream-quest-ad-1080x1920.mp4
../../scripts/py tools/qc.py ../dream-quest-ad-1080x1920.mp4 ../captions.srt   # specs, caption sync, movement
```
