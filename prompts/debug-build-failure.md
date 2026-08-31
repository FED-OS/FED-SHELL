# Prompt: Debug a failed CI job

## Context

A FED-Shell GitHub Actions build failed. The workflow is
`.github/workflows/build-all.yml` with parallel jobs for Android, iOS,
Desktop, Electron, and Tauri. All jobs run the injector first:

```
python3 scripts/inject-config.py "$TARGET_URL" "$APP_NAME" "$APP_ID"
```

## Failed job

```
[PASTE THE JOB NAME HERE — e.g. build-android-release]
```

## Error log

```
[PASTE THE RELEVANT LOG LINES HERE]
```

## Build inputs used

- **target_url**: `[URL]`
- **app_name**: `[NAME]`
- **app_id**: `[ID]`
- **Runner OS**: `[ubuntu-latest / windows-latest / macos-latest]`

## Task

Produce a triage report with these sections:

1. **Root cause hypothesis** — the most likely reason for the failure, in one
   sentence.
2. **Evidence** — which log lines support this hypothesis.
3. **Fix** — the exact code change needed, as a diff or a clear instruction.
4. **Verification** — how to confirm the fix works (command to run locally or
   a re-trigger instruction).
5. **Prevention** — a guardrail to add so this class of failure is caught
   earlier (e.g. an input validation step, a `set -euo pipefail`, a
   `--check` flag on the injector).

## Common failure patterns to check first

- `app_id` contains uppercase letters or invalid characters → Gradle rejects it
- `target_url` is missing `https://` → cleartext traffic blocked on Android
- `app_name` has special characters → XML/plist parse error
- Missing `set -euo pipefail` → a step fails silently and the next one breaks
- PyInstaller `--add-data` separator is `:` on Unix but `;` on Windows
- Capacitor version mismatch between `package.json` and `capacitor.config.json`
- Xcode build needs `XC40` scheme or `CODE_SIGNING_ALLOWED=NO` for simulator
