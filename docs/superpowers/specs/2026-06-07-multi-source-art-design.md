# Multi-Source Art — Design Spec

**Date:** 2026-06-07
**Status:** Approved design, pending implementation plan

## Goal

Let the user choose which museum collections supply the background artwork, via
checkboxes in the **Manage** panel. Today the only source is the Art Institute of
Chicago (AIC). This adds **The Metropolitan Museum of Art** and **The Cleveland
Museum of Art** as opt-in sources.

## Feasibility note (why these three)

The originally requested museums — SFMOMA, The Broad, Guggenheim Bilbao, Tate
Modern, MoMA — are modern/contemporary collections. They offer **no open
public-domain image APIs** and their holdings are largely under copyright, so
their images cannot be fetched and redistributed inside the extension. They were
dropped. AIC, The Met, and Cleveland all offer **open, no-API-key,
public-domain** image APIs, which is what makes this feature possible without
embedding secrets in a shipped extension.

## Non-goals

- No API-key-based sources (Rijksmuseum, Harvard, Smithsonian) — a key embedded
  in a client-side extension would be publicly readable.
- No per-source filtering/curation UI beyond the on/off checkbox.
- No live (in-browser) refresh for The Met (see "Image supply" below).

## Architecture

### 1. Source adapter registry

Each museum becomes a self-contained **adapter** with a uniform interface. The
rest of the app never sees museum-specific API shapes.

Adapter shape:

```js
{
  id: 'aic',                               // stable key used in settings + cache
  label: 'Art Institute of Chicago',       // checkbox label
  viewLabel: 'View at the Art Institute',  // placard link text
  bundle: 'artworks.aic.json',             // shipped offline pool filename
  liveRefresh: true,                       // whether cheap background refresh is supported
  fetchPage(page),                         // API call -> array of raw records
  normalize(raw)                           // raw record -> normalized record (or null)
}
```

Three adapters ship: `aic`, `met`, `cma`.

`art-normalize.js` is refactored so its AIC logic becomes the AIC adapter, and
the file exposes a registry (e.g. `window.ArtSources` / `module.exports`) usable
by both the browser runtime and `scripts/build-pool.js`.

### 2. Normalized record shape

All adapters emit the **same** record shape the app already consumes, with two
additions:

- `source` — the adapter `id` (`'aic' | 'met' | 'cma'`)
- `viewLabel` — the adapter's `viewLabel`, used by the placard link

Existing fields retained: `id, title, artist, artistDisplay, date, medium,
origin, imageId, color, image, thumb, pageUrl, wikiUrl`.

> `id` is only unique within a source. The merged pool dedupes on
> `source + ':' + id` to avoid cross-source collisions.

### Per-adapter API details

| Source | Endpoint | Cost | Public-domain filter | Image field |
|--------|----------|------|----------------------|-------------|
| AIC | `api.artic.edu/api/v1/artworks/search` | 1 request → 100 full records | `query[term][is_public_domain]=true` | IIIF (`image_id`) |
| Cleveland | `openaccess-api.clevelandart.org/api/artworks/` | 1 request → 100 full records | `cc0=1&has_image=1` | `images.web.url` |
| The Met | `collectionapi.metmuseum.org/public/collection/v1/` | search → IDs, then 1 request **per object** (N+1) | object `isPublicDomain === true` | `primaryImage` |

`color` may be absent for Met/Cleveland records; the existing `accentFrom()`
already falls back to a default HSL, so a missing `color` is handled.

### 3. Image supply — offline-first, bundle-per-source

Preserves the current offline-first model (instant new tab, works with no
network, background refresh updates the cache for next time).

- **`scripts/build-pool.js`** is extended to write **one bundle per adapter**:
  `artworks.aic.json`, `artworks.met.json`, `artworks.cma.json`. The current
  single `artworks.json` becomes `artworks.aic.json`.
- **AIC & Cleveland**: single cheap request per page → used for both the build
  script and the in-browser background refresh (`liveRefresh: true`).
- **The Met**: N+1 (search IDs, then fetch each object). Too heavy for the
  browser, so Met is **bundle-only** (`liveRefresh: false`) — built once by the
  script with polite delays. Still fully offline/instant at runtime.

### 4. Runtime pool assembly (`art.js`)

- **Settings** persist in `localStorage` under `vocabtabs.sources.v1`, e.g.
  `{ aic: true, met: false, cma: false }`. **Default: AIC-only** — existing
  behavior is unchanged until the user opts in.
- **Per-source caches**: `vocabtabs.artpool.<id>.v1` so toggling one source does
  not invalidate another's cache. (Migration: existing `vocabtabs.artpool.v1`
  can be ignored/left to expire; AIC simply repopulates.)
- `getPool()`:
  1. Reads enabled-source settings.
  2. For each enabled source: fresh cache → else bundled JSON; kicks off
     background refresh if `liveRefresh`.
  3. Merges all enabled pools into one array, deduped on `source:id`.
- **Empty-pool guard**: if the merged result is empty (e.g. settings somehow
  disable all, or bundles fail), fall back to AIC, then to the existing
  `FALLBACK` record. The user never sees a blank screen.

### 5. Settings API (`art.js` surface)

Add to `window.ArtService`:

- `getSources()` → array of adapter metadata `{ id, label, enabled }` for the UI.
- `setSourceEnabled(id, enabled)` → persists to `vocabtabs.sources.v1`. Enforces
  **at least one source on**: attempting to disable the last enabled source is a
  no-op (AIC stays on). The UI reflects this (see below).

### 6. UI (`ui.jsx` — `ManagePanel`)

Add an **"Art sources"** block to the Manage panel (between the CSV upload and
the word counts):

- One checkbox row per source, label = adapter `label`, checked = enabled.
- Toggling a box calls back into the app, which:
  1. Persists via `setSourceEnabled`.
  2. Rebuilds the pool (`getPool()`), updates `poolRef` + `pool` state.
  3. **Reshuffles** to a new artwork so the change is immediately visible.
  4. Flashes a toast (e.g. `"The Met added"` / `"The Met removed"`).
- The currently-only-remaining enabled checkbox is shown **disabled/checked**
  with a hint ("at least one source required") so the user can't reach zero.

New props threaded from `App` → `ManagePanel`: `sources` (array) and
`onToggleSource(id, enabled)`.

### 7. Placard attribution (`ui.jsx` — `ArtistPlacard`)

Replace the hardcoded `"View at the Art Institute"` with the artwork's
`art.viewLabel` (falls back to `"View source"` if absent). The link continues to
use `art.pageUrl`, which each adapter sets to the correct museum object URL.

## Data flow

```
Manage checkbox toggled
  -> App.onToggleSource(id, enabled)
       -> ArtService.setSourceEnabled(id, enabled)   // persists settings
       -> ArtService.getPool()                       // merges enabled bundles/caches
       -> setPool / poolRef.current = merged
       -> shuffle()                                  // new artwork from new pool
       -> flash(toast)
```

## Error handling

- A source whose bundle/fetch fails contributes nothing; other enabled sources
  still populate the pool.
- Empty merged pool → AIC fallback → `FALLBACK` record.
- Missing `color` on a record → existing `accentFrom()` default.
- Corrupt/missing `vocabtabs.sources.v1` → treated as AIC-only default.

## Testing

- **Adapter normalize**: each adapter's `normalize` maps a representative raw API
  record (fixture) to the expected normalized shape, and returns `null` for a
  record with no image.
- **Dedupe**: merged pool removes duplicates on `source:id`, keeps distinct ids
  that collide numerically across sources.
- **Settings**: `setSourceEnabled` persists; disabling the last source is a
  no-op; corrupt settings default to AIC-only.
- **Empty-pool guard**: empty merge falls back to AIC then FALLBACK.
- **Build script**: writes three bundle files; refuses to write an empty pool
  (existing behavior, per source).
- **Manual**: toggle each box in Manage, confirm reshuffle + placard link text
  matches the displayed work's museum.

## Files touched

- `art-normalize.js` → adapter registry (AIC + Met + Cleveland), shared by
  runtime and build script.
- `art.js` → per-source caches, merged `getPool()`, `getSources()` /
  `setSourceEnabled()`, empty-pool guard.
- `ui.jsx` / `ui.js` → "Art sources" checkbox block; placard uses `viewLabel`.
- `app.jsx` / `app.js` → `sources` state, `onToggleSource`, rebuild+reshuffle.
- `scripts/build-pool.js` → generate `artworks.{aic,met,cma}.json`.
- Bundles: rename `artworks.json` → `artworks.aic.json`; add `artworks.met.json`,
  `artworks.cma.json`.
- `newtab.html` → no new script tags needed (registry stays inside existing
  files); update only if a file is split out.
