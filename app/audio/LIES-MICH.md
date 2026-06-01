# Audio & Journey der Meditations-App

## Die zentralen Journeys (eine pro Sprache)

Der **Autor** legt hier fest, was **alle Nutzer** der App erleben — Anzahl und
Länge der Iterationen, welche Anweisungen gespielt werden und das Outro.
**Jede Sprache hat ihre eigene Journey:**

| Sprache | Journey-Datei |
|---|---|
| 🇩🇪 Deutsch | `journey.json` |
| 🇬🇧 Englisch | `journey-en.json` |
| 🇫🇷 Französisch | `journey-fr.json` |

Aufbau einer Journey-Datei:

```json
{
  "intro": { "file": "intro-meditation.m4a", "title": "Geführte Meditation (Willigis Jäger)" },
  "iterations": [
    { "instructionFile": "journey-iteration-1-….m4a", "silenceMinutes": 5 },
    { "instructionFile": "journey-iteration-2-….m4a", "silenceMinutes": 6 }
  ],
  "outroPauseMinutes": 0,
  "outroFile": "journey-outro-….m4a"
}
```

**Bearbeitet wird die Journey normalerweise nicht von Hand**, sondern über den
**Autoren-Modus** der Web-App: `https://innercraft.com/app/autor.html`

Dort kann der Autor (über die Sprach-Tabs Deutsch / English / Français):
- Iterationen hinzufügen / entfernen und ihre Stille-Dauer festlegen
- Anweisungen und Outro mit eigener Stimme aufnehmen — pro Sprache
- alles mit einem Klick **veröffentlichen** (committet über die GitHub-API,
  Cloudflare Pages deployt automatisch — nach 1–2 Minuten live für alle)

## Eingangs-Meditation (Willigis Jäger)

```
app/audio/intro-meditation.m4a   (12,9 Min., AAC)
```

Zum Austauschen einfach die Datei ersetzen (gleicher Name) und committen.

## Gongs

Die drei Gong-Klänge wurden mit `tools/generate_gongs.py` erzeugt:

| Datei              | Klang                       | Verwendung                    |
|--------------------|-----------------------------|-------------------------------|
| `gong.wav`         | Klangschale (G3)            | Ende jeder Iteration          |
| `gong-deep.wav`    | tieferer Gong (A2)          | Einleitung des Outros         |
| `gong-deepest.wav` | ganz tiefer Gong (C2)       | Abschluss der Meditation      |

## Aufnahmen des Autors

Dateien mit dem Muster `journey-*-iteration-*.m4a` und `journey-*-outro-*.m4a`
werden vom Autoren-Modus beim Veröffentlichen hochgeladen (mit Sprach-Kürzel
im Namen, z. B. `journey-en-iteration-1-….m4a`). Der Zeitstempel im Namen
sorgt dafür, dass Nutzer-Geräte immer die aktuelle Version laden.
Alte, nicht mehr referenzierte Dateien können gelegentlich gelöscht werden.

Die **Eingangs-Meditation** (Willigis Jäger, deutsch) ist nur Teil der
deutschen Journey. Für Englisch und Französisch beginnt die Journey direkt
mit Iteration 1, bis ggf. eine eigene Eingangs-Meditation hinterlegt wird.
