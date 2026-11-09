/* ==========================================================================
   Deine Reise — Verwaltung
   Routen: #/ (Klient:innen) · #/neu · #/person/<id> · #/gruppen · #/gruppe/<id|neu>
           #/module · #/modul/<Nummer> · #/einstellungen
   ========================================================================== */
(function () {
  'use strict';

  var root = document.getElementById('app');
  var esc = UI.esc, I = UI.I, U = Reise.util;
  var snap = null;

  function guideName() { return (snap && snap.settings.guide_name) || 'Carla'; }
  function platformUrl() { return location.origin + location.pathname.replace(/verwaltung\.html$/, ''); }

  function chrome(active) {
    return UI.header({
      home: '#/', sub: 'Verwaltung',
      links: [
        { href: '#/', label: 'Klient:innen', active: active === 'clients' },
        { href: '#/gruppen', label: 'Gruppen', active: active === 'groups' },
        { href: '#/module', label: 'Module', active: active === 'modules' },
        { href: '#/einstellungen', label: 'Einstellungen', active: active === 'settings' },
        { action: 'pw', label: 'Passwort' },
        { action: 'logout', label: 'Abmelden' }
      ]
    });
  }
  function page(active, title, eyebrow, body, lead) {
    root.innerHTML = chrome(active) +
      '<section class="r-hero" style="padding:2.6rem 0 2.8rem"><div class="wrap">' +
      (eyebrow ? '<p class="eyebrow">' + eyebrow + '</p>' : '') + '<h1>' + title + '</h1>' +
      (lead ? '<p class="lead">' + lead + '</p>' : '') + '</div></section>' +
      '<main class="r-main"><div class="wrap">' + body + '</div></main>';
    UI.bindChrome(root, {
      pw: UI.changePasswordDialog,
      logout: function () { Reise.signOut().then(start); }
    });
  }
  function $(sel) { return root.querySelector(sel); }
  function $$(sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); }
  function fail(e) { UI.toast(e && e.message ? e.message : 'Das hat leider nicht geklappt.'); }

  function groupName(id) {
    var g = snap.groups.filter(function (x) { return x.id === id; })[0];
    return g ? g.name : '';
  }
  function subOf(userId, moduleId) {
    return snap.submissions.filter(function (s) { return s.user_id === userId && s.module_id === moduleId; })[0] || null;
  }
  function stats(p) {
    var open = 0, sent = 0, waiting = 0;
    snap.modules.forEach(function (m) {
      if (U.isOpen(U.effectiveRelease(p, m.id, snap.schedule, snap.releases))) open++;
      var s = subOf(p.id, m.id);
      if (s && s.status === 'submitted') { sent++; if (!s.feedback_at) waiting++; }
    });
    return { open: open, sent: sent, waiting: waiting };
  }

  /* ---------------- Klient:innen ---------------- */
  function viewClients() {
    var rows = snap.clients.map(function (p) { return { p: p, s: stats(p) }; })
      .sort(function (a, b) { return (b.s.waiting - a.s.waiting) || a.p.name.localeCompare(b.p.name); });
    var total = rows.reduce(function (n, r) { return n + r.s.waiting; }, 0);
    var list = rows.length ? rows.map(function (r) {
      var p = r.p, s = r.s;
      return '<li><a class="module-item" href="#/person/' + esc(p.id) + '" style="grid-template-columns:minmax(0,1fr) auto">' +
        '<span><span class="m-title">' + esc(p.name || p.email) + (p.approved ? '' : ' <span class="chip chip-locked">gesperrt</span>') + '</span>' +
        '<span class="m-meta" style="display:block">' + esc(p.email) + ' · ' + esc(p.group_id ? groupName(p.group_id) : 'Einzelguiding') +
        ' · ' + s.open + '/' + snap.modules.length + ' geöffnet · ' + s.sent + ' abgeschickt</span></span>' +
        (s.waiting ? '<span class="chip chip-new">' + s.waiting + ' neu</span>' : '<span class="chip chip-done">aktuell</span>') +
        '</a></li>';
    }).join('') : '<li class="muted">Noch keine Klient:innen. Leg die erste Person an.</li>';

    page('clients', 'Klient:innen', 'Verwaltung',
      '<div class="section-title"><h2>' + snap.clients.length + ' Person' + (snap.clients.length === 1 ? '' : 'en') + '</h2>' +
      '<a class="btn" href="#/neu">+ Neue Person</a></div><ul class="module-list">' + list + '</ul>',
      total ? total + ' abgeschickte Reflexion' + (total === 1 ? ' wartet' : 'en warten') + ' auf deine Rückmeldung.' : 'Alle Reflexionen sind beantwortet.');
  }

  /* ---------------- Neue Person ---------------- */
  function viewNew() {
    var groups = snap.groups.map(function (g) { return '<option value="' + esc(g.id) + '">' + esc(g.name) + '</option>'; }).join('');
    page('clients', 'Neue Person', '<a class="back" href="#/" style="margin:0">← Klient:innen</a>',
      '<form class="narrow card" id="new-form" novalidate style="margin:0 auto">' +
      '<div class="field"><label for="n-name">Name</label><input class="input" id="n-name" required /></div>' +
      '<div class="field" style="margin-top:1rem"><label for="n-email">E-Mail</label><input class="input" id="n-email" type="email" required /></div>' +
      '<fieldset style="border:0;padding:0;margin:1.4rem 0 0"><legend class="field" style="padding:0"><label style="margin:0">Art der Begleitung</label></legend>' +
      '<label style="display:flex;gap:.6rem;align-items:center;margin:.6rem 0"><input type="radio" name="kind" value="group"' + (groups ? ' checked' : ' disabled') + ' /> Gruppe ' +
      '<select class="select" id="n-group" style="max-width:260px;margin-left:.4rem"' + (groups ? '' : ' disabled') + '>' + (groups || '<option>Noch keine Gruppe</option>') + '</select></label>' +
      '<label style="display:flex;gap:.6rem;align-items:center;flex-wrap:wrap"><input type="radio" name="kind" value="solo"' + (groups ? '' : ' checked') + ' /> Einzelguiding, Start am ' +
      '<input class="input" id="n-start" type="date" value="' + U.today() + '" style="max-width:190px" /></label>' +
      '<p class="muted small" style="margin:.6rem 0 0">Bei Einzelguiding öffnet sich ab dem Start alle ' + U.INTERVAL_DAYS + ' Tage ein neues Modul. Du kannst jedes Datum später ändern.</p></fieldset>' +
      '<div class="field" style="margin-top:1.4rem"><label for="n-pw">Passwort</label><input class="input" id="n-pw" value="' + esc(U.randomPassword()) + '" /></div>' +
      '<p class="form-msg" style="color:var(--clay)"></p>' +
      '<button class="btn" type="submit" style="margin-top:.6rem">Zugang anlegen</button></form>');

    $('#new-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = $('.form-msg');
      var name = $('#n-name').value.trim(), email = $('#n-email').value.trim(), pw = $('#n-pw').value.trim();
      var kind = (root.querySelector('input[name=kind]:checked') || {}).value;
      if (!name || !/^\S+@\S+\.\S+$/.test(email)) { msg.textContent = 'Bitte Name und eine gültige E-Mail angeben.'; return; }
      if (pw.length < 8) { msg.textContent = 'Das Passwort braucht mindestens 8 Zeichen.'; return; }
      msg.textContent = 'Wird angelegt …';
      var groupId = kind === 'group' ? $('#n-group').value : null;
      var start = $('#n-start').value || U.today();
      Reise.admin.createClient({ name: name, email: email, password: pw, group_id: groupId }).then(function (p) {
        if (kind !== 'solo') return p;
        return Promise.all(snap.modules.map(function (m, i) {
          return Reise.admin.setRelease(p.id, m.id, U.addDays(start, i * U.INTERVAL_DAYS));
        })).then(function () { return p; });
      }).then(function (p) {
        return reload().then(function () { viewWelcome(p, pw, true); });
      }).catch(function (err) { msg.textContent = err.message; });
    });
  }

  function welcomeText(p, pw) {
    var first = (p.name || '').split(' ')[0];
    return 'Hallo ' + first + ',\n\n' +
      'herzlich willkommen auf deiner Reise! Ab jetzt findest du alle Module deines Purpose-Guiding-Prozesses, ' +
      'deine Meditationen und dein persönliches Tagebuch an einem Ort:\n\n' + platformUrl() + '\n\n' +
      'Deine Zugangsdaten:\nE-Mail: ' + p.email + '\nPasswort: ' + pw + '\n\n' +
      'Nach der ersten Anmeldung kannst du dein Passwort oben unter „Passwort“ ändern.\n\n' +
      'Ich freue mich auf unsere gemeinsame Reise.\n' + guideName();
  }

  function viewWelcome(p, pw, isNew) {
    var text = welcomeText(p, pw);
    var mailto = 'mailto:' + encodeURIComponent(p.email) + '?subject=' + encodeURIComponent('Deine Reise – deine Zugangsdaten') + '&body=' + encodeURIComponent(text);
    page('clients', isNew ? 'Zugang angelegt' : 'Neues Passwort', '<a class="back" href="#/person/' + esc(p.id) + '" style="margin:0">← ' + esc(p.name) + '</a>',
      '<div class="narrow card" style="margin:0 auto">' +
      '<h3>E-Mail an ' + esc(p.name) + '</h3><p>Schick diese Nachricht an <strong>' + esc(p.email) + '</strong>. Du kannst sie vorher noch anpassen.</p>' +
      '<textarea class="textarea" id="w-text" style="min-height:22rem">' + esc(text) + '</textarea>' +
      '<div style="display:flex;gap:.6rem;flex-wrap:wrap;margin-top:1rem">' +
      '<a class="btn" id="w-mail" href="' + esc(mailto) + '">Im E-Mail-Programm öffnen</a>' +
      '<button type="button" class="btn btn-outline" id="w-copy">Text kopieren</button>' +
      '<a class="btn btn-outline" href="#/person/' + esc(p.id) + '">Weiter zu ' + esc((p.name || '').split(' ')[0]) + '</a></div></div>');
    $('#w-copy').addEventListener('click', function () {
      var t = $('#w-text').value;
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { UI.toast('Text kopiert.'); })
        .catch(function () { $('#w-text').select(); document.execCommand('copy'); UI.toast('Text kopiert.'); });
    });
    $('#w-text').addEventListener('input', function () {
      $('#w-mail').href = 'mailto:' + encodeURIComponent(p.email) + '?subject=' + encodeURIComponent('Deine Reise – deine Zugangsdaten') + '&body=' + encodeURIComponent($('#w-text').value);
    });
  }

  /* ---------------- Person ---------------- */
  function viewPerson(id, openModule) {
    var p = snap.clients.filter(function (x) { return x.id === id; })[0];
    if (!p) { location.hash = '#/'; return; }
    var s = stats(p);
    var groupOpts = '<option value="">Einzelguiding (eigener Plan)</option>' + snap.groups.map(function (g) {
      return '<option value="' + esc(g.id) + '"' + (g.id === p.group_id ? ' selected' : '') + '>' + esc(g.name) + '</option>';
    }).join('');

    var mods = snap.modules.map(function (m) {
      var rel = U.effectiveRelease(p, m.id, snap.schedule, snap.releases);
      var open = U.isOpen(rel);
      var sub = subOf(p.id, m.id);
      var srcLabel = rel.source === 'person'
        ? (rel.date ? 'persönliches Datum' : 'gesperrt')
        : (rel.date ? 'nach Gruppenplan' : 'noch kein Datum');
      var chip = sub && sub.status === 'submitted'
        ? (sub.feedback_at ? '<span class="chip chip-feedback">Rückmeldung gegeben</span>' : '<span class="chip chip-new">Neu abgeschickt</span>')
        : sub && sub.status === 'draft' ? '<span class="chip chip-draft">schreibt gerade</span>'
          : open ? '<span class="chip chip-done">geöffnet</span>' : '<span class="chip chip-locked">' + (rel.date ? 'ab ' + esc(U.fmtShort(rel.date)) : 'zu') + '</span>';
      return '<li class="card" style="padding:1.1rem 1.2rem" data-mod="' + esc(m.id) + '">' +
        '<div style="display:flex;justify-content:space-between;gap:1rem;align-items:flex-start;flex-wrap:wrap">' +
        '<div><span class="eyebrow" style="margin:0 0 .2rem;display:block">Modul ' + m.number + '</span><span class="m-title" style="font-family:var(--serif);font-size:1.3rem">' + esc(m.title) + '</span></div>' + chip + '</div>' +
        '<div style="display:flex;gap:.5rem;align-items:center;flex-wrap:wrap;margin-top:.9rem">' +
        '<label class="sans small muted" for="d-' + esc(m.id) + '">Öffnet am</label>' +
        '<input class="input" type="date" id="d-' + esc(m.id) + '" data-date value="' + esc(rel.date || '') + '" style="max-width:180px;padding:.5rem .7rem;font-size:1rem" />' +
        '<span class="sans small muted">(' + srcLabel + ')</span>' +
        (!open ? '<button type="button" class="btn btn-small" data-now>Jetzt öffnen</button>' : '') +
        (rel.date ? '<button type="button" class="btn btn-outline btn-small" data-lock>Sperren</button>' : '') +
        (rel.source === 'person' && p.group_id ? '<button type="button" class="link-btn" data-reset>Gruppenplan verwenden</button>' : '') +
        (sub ? '<button type="button" class="link-btn" data-answers style="margin-left:auto">' + (sub.status === 'submitted' ? 'Antworten lesen' : 'Entwurf ansehen') + '</button>' : '') +
        '</div><div class="answers-panel" hidden></div></li>';
    }).join('');

    page('clients', esc(p.name || p.email), '<a class="back" href="#/" style="margin:0">← Klient:innen</a>',
      '<div class="overview">' +
      '<section><div class="section-title"><h2>Module &amp; Freischaltung</h2></div><ul class="module-list">' + mods + '</ul></section>' +
      '<aside class="side">' +
      '<div class="card"><h3>Zugang</h3>' +
      '<div class="field"><label for="p-name">Name</label><input class="input" id="p-name" value="' + esc(p.name) + '" /></div>' +
      '<div class="field" style="margin-top:.9rem"><label for="p-group">Begleitung</label><select class="select" id="p-group">' + groupOpts + '</select></div>' +
      '<button type="button" class="btn btn-small" id="p-save" style="margin-top:1rem">Speichern</button>' +
      '<hr style="border:0;border-top:1px solid var(--line);margin:1.4rem 0" />' +
      '<p class="small">E-Mail: ' + esc(p.email) + '</p>' +
      '<div style="display:flex;gap:.5rem;flex-wrap:wrap"><button type="button" class="btn btn-outline btn-small" id="p-pw">Neues Passwort</button>' +
      '<button type="button" class="btn btn-outline btn-small" id="p-lock">' + (p.approved ? 'Zugang sperren' : 'Zugang freigeben') + '</button></div></div>' +
      '<div class="card card-dark"><p class="eyebrow">Stand</p><h3>' + s.open + ' von ' + snap.modules.length + ' Modulen geöffnet</h3>' +
      '<p>' + s.sent + ' Reflexion' + (s.sent === 1 ? '' : 'en') + ' abgeschickt' + (s.waiting ? ', ' + s.waiting + ' davon ohne Rückmeldung.' : '.') + '</p></div>' +
      '</aside></div>', esc(p.email) + ' · ' + esc(p.group_id ? groupName(p.group_id) : 'Einzelguiding'));

    $('#p-save').addEventListener('click', function () {
      Reise.admin.updateClient(p.id, { name: $('#p-name').value.trim(), group_id: $('#p-group').value || null })
        .then(reload).then(function () { UI.toast('Gespeichert.'); viewPerson(id); }).catch(fail);
    });
    $('#p-pw').addEventListener('click', function () {
      var pw = U.randomPassword();
      UI.dialog({ title: 'Neues Passwort erzeugen?', text: 'Das alte Passwort von ' + p.name + ' gilt dann nicht mehr. Danach bekommst du einen fertigen E-Mail-Text mit den neuen Zugangsdaten.', ok: 'Neues Passwort' })
        .then(function (ok) {
          if (!ok) return;
          return Reise.admin.setPassword(p.id, pw).then(function () { viewWelcome(p, pw, false); });
        }).catch(fail);
    });
    $('#p-lock').addEventListener('click', function () {
      Reise.admin.updateClient(p.id, { approved: !p.approved }).then(reload)
        .then(function () { UI.toast(p.approved ? 'Zugang gesperrt.' : 'Zugang freigegeben.'); viewPerson(id); }).catch(fail);
    });

    $$('[data-mod]').forEach(function (li) {
      var mid = li.getAttribute('data-mod');
      function act(promise, msg) {
        promise.then(reload).then(function () { UI.toast(msg); viewPerson(id); }).catch(fail);
      }
      var d = li.querySelector('[data-date]');
      d.addEventListener('change', function () {
        act(d.value ? Reise.admin.setRelease(p.id, mid, d.value) : Reise.admin.setRelease(p.id, mid, null),
          d.value ? 'Öffnet am ' + U.fmtDate(d.value) + '.' : 'Modul gesperrt.');
      });
      var b;
      if ((b = li.querySelector('[data-now]'))) b.addEventListener('click', function () { act(Reise.admin.setRelease(p.id, mid, U.today()), 'Modul ist jetzt geöffnet.'); });
      if ((b = li.querySelector('[data-lock]'))) b.addEventListener('click', function () { act(Reise.admin.setRelease(p.id, mid, null), 'Modul gesperrt.'); });
      if ((b = li.querySelector('[data-reset]'))) b.addEventListener('click', function () { act(Reise.admin.clearRelease(p.id, mid), 'Gruppenplan gilt wieder.'); });
      if ((b = li.querySelector('[data-answers]'))) b.addEventListener('click', function () { toggleAnswers(p, li, mid); });
    });
    if (openModule) {
      var li = root.querySelector('[data-mod="' + openModule + '"]');
      if (li) { toggleAnswers(p, li, openModule); li.scrollIntoView({ block: 'start' }); }
    }
  }

  function toggleAnswers(p, li, mid) {
    var panel = li.querySelector('.answers-panel');
    if (!panel.hidden) { panel.hidden = true; panel.innerHTML = ''; return; }
    var m = snap.modules.filter(function (x) { return x.id === mid; })[0];
    var sub = subOf(p.id, mid);
    var submitted = sub.status === 'submitted';
    panel.hidden = false;
    panel.innerHTML = '<div style="border-top:1px solid var(--line);margin-top:1.1rem;padding-top:1.2rem">' +
      (submitted ? '<p class="sans small muted">Abgeschickt am ' + esc(U.fmtDate(sub.submitted_at)) +
        (sub.feedback_at ? ' · deine Rückmeldung vom ' + esc(U.fmtDate(sub.feedback_at)) : '') + '</p>'
        : '<p class="sans small muted">Noch nicht abgeschickt — ' + esc((p.name || '').split(' ')[0]) + ' schreibt noch daran.</p>') +
      (m.questions || []).map(function (q, i) {
        var a = (sub.answers || [])[i] || '';
        return '<div class="question" style="margin-bottom:1.4rem"><div class="q-label" style="font-size:1.18rem"><span class="q-num">' + (i + 1) + '</span><span>' + esc(q) + '</span></div>' +
          '<div class="answer-text' + (a ? '' : ' answer-empty') + '">' + (a ? esc(a) : 'Keine Antwort') + '</div>' +
          (submitted ? '<label class="sans small muted" for="fb-' + i + '" style="display:block;margin:.7rem 0 .3rem">Deine Rückmeldung</label>' +
            '<textarea class="textarea" id="fb-' + i + '" data-fb="' + i + '" style="min-height:5rem" placeholder="Optional">' + esc((sub.feedback || [])[i] || '') + '</textarea>' : '') +
          '</div>';
      }).join('') +
      (submitted ? '<div style="display:flex;gap:.6rem;flex-wrap:wrap"><button type="button" class="btn btn-small" data-fb-save>Rückmeldung senden</button>' +
        '<button type="button" class="btn btn-outline btn-small" data-reopen>Zur Überarbeitung zurückgeben</button></div>' : '') + '</div>';
    if (!submitted) return;
    panel.querySelectorAll('textarea').forEach(function (t) { t.style.minHeight = '5rem'; });
    panel.querySelector('[data-fb-save]').addEventListener('click', function () {
      var fb = (m.questions || []).map(function (q, i) { var t = panel.querySelector('[data-fb="' + i + '"]'); return t ? t.value.trim() : ''; });
      Reise.admin.saveFeedback(p.id, mid, fb).then(reload).then(function () {
        UI.toast('Rückmeldung gespeichert — ' + (p.name || '').split(' ')[0] + ' sieht sie unter dem Modul und im Tagebuch.');
        viewPerson(p.id);
      }).catch(fail);
    });
    panel.querySelector('[data-reopen]').addEventListener('click', function () {
      UI.dialog({ title: 'Zur Überarbeitung zurückgeben?', text: (p.name || '').split(' ')[0] + ' kann die Antworten dann wieder bearbeiten und erneut abschicken.', ok: 'Zurückgeben' })
        .then(function (ok) {
          if (!ok) return;
          return Reise.admin.reopen(p.id, mid).then(reload).then(function () { UI.toast('Wieder zur Bearbeitung geöffnet.'); viewPerson(p.id); });
        }).catch(fail);
    });
  }

  /* ---------------- Gruppen ---------------- */
  function viewGroups() {
    var list = snap.groups.length ? snap.groups.map(function (g) {
      var n = snap.clients.filter(function (c) { return c.group_id === g.id; }).length;
      return '<li><a class="module-item" href="#/gruppe/' + esc(g.id) + '" style="grid-template-columns:minmax(0,1fr) auto">' +
        '<span><span class="m-title">' + esc(g.name) + '</span><span class="m-meta" style="display:block">Start ' + esc(U.fmtDate(g.start_date)) + ' · ' + n + ' Teilnehmende</span></span>' +
        '<span class="chip chip-done">Plan</span></a></li>';
    }).join('') : '<li class="muted">Noch keine Gruppe angelegt.</li>';
    page('groups', 'Gruppen', 'Verwaltung',
      '<div class="section-title"><h2>Gruppen</h2><a class="btn" href="#/gruppe/neu">+ Neue Gruppe</a></div><ul class="module-list">' + list + '</ul>',
      'Eine Gruppe hat einen gemeinsamen Freischaltplan. Einzelne Personen kannst du trotzdem individuell anpassen.');
  }

  function viewGroup(id) {
    var isNew = id === 'neu';
    var g = isNew ? { name: '', start_date: U.today() } : snap.groups.filter(function (x) { return x.id === id; })[0];
    if (!g) { location.hash = '#/gruppen'; return; }
    var members = isNew ? [] : snap.clients.filter(function (c) { return c.group_id === g.id; });
    var plan = isNew ? '' : '<section style="margin-top:2.4rem"><div class="section-title"><h2>Freischaltplan</h2>' +
      '<button type="button" class="btn btn-outline btn-small" id="g-recalc">Ab Startdatum alle ' + U.INTERVAL_DAYS + ' Tage</button></div>' +
      '<ul class="module-list">' + snap.modules.map(function (m) {
        var s = snap.schedule.filter(function (x) { return x.group_id === g.id && x.module_id === m.id; })[0];
        return '<li class="module-item" style="grid-template-columns:3.2rem minmax(0,1fr) auto"><span class="module-num">' + m.number + '</span>' +
          '<span class="m-title">' + esc(m.title) + '</span>' +
          '<input class="input" type="date" data-sched="' + esc(m.id) + '" value="' + esc(s ? s.release_date : '') + '" style="max-width:180px;padding:.5rem .7rem;font-size:1rem" aria-label="Modul ' + m.number + ' öffnet am" /></li>';
      }).join('') + '</ul></section>';

    page('groups', isNew ? 'Neue Gruppe' : esc(g.name), '<a class="back" href="#/gruppen" style="margin:0">← Gruppen</a>',
      '<div class="overview"><div>' +
      '<div class="card"><div class="field"><label for="g-name">Name</label><input class="input" id="g-name" value="' + esc(g.name) + '" placeholder="z. B. Gruppe Januar 2027" /></div>' +
      '<div class="field" style="margin-top:1rem"><label for="g-start">Start (Modul 1)</label><input class="input" type="date" id="g-start" value="' + esc(g.start_date || '') + '" style="max-width:200px" /></div>' +
      '<div style="display:flex;gap:.6rem;flex-wrap:wrap;margin-top:1.2rem"><button type="button" class="btn btn-small" id="g-save">' + (isNew ? 'Gruppe anlegen' : 'Speichern') + '</button>' +
      (isNew ? '' : '<button type="button" class="btn btn-outline btn-small" id="g-del">Gruppe löschen</button>') + '</div>' +
      (isNew ? '<p class="muted small" style="margin-top:1rem">Der Plan wird automatisch erstellt: Modul 1 am Starttag, danach alle ' + U.INTERVAL_DAYS + ' Tage ein neues Modul.</p>' : '') +
      '</div>' + plan + '</div>' +
      (isNew ? '' : '<aside class="side"><div class="card"><h3>Teilnehmende</h3>' +
        (members.length ? '<ul style="padding-left:1.1rem;margin:.6rem 0 0">' + members.map(function (c) {
          return '<li><a href="#/person/' + esc(c.id) + '">' + esc(c.name) + '</a></li>';
        }).join('') + '</ul>' : '<p>Noch niemand. Ordne Personen über „Neue Person“ oder auf ihrer Seite dieser Gruppe zu.</p>') + '</div></aside>') +
      '</div>');

    function planFrom(groupId, start) {
      return Promise.all(snap.modules.map(function (m, i) {
        return Reise.admin.setSchedule(groupId, m.id, U.addDays(start, i * U.INTERVAL_DAYS));
      }));
    }
    $('#g-save').addEventListener('click', function () {
      var name = $('#g-name').value.trim(), start = $('#g-start').value;
      if (!name || !start) { UI.toast('Bitte Name und Startdatum angeben.'); return; }
      Reise.admin.saveGroup({ id: isNew ? undefined : g.id, name: name, start_date: start }).then(function (saved) {
        return (isNew ? planFrom(saved.id, start) : Promise.resolve()).then(reload).then(function () {
          UI.toast(isNew ? 'Gruppe angelegt.' : 'Gespeichert.');
          if (isNew) location.hash = '#/gruppe/' + saved.id; else viewGroup(g.id);
        });
      }).catch(fail);
    });
    if (isNew) return;
    $('#g-del').addEventListener('click', function () {
      UI.dialog({ title: 'Gruppe löschen?', text: 'Der Plan der Gruppe wird gelöscht. Die Teilnehmenden behalten ihren Zugang, sehen aber nur noch Module mit persönlichem Datum.', ok: 'Löschen' })
        .then(function (ok) {
          if (!ok) return;
          return Reise.admin.deleteGroup(g.id).then(reload).then(function () { UI.toast('Gruppe gelöscht.'); location.hash = '#/gruppen'; });
        }).catch(fail);
    });
    $('#g-recalc').addEventListener('click', function () {
      var start = $('#g-start').value;
      if (!start) { UI.toast('Bitte zuerst ein Startdatum eintragen.'); return; }
      UI.dialog({ title: 'Plan neu berechnen?', text: 'Alle Daten werden ab ' + U.fmtDate(start) + ' im Abstand von ' + U.INTERVAL_DAYS + ' Tagen neu gesetzt.', ok: 'Neu berechnen' })
        .then(function (ok) {
          if (!ok) return;
          return planFrom(g.id, start).then(reload).then(function () { UI.toast('Plan aktualisiert.'); viewGroup(g.id); });
        }).catch(fail);
    });
    $$('[data-sched]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        Reise.admin.setSchedule(g.id, inp.getAttribute('data-sched'), inp.value || null).then(reload)
          .then(function () { UI.toast(inp.value ? 'Öffnet am ' + U.fmtDate(inp.value) + '.' : 'Datum entfernt.'); }).catch(fail);
      });
    });
  }

  /* ---------------- Module ---------------- */
  function viewModules() {
    var list = snap.modules.map(function (m) {
      var parts = [m.pdf_path ? 'PDF' : 'kein PDF', m.audio_path ? 'Meditation' : null, (m.questions || []).length + ' Fragen'].filter(Boolean);
      return '<li><a class="module-item" href="#/modul/' + m.number + '">' +
        '<span class="module-num">' + m.number + '</span><span><span class="m-title">' + esc(m.title || 'Ohne Titel') + '</span>' +
        '<span class="m-meta" style="display:block">' + esc(parts.join(' · ')) + '</span></span>' +
        (m.pdf_path ? '<span class="chip chip-done">bereit</span>' : '<span class="chip chip-draft">unvollständig</span>') + '</a></li>';
    }).join('');
    page('modules', 'Module', 'Verwaltung', '<ul class="module-list">' + list + '</ul>',
      'Hier legst du für jedes Modul das PDF, die Meditation und die Reflexionsfragen fest.');
  }

  function viewModuleEdit(num) {
    var m = snap.modules.filter(function (x) { return String(x.number) === String(num); })[0];
    if (!m) { location.hash = '#/module'; return; }
    function fileRow(kind, label, accept) {
      var path = m[kind + '_path'], name = m[kind + '_name'];
      return '<div class="field" style="margin-top:1.4rem"><label for="f-' + kind + '">' + label + '</label>' +
        '<p class="small" style="margin:.2rem 0 .6rem" id="cur-' + kind + '">' + (path ? 'Aktuell: <a href="#" data-view="' + kind + '">' + esc(name || 'Datei') + '</a>' +
          (kind === 'audio' ? ' · <button type="button" class="link-btn" data-remove-audio>entfernen</button>' : '') : '<span class="muted">Noch keine Datei</span>') + '</p>' +
        '<input type="file" id="f-' + kind + '" accept="' + accept + '" class="sans small" /></div>';
    }
    page('modules', 'Modul ' + m.number, '<a class="back" href="#/module" style="margin:0">← Module</a>',
      '<form class="narrow card" id="m-form" novalidate style="margin:0 auto">' +
      '<div class="field"><label for="m-title">Titel</label><input class="input" id="m-title" value="' + esc(m.title) + '" /></div>' +
      '<div class="field" style="margin-top:1.2rem"><label for="m-intro">Einleitung (kurz, erscheint oben auf der Modulseite)</label><textarea class="textarea" id="m-intro" style="min-height:6rem">' + esc(m.intro) + '</textarea></div>' +
      fileRow('pdf', 'PDF-Dokument', 'application/pdf,.pdf') +
      fileRow('audio', 'Meditation (optional, MP3 oder M4A)', 'audio/*,.mp3,.m4a,.wav') +
      '<div class="field" style="margin-top:1.4rem"><label for="m-q">Reflexionsfragen — eine Frage pro Zeile</label>' +
      '<textarea class="textarea" id="m-q" style="min-height:12rem">' + esc((m.questions || []).join('\n')) + '</textarea></div>' +
      '<p class="form-msg" style="color:var(--clay)"></p>' +
      '<button class="btn" type="submit">Speichern</button></form>');

    var removeAudio = false;
    $$('[data-view]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var w = window.open('', '_blank');
        Reise.admin.fileUrl(m[a.getAttribute('data-view') + '_path']).then(function (u) { if (u && w) w.location = u; else if (w) w.close(); });
      });
    });
    var rm = root.querySelector('[data-remove-audio]');
    if (rm) rm.addEventListener('click', function () { removeAudio = true; $('#cur-audio').innerHTML = '<span class="muted">Wird beim Speichern entfernt</span>'; });

    $('#m-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = $('.form-msg');
      var pdf = $('#f-pdf').files[0], audio = $('#f-audio').files[0];
      var upd = {
        id: m.id, title: $('#m-title').value.trim(), intro: $('#m-intro').value.trim(),
        questions: $('#m-q').value.split('\n').map(function (q) { return q.trim(); }).filter(Boolean),
        pdf_path: m.pdf_path, pdf_name: m.pdf_name,
        audio_path: removeAudio ? null : m.audio_path, audio_name: removeAudio ? null : m.audio_name
      };
      msg.textContent = (pdf || audio) ? 'Dateien werden hochgeladen …' : 'Wird gespeichert …';
      var steps = Promise.resolve();
      if (pdf) steps = steps.then(function () { return Reise.admin.uploadFile(m, 'pdf', pdf); }).then(function (r) { upd.pdf_path = r.path; upd.pdf_name = r.name; });
      if (audio) steps = steps.then(function () { return Reise.admin.uploadFile(m, 'audio', audio); }).then(function (r) { upd.audio_path = r.path; upd.audio_name = r.name; });
      steps.then(function () { return Reise.admin.saveModule(upd); }).then(reload).then(function () {
        UI.toast('Modul ' + m.number + ' gespeichert.'); viewModuleEdit(m.number);
      }).catch(function (err) { msg.textContent = err.message; });
    });
  }

  /* ---------------- Einstellungen ---------------- */
  function viewSettings() {
    var s = snap.settings;
    function f(key, label, ph, area) {
      return '<div class="field" style="margin-top:1.2rem"><label for="s-' + key + '">' + label + '</label>' +
        (area ? '<textarea class="textarea" id="s-' + key + '" style="min-height:5rem">' + esc(s[key] || '') + '</textarea>'
          : '<input class="input" id="s-' + key + '" value="' + esc(s[key] || '') + '" placeholder="' + esc(ph || '') + '" />') + '</div>';
    }
    page('settings', 'Einstellungen', 'Verwaltung',
      '<form class="narrow card" id="s-form" style="margin:0 auto">' +
      f('guide_name', 'Dein Name (so erscheint er bei Rückmeldungen)', 'Carla') +
      '<h3 style="margin-top:2rem">Videotermin</h3>' +
      f('call_link', 'Zoom- oder Google-Meet-Link', 'https://meet.google.com/…') +
      f('call_note', 'Kurzer Hinweis zum Termin', '', true) +
      '<h3 style="margin-top:2rem">Gemeinschaft</h3>' +
      f('community_link', 'Link zur Chat-Gruppe (Signal, WhatsApp, Telegram …)', 'https://…') +
      f('community_label', 'Text auf dem Button', 'Zur Signal-Gruppe') +
      '<button class="btn" type="submit" style="margin-top:1.6rem">Speichern</button></form>');
    $('#s-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var obj = {};
      ['guide_name', 'call_link', 'call_note', 'community_link', 'community_label'].forEach(function (k) { obj[k] = $('#s-' + k).value.trim(); });
      Reise.admin.saveSettings(obj).then(reload).then(function () { UI.toast('Einstellungen gespeichert.'); }).catch(fail);
    });
  }

  /* ---------------- Ablauf ---------------- */
  function reload() { return Reise.admin.snapshot().then(function (s) { snap = s; }); }

  function route() {
    var h = location.hash || '#/', m;
    window.scrollTo(0, 0);
    if (h === '#/neu') return viewNew();
    if ((m = h.match(/^#\/person\/([^/]+)(?:\/(.+))?/))) return viewPerson(decodeURIComponent(m[1]), m[2] && decodeURIComponent(m[2]));
    if (h === '#/gruppen') return viewGroups();
    if ((m = h.match(/^#\/gruppe\/(.+)/))) return viewGroup(decodeURIComponent(m[1]));
    if (h === '#/module') return viewModules();
    if ((m = h.match(/^#\/modul\/(\d+)/))) return viewModuleEdit(m[1]);
    if (h === '#/einstellungen') return viewSettings();
    return viewClients();
  }

  var ready = false;
  function enter(me) {
    if (!me) return showLogin();
    if (me.role !== 'admin') { location.href = './'; return; }
    root.innerHTML = '<div class="loading">Verwaltung wird geladen …</div>';
    reload().then(function () { ready = true; route(); }).catch(function (e) {
      root.innerHTML = '<div class="loading">' + esc(e.message) + '</div>';
    });
  }
  function showLogin() {
    ready = false;
    UI.loginView(root, {
      eyebrow: 'Deine Reise', title: 'Verwaltung', lead: 'Nur für das Innercraft-Team.', onDone: enter,
      demoUsers: [{ email: 'carla@innercraft.com', label: 'Als Verwaltung testen' }]
    });
  }
  function start() {
    Reise.session().then(function (s) { return s ? Reise.me() : null; }).then(enter).catch(showLogin);
  }
  window.addEventListener('hashchange', function () { if (ready) route(); });
  start();
})();
