//
//  RecordingsView.swift
//  Innercraft Meditation
//
//  Aufnahme der eigenen Anweisungen und des Outro-Satzes.
//

import SwiftUI
import AVFoundation

struct RecordingsView: View {
    @EnvironmentObject private var settings: MeditationSettings
    @EnvironmentObject private var recordings: RecordingStore

    @StateObject private var recorder = VoiceRecorder()
    @StateObject private var preview = PreviewPlayer()

    private var visibleSlots: [RecordingSlot] {
        var slots: [RecordingSlot] = []
        for index in 0..<settings.iterationCount {
            slots.append(.instruction(at: index))
        }
        slots.append(.outro)
        return slots
    }

    var body: some View {
        ZStack {
            Color.icPaper.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Text("DEINE STIMME")
                        .font(.system(size: 12, weight: .medium))
                        .tracking(4)
                        .foregroundStyle(Color.icClay)

                    Text("Aufnahmen")
                        .font(.custom("Cormorant Garamond", size: 34).weight(.medium))
                        .foregroundStyle(Color.icInk)

                    Text("Sprich hier deine Anweisungen für jede Iteration sowie deinen Outro-Satz auf. Die Aufnahmen bleiben auf deinem Gerät gespeichert.")
                        .font(.system(size: 14, weight: .light))
                        .foregroundStyle(Color.icInkSoft)

                    if recorder.permissionDenied {
                        Text("Der Zugriff auf das Mikrofon wurde verweigert. Bitte erlaube den Mikrofon-Zugriff in den iOS-Einstellungen unter „Datenschutz → Mikrofon“.")
                            .font(.system(size: 14, weight: .light))
                            .foregroundStyle(Color.icInk)
                            .padding(16)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color.icGold.opacity(0.14))
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.icGold.opacity(0.4)))
                    }

                    ForEach(visibleSlots) { slot in
                        recordingCard(for: slot)
                    }
                }
                .padding(22)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .onDisappear {
            if recorder.isRecording {
                recorder.stopRecording(store: recordings)
            }
            preview.stop()
        }
    }

    // MARK: Aufnahme-Karte

    private func recordingCard(for slot: RecordingSlot) -> some View {
        let isRecordingThis = recorder.isRecording && recorder.activeSlot == slot
        let hasRecording = recordings.hasRecording(for: slot)

        return VStack(alignment: .leading, spacing: 10) {
            Text(slot.title)
                .font(.custom("Cormorant Garamond", size: 20).weight(.semibold))
                .foregroundStyle(Color.icInk)

            Text(slot.hint)
                .font(.system(size: 13, weight: .light))
                .foregroundStyle(Color.icInkSoft)

            HStack(spacing: 10) {
                // Aufnehmen / Stoppen
                Button {
                    if isRecordingThis {
                        recorder.stopRecording(store: recordings)
                    } else if !recorder.isRecording {
                        preview.stop()
                        recorder.startRecording(for: slot, store: recordings)
                    }
                } label: {
                    Label(
                        isRecordingThis ? "Stoppen" : "Aufnehmen",
                        systemImage: isRecordingThis ? "stop.fill" : "mic.fill"
                    )
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(isRecordingThis ? Color.icCream : Color.icClay)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(isRecordingThis ? Color.icClay : Color.clear)
                    .clipShape(RoundedRectangle(cornerRadius: 6))
                    .overlay(RoundedRectangle(cornerRadius: 6).stroke(Color.icClay.opacity(0.5)))
                }
                .disabled(recorder.isRecording && !isRecordingThis)

                // Anhören
                Button {
                    if preview.isPlaying {
                        preview.stop()
                    } else {
                        preview.play(url: recordings.url(for: slot))
                    }
                } label: {
                    Label("Anhören", systemImage: "play.fill")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(Color.icForest)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 10)
                        .overlay(RoundedRectangle(cornerRadius: 6).stroke(Color.icForest.opacity(0.3)))
                }
                .disabled(!hasRecording || recorder.isRecording)
                .opacity(hasRecording ? 1 : 0.35)

                // Löschen
                Button {
                    recordings.deleteRecording(for: slot)
                } label: {
                    Image(systemName: "trash")
                        .font(.system(size: 13))
                        .foregroundStyle(Color.icInkSoft)
                        .padding(10)
                        .overlay(RoundedRectangle(cornerRadius: 6).stroke(Color.icInkSoft.opacity(0.3)))
                }
                .disabled(!hasRecording || recorder.isRecording)
                .opacity(hasRecording ? 1 : 0.35)

                Spacer()

                // Status
                if isRecordingThis {
                    Text(String(format: "● %.0f Sek.", recorder.elapsedSeconds))
                        .font(.system(size: 13))
                        .foregroundStyle(Color.icClay)
                } else if let duration = recordings.duration(for: slot) {
                    Text("\(Int(duration.rounded())) Sek.")
                        .font(.system(size: 13))
                        .foregroundStyle(Color.icMoss)
                } else {
                    Text("keine Aufnahme")
                        .font(.system(size: 13))
                        .foregroundStyle(Color.icClay.opacity(0.8))
                }
            }
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.icCream)
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.icForest.opacity(0.12)))
    }
}

// MARK: - Wiedergabe zur Kontrolle

final class PreviewPlayer: NSObject, ObservableObject, AVAudioPlayerDelegate {
    @Published private(set) var isPlaying = false
    private var player: AVAudioPlayer?

    func play(url: URL) {
        stop()
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback)
            try AVAudioSession.sharedInstance().setActive(true)
            player = try AVAudioPlayer(contentsOf: url)
            player?.delegate = self
            player?.play()
            isPlaying = true
        } catch {
            print("Wiedergabe fehlgeschlagen: \(error)")
        }
    }

    func stop() {
        player?.stop()
        player = nil
        isPlaying = false
    }

    func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        DispatchQueue.main.async { self.isPlaying = false }
    }
}

#Preview {
    NavigationStack {
        RecordingsView()
            .environmentObject(MeditationSettings())
            .environmentObject(RecordingStore())
    }
}
