// art.js — multi-source picture service for Vocab Tabs.
// window.ArtService: getPool, pickRandom, accentFrom, preload, imgUrl,
//                    getSources, setSourceEnabled, FALLBACK.
(function () {
  const N = window.ArtNormalize;
  const { SOURCES, sourceById, mergePools, imgUrl,
          readSettings, enabledIds, toggleSource } = N;
  const SETTINGS_KEY = 'vocabtabs.sources.v1';
  const poolKey = (id) => `vocabtabs.artpool.${id}.v1`;
  const POOL_TTL = 1000 * 60 * 60 * 24 * 7; // 7 days

  function accentFrom(color) {
    if (!color) return 'hsl(38 60% 70%)';
    const h = color.h ?? 38;
    const s = Math.min(Math.max(color.s ?? 50, 40), 72);
    const l = Math.min(Math.max(color.l ?? 55, 58), 74);
    return `hsl(${h} ${s}% ${l}%)`;
  }

  // ---- settings (localStorage wrapper over the pure helpers) ----
  function loadSettings() {
    try { return readSettings(JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null')); }
    catch (e) { return readSettings(null); }
  }
  function saveSettings(s) {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch (e) {}
  }
  function getSources() {
    const s = loadSettings();
    return SOURCES.map(src => ({
      id: src.id,
      label: src.label,
      description: src.description || '',
      enabled: !!s[src.id]
    }));
  }
  function setSourceEnabled(id, enabled) {
    const next = toggleSource(loadSettings(), id, enabled);
    saveSettings(next);
    return getSources();
  }

  // ---- per-source cache ----
  function readCache(id) {
    try {
      const raw = JSON.parse(localStorage.getItem(poolKey(id)) || 'null');
      if (raw && Array.isArray(raw.items) && raw.items.length && (Date.now() - raw.ts) < POOL_TTL) {
        return raw.items;
      }
    } catch (e) {}
    return null;
  }
  function writeCache(id, items) {
    try { localStorage.setItem(poolKey(id), JSON.stringify({ ts: Date.now(), items })); } catch (e) {}
  }

  async function loadBundle(src) {
    try {
      const r = await fetch(src.bundle);
      if (!r.ok) return [];
      const items = await r.json();
      return Array.isArray(items) ? items : [];
    } catch (e) { return []; }
  }

  async function fetchPage(src, page) {
    const r = await fetch(src.searchUrl(page), src.headers ? { headers: src.headers } : undefined);
    if (!r.ok) throw new Error(src.id + ' ' + r.status);
    const j = await r.json();
    return src.extract(j).map(src.normalize).filter(Boolean);
  }

  // Background refresh for cheap (liveRefresh) sources only.
  function refreshInBackground(src) {
    if (!src.liveRefresh) return;
    const pages = [];
    const start = 2 + Math.floor(Math.random() * 20);
    for (let i = 0; i < 3; i++) pages.push(start + i);
    Promise.allSettled(pages.map(p => fetchPage(src, p))).then(results => {
      let items = [];
      results.forEach(r => { if (r.status === 'fulfilled') items = items.concat(r.value); });
      const seen = new Set();
      items = items.filter(it => (seen.has(it.id) ? false : (seen.add(it.id), true)));
      if (items.length) writeCache(src.id, items);
    }).catch(() => {});
  }

  // Resolve one source's pool: fresh cache, else bundle; kick a refresh.
  async function poolForSource(src) {
    const cached = readCache(src.id);
    if (cached) { refreshInBackground(src); return cached; }
    const bundled = await loadBundle(src);
    refreshInBackground(src);
    return bundled;
  }

  // Merge all enabled sources. Empty-pool guard: fall back to AIC, then FALLBACK.
  async function getPool() {
    const settings = loadSettings();
    let ids = enabledIds(settings);
    if (!ids.length) ids = enabledIds(N.DEFAULT_SETTINGS);
    let pools = await Promise.all(ids.map(id => poolForSource(sourceById(id))));
    let merged = mergePools(pools);
    if (!merged.length && !ids.includes('aic')) {
      merged = mergePools([await poolForSource(sourceById('aic'))]);
    }
    return merged.length ? merged : FALLBACK;
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

  const FALLBACK = [{
    id: 0, title: '(offline preview)', artist: 'Connect to the internet',
    artistDisplay: '', date: '', medium: '', origin: '',
    imageId: null, color: { h: 32, s: 40, l: 50 },
    image: '', thumb: '', pageUrl: '#', wikiUrl: '#',
    source: 'fallback', infoLabel: 'About this image', viewLabel: 'View source', _fallback: true
  }];

  window.ArtService = { getPool, pickRandom, accentFrom, preload, imgUrl,
                        getSources, setSourceEnabled, FALLBACK };
})();
