# Roadmap

> Where FED-Shell is headed. Items are rough priorities, not commitments.

## ✅ Done

- [x] Universal `workflow_dispatch` with URL / app name / app ID inputs
- [x] Android debug APKs (per-ABI + universal)
- [x] Android release APKs (per-ABI + universal, debug-signed)
- [x] Android release AAB (for Google Play)
- [x] iOS Simulator `.app` (no Apple account needed)
- [x] Desktop — Windows `.exe` (PySide6 + PyInstaller)
- [x] Desktop — macOS `.app` (PySide6 + PyInstaller)
- [x] Desktop — Linux binary (PySide6 + PyInstaller)
- [x] Cross-platform URL injection (`inject-config.py`)
- [x] Optional Electron builds from separate repos
- [x] Optional Tauri builds from a separate repo
- [x] Unified artifact zip (`package-all` job)

## 🚧 In Progress / Next

- [ ] Release APK signing with user-provided keystore (GitHub secrets)
- [ ] Real-device iOS IPA build (requires Apple Developer secrets)
- [ ] Custom app icon injection (drop an `icon.png`, auto-resize for all platforms)
- [ ] Custom splash screen injection
- [ ] `workflow_dispatch` input for offline vs URL mode toggle

## 📋 Planned

- [ ] **FED-PLAY integration** — auto-upload built APKs to the FED-PLAY storefront
- [ ] **Multi-app batch build** — feed a JSON list of URLs, build all in one run
- [ ] **Web-to-APK API** — a small endpoint that triggers a build from a URL
- [ ] **Desktop auto-update** — check for new versions on launch
- [ ] **Push notification support** via Capacitor plugins (opt-in)
- [ ] **Geolocation / camera / file access** permissions toggle per build
- [ ] **FED-Launcher integration** — FED-Shell as a build module inside the launcher

## 🌟 Future / Exploratory

- [ ] Firefox OS / KaiOS target
- [ ] Raspberry Pi / ARM Linux desktop target
- [ ] WebAssembly desktop target (via Pyodide or Rust+WASM)
- [ ] Self-hosted runner support for local builds without GitHub Actions minutes

## Versioning

FED-Shell follows semantic versioning:

- **MAJOR** — breaking changes to the workflow inputs or injection mechanism
- **MINOR** — new platform support or new optional build features
- **PATCH** — bug fixes, dependency bumps, doc improvements

## How to influence the roadmap

Open a [feature request](https://github.com/FED-OS/FED-Shell/issues/new/choose)
or start a discussion on the [community forum](https://www.fedpromptly.com/forum).
