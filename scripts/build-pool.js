// scripts/build-pool.js — generates one bundled image pool per source.
// Run manually:  node scripts/build-pool.js
// Or one source: node scripts/build-pool.js --source picsum
const https = require('https');
const fs = require('fs');
const path = require('path');
const { SOURCES } = require('../art-normalize.js');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (VocabTabs build-pool)',
  'AIC-User-Agent': 'VocabTabs/1.0 (andrew.pagels@gmail.com)'
};
const PAGE_DELAY_MS = 600;
const MET_OBJ_DELAY_MS = 120;
const MET_TARGET = 400; // Met search is already filtered to public domain; this caps the pool

function requestedSourceId(argv) {
  const equals = argv.find(arg => arg.startsWith('--source='));
  if (equals) return equals.slice('--source='.length);
  const index = argv.indexOf('--source');
  if (index < 0) return null;
  const value = argv[index + 1];
  return value && !value.startsWith('--') ? value : '';
}

function sleep(ms) { return new Promise((res) => setTimeout(res, ms)); }

function getJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: HEADERS }, (res) => {
      if (res.statusCode !== 200) { res.resume(); return reject(new Error(`HTTP ${res.statusCode} ${url}`)); }
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { body += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error(`bad JSON ${url}: ${e.message}`)); }
      });
    }).on('error', reject);
  });
}

// AIC + Cleveland: paginated single-call sources.
async function buildPaginated(src, pages) {
  let items = [];
  for (const page of pages) {
    const j = await getJSON(src.searchUrl(page));
    items = items.concat(src.extract(j).map(src.normalize).filter(Boolean));
    if (page !== pages[pages.length - 1]) await sleep(PAGE_DELAY_MS);
  }
  return items;
}

// The Met: search returns IDs, then one object fetch each (N+1).
async function buildMet(src) {
  const search = await getJSON(src.searchUrl());
  const ids = (search.objectIDs || []).slice(0, MET_TARGET);
  const items = [];
  for (const id of ids) {
    try {
      const obj = await getJSON(src.objectUrl(id));
      const rec = src.normalize(obj);
      if (rec) items.push(rec);
    } catch (e) { /* skip individual failures */ }
    await sleep(MET_OBJ_DELAY_MS);
  }
  return items;
}

function dedupe(items) {
  const seen = new Set();
  return items.filter(it => (seen.has(it.id) ? false : (seen.add(it.id), true)));
}

(async () => {
  const onlyId = requestedSourceId(process.argv.slice(2));
  if (onlyId === '') {
    console.error('Missing value for --source');
    process.exit(1);
  }
  const selected = onlyId ? SOURCES.filter(src => src.id === onlyId) : SOURCES;
  if (!selected.length) {
    console.error(`Unknown source: ${onlyId}`);
    process.exit(1);
  }
  let failed = false;
  for (const src of selected) {
    try {
      let items = src.id === 'met'
        ? await buildMet(src)
        : await buildPaginated(src, src.buildPages || [1, 2, 3, 4, 5]);
      items = dedupe(items);
      if (!items.length) {
        console.error(`${src.id}: no images — skipping write.`);
        failed = true;
        continue;
      }
      const out = path.join(__dirname, '..', src.bundle);
      fs.writeFileSync(out, JSON.stringify(items));
      console.log(`Wrote ${items.length} images to ${out}`);
    } catch (e) {
      console.error(`${src.id}: build failed: ${e.message}`);
      failed = true;
    }
  }
  if (failed) process.exitCode = 1;
})();
