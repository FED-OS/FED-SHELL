# Glossary

> Terms used throughout the FED-Shell project.

| Term | Meaning |
|------|---------|
| **FED-Shell** | This repo — a universal URL-to-native-app builder |
| **FED-OS** | The sovereign open-source tech stack; the GitHub organization |
| **Fleet builder** | A CI workflow that builds for multiple platforms in one run |
| **Injector** | `scripts/inject-config.py` — the single Python script that rewrites all native configs |
| **Target URL** | The HTTPS URL the wrapped app will load at runtime |
| **App name** | Human-readable name shown in the OS app launcher / under the icon |
| **App ID** | Reverse-DNS bundle identifier (e.g. `com.fed.myapp`) |
| **Capacitor** | The native bridge for mobile (Android + iOS); v8.5 |
| **PySide6** | Python bindings for Qt6, used for the desktop WebView |
| **PyInstaller** | Tool that packages Python scripts into standalone executables |
| **QtWebEngine** | The Chromium-based web engine inside Qt, used by PySide6 |
| **Tauri** | A Rust-based desktop app framework; used by Surf-FED |
| **Electron** | A Node.js + Chromium desktop framework; FED-Shell builds Electron apps conditionally but does not use Electron for its own desktop target |
| **Surf-FED** | FED-OS's Tauri-based browser; can be built as a FED-Shell target |
| **FED-PLAY** | FED-OS's app store; future destination for FED-Shell artifacts |
| **FED-Launcher** | FED-OS's orchestrator dashboard (planned) |
| **Fed-Poster** | FED-OS's multi-platform poster tool |
| **workflow_dispatch** | GitHub Actions trigger that lets you manually run a workflow with inputs |
| **Matrix** | GitHub Actions feature that runs a job multiple times with different variables |
| **Artifact** | A file produced by a CI job, uploaded for download |
| **AAB** | Android App Bundle — Google Play's required format for new apps |
| **APK** | Android Package — installable Android app (used for sideloading) |
| **ABI** | Android Binary Interface — per-architecture builds (arm64-v8a, armeabi-v7a, x86, x86_64) |
| **Info.plist** | iOS app configuration file (XML property list) |
| **strings.xml** | Android string resources file |
| **build.gradle** | Android/Gradle build configuration |
| **ADR** | Architecture Decision Record — see `ADR.md` |
| **BDFL** | Benevolent Dictator For Life — FED-Shell's governance model |
| **Domain-locked** | The desktop WebView only allows navigation to the configured domain |
| **Ko-fi** | Community funding platform; FED-OS username is `fedpromptly` |
| **Idempotent** | Running an operation twice produces the same result as once |
| **One-file** | PyInstaller mode that produces a single executable with everything bundled |
| **`_MEIPASS`** | PyInstaller's temp directory where bundled data is extracted at runtime |
| **Reverse-DNS** | Bundle ID format: `com.organization.appname` (read right-to-left as a DNS path) |
| **Sovereign stack** | A tech stack you fully control — no vendor lock-in, no opaque cloud dependencies |
