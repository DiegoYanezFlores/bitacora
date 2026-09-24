-- 005: resultado real de una tarea y registro de lo que pasó con ella.
-- Una tarea puede cerrarse sin haberse hecho (nadie asistió, un imprevisto, se canceló) o moverse
-- a otro día. El estado `done` pasa a significar "cerrada"; `result` dice qué ocurrió de verdad.
-- No borra ni reescribe nada: las tareas ya cerradas quedan con result nulo y se leen como completadas.
-- Idempotente. Reversión: 005_resultados_down.sql.
-- Ejecuta este archivo completo en Supabase → SQL Editor → New query → Run.

-- 1. Resultado de la tarea (qué ocurrió) y su nota opcional.
alter table public.tasks add column if not exists result      text;
alter table public.tasks add column if not exists result_note text not null default '';
alter table public.tasks add column if not exists result_at   timestamptz;

do $$
begin
  alter table public.tasks drop constraint if exists tasks_result_valid;
  alter table public.tasks add constraint tasks_result_valid
    check (result is null or result in ('done', 'not_done', 'no_show', 'blocked', 'canceled'));
  alter table public.tasks drop constraint if exists tasks_result_note_len;
  alter table public.tasks add constraint tasks_result_note_len
    check (char_length(result_note) <= 500);
end $$;

-- 2. Registro de lo que pasó con una tarea: cierres, reaperturas y reprogramaciones.
--    Conserva la fecha prevista original aunque la tarea se mueva a otro día (fechas de calendario).
create table if not exists public.task_log (
  id          uuid primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  task_id     uuid not null,
  type        text not null check (type in ('closed', 'reopened', 'rescheduled')),
  result      text check (result is null or result in ('done', 'not_done', 'no_show', 'blocked', 'canceled')),
  note        text not null default '' check (char_length(note) <= 500),
  from_date   date,
  to_date     date,
  occurred_at timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz,
  synced_at   timestamptz not null default now(),
  constraint task_log_task_owner foreign key (user_id, task_id) references public.tasks (user_id, id) on delete cascade
);

create index if not exists task_log_user_sync on public.task_log (user_id, synced_at);
create index if not exists task_log_task      on public.task_log (task_id, occurred_at);
create index if not exists task_log_user_from on public.task_log (user_id, from_date) where deleted_at is null;

-- 3. Trigger de sincronización (igual que el resto de tablas).
drop trigger if exists bt_sync_row on public.task_log;
create trigger bt_sync_row before insert or update on public.task_log
  for each row execute function public.bt_sync_row();

-- 4. RLS: cada usuario solo ve y escribe lo suyo; el rol anónimo no entra.
alter table public.task_log enable row level security;
drop policy if exists own_select on public.task_log;
drop policy if exists own_insert on public.task_log;
drop policy if exists own_update on public.task_log;
drop policy if exists own_delete on public.task_log;
create policy own_select on public.task_log for select to authenticated using ((select auth.uid()) = user_id);
create policy own_insert on public.task_log for insert to authenticated with check ((select auth.uid()) = user_id);
create policy own_update on public.task_log for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy own_delete on public.task_log for delete to authenticated using ((select auth.uid()) = user_id);
revoke all on public.task_log from anon;
grant select, insert, update, delete on public.task_log to authenticated;

-- 5. Comprobación: la tabla nueva queda protegida como las demás.
do $$
declare bad text;
begin
  select string_agg(c.relname, ', ') into bad
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;
  if bad is not null then raise exception 'Tablas sin RLS: %', bad; end if;
  if has_table_privilege('anon', 'public.task_log', 'select') then raise exception 'task_log accesible sin sesión'; end if;
  raise notice 'OK: resultado de tarea y task_log listos, con RLS y sin acceso anónimo';
end $$;
