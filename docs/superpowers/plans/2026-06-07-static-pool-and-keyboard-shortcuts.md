# Static Artwork Pool + Keyboard Shortcuts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bundle ~500 artworks so the new tab loads art instantly and offline in any Chromium browser, and add full keyboard control with shortcut hints in button labels.

**Architecture:** Extract artwork-record shaping into a shared `art-normalize.js` (dual browser/Node export) so a manual Node script (`scripts/build-pool.js`) and the runtime produce identical records. `getPool()` becomes three-tier: localStorage cache → bundled `artworks.json` → non-blocking background API refresh. A global `keydown` listener in `App` maps keys to the existing control handlers.

**Tech Stack:** Vanilla JS + React 18 UMD, JSX compiled via Babel CLI (`npm run compile`), Node built-ins only for the build script. No test runner exists — verification is manual (consistent with prior work on this extension).

---

## Notes for the implementer

- This is a Chrome MV3 extension loaded unpacked. There is **no automated test framework** — do not add one. Each task ends with concrete manual verification in the browser.
- `.jsx` files are source; `.js` files are Babel output. After editing any `.jsx`, run `npm run compile` from the project root (`/Users/andrewpagels/Dropbox/dev/vocabTabs`) to regenerate `.js`. Never hand-edit the generated `.js`.
- The git repo root is the **parent** directory `/Users/andrewpagels/Dropbox/dev`, not `vocabTabs/`. All `git` commands below use `git -C /Users/andrewpagels/Dropbox/dev` and paths are prefixed with `vocabTabs/`.
- All multi-statement-per-line and inline style conventions match the existing codebase — follow them.

---

### Task 1: Shared normalization module (`art-normalize.js`)

**Files:**
- Create: `vocabTabs/art-normalize.js`

- [ ] **Step 1: Create the shared module**

Create `vocabTabs/art-normalize.js` with the artwork-shaping logic extracted verbatim from the current `art.js`, wrapped in a UMD-style guard so it works in both the browser (`window.ArtNormalize`) and Node (`module.exports`):

```js
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

  return { IIIF, FIELDS, imgUrl, normalize };
});
```

- [ ] **Step 2: Verify Node can load it**

Run from `/Users/andrewpagels/Dropbox/dev/vocabTabs`:
```bash
node -e "const a=require('./art-normalize.js'); console.log(typeof a.normalize, typeof a.imgUrl, a.FIELDS.split(',').length)"
```
Expected output: `function function 10`

- [ ] **Step 3: Commit**

```bash
git -C /Users/andrewpagels/Dropbox/dev add vocabTabs/art-normalize.js
git -C /Users/andrewpagels/Dropbox/dev commit -m "feat: extract shared art-normalize module (browser + node)"
```

---

### Task 2: Consume the shared module in `art.js` and load it in `newtab.html`

**Files:**
- Modify: `vocabTabs/art.js:4-14` (remove inline `IIIF`/`FIELDS`/`imgUrl`/`normalize`, reference `window.ArtNormalize`)
- Modify: `vocabTabs/newtab.html:235` (add script tag before `art.js`)

- [ ] **Step 1: Add the script tag to `newtab.html`**

In `vocabTabs/newtab.html`, add the `art-normalize.js` script tag immediately before the existing `art.js` tag (line 235). The block should read:

```html
  <script src="art-normalize.js"></script>
  <script src="art.js"></script>
  <script src="vocab.js"></script>
```

- [ ] **Step 2: Replace the inline definitions in `art.js`**

In `vocabTabs/art.js`, replace the top-of-IIFE constants and the `imgUrl`/`normalize` definitions. Change the opening of the IIFE from:

```js
(function () {
  const IIIF = 'https://www.artic.edu/iiif/2';
  const FIELDS = [
    'id', 'title', 'artist_title', 'artist_display', 'date_display',
    'image_id', 'color', 'is_public_domain', 'medium_display', 'place_of_origin'
  ].join(',');
  const POOL_KEY = 'vocabtabs.artpool.v1';
  const POOL_TTL = 1000 * 60 * 60 * 24 * 7; // 7 days

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
```

to:

```js
(function () {
  const { FIELDS, imgUrl, normalize } = window.ArtNormalize;
  const POOL_KEY = 'vocabtabs.artpool.v1';
  const POOL_TTL = 1000 * 60 * 60 * 24 * 7; // 7 days
```

Leave the rest of `art.js` unchanged in this task (the `getPool` rewrite happens in Task 5). `imgUrl` is still referenced by the existing `window.ArtService` export at the bottom of the file, and `normalize`/`FIELDS` are still used by `fetchPage` — all three now come from the destructured `window.ArtNormalize`.

- [ ] **Step 3: Manual verification**

Reload the unpacked extension at `chrome://extensions` and open a new tab. Expected: art still loads exactly as before (this task is a pure refactor — no behavior change). Open DevTools console; expected: no `ArtNormalize is undefined` or other red errors.

- [ ] **Step 4: Commit**

```bash
git -C /Users/andrewpagels/Dropbox/dev add vocabTabs/art.js vocabTabs/newtab.html
git -C /Users/andrewpagels/Dropbox/dev commit -m "refactor: use shared ArtNormalize in art.js"
```

---

### Task 3: Pool-builder script (`scripts/build-pool.js`)

**Files:**
- Create: `vocabTabs/scripts/build-pool.js`

- [ ] **Step 1: Create the script**

Create `vocabTabs/scripts/build-pool.js`. It uses only Node built-ins (`https`, `fs`, `path`) and the shared `art-normalize.js`. It fetches 5 pages of 100 public-domain artworks, normalizes + de-dupes, and writes `artworks.json` to the extension root. It exits non-zero on failure rather than writing a partial file.

```js
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
```

- [ ] **Step 2: Add a convenience npm script**

In `vocabTabs/package.json`, add a `build-pool` script to the `scripts` block so it reads:

```json
  "scripts": {
    "compile": "babel ui.jsx -o ui.js && babel directions.jsx -o directions.js && babel app.jsx -o app.js",
    "build-pool": "node scripts/build-pool.js"
  },
```

- [ ] **Step 3: Commit**

```bash
git -C /Users/andrewpagels/Dropbox/dev add vocabTabs/scripts/build-pool.js vocabTabs/package.json
git -C /Users/andrewpagels/Dropbox/dev commit -m "feat: add build-pool script to generate artworks.json"
```

---

### Task 4: Generate and commit `artworks.json`

**Files:**
- Create: `vocabTabs/artworks.json` (generated)

- [ ] **Step 1: Run the generator**

Run from `/Users/andrewpagels/Dropbox/dev/vocabTabs`:
```bash
npm run build-pool
```
Expected output: `Wrote <N> artworks to .../artworks.json` where `<N>` is roughly 400–500 (some of the 500 fetched lack an `image_id` and are filtered out).

If this fails with an HTTP error (the AIC API can rate-limit), wait a minute and re-run. If it persistently fails, that is a BLOCKED status — escalate; do not hand-write or fake `artworks.json`.

- [ ] **Step 2: Sanity-check the output**

Run:
```bash
node -e "const a=require('./artworks.json'); console.log(a.length, !!a[0].image, !!a[0].title, !!a[0].id)"
```
Expected: a count (e.g. `437 true true true`). Every record must have a truthy `image`, `title`, and `id`.

- [ ] **Step 3: Commit**

```bash
git -C /Users/andrewpagels/Dropbox/dev add vocabTabs/artworks.json
git -C /Users/andrewpagels/Dropbox/dev commit -m "feat: add bundled artworks.json pool"
```

---

### Task 5: Three-tier `getPool` (cache → bundle → background refresh)

**Files:**
- Modify: `vocabTabs/art.js:66-86` (rewrite `getPool`, keep `fetchPage` and caches)

- [ ] **Step 1: Rewrite `getPool`**

In `vocabTabs/art.js`, replace the current `poolPromise`/`getPool` block:

```js
  let poolPromise = null;
  async function getPool() {
    const cached = readCache();
    if (cached) return cached;
    if (poolPromise) return poolPromise;
    poolPromise = (async () => {
      // pull a few random pages for variety
      const pages = [];
      const start = 2 + Math.floor(Math.random() * 30);
      for (let i = 0; i < 3; i++) pages.push(start + i);
      const results = await Promise.allSettled(pages.map(fetchPage));
      let items = [];
      results.forEach(r => { if (r.status === 'fulfilled') items = items.concat(r.value); });
      // de-dup by id
      const seen = new Set();
      items = items.filter(it => (seen.has(it.id) ? false : (seen.add(it.id), true)));
      if (items.length) writeCache(items);
      return items;
    })();
    return poolPromise;
  }
```

with a three-tier version:

```js
  // Load the bundled pool that ships with the extension. Always available, no network.
  async function loadBundled() {
    try {
      const r = await fetch('artworks.json');
      if (!r.ok) return [];
      const items = await r.json();
      return Array.isArray(items) ? items : [];
    } catch (e) { return []; }
  }

  // Non-blocking: try the live API and, on success, refresh the cache for next time.
  function refreshInBackground() {
    const pages = [];
    const start = 2 + Math.floor(Math.random() * 30);
    for (let i = 0; i < 3; i++) pages.push(start + i);
    Promise.allSettled(pages.map(fetchPage)).then(results => {
      let items = [];
      results.forEach(r => { if (r.status === 'fulfilled') items = items.concat(r.value); });
      const seen = new Set();
      items = items.filter(it => (seen.has(it.id) ? false : (seen.add(it.id), true)));
      if (items.length) writeCache(items);
    }).catch(() => {});
  }

  let poolPromise = null;
  async function getPool() {
    // 1. Fresh cache wins (may have been refreshed on a prior load).
    const cached = readCache();
    if (cached) { refreshInBackground(); return cached; }
    if (poolPromise) return poolPromise;
    poolPromise = (async () => {
      // 2. Bundled pool — instant, offline, cross-browser.
      const bundled = await loadBundled();
      // 3. Kick off a background refresh for next time; do not await it.
      refreshInBackground();
      return bundled;
    })();
    return poolPromise;
  }
```

Note: `refreshInBackground` is intentionally fire-and-forget — its `.then` writes the cache but `getPool` never awaits it, so the first paint never blocks on the network. Calling it on the cache-hit path too keeps the cache rolling forward.

- [ ] **Step 2: Manual verification — normal load**

Reload the unpacked extension and open a new tab. Expected: art appears immediately. In DevTools → Network, the new tab paints art without needing the `api.artic.edu/search` request to complete first (you may still see a background `search` request fire — that's the refresh, and it's fine if it 403s).

- [ ] **Step 3: Manual verification — offline**

In DevTools → Network, set throttling to **Offline**, then clear the cache by running in the DevTools console:
```js
localStorage.removeItem('vocabtabs.artpool.v1'); location.reload();
```
Expected: art still loads from `artworks.json` with no network. (Images themselves come from `www.artic.edu` and won't load while offline, but the pool and word render — confirming the bundle path works.) Set throttling back to **No throttling** when done.

- [ ] **Step 4: Commit**

```bash
git -C /Users/andrewpagels/Dropbox/dev add vocabTabs/art.js
git -C /Users/andrewpagels/Dropbox/dev commit -m "feat: seed pool from bundled artworks.json with background refresh"
```

---

### Task 6: Keyboard shortcuts and button labels

**Files:**
- Modify: `vocabTabs/app.jsx:8-18` (ControlBar labels + drop `compact` on Manage)
- Modify: `vocabTabs/app.jsx:51-59` (add keydown `useEffect`)

- [ ] **Step 1: Update the ControlBar labels**

In `vocabTabs/app.jsx`, replace the `ControlBar` component:

```jsx
function ControlBar({ accent, onLess, onMore, onNext, onLearned, onManage }) {
  return (
    <React.Fragment>
      <CtrlButton icon="less" label="Show less" onClick={onLess} accent={accent} />
      <CtrlButton icon="more" label="Show more" onClick={onMore} accent={accent} />
      <CtrlButton icon="next" label="Next" onClick={onNext} accent={accent} />
      <CtrlButton icon="check" label="Mark learned" onClick={onLearned} accent={accent} />
      <CtrlButton icon="manage" label="Manage words" onClick={onManage} accent={accent} compact />
    </React.Fragment>
  );
}
```

with shortcut hints in each label and the `compact` flag removed from Manage:

```jsx
function ControlBar({ accent, onLess, onMore, onNext, onLearned, onManage }) {
  return (
    <React.Fragment>
      <CtrlButton icon="less" label="Show less (↓)" onClick={onLess} accent={accent} />
      <CtrlButton icon="more" label="Show more (↑)" onClick={onMore} accent={accent} />
      <CtrlButton icon="next" label="Next (Space)" onClick={onNext} accent={accent} />
      <CtrlButton icon="check" label="Mark learned (L)" onClick={onLearned} accent={accent} />
      <CtrlButton icon="manage" label="Manage (M)" onClick={onManage} accent={accent} />
    </React.Fragment>
  );
}
```

- [ ] **Step 2: Add the keydown handler**

In `vocabTabs/app.jsx`, the initial-load `useEffect` currently ends at line 59. Immediately after that `useEffect` (before the `const accent = ...` line), add a second `useEffect` that registers a global keyboard listener. It depends on the handlers it calls, so list them in the dependency array:

```jsx
  // keyboard shortcuts
  useEffect(() => {
    function onKey(e) {
      if (managing) return; // panel open — don't hijack
      const el = document.activeElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      const k = e.key.toLowerCase();
      if (e.key === ' ' || k === 'n') { e.preventDefault(); onNext(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); onMore(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); onLess(); }
      else if (k === 'l') { onLearned(); }
      else if (k === 'm') { setManaging(true); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [managing, onNext, onMore, onLess, onLearned]);
```

Note: `onNext`, `onMore`, `onLess`, `onLearned` are defined as `const` arrow functions further down in `App`. In JavaScript, `const` declarations are not hoisted, but this `useEffect`'s body only *runs* after render (when those consts exist), and the dependency array is evaluated at the same point — so referencing them is safe. Place this `useEffect` after the existing one; it does not matter that the handler `const`s appear textually later.

- [ ] **Step 3: Compile**

Run from `/Users/andrewpagels/Dropbox/dev/vocabTabs`:
```bash
npm run compile
```
Expected: no errors; `app.js` regenerated.

- [ ] **Step 4: Manual verification**

Reload the unpacked extension and open a new tab. Verify:
- `Space` or `N` → loads a new artwork + word
- `↑` → frequency increases (toast: "Showing ... more often")
- `↓` → frequency decreases
- `L` → marks current word learned (toast) and advances
- `M` → opens the Manage panel
- With the Manage panel open, pressing `Space`/arrows/`L` does nothing (no art change behind the modal)
- Each control-bar button shows its hint: `Show less (↓)`, `Show more (↑)`, `Next (Space)`, `Mark learned (L)`, `Manage (M)`

- [ ] **Step 5: Commit**

```bash
git -C /Users/andrewpagels/Dropbox/dev add vocabTabs/app.jsx vocabTabs/app.js
git -C /Users/andrewpagels/Dropbox/dev commit -m "feat: keyboard shortcuts with hints in control-bar labels"
```

---

### Task 7: Push to GitHub

**Files:** none (publish only)

- [ ] **Step 1: Push the subtree**

The GitHub repo mirrors the `vocabTabs/` subfolder via `git subtree`. Push from the parent repo:
```bash
git -C /Users/andrewpagels/Dropbox/dev subtree push --prefix=vocabTabs https://github.com/andrewpagels/vocabTabs.git master
```
Expected: a successful push ending in `... -> master`.

---

## Self-Review

**Spec coverage:**
- Static pool generator (`scripts/build-pool.js`) → Task 3 ✓
- Shared `art-normalize.js` dual export → Task 1 ✓
- `art.js` consumes shared module → Task 2 ✓
- `newtab.html` loads `art-normalize.js` before `art.js` → Task 2 ✓
- `artworks.json` generated + committed → Task 4 ✓
- Three-tier `getPool` (cache → bundle → background refresh) → Task 5 ✓
- Offline / cross-browser verification → Task 5 Step 3 ✓
- Keymap (Space/N, ↑, ↓, L, M) with guards → Task 6 Step 2 ✓
- Button labels with hints; Manage drops `compact` → Task 6 Step 1 ✓
- Manifest unchanged → confirmed (no manifest task needed) ✓
- Push to GitHub (matches established workflow) → Task 7 ✓

**Placeholder scan:** No TBD/TODO/"handle edge cases" — every code step has complete code. ✓

**Type/name consistency:** `ArtNormalize` exposes `{ IIIF, FIELDS, imgUrl, normalize }` and is consumed identically in `art.js` (destructured) and `build-pool.js` (`require`). `getPool` helpers `loadBundled`/`refreshInBackground`/`readCache`/`writeCache`/`fetchPage` all consistent. Handler names `onNext`/`onMore`/`onLess`/`onLearned`/`setManaging` match their definitions in `App`. ✓
