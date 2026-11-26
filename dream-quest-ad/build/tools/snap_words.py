"""Refine Whisper word starts against the narration waveform. Across a pause (previous word ends in , . ? ! :) Whisper
snaps a word's start to the previous word's end; move it to the end of the real silence (speech onset)."""
import json, re, numpy as np
from scipy.io import wavfile
sr, x = wavfile.read('data/narration.wav'); x = x.astype(float) / 32768
hop = int(0.01 * sr); n = len(x) // hop; rms = np.sqrt((x[:n * hop].reshape(n, hop) ** 2).mean(1)); thr = 0.02 * rms.max()
W = json.load(open('data/words.json')); moved = []
for k in range(1, len(W)):
    p, w = W[k - 1], W[k]
    if not re.search(r'[,.?!:]["”]?$', p['w']): continue
    a, b = int((w['s'] - 0.15) * 100), int((w['s'] + 0.8) * 100); j = a; best = None
    while j < b and j < n:
        if rms[j] < thr:
            st = j
            while j < n and rms[j] < thr: j += 1
            if j - st >= 5: best = j  # silence run >= 50 ms ends at j = onset
            if best: break
        j += 1
    if best and abs(best / 100 - w['s']) > 0.04 and best / 100 < w['e'] + 0.3:
        moved.append((w['w'], w['s'], best / 100)); w['s'] = round(best / 100, 3); w['e'] = round(max(w['e'], w['s'] + 0.12), 3)
json.dump(W, open('data/words.json', 'w'), indent=1)
open('data/words.txt', 'w').write('\n'.join(f"{w['s']:7.2f} {w['e']:7.2f}  L{w['line']:<2d} {w['w']}" for w in W))
for m in moved: print(f'{m[0]:14s} {m[1]:6.2f} -> {m[2]:6.2f}  ({(m[2]-m[1])*1000:+.0f} ms)')
print(len(moved), 'word starts moved to the speech onset after a pause')
