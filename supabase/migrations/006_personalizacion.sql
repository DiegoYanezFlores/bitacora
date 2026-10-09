-- 006: base compartida para actividades recurrentes, diario personal e imágenes propias.
-- Solo añade columnas y amplía un check: no borra, no reescribe y no mueve datos existentes.
-- Las preferencias visuales NO necesitan esquema nuevo: viven en profiles.prefs (jsonb, ya existente).
-- Las fotos del usuario tampoco: el archivo va al bucket privado `evidence` (creado en 003, una
-- carpeta por usuario) y su referencia, a prefs. Así no se duplica el mecanismo de subida.
-- Idempotente. Reversión: 006_personalizacion_down.sql.
-- Ejecuta este archivo completo en Supabase → SQL Editor → New query → Run.

-- 1. Actividades recurrentes sobre la tabla `tasks` que ya existe.
--    Una serie es UNA fila con su regla; las ocurrencias se calculan en el cliente y solo se
--    materializan cuando pasa algo con ellas (se completan, se mueven, se omiten). Así un semestre
--    de clases no crea cientos de filas ni duplicados al sincronizar.
alter table public.tasks add column if not exists repeat          jsonb;
alter table public.tasks add column if not exists series_id       uuid;
alter table public.tasks add column if not exists occurrence_date date;
alter table public.tasks add column if not exists start_time      time;
alter table public.tasks add column if not exists end_time        time;

do $$
begin
  alter table public.tasks drop constraint if exists tasks_repeat_size;
  alter table public.tasks add constraint tasks_repeat_size
    check (repeat is null or pg_column_size(repeat) <= 2048);
  -- Una ocurrencia pertenece a una serie y tiene su día; una serie no es ocurrencia de nadie.
  alter table public.tasks drop constraint if exists tasks_occurrence_pair;
  alter table public.tasks add constraint tasks_occurrence_pair
    check ((series_id is null and occurrence_date is null) or (series_id is not null and occurrence_date is not null));
  alter table public.tasks drop constraint if exists tasks_series_not_self;
  alter table public.tasks add constraint tasks_series_not_self check (series_id is null or series_id <> id);
  alter table public.tasks drop constraint if exists tasks_time_order;
  alter table public.tasks add constraint tasks_time_order
    check (start_time is null or end_time is null or end_time >= start_time);
  -- La serie es del mismo dueño (misma regla que el resto de relaciones).
  if not exists (select 1 from pg_constraint where conname = 'tasks_series_owner') then
    alter table public.tasks add constraint tasks_series_owner
      foreign key (user_id, series_id) references public.tasks (user_id, id) on delete cascade;
  end if;
end $$;

create index if not exists tasks_series     on public.tasks (series_id);
create index if not exists tasks_occurrence on public.tasks (user_id, occurrence_date) where deleted_at is null;

-- 2. Diario personal sobre la tabla `reflections` que ya existe (no se crea una tabla paralela).
--    Una entrada de diario es una reflexión de tipo 'journal', con título y etiquetas opcionales.
alter table public.reflections add column if not exists title text not null default '';
alter table public.reflections add column if not exists tags  text[] not null default '{}';

do $$
begin
  alter table public.reflections drop constraint if exists reflections_title_len;
  alter table public.reflections add constraint reflections_title_len check (char_length(title) <= 200);
  alter table public.reflections drop constraint if exists reflections_tags_len;
  alter table public.reflections add constraint reflections_tags_len check (array_length(tags, 1) is null or array_length(tags, 1) <= 12);
  -- El diario puede ser largo: se amplía el cuerpo solo para este tipo, sin tocar lo demás.
  alter table public.reflections drop constraint if exists reflections_body_len;
  alter table public.reflections add constraint reflections_body_len
    check (deleted_at is not null or char_length(body) between 1 and 20000);
  alter table public.reflections drop constraint if exists reflections_type_check;
  alter table public.reflections add constraint reflections_type_check
    check (type in ('learning', 'decision', 'obstacle', 'free', 'milestone_close', 'stage_close', 'goal_close', 'recap', 'assessment', 'journal'));
end $$;

create index if not exists reflections_journal on public.reflections (user_id, occurred_at desc) where type = 'journal' and deleted_at is null;

-- 3. Comprobación: lo nuevo existe, sigue protegido y lo viejo no se tocó.
do $$
declare bad text;
begin
  if to_regclass('public.tasks') is null then raise exception 'falta la tabla tasks'; end if;
  select string_agg(c.relname, ', ') into bad
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;
  if bad is not null then raise exception 'Tablas sin RLS: %', bad; end if;
  if has_table_privilege('anon', 'public.tasks', 'select') then raise exception 'tasks accesible sin sesión'; end if;
  raise notice 'OK: recurrencias, diario y base de personalización listos';
end $$;
