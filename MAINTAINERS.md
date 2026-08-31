# MAINTAINERS

This file lists who has commit / review rights on FED-Shell and what they're
responsible for. It is **not** a contributors list (see `AUTHORS.md` for that).

## Active Maintainers

| Handle | Area | Contact |
|---|---|---|
| **Fedpromptly** | All areas — lead maintainer | [GitHub](https://github.com/Fedpromptly) · [Forum](https://www.fedpromptly.com/forum) |

## Areas of Responsibility

| Area | Owner | Notes |
|---|---|---|
| `scripts/inject-config.py` | Fedpromptly | The injection engine — changes here affect every platform |
| `.github/workflows/build-all.yml` | Fedpromptly | CI orchestration |
| `native-desktop/` | Fedpromptly | PySide6 wrapper + PyInstaller |
| `android/` | Fedpromptly | Capacitor Android project |
| `ios/` | Fedpromptly | Capacitor iOS project |
| Documentation & releases | Fedpromptly | README, CHANGELOG, ROADMAP |

## How to become a maintainer

1. Contribute consistently (5+ merged PRs that aren't trivial docs fixes)
2. Demonstrate understanding of the injection architecture and the parallel CI model
3. Be active in discussions / issue triage on the forum
4. Ask — the project is small enough that this is a conversation, not a committee vote

## Maintainer expectations

- Review PRs within a reasonable window; don't let them stagnate
- Never merge anything that breaks the `inject-config.py` test
- Never force-push to `main` without coordinating
- Tag releases using semantic versioning (`vMAJOR.MINOR.PATCH`)
- Update `CHANGELOG.md` with every release
