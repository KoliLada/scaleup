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

## Sprachen

Die Website und die Meditations-App gibt es in **drei Sprachen**:

| Sprache | Website | Meditations-App |
|---|---|---|
| 🇩🇪 Deutsch | `/` (index.html) | `/app/` (Standard) |
| 🇬🇧 Englisch | `/en/` | `/app/?lang=en` |
| 🇫🇷 Französisch | `/fr/` | `/app/?lang=fr` |

Beim ersten Besuch wird die Browser-Sprache erkannt; der Sprachumschalter
(DE · EN · FR) sitzt oben rechts im Menü. Jede Sprache hat ihre **eigene
Meditations-Journey** mit eigenen Aufnahmen (verwaltet im Autoren-Modus).

## Meditations-App

Die tägliche Innercraft-Meditation gibt es in zwei Varianten — beide mit
demselben Ablauf und Design:

| | Web-App (`app/`) | iOS-App (`ios/`) |
|---|---|---|
| Nutzung | sofort im Safari, als Icon zum Homescreen hinzufügbar | Mac mit Xcode nötig |
| Bildschirm | muss während der Meditation an bleiben | läuft auch bei gesperrtem Bildschirm |

**Konzept:** Der **Autor** legt die Journey **zentral** fest (`journey.json` +
eigene Sprachaufnahmen) — alle Nutzer erleben denselben Ablauf in einem
ungestörten Durchlauf:

> Geführte Eingangs-Meditation (Willigis Jäger) → Iterationen
> (Anweisung · Stille · Gong) → tieferer Gong → Outro → ganz tiefer Gong

**Autoren-Modus** (`app/autor.html`): Hier nimmt der Autor seine Anweisungen
auf, legt Anzahl und Dauer der Iterationen fest und veröffentlicht die Journey
mit einem Klick für alle Nutzer (Details in `app/audio/LIES-MICH.md`).

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
