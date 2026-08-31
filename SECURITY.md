# Security Policy

## Supported Versions

FED-Shell is actively developed. Security fixes are applied to the latest
release line only.

| Version | Supported          |
|---------|--------------------|
| 1.x     | ✅ Current release  |
| < 1.0   | ❌ Not supported    |

## Reporting a Vulnerability

**Do NOT open a public GitHub issue for security vulnerabilities.**

If you discover a security issue in FED-Shell, please report it privately:

1. **Email**: Send details to **security@fedpromptly.com**
2. **GitHub Security Advisories**: Use the
   ["Report a vulnerability"](https://github.com/FED-OS/FED-Shell/security/advisories/new)
   button under the **Security** tab of the repository.
3. **Forum (private message)**: Contact **@fedpromptly** on
   [fedpromptly.com/forum](https://fedpromptly.com/forum) and ask for a
   private channel.

### What to include

- Description of the vulnerability and its potential impact
- Steps to reproduce (code snippet, build inputs, or commands)
- Affected file(s) or component(s)
- Suggested fix if you have one
- Your handle / preferred contact for follow-up

### Response timeline

| Step                          | Target SLA      |
|-------------------------------|-----------------|
| Acknowledge receipt           | Within 48 hours |
| Initial assessment            | Within 5 days   |
| Fix or mitigation published   | Within 30 days  |
| Public disclosure (coordinated) | After fix is released, or 90 days if no fix is possible |

We will credit reporters in the release notes unless you prefer to remain
anonymous.

## Scope

### In scope

- The injection scripts (`scripts/inject-config.py`, `scripts/inject-url.sh`)
- The GitHub Actions workflows (`.github/workflows/`)
- The PySide6 desktop WebView (`native-desktop/main.py`) — specifically the
  domain-locking navigation logic
- The Capacitor configuration layer (`capacitor.config.json` and native
  config files that the injector writes)
- Secrets handling in CI (keystore, signing keys, environment variables)

### Out of scope

- Vulnerabilities in the **target URL** you wrap — FED-Shell loads a remote
  URL you provide; the security of that site is your responsibility.
- Vulnerabilities in **third-party dependencies** (Capacitor, PySide6,
  PyInstaller, Gradle, CocoaPods) — report those upstream.
- Issues that require physical access to a device or a rooted/jailbroken
  environment.

## Security design notes

FED-Shell follows a **least-trust** model:

1. **Domain-locked navigation** — The desktop WebView only allows navigation
   to the configured target domain and `about:`/`data:` URIs. All other links
   are forwarded to the system browser, preventing the WebView from being
   redirected to arbitrary sites.
2. **No embedded credentials** — The injector writes only a URL, app name, and
   app ID into native configs. No API keys, tokens, or passwords are baked
   into the build output.
3. **CI secrets are write-only** — Signing keystores and API keys live in
   GitHub Encrypted Secrets. They are never printed to logs, never committed,
   and never included in release artifacts.
4. **URL injection is explicit** — The build only wraps the URL you pass via
   the `workflow_dispatch` input. There is no auto-discovery or telemetry.

## Hardening checklist for your own builds

- [ ] Use HTTPS for your target URL (`https://`)
- [ ] Enable HSTS and CSP headers on your target site
- [ ] Set `android:usesCleartextTraffic="false"` in `AndroidManifest.xml`
    (default is false on API 28+)
- [ ] Configure App Transport Security (ATS) in `Info.plist` (default enforces
    HTTPS on iOS)
- [ ] Store signing keystores in GitHub Secrets, never in the repo
- [ ] Pin the Capacitor / PyInstaller versions in your fork to avoid supply
    chain drift
- [ ] Review the `permissions` block in `AndroidManifest.xml` and remove any
    you don't need

---

Support FED-Shell development:

<a href='https://ko-fi.com/fedpromptly' target='_blank'>
    <img height='36' style='border:0px;height:36px;' src='https://ko-fi.com/img/githubbutton_sm.svg' border='0' alt='Buy Me a Coffee at ko-fi.com' />
</a>
