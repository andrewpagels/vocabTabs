# Static Artwork Pool + Keyboard Shortcuts — Design

**Date:** 2026-06-07
**Status:** Approved

## Overview

Two independent improvements to the Vocab Tabs Chrome extension:

1. **Static artwork pool** — bundle ~500 pre-fetched artworks as `artworks.json` so the new tab never waits on (or fails on) a live API call, works offline, and runs in any Chromium browser. The live AIC API is retained only as a non-blocking background refresh.
2. **Keyboard shortcuts** — drive every control from the keyboard, with the shortcut shown in each button's label.

These are unrelated and can be built in either order, but ship together.

---

## Part 1: Static Artwork Pool

### Motivation

`getPool()` currently fetches from `api.artic.edu` on every cache miss. That path is the source of the 403 fragility (Chrome extension `Origin` header gets blocked) and makes the first paint depend on the network. A request run from a terminal does not carry an extension `Origin`, so generating the pool offline sidesteps the problem entirely.

### Generator script

**File:** `scripts/build-pool.js` (new) — a one-time Node script, run manually, not part of the extension bundle.

- Fetches 5 pages of 100 public-domain artworks from the AIC search API (the same query string `art.js` uses today).
- Shapes each record through shared normalization logic (see below).
- De-dupes by `id`.
- Writes the resulting array (~500 items) to `artworks.json` at the extension root.
- Uses only Node built-ins (`https`, `fs`) — no npm dependencies, matching the `generate-icons.js` precedent.
- On a non-200 response or empty result, exits with a non-zero code and an error message rather than writing a partial/empty file.

The developer runs `node scripts/build-pool.js` when they want to refresh the bundled art, then commits the updated `artworks.json`.

### Shared normalization

The record-shaping logic currently lives inside `art.js` as `normalize(d)` and the `imgUrl()`/`IIIF`/`FIELDS` constants. To guarantee the script and the runtime produce identical record shapes, this shaping is extracted into a tiny shared module:

**File:** `art-normalize.js` (new) — defines `imgUrl`, `FIELDS`, and `normalize`, exported in a way usable from both the browser (`window.ArtNormalize`) and Node (`module.exports`). Use the standard dual-export guard:

```js
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ArtNormalize = api;
})(typeof self !== 'undefined' ? self : this, function () {
  const IIIF = 'https://www.artic.edu/iiif/2';
  const FIELDS = [/* ...same field list as today... */].join(',');
  function imgUrl(imageId, w) { return `${IIIF}/${imageId}/full/${w || 1200},/0/default.jpg`; }
  function normalize(d) { /* ...same body as current art.js normalize... */ }
  return { IIIF, FIELDS, imgUrl, normalize };
});
```

`art.js` then consumes `window.ArtNormalize` instead of defining these inline. `scripts/build-pool.js` `require()`s the same file. `newtab.html` loads `art-normalize.js` before `art.js`.

### Runtime change in `art.js`

`getPool()` becomes a three-tier strategy:

1. **localStorage cache** (existing `vocabtabs.artpool.v1`, 7-day TTL) — if fresh, return it immediately.
2. **Bundled `artworks.json`** — fetched via `fetch('artworks.json')` (a local extension file, always available, no network). This is the new instant seed and the offline/cross-browser floor. Returned as the pool for this load.
3. **Background refresh (non-blocking)** — after returning the bundled pool, kick off the existing live-API fetch *without awaiting it*. If it succeeds, write the fresher pool to the localStorage cache so the *next* new tab benefits. If it fails (403, offline, etc.), do nothing — the bundled pool already satisfied this load.

The existing `FALLBACK` single-item offline placeholder stays as a last resort if even `artworks.json` fails to load (e.g., malformed file).

### Files (Part 1)

| File | Action |
|---|---|
| `art-normalize.js` | Create — shared `imgUrl`/`FIELDS`/`normalize`, dual browser/Node export |
| `scripts/build-pool.js` | Create — Node script that fetches ~500 artworks → `artworks.json` |
| `artworks.json` | Create — generated pool, committed to the repo |
| `art.js` | Modify — consume `window.ArtNormalize`; rewrite `getPool` to seed-from-bundle + background-refresh |
| `newtab.html` | Modify — add `<script src="art-normalize.js"></script>` before `art.js` |

### Manifest

No changes. `artworks.json` is a bundled file read via a relative `fetch`, which needs no permission.

---

## Part 2: Keyboard Shortcuts

### Keymap

| Key | Action |
|---|---|
| `Space` or `N` | Next |
| `ArrowUp` | More (show current word more often) |
| `ArrowDown` | Less (show current word less often) |
| `L` | Mark learned |
| `M` | Open Manage panel |

### Implementation

A `useEffect` in `App` (in `app.jsx`) registers a global `keydown` listener on `window`, cleaned up on unmount.

**Guards:**
- Ignore the event if the Manage modal is open (`managing === true`), so the panel's own interactions and any text entry are never hijacked.
- Ignore the event if `document.activeElement` is an `INPUT`, `TEXTAREA`, or has `isContentEditable` set.
- Call `e.preventDefault()` for `Space` so the page doesn't scroll.
- Letter matching is case-insensitive (`e.key.toLowerCase()`).

The handler calls the same functions the buttons already call (`onNext`, `onMore`, `onLess`, `onLearned`, and `setManaging(true)`).

### Button labels

The `ControlBar` button labels gain the shortcut in parentheses:

| Button | New label |
|---|---|
| Less | `Show less (↓)` |
| More | `Show more (↑)` |
| Next | `Next (Space)` |
| Mark learned | `Mark learned (L)` |
| Manage | `Manage (M)` |

The Manage button loses its `compact` flag so it shows the text label like the others.

### Files (Part 2)

| File | Action |
|---|---|
| `app.jsx` | Modify — add `keydown` `useEffect`; update `ControlBar` labels; drop `compact` on Manage |

---

## Build & Verification

- After editing any `.jsx`, run `npm run compile` to regenerate the `.js` files.
- Reload the unpacked extension in `chrome://extensions` (and Helium) and open a new tab.
- **Part 1 success:** art appears instantly with no `api.artic.edu` request required on first paint; disabling the network still shows art.
- **Part 2 success:** Space cycles art/word, arrows adjust frequency, L marks learned, M opens Manage; shortcuts do nothing while Manage is open; button labels show the hints.

## Testing note

This codebase has no automated test harness (no test runner, no existing test files). Verification is manual via the steps above, consistent with how the extension has been validated to date. The implementation plan should not invent a test framework; it should specify concrete manual verification steps per task.
