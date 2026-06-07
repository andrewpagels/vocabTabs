// scripts/build-pool.js — one-time generator for the bundled artwork pool.
// Run manually:  node scripts/build-pool.js
// Writes ../artworks.json with ~500 normalized public-domain artworks.
const https = require('https');
const fs = require('fs');
const path = require('path');
const { FIELDS, normalize } = require('../art-normalize.js');

const PAGES = [1, 2, 3, 4, 5];
const OUT = path.join(__dirname, '..', 'artworks.json');

function fetchPage(page) {
  const url = `https://api.artic.edu/api/v1/artworks/search?query[term][is_public_domain]=true&fields=${FIELDS}&limit=100&page=${page}`;
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'AIC-User-Agent': 'VocabTabs/1.0 (andrew.pagels@gmail.com)' } }, (res) => {
      if (res.statusCode !== 200) { res.resume(); return reject(new Error(`page ${page}: HTTP ${res.statusCode}`)); }
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { body += c; });
      res.on('end', () => {
        try {
          const j = JSON.parse(body);
          resolve((j.data || []).map(normalize).filter(Boolean));
        } catch (e) { reject(new Error(`page ${page}: bad JSON (${e.message})`)); }
      });
    }).on('error', reject);
  });
}

(async () => {
  try {
    const batches = await Promise.all(PAGES.map(fetchPage));
    let items = [].concat(...batches);
    const seen = new Set();
    items = items.filter((it) => (seen.has(it.id) ? false : (seen.add(it.id), true)));
    if (!items.length) { console.error('No artworks fetched — refusing to write empty pool.'); process.exit(1); }
    fs.writeFileSync(OUT, JSON.stringify(items));
    console.log(`Wrote ${items.length} artworks to ${OUT}`);
  } catch (e) {
    console.error('Build failed:', e.message);
    process.exit(1);
  }
})();
