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

            // Fortschrittsring mit zwei rückwärts laufenden Werten:
            // groß = verbleibende Gesamtzeit, klein = Restzeit des aktuellen Schritts
            ZStack {
                Circle()
                    .stroke(Color.icForest.opacity(0.14), lineWidth: 4)

                Circle()
                    .trim(from: 0, to: progress)
                    .stroke(Color.icGold, style: StrokeStyle(lineWidth: 4, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                    .animation(.linear(duration: 0.25), value: progress)

                VStack(spacing: 2) {
                    Text(L10n.t("timerTotal"))
                        .font(.system(size: 10, weight: .regular))
                        .tracking(3)
                        .foregroundStyle(Color.icClay)

                    Text(format(engine.totalRemaining))
                        .font(.system(size: 46, weight: .light))
                        .monospacedDigit()
                        .foregroundStyle(Color.icForest)

                    VStack(spacing: 2) {
                        Text(L10n.t("timerStep"))
                            .font(.system(size: 9, weight: .regular))
                            .tracking(3)
                            .foregroundStyle(Color.icClay)
                        Text(format(engine.phaseRemaining))
                            .font(.system(size: 20, weight: .light))
                            .monospacedDigit()
                            .foregroundStyle(Color.icInkSoft)
                    }
                    .padding(.top, 10)
                    .overlay(alignment: .top) {
                        Rectangle()
                            .fill(Color.icForest.opacity(0.14))
                            .frame(width: 90, height: 1)
                    }
                }
            }
            .frame(width: 260, height: 260)
            .padding(.bottom, 28)

            Text(L10n.stepLabel(engine.currentPhase?.step ?? 1, of: engine.totalSteps))
                .font(.system(size: 12, weight: .light))
                .tracking(2)
                .foregroundStyle(Color.icInkSoft)
                .padding(.bottom, 40)

            // Steuerung
            HStack(spacing: 12) {
                Button {
                    engine.togglePause()
                } label: {
                    Text(engine.state == .paused ? L10n.t("btnResume") : L10n.t("btnPause"))
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(Color.icForest)
                        .padding(.horizontal, 20)
                        .padding(.vertical, 14)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.icForest.opacity(0.35)))
                }

                Button {
                    engine.skip()
                } label: {
                    Text(L10n.t("btnSkip"))
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(Color.icForest)
                        .padding(.horizontal, 20)
                        .padding(.vertical, 14)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.icForest.opacity(0.35)))
                }

                Button {
                    showStopConfirmation = true
                } label: {
                    Text(L10n.t("btnStop"))
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(Color.icClay)
                        .padding(.horizontal, 20)
                        .padding(.vertical, 14)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.icClay.opacity(0.4)))
                }
            }

            Spacer()
        }
        .padding(22)
        .confirmationDialog(L10n.t("confirmStop"), isPresented: $showStopConfirmation, titleVisibility: .visible) {
            Button(L10n.t("btnStop"), role: .destructive) {
                engine.stop()
            }
            Button(L10n.t("btnKeepMeditating"), role: .cancel) {}
        }
    }

    /// Fortschritt der gesamten Meditation (0…1)
    private var progress: CGFloat {
        let total = engine.totalDuration
        guard total > 0 else { return 0 }
        return min(1, 1 - engine.totalRemaining / total)
    }

    private func format(_ seconds: TimeInterval) -> String {
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

            Text(L10n.t("doneEyebrow"))
                .font(.system(size: 12, weight: .medium))
                .tracking(4)
                .foregroundStyle(Color.icClay)
                .padding(.top, 16)

            Text(L10n.t("doneTitle"))
                .font(.custom("Cormorant Garamond", size: 32).weight(.medium))
                .foregroundStyle(Color.icInk)
                .multilineTextAlignment(.center)

            Text(L10n.t("doneLead"))
                .font(.system(size: 15, weight: .light))
                .foregroundStyle(Color.icInkSoft)

            Button {
                dismiss()
            } label: {
                Text(L10n.t("btnBackHome"))
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
