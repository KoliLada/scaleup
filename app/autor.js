/* ==========================================================================
   Innercraft Meditation — Autoren-Modus (mehrsprachig)
   Hier gestaltet der Autor die zentralen Journeys: pro Sprache (DE/EN/FR)
   Iterationen anlegen, Anweisungen mit eigener Stimme aufnehmen, Dauern
   festlegen und alles per GitHub-API veröffentlichen
   (Cloudflare Pages deployt automatisch).
   ========================================================================== */

"use strict";

/* ---------- Konfiguration ---------- */

const GITHUB_REPO = "KoliLada/scaleup";       // Owner/Repo der Website
const GITHUB_API = "https://api.github.com";
const REPO_AUDIO_DIR = "app/audio";           // Zielordner im Repository

const MAX_AUTHOR_ITERATIONS = 10;

const JOURNEY_LANGS = [
  { code: "de", label: "Deutsch" },
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
];

/** Dateiname der Journey-Definition im Repository je Sprache */
function journeyRepoFilename(lang) {
  return lang === "de" ? "journey.json" : `journey-${lang}.json`;
}

/* ---------- Hilfsfunktionen ---------- */

function $(selector) { return document.querySelector(selector); }

function uid() {
  return `rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/* ---------- Aktive Journey-Sprache ---------- */

let journeyLang = "de";

/* ---------- Lokale Entwurfs-Daten (pro Sprache) ---------- */

// Entwurf der Journey (localStorage) — Audio-Quellen zeigen entweder auf
// bereits veröffentlichte Dateien ("published") oder lokale Aufnahmen ("local")
const Draft = {
  data: null,

  storageKey(lang = journeyLang) {
    return lang === "de" ? "innercraft-author-draft" : `innercraft-author-draft-${lang}`;
  },

  /** Entwurf aus der veröffentlichten Journey ableiten */
  fromJourney(journey) {
    return {
      iterations: journey.iterations.map((iteration) => ({
        silenceMinutes: iteration.silenceMinutes,
        audio: iteration.instructionFile ? { type: "published", file: iteration.instructionFile } : null,
      })),
      outroPauseMinutes: journey.outroPauseMinutes,
      outroAudio: journey.outroFile ? { type: "published", file: journey.outroFile } : null,
      intro: journey.intro || null,
    };
  },

  load() {
    try {
      const raw = localStorage.getItem(this.storageKey());
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  save() {
    localStorage.setItem(this.storageKey(), JSON.stringify(this.data));
    updateDraftNotice();
  },

  clear() {
    localStorage.removeItem(this.storageKey());
    updateDraftNotice();
  },

  hasUnpublished() {
    return localStorage.getItem(this.storageKey()) !== null;
  },

  /** Gibt zurück, welche Sprachen unveröffentlichte Entwürfe haben */
  langsWithDrafts() {
    return JOURNEY_LANGS
      .map((l) => l.code)
      .filter((code) => localStorage.getItem(this.storageKey(code)) !== null);
  },
};

/* ---------- Lokale Aufnahmen (IndexedDB) ---------- */

const LocalRecordings = {
  db: null,

  open() {
    if (this.db) return Promise.resolve(this.db);
    return new Promise((resolve, reject) => {
      const req = indexedDB.open("innercraft-author", 1);
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

/* ---------- Mikrofon-Aufnahme ---------- */

const Recorder = {
  mediaRecorder: null,
  chunks: [],
  active: false,

  pickMimeType() {
    const candidates = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/aac"];
    for (const type of candidates) {
      if (window.MediaRecorder && MediaRecorder.isTypeSupported(type)) return type;
    }
    return "";
  },

  /** Startet eine Aufnahme; Promise löst nach dem Stoppen mit dem Blob auf */
  async start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = this.pickMimeType();
    this.mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    this.chunks = [];
    this.active = true;
    const startedAt = Date.now();

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };

    return new Promise((resolve) => {
      this.mediaRecorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const type = this.mediaRecorder.mimeType || mimeType || "audio/mp4";
        this.active = false;
        resolve({
          blob: new Blob(this.chunks, { type }),
          mimeType: type,
          duration: (Date.now() - startedAt) / 1000,
        });
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

/* ---------- UI: Aufnahme-Steuerung (für Iterationen & Outro) ---------- */

let previewAudio = null;

function stopPreview() {
  if (previewAudio) {
    previewAudio.pause();
    previewAudio = null;
  }
}

/**
 * Baut die Aufnahme-Steuerung für eine Audio-Quelle.
 * getAudio()/setAudio() lesen bzw. schreiben { type, file?/key?, duration? } | null
 */
async function renderRecordingControls(container, getAudio, setAudio) {
  const audio = getAudio();
  container.innerHTML = "";

  const recordBtn = document.createElement("button");
  recordBtn.className = "rec-btn rec-btn-record";
  recordBtn.textContent = "Aufnehmen";

  const playBtn = document.createElement("button");
  playBtn.className = "rec-btn";
  playBtn.textContent = "Anhören";

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "rec-btn";
  deleteBtn.textContent = "Löschen";

  const status = document.createElement("span");
  status.className = "rec-status";

  if (!audio) {
    playBtn.disabled = true;
    deleteBtn.disabled = true;
    status.classList.add("empty");
    status.textContent = "noch keine Aufnahme";
  } else if (audio.type === "published") {
    status.textContent = "veröffentlichte Aufnahme";
  } else {
    status.textContent = `neue Aufnahme${audio.duration ? ` (${Math.round(audio.duration)} Sek.)` : ""} — noch nicht veröffentlicht`;
  }

  recordBtn.addEventListener("click", async () => {
    if (Recorder.active) {
      Recorder.stop();
      return;
    }
    stopPreview();
    $("#mic-error").classList.add("hidden");

    try {
      recordBtn.classList.add("is-recording");
      recordBtn.textContent = "■ Stoppen";
      const result = await Recorder.start();

      // Lokale Aufnahme speichern und als Quelle setzen
      const key = uid();
      await LocalRecordings.set(key, result);
      setAudio({ type: "local", key, duration: result.duration });
      Draft.save();
      await renderAll();
    } catch (err) {
      console.error(err);
      recordBtn.classList.remove("is-recording");
      recordBtn.textContent = "Aufnehmen";
      $("#mic-error").classList.remove("hidden");
    }
  });

  playBtn.addEventListener("click", async () => {
    if (previewAudio) {
      stopPreview();
      playBtn.textContent = "Anhören";
      return;
    }
    const current = getAudio();
    if (!current) return;

    let url;
    if (current.type === "published") {
      url = audioUrl(current.file);
    } else {
      const rec = await LocalRecordings.get(current.key);
      if (!rec) return;
      url = URL.createObjectURL(rec.blob);
    }
    previewAudio = new Audio(url);
    playBtn.textContent = "■ Stopp";
    previewAudio.onended = () => {
      previewAudio = null;
      playBtn.textContent = "Anhören";
    };
    previewAudio.play();
  });

  deleteBtn.addEventListener("click", async () => {
    const current = getAudio();
    if (current && current.type === "local") {
      await LocalRecordings.remove(current.key);
    }
    setAudio(null);
    Draft.save();
    await renderAll();
  });

  container.append(recordBtn, playBtn, deleteBtn, status);
}

/* ---------- UI: Sprach-Tabs ---------- */

async function switchJourneyLang(lang) {
  stopPreview();
  journeyLang = lang;

  // Tabs aktualisieren
  document.querySelectorAll(".journey-lang-tab").forEach((tab) => {
    const active = tab.dataset.journeyLang === lang;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
  });

  // Entwurf der Sprache laden (oder von der veröffentlichten Journey ableiten)
  const journey = await loadJourney(lang);
  const draft = Draft.load();
  Draft.data = draft || Draft.fromJourney(journey);

  renderIntroInfo(journey);
  await renderAll();
}

function renderIntroInfo(journey) {
  const info = $("#intro-info");
  if (journey.intro) {
    info.textContent = `${journey.intro.title} — zentral hinterlegt.`;
    audioExists(journey.intro.file).then(async (available) => {
      if (available) {
        const duration = await probeAudioDuration(audioUrl(journey.intro.file));
        info.textContent = `${journey.intro.title} — zentral hinterlegt${duration ? ` (${Math.round(duration / 60)} Min.)` : ""}.`;
      } else {
        info.textContent = `${journey.intro.title} — Datei noch nicht hinterlegt.`;
      }
    });
  } else {
    const langLabel = JOURNEY_LANGS.find((l) => l.code === journeyLang)?.label || journeyLang;
    info.textContent = `Für ${langLabel} ist keine Eingangs-Meditation hinterlegt — die Journey beginnt direkt mit Iteration 1. (Eine Audio-Datei kann später zentral ergänzt werden.)`;
  }
}

/* ---------- UI: Iterationen ---------- */

async function renderIterations() {
  const container = $("#iteration-cards");
  container.innerHTML = "";

  for (let index = 0; index < Draft.data.iterations.length; index++) {
    const iteration = Draft.data.iterations[index];

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-head">
        <h2>Iteration ${index + 1}</h2>
        <button class="rec-btn card-remove" ${Draft.data.iterations.length <= 1 ? "disabled" : ""}>Entfernen</button>
      </div>
      <div class="author-recording">
        <p class="recording-hint">Deine Anweisung, mit der diese Iteration beginnt.</p>
        <div class="recording-controls"></div>
      </div>
      <div class="row">
        <span>Stille danach</span>
        <div class="duration-input">
          <input type="number" min="1" max="60" step="1" inputmode="numeric" value="${iteration.silenceMinutes}" />
          <span class="unit">Min.</span>
        </div>
      </div>`;

    // Anweisung aufnehmen / anhören / löschen
    await renderRecordingControls(
      card.querySelector(".recording-controls"),
      () => Draft.data.iterations[index].audio,
      (audio) => { Draft.data.iterations[index].audio = audio; }
    );

    // Stille-Dauer
    card.querySelector("input[type=number]").addEventListener("change", (e) => {
      const value = Math.min(60, Math.max(1, Number(e.target.value) || 1));
      e.target.value = value;
      Draft.data.iterations[index].silenceMinutes = value;
      Draft.save();
    });

    // Iteration entfernen
    card.querySelector(".card-remove").addEventListener("click", async () => {
      if (!confirm(`Iteration ${index + 1} wirklich entfernen?`)) return;
      const removed = Draft.data.iterations.splice(index, 1)[0];
      if (removed.audio && removed.audio.type === "local") {
        await LocalRecordings.remove(removed.audio.key);
      }
      Draft.save();
      await renderAll();
    });

    container.appendChild(card);
  }

  $("#btn-add-iteration").disabled = Draft.data.iterations.length >= MAX_AUTHOR_ITERATIONS;
}

/* ---------- UI: Outro & Hinweise ---------- */

async function renderOutro() {
  $("#outro-pause").value = Draft.data.outroPauseMinutes;

  await renderRecordingControls(
    $('#outro-recording .recording-controls'),
    () => Draft.data.outroAudio,
    (audio) => { Draft.data.outroAudio = audio; }
  );
}

function updateDraftNotice() {
  const langs = Draft.langsWithDrafts();
  const notice = $("#draft-notice");
  if (langs.length === 0) {
    notice.classList.add("hidden");
  } else {
    notice.classList.remove("hidden");
    const labels = langs.map((code) => JOURNEY_LANGS.find((l) => l.code === code)?.label || code);
    notice.textContent = `Du hast unveröffentlichte Änderungen (${labels.join(", ")}). Sie sind nur auf diesem Gerät gespeichert, bis du sie veröffentlichst.`;
  }
}

async function renderAll() {
  await renderIterations();
  await renderOutro();
  updateDraftNotice();
}

/* ---------- Veröffentlichen über die GitHub-API ---------- */

const Publisher = {
  get token() {
    return localStorage.getItem("innercraft-github-token") || "";
  },

  set token(value) {
    if (value) localStorage.setItem("innercraft-github-token", value.trim());
    else localStorage.removeItem("innercraft-github-token");
  },

  headers() {
    return {
      Authorization: `Bearer ${this.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
  },

  async defaultBranch() {
    const res = await fetch(`${GITHUB_API}/repos/${GITHUB_REPO}`, { headers: this.headers() });
    if (!res.ok) throw new Error(`Repository nicht erreichbar (${res.status}). Stimmt der Token?`);
    return (await res.json()).default_branch;
  },

  /** Lädt eine Datei ins Repository hoch (erstellt oder aktualisiert sie) */
  async putFile(path, base64Content, message, branch) {
    // Vorhandene Datei? Dann brauchen wir ihren SHA für das Update.
    let sha;
    const existing = await fetch(
      `${GITHUB_API}/repos/${GITHUB_REPO}/contents/${path}?ref=${branch}`,
      { headers: this.headers() }
    );
    if (existing.ok) sha = (await existing.json()).sha;

    const res = await fetch(`${GITHUB_API}/repos/${GITHUB_REPO}/contents/${path}`, {
      method: "PUT",
      headers: { ...this.headers(), "Content-Type": "application/json" },
      body: JSON.stringify({ message, content: base64Content, branch, ...(sha ? { sha } : {}) }),
    });

    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      throw new Error(`Upload von ${path} fehlgeschlagen (${res.status}): ${detail.message || ""}`);
    }
  },

  /** Veröffentlicht den aktuellen Entwurf der aktiven Sprache */
  async publish(onProgress) {
    if (!this.token) {
      throw new Error("Bitte zuerst den GitHub-Token einrichten (siehe „Einmalige Einrichtung“).");
    }

    const lang = journeyLang;
    const langLabel = JOURNEY_LANGS.find((l) => l.code === lang)?.label || lang;

    onProgress("Verbinde mit GitHub …");
    const branch = await this.defaultBranch();
    const stamp = Date.now();

    // 1) Lokale Aufnahmen hochladen und Dateinamen vergeben
    const iterations = [];
    for (let i = 0; i < Draft.data.iterations.length; i++) {
      const iteration = Draft.data.iterations[i];
      let instructionFile = null;

      if (iteration.audio) {
        if (iteration.audio.type === "published") {
          instructionFile = iteration.audio.file;
        } else {
          onProgress(`Lade Anweisung ${i + 1} (${langLabel}) hoch …`);
          const rec = await LocalRecordings.get(iteration.audio.key);
          if (rec) {
            instructionFile = `journey-${lang}-iteration-${i + 1}-${stamp}.m4a`;
            await this.putFile(
              `${REPO_AUDIO_DIR}/${instructionFile}`,
              await blobToBase64(rec.blob),
              `Journey (${langLabel}): Anweisung für Iteration ${i + 1}`,
              branch
            );
          }
        }
      }

      iterations.push({ instructionFile, silenceMinutes: iteration.silenceMinutes });
    }

    // 2) Outro hochladen
    let outroFile = null;
    if (Draft.data.outroAudio) {
      if (Draft.data.outroAudio.type === "published") {
        outroFile = Draft.data.outroAudio.file;
      } else {
        onProgress(`Lade Outro (${langLabel}) hoch …`);
        const rec = await LocalRecordings.get(Draft.data.outroAudio.key);
        if (rec) {
          outroFile = `journey-${lang}-outro-${stamp}.m4a`;
          await this.putFile(
            `${REPO_AUDIO_DIR}/${outroFile}`,
            await blobToBase64(rec.blob),
            `Journey (${langLabel}): Outro-Ansprache`,
            branch
          );
        }
      }
    }

    // 3) Journey-Definition schreiben
    onProgress(`Veröffentliche Journey (${langLabel}) …`);
    const journey = {
      version: 1,
      updatedAt: new Date().toISOString().slice(0, 10),
      intro: Draft.data.intro || null,
      iterations,
      outroPauseMinutes: Draft.data.outroPauseMinutes,
      outroFile,
    };

    await this.putFile(
      `${REPO_AUDIO_DIR}/${journeyRepoFilename(lang)}`,
      btoa(unescape(encodeURIComponent(JSON.stringify(journey, null, 2) + "\n"))),
      `Journey (${langLabel}) aktualisiert (Autoren-Modus)`,
      branch
    );

    return journey;
  },
};

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/* ---------- Initialisierung ---------- */

async function init() {
  // Sprach-Tabs
  document.querySelectorAll(".journey-lang-tab").forEach((tab) => {
    tab.addEventListener("click", () => switchJourneyLang(tab.dataset.journeyLang));
  });

  // GitHub-Token-Feld
  const tokenInput = $("#github-token");
  tokenInput.value = Publisher.token;
  tokenInput.addEventListener("change", () => { Publisher.token = tokenInput.value; });
  if (!Publisher.token) $("#publish-setup").open = true;

  // Iteration hinzufügen
  $("#btn-add-iteration").addEventListener("click", async () => {
    Draft.data.iterations.push({ silenceMinutes: 5, audio: null });
    Draft.save();
    await renderAll();
  });

  // Outro-Pause
  $("#outro-pause").addEventListener("change", (e) => {
    const value = Math.min(30, Math.max(0, Number(e.target.value) || 0));
    e.target.value = value;
    Draft.data.outroPauseMinutes = value;
    Draft.save();
  });

  // Veröffentlichen
  $("#btn-publish").addEventListener("click", async () => {
    const status = $("#publish-status");
    const btn = $("#btn-publish");
    btn.disabled = true;
    status.classList.remove("is-error", "is-success");

    try {
      await Publisher.publish((msg) => { status.textContent = msg; });
      Draft.clear();
      const langLabel = JOURNEY_LANGS.find((l) => l.code === journeyLang)?.label || journeyLang;
      status.textContent = `✓ Veröffentlicht! Die ${langLabel}-Journey ist in 1–2 Minuten für alle Nutzer live.`;
      status.classList.add("is-success");
    } catch (err) {
      console.error(err);
      status.textContent = `Fehler: ${err.message}`;
      status.classList.add("is-error");
    } finally {
      btn.disabled = false;
    }
  });

  // Änderungen verwerfen (nur aktive Sprache)
  $("#btn-discard").addEventListener("click", async () => {
    if (!confirm("Alle unveröffentlichten Änderungen dieser Sprache verwerfen?")) return;
    Draft.clear();
    const published = await loadJourney(journeyLang);
    Draft.data = Draft.fromJourney(published);
    await renderAll();
  });

  // Mit der deutschen Journey starten
  await switchJourneyLang("de");
}

document.addEventListener("DOMContentLoaded", init);
