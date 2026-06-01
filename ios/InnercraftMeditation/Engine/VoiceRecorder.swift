//
//  VoiceRecorder.swift
//  Innercraft Meditation
//
//  Nimmt die eigenen Anweisungen und den Outro-Satz über das Mikrofon auf.
//

import Foundation
import AVFoundation
import Combine

final class VoiceRecorder: NSObject, ObservableObject, AVAudioRecorderDelegate {

    @Published private(set) var isRecording = false
    @Published private(set) var activeSlot: RecordingSlot?
    @Published private(set) var elapsedSeconds: TimeInterval = 0
    @Published var permissionDenied = false

    private var recorder: AVAudioRecorder?
    private var timer: Timer?

    /// Startet eine Aufnahme für den angegebenen Platz.
    func startRecording(for slot: RecordingSlot, store: RecordingStore) {
        requestPermission { [weak self] granted in
            guard let self else { return }
            guard granted else {
                self.permissionDenied = true
                return
            }
            self.beginRecording(for: slot, store: store)
        }
    }

    private func requestPermission(completion: @escaping (Bool) -> Void) {
        if #available(iOS 17.0, *) {
            AVAudioApplication.requestRecordPermission { granted in
                DispatchQueue.main.async { completion(granted) }
            }
        } else {
            AVAudioSession.sharedInstance().requestRecordPermission { granted in
                DispatchQueue.main.async { completion(granted) }
            }
        }
    }

    private func beginRecording(for slot: RecordingSlot, store: RecordingStore) {
        let session = AVAudioSession.sharedInstance()
        do {
            try session.setCategory(.playAndRecord, mode: .spokenAudio, options: [.defaultToSpeaker])
            try session.setActive(true)

            let settings: [String: Any] = [
                AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
                AVSampleRateKey: 44100,
                AVNumberOfChannelsKey: 1,
                AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue,
            ]

            let recorder = try AVAudioRecorder(url: store.url(for: slot), settings: settings)
            recorder.delegate = self
            recorder.record()

            self.recorder = recorder
            self.activeSlot = slot
            self.isRecording = true
            self.elapsedSeconds = 0

            timer = Timer.scheduledTimer(withTimeInterval: 0.2, repeats: true) { [weak self] _ in
                self?.elapsedSeconds = self?.recorder?.currentTime ?? 0
            }
        } catch {
            print("Aufnahme konnte nicht gestartet werden: \(error)")
        }
    }

    /// Beendet die laufende Aufnahme und aktualisiert den Store.
    func stopRecording(store: RecordingStore) {
        recorder?.stop()
        recorder = nil
        timer?.invalidate()
        timer = nil
        isRecording = false
        activeSlot = nil
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
        store.refresh()
    }

    func audioRecorderDidFinishRecording(_ recorder: AVAudioRecorder, successfully flag: Bool) {
        if !flag {
            print("Aufnahme wurde nicht erfolgreich beendet.")
        }
    }
}
