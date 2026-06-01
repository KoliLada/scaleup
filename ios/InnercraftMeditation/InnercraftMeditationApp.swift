//
//  InnercraftMeditationApp.swift
//  Innercraft Meditation
//
//  Tägliche Meditation: geführte Eingangs-Meditation, eigene Anweisungen
//  in der Stimme der Nutzerin / des Nutzers, Stille-Iterationen mit Gong
//  und ein persönliches Outro.
//

import SwiftUI

@main
struct InnercraftMeditationApp: App {
    @StateObject private var settings = MeditationSettings()
    @StateObject private var recordingStore = RecordingStore()
    @StateObject private var introProvider = IntroProvider()

    var body: some Scene {
        WindowGroup {
            HomeView()
                .environmentObject(settings)
                .environmentObject(recordingStore)
                .environmentObject(introProvider)
                .preferredColorScheme(.light)
                .tint(Color.icForest)
        }
    }
}
