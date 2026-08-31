# FED-Shell — Prompt Library

This directory contains reusable AI prompts that work with FED-Shell. Each
prompt is designed to produce code or content that fits the repo's
conventions (single Python injector, parallel CI, domain-locked WebView, no
third-party meta-frameworks).

## Files

| File | Purpose |
|------|---------|
| [`add-platform-target.md`](add-platform-target.md) | Add a new native build target to the fleet |
| [`generate-app-config.md`](generate-app-config.md) | Generate the 3 build inputs (URL, name, ID) from a project description |
| [`write-injection-rule.md`](write-injection-rule.md) | Add a new config file to the Python injector |
| [`debug-build-failure.md`](debug-build-failure.md) | Triage a failed CI job |
| [`write-readme-section.md`](write-readme-section.md) | Generate or update a README section |
| [`review-pr.md`](review-pr.md) | Review a PR against FED-Shell conventions |

## How to use

1. Copy the prompt text into your AI assistant (Claude, ChatGPT, Copilot, etc.)
2. Replace the `[BRACKETED]` placeholders with your specifics
3. Paste the output into the appropriate file in the repo
4. Run `python3 scripts/inject-config.py <url> <name> <id>` to verify it still
   produces correct configs

## Conventions enforced by these prompts

- All config rewriting happens in **one** Python file: `scripts/inject-config.py`
- CI jobs are **parallel**; only `package-all` depends on others
- Desktop uses **PySide6 + PyInstaller**, never Electron (see `ADR.md` ADR-006)
- Mobile uses **Capacitor** only, never Cordova UI / React Native / Flutter
- No secrets, keystores, or `.env` files are ever committed
