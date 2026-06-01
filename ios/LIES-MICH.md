# Innercraft Meditation — Native iOS-App

Native iPhone-App (SwiftUI) für die tägliche Innercraft-Meditation.

## Ablauf der Meditation

1. **Geführte Eingangs-Meditation** (Willigis Jäger) — wird zentral gehostet
   und automatisch geladen (siehe unten)
2. **3–5 Iterationen**, jeweils:
   - deine eigene, aufgesprochene **Anweisung**
   - **Stille** (Dauer pro Iteration einstellbar, 1–60 Min.)
   - **Gong**
3. **Tieferer Gong** leitet das Outro ein
4. **Dein Outro-Satz** in eigener Stimme
   („Jetzt bist du präsent und gerüstet für deinen Tag …“)
5. **Ganz tiefer Gong** zum Abschluss

## Funktionen

- Eigene Anweisungen und Outro-Satz direkt in der App **mit dem Mikrofon aufnehmen**
  (werden lokal auf dem Gerät gespeichert)
- Anzahl (3–5) und Stille-Dauer der Iterationen einstellbar
- Läuft dank Hintergrund-Audio **auch bei gesperrtem Bildschirm** weiter
- Eingangs-Meditation wird einmal geladen und ist danach **offline** verfügbar

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

## Zentrale Eingangs-Meditation

Die App lädt die geführte Meditation von dieser zentralen URL
(definiert in `InnercraftMeditation/MeditationConfig.swift`):

```
https://innercraft.com/app/audio/intro-meditation.mp3
```

Damit ist die Meditation **für alle Nutzer auf allen Geräten identisch** und kann
zentral ausgetauscht werden, ohne dass die App aktualisiert werden muss:
Einfach die Datei `app/audio/intro-meditation.mp3` im Web-Repository ersetzen.

> **Wichtig:** Sobald die Website unter einer anderen Domain veröffentlicht wird,
> die URL in `MeditationConfig.swift` entsprechend anpassen.

## Projektstruktur

```
InnercraftMeditation/
  InnercraftMeditationApp.swift   — App-Einstieg
  MeditationConfig.swift          — zentrale URL, Konstanten, Farbpalette
  Info.plist                      — Mikrofon-Berechtigung, Hintergrund-Audio
  Models/
    MeditationSettings.swift      — Einstellungen (UserDefaults)
    RecordingStore.swift          — eigene Sprachaufnahmen (Documents)
    IntroProvider.swift           — Download & Cache der Eingangs-Meditation
  Engine/
    VoiceRecorder.swift           — Mikrofon-Aufnahme (AVAudioRecorder)
    MeditationEngine.swift        — Ablauf-Steuerung der Meditation
  Views/
    HomeView.swift                — Start & Ablauf-Übersicht
    SettingsView.swift            — Ablauf & Dauer
    RecordingsView.swift          — Aufnahmen
    SessionView.swift             — laufende Meditation & Abschluss
  Resources/
    gong.wav, gong-deep.wav, gong-deepest.wav
```

Die Gong-Klänge wurden mit `tools/generate_gongs.py` erzeugt und sind identisch
mit denen der Web-App.
