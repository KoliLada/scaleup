//
//  MeditationSettings.swift
//  Innercraft Meditation
//
//  Nutzer-Einstellungen: Anzahl & Dauer der Iterationen, Eingangs-Meditation,
//  Pause vor dem Outro. Gespeichert in UserDefaults.
//

import Foundation
import Combine

final class MeditationSettings: ObservableObject {

    @Published var introEnabled: Bool {
        didSet { defaults.set(introEnabled, forKey: Keys.introEnabled) }
    }

    /// Anzahl der Iterationen (3–5)
    @Published var iterationCount: Int {
        didSet {
            let clamped = min(MeditationConfig.maxIterations, max(MeditationConfig.minIterations, iterationCount))
            if clamped != iterationCount { iterationCount = clamped; return }
            defaults.set(iterationCount, forKey: Keys.iterationCount)
        }
    }

    /// Stille-Dauer je Iteration in Minuten (Index 0–4)
    @Published var iterationMinutes: [Double] {
        didSet { defaults.set(iterationMinutes, forKey: Keys.iterationMinutes) }
    }

    /// Optionale Stille zwischen letztem Iterations-Gong und dem tieferen Outro-Gong
    @Published var outroPauseMinutes: Double {
        didSet { defaults.set(outroPauseMinutes, forKey: Keys.outroPauseMinutes) }
    }

    private let defaults = UserDefaults.standard

    private enum Keys {
        static let introEnabled = "introEnabled"
        static let iterationCount = "iterationCount"
        static let iterationMinutes = "iterationMinutes"
        static let outroPauseMinutes = "outroPauseMinutes"
    }

    init() {
        introEnabled = defaults.object(forKey: Keys.introEnabled) as? Bool ?? true

        let storedCount = defaults.integer(forKey: Keys.iterationCount)
        iterationCount = storedCount == 0 ? 3 : min(MeditationConfig.maxIterations, max(MeditationConfig.minIterations, storedCount))

        let storedMinutes = defaults.object(forKey: Keys.iterationMinutes) as? [Double] ?? []
        var minutes: [Double] = [5, 6, 5, 5, 5]
        for (index, value) in storedMinutes.enumerated() where index < minutes.count && value > 0 {
            minutes[index] = value
        }
        iterationMinutes = minutes

        outroPauseMinutes = defaults.object(forKey: Keys.outroPauseMinutes) as? Double ?? 0
    }

    /// Geschätzte Gesamtdauer in Sekunden (ohne Gong-Ausklang und Aufnahmen)
    func estimatedTotalSeconds(introDuration: TimeInterval?) -> TimeInterval {
        var total: TimeInterval = 0
        if introEnabled, let introDuration { total += introDuration }
        for index in 0..<iterationCount {
            total += iterationMinutes[index] * 60
        }
        total += outroPauseMinutes * 60
        return total
    }
}
