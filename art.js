// art.js — Art Institute of Chicago public-domain art service for Vocab Tabs.
// Exposes window.ArtService with: getPool(), pickRandom(prevId), accentFrom(color), preload(art).
(function () {
  const IIIF = 'https://www.artic.edu/iiif/2';
  const FIELDS = [
    'id', 'title', 'artist_title', 'artist_display', 'date_display',
    'image_id', 'color', 'is_public_domain', 'medium_display', 'place_of_origin'
  ].join(',');
  const POOL_KEY = 'vocabtabs.artpool.v1';
  const POOL_TTL = 1000 * 60 * 60 * 24 * 7; // 7 days

  function imgUrl(imageId, w) {
    return `${IIIF}/${imageId}/full/${w || 1200},/0/default.jpg`;
  }

  function normalize(d) {
    if (!d.image_id) return null;
    return {
      id: d.id,
      title: d.title || 'Untitled',
      artist: d.artist_title || (d.artist_display || '').split('\n')[0] || 'Unknown artist',
      artistDisplay: d.artist_display || '',
      date: d.date_display || '',
      medium: d.medium_display || '',
      origin: d.place_of_origin || '',
      imageId: d.image_id,
      color: d.color || null,
      image: imgUrl(d.image_id, 1200),
      thumb: imgUrl(d.image_id, 200),
      pageUrl: `https://www.artic.edu/artworks/${d.id}`,
      wikiUrl: `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(d.artist_title || '')}`
    };
  }

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

  let poolPromise = null;
  async function getPool() {
    const cached = readCache();
    if (cached) return cached;
    if (poolPromise) return poolPromise;
    poolPromise = (async () => {
      // pull a few random pages for variety
      const pages = [];
      const start = 2 + Math.floor(Math.random() * 30);
      for (let i = 0; i < 3; i++) pages.push(start + i);
      const results = await Promise.allSettled(pages.map(fetchPage));
      let items = [];
      results.forEach(r => { if (r.status === 'fulfilled') items = items.concat(r.value); });
      // de-dup by id
      const seen = new Set();
      items = items.filter(it => (seen.has(it.id) ? false : (seen.add(it.id), true)));
      if (items.length) writeCache(items);
      return items;
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
