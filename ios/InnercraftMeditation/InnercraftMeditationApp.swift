//
//  InnercraftMeditationApp.swift
//  Innercraft Meditation
//
//  Tägliche Meditation: Die Journey wird zentral vom Autor (innercraft.com)
//  festgelegt — geführte Eingangs-Meditation, Iterationen aus Anweisung,
//  Stille und Gong, sowie ein Outro mit tiefem Abschluss-Gong.
//

import SwiftUI

@main
struct InnercraftMeditationApp: App {
    @StateObject private var journeyProvider = JourneyProvider()

    var body: some Scene {
        WindowGroup {
            HomeView()
                .environmentObject(journeyProvider)
                .preferredColorScheme(.light)
                .tint(Color.icForest)
        }
    }
}
