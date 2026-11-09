-- ==========================================================================
-- Deine Reise — Datenbank für Supabase
-- Einmal komplett im Supabase SQL Editor ausführen (Run).
-- Kann gefahrlos erneut ausgeführt werden.
-- ==========================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------- Tabellen ------------------------------------------------------

create table if not exists public.groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  start_date  date,
  created_at  timestamptz not null default now()
);

create table if not exists public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  email       text,
  name        text not null default '',
  role        text not null default 'client' check (role in ('client', 'admin')),
  approved    boolean not null default false,   -- nur freigegebene Personen sehen Inhalte
  group_id    uuid references public.groups on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists public.modules (
  id          uuid primary key default gen_random_uuid(),
  number      int not null unique,
  title       text not null default '',
  intro       text not null default '',
  pdf_path    text,
  pdf_name    text,
  audio_path  text,
  audio_name  text,
  questions   jsonb not null default '[]',
  updated_at  timestamptz not null default now()
);

-- Freischaltplan einer Gruppe
create table if not exists public.group_schedule (
  group_id     uuid not null references public.groups on delete cascade,
  module_id    uuid not null references public.modules on delete cascade,
  release_date date not null,
  primary key (group_id, module_id)
);

-- Persönliche Freischaltung (schlägt den Gruppenplan; release_date null = gesperrt)
create table if not exists public.releases (
  user_id      uuid not null references public.profiles on delete cascade,
  module_id    uuid not null references public.modules on delete cascade,
  release_date date,
  primary key (user_id, module_id)
);

create table if not exists public.submissions (
  user_id      uuid not null references public.profiles on delete cascade,
  module_id    uuid not null references public.modules on delete cascade,
  answers      jsonb not null default '[]',
  status       text not null default 'draft' check (status in ('draft', 'submitted')),
  submitted_at timestamptz,
  feedback     jsonb not null default '[]',
  feedback_at  timestamptz,
  updated_at   timestamptz not null default now(),
  primary key (user_id, module_id)
);

create table if not exists public.settings (
  key   text primary key,
  value text
);

-- ---------- Hilfsfunktionen ----------------------------------------------

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_member() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and (approved or role = 'admin'));
$$;

create or replace function public.release_date_for(p_user uuid, p_module uuid) returns date
language sql stable security definer set search_path = public as $$
  select case
    when exists (select 1 from releases r where r.user_id = p_user and r.module_id = p_module)
      then (select r.release_date from releases r where r.user_id = p_user and r.module_id = p_module)
    else (select gs.release_date from profiles p
            join group_schedule gs on gs.group_id = p.group_id and gs.module_id = p_module
           where p.id = p_user)
  end;
$$;

create or replace function public.module_open(p_user uuid, p_module uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.release_date_for(p_user, p_module) <= (now() at time zone 'Europe/Berlin')::date, false)
     and exists (select 1 from profiles where id = p_user and approved);
$$;

-- Neues Konto → Profil anlegen (zunächst nicht freigegeben)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Funktionen für Klient:innen ----------------------------------

-- Alle Module der angemeldeten Person; Inhalte nur, wenn freigeschaltet
create or replace function public.my_journey()
returns table (
  id uuid, number int, title text, intro text, release_date date, open boolean,
  pdf_path text, pdf_name text, audio_path text, audio_name text, questions jsonb,
  status text, answers jsonb, feedback jsonb, submitted_at timestamptz, feedback_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select m.id, m.number, m.title,
         case when o.is_open then m.intro end,
         o.rd, o.is_open,
         case when o.is_open then m.pdf_path end,
         case when o.is_open then m.pdf_name end,
         case when o.is_open then m.audio_path end,
         case when o.is_open then m.audio_name end,
         case when o.is_open then m.questions else '[]'::jsonb end,
         s.status, s.answers, s.feedback, s.submitted_at, s.feedback_at
    from modules m
    cross join lateral (
      select public.release_date_for(auth.uid(), m.id) as rd,
             public.module_open(auth.uid(), m.id) as is_open
    ) o
    left join submissions s on s.user_id = auth.uid() and s.module_id = m.id
   where exists (select 1 from profiles where id = auth.uid() and approved)
   order by m.number;
$$;

-- Antworten speichern (Entwurf) oder abschicken
create or replace function public.save_answers(p_module uuid, p_answers jsonb, p_submit boolean default false)
returns void
language plpgsql security definer set search_path = public as $$
declare
  cur text;
begin
  if not public.module_open(auth.uid(), p_module) then
    raise exception 'Dieses Modul ist noch nicht freigeschaltet.';
  end if;
  select status into cur from submissions where user_id = auth.uid() and module_id = p_module;
  if cur = 'submitted' then
    raise exception 'Dieses Modul ist bereits abgeschickt.';
  end if;
  insert into submissions (user_id, module_id, answers, status, submitted_at, updated_at)
  values (auth.uid(), p_module, p_answers,
          case when p_submit then 'submitted' else 'draft' end,
          case when p_submit then now() end, now())
  on conflict (user_id, module_id) do update
    set answers = excluded.answers, status = excluded.status,
        submitted_at = excluded.submitted_at, updated_at = now();
end;
$$;

-- Darf die angemeldete Person diese Datei lesen? (nur Dateien freigeschalteter Module)
create or replace function public.can_read_file(p_name text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from modules m
     where (m.pdf_path = p_name or m.audio_path = p_name)
       and public.module_open(auth.uid(), m.id)
  );
$$;

-- ---------- Funktionen für die Verwaltung --------------------------------

create or replace function public.admin_set_password(p_user uuid, p_password text) returns void
language plpgsql security definer set search_path = public, extensions, auth as $$
begin
  if not public.is_admin() then raise exception 'Keine Berechtigung.'; end if;
  if length(p_password) < 8 then raise exception 'Das Passwort muss mindestens 8 Zeichen haben.'; end if;
  update auth.users
     set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')),
         updated_at = now()
   where id = p_user;
end;
$$;

-- ---------- Zugriffsregeln (Row Level Security) --------------------------

alter table public.groups         enable row level security;
alter table public.profiles       enable row level security;
alter table public.modules        enable row level security;
alter table public.group_schedule enable row level security;
alter table public.releases       enable row level security;
alter table public.submissions    enable row level security;
alter table public.settings       enable row level security;

drop policy if exists "profil lesen" on public.profiles;
create policy "profil lesen" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
drop policy if exists "profil verwalten" on public.profiles;
create policy "profil verwalten" on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "profil loeschen" on public.profiles;
create policy "profil loeschen" on public.profiles for delete to authenticated
  using (public.is_admin());

drop policy if exists "verwaltung" on public.groups;
create policy "verwaltung" on public.groups for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "verwaltung" on public.modules;
create policy "verwaltung" on public.modules for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "verwaltung" on public.group_schedule;
create policy "verwaltung" on public.group_schedule for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "verwaltung" on public.releases;
create policy "verwaltung" on public.releases for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "antworten lesen" on public.submissions;
create policy "antworten lesen" on public.submissions for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists "antworten verwalten" on public.submissions;
create policy "antworten verwalten" on public.submissions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "einstellungen lesen" on public.settings;
create policy "einstellungen lesen" on public.settings for select to authenticated
  using (public.is_member());
drop policy if exists "einstellungen verwalten" on public.settings;
create policy "einstellungen verwalten" on public.settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- Dateien (privater Speicher) ----------------------------------

insert into storage.buckets (id, name, public, file_size_limit)
values ('reise', 'reise', false, 52428800)
on conflict (id) do nothing;

drop policy if exists "reise verwaltung" on storage.objects;
create policy "reise verwaltung" on storage.objects for all to authenticated
  using (bucket_id = 'reise' and public.is_admin())
  with check (bucket_id = 'reise' and public.is_admin());

drop policy if exists "reise lesen" on storage.objects;
create policy "reise lesen" on storage.objects for select to authenticated
  using (bucket_id = 'reise' and public.can_read_file(name));

-- ---------- Startdaten ----------------------------------------------------

insert into public.modules (number, title)
select g, 'Modul ' || g from generate_series(1, 12) g
on conflict (number) do nothing;

insert into public.settings (key, value) values
  ('guide_name', 'Carla'),
  ('call_link', ''),
  ('call_note', 'Unsere Einzeltermine finden alle zwei Wochen statt. Der Link bleibt immer derselbe.'),
  ('community_link', ''),
  ('community_label', 'Gruppen-Chat')
on conflict (key) do nothing;

-- ---------- Zum Schluss: dich selbst zur Verwaltung machen ----------------
-- 1. Authentication → Users → Add user → Create new user
--    (deine E-Mail, ein Passwort, „Auto Confirm User“ anhaken)
-- 2. Dann diese Zeile mit deiner E-Mail-Adresse ausführen:
--
-- update public.profiles set role = 'admin', approved = true, name = 'Carla'
--  where email = 'carla@innercraft.com';
