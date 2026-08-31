# Prompt: Write or update a README section

## Context

You are updating the README for **FED-Shell**, a universal URL-to-native-app
builder. The README uses GitHub-flavored Markdown with these conventions:

- H1 for the project title, H2 for major sections
- Tables for platform matrices and feature lists
- Fenced code blocks with language tags for commands
- HTML `<a>` tags for the Ko-fi button (username: `fedpromptly`)
- No emojis in headings
- Links to other FED-OS repos use the `https://github.com/FED-OS/` prefix

## Task

Write or update the following README section:

**Section:** `[SECTION_NAME — e.g. "Quick Start", "Platform Matrix", "FAQ"]`
**Purpose:** `[WHAT THIS SECTION SHOULD COVER]`
**Audience:** `[WHO READS THIS — e.g. "first-time users", "CI maintainers"]`

## Requirements

- Keep it under 200 words unless the section is inherently long (like the
  platform matrix).
- Use a table if the content is comparative.
- Include at least one code block if the section involves commands.
- End the section with a link to the relevant detailed doc if one exists
  (`BUILD.md`, `INSTALL.md`, `DEPLOYMENT.md`, `FAQ.md`, etc.).
- Do NOT repeat content that lives in another doc — link to it instead.

## Output

```markdown
## [Section Title]

[Content here]
```
