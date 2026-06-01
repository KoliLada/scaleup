//
//  IntroProvider.swift
//  Innercraft Meditation
//
//  Lädt die zentral gehostete Eingangs-Meditation (Willigis Jäger) herunter
//  und cacht sie lokal, damit sie auch offline verfügbar ist.
//

import Foundation
import AVFoundation
import Combine

final class IntroProvider: ObservableObject {

    enum State: Equatable {
        case unknown          // noch nicht geprüft
        case downloading      // Download läuft
        case available        // lokal vorhanden
        case unavailable      // weder lokal noch zentral verfügbar
    }

    @Published private(set) var state: State = .unknown
    @Published private(set) var duration: TimeInterval?

    /// Lokaler Cache-Pfad der Eingangs-Meditation
    var localURL: URL {
        FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent(MeditationConfig.introCacheFilename)
    }

    init() {
        Task { await prepare() }
    }

    /// Prüft den lokalen Cache und lädt die Datei bei Bedarf von der zentralen URL.
    @MainActor
    func prepare() async {
        if FileManager.default.fileExists(atPath: localURL.path) {
            state = .available
            await loadDuration()
            // Im Hintergrund auf eine neuere Version prüfen
            Task.detached(priority: .background) { [weak self] in
                await self?.downloadIfNewer()
            }
            return
        }

        state = .downloading
        await download()
    }

    @MainActor
    private func download() async {
        do {
            let (tempURL, response) = try await URLSession.shared.download(from: MeditationConfig.introMeditationURL)
            guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
                state = .unavailable
                return
            }
            try? FileManager.default.removeItem(at: localURL)
            try FileManager.default.moveItem(at: tempURL, to: localURL)
            state = .available
            await loadDuration()
        } catch {
            state = FileManager.default.fileExists(atPath: localURL.path) ? .available : .unavailable
        }
    }

    /// Lädt die Datei neu, wenn sich die zentrale Version geändert hat (Größenvergleich).
    private func downloadIfNewer() async {
        var request = URLRequest(url: MeditationConfig.introMeditationURL)
        request.httpMethod = "HEAD"
        guard let (_, response) = try? await URLSession.shared.data(for: request),
              let http = response as? HTTPURLResponse, http.statusCode == 200 else { return }

        let remoteSize = http.expectedContentLength
        let localSize = (try? FileManager.default.attributesOfItem(atPath: localURL.path)[.size] as? Int64) ?? 0

        if remoteSize > 0 && remoteSize != localSize {
            await MainActor.run { self.state = .downloading }
            await MainActor.run { Task { await self.download() } }
        }
    }

    @MainActor
    private func loadDuration() async {
        let asset = AVURLAsset(url: localURL)
        if let loaded = try? await asset.load(.duration) {
            let seconds = CMTimeGetSeconds(loaded)
            duration = seconds.isFinite && seconds > 0 ? seconds : nil
        }
    }
}
