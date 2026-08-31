# FED-Shell — Project Todo

> Living task list for the FED-Shell repository. Updated as work progresses.
> This is the **project-level** todo (what needs doing in this repo), not
> a personal scratchpad.

## Legend

- [ ] not started
- [~] in progress
- [x] done

---

## v1.0.0 — Ship the fleet builder ✅

- [x] Universal `workflow_dispatch` with URL / app name / app ID inputs
- [x] Parallel CI jobs: Android (debug, release, AAB), iOS sim, Desktop Electron (win/mac/linux matrix)
- [x] In-repo Electron builds via `electron-builder` (no separate-repo checkouts)
- [x] Tag-triggered GitHub Release (`v*` → `softprops/action-gh-release@v2`)
- [x] `package-all` aggregation job (`if: always()`)
- [x] `scripts/inject-config.py` — one Python injector for all native configs + root `config.json` (Electron)
- [x] `scripts/inject-url.sh` — thin wrapper
- [x] `main.js` — Electron desktop entry point (loads URL from env/config.json, validates extensions)
- [x] `package.json` — Electron + Capacitor deps, `electron-builder` config (win→portable, mac→dmg, linux→AppImage+deb)
- [x] `extensions/builtin/core-navigation/manifest.json` — sample extension (CI validation target)
- [x] `config.json` — root-level config embedded by electron-builder
- [x] `native-desktop/` — PySide6 domain-locked WebView (legacy desktop target, still supported)
- [x] Injection tested end-to-end locally (both root + native-desktop config.json)
- [x] Full community / governance / docs file set (35+ files, wiki, prompts, discussions)

## v1.1.0 — Polish & automation

- [ ] Reusable workflow for downstream repos (FED-PLAY, Surf-FED)
- [ ] Icon generation pipeline (one input image → all platform icons)
- [ ] Splash screen auto-generation
- [ ] App version injection from git tags
- [ ] Lighthouse / performance check on target URL before build
- [ ] macOS code-signing + notarization (requires Apple Developer secrets)

## v1.2.0 — App store readiness

- [ ] Google Play signing in CI (keystore from Secrets, not committed)
- [ ] App Store Connect upload via `xcrun altool` / Transporter
- [ ] AAB with Play Asset Delivery
- [ ] iOS on-device build (requires signing profile in Secrets)
- [ ] FED-PLAY upload step (push artifacts to FED-OS app store)

## Backlog

- [ ] Web-extension build target (Chrome / Firefox MV3)
- [ ] React Native target (evaluate; may stay out of scope per ADR-001)
- [ ] Flutter target (evaluate; may stay out of scope per ADR-001)
- [ ] Offline mode: cache the target URL's assets for offline use
- [ ] Push notification bridge via Capacitor plugins
- [ ] Biometric lock screen option
- [ ] Telemetry opt-in (privacy-preserving, local-first)
- [ ] Internationalization of the injected app name

## Infrastructure

- [ ] Branch protection on `main` (require PR + CI green)
- [ ] Dependabot config for npm + pip
- [ ] CodeQL analysis workflow
- [ ] Stale-issue bot configuration
- [ ] GitHub Discussions categories setup

---

Support FED-Shell development:

<a href='https://ko-fi.com/fedpromptly' target='_blank'>
    <img height='36' style='border:0px;height:36px;' src='https://ko-fi.com/img/githubbutton_sm.svg' border='0' alt='Buy Me a Coffee at ko-fi.com' />
</a>
