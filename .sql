-- Supabase schema for multi-user mentions drafts and events
create extension if not exists "pgcrypto";

create table if not exists public.app_user (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.account (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_user(id) on delete cascade,
  x_user_id text not null unique,
  handle text not null,
  name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.x_tokens (
  id bigserial primary key,
  account_id uuid not null unique references public.account(id) on delete cascade,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  scopes text[],
  revoked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.settings (
  id bigserial primary key,
  account_id uuid not null unique references public.account(id) on delete cascade,
  tone text,
  language text not null default 'en',
  selected_model text not null default 'gpt-5',
  blocklist jsonb not null default '[]',
  allowlist jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint settings_selected_model_chk
    check (selected_model in ('gpt-5','gpt-4o','claude-4-sonnet','grok-2'))
);

create table if not exists public.mention_state (
  account_id uuid primary key references public.account(id) on delete cascade,
  last_since_id text,
  updated_at timestamptz not null default now()
);

do $$ begin
  create type draft_status as enum ('pending','approved','rejected','posted','failed');
exception when duplicate_object then null; end $$;

create table if not exists public.draft (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.account(id) on delete cascade,
  tweet_id text not null,
  conversation_id text,
  author_id text,
  author_handle text,
  author_name text,
  author_avatar text,
  tweet_text text not null,
  suggested_reply text,
  score numeric(4,3),
  reason text,
  status draft_status not null default 'pending',
  model_used text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  posted_at timestamptz,
  rejected_at timestamptz,
  unique (account_id, tweet_id)
);

create index if not exists draft_account_status_created_idx on public.draft (account_id, status, created_at desc);

create table if not exists public.event_log (
  id bigserial primary key,
  account_id uuid not null references public.account(id) on delete cascade,
  type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists event_log_account_id_id_idx on public.event_log (account_id, id desc);

-- OAuth state for PKCE and CSRF during X login
create table if not exists public.oauth_state (
  state text primary key,
  code_verifier text not null,
  user_id uuid references public.app_user(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.app_user enable row level security;
alter table public.account enable row level security;
alter table public.x_tokens enable row level security;
alter table public.settings enable row level security;
alter table public.mention_state enable row level security;
alter table public.draft enable row level security;
alter table public.event_log enable row level security;

create policy "app_user_self" on public.app_user for all using (id = auth.uid()) with check (id = auth.uid());
create policy "account_by_owner" on public.account for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "x_tokens_by_owner" on public.x_tokens for all using (account_id in (select id from public.account where user_id = auth.uid())) with check (account_id in (select id from public.account where user_id = auth.uid()));
create policy "settings_by_owner" on public.settings for all using (account_id in (select id from public.account where user_id = auth.uid())) with check (account_id in (select id from public.account where user_id = auth.uid()));
create policy "mention_state_by_owner" on public.mention_state for all using (account_id in (select id from public.account where user_id = auth.uid())) with check (account_id in (select id from public.account where user_id = auth.uid()));
create policy "draft_by_owner" on public.draft for all using (account_id in (select id from public.account where user_id = auth.uid())) with check (account_id in (select id from public.account where user_id = auth.uid()));
create policy "event_log_by_owner" on public.event_log for select using (account_id in (select id from public.account where user_id = auth.uid()));

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger account_touch_updated before update on public.account for each row execute procedure public.touch_updated_at();
create trigger x_tokens_touch_updated before update on public.x_tokens for each row execute procedure public.touch_updated_at();
create trigger settings_touch_updated before update on public.settings for each row execute procedure public.touch_updated_at();
create trigger mention_state_touch_updated before update on public.mention_state for each row execute procedure public.touch_updated_at();
create trigger draft_touch_updated before update on public.draft for each row execute procedure public.touch_updated_at();
