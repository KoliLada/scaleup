/* ==========================================================================
   Innercraft Meditation — Zentrale Journey (mehrsprachig)
   Lädt die vom Autor festgelegte Journey der jeweiligen Sprache und stellt
   Hilfsfunktionen bereit. Wird von der Nutzer-App und vom Autoren-Modus
   gemeinsam verwendet.

   Journey-Dateien:
     Deutsch     → audio/journey.json
     Englisch    → audio/journey-en.json
     Französisch → audio/journey-fr.json
   ========================================================================== */

"use strict";

const AUDIO_BASE = "audio/";

const GONG_FILE = "gong.wav";
const GONG_DEEP_FILE = "gong-deep.wav";
const GONG_DEEPEST_FILE = "gong-deepest.wav";

/** Pfad der Journey-Datei einer Sprache */
function journeyUrl(lang) {
  return lang === "de" ? `${AUDIO_BASE}journey.json` : `${AUDIO_BASE}journey-${lang}.json`;
}

/** Standard-Journeys, falls die jeweilige journey-Datei (noch) nicht erreichbar ist */
const DEFAULT_JOURNEYS = {
  de: {
    version: 1,
    intro: { file: "intro-meditation.m4a", title: "Geführte Meditation (Willigis Jäger)" },
    iterations: [
      { instructionFile: null, silenceMinutes: 5 },
      { instructionFile: null, silenceMinutes: 6 },
    ],
    outroPauseMinutes: 0,
    outroFile: null,
  },
  en: {
    version: 1,
    intro: null,
    iterations: [
      { instructionFile: null, silenceMinutes: 5 },
      { instructionFile: null, silenceMinutes: 6 },
    ],
    outroPauseMinutes: 0,
    outroFile: null,
  },
  fr: {
    version: 1,
    intro: null,
    iterations: [
      { instructionFile: null, silenceMinutes: 5 },
      { instructionFile: null, silenceMinutes: 6 },
    ],
    outroPauseMinutes: 0,
    outroFile: null,
  },
};

/**
 * Lädt die zentrale Journey-Definition einer Sprache.
 * Cache wird umgangen, damit Änderungen des Autors sofort ankommen.
 */
async function loadJourney(lang = "de") {
  const fallback = DEFAULT_JOURNEYS[lang] || DEFAULT_JOURNEYS.de;
  try {
    const res = await fetch(`${journeyUrl(lang)}?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return structuredClone(fallback);
    const journey = await res.json();
    return normalizeJourney(journey, fallback);
  } catch {
    return structuredClone(fallback);
  }
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
        instructionFile: typeof iteration.instructionFile === "string" ? iteration.instructionFile : null,
        silenceMinutes: iteration.silenceMinutes > 0 ? Number(iteration.silenceMinutes) : 5,
      }));
    }

    result.outroPauseMinutes = journey.outroPauseMinutes > 0 ? Number(journey.outroPauseMinutes) : 0;
    result.outroFile = typeof journey.outroFile === "string" ? journey.outroFile : null;
    result.version = journey.version || 1;
    result.updatedAt = journey.updatedAt || null;
  }

  return result;
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
