//
//  HomeView.swift
//  Innercraft Meditation
//
//  Startbildschirm: Ablauf-Übersicht und Einstieg in die Meditation.
//

import SwiftUI

struct HomeView: View {
    @EnvironmentObject private var settings: MeditationSettings
    @EnvironmentObject private var recordings: RecordingStore
    @EnvironmentObject private var intro: IntroProvider

    @StateObject private var engine = MeditationEngine()
    @State private var showSession = false

    var body: some View {
        NavigationStack {
            ZStack {
                Color.icPaper.ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 24) {
                        header

                        flowCard

                        if settings.introEnabled && intro.state == .unavailable {
                            notice("Die geführte Eingangs-Meditation ist noch nicht verfügbar. Sie wird automatisch geladen, sobald sie zentral hinterlegt ist. Bis dahin beginnt die Meditation mit der ersten Iteration.")
                        }

                        if !recordings.hasRecording(for: .instruction1) {
                            notice("Du hast noch keine Anweisungen aufgenommen. Gehe zu „Aufnahmen“, um deine Iterations-Anweisungen und den Outro-Satz mit deiner eigenen Stimme aufzusprechen.")
                        }

                        startButton

                        navButtons
                    }
                    .padding(22)
                }
            }
            .navigationBarHidden(true)
            .fullScreenCover(isPresented: $showSession) {
                SessionView(engine: engine)
            }
        }
    }

    // MARK: Bausteine

    private var header: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 10) {
                GongMark()
                    .frame(width: 32, height: 32)
                VStack(alignment: .leading, spacing: 0) {
                    Text("Innercraft")
                        .font(.custom("Cormorant Garamond", size: 22).weight(.semibold))
                        .foregroundStyle(Color.icForest)
                    Text("MEDITATION")
                        .font(.system(size: 10, weight: .medium))
                        .tracking(4)
                        .foregroundStyle(Color.icClay)
                }
            }
            .padding(.bottom, 18)

            Text("DEINE TÄGLICHE PRAXIS")
                .font(.system(size: 12, weight: .medium))
                .tracking(4)
                .foregroundStyle(Color.icClay)

            Text("Komm zur Ruhe.\nWerde präsent.")
                .font(.custom("Cormorant Garamond", size: 38).weight(.medium))
                .foregroundStyle(Color.icInk)
                .lineSpacing(2)
        }
    }

    private var flowCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Dein Ablauf")
                .font(.custom("Cormorant Garamond", size: 22).weight(.semibold))
                .foregroundStyle(Color.icInk)

            VStack(spacing: 0) {
                if settings.introEnabled && intro.state == .available {
                    flowRow(icon: "◉", label: "Geführte Meditation (Willigis Jäger)",
                            duration: intro.duration.map { "\(Int(($0 / 60).rounded())) Min." })
                    Divider()
                }

                ForEach(0..<settings.iterationCount, id: \.self) { index in
                    flowRow(icon: "\(index + 1)",
                            label: "Iteration \(index + 1): Anweisung · Stille · Gong",
                            duration: "\(Int(settings.iterationMinutes[index])) Min.")
                    Divider()
                }

                flowRow(icon: "◎", label: "Tieferer Gong · Outro-Satz", duration: nil)
                Divider()
                flowRow(icon: "●", label: "Ganz tiefer Gong — Abschluss", duration: nil)
            }

            HStack {
                Spacer()
                Text("Gesamt ca. \(Int((settings.estimatedTotalSeconds(introDuration: intro.duration) / 60).rounded())) Minuten")
                    .font(.system(size: 13, weight: .regular))
                    .foregroundStyle(Color.icClay)
            }
        }
        .padding(20)
        .background(Color.icCream)
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.icForest.opacity(0.12)))
    }

    private func flowRow(icon: String, label: String, duration: String?) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 12) {
            Text(icon)
                .font(.system(size: 12))
                .foregroundStyle(Color.icGold)
                .frame(width: 18)
            Text(label)
                .font(.custom("Cormorant Garamond", size: 17))
                .foregroundStyle(Color.icInk)
            Spacer()
            if let duration {
                Text(duration)
                    .font(.system(size: 13, weight: .light))
                    .foregroundStyle(Color.icInkSoft)
            }
        }
        .padding(.vertical, 9)
    }

    private func notice(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 14, weight: .light))
            .foregroundStyle(Color.icInk)
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.icGold.opacity(0.14))
            .clipShape(RoundedRectangle(cornerRadius: 8))
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.icGold.opacity(0.4)))
    }

    private var startButton: some View {
        Button {
            engine.start(settings: settings, recordings: recordings, intro: intro)
            showSession = true
        } label: {
            Text("Meditation beginnen")
                .font(.system(size: 17, weight: .medium))
                .tracking(1)
                .foregroundStyle(Color.icCream)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 18)
                .background(Color.icForest)
                .clipShape(RoundedRectangle(cornerRadius: 8))
        }
    }

    private var navButtons: some View {
        HStack(spacing: 10) {
            NavigationLink {
                SettingsView()
            } label: {
                navButtonLabel("Ablauf & Dauer")
            }

            NavigationLink {
                RecordingsView()
            } label: {
                navButtonLabel("Aufnahmen")
            }
        }
    }

    private func navButtonLabel(_ title: String) -> some View {
        Text(title)
            .font(.system(size: 14, weight: .medium))
            .tracking(0.5)
            .foregroundStyle(Color.icForest)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.icForest.opacity(0.35)))
    }
}

// MARK: - Gong-Symbol

struct GongMark: View {
    var color: Color = .icForest

    var body: some View {
        GeometryReader { geo in
            let size = min(geo.size.width, geo.size.height)
            ZStack {
                Circle().stroke(color.opacity(0.55), lineWidth: size * 0.03)
                Circle().stroke(color.opacity(0.75), lineWidth: size * 0.03)
                    .frame(width: size * 0.64, height: size * 0.64)
                Circle().fill(color.opacity(0.9))
                    .frame(width: size * 0.38, height: size * 0.38)
                Circle().fill(Color.icCream)
                    .frame(width: size * 0.14, height: size * 0.14)
            }
        }
    }
}

#Preview {
    HomeView()
        .environmentObject(MeditationSettings())
        .environmentObject(RecordingStore())
        .environmentObject(IntroProvider())
}
