# FAQ

## General

### What is FED-Shell?

FED-Shell is a universal build repo. You give it a URL, an app name, and an
app ID, and a single GitHub Actions run produces native apps for Android,
iOS, Windows, macOS, and Linux (plus optional Electron and Tauri builds from
separate repos).

### Is it free?

Yes. FED-Shell is MIT-licensed and free to use. See `PRICING.md` for
optional future paid services.

### Do I need to know how to code to use it?

No. You don't edit any source — you just enter a URL in the GitHub Actions
tab and download the output. If you want to customize the wrappers, then
some Kotlin/Swift/Python knowledge helps.

### Is this part of FED-OS?

Yes. FED-Shell is one piece of the FED-OS ecosystem — the sovereign
developer's stack. See `SUMMARY.md`.

---

## Building

### Do I need Android Studio?

No. The CI workflow builds APKs for you. You only need Android Studio if you
want to build locally or customize the Android wrapper.

### Can I build iOS on Windows/Linux?

No — iOS builds require a macOS host with Xcode. The CI workflow uses a
`macos-latest` runner automatically, so you don't need a Mac yourself.

### Why is the desktop app Python and not Electron?

Electron bundles are large (~150 MB) and add npm complexity. PySide6 +
PyInstaller produces a smaller, genuine native binary with a real system
WebView. See `ADR-006` in `ADR.md`. Electron is still supported as an
optional build from a separate repo.

### Can I build for all platforms from my own machine?

Not efficiently. PyInstaller can't cross-compile, and iOS requires macOS.
Use the GitHub Actions workflow — it spins up the right OS runner for each
platform automatically.

### How long does a full build take?

About 5 minutes, because all 8 jobs run in parallel. The slowest job (usually
iOS) gates the total time.

### What's the difference between debug and release APKs?

Debug APKs are easy to install for testing. Release APKs are optimized and
smaller, but the CI versions are signed with the debug key (fine for testing,
not for Google Play). See `BUILD.md` → Signing for production.

---

## URL & offline

### Does the app work offline?

No — by default the app loads a live URL and requires internet. If you want
an offline app, remove `server.url` from `capacitor.config.json` and put your
built web files in `www/`. See `ADR-002`.

### Can the app open external links?

External links (anything outside your target domain) are sent to the user's
system browser. Only links within your domain load inside the app. This
behavior is consistent across Android, iOS, and desktop.

### What URLs work?

Any publicly accessible URL: GitHub Pages, your own server, Cloudflare
Pages, etc. Just make sure the site is responsive for mobile.

---

## Customization

### Can I change the app icon?

Not yet through the workflow — the apps use Capacitor's default placeholder
icons. Custom icon injection is on the roadmap. For now, you can replace the
icons in `android/app/src/main/res/mipmap-*` and `ios/App/App/Assets.xcassets`
manually.

### Can I add push notifications, camera, or GPS?

These require Capacitor plugins. The current wrappers are minimal — adding
plugins is possible but not automated. It's on the roadmap as an opt-in.

### Can I build multiple apps from the same repo?

Yes — just trigger the workflow multiple times with different URLs. Each run
is independent. A "batch build" mode (feed a JSON list) is planned.

---

## Security & privacy

### Does FED-Shell store my URL or data?

No. The URL is used only during the build and injected into the app config.
GitHub stores the workflow run, but no data is sent to any FED-Shell server
(there isn't one).

### Are the built apps secure?

The wrappers lock navigation to your domain and block external links from
loading inside the app. However, the apps themselves are unsigned (CI builds
use debug keys). For production distribution, sign your apps properly.

### I found a security issue. What do I do?

See `SECURITY.md`. Do NOT open a public issue.
