/* ==========================================================================
   Innercraft Meditation — App-Logik
   Ablauf: Eingangs-Meditation → 3–5 Iterationen (Anweisung · Stille · Gong)
           → tieferer Gong → Outro-Satz → ganz tiefer Gong
   ========================================================================== */

"use strict";

/* ---------- Konstanten ---------- */

const INTRO_URL = "audio/intro-meditation.mp3"; // zentrale Datei für alle Nutzer
const GONG_URL = "audio/gong.wav";
const GONG_DEEP_URL = "audio/gong-deep.wav";
const GONG_DEEPEST_URL = "audio/gong-deepest.wav";

const MAX_ITERATIONS = 5;
const MIN_ITERATIONS = 3;

const RECORDING_SLOTS = [
  { key: "instruction-1", title: "Anweisung — Iteration 1", hint: "Kurze verbale Anweisung, mit der die erste Stille beginnt." },
  { key: "instruction-2", title: "Anweisung — Iteration 2", hint: "Anweisung für die zweite Iteration." },
  { key: "instruction-3", title: "Anweisung — Iteration 3", hint: "Anweisung für die dritte Iteration." },
  { key: "instruction-4", title: "Anweisung — Iteration 4", hint: "Anweisung für die vierte Iteration (falls aktiviert)." },
  { key: "instruction-5", title: "Anweisung — Iteration 5", hint: "Anweisung für die fünfte Iteration (falls aktiviert)." },
  { key: "outro", title: "Outro-Satz", hint: "Z. B.: „Jetzt bist du präsent und gerüstet für deinen Tag. Ich wünsche dir einen schönen Tag.“" },
];

/* ---------- Einstellungen (localStorage) ---------- */

const Settings = {
  defaults: {
    introEnabled: true,
    iterationCount: 3,
    iterationMinutes: [5, 6, 5, 5, 5],
    outroPauseMinutes: 0,
  },

  load() {
    try {
      const raw = localStorage.getItem("innercraft-meditation-settings");
      if (!raw) return { ...this.defaults };
      const parsed = JSON.parse(raw);
      return {
        ...this.defaults,
        ...parsed,
        iterationMinutes: [
          ...this.defaults.iterationMinutes.map((d, i) =>
            Array.isArray(parsed.iterationMinutes) && parsed.iterationMinutes[i] > 0
              ? parsed.iterationMinutes[i]
              : d
          ),
        ],
      };
    } catch {
      return { ...this.defaults };
    }
  },

  save(settings) {
    localStorage.setItem("innercraft-meditation-settings", JSON.stringify(settings));
  },
};

let settings = Settings.load();

/* ---------- Aufnahmen (IndexedDB) ---------- */

const RecordingStore = {
  db: null,

  open() {
    if (this.db) return Promise.resolve(this.db);
    return new Promise((resolve, reject) => {
      const req = indexedDB.open("innercraft-meditation", 1);
      req.onupgradeneeded = () => req.result.createObjectStore("recordings");
      req.onsuccess = () => { this.db = req.result; resolve(this.db); };
      req.onerror = () => reject(req.error);
    });
  },

  async get(key) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const req = db.transaction("recordings").objectStore("recordings").get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  },

  async set(key, value) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("recordings", "readwrite");
      tx.objectStore("recordings").put(value, key);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  },

  async remove(key) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("recordings", "readwrite");
      tx.objectStore("recordings").delete(key);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  },
};

/* ---------- Hilfsfunktionen ---------- */

function $(selector) { return document.querySelector(selector); }
function $$(selector) { return [...document.querySelectorAll(selector)]; }

function formatMinutes(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.round(totalSeconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatDurationLabel(seconds) {
  if (seconds < 90) return `${Math.round(seconds)} Sek.`;
  return `${Math.round(seconds / 60)} Min.`;
}

function showScreen(id) {
  $$(".screen").forEach((s) => s.classList.toggle("is-active", s.id === id));
  window.scrollTo(0, 0);
}

/* ---------- Verfügbarkeit der Eingangs-Meditation ---------- */

let introAvailable = false;
let introDuration = null; // Sekunden, falls ermittelbar

async function checkIntroAvailability() {
  try {
    const res = await fetch(INTRO_URL, { method: "HEAD", cache: "no-store" });
    introAvailable = res.ok;
  } catch {
    introAvailable = false;
  }

  if (introAvailable) {
    // Dauer über ein temporäres Audio-Element ermitteln
    await new Promise((resolve) => {
      const probe = new Audio(INTRO_URL);
      probe.preload = "metadata";
      probe.onloadedmetadata = () => {
        if (isFinite(probe.duration)) introDuration = probe.duration;
        resolve();
      };
      probe.onerror = resolve;
      setTimeout(resolve, 5000);
    });
  }

  updateIntroStatus();
  renderFlow();
}

function updateIntroStatus() {
  const status = $("#intro-status");
  const notice = $("#intro-missing-notice");
  if (introAvailable) {
    const mins = introDuration ? ` (${Math.round(introDuration / 60)} Min.)` : "";
    status.textContent = `Geführte Meditation von Willigis Jäger ist hinterlegt${mins}.`;
    notice.classList.add("hidden");
  } else {
    status.textContent = "Noch nicht verfügbar — die Datei app/audio/intro-meditation.mp3 ist nicht hinterlegt.";
    notice.classList.toggle("hidden", !settings.introEnabled);
  }
}

/* ---------- Ablauf-Übersicht (Home) ---------- */

async function renderFlow() {
  const list = $("#flow-list");
  const items = [];
  let totalSeconds = 0;

  if (settings.introEnabled && introAvailable) {
    const dur = introDuration || 0;
    totalSeconds += dur;
    items.push({
      icon: "◉",
      label: "Geführte Meditation (Willigis Jäger)",
      duration: dur ? formatDurationLabel(dur) : "",
    });
  }

  for (let i = 0; i < settings.iterationCount; i++) {
    const silence = settings.iterationMinutes[i] * 60;
    totalSeconds += silence;
    items.push({
      icon: String(i + 1),
      label: `Iteration ${i + 1}: Anweisung · Stille · Gong`,
      duration: formatDurationLabel(silence),
    });
  }

  if (settings.outroPauseMinutes > 0) {
    totalSeconds += settings.outroPauseMinutes * 60;
  }

  items.push({ icon: "◎", label: "Tieferer Gong · Outro-Satz", duration: "" });
  items.push({ icon: "●", label: "Ganz tiefer Gong — Abschluss", duration: "" });

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
    ? `Gesamt ca. ${Math.round(totalSeconds / 60)} Minuten`
    : "";

  // Hinweis, falls Aufnahmen fehlen
  const firstInstruction = await RecordingStore.get("instruction-1").catch(() => null);
  $("#recordings-missing-notice").classList.toggle("hidden", !!firstInstruction);
}

/* ---------- Einstellungs-Screen ---------- */

function renderSettings() {
  $("#setting-intro").checked = settings.introEnabled;
  $("#iteration-count").textContent = settings.iterationCount;
  $("#setting-outro-pause").value = settings.outroPauseMinutes;

  const container = $("#iteration-durations");
  container.innerHTML = "";
  for (let i = 0; i < settings.iterationCount; i++) {
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `
      <span>Stille in Iteration ${i + 1}</span>
      <div class="duration-input">
        <input type="number" min="1" max="60" step="1" inputmode="numeric"
               value="${settings.iterationMinutes[i]}" data-iteration="${i}" />
        <span class="unit">Min.</span>
      </div>`;
    container.appendChild(row);
  }

  container.querySelectorAll("input[data-iteration]").forEach((input) => {
    input.addEventListener("change", () => {
      const idx = Number(input.dataset.iteration);
      const value = Math.min(60, Math.max(1, Number(input.value) || 1));
      input.value = value;
      settings.iterationMinutes[idx] = value;
      Settings.save(settings);
      renderFlow();
    });
  });
}

function bindSettings() {
  $("#setting-intro").addEventListener("change", (e) => {
    settings.introEnabled = e.target.checked;
    Settings.save(settings);
    updateIntroStatus();
    renderFlow();
  });

  $("#iteration-count-stepper").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-step]");
    if (!btn) return;
    const next = settings.iterationCount + Number(btn.dataset.step);
    settings.iterationCount = Math.min(MAX_ITERATIONS, Math.max(MIN_ITERATIONS, next));
    Settings.save(settings);
    renderSettings();
    renderFlow();
  });

  $("#setting-outro-pause").addEventListener("change", (e) => {
    settings.outroPauseMinutes = Math.min(10, Math.max(0, Number(e.target.value) || 0));
    e.target.value = settings.outroPauseMinutes;
    Settings.save(settings);
    renderFlow();
  });
}

/* ---------- Aufnahme-Screen ---------- */

const Recorder = {
  mediaRecorder: null,
  chunks: [],
  activeKey: null,
  startedAt: 0,

  pickMimeType() {
    const candidates = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/aac"];
    for (const type of candidates) {
      if (window.MediaRecorder && MediaRecorder.isTypeSupported(type)) return type;
    }
    return "";
  },

  async start(key) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = this.pickMimeType();
    this.mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    this.chunks = [];
    this.activeKey = key;
    this.startedAt = Date.now();

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };

    return new Promise((resolve) => {
      this.mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const type = this.mediaRecorder.mimeType || mimeType || "audio/mp4";
        const blob = new Blob(this.chunks, { type });
        const duration = (Date.now() - this.startedAt) / 1000;
        await RecordingStore.set(key, {
          blob,
          mimeType: type,
          duration,
          createdAt: new Date().toISOString(),
        });
        this.activeKey = null;
        resolve();
      };
      this.mediaRecorder.start();
    });
  },

  stop() {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }
  },
};

let previewAudio = null; // aktive Wiedergabe einer Aufnahme zur Kontrolle

async function renderRecordings() {
  const container = $("#recording-list");
  container.innerHTML = "";

  // Nur die Slots anzeigen, die laut Einstellungen gebraucht werden (+ Outro)
  const visibleSlots = RECORDING_SLOTS.filter((slot, idx) => {
    if (slot.key === "outro") return true;
    return idx < settings.iterationCount;
  });

  for (const slot of visibleSlots) {
    const recording = await RecordingStore.get(slot.key).catch(() => null);
    const item = document.createElement("div");
    item.className = "recording-item";
    item.innerHTML = `
      <h3>${slot.title}</h3>
      <p class="recording-hint">${slot.hint}</p>
      <div class="recording-controls">
        <button class="rec-btn rec-btn-record" data-action="record">Aufnehmen</button>
        <button class="rec-btn" data-action="play" ${recording ? "" : "disabled"}>Anhören</button>
        <button class="rec-btn" data-action="delete" ${recording ? "" : "disabled"}>Löschen</button>
        <span class="rec-status ${recording ? "" : "empty"}">
          ${recording ? `${Math.round(recording.duration)} Sek. aufgenommen` : "noch keine Aufnahme"}
        </span>
      </div>`;

    const recordBtn = item.querySelector('[data-action="record"]');
    const playBtn = item.querySelector('[data-action="play"]');
    const deleteBtn = item.querySelector('[data-action="delete"]');

    recordBtn.addEventListener("click", async () => {
      if (Recorder.activeKey === slot.key) {
        // Aufnahme läuft -> stoppen
        Recorder.stop();
        return;
      }
      if (Recorder.activeKey) return; // andere Aufnahme läuft

      $("#mic-error").classList.add("hidden");
      try {
        recordBtn.classList.add("is-recording");
        recordBtn.textContent = "■ Stoppen";
        await Recorder.start(slot.key);
        // Promise löst erst nach dem Stoppen auf
        await renderRecordings();
        renderFlow();
      } catch (err) {
        console.error(err);
        recordBtn.classList.remove("is-recording");
        recordBtn.textContent = "Aufnehmen";
        $("#mic-error").classList.remove("hidden");
      }
    });

    playBtn.addEventListener("click", async () => {
      if (previewAudio) {
        previewAudio.pause();
        previewAudio = null;
        playBtn.textContent = "Anhören";
        return;
      }
      const rec = await RecordingStore.get(slot.key);
      if (!rec) return;
      previewAudio = new Audio(URL.createObjectURL(rec.blob));
      playBtn.textContent = "■ Stopp";
      previewAudio.onended = () => {
        previewAudio = null;
        playBtn.textContent = "Anhören";
      };
      previewAudio.play();
    });

    deleteBtn.addEventListener("click", async () => {
      await RecordingStore.remove(slot.key);
      await renderRecordings();
      renderFlow();
    });

    container.appendChild(item);
  }
}

/* ==========================================================================
   Meditations-Engine
   ========================================================================== */

const Session = {
  phases: [],          // [{ type, label, title, audio?, durationSeconds? }]
  phaseIndex: -1,
  phaseStartedAt: 0,   // Zeitstempel (ms) des Phasenstarts
  pausedAt: null,
  tickTimer: null,
  wakeLock: null,
  audioContext: null,
  keepAliveSource: null,
  objectUrls: [],

  /* ----- Aufbau ----- */

  async build() {
    const phases = [];

    // Audio-Elemente vorbereiten (alle innerhalb der Nutzer-Geste erzeugen!)
    const gong = new Audio(GONG_URL);
    const gongDeep = new Audio(GONG_DEEP_URL);
    const gongDeepest = new Audio(GONG_DEEPEST_URL);
    [gong, gongDeep, gongDeepest].forEach((a) => { a.preload = "auto"; a.load(); });

    // 1) Eingangs-Meditation
    if (settings.introEnabled && introAvailable) {
      const intro = new Audio(INTRO_URL);
      intro.preload = "auto";
      intro.load();
      phases.push({
        type: "audio",
        label: "Eingangs-Meditation",
        title: "Geführte Meditation",
        audio: intro,
        durationSeconds: introDuration || null,
      });
    }

    // 2) Iterationen
    for (let i = 0; i < settings.iterationCount; i++) {
      // Anweisung (eigene Stimme); Fallback: Anweisung der ersten Iteration
      let recording = await RecordingStore.get(`instruction-${i + 1}`).catch(() => null);
      if (!recording && i > 0) {
        recording = await RecordingStore.get("instruction-1").catch(() => null);
      }

      if (recording) {
        const url = URL.createObjectURL(recording.blob);
        this.objectUrls.push(url);
        const audio = new Audio(url);
        audio.preload = "auto";
        audio.load();
        phases.push({
          type: "audio",
          label: `Iteration ${i + 1} von ${settings.iterationCount}`,
          title: "Deine Anweisung",
          audio,
          durationSeconds: recording.duration || null,
        });
      }

      // Stille
      phases.push({
        type: "silence",
        label: `Iteration ${i + 1} von ${settings.iterationCount}`,
        title: "Stille",
        durationSeconds: settings.iterationMinutes[i] * 60,
      });

      // Gong am Ende der Iteration
      const gongAudio = new Audio(GONG_URL);
      gongAudio.preload = "auto";
      gongAudio.load();
      phases.push({
        type: "audio",
        label: `Iteration ${i + 1} von ${settings.iterationCount}`,
        title: "Gong",
        audio: gongAudio,
        durationSeconds: null,
      });
    }

    // 3) Optionale Stille vor dem Outro
    if (settings.outroPauseMinutes > 0) {
      phases.push({
        type: "silence",
        label: "Übergang",
        title: "Stille",
        durationSeconds: settings.outroPauseMinutes * 60,
      });
    }

    // 4) Tieferer Gong — leitet das Outro ein
    phases.push({
      type: "audio",
      label: "Outro",
      title: "Tieferer Gong",
      audio: gongDeep,
      durationSeconds: null,
    });

    // 5) Outro-Satz (eigene Stimme)
    const outroRecording = await RecordingStore.get("outro").catch(() => null);
    if (outroRecording) {
      const url = URL.createObjectURL(outroRecording.blob);
      this.objectUrls.push(url);
      const audio = new Audio(url);
      audio.preload = "auto";
      audio.load();
      phases.push({
        type: "audio",
        label: "Outro",
        title: "Dein Outro",
        audio,
        durationSeconds: outroRecording.duration || null,
      });
    }

    // 6) Ganz tiefer Gong — Abschluss
    phases.push({
      type: "audio",
      label: "Abschluss",
      title: "Tiefer Gong",
      audio: gongDeepest,
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
      // Dauer für die Anzeige nachladen, sobald Metadaten da sind
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
    $("#session-step").textContent = `Schritt ${this.phaseIndex + 1} von ${this.phases.length}`;

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
      $("#btn-pause").textContent = "Fortsetzen";
    } else {
      const pausedDuration = Date.now() - this.pausedAt;
      this.phaseStartedAt += pausedDuration;
      this.pausedAt = null;
      if (phase.type === "audio" && phase.audio) phase.audio.play();
      $("#btn-pause").textContent = "Pause";
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

    this.objectUrls.forEach((url) => URL.revokeObjectURL(url));
    this.objectUrls = [];

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

    $("#btn-pause").textContent = "Pause";
  },
};

/* ---------- Navigation & Initialisierung ---------- */

function bindNavigation() {
  document.addEventListener("click", (e) => {
    const target = e.target.closest("[data-goto]");
    if (!target) return;
    const screenId = target.dataset.goto;
    if (screenId === "screen-recordings") renderRecordings();
    if (screenId === "screen-settings") renderSettings();
    if (screenId === "screen-home") renderFlow();
    showScreen(screenId);
  });

  $("#btn-start").addEventListener("click", () => Session.start());
  $("#btn-pause").addEventListener("click", () => Session.togglePause());
  $("#btn-stop").addEventListener("click", () => {
    if (confirm("Meditation wirklich beenden?")) Session.stop();
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
  bindNavigation();
  bindSettings();
  renderSettings();
  renderFlow();
  checkIntroAvailability();
  registerServiceWorker();
});
