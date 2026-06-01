# Innercraft Meditation — Native iOS-App

Native iPhone-App (SwiftUI) für die tägliche Innercraft-Meditation.

## Konzept: Eine zentrale Journey für alle

Der **Autor** (Innercraft) legt die Journey zentral fest — die App lädt sie von
innercraft.com und spielt sie in einem ungestörten Durchlauf ab:

1. **Geführte Eingangs-Meditation** (Willigis Jäger)
2. **Iterationen** (Anzahl & Dauer bestimmt der Autor), jeweils:
   - Anweisung in der Stimme des Autors
   - **Stille**
   - **Gong**
3. **Tieferer Gong** leitet das Outro ein
4. **Outro-Ansprache** des Autors
5. **Ganz tiefer Gong** zum Abschluss

Die Nutzer müssen nichts einstellen und nichts aufnehmen — App öffnen,
„Meditation beginnen“, im Fluss bleiben.

## Funktionen

- Lädt die zentrale Journey (`journey.json`) und alle Audio-Dateien von
  innercraft.com und cacht sie für die **Offline-Nutzung**
- Ändert der Autor die Journey (über den Autoren-Modus der Web-App), bekommen
  alle Nutzer beim nächsten App-Start automatisch die neue Version
- Läuft dank Hintergrund-Audio **auch bei gesperrtem Bildschirm** weiter
- Zum Aktualisieren: auf dem Startbildschirm nach unten ziehen (Pull-to-Refresh)

## Bauen & auf dem iPhone installieren

Voraussetzungen: **Mac mit Xcode 16** (oder neuer), Apple-ID.

1. `ios/InnercraftMeditation.xcodeproj` in Xcode öffnen
2. Unter *Signing & Capabilities* dein **Team** auswählen
   (eine kostenlose Apple-ID reicht für die Installation auf dem eigenen Gerät)
3. iPhone per Kabel anschließen, als Ziel auswählen, **▶ Run**
4. Beim ersten Start auf dem iPhone unter
   *Einstellungen → Allgemein → VPN & Geräteverwaltung* dem Entwickler­zertifikat vertrauen

Für die Veröffentlichung im App Store ist ein
[Apple Developer Program](https://developer.apple.com/programs/)-Konto (99 €/Jahr) nötig.

## Zentrale Journey-URL

Die App lädt die Journey von dieser Basis-URL
(definiert in `InnercraftMeditation/MeditationConfig.swift`):

```
https://innercraft.com/app/audio/
```

> **Wichtig:** Falls die Website einmal unter einer anderen Domain läuft,
> die URL in `MeditationConfig.swift` entsprechend anpassen.

## Projektstruktur

```
InnercraftMeditation/
  InnercraftMeditationApp.swift   — App-Einstieg
  MeditationConfig.swift          — zentrale URL, Konstanten, Farbpalette
  Info.plist                      — Hintergrund-Audio
  Models/
    JourneyProvider.swift         — lädt & cacht journey.json + Audio-Dateien
  Engine/
    MeditationEngine.swift        — Ablauf-Steuerung der Meditation
  Views/
    HomeView.swift                — Start & Journey-Übersicht
    SessionView.swift             — laufende Meditation & Abschluss
  Resources/
    gong.wav, gong-deep.wav, gong-deepest.wav
```

Die Gong-Klänge wurden mit `tools/generate_gongs.py` erzeugt und sind identisch
mit denen der Web-App.
