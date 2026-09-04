# web2apk Browser Extensions — Deliverable Package

**Version 2.1.0 · Chrome & Edge (Manifest V3) · built from the web2apk project**

This package adds Google Chrome and Microsoft Edge browser extensions to
the web2apk project (the Capacitor template that turns websites into
Android/iOS apps). The extension is the desktop sibling: it turns any
website into an app — one-click app windows, a new-tab dashboard, quick
links, and reachability status badges.

## What's inside

```
web2apk-browser-extensions/
├── README-EXTENSIONS-PACKAGE.md   ← you are here
├── extension/                     the extension source (load unpacked, or zip → upload)
│   ├── manifest.json                MV3 · works in Chrome, Edge, Brave, Opera, Vivaldi
│   ├── common.js / background.js    shared helpers + service worker
│   ├── popup/  options/  newtab/    toolbar launcher · settings · dashboard
│   └── icons/                       16/32/48/128 px brand marks
├── scripts/
│   ├── generate-extension-icons.py  regenerate all icons (Pillow)
│   ├── validate-extension.mjs       18-check pre-flight validator (Node ≥ 18)
│   ├── build-extension.sh           validate → stage → dist/*.zip store packages
│   └── smoke-test-extension.py      Playwright smoke test + store screenshot
├── .github/workflows/
│   └── build-extension.yml          CI: validate, package, attach artifacts/releases
├── docs/
│   └── screenshot-newtab-1280x800.png   store-listing screenshot (real capture)
├── dist/
│   ├── chrome-extension-v2.1.0.zip     ← upload to Chrome Web Store
│   └── edge-extension-v2.1.0.zip       ← upload to Edge Add-ons (same package)
├── EXTENSIONS.md                  full guide: features, dev, build, publish, privacy, FAQ
└── INTEGRATION.md                 how to merge this into your existing web2apk repo
```

## Quick start (60 seconds)

1. Unzip this package.
2. Open `chrome://extensions` (or `edge://extensions`), enable **Developer mode**.
3. **Load unpacked** → select the `extension/` folder.
4. Click the 🚀 toolbar icon → **Open app**. Right-click → **Options** to
   point it at any website you like.

## Ship to the stores

The `dist/` zips are store-ready and were built from this exact source:

- **Chrome Web Store** — [devconsole](https://chrome.google.com/webstore/devconsole) →
  New item → upload `dist/chrome-extension-v2.1.0.zip` (one-time $5 registration).
- **Edge Add-ons** — [Partner Center](https://partner.microsoft.com/dashboard/microsoftedge) →
  Create new extension → upload `dist/edge-extension-v2.1.0.zip` (free).

Listing copy (name, short description, detailed description) is ready to
paste from **EXTENSIONS.md → Publishing → Listing templates**, and
`docs/screenshot-newtab-1280x800.png` is a real 1280×800 capture for the
screenshot fields.

## Rebuild from source

```bash
python3 scripts/generate-extension-icons.py    # optional: regenerate icons
node   scripts/validate-extension.mjs          # 18 pre-flight checks
bash   scripts/build-extension.sh              # → dist/chrome-*.zip + dist/edge-*.zip
xvfb-run -a python3 scripts/smoke-test-extension.py   # full browser smoke test + screenshot
```

Requirements: Node ≥ 18, Python 3.9+ (Pillow for icons, Playwright for the
smoke test), `zip`.

## Merge into your web2apk repo

Everything here is additive — no existing files change. See
**INTEGRATION.md** for the exact copy list, `.gitignore` additions, and the
version-sync policy (extension versions independently, starting at 2.1.0).

## Quality summary

- **Validator**: 18 checks — manifest fields, icon PNGs (magic bytes,
  dimensions), JS syntax (`vm.Script`), `importScripts` targets, HTML asset
  refs, MV3 CSP (no inline handlers) — 0 errors, 0 warnings.
- **Smoke test** (Playwright Chromium, `--load-extension`, the same way a
  reviewer loads it): service worker registers; popup, options (all tabs,
  autosave), new-tab dashboard render; settings persist across pages;
  search submits; live reachability check turns the badge **OK**; zero
  console errors on extension pages.
- **Bugs found & fixed during testing**: `[hidden]` elements defeated by
  `display:flex` (popup status row, newtab status row, shortcuts sheet);
  URL normalization silently reverting scheme-less URLs to the default;
  cross-origin status probes failing without host permissions (now
  `no-cors`, and `optional_host_permissions` removed entirely); stray
  `tab }` token and an export-tag typo.
- **CI**: every push/PR touching `extension/**` validates + packages; tags
  attach the exact CI-built zips to a GitHub Release.
