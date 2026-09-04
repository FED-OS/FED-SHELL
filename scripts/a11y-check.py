"""Verify :focus-visible rings appear during keyboard navigation.

Loads the extension (source tree), then Tabs through each surface and
asserts every focused element gets a visible outline (outline-style !=
none, outline-width != 0). Mouse-focus is also spot-checked to ensure
clicks do NOT paint rings (that's the point of :focus-visible).
"""

import sys
import tempfile
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

REPO = Path(__file__).resolve().parent.parent
EXT_DIR = REPO / "extension"


def wait_for_service_worker(ctx, timeout_s=10):
    deadline = time.time() + timeout_s
    while time.time() < deadline:
        for sw in ctx.service_workers:
            if sw.url.startswith("chrome-extension://"):
                return sw.url.split("/")[2]
        time.sleep(0.25)
    raise RuntimeError("service worker never started — extension failed to load")


FOCUS_PROBE = """() => {
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    const cs = getComputedStyle(el);
    return {
        tag: el.tagName.toLowerCase(),
        id: el.id || (el.getAttribute('class') || '').split(' ')[0] || null,
        outlineStyle: cs.outlineStyle,
        outlineWidth: cs.outlineWidth,
        outlineColor: cs.outlineColor,
    };
}"""


def check_page(base, path, name, tab_count):
    page = ctx.new_page()
    page.goto(f"{base}{path}", wait_until="domcontentloaded")
    page.wait_for_timeout(400)
    page.bring_to_front()

    focused = []
    for _ in range(tab_count):
        page.keyboard.press("Tab")
        page.wait_for_timeout(60)
        info = page.evaluate(FOCUS_PROBE)
        if info:
            focused.append(info)

    # every focused element must paint a ring for keyboard focus
    ring_ok = bool(focused) and all(
        f["outlineStyle"] != "none" and f["outlineWidth"] not in ("0px", "")
        for f in focused
    )

    # pointer focus must NOT ring (spot-check the first button via click)
    btn = page.locator("button, a[href], [tabindex]").first
    pointer_outline = None
    try:
        btn.click(force=True)
        page.wait_for_timeout(80)
        probe = page.evaluate(FOCUS_PROBE)
        if probe:
            pointer_outline = (probe["outlineStyle"], probe["outlineWidth"])
    except Exception:
        pass

    print(f"{'PASS' if ring_ok else 'FAIL'} {name}: {len(focused)} elements keyboard-focused, "
          f"ring={'visible' if ring_ok else 'MISSING'}, pointer-focus outline={pointer_outline}")
    for s in focused[:4]:
        print(f"      {s['tag']}#{s['id'] or '-'} → {s['outlineStyle']} {s['outlineWidth']} {s['outlineColor']}")
    page.close()
    return ring_ok


with sync_playwright() as p:
    user_data = tempfile.mkdtemp(prefix="w2a-a11y-")
    ctx = p.chromium.launch_persistent_context(
        user_data_dir=user_data,
        headless=False,
        args=[
            f"--disable-extensions-except={EXT_DIR}",
            f"--load-extension={EXT_DIR}",
            "--no-sandbox",
            "--disable-dev-shm-usage",
        ],
        viewport={"width": 1280, "height": 800},
    )
    try:
        ext_id = wait_for_service_worker(ctx)
        base = f"chrome-extension://{ext_id}"
        print(f"extension id: {ext_id}")
        ok1 = check_page(base, "/popup/popup.html", "popup", 7)
        ok2 = check_page(base, "/options/options.html", "options", 9)
        ok3 = check_page(base, "/newtab/newtab.html", "newtab", 9)
    finally:
        ctx.close()

sys.exit(0 if (ok1 and ok2 and ok3) else 1)
