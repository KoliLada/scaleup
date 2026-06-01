//
//  RecordingStore.swift
//  Innercraft Meditation
//
//  Verwaltet die eigenen Sprachaufnahmen (Iterations-Anweisungen + Outro-Satz).
//  Die Aufnahmen liegen als M4A-Dateien im Documents-Verzeichnis des Geräts.
//

import Foundation
import AVFoundation
import Combine

/// Die verschiedenen Aufnahme-Plätze der App
enum RecordingSlot: String, CaseIterable, Identifiable {
    case instruction1 = "instruction-1"
    case instruction2 = "instruction-2"
    case instruction3 = "instruction-3"
    case instruction4 = "instruction-4"
    case instruction5 = "instruction-5"
    case outro = "outro"

    var id: String { rawValue }

    var title: String {
        switch self {
        case .instruction1: return "Anweisung — Iteration 1"
        case .instruction2: return "Anweisung — Iteration 2"
        case .instruction3: return "Anweisung — Iteration 3"
        case .instruction4: return "Anweisung — Iteration 4"
        case .instruction5: return "Anweisung — Iteration 5"
        case .outro: return "Outro-Satz"
        }
    }

    var hint: String {
        switch self {
        case .instruction1:
            return "Kurze verbale Anweisung, mit der die erste Stille beginnt."
        case .instruction2, .instruction3, .instruction4, .instruction5:
            return "Anweisung für diese Iteration. Fehlt sie, wird die Anweisung der ersten Iteration verwendet."
        case .outro:
            return "Z. B.: „Jetzt bist du präsent und gerüstet für deinen Tag. Ich wünsche dir einen schönen Tag.“"
        }
    }

    /// Aufnahme-Platz für die Anweisung der Iteration mit Index 0–4
    static func instruction(at index: Int) -> RecordingSlot {
        switch index {
        case 0: return .instruction1
        case 1: return .instruction2
        case 2: return .instruction3
        case 3: return .instruction4
        default: return .instruction5
        }
    }
}

final class RecordingStore: ObservableObject {

    /// Dauer (Sekunden) je vorhandener Aufnahme — dient auch als "existiert"-Indikator
    @Published private(set) var durations: [RecordingSlot: TimeInterval] = [:]

    private let directory: URL

    init() {
        directory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("Recordings", isDirectory: true)
        try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        refresh()
    }

    func url(for slot: RecordingSlot) -> URL {
        directory.appendingPathComponent("\(slot.rawValue).m4a")
    }

    func hasRecording(for slot: RecordingSlot) -> Bool {
        durations[slot] != nil
    }

    func duration(for slot: RecordingSlot) -> TimeInterval? {
        durations[slot]
    }

    func deleteRecording(for slot: RecordingSlot) {
        try? FileManager.default.removeItem(at: url(for: slot))
        refresh()
    }

    /// Liest alle vorhandenen Aufnahmen neu ein (z. B. nach einer neuen Aufnahme)
    func refresh() {
        var result: [RecordingSlot: TimeInterval] = [:]
        for slot in RecordingSlot.allCases {
            let fileURL = url(for: slot)
            guard FileManager.default.fileExists(atPath: fileURL.path) else { continue }
            let asset = AVURLAsset(url: fileURL)
            let seconds = CMTimeGetSeconds(asset.duration)
            result[slot] = seconds.isFinite && seconds > 0 ? seconds : 0
        }
        DispatchQueue.main.async {
            self.durations = result
        }
    }

    /// Liefert die Anweisungs-Aufnahme für eine Iteration,
    /// mit Fallback auf die Anweisung der ersten Iteration.
    func instructionURL(forIteration index: Int) -> URL? {
        let slot = RecordingSlot.instruction(at: index)
        if hasRecording(for: slot) { return url(for: slot) }
        if hasRecording(for: .instruction1) { return url(for: .instruction1) }
        return nil
    }

    var outroURL: URL? {
        hasRecording(for: .outro) ? url(for: .outro) : nil
    }
}
