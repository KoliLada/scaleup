/* ==========================================================================
   Innercraft Meditation — Mehrsprachigkeit (DE / EN / FR)
   Erkennt die Sprache (?lang= → gespeicherte Wahl → Browser) und stellt
   t() sowie applyTranslations() für die Oberfläche bereit.
   ========================================================================== */

"use strict";

const I18N_KEY = "innercraft-lang";
const SUPPORTED_LANGS = ["de", "en", "fr"];

const I18N = {
  de: {
    // Allgemein
    appTitle: "Innercraft Meditation",
    brandTag: "Meditation",

    // Home
    eyebrowHome: "Deine tägliche Praxis",
    homeTitle: "Komm zur Ruhe.<br />Werde präsent.",
    homeLead: "Lass dich führen: eine Meditation in einem Fluss — von der geführten Eingangs-Meditation über Impulse und Stille bis zum Gong, der dich in deinen Tag entlässt.",
    flowTitle: "Die Reise heute",
    flowLoading: "Lade die Journey …",
    btnStart: "Meditation beginnen",
    flowTotal: (min) => `Gesamt ca. ${min} Minuten`,
    flowIteration: (n, hasInstruction) => `Iteration ${n}: ${hasInstruction ? "Anweisung · " : ""}Stille · Gong`,
    flowDeepGongOutro: "Tieferer Gong · Outro",
    flowDeepGong: "Tieferer Gong",
    flowFinalGong: "Ganz tiefer Gong — Abschluss",
    durationMin: (m) => `${m} Min.`,
    durationSec: (s) => `${s} Sek.`,

    // Session
    phaseIntroLabel: "Eingangs-Meditation",
    phaseIntroTitle: "Geführte Meditation",
    phaseIterationLabel: (n, total) => `Iteration ${n} von ${total}`,
    phaseInstruction: "Anweisung",
    phaseSilence: "Stille",
    phaseGong: "Gong",
    phaseTransition: "Übergang",
    phaseOutro: "Outro",
    phaseDeepGong: "Tieferer Gong",
    phaseFinal: "Abschluss",
    phaseFinalGong: "Tiefer Gong",
    sessionStep: (n, total) => `Schritt ${n} von ${total}`,
    btnPause: "Pause",
    btnResume: "Fortsetzen",
    btnStop: "Beenden",
    confirmStop: "Meditation wirklich beenden?",

    // Abschluss
    eyebrowDone: "Meditation abgeschlossen",
    doneTitle: "Jetzt bist du präsent<br />und gerüstet für deinen Tag.",
    doneLead: "Wir wünschen dir einen schönen Tag.",
    btnBackHome: "Zurück zum Start",

    // Installation
    installTitle: "Als App auf dein iPhone",
    installIntro: "Du kannst diese Seite wie eine echte App auf deinem iPhone installieren — mit dem Innercraft-Symbol auf dem Home-Bildschirm:",
    installStep1: "Öffne diese Seite in <strong>Safari</strong>",
    installStep2Pre: "Tippe unten auf das <strong>Teilen-Symbol</strong>",
    installStep2Post: "(Quadrat mit Pfeil nach oben)",
    installStep3: "Wähle <strong>„Zum Home-Bildschirm“</strong>",
    installStep4: "Tippe oben rechts auf <strong>„Hinzufügen“</strong>",
    installNote: "Ab jetzt startest du deine Meditation direkt vom Home-Bildschirm — im Vollbild, ohne Browser-Leisten.",
  },

  en: {
    // General
    appTitle: "Innercraft Meditation",
    brandTag: "Meditation",

    // Home
    eyebrowHome: "Your daily practice",
    homeTitle: "Come to stillness.<br />Become present.",
    homeLead: "Let yourself be guided: one meditation in one flow — from the guided opening meditation through prompts and stillness to the gong that releases you into your day.",
    flowTitle: "Today's journey",
    flowLoading: "Loading the journey …",
    btnStart: "Begin meditation",
    flowTotal: (min) => `About ${min} minutes in total`,
    flowIteration: (n, hasInstruction) => `Iteration ${n}: ${hasInstruction ? "Instruction · " : ""}Stillness · Gong`,
    flowDeepGongOutro: "Deeper gong · Closing words",
    flowDeepGong: "Deeper gong",
    flowFinalGong: "Deepest gong — completion",
    durationMin: (m) => `${m} min`,
    durationSec: (s) => `${s} sec`,

    // Session
    phaseIntroLabel: "Opening meditation",
    phaseIntroTitle: "Guided meditation",
    phaseIterationLabel: (n, total) => `Iteration ${n} of ${total}`,
    phaseInstruction: "Instruction",
    phaseSilence: "Stillness",
    phaseGong: "Gong",
    phaseTransition: "Transition",
    phaseOutro: "Closing words",
    phaseDeepGong: "Deeper gong",
    phaseFinal: "Completion",
    phaseFinalGong: "Deep gong",
    sessionStep: (n, total) => `Step ${n} of ${total}`,
    btnPause: "Pause",
    btnResume: "Resume",
    btnStop: "End",
    confirmStop: "Really end this meditation?",

    // Done
    eyebrowDone: "Meditation complete",
    doneTitle: "You are present now<br />and prepared for your day.",
    doneLead: "We wish you a beautiful day.",
    btnBackHome: "Back to start",

    // Install
    installTitle: "As an app on your iPhone",
    installIntro: "You can install this page like a real app on your iPhone — with the Innercraft symbol on your home screen:",
    installStep1: "Open this page in <strong>Safari</strong>",
    installStep2Pre: "Tap the <strong>share icon</strong> at the bottom",
    installStep2Post: "(square with an arrow pointing up)",
    installStep3: "Choose <strong>“Add to Home Screen”</strong>",
    installStep4: "Tap <strong>“Add”</strong> in the top right corner",
    installNote: "From now on, you start your meditation right from your home screen — full screen, without browser bars.",
  },

  fr: {
    // Général
    appTitle: "Méditation Innercraft",
    brandTag: "Méditation",

    // Accueil
    eyebrowHome: "Ta pratique quotidienne",
    homeTitle: "Trouve le calme.<br />Deviens présent·e.",
    homeLead: "Laisse-toi guider : une méditation d'un seul flux — de la méditation d'ouverture guidée, en passant par les impulsions et le silence, jusqu'au gong qui te libère dans ta journée.",
    flowTitle: "Le voyage d'aujourd'hui",
    flowLoading: "Chargement du voyage …",
    btnStart: "Commencer la méditation",
    flowTotal: (min) => `Environ ${min} minutes au total`,
    flowIteration: (n, hasInstruction) => `Itération ${n} : ${hasInstruction ? "Instruction · " : ""}Silence · Gong`,
    flowDeepGongOutro: "Gong plus profond · Mot de clôture",
    flowDeepGong: "Gong plus profond",
    flowFinalGong: "Gong le plus profond — clôture",
    durationMin: (m) => `${m} min`,
    durationSec: (s) => `${s} s`,

    // Séance
    phaseIntroLabel: "Méditation d'ouverture",
    phaseIntroTitle: "Méditation guidée",
    phaseIterationLabel: (n, total) => `Itération ${n} sur ${total}`,
    phaseInstruction: "Instruction",
    phaseSilence: "Silence",
    phaseGong: "Gong",
    phaseTransition: "Transition",
    phaseOutro: "Mot de clôture",
    phaseDeepGong: "Gong plus profond",
    phaseFinal: "Clôture",
    phaseFinalGong: "Gong profond",
    sessionStep: (n, total) => `Étape ${n} sur ${total}`,
    btnPause: "Pause",
    btnResume: "Reprendre",
    btnStop: "Terminer",
    confirmStop: "Vraiment terminer cette méditation ?",

    // Fin
    eyebrowDone: "Méditation terminée",
    doneTitle: "Tu es présent·e maintenant,<br />prêt·e pour ta journée.",
    doneLead: "Nous te souhaitons une belle journée.",
    btnBackHome: "Retour à l'accueil",

    // Installation
    installTitle: "Comme application sur ton iPhone",
    installIntro: "Tu peux installer cette page comme une vraie application sur ton iPhone — avec le symbole Innercraft sur ton écran d'accueil :",
    installStep1: "Ouvre cette page dans <strong>Safari</strong>",
    installStep2Pre: "Touche le <strong>symbole de partage</strong> en bas",
    installStep2Post: "(carré avec une flèche vers le haut)",
    installStep3: "Choisis <strong>« Sur l'écran d'accueil »</strong>",
    installStep4: "Touche <strong>« Ajouter »</strong> en haut à droite",
    installNote: "Désormais, tu lances ta méditation directement depuis ton écran d'accueil — en plein écran, sans barres de navigateur.",
  },
};

/** Ermittelt die aktive Sprache: ?lang= → gespeicherte Wahl → Browser → Deutsch */
function detectLang() {
  const fromUrl = new URLSearchParams(location.search).get("lang");
  if (SUPPORTED_LANGS.includes(fromUrl)) {
    try { localStorage.setItem(I18N_KEY, fromUrl); } catch { /* privater Modus */ }
    return fromUrl;
  }

  try {
    const stored = localStorage.getItem(I18N_KEY);
    if (SUPPORTED_LANGS.includes(stored)) return stored;
  } catch { /* privater Modus */ }

  const browser = (navigator.language || "de").slice(0, 2);
  return SUPPORTED_LANGS.includes(browser) ? browser : "de";
}

const LANG = detectLang();

/** Übersetzung abrufen; Funktions-Einträge werden mit den Argumenten aufgerufen */
function t(key, ...args) {
  const entry = (I18N[LANG] && I18N[LANG][key]) ?? I18N.de[key] ?? key;
  return typeof entry === "function" ? entry(...args) : entry;
}

/** Sprache wechseln (speichert die Wahl und lädt die Seite neu) */
function setLang(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) return;
  try { localStorage.setItem(I18N_KEY, lang); } catch { /* privater Modus */ }
  const url = new URL(location.href);
  url.searchParams.delete("lang");
  location.href = url.toString();
}

/** Statische Texte ersetzen: alle Elemente mit data-i18n="key" (HTML erlaubt) */
function applyTranslations() {
  document.documentElement.lang = LANG;
  document.title = t("appTitle");

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.innerHTML = t(el.dataset.i18n);
  });

  // Aktive Sprache im Umschalter markieren
  document.querySelectorAll("[data-set-lang]").forEach((el) => {
    el.classList.toggle("is-current", el.dataset.setLang === LANG);
    el.addEventListener("click", (e) => {
      e.preventDefault();
      setLang(el.dataset.setLang);
    });
  });
}
