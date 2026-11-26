"""Original score + sound effects for the Dream Quest ad, synthesized from scratch with numpy (no samples).
   data/narration.wav + data/cues.json + data/lines.json -> data/mix.wav (48 kHz stereo)
   Hook: sparse, muted minor piano. Turn: shimmer swell. Then a warm major music-box/pad bed, ducked under the voice."""
import json, sys
from pathlib import Path
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt, resample_poly

P = Path(sys.argv[1] if len(sys.argv) > 1 else '.')
SR = 48000
cues = json.loads((P / 'data/cues.json').read_text())
lines = json.loads((P / 'data/lines.json').read_text())['lines']
sr0, v = wavfile.read(P / 'data/narration.wav'); v = v.astype(np.float64) / 32768
v = resample_poly(v, SR, sr0)
DUR = cues['duration']; N = int(DUR * SR) + SR
rng = np.random.default_rng(7)
mus = np.zeros((N, 2)); fx = np.zeros((N, 2))
tt = lambda d: np.arange(int(d * SR)) / SR
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
def lp(x, f): return sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x)
def hp(x, f): return sosfilt(butter(2, f, 'high', fs=SR, output='sos'), x)
def bp(x, a, b): return sosfilt(butter(2, [a, b], 'band', fs=SR, output='sos'), x)
def add(buf, t0, x, g=1.0, pan=0.0):
    i = int(t0 * SR)
    if i < 0: x = x[-i:]; i = 0
    n = min(len(x), len(buf) - i)
    if n <= 0: return
    buf[i:i + n, 0] += x[:n] * g * np.sqrt(0.5 * (1 - pan)) * 1.414 / 1.414
    buf[i:i + n, 1] += x[:n] * g * np.sqrt(0.5 * (1 + pan)) * 1.414 / 1.414

def piano(m, d=2.5, bright=1.0):
    t = tt(d); f = hz(m)
    x = sum(a * np.sin(2 * np.pi * f * h * t * (1 + 0.0004 * h)) * np.exp(-t * (1.2 + h * 0.9)) for h, a in [(1, 1), (2, .5 * bright), (3, .22 * bright), (4, .1 * bright)])
    return x * np.minimum(1, t / 0.006)
def musicbox(m, d=1.8):
    t = tt(d); f = hz(m)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t * 3.2) + 0.35 * np.sin(2 * np.pi * f * 4.01 * t) * np.exp(-t * 7) + 0.15 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t * 4)
    return x * np.minimum(1, t / 0.003)
def pad(ms, d):
    t = tt(d)
    x = sum(np.sin(2 * np.pi * hz(m) * t * (1 + dt)) + 0.3 * np.sin(2 * np.pi * hz(m) * 2 * t * (1 - dt)) for m in ms for dt in (-0.002, 0.002))
    env = np.minimum(1, t / 0.6) * np.minimum(1, (d - t) / 0.6)
    return lp(x, 1800) * env / len(ms)
def bass(m, d):
    t = tt(d); return (np.sin(2 * np.pi * hz(m) * t) + 0.2 * np.sin(4 * np.pi * hz(m) * t)) * np.exp(-t * 2.2) * np.minimum(1, t / 0.01)

# ---- hook: muted minor piano (A minor -> F -> G), low-passed, slightly "tired"
hook_end = lines[2]['start'] + 0.3
for t0, ch in [(0.15, [45, 52, 60, 64]), (2.6, [41, 48, 57, 60]), (4.6, [43, 50, 55, 59])]:
    for j, m in enumerate(ch): add(mus, t0 + j * 0.09, lp(piano(m, 3.2, 0.5), 1400), 0.16, -0.2 + 0.13 * j)
# ---- warm major bed from the title on: F C Dm Bb, 92 bpm, one chord per bar
start = lines[3]['start'] - 0.35; beat = 60 / 92; bar = beat * 4
prog = [(53, [65, 69, 72]), (48, [64, 67, 72]), (50, [65, 69, 74]), (46, [65, 70, 74])]
melo_pat = [0, 2, 1, 2, 0, 1, 2, 1]
t = start; b = 0
end_music = DUR - 0.2
while t < end_music - 0.5:
    root, ch = prog[b % 4]
    last = t + bar > end_music - bar  # final bar: resolve on F and ring
    if last: root, ch = prog[0]
    d = min(bar + 0.7, end_music - t)
    add(mus, t, pad([c - 12 for c in ch], d + 0.6), 0.17)
    add(mus, t, bass(root - 12, beat * 2), 0.2); add(mus, t + beat * 2, bass(root - 12, beat * 2), 0.14)
    if not last:
        for i, p in enumerate(melo_pat):
            m = ch[p] + 12 + (12 if (b % 8 >= 4 and i in (3, 7)) else 0)
            add(mus, t + i * beat / 2, musicbox(m), 0.10 * (1.0 if i % 2 == 0 else 0.7), 0.35 if i % 2 else -0.35)
    else:
        for j, m in enumerate([65, 69, 72, 77, 81]): add(mus, t + j * 0.12, musicbox(m + 12, 3.0), 0.1, -0.4 + 0.2 * j)
    t += bar; b += 1

# ---- sound effects
def tick(): x = hp(rng.standard_normal(int(0.02 * SR)), 2500) * np.exp(-tt(0.02) * 300); return x
def shimmer(d=1.6):
    t = tt(d); x = sum(np.sin(2 * np.pi * f * t + rng.random() * 6) * (0.5 + 0.5 * np.sin(2 * np.pi * (5 + rng.random() * 4) * t)) for f in rng.uniform(2200, 6500, 14))
    return x / 14 * np.sin(np.pi * t / d) ** 2
def whoosh(d=0.7):
    t = tt(d); n = rng.standard_normal(len(t)); out = np.zeros_like(n)
    for k in range(8):
        a, bnd = k * len(t) // 8, (k + 1) * len(t) // 8; fc = 300 + 2600 * (k / 7)
        out[a:bnd] = bp(n, fc * 0.7, fc * 1.3)[a:bnd]
    return out * np.sin(np.pi * t / d) ** 1.5 * 0.8
def bell(m, d=2.2): t = tt(d); f = hz(m); return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 3) + 0.2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 6)) * np.exp(-t * 1.6) * np.minimum(1, t / 0.002)
def pop(): t = tt(0.12); f = 900 * np.exp(-t * 18) + 250; return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 30)
def tap(): t = tt(0.04); return bp(rng.standard_normal(len(t)), 900, 2200) * np.exp(-t * 120) * 0.6
def ping(m, d=0.5): t = tt(d); return np.sin(2 * np.pi * hz(m) * t) * np.exp(-t * 9)
def seq(parts):
    L = max(int(d * SR) + len(x) for d, x in parts); o = np.zeros(L)
    for d, x in parts: i = int(d * SR); o[i:i + len(x)] += x
    return o
SFX = {
    'tick': lambda v: tick() * 0.25 * v,
    'shimmer': lambda v: shimmer() * 0.22 * v,
    'whoosh': lambda v: whoosh() * 0.22 * v,
    'chime': lambda v: seq([(0, bell(77)), (0.1, bell(81)), (0.2, bell(84))]) * 0.12 * v,
    'tap': lambda v: tap() * 0.25 * v,
    'pop': lambda v: pop() * 0.22 * v,
    'sparkle': lambda v: seq([(i * 0.06, ping(96 + (i * 5) % 12, 0.35)) for i in range(5)]) * 0.05 * v,
    'select': lambda v: seq([(0, ping(79)), (0.08, ping(84))]) * 0.12 * v,
    'crack': lambda v: seq([(i * .11, hp(rng.standard_normal(int(.03 * SR)), 1500) * np.exp(-tt(.03) * 150)) for i in range(3)]) * 0.12 * v,
    'yay': lambda v: seq([(i * 0.07, musicbox(m, 0.8)) for i, m in enumerate([77, 81, 84, 89])]) * 0.1 * v,
    'ding': lambda v: bell(84 + int(round((v - 0.5) * 10)), 1.2) * 0.08,
    'correct': lambda v: seq([(0, bell(88, 1.0)), (0.12, bell(93, 1.0))]) * 0.09 * v,
    'success': lambda v: seq([(i * 0.08, musicbox(m, 1.2)) for i, m in enumerate([72, 76, 79, 84, 88])]) * 0.13 * v,
    'orb': lambda v: ping(91 + rng.integers(0, 5), 0.3) * 0.08 * v,
}
for cu in cues['cues']:
    x = SFX[cu['type']](cu.get('v', 1)); add(fx, cu['t'], x, 1.0, float(rng.uniform(-0.3, 0.3)))

# ---- voice + ducking
voice = np.zeros(N); voice[:len(v)] = v[:N]
voice = hp(voice, 70)
env = np.abs(voice); win = int(0.05 * SR)
env = np.convolve(env, np.ones(win) / win, 'same')
# fast vectorised attack/release via block processing (10 ms)
hop = int(0.01 * SR); nb = len(env) // hop + 1; blk = np.array([env[i * hop:(i + 1) * hop].max() if i * hop < len(env) else 0 for i in range(nb)])
out = np.zeros(nb); cur = 0
for i, x in enumerate(blk):
    cur = x if x > cur else cur * 0.965 + x * 0.035
    out[i] = cur
duck = np.interp(np.arange(N), np.arange(nb) * hop, out); duck = duck / (duck.max() + 1e-9)
mgain = 0.42 * (1 - 0.6 * np.clip(duck * 3, 0, 1))
mus *= mgain[:, None]
mix = mus + fx + np.stack([voice, voice], 1) * 0.92
# fade music tail
fade = np.ones(N); fe = int(DUR * SR); fs = int((DUR - 1.6) * SR); fade[fs:fe] = np.linspace(1, 0, fe - fs); fade[fe:] = 0
mix *= fade[:, None]
mix = mix[:int(DUR * SR)]
mix /= np.abs(mix).max() + 1e-9; mix *= 0.89
wavfile.write(P / 'data/mix.wav', SR, (mix * 32767).astype(np.int16))
print(f'data/mix.wav {len(mix) / SR:.2f} s, {len(cues["cues"])} cues')
# balance report: voice vs bed (music+fx) while the narrator is speaking
spk = np.zeros(N, bool)
for ln in lines: spk[int(ln['start'] * SR):int(ln['end'] * SR)] = True
spk = spk[:len(mix)]
db = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
print(f'during speech: voice {db(voice[:len(mix)][spk] * 0.92):.1f} dB, music {db(mus[:len(mix)][spk, 0]):.1f} dB, fx {db(fx[:len(mix)][spk, 0]):.1f} dB; music in gaps {db(mus[:len(mix)][~spk, 0]):.1f} dB')
