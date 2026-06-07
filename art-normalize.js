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

  const SOURCE_IDS = ['aic', 'met', 'cma'];
  const DEFAULT_SETTINGS = { aic: true, met: false, cma: false };

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
    const next = { ...readSettings(settings), [id]: !!enabled };
    if (!enabledIds(next).length) return { ...readSettings(settings) };
    return next;
  }

  return { IIIF, FIELDS, imgUrl, normalize, SOURCE_IDS, DEFAULT_SETTINGS, readSettings, enabledIds, toggleSource };
});
