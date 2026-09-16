-- Bitácora v2: modelo relacional con sincronización por filas.
-- Ejecutar completo en Supabase → SQL Editor. Es idempotente (se puede correr más de una vez).
-- NO modifica ni borra las tablas v1 (bitacora_state, bitacora_history).
-- Rollback: 002_v2_down.sql

begin;

-- 0. Respaldo lógico del modelo v1 antes de migrar (solo accesible desde el panel).
create table if not exists public.bitacora_state_backup_v1 as table public.bitacora_state;
alter table public.bitacora_state_backup_v1 enable row level security;
revoke all on public.bitacora_state_backup_v1 from anon, authenticated;

-- 1. Sincronización: "gana la última edición" + marca de servidor para descargas incrementales.
create or replace function public.bt_sync_row()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.updated_at < old.updated_at then
    return old; -- escritura más antigua que la guardada: se ignora
  end if;
  new.synced_at := clock_timestamp();
  return new;
end;
$$;

-- 2. Perfiles (1:1 con auth.users). Las preferencias viven en prefs (jsonb).
create table if not exists public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  display_name   text not null default '' check (char_length(display_name) <= 80),
  timezone       text not null default '' check (char_length(timezone) <= 64),
  focus_areas    text[] not null default '{}',
  prefs          jsonb not null default '{}'::jsonb check (pg_column_size(prefs) <= 8192),
  onboarded_at   timestamptz,
  migrated_v1_at timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  synced_at      timestamptz not null default now()
);

-- 3. Proyectos
create table if not exists public.projects (
  id              uuid primary key,
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name            text not null default '',
  description     text not null default '' check (char_length(description) <= 2000),
  goal            text not null default '' check (char_length(goal) <= 500),
  status          text not null default 'active' check (status in ('active', 'paused', 'done', 'archived')),
  color           text not null default 'teal' check (char_length(color) <= 20),
  tags            text[] not null default '{}',
  start_date      date,
  due_date        date,
  progress_manual smallint check (progress_manual between 0 and 100),
  metric_unit     text check (char_length(metric_unit) <= 24),
  metric_start    numeric,
  metric_current  numeric,
  metric_target   numeric,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  synced_at       timestamptz not null default now(),
  constraint projects_name_len check (deleted_at is not null or char_length(name) between 1 and 120)
);

-- 4. Hitos
create table if not exists public.milestones (
  id         uuid primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  title      text not null default '',
  due_date   date,
  done_at    timestamptz,
  sort       integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  synced_at  timestamptz not null default now(),
  constraint milestones_title_len check (deleted_at is not null or char_length(title) between 1 and 200)
);

-- 5. Tareas
create table if not exists public.tasks (
  id           uuid primary key,
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id   uuid references public.projects (id) on delete set null,
  title        text not null default '',
  notes        text not null default '' check (char_length(notes) <= 4000),
  status       text not null default 'todo' check (status in ('todo', 'doing', 'waiting', 'done')),
  priority     smallint not null default 2 check (priority between 1 and 3),
  due_date     date,
  waiting_on   text not null default '' check (char_length(waiting_on) <= 200),
  completed_at timestamptz,
  sort         integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz,
  synced_at    timestamptz not null default now(),
  constraint tasks_title_len check (deleted_at is not null or char_length(title) between 1 and 300)
);

-- 6. Actividades (el registro)
create table if not exists public.activities (
  id          uuid primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id  uuid references public.projects (id) on delete set null,
  task_id     uuid references public.tasks (id) on delete set null,
  kind        text not null default 'done' check (kind in ('done', 'progress', 'note', 'win')),
  title       text not null default '',
  body        text not null default '' check (char_length(body) <= 20000),
  occurred_at timestamptz not null default now(),
  tags        text[] not null default '{}',
  source      text not null default 'capture' check (source in ('capture', 'task', 'milestone', 'import', 'onboarding')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz,
  synced_at   timestamptz not null default now(),
  constraint activities_title_len check (deleted_at is not null or char_length(title) between 1 and 500)
);

-- 7. Métricas internas del producto (sin contenido del usuario; desactivables en Ajustes)
create table if not exists public.events (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null check (name ~ '^[a-z_]{2,40}$'),
  props      jsonb not null default '{}'::jsonb check (pg_column_size(props) <= 1024),
  created_at timestamptz not null default now()
);

-- 8. Índices
create index if not exists projects_user_sync     on public.projects   (user_id, synced_at);
create index if not exists milestones_user_sync   on public.milestones (user_id, synced_at);
create index if not exists milestones_project     on public.milestones (project_id);
create index if not exists tasks_user_sync        on public.tasks      (user_id, synced_at);
create index if not exists tasks_project          on public.tasks      (project_id);
create index if not exists tasks_user_open        on public.tasks      (user_id, status) where deleted_at is null;
create index if not exists activities_user_sync   on public.activities (user_id, synced_at);
create index if not exists activities_user_time   on public.activities (user_id, occurred_at desc) where deleted_at is null;
create index if not exists activities_project     on public.activities (project_id);
create index if not exists activities_task        on public.activities (task_id);
create index if not exists events_user_time       on public.events     (user_id, created_at);
create index if not exists events_name_time       on public.events     (name, created_at);

-- 9. Triggers de sincronización
do $$
declare t text;
begin
  foreach t in array array['profiles', 'projects', 'milestones', 'tasks', 'activities'] loop
    execute format('drop trigger if exists bt_sync_row on public.%I', t);
    execute format('create trigger bt_sync_row before insert or update on public.%I for each row execute function public.bt_sync_row()', t);
  end loop;
end $$;

-- 10. Row Level Security: cada usuario solo accede a sus filas.
alter table public.profiles   enable row level security;
alter table public.projects   enable row level security;
alter table public.milestones enable row level security;
alter table public.tasks      enable row level security;
alter table public.activities enable row level security;
alter table public.events     enable row level security;

do $$
declare t text;
begin
  foreach t in array array['projects', 'milestones', 'tasks', 'activities'] loop
    execute format('drop policy if exists own_select on public.%I', t);
    execute format('drop policy if exists own_insert on public.%I', t);
    execute format('drop policy if exists own_update on public.%I', t);
    execute format('drop policy if exists own_delete on public.%I', t);
    execute format('create policy own_select on public.%I for select to authenticated using ((select auth.uid()) = user_id)', t);
    execute format('create policy own_insert on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format('create policy own_update on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format('create policy own_delete on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', t);
  end loop;
end $$;

drop policy if exists own_select on public.profiles;
drop policy if exists own_insert on public.profiles;
drop policy if exists own_update on public.profiles;
create policy own_select on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy own_insert on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy own_update on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists own_insert on public.events;
drop policy if exists own_select on public.events;
drop policy if exists own_delete on public.events;
create policy own_insert on public.events for insert to authenticated with check ((select auth.uid()) = user_id);
create policy own_select on public.events for select to authenticated using ((select auth.uid()) = user_id);
create policy own_delete on public.events for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.profiles, public.projects, public.milestones, public.tasks, public.activities, public.events from anon;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.projects, public.milestones, public.tasks, public.activities to authenticated;
grant select, insert, delete on public.events to authenticated;

-- 11. Perfil automático al registrarse (y para usuarios que ya existían).
create or replace function public.bt_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''), 80))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists bt_on_auth_user_created on auth.users;
create trigger bt_on_auth_user_created
  after insert on auth.users
  for each row execute function public.bt_handle_new_user();

insert into public.profiles (id) select id from auth.users on conflict (id) do nothing;

-- 12. Vista de estadísticas diarias para analítica e IA futura (respeta RLS del usuario que consulta).
create or replace view public.daily_stats
with (security_invoker = true) as
select
  a.user_id,
  (a.occurred_at at time zone coalesce(nullif(p.timezone, ''), 'UTC'))::date as day,
  count(*)                                   as activities,
  count(*) filter (where a.kind = 'done')    as done,
  count(*) filter (where a.kind = 'win')     as wins,
  count(distinct a.project_id)               as projects
from public.activities a
left join public.profiles p on p.id = a.user_id
where a.deleted_at is null
group by 1, 2;

revoke all on public.daily_stats from anon;
grant select on public.daily_stats to authenticated;

commit;
