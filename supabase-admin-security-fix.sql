-- Run this in Supabase's SQL editor. The signup trigger no longer blindly trusts
-- whatever "role" the client sends - it checks the coach code itself, server-side.
-- Note: this brings back a client-visible code (same tradeoff as before - anyone
-- reading the JS bundle can find "12345123"), by explicit choice. If you rotate
-- this code later, update it in App.jsx AND here, they must match.

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role, network, onboarded)
  values (
    new.id,
    new.email,
    case when (new.raw_user_meta_data ->> 'coach_code') = '12345123' then 'admin' else 'trainee' end,
    (new.raw_user_meta_data ->> 'network')::uuid,
    (new.raw_user_meta_data ->> 'coach_code') = '12345123'
  );
  return new;
end;
$$ language plpgsql security definer;

-- If you ever need to promote someone manually instead:
-- update public.profiles set role = 'admin' where email = 'your-email@example.com';

-- From then on, that admin can promote anyone else to admin or team_leader
-- directly inside the app (Management tab) - protected by the same RLS policies
-- that already gate every other role change, not by a string in the bundle.

-- Also adds image_url to app_content, used by tip articles the coach publishes
-- (the thumbnail/button shown on the tips page). Falls back to a generated design
-- automatically if left empty, so this is optional.
alter table public.app_content add column if not exists image_url text;

-- New table for the coach's monthly "most attendances" leaderboard - records
-- individual (not just team-aggregate) attendance per training.
create table if not exists public.individual_attendance (
  id uuid default gen_random_uuid() primary key,
  event_id text,
  date date not null,
  team_id int,
  user_id uuid references public.profiles(id) on delete cascade,
  present boolean not null default false,
  created_at timestamptz default now()
);

alter table public.individual_attendance enable row level security;

-- Team leaders insert for their own team; admins (coaches) read everything.
create policy "leaders insert own team attendance" on public.individual_attendance
  for insert with check (is_leader() and team_id = my_team_id());
create policy "admins read all individual attendance" on public.individual_attendance
  for select using (is_admin());
create policy "leaders read own team attendance" on public.individual_attendance
  for select using (is_leader() and team_id = my_team_id());

-- Adds date_label to app_content, used by the gibushim portal (the מועד shown
-- when a trainee taps a gibush name, e.g. "אפריל 2026 שייטת 13"). Optional.
alter table public.app_content add column if not exists date_label text;
