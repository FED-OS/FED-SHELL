# FED-OS Ecosystem

> How FED-Shell connects to the other projects in the FED-OS sovereign stack.

## The ecosystem

FED-OS is a sovereign, open-source developer stack. FED-Shell is one node in
a network of interoperable tools:

```
                    ┌──────────────┐
                    │  FED-Launcher│  ← orchestrator / dashboard
                    │  (planned)   │
                    └──────┬───────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
   ┌────────────┐  ┌────────────┐  ┌────────────┐
   │ FED-Shell  │  │ Surf-FED   │  │  FED-PLAY  │
   │ (this repo)│  │ (browser)  │  │ (app store)│
   │ URL→native │  │ Tauri-based│  │ mobile +   │
   │ builder    │  │ browser    │  │ desktop    │
   └──────┬─────┘  └────────────┘  └──────┬─────┘
          │                               │
          └───────────────────────────────┘
              FED-Shell builds apps that
              can be published to FED-PLAY
```

## FED-Shell's role

FED-Shell is the **factory**: it takes a URL and produces native apps. It does
not browse the web (that's Surf-FED) and it does not distribute apps (that's
FED-PLAY). It sits in the middle — raw material (URL) in, finished goods
(apps) out.

## Surf-FED (Tauri browser)

- **What it is**: A Tauri-based desktop browser built as part of the FED-OS
  ecosystem
- **How it connects to FED-Shell**: FED-Shell can build Surf-FED as one of its
  Tauri targets. When you trigger a build with `build_tauri: true` and point
  `tauri_repo` to Surf-FED, FED-Shell produces browser binaries for all
  desktop platforms.
- **GitHub**: `https://github.com/FED-OS/Surf-FED`

## FED-PLAY (app store)

- **What it is**: A mobile + desktop app store for FED-OS ecosystem apps
- **How it connects to FED-Shell**: The `package-all` job is designed to
  eventually push artifacts to FED-PLAY. Currently artifacts go to GitHub
  Releases; a FED-PLAY upload step is on the roadmap (v1.2.0).
- **GitHub**: `https://github.com/FED-OS/FED-PLAY`

## FED-Launcher (orchestrator)

- **What it is**: A dashboard that ties the ecosystem together — trigger
  builds, browse FED-PLAY, launch Surf-FED
- **How it connects to FED-Shell**: FED-Launcher would call the GitHub Actions
  `workflow_dispatch` API to trigger FED-Shell builds, then display the
  resulting artifacts
- **Status**: Planned
- **GitHub**: `https://github.com/FED-OS/FED-Launcher` (planned)

## Fed-Poster (multi-platform poster)

- **What it is**: A successful tool that posts to multiple platforms from one
  input (159 clones in 14 days)
- **How it connects to FED-Shell**: Fed-Poster could itself be wrapped as a
  native app using FED-Shell if it has a web frontend
- **GitHub**: `https://github.com/FED-OS/Fed-Poster`

## Shared conventions across the ecosystem

| Convention | Why |
|-----------|-----|
| MIT license | Maximum permissiveness, no copyleft complications |
| No third-party meta-frameworks | Sovereignty — we own the stack, not a vendor |
| Ko-fi for funding (`fedpromptly`) | Community-supported, no paywall |
| GitHub org: `FED-OS` | Central namespace for all repos |
| Forum: `fedpromptly.com/forum` | Community hub |
| Node 22, Python 3.11, JDK 21 | Consistent toolchain across repos |

## Cross-repo build flow (future)

```
1. Developer pushes a web app to their repo
2. FED-Launcher detects the push (or dev triggers manually)
3. FED-Launcher calls FED-Shell's workflow_dispatch with the app's URL
4. FED-Shell builds native apps for all platforms
5. package-all uploads to FED-PLAY
6. FED-PLAY makes the apps available for download
7. Users install via FED-PLAY or Surf-FED's built-in store view
```

This is the long-term vision. FED-Shell's v1.0.0 handles steps 3–4 and the
GitHub Releases part of step 5. The rest is on the roadmap.
