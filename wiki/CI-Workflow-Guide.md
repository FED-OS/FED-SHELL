# CI Workflow Guide

> Job-by-job walkthrough of `.github/workflows/build-all.yml`.

## Trigger

The workflow runs on `workflow_dispatch` with these inputs:

| Input | Default | Purpose |
|-------|---------|---------|
| `target_url` | `https://example.com` | URL the app will load |
| `app_name` | `FED Shell` | Human-readable app name |
| `app_id` | `com.fed.shell` | Reverse-DNS bundle ID |
| `build_electron` | `false` | Whether to run Electron jobs |
| `electron_repo_1` | `""` | First Electron repo (org/repo) |
| `electron_repo_2` | `""` | Second Electron repo (org/repo) |
| `build_tauri` | `false` | Whether to run Tauri job |
| `tauri_repo` | `""` | Tauri repo (org/repo) |

All inputs are mapped to environment variables (`TARGET_URL`, `APP_NAME`,
`APP_ID`) at the workflow level so every job can read them.

## Shared first step

Every job starts with:

```yaml
- uses: actions/checkout@v4
- name: Inject config
  run: |
    python3 scripts/inject-config.py "$TARGET_URL" "$APP_NAME" "$APP_ID"
```

This rewrites all 6 config files before the platform-specific build begins.

## Job: build-android-debug

- **Runner**: `ubuntu-latest`
- **JDK**: 21 (Temurin)
- **Node**: 22
- **Steps**: checkout → inject → `npm ci` → `npx cap sync android` →
  `cd android && ./gradlew assembleDebug`
- **Artifacts**: per-ABI APKs (armeabi-v7a, arm64-v8a, x86, x86_64) + universal
  APK, uploaded via `actions/upload-artifact@v4`

## Job: build-android-release

- Same setup as debug, but runs `./gradlew assembleRelease`
- Produces a **debug-signed** release APK (keystore from Secrets if configured;
  otherwise uses the default debug signing for testing)
- Artifacts: signed release APKs per ABI + universal

## Job: build-android-bundle

- Runs `./gradlew bundleRelease`
- Produces an `.aab` (Android App Bundle) for Play Store upload
- Artifact: single `.aab` file

## Job: build-ios-simulator

- **Runner**: `macos-latest`
- **Steps**: checkout → inject → `npm ci` → `npx cap sync ios` →
  `xcodebuild -workspace App.xcworkspace -scheme App -configuration Debug
  -sdk iphonesimulator -derivedDataPath build CODE_SIGNING_ALLOWED=NO`
- **No code signing** — this produces a simulator-only `.app`
- Artifact: the `.app` bundle zipped

## Job: build-desktop (matrix)

- **Matrix**: `os: [ubuntu-latest, windows-latest, macos-latest]`
- **Python**: 3.11
- **Steps**: checkout → inject → `pip install -r native-desktop/requirements.txt`
  → `python3 native-desktop/compile-desktop.py --url "$TARGET_URL" --name
  "$APP_NAME" --platform <inferred from runner>`
- **PyInstaller** packages `main.py` as a one-file, noconsole executable with
  `config.json` embedded via `--add-data`
- **Artifacts**: `.exe` (Windows), `.app` (macOS), standalone binary (Linux)

## Job: build-electron (conditional)

- **Condition**: `if: github.event.inputs.build_electron == 'true'`
- **Matrix**: up to 2 repos, 3 OS each
- **Steps**: checkout the external repo → inject URL into its config →
  `npm ci` → `npm run build` → `npx electron-builder`
- Artifacts: installers per OS per repo

## Job: build-tauri (conditional)

- **Condition**: `if: github.event.inputs.build_tauri == 'true'`
- **Steps**: checkout the Tauri repo (e.g. Surf-FED) → inject URL →
  `npm ci` → `npm run tauri build`
- Artifacts: Tauri bundles per OS

## Job: package-all

- **Depends on**: all build jobs (`needs: [build-android-debug,
  build-android-release, build-android-bundle, build-ios-simulator,
  build-desktop, build-electron, build-tauri]`)
- **Steps**: download all artifacts → zip into `FED-Shell-bundle.zip` →
  optionally create a GitHub Release
- This is the **only** job with dependencies; everything else is parallel

## Caching

- `actions/setup-node` caches `~/.npm`
- `actions/setup-java` caches Gradle dependencies
- `actions/cache` caches `~/.gradle/caches` and `.gradle`
- PyInstaller builds are not cached (the output is the deliverable)

## Timeouts

Each job has a 30-minute timeout. If a job exceeds this, it fails and the
artifacts from completed jobs are still available.
