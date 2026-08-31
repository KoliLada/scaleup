#!/usr/bin/env python3
"""
Erzeugt die App-Icons der Innercraft-Meditations-App (PWA + iOS).

Motiv: das Innercraft-Logo — die Qualle, leuchtend (Biolumineszenz)
auf tiefem Nachtwasser. Identisch mit dem Logo der Website.

Aufruf:  python3 tools/generate_icons.py
Benötigt:  pip install cairosvg
"""

import os

import cairosvg

# Styleguide-Palette der Innercraft-Website (styles.css)
ABYSS = "#12281e"      # --forest-deep (tiefstes Grün)
DEEP = "#1c3d30"       # --forest (Dunkelgrün)
WATER = "#2f5c47"      # --moss (mittleres Grün)
BIOLUME = "#cfe6ea"    # --biolume (Hellblau / Leuchten der Qualle)

OUT_PWA = os.path.join(os.path.dirname(__file__), "..", "app", "icons")
OUT_IOS = os.path.join(
    os.path.dirname(__file__), "..", "ios", "InnercraftMeditation",
    "Assets.xcassets", "AppIcon.appiconset",
)

# Die Qualle — identische Pfade wie im SVG-Sprite der Website (Styleguide-Logo)
JELLYFISH_BELL = ("M7 25 C7 12 14 5 24 5 C34 5 41 12 41 25 C41 27.5 39.5 28.6 37 28.9 "
                  "C35 25.5 33.5 25.5 31.5 28.9 C29.6 25.4 27.9 25.4 26 28.9 "
                  "C24.1 25.2 23.9 25.2 22 28.9 C20.1 25.4 18.4 25.4 16.5 28.9 "
                  "C14.5 25.5 13 25.5 11 28.9 C8.5 28.6 7 27.5 7 25 Z")
JELLYFISH_TENTACLES = """
  <path d="M12 29.5 C10.5 36 13 41 11.2 47 C10 51 12 55.5 10.6 60" opacity=".85" />
  <path d="M17 29.5 C16 37 18.4 43.5 16.6 50 C15.8 53.5 17.4 57.5 16.4 62" opacity=".95" />
  <path d="M22.5 29.5 C22.5 38 21.4 45.5 22.6 53 C23 57 22.2 60.5 22.6 63.5" />
  <path d="M26 29.5 C26 38 27 45.5 25.8 53 C25.4 57 26.2 60.5 25.8 63.5" />
  <path d="M31.5 29.5 C32.5 37 30.1 43.5 31.9 50 C32.7 53.5 31.1 57.5 32.1 62" opacity=".95" />
  <path d="M36.5 29.5 C38 36 35.5 41 37.3 47 C38.5 51 36.5 55.5 37.9 60" opacity=".85" />
"""


def icon_svg() -> str:
    """Quadratisches Icon: grüner Wasser-Verlauf + leuchtende Qualle (Styleguide)."""
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <radialGradient id="bg" cx="50%" cy="30%" r="85%">
      <stop offset="0%" stop-color="{WATER}" />
      <stop offset="55%" stop-color="{DEEP}" />
      <stop offset="100%" stop-color="{ABYSS}" />
    </radialGradient>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="2.0" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
  <rect width="64" height="64" fill="url(#bg)" />
  <!-- Qualle: zentriert, mit Leuchten -->
  <g transform="translate(32 33) scale(0.74) translate(-24 -34)" filter="url(#glow)">
    <path fill="{BIOLUME}" stroke="none" d="{JELLYFISH_BELL}" />
    <g fill="none" stroke="{BIOLUME}" stroke-width="1.6" stroke-linecap="round">
      {JELLYFISH_TENTACLES}
    </g>
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
    print("Erzeuge Icons (Qualle):")

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
