#!/usr/bin/env python3
"""
Erzeugt die App-Icons der Innercraft-Meditations-App (PWA + iOS).

Motiv: goldener Gong-Kreis mit Schwingungsringen auf tiefem Waldgrün —
passend zur Erdpalette der Innercraft-Website.

Aufruf:  python3 tools/generate_icons.py
"""

import os

from PIL import Image, ImageDraw

# Farben der Innercraft-Website (styles.css)
FOREST_DEEP = (35, 44, 36)     # --forest-deep
FOREST = (47, 59, 48)          # --forest
GOLD = (201, 162, 75)          # --gold
SAND = (232, 220, 198)         # --sand
CLAY = (182, 113, 63)          # --clay

OUT_PWA = os.path.join(os.path.dirname(__file__), "..", "app", "icons")
OUT_IOS = os.path.join(
    os.path.dirname(__file__), "..", "ios", "InnercraftMeditation",
    "Assets.xcassets", "AppIcon.appiconset",
)


def draw_icon(size, rounded=False):
    s = size
    img = Image.new("RGB", (s, s), FOREST_DEEP)
    d = ImageDraw.Draw(img)

    # Sanfter radialer Verlauf nach Waldgrün
    cx, cy = s / 2, s / 2
    for r in range(int(s * 0.7), 0, -2):
        f = r / (s * 0.7)
        col = tuple(int(FOREST[i] * (1 - f) + FOREST_DEEP[i] * f) for i in range(3))
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=col)

    # Schwingungsringe (Klang)
    for i, radius in enumerate([0.42, 0.34, 0.27]):
        r = s * radius
        alpha = 1.0 - i * 0.25
        col = tuple(int(GOLD[c] * alpha + FOREST_DEEP[c] * (1 - alpha)) for c in range(3))
        d.ellipse([cx - r, cy - r, cx + r, cy + r],
                  outline=col, width=max(1, int(s * 0.012)))

    # Gong-Scheibe
    r = s * 0.20
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=GOLD)
    r2 = s * 0.135
    d.ellipse([cx - r2, cy - r2, cx + r2, cy + r2], fill=CLAY)
    r3 = s * 0.05
    d.ellipse([cx - r3, cy - r3, cx + r3, cy + r3], fill=SAND)

    if rounded:
        # Maske mit abgerundeten Ecken (für Browser-Favicon-Optik)
        mask = Image.new("L", (s, s), 0)
        md = ImageDraw.Draw(mask)
        md.rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * 0.22), fill=255)
        out = Image.new("RGBA", (s, s), (0, 0, 0, 0))
        out.paste(img, (0, 0), mask)
        return out

    return img


def main():
    os.makedirs(OUT_PWA, exist_ok=True)
    os.makedirs(OUT_IOS, exist_ok=True)
    print("Erzeuge Icons:")

    # PWA / Homescreen (iOS verlangt nicht-transparente apple-touch-icons)
    for name, size in [
        ("icon-180.png", 180),   # apple-touch-icon
        ("icon-192.png", 192),   # PWA-Manifest
        ("icon-512.png", 512),   # PWA-Manifest / Splash
    ]:
        path = os.path.join(OUT_PWA, name)
        draw_icon(size).save(path)
        print(f"  app/icons/{name}")

    # iOS-App-Icon (einzelnes 1024er, Xcode skaliert selbst)
    path = os.path.join(OUT_IOS, "AppIcon-1024.png")
    draw_icon(1024).save(path)
    print("  ios/.../AppIcon-1024.png")

    print("Fertig.")


if __name__ == "__main__":
    main()
