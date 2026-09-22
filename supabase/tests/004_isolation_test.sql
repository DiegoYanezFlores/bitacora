-- Aislamiento entre usuarios en TODAS las tablas (tras 00_supabase_stub.sql, 001, 002, 003 y 004).
-- Escenario: la dueña (A) tiene datos; un estudiante (B) crea su cuenta. B no ve, no edita, no borra
-- ni se apropia de nada de A, y el rol anónimo no llega a ninguna tabla. Rollback final.
\set ON_ERROR_STOP 1
begin;

create or replace function pg_temp.expect_error(q text, code text) returns void language plpgsql as $$
begin
  begin
    execute q;
  exception when others then
    if sqlstate = code then return; end if;
    raise exception 'Esperaba error % y llegó % (%) en: %', code, sqlstate, sqlerrm, q;
  end;
  raise exception 'Esperaba error % pero funcionó: %', code, q;
end $$;
create or replace function pg_temp.check(ok boolean, msg text) returns void language plpgsql as $$
begin if not ok then raise exception 'FALLO: %', msg; end if; end $$;
create or replace function pg_temp.as_user(uid uuid) returns void language plpgsql as $$
begin perform set_config('request.jwt.claims', json_build_object('sub', uid)::text, true); end $$;

-- El alta de usuario crea su perfil (trigger security definer, aunque ya no sea invocable como RPC).
insert into auth.users (id, raw_user_meta_data) values
  ('aaaaaaaa-0000-4000-8000-000000000001', '{"full_name":"Dueña"}'),
  ('bbbbbbbb-0000-4000-8000-000000000002', '{"full_name":"Estudiante"}');
select pg_temp.check((select count(*) from profiles) = 2, 'cada alta crea su perfil');

set local role authenticated;
select pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000001');
insert into projects (id, name) values ('10000000-0000-4000-8000-00000000000a', 'Privado de A');
insert into milestones (id, project_id, title) values ('30000000-0000-4000-8000-00000000000a', '10000000-0000-4000-8000-00000000000a', 'Hito de A');
insert into tasks (id, project_id, title) values ('c0000000-0000-4000-8000-00000000000a', '10000000-0000-4000-8000-00000000000a', 'Tarea de A');
insert into activities (id, project_id, title) values ('50000000-0000-4000-8000-00000000000a', '10000000-0000-4000-8000-00000000000a', 'Actividad de A');
insert into events (name) values ('app_open');
insert into bitacora_state (data) values ('{"secreto":"de A"}');
update profiles set display_name = 'Dueña' where id = 'aaaaaaaa-0000-4000-8000-000000000001';
select pg_temp.check((select count(*) from bitacora_history) = 1, 'el historial v1 se sigue guardando');
select pg_temp.check((select count(*) from daily_stats) >= 1, 'A ve sus estadísticas');
select pg_temp.check((select count(*) from profiles) = 1, 'A solo ve su perfil');

-- B, recién registrado.
select pg_temp.as_user('bbbbbbbb-0000-4000-8000-000000000002');
select pg_temp.check(
  (select count(*) from projects) + (select count(*) from milestones) + (select count(*) from tasks)
  + (select count(*) from activities) + (select count(*) from events) + (select count(*) from bitacora_state)
  + (select count(*) from bitacora_history) + (select count(*) from daily_stats) = 0, 'B no ve ninguna fila de A');
select pg_temp.check((select count(*) from profiles) = 1 and (select id from profiles) = 'bbbbbbbb-0000-4000-8000-000000000002', 'B solo ve su propio perfil');
select pg_temp.expect_error('select * from bitacora_state_backup_v1', '42501');

-- B intenta escribir en nombre de A o colgarse de sus filas.
select pg_temp.expect_error($$insert into projects (id, user_id, name) values ('10000000-0000-4000-8000-0000000000bb', 'aaaaaaaa-0000-4000-8000-000000000001', 'suplantación')$$, '42501');
select pg_temp.expect_error($$insert into tasks (id, project_id, title) values ('c0000000-0000-4000-8000-0000000000bb', '10000000-0000-4000-8000-00000000000a', 'intrusa')$$, '23503');
select pg_temp.expect_error($$insert into milestones (id, project_id, title) values ('30000000-0000-4000-8000-0000000000bb', '10000000-0000-4000-8000-00000000000a', 'intruso')$$, '23503');
select pg_temp.expect_error($$insert into events (user_id, name) values ('aaaaaaaa-0000-4000-8000-000000000001', 'app_open')$$, '42501');
select pg_temp.expect_error($$insert into bitacora_state (user_id, data) values ('aaaaaaaa-0000-4000-8000-000000000001', '{}')$$, '42501');
select pg_temp.expect_error($$insert into profiles (id) values ('aaaaaaaa-0000-4000-8000-000000000001')$$, '42501');
-- Upsert sobre el id de una fila de A (lo que haría un cliente malicioso): no la toma.
select pg_temp.expect_error($$insert into projects (id, name) values ('10000000-0000-4000-8000-00000000000a', 'robado') on conflict (id) do update set name = excluded.name$$, '42501');
update projects set name = 'hackeado' where id = '10000000-0000-4000-8000-00000000000a';
update profiles set display_name = 'hackeado' where id = 'aaaaaaaa-0000-4000-8000-000000000001';
update bitacora_state set data = '{}' where user_id = 'aaaaaaaa-0000-4000-8000-000000000001';
delete from activities where id = '50000000-0000-4000-8000-00000000000a';
delete from tasks;
delete from projects;

-- B puede trabajar con normalidad en lo suyo.
insert into projects (id, name) values ('10000000-0000-4000-8000-0000000000b1', 'Proyecto de B');
insert into activities (id, project_id, title) values ('50000000-0000-4000-8000-0000000000b1', '10000000-0000-4000-8000-0000000000b1', 'Actividad de B');
select pg_temp.check((select count(*) from projects) = 1, 'B ve solo lo suyo');

-- A comprueba que nada cambió.
select pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000001');
select pg_temp.check((select name from projects) = 'Privado de A' and (select count(*) from projects) = 1, 'los proyectos de A siguen intactos y no ve los de B');
select pg_temp.check((select count(*) from activities) = 1 and (select count(*) from tasks) = 1, 'B no pudo borrar filas de A');
select pg_temp.check((select display_name from profiles) = 'Dueña', 'B no pudo editar el perfil de A');
select pg_temp.check((select data->>'secreto' from bitacora_state) = 'de A', 'B no pudo editar el estado v1 de A');

-- Anónimo: ninguna tabla ni vista, ni siquiera para consultar.
reset role;
set local role anon;
select pg_temp.expect_error('select * from ' || t, '42501')
  from unnest(array['profiles','projects','milestones','tasks','activities','events','daily_stats','bitacora_state','bitacora_history',
                    'bitacora_state_backup_v1','stages','criteria','evidence','reflections','achievements','day_marks','goal_log','recaps']) t;

-- Las funciones de trigger ya no se pueden invocar directamente.
reset role;
select pg_temp.check(not has_function_privilege('authenticated', f, 'execute') and not has_function_privilege('anon', f, 'execute'), 'función no invocable: ' || f)
  from unnest(array['public.bitacora_snapshot()','public.bt_handle_new_user()','public.bt_sync_row()','public.bt_check_lineage()','public.bt_criteria_cap()']) f;

\echo 'OK: aislamiento entre usuarios verificado en todas las tablas'
rollback;
