#!/usr/bin/env python3
"""web2apk · static demo builder

Produces build/static-demo/ — a fully self-contained, static copy of the
live demo that needs no server: the loader tag is pre-injected into the
extension pages (with RELATIVE paths, so it works under any sub-path,
e.g. GitHub Pages project sites), the rendered docs page is included, and
the shell references everything relatively.

The output can be deployed as-is to any static host:

    python3 scripts/build-static-demo.py
    → build/static-demo/            (open index.html via any static host)

Layout produced (mirrors the dynamic demo):
    index.html          shell (relative refs only, no ?p= needed — the
                        loader infers the page from the URL path)
    docs.html           rendered extension docs (guide/changelog/privacy)
    demo/               shim.js · loader.js · shell.js · demo.css
    extension/          the extension tree, loader-injected HTML

Runs scripts/render-demo-docs.py first so the docs page is always fresh.
"""

import re
import shutil
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SRC_DEMO = REPO / "demo"
SRC_EXT = REPO / "extension"
OUT = REPO / "build" / "static-demo"

# The sandbox host injects this tag into every .html it sees on disk;
# it must never ship (MV3 CSP would block it anyway, but static hosts
# have no such guard — so scrub defensively at build time).
INJECTED = re.compile(r'<script[^>]+src="[^"]*ninja-daytona-script\.js"></script>\s*', re.I)

DEMO_ASSETS = ("shim.js", "loader.js", "shell.js", "demo.css")

# Relative loader path from extension/<page>/page.html (2 levels up)
LOADER_REL = "../../demo/loader.js"


def scrub(text: str) -> str:
    return INJECTED.sub("", text)


def rewrite_relative(html: str) -> str:
    """Absolute refs → relative (sub-path-safe), for shell AND docs pages."""
    html = html.replace('href="/demo/demo.css"', 'href="demo/demo.css"')
    html = html.replace('src="/demo/shell.js"', 'src="demo/shell.js"')
    html = html.replace('href="/extension/', 'href="extension/')
    html = html.replace('src="/extension/', 'src="extension/')
    # root link → the shell page itself
    html = html.replace('href="/"', 'href="index.html"')
    # iframe srcs: strip the ?p= suffix — loader.js infers from the path
    html = re.sub(r'(src="extension/[^"]+\.html)\?p=[a-z]+"', r'\1"', html)
    return html


def inject_loader(html: str) -> str:
    tag = f'<script src="{LOADER_REL}"></script>'
    if "</head>" in html:
        return html.replace("</head>", f"{tag}</head>", 1)
    if "</body>" in html:
        return html.replace("</body>", f"{tag}</body>", 1)
    raise RuntimeError("no </head> or </body> to inject loader into")


def main() -> int:
    # 0) fresh docs page (demo/docs.html) — the shell footer links to it
    r = subprocess.run([sys.executable, str(REPO / "scripts" / "render-demo-docs.py")])
    if r.returncode != 0:
        return 1

    if OUT.exists():
        shutil.rmtree(OUT)
    (OUT / "demo").mkdir(parents=True)
    (OUT / "extension").mkdir(parents=True)

    # 1) shell — rewritten to relative refs
    shell = scrub((SRC_DEMO / "index.html").read_text(encoding="utf-8"))
    (OUT / "index.html").write_text(rewrite_relative(shell), encoding="utf-8")

    # 2) docs page — same rewrite (its refs are absolute for the live server)
    docs = SRC_DEMO / "docs.html"
    if not docs.is_file():
        print("✗ demo/docs.html missing (renderer failed?)", file=sys.stderr)
        return 1
    (OUT / "docs.html").write_text(
        rewrite_relative(scrub(docs.read_text(encoding="utf-8"))), encoding="utf-8"
    )

    # 3) demo assets verbatim (shim/loader are already path-safe)
    for name in DEMO_ASSETS:
        shutil.copy2(SRC_DEMO / name, OUT / "demo" / name)

    # 4) extension tree — HTML pre-injected with the loader, others verbatim
    injected_pages = 0
    for f in SRC_EXT.rglob("*"):
        if not f.is_file():
            continue
        dest = OUT / "extension" / f.relative_to(SRC_EXT)
        dest.parent.mkdir(parents=True, exist_ok=True)
        if f.suffix.lower() == ".html":
            text = scrub(f.read_text(encoding="utf-8"))
            dest.write_text(inject_loader(text), encoding="utf-8")
            injected_pages += 1
        else:
            shutil.copy2(f, dest)

    # 5) self-check: every src/href in every HTML file must resolve
    problems = []
    for hf in OUT.rglob("*.html"):
        text = hf.read_text(encoding="utf-8")
        base_dir = hf.parent
        for attr in ("src", "href"):
            for m in re.finditer(rf'{attr}="([^"#][^"]*)"', text):
                ref = m.group(1)
                if ref.startswith(("http://", "https://", "chrome-extension://", "data:")):
                    continue  # external/faithful mock refs are fine
                target = (base_dir / ref.split("?")[0]).resolve()
                if not target.exists():
                    problems.append(f"{hf.relative_to(OUT)} → {ref}")

    print(f"✓ static demo → {OUT.relative_to(REPO)}")
    print(f"  shell + docs page + {len(DEMO_ASSETS)} demo assets + extension tree")
    print(f"  loader pre-injected into {injected_pages} HTML page(s)")
    if problems:
        print(f"✗ {len(problems)} broken reference(s):")
        for p in problems:
            print(f"  {p}")
        return 1
    print("  all internal references resolve ✓")
    return 0


if __name__ == "__main__":
    sys.exit(main())
