# Prompt: Add a new platform build target

## Context

You are working on **FED-Shell**, a universal URL-to-native-app builder. It
takes one URL + app name + app ID and builds native apps for every platform
in a single GitHub Actions run.

Current targets: Android (debug APK, release APK, AAB), iOS (simulator),
Desktop (Windows / macOS / Linux via PySide6 + PyInstaller), Electron
(conditional, up to 2 repos), Tauri (conditional, 1 repo).

All config injection goes through a single Python script:
`scripts/inject-config.py`, which currently rewrites 6 files
(`capacitor.config.json`, `strings.xml`, `build.gradle`, `Info.plist`,
and writes a desktop `config.json`).

## Task

Add a new build target: **[PLATFORM_NAME]**.

Produce the following:

1. **A new job** in `.github/workflows/build-all.yml` that:
   - Runs in parallel with existing jobs (no hard dependency unless truly needed)
   - Uses `workflow_dispatch` inputs `TARGET_URL`, `APP_NAME`, `APP_ID` from env
   - Checks out the repo
   - Runs the injector: `python3 scripts/inject-config.py "$TARGET_URL" "$APP_NAME" "$APP_ID"`
   - Performs the platform-specific build
   - Uploads artifacts with `actions/upload-artifact@v4`
   - Has a clear `name:` and `runs-on:`

2. **An injection rule** addition to `scripts/inject-config.py` — if the new
   platform needs its own config file rewritten, add a function following the
   existing pattern (`update_json`, `update_strings_xml`, etc.) and call it
   from `main()`.

3. **A documentation update** to `README.md`, `BUILD.md`, and `ROADMAP.md`
   describing the new target.

## Constraints

- Do NOT introduce a third-party meta-framework (no React Native, Flutter,
  Cordova UI, Ionic UI). The desktop target must remain PySide6.
- The job must be parallel; only `package-all` may depend on it.
- No secrets in the workflow file — use `${{ secrets.* }}` references only.
- The injector must remain a single Python file with no external dependencies
  beyond the standard library.

## Output format

Provide three fenced code blocks:

```yaml
# .github/workflows/build-all.yml — new job (show only the new job)
```

```python
# scripts/inject-config.py — new function + the main() call line
```

```markdown
# README.md / BUILD.md / ROADMAP.md — the diff to apply
```
