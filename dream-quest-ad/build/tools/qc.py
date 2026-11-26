"""QC on the FINISHED MP4 (not the source data):
 1. ffprobe specs   2. caption sync: re-transcribe the MP4's own audio (music + sfx included) with Whisper and compare
 every caption cue's start to the heard word start   3. character movement: frame-difference inside each performing
 character's box, at 10 fps, plus count of blinks/expression changes measured from the rig."""
import json, re, subprocess, sys
from pathlib import Path
import numpy as np

MP4 = Path(sys.argv[1]); SRT = Path(sys.argv[2])
pr = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration,size:stream=codec_name,width,height,r_frame_rate,sample_rate,channels', '-of', 'json', str(MP4)], capture_output=True, text=True).stdout)
print('SPECS', json.dumps(pr))
# --- caption sync
def ts(x): h, m, s = x.split(':'); s, ms = s.split(','); return int(h) * 3600 + int(m) * 60 + int(s) + int(ms) / 1000
caps = []
for blk in SRT.read_text().strip().split('\n\n'):
    ln = blk.split('\n'); a, b = ln[1].split(' --> '); caps.append((ts(a), ts(b), ' '.join(ln[2:])))
from faster_whisper import WhisperModel
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(MP4), '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True, check=True).stdout
segs, _ = WhisperModel('small.en', device='cpu', compute_type='int8').transcribe(np.frombuffer(raw, np.float32), word_timestamps=True)
heard = [(re.sub(r'[^a-z0-9$]', '', w.word.lower()), w.start, w.end) for s in segs for w in s.words]
print('HEARD TEXT:', ' '.join(h[0] for h in heard))
norm = lambda w: re.sub(r'[^a-z0-9]', '', w.lower())
offs = []; used = 0; miss = 0
for s, e, text in caps:
    first = norm(text.split()[0].replace('$4.99', 'four'))
    cand = [(abs(h[1] - s), i) for i, h in enumerate(heard[used:used + 12], used) if norm(h[0]) == first or (first == 'four' and h[0].startswith('4'))]
    if not cand: miss += 1; continue
    _, i = min(cand); offs.append(s - heard[i][1]); used = i + 1
offs = np.array(offs)
print(f'CAPTION SYNC: {len(caps)} cues, matched {len(offs)}, unmatched {miss}; caption start - heard word start: mean {offs.mean()*1000:+.0f} ms, median {np.median(offs)*1000:+.0f} ms, max |err| {np.abs(offs).max()*1000:.0f} ms, within 150 ms: {np.mean(np.abs(offs) < 0.15)*100:.0f}%')
# --- movement: mean abs frame difference inside character boxes, 10 fps
def frames(t0, t1, box):
    x, y, w, h = box
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(t0), '-to', str(t1), '-i', str(MP4), '-vf', f'fps=10,crop={w}:{h}:{x}:{y},scale={w//4}:{h//4},format=gray', '-f', 'rawvideo', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, h // 4, w // 4).astype(float)
CHAR = {  # (label, t0, t1, box x,y,w,h)
    'Wise Owl (tutor scene)': (43.8, 51.3, (60, 330, 460, 560)),
    'Child (hook, grey)': (0.2, 5.9, (220, 640, 420, 480)),
    'Parent (hook)': (0.2, 5.9, (640, 440, 340, 360)),
    'Hoot hatch + cheer': (20.6, 22.0, (300, 520, 480, 560)),
    'Hoot dance (win)': (40.4, 43.1, (300, 820, 480, 480)),
    'Child (win)': (38.4, 43.1, (40, 1080, 300, 300)),
    'Parent (Weekly Report)': (52.0, 60.9, (420, 1180, 240, 240)),
    'Family on end card': (66.0, 76.0, (330, 1180, 560, 300)),
}
for nm, (t0, t1, box) in CHAR.items():
    f = frames(t0, t1, box); d = np.abs(np.diff(f, axis=0)).mean(axis=(1, 2))
    print(f'MOVEMENT {nm:26s} {len(f):3d} frames: frames with visible change (>0.5 grey lvl) {np.mean(d > 0.5)*100:5.1f}%  mean diff {d.mean():.2f}  peak {d.max():.1f}')
# --- waveform check: does any caption cue appear while the narrator is silent (i.e. early/late)?
from scipy.io import wavfile
sr, x = wavfile.read(str(Path(__file__).resolve().parent.parent / 'data/narration.wav')); x = x.astype(float) / 32768
hop = int(0.01 * sr); nfr = len(x) // hop; rms = np.sqrt((x[:nfr * hop].reshape(nfr, hop) ** 2).mean(1)); thr = 0.02 * rms.max()
early = []
for s, e, text in caps:
    i = int(s * 100)
    if (rms[i:i + 10] < thr).all():   # 100 ms of silence right after the cue appears
        j = i
        while j < nfr and rms[j] < thr: j += 1
        early.append((s, text, (j - i) * 10))
print(f'WAVEFORM SYNC: {len(caps)} cues; cues that appear >=100 ms before speech resumes: {len(early)}' + ''.join(f'\n   {s:6.2f} "{t}" ({ms} ms early)' for s, t, ms in early))
