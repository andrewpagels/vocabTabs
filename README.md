# Vocab Tabs

A Chrome extension that replaces your new tab page with a vocabulary word set against a full-bleed photograph or public-domain artwork. Learn a new word every time you open a tab.

Fresh installs show landscape photography from [Lorem Picsum](https://picsum.photos/) (sourced from Unsplash) by default. Use the settings cog in the bottom-right corner to draw pictures from any combination of photography and three open museum collections: the [Art Institute of Chicago](https://www.artic.edu/), [The Metropolitan Museum of Art](https://www.metmuseum.org/), and the [Cleveland Museum of Art](https://www.clevelandart.org/). Existing source preferences are preserved when the extension updates.

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
- **Next** — jump to a new word + picture (`Space` or `→`)
- **Mark learned** — retire a word you know (`L`)
- **Picture settings** — use the cog in the bottom-right corner to choose one or more photo or museum sources
- **Manage** — add words, upload your own word list as a CSV, or reset to the sample set (`M`; `Esc` closes the panel)

### Custom word lists

In the **Manage** panel, upload a CSV with three columns: **word**, **definition**, **example sentence**.

## Development

Source for the UI lives in `.jsx` files, compiled to `.js` with Babel (Chrome's Manifest V3 blocks in-page JSX compilation, so it's precompiled).

```bash
npm install        # one-time: install Babel
npm run compile    # rebuild .js from .jsx after editing any .jsx file
```

### Refreshing the picture pools

The extension ships with one bundled metadata pool per source — `photos.picsum.json`, `artworks.aic.json`, `artworks.met.json`, and `artworks.cma.json` — so source selection is immediate. The images themselves are loaded from their respective remote services. To regenerate every pool from the live APIs:

```bash
npm run build-pool   # fetches fresh records for every source
```

To refresh just one source:

```bash
npm run build-pool -- --source picsum
```

Then commit the updated source bundle.

## How it works

- `manifest.json` — Manifest V3 config; overrides the new tab page and grants the permissions needed by live museum refreshes.
- `photos.picsum.json` / `artworks.*.json` — bundled per-source picture metadata.
- `art-normalize.js` — the source registry: one adapter per photo or museum provider, plus source-setting helpers.
- `art.js` — picture service; merges the enabled sources, loading from cache → bundled pool → background API refresh where supported.
- `vocab.js` — word storage, weighting, and CSV import.
- `app.jsx`, `directions.jsx`, `ui.jsx` — the React UI.
