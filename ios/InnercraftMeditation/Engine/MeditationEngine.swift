//
//  MeditationEngine.swift
//  Innercraft Meditation
//
//  Steuert den Ablauf der zentral festgelegten Journey:
//
//    1. Geführte Eingangs-Meditation (Willigis Jäger)
//    2. Iterationen: Anweisung des Autors → Stille → Gong
//    3. Tieferer Gong → Outro-Ansprache → ganz tiefer Gong
//
//  Dank AVAudioSession (.playback) läuft die Sitzung auch bei
//  gesperrtem Bildschirm weiter.
//

import Foundation
import AVFoundation
import Combine
import UIKit

// MARK: - Phasen des Ablaufs

struct MeditationPhase: Identifiable {
    enum Kind {
        case audio(URL)                  // spielt eine Audio-Datei vollständig ab
        case silence(TimeInterval)       // wartet die angegebene Dauer in Stille
    }

    let id = UUID()
    let kind: Kind
    let label: String   // z. B. "Iteration 2 von 4"
    let title: String   // z. B. "Stille"

    /// Geschätzte Dauer (für die Countdown-Anzeige), wird beim Aufbau gefüllt
    var estimatedDuration: TimeInterval = 0
    /// Sinnvoller Schritt, zu dem diese Phase gehört (1-basiert)
    var step: Int = 1
}

// MARK: - Engine

final class MeditationEngine: NSObject, ObservableObject, AVAudioPlayerDelegate {

    enum State {
        case idle
        case running
        case paused
        case finished
    }

    @Published private(set) var state: State = .idle
    @Published private(set) var phases: [MeditationPhase] = []
    @Published private(set) var phaseIndex = 0
    @Published private(set) var phaseElapsed: TimeInterval = 0
    @Published private(set) var phaseDuration: TimeInterval?
    @Published private(set) var totalSteps = 0

    var currentPhase: MeditationPhase? {
        phases.indices.contains(phaseIndex) ? phases[phaseIndex] : nil
    }

    /// Gesamtdauer aller Phasen
    var totalDuration: TimeInterval {
        phases.reduce(0) { $0 + $1.estimatedDuration }
    }

    /// Verbleibende Zeit der gesamten Meditation (läuft rückwärts)
    var totalRemaining: TimeInterval {
        guard phaseIndex >= 0, phaseIndex < phases.count else { return 0 }
        var remaining: TimeInterval = 0
        for i in phaseIndex..<phases.count {
            let duration = phases[i].estimatedDuration
            remaining += i == phaseIndex ? max(0, duration - phaseElapsed) : duration
        }
        return remaining
    }

    /// Verbleibende Zeit des aktuellen Schritts (läuft rückwärts)
    var phaseRemaining: TimeInterval {
        guard let phase = currentPhase else { return 0 }
        return max(0, phase.estimatedDuration - phaseElapsed)
    }

    private var player: AVAudioPlayer?
    private var tickTimer: Timer?
    private var silenceStartedAt: Date?
    private var silenceAccumulated: TimeInterval = 0

    // MARK: Aufbau des Ablaufs aus der zentralen Journey
    //
    // Der Gong begleitet die ganze Meditation:
    // Start → kurze Stille → Gong → Eingangs-Meditation → Gong
    // → Anweisung → Gong → Stille → Gong → … → tieferer Gong → Outro → ganz tiefer Gong

    /// Kurze Stille nach dem Start, bevor der erste Gong ertönt
    private static let startDelaySeconds: TimeInterval = 3

    func buildPhases(provider: JourneyProvider) {
        let journey = provider.journey
        var result: [MeditationPhase] = []

        let gongURL = Self.bundleAudioURL(MeditationConfig.gongFilename)

        func appendGong(label: String) {
            if let gongURL {
                result.append(MeditationPhase(kind: .audio(gongURL), label: label, title: L10n.t("phaseGong")))
            }
        }

        // 0) Kurze Stille zum Ankommen, dann der Eröffnungs-Gong
        result.append(MeditationPhase(
            kind: .silence(Self.startDelaySeconds),
            label: L10n.t("phaseBegin"),
            title: L10n.t("phaseSilence")
        ))
        appendGong(label: L10n.t("phaseBegin"))

        // 1) Eingangs-Meditation, danach ein Gong (eigener Titel des Autors, sonst Standard)
        if let intro = journey.intro,
           let localURL = provider.localAudioURL(for: intro.file) {
            let introLabel = intro.title.isEmpty ? L10n.t("phaseIntroLabel") : intro.title
            result.append(MeditationPhase(
                kind: .audio(localURL),
                label: introLabel,
                title: L10n.t("phaseIntroTitle")
            ))
            appendGong(label: introLabel)
        }

        // 2) Iterationen: Anweisung → Gong → Stille → Gong
        //    Eigener Titel des Autors als Label, sonst „Iteration N von M"
        let total = journey.iterations.count
        for (index, iteration) in journey.iterations.enumerated() {
            let label = (iteration.title?.isEmpty == false)
                ? iteration.title!
                : L10n.iterationPhaseLabel(index + 1, of: total)

            if let instructionURL = provider.localAudioURL(for: iteration.instructionFile) {
                result.append(MeditationPhase(kind: .audio(instructionURL), label: label, title: L10n.t("phaseInstruction")))
                // Gong nach der Anweisung — er eröffnet die Stille
                appendGong(label: label)
            }

            result.append(MeditationPhase(
                kind: .silence(iteration.silenceMinutes * 60),
                label: label,
                title: L10n.t("phaseSilence")
            ))

            // Gong beendet die Stille
            appendGong(label: label)
        }

        // 3) Optionale Stille vor dem Outro
        if journey.outroPauseMinutes > 0 {
            result.append(MeditationPhase(
                kind: .silence(journey.outroPauseMinutes * 60),
                label: L10n.t("phaseTransition"),
                title: L10n.t("phaseSilence")
            ))
        }

        // 4) Tieferer Gong leitet das Outro ein (eigener Titel des Autors, sonst Standard)
        let outroLabel = (journey.outroTitle?.isEmpty == false) ? journey.outroTitle! : L10n.t("phaseOutro")
        if let deepURL = Self.bundleAudioURL(MeditationConfig.gongDeepFilename) {
            result.append(MeditationPhase(kind: .audio(deepURL), label: outroLabel, title: L10n.t("phaseDeepGong")))
        }

        // 5) Outro-Ansprache des Autors
        if let outroURL = provider.localAudioURL(for: journey.outroFile) {
            result.append(MeditationPhase(kind: .audio(outroURL), label: outroLabel, title: L10n.t("phaseOutro")))
        }

        // 6) Ganz tiefer Gong als Abschluss
        if let deepestURL = Self.bundleAudioURL(MeditationConfig.gongDeepestFilename) {
            result.append(MeditationPhase(kind: .audio(deepestURL), label: L10n.t("phaseFinal"), title: L10n.t("phaseFinalGong")))
        }

        // Dauern aller Phasen ermitteln (für die Countdown-Anzeige)
        for i in result.indices {
            switch result[i].kind {
            case .audio(let url):
                result[i].estimatedDuration = (try? AVAudioPlayer(contentsOf: url))?.duration ?? 0
            case .silence(let duration):
                result[i].estimatedDuration = duration
            }
        }

        // Aufeinanderfolgende Phasen mit gleichem Label bilden einen Schritt
        var step = 0
        var lastLabel: String?
        for i in result.indices {
            if result[i].label != lastLabel {
                step += 1
                lastLabel = result[i].label
            }
            result[i].step = step
        }
        totalSteps = step

        phases = result
    }

    private static func bundleAudioURL(_ name: String) -> URL? {
        Bundle.main.url(forResource: name, withExtension: MeditationConfig.gongFileExtension)
    }

    // MARK: Steuerung

    func start(provider: JourneyProvider) {
        buildPhases(provider: provider)
        guard !phases.isEmpty else { return }

        configureAudioSession()
        UIApplication.shared.isIdleTimerDisabled = true

        phaseIndex = -1
        state = .running
        advance()

        tickTimer = Timer.scheduledTimer(withTimeInterval: 0.25, repeats: true) { [weak self] _ in
            self?.tick()
        }
        RunLoop.main.add(tickTimer!, forMode: .common)
    }

    private func configureAudioSession() {
        let session = AVAudioSession.sharedInstance()
        do {
            // .playback + UIBackgroundModes "audio" -> läuft auch bei gesperrtem Bildschirm
            try session.setCategory(.playback, mode: .spokenAudio)
            try session.setActive(true)
        } catch {
            print("Audio-Session konnte nicht konfiguriert werden: \(error)")
        }
    }

    private func advance() {
        player?.stop()
        player = nil
        silenceStartedAt = nil
        silenceAccumulated = 0
        phaseElapsed = 0

        phaseIndex += 1

        guard phaseIndex < phases.count else {
            finish()
            return
        }

        let phase = phases[phaseIndex]

        switch phase.kind {
        case .audio(let url):
            do {
                let player = try AVAudioPlayer(contentsOf: url)
                player.delegate = self
                player.prepareToPlay()
                player.play()
                self.player = player
                phaseDuration = player.duration
            } catch {
                print("Audio konnte nicht abgespielt werden (\(url.lastPathComponent)): \(error)")
                // Nicht hängen bleiben — direkt zur nächsten Phase
                DispatchQueue.main.asyncAfter(deadline: .now() + 1) { [weak self] in
                    self?.advance()
                }
            }

        case .silence(let duration):
            phaseDuration = duration
            silenceStartedAt = Date()
        }
    }

    private func tick() {
        guard state == .running, let phase = currentPhase else { return }

        switch phase.kind {
        case .audio:
            phaseElapsed = player?.currentTime ?? 0

        case .silence(let duration):
            guard let startedAt = silenceStartedAt else { return }
            phaseElapsed = silenceAccumulated + Date().timeIntervalSince(startedAt)
            if phaseElapsed >= duration {
                advance()
            }
        }
    }

    func togglePause() {
        switch state {
        case .running:
            state = .paused
            player?.pause()
            if let startedAt = silenceStartedAt {
                silenceAccumulated += Date().timeIntervalSince(startedAt)
                silenceStartedAt = nil
            }

        case .paused:
            state = .running
            if let phase = currentPhase {
                switch phase.kind {
                case .audio: player?.play()
                case .silence: silenceStartedAt = Date()
                }
            }

        default:
            break
        }
    }

    /// Springt zum nächsten Schritt (z. B. Eingangs-Meditation überspringen)
    func skip() {
        guard let phase = currentPhase else { return }

        // Pause aufheben, falls aktiv
        if state == .paused { state = .running }

        // Erste Phase finden, die zu einem anderen Schritt gehört
        var next = phaseIndex + 1
        while next < phases.count && phases[next].label == phase.label {
            next += 1
        }

        // advance() stoppt das laufende Audio und erhöht den Index um 1
        phaseIndex = next - 1
        advance()
    }

    func stop() {
        cleanup()
        state = .idle
    }

    private func finish() {
        cleanup()
        state = .finished
    }

    private func cleanup() {
        tickTimer?.invalidate()
        tickTimer = nil
        player?.stop()
        player = nil
        silenceStartedAt = nil
        UIApplication.shared.isIdleTimerDisabled = false
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }

    // MARK: AVAudioPlayerDelegate

    func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        DispatchQueue.main.async { [weak self] in
            guard let self, self.state == .running else { return }
            self.advance()
        }
    }
}
