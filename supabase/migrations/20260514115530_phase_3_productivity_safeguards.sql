create unique index if not exists productivity_events_unique_task_completion
on public.productivity_events (user_id, source_id)
where source_type = 'task';

alter table public.productivity_events
add column if not exists completed_on date;

update public.productivity_events
set completed_on = completed_at::date
where completed_on is null;

create unique index if not exists productivity_events_unique_habit_daily_completion
on public.productivity_events (user_id, source_id, completed_on)
where source_type = 'habit';
