-- Rollback de 002_v2.sql.
-- ATENCIÓN: borra los datos creados con Bitácora v2. Exporta antes desde Ajustes → Exportar.
-- Las tablas v1 (bitacora_state, bitacora_history) y el respaldo bitacora_state_backup_v1 NO se tocan.

begin;

drop view if exists public.daily_stats;
drop trigger if exists bt_on_auth_user_created on auth.users;
drop function if exists public.bt_handle_new_user();

drop table if exists public.events;
drop table if exists public.activities;
drop table if exists public.tasks;
drop table if exists public.milestones;
drop table if exists public.projects;
drop table if exists public.profiles;

drop function if exists public.bt_sync_row();

commit;
