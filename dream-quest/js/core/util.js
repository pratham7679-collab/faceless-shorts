/* Dream Quest — shared helpers. Classic script (works from file:// and when hosted). */
(function () {
  'use strict';
  const DQ = (window.DQ = window.DQ || {});
  DQ.APP_VERSION = '1.0.0';
  DQ.config = Object.assign({
    // Where content packs live. Point this at a CDN/server URL to ship new packs without an app rebuild.
    packBase: 'packs/',
    storageKey: 'dreamquest.family.v1',
  }, window.DQ_CONFIG || {});

  const U = (DQ.util = {});

  U.$ = (sel, root) => (root || document).querySelector(sel);
  U.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /** h('div', {class:'x', onclick:fn, html:'<b>'}, child, 'text') */
  U.h = function (tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    for (const kid of kids.flat()) {
      if (kid == null || kid === false) continue;
      el.appendChild(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    }
    return el;
  };

  U.rand = (n) => Math.floor(Math.random() * n);
  U.between = (a, b) => a + U.rand(b - a + 1);
  U.pick = (arr) => arr[U.rand(arr.length)];
  U.shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = U.rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  U.sample = (arr, k) => U.shuffle(arr).slice(0, k);
  U.clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  U.uid = () => Math.random().toString(36).slice(2, 10);
  U.today = (d) => { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  U.sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  U.cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  U.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /** Compare semantic versions: returns -1, 0, 1 */
  U.cmpVersion = (a, b) => {
    const pa = String(a).split('.').map(Number), pb = String(b).split('.').map(Number);
    for (let i = 0; i < 3; i++) { const d = (pa[i] || 0) - (pb[i] || 0); if (d) return d > 0 ? 1 : -1; }
    return 0;
  };

  /** Number choices near the answer, all >= 0, unique. */
  U.numberChoices = (answer, count, spread) => {
    spread = spread || 3;
    const set = new Set([answer]);
    let guard = 0;
    while (set.size < count && guard++ < 200) {
      const d = U.between(1, spread) * (Math.random() < 0.5 ? -1 : 1);
      const v = answer + d;
      if (v >= 0) set.add(v);
    }
    return U.shuffle(Array.from(set));
  };

  /** Tiny non-cryptographic hash for the local parent PIN (device-local gate, not a security boundary). */
  U.hash = (s) => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(16);
  };

  /** Safe localStorage wrappers. */
  U.lsGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  U.lsSet = (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } };
  U.lsDel = (k) => { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } };

  /** Tiny event bus */
  const subs = {};
  DQ.on = (ev, fn) => { (subs[ev] = subs[ev] || []).push(fn); };
  DQ.emit = (ev, data) => { (subs[ev] || []).forEach((fn) => { try { fn(data); } catch (e) { console.error(e); } }); };

  U.reducedMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
})();
