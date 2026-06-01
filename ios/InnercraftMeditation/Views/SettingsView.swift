//
//  SettingsView.swift
//  Innercraft Meditation
//
//  Einstellungen: Eingangs-Meditation, Anzahl & Dauer der Iterationen, Outro.
//

import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var settings: MeditationSettings
    @EnvironmentObject private var intro: IntroProvider

    var body: some View {
        ZStack {
            Color.icPaper.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Text("EINSTELLUNGEN")
                        .font(.system(size: 12, weight: .medium))
                        .tracking(4)
                        .foregroundStyle(Color.icClay)

                    Text("Ablauf & Dauer")
                        .font(.custom("Cormorant Garamond", size: 34).weight(.medium))
                        .foregroundStyle(Color.icInk)

                    introCard
                    iterationsCard
                    outroCard
                }
                .padding(22)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
    }

    // MARK: Eingangs-Meditation

    private var introCard: some View {
        card("Eingangs-Meditation") {
            Toggle(isOn: $settings.introEnabled) {
                Text("Geführte Meditation (Willigis Jäger) abspielen")
                    .font(.custom("Cormorant Garamond", size: 17))
                    .foregroundStyle(Color.icInk)
            }
            .tint(Color.icMoss)

            Text(introStatusText)
                .font(.system(size: 13, weight: .light))
                .foregroundStyle(Color.icInkSoft)
        }
    }

    private var introStatusText: String {
        switch intro.state {
        case .unknown: return "Prüfe Verfügbarkeit …"
        case .downloading: return "Wird geladen …"
        case .available:
            if let duration = intro.duration {
                return "Hinterlegt (\(Int((duration / 60).rounded())) Min.) — auch offline verfügbar."
            }
            return "Hinterlegt — auch offline verfügbar."
        case .unavailable:
            return "Noch nicht verfügbar — die zentrale Datei ist nicht hinterlegt."
        }
    }

    // MARK: Iterationen

    private var iterationsCard: some View {
        card("Iterationen") {
            Text("Jede Iteration beginnt mit deiner Anweisung, gefolgt von Stille, und endet mit einem Gong.")
                .font(.system(size: 13, weight: .light))
                .foregroundStyle(Color.icInkSoft)

            HStack {
                Text("Anzahl der Iterationen")
                    .font(.custom("Cormorant Garamond", size: 17))
                    .foregroundStyle(Color.icInk)
                Spacer()
                Stepper(
                    value: $settings.iterationCount,
                    in: MeditationConfig.minIterations...MeditationConfig.maxIterations
                ) {
                    Text("\(settings.iterationCount)")
                        .font(.system(size: 18, weight: .regular))
                        .foregroundStyle(Color.icInk)
                }
                .fixedSize()
            }

            ForEach(0..<settings.iterationCount, id: \.self) { index in
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text("Stille in Iteration \(index + 1)")
                            .font(.custom("Cormorant Garamond", size: 17))
                            .foregroundStyle(Color.icInk)
                        Spacer()
                        Text("\(Int(settings.iterationMinutes[index])) Min.")
                            .font(.system(size: 15))
                            .foregroundStyle(Color.icClay)
                    }
                    Slider(
                        value: Binding(
                            get: { settings.iterationMinutes[index] },
                            set: { settings.iterationMinutes[index] = $0.rounded() }
                        ),
                        in: 1...60,
                        step: 1
                    )
                    .tint(Color.icGold)
                }
                .padding(.top, 4)
            }
        }
    }

    // MARK: Outro

    private var outroCard: some View {
        card("Outro") {
            Text("Nach der letzten Iteration ertönt ein tieferer Gong, dann dein Outro-Satz, und zum Abschluss der ganz tiefe Gong.")
                .font(.system(size: 13, weight: .light))
                .foregroundStyle(Color.icInkSoft)

            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text("Stille vor dem Outro")
                        .font(.custom("Cormorant Garamond", size: 17))
                        .foregroundStyle(Color.icInk)
                    Spacer()
                    Text(settings.outroPauseMinutes > 0 ? "\(Int(settings.outroPauseMinutes)) Min." : "Keine")
                        .font(.system(size: 15))
                        .foregroundStyle(Color.icClay)
                }
                Slider(value: $settings.outroPauseMinutes, in: 0...10, step: 1)
                    .tint(Color.icGold)
            }
        }
    }

    // MARK: Hilfen

    private func card<Content: View>(_ title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(title)
                .font(.custom("Cormorant Garamond", size: 22).weight(.semibold))
                .foregroundStyle(Color.icInk)
            content()
        }
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.icCream)
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.icForest.opacity(0.12)))
    }
}

#Preview {
    NavigationStack {
        SettingsView()
            .environmentObject(MeditationSettings())
            .environmentObject(IntroProvider())
    }
}
