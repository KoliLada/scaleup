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
    static let icForest = Color(red: 0.051, green: 0.141, blue: 0.200)      // #0d2433 tiefes Wasser
    static let icForestDeep = Color(red: 0.031, green: 0.086, blue: 0.137)  // #081623 Abgrund
    static let icMoss = Color(red: 0.114, green: 0.267, blue: 0.349)        // #1d4459 mittleres Wasser
    static let icSage = Color(red: 0.310, green: 0.490, blue: 0.573)        // #4f7d92 flaches Wasser
    static let icClay = Color(red: 0.788, green: 0.514, blue: 0.416)        // #c9836a Koralle
    static let icGold = Color(red: 0.788, green: 0.635, blue: 0.294)        // #c9a24b Lichtstrahl
    static let icBiolume = Color(red: 0.561, green: 0.878, blue: 0.847)     // #8fe0d8 Biolumineszenz
    static let icSand = Color(red: 0.886, green: 0.894, blue: 0.863)        // #e2e4dc
    static let icCream = Color(red: 0.945, green: 0.949, blue: 0.925)       // #f1f2ec
    static let icPaper = Color(red: 0.976, green: 0.976, blue: 0.957)       // #f9f9f4
    static let icInk = Color(red: 0.086, green: 0.169, blue: 0.212)         // #162b36 Tiefwasser-Tinte
    static let icInkSoft = Color(red: 0.282, green: 0.384, blue: 0.439)     // #486270
}
