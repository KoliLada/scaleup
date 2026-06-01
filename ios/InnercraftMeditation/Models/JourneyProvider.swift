//
//  JourneyProvider.swift
//  Innercraft Meditation
//
//  Lädt die zentral vom Autor festgelegte Journey (journey.json) sowie die
//  zugehörigen Audio-Dateien und cacht alles lokal für die Offline-Nutzung.
//

import Foundation
import AVFoundation
import Combine

// MARK: - Journey-Datenmodell (entspricht app/audio/journey.json)

struct Journey: Codable, Equatable {
    struct Intro: Codable, Equatable {
        let file: String
        let title: String
    }

    struct Iteration: Codable, Equatable {
        let instructionFile: String?
        let silenceMinutes: Double
    }

    let version: Int
    let updatedAt: String?
    let intro: Intro?
    let iterations: [Iteration]
    let outroPauseMinutes: Double
    let outroFile: String?

    /// Standard-Journey, falls die zentrale Definition (noch) nicht erreichbar ist.
    /// Die deutsche Journey enthält die Eingangs-Meditation von Willigis Jäger;
    /// für andere Sprachen beginnt die Journey direkt mit den Iterationen.
    static var fallback: Journey {
        Journey(
            version: 1,
            updatedAt: nil,
            intro: L10n.lang == "de"
                ? Intro(file: "intro-meditation.m4a", title: "Geführte Meditation (Willigis Jäger)")
                : nil,
            iterations: [
                Iteration(instructionFile: nil, silenceMinutes: 5),
                Iteration(instructionFile: nil, silenceMinutes: 6),
            ],
            outroPauseMinutes: 0,
            outroFile: nil
        )
    }
}

// MARK: - Provider

final class JourneyProvider: ObservableObject {

    enum State: Equatable {
        case loading
        case ready
        case offline   // keine Verbindung, gecachte oder Fallback-Journey aktiv
    }

    @Published private(set) var state: State = .loading
    @Published private(set) var journey: Journey = .fallback
    @Published private(set) var introDuration: TimeInterval?

    /// Lokales Cache-Verzeichnis für Journey und Audio-Dateien
    private let cacheDirectory: URL = {
        let url = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("JourneyCache", isDirectory: true)
        try? FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
        return url
    }()

    init() {
        Task { await refresh() }
    }

    // MARK: Laden

    /// Lädt journey.json neu und anschließend alle benötigten Audio-Dateien.
    @MainActor
    func refresh() async {
        state = .loading

        if let fresh = await fetchJourney() {
            journey = fresh
            saveCachedJourney(fresh)
            await downloadAudioFiles(for: fresh)
            state = .ready
        } else if let cached = loadCachedJourney() {
            journey = cached
            state = .offline
        } else {
            journey = .fallback
            state = .offline
        }

        await loadIntroDuration()
    }

    private func fetchJourney() async -> Journey? {
        let url = MeditationConfig.audioBaseURL.appendingPathComponent(MeditationConfig.journeyFilename)
        var request = URLRequest(url: url)
        request.cachePolicy = .reloadIgnoringLocalAndRemoteCacheData

        guard let (data, response) = try? await URLSession.shared.data(for: request),
              let http = response as? HTTPURLResponse, http.statusCode == 200,
              let journey = try? JSONDecoder().decode(Journey.self, from: data) else {
            return nil
        }
        return journey
    }

    // MARK: Audio-Dateien

    /// Lokale URL einer Journey-Audio-Datei; nil, wenn (noch) nicht geladen.
    func localAudioURL(for filename: String?) -> URL? {
        guard let filename else { return nil }
        let url = cacheDirectory.appendingPathComponent(filename)
        return FileManager.default.fileExists(atPath: url.path) ? url : nil
    }

    private func downloadAudioFiles(for journey: Journey) async {
        var filenames: [String] = []
        if let intro = journey.intro { filenames.append(intro.file) }
        filenames.append(contentsOf: journey.iterations.compactMap(\.instructionFile))
        if let outro = journey.outroFile { filenames.append(outro) }

        for filename in filenames {
            let target = cacheDirectory.appendingPathComponent(filename)
            // Dateinamen sind versioniert (Zeitstempel) — vorhandene Dateien sind aktuell
            guard !FileManager.default.fileExists(atPath: target.path) else { continue }

            let remote = MeditationConfig.audioBaseURL.appendingPathComponent(filename)
            guard let (tempURL, response) = try? await URLSession.shared.download(from: remote),
                  let http = response as? HTTPURLResponse, http.statusCode == 200 else {
                continue
            }
            try? FileManager.default.moveItem(at: tempURL, to: target)
        }
    }

    @MainActor
    private func loadIntroDuration() async {
        guard let intro = journey.intro,
              let localURL = localAudioURL(for: intro.file) else {
            introDuration = nil
            return
        }
        let asset = AVURLAsset(url: localURL)
        if let loaded = try? await asset.load(.duration) {
            let seconds = CMTimeGetSeconds(loaded)
            introDuration = seconds.isFinite && seconds > 0 ? seconds : nil
        }
    }

    // MARK: Journey-Cache

    private var cachedJourneyURL: URL {
        cacheDirectory.appendingPathComponent(MeditationConfig.journeyFilename)
    }

    private func saveCachedJourney(_ journey: Journey) {
        if let data = try? JSONEncoder().encode(journey) {
            try? data.write(to: cachedJourneyURL)
        }
    }

    private func loadCachedJourney() -> Journey? {
        guard let data = try? Data(contentsOf: cachedJourneyURL) else { return nil }
        return try? JSONDecoder().decode(Journey.self, from: data)
    }

    // MARK: Anzeige-Hilfen

    /// Geschätzte Gesamtdauer in Sekunden
    var estimatedTotalSeconds: TimeInterval {
        var total: TimeInterval = introDuration ?? 0
        for iteration in journey.iterations {
            total += iteration.silenceMinutes * 60
        }
        total += journey.outroPauseMinutes * 60
        return total
    }
}
