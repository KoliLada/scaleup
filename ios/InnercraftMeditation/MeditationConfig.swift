//
//  MeditationConfig.swift
//  Innercraft Meditation
//
//  Zentrale Konfiguration und das Innercraft-Farbschema.
//

import SwiftUI

enum MeditationConfig {
    /// Basis-URL der zentral gehosteten Journey (Audio-Ordner der Web-App).
    /// Der Autor steuert dort über die Journey-Dateien den kompletten Ablauf —
    /// alle Nutzer einer Sprache erleben dieselbe Journey.
    static let audioBaseURL = URL(string: "https://innercraft.com/app/audio/")!

    /// Dateiname der zentralen Journey-Definition (abhängig von Geräte-Sprache
    /// und Wochentag — der Provider wählt den heutigen Tag).

    /// Gong-Dateien im App-Bundle (Resources/)
    static let gongFilename = "gong"
    static let gongDeepFilename = "gong-deep"
    static let gongDeepestFilename = "gong-deepest"
    static let gongFileExtension = "wav"
}

// MARK: - Innercraft-Tiefwasser-Palette („Die Qualle", passend zur Website)

extension Color {
    static let icForest = Color(red: 0.110, green: 0.239, blue: 0.188)      // #1c3d30 Dunkelgrün
    static let icForestDeep = Color(red: 0.071, green: 0.157, blue: 0.118)  // #12281e tiefstes Grün
    static let icMoss = Color(red: 0.184, green: 0.361, blue: 0.278)        // #2f5c47 mittleres Grün
    static let icSage = Color(red: 0.373, green: 0.549, blue: 0.439)        // #5f8c70 Salbeigrün
    static let icClay = Color(red: 0.659, green: 0.224, blue: 0.184)        // #a8392f Krimson
    static let icGold = Color(red: 0.663, green: 0.831, blue: 0.855)        // #a9d4da Hellblau (Licht)
    static let icBiolume = Color(red: 0.812, green: 0.902, blue: 0.918)     // #cfe6ea Hellblau (Leuchten)
    static let icSand = Color(red: 0.875, green: 0.906, blue: 0.839)        // #dfe7d6 helles Salbei
    static let icCream = Color(red: 0.953, green: 0.945, blue: 0.910)       // #f3f1e8
    static let icPaper = Color(red: 0.973, green: 0.969, blue: 0.941)       // #f8f7f0
    static let icInk = Color(red: 0.090, green: 0.184, blue: 0.149)         // #172f26 Grün-Tinte
    static let icInkSoft = Color(red: 0.298, green: 0.400, blue: 0.337)     // #4c6656
}
