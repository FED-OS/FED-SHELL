# Prompt: Generate app config from a project description

## Task

Given the following project description, produce the three build inputs that
FED-Shell needs to wrap it as a native app:

1. **target_url** — the HTTPS URL to load inside the WebView
2. **app_name** — a human-readable app name (max 30 chars, no special chars)
3. **app_id** — a reverse-DNS bundle identifier (e.g. `com.fed.myapp`)

## Rules

- `target_url` must start with `https://`. If the description only gives a
  domain, prepend `https://`.
- `app_name` must be safe for iOS `CFBundleDisplayName` and Android
  `app_name` string — no emojis, no leading/trailing spaces, max 30 chars.
- `app_id` must be all lowercase, reverse-DNS, valid segments (letters,
  digits, dots, hyphens only). Default TLD prefix is `com.fed.` unless the
  description specifies a different domain.
- If the description is ambiguous, pick the most reasonable value and note
  your assumption in a comment.

## Project description

```
[PASTE YOUR PROJECT DESCRIPTION HERE]
```

## Output format

```
target_url: https://...
app_name:   ...
app_id:     com.fed....
```

Then provide the exact `workflow_dispatch` form values to paste into the
GitHub Actions "Run workflow" dialog.
