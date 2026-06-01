# Audio-Dateien der Meditations-App

## Eingangs-Meditation (Willigis Jäger)

Die geführte Eingangs-Meditation wird **zentral** in diesem Ordner hinterlegt und
ist damit für **alle Nutzer** der App verfügbar:

```
app/audio/intro-meditation.mp3
```

**So fügst du sie hinzu / tauschst sie aus:**

1. Die Audio-Datei als MP3 (alternativ M4A, dann Dateiname in `app/app.js`
   und `ios/.../MeditationConfig.swift` anpassen) in diesen Ordner legen.
2. Datei exakt `intro-meditation.mp3` nennen.
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
