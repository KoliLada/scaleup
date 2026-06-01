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

app/         — Innercraft Meditation als Web-App (PWA, sofort am iPhone nutzbar)
ios/         — Innercraft Meditation als native iOS-App (SwiftUI / Xcode)
tools/       — Skripte zur Erzeugung der Gong-Klänge und App-Icons
```

## Meditations-App

Die tägliche Innercraft-Meditation gibt es in zwei Varianten — beide mit
demselben Ablauf und Design:

| | Web-App (`app/`) | iOS-App (`ios/`) |
|---|---|---|
| Nutzung | sofort im Safari, als Icon zum Homescreen hinzufügbar | Mac mit Xcode nötig |
| Bildschirm | muss während der Meditation an bleiben | läuft auch bei gesperrtem Bildschirm |
| Aufnahmen | im Browser gespeichert | auf dem Gerät gespeichert |

**Ablauf:** Geführte Eingangs-Meditation (Willigis Jäger) → 3–5 Iterationen
(eigene Anweisung · Stille · Gong) → tieferer Gong → eigener Outro-Satz →
ganz tiefer Gong.

Die geführte Eingangs-Meditation wird **zentral** unter
`app/audio/intro-meditation.m4a` hinterlegt und ist damit für alle Nutzer
identisch (siehe `app/audio/LIES-MICH.md`).

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
