//
//  L10n.swift
//  Innercraft Meditation
//
//  Mehrsprachigkeit (Deutsch / Englisch / Französisch).
//  Die Sprache richtet sich nach der Geräte-Sprache; Deutsch ist der Standard.
//

import Foundation

enum L10n {

    /// Aktive Sprache: "de", "en" oder "fr"
    static let lang: String = {
        let device = Locale.preferredLanguages.first?.prefix(2).lowercased() ?? "de"
        return ["de", "en", "fr"].contains(device) ? String(device) : "de"
    }()

    /// Heutiger Wochentag als 1 (Montag) … 7 (Sonntag)
    static var currentJourneyDay: Int {
        // Calendar: 1 = Sonntag … 7 = Samstag → auf Montag=1…Sonntag=7 umrechnen
        let weekday = Calendar.current.component(.weekday, from: Date())
        return weekday == 1 ? 7 : weekday - 1
    }

    /// Journey-Datei der aktiven Sprache & eines Tags (Tag 1 = Bestandsdatei)
    static func journeyFilename(day: Int = 1) -> String {
        let base = lang == "de" ? "journey" : "journey-\(lang)"
        return day > 1 ? "\(base)-day\(day).json" : "\(base).json"
    }

    // MARK: - Übersetzungen

    private static let table: [String: [String: String]] = [
        // Home
        "eyebrowHome": [
            "de": "DEINE TÄGLICHE PRAXIS",
            "en": "YOUR DAILY PRACTICE",
            "fr": "TA PRATIQUE QUOTIDIENNE",
        ],
        "homeTitle": [
            "de": "Komm zur Ruhe.\nWerde präsent.",
            "en": "Come to stillness.\nBecome present.",
            "fr": "Trouve le calme.\nDeviens présent·e.",
        ],
        "homeLead": [
            "de": "Lass dich führen: eine Meditation in einem Fluss — von der geführten Eingangs-Meditation über Impulse und Stille bis zum Gong, der dich in deinen Tag entlässt.",
            "en": "Let yourself be guided: one meditation in one flow — from the guided opening meditation through prompts and silence to the gong that releases you into your day.",
            "fr": "Laisse-toi guider : une méditation d'un seul flux — de la méditation d'ouverture guidée, en passant par les impulsions et le silence, jusqu'au gong qui te libère dans ta journée.",
        ],
        "flowTitle": [
            "de": "Die Reise heute",
            "en": "Today's journey",
            "fr": "Le voyage d'aujourd'hui",
        ],
        "flowLoading": [
            "de": "Lade die Journey …",
            "en": "Loading the journey …",
            "fr": "Chargement du voyage …",
        ],
        "btnStart": [
            "de": "Meditation beginnen",
            "en": "Begin meditation",
            "fr": "Commencer la méditation",
        ],
        "offlineNotice": [
            "de": "Keine Verbindung — es wird die zuletzt geladene Journey verwendet. Sobald du wieder online bist, wird die aktuelle Journey automatisch geladen.",
            "en": "No connection — the last loaded journey is being used. As soon as you are online again, the current journey will be loaded automatically.",
            "fr": "Pas de connexion — le dernier voyage chargé est utilisé. Dès que tu seras de nouveau en ligne, le voyage actuel sera chargé automatiquement.",
        ],
        "flowDeepGongOutro": [
            "de": "Tieferer Gong · Outro",
            "en": "Deeper gong · Closing words",
            "fr": "Gong plus profond · Mot de clôture",
        ],
        "flowDeepGong": [
            "de": "Tieferer Gong",
            "en": "Deeper gong",
            "fr": "Gong plus profond",
        ],
        "flowFinalGong": [
            "de": "Ganz tiefer Gong — Abschluss",
            "en": "Deepest gong — completion",
            "fr": "Gong le plus profond — clôture",
        ],

        // Phasen
        "phaseBegin": [
            "de": "Beginn",
            "en": "Beginning",
            "fr": "Début",
        ],
        "phaseIntroLabel": [
            "de": "Eingangs-Meditation",
            "en": "Opening meditation",
            "fr": "Méditation d'ouverture",
        ],
        "phaseIntroTitle": [
            "de": "Geführte Meditation",
            "en": "Guided meditation",
            "fr": "Méditation guidée",
        ],
        "phaseInstruction": [
            "de": "Anweisung",
            "en": "Instruction",
            "fr": "Instruction",
        ],
        "phaseSilence": [
            "de": "Stille",
            "en": "Silence",
            "fr": "Silence",
        ],
        "phaseGong": [
            "de": "Gong",
            "en": "Gong",
            "fr": "Gong",
        ],
        "phaseTransition": [
            "de": "Übergang",
            "en": "Transition",
            "fr": "Transition",
        ],
        "phaseOutro": [
            "de": "Outro",
            "en": "Closing words",
            "fr": "Mot de clôture",
        ],
        "phaseDeepGong": [
            "de": "Tieferer Gong",
            "en": "Deeper gong",
            "fr": "Gong plus profond",
        ],
        "phaseFinal": [
            "de": "Abschluss",
            "en": "Completion",
            "fr": "Clôture",
        ],
        "phaseFinalGong": [
            "de": "Tiefer Gong",
            "en": "Deep gong",
            "fr": "Gong profond",
        ],

        // Session
        "btnPause": [
            "de": "Pause",
            "en": "Pause",
            "fr": "Pause",
        ],
        "btnResume": [
            "de": "Fortsetzen",
            "en": "Resume",
            "fr": "Reprendre",
        ],
        "btnStop": [
            "de": "Beenden",
            "en": "End",
            "fr": "Terminer",
        ],
        "timerTotal": [
            "de": "GESAMT",
            "en": "TOTAL",
            "fr": "TOTAL",
        ],
        "timerStep": [
            "de": "DIESER SCHRITT",
            "en": "THIS STEP",
            "fr": "CETTE ÉTAPE",
        ],
        "btnSkip": [
            "de": "Überspringen",
            "en": "Skip",
            "fr": "Passer",
        ],
        "btnKeepMeditating": [
            "de": "Weiter meditieren",
            "en": "Keep meditating",
            "fr": "Continuer à méditer",
        ],
        "confirmStop": [
            "de": "Meditation wirklich beenden?",
            "en": "Really end this meditation?",
            "fr": "Vraiment terminer cette méditation ?",
        ],

        // Abschluss
        "doneEyebrow": [
            "de": "MEDITATION ABGESCHLOSSEN",
            "en": "MEDITATION COMPLETE",
            "fr": "MÉDITATION TERMINÉE",
        ],
        "doneTitle": [
            "de": "Jetzt bist du präsent\nund gerüstet für deinen Tag.",
            "en": "You are present now\nand prepared for your day.",
            "fr": "Tu es présent·e maintenant,\nprêt·e pour ta journée.",
        ],
        "doneLead": [
            "de": "Wir wünschen dir einen schönen Tag.",
            "en": "We wish you a beautiful day.",
            "fr": "Nous te souhaitons une belle journée.",
        ],
        "btnBackHome": [
            "de": "Zurück zum Start",
            "en": "Back to start",
            "fr": "Retour à l'accueil",
        ],
    ]

    /// Übersetzung für einen Schlüssel in der aktiven Sprache
    static func t(_ key: String) -> String {
        table[key]?[lang] ?? table[key]?["de"] ?? key
    }

    // MARK: - Formatierte Texte

    static func iterationFlowLabel(_ n: Int, hasInstruction: Bool) -> String {
        switch lang {
        case "en": return "Iteration \(n): \(hasInstruction ? "Instruction · " : "")Silence · Gong"
        case "fr": return "Itération \(n) : \(hasInstruction ? "Instruction · " : "")Silence · Gong"
        default:   return "Iteration \(n): \(hasInstruction ? "Anweisung · " : "")Stille · Gong"
        }
    }

    static func iterationPhaseLabel(_ n: Int, of total: Int) -> String {
        switch lang {
        case "en": return "Iteration \(n) of \(total)"
        case "fr": return "Itération \(n) sur \(total)"
        default:   return "Iteration \(n) von \(total)"
        }
    }

    static func stepLabel(_ n: Int, of total: Int) -> String {
        switch lang {
        case "en": return "STEP \(n) OF \(total)"
        case "fr": return "ÉTAPE \(n) SUR \(total)"
        default:   return "SCHRITT \(n) VON \(total)"
        }
    }

    static func totalMinutes(_ minutes: Int) -> String {
        switch lang {
        case "en": return "About \(minutes) minutes in total"
        case "fr": return "Environ \(minutes) minutes au total"
        default:   return "Gesamt ca. \(minutes) Minuten"
        }
    }

    static func minutesShort(_ minutes: Int) -> String {
        switch lang {
        case "en": return "\(minutes) min"
        case "fr": return "\(minutes) min"
        default:   return "\(minutes) Min."
        }
    }

    // MARK: - Wochentage

    private static let weekdayNames: [String: [String]] = [
        "de": ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"],
        "en": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "fr": ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"],
    ]

    /// Name des heutigen Wochentags in der aktiven Sprache
    static var todayWeekdayName: String {
        let names = weekdayNames[lang] ?? weekdayNames["de"]!
        return names[currentJourneyDay - 1]
    }

    /// „Heute ist Mittwoch" / „Today is Wednesday" / „Aujourd'hui, c'est mercredi"
    static var todayBadge: String {
        switch lang {
        case "en": return "Today is \(todayWeekdayName)"
        case "fr": return "Aujourd'hui, c'est \(todayWeekdayName.lowercased())"
        default:   return "Heute ist \(todayWeekdayName)"
        }
    }
}
