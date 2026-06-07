// art-normalize.js — shared artwork-record shaping for Vocab Tabs.
// Used by the browser runtime (window.ArtNormalize) and by scripts/build-pool.js (require).
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ArtNormalize = api;
})(typeof self !== 'undefined' ? self : this, function () {
  const IIIF = 'https://www.artic.edu/iiif/2';
  const FIELDS = [
    'id', 'title', 'artist_title', 'artist_display', 'date_display',
    'image_id', 'color', 'is_public_domain', 'medium_display', 'place_of_origin'
  ].join(',');

  function imgUrl(imageId, w) {
    return `${IIIF}/${imageId}/full/${w || 1200},/0/default.jpg`;
  }

  function aicNormalize(d) {
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
      wikiUrl: `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(d.artist_title || '')}`,
      source: 'aic',
      viewLabel: 'View at the Art Institute'
    };
  }

  const AIC = {
    id: 'aic',
    label: 'Art Institute of Chicago',
    viewLabel: 'View at the Art Institute',
    bundle: 'artworks.aic.json',
    liveRefresh: true,
    searchUrl: (page) =>
      `https://api.artic.edu/api/v1/artworks/search?query[term][is_public_domain]=true&fields=${FIELDS}&limit=100&page=${page}`,
    headers: { 'AIC-User-Agent': 'VocabTabs/1.0 (andrew.pagels@gmail.com)' },
    extract: (j) => (j.data || []),
    normalize: aicNormalize
  };

  function metNormalize(d) {
    if (!d || !d.isPublicDomain || !d.primaryImage) return null;
    const bio = d.artistDisplayBio ? ` — ${d.artistDisplayBio}` : '';
    const name = d.artistDisplayName || 'Unknown artist';
    return {
      id: d.objectID,
      title: d.title || 'Untitled',
      artist: name,
      artistDisplay: d.artistDisplayName ? name + bio : '',
      date: d.objectDate || '',
      medium: d.medium || '',
      origin: d.country || d.culture || '',
      imageId: null,
      color: null,
      image: d.primaryImageSmall || d.primaryImage,
      thumb: d.primaryImageSmall || d.primaryImage,
      pageUrl: d.objectURL || '',
      wikiUrl: `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(d.artistDisplayName || '')}`,
      source: 'met',
      viewLabel: 'View at The Met'
    };
  }

  const MET = {
    id: 'met',
    label: 'The Metropolitan Museum of Art',
    viewLabel: 'View at The Met',
    bundle: 'artworks.met.json',
    liveRefresh: false,
searchUrl: () => 'https://collectionapi.metmuseum.org/public/collection/v1/search?q=painting&hasImages=true',
    objectUrl: (id) => `https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`,
    normalize: metNormalize
  };

  function cmaNormalize(d) {
    const web = d.images && d.images.web;
    if (!web || !web.url) return null;
    const creator = (d.creators && d.creators[0]) || null;
    const desc = creator ? (creator.description || '') : '';
    let artist = 'Unknown artist';
    if (desc) {
      const cut = desc.lastIndexOf(' (');
      artist = (cut > 0 ? desc.slice(0, cut) : desc).trim();
    }
    return {
      id: d.id,
      title: d.title || 'Untitled',
      artist,
      artistDisplay: desc || '',
      date: d.creation_date || '',
      medium: d.technique || '',
      origin: Array.isArray(d.culture) ? (d.culture[0] || '') : (d.culture || ''),
      imageId: null,
      color: null,
      image: web.url,
      thumb: web.url,
      pageUrl: d.url || '',
      wikiUrl: `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(artist)}`,
      source: 'cma',
      viewLabel: 'View at the Cleveland Museum of Art'
    };
  }

  const CMA = {
    id: 'cma',
    label: 'The Cleveland Museum of Art',
    viewLabel: 'View at the Cleveland Museum of Art',
    bundle: 'artworks.cma.json',
    liveRefresh: true,
    searchUrl: (page) =>
      `https://openaccess-api.clevelandart.org/api/artworks/?cc0=1&has_image=1&limit=100&skip=${(page - 1) * 100}`,
    extract: (j) => (j.data || []),
    normalize: cmaNormalize
  };

  const SOURCES = [AIC, MET, CMA];
  function sourceById(id) { return SOURCES.find(s => s.id === id) || null; }

  const SOURCE_IDS = ['aic', 'met', 'cma'];
  const DEFAULT_SETTINGS = Object.freeze({ aic: true, met: false, cma: false });

  function readSettings(raw) {
    const out = { aic: false, met: false, cma: false };
    const obj = (raw && typeof raw === 'object') ? raw : null;
    if (!obj) return { ...DEFAULT_SETTINGS };
    let any = false;
    SOURCE_IDS.forEach(id => { if (obj[id]) { out[id] = true; any = true; } });
    return any ? out : { ...DEFAULT_SETTINGS };
  }

  function enabledIds(settings) {
    return SOURCE_IDS.filter(id => settings && settings[id]);
  }

  function toggleSource(settings, id, enabled) {
    const base = readSettings(settings);
    if (!SOURCE_IDS.includes(id)) return base;
    const next = { ...base, [id]: !!enabled };
    return enabledIds(next).length ? next : base;
  }

  function mergePools(pools) {
    const seen = new Set();
    const out = [];
    (pools || []).forEach(pool => {
      (pool || []).forEach(it => {
        if (!it) return;
        const key = (it.source || '?') + ':' + it.id;
        if (seen.has(key)) return;
        seen.add(key);
        out.push(it);
      });
    });
    return out;
  }

  return { IIIF, FIELDS, imgUrl, normalize: aicNormalize, SOURCES, sourceById, SOURCE_IDS, DEFAULT_SETTINGS, readSettings, enabledIds, toggleSource, mergePools };
});
