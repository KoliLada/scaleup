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
      formThanks: function (name) { return 'Danke, ' + name + '. Deine Nachricht ist angekommen — wir melden uns bald bei dir.'; }
    },
    en: {
      menuOpen: 'Open menu',
      menuClose: 'Close menu',
      formMissing: 'Please fill in your name and email.',
      formSending: 'Sending …',
      formError: 'Sorry, sending did not work. Please try again later or write to us directly at carla@innercraft.com.',
      formThanks: function (name) { return 'Thank you, ' + name + '. Your message has arrived — we will get back to you soon.'; }
    },
    fr: {
      menuOpen: 'Ouvrir le menu',
      menuClose: 'Fermer le menu',
      formMissing: 'Merci de renseigner ton nom et ton e-mail.',
      formSending: 'Envoi en cours …',
      formError: 'L’envoi n’a malheureusement pas fonctionné. Réessaie plus tard ou écris-nous directement à carla@innercraft.com.',
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
      location.replace(browser + '/');
    }
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
            status.textContent = T.formError;
          }
        });
      }).catch(function () {
        status.textContent = T.formError;
      }).then(function () {
        if (submitBtn) submitBtn.disabled = false;
      });
    });
  }
})();
