/* Dream Quest — boot. Loads the family profile, downloads content packs, then opens the world. */
(function () {
  'use strict';
  const DQ = window.DQ, U = DQ.util, h = U.h, UI = DQ.UI;

  const WORD_ART = {
    spark: '<svg viewBox="0 0 40 40"><path d="M20 3 l4 12 12 5 -12 5 -4 12 -4 -12 -12 -5 12 -5z" fill="#ffd36b"/></svg>',
    moon: '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="14" fill="#fff6d0"/><circle cx="27" cy="15" r="12" fill="#3b2f7a"/></svg>',
    wind: '<svg viewBox="0 0 40 40"><path d="M4 14 h22 a5 5 0 1 0 -5 -5 M4 22 h28 a5 5 0 1 1 -5 5 M4 30 h14" stroke="#bfe8ff" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg>',
    leaf: '<svg viewBox="0 0 40 40"><path d="M6 34 Q6 6 34 6 Q34 34 6 34 Z" fill="#5fcf8a"/><path d="M8 32 L30 10" stroke="#2f8a5a" stroke-width="2.4"/></svg>',
    sun: '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="9" fill="#ffd36b"/><g stroke="#ffd36b" stroke-width="3" stroke-linecap="round"><path d="M20 3v5M20 32v5M3 20h5M32 20h5M8 8l3.5 3.5M28.5 28.5L32 32M8 32l3.5-3.5M28.5 11.5L32 8"/></g></svg>',
    key: '<svg viewBox="0 0 40 40"><circle cx="13" cy="20" r="8" fill="none" stroke="#ffd36b" stroke-width="4"/><path d="M21 20 h15 M30 20 v6 M35 20 v5" stroke="#ffd36b" stroke-width="4" stroke-linecap="round"/></svg>',
  };

  UI.screens.boot = async function (root) {
    const bar = h('i');
    root.append(h('div', { class: 'boot' }, h('div', { class: 'boot-hoot bob', html: DQ.Art.hoot({ lantern: true }) }),
      h('p', {}, 'Hoot is gathering dreams…'), h('div', { class: 'boot-bar' }, bar)));
    try {
      await DQ.Packs.load((f) => { bar.style.width = Math.round(f * 100) + '%'; });
    } catch (e) {
      root.innerHTML = '';
      root.append(h('div', { class: 'grown-card' }, h('h1', {}, 'Dream Valley could not load'), h('p', {}, String(e.message || e)), h('button', { class: 'big-btn', type: 'button', onclick: () => location.reload() }, 'Try again')));
      return;
    }
    // Paint word-art icons used on hero-name tiles.
    const style = document.createElement('style');
    style.textContent = Object.keys(WORD_ART).map((k) => `.word-art.${k}{background-image:url("data:image/svg+xml,${encodeURIComponent(WORD_ART[k].replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '))}")}`).join('\n');
    document.head.appendChild(style);
    const Store = DQ.Store;
    if (!Store.hasFamily()) return UI.go('welcome');
    if (!Store.data.players.length) return UI.go('welcome', { adding: true });
    Store.data.players.forEach((p) => DQ.Bands.check(p));
    Store.save();
    UI.go('title');
  };

  function start() {
    DQ.Store.load();
    U.$('#caption .cap-replay').addEventListener('click', () => DQ.Voice.repeat());
    // First tap anywhere unlocks audio on iOS/Chrome.
    window.addEventListener('pointerdown', () => DQ.Sfx.unlock(), { once: true });
    UI.go('boot');
  }

  if (window.claude && window.claude.hot && window.claude.hot.ready) window.claude.hot.ready(start);
  else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
