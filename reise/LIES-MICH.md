# Deine Reise — geschützter Bereich für Klient:innen

Adresse: `/reise/` auf der Website · Verwaltung: `/reise/verwaltung.html`

## Was es kann

**Für Klient:innen**
- Anmeldung mit E-Mail und Passwort
- 12 Module, die sich nach Plan öffnen (PDF zum Lesen und Herunterladen, optional eine Meditation)
- Reflexionsfragen pro Modul: Antworten speichern sich automatisch, werden abgeschickt und sind danach fest
- Rückmeldungen direkt unter den Antworten
- „Mein Tagebuch“: alle Fragen, Antworten und Rückmeldungen als ein Dokument, auch als PDF
- Videotermin-Link und Link zur Chat-Gruppe

**Verwaltung (nur für dich)**
- Personen anlegen, mit fertigem E-Mail-Text mit den Zugangsdaten
- Gruppen mit gemeinsamem Plan (alle 14 Tage), jede Person auch einzeln anpassbar
- Module bearbeiten: Titel, Einleitung, PDF, Meditation, Fragen
- Antworten lesen, Rückmeldung schreiben, zur Überarbeitung zurückgeben
- Neues Passwort erzeugen, Zugang sperren

## Demo-Modus

Solange in `config.js` nichts eingetragen ist, läuft alles mit Beispieldaten im eigenen Browser.

## Stand

Eingerichtet am 10. November 2026: Supabase-Projekt `eldumjjgzxzyauoanlvx` (EU, Irland), Datenbank aus `supabase/schema.sql`,
E-Mail-Bestätigung aus, Verwaltungszugang `carla@innercraft.com`. Die Supabase-Bibliothek liegt lokal in `vendor/`.

## Einrichten (einmalig, ca. 10 Minuten)

1. Auf https://supabase.com kostenlos registrieren → **New project**
   - Name: `innercraft-reise`, Region: **Central EU (Frankfurt)**, ein Datenbank-Passwort vergeben
2. **SQL Editor** → **New query** → den Inhalt von `supabase/schema.sql` einfügen → **Run**
3. **Authentication → Sign In / Providers → Email**: **„Confirm email“ ausschalten** (die Zugänge legst du selbst an)
4. **Authentication → Users → Add user → Create new user**: deine E-Mail und ein Passwort, „Auto Confirm User“ anhaken
5. Im SQL Editor (mit deiner E-Mail-Adresse):
   ```sql
   update public.profiles set role = 'admin', approved = true, name = 'Carla'
    where email = 'carla@innercraft.com';
   ```
6. **Project Settings → API**: „Project URL“ und „anon public key“ in `config.js` eintragen

## Gut zu wissen

- **Kosten:** Supabase und Cloudflare sind im Gratis-Tarif. Grenzen: 1 GB für Dateien, 50 MB pro Datei.
- **Ruhepause:** Ein Gratis-Projekt pausiert nach 7 Tagen ganz ohne Nutzung. Per Klick im Supabase-Dashboard läuft es wieder.
- **Passwort vergessen:** In der Verwaltung auf der Seite der Person „Neues Passwort“ klicken und die E-Mail schicken.
- **Datenschutz:** Daten liegen in Frankfurt. In die Datenschutzerklärung der Website gehört ein Absatz zu Supabase als Auftragsverarbeiter (DPA im Supabase-Dashboard).
