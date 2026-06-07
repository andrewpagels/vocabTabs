const test = require('node:test');
const assert = require('node:assert');
const A = require('../art-normalize.js');

test('DEFAULT_SETTINGS is AIC-only', () => {
  assert.deepStrictEqual(A.DEFAULT_SETTINGS, { aic: true, met: false, cma: false });
});

test('readSettings sanitizes garbage to AIC-only default', () => {
  assert.deepStrictEqual(A.readSettings(null), { aic: true, met: false, cma: false });
  assert.deepStrictEqual(A.readSettings('nonsense'), { aic: true, met: false, cma: false });
  assert.deepStrictEqual(A.readSettings({ met: 'yes', bogus: true }),
    { aic: false, met: true, cma: false });
});

test('toggleSource enables and disables', () => {
  const s = A.toggleSource(A.DEFAULT_SETTINGS, 'met', true);
  assert.deepStrictEqual(s, { aic: true, met: true, cma: false });
  const s2 = A.toggleSource(s, 'aic', false);
  assert.deepStrictEqual(s2, { aic: false, met: true, cma: false });
});

test('toggleSource refuses to disable the last enabled source', () => {
  const onlyAic = { aic: true, met: false, cma: false };
  assert.deepStrictEqual(A.toggleSource(onlyAic, 'aic', false), onlyAic);
});

test('enabledIds returns ids of enabled sources', () => {
  assert.deepStrictEqual(A.enabledIds({ aic: true, met: false, cma: true }), ['aic', 'cma']);
});

test('toggleSource ignores unknown source ids', () => {
  assert.deepStrictEqual(A.toggleSource({ aic: true, met: false, cma: false }, 'xyz', true),
    { aic: true, met: false, cma: false });
});

test('enabledIds handles null input', () => {
  assert.deepStrictEqual(A.enabledIds(null), []);
});

test('SOURCES exposes the aic adapter metadata', () => {
  const aic = A.sourceById('aic');
  assert.strictEqual(aic.id, 'aic');
  assert.strictEqual(aic.label, 'Art Institute of Chicago');
  assert.strictEqual(aic.viewLabel, 'View at the Art Institute');
  assert.strictEqual(aic.bundle, 'artworks.aic.json');
  assert.strictEqual(aic.liveRefresh, true);
});

test('aic adapter normalizes a raw record and tags the source', () => {
  const raw = {
    id: 27992, title: 'A Sunday on La Grande Jatte',
    artist_title: 'Georges Seurat',
    artist_display: 'Georges Seurat\nFrench, 1859-1891',
    date_display: '1884/86', image_id: 'abc-123',
    color: { h: 30, s: 40, l: 50 },
    medium_display: 'Oil on canvas', place_of_origin: 'France'
  };
  const r = A.sourceById('aic').normalize(raw);
  assert.strictEqual(r.id, 27992);
  assert.strictEqual(r.source, 'aic');
  assert.strictEqual(r.viewLabel, 'View at the Art Institute');
  assert.strictEqual(r.image, 'https://www.artic.edu/iiif/2/abc-123/full/1200,/0/default.jpg');
  assert.strictEqual(r.pageUrl, 'https://www.artic.edu/artworks/27992');
});

test('aic adapter returns null when no image_id', () => {
  assert.strictEqual(A.sourceById('aic').normalize({ id: 1, title: 'x' }), null);
});

test('met adapter normalizes a public-domain object', () => {
  const raw = {
    objectID: 437056, isPublicDomain: true,
    title: 'Tommaso di Folco Portinari',
    artistDisplayName: 'Hans Memling',
    artistDisplayBio: 'Netherlandish, active by 1465-died 1494 Bruges',
    objectDate: 'ca. 1470', medium: 'Oil on oak', country: '',
    primaryImage: 'https://images.metmuseum.org/CRDImages/ep/original/DP-44362-005.jpg',
    primaryImageSmall: 'https://images.metmuseum.org/CRDImages/ep/web-large/DP-44362-005.jpg',
    objectURL: 'https://www.metmuseum.org/art/collection/search/437056'
  };
  const r = A.sourceById('met').normalize(raw);
  assert.strictEqual(r.id, 437056);
  assert.strictEqual(r.source, 'met');
  assert.strictEqual(r.viewLabel, 'View at The Met');
  assert.strictEqual(r.artist, 'Hans Memling');
  assert.strictEqual(r.image, 'https://images.metmuseum.org/CRDImages/ep/web-large/DP-44362-005.jpg');
  assert.strictEqual(r.pageUrl, 'https://www.metmuseum.org/art/collection/search/437056');
});

test('met adapter returns null when not public domain or no image', () => {
  const met = A.sourceById('met');
  assert.strictEqual(met.normalize({ objectID: 1, isPublicDomain: false, primaryImage: 'x' }), null);
  assert.strictEqual(met.normalize({ objectID: 1, isPublicDomain: true, primaryImage: '' }), null);
});

test('met adapter metadata is bundle-only', () => {
  assert.strictEqual(A.sourceById('met').liveRefresh, false);
  assert.strictEqual(A.sourceById('met').bundle, 'artworks.met.json');
});

test('cma adapter normalizes a CC0 record', () => {
  const raw = {
    id: 94979, title: 'Nathaniel Hurd',
    creators: [{ description: 'John Singleton Copley (American, 1738–1815)', role: 'artist' }],
    creation_date: 'c. 1765', technique: 'oil on canvas',
    url: 'https://clevelandart.org/art/1915.534',
    images: { web: { url: 'https://openaccess-cdn.clevelandart.org/1915.534/1915.534_web.jpg' } }
  };
  const r = A.sourceById('cma').normalize(raw);
  assert.strictEqual(r.id, 94979);
  assert.strictEqual(r.source, 'cma');
  assert.strictEqual(r.viewLabel, 'View at the Cleveland Museum of Art');
  assert.strictEqual(r.artist, 'John Singleton Copley');
  assert.strictEqual(r.image, 'https://openaccess-cdn.clevelandart.org/1915.534/1915.534_web.jpg');
  assert.strictEqual(r.pageUrl, 'https://clevelandart.org/art/1915.534');
});

test('cma adapter returns null without a web image', () => {
  assert.strictEqual(A.sourceById('cma').normalize({ id: 1, title: 'x', images: {} }), null);
});

test('cma adapter supports live refresh and skip-based pagination', () => {
  const cma = A.sourceById('cma');
  assert.strictEqual(cma.liveRefresh, true);
  assert.ok(cma.searchUrl(2).includes('skip=100'));
});

test('SOURCES contains all three adapters in order', () => {
  assert.deepStrictEqual(A.SOURCES.map(s => s.id), ['aic', 'met', 'cma']);
});

test('cma adapter keeps parentheticals inside the artist name', () => {
  const raw = {
    id: 5, title: 'x',
    creators: [{ description: 'Workshop of Rembrandt (Harmenszoon) van Rijn (Dutch, 1606–1669)' }],
    images: { web: { url: 'https://example/x.jpg' } }
  };
  const r = A.sourceById('cma').normalize(raw);
  assert.strictEqual(r.artist, 'Workshop of Rembrandt (Harmenszoon) van Rijn');
});

test('mergePools dedupes on source:id and keeps cross-source numeric collisions', () => {
  const aic = [{ id: 1, source: 'aic' }, { id: 1, source: 'aic' }];
  const cma = [{ id: 1, source: 'cma' }];
  const merged = A.mergePools([aic, cma]);
  assert.strictEqual(merged.length, 2);
  const keys = merged.map(x => x.source + ':' + x.id).sort();
  assert.deepStrictEqual(keys, ['aic:1', 'cma:1']);
});

test('mergePools tolerates empty/missing pools', () => {
  assert.deepStrictEqual(A.mergePools([]), []);
  assert.deepStrictEqual(A.mergePools([null, [], undefined]), []);
});
