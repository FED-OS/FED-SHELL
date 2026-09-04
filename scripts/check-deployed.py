#!/usr/bin/env python3
"""One-off: verify the deployed static demo at its live URL."""
import re
import sys
from playwright.sync_api import sync_playwright

BASE = sys.argv[1]          # should end with index.html (dir URLs may 403)
DOCS = re.sub(r"index\.html$", "", BASE) + "docs.html"
V = "2.1.1"
fail = []


def ok(c, label):
    print(f"  {'✓' if c else '✗'} {label}")
    if not c:
        fail.append(label)


with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)

    pg.goto(BASE, wait_until="networkidle")
    ok(pg.title() == "web2apk — live demo", "shell title")
    for pane in ("newtab", "popup", "options"):
        ok(pg.locator(f'iframe[data-pane="{pane}"]').count() == 1, f"{pane} iframe")
    for fr in pg.frames:
        if fr == pg.main_frame:
            continue
        ok(fr.evaluate("typeof window.chrome") == "object", f"shim live ({fr.url.split('/')[-1]})")
    nt = pg.frame_locator('iframe[data-pane="newtab"]').first
    ok(V in (nt.locator("#version").inner_text() or ""), "newtab v2.1.1")
    st = next(fr for fr in pg.frames if "/newtab/" in fr.url).evaluate(
        "async () => await fetch(chrome.runtime.getURL('options/options.html')).then(r => r.status).catch(() => 0)")
    ok(st == 200, f"getURL options → {st}")
    try:
        pg.wait_for_function("() => { const b = document.querySelector('#ext-badge'); return b && !b.hidden; }", timeout=12000)
    except Exception:
        pass
    ok(pg.locator("#ext-badge").is_visible(), "badge visible")
    ok((pg.locator("#ext-badge").inner_text() or "").strip() == "OK", "badge OK")

    d = b.new_page()
    d.goto(DOCS, wait_until="networkidle")
    d.on("pageerror", lambda e: errs.append(str(e)))
    for sect in ("ext", "changelog", "privacy", "integration", "license"):
        ok(d.locator(f"section.doc#{sect}").count() == 1, f"docs #{sect}")
    b.close()

ok(not errs, "zero console/page errors" + (f" ({errs[:2]})" if errs else ""))
print(("\n✗ FAIL — " + "; ".join(fail)) if fail else "\n✓ PASS — deployed demo verified")
sys.exit(1 if fail else 0)
