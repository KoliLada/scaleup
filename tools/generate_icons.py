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

# Tiefwasser-Palette der Innercraft-Website (styles.css)
ABYSS = "#081623"      # --forest-deep (Nachtwasser)
DEEP = "#0d2433"       # --forest (tiefes Wasser)
WATER = "#1d4459"      # --moss (mittleres Wasser)
BIOLUME = "#8fe0d8"    # --biolume (Leuchten der Qualle)

OUT_PWA = os.path.join(os.path.dirname(__file__), "..", "app", "icons")
OUT_IOS = os.path.join(
    os.path.dirname(__file__), "..", "ios", "InnercraftMeditation",
    "Assets.xcassets", "AppIcon.appiconset",
)

# Die Qualle — identische Pfade wie im SVG-Sprite der Website
JELLYFISH_PATHS = """
  <path d="M9 24 C9 11.5 15.5 5 24 5 C32.5 5 39 11.5 39 24 C34 27.5 29 28.5 24 28.5 C19 28.5 14 27.5 9 24 Z" />
  <path d="M13.5 22.5 C13.5 13 18 8.5 24 8.5 C30 8.5 34.5 13 34.5 22.5" opacity=".45" />
  <path d="M20 28.5 C19.5 34 21.5 38 20.5 43 C20 46 21 49 20.5 52" opacity=".55" />
  <path d="M28 28.5 C28.5 34 26.5 38 27.5 43 C28 46 27 49 27.5 52" opacity=".55" />
  <path d="M12.5 26.5 C11.5 33 14 39 12 45.5 C10.8 49.5 13 54 11.5 59" opacity=".75" />
  <path d="M17.5 28 C16.5 35.5 19 42.5 17 49.5 C16.2 52.8 18 56.5 17 61" opacity=".9" />
  <path d="M24 28.5 C24 36.5 23 44 24 51 C24.4 54.5 23.6 58.5 24 62.5" />
  <path d="M30.5 28 C31.5 35.5 29 42.5 31 49.5 C31.8 52.8 30 56.5 31 61" opacity=".9" />
  <path d="M35.5 26.5 C36.5 33 34 39 36 45.5 C37.2 49.5 35 54 36.5 59" opacity=".75" />
  <circle cx="24" cy="15" r="1.4" fill="{biolume}" stroke="none" opacity=".95" />
  <circle cx="18.5" cy="17.5" r=".9" fill="{biolume}" stroke="none" opacity=".55" />
  <circle cx="29.5" cy="17.5" r=".9" fill="{biolume}" stroke="none" opacity=".55" />
"""


def icon_svg() -> str:
    """Quadratisches Icon: Nachtwasser-Verlauf + leuchtende Qualle."""
    paths = JELLYFISH_PATHS.format(biolume=BIOLUME)
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <radialGradient id="bg" cx="50%" cy="30%" r="85%">
      <stop offset="0%" stop-color="{WATER}" />
      <stop offset="55%" stop-color="{DEEP}" />
      <stop offset="100%" stop-color="{ABYSS}" />
    </radialGradient>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="2.2" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
  <rect width="64" height="64" fill="url(#bg)" />
  <!-- Qualle: zentriert, mit Leuchten -->
  <g transform="translate(32 30) scale(0.78) translate(-24 -32)"
     fill="none" stroke="{BIOLUME}" stroke-width="1.7"
     stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)">
    {paths}
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
