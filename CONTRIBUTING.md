# Contributing

First off — thank you for wanting to contribute to FED-Shell. The FED-OS
ecosystem thrives because independent developers build and share.

## Getting started

1. **Fork** the repo and clone your fork
2. **Read** `CLAUDE.md` and `AGENTS.md` if you're using an AI coding assistant
3. **Read** `ADR.md` to understand why the architecture is the way it is
4. Set up your local environment (see `BUILD.md`)

```bash
git clone https://github.com/<your-username>/FED-Shell.git
cd FED-Shell
npm ci
cd native-desktop && pip install -r requirements.txt && cd ..
```

## How to contribute

### Bug fixes

1. Check existing issues to make sure it's not already reported
2. Open a [bug report](https://github.com/FED-OS/FED-Shell/issues/new/choose)
   if it's new
3. Fix it in a branch: `git checkout -b fix/my-bugfix`
4. Test the injection: `./scripts/inject-url.sh "https://test.com" "Test" "com.fed.test"`
5. Open a PR using the pull request template

### Features

1. **Discuss first** — open a feature request issue or post on the
   [forum](https://www.fedpromptly.com/forum)
2. If it fits the vision (see `ROADMAP.md` and `GOVERNANCE.md`), build it
3. Keep the change focused — one feature per PR
4. Add/update documentation
5. Open a PR

### Documentation

Docs improvements are always welcome. Fix typos, add examples, clarify
confusing sections. No need to open an issue first for small doc fixes.

## Code style

### Python (`scripts/`, `native-desktop/`)
- stdlib first — avoid adding new dependencies
- 4-space indentation
- Functions have docstrings
- `if __name__ == "__main__":` guard on executable scripts
- Type hints welcome but not required

### Shell (`scripts/inject-url.sh`)
- `set -euo pipefail` at the top
- Quote all variable expansions
- Delegate complex logic to Python, not inline heredocs

### YAML (`.github/workflows/`)
- 2-space indentation
- Comment each job block with a divider
- Use `if-no-files-found: error` on artifact uploads
- New platforms = new jobs (not steps), to preserve parallelism

### Gradle / native files
- Match existing Capacitor conventions
- Don't bump SDK / dependency versions without testing a full build

## Before you open a PR

- [ ] `python3 -m py_compile` passes on every `.py` you touched
- [ ] `./scripts/inject-url.sh "https://test.com" "Test" "com.fed.test"` runs clean
- [ ] YAML lints clean
- [ ] No secrets, keystores, or `.env` files staged
- [ ] Documentation updated if behavior changed
- [ ] `CHANGELOG.md` updated (if user-facing)

```bash
# Quick pre-flight check
python3 -m py_compile scripts/inject-config.py native-desktop/main.py native-desktop/compile-desktop.py
./scripts/inject-url.sh "https://test.com" "Test" "com.fed.test"
git diff --cached | grep -iE 'key|secret|password|token|keystore'  # should be empty
```

## Commit messages

Keep them clear and concise:

```
fix(android): correct applicationId injection for hyphenated IDs
feat(desktop): add custom icon support to PyInstaller build
docs: clarify offline vs URL mode in README
```

## Branch naming

- `fix/description` — bug fixes
- `feat/description` — new features
- `docs/description` — documentation only

## Review process

1. A maintainer reviews your PR
2. Feedback is given — please respond and push fixes to the same branch
3. Once approved, it's merged (squash merge preferred)
4. You get added to `AUTHORS.md` if it's your first contribution

## Questions?

- [Community forum](https://www.fedpromptly.com/forum)
- [Open a discussion issue](https://github.com/FED-OS/FED-Shell/issues/new/choose)

Happy building. 🏗️
