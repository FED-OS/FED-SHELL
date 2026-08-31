# Architecture

> How the FED-Shell fleet builder is wired together — from one URL input to
> native apps on every platform.

## Overview

FED-Shell follows a **fan-out** architecture: a single set of inputs
(URL, app name, app ID) is fanned out to parallel build jobs, each of which
produces a platform-specific artifact. A final aggregation job collects all
artifacts into a single release bundle.

```
                  workflow_dispatch
                  (url, name, id)
                        │
                        ▼
              ┌─────────────────┐
              │  inject-config  │  ← one Python script
              │  .py            │     rewrites 6 configs
              └────────┬────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   ┌─────────┐   ┌─────────┐   ┌─────────┐
   │ Android │   │   iOS   │   │ Desktop │
   │ debug   │   │  sim    │   │ win/mac │
   │ release │   │         │   │ /linux  │
   │ AAB     │   │         │   │         │
   └────┬────┘   └────┬────┘   └────┬────┘
        │              │              │
        ▼              ▼              ▼
   ┌─────────┐   ┌─────────┐   ┌─────────┐
   │Electron │   │  Tauri  │   │         │
   │(2 repos)│   │(1 repo) │   │         │
   └────┬────┘   └────┬────┘   └────┬────┘
        │              │              │
        └──────────────┼──────────────┘
                       ▼
              ┌─────────────────┐
              │  package-all    │  ← depends on all
              │  (aggregate)    │     above jobs
              └─────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  GitHub Release │
              │  (all artifacts)│
              └─────────────────┘
```

## Design principles

1. **One injector, many targets** — All config rewriting happens in
   `scripts/inject-config.py`. No per-platform scripts. (ADR-005)
2. **Parallel by default** — Jobs run simultaneously. Only `package-all`
   waits. This minimizes wall-clock time. (ADR-004)
3. **No meta-frameworks** — Desktop is PySide6 + PyInstaller, not Electron.
   Mobile is Capacitor, not React Native or Flutter. (ADR-001, ADR-003,
   ADR-006)
4. **Inputs are explicit** — Everything comes from `workflow_dispatch` inputs.
   No magic, no auto-discovery, no telemetry.
5. **Secrets stay in Secrets** — Signing keys and API tokens live in GitHub
   Encrypted Secrets, never in the repo.

## The three inputs

| Input | Env var | Used by | Example |
|-------|---------|---------|---------|
| Target URL | `TARGET_URL` | Desktop config.json, (optionally) capacitor server.url | `https://pokejumper.org` |
| App name | `APP_NAME` | Android strings.xml, iOS Info.plist, desktop config.json | `PokeJumper` |
| App ID | `APP_ID` | Android build.gradle applicationId, iOS Info.plist CFBundleIdentifier | `com.fed.pokejumper` |

## Job dependency graph

| Job | Depends on | Produces |
|-----|-----------|----------|
| `build-android-debug` | injector | `*.apk` (per-ABI + universal) |
| `build-android-release` | injector | signed `*.apk` |
| `build-android-bundle` | injector | `*.aab` |
| `build-ios-simulator` | injector | `*.app` (simulator, unsigned) |
| `build-desktop` (matrix) | injector | `.exe` / `.app` / Linux binary |
| `build-electron` (conditional) | injector | Electron installer per OS |
| `build-tauri` (conditional) | injector | Tauri bundle per OS |
| `package-all` | all above | `FED-Shell-bundle.zip` |

See [CI-Workflow-Guide](CI-Workflow-Guide.md) for the job-by-job walkthrough.
See [Injection-Deep-Dive](Injection-Deep-Dive.md) for how the injector works.
