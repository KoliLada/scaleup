/* Innercraft — interactions */
(function () {
  'use strict';

  /* ---- Sprache der Seite & Übersetzungen für JS-Texte ---- */
  var LANG = (document.documentElement.lang || 'de').slice(0, 2);
  var STRINGS = {
    de: {
      menuOpen: 'Menü öffnen',
      menuClose: 'Menü schließen',
      formMissing: 'Bitte fülle Name und E-Mail aus.',
      formSending: 'Wird gesendet …',
      formError: 'Senden hat leider nicht geklappt. Bitte versuche es später noch einmal oder schreib uns direkt an carla@innercraft.com.',
      formMailLink: 'Nachricht per E-Mail senden',
      formThanks: function (name) { return 'Danke, ' + name + '. Deine Nachricht ist angekommen — wir melden uns bald bei dir.'; }
    },
    en: {
      menuOpen: 'Open menu',
      menuClose: 'Close menu',
      formMissing: 'Please fill in your name and email.',
      formSending: 'Sending …',
      formError: 'Sorry, sending did not work. Please try again later or write to us directly at carla@innercraft.com.',
      formMailLink: 'Send message by email',
      formThanks: function (name) { return 'Thank you, ' + name + '. Your message has arrived — we will get back to you soon.'; }
    },
    fr: {
      menuOpen: 'Ouvrir le menu',
      menuClose: 'Fermer le menu',
      formMissing: 'Merci de renseigner ton nom et ton e-mail.',
      formSending: 'Envoi en cours …',
      formError: 'L’envoi n’a malheureusement pas fonctionné. Réessaie plus tard ou écris-nous directement à carla@innercraft.com.',
      formMailLink: 'Envoyer le message par e-mail',
      formThanks: function (name) { return 'Merci, ' + name + '. Ton message est bien arrivé — nous te répondrons bientôt.'; }
    }
  };
  var T = STRINGS[LANG] || STRINGS.de;

  /* ---- Sprachwahl: beim ersten Besuch Browser-Sprache anbieten ----
     - Die Wahl des Besuchers (Klick auf DE/EN/FR) wird gespeichert.
     - Nur auf der deutschen Startseite und nur ohne gespeicherte Wahl
       wird automatisch zur Browser-Sprache weitergeleitet.            */
  var LANG_KEY = 'innercraft-lang';

  document.querySelectorAll('[data-lang-choice]').forEach(function (link) {
    link.addEventListener('click', function () {
      try { localStorage.setItem(LANG_KEY, link.getAttribute('data-lang-choice')); } catch (e) { /* privater Modus */ }
    });
  });

  (function autoRedirect() {
    if (LANG !== 'de') return;                       // nur von der deutschen Seite aus
    if (location.pathname.indexOf('/en/') !== -1 || location.pathname.indexOf('/fr/') !== -1) return;
    var stored = null;
    try { stored = localStorage.getItem(LANG_KEY); } catch (e) { /* privater Modus */ }
    if (stored) return;                              // Besucher hat schon gewählt
    var browser = (navigator.language || 'de').slice(0, 2);
    if (browser === 'en' || browser === 'fr') {
      try { localStorage.setItem(LANG_KEY, browser); } catch (e) { /* privater Modus */ }
      var page = location.pathname.split('/').pop();   // z. B. programm.html → en/programm.html
      location.replace(browser + '/' + page);
    }
  })();

  /* ---- Video: YouTube erst nach Klick laden (Datenschutz) ---- */
  document.querySelectorAll('.video-embed[data-yt]').forEach(function (box) {
    var btn = box.querySelector('.video-facade');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(box.getAttribute('data-yt')) +
                   '?autoplay=1&rel=0&modestbranding=1&playsinline=1';
      iframe.title = btn.getAttribute('aria-label') || 'Video';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      box.innerHTML = '';
      box.appendChild(iframe);
    });
  });

  /* ---- Video-Kachel: Klick irgendwo auf die Fläche öffnet das YouTube-Video im Vollbild ----
     Der Loop läuft stumm in der Kachel. YouTube wird erst beim Klick geladen.
     Schließen: ✕, Escape oder Vollbild verlassen.                              */
  (function filmCards() {
    var overlay = document.querySelector('.film-overlay');
    var cards = document.querySelectorAll('.film-card[data-yt]');
    if (!overlay || !cards.length) return;
    var frame = overlay.querySelector('.film-frame');
    var btnClose = overlay.querySelector('.film-close');
    var lastCard = null, wasFullscreen = false;
    var fsElement = function () { return document.fullscreenElement || document.webkitFullscreenElement; };
    var playLoop = function (card) { var v = card && card.querySelector('video'); if (v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } };

    function open(card) {
      lastCard = card;
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(card.getAttribute('data-yt')) +
                   '?autoplay=1&rel=0&modestbranding=1&playsinline=1&fs=1';
      iframe.title = card.getAttribute('aria-label') || 'Video';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.innerHTML = '';
      frame.appendChild(iframe);
      overlay.hidden = false;
      document.body.classList.add('modal-open');
      var v = card.querySelector('video'); if (v) v.pause();
      var req = overlay.requestFullscreen || overlay.webkitRequestFullscreen;   // echtes Vollbild, wo erlaubt
      if (req) { try { var r = req.call(overlay); if (r && r.catch) r.catch(function () {}); } catch (e) { /* iPhone: Ebene füllt trotzdem den Bildschirm */ } }
      btnClose.focus();
    }
    function close() {
      if (overlay.hidden) return;
      frame.innerHTML = '';                 // stoppt das Video samt Ton
      overlay.hidden = true;
      document.body.classList.remove('modal-open');
      if (fsElement()) { var ex = document.exitFullscreen || document.webkitExitFullscreen; if (ex) { var r = ex.call(document); if (r && r.catch) r.catch(function () {}); } }
      playLoop(lastCard);
      if (lastCard) lastCard.focus();
    }
    cards.forEach(function (card) { card.addEventListener('click', function () { open(card); }); });
    btnClose.addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    ['fullscreenchange', 'webkitfullscreenchange'].forEach(function (ev) {
      document.addEventListener(ev, function () {
        if (fsElement()) { wasFullscreen = true; return; }
        if (wasFullscreen) { wasFullscreen = false; close(); }          // Vollbild per Esc verlassen → Video schließen
      });
    });
  })();

  /* ---- Testimonials: Hochkant-Clips (YouTube), stumm in Dauerschleife ----
     Klick auf einen Clip schaltet nur den Ton an (von vorne) bzw. wieder aus;
     der andere Clip verstummt. YouTube lädt erst, wenn der Abschnitt naht.
     Startet ein Player nicht, wird er durch das normale YouTube-Video ersetzt. */
  (function testimonials() {
    var clips = Array.prototype.slice.call(document.querySelectorAll('.testimonial-clip[data-yt]'));
    if (!clips.length) return;
    var requested = false;
    function loadApi(cb) {
      if (window.YT && window.YT.Player) return cb();
      var prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () { if (typeof prev === 'function') prev(); cb(); };
      if (!requested) {
        requested = true;
        var s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; s.async = true;
        document.head.appendChild(s);
      }
    }
    function setSound(clip, on) {
      clip.classList.toggle('is-sound', on);
      var btn = clip.querySelector('.testimonial-sound');
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.querySelector('.ts-label').textContent = on ? btn.getAttribute('data-off') : btn.getAttribute('data-on');
    }
    function fallback(clip) {                          // normales YouTube-Video mit eigener Steuerung
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(clip.getAttribute('data-yt')) + '?autoplay=1&playsinline=1&rel=0';
      f.allow = 'autoplay; encrypted-media; picture-in-picture'; f.allowFullscreen = true;
      f.title = clip.querySelector('.testimonial-sound').getAttribute('aria-label');
      var old = clip.querySelector('.testimonial-player, iframe'); if (old) old.replaceWith(f); else clip.appendChild(f);
      clip.classList.add('is-fallback');
    }
    function init() {
      clips.forEach(function (clip) {
        var id = clip.getAttribute('data-yt');
        var vars = { autoplay: 1, mute: 1, controls: 0, loop: 1, playlist: id, playsinline: 1, rel: 0,
                     modestbranding: 1, disablekb: 1, iv_load_policy: 3, fs: 0, enablejsapi: 1 };
        if (/^https?:$/.test(location.protocol)) vars.origin = location.origin;
        clip._player = new YT.Player(clip.querySelector('.testimonial-player'), {
          videoId: id, width: '100%', height: '100%', playerVars: vars,
          events: {
            onReady: function (e) { e.target.mute(); e.target.playVideo(); clip.classList.add('is-ready'); },
            onStateChange: function (e) { if (e.data === 0) e.target.playVideo(); }   // Sicherheitsnetz Schleife
          }
        });
      });
    }
    clips.forEach(function (clip) {
      clip.querySelector('.testimonial-sound').addEventListener('click', function () {
        var pl = clip._player;
        if (!pl || !clip.classList.contains('is-ready')) { fallback(clip); return; }
        var on = !clip.classList.contains('is-sound');
        clips.forEach(function (o) { if (o !== clip && o._player && o.classList.contains('is-sound')) { o._player.mute(); setSound(o, false); } });
        if (on) { pl.seekTo(0, true); pl.unMute(); pl.setVolume(100); pl.playVideo(); } else { pl.mute(); }
        setSound(clip, on);
      });
    });
    var row = clips[0].closest('.testimonial-row') || clips[0];
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        if (entries.some(function (e) { return e.isIntersecting; })) { io.disconnect(); loadApi(init); }
      }, { rootMargin: '400px' });
      io.observe(row);
    } else { loadApi(init); }
  })();

  /* ---- Header shadow on scroll ---- */
  var header = document.querySelector('.site-header');
  var onScroll = function () {
    if (window.scrollY > 40) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- Mobile navigation ---- */
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.getElementById('nav-menu');
  if (toggle && menu) {
    var setMenu = function (open) {
      menu.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? T.menuClose : T.menuOpen);
    };
    toggle.addEventListener('click', function () {
      setMenu(!menu.classList.contains('open'));
    });
    menu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });
  }

  /* ---- Reveal on scroll ---- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el, i) {
      // gentle stagger within shared parents
      el.style.transitionDelay = (Math.min(i % 4, 3) * 90) + 'ms';
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---- Current year ---- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- Modal / Popup (Angebots-Details) ---- */
  var openModalEl = null;

  function openModal(id) {
    var modal = document.getElementById(id);
    if (!modal) return;
    modal.hidden = false;
    document.body.classList.add('modal-open');
    openModalEl = modal;
    var closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) closeBtn.focus();
  }

  function closeModal() {
    if (!openModalEl) return;
    openModalEl.hidden = true;
    document.body.classList.remove('modal-open');
    openModalEl = null;
  }

  document.addEventListener('click', function (e) {
    var opener = e.target.closest('[data-modal-open]');
    if (opener) {
      e.preventDefault();
      openModal(opener.getAttribute('data-modal-open'));
      return;
    }
    // Schließen: X-Button, „Jetzt anfragen"-Link, oder Klick auf den Hintergrund
    if (e.target.closest('.modal-close') || e.target.closest('[data-modal-close]')) {
      closeModal();
      return;
    }
    if (e.target.classList && e.target.classList.contains('modal-overlay')) {
      closeModal();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && openModalEl) closeModal();
  });

  /* ---- Contact form (front-end only stub) ---- */
  var form = document.getElementById('contact-form');
  var status = document.getElementById('form-status');
  if (form) {
    // Anfragen gehen an carla@innercraft.com (Kopie an nl@innercraft.com),
    // versendet über FormSubmit (kostenlos, ohne Server). Betreff: ANFRAGE.
    var FORM_ENDPOINT = 'https://formsubmit.co/ajax/carla@innercraft.com';

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.querySelector('#name');
      var email = form.querySelector('#email');
      var interest = form.querySelector('#interest');
      var message = form.querySelector('#message');

      if (!name.value.trim() || !email.value.trim()) {
        status.textContent = T.formMissing;
        return;
      }

      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      status.textContent = T.formSending;

      var payload = {
        Name: name.value.trim(),
        'E-Mail': email.value.trim(),
        Interesse: interest ? interest.value : '',
        Nachricht: message ? message.value.trim() : '',
        Sprache: LANG.toUpperCase(),
        _subject: 'ANFRAGE',
        _cc: 'nl@innercraft.com',
        _template: 'table',
        _captcha: 'false',
        _replyto: email.value.trim()
      };

      // Falls der Versand scheitert: fertig ausgefüllte E-Mail anbieten,
      // damit keine Anfrage verloren geht.
      function showFallback() {
        var body = 'Name: ' + payload.Name + '\nE-Mail: ' + payload['E-Mail'] +
          '\nInteresse: ' + payload.Interesse + '\n\n' + payload.Nachricht;
        var a = document.createElement('a');
        a.href = 'mailto:carla@innercraft.com?subject=' + encodeURIComponent('ANFRAGE') +
          '&body=' + encodeURIComponent(body);
        a.className = 'form-mail-link';
        a.textContent = T.formMailLink;
        status.textContent = T.formError + ' ';
        status.appendChild(a);
      }

      fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (res.ok && (data.success === true || data.success === 'true')) {
            status.textContent = T.formThanks(name.value.trim().split(' ')[0]);
            form.reset();
          } else {
            if (window.console) console.warn('Kontaktformular:', res.status, data && data.message);
            showFallback();
          }
        });
      }).catch(function () {
        showFallback();
      }).then(function () {
        if (submitBtn) submitBtn.disabled = false;
      });
    });
  }
})();
