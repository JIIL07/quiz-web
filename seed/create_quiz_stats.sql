-- Analytics table for quiz funnel tracking.
-- Stores one row per user session (session_id) and updates it through the flow.

create table if not exists public.quiz_stats (
  id bigserial primary key,
  session_id text not null unique,
  status text not null default 'started',

  quiz_template_id bigint null,
  quiz_slug text null,
  quiz_title text null,
  total_steps integer null,

  last_step_index integer null,
  last_step_id text null,
  last_step_type text null,

  answers_count integer not null default 0,
  score_total integer null,
  result_from integer null,
  result_title text null,
  result_action text null,

  application_clicked boolean not null default false,
  application_clicked_at timestamptz null,

  utm_source text null,
  utm_medium text null,
  utm_campaign text null,
  utm_term text null,
  utm_content text null,

  landing_url text null,
  referer text null,
  user_agent text null,

  started_at timestamptz not null default now(),
  completed_at timestamptz null,
  last_event_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quiz_stats_status_idx on public.quiz_stats (status);
create index if not exists quiz_stats_slug_idx on public.quiz_stats (quiz_slug);
create index if not exists quiz_stats_started_at_idx on public.quiz_stats (started_at desc);
create index if not exists quiz_stats_campaign_idx on public.quiz_stats (utm_campaign);

create or replace function public.set_quiz_stats_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_quiz_stats_updated_at on public.quiz_stats;
create trigger trg_quiz_stats_updated_at
before update on public.quiz_stats
for each row execute function public.set_quiz_stats_updated_at();

alter table public.quiz_stats enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update on table public.quiz_stats to anon, authenticated;
grant usage, select on sequence public.quiz_stats_id_seq to anon, authenticated;

drop policy if exists "quiz_stats_insert_anon_auth" on public.quiz_stats;
create policy "quiz_stats_insert_anon_auth"
on public.quiz_stats
for insert
to anon, authenticated
with check (true);

drop policy if exists "quiz_stats_update_anon_auth" on public.quiz_stats;
create policy "quiz_stats_update_anon_auth"
on public.quiz_stats
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "quiz_stats_select_anon_auth" on public.quiz_stats;
create policy "quiz_stats_select_anon_auth"
on public.quiz_stats
for select
to anon, authenticated
using (true);

