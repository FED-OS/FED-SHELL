# Summary

**FED-Shell** is a universal URL-to-native-app builder. You enter one URL,
one app name, and one app ID, and a single GitHub Actions run produces
installable native applications for Android, iOS, Windows, macOS, and Linux —
plus optional Electron and Tauri builds from separate repositories.

## The problem it solves

Turning a website into a native app usually means choosing a framework
(Cordova, Capacitor, Electron, Tauri), setting up a project, wiring build
config, and maintaining per-platform pipelines. FED-Shell collapses all of
that into one repo with one workflow. Type a URL, get every platform.

## How it works

1. You trigger the `build-all.yml` workflow from the GitHub Actions tab
2. You provide a `target_url`, `app_name`, and `app_id`
3. A Python injector (`scripts/inject-config.py`) rewrites all six native
   config files to point at your URL
4. Eight parallel CI jobs build the native artifacts:
   - Android debug APKs, release APKs, and release AAB
   - iOS Simulator `.app`
   - Desktop Windows `.exe`, macOS `.app`, and Linux binary (PySide6 + PyInstaller)
   - Optional Electron (up to 2 repos) and Tauri (1 repo) builds
5. A final job gathers everything into one downloadable zip

## Key files

| File | Purpose |
|---|---|
| `.github/workflows/build-all.yml` | The master fleet build (8 jobs) |
| `scripts/inject-config.py` | Cross-platform URL/config injector |
| `scripts/inject-url.sh` | Shell wrapper for the injector |
| `native-desktop/main.py` | PySide6 WebView desktop wrapper |
| `native-desktop/compile-desktop.py` | PyInstaller packager |
| `capacitor.config.json` | Capacitor config (injected at build time) |
| `android/` | Native Android project (Capacitor) |
| `ios/` | Native iOS project (Capacitor) |

## Tech stack

- **Mobile:** Capacitor 8 (Android + iOS)
- **Desktop:** PySide6 / QtWebEngine + PyInstaller
- **CI:** GitHub Actions with parallel jobs + matrix strategy
- **Injection:** Pure Python (stdlib only)

## Part of FED-OS

FED-Shell is one piece of the FED-OS ecosystem — the sovereign developer's
stack. It connects to other FED-OS projects:

- **FED-PLAY** — alternative app store (future auto-upload target)
- **Surf-FED** — the FED-OS browser (can be built via the Tauri job)
- **FED-Launcher** — the eventual orchestrator of the whole OS

## Quick start

```bash
git clone https://github.com/FED-OS/FED-Shell.git
cd FED-Shell
git push origin main    # push to your own repo
# Then: Actions → FED-Shell Universal Fleet Build → Run workflow
```

See `INSTALL.md` for installing output apps and `BUILD.md` for local builds.
