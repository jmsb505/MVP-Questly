create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  user_type text check (user_type in ('student', 'young_professional', 'other')),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_memory (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferred_genres text[] not null default '{}',
  tone_style_preferences text,
  productivity_history_summary text,
  active_quest_summary text,
  previous_story_choices_summary text,
  completed_quest_summaries jsonb not null default '[]'::jsonb,
  important_story_facts jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.story_turn_balances (
  user_id uuid primary key references auth.users(id) on delete cascade,
  available_turns integer not null default 0 check (available_turns >= 0),
  max_turns integer not null default 10 check (max_turns > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint story_turn_balance_cap check (available_turns <= max_turns)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  description text,
  due_date date,
  status text not null default 'pending' check (status in ('pending', 'active', 'completed', 'archived', 'abandoned')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  description text,
  frequency text,
  status text not null default 'active' check (status in ('pending', 'active', 'completed', 'archived', 'abandoned')),
  last_completed_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.productivity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null check (source_type in ('task', 'habit')),
  source_id uuid not null,
  title_snapshot text not null,
  description_snapshot text,
  classification text,
  complexity text check (complexity in ('low', 'medium', 'high')),
  meaningfulness text check (meaningfulness in ('low', 'medium', 'high')),
  turns_awarded integer not null check (turns_awarded between 1 and 3),
  reward_reason text,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  genre text,
  tone text,
  premise text,
  main_objective text,
  planned_length_in_turns integer not null default 8 check (planned_length_in_turns > 0),
  status text not null default 'active' check (status in ('pending', 'active', 'completed', 'archived', 'abandoned')),
  final_summary text,
  outcome_summary text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quest_turns (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references public.quests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  turn_index integer not null check (turn_index >= 0),
  scene_text text not null,
  created_at timestamptz not null default now(),
  unique (quest_id, turn_index)
);

create table public.quest_choices (
  id uuid primary key default gen_random_uuid(),
  quest_turn_id uuid not null references public.quest_turns(id) on delete cascade,
  quest_id uuid not null references public.quests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  choice_text text not null,
  choice_type text not null default 'progression' check (choice_type in ('branching', 'progression', 'investigation', 'tone')),
  result_text text,
  selected boolean not null default false,
  selected_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.quest_state (
  quest_id uuid primary key references public.quests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  current_location text,
  known_facts jsonb not null default '[]'::jsonb,
  open_questions jsonb not null default '[]'::jsonb,
  previous_choices_summary text,
  progress_status text not null default 'started',
  turns_spent integer not null default 0 check (turns_spent >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.completed_quest_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quest_id uuid not null references public.quests(id) on delete cascade,
  title text not null,
  genre text,
  final_summary text,
  outcome_summary text,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.story_turn_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_type text not null check (transaction_type in ('earned', 'spent', 'adjusted')),
  amount integer not null,
  balance_after integer not null check (balance_after >= 0),
  productivity_event_id uuid references public.productivity_events(id) on delete set null,
  quest_choice_id uuid references public.quest_choices(id) on delete set null,
  reason text,
  created_at timestamptz not null default now()
);

create table public.ai_generation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  feature text not null,
  validation_status text check (validation_status in ('approved', 'rejected', 'fallback_used', 'failed')),
  request_payload jsonb not null default '{}'::jsonb,
  response_payload jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now()
);

create table public.internal_analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_name text not null,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index tasks_user_id_idx on public.tasks(user_id);
create index habits_user_id_idx on public.habits(user_id);
create index productivity_events_user_id_idx on public.productivity_events(user_id);
create index quests_user_id_status_idx on public.quests(user_id, status);
create index quest_turns_user_id_idx on public.quest_turns(user_id);
create index quest_choices_user_id_idx on public.quest_choices(user_id);
create index completed_quest_history_user_id_idx on public.completed_quest_history(user_id);
create index story_turn_transactions_user_id_idx on public.story_turn_transactions(user_id);
create index ai_generation_logs_user_id_idx on public.ai_generation_logs(user_id);
create index internal_analytics_events_user_id_idx on public.internal_analytics_events(user_id);

create trigger set_user_profiles_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

create trigger set_user_memory_updated_at
before update on public.user_memory
for each row execute function public.set_updated_at();

create trigger set_story_turn_balances_updated_at
before update on public.story_turn_balances
for each row execute function public.set_updated_at();

create trigger set_tasks_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

create trigger set_habits_updated_at
before update on public.habits
for each row execute function public.set_updated_at();

create trigger set_quests_updated_at
before update on public.quests
for each row execute function public.set_updated_at();

create trigger set_quest_state_updated_at
before update on public.quest_state
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;

  insert into public.user_memory (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.story_turn_balances (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.user_profiles enable row level security;
alter table public.user_memory enable row level security;
alter table public.story_turn_balances enable row level security;
alter table public.tasks enable row level security;
alter table public.habits enable row level security;
alter table public.productivity_events enable row level security;
alter table public.quests enable row level security;
alter table public.quest_turns enable row level security;
alter table public.quest_choices enable row level security;
alter table public.quest_state enable row level security;
alter table public.completed_quest_history enable row level security;
alter table public.story_turn_transactions enable row level security;
alter table public.ai_generation_logs enable row level security;
alter table public.internal_analytics_events enable row level security;

create policy "Users can read own profile" on public.user_profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.user_profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users can read own memory" on public.user_memory for select using (auth.uid() = user_id);
create policy "Users can update own memory" on public.user_memory for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can read own turn balance" on public.story_turn_balances for select using (auth.uid() = user_id);

create policy "Users can manage own tasks" on public.tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own habits" on public.habits for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can read own productivity events" on public.productivity_events for select using (auth.uid() = user_id);
create policy "Users can read own quests" on public.quests for select using (auth.uid() = user_id);
create policy "Users can read own quest turns" on public.quest_turns for select using (auth.uid() = user_id);
create policy "Users can read own quest choices" on public.quest_choices for select using (auth.uid() = user_id);
create policy "Users can read own quest state" on public.quest_state for select using (auth.uid() = user_id);
create policy "Users can read own completed quest history" on public.completed_quest_history for select using (auth.uid() = user_id);
create policy "Users can read own turn transactions" on public.story_turn_transactions for select using (auth.uid() = user_id);
create policy "Users can read own AI logs" on public.ai_generation_logs for select using (auth.uid() = user_id);
create policy "Users can read own analytics events" on public.internal_analytics_events for select using (auth.uid() = user_id);
create policy "Users can insert own analytics events" on public.internal_analytics_events for insert with check (auth.uid() = user_id);
