# Changelog

All notable changes to FED-Shell will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Release APK signing with user-provided keystore
- Real-device iOS IPA builds (Apple Developer secrets)
- Custom app icon injection
- FED-PLAY auto-upload integration

## [1.0.0] — 2026-08-31

### Added
- **Universal fleet build workflow** (`build-all.yml`) — 8 parallel jobs
  producing Android, iOS, and Desktop artifacts from a single URL input
- **Cross-platform URL injector** (`scripts/inject-config.py`) — rewrites
  capacitor.config.json, Android strings.xml, Android build.gradle, iOS
  capacitor.config.json, iOS Info.plist, and desktop config.json
- **Shell wrapper** (`scripts/inject-url.sh`) for CI and local use
- **Desktop WebView wrapper** (`native-desktop/main.py`) — PySide6/QtWebEngine
  with domain-locked navigation and external-link forwarding
- **Desktop packager** (`native-desktop/compile-desktop.py`) — PyInstaller
  one-file bundling with embedded config.json
- **Android debug APKs** — per-ABI (arm64-v8a, armeabi-v7a, x86, x86_64) + universal
- **Android release APKs** — per-ABI + universal (debug-signed)
- **Android release AAB** — for Google Play upload
- **iOS Simulator build** — `.app` with no Apple account required
- **Desktop Windows build** — standalone `.exe` via matrix
- **Desktop macOS build** — `.app` bundle via matrix
- **Desktop Linux build** — standalone binary via matrix
- **Optional Electron builds** — up to 2 separate repos, win/mac/linux matrix
- **Optional Tauri build** — 1 separate repo, win/mac/linux matrix
- **Unified artifact zip** (`package-all` job) — single download of everything
- Comprehensive documentation: README, BUILD, INSTALL, DEPLOYMENT, ADR,
  ROADMAP, FAQ, CONTRIBUTING, CODE_OF_CONDUCT, GOVERNANCE, SECURITY, SUPPORT,
  PRICING, COPYING, CITATIONS, NOTICE, SUMMARY, CHANGELOG
- GitHub community templates: bug report, feature request, custom issue,
  pull request template, discussion welcome, FUNDING.yml
- AI agent context files: CLAUDE.md, AGENTS.md
- AUTHORS.md, MAINTAINERS.md

### Inherited (from the original Build-Mobile-Apps-Android-iOS repo)
- Capacitor Android project (compileSdk 36, minSdk 24)
- Capacitor iOS project with Xcode workspace
- Per-ABI APK splitting (arm64-v8a, armeabi-v7a, x86, x86_64 + universal)
- Original `build.yml` workflow (kept as backup)

### Security
- `.gitignore` protects against committing keystores, `.env` files, and signing certificates
