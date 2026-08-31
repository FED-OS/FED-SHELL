<!--
  FED-Shell Pull Request Template
  Root-level copy for tools / forks that look for PULL_REQUEST_TEMPLATE.md
  at the repository root. The canonical copy lives at
  .github/PULL_REQUEST_TEMPLATE.md
-->

## Summary

<!-- One or two sentences describing what this PR does. -->

## Related Issue

<!-- "Closes #123" or "Relates to #45". Leave blank if none. -->

## What changed

- [ ] Injection scripts (`scripts/`)
- [ ] GitHub Actions workflow (`.github/workflows/`)
- [ ] Desktop WebView (`native-desktop/`)
- [ ] Capacitor / native config (`capacitor.config.json`, `android/`, `ios/`)
- [ ] Documentation
- [ ] Other: __________

## Changes

<!-- Describe the concrete changes. -->

-

## How to test

<!-- Steps a reviewer can follow to verify this works. -->

1.
2.
3.

### Build inputs used for testing

- **Target URL**: `https://`
- **App name**:
- **App ID** (e.g. `com.example.app`):

## Checklist

- [ ] I have tested the build with a real URL input
- [ ] My code follows the repo style (see `CONTRIBUTING.md`)
- [ ] I have updated documentation where needed
- [ ] I have not committed secrets, keystores, or `.env` files
- [ ] `python3 -m py_compile` passes on any modified `.py` files
- [ ] `inject-config.py` produces correct output for all 6 config files

---

Support FED-Shell development:

<a href='https://ko-fi.com/fedpromptly' target='_blank'>
    <img height='36' style='border:0px;height:36px;' src='https://ko-fi.com/img/githubbutton_sm.svg' border='0' alt='Buy Me a Coffee at ko-fi.com' />
</a>
