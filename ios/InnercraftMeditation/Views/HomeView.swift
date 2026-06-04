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

            // Tages-Badge (z. B. „Heute ist Mittwoch")
            Text(L10n.todayBadge)
                .font(.system(size: 12, weight: .medium))
                .tracking(2)
                .foregroundStyle(Color.icBiolume)
                .padding(.top, 4)
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
                            label: (iteration.title?.isEmpty == false)
                                ? iteration.title!
                                : L10n.iterationFlowLabel(index + 1, hasInstruction: iteration.instructionFile != nil),
                            duration: L10n.minutesShort(Int(iteration.silenceMinutes))
                        )
                        Divider()
                    }

                    flowRow(icon: "◎",
                            label: (provider.journey.outroTitle?.isEmpty == false)
                                ? provider.journey.outroTitle!
                                : (provider.journey.outroFile != nil ? L10n.t("flowDeepGongOutro") : L10n.t("flowDeepGong")),
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

// MARK: - Die Qualle (Logo)

struct GongMark: View {
    var color: Color = .icBiolume

    @State private var pulse = false

    var body: some View {
        JellyfishShape()
            .stroke(color, style: StrokeStyle(lineWidth: 1.6, lineCap: .round, lineJoin: .round))
            .shadow(color: color.opacity(0.6), radius: 10)
            .scaleEffect(x: pulse ? 1.05 : 1.0, y: pulse ? 0.96 : 1.0, anchor: .top)
            .animation(.easeInOut(duration: 3.5).repeatForever(autoreverses: true), value: pulse)
            .onAppear { pulse = true }
    }
}

/// Die Qualle als Pfad — identisch mit dem SVG-Logo der Website (viewBox 48×64)
struct JellyfishShape: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        let sx = rect.width / 48
        let sy = rect.height / 64
        func pt(_ x: CGFloat, _ y: CGFloat) -> CGPoint { CGPoint(x: rect.minX + x * sx, y: rect.minY + y * sy) }

        // Schirm
        path.move(to: pt(9, 24))
        path.addCurve(to: pt(24, 5), control1: pt(9, 11.5), control2: pt(15.5, 5))
        path.addCurve(to: pt(39, 24), control1: pt(32.5, 5), control2: pt(39, 11.5))
        path.addCurve(to: pt(24, 28.5), control1: pt(34, 27.5), control2: pt(29, 28.5))
        path.addCurve(to: pt(9, 24), control1: pt(19, 28.5), control2: pt(14, 27.5))

        // Tentakel (außen)
        path.move(to: pt(12.5, 26.5))
        path.addCurve(to: pt(12, 45.5), control1: pt(11.5, 33), control2: pt(14, 39))
        path.addCurve(to: pt(11.5, 59), control1: pt(10.8, 49.5), control2: pt(13, 54))

        path.move(to: pt(17.5, 28))
        path.addCurve(to: pt(17, 49.5), control1: pt(16.5, 35.5), control2: pt(19, 42.5))
        path.addCurve(to: pt(17, 61), control1: pt(16.2, 52.8), control2: pt(18, 56.5))

        path.move(to: pt(24, 28.5))
        path.addCurve(to: pt(24, 51), control1: pt(24, 36.5), control2: pt(23, 44))
        path.addCurve(to: pt(24, 62.5), control1: pt(24.4, 54.5), control2: pt(23.6, 58.5))

        path.move(to: pt(30.5, 28))
        path.addCurve(to: pt(31, 49.5), control1: pt(31.5, 35.5), control2: pt(29, 42.5))
        path.addCurve(to: pt(31, 61), control1: pt(31.8, 52.8), control2: pt(30, 56.5))

        path.move(to: pt(35.5, 26.5))
        path.addCurve(to: pt(36, 45.5), control1: pt(36.5, 33), control2: pt(34, 39))
        path.addCurve(to: pt(36.5, 59), control1: pt(37.2, 49.5), control2: pt(35, 54))

        return path
    }
}

#Preview {
    HomeView()
        .environmentObject(JourneyProvider())
}
