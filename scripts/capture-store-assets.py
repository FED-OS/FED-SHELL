#!/usr/bin/env python3
"""web2apk · store-asset capture

Launches Chromium with the extension loaded (persistent context — the
same way a store reviewer or developer loads it), configures realistic
settings, and captures store-listing screenshots:

  docs/screenshot-options-1280x800.png    options page (settings)
  docs/screenshot-newtab-dark-1280x800.png  dashboard, dark theme
  docs/screenshot-newtab-1280x800.png       dashboard, auto/light theme (refreshed)

Stores want 1280x800 PNGs; Chrome Web Store also wants a 440x280 promo
tile — that is composed separately from these captures (see
compose-promo-tile.py).

Usage:  xvfb-run -a python3 scripts/capture-store-assets.py
"""

import sys
import tempfile
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

REPO = Path(__file__).resolve().parent.parent
EXT_DIR = REPO / "extension"
DOCS = REPO / "docs"


def log(msg):
    print(f"  {msg}")


def wait_for_service_worker(ctx, timeout_s=10):
    deadline = time.time() + timeout_s
    while time.time() < deadline:
        for sw in ctx.service_workers:
            if sw.url.startswith("chrome-extension://"):
                return sw.url.split("/")[2]
        time.sleep(0.25)
    raise RuntimeError("service worker never started — extension failed to load")


def main():
    DOCS.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        user_data = tempfile.mkdtemp(prefix="w2a-assets-")
        ctx = p.chromium.launch_persistent_context(
            user_data_dir=user_data,
            headless=False,  # extensions need a display → run under xvfb-run
            args=[
                f"--disable-extensions-except={EXT_DIR}",
                f"--load-extension={EXT_DIR}",
                "--no-sandbox",
                "--disable-dev-shm-usage",
            ],
            viewport={"width": 1280, "height": 800},
        )

        print("── web2apk store-asset capture ──")
        ext_id = wait_for_service_worker(ctx)
        base = f"chrome-extension://{ext_id}"
        log(f"extension loaded · id {ext_id}")

        # ── configure realistic settings via the options page (real UI path) ──
        opts = ctx.new_page()
        opts.goto(f"{base}/options/options.html")
        opts.wait_for_selector("#tab-app", timeout=5000)

        opts.locator('[data-tab="app"]').click()
        opts.locator("#app-name").fill("GitHub")
        opts.locator("#app-url").fill("github.com")

        opts.locator('[data-tab="behavior"]').click()
        opts.locator("#badge-enabled").check()

        opts.locator('[data-tab="links"]').click()
        # add two more quick links so the grid looks alive
        for title, url in (("Wikipedia", "wikipedia.org"), ("MDN", "developer.mozilla.org")):
            opts.locator("#add-link").click()
            rows = opts.locator("#links-list .link-row")
            last = rows.nth(rows.count() - 1)
            last.locator("input").nth(0).fill(title)
            last.locator("input").nth(1).fill(url)
        time.sleep(1.2)  # debounced autosave

        # live status check so the app card shows "Site reachable"
        opts.evaluate(
            "chrome.runtime.sendMessage({cmd:'check-status'})"
            ".then(() => chrome.storage.local.get('w2a:lastStatus'))"
        )
        time.sleep(1.0)

        # ── 1) options screenshot (App tab, 1280x800) ──
        opts.locator('[data-tab="app"]').click()
        time.sleep(0.4)
        opts.set_viewport_size({"width": 1280, "height": 800})
        time.sleep(0.3)
        shot = DOCS / "screenshot-options-1280x800.png"
        opts.screenshot(path=str(shot))
        log(f"✓ {shot.relative_to(REPO)}")

        # ── 2) dark-theme dashboard ──
        opts.locator('[data-tab="behavior"]').click()
        opts.locator("#theme").select_option("dark")
        time.sleep(1.0)  # autosave

        nt = ctx.new_page()
        nt.set_viewport_size({"width": 1280, "height": 800})
        nt.goto(f"{base}/newtab/newtab.html")
        nt.wait_for_selector("#clock-time", timeout=5000)
        time.sleep(1.2)
        shot = DOCS / "screenshot-newtab-dark-1280x800.png"
        nt.screenshot(path=str(shot))
        log(f"✓ {shot.relative_to(REPO)}")

        # ── 3) light/auto dashboard (refresh with auto theme) ──
        opts.locator("#theme").select_option("auto")
        time.sleep(1.0)
        nt2 = ctx.new_page()
        nt2.set_viewport_size({"width": 1280, "height": 800})
        nt2.goto(f"{base}/newtab/newtab.html")
        nt2.wait_for_selector("#clock-time", timeout=5000)
        time.sleep(1.2)
        shot = DOCS / "screenshot-newtab-1280x800.png"
        nt2.screenshot(path=str(shot))
        log(f"✓ {shot.relative_to(REPO)}")

        ctx.close()

    print("\n✓ store assets captured → docs/")
    return 0


if __name__ == "__main__":
    sys.exit(main())
