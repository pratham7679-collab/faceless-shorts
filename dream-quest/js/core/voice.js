/* Dream Quest — voice-first narrator + gentle sound effects. */
(function () {
  'use strict';
  const DQ = window.DQ, U = DQ.util;

  // Warm, slow, friendly voices first. The first match wins.
  const PREFERRED = [
    'Samantha', 'Karen', 'Moira', 'Tessa', 'Serena', 'Fiona', 'Victoria', 'Allison', 'Ava',
    'Google UK English Female', 'Microsoft Aria', 'Microsoft Jenny', 'Microsoft Libby', 'Microsoft Sonia',
    'Google US English', 'en-GB', 'en-US', 'en',
  ];

  const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
  let voices = [];
  let token = 0;
  let current = null; // {text}

  function loadVoices() {
    if (!synth) return;
    voices = synth.getVoices().filter((v) => /^en/i.test(v.lang));
  }
  if (synth) { loadVoices(); synth.onvoiceschanged = loadVoices; }

  const Voice = (DQ.Voice = {
    available: !!synth,
    list() { return voices.slice(); },
    chosen() {
      const s = DQ.Store.data && DQ.Store.settings;
      if (s && s.voiceName) { const v = voices.find((x) => x.name === s.voiceName); if (v) return v; }
      for (const p of PREFERRED) {
        const v = voices.find((x) => x.name.includes(p)) || voices.find((x) => x.lang === p);
        if (v) return v;
      }
      return voices[0] || null;
    },

    /** Say text. Resolves when done (or when interrupted). opts: {onWord(charIndex), caption:bool, rate} */
    say(text, opts) {
      opts = opts || {};
      const my = ++token;
      current = { text };
      if (opts.caption !== false) DQ.UI && DQ.UI.caption(text);
      const s = DQ.Store.settings || {};
      const rate = opts.rate || s.rate || 0.85;
      return new Promise((resolve) => {
        let done = false;
        const finish = () => { if (done) return; done = true; if (my === token) DQ.UI && DQ.UI.captionDone(); resolve(my === token); };
        if (!synth) { setTimeout(finish, Math.min(6000, 600 + text.length * 55)); return; }
        try { synth.cancel(); } catch (e) { /* ignore */ }
        const u = new SpeechSynthesisUtterance(text.replace(/[“”]/g, '"'));
        const v = Voice.chosen();
        if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-US';
        u.rate = rate; u.pitch = 1.08; u.volume = 1;
        if (opts.onWord) u.onboundary = (e) => { if (my === token && (e.name === 'word' || e.name === undefined)) opts.onWord(e.charIndex); };
        u.onend = finish; u.onerror = finish;
        // Safety net: some engines never fire onend.
        setTimeout(finish, 2500 + text.length * 110 / rate);
        // Chrome needs a tick after cancel().
        setTimeout(() => { if (my === token) synth.speak(u); }, 40);
      });
    },
    stop() { token++; if (synth) try { synth.cancel(); } catch (e) { /* ignore */ } DQ.UI && DQ.UI.captionDone(); },
    repeat() { if (current) Voice.say(current.text); },
  });

  /* ---------- Sound effects: soft synthesized chimes (no files) ---------- */
  let ctx = null;
  function ac() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; } }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, start, dur, type, gain) {
    const c = ac(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    const t = c.currentTime + start;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain || 0.18, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + dur + 0.05);
  }
  const N = { C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880, C6: 1046.5, E6: 1318.5, G4: 392, A4: 440, E4: 329.63, C4: 261.63 };
  DQ.Sfx = {
    unlock() { ac(); },
    play(name) {
      if (DQ.Store.settings && DQ.Store.settings.sfx === false) return;
      switch (name) {
        case 'tap': tone(N.G5, 0, 0.08, 'triangle', 0.08); break;
        case 'right': [N.C5, N.E5, N.G5, N.C6].forEach((f, i) => tone(f, i * 0.07, 0.35, 'triangle', 0.14)); break;
        case 'orb': tone(N.E6, 0, 0.25, 'sine', 0.1); tone(N.C6, 0.06, 0.3, 'sine', 0.08); break;
        case 'soft': tone(N.E4, 0, 0.22, 'sine', 0.12); tone(N.C4, 0.12, 0.3, 'sine', 0.1); break;
        case 'count': tone(N.A5, 0, 0.12, 'sine', 0.1); break;
        case 'levelup': [N.C5, N.D5, N.E5, N.G5, N.A5, N.C6].forEach((f, i) => tone(f, i * 0.09, 0.4, 'triangle', 0.12)); break;
        case 'lantern': [N.G4, N.C5, N.E5, N.G5].forEach((f, i) => tone(f, i * 0.16, 0.9, 'sine', 0.12)); break;
        case 'whoosh': [N.C4, N.E4, N.G4, N.C5, N.E5, N.G5, N.C6, N.E6].forEach((f, i) => tone(f, i * 0.12, 1.2, 'sine', 0.07)); break;
        default: break;
      }
    },
  };
})();
