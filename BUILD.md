# Build

> How to build FED-Shell artifacts locally and in CI.

## Prerequisites by platform

### Mobile (Android + iOS)

| Tool | Version |
|---|---|
| Node.js | 22 (see `.nvmrc`) |
| JDK | 21 (Temurin recommended) |
| Android SDK | compileSdk 36, build-tools 36.0.0 |
| Xcode | 15+ (iOS only, macOS host required) |
| Capacitor CLI | 8.5+ (installed via `npm ci`) |

### Desktop

| Tool | Version |
|---|---|
| Python | 3.11 |
| PySide6 | 6.6+ |
| PyInstaller | 6.3+ |
| Linux extra deps | `libegl1 libxcb-xinerama0 libxcb-cursor0 libnss3` (see workflow) |

## Local build — Mobile (Android)

```bash
# 1. Install deps
npm ci

# 2. Inject your URL
./scripts/inject-url.sh "https://your-site.com" "My App" "com.fed.myapp"

# 3. Sync web assets into the native project
npx cap sync android

# 4. Build
cd android
chmod +x gradlew
./gradlew assembleDebug          # debug APKs (per-ABI + universal)
./gradlew assembleRelease        # release APKs (debug-signed)
./gradlew bundleRelease          # .aab for Google Play
```

Output: `android/app/build/outputs/apk/debug/*.apk`

## Local build — Mobile (iOS, Simulator)

> Requires a macOS host with Xcode installed.

```bash
npm ci
./scripts/inject-url.sh "https://your-site.com" "My App" "com.fed.myapp"
npx cap sync ios

xcodebuild \
  -project ios/App/App.xcodeproj \
  -scheme App \
  -sdk iphonesimulator \
  -configuration Debug \
  -derivedDataPath build \
  CODE_SIGNING_ALLOWED=NO \
  build
```

Output: `build/Build/Products/Debug-iphonesimulator/App.app`

## Local build — Desktop

```bash
cd native-desktop
pip install -r requirements.txt

# Linux
python compile-desktop.py --url https://your-site.com --name "My App" --platform linux

# macOS
python compile-desktop.py --url https://your-site.com --name "My App" --platform macos

# Windows (run on a Windows host)
python compile-desktop.py --url https://your-site.com --name "My App" --platform windows
```

Output: `dist/standalone/` (a standalone executable or `.app` bundle)

> **Note:** PyInstaller cannot cross-compile. Build on the target OS, or let
> the GitHub Actions matrix handle it (Windows runner → `.exe`, macOS runner →
> `.app`, Ubuntu runner → Linux binary).

## CI build — All platforms at once

The master workflow is `.github/workflows/build-all.yml`.

1. Push the repo to GitHub
2. Go to **Actions** → **🏗️ FED-Shell — Universal Fleet Build** → **Run workflow**
3. Enter `target_url`, `app_name`, `app_id`
4. (Optional) Enable Electron / Tauri and specify repo names
5. Wait ~5 minutes
6. Download artifacts from the run summary

All 8 jobs run in **parallel**. See `ADR.md` for why.

## Troubleshooting

| Problem | Fix |
|---|---|
| `gradlew: Permission denied` | `chmod +x android/gradlew` |
| Android build: SDK not found | Ensure `ANDROID_HOME` is set or use `android-actions/setup-android@v3` |
| iOS: `xcodebuild` not found | You're not on macOS — use the CI macOS runner |
| Desktop: `libQt*.so: cannot open shared object file` | Install Linux system deps (listed above) |
| PyInstaller: `ModuleNotFoundError: No module named 'PySide6'` | `pip install PySide6 pyinstaller` in the same env |
| Injection script fails | Run `python3 scripts/inject-config.py <url> <name> <id>` directly to see the error |
