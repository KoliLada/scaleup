/* ==========================================================================
   Innercraft Meditation — Nutzer-App (mehrsprachig: DE / EN / FR)
   Spielt die zentral vom Autor festgelegte Journey der gewählten Sprache
   in einem Durchlauf ab:
   Eingangs-Meditation → Iterationen (Anweisung · Stille · Gong)
   → tieferer Gong → Outro → ganz tiefer Gong
   ========================================================================== */

"use strict";

/* ---------- Hilfsfunktionen ---------- */

function $(selector) { return document.querySelector(selector); }
function $$(selector) { return [...document.querySelectorAll(selector)]; }

function formatMinutes(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.round(totalSeconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatDurationLabel(seconds) {
  if (seconds < 90) return t("durationSec", Math.round(seconds));
  return t("durationMin", Math.round(seconds / 60));
}

function showScreen(id) {
  $$(".screen").forEach((s) => s.classList.toggle("is-active", s.id === id));
  window.scrollTo(0, 0);
}

/* ---------- Journey laden & anzeigen ---------- */

let journey = null;
let introAvailable = false;
let introDuration = null;

async function initJourney() {
  journey = await loadJourney(LANG);

  // Verfügbarkeit & Dauer der Eingangs-Meditation prüfen
  if (journey.intro) {
    introAvailable = await audioExists(journey.intro.file);
    if (introAvailable) {
      introDuration = await probeAudioDuration(audioUrl(journey.intro.file));
    }
  }

  renderFlow();
  $("#btn-start").disabled = false;
}

function renderFlow() {
  const list = $("#flow-list");
  const items = [];
  let totalSeconds = 0;

  if (journey.intro && introAvailable) {
    if (introDuration) totalSeconds += introDuration;
    items.push({
      icon: "◉",
      label: journey.intro.title,
      duration: introDuration ? formatDurationLabel(introDuration) : "",
    });
  }

  journey.iterations.forEach((iteration, index) => {
    const silence = iteration.silenceMinutes * 60;
    totalSeconds += silence;
    items.push({
      icon: String(index + 1),
      label: t("flowIteration", index + 1, !!iteration.instructionFile),
      duration: formatDurationLabel(silence),
    });
  });

  if (journey.outroPauseMinutes > 0) {
    totalSeconds += journey.outroPauseMinutes * 60;
  }

  items.push({ icon: "◎", label: journey.outroFile ? t("flowDeepGongOutro") : t("flowDeepGong"), duration: "" });
  items.push({ icon: "●", label: t("flowFinalGong"), duration: "" });

  list.innerHTML = items
    .map(
      (item) => `
        <li>
          <span class="flow-icon">${item.icon}</span>
          <span>${item.label}</span>
          <span class="flow-duration">${item.duration}</span>
        </li>`
    )
    .join("");

  $("#flow-total").textContent = totalSeconds
    ? t("flowTotal", Math.round(totalSeconds / 60))
    : "";
}

/* ==========================================================================
   Meditations-Engine
   ========================================================================== */

const Session = {
  phases: [],          // [{ type, label, title, audio?, durationSeconds? }]
  phaseIndex: -1,
  phaseStartedAt: 0,
  pausedAt: null,
  tickTimer: null,
  wakeLock: null,
  audioContext: null,
  keepAliveSource: null,

  /* ----- Aufbau aus der zentralen Journey ----- */

  async build() {
    const phases = [];

    const makeAudio = (filename) => {
      const audio = new Audio(audioUrl(filename));
      audio.preload = "auto";
      audio.load();
      return audio;
    };

    // 1) Eingangs-Meditation
    if (journey.intro && introAvailable) {
      phases.push({
        type: "audio",
        label: t("phaseIntroLabel"),
        title: t("phaseIntroTitle"),
        audio: makeAudio(journey.intro.file),
        durationSeconds: introDuration || null,
      });
    }

    // 2) Iterationen: Anweisung → Stille → Gong
    const total = journey.iterations.length;
    for (let i = 0; i < total; i++) {
      const iteration = journey.iterations[i];
      const label = t("phaseIterationLabel", i + 1, total);

      if (iteration.instructionFile && (await audioExists(iteration.instructionFile))) {
        phases.push({
          type: "audio",
          label,
          title: t("phaseInstruction"),
          audio: makeAudio(iteration.instructionFile),
          durationSeconds: null,
        });
      }

      phases.push({
        type: "silence",
        label,
        title: t("phaseSilence"),
        durationSeconds: iteration.silenceMinutes * 60,
      });

      phases.push({
        type: "audio",
        label,
        title: t("phaseGong"),
        audio: makeAudio(GONG_FILE),
        durationSeconds: null,
      });
    }

    // 3) Optionale Stille vor dem Outro
    if (journey.outroPauseMinutes > 0) {
      phases.push({
        type: "silence",
        label: t("phaseTransition"),
        title: t("phaseSilence"),
        durationSeconds: journey.outroPauseMinutes * 60,
      });
    }

    // 4) Tieferer Gong leitet das Outro ein
    phases.push({
      type: "audio",
      label: t("phaseOutro"),
      title: t("phaseDeepGong"),
      audio: makeAudio(GONG_DEEP_FILE),
      durationSeconds: null,
    });

    // 5) Outro-Ansprache
    if (journey.outroFile && (await audioExists(journey.outroFile))) {
      phases.push({
        type: "audio",
        label: t("phaseOutro"),
        title: t("phaseOutro"),
        audio: makeAudio(journey.outroFile),
        durationSeconds: null,
      });
    }

    // 6) Ganz tiefer Gong als Abschluss
    phases.push({
      type: "audio",
      label: t("phaseFinal"),
      title: t("phaseFinalGong"),
      audio: makeAudio(GONG_DEEPEST_FILE),
      durationSeconds: null,
    });

    this.phases = phases;
  },

  /* ----- Steuerung ----- */

  async start() {
    this.cleanup();
    await this.build();

    // Audio-Wiedergabe für iOS freischalten: alle Elemente einmal kurz anspielen
    this.unlockAudio();

    // AudioContext mit stillem Loop hält die Audio-Session am Leben
    this.startKeepAlive();

    // Bildschirm anlassen
    await this.requestWakeLock();

    showScreen("screen-session");
    this.phaseIndex = -1;
    this.pausedAt = null;
    this.advance();

    this.tickTimer = setInterval(() => this.tick(), 250);
  },

  unlockAudio() {
    this.phases.forEach((phase) => {
      if (!phase.audio) return;
      const audio = phase.audio;
      audio.muted = true;
      const p = audio.play();
      if (p && p.then) {
        p.then(() => {
          audio.pause();
          audio.currentTime = 0;
          audio.muted = false;
        }).catch(() => { audio.muted = false; });
      } else {
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
      }
    });
  },

  startKeepAlive() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new Ctx();
      const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate, this.audioContext.sampleRate);
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const gain = this.audioContext.createGain();
      gain.gain.value = 0.001; // praktisch unhörbar, hält iOS-Audio aktiv
      source.connect(gain).connect(this.audioContext.destination);
      source.start();
      this.keepAliveSource = source;
    } catch (err) {
      console.warn("Keep-Alive-Audio nicht verfügbar:", err);
    }
  },

  async requestWakeLock() {
    try {
      if ("wakeLock" in navigator) {
        this.wakeLock = await navigator.wakeLock.request("screen");
        document.addEventListener("visibilitychange", async () => {
          if (document.visibilityState === "visible" && this.tickTimer && !this.wakeLock) {
            this.wakeLock = await navigator.wakeLock.request("screen").catch(() => null);
          }
        });
        this.wakeLock.addEventListener("release", () => { this.wakeLock = null; });
      }
    } catch (err) {
      console.warn("Wake Lock nicht verfügbar:", err);
    }
  },

  advance() {
    // vorherige Phase aufräumen
    const prev = this.phases[this.phaseIndex];
    if (prev && prev.audio) {
      prev.audio.onended = null;
      prev.audio.pause();
    }

    this.phaseIndex += 1;

    if (this.phaseIndex >= this.phases.length) {
      this.finish();
      return;
    }

    const phase = this.phases[this.phaseIndex];
    this.phaseStartedAt = Date.now();

    if (phase.type === "audio") {
      phase.audio.currentTime = 0;
      phase.audio.onended = () => this.advance();
      phase.audio.play().catch((err) => {
        console.error("Wiedergabe fehlgeschlagen:", err);
        // Nicht hängen bleiben: nach kurzer Wartezeit weiter
        setTimeout(() => this.advance(), 2000);
      });
      if (!phase.durationSeconds && isFinite(phase.audio.duration) && phase.audio.duration > 0) {
        phase.durationSeconds = phase.audio.duration;
      }
      phase.audio.onloadedmetadata = () => {
        if (!phase.durationSeconds && isFinite(phase.audio.duration)) {
          phase.durationSeconds = phase.audio.duration;
        }
      };
    }

    this.updateDisplay();
  },

  tick() {
    if (this.pausedAt !== null) return;

    const phase = this.phases[this.phaseIndex];
    if (!phase) return;

    if (phase.type === "silence") {
      const elapsed = (Date.now() - this.phaseStartedAt) / 1000;
      if (elapsed >= phase.durationSeconds) {
        this.advance();
        return;
      }
    }

    this.updateDisplay();
  },

  updateDisplay() {
    const phase = this.phases[this.phaseIndex];
    if (!phase) return;

    $("#session-phase-label").textContent = phase.label;
    $("#session-phase-title").textContent = phase.title;
    $("#session-step").textContent = t("sessionStep", this.phaseIndex + 1, this.phases.length);

    let elapsed;
    let total = phase.durationSeconds;

    if (phase.type === "audio" && phase.audio) {
      elapsed = phase.audio.currentTime || 0;
      if (!total && isFinite(phase.audio.duration) && phase.audio.duration > 0) {
        total = phase.audio.duration;
      }
    } else {
      elapsed = (Date.now() - this.phaseStartedAt) / 1000;
    }

    // Bei Stille: Restzeit anzeigen; bei Audio: vergangene Zeit
    if (phase.type === "silence") {
      const remaining = Math.max(0, total - elapsed);
      $("#session-time").textContent = formatMinutes(remaining);
    } else {
      $("#session-time").textContent = formatMinutes(elapsed);
    }

    // Fortschrittsring
    const ring = $("#session-ring");
    const circumference = 553;
    const progress = total ? Math.min(1, elapsed / total) : 0;
    ring.style.strokeDashoffset = circumference * (1 - progress);
  },

  togglePause() {
    const phase = this.phases[this.phaseIndex];
    if (!phase) return;

    if (this.pausedAt === null) {
      this.pausedAt = Date.now();
      if (phase.audio) phase.audio.pause();
      $("#btn-pause").textContent = t("btnResume");
    } else {
      const pausedDuration = Date.now() - this.pausedAt;
      this.phaseStartedAt += pausedDuration;
      this.pausedAt = null;
      if (phase.type === "audio" && phase.audio) phase.audio.play();
      $("#btn-pause").textContent = t("btnPause");
    }
  },

  stop() {
    this.cleanup();
    showScreen("screen-home");
  },

  finish() {
    this.cleanup();
    showScreen("screen-done");
  },

  cleanup() {
    if (this.tickTimer) { clearInterval(this.tickTimer); this.tickTimer = null; }

    this.phases.forEach((phase) => {
      if (phase.audio) {
        phase.audio.onended = null;
        phase.audio.pause();
        phase.audio.src = "";
      }
    });
    this.phases = [];
    this.phaseIndex = -1;
    this.pausedAt = null;

    if (this.keepAliveSource) {
      try { this.keepAliveSource.stop(); } catch { /* bereits gestoppt */ }
      this.keepAliveSource = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    if (this.wakeLock) {
      this.wakeLock.release().catch(() => {});
      this.wakeLock = null;
    }

    $("#btn-pause").textContent = t("btnPause");
  },
};

/* ---------- Navigation & Initialisierung ---------- */

function bindNavigation() {
  document.addEventListener("click", (e) => {
    const target = e.target.closest("[data-goto]");
    if (!target) return;
    showScreen(target.dataset.goto);
  });

  $("#btn-start").addEventListener("click", () => Session.start());
  $("#btn-pause").addEventListener("click", () => Session.togglePause());
  $("#btn-stop").addEventListener("click", () => {
    if (confirm(t("confirmStop"))) Session.stop();
  });
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch((err) => {
      console.warn("Service Worker konnte nicht registriert werden:", err);
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  applyTranslations();
  bindNavigation();
  initJourney();
  registerServiceWorker();
});
