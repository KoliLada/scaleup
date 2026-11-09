/* ==========================================================================
   Deine Reise — gemeinsame Bausteine (Kopfzeile, Login, Dialoge, Icons)
   ========================================================================== */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var I = {
    pdf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/></svg>',
    audio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12h2l2-5 3 10 3-14 3 12 2-3h3"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
    open: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
    video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3"/></svg>',
    people: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c.6-3.4 3-5.4 6-5.4s5.4 2 6 5.4"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.7c2.6.2 4.4 2 5 5.3"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5M8 7h7M8 11h5"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
  };

  function toast(msg) {
    var old = document.querySelector('.toast');
    if (old) old.remove();
    var t = document.createElement('div');
    t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 3200);
  }

  /* Dialog: { title, text, html, ok, cancel } → Promise<boolean | Element> */
  function dialog(o) {
    return new Promise(function (resolve) {
      var b = document.createElement('div');
      b.className = 'dialog-backdrop';
      b.innerHTML = '<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-t">' +
        '<h3 id="dlg-t">' + esc(o.title) + '</h3>' +
        (o.text ? '<p class="muted">' + esc(o.text) + '</p>' : '') + (o.html || '') +
        '<div class="dialog-actions">' +
        (o.cancel === false ? '' : '<button type="button" class="btn btn-outline btn-small" data-x="0">' + esc(o.cancel || 'Abbrechen') + '</button>') +
        '<button type="button" class="btn btn-small" data-x="1">' + esc(o.ok || 'OK') + '</button></div></div>';
      document.body.appendChild(b);
      var dlg = b.querySelector('.dialog');
      function close(v) { document.removeEventListener('keydown', onKey); b.remove(); resolve(v); }
      function onKey(e) { if (e.key === 'Escape') close(false); }
      document.addEventListener('keydown', onKey);
      b.addEventListener('click', function (e) {
        if (e.target === b) return close(false);
        var x = e.target.closest('[data-x]');
        if (!x) return;
        if (x.getAttribute('data-x') === '1') {
          if (o.validate && !o.validate(dlg)) return;
          close(o.html ? dlg : true);
        } else close(false);
      });
      var first = dlg.querySelector('input, textarea, select') || dlg.querySelector('[data-x="1"]');
      if (first) first.focus();
    });
  }

  function demoBar() {
    if (Reise.mode !== 'demo') return '';
    return '<div class="demo-bar">Demo-Modus mit Beispieldaten — alles wird nur in diesem Browser gespeichert. ' +
      '<button type="button" data-demo-reset>Beispieldaten zurücksetzen</button></div>';
  }

  function header(o) {
    var links = (o.links || []).map(function (l) {
      if (l.action) return '<li><button type="button" data-action="' + esc(l.action) + '">' + esc(l.label) + '</button></li>';
      return '<li><a href="' + esc(l.href) + '"' + (l.active ? ' class="active" aria-current="page"' : '') + '>' + esc(l.label) + '</a></li>';
    }).join('');
    return demoBar() +
      '<header class="r-header"><div class="wrap">' +
      '<a class="r-brand" href="' + esc(o.home || '#/') + '" aria-label="Deine Reise — Übersicht">' +
      '<span class="r-logo" aria-hidden="true"></span><span class="r-brand-sub">' + esc(o.sub || 'Deine Reise') + '</span></a>' +
      '<button class="r-menu-btn" type="button" aria-label="Menü" aria-expanded="false"><span></span><span></span><span></span></button>' +
      '<ul class="r-nav">' + links + '</ul></div></header>';
  }

  function bindChrome(root, handlers) {
    var menuBtn = root.querySelector('.r-menu-btn');
    var nav = root.querySelector('.r-nav');
    if (menuBtn && nav) {
      menuBtn.addEventListener('click', function () {
        var open = nav.classList.toggle('open');
        menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      nav.addEventListener('click', function () { nav.classList.remove('open'); });
    }
    root.querySelectorAll('[data-action]').forEach(function (b) {
      b.addEventListener('click', function () { var h = handlers[b.getAttribute('data-action')]; if (h) h(); });
    });
    var reset = root.querySelector('[data-demo-reset]');
    if (reset) reset.addEventListener('click', function () {
      Reise.resetDemo(); location.hash = '#/'; location.reload();
    });
  }

  /* Login-Seite. onDone(profile) wird nach erfolgreicher Anmeldung aufgerufen. */
  function loginView(root, opts) {
    var demo = Reise.mode === 'demo';
    root.innerHTML = demoBar() +
      '<main class="login-page"><div class="login-card">' +
      '<span class="r-logo" aria-hidden="true"></span>' +
      '<p class="eyebrow" style="color:var(--gold)">' + esc(opts.eyebrow || 'Innercraft Purpose Guiding') + '</p>' +
      '<h1>' + esc(opts.title || 'Deine Reise') + '</h1>' +
      '<p class="lead">' + esc(opts.lead || 'Melde dich mit den Zugangsdaten an, die du per E-Mail bekommen hast.') + '</p>' +
      '<form class="login-form" novalidate>' +
      '<div class="field"><label for="l-email">E-Mail</label><input class="input" id="l-email" type="email" autocomplete="username" required /></div>' +
      '<div class="field"><label for="l-pw">Passwort</label><input class="input" id="l-pw" type="password" autocomplete="current-password" required /></div>' +
      '<button class="btn btn-light" type="submit">Anmelden</button>' +
      '<p class="form-msg" role="alert"></p></form>' +
      '<p class="login-help">Passwort vergessen? Schreib uns an <a href="mailto:' + esc(Reise.kontakt) + '">' + esc(Reise.kontakt) + '</a> — wir schicken dir neue Zugangsdaten.</p>' +
      (demo ? '<div class="demo-logins"><p>Demo ausprobieren — ohne Passwort:</p>' +
        (opts.demoUsers || []).map(function (u) {
          return '<button type="button" class="btn btn-ghost btn-small" data-demo-login="' + esc(u.email) + '">' + esc(u.label) + '</button>';
        }).join('') + '</div>' : '') +
      '</div></main>';
    bindChrome(root, {});
    var form = root.querySelector('form');
    var msg = root.querySelector('.form-msg');
    function go(email, pw) {
      msg.textContent = 'Anmeldung läuft …';
      Reise.signIn(email, pw).then(function () { return Reise.me(); }).then(function (me) {
        msg.textContent = '';
        opts.onDone(me);
      }).catch(function (e) { msg.textContent = e.message || 'Anmeldung fehlgeschlagen.'; });
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = root.querySelector('#l-email').value.trim(), pw = root.querySelector('#l-pw').value;
      if (!email || (!pw && !demo)) { msg.textContent = 'Bitte E-Mail und Passwort eingeben.'; return; }
      go(email, pw);
    });
    root.querySelectorAll('[data-demo-login]').forEach(function (b) {
      b.addEventListener('click', function () { go(b.getAttribute('data-demo-login'), ''); });
    });
  }

  function changePasswordDialog() {
    return dialog({
      title: 'Passwort ändern', ok: 'Speichern',
      html: '<div class="field" style="margin-top:.6rem"><label for="pw1">Neues Passwort</label><input class="input" id="pw1" type="password" autocomplete="new-password" /></div>' +
        '<div class="field" style="margin-top:1rem"><label for="pw2">Noch einmal</label><input class="input" id="pw2" type="password" autocomplete="new-password" /></div>' +
        '<p class="form-msg" style="color:var(--clay)"></p>',
      validate: function (d) {
        var a = d.querySelector('#pw1').value, b = d.querySelector('#pw2').value, m = d.querySelector('.form-msg');
        if (a.length < 8) { m.textContent = 'Bitte mindestens 8 Zeichen.'; return false; }
        if (a !== b) { m.textContent = 'Die beiden Passwörter stimmen nicht überein.'; return false; }
        return true;
      }
    }).then(function (d) {
      if (!d) return;
      return Reise.changePassword(d.querySelector('#pw1').value).then(function () { toast('Dein Passwort ist geändert.'); })
        .catch(function (e) { toast(e.message); });
    });
  }

  function autoGrow(ta) {
    function fit() { ta.style.height = 'auto'; ta.style.height = Math.max(ta.scrollHeight + 2, 144) + 'px'; }
    ta.addEventListener('input', fit); fit();
  }

  window.UI = {
    esc: esc, I: I, toast: toast, dialog: dialog, header: header, bindChrome: bindChrome,
    loginView: loginView, changePasswordDialog: changePasswordDialog, autoGrow: autoGrow
  };
})();
