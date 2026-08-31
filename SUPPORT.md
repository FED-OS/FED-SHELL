# Support

## Where to get help

| Need | Where to go |
|---|---|
| Bug or build failure | [Open a bug report](https://github.com/FED-OS/FED-Shell/issues/new/choose) |
| Feature idea | [Open a feature request](https://github.com/FED-OS/FED-Shell/issues/new/choose) |
| Question or discussion | [Community forum](https://www.fedpromptly.com/forum) |
| Security vulnerability | See `SECURITY.md` — do NOT open a public issue |
| Sponsor / support the project | [Ko-fi](https://ko-fi.com/fedpromptly) |

## Before you ask

To get the fastest help, include:

1. **What you're trying to do** (the URL, app name, app ID you entered)
2. **What platform(s) you're building for**
3. **What happened** — the full error message or CI log
4. **What you expected**
5. **Your environment** — OS, Node/Python/Java versions, FED-Shell commit

The bug report template covers most of this automatically.

## Common issues

| Problem | Solution |
|---|---|
| Android build fails with SDK error | Ensure JDK 21 and Android SDK 36 are installed; use `android-actions/setup-android@v3` in CI |
| iOS build only works in CI, not locally | You need a macOS host with Xcode — use the CI macOS runner |
| Desktop binary won't launch on Linux | Install `libegl1 libnss3 libxcb-cursor0` |
| Desktop binary blocked by Windows SmartScreen | Click "More info → Run anyway" (binary is unsigned) |
| Desktop `.app` blocked by macOS Gatekeeper | Right-click → Open → confirm |
| App loads a blank screen | Your target URL might be down, or blocking iframe/WebView loading. Check the URL in a browser first |
| Injection script error | Run `python3 scripts/inject-config.py <url> <name> <id>` directly for a clear error message |

## Self-help resources

- `README.md` — overview and quick start
- `BUILD.md` — full build commands per platform
- `INSTALL.md` — how to install output apps
- `ADR.md` — why architectural decisions were made
- `FAQ.md` — common questions
- `ROADMAP.md` — what's planned

## Response times

This is an independent, community-driven project. There are no SLAs. The
maintainer and community help when they can. For urgent commercial needs,
consider sponsoring via [Ko-fi](https://ko-fi.com/fedpromptly) and reaching
out on the forum.
