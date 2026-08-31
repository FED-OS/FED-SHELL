# Prompt: Review a PR against FED-Shell conventions

## Context

You are reviewing a pull request for **FED-Shell**. The repo has strict
conventions documented in `CONTRIBUTING.md`, `AGENTS.md`, and `ADR.md`.

## PR description

```
[PASTE THE PR DESCRIPTION HERE]
```

## Changed files

```
[PASTE THE LIST OF CHANGED FILES, OR THE DIFF]
```

## Review checklist

Go through each item and mark ✅ pass, ❌ fail, or ⚠️ needs discussion.

### Architecture

- [ ] Does not introduce a third-party meta-framework (React Native, Flutter,
      Cordova UI, Ionic UI) — per ADR-001 and ADR-006
- [ ] Desktop changes use PySide6, not Electron — per ADR-006
- [ ] Mobile changes use Capacitor only — per ADR-003
- [ ] Any new config-file rewriting is added to `scripts/inject-config.py`
      (single injector), not a new script — per ADR-005
- [ ] New CI jobs are parallel; only `package-all` depends on others — per
      ADR-004

### Code quality

- [ ] Python files pass `python3 -m py_compile`
- [ ] No external Python dependencies beyond the standard library in the
      injector
- [ ] Functions are idempotent where they modify config files
- [ ] `set -euo pipefail` is present in any new shell scripts

### Security

- [ ] No secrets, keystores, `.env`, or API keys committed
- [ ] Workflow references secrets via `${{ secrets.* }}`, never inline
- [ ] No `console.log` / `print` of sensitive values

### Documentation

- [ ] README updated if user-facing behavior changed
- [ ] CHANGELOG entry added
- [ ] ADR added if an architectural decision was made
- [ ] ROADMAP updated if a planned item was completed

### Testing

- [ ] Injector tested with a real URL / name / ID triple
- [ ] All 6 config files produce correct output
- [ ] CI workflow YAML is valid

## Output

Produce a structured review comment ready to paste into the PR:

```
### FED-Shell Convention Review

**Architecture:** [summary]
**Code quality:** [summary]
**Security:** [summary]
**Docs:** [summary]
**Testing:** [summary]

**Verdict:** [APPROVE / REQUEST CHANGES / BLOCK]

[Detailed comments per file if needed]
```
