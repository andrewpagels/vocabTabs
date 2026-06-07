// art.js — Art Institute of Chicago public-domain art service for Vocab Tabs.
// Exposes window.ArtService with: getPool(), pickRandom(prevId), accentFrom(color), preload(art).
(function () {
  const { FIELDS, imgUrl, normalize } = window.ArtNormalize;
  const POOL_KEY = 'vocabtabs.artpool.v1';
  const POOL_TTL = 1000 * 60 * 60 * 24 * 7; // 7 days

  // Build an HSL-derived accent that stays legible on a dark scrim.
  function accentFrom(color) {
    if (!color) return 'hsl(38 60% 70%)';
    const h = color.h ?? 38;
    const s = Math.min(Math.max(color.s ?? 50, 40), 72);
    const l = Math.min(Math.max(color.l ?? 55, 58), 74);
    return `hsl(${h} ${s}% ${l}%)`;
  }

  function readCache() {
    try {
      const raw = JSON.parse(localStorage.getItem(POOL_KEY) || 'null');
      if (raw && Array.isArray(raw.items) && raw.items.length && (Date.now() - raw.ts) < POOL_TTL) {
        return raw.items;
      }
    } catch (e) {}
    return null;
  }

  function writeCache(items) {
    try { localStorage.setItem(POOL_KEY, JSON.stringify({ ts: Date.now(), items })); } catch (e) {}
  }

  async function fetchPage(page) {
    const url = `https://api.artic.edu/api/v1/artworks/search?query[term][is_public_domain]=true&fields=${FIELDS}&limit=100&page=${page}`;
    const r = await fetch(url, {
      headers: { 'AIC-User-Agent': 'VocabTabs/1.0 (andrew.pagels@gmail.com)' }
    });
    if (!r.ok) throw new Error('AIC ' + r.status);
    const j = await r.json();
    return (j.data || []).map(normalize).filter(Boolean);
  }

  // Load the bundled pool that ships with the extension. Always available, no network.
  async function loadBundled() {
    try {
      const r = await fetch('artworks.json');
      if (!r.ok) return [];
      const items = await r.json();
      return Array.isArray(items) ? items : [];
    } catch (e) { return []; }
  }

  // Non-blocking: try the live API and, on success, refresh the cache for next time.
  function refreshInBackground() {
    const pages = [];
    const start = 2 + Math.floor(Math.random() * 30);
    for (let i = 0; i < 3; i++) pages.push(start + i);
    Promise.allSettled(pages.map(fetchPage)).then(results => {
      let items = [];
      results.forEach(r => { if (r.status === 'fulfilled') items = items.concat(r.value); });
      const seen = new Set();
      items = items.filter(it => (seen.has(it.id) ? false : (seen.add(it.id), true)));
      if (items.length) writeCache(items);
    }).catch(() => {});
  }

  let poolPromise = null;
  async function getPool() {
    // 1. Fresh cache wins (may have been refreshed on a prior load).
    const cached = readCache();
    if (cached) { refreshInBackground(); return cached; }
    if (poolPromise) return poolPromise;
    poolPromise = (async () => {
      // 2. Bundled pool — instant, offline, cross-browser.
      const bundled = await loadBundled();
      // 3. Kick off a background refresh for next time; do not await it.
      refreshInBackground();
      return bundled;
    })();
    return poolPromise;
  }

  function pickRandom(pool, prevId) {
    if (!pool || !pool.length) return null;
    if (pool.length === 1) return pool[0];
    let a;
    do { a = pool[Math.floor(Math.random() * pool.length)]; } while (a.id === prevId);
    return a;
  }

  function preload(art) {
    if (!art) return Promise.resolve();
    return new Promise((res) => {
      const im = new Image();
      im.onload = res; im.onerror = res;
      im.src = art.image;
    });
  }

  // A tiny offline fallback so the prototype never shows a blank screen.
  const FALLBACK = [{
    id: 0, title: '(offline preview)', artist: 'Connect to the internet',
    artistDisplay: '', date: '', medium: '', origin: '',
    imageId: null, color: { h: 32, s: 40, l: 50 },
    image: '', thumb: '', pageUrl: '#', wikiUrl: '#', _fallback: true
  }];

  window.ArtService = { getPool, pickRandom, accentFrom, preload, imgUrl, FALLBACK };
})();
