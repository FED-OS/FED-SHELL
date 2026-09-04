# web2apk Browser Extensions — Chrome & Edge

> **One codebase, two stores.** The `extension/` folder is a Manifest V3
> browser extension that turns any website into an app on your desktop
> browser — the same promise the web2apk mobile template makes for
> Android and iOS.

| | |
|---|---|
| **Package** | `web2apk — Web App Launcher` (v2.1.0) |
| **Chrome Web Store** | upload `dist/chrome-extension-v2.1.0.zip` |
| **Edge Add-ons** | upload `dist/edge-extension-v2.1.0.zip` |
| **Manifest** | V3 · `minimum_chrome_version: 110` |
| **Browsers** | Chrome 110+, Edge 110+, Brave, Opera, Vivaldi (all Chromium ≥ 110) |

Both zips are the same MV3 package — Edge Add-ons accepts Chrome MV3
extensions as-is. Build once, upload twice.

---

## What the extension does

### 🪟 One-click app windows
Click the toolbar icon to open your configured site in a dedicated
**app window** — a clean, chrome-less popup window with its own taskbar
entry, sized to your chosen width/height. Prefer plain tabs? Switch the
default in **Options → Behavior**. Either way, if an app window for the
same URL is already open, the extension focuses it instead of piling on
duplicates.

### 🧭 New-tab dashboard
A new-tab override replaces the blank tab with a web2apk dashboard:
large clock and greeting, a pill-shaped search bar (Google / Bing /
DuckDuckGo — `/` or `Ctrl+K` to focus), your app card with live status,
and your quick-links grid. Theme follows the extension setting
(auto / dark / light).

### ⚡ Quick links
Pin up to 24 favorite sites as chips in the popup and tiles on the new-tab
dashboard. Managed from **Options → Quick links** (title, URL, favicon
preview). Favicons are fetched from Google's public s2 favicon service —
no tracking, no accounts.

### 📶 Status badges
The toolbar badge shows whether your configured site is reachable
(green **OK** / red **DOWN**), re-checked on a schedule you choose
(off / 5 / 15 / 30 / 60 min) via `chrome.alarms`. The popup and dashboard
both surface the same state. Checks use `HEAD` requests with a `GET`
fallback — no page content is ever read.

### ⌨️ Keyboard shortcuts
`Ctrl+Shift+U` opens your app in a window · `Ctrl+Shift+D` opens the
dashboard. Remappable at `chrome://extensions/shortcuts` /
`edge://extensions/shortcuts`.

### 🖱️ Context menu
Right-click anywhere to open the configured app (window or tab), open the
current page in an app window, or jump to the dashboard.

---

## File structure

```
extension/
├── manifest.json          MV3 manifest (Chrome & Edge compatible)
├── common.js              shared settings schema + helpers (loaded by SW + pages)
├── background.js          service worker: app windows, menus, commands, alarms, status checks
├── icons/                 16 / 32 / 48 / 128 px brand marks
├── popup/                 toolbar launcher (html/css/js)
├── options/               settings page (html/css/js) — App / Behavior / Quick links / About
└── newtab/                new-tab dashboard (html/css/js)
```

## Development

### Load it locally (2 minutes)

1. Open `chrome://extensions` (or `edge://extensions`)
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** → select the `extension/` folder
4. Pin 🚀 to the toolbar. Right-click → **Options** to set your app URL
   (default `https://example.com`), or just click **Open app**.

Changes to JS/CSS/HTML are picked up on extension reload
(the ↻ button on the extension card). Visit `chrome://extensions` →
**service worker** link to watch `console.log` output from
`background.js`.

### Rebuild icons

```bash
python3 scripts/generate-extension-icons.py   # regenerates icons/ from scratch (Pillow)
```

### Validate & package

```bash
node scripts/validate-extension.mjs    # manifest · icons · JS syntax · file refs · CSP
bash scripts/build-extension.sh        # validate → stage → dist/*.zip
```

`validate-extension.mjs` fails the build on hard errors (missing files,
broken PNG headers, JS syntax errors, MV3 CSP violations like inline
`onclick=` handlers) and warns on store-review gotchas (over-long
descriptions). It runs again inside the build script and in CI.

---

## Publishing

### Chrome Web Store

1. Pay the one-time **$5 developer registration** at
   [chrome.google.com/webstore/devconsole](https://chrome.google.com/webstore/devconsole)
   (Google account required).
2. **New item** → upload `dist/chrome-extension-v2.1.0.zip`.
3. Fill the listing (templates below) → **Submit for review**.
4. Review typically takes 1–3 business days. `storage` is a common,
   low-friction permission; `alarms` and `contextMenus` are API-only and
   rarely trigger warnings.

### Edge Add-ons (Microsoft Partner Center)

1. Create a free account at
   [partner.microsoft.com/dashboard/microsoftedge](https://partner.microsoft.com/dashboard/microsoftedge).
2. **Create new extension** → upload `dist/edge-extension-v2.1.0.zip`
   (same package, no changes).
3. Edge review usually completes within a few business days.

### Listing templates

**Name**
```
web2apk — Web App Launcher
```

**Short description (≤ 132 chars)**
```
Turn any website into an app — one-click app windows, a new-tab dashboard, quick links, and status badges. For Chrome & Edge.
```

**Detailed description**
```
web2apk turns any website into an app on your desktop browser.

ONE-CLICK APP WINDOWS
Open your favorite site in a clean, chrome-less window with its own taskbar entry. Configure width and height, or use plain tabs instead — your choice. Already-open app windows are focused, never duplicated.

NEW-TAB DASHBOARD
A fast new-tab page with a large clock, greeting, and pill search bar (Google / Bing / DuckDuckGo). Your app card shows live reachability status; your quick links are one tile away. Keyboard-first: "/" or Ctrl+K jumps to search.

QUICK LINKS
Pin up to 24 sites as chips in the popup and tiles on the dashboard. Titles, URLs, and favicons are fully editable in Options.

STATUS BADGES
A toolbar badge shows OK/DOWN for your configured site, re-checked every 5–60 minutes. Checks are opaque `no-cors` HEAD requests — they resolve only if the network request succeeds, no page content is read, nothing is sent anywhere, and no host permissions are required.

SHORTCUTS
Ctrl+Shift+U — open app window · Ctrl+Shift+D — open dashboard (remappable in your browser's shortcut settings).

PRIVACY
All settings live in your browser's local/sync storage. The extension requests no host permissions whatsoever — status checks are opaque no-cors requests that never read page content. No analytics, no accounts, no servers.

web2apk is also available for Android & iOS via the Capacitor template at github.com/ninjatech/web2apk.
```

### Screenshots for the stores

Both consoles want 1280×800 screenshots. The build package includes
`docs/screenshot-newtab-1280x800.png` — a real capture of the dashboard
running in Chromium — or make your own:

1. Load the extension unpacked.
2. Set your app URL in Options.
3. Open a new tab, hide bookmarks bar (`Ctrl+Shift+B`) for a clean shot.
4. Screenshot → save as 1280×800 PNG.

---

## Privacy & permissions

| Permission | Why |
|---|---|
| `storage` | saves your settings (sync, falls back to local on quota) |
| `alarms` | schedules the periodic status checks |
| `contextMenus` | the right-click menu |

No host permissions at all — not even optional ones. Status checks use
opaque `no-cors` requests, which resolve iff the network request succeeded,
so the extension never reads page content and never needs site access.
Searches and app opens are plain tab/window navigations handled by the
browser itself.

Nothing is collected, transmitted, or sold. There are no analytics, no
accounts, and no backend — the extension is fully local. The favicons in
quick links are loaded from Google's public favicon service (the same
one Chrome itself uses for bookmarks), which sees only the hostnames you
pinned.

## FAQ

**Does it work in Edge even though it says Chrome?** Yes — Edge, Brave,
Opera, and Vivaldi all run Manifest V3 extensions. The package is
identical; only the store listing differs.

**Why is my site "DOWN"?** The probe is a `no-cors` HEAD request — it only fails on network errors (DNS failure, connection refused, offline). If the badge shows DOWN but the site opens fine, your network may block HEAD requests; the next scheduled check (or clicking the popup) retries it.

**Where are my settings stored?** `chrome.storage.sync` when possible
(shared across your synced browsers), `chrome.storage.local` as a
fallback. Options → About shows the live storage area, and Options has
Export/Import (JSON) plus Reset.

**Is my data sent anywhere?** No. See *Privacy & permissions* above.

**How does this relate to the web2apk mobile apps?** The extension is the
desktop sibling of the web2apk Capacitor template: the mobile apps wrap
your site into Android/iOS binaries, the extension wraps it into your
desktop browser. Same brand, same defaults, independent version lines —
see [INTEGRATION.md](INTEGRATION.md).

**MIT licensed.** See [LICENSE](LICENSE) in the repository root (the web2apk project license carries over to the extension).
