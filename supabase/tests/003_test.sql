-- Pruebas de 003_impacable.sql en Postgres local (tras 00_supabase_stub.sql, 001, 002 y 003).
-- Se detiene con error en la primera comprobación que falle. Deja la base sin datos de prueba (rollback final).
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

-- Usuarios A y B.
insert into auth.users (id) values ('aaaaaaaa-0000-4000-8000-000000000001'), ('bbbbbbbb-0000-4000-8000-000000000002');

set local role authenticated;

-- A crea su estructura: objetivo → etapa → hito → criterios → acción → evidencia.
select pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000001');
insert into projects (id, name) values ('10000000-0000-4000-8000-00000000000a', 'Inglés');
insert into projects (id, name) values ('10000000-0000-4000-8000-00000000000b', 'Otro objetivo');
insert into stages (id, goal_id, title) values ('20000000-0000-4000-8000-00000000000a', '10000000-0000-4000-8000-00000000000a', 'Fundamentos');
insert into stages (id, goal_id, title) values ('20000000-0000-4000-8000-00000000000b', '10000000-0000-4000-8000-00000000000b', 'Etapa ajena');
insert into milestones (id, project_id, stage_id, title, weight) values ('30000000-0000-4000-8000-00000000000a', '10000000-0000-4000-8000-00000000000a', '20000000-0000-4000-8000-00000000000a', 'Conversación básica', 3);
insert into criteria (id, milestone_id, title) values ('40000000-0000-4000-8000-00000000000a', '30000000-0000-4000-8000-00000000000a', 'Hablar 10 minutos');
insert into activities (id, project_id, milestone_id, criterion_id, title, duration_min)
  values ('50000000-0000-4000-8000-00000000000a', '10000000-0000-4000-8000-00000000000a', '30000000-0000-4000-8000-00000000000a', '40000000-0000-4000-8000-00000000000a', 'Práctica', 25);
insert into evidence (id, goal_id, milestone_id, activity_id, type, url, level)
  values ('60000000-0000-4000-8000-00000000000a', '10000000-0000-4000-8000-00000000000a', '30000000-0000-4000-8000-00000000000a', '50000000-0000-4000-8000-00000000000a', 'link', 'https://ejemplo.com/audio', 2);
insert into evidence (id, goal_id, type, storage_path, thumb_path, level)
  values ('60000000-0000-4000-8000-00000000000b', '10000000-0000-4000-8000-00000000000a', 'photo',
          'aaaaaaaa-0000-4000-8000-000000000001/60000000-0000-4000-8000-00000000000b/original.webp',
          'aaaaaaaa-0000-4000-8000-000000000001/60000000-0000-4000-8000-00000000000b/thumb.webp', 2);
insert into reflections (id, type, body, milestone_id, activity_id) values ('70000000-0000-4000-8000-00000000000a', 'learning', 'Pensar menos antes de hablar', '30000000-0000-4000-8000-00000000000a', '50000000-0000-4000-8000-00000000000a');
insert into achievements (id, kind, rule_key, title, milestone_id) values ('80000000-0000-4000-8000-00000000000a', 'progress', 'milestone_first', 'Primer hito', '30000000-0000-4000-8000-00000000000a');
insert into day_marks (id, day) values ('90000000-0000-4000-8000-00000000000a', '2026-09-20');
insert into goal_log (id, goal_id, type) values ('a0000000-0000-4000-8000-00000000000a', '10000000-0000-4000-8000-00000000000a', 'created');
insert into recaps (id, period, start_date, answer) values ('b0000000-0000-4000-8000-00000000000a', 'week', '2026-09-14', 'Buena semana');
select pg_temp.check((select count(*) from stages) = 2, 'A ve sus etapas');
select pg_temp.check((select synced_at is not null from criteria limit 1), 'bt_sync_row fija synced_at');

-- Coherencia entre niveles.
select pg_temp.expect_error($$insert into milestones (id, project_id, stage_id, title) values ('30000000-0000-4000-8000-0000000000ff', '10000000-0000-4000-8000-00000000000a', '20000000-0000-4000-8000-00000000000b', 'x')$$, '23514');
select pg_temp.expect_error($$insert into activities (id, project_id, milestone_id, title) values ('50000000-0000-4000-8000-0000000000ff', '10000000-0000-4000-8000-00000000000b', '30000000-0000-4000-8000-00000000000a', 'x')$$, '23514');
select pg_temp.expect_error($$insert into evidence (id, goal_id, milestone_id, note) values ('60000000-0000-4000-8000-0000000000ff', '10000000-0000-4000-8000-00000000000b', '30000000-0000-4000-8000-00000000000a', 'x')$$, '23514');
-- Padre que aún no existe: clave foránea (409 en PostgREST → el cliente reintenta).
select pg_temp.expect_error($$insert into criteria (id, milestone_id, title) values ('40000000-0000-4000-8000-0000000000ff', '30000000-0000-4000-8000-0000000000ee', 'x')$$, '23503');

-- Validaciones.
select pg_temp.expect_error($$insert into evidence (id, goal_id, type, url) values ('60000000-0000-4000-8000-0000000000fe', '10000000-0000-4000-8000-00000000000a', 'link', 'javascript:alert(1)')$$, '23514');
select pg_temp.expect_error($$insert into evidence (id, goal_id, type, storage_path) values ('60000000-0000-4000-8000-0000000000fd', '10000000-0000-4000-8000-00000000000a', 'photo', 'bbbbbbbb-0000-4000-8000-000000000002/x/original.webp')$$, '23514');
select pg_temp.expect_error($$insert into evidence (id, goal_id, type) values ('60000000-0000-4000-8000-0000000000fc', '10000000-0000-4000-8000-00000000000a', 'note')$$, '23514');
select pg_temp.expect_error($$insert into milestones (id, project_id, title, weight) values ('30000000-0000-4000-8000-0000000000fd', '10000000-0000-4000-8000-00000000000a', 'x', 5)$$, '23514');
select pg_temp.expect_error($$insert into activities (id, title, source) values ('50000000-0000-4000-8000-0000000000fe', 'x', 'otra')$$, '23514');
insert into activities (id, title, source) values ('50000000-0000-4000-8000-0000000000fd', 'Volví', 'recovery');

-- Tope de 8 criterios vivos por hito (incluye el que ya existe).
insert into criteria (id, milestone_id, title)
  select ('40000000-0000-4000-8000-0000000000' || lpad(n::text, 2, '0'))::uuid, '30000000-0000-4000-8000-00000000000a', 'c' || n from generate_series(1, 7) n;
select pg_temp.expect_error($$insert into criteria (id, milestone_id, title) values ('40000000-0000-4000-8000-0000000000fb', '30000000-0000-4000-8000-00000000000a', 'noveno')$$, '23514');
update criteria set deleted_at = now(), title = '' where id = '40000000-0000-4000-8000-000000000001';
insert into criteria (id, milestone_id, title) values ('40000000-0000-4000-8000-0000000000fb', '30000000-0000-4000-8000-00000000000a', 'cabe tras borrar uno');
-- Un upsert de un criterio existente no cuenta como uno más.
insert into criteria (id, milestone_id, title) values ('40000000-0000-4000-8000-0000000000fb', '30000000-0000-4000-8000-00000000000a', 'editado')
  on conflict (id) do update set title = excluded.title, updated_at = now();

-- Gana la edición más reciente también en tablas nuevas.
update stages set title = 'Viejo', updated_at = '2000-01-01' where id = '20000000-0000-4000-8000-00000000000a';
select pg_temp.check((select title from stages where id = '20000000-0000-4000-8000-00000000000a') = 'Fundamentos', 'una edición antigua no pisa la actual');

-- B: no ve nada de A, no puede colgar filas de padres de A ni escribir en su nombre.
select pg_temp.as_user('bbbbbbbb-0000-4000-8000-000000000002');
select pg_temp.check((select count(*) from stages) + (select count(*) from criteria) + (select count(*) from evidence)
  + (select count(*) from reflections) + (select count(*) from achievements) + (select count(*) from day_marks)
  + (select count(*) from goal_log) + (select count(*) from recaps) = 0, 'B no ve filas de A');
insert into projects (id, name) values ('10000000-0000-4000-8000-0000000000bb', 'De B');
select pg_temp.expect_error($$insert into criteria (id, milestone_id, title) values ('40000000-0000-4000-8000-0000000000bb', '30000000-0000-4000-8000-00000000000a', 'intruso')$$, '23503');
select pg_temp.expect_error($$insert into stages (id, goal_id, title) values ('20000000-0000-4000-8000-0000000000bb', '10000000-0000-4000-8000-00000000000a', 'intrusa')$$, '23503');
select pg_temp.expect_error($$insert into activities (id, project_id, title) values ('50000000-0000-4000-8000-0000000000bb', '10000000-0000-4000-8000-00000000000a', 'intrusa')$$, '23503');
select pg_temp.expect_error($$insert into stages (id, user_id, goal_id, title) values ('20000000-0000-4000-8000-0000000000bc', 'aaaaaaaa-0000-4000-8000-000000000001', '10000000-0000-4000-8000-00000000000a', 'suplantación')$$, '42501');
update stages set title = 'hackeado' where id = '20000000-0000-4000-8000-00000000000a';
delete from evidence where id = '60000000-0000-4000-8000-00000000000a';
select pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000001');
select pg_temp.check((select title from stages where id = '20000000-0000-4000-8000-00000000000a') = 'Fundamentos', 'B no puede editar filas de A');
select pg_temp.check((select count(*) from evidence) = 2, 'B no puede borrar filas de A');

-- Anónimo: sin acceso a nada.
reset role;
set local role anon;
select pg_temp.expect_error('select * from stages', '42501');
select pg_temp.expect_error('select * from evidence', '42501');
select pg_temp.expect_error('select * from recaps', '42501');

-- Borrado físico (solo al borrar la cuenta): set null conserva el dueño; cascade limpia los hijos.
reset role;
delete from milestones where id = '30000000-0000-4000-8000-00000000000a';
select pg_temp.check((select milestone_id is null and criterion_id is null and user_id = 'aaaaaaaa-0000-4000-8000-000000000001' from activities where id = '50000000-0000-4000-8000-00000000000a'), 'set null solo vacía la columna del hito');
select pg_temp.check((select count(*) from criteria where milestone_id = '30000000-0000-4000-8000-00000000000a') = 0, 'los criterios caen con su hito');
delete from auth.users where id = 'aaaaaaaa-0000-4000-8000-000000000001';
select pg_temp.check((select count(*) from stages) + (select count(*) from evidence) + (select count(*) from goal_log) = 0, 'borrar el usuario borra todo lo suyo');

\echo 'OK: todas las pruebas de 003 pasaron'
rollback;
