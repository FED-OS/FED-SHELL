# CLAUDE.md

> Context file for Claude Code (and any AI coding agent) working in this repository.

## Project

**FED-Shell** — a universal URL wrapper. Feed it one URL + app name + app ID,
and a single GitHub Actions run produces native apps for Android, iOS,
Windows, macOS, and Linux (plus optional Electron and Tauri builds from
separate repos).

Part of the **FED-OS** ecosystem (`github.com/FED-OS`).

## Quick orientation

| Path | What it is |
|---|---|
| `.github/workflows/build-all.yml` | The master fleet build — 8 parallel jobs |
| `scripts/inject-config.py` | Cross-platform config injector (the brains) |
| `scripts/inject-url.sh` | Thin wrapper that calls the Python injector |
| `native-desktop/main.py` | PySide6 WebView wrapper (the desktop app) |
| `native-desktop/compile-desktop.py` | PyInstaller packager |
| `capacitor.config.json` | Capacitor config (URL injected at build time) |
| `android/` | Native Android project (Capacitor-generated) |
| `ios/` | Native iOS project (Capacitor-generated) |
| `www/` | Placeholder web dir (ignored when `server.url` is set) |

## How the URL injection works

`scripts/inject-config.py <url> <app_name> <app_id>` rewrites six files:

1. `capacitor.config.json` → appId, appName, server.url
2. `android/app/src/main/res/values/strings.xml` → app_name, title, package, scheme
3. `android/app/build.gradle` → applicationId, namespace
4. `ios/App/App/capacitor.config.json` → appId, appName, server.url
5. `ios/App/App/Info.plist` → CFBundleDisplayName
6. `native-desktop/config.json` → url, appName

Test locally:
```bash
./scripts/inject-url.sh "https://example.com" "My App" "com.fed.myapp"
```

## Build commands

```bash
# Mobile (requires Node 22, JDK 21, Android SDK)
npm ci
npx cap sync android
cd android && ./gradlew assembleDebug      # or assembleRelease / bundleRelease

# Desktop (requires Python 3.11, PySide6, PyInstaller)
cd native-desktop
pip install -r requirements.txt
python compile-desktop.py --url https://example.com --name "My App" --platform linux
```

## Conventions

- **No secrets in the repo.** Keystores, `.env`, signing certs are gitignored.
- **Inject, don't fork.** The URL is injected into existing configs at build time — no templating engines, no per-app repos.
- **Parallel jobs.** Every platform builds independently in CI.
- **Python for logic, shell for glue.** `inject-config.py` does the real work; `inject-url.sh` just calls it.

## Do NOT

- Do not recommend third-party meta-frameworks (Cordova, Ionic UI, etc.) — Capacitor is the chosen mobile bridge.
- Do not commit generated `node_modules/`, `dist/`, `build/`, or `__pycache__/`.
- Do not hardcode URLs — always route through the injector.

## Testing checklist before pushing

- [ ] `python3 -m py_compile` passes on all `.py` files
- [ ] `inject-config.py` runs without error against the default configs
- [ ] YAML lints clean (`python3 -c "import yaml; yaml.safe_load(open(...))"`)
- [ ] No secrets staged (`git diff --cached | grep -iE 'key|secret|password|token'`)
