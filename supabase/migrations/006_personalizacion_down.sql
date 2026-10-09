-- Reversión de 006. Borra las reglas de repetición, los horarios y los títulos/etiquetas del
-- diario: ejecútalo solo si de verdad quieres perder esa información.
-- Las entradas de diario existentes pasarían a violar el check de tipo, así que primero se
-- convierten en reflexiones libres (no se borran).
update public.reflections set type = 'free' where type = 'journal';

alter table public.reflections drop constraint if exists reflections_type_check;
alter table public.reflections add constraint reflections_type_check
  check (type in ('learning', 'decision', 'obstacle', 'free', 'milestone_close', 'stage_close', 'goal_close', 'recap', 'assessment'));
alter table public.reflections drop constraint if exists reflections_title_len;
alter table public.reflections drop constraint if exists reflections_tags_len;
alter table public.reflections drop column if exists title;
alter table public.reflections drop column if exists tags;
drop index if exists public.reflections_journal;

alter table public.tasks drop constraint if exists tasks_series_owner;
alter table public.tasks drop constraint if exists tasks_repeat_size;
alter table public.tasks drop constraint if exists tasks_occurrence_pair;
alter table public.tasks drop constraint if exists tasks_series_not_self;
alter table public.tasks drop constraint if exists tasks_time_order;
drop index if exists public.tasks_series;
drop index if exists public.tasks_occurrence;
alter table public.tasks drop column if exists repeat;
alter table public.tasks drop column if exists series_id;
alter table public.tasks drop column if exists occurrence_date;
alter table public.tasks drop column if exists start_time;
alter table public.tasks drop column if exists end_time;
