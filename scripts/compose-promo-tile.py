#!/usr/bin/env python3
"""web2apk · store promo tile composer

Builds the 440x280 promo tile required by the Chrome Web Store (and
accepted by Edge Add-ons) from the brand assets: navy gradient wash,
app-window mockup with address bar + "OK" status dot, the rocket+wifi
brand mark (drawn with the exact same code as the toolbar icons), and
browser chips.

Usage:  python3 scripts/compose-promo-tile.py
Output: docs/promo-tile-440x280.png
"""

import importlib.util
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

REPO = Path(__file__).resolve().parent.parent


def _load_icon_lib():
    """Import the icon generator (hyphenated filename, not importable by name)."""
    path = REPO / "scripts" / "generate-extension-icons.py"
    spec = importlib.util.spec_from_file_location("generate_extension_icons", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)  # main() is guarded by __name__, safe to load
    return mod


_icon_lib = _load_icon_lib()
BLUE, NAVY, PURPLE, WHITE = _icon_lib.BLUE, _icon_lib.NAVY, _icon_lib.PURPLE, _icon_lib.WHITE
draw_mark, gradient_rounded_square, lerp = (
    _icon_lib.draw_mark,
    _icon_lib.gradient_rounded_square,
    _icon_lib.lerp,
)

DOCS = REPO / "docs"
W, H = 440, 280


def rgba(color):
    """Normalize any color constant to an RGBA 4-tuple for PIL."""
    return color if len(color) == 4 else color + (255,)


INK = (232, 238, 252)
MUTED = (140, 152, 180)
GREEN = (34, 197, 94)
YELLOW = (245, 197, 66)
RED = (239, 68, 68)

FONT_DIR = Path("/usr/share/fonts/truetype")


def font(size, bold=False):
    name = "LiberationSans-Bold.ttf" if bold else "LiberationSans-Regular.ttf"
    for cand in (FONT_DIR / "liberation" / name, FONT_DIR / "dejavu" / ("DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf")):
        if cand.exists():
            return ImageFont.truetype(str(cand), size)
    raise RuntimeError("no sans font found")


def rounded(draw, box, radius, fill=None, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def main():
    DOCS.mkdir(parents=True, exist_ok=True)

    # ── background: vertical blue→purple gradient over navy, full bleed ──
    grad = Image.new("RGB", (1, 256))
    for y in range(256):
        grad.putpixel((0, y), lerp(BLUE, PURPLE, y / 255))
    grad = grad.resize((W, H), Image.BILINEAR)
    veil = Image.new("RGB", (W, H), NAVY[:3])
    tile = Image.blend(grad, veil, 0.58).convert("RGBA")
    d = ImageDraw.Draw(tile)

    # subtle dot grid (matches the dashboard aesthetic)
    for gy in range(24, H, 28):
        for gx in range(24, W, 28):
            d.ellipse((gx, gy, gx + 2, gy + 2), fill=(62, 76, 112, 255))

    # ── brand mark: same drawing code as the toolbar icons ──────────────
    icon = draw_mark(gradient_rounded_square(256))
    icon = icon.resize((74, 74), Image.LANCZOS)
    tile.alpha_composite(icon, (34, 22))

    # ── wordmark ────────────────────────────────────────────────────────
    d.text((122, 26), "web2apk", font=font(40, bold=True), fill=INK + (255,))
    d.text((124, 76), "turn any website into an app", font=font(15), fill=MUTED + (255,))

    # ── browser chips under the wordmark ────────────────────────────────
    chip_y = 100
    for i, (label, accent) in enumerate((("Chrome", BLUE), ("Edge", PURPLE))):
        x0 = 124 + i * 96
        rounded(d, (x0, chip_y, x0 + 86, chip_y + 28), 14, outline=rgba(accent), width=2)
        d.text((x0 + 12, chip_y + 6), f"✓ {label}", font=font(13, bold=True), fill=INK + (255,))

    # ── feature bullets (bottom-left, balances the window mockup) ─────
    feats = (
        "one-click app windows",
        "new-tab dashboard",
        "site status badges",
    )
    for i, feat in enumerate(feats):
        y = 168 + i * 26
        d.ellipse((34, y + 3, 41, y + 10), fill=rgba(BLUE))
        d.text((50, y), feat, font=font(13), fill=INK + (255,))

    # ── mini app-window mockup (bottom-right) ───────────────────────────
    # 230x124 window; traffic lights centered in a 26px title bar
    win = Image.new("RGBA", (230, 124), (0, 0, 0, 0))
    wd = ImageDraw.Draw(win)
    rounded(wd, (0, 0, 229, 123), 11, fill=(16, 22, 44, 255), outline=(52, 66, 104, 255), width=2)
    wd.line((1, 26, 228, 26), fill=(40, 52, 84, 255), width=2)
    for i, col in enumerate((RED, YELLOW, GREEN)):
        wd.ellipse((12 + i * 18, 8, 22 + i * 18, 18), fill=rgba(col))
    # address pill + reachable badge on one row
    rounded(wd, (12, 34, 128, 52), 9, fill=(28, 36, 64, 255))
    wd.text((20, 38), "github.com", font=font(11), fill=(150, 162, 190, 255))
    wd.ellipse((180, 40, 190, 50), fill=GREEN + (255,))
    wd.text((196, 38), "OK", font=font(10, bold=True), fill=GREEN + (255,))
    # content skeleton lines
    rounded(wd, (12, 64, 100, 76), 6, fill=(44, 56, 92, 255))
    rounded(wd, (12, 84, 150, 92), 4, fill=(38, 48, 80, 255))
    rounded(wd, (12, 100, 120, 108), 4, fill=(38, 48, 80, 255))
    win = win.filter(ImageFilter.GaussianBlur(0.3))
    tile.alpha_composite(win, (W - 230 - 24, H - 124 - 18))

    out = DOCS / "promo-tile-440x280.png"
    tile.convert("RGB").save(out, "PNG", optimize=True)
    print(f"✓ {out.relative_to(REPO)}  ({W}x{H})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
