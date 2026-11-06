// scripts/build-pool.js — generates one bundled pool per source.
// Run manually:  node scripts/build-pool.js [sourceId ...]
// Writes ../artworks.<id>.json for each source in the registry.
const https = require('https');
const fs = require('fs');
const path = require('path');
const { SOURCES } = require('../art-normalize.js');
const { parseCSV } = require('./csv.js');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (VocabTabs build-pool)',
  'AIC-User-Agent': 'VocabTabs/1.0 (andrew.pagels@gmail.com)'
};
const PAGE_DELAY_MS = 600;
const MET_OBJ_DELAY_MS = 120;
const MET_TARGET = 400; // Met search is already filtered to public domain; this caps the pool

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
  // v1.1 search is paginated (max 500 IDs/page) and its filters are loose,
  // so gather every ID, then keep fetching until MET_TARGET records pass normalize().
  const all = [];
  for (let offset = 0; ; offset += 500) {
    const page = await getJSON(`${src.searchUrl()}&limit=500&offset=${offset}`);
    const got = page.objectIDs || [];
    all.push(...got);
    if (got.length < 500 || all.length >= (page.total || 0)) break;
    await sleep(PAGE_DELAY_MS);
  }
  // Shuffle so the pool samples the whole result set, not just the lowest IDs.
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  const ids = all;
  const items = [];
  let failed = 0;
  for (const id of ids) {
    if (items.length >= MET_TARGET) break;
    let obj = null;
    for (let attempt = 0; attempt < 3 && !obj; attempt++) {
      try { obj = await getJSON(src.objectUrl(id)); }
      catch (e) { await sleep(1000 * (attempt + 1)); }
    }
    if (!obj) failed++;
    else {
      const rec = src.normalize(obj);
      if (rec) items.push(rec);
    }
    await sleep(MET_OBJ_DELAY_MS);
  }
  if (failed) console.error(`${src.id}: ${failed}/${ids.length} object fetches failed`);
  return items;
}

// National Gallery of Art: open-access CSVs on GitHub (~175 MB total), joined in memory.
const NGA_BASE = 'https://raw.githubusercontent.com/NationalGalleryOfArt/opendata/main/data';
const NGA_TARGET = 400;
const NGA_MIN_YEAR = 1870; // "modern": works begun in 1870 or later
const NGA_CLASSIFICATIONS = ['Painting'];

function getText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: HEADERS }, (res) => {
      if (res.statusCode !== 200) { res.resume(); return reject(new Error(`HTTP ${res.statusCode} ${url}`)); }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    }).on('error', reject);
  });
}

async function buildNga(src) {
  const images = parseCSV(await getText(`${NGA_BASE}/published_images.csv`),
    ['openaccess', 'viewtype', 'iiifurl', 'depictstmsobjectid']);
  const primary = new Map(); // objectid -> iiif base url of its open-access primary image
  images.forEach(im => {
    if (im.openaccess === '1' && im.viewtype === 'primary' && im.iiifurl) {
      primary.set(im.depictstmsobjectid, im.iiifurl);
    }
  });
  const objects = parseCSV(await getText(`${NGA_BASE}/objects.csv`),
    ['objectid', 'title', 'attribution', 'displaydate', 'medium', 'classification', 'beginyear']);
  const pool = objects
    .filter(o => NGA_CLASSIFICATIONS.includes(o.classification)
      && parseInt(o.beginyear, 10) >= NGA_MIN_YEAR && primary.has(o.objectid))
    .map(o => ({
      objectid: o.objectid, title: o.title, attribution: o.attribution,
      displaydate: o.displaydate, medium: o.medium, iiifurl: primary.get(o.objectid)
    }));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  console.log(`nga: ${pool.length} open-access modern paintings; keeping ${Math.min(NGA_TARGET, pool.length)}`);
  return pool.slice(0, NGA_TARGET).map(src.normalize).filter(Boolean);
}

function dedupe(items) {
  const seen = new Set();
  return items.filter(it => (seen.has(it.id) ? false : (seen.add(it.id), true)));
}

(async () => {
  const only = process.argv.slice(2); // optional: node scripts/build-pool.js metmodern
  for (const src of SOURCES) {
    if (only.length && !only.includes(src.id)) continue;
    try {
      let items = (src.id === 'met' || src.id === 'metmodern') ? await buildMet(src)
        : src.id === 'nga' ? await buildNga(src)
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
