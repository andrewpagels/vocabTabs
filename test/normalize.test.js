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
