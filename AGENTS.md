# AGENTS.md

> Operating instructions for AI agents (Claude, Codex, Cursor, etc.) working on FED-Shell.

## Identity

You are assisting with **FED-Shell**, the universal URL-to-native-app builder
in the **FED-OS** ecosystem. The maintainer is anti-corporate, pro-sovereignty,
and builds everything from scratch — no unnecessary dependencies.

## Mission

One URL input → native apps for Android, iOS, Windows, macOS, Linux, plus
optional Electron and Tauri, all in a single GitHub Actions run.

## What you can touch

| Area | Guidance |
|---|---|
| `scripts/inject-config.py` | The single source of truth for URL injection. Extend it when adding a new platform config — do not create parallel injection scripts. |
| `native-desktop/` | PySide6 + PyInstaller. Keep `main.py` dependency-light. |
| `.github/workflows/build-all.yml` | Add jobs as new jobs, not steps inside existing jobs, so they stay parallel. |
| `capacitor.config.json` | Keep as clean defaults; the injector overwrites at build time. |
| `android/` `ios/` | Capacitor-generated. Don't hand-edit generated files unless fixing a real bug. |

## What you must NOT do

- **Do not** add Cordova, Ionic UI kit, React Native, Flutter, or any meta-framework. Capacitor + raw WebView + PySide6 only.
- **Do not** hardcode URLs, app names, or app IDs anywhere except as defaults in `capacitor.config.json`.
- **Do not** commit `node_modules/`, `dist/`, `build/`, `*.keystore`, `.env`, or `__pycache__/`.
- **Do not** replace the Python injector with a shell-only version — cross-platform safety matters.
- **Do not** add jobs that depend on other platform jobs (breaks parallelism) unless it's the final `package-all` gather step.

## Coding style

- Python: stdlib first, 4-space indent, functions with docstrings, `if __name__ == "__main__"` guard.
- Shell: `set -euo pipefail`, quote all variables, delegate logic to Python.
- YAML: 2-space indent, comment each job block, use `if-no-files-found: error` on artifact uploads.
- Gradle: match existing Capacitor conventions; don't bump versions without testing.

## Before you finish a task

1. `python3 -m py_compile` every `.py` you touched
2. Run `./scripts/inject-url.sh "https://test.com" "Test" "com.fed.test"` and confirm all 6 configs update
3. YAML-lint any workflow changes
4. `git diff --cached | grep -iE 'key|secret|password|token|keystore'` — must be empty
5. Update `CHANGELOG.md` if user-facing behavior changed

## Repo facts

- Ko-fi: `fedpromptly`
- GitHub org: `FED-OS`
- Forum: `fedpromptly.com/forum`
- Node: 22 (see `.nvmrc`)
- JDK: 21
- Python: 3.11
- Android: compileSdk 36, minSdk 24, targetSdk 36
