/* ==========================================================================
   Innercraft Meditation — Zentrale Journey (mehrsprachig, 7 Tage)
   Lädt die vom Autor festgelegte Journey der jeweiligen Sprache und des
   jeweiligen Wochentags. Wird von der Nutzer-App und vom Autoren-Modus
   gemeinsam verwendet.

   Journey-Dateien (Tag 1 = Montag … Tag 7 = Sonntag):
     Deutsch  Tag 1 → audio/journey.json          (Bestand)
     Deutsch  Tag N → audio/journey-day{N}.json
     Englisch Tag 1 → audio/journey-en.json        (Bestand)
     Englisch Tag N → audio/journey-en-day{N}.json
     Französ. Tag 1 → audio/journey-fr.json        (Bestand)
     Französ. Tag N → audio/journey-fr-day{N}.json

   Eigene Titel: intro.title, jede iteration.title und outroTitle sind
   optional. Sind sie gesetzt, erscheinen sie in der App und in der
   Übersicht statt der Standard-Bezeichnungen.
   ========================================================================== */

"use strict";

const AUDIO_BASE = "audio/";

const GONG_FILE = "gong.wav";
const GONG_DEEP_FILE = "gong-deep.wav";
const GONG_DEEPEST_FILE = "gong-deepest.wav";

const JOURNEY_DAYS = 7; // Montag (1) bis Sonntag (7)

/** Tag der Woche als 1 (Montag) … 7 (Sonntag) */
function currentJourneyDay() {
  const js = new Date().getDay(); // 0 = Sonntag … 6 = Samstag
  return js === 0 ? 7 : js;
}

/** Pfad der Journey-Datei einer Sprache & eines Tags (Tag 1 = Bestandsdatei) */
function journeyUrl(lang, day = 1) {
  const base = lang === "de" ? "journey" : `journey-${lang}`;
  const name = day && day > 1 ? `${base}-day${day}.json` : `${base}.json`;
  return AUDIO_BASE + name;
}

/** Standard-Journey (Vorlage), falls die jeweilige Datei (noch) nicht erreichbar ist */
function defaultJourney(lang) {
  return {
    version: 2,
    intro: lang === "de"
      ? { file: "intro-meditation.m4a", title: "Geführte Meditation (Willigis Jäger)" }
      : null,
    iterations: [
      { title: null, instructionFile: null, silenceMinutes: 5 },
      { title: null, instructionFile: null, silenceMinutes: 6 },
    ],
    outroPauseMinutes: 0,
    outroFile: null,
    outroTitle: null,
  };
}

/**
 * Lädt die zentrale Journey-Definition einer Sprache & eines Tags.
 * Fällt ein Tag aus (Datei fehlt/leer), wird auf Tag 1 zurückgegriffen.
 * Cache wird umgangen, damit Änderungen des Autors sofort ankommen.
 */
async function loadJourney(lang = "de", day = 1, allowFallback = true) {
  try {
    const res = await fetch(`${journeyUrl(lang, day)}?t=${Date.now()}`, { cache: "no-store" });
    if (res.ok) {
      const journey = await res.json();
      return normalizeJourney(journey, defaultJourney(lang));
    }
  } catch {
    /* Netz-/Parse-Fehler — unten behandelt */
  }
  // Tag nicht vorhanden → auf Tag 1 zurückfallen (nur einmal)
  if (allowFallback && day !== 1) {
    return loadJourney(lang, 1, false);
  }
  return structuredClone(defaultJourney(lang));
}

/** Stellt sicher, dass alle Felder vorhanden und gültig sind */
function normalizeJourney(journey, fallback) {
  const result = structuredClone(fallback);

  if (journey && typeof journey === "object") {
    if (journey.intro && typeof journey.intro.file === "string") {
      result.intro = {
        file: journey.intro.file,
        title: journey.intro.title || (result.intro && result.intro.title) || "",
      };
    } else {
      result.intro = null;
    }

    if (Array.isArray(journey.iterations) && journey.iterations.length > 0) {
      result.iterations = journey.iterations.map((iteration) => ({
        title: typeof iteration.title === "string" && iteration.title.trim() ? iteration.title.trim() : null,
        instructionFile: typeof iteration.instructionFile === "string" ? iteration.instructionFile : null,
        silenceMinutes: iteration.silenceMinutes > 0 ? Number(iteration.silenceMinutes) : 5,
      }));
    }

    result.outroPauseMinutes = journey.outroPauseMinutes > 0 ? Number(journey.outroPauseMinutes) : 0;
    result.outroFile = typeof journey.outroFile === "string" ? journey.outroFile : null;
    result.outroTitle = typeof journey.outroTitle === "string" && journey.outroTitle.trim() ? journey.outroTitle.trim() : null;
    result.version = journey.version || 2;
    result.updatedAt = journey.updatedAt || null;
    result.dayLabel = typeof journey.dayLabel === "string" && journey.dayLabel.trim() ? journey.dayLabel.trim() : null;
  }

  return result;
}

/** Prüft, ob für eine Sprache & einen Tag tatsächlich eine Journey-Datei existiert */
async function journeyExists(lang, day) {
  try {
    const res = await fetch(`${journeyUrl(lang, day)}?t=${Date.now()}`, { method: "HEAD", cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

/** Vollständige URL einer Audio-Datei der Journey */
function audioUrl(filename) {
  return AUDIO_BASE + filename;
}

/** Prüft, ob eine Audio-Datei zentral verfügbar ist */
async function audioExists(filename) {
  if (!filename) return false;
  try {
    const res = await fetch(audioUrl(filename), { method: "HEAD", cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

/** Ermittelt die Dauer (Sekunden) einer Audio-Datei, falls möglich */
function probeAudioDuration(url) {
  return new Promise((resolve) => {
    const probe = new Audio(url);
    probe.preload = "metadata";
    probe.onloadedmetadata = () => {
      resolve(isFinite(probe.duration) && probe.duration > 0 ? probe.duration : null);
    };
    probe.onerror = () => resolve(null);
    setTimeout(() => resolve(null), 5000);
  });
}
