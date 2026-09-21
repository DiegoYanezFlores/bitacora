-- Bitácora 003: etapas, criterios, evidencia, reflexiones, logros, descansos, cambios de rumbo y recaps.
-- Plan técnico (docs/IMPACABLE TECHNICAL IMPLEMENTATION PLAN v1.0.md) §7 y §22.
-- Ejecutar completo en Supabase → SQL Editor. Es idempotente (se puede correr más de una vez).
-- Solo AÑADE: no renombra, no borra ni cambia el tipo de nada existente. Las tablas v1 no se tocan.
-- Requiere Postgres 15+ (ON DELETE SET NULL con lista de columnas). Rollback: 003_impacable_down.sql

begin;

-- Ayudante temporal: añade una restricción solo si no existe (desaparece al cerrar la sesión).
create or replace function pg_temp.bt_add_constraint(tbl regclass, cname text, def text)
returns void language plpgsql as $$
begin
  if not exists (select 1 from pg_constraint where conname = cname and conrelid = tbl) then
    execute format('alter table %s add constraint %I %s', tbl, cname, def);
  end if;
end $$;

-- 0. Verificación previa: ninguna fila cuelga de un padre de otro usuario (si no, se aborta sin cambiar nada).
do $$
begin
  if exists (select 1 from public.milestones m join public.projects p on p.id = m.project_id where p.user_id <> m.user_id)
     or exists (select 1 from public.tasks t join public.projects p on p.id = t.project_id where p.user_id <> t.user_id)
     or exists (select 1 from public.activities a join public.projects p on p.id = a.project_id where p.user_id <> a.user_id)
     or exists (select 1 from public.activities a join public.tasks t on t.id = a.task_id where t.user_id <> a.user_id) then
    raise exception 'Hay filas enlazadas a datos de otro usuario: revísalas antes de aplicar 003.';
  end if;
end $$;

-- 1. Claves (user_id, id) para que los hijos solo puedan colgar de padres del mismo usuario.
do $$
begin
  perform pg_temp.bt_add_constraint('public.projects', 'projects_user_id_id_key', 'unique (user_id, id)');
  perform pg_temp.bt_add_constraint('public.milestones', 'milestones_user_id_id_key', 'unique (user_id, id)');
  perform pg_temp.bt_add_constraint('public.tasks', 'tasks_user_id_id_key', 'unique (user_id, id)');
  perform pg_temp.bt_add_constraint('public.activities', 'activities_user_id_id_key', 'unique (user_id, id)');
end $$;

-- 2. Columnas nuevas en tablas existentes (todas con valor por defecto o nulables).
alter table public.profiles   add column if not exists vision text not null default '' check (char_length(vision) <= 400);

alter table public.projects   add column if not exists template text check (char_length(template) <= 40);
alter table public.projects   add column if not exists completed_at timestamptz;
alter table public.projects   add column if not exists success_indicator text not null default '' check (char_length(success_indicator) <= 300);

alter table public.milestones add column if not exists stage_id uuid;
alter table public.milestones add column if not exists weight smallint not null default 2 check (weight in (1, 2, 3));
alter table public.milestones add column if not exists description text not null default '' check (char_length(description) <= 1000);
alter table public.milestones add column if not exists expected_evidence text not null default '' check (char_length(expected_evidence) <= 200);
alter table public.milestones add column if not exists status text not null default 'open' check (status in ('open', 'done', 'skipped'));

alter table public.tasks      add column if not exists milestone_id uuid;

alter table public.activities add column if not exists milestone_id uuid;
alter table public.activities add column if not exists criterion_id uuid;
alter table public.activities add column if not exists duration_min smallint check (duration_min between 1 and 1440);

-- Hitos ya cerrados: estado coherente (no cambia updated_at, así que no pisa ediciones de los clientes).
update public.milestones set status = 'done' where done_at is not null and status = 'open';

-- Nuevo origen de actividad: regreso tras una pausa.
alter table public.activities drop constraint if exists activities_source_check;
alter table public.activities add constraint activities_source_check
  check (source in ('capture', 'task', 'milestone', 'import', 'onboarding', 'recovery'));

-- 3. Tablas nuevas. Todas: id del cliente, dueño, marcas de sincronización y borrado lógico.
create table if not exists public.stages (
  id           uuid primary key,
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  goal_id      uuid not null,
  title        text not null default '',
  description  text not null default '' check (char_length(description) <= 1000),
  sort         integer not null default 0,
  status       text not null default 'pending' check (status in ('pending', 'active', 'done', 'skipped')),
  started_at   timestamptz,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz,
  synced_at    timestamptz not null default now(),
  constraint stages_title_len check (deleted_at is not null or char_length(title) between 1 and 120),
  constraint stages_user_id_id_key unique (user_id, id),
  constraint stages_goal_owner foreign key (user_id, goal_id) references public.projects (user_id, id) on delete cascade
);

create table if not exists public.criteria (
  id                uuid primary key,
  user_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  milestone_id      uuid not null,
  title             text not null default '',
  sort              integer not null default 0,
  met_at            timestamptz,
  requires_evidence boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz,
  synced_at         timestamptz not null default now(),
  constraint criteria_title_len check (deleted_at is not null or char_length(title) between 1 and 200),
  constraint criteria_user_id_id_key unique (user_id, id),
  constraint criteria_milestone_owner foreign key (user_id, milestone_id) references public.milestones (user_id, id) on delete cascade
);

create table if not exists public.evidence (
  id           uuid primary key,
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  goal_id      uuid not null,
  milestone_id uuid,
  activity_id  uuid,
  criterion_id uuid,
  type         text not null default 'note' check (type in ('photo', 'file', 'link', 'note', 'certificate', 'result', 'screenshot', 'commit')),
  title        text not null default '' check (char_length(title) <= 200),
  note         text not null default '' check (char_length(note) <= 4000),
  url          text check (url is null or (char_length(url) <= 2048 and url ~* '^https?://')),
  storage_path text check (storage_path is null or char_length(storage_path) <= 300),
  thumb_path   text check (thumb_path is null or char_length(thumb_path) <= 300),
  mime         text check (mime is null or char_length(mime) <= 100),
  size_bytes   integer check (size_bytes is null or size_bytes between 0 and 10485760),
  level        smallint not null default 1 check (level between 0 and 3),
  captured_at  timestamptz not null default now(),
  upload_state text not null default 'uploaded' check (upload_state in ('local', 'uploaded', 'failed')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz,
  synced_at    timestamptz not null default now(),
  -- Los archivos solo pueden estar en la carpeta del propio usuario.
  constraint evidence_paths_own check (
    (storage_path is null or storage_path like user_id::text || '/%') and
    (thumb_path is null or thumb_path like user_id::text || '/%')),
  constraint evidence_has_content check (
    deleted_at is not null or url is not null or storage_path is not null or note <> '' or title <> ''),
  constraint evidence_user_id_id_key unique (user_id, id),
  constraint evidence_goal_owner      foreign key (user_id, goal_id)      references public.projects   (user_id, id) on delete cascade,
  constraint evidence_milestone_owner foreign key (user_id, milestone_id) references public.milestones (user_id, id) on delete set null (milestone_id),
  constraint evidence_activity_owner  foreign key (user_id, activity_id)  references public.activities (user_id, id) on delete set null (activity_id),
  constraint evidence_criterion_owner foreign key (user_id, criterion_id) references public.criteria   (user_id, id) on delete set null (criterion_id)
);

create table if not exists public.reflections (
  id           uuid primary key,
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type         text not null default 'learning' check (type in ('learning', 'decision', 'obstacle', 'free', 'milestone_close', 'stage_close', 'goal_close', 'recap', 'assessment')),
  body         text not null default '',
  prompt       text not null default '' check (char_length(prompt) <= 200),
  goal_id      uuid,
  stage_id     uuid,
  milestone_id uuid,
  activity_id  uuid,
  evidence_id  uuid,
  favorite     boolean not null default false,
  rating       smallint check (rating between 1 and 5),
  occurred_at  timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz,
  synced_at    timestamptz not null default now(),
  constraint reflections_body_len check (deleted_at is not null or char_length(body) between 1 and 4000),
  constraint reflections_goal_owner      foreign key (user_id, goal_id)      references public.projects   (user_id, id) on delete set null (goal_id),
  constraint reflections_stage_owner     foreign key (user_id, stage_id)     references public.stages     (user_id, id) on delete set null (stage_id),
  constraint reflections_milestone_owner foreign key (user_id, milestone_id) references public.milestones (user_id, id) on delete set null (milestone_id),
  constraint reflections_activity_owner  foreign key (user_id, activity_id)  references public.activities (user_id, id) on delete set null (activity_id),
  constraint reflections_evidence_owner  foreign key (user_id, evidence_id)  references public.evidence   (user_id, id) on delete set null (evidence_id)
);

-- Logros: registro permanente con id determinista (el mismo logro en dos dispositivos es la misma fila).
create table if not exists public.achievements (
  id           uuid primary key,
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind         text not null check (kind in ('real', 'progress', 'recovery', 'consistency', 'personal')),
  rule_key     text check (char_length(rule_key) <= 120),
  title        text not null default '',
  description  text not null default '' check (char_length(description) <= 400),
  earned_at    timestamptz not null default now(),
  goal_id      uuid,
  milestone_id uuid,
  evidence_id  uuid,
  announced_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz,
  synced_at    timestamptz not null default now(),
  constraint achievements_title_len check (deleted_at is not null or char_length(title) between 1 and 120),
  constraint achievements_goal_owner      foreign key (user_id, goal_id)      references public.projects   (user_id, id) on delete set null (goal_id),
  constraint achievements_milestone_owner foreign key (user_id, milestone_id) references public.milestones (user_id, id) on delete set null (milestone_id),
  constraint achievements_evidence_owner  foreign key (user_id, evidence_id)  references public.evidence   (user_id, id) on delete set null (evidence_id)
);

-- Días de descanso intencional (id determinista por día; desmarcar = borrado lógico).
create table if not exists public.day_marks (
  id         uuid primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day        date not null,
  kind       text not null default 'rest' check (kind in ('rest')),
  note       text not null default '' check (char_length(note) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  synced_at  timestamptz not null default now(),
  constraint day_marks_user_day unique (user_id, day)
);

-- Cambios de rumbo: lo que el estado actual no conserva (pausas, reanudaciones, ajustes de alcance…).
create table if not exists public.goal_log (
  id          uuid primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  goal_id     uuid not null,
  type        text not null check (type in ('created', 'paused', 'resumed', 'closed', 'archived', 'reopened', 'pivoted', 'scope_changed', 'stage_started', 'stage_completed')),
  note        text not null default '' check (char_length(note) <= 500),
  meta        jsonb not null default '{}'::jsonb check (pg_column_size(meta) <= 1024),
  occurred_at timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz,
  synced_at   timestamptz not null default now(),
  constraint goal_log_goal_owner foreign key (user_id, goal_id) references public.projects (user_id, id) on delete cascade
);

-- Recaps: solo lo que escribe el usuario; el contenido del recap se calcula en el cliente.
create table if not exists public.recaps (
  id         uuid primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  period     text not null check (period in ('week', 'month', 'year')),
  start_date date not null,
  seen_at    timestamptz,
  answer     text not null default '' check (char_length(answer) <= 2000),
  pinned     jsonb not null default '[]'::jsonb check (pg_column_size(pinned) <= 2048),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  synced_at  timestamptz not null default now(),
  constraint recaps_user_period unique (user_id, period, start_date)
);

-- 4. Propiedad en las relaciones (existentes y nuevas columnas). Las FK simples de 002 se conservan.
do $$
begin
  perform pg_temp.bt_add_constraint('public.milestones', 'milestones_project_owner',   'foreign key (user_id, project_id) references public.projects (user_id, id) on delete cascade');
  perform pg_temp.bt_add_constraint('public.milestones', 'milestones_stage_owner',     'foreign key (user_id, stage_id) references public.stages (user_id, id) on delete set null (stage_id)');
  perform pg_temp.bt_add_constraint('public.tasks',      'tasks_project_owner',        'foreign key (user_id, project_id) references public.projects (user_id, id) on delete set null (project_id)');
  perform pg_temp.bt_add_constraint('public.tasks',      'tasks_milestone_owner',      'foreign key (user_id, milestone_id) references public.milestones (user_id, id) on delete set null (milestone_id)');
  perform pg_temp.bt_add_constraint('public.activities', 'activities_project_owner',   'foreign key (user_id, project_id) references public.projects (user_id, id) on delete set null (project_id)');
  perform pg_temp.bt_add_constraint('public.activities', 'activities_task_owner',      'foreign key (user_id, task_id) references public.tasks (user_id, id) on delete set null (task_id)');
  perform pg_temp.bt_add_constraint('public.activities', 'activities_milestone_owner', 'foreign key (user_id, milestone_id) references public.milestones (user_id, id) on delete set null (milestone_id)');
  perform pg_temp.bt_add_constraint('public.activities', 'activities_criterion_owner', 'foreign key (user_id, criterion_id) references public.criteria (user_id, id) on delete set null (criterion_id)');
end $$;

-- 5. Coherencia entre niveles (errcode 23514 → la app lo muestra como cambio rechazado).
-- Si el padre aún no está en el servidor no se comprueba aquí: la clave foránea responde 409 y el cliente reintenta.
create or replace function public.bt_check_lineage()
returns trigger
language plpgsql
set search_path = public
as $$
declare parent uuid;
begin
  -- Condiciones anidadas: PL/pgSQL no corta el AND y leer una columna ajena a la tabla falla.
  if tg_table_name = 'milestones' then
    if new.stage_id is not null then
      select goal_id into parent from stages where id = new.stage_id;
      if found and parent is distinct from new.project_id then
        raise exception 'La etapa pertenece a otro objetivo' using errcode = '23514';
      end if;
    end if;
  elsif tg_table_name = 'activities' then
    if new.criterion_id is not null then
      select milestone_id into parent from criteria where id = new.criterion_id;
      if found and parent is distinct from new.milestone_id then
        raise exception 'El criterio pertenece a otro hito' using errcode = '23514';
      end if;
    end if;
    if new.milestone_id is not null then
      select project_id into parent from milestones where id = new.milestone_id;
      if found and parent is distinct from new.project_id then
        raise exception 'El hito pertenece a otro objetivo' using errcode = '23514';
      end if;
    end if;
  elsif tg_table_name = 'tasks' then
    if new.milestone_id is not null then
      select project_id into parent from milestones where id = new.milestone_id;
      if found and parent is distinct from new.project_id then
        raise exception 'El hito pertenece a otro objetivo' using errcode = '23514';
      end if;
    end if;
  elsif tg_table_name = 'evidence' then
    if new.milestone_id is not null then
      select project_id into parent from milestones where id = new.milestone_id;
      if found and parent is distinct from new.goal_id then
        raise exception 'El hito pertenece a otro objetivo' using errcode = '23514';
      end if;
    end if;
    if new.activity_id is not null then
      select project_id into parent from activities where id = new.activity_id;
      if found and parent is distinct from new.goal_id then
        raise exception 'La acción pertenece a otro objetivo' using errcode = '23514';
      end if;
    end if;
    if new.criterion_id is not null then
      select m.project_id into parent from criteria c join milestones m on m.id = c.milestone_id where c.id = new.criterion_id;
      if found and parent is distinct from new.goal_id then
        raise exception 'El criterio pertenece a otro objetivo' using errcode = '23514';
      end if;
    end if;
  end if;
  return new;
end;
$$;

-- Máximo 8 criterios vivos por hito (el cliente recomienda 2–5).
create or replace function public.bt_criteria_cap()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.deleted_at is null and (
    select count(*) from criteria where milestone_id = new.milestone_id and deleted_at is null and id <> new.id) >= 8 then
    raise exception 'Un hito admite como máximo 8 criterios' using errcode = '23514';
  end if;
  return new;
end;
$$;

-- 6. Índices.
create index if not exists stages_user_sync        on public.stages       (user_id, synced_at);
create index if not exists stages_goal             on public.stages       (goal_id);
create index if not exists criteria_user_sync      on public.criteria     (user_id, synced_at);
create index if not exists criteria_milestone      on public.criteria     (milestone_id);
create index if not exists evidence_user_sync      on public.evidence     (user_id, synced_at);
create index if not exists evidence_goal_time      on public.evidence     (user_id, goal_id, captured_at);
create index if not exists evidence_milestone      on public.evidence     (milestone_id);
create index if not exists evidence_activity       on public.evidence     (activity_id);
create index if not exists reflections_user_sync   on public.reflections  (user_id, synced_at);
create index if not exists reflections_user_time   on public.reflections  (user_id, occurred_at desc) where deleted_at is null;
create index if not exists achievements_user_sync  on public.achievements (user_id, synced_at);
create index if not exists day_marks_user_sync     on public.day_marks    (user_id, synced_at);
create index if not exists goal_log_user_sync      on public.goal_log     (user_id, synced_at);
create index if not exists goal_log_goal           on public.goal_log     (goal_id, occurred_at);
create index if not exists recaps_user_sync        on public.recaps       (user_id, synced_at);
create index if not exists milestones_stage        on public.milestones   (stage_id);
create index if not exists tasks_milestone         on public.tasks        (milestone_id);
create index if not exists activities_milestone    on public.activities   (user_id, milestone_id);
create index if not exists activities_criterion    on public.activities   (criterion_id);

-- 7. Triggers.
do $$
declare t text;
begin
  foreach t in array array['stages', 'criteria', 'evidence', 'reflections', 'achievements', 'day_marks', 'goal_log', 'recaps'] loop
    execute format('drop trigger if exists bt_sync_row on public.%I', t);
    execute format('create trigger bt_sync_row before insert or update on public.%I for each row execute function public.bt_sync_row()', t);
  end loop;
  foreach t in array array['milestones', 'tasks', 'activities', 'evidence'] loop
    execute format('drop trigger if exists bt_check_lineage on public.%I', t);
    execute format('create trigger bt_check_lineage before insert or update on public.%I for each row execute function public.bt_check_lineage()', t);
  end loop;
end $$;

drop trigger if exists bt_criteria_cap on public.criteria;
create trigger bt_criteria_cap before insert or update on public.criteria
  for each row execute function public.bt_criteria_cap();

-- 8. Row Level Security: cada usuario solo accede a sus filas (igual que 002).
do $$
declare t text;
begin
  foreach t in array array['stages', 'criteria', 'evidence', 'reflections', 'achievements', 'day_marks', 'goal_log', 'recaps'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists own_select on public.%I', t);
    execute format('drop policy if exists own_insert on public.%I', t);
    execute format('drop policy if exists own_update on public.%I', t);
    execute format('drop policy if exists own_delete on public.%I', t);
    execute format('create policy own_select on public.%I for select to authenticated using ((select auth.uid()) = user_id)', t);
    execute format('create policy own_insert on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format('create policy own_update on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format('create policy own_delete on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

-- 9. Almacenamiento de evidencia: bucket privado, 10 MB, sin SVG ni HTML; cada usuario solo en su carpeta.
-- (Se omite en un Postgres sin Supabase Storage, p. ej. en las pruebas locales.)
do $$
begin
  if to_regclass('storage.buckets') is null then
    raise notice 'Sin esquema storage: se omite el bucket de evidencia.';
    return;
  end if;
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('evidence', 'evidence', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
  on conflict (id) do nothing;

  drop policy if exists evidence_own_select on storage.objects;
  drop policy if exists evidence_own_insert on storage.objects;
  drop policy if exists evidence_own_update on storage.objects;
  drop policy if exists evidence_own_delete on storage.objects;
  create policy evidence_own_select on storage.objects for select to authenticated
    using (bucket_id = 'evidence' and (storage.foldername(name))[1] = (select auth.uid())::text);
  create policy evidence_own_insert on storage.objects for insert to authenticated
    with check (bucket_id = 'evidence' and (storage.foldername(name))[1] = (select auth.uid())::text);
  create policy evidence_own_update on storage.objects for update to authenticated
    using (bucket_id = 'evidence' and (storage.foldername(name))[1] = (select auth.uid())::text)
    with check (bucket_id = 'evidence' and (storage.foldername(name))[1] = (select auth.uid())::text);
  create policy evidence_own_delete on storage.objects for delete to authenticated
    using (bucket_id = 'evidence' and (storage.foldername(name))[1] = (select auth.uid())::text);
end $$;

commit;
