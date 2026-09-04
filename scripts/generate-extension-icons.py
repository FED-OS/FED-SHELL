#!/usr/bin/env python3
"""Generate Chrome/Edge extension icons (16/32/48/128) with the web2apk brand mark.

Self-contained: renders the brand rocket + wifi-waves mark on a rounded-square
gradient background using Pillow — matching the mobile apps' visual identity
(blue #4f8cff → purple #9b5cff on dark navy #0b1020). No source PNG needed.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "extension" / "icons"

SIZES = [16, 32, 48, 128]

# Brand palette (matches www/styles.css tokens)
NAVY = (11, 16, 32, 255)  # #0b1020
BLUE = (79, 140, 255, 255)  # #4f8cff
PURPLE = (155, 92, 255, 255)  # #9b5cff
WHITE = (255, 255, 255, 255)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(len(a)))


def gradient_rounded_square(size: int, radius_frac: float = 0.225) -> Image.Image:
    """Diagonal blue→purple gradient on dark navy, rounded corners, supersampled."""
    scale = 4  # supersample for smooth edges
    s = size * scale
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    dr = ImageDraw.Draw(img)

    # Vertical-ish diagonal gradient (navy base, blue→purple wash)
    for y in range(s):
        t = y / (s - 1)
        row_color = lerp(BLUE, PURPLE, t)
        overlay = Image.new("RGBA", (s, 1), row_color)
        img.paste(overlay, (0, y), overlay)

    # Darken toward edges: composite a translucent navy vignette
    vignette = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    vd = ImageDraw.Draw(vignette)
    vd.ellipse((-s * 0.25, -s * 0.25, s * 1.25, s * 1.25), fill=NAVY[:3] + (110,))
    img = Image.alpha_composite(img.crop((0, 0, s, s)), vignette)
    del dr

    # Rounded-corner mask
    mask = Image.new("L", (s, s), 0)
    md = ImageDraw.Draw(mask)
    radius = int(s * radius_frac)
    md.rounded_rectangle((0, 0, s - 1, s - 1), radius=radius, fill=255)
    out = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out.resize((size, size), Image.LANCZOS)


def draw_mark(base: Image.Image) -> Image.Image:
    """Draw the white rocket + wifi arcs on the gradient base."""
    size = base.width
    scale = 4
    s = size * scale
    img = base.resize((s, s), Image.LANCZOS).copy()
    dr = ImageDraw.Draw(img)

    cx = s * 0.5
    # — Wi-Fi arcs (upper-left of the rocket) —
    # Two arcs opening up-left from the rocket base area
    arc_center = (cx + s * 0.16, s * 0.60)
    widths = [int(s * r) for r in (0.62, 0.44)]
    stroke = max(2, int(s * 0.055))
    for i, w in enumerate(widths):
        x0 = arc_center[0] - w
        y0 = arc_center[1] - w
        x1 = arc_center[0] + w
        y1 = arc_center[1] + w
        start = 180 + 15
        end = 270 + 15
        col = lerp(WHITE, BLUE, 0.0 if i == 0 else 0.15)
        dr.arc((x0, y0, x1, y1), start=start, end=end, fill=col, width=stroke)

    # — Rocket body (45° tilted) —
    # Draw in a rotated coordinate frame: create rocket on transparent layer, rotate, paste
    layer = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    body_len = s * 0.52
    body_w = s * 0.20
    nose = (cx - body_len / 2, s * 0.5)  # tip pointing up-left
    # Body: rounded capsule from nose to tail
    # (radius kept just under half-height — PIL's rounded_rectangle needs
    # height > 2*(radius+1) or it raises)
    tail = (nose[0] + body_len, nose[1])
    body_box = (
        nose[0] + body_w * 0.55,
        nose[1] - body_w * 0.5,
        tail[0] - body_w * 0.45,
        tail[1] + body_w * 0.5,
    )
    body_h = body_box[3] - body_box[1]
    radius = max(1, int(min(body_w * 0.5, (body_h - 2) / 2)))
    ld.rounded_rectangle(body_box, radius=radius, fill=WHITE)
    # Nose cone (triangle)
    ld.polygon(
        [
            (nose[0], nose[1]),
            (nose[0] + body_w * 0.55, nose[1] - body_w * 0.52),
            (nose[0] + body_w * 0.55, nose[1] + body_w * 0.52),
        ],
        fill=WHITE,
    )
    # Fins
    fin = body_w * 0.85
    ld.polygon(
        [
            (tail[0] - body_w * 0.45, tail[1] - body_w * 0.45),
            (tail[0] - body_w * 0.1, tail[1] - body_w * 0.5 - fin * 0.9),
            (tail[0] - body_w * 0.1, tail[1] - body_w * 0.45),
        ],
        fill=lerp(WHITE, PURPLE, 0.25),
    )
    ld.polygon(
        [
            (tail[0] - body_w * 0.45, tail[1] + body_w * 0.45),
            (tail[0] - body_w * 0.1, tail[1] + body_w * 0.5 + fin * 0.9),
            (tail[0] - body_w * 0.1, tail[1] + body_w * 0.45),
        ],
        fill=lerp(WHITE, PURPLE, 0.25),
    )
    # Window
    ld.ellipse(
        (
            cx - body_w * 0.10,
            s * 0.5 - body_w * 0.16,
            cx + body_w * 0.30,
            s * 0.5 + body_w * 0.16,
        ),
        fill=lerp(BLUE, PURPLE, 0.5),
    )
    # Flame
    ld.polygon(
        [
            (tail[0] - body_w * 0.35, tail[1] - body_w * 0.18),
            (tail[0] - body_w * 0.35, tail[1] + body_w * 0.18),
            (tail[0] + body_w * 0.75, tail[1]),
        ],
        fill=lerp(BLUE, WHITE, 0.35),
    )

    # Rotate rocket layer 45° (tip points up-right after rotation)
    layer = layer.rotate(-45, resample=Image.BICUBIC, center=(cx, s * 0.5))
    img = Image.alpha_composite(img, layer)

    return img.resize((size, size), Image.LANCZOS)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for size in SIZES:
        base = gradient_rounded_square(size)
        icon = draw_mark(base)
        dest = OUT / f"icon-{size}.png"
        icon.save(dest, "PNG", optimize=True)
        print(f"wrote {dest.relative_to(ROOT)} ({size}x{size}, {dest.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
