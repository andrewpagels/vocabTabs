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
