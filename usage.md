# Usage

> Practical guide to using FED-Shell — from trigger to installed app.

## The 5-minute flow

### Step 1 — Push the repo

```bash
git clone https://github.com/FED-OS/FED-Shell.git
cd FED-Shell
# Push to your own GitHub repo
git remote add origin https://github.com/<your-user>/FED-Shell.git
git push -u origin main
```

### Step 2 — Trigger the build

1. Go to your repo on GitHub
2. Click the **Actions** tab
3. Select **🏗️ FED-Shell — Universal Fleet Build**
4. Click **Run workflow**
5. Fill in:

| Field | What to enter | Example |
|---|---|---|
| `target_url` | The URL your app will load | `https://pokejumper.org` |
| `app_name` | Name shown under the app icon | `PokeJumper` |
| `app_id` | Reverse-domain bundle ID | `com.fed.pokejumper` |
| `build_electron` | Also build Electron apps? | `false` (unless you have Electron repos) |
| `electron_repo_1` | First Electron repo (owner/name) | `FED-OS/Surf-FED-Electron` |
| `electron_repo_2` | Second Electron repo | `FED-OS/Surf-FED-Extensions` |
| `build_tauri` | Also build a Tauri app? | `false` (unless you have a Tauri repo) |
| `tauri_repo` | Tauri repo (owner/name) | `FED-OS/Surf-FED-Tauri` |

6. Click **Run workflow** (green button)

### Step 3 — Wait ~5 minutes

All 8 jobs run in parallel. Watch the progress in the Actions tab. A green
check means all jobs passed; a yellow dot means still running.

### Step 4 — Download artifacts

1. Click the completed run
2. Scroll to the **Artifacts** section at the bottom
3. Download what you need:

| Artifact | What it is |
|---|---|
| `android-debug-apks` | Debug APKs for testing (pick `app-universal` for any phone) |
| `android-release-apks` | Optimized release APKs |
| `android-release-aab` | `.aab` for Google Play upload |
| `ios-simulator-app` | `.app` for iOS Simulator testing |
| `desktop-windows` | `.exe` for Windows |
| `desktop-macos` | `.app` for macOS |
| `desktop-linux` | Binary for Linux |
| `electron-*` / `tauri-*` | Optional builds (if you enabled them) |
| `FED-Shell-Full-Build` | One zip with everything |

### Step 5 — Install

See `INSTALL.md` for platform-specific installation instructions.

---

## Local usage (without GitHub)

### Build Android APK locally

```bash
./scripts/inject-url.sh "https://your-site.com" "My App" "com.fed.myapp"
npm ci
npx cap sync android
cd android && ./gradlew assembleDebug
# APKs in app/build/outputs/apk/debug/
```

### Build desktop app locally

```bash
./scripts/inject-url.sh "https://your-site.com" "My App" "com.fed.myapp"
cd native-desktop
pip install -r requirements.txt
python compile-desktop.py --url https://your-site.com --name "My App" --platform linux
# Binary in dist/standalone/
```

### Just test the injection (no build)

```bash
./scripts/inject-url.sh "https://your-site.com" "My App" "com.fed.myapp"
# Now inspect the changed files:
cat capacitor.config.json
cat android/app/src/main/res/values/strings.xml
cat native-desktop/config.json
```

---

## Tips

- **Use `app-universal` APK** if you're not sure which architecture your phone is
- **For testing:** debug APKs are easiest — just install and go
- **For production:** use the AAB with your own keystore signing (see `BUILD.md`)
- **Your site must be live** — the app loads it at runtime, so if the URL is
  down, the app shows a blank screen
- **Make your site responsive** — the WebView is full-screen on mobile
- **Re-run anytime** — changing the URL? Just trigger the workflow again with
  the new URL. No code changes needed
