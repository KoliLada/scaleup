/* ==========================================================================
   Deine Reise — Ansicht für Klient:innen
   Routen: #/  ·  #/modul/<Nummer>  ·  #/tagebuch
   ========================================================================== */
(function () {
  'use strict';

  var root = document.getElementById('app');
  var esc = UI.esc, I = UI.I, U = Reise.util;
  var state = { me: null, settings: {}, modules: [] };
  var pendingSave = null; // laufender Entwurf, der noch gespeichert werden muss

  function guideName() { return state.settings.guide_name || 'Carla'; }

  function statusOf(m) {
    if (!m.open) {
      return m.release_date
        ? { cls: 'chip-locked', label: 'ab ' + U.fmtShort(m.release_date) }
        : { cls: 'chip-locked', label: 'folgt' };
    }
    if (m.status === 'submitted' && m.feedback_at) return { cls: 'chip-feedback', label: 'Rückmeldung' };
    if (m.status === 'submitted') return { cls: 'chip-done', label: 'Abgeschickt' };
    if (m.status === 'draft') return { cls: 'chip-draft', label: 'In Arbeit' };
    return { cls: 'chip-new', label: 'Neu' };
  }

  function chrome(active) {
    var links = [
      { href: '#/', label: 'Übersicht', active: active === 'home' },
      { href: '#/tagebuch', label: 'Mein Tagebuch', active: active === 'diary' }
    ];
    if (state.settings.call_link) links.push({ href: state.settings.call_link, label: 'Videotermin' });
    links.push({ action: 'pw', label: 'Passwort' });
    links.push({ action: 'logout', label: 'Abmelden' });
    return UI.header({ links: links });
  }
  function bind() {
    UI.bindChrome(root, {
      pw: UI.changePasswordDialog,
      logout: function () { flushSave().then(function () { return Reise.signOut(); }).then(start); }
    });
    root.querySelectorAll('a[href^="http"]').forEach(function (a) { a.target = '_blank'; a.rel = 'noopener'; });
  }

  /* ---------------- Übersicht ---------------- */
  function viewHome() {
    var mods = state.modules;
    var open = mods.filter(function (m) { return m.open; });
    var sent = mods.filter(function (m) { return m.status === 'submitted'; });
    var next = mods.filter(function (m) { return !m.open && m.release_date; })
      .sort(function (a, b) { return a.release_date < b.release_date ? -1 : 1; })[0];
    var current = open.length ? open[open.length - 1] : null;
    var first = (state.me.name || '').split(' ')[0];
    var pct = Math.round(open.length / Math.max(mods.length, 1) * 100);

    var list = mods.map(function (m) {
      var st = statusOf(m);
      var meta = m.open
        ? (m.status === 'submitted' ? 'Abgeschickt am ' + U.fmtDate(m.submitted_at) : 'Geöffnet seit ' + U.fmtDate(m.release_date))
        : (m.release_date ? 'Öffnet sich am ' + U.fmtDate(m.release_date) : 'Termin folgt');
      var inner = '<span class="module-num">' + m.number + '</span>' +
        '<span><span class="m-title">' + esc(m.title || 'Modul ' + m.number) + '</span><span class="m-meta" style="display:block">' + esc(meta) + '</span></span>' +
        '<span class="chip ' + st.cls + '">' + esc(st.label) + '</span>';
      return m.open
        ? '<li><a class="module-item' + (current && current.id === m.id ? ' current' : '') + '" href="#/modul/' + m.number + '">' + inner + '</a></li>'
        : '<li><div class="module-item locked" aria-label="Modul ' + m.number + ', noch nicht geöffnet">' + inner + '</div></li>';
    }).join('');

    var s = state.settings;
    var side =
      '<div class="card card-dark">' + I.video.replace('<svg', '<svg class="card-icon"') +
      '<p class="eyebrow">Dein Videotermin</p><h3>Gespräch mit ' + esc(guideName()) + '</h3>' +
      '<p>' + esc(s.call_note || 'Hier findest du immer den Link zu unserem Videotermin.') + '</p>' +
      (s.call_link ? '<a class="btn btn-light" href="' + esc(s.call_link) + '">Zum Videotermin</a>'
        : '<p class="small">Der Link folgt in Kürze.</p>') + '</div>' +
      '<div class="card">' + I.book.replace('<svg', '<svg class="card-icon"') +
      '<h3>Mein Tagebuch</h3><p>Alle deine Antworten und Rückmeldungen an einem Ort — auch als PDF zum Aufbewahren.</p>' +
      '<a class="btn btn-outline" href="#/tagebuch">Tagebuch öffnen</a></div>' +
      (s.community_link ? '<div class="card">' + I.people.replace('<svg', '<svg class="card-icon"') +
        '<h3>Gemeinschaft</h3><p>Tausch dich mit den anderen Teilnehmenden aus.</p>' +
        '<a class="btn btn-outline" href="' + esc(s.community_link) + '">' + esc(s.community_label || 'Zum Gruppen-Chat') + '</a></div>' : '');

    root.innerHTML = chrome('home') +
      '<section class="r-hero"><div class="wrap">' +
      '<p class="eyebrow">Deine Reise</p><h1>Willkommen' + (first ? ', ' + esc(first) : '') + '</h1>' +
      '<p class="lead">' + (current
        ? 'Hier findest du alle Module deines Purpose-Guiding-Prozesses. Gerade bist du bei <strong>Modul ' + current.number + '</strong>.'
        : 'Hier findest du bald alle Module deines Purpose-Guiding-Prozesses.') +
      (next ? ' Das nächste Modul öffnet sich am ' + esc(U.fmtDate(next.release_date)) + '.' : '') + '</p>' +
      '<div class="progress"><div class="progress-track"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
      '<p class="progress-label">' + open.length + ' von ' + mods.length + ' Modulen geöffnet · ' + sent.length + ' Reflexion' + (sent.length === 1 ? '' : 'en') + ' abgeschickt</p></div>' +
      (current ? '<p style="margin-top:1.8rem"><a class="btn" href="#/modul/' + current.number + '">Modul ' + current.number + ' öffnen</a></p>' : '') +
      '</div></section>' +
      '<main class="r-main"><div class="wrap overview">' +
      '<section aria-labelledby="mods-t"><div class="section-title"><h2 id="mods-t">Deine Module</h2></div>' +
      '<ul class="module-list">' + list + '</ul></section>' +
      '<aside class="side" aria-label="Termin, Tagebuch und Gemeinschaft">' + side + '</aside>' +
      '</div></main>';
    bind();
  }

  /* ---------------- Modul ---------------- */
  function viewModule(num) {
    var m = state.modules.filter(function (x) { return String(x.number) === String(num); })[0];
    if (!m || !m.open) { location.hash = '#/'; return; }
    var submitted = m.status === 'submitted';
    var qs = m.questions || [];

    var res = '';
    if (m.pdf_url) {
      res += '<div class="resource"><div class="resource-head">' + I.pdf +
        '<div><div class="r-kind">Dokument</div><div class="r-name">' + esc(m.pdf_name || 'Modul ' + m.number + '.pdf') + '</div></div></div>' +
        '<div class="resource-actions"><a class="btn btn-small" href="' + esc(m.pdf_url) + '" target="_blank" rel="noopener">' + I.open + ' Lesen</a>' +
        '<a class="btn btn-outline btn-small" href="' + esc(m.pdf_download) + '" download="' + esc(m.pdf_name || '') + '">' + I.download + ' Herunterladen</a></div></div>';
    }
    if (m.audio_url) {
      res += '<div class="resource"><div class="resource-head">' + I.audio +
        '<div><div class="r-kind">Meditation</div><div class="r-name">' + esc(m.audio_name || 'Meditation') + '</div></div></div>' +
        '<audio controls preload="none" src="' + esc(m.audio_url) + '"></audio>' +
        '<div class="resource-actions"><a class="btn btn-outline btn-small" href="' + esc(m.audio_download) + '" download="' + esc(m.audio_name || '') + '">' + I.download + ' Herunterladen</a></div></div>';
    }

    var questions = qs.map(function (q, i) {
      var a = m.answers[i] || '';
      var fb = m.feedback && m.feedback[i];
      var body = submitted
        ? '<div class="answer-text' + (a ? '' : ' answer-empty') + '">' + (a ? esc(a) : 'Keine Antwort') + '</div>' +
          (fb ? '<div class="feedback"><div class="fb-who">Rückmeldung von ' + esc(guideName()) + '</div><p>' + esc(fb) + '</p></div>' : '')
        : '<textarea class="textarea" id="q' + i + '" data-q="' + i + '" placeholder="Deine Gedanken …">' + esc(a) + '</textarea>';
      return '<div class="question"><label class="q-label" for="q' + i + '"><span class="q-num">' + (i + 1 < 10 ? '0' : '') + (i + 1) + '</span><span>' + esc(q) + '</span></label>' + body + '</div>';
    }).join('');

    var notice = submitted
      ? '<div class="notice notice-done">' + I.check + '<span>Abgeschickt am ' + esc(U.fmtDate(m.submitted_at)) + '. ' +
        (m.feedback_at ? esc(guideName()) + ' hat dir geantwortet.' : esc(guideName()) + ' liest deine Antworten und meldet sich bei dir.') + '</span></div>'
      : '<div class="notice">' + I.lock + '<span>Deine Antworten sieht nur ' + esc(guideName()) + '. Sie werden automatisch gespeichert — du kannst jederzeit weiterschreiben und sie abschicken, wenn du so weit bist.</span></div>';

    root.innerHTML = chrome('module') +
      '<section class="r-hero"><div class="wrap">' +
      '<a class="back" href="#/">← Alle Module</a>' +
      '<p class="eyebrow">Modul ' + m.number + ' von ' + state.modules.length + '</p>' +
      '<h1>' + esc(m.title || 'Modul ' + m.number) + '</h1>' +
      (m.intro ? '<p class="lead">' + esc(m.intro) + '</p>' : '') +
      '</div></section>' +
      '<main class="r-main"><div class="narrow">' +
      (res ? '<div class="resources">' + res + '</div>' : '') +
      (qs.length ? '<section class="reflection" aria-labelledby="refl-t"><div class="reflection-head">' +
        '<p class="eyebrow">Reflexion</p><h2 id="refl-t">Deine Antworten</h2></div>' + notice + questions +
        (submitted ? '' : '<div class="submit-bar"><span class="save-state" aria-live="polite"></span>' +
          '<button type="button" class="btn" data-submit>Antworten abschicken</button></div>') +
        '</section>' : '') +
      '</div></main>';
    bind();
    if (!submitted && qs.length) bindAnswers(m);
  }

  function bindAnswers(m) {
    var tas = root.querySelectorAll('textarea[data-q]');
    var stateEl = root.querySelector('.save-state');
    var timer = null;
    function collect() { return Array.prototype.map.call(tas, function (t) { return t.value; }); }
    function save() {
      clearTimeout(timer); timer = null;
      var answers = collect();
      m.answers = answers; if (!m.status) m.status = 'draft';
      stateEl.textContent = 'Wird gespeichert …';
      var p = Reise.saveAnswers(m.id, answers, false).then(function () {
        stateEl.textContent = 'Gespeichert';
      }).catch(function (e) { stateEl.textContent = 'Nicht gespeichert: ' + e.message; });
      pendingSave = null;
      return p;
    }
    tas.forEach(function (t) {
      UI.autoGrow(t);
      t.addEventListener('input', function () {
        stateEl.textContent = 'Änderungen …';
        clearTimeout(timer); timer = setTimeout(save, 1200);
        pendingSave = save;
      });
    });
    stateEl.textContent = m.status === 'draft' ? 'Entwurf gespeichert' : '';
    root.querySelector('[data-submit]').addEventListener('click', function () {
      var answers = collect();
      var empty = answers.filter(function (a) { return !a.trim(); }).length;
      UI.dialog({
        title: 'Antworten abschicken?',
        text: (empty ? empty + ' von ' + answers.length + ' Fragen sind noch leer. ' : '') +
          'Nach dem Abschicken kannst du die Antworten nicht mehr ändern. ' + guideName() + ' bekommt sie zu lesen und kann dir darauf antworten.',
        ok: 'Abschicken', cancel: 'Noch weiterschreiben'
      }).then(function (ok) {
        if (!ok) return;
        clearTimeout(timer); pendingSave = null;
        Reise.saveAnswers(m.id, answers, true).then(function () {
          UI.toast('Danke! Deine Antworten sind abgeschickt.');
          return load();
        }).then(function () { viewModule(m.number); window.scrollTo(0, 0); })
          .catch(function (e) { UI.toast(e.message); });
      });
    });
  }

  function flushSave() {
    if (!pendingSave) return Promise.resolve();
    var f = pendingSave; pendingSave = null;
    return f();
  }

  /* ---------------- Tagebuch ---------------- */
  function viewDiary() {
    var mods = state.modules.filter(function (m) { return m.open && (m.status === 'submitted' || m.status === 'draft'); });
    var dates = mods.map(function (m) { return m.submitted_at || m.release_date; }).filter(Boolean).sort();
    var range = dates.length ? U.fmtDate(dates[0]) + (dates.length > 1 ? ' – ' + U.fmtDate(dates[dates.length - 1]) : '') : '';

    var body = mods.length ? mods.map(function (m) {
      var qs = (m.questions || []).map(function (q, i) {
        var a = m.answers[i] || '', fb = m.feedback && m.feedback[i];
        return '<div class="diary-q"><h3>' + esc(q) + '</h3>' +
          '<div class="answer-text' + (a ? '' : ' answer-empty') + '">' + (a ? esc(a) : 'Keine Antwort') + '</div>' +
          (fb ? '<div class="feedback"><div class="fb-who">Rückmeldung von ' + esc(guideName()) + '</div><p>' + esc(fb) + '</p></div>' : '') + '</div>';
      }).join('');
      return '<article class="diary-module"><p class="eyebrow">Modul ' + m.number + '</p><h2>' + esc(m.title) + '</h2>' +
        '<p class="d-meta">' + (m.status === 'submitted' ? 'Abgeschickt am ' + esc(U.fmtDate(m.submitted_at)) : 'Entwurf — noch nicht abgeschickt') + '</p>' + qs + '</article>';
    }).join('') : '<p class="muted" style="text-align:center">Sobald du die ersten Fragen beantwortet hast, entsteht hier dein Tagebuch.</p>';

    root.innerHTML = chrome('diary') +
      '<main class="r-main"><div class="narrow">' +
      '<header class="diary-cover"><span class="r-logo" aria-hidden="true"></span>' +
      '<p class="eyebrow">Deine Reise · Mein Tagebuch</p><h1>' + esc(state.me.name || 'Mein Tagebuch') + '</h1>' +
      (range ? '<p class="muted sans small">' + esc(range) + '</p>' : '') +
      (mods.length ? '<div class="diary-tools"><button type="button" class="btn" data-print>' + I.download + ' Als PDF speichern</button></div>' +
        '<p class="muted small no-print" style="margin-top:.9rem">Im Druckfenster „Als PDF sichern“ bzw. „Als PDF speichern“ wählen.</p>' : '') +
      '</header>' + body + '</div></main>';
    bind();
    var pb = root.querySelector('[data-print]');
    if (pb) pb.addEventListener('click', function () { window.print(); });
  }

  /* ---------------- Ablauf ---------------- */
  function load() {
    return Promise.all([Reise.journey(), Reise.settings()]).then(function (r) {
      state.modules = r[0] || []; state.settings = r[1] || {};
    });
  }

  function route() {
    var h = location.hash || '#/';
    var mm = h.match(/^#\/modul\/(\d+)/);
    window.scrollTo(0, 0);
    if (mm) return viewModule(mm[1]);
    if (h.indexOf('#/tagebuch') === 0) return viewDiary();
    return viewHome();
  }

  function enter(me) {
    if (!me) return showLogin();
    if (me.role === 'admin') { location.href = 'verwaltung.html'; return; }
    state.me = me;
    if (!me.approved) {
      root.innerHTML = UI.header({ links: [{ action: 'logout', label: 'Abmelden' }] }) +
        '<main class="r-main"><div class="narrow" style="text-align:center"><h1>Fast geschafft</h1>' +
        '<p class="muted" style="margin-top:1rem">Dein Zugang ist noch nicht freigeschaltet. Bitte melde dich bei <a href="mailto:' + esc(Reise.kontakt) + '">' + esc(Reise.kontakt) + '</a>.</p></div></main>';
      UI.bindChrome(root, { logout: function () { Reise.signOut().then(start); } });
      return;
    }
    root.innerHTML = '<div class="loading">Deine Reise wird geladen …</div>';
    load().then(route).catch(function (e) {
      root.innerHTML = '<div class="loading">' + esc(e.message) + '</div>';
    });
  }

  function showLogin() {
    UI.loginView(root, {
      onDone: enter,
      demoUsers: [
        { email: 'lena@example.com', label: 'Als Lena (Gruppe)' },
        { email: 'jonas@example.com', label: 'Als Jonas (Einzel)' }
      ]
    });
  }

  function start() {
    Reise.session().then(function (s) { return s ? Reise.me() : null; }).then(enter)
      .catch(function () { showLogin(); });
  }

  window.addEventListener('hashchange', function () {
    if (!state.me) return;
    flushSave().then(route);
  });
  window.addEventListener('beforeunload', function (e) {
    if (pendingSave) { pendingSave(); e.preventDefault(); e.returnValue = ''; }
  });

  start();
})();
