# Audio-Dateien der Meditations-App

## Eingangs-Meditation (Willigis Jäger)

Die geführte Eingangs-Meditation wird **zentral** in diesem Ordner hinterlegt und
ist damit für **alle Nutzer** der App verfügbar:

```
app/audio/intro-meditation.m4a   (aktuell hinterlegt: 12,9 Min., AAC)
```

**So tauschst du sie aus:**

1. Die neue Audio-Datei als M4A/AAC (alternativ MP3 als
   `intro-meditation.mp3` — die Web-App prüft beide) in diesen Ordner legen.
2. Datei exakt `intro-meditation.m4a` nennen (die alte ersetzen).
3. Committen und veröffentlichen — fertig. Die Web-App und die iOS-App laden
   die Datei automatisch von dieser zentralen Stelle.

Solange die Datei fehlt, zeigt die App einen Hinweis und beginnt direkt mit der
ersten Iteration.

## Gongs

Die drei Gong-Klänge wurden mit `tools/generate_gongs.py` erzeugt:

| Datei              | Klang                       | Verwendung                    |
|--------------------|-----------------------------|-------------------------------|
| `gong.wav`         | Klangschale (G3)            | Ende jeder Iteration          |
| `gong-deep.wav`    | tieferer Gong (A2)          | Einleitung des Outros         |
| `gong-deepest.wav` | ganz tiefer Gong (C2)       | Abschluss der Meditation      |

Sie können jederzeit durch eigene Aufnahmen mit gleichem Dateinamen ersetzt
werden.
