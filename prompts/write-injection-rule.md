# Prompt: Write a new injection rule for inject-config.py

## Context

`scripts/inject-config.py` is the single Python file that rewrites all native
config files from three inputs: `url`, `app_name`, `app_id`. It currently has
these functions:

- `update_json(path, key, value)` — generic JSON key setter
- `update_strings_xml(path, app_name)` — Android strings.xml
- `update_build_gradle(path, app_id)` — Android applicationId
- `update_info_plist(path, app_name, app_id)` — iOS Info.plist
- `write_desktop_config(path, url, app_name)` — writes config.json for PySide6

Each function reads, modifies, and writes its file in place. The file uses
only the Python standard library (json, re, pathlib, sys).

## Task

Add a new injection rule for this config file:

**File path in repo:** `[RELATIVE_PATH]`
**File format:** `[JSON | XML | plist | text | other]`
**What needs to change:** `[DESCRIBE — e.g. "set the <widget> id attribute to the app_id"]`

## Requirements

1. Write a new function `update_[NAME](path, ...)` that follows the same
   read-modify-write pattern.
2. The function must be idempotent — running it twice produces the same result
   as running it once.
3. Use only the standard library.
4. Add a docstring explaining what it does.
5. Add the call to `main()` in the correct position (after the existing calls).
6. Handle the case where the file does not exist yet — print a clear warning
   and continue (do not crash the whole injector).

## Output

```python
# The new function
```

```python
# The line(s) to add to main()
```

Then describe how to test it:

```
python3 scripts/inject-config.py https://test.example.com TestApp com.fed.testapp
# Then verify: [WHAT TO CHECK]
```
