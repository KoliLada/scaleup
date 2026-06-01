//
//  MeditationConfig.swift
//  Innercraft Meditation
//
//  Zentrale Konfiguration und das Innercraft-Farbschema.
//

import SwiftUI

enum MeditationConfig {
    /// Zentrale URL der geführten Eingangs-Meditation (Willigis Jäger).
    /// Die Datei liegt im Web-Repository unter app/audio/intro-meditation.mp3
    /// und ist damit für alle Nutzer auf allen Geräten identisch.
    /// Beim Veröffentlichen der Website ggf. an die echte Domain anpassen.
    static let introMeditationURL = URL(string: "https://innercraft.com/app/audio/intro-meditation.mp3")!

    /// Lokaler Dateiname für die gecachte Eingangs-Meditation.
    static let introCacheFilename = "intro-meditation.mp3"

    static let minIterations = 3
    static let maxIterations = 5

    /// Gong-Dateien im App-Bundle (Resources/)
    static let gongFilename = "gong"
    static let gongDeepFilename = "gong-deep"
    static let gongDeepestFilename = "gong-deepest"
    static let gongFileExtension = "wav"
}

// MARK: - Innercraft-Erdpalette (passend zur Website)

extension Color {
    static let icForest = Color(red: 0.184, green: 0.231, blue: 0.188)      // #2f3b30
    static let icForestDeep = Color(red: 0.137, green: 0.173, blue: 0.141)  // #232c24
    static let icMoss = Color(red: 0.357, green: 0.420, blue: 0.302)        // #5b6b4d
    static let icSage = Color(red: 0.541, green: 0.604, blue: 0.482)        // #8a9a7b
    static let icClay = Color(red: 0.714, green: 0.443, blue: 0.247)        // #b6713f
    static let icGold = Color(red: 0.788, green: 0.635, blue: 0.294)        // #c9a24b
    static let icSand = Color(red: 0.910, green: 0.863, blue: 0.776)        // #e8dcc6
    static let icCream = Color(red: 0.961, green: 0.937, blue: 0.886)       // #f5efe2
    static let icPaper = Color(red: 0.980, green: 0.965, blue: 0.925)       // #faf6ec
    static let icInk = Color(red: 0.204, green: 0.188, blue: 0.165)         // #34302a
    static let icInkSoft = Color(red: 0.365, green: 0.337, blue: 0.298)     // #5d564c
}
