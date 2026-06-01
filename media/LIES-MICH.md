# Video- & Bild-Material für die Website

In diesen Ordner kommt das Material aus dem Video-Shooting.
Sobald die Dateien hier liegen, bindet sie der Entwickler (oder Claude) ein —
sie ersetzen dann die animierten Wasserwelt-Platzhalter.

## Benötigte Dateien

| Datei | Verwendung | Format |
|---|---|---|
| `hero.mp4` | Vollbild-Video im Hero der Startseite | 16:9, H.264, max. 8 MB, 15–30 Sek., loopfähig |
| `hero-mobil.mp4` | Hero auf dem Handy | 9:16 (hochkant), sonst wie oben |
| `qualle.mp4` | Hintergrund der „Die Qualle"-Sektion | 16:9, ruhig, dunkel |
| `meditation.mp4` | Hintergrund der Meditations-Sektion | 16:9 |
| `team-carla.jpg` | Portrait Carla | 800×800, natürliches Licht |
| `team-nikolai.jpg` | Portrait Nikolai | 800×800, natürliches Licht |

## Shot-List fürs Shooting (Empfehlung)

### Priorität 1: Hero-Loop
- Wasser von unten: Lichtstrahlen, die durchs Wasser brechen — Kamera zur Oberfläche
- Falls möglich: echte Quallen (Aquarium) oder Tinte/heller Stoff in Wasser (Zeitlupe)
- Loopfähig (Anfang = Ende), 16:9 UND 9:16

### Priorität 2: Natur & Präsenz
- Carla & Nikolai von hinten/als Silhouetten in der Natur — gehend, sitzend, meditierend
- Wald im Nebel, Wasseroberflächen, Alpenpanorama — lange, ruhige Einstellungen (15+ Sek.)
- Details: Hände & Erde, Atem im Morgenlicht, Menschen im Kreis (Council)

### Priorität 3: Meditation
- Person meditierend bei Sonnenaufgang am Wasser
- Klangschale/Gong, angeschlagen, in Zeitlupe

### Technik
- 4K, 25fps + Zeitlupen (50/100fps) für Wasser & Details
- LOG/flaches Farbprofil — Grading in die Tiefwasser-Palette (#081623 → #1d4459, Akzent #8fe0d8)
- Goldene Stunde, Stativ/Gimbal, keine schnellen Schwenks

## Komprimierung vor dem Hochladen

Videos fürs Web komprimieren (sonst lädt die Seite zu langsam):

```bash
ffmpeg -i original.mov -vcodec h264 -an -crf 28 -vf "scale=1920:-2" -movflags +faststart hero.mp4
```

(`-an` entfernt den Ton — Hintergrund-Videos sind stumm)
