-- Rollback de 003_impacable.sql.
-- ATENCIÓN: borra etapas, criterios, evidencias (filas), reflexiones, logros, descansos, cambios de rumbo y recaps,
-- y las columnas nuevas de hitos, tareas, actividades, proyectos y perfiles. Exporta antes desde la app.
-- NO borra el bucket 'evidence' ni sus archivos: hazlo a mano en Storage si de verdad quieres eliminarlos.
-- Las tablas de 002 (con sus datos) y las v1 quedan intactas.

begin;

-- Almacenamiento: solo las políticas.
do $$
begin
  if to_regclass('storage.objects') is not null then
    drop policy if exists evidence_own_select on storage.objects;
    drop policy if exists evidence_own_insert on storage.objects;
    drop policy if exists evidence_own_update on storage.objects;
    drop policy if exists evidence_own_delete on storage.objects;
  end if;
end $$;

drop trigger if exists bt_check_lineage on public.milestones;
drop trigger if exists bt_check_lineage on public.tasks;
drop trigger if exists bt_check_lineage on public.activities;

-- Restricciones añadidas a tablas existentes.
alter table public.milestones drop constraint if exists milestones_project_owner;
alter table public.milestones drop constraint if exists milestones_stage_owner;
alter table public.tasks      drop constraint if exists tasks_project_owner;
alter table public.tasks      drop constraint if exists tasks_milestone_owner;
alter table public.activities drop constraint if exists activities_project_owner;
alter table public.activities drop constraint if exists activities_task_owner;
alter table public.activities drop constraint if exists activities_milestone_owner;
alter table public.activities drop constraint if exists activities_criterion_owner;

-- Tablas nuevas (en orden inverso de dependencias).
drop table if exists public.recaps;
drop table if exists public.goal_log;
drop table if exists public.day_marks;
drop table if exists public.achievements;
drop table if exists public.reflections;
drop table if exists public.evidence;
drop table if exists public.criteria;
drop table if exists public.stages;

drop function if exists public.bt_check_lineage();
drop function if exists public.bt_criteria_cap();

-- Columnas nuevas.
alter table public.activities drop column if exists duration_min;
alter table public.activities drop column if exists criterion_id;
alter table public.activities drop column if exists milestone_id;
alter table public.tasks      drop column if exists milestone_id;
alter table public.milestones drop column if exists status;
alter table public.milestones drop column if exists expected_evidence;
alter table public.milestones drop column if exists description;
alter table public.milestones drop column if exists weight;
alter table public.milestones drop column if exists stage_id;
alter table public.projects   drop column if exists success_indicator;
alter table public.projects   drop column if exists completed_at;
alter table public.projects   drop column if exists template;
alter table public.profiles   drop column if exists vision;

-- Claves (user_id, id) añadidas en 003.
alter table public.activities drop constraint if exists activities_user_id_id_key;
alter table public.tasks      drop constraint if exists tasks_user_id_id_key;
alter table public.milestones drop constraint if exists milestones_user_id_id_key;
alter table public.projects   drop constraint if exists projects_user_id_id_key;

-- Origen 'recovery' vuelve a 'capture' y se restaura la regla de 002.
update public.activities set source = 'capture' where source = 'recovery';
alter table public.activities drop constraint if exists activities_source_check;
alter table public.activities add constraint activities_source_check
  check (source in ('capture', 'task', 'milestone', 'import', 'onboarding'));

commit;
