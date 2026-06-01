//
//  SessionView.swift
//  Innercraft Meditation
//
//  Anzeige der laufenden Meditation: aktuelle Phase, Fortschrittsring,
//  Pause / Beenden — sowie der Abschluss-Bildschirm.
//

import SwiftUI

struct SessionView: View {
    @ObservedObject var engine: MeditationEngine
    @Environment(\.dismiss) private var dismiss

    @State private var showStopConfirmation = false

    var body: some View {
        ZStack {
            Color.icPaper.ignoresSafeArea()

            // Atmende Klang-Ringe im Hintergrund
            BreathingRings()

            if engine.state == .finished {
                doneView
            } else {
                sessionView
            }
        }
        .onChange(of: engine.state) { _, newState in
            if newState == .idle { dismiss() }
        }
    }

    // MARK: Laufende Meditation

    private var sessionView: some View {
        VStack(spacing: 0) {
            Spacer()

            Text(engine.currentPhase?.label.uppercased() ?? "")
                .font(.system(size: 12, weight: .medium))
                .tracking(4)
                .foregroundStyle(Color.icClay)
                .padding(.bottom, 10)

            Text(engine.currentPhase?.title ?? "")
                .font(.custom("Cormorant Garamond", size: 36).weight(.medium))
                .foregroundStyle(Color.icInk)
                .padding(.bottom, 36)

            // Fortschrittsring mit Zeit
            ZStack {
                Circle()
                    .stroke(Color.icForest.opacity(0.14), lineWidth: 4)

                Circle()
                    .trim(from: 0, to: progress)
                    .stroke(Color.icGold, style: StrokeStyle(lineWidth: 4, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                    .animation(.linear(duration: 0.25), value: progress)

                Text(timeText)
                    .font(.system(size: 52, weight: .light))
                    .monospacedDigit()
                    .foregroundStyle(Color.icForest)
            }
            .frame(width: 260, height: 260)
            .padding(.bottom, 28)

            Text("SCHRITT \(engine.phaseIndex + 1) VON \(engine.phases.count)")
                .font(.system(size: 12, weight: .light))
                .tracking(2)
                .foregroundStyle(Color.icInkSoft)
                .padding(.bottom, 40)

            // Steuerung
            HStack(spacing: 12) {
                Button {
                    engine.togglePause()
                } label: {
                    Text(engine.state == .paused ? "Fortsetzen" : "Pause")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(Color.icForest)
                        .padding(.horizontal, 28)
                        .padding(.vertical, 14)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.icForest.opacity(0.35)))
                }

                Button {
                    showStopConfirmation = true
                } label: {
                    Text("Beenden")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(Color.icClay)
                        .padding(.horizontal, 28)
                        .padding(.vertical, 14)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.icClay.opacity(0.4)))
                }
            }

            Spacer()
        }
        .padding(22)
        .confirmationDialog("Meditation wirklich beenden?", isPresented: $showStopConfirmation, titleVisibility: .visible) {
            Button("Beenden", role: .destructive) {
                engine.stop()
            }
            Button("Weiter meditieren", role: .cancel) {}
        }
    }

    private var progress: CGFloat {
        guard let duration = engine.phaseDuration, duration > 0 else { return 0 }
        return min(1, engine.phaseElapsed / duration)
    }

    private var timeText: String {
        let phase = engine.currentPhase
        var seconds = engine.phaseElapsed

        // Bei Stille die Restzeit anzeigen, bei Audio die vergangene Zeit
        if case .silence(let duration) = phase?.kind {
            seconds = max(0, duration - engine.phaseElapsed)
        }

        let minutes = Int(seconds) / 60
        let secs = Int(seconds) % 60
        return String(format: "%02d:%02d", minutes, secs)
    }

    // MARK: Abschluss

    private var doneView: some View {
        VStack(spacing: 18) {
            Spacer()

            GongMark(color: .icGold)
                .frame(width: 76, height: 76)

            Text("MEDITATION ABGESCHLOSSEN")
                .font(.system(size: 12, weight: .medium))
                .tracking(4)
                .foregroundStyle(Color.icClay)
                .padding(.top, 16)

            Text("Jetzt bist du präsent\nund gerüstet für deinen Tag.")
                .font(.custom("Cormorant Garamond", size: 32).weight(.medium))
                .foregroundStyle(Color.icInk)
                .multilineTextAlignment(.center)

            Text("Wir wünschen dir einen schönen Tag.")
                .font(.system(size: 15, weight: .light))
                .foregroundStyle(Color.icInkSoft)

            Button {
                dismiss()
            } label: {
                Text("Zurück zum Start")
                    .font(.system(size: 16, weight: .medium))
                    .tracking(1)
                    .foregroundStyle(Color.icCream)
                    .padding(.horizontal, 36)
                    .padding(.vertical, 16)
                    .background(Color.icForest)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
            }
            .padding(.top, 26)

            Spacer()
        }
        .padding(22)
    }
}

// MARK: - Atmende Hintergrund-Ringe

struct BreathingRings: View {
    @State private var breathe = false

    var body: some View {
        ZStack {
            ForEach(0..<3, id: \.self) { index in
                Circle()
                    .stroke(Color.icGold.opacity(0.22), lineWidth: 1)
                    .frame(width: CGFloat(300 + index * 90), height: CGFloat(300 + index * 90))
                    .scaleEffect(breathe ? 1.06 : 1.0)
                    .animation(
                        .easeInOut(duration: 9)
                        .repeatForever(autoreverses: true)
                        .delay(Double(index) * -3),
                        value: breathe
                    )
            }
        }
        .onAppear { breathe = true }
        .allowsHitTesting(false)
    }
}

#Preview {
    SessionView(engine: MeditationEngine())
}
