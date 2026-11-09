/* ==========================================================================
   Deine Reise — Datenschicht
   Zwei Backends mit derselben Schnittstelle:
     - live: Supabase (Login, Datenbank, geschützte Dateien)
     - demo: Beispieldaten im localStorage dieses Browsers
   ========================================================================== */
(function () {
  'use strict';

  var CFG = window.REISE_CONFIG || {};
  var LIVE = !!(CFG.supabaseUrl && CFG.supabaseAnonKey);
  var MODULE_COUNT = 12;
  var INTERVAL_DAYS = 14;

  /* ---------- Datums-Helfer (Tage als 'YYYY-MM-DD', lokale Zeit) ---------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function toStr(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function today() { return toStr(new Date()); }
  function addDays(str, n) {
    var p = str.split('-');
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    d.setDate(d.getDate() + n);
    return toStr(d);
  }
  var MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  function fmtDate(str) {
    if (!str) return '';
    var p = str.slice(0, 10).split('-');
    return (+p[2]) + '. ' + MONATE[+p[1] - 1] + ' ' + p[0];
  }
  function fmtShort(str) {
    if (!str) return '';
    var p = str.slice(0, 10).split('-');
    return (+p[2]) + '. ' + MONATE[+p[1] - 1];
  }

  /* Freischaltung: persönliche Angabe schlägt Gruppenplan.
     Persönlicher Eintrag mit Datum null = bewusst gesperrt. */
  function effectiveRelease(profile, moduleId, schedule, releases) {
    for (var i = 0; i < releases.length; i++) {
      var r = releases[i];
      if (r.user_id === profile.id && r.module_id === moduleId) {
        return { date: r.release_date, source: 'person' };
      }
    }
    if (profile.group_id) {
      for (var j = 0; j < schedule.length; j++) {
        var s = schedule[j];
        if (s.group_id === profile.group_id && s.module_id === moduleId) {
          return { date: s.release_date, source: 'gruppe' };
        }
      }
    }
    return { date: null, source: profile.group_id ? 'gruppe' : 'keine' };
  }
  function isOpen(rel) { return !!(rel && rel.date && rel.date <= today()); }

  function randomPassword() {
    var words = ['wald', 'quelle', 'stern', 'moos', 'fluss', 'licht', 'eiche', 'feder', 'wolke', 'berg', 'wind', 'farn'];
    var a = new Uint32Array(3);
    (window.crypto || window.msCrypto).getRandomValues(a);
    return words[a[0] % words.length] + '-' + words[a[1] % words.length] + '-' + (100 + a[2] % 900);
  }

  function safeName(name) {
    return name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9._-]+/g, '-').toLowerCase();
  }

  /* ======================================================================
     DEMO-BACKEND
     ====================================================================== */
  var DEMO_KEY = 'reise-demo-v1';
  var demoBlobs = {}; // in dieser Sitzung hochgeladene Dateien

  var DEMO_TITLES = [
    'Den Ruf der Seele hören', 'Die Reise beginnt', 'Deine Beschützer kennenlernen', 'Ganzheit wiederherstellen',
    'Die Sprache der Natur', 'Eintritt in die Imaginalwelt', 'Der Kompass des Herzens', 'Der Kokon der Transformation',
    'An der Schwelle', 'Die Seelenbegegnung', 'Deine tiefste Natur verkörpern', 'Ein Leben im Einklang mit der Seele'
  ];
  var DEMO_QUESTIONS = [
    'Was hat dich beim Lesen dieses Moduls am meisten berührt?',
    'Welche Erinnerung oder welches Bild ist während der Meditation aufgetaucht?',
    'Wo in deinem Leben spürst du gerade eine Schwelle?',
    'Was möchtest du in den nächsten zwei Wochen bewusst beobachten?',
    'Welche Frage nimmst du mit in unser nächstes Gespräch?'
  ];

  function demoSeed() {
    var start = addDays(today(), -35); // Module 1–3 offen, Modul 4 in 7 Tagen
    var modules = [];
    for (var i = 1; i <= MODULE_COUNT; i++) {
      modules.push({
        id: 'm' + i, number: i, title: DEMO_TITLES[i - 1],
        intro: 'In diesem Modul gehen wir einen weiteren Schritt auf deiner Reise. Lies dir das Dokument in Ruhe durch, nimm dir Zeit für die Meditation und beantworte danach die Fragen — so ausführlich, wie es sich für dich richtig anfühlt.',
        pdf_path: 'demo/beispiel-modul.pdf', pdf_name: 'Modul ' + i + ' – ' + DEMO_TITLES[i - 1] + '.pdf',
        audio_path: i % 2 === 1 ? '../app/audio/journey-iteration-1-1780316600958.m4a' : null,
        audio_name: i % 2 === 1 ? 'Meditation Modul ' + i + '.m4a' : null,
        questions: DEMO_QUESTIONS.slice()
      });
    }
    var schedule = modules.map(function (m, idx) {
      return { group_id: 'g1', module_id: m.id, release_date: addDays(start, idx * INTERVAL_DAYS) };
    });
    var soloStart = addDays(today(), -3);
    var releases = modules.map(function (m, idx) {
      return { user_id: 'u2', module_id: m.id, release_date: addDays(soloStart, idx * INTERVAL_DAYS) };
    });
    var t1 = addDays(today(), -30) + 'T19:12:00', t2 = addDays(today(), -12) + 'T08:40:00';
    return {
      settings: {
        guide_name: 'Carla',
        call_link: 'https://meet.google.com/abc-defg-hij',
        call_note: 'Unsere Einzeltermine finden alle zwei Wochen statt. Der Link bleibt immer derselbe.',
        community_link: 'https://signal.group/',
        community_label: 'Signal-Gruppe'
      },
      groups: [{ id: 'g1', name: 'Gruppe 2027', start_date: start }],
      profiles: [
        { id: 'admin', email: 'carla@innercraft.com', name: 'Carla', role: 'admin', approved: true, group_id: null },
        { id: 'u1', email: 'lena@example.com', name: 'Lena Beispiel', role: 'client', approved: true, group_id: 'g1' },
        { id: 'u2', email: 'jonas@example.com', name: 'Jonas Beispiel', role: 'client', approved: true, group_id: null }
      ],
      modules: modules,
      schedule: schedule,
      releases: releases,
      submissions: [
        {
          user_id: 'u1', module_id: 'm1', status: 'submitted', submitted_at: t1, updated_at: t1,
          answers: [
            'Der Gedanke, dass der Ruf nicht laut sein muss, um wahr zu sein. Ich habe ihn wohl schon lange gehört, nur nicht hingehört.',
            'Ein Bild von mir als Kind am Bach hinter dem Haus meiner Großeltern — ganz versunken, ohne Zeitgefühl.',
            'Im Beruf. Ich spüre, dass das, was ich tue, nicht mehr ganz zu mir passt.',
            'Wann ich mich lebendig fühle und wann ich nur funktioniere.',
            'Wie unterscheide ich zwischen Sehnsucht und Flucht?'
          ],
          feedback: [
            'Wie schön, dass du das so klar benennst. Genau dieses leise Hören üben wir gemeinsam weiter.',
            'Ein kraftvolles Bild — lass uns im Gespräch dort hingehen.',
            '', '', 'Eine wunderbare Frage. Die nehmen wir uns beim nächsten Termin vor.'
          ],
          feedback_at: addDays(today(), -28) + 'T10:05:00'
        },
        {
          user_id: 'u1', module_id: 'm2', status: 'submitted', submitted_at: t2, updated_at: t2,
          answers: [
            'Der Abschnitt über das Aufbrechen ohne fertigen Plan.',
            'Ein Weg durch hohes Gras, der sich erst beim Gehen zeigt.',
            'Zwischen dem alten und einem noch unbekannten Leben.',
            'Meine Ausreden.',
            'Was brauche ich, um mir selbst zu vertrauen?'
          ],
          feedback: [], feedback_at: null
        }
      ],
      session: null
    };
  }

  function demoLoad() {
    try {
      var raw = localStorage.getItem(DEMO_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignorieren */ }
    var s = demoSeed();
    demoSave(s);
    return s;
  }
  function demoSave(s) { try { localStorage.setItem(DEMO_KEY, JSON.stringify(s)); } catch (e) { /* ignorieren */ } }
  function demoFileUrl(path) {
    if (!path) return null;
    if (demoBlobs[path]) return demoBlobs[path];
    if (path.indexOf('demo/') === 0 || path.indexOf('../') === 0) return path;
    return null;
  }
  function delay(v) { return new Promise(function (res) { setTimeout(function () { res(v); }, 120); }); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  var Demo = {
    signIn: function (email) {
      var s = demoLoad();
      var p = s.profiles.filter(function (x) { return x.email.toLowerCase() === String(email).trim().toLowerCase(); })[0];
      if (!p) return Promise.reject(new Error('Diese E-Mail-Adresse ist nicht bekannt.'));
      s.session = p.id; demoSave(s);
      return delay({ id: p.id });
    },
    signOut: function () { var s = demoLoad(); s.session = null; demoSave(s); return delay(); },
    session: function () { var s = demoLoad(); return delay(s.session ? { id: s.session } : null); },
    changePassword: function () { return delay(); },
    me: function () {
      var s = demoLoad();
      return delay(clone(s.profiles.filter(function (p) { return p.id === s.session; })[0] || null));
    },
    settings: function () { return delay(clone(demoLoad().settings)); },
    journey: function () {
      var s = demoLoad();
      var me = s.profiles.filter(function (p) { return p.id === s.session; })[0];
      if (!me) return delay([]);
      return delay(s.modules.map(function (m) {
        var rel = effectiveRelease(me, m.id, s.schedule, s.releases);
        var open = isOpen(rel) && me.approved;
        var sub = s.submissions.filter(function (x) { return x.user_id === me.id && x.module_id === m.id; })[0] || {};
        var pdf = open ? demoFileUrl(m.pdf_path) : null;
        var audio = open ? demoFileUrl(m.audio_path) : null;
        return {
          id: m.id, number: m.number, title: m.title, release_date: rel.date, open: open,
          intro: open ? m.intro : null,
          questions: open ? m.questions : [],
          pdf_name: open ? m.pdf_name : null, pdf_url: pdf, pdf_download: pdf,
          audio_name: open ? m.audio_name : null, audio_url: audio, audio_download: audio,
          status: sub.status || null, answers: sub.answers || [], feedback: sub.feedback || [],
          submitted_at: sub.submitted_at || null, feedback_at: sub.feedback_at || null
        };
      }));
    },
    saveAnswers: function (moduleId, answers, submit) {
      var s = demoLoad();
      var sub = s.submissions.filter(function (x) { return x.user_id === s.session && x.module_id === moduleId; })[0];
      if (sub && sub.status === 'submitted') return Promise.reject(new Error('Dieses Modul ist bereits abgeschickt.'));
      if (!sub) { sub = { user_id: s.session, module_id: moduleId, feedback: [], feedback_at: null }; s.submissions.push(sub); }
      sub.answers = answers; sub.status = submit ? 'submitted' : 'draft';
      sub.submitted_at = submit ? new Date().toISOString() : null;
      sub.updated_at = new Date().toISOString();
      demoSave(s);
      return delay();
    },
    admin: {
      snapshot: function () {
        var s = demoLoad();
        return delay(clone({
          clients: s.profiles.filter(function (p) { return p.role !== 'admin'; }),
          groups: s.groups, modules: s.modules, schedule: s.schedule,
          releases: s.releases, submissions: s.submissions, settings: s.settings
        }));
      },
      createClient: function (c) {
        var s = demoLoad();
        if (s.profiles.some(function (p) { return p.email.toLowerCase() === c.email.toLowerCase(); })) {
          return Promise.reject(new Error('Diese E-Mail-Adresse hat schon einen Zugang.'));
        }
        var p = { id: 'u' + Date.now(), email: c.email, name: c.name, role: 'client', approved: true, group_id: c.group_id || null };
        s.profiles.push(p); demoSave(s);
        return delay(clone(p));
      },
      updateClient: function (id, patch) {
        var s = demoLoad();
        s.profiles.forEach(function (p) { if (p.id === id) Object.assign(p, patch); });
        demoSave(s); return delay();
      },
      setPassword: function () { return delay(); },
      saveGroup: function (g) {
        var s = demoLoad();
        if (g.id) s.groups.forEach(function (x) { if (x.id === g.id) Object.assign(x, g); });
        else { g.id = 'g' + Date.now(); s.groups.push(g); }
        demoSave(s); return delay(clone(g));
      },
      deleteGroup: function (id) {
        var s = demoLoad();
        s.groups = s.groups.filter(function (g) { return g.id !== id; });
        s.schedule = s.schedule.filter(function (x) { return x.group_id !== id; });
        s.profiles.forEach(function (p) { if (p.group_id === id) p.group_id = null; });
        demoSave(s); return delay();
      },
      setSchedule: function (groupId, moduleId, date) {
        var s = demoLoad();
        s.schedule = s.schedule.filter(function (x) { return !(x.group_id === groupId && x.module_id === moduleId); });
        if (date) s.schedule.push({ group_id: groupId, module_id: moduleId, release_date: date });
        demoSave(s); return delay();
      },
      setRelease: function (userId, moduleId, date) {
        var s = demoLoad();
        s.releases = s.releases.filter(function (x) { return !(x.user_id === userId && x.module_id === moduleId); });
        s.releases.push({ user_id: userId, module_id: moduleId, release_date: date || null });
        demoSave(s); return delay();
      },
      clearRelease: function (userId, moduleId) {
        var s = demoLoad();
        s.releases = s.releases.filter(function (x) { return !(x.user_id === userId && x.module_id === moduleId); });
        demoSave(s); return delay();
      },
      saveModule: function (m) {
        var s = demoLoad();
        s.modules.forEach(function (x) { if (x.id === m.id) Object.assign(x, m); });
        demoSave(s); return delay();
      },
      uploadFile: function (module, kind, file) {
        var path = 'blob/' + module.number + '-' + kind + '-' + Date.now();
        demoBlobs[path] = URL.createObjectURL(file);
        return delay({ path: path, name: file.name });
      },
      fileUrl: function (path) { return delay(demoFileUrl(path)); },
      saveFeedback: function (userId, moduleId, feedback) {
        var s = demoLoad();
        s.submissions.forEach(function (x) {
          if (x.user_id === userId && x.module_id === moduleId) { x.feedback = feedback; x.feedback_at = new Date().toISOString(); }
        });
        demoSave(s); return delay();
      },
      reopen: function (userId, moduleId) {
        var s = demoLoad();
        s.submissions.forEach(function (x) {
          if (x.user_id === userId && x.module_id === moduleId) { x.status = 'draft'; x.submitted_at = null; }
        });
        demoSave(s); return delay();
      },
      saveSettings: function (obj) {
        var s = demoLoad(); Object.assign(s.settings, obj); demoSave(s); return delay();
      }
    },
    resetDemo: function () { try { localStorage.removeItem(DEMO_KEY); } catch (e) { /* ignorieren */ } }
  };

  /* ======================================================================
     LIVE-BACKEND (Supabase)
     ====================================================================== */
  var SB_SRC = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';
  var BUCKET = 'reise';
  var sbPromise = null;

  function sb() {
    if (sbPromise) return sbPromise;
    sbPromise = new Promise(function (resolve, reject) {
      if (window.supabase && window.supabase.createClient) return resolve();
      var s = document.createElement('script');
      s.src = SB_SRC; s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('Die Verbindung zum Server konnte nicht hergestellt werden.')); };
      document.head.appendChild(s);
    }).then(function () {
      return window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, {
        auth: { persistSession: true, storageKey: 'reise-auth' }
      });
    });
    return sbPromise;
  }
  function check(res) {
    if (res.error) throw new Error(germanError(res.error.message));
    return res.data;
  }
  function germanError(msg) {
    var m = String(msg || '');
    if (/Invalid login credentials/i.test(m)) return 'E-Mail oder Passwort stimmen nicht.';
    if (/already registered|already been registered/i.test(m)) return 'Diese E-Mail-Adresse hat schon einen Zugang.';
    if (/Password should be at least/i.test(m)) return 'Das Passwort muss mindestens 8 Zeichen haben.';
    if (/Failed to fetch|NetworkError/i.test(m)) return 'Keine Verbindung zum Server. Bitte prüfe deine Internetverbindung.';
    return m;
  }

  function signedUrls(client, paths, names) {
    // Liefert { path: { view, download } } für alle Pfade
    var out = {};
    var list = paths.filter(Boolean);
    if (!list.length) return Promise.resolve(out);
    return Promise.all(list.map(function (p, i) {
      var st = client.storage.from(BUCKET);
      return Promise.all([
        st.createSignedUrl(p, 3600),
        st.createSignedUrl(p, 3600, { download: names[p] || true })
      ]).then(function (r) {
        out[p] = { view: r[0].data && r[0].data.signedUrl, download: r[1].data && r[1].data.signedUrl };
      });
    })).then(function () { return out; });
  }

  var Live = {
    signIn: function (email, password) {
      return sb().then(function (c) { return c.auth.signInWithPassword({ email: email.trim(), password: password }); })
        .then(check).then(function (d) { return { id: d.user.id }; });
    },
    signOut: function () { return sb().then(function (c) { return c.auth.signOut(); }); },
    session: function () {
      return sb().then(function (c) { return c.auth.getSession(); })
        .then(function (r) { return r.data && r.data.session ? { id: r.data.session.user.id } : null; });
    },
    changePassword: function (pw) {
      return sb().then(function (c) { return c.auth.updateUser({ password: pw }); }).then(check);
    },
    me: function () {
      return sb().then(function (c) {
        return c.auth.getUser().then(function (r) {
          if (!r.data || !r.data.user) return null;
          return c.from('profiles').select('*').eq('id', r.data.user.id).maybeSingle().then(check);
        });
      });
    },
    settings: function () {
      return sb().then(function (c) { return c.from('settings').select('key,value'); }).then(check)
        .then(function (rows) { var o = {}; (rows || []).forEach(function (r) { o[r.key] = r.value; }); return o; });
    },
    journey: function () {
      var client;
      return sb().then(function (c) { client = c; return c.rpc('my_journey'); }).then(check).then(function (rows) {
        rows = rows || [];
        var names = {}, paths = [];
        rows.forEach(function (m) {
          if (m.pdf_path) { paths.push(m.pdf_path); names[m.pdf_path] = m.pdf_name; }
          if (m.audio_path) { paths.push(m.audio_path); names[m.audio_path] = m.audio_name; }
        });
        return signedUrls(client, paths, names).then(function (urls) {
          return rows.map(function (m) {
            var p = urls[m.pdf_path] || {}, a = urls[m.audio_path] || {};
            m.pdf_url = p.view || null; m.pdf_download = p.download || null;
            m.audio_url = a.view || null; m.audio_download = a.download || null;
            m.answers = m.answers || []; m.feedback = m.feedback || []; m.questions = m.questions || [];
            return m;
          });
        });
      });
    },
    saveAnswers: function (moduleId, answers, submit) {
      return sb().then(function (c) {
        return c.rpc('save_answers', { p_module: moduleId, p_answers: answers, p_submit: !!submit });
      }).then(check);
    },
    admin: {
      snapshot: function () {
        return sb().then(function (c) {
          return Promise.all([
            c.from('profiles').select('*').neq('role', 'admin').order('created_at'),
            c.from('groups').select('*').order('created_at'),
            c.from('modules').select('*').order('number'),
            c.from('group_schedule').select('*'),
            c.from('releases').select('*'),
            c.from('submissions').select('*'),
            c.from('settings').select('key,value')
          ]);
        }).then(function (r) {
          var d = r.map(check);
          var settings = {};
          (d[6] || []).forEach(function (x) { settings[x.key] = x.value; });
          return { clients: d[0], groups: d[1], modules: d[2], schedule: d[3], releases: d[4], submissions: d[5], settings: settings };
        });
      },
      createClient: function (c) {
        // Eigener Client ohne gespeicherte Sitzung, damit die Verwaltung angemeldet bleibt.
        return sb().then(function (main) {
          var tmp = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, {
            auth: { persistSession: false, autoRefreshToken: false, storageKey: 'reise-tmp' }
          });
          return tmp.auth.signUp({ email: c.email.trim(), password: c.password, options: { data: { name: c.name } } })
            .then(check).then(function (d) {
              if (!d.user || (d.user.identities && d.user.identities.length === 0)) {
                throw new Error('Diese E-Mail-Adresse hat schon einen Zugang.');
              }
              var id = d.user.id;
              return main.from('profiles').update({ name: c.name, approved: true, group_id: c.group_id || null })
                .eq('id', id).select().single().then(check);
            });
        });
      },
      updateClient: function (id, patch) {
        return sb().then(function (c) { return c.from('profiles').update(patch).eq('id', id); }).then(check);
      },
      setPassword: function (id, pw) {
        return sb().then(function (c) { return c.rpc('admin_set_password', { p_user: id, p_password: pw }); }).then(check);
      },
      saveGroup: function (g) {
        return sb().then(function (c) {
          var row = { name: g.name, start_date: g.start_date || null };
          return (g.id ? c.from('groups').update(row).eq('id', g.id) : c.from('groups').insert(row)).select().single();
        }).then(check);
      },
      deleteGroup: function (id) {
        return sb().then(function (c) { return c.from('groups').delete().eq('id', id); }).then(check);
      },
      setSchedule: function (groupId, moduleId, date) {
        return sb().then(function (c) {
          if (!date) return c.from('group_schedule').delete().eq('group_id', groupId).eq('module_id', moduleId);
          return c.from('group_schedule').upsert({ group_id: groupId, module_id: moduleId, release_date: date });
        }).then(check);
      },
      setRelease: function (userId, moduleId, date) {
        return sb().then(function (c) {
          return c.from('releases').upsert({ user_id: userId, module_id: moduleId, release_date: date || null });
        }).then(check);
      },
      clearRelease: function (userId, moduleId) {
        return sb().then(function (c) {
          return c.from('releases').delete().eq('user_id', userId).eq('module_id', moduleId);
        }).then(check);
      },
      saveModule: function (m) {
        return sb().then(function (c) {
          return c.from('modules').update({
            title: m.title, intro: m.intro, questions: m.questions,
            pdf_path: m.pdf_path, pdf_name: m.pdf_name, audio_path: m.audio_path, audio_name: m.audio_name,
            updated_at: new Date().toISOString()
          }).eq('id', m.id);
        }).then(check);
      },
      uploadFile: function (module, kind, file) {
        var path = 'modul-' + module.number + '/' + kind + '-' + Date.now() + '-' + safeName(file.name);
        return sb().then(function (c) {
          return c.storage.from(BUCKET).upload(path, file, { contentType: file.type || undefined, upsert: false });
        }).then(check).then(function () { return { path: path, name: file.name }; });
      },
      fileUrl: function (path) {
        if (!path) return Promise.resolve(null);
        return sb().then(function (c) { return c.storage.from(BUCKET).createSignedUrl(path, 3600); })
          .then(function (r) { return r.data ? r.data.signedUrl : null; });
      },
      saveFeedback: function (userId, moduleId, feedback) {
        return sb().then(function (c) {
          return c.from('submissions').update({ feedback: feedback, feedback_at: new Date().toISOString() })
            .eq('user_id', userId).eq('module_id', moduleId);
        }).then(check);
      },
      reopen: function (userId, moduleId) {
        return sb().then(function (c) {
          return c.from('submissions').update({ status: 'draft', submitted_at: null })
            .eq('user_id', userId).eq('module_id', moduleId);
        }).then(check);
      },
      saveSettings: function (obj) {
        var rows = Object.keys(obj).map(function (k) { return { key: k, value: obj[k] }; });
        return sb().then(function (c) { return c.from('settings').upsert(rows); }).then(check);
      }
    }
  };

  var api = LIVE ? Live : Demo;
  api.mode = LIVE ? 'live' : 'demo';
  api.kontakt = CFG.kontakt || 'carla@innercraft.com';
  api.util = {
    today: today, addDays: addDays, fmtDate: fmtDate, fmtShort: fmtShort,
    effectiveRelease: effectiveRelease, isOpen: isOpen, randomPassword: randomPassword,
    MODULE_COUNT: MODULE_COUNT, INTERVAL_DAYS: INTERVAL_DAYS
  };
  window.Reise = api;
})();
