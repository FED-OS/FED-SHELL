# FED-Shell Wiki

Welcome to the FED-Shell wiki — the deep-dive companion to the
[main README](../README.md). The README covers the quick start; this wiki
covers the *why* and *how* in depth.

## Pages

| Page | What it covers |
|------|----------------|
| [Home](Home.md) | You are here — index and getting started |
| [Architecture](Architecture.md) | How the fleet builder is wired together |
| [Injection-Deep-Dive](Injection-Deep-Dive.md) | How one Python script rewrites 6 native config files |
| [CI-Workflow-Guide](CI-Workflow-Guide.md) | Job-by-job walkthrough of `build-all.yml` |
| [Desktop-WebView](Desktop-WebView.md) | How the PySide6 domain-locked WebView works |
| [Adding-a-Platform](Adding-a-Platform.md) | Step-by-step guide to adding a new build target |
| [FED-OS-Ecosystem](FED-OS-Ecosystem.md) | How FED-Shell connects to Surf-FED, FED-PLAY, FED-Launcher |
| [FAQ-Extended](FAQ-Extended.md) | Longer answers beyond the main FAQ.md |
| [Glossary](Glossary.md) | Terms used throughout the project |

## How to edit this wiki

This wiki lives **in the repository** (the `wiki/` directory), not in
GitHub's built-in wiki feature. This keeps it versioned, reviewable through
PRs, and available offline.

1. Edit or create a `.md` file in `wiki/`
2. Add it to the table above
3. Open a PR — the same review process applies as for code
4. Link to wiki pages from other docs using relative paths:
   `[Architecture](wiki/Architecture.md)`

## Wiki conventions

- Each page starts with a one-line summary
- Use H2 (`##`) for sections within a page
- Code blocks are fenced with language tags
- Cross-link liberally but avoid circular dependencies
- Keep pages focused — if a page exceeds ~500 lines, split it
