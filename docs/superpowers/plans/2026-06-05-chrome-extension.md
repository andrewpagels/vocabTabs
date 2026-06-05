# Vocab Tabs Chrome Extension — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the existing Vocab Tabs web app into a Chrome Extension (Manifest V3) that replaces the new tab page, showing only the Placard direction with no Tweak Panel.

**Architecture:** No build pipeline — static files loaded directly by Chrome. JSX files are pre-compiled to plain JS using Babel CLI (one-time step) because Chrome MV3 blocks `eval()`, which `@babel/standalone` requires. React and ReactDOM are downloaded locally for the same reason. The app communicates through `window.*` globals exactly as before.

**Tech Stack:** Chrome Extension Manifest V3, React 18.3.1 (UMD/production), Babel CLI 7.x (@babel/preset-react classic runtime), Node.js (for compilation and icon generation only — not a runtime dependency)

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `package.json` | Create | Babel devDependencies + compile script |
| `.babelrc` | Create | preset-react classic runtime config |
| `react.production.min.js` | Create (download) | React UMD bundle, served locally |
| `react-dom.production.min.js` | Create (download) | ReactDOM UMD bundle, served locally |
| `directions.jsx` | Modify | Remove DirectionWall, DirectionImmersive, DIRECTIONS map |
| `app.jsx` | Modify | Remove useTweaks, TWEAK_DEFAULTS, DIR_KEY, TweaksPanel render |
| `ui.js` | Create (compiled) | Babel output from ui.jsx |
| `directions.js` | Create (compiled) | Babel output from directions.jsx |
| `app.js` | Create (compiled) | Babel output from app.jsx |
| `newtab.html` | Create | Renamed + updated Vocab Tabs.html, no CDN/Babel scripts |
| `manifest.json` | Create | MV3 manifest, new tab override, host permissions |
| `generate-icons.js` | Create | One-time Node script, no npm dependencies |
| `icons/icon16.png` | Create (generated) | Chrome extensions page icon |
| `icons/icon48.png` | Create (generated) | Chrome extensions page icon |
| `icons/icon128.png` | Create (generated) | Chrome Web Store / install icon |
| `tweaks-panel.jsx` | Delete | No longer used |

Files untouched: `vocab.js`, `art.js`, `ui.jsx`, `screenshots/`

---

## Task 1: Initialize npm project

**Files:**
- Create: `package.json`
- Create: `.babelrc`

- [ ] **Step 1: Create package.json**

Create `/Users/andrewpagels/Dropbox/dev/vocabTabs/package.json`:

```json
{
  "name": "vocabtabs-extension",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "compile": "babel ui.jsx -o ui.js && babel directions.jsx -o directions.js && babel app.jsx -o app.js"
  },
  "devDependencies": {
    "@babel/cli": "^7.24.0",
    "@babel/core": "^7.24.0",
    "@babel/preset-react": "^7.24.0"
  }
}
```

- [ ] **Step 2: Create .babelrc**

Create `/Users/andrewpagels/Dropbox/dev/vocabTabs/.babelrc`:

```json
{
  "presets": [["@babel/preset-react", { "runtime": "classic" }]]
}
```

`runtime: "classic"` means JSX compiles to `React.createElement()` calls, which are available globally via the UMD React bundle.

- [ ] **Step 3: Install dependencies**

```bash
cd /Users/andrewpagels/Dropbox/dev/vocabTabs && npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .babelrc
git commit -m "chore: add Babel for JSX pre-compilation"
```

---

## Task 2: Download React 18.3.1 production builds

**Files:**
- Create: `react.production.min.js`
- Create: `react-dom.production.min.js`

- [ ] **Step 1: Download React**

```bash
curl -L https://unpkg.com/react@18.3.1/umd/react.production.min.js -o /Users/andrewpagels/Dropbox/dev/vocabTabs/react.production.min.js
```

Expected: file written, ~11KB.

- [ ] **Step 2: Download ReactDOM**

```bash
curl -L https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js -o /Users/andrewpagels/Dropbox/dev/vocabTabs/react-dom.production.min.js
```

Expected: file written, ~130KB.

- [ ] **Step 3: Verify**

```bash
ls -lh /Users/andrewpagels/Dropbox/dev/vocabTabs/react*.js
```

Expected: both files present, react ~11K, react-dom ~130K.

- [ ] **Step 4: Commit**

```bash
git add react.production.min.js react-dom.production.min.js
git commit -m "chore: add React 18.3.1 UMD production builds locally"
```

---

## Task 3: Simplify directions.jsx

**Files:**
- Modify: `directions.jsx`

Remove `DirectionWall`, `DirectionImmersive`, and the `DIRECTIONS` map. Update the window export to only expose what remains.

- [ ] **Step 1: Replace directions.jsx with the simplified version**

Write the following to `/Users/andrewpagels/Dropbox/dev/vocabTabs/directions.jsx`:

```jsx
// directions.jsx — Placard direction for Vocab Tabs. Exports to window.
(function () {

function ArtLayer({ art, fit }) {
  if (!art || art._fallback || !art.image) {
    return <div className="vt-art vt-art-fallback" />;
  }
  return <div className="vt-art" style={{ backgroundImage: `url("${art.image}")`, backgroundSize: fit || 'cover' }} />;
}

function WordBlock({ word, accent, scale }) {
  if (!word) return null;
  return (
    <React.Fragment>
      <div className="vt-wordhead">
        <h1 className="vt-word" style={{ fontSize: `calc(${scale} * clamp(3rem, 7.5vw, 6.5rem))` }}>{word.word}</h1>
        <FrequencyDots weight={word.weight} accent={accent} />
      </div>
      <p className="vt-def" style={{ fontSize: `calc(${scale} * clamp(1.05rem, 1.6vw, 1.5rem))` }}>{word.definition}</p>
      {word.example && (
        <p className="vt-example" style={{ fontSize: `calc(${scale} * clamp(.95rem, 1.3vw, 1.25rem))` }}>
          {'“' + word.example + '”'}
        </p>
      )}
    </React.Fragment>
  );
}

// Gallery Placard: full-bleed art, dark scrim, text lower-left.
function DirectionPlacard(p) {
  return (
    <div className="vt-dir dir-placard" style={{ '--scrim': p.scrim, '--accent': p.accent }}>
      <ArtLayer art={p.art} />
      <div className="vt-scrim scrim-bl" />
      <div className="vt-corner-tr">
        <ArtistPlacard art={p.art} accent={p.accent} alwaysOpen={p.alwaysInfo} />
      </div>
      <div className="vt-content vt-content-bl">
        <WordBlock word={p.word} accent={p.accent} scale={p.textScale} />
        <div className="vt-controls">{p.controls}</div>
      </div>
    </div>
  );
}

Object.assign(window, { DirectionPlacard, ArtLayer, WordBlock });
})();
```

- [ ] **Step 2: Verify Wall and Immersive are gone**

```bash
grep -n "Wall\|Immersive\|DIRECTIONS\|dir-wall\|dir-immersive" /Users/andrewpagels/Dropbox/dev/vocabTabs/directions.jsx
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add directions.jsx
git commit -m "feat: remove Wall and Immersive directions, keep Placard only"
```

---

## Task 4: Simplify app.jsx

**Files:**
- Modify: `app.jsx`

Remove `useTweaks`, `TWEAK_DEFAULTS`, `DIR_KEY`, the dynamic direction lookup, and the `TweaksPanel` render block. Hardcode `SCRIM = 0.62` and `TEXT_SCALE = 1`. Simplify accent to always derive from art color.

- [ ] **Step 1: Replace app.jsx with the simplified version**

Write the following to `/Users/andrewpagels/Dropbox/dev/vocabTabs/app.jsx`:

```jsx
// app.jsx — Vocab Tabs main application.
(function () {
const { useState, useEffect, useRef, useCallback } = React;

const SCRIM = 0.62;
const TEXT_SCALE = 1;

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

function App() {
  const [words, setWords] = useState(() => window.Vocab.load());
  const [pool, setPool] = useState(null);
  const [art, setArt] = useState(null);
  const [word, setWord] = useState(null);
  const [managing, setManaging] = useState(false);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);
  const prevArt = useRef(null);
  const prevWord = useRef(null);
  const toastTimer = useRef(null);
  const poolRef = useRef(null);

  const flash = useCallback((text) => {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 1900);
  }, []);

  const shuffle = useCallback(async (wordsArg) => {
    const ws = wordsArg || words;
    const p = poolRef.current && poolRef.current.length ? poolRef.current : window.ArtService.FALLBACK;
    const nextArt = window.ArtService.pickRandom(p, prevArt.current && prevArt.current.id);
    const nextWord = window.Vocab.pickWeighted(ws, prevWord.current && prevWord.current.word);
    prevArt.current = nextArt; prevWord.current = nextWord;
    if (nextArt && nextArt.image) {
      await window.ArtService.preload(nextArt);
    }
    setArt(nextArt); setWord(nextWord); setLoading(false);
  }, [words]);

  // initial load
  useEffect(() => {
    let done = false;
    window.ArtService.getPool()
      .then(items => { poolRef.current = items; setPool(items); if (!done) shuffle(); })
      .catch(() => { poolRef.current = window.ArtService.FALLBACK; setPool([]); if (!done) shuffle(); });
    const tmr = setTimeout(() => { if (loading) shuffle(); }, 3500);
    return () => { done = true; clearTimeout(tmr); };
  }, []); // eslint-disable-line

  const accent = window.ArtService.accentFrom(art && art.color);

  function refreshWord(updated, msg) {
    window.Vocab.save(updated);
    setWords(updated);
    const w = updated.find(x => x.word === (word && word.word));
    if (w) setWord({ ...w });
    if (msg) flash(msg);
  }

  const onLess = () => { if (!word) return; refreshWord(window.Vocab.adjust(words, word.word, -1), 'Showing “' + word.word + '” less often'); };
  const onMore = () => { if (!word) return; refreshWord(window.Vocab.adjust(words, word.word, +1), 'Showing “' + word.word + '” more often'); };
  const onNext = () => shuffle();
  const onLearned = () => {
    if (!word) return;
    const updated = window.Vocab.setLearned(words, word.word, true);
    window.Vocab.save(updated); setWords(updated);
    flash('“' + word.word + '” marked as learned');
    shuffle(updated);
  };
  const onImport = (parsed) => {
    window.Vocab.save(parsed); setWords(parsed);
    flash('Imported ' + parsed.length + ' words');
    shuffle(parsed);
  };
  const onReset = () => {
    const fresh = window.Vocab.SAMPLE.map(w => ({ ...w }));
    window.Vocab.save(fresh); setWords(fresh);
    flash('Reset to sample set'); shuffle(fresh);
  };

  const controls = <ControlBar accent={accent} onLess={onLess} onMore={onMore} onNext={onNext} onLearned={onLearned} onManage={() => setManaging(true)} />;

  return (
    <div className="vt-root">
      <div className="vt-wordmark">Vocab&nbsp;Tabs</div>
      <DirectionPlacard art={art} word={word} accent={accent}
                        scrim={SCRIM} textScale={TEXT_SCALE} alwaysInfo={false}
                        controls={controls} />

      {loading && (
        <div className="vt-loading"><div className="vt-loading-dot" /><span>finding a painting{'…'}</span></div>
      )}

      {(!loading && (!words.filter(w => !w.learned).length)) && (
        <div className="vt-empty">
          <h2>Every word learned {'—'} nicely done.</h2>
          <p>Upload a new CSV or reset the rotation to keep going.</p>
          <button className="vt-textbtn light" onClick={() => setManaging(true)}>Manage words</button>
        </div>
      )}

      {managing && <ManagePanel words={words} onClose={() => setManaging(false)} onImport={onImport} onReset={onReset} />}
      <Toast text={toast} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
})();
```

- [ ] **Step 2: Verify tweaks-related code is gone**

```bash
grep -n "useTweaks\|TWEAK_DEFAULTS\|DIR_KEY\|TweaksPanel\|TweakSection\|TweakRadio\|TweakSlider\|TweakToggle\|accentSource" /Users/andrewpagels/Dropbox/dev/vocabTabs/app.jsx
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add app.jsx
git commit -m "feat: hardcode Placard direction, remove Tweak Panel from app"
```

---

## Task 5: Delete tweaks-panel.jsx

**Files:**
- Delete: `tweaks-panel.jsx`

- [ ] **Step 1: Delete the file**

```bash
rm /Users/andrewpagels/Dropbox/dev/vocabTabs/tweaks-panel.jsx
```

- [ ] **Step 2: Commit**

```bash
git add -u
git commit -m "chore: delete tweaks-panel.jsx, no longer needed"
```

---

## Task 6: Compile JSX files to JS

**Files:**
- Create: `ui.js`
- Create: `directions.js`
- Create: `app.js`

- [ ] **Step 1: Run Babel compile**

```bash
cd /Users/andrewpagels/Dropbox/dev/vocabTabs && npm run compile
```

Expected output:
```
Successfully compiled 1 file with Babel (Xms).
Successfully compiled 1 file with Babel (Xms).
Successfully compiled 1 file with Babel (Xms).
```

- [ ] **Step 2: Verify compiled files exist**

```bash
ls -lh /Users/andrewpagels/Dropbox/dev/vocabTabs/ui.js /Users/andrewpagels/Dropbox/dev/vocabTabs/directions.js /Users/andrewpagels/Dropbox/dev/vocabTabs/app.js
```

Expected: all three files present, each several KB.

- [ ] **Step 3: Spot-check that JSX is gone from compiled output**

```bash
grep "React.createElement" /Users/andrewpagels/Dropbox/dev/vocabTabs/app.js | head -3
```

Expected: several matches — this confirms JSX was compiled to `React.createElement()` calls.

- [ ] **Step 4: Commit**

```bash
git add ui.js directions.js app.js
git commit -m "chore: add Babel-compiled JS files for Chrome extension"
```

---

## Task 7: Create newtab.html

**Files:**
- Create: `newtab.html`

Copy `Vocab Tabs.html` to `newtab.html` and replace the entire `<body>` script section. The CSS and `<head>` are unchanged.

- [ ] **Step 1: Copy the HTML file**

```bash
cp "/Users/andrewpagels/Dropbox/dev/vocabTabs/Vocab Tabs.html" /Users/andrewpagels/Dropbox/dev/vocabTabs/newtab.html
```

- [ ] **Step 2: Replace the script section at the bottom of newtab.html**

In `newtab.html`, find and replace the entire block from `<script src="https://unpkg.com/react...` through `</body>` with:

```html
  <script src="react.production.min.js"></script>
  <script src="react-dom.production.min.js"></script>

  <script src="art.js"></script>
  <script src="vocab.js"></script>
  <script src="ui.js"></script>
  <script src="directions.js"></script>
  <script src="app.js"></script>
</body>
</html>
```

The old block to replace (lines 232–243 in the original):
```html
  <script src="https://unpkg.com/react@18.3.1/umd/react.development.js" integrity="sha384-hD6/rw4ppMLGNu3tX5cjIb+uRZ7UkRJ6BPkLpg4hAu/6onKUg4lLsHAs9EBPT82L" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js" integrity="sha384-u6aeetuaXnQ38mYT8rp6sbXaQe3NL9t+IBXmnYxwkUI2Hw4bsp2Wvmx4yRQF1uAm" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js" integrity="sha384-m08KidiNqLdpJqLq95G/LEi8Qvjl/xUYll3QILypMoQ65QorJ9Lvtp2RXYGBFj1y" crossorigin="anonymous"></script>

  <script src="art.js"></script>
  <script src="vocab.js"></script>
  <script type="text/babel" src="tweaks-panel.jsx"></script>
  <script type="text/babel" src="ui.jsx"></script>
  <script type="text/babel" src="directions.jsx"></script>
  <script type="text/babel" src="app.jsx"></script>
</body>
</html>
```

- [ ] **Step 3: Verify no CDN or Babel references remain in the script section**

```bash
grep -n "unpkg\|babel\|text/babel\|tweaks-panel" /Users/andrewpagels/Dropbox/dev/vocabTabs/newtab.html
```

Expected: no output.

- [ ] **Step 4: Verify local scripts are present**

```bash
grep -n "script src" /Users/andrewpagels/Dropbox/dev/vocabTabs/newtab.html
```

Expected output:
```
<script src="react.production.min.js"></script>
<script src="react-dom.production.min.js"></script>
<script src="art.js"></script>
<script src="vocab.js"></script>
<script src="ui.js"></script>
<script src="directions.js"></script>
<script src="app.js"></script>
```

- [ ] **Step 5: Commit**

```bash
git add newtab.html
git commit -m "feat: add newtab.html with local scripts, no CDN or Babel standalone"
```

---

## Task 8: Create manifest.json

**Files:**
- Create: `manifest.json`

- [ ] **Step 1: Create manifest.json**

Write the following to `/Users/andrewpagels/Dropbox/dev/vocabTabs/manifest.json`:

```json
{
  "manifest_version": 3,
  "name": "Vocab Tabs",
  "version": "1.0.0",
  "description": "Learn new words every time you open a new tab.",
  "chrome_url_overrides": { "newtab": "newtab.html" },
  "host_permissions": [
    "https://api.artic.edu/*",
    "https://www.artic.edu/*"
  ],
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

- [ ] **Step 2: Validate JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('/Users/andrewpagels/Dropbox/dev/vocabTabs/manifest.json', 'utf8')); console.log('valid')"
```

Expected: `valid`

- [ ] **Step 3: Commit**

```bash
git add manifest.json
git commit -m "feat: add Chrome Extension Manifest V3"
```

---

## Task 9: Generate icons

**Files:**
- Create: `generate-icons.js`
- Create: `icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png`

- [ ] **Step 1: Create generate-icons.js**

Write the following to `/Users/andrewpagels/Dropbox/dev/vocabTabs/generate-icons.js`:

```javascript
#!/usr/bin/env node
// Generates icons/icon{16,48,128}.png — dark #0c0b0a background, white "V".
// No npm dependencies — uses only Node.js built-ins (zlib, fs, path).
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const l = Buffer.allocUnsafe(4); l.writeUInt32BE(data.length);
  const crcBuf = Buffer.allocUnsafe(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([l, t, data, crcBuf]);
}

function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function makePNG(size) {
  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0; // 8-bit RGB

  const stride = 1 + size * 3;
  const raw = Buffer.allocUnsafe(size * stride);

  const cx = size / 2;
  const top = size * 0.2;
  const bot = size * 0.76;
  const hw = size * 0.32;
  const thick = Math.max(1.5, size * 0.11);

  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0; // filter byte: none
    for (let x = 0; x < size; x++) {
      const off = y * stride + 1 + x * 3;
      const dL = distToSegment(x + 0.5, y + 0.5, cx - hw, top, cx, bot);
      const dR = distToSegment(x + 0.5, y + 0.5, cx + hw, top, cx, bot);
      const onV = Math.min(dL, dR) < thick;
      raw[off]     = onV ? 255 : 12;
      raw[off + 1] = onV ? 255 : 11;
      raw[off + 2] = onV ? 255 : 10;
    }
  }

  const idat = zlib.deflateSync(raw, { level: 9 });
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0))
  ]);
}

fs.mkdirSync(path.join(__dirname, 'icons'), { recursive: true });
for (const size of [16, 48, 128]) {
  const data = makePNG(size);
  const outPath = path.join(__dirname, `icons/icon${size}.png`);
  fs.writeFileSync(outPath, data);
  console.log(`Written: icons/icon${size}.png (${data.length} bytes)`);
}
```

- [ ] **Step 2: Run the icon generator**

```bash
node /Users/andrewpagels/Dropbox/dev/vocabTabs/generate-icons.js
```

Expected output:
```
Written: icons/icon16.png (XXX bytes)
Written: icons/icon48.png (XXX bytes)
Written: icons/icon128.png (XXX bytes)
```

- [ ] **Step 3: Verify PNG files exist**

```bash
ls -lh /Users/andrewpagels/Dropbox/dev/vocabTabs/icons/
```

Expected: three `.png` files present.

- [ ] **Step 4: Commit**

```bash
git add generate-icons.js icons/
git commit -m "feat: add icon generator and generated icons"
```

---

## Task 10: Load and verify the extension in Chrome

- [ ] **Step 1: Open Chrome's extension manager**

In Chrome, navigate to `chrome://extensions`.

- [ ] **Step 2: Enable Developer Mode**

Toggle "Developer mode" on (top-right of the extensions page).

- [ ] **Step 3: Load the unpacked extension**

Click "Load unpacked" and select the folder:
`/Users/andrewpagels/Dropbox/dev/vocabTabs`

Expected: "Vocab Tabs" appears in the extension list with no error badge.

- [ ] **Step 4: Open a new tab**

Press `Cmd+T` to open a new tab.

Expected behavior:
- Dark background loads immediately
- "finding a painting…" loading indicator appears briefly
- A public-domain artwork fades in as the background
- A vocabulary word, definition, and example sentence appear in the lower-left
- "Vocab Tabs" wordmark is visible in the upper-left
- Control buttons appear: Show less, Show more, Next, Mark learned, Manage words
- Clicking "Next" loads a new art + word combination
- Clicking "Manage words" opens the word management modal
- No Tweak Panel appears anywhere

- [ ] **Step 5: Verify art loading works**

Open Chrome DevTools on the new tab page (`Cmd+Option+I`). Check the Network tab — requests to `api.artic.edu` and `www.artic.edu` should succeed (200). If they're blocked, confirm `host_permissions` in `manifest.json` includes those domains and reload the extension.

- [ ] **Step 6: Commit final state**

```bash
git add .
git status  # review what's untracked before adding
git commit -m "feat: Vocab Tabs Chrome Extension — Placard mode, no Tweak Panel"
```
