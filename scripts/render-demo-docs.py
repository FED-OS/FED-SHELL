#!/usr/bin/env python3
"""web2apk · render demo docs page

Builds demo/docs.html — the "Extension docs" target for the demo shell footer.
Renders EXTENSIONS.md, CHANGELOG.md and PRIVACY.md (the three markdown docs a
store reviewer or curious user actually needs from the demo) into a single,
self-contained, demo-styled page: one <style> block, zero external requests,
relative links between the sections, and a back-link to the demo shell.

    python3 scripts/render-demo-docs.py
    → demo/docs.html

The page is written to demo/ so the live server serves it at /docs.html, and
the static-demo builder copies it into the static output (docs.html next to
index.html) so the footer link works identically in both demos.
"""

import html
import re
import sys
from pathlib import Path

try:
    import markdown as _md  # type: ignore
    HAS_MD = True
except ImportError:  # CI or minimal hosts — degrade, don't crash
    HAS_MD = False

REPO = Path(__file__).resolve().parent.parent
OUT = REPO / "demo" / "docs.html"

DOCS = (
    ("EXTENSIONS.md", "Extension guide", "ext"),
    ("CHANGELOG.md", "Changelog", "changelog"),
    ("PRIVACY.md", "Privacy policy", "privacy"),
    ("INTEGRATION.md", "Merge & versioning guide", "integration"),
    ("LICENSE", "License (MIT)", "license"),
)

CSS = """
/* docs page — matches the demo shell's dark aesthetic, fully self-contained */
:root { color-scheme: dark;
  --bg: #0b1220; --bg2: #101a2e; --panel: #14203a; --line: #22304f;
  --ink: #e8eefc; --muted: #9db0d4; --accent: #4f8cff; --accent2: #9d7bff;
  --good: #37d67a; --warn: #ffb648; --bad: #ff6b6b; }
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; background: var(--bg); color: var(--ink);
  font: 15px/1.65 system-ui, "Segoe UI", Roboto, "Helvetica Neue", sans-serif; }
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
.top { position: sticky; top: 0; z-index: 5; display: flex; gap: 12px;
  align-items: center; flex-wrap: wrap; padding: 10px 22px;
  background: rgba(11, 18, 32, 0.92); border-bottom: 1px solid var(--line);
  backdrop-filter: blur(6px); }
.top img { width: 26px; height: 26px; border-radius: 6px; }
.top .crumb { font-weight: 700; letter-spacing: 0.02em; }
.top .crumb span { color: var(--muted); font-weight: 400; }
.top nav { margin-left: auto; display: flex; gap: 6px; flex-wrap: wrap; }
.top nav a { padding: 5px 10px; border-radius: 8px; font-size: 13px;
  color: var(--muted); border: 1px solid transparent; }
.top nav a:hover { color: var(--ink); text-decoration: none;
  border-color: var(--line); background: var(--bg2); }
.wrap { max-width: 880px; margin: 0 auto; padding: 26px 22px 90px; }
section.doc { border: 1px solid var(--line); border-radius: 14px;
  background: var(--panel); padding: 26px 30px; margin: 22px 0; }
section.doc > h2 { margin: 0 0 4px; font-size: 21px; }
section.doc > .sub { color: var(--muted); font-size: 13px; margin: 0 0 18px; }
h3 { margin: 26px 0 8px; font-size: 16.5px; color: #dbe5ff; }
h4 { margin: 20px 0 6px; font-size: 14.5px; color: #cfdcfb; }
p { margin: 10px 0; }
hr { border: 0; border-top: 1px solid var(--line); margin: 24px 0; }
code { background: #0a1526; border: 1px solid var(--line); padding: 1.5px 6px;
  border-radius: 6px; font-size: 12.5px; font-family: ui-monospace, "Cascadia Code",
  Menlo, Consolas, monospace; color: #a8c7ff; }
pre { background: #0a1526; border: 1px solid var(--line); border-radius: 10px;
  padding: 14px 16px; overflow-x: auto; }
pre code { background: none; border: 0; padding: 0; font-size: 12.5px;
  color: #c4d7ff; line-height: 1.55; }
table { border-collapse: collapse; width: 100%; margin: 12px 0 16px;
  font-size: 13.5px; }
th, td { border: 1px solid var(--line); padding: 7px 10px; text-align: left;
  vertical-align: top; }
th { background: #182642; color: #dbe5ff; }
td code { white-space: nowrap; }
blockquote { margin: 12px 0; padding: 10px 14px; border-left: 3px solid var(--accent);
  background: var(--bg2); border-radius: 0 8px 8px 0; color: #c6d4f3; }
ul, ol { padding-left: 24px; }
li { margin: 4px 0; }
li::marker { color: var(--accent); }
.foot { max-width: 880px; margin: 0 auto; padding: 0 22px 46px;
  color: var(--muted); font-size: 13px; }
.foot a { color: var(--accent2); }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
"""


def anchor(text: str) -> str:
    """github-ish slug for a heading."""
    s = re.sub(r"[^\w\s-]", "", text).strip().lower()
    return re.sub(r"\s+", "-", s)


def render_markdown(src: str) -> tuple[str, str]:
    """→ (title, body_html) for one markdown doc, links kept relative."""
    title = ""
    lines: list[str] = []
    for line in src.splitlines():
        if not title and line.startswith("# "):
            title = line[2:].strip()
            continue  # drop the doc's own H1 — the section header is the H1
        lines.append(line)
    body = "\n".join(lines)
    if HAS_MD:
        html_body = _md.markdown(body, extensions=["tables", "fenced_code"])
    else:  # minimal fallback: escape + paragraphs, tables become <pre>
        html_body = "<p>" + html.escape(body).replace(
            "\n\n", "</p><p>"
        ).replace("\n", "<br/>") + "</p>"
    # cross-doc links (e.g. [INTEGRATION.md](INTEGRATION.md)) become
    # in-page anchors — docs.html renders all five docs as sections
    for fname, _label, ident in DOCS:
        html_body = re.sub(
            rf'href="(?:\.\./)?{re.escape(fname)}(?:#[^"]*)?"',
            f'href="#{ident}"',
            html_body,
        )
    return title, html_body


def main() -> int:
    parts: list[str] = []
    for fname, label, ident in DOCS:
        path = REPO / fname
        if not path.is_file():
            print(f"✗ missing {fname}", file=sys.stderr)
            return 1
        title, body = render_markdown(path.read_text(encoding="utf-8"))
        parts.append(
            f'<section class="doc" id="{ident}" aria-label="{html.escape(label)}">'
            f'<h2>{html.escape(label)}</h2>'
            f'<p class="sub">from <code>{fname}</code></p>'
            f"{body}"
            "</section>"
        )

    page = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="dark" />
<title>web2apk extension — docs</title>
<link rel="icon" type="image/png" href="/extension/icons/icon-48.png" />
<style>{CSS}</style>
</head>
<body>
<header class="top">
  <img src="/extension/icons/icon-48.png" alt="web2apk logo" />
  <span class="crumb">web2apk <span>· extension docs</span></span>
  <nav aria-label="docs sections">
    <a href="#ext">Guide</a>
    <a href="#changelog">Changelog</a>
    <a href="#privacy">Privacy</a>
    <a href="#integration">Merge</a>
    <a href="#license">License</a>
    <a href="/" id="back">← back to demo</a>
  </nav>
</header>
<div class="wrap">
{chr(10).join(parts)}
</div>
<footer class="foot">
  <p>web2apk — Web App Launcher · v2.1.1 · Chrome &amp; Edge (Manifest V3) ·
  rendered from the repository's markdown docs at build time ·
  <a href="/">back to the live demo</a></p>
</footer>
</body>
</html>
"""
    OUT.write_text(page, encoding="utf-8")
    n_sections = len(parts)
    print(f"✓ docs page → {OUT.relative_to(REPO)}  ({n_sections} sections,"
          f" markdown module: {HAS_MD and 'yes' or 'fallback'})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
