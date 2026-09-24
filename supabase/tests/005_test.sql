-- Pruebas de 005_resultados.sql (tras el stub, 001, 002, 003, 004 y 005).
-- Resultado real de una tarea, registro de lo que pasó y aislamiento entre usuarios. Rollback final.
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

insert into auth.users (id) values ('aaaaaaaa-0000-4000-8000-000000000001'), ('bbbbbbbb-0000-4000-8000-000000000002');
set local role authenticated;
select pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000001');

insert into projects (id, name) values ('10000000-0000-4000-8000-00000000000a', 'Trabajo');
insert into tasks (id, project_id, title, due_date) values ('c0000000-0000-4000-8000-00000000000a', '10000000-0000-4000-8000-00000000000a', 'Reunión con equipo', '2026-09-25');
insert into tasks (id, project_id, title, due_date) values ('c0000000-0000-4000-8000-00000000000b', '10000000-0000-4000-8000-00000000000a', 'Enviar propuesta', '2026-09-25');

-- Una tarea cerrada sin hacerse: no queda como completada.
update tasks set status = 'done', result = 'no_show', result_note = 'No asistieron dos participantes.', result_at = now()
  where id = 'c0000000-0000-4000-8000-00000000000a';
insert into task_log (id, task_id, type, result, note, from_date)
  values ('d0000000-0000-4000-8000-00000000000a', 'c0000000-0000-4000-8000-00000000000a', 'closed', 'no_show', 'No asistieron dos participantes.', '2026-09-25');
select pg_temp.check((select completed_at is null and result = 'no_show' from tasks where id = 'c0000000-0000-4000-8000-00000000000a'),
  'una tarea no realizada no tiene fecha de completada');
select pg_temp.check((select synced_at is not null from task_log limit 1), 'el trigger bt_sync_row también corre en task_log');

-- Reprogramar: la tarea sigue pendiente y el día previsto queda guardado.
insert into task_log (id, task_id, type, note, from_date, to_date)
  values ('d0000000-0000-4000-8000-00000000000b', 'c0000000-0000-4000-8000-00000000000b', 'rescheduled', 'Faltaban documentos.', '2026-09-25', '2026-09-27');
update tasks set due_date = '2026-09-27' where id = 'c0000000-0000-4000-8000-00000000000b';
select pg_temp.check((select from_date = '2026-09-25' and to_date = '2026-09-27' from task_log where id = 'd0000000-0000-4000-8000-00000000000b'),
  'el registro conserva la fecha prevista y la nueva');
select pg_temp.check((select status <> 'done' from tasks where id = 'c0000000-0000-4000-8000-00000000000b'), 'reprogramar no cierra la tarea');

-- Valores inventados y notas enormes se rechazan.
select pg_temp.expect_error($$update tasks set result = 'fracaso' where id = 'c0000000-0000-4000-8000-00000000000a'$$, '23514');
select pg_temp.expect_error($$update tasks set result_note = repeat('x', 501) where id = 'c0000000-0000-4000-8000-00000000000a'$$, '23514');
select pg_temp.expect_error($$insert into task_log (id, task_id, type) values ('d0000000-0000-4000-8000-0000000000ff', 'c0000000-0000-4000-8000-00000000000a', 'inventado')$$, '23514');
select pg_temp.expect_error($$insert into task_log (id, task_id, type) values ('d0000000-0000-4000-8000-0000000000fe', 'c0000000-0000-4000-8000-0000000000ee', 'closed')$$, '23503');

-- Los datos anteriores a 005 siguen leyéndose: cerrada sin resultado = completada.
insert into tasks (id, title, status, completed_at) values ('c0000000-0000-4000-8000-0000000000cc', 'Tarea vieja', 'done', now());
select pg_temp.check((select result is null and completed_at is not null from tasks where id = 'c0000000-0000-4000-8000-0000000000cc'),
  'una tarea de antes de 005 conserva su cierre');

-- B no ve ni toca nada de A.
select pg_temp.as_user('bbbbbbbb-0000-4000-8000-000000000002');
select pg_temp.check((select count(*) from task_log) = 0, 'B no ve el registro de tareas de A');
select pg_temp.expect_error($$insert into task_log (id, task_id, type) values ('d0000000-0000-4000-8000-0000000000bb', 'c0000000-0000-4000-8000-00000000000a', 'closed')$$, '23503');
select pg_temp.expect_error($$insert into task_log (id, user_id, task_id, type) values ('d0000000-0000-4000-8000-0000000000bc', 'aaaaaaaa-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-00000000000a', 'closed')$$, '42501');
update task_log set note = 'hackeado';
delete from task_log;
select pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000001');
select pg_temp.check((select count(*) from task_log) = 2, 'B no pudo borrar el registro de A');
select pg_temp.check((select note from task_log where id = 'd0000000-0000-4000-8000-00000000000b') = 'Faltaban documentos.', 'B no pudo editarlo');

-- Anónimo: sin acceso.
reset role;
set local role anon;
select pg_temp.expect_error('select * from task_log', '42501');

-- Borrar la tarea se lleva su registro; borrar la cuenta lo borra todo.
reset role;
delete from tasks where id = 'c0000000-0000-4000-8000-00000000000a';
select pg_temp.check((select count(*) from task_log) = 1, 'el registro cae con su tarea');
delete from auth.users where id = 'aaaaaaaa-0000-4000-8000-000000000001';
select pg_temp.check((select count(*) from task_log) = 0, 'borrar el usuario borra su registro');

\echo 'OK: resultado de tarea, registro y aislamiento verificados'
rollback;
