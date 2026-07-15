const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const A = require('../art-normalize.js');

test('DEFAULT_SETTINGS is photography-only', () => {
  assert.deepStrictEqual(A.DEFAULT_SETTINGS, { picsum: true, aic: false, met: false, cma: false });
});

test('readSettings sanitizes garbage to the photography default', () => {
  assert.deepStrictEqual(A.readSettings(null), { picsum: true, aic: false, met: false, cma: false });
  assert.deepStrictEqual(A.readSettings('nonsense'), { picsum: true, aic: false, met: false, cma: false });
  assert.deepStrictEqual(A.readSettings({ met: 'yes', bogus: true }),
    { picsum: false, aic: false, met: true, cma: false });
});

test('readSettings preserves an existing AIC-only preference', () => {
  assert.deepStrictEqual(A.readSettings({ aic: true, met: false, cma: false }),
    { picsum: false, aic: true, met: false, cma: false });
});

test('toggleSource enables and disables', () => {
  const s = A.toggleSource(A.DEFAULT_SETTINGS, 'met', true);
  assert.deepStrictEqual(s, { picsum: true, aic: false, met: true, cma: false });
  const s2 = A.toggleSource(s, 'picsum', false);
  assert.deepStrictEqual(s2, { picsum: false, aic: false, met: true, cma: false });
});

test('toggleSource refuses to disable the last enabled source', () => {
  const onlyAic = { picsum: false, aic: true, met: false, cma: false };
  assert.deepStrictEqual(A.toggleSource(onlyAic, 'aic', false), onlyAic);
});

test('enabledIds returns ids of enabled sources', () => {
  assert.deepStrictEqual(A.enabledIds({ picsum: true, aic: true, met: false, cma: true }), ['picsum', 'aic', 'cma']);
});

test('toggleSource ignores unknown source ids', () => {
  assert.deepStrictEqual(A.toggleSource({ picsum: false, aic: true, met: false, cma: false }, 'xyz', true),
    { picsum: false, aic: true, met: false, cma: false });
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

test('picsum adapter normalizes a landscape photo with attribution', () => {
  const raw = {
    id: '42', author: 'Jane Photographer', width: 4200, height: 2800,
    url: 'https://unsplash.com/photos/example',
    download_url: 'https://picsum.photos/id/42/4200/2800'
  };
  const r = A.sourceById('picsum').normalize(raw);
  assert.strictEqual(r.id, '42');
  assert.strictEqual(r.source, 'picsum');
  assert.strictEqual(r.artistDisplay, 'Photo by Jane Photographer');
  assert.strictEqual(r.image, 'https://picsum.photos/id/42/1920/1080');
  assert.strictEqual(r.pageUrl, 'https://unsplash.com/photos/example');
  assert.strictEqual(r.viewLabel, 'View original photo');
  assert.strictEqual(r.providerLabel, 'Photos via Lorem Picsum');
});

test('picsum adapter filters portrait photos and malformed records', () => {
  const picsum = A.sourceById('picsum');
  assert.strictEqual(picsum.normalize({ id: '1', author: 'A', width: 1000, height: 1600 }), null);
  assert.strictEqual(picsum.normalize({ id: '1', width: 1600, height: 1000 }), null);
});

test('picsum adapter is bundle-only with an anonymous build endpoint', () => {
  const picsum = A.sourceById('picsum');
  assert.strictEqual(picsum.bundle, 'photos.picsum.json');
  assert.strictEqual(picsum.liveRefresh, false);
  assert.ok(picsum.searchUrl(3).includes('page=3'));
});

test('bundled photography pool is populated and attribution-complete', () => {
  const photos = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'photos.picsum.json'), 'utf8'));
  assert.ok(photos.length >= 500);
  assert.ok(photos.every(photo => photo.source === 'picsum'));
  assert.ok(photos.every(photo => photo.image.startsWith('https://picsum.photos/id/')));
  assert.ok(photos.every(photo => photo.artist && photo.pageUrl && photo.providerUrl));
});

test('pool builder rejects missing and unknown source arguments', () => {
  const script = path.join(__dirname, '..', 'scripts', 'build-pool.js');
  const missing = spawnSync(process.execPath, [script, '--source'], { encoding: 'utf8' });
  assert.notStrictEqual(missing.status, 0);
  assert.match(missing.stderr, /Missing value for --source/);
  const unknown = spawnSync(process.execPath, [script, '--source', 'unknown'], { encoding: 'utf8' });
  assert.notStrictEqual(unknown.status, 0);
  assert.match(unknown.stderr, /Unknown source: unknown/);
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

test('SOURCES contains photography and all three museums in order', () => {
  assert.deepStrictEqual(A.SOURCES.map(s => s.id), ['picsum', 'aic', 'met', 'cma']);
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

test('new tab uses a neutral title, removes the wordmark, and keeps extension icons', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'newtab.html'), 'utf8');
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'manifest.json'), 'utf8'));
  assert.match(html, /<title>New Tab<\/title>/);
  assert.match(html, /<link rel="icon"[^>]+href="icons\/icon16\.png"/);
  assert.doesNotMatch(html, /vt-wordmark/);
  assert.strictEqual(manifest.icons['16'], 'icons/icon16.png');
  assert.strictEqual(manifest.icons['48'], 'icons/icon48.png');
  assert.strictEqual(manifest.icons['128'], 'icons/icon128.png');
});
