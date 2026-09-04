#!/usr/bin/env python3
"""web2apk · static-demo verification

Proves the static demo (build/static-demo/) actually works when served by a
plain static host — and that it is sub-path-safe (GitHub-Pages-style): the
exact same tree also works mounted under /sub/.

Checks, for BOTH http://127.0.0.1:<port>/ and http://127.0.0.1:<port>/sub/:
  1. shell loads, three iframes present, zero console/page errors
  2. each iframe boots: the chrome-API shim is live (window.chrome object,
     chrome.storage.get answers with the seeded settings)
  3. newtab dashboard renders (clock ticking, version pill v2.1.1)
  4. cross-surface link: chrome.runtime.getURL('options/options.html')
     returns 200, and clicking Settings navigates the frame there — where
     the options page boots with the shim too
  5. popup auto-check: the toolbar badge flips visible + OK (the popup
     sends check-status on load; the shell mirrors w2a:lastStatus onto
     #ext-badge on a 1.2 s poll)
  6. docs page renders all 5 sections (guide/changelog/privacy/merge/
     license) + version footer

Usage:
    python3 scripts/serve-static-demo.py 8932 &     # serve the tree
    python3 scripts/static-demo-check.py 8932       # verify it (root + /sub/)
    python3 scripts/static-demo-check.py 8931 root  # dynamic demo server, root only
"""

import sys

from playwright.sync_api import sync_playwright

BASE_PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8932
# argv[2] (optional): "root" → check the site root only (for the dynamic
# demo server, which has no /sub/ alias). Default: root + /sub/.
ROOTS = ("",) if len(sys.argv) > 2 and sys.argv[2] == "root" else ("", "sub/")
V = "2.1.1"

failures: list[str] = []
checks = 0


def ok(cond: bool, label: str) -> bool:
    global checks
    checks += 1
    print(f"  {'✓' if cond else '✗'} {label}")
    if not cond:
        failures.append(label)
    return cond


def check_root(page, base: str, tag: str):
    print(f"\n== {tag} {base or '/'}")
    errors: list[str] = []

    def note_console(m):
        if m.type == "error":
            loc = m.location or {}
            errors.append(f"{m.text}  @{loc.get('url', '?')}:{loc.get('lineNumber', '?')}")

    page.on("console", note_console)
    page.on("pageerror", lambda e: errors.append(f"{e}  STACK: {(e.stack or '')[:400]}"))

    # 1. shell
    page.goto(base or "/", wait_until="networkidle")
    ok(page.title() == "web2apk — live demo", f"[{tag}] shell title")
    for pane in ("newtab", "popup", "options"):
        ok(page.locator(f'iframe[data-pane="{pane}"]').count() == 1, f"[{tag}] {pane} iframe present")

    # 2. shim live in every framed extension page
    nt_frame = None
    for fr in page.frames:
        if fr == page.main_frame:
            continue
        kind = fr.url.split("/extension/")[-1] if "/extension/" in fr.url else fr.url
        has = fr.evaluate("typeof window.chrome")
        ok(has == "object", f"[{tag}] shim live in {kind} (chrome={has})")
        appurl = fr.evaluate("async () => (await chrome.storage.sync.get('appUrl')).appUrl")
        ok(isinstance(appurl, str) and appurl.startswith("https://"), f"[{tag}]   storage answers (appUrl={appurl})")
        if "/newtab/" in fr.url:
            nt_frame = fr

    # 3. newtab dashboard renders
    nt = page.frame_locator('iframe[data-pane="newtab"]').first
    clock = nt.locator("#clock-time")
    ok(clock.count() == 1 and clock.first.is_visible(), f"[{tag}] newtab clock renders")
    ok(V in (nt.locator("#version").inner_text() or ""), f"[{tag}] newtab shows v{V}")

    # 4. cross-surface link: getURL resolves (sub-path correct) …
    direct = nt_frame.evaluate(
        "async () => await fetch(chrome.runtime.getURL('options/options.html'))"
        ".then(r => r.status).catch(() => 0)"
    )
    ok(direct == 200, f"[{tag}] getURL('options/options.html') → {direct}")
    # … and the real click flow works: Settings navigates the frame to the
    # options page, which boots with the shim there as well
    nt.locator("#btn-options").click()
    page.wait_for_timeout(700)
    opt_frame = next(
        (fr for fr in page.frames if fr != page.main_frame and "/options/options.html" in fr.url),
        None,
    )
    ok(opt_frame is not None, f"[{tag}] Settings click → frame at options/options.html")
    if opt_frame is not None:
        boots = opt_frame.evaluate("typeof window.chrome")
        ok(boots == "object", f"[{tag}]   options page boots with shim after navigation (chrome={boots})")

    # 5. popup auto-check → toolbar badge flips visible + OK
    #    (popup.js sends check-status on DOMContentLoaded; shell.js mirrors
    #     storage w2a:lastStatus onto #ext-badge on a 1.2 s poll)
    try:
        page.wait_for_function(
            "() => { const b = document.querySelector('#ext-badge'); return b && !b.hidden; }",
            timeout=9000,
        )
    except Exception:
        pass  # fall through — the ok() below reports the failure
    badge = page.locator("#ext-badge")
    ok(badge.is_visible(), f"[{tag}] badge visible after auto check-status")
    ok((badge.inner_text() or "").strip() == "OK", f"[{tag}] badge reads OK")

    # 6. docs page — all 5 sections + version footer
    docs = page.context.browser.new_page(base_url=f"http://127.0.0.1:{BASE_PORT}/")
    docs.on("console", note_console)
    docs.goto((base or "/") + "docs.html", wait_until="networkidle")
    for sect in ("ext", "changelog", "privacy", "integration", "license"):
        ok(docs.locator(f"section.doc#{sect}").count() == 1, f"[{tag}] docs section #{sect}")
    ok(V in (docs.locator("footer.foot").inner_text() or ""), f"[{tag}] docs footer shows v{V}")
    docs.close()

    if errors:
        print(f"  console errors ({tag}):")
        for e in errors[:6]:
            print(f"    · {e[:140]}")
    ok(not errors, f"[{tag}] zero console/page errors")


def main() -> int:
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for root in ROOTS:
            page = browser.new_page(base_url=f"http://127.0.0.1:{BASE_PORT}/")
            check_root(page, root, "SUB" if root else "ROOT")
            page.close()
        browser.close()
    print(f"\n{'✗ FAIL' if failures else '✓ PASS'} — {checks - len(failures)}/{checks} checks")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
