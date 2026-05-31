# Innercraft — Website

Website für **Innercraft**, das naturbasierte Purpose-Guiding-Angebot von
Carla &amp; Nikolai Ladanyi. Zertifiziert durch das
[Purpose Guides Institute](https://www.purposeguides.org/) (Jonathan Gustin).

Die Inhalte basieren auf der Arbeitsversion v2 des Website-Texts und sind an
einigen Stellen behutsam erweitert (Hero, Fragen-Band, Purpose-Guiding-Sektion
nach Gustin, Kontaktformular).

## Design

Stil im Sinne von **„The Tree of Life“ / „Nostalgia“** — warm, erdig, organisch
und unaufgeregt:

- Erdpalette: Tiefes Waldgrün, Sand, Creme, Terrakotta, gealtertes Gold
- Serifen-Display (Cormorant / EB Garamond) für eine ruhige, zeitlose Anmutung
- Dezente Filmkorn-Textur, „Tree of Life“-Motiv als SVG, sanfte Scroll-Reveals
- Baum-Silhouette und geschichtete Hügel im Hero

## Struktur

```
index.html   — alle Inhalte als One-Pager
styles.css   — komplettes Design / Theme
script.js    — Navigation, Scroll-Reveals, Kontaktformular-Stub
```

## Lokal ansehen

Einfach `index.html` im Browser öffnen, oder ein kleiner Server:

```bash
python3 -m http.server 8000
# http://localhost:8000
```

Die Seite ist vollständig statisch und kommt ohne Build-Schritt aus. Schriften
werden von Google Fonts geladen; offline greift ein Serifen-Fallback.

## Offene Klärungen (aus dem Quelltext)

- Preise für Gruppen- und Intensivprogramm
- Gruppengröße der Gruppenangebote
- Konkrete Startdaten
- Kontakt- und Anmeldeinformationen (Formular sendet aktuell noch nicht real)
