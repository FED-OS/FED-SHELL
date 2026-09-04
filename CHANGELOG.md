# Changelog — web2apk Browser Extension

Chrome & Edge (Manifest V3). Versions follow the extension's own line — see
[INTEGRATION.md](INTEGRATION.md) for how it relates to the web2apk mobile
releases. Format loosely based on [Keep a Changelog](https://keepachangelog.com/).

## [2.1.1] — 2026-02-05

### Added
- Keyboard accessibility pass across all three surfaces (popup, options,
  new-tab): visible `:focus-visible` rings on every interactive element, with
  pointer clicks kept ring-free so mouse users see no visual noise.
- Automated keyboard-drive verification (`scripts/a11y-check.py`): tabs through
  every control on every surface and asserts a visible focus ring on each,
  plus a pointer-focus spot check — now part of the shipping checklist.
- CI now smoke-tests the **packaged zip** (the exact bits users download), not
  just the source tree, in addition to the source-level Playwright run.
- Static deployable demo: the live demo can now be built as a fully
  self-contained static site (`scripts/build-static-demo.py`) with a rendered
  docs page — no server required, works under any sub-path.
- Store documents: `PRIVACY.md` (permission justifications and data footprint)
  and this changelog.
- One-command package verifier (`scripts/package-final-check.sh`): unzips the
  deliverable zip and re-runs the entire pipeline on those bits alone —
  validate, unit tests, a11y check, store-zip build, static-demo build plus
  its 48 checks at the site root and under `/sub/`, and a Playwright smoke
  test of the packaged dist zip itself.

### Fixed
- Options page: text fields and selects showed **no focus ring at all** when
  focused by keyboard — author `:focus` rules at higher specificity were
  resetting the outline. Added matching-specificity `:focus-visible` rules so
  keyboard users always see where they are.
- Demo shim: `chrome.runtime.getURL()` resolved against the demo directory
  instead of the extension tree (404 on cross-page links); the
  "open dashboard" route is now sub-path-safe, which is what makes the
  GitHub-Pages-style static deploy work.
- Demo loader rewritten: the old strip-and-re-add approach let dynamically
  inserted page scripts race the HTML parser (and double-execute alongside
  the originals), causing a flaky `Cannot read properties of null` crash in
  the options page when a warm cache made the dynamic copy win. The loader
  now injects only the shim, into the parser stream via `document.write`
  from its head-time script tag — spec-guaranteed to execute before the
  page's own body-end scripts, which run unmodified. Verified with 6×
  consecutive 48/48-check runs (was flaking ~1-in-4).

## [2.1.0] — 2026-01-30

### Added
- **Status badges**: optional periodic reachability check for your app URL
  (`chrome.alarms`), an OK/DOWN dot in the popup, a colored badge on the
  toolbar icon, and a status line on the new-tab dashboard. Probe is a
  `no-cors` HEAD request — resolves iff the network succeeds, needs **zero
  host permissions**.
- New-tab dashboard: clock, configurable search engines, quick-links grid
  (up to 24, favicon tiles), recent-apps strip, keyboard shortcuts sheet.
- Popup: open-as-app-window / open-as-tab buttons, quick links, recents,
  live status dot with one-click re-check.
- Options: app identity, behavior, quick-links editor, theme (light/dark/auto
  with CSS `color-scheme`), Export/Import (JSON), Reset, live storage-area
  indicator.
- Context menu: "Open app window" / "Open app tab" from any page.

### Changed
- Permissions slimmed to `["storage", "alarms", "contextMenus"]` —
  `optional_host_permissions` removed entirely once the no-cors probe landed.
- Settings sanitizing is forgiving: scheme-less URLs like `github.com` are
  normalized to `https://github.com` instead of silently reverting to the
  default.

## [2.0.0] — 2026-01-23

### Added
- Initial public release: Manifest V3 service-worker architecture, one-click
  app windows (`chrome.windows` via window.open fallbacks), new-tab override,
  options page with sync→local storage fallback, brand icon set drawn from the
  same mark as the web2apk mobile apps, CI workflow, and store packaging for
  Chrome Web Store + Edge Add-ons.
