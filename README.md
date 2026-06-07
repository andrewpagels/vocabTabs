# Vocab Tabs

A Chrome extension that replaces your new tab page with a vocabulary word set against a full-bleed public-domain artwork. Learn a new word every time you open a tab.

Artwork can be drawn from any combination of three open public-domain collections — the [Art Institute of Chicago](https://www.artic.edu/), [The Metropolitan Museum of Art](https://www.metmuseum.org/), and the [Cleveland Museum of Art](https://www.clevelandart.org/) — chosen with checkboxes in the **Manage** panel (Art Institute only by default).

## Install

Vocab Tabs runs as an unpacked extension — no Chrome Web Store account or packing required.

1. **Download this repo** — click the green **Code** button above → **Download ZIP**, then unzip it. (Or `git clone https://github.com/andrewpagels/vocabTabs.git`.)
2. Open `chrome://extensions` in Chrome (or any Chromium browser — Helium, Brave, Edge, etc.).
3. Toggle **Developer mode** on (top-right).
4. Click **Load unpacked** and select the `vocabTabs` folder you just unzipped.
5. Open a new tab — you're done.

The extension runs entirely from the files in this repo; you do **not** need to run any build step to use it.

> **Note:** Chrome shows a "Disable developer mode extensions" reminder on startup for unpacked extensions, and they don't auto-update. To get the latest version, re-download and reload.

## Using it

- **Show less / Show more** — make the current word appear less or more often (↓ / ↑)
- **Next** — jump to a new word + artwork (`Space` or `→`)
- **Mark learned** — retire a word you know (`L`)
- **Manage** — choose which museum collections to draw artwork from, upload your own word list as a CSV, or reset to the sample set (`M`; `Esc` closes the panel)

### Custom word lists

In the **Manage** panel, upload a CSV with three columns: **word**, **definition**, **example sentence**.

## Development

Source for the UI lives in `.jsx` files, compiled to `.js` with Babel (Chrome's Manifest V3 blocks in-page JSX compilation, so it's precompiled).

```bash
npm install        # one-time: install Babel
npm run compile    # rebuild .js from .jsx after editing any .jsx file
```

### Refreshing the artwork pool

The extension ships with one bundled pool per source — `artworks.aic.json`, `artworks.met.json`, `artworks.cma.json` — so it loads instantly and works offline regardless of which sources you enable. To regenerate all three from the live APIs:

```bash
npm run build-pool   # fetches fresh artworks → artworks.<source>.json
```

Then commit the updated `artworks.*.json` files.

## How it works

- `manifest.json` — Manifest V3 config; overrides the new tab page and strips request headers that the AIC API rejects.
- `artworks.aic.json` / `artworks.met.json` / `artworks.cma.json` — bundled per-source artwork pools (the offline/instant source of truth).
- `art-normalize.js` — the source registry: one adapter per museum (record shaping + which sources are enabled).
- `art.js` — artwork service; merges the enabled sources, loading from cache → bundled pool → background API refresh.
- `vocab.js` — word storage, weighting, and CSV import.
- `app.jsx`, `directions.jsx`, `ui.jsx` — the React UI.
