# Injection Deep Dive

> How one Python script rewrites six native config files from three inputs.

## The problem

Every native platform stores its app identity in a different file format:

| Platform | File | Format | What changes |
|----------|------|--------|--------------|
| Android | `app/src/main/res/values/strings.xml` | XML | `app_name` string |
| Android | `app/build.gradle` | Gradle DSL | `applicationId` |
| Capacitor | `capacitor.config.json` | JSON | `appId`, `appName` |
| iOS | `ios/App/App/Info.plist` | plist XML | `CFBundleDisplayName`, `CFBundleIdentifier` |
| iOS | `ios/App/App/capacitor.config.json` | JSON | `appId`, `appName` |
| Desktop | `config.json` (generated) | JSON | `url`, `app_name` |

Writing a separate script for each would mean six scripts, six sets of
escaping rules, and six things to keep in sync. Instead, FED-Shell uses
**one** Python script with a function per file format.

## The script: `scripts/inject-config.py`

### Entry point

```python
def main():
    if len(sys.argv) != 4:
        print("Usage: inject-config.py <url> <app_name> <app_id>")
        sys.exit(1)

    url, app_name, app_id = sys.argv[1], sys.argv[2], sys.argv[3]
    # ... calls each update_* function
```

### JSON files — `update_json(path, key, value)`

Uses the standard `json` module to load, modify, and dump. Handles nested
keys via dot notation where needed. Pretty-prints with `indent=2` for
readability and clean diffs.

### XML (strings.xml) — `update_strings_xml(path, app_name)`

Uses `re` to find and replace the `<string name="app_name">` value. Regex is
preferred over `xml.etree` here because strings.xml is simple and regex
preserves the exact formatting Gradle expects.

### Gradle (build.gradle) — `update_build_gradle(path, app_id)`

Regex-replaces the `applicationId` line. This is safer than parsing the full
Gradle DSL (which is Groovy, not a standard format).

### plist (Info.plist) — `update_info_plist(path, app_name, app_id)`

Regex-replaces `CFBundleDisplayName` (the app name shown under the icon) and
`CFBundleIdentifier` (the bundle ID). Uses the XML representation of plist,
which is what Xcode generates.

### Desktop config — `write_desktop_config(path, url, app_name)`

Unlike the others, this **creates** a new file rather than modifying an
existing one. The desktop WebView reads this at runtime to know which URL to
load and what window title to show.

## Why Python, not Bash?

The original attempt used a bash script with inline `python3 -c '...'` heredocs.
The regex patterns contained backslash escapes that bash mangled, causing
syntax errors. Moving all logic to a standalone `.py` file eliminated every
escaping issue and made the code testable with `python3 -m py_compile`.

See `ADR.md` ADR-005 for the full decision record.

## Why not use a config templating engine?

Tools like Jinja2 or envsubst could template these files. But:

1. They add a dependency (Jinja2) or a separate tool (envsubst may not be
   installed on all runners).
2. The files have different formats (JSON, XML, Gradle DSL, plist) — no single
   templating engine handles all of them cleanly.
3. Standard-library `json` + `re` is sufficient and has zero dependencies.

The injector deliberately stays within the Python standard library.

## Testing the injector

```bash
# From the repo root:
python3 scripts/inject-config.py https://pokejumper.org PokeJumper com.fed.pokejumper

# Verify all 6 files:
cat capacitor.config.json
grep app_name android/app/src/main/res/values/strings.xml
grep applicationId android/app/build.gradle
grep CFBundleDisplayName ios/App/App/Info.plist
grep CFBundleIdentifier ios/App/App/Info.plist
cat native-desktop/config.json   # (or wherever write_desktop_config writes)
```

Each function is **idempotent** — running the injector twice produces the same
output as running it once. This is important because CI may cache and re-run
steps.
