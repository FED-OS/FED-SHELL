# Architecture Decision Records (ADR)

This file records the significant architectural decisions made in FED-Shell,
in reverse chronological order. Each entry follows a lightweight ADR format:
Context → Decision → Consequences.

---

## ADR-006 — Desktop uses PySide6 + PyInstaller, not Electron

**Date:** August 2026

**Context**
Desktop wrappers needed to load a URL in a native window with locked
navigation. Options considered: Electron, Tauri, Python + PySide6/QtWebEngine,
and CEF (Chromium Embedded Framework).

**Decision**
Use **PySide6 (QtWebEngine) + PyInstaller** for the built-in desktop wrapper.
Electron and Tauri remain supported as **optional** jobs that build from
separate repos, but the default desktop path is Python.

**Consequences**
- ✅ The desktop wrapper adds zero npm dependencies to the core repo
- ✅ Produces a genuine standalone binary, not a 150 MB Electron bundle
- ✅ QtWebEngine is a real system WebView with full HTML5 support
- ⚠️ Linux builds need extra `apt` system dependencies in CI
- ⚠️ Binary size (~40-60 MB) is larger than Tauri but smaller than Electron

---

## ADR-005 — URL injection via a single Python script, not a templating engine

**Date:** August 2026

**Context**
Six different native config files (Capacitor JSON, Android strings.xml,
Android build.gradle, iOS Info.plist, iOS Capacitor JSON, desktop config.json)
all need the same URL / app name / app ID injected at build time.

**Decision**
A single cross-platform Python script (`scripts/inject-config.py`) rewrites
all six files. A thin shell wrapper (`inject-url.sh`) delegates to it so CI
and local dev use the same path.

**Consequences**
- ✅ One place to maintain injection logic
- ✅ Works identically on Ubuntu, macOS, and Windows runners
- ✅ No dependency on Jinja, Mustache, or any templating library
- ⚠️ Adding a new platform config means editing one Python function

---

## ADR-004 — Parallel jobs, not a single monolithic build job

**Date:** August 2026

**Context**
FED-Shell builds for Android (3 variants), iOS, and Desktop (3 OSes), plus
optional Electron and Tauri. These could run as steps in one job or as
separate parallel jobs.

**Decision**
Each platform is a **separate job**. Only the final `package-all` job
depends on the others (to gather artifacts). Desktop uses a matrix; Android
variants are separate jobs.

**Consequences**
- ✅ Total build time = slowest job (~5 min), not the sum (~25 min)
- ✅ A failure in one platform doesn't block the others
- ✅ Artifacts are cleanly separated per platform
- ⚠️ More YAML to maintain, but each block is self-contained

---

## ADR-003 — Capacitor for mobile, not raw native WebView

**Date:** August 2026 (inherited from the original `Build-Mobile-Apps-Android-iOS` repo)

**Context**
Mobile wrappers could be hand-rolled native WebView activities (Android
`WebView`, iOS `WKWebView`) or built on a bridge like Capacitor or Cordova.

**Decision**
Use **Capacitor**. It generates real Gradle/Xcode projects we fully own and
can customize, while handling the WebView plumbing, plugin bridge, and
asset syncing.

**Consequences**
- ✅ Mature, well-maintained native project generation
- ✅ `npx cap sync` handles asset copying reliably
- ✅ Plugin ecosystem available if needed later
- ⚠️ Adds npm dependencies (`@capacitor/core`, `@capacitor/android`, `@capacitor/ios`)

---

## ADR-002 — `server.url` mode is the default, not bundled offline assets

**Date:** August 2026

**Context**
The app can either load a live remote URL (`server.url` in
`capacitor.config.json`) or bundle static HTML/CSS/JS in `www/` for offline use.

**Decision**
**URL mode is the default.** The injector always sets `server.url`. Offline
bundling remains possible by removing `server.url` and populating `www/`,
but it is the secondary path.

**Consequences**
- ✅ FED-Shell is a pure URL wrapper — its entire purpose
- ✅ No need to ship web assets through the repo
- ⚠️ Apps require an internet connection to function
- ⚠️ The `www/index.html` placeholder is only a fallback

---

## ADR-001 — Repository scope: one repo builds all platforms

**Date:** August 2026

**Context**
FED-OS has 33+ repos. FED-Shell could be either a template you clone per-app,
or a single engine repo that builds any URL on demand.

**Decision**
**Single engine repo.** You trigger `workflow_dispatch` with a URL and get
all platforms. No per-app forks.

**Consequences**
- ✅ Zero duplication — one workflow, one injection script
- ✅ Every build picks up the latest wrapper improvements
- ✅ Trivial to build a new app: just type a different URL
- ⚠️ Electron and Tauri builds must live in separate repos (they have their own source) — handled via `actions/checkout` with `repository:` input
