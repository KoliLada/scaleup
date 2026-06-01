#!/usr/bin/env python3
"""
Erzeugt die App-Icons der Innercraft-Meditations-App (PWA + iOS).

Motiv: das Innercraft-Logo — der goldene Baum des Lebens auf tiefem
Waldgrün, identisch mit dem Logo der Website (SVG-Sprite in index.html).

Aufruf:  python3 tools/generate_icons.py
Benötigt:  pip install cairosvg
"""

import os

import cairosvg

# Farben der Innercraft-Website (styles.css)
FOREST_DEEP = "#232c24"   # --forest-deep
FOREST = "#2f3b30"        # --forest
GOLD = "#c9a24b"          # --gold

OUT_PWA = os.path.join(os.path.dirname(__file__), "..", "app", "icons")
OUT_IOS = os.path.join(
    os.path.dirname(__file__), "..", "ios", "InnercraftMeditation",
    "Assets.xcassets", "AppIcon.appiconset",
)

# Baum des Lebens — identische Pfade wie im SVG-Sprite der Website (index.html)
TREE_PATHS = """
  <path d="M24 44 L24 26" />
  <path d="M24 44 C20 44 18 46 14 46 M24 44 C28 44 30 46 34 46 M24 44 C23 45 22 47 20 47 M24 44 C25 45 26 47 28 47" />
  <path d="M24 30 C20 28 17 25 15 21 M24 30 C28 28 31 25 33 21 M24 26 C22 23 20 21 19 17 M24 26 C26 23 28 21 29 17 M24 24 L24 13" />
  <circle cx="24" cy="13" r="11" />
  <path d="M24 24 C19 22 16 18 16 13 M24 24 C29 22 32 18 32 13 M24 13 C21 11 19 8 19 5 M24 13 C27 11 29 8 29 5" />
"""


def icon_svg() -> str:
    """Quadratisches Icon: Waldgrün-Verlauf + goldener Baum des Lebens."""
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <defs>
    <radialGradient id="bg" cx="50%" cy="42%" r="78%">
      <stop offset="0%" stop-color="{FOREST}" />
      <stop offset="100%" stop-color="{FOREST_DEEP}" />
    </radialGradient>
  </defs>
  <rect width="48" height="48" fill="url(#bg)" />
  <g transform="translate(24 24) scale(0.68) translate(-24 -26)"
     fill="none" stroke="{GOLD}" stroke-width="1.7"
     stroke-linecap="round" stroke-linejoin="round">
    {TREE_PATHS}
  </g>
</svg>"""


def render(path: str, size: int) -> None:
    cairosvg.svg2png(
        bytestring=icon_svg().encode(),
        write_to=path,
        output_width=size,
        output_height=size,
    )


def main():
    os.makedirs(OUT_PWA, exist_ok=True)
    os.makedirs(OUT_IOS, exist_ok=True)
    print("Erzeuge Icons (Innercraft-Logo):")

    # PWA / Homescreen (iOS verlangt nicht-transparente apple-touch-icons)
    for name, size in [
        ("icon-180.png", 180),   # apple-touch-icon
        ("icon-192.png", 192),   # PWA-Manifest
        ("icon-512.png", 512),   # PWA-Manifest / Splash
    ]:
        render(os.path.join(OUT_PWA, name), size)
        print(f"  app/icons/{name}")

    # iOS-App-Icon (einzelnes 1024er, Xcode skaliert selbst)
    render(os.path.join(OUT_IOS, "AppIcon-1024.png"), 1024)
    print("  ios/.../AppIcon-1024.png")

    print("Fertig.")


if __name__ == "__main__":
    main()
