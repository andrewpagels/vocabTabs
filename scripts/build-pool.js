// scripts/build-pool.js — generates one bundled pool per source.
// Run manually:  node scripts/build-pool.js
// Writes ../artworks.<id>.json for each source in the registry.
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
const MET_TARGET = 700; // how many Met search hits to probe (only ~25% are public domain)

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
  for (const src of SOURCES) {
    try {
      let items = src.id === 'met'
        ? await buildMet(src)
        : await buildPaginated(src, [1, 2, 3, 4, 5]);
      items = dedupe(items);
      if (!items.length) { console.error(`${src.id}: no artworks — skipping write.`); continue; }
      const out = path.join(__dirname, '..', src.bundle);
      fs.writeFileSync(out, JSON.stringify(items));
      console.log(`Wrote ${items.length} artworks to ${out}`);
    } catch (e) {
      console.error(`${src.id}: build failed: ${e.message}`);
    }
  }
})();
