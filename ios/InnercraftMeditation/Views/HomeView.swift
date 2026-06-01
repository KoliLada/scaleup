//
//  HomeView.swift
//  Innercraft Meditation
//
//  Startbildschirm: zeigt die zentral festgelegte Journey und startet sie.
//

import SwiftUI

struct HomeView: View {
    @EnvironmentObject private var provider: JourneyProvider

    @StateObject private var engine = MeditationEngine()
    @State private var showSession = false

    var body: some View {
        ZStack {
            Color.icPaper.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    header

                    flowCard

                    if provider.state == .offline {
                        notice(L10n.t("offlineNotice"))
                    }

                    startButton
                }
                .padding(22)
            }
            .refreshable {
                await provider.refresh()
            }
        }
        .fullScreenCover(isPresented: $showSession) {
            SessionView(engine: engine)
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

            Text(L10n.t("eyebrowHome"))
                .font(.system(size: 12, weight: .medium))
                .tracking(4)
                .foregroundStyle(Color.icClay)

            Text(L10n.t("homeTitle"))
                .font(.custom("Cormorant Garamond", size: 38).weight(.medium))
                .foregroundStyle(Color.icInk)
                .lineSpacing(2)

            Text(L10n.t("homeLead"))
                .font(.system(size: 15, weight: .light))
                .foregroundStyle(Color.icInkSoft)
                .padding(.top, 6)
        }
    }

    private var flowCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(L10n.t("flowTitle"))
                .font(.custom("Cormorant Garamond", size: 22).weight(.semibold))
                .foregroundStyle(Color.icInk)

            if provider.state == .loading {
                HStack(spacing: 10) {
                    ProgressView()
                    Text(L10n.t("flowLoading"))
                        .font(.system(size: 14, weight: .light))
                        .foregroundStyle(Color.icInkSoft)
                }
                .padding(.vertical, 12)
            } else {
                VStack(spacing: 0) {
                    if let intro = provider.journey.intro,
                       provider.localAudioURL(for: intro.file) != nil {
                        flowRow(icon: "◉", label: intro.title,
                                duration: provider.introDuration.map { L10n.minutesShort(Int(($0 / 60).rounded())) })
                        Divider()
                    }

                    ForEach(Array(provider.journey.iterations.enumerated()), id: \.offset) { index, iteration in
                        flowRow(
                            icon: "\(index + 1)",
                            label: L10n.iterationFlowLabel(index + 1, hasInstruction: iteration.instructionFile != nil),
                            duration: L10n.minutesShort(Int(iteration.silenceMinutes))
                        )
                        Divider()
                    }

                    flowRow(icon: "◎",
                            label: provider.journey.outroFile != nil ? L10n.t("flowDeepGongOutro") : L10n.t("flowDeepGong"),
                            duration: nil)
                    Divider()
                    flowRow(icon: "●", label: L10n.t("flowFinalGong"), duration: nil)
                }

                HStack {
                    Spacer()
                    Text(L10n.totalMinutes(Int((provider.estimatedTotalSeconds / 60).rounded())))
                        .font(.system(size: 13, weight: .regular))
                        .foregroundStyle(Color.icClay)
                }
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
            engine.start(provider: provider)
            showSession = true
        } label: {
            Text(L10n.t("btnStart"))
                .font(.system(size: 17, weight: .medium))
                .tracking(1)
                .foregroundStyle(Color.icCream)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 18)
                .background(Color.icForest)
                .clipShape(RoundedRectangle(cornerRadius: 8))
        }
        .disabled(provider.state == .loading)
        .opacity(provider.state == .loading ? 0.5 : 1)
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
        .environmentObject(JourneyProvider())
}
