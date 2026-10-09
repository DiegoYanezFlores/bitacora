-- Pruebas de 006_personalizacion.sql (tras el stub, 001–005 y 006).
-- Series y ocurrencias, horarios, diario y aislamiento entre usuarios. Rollback final.
\set ON_ERROR_STOP 1
begin;

create or replace function pg_temp.expect_error(q text, code text) returns void language plpgsql as $$
begin
  begin execute q; exception when others then
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

-- Una serie: clases de 07:00 a 11:00, de lunes a viernes, hasta fin de semestre.
insert into tasks (id, title, repeat, start_time, end_time, due_date)
  values ('c0000000-0000-4000-8000-00000000000a', 'Asistir a clases',
          '{"freq":"weekly","interval":1,"byday":["mo","tu","we","th","fr"],"until":"2027-02-28"}'::jsonb,
          '07:00', '11:00', '2026-10-13');
select pg_temp.check((select repeat->>'freq' = 'weekly' and end_time = '11:00' from tasks where id = 'c0000000-0000-4000-8000-00000000000a'), 'la serie guarda su regla y su horario');

-- Una ocurrencia materializada (solo cuando pasa algo con ella).
insert into tasks (id, title, series_id, occurrence_date, status, result, result_at)
  values ('c0000000-0000-4000-8000-00000000000b', 'Asistir a clases', 'c0000000-0000-4000-8000-00000000000a', '2026-10-15', 'done', 'no_show', now());
select pg_temp.check((select count(*) from tasks where series_id = 'c0000000-0000-4000-8000-00000000000a') = 1, 'la ocurrencia queda ligada a su serie');

-- Reglas de coherencia.
select pg_temp.expect_error($$insert into tasks (id, title, series_id) values ('c0000000-0000-4000-8000-0000000000f1', 'x', 'c0000000-0000-4000-8000-00000000000a')$$, '23514');
select pg_temp.expect_error($$insert into tasks (id, title, occurrence_date) values ('c0000000-0000-4000-8000-0000000000f2', 'x', '2026-10-15')$$, '23514');
select pg_temp.expect_error($$insert into tasks (id, title, start_time, end_time) values ('c0000000-0000-4000-8000-0000000000f3', 'x', '11:00', '07:00')$$, '23514');
select pg_temp.expect_error($$update tasks set series_id = id where id = 'c0000000-0000-4000-8000-00000000000b'$$, '23514');

-- Diario: una reflexión de tipo journal, con título, etiquetas y cuerpo largo.
insert into reflections (id, type, title, body, tags)
  values ('70000000-0000-4000-8000-00000000000a', 'journal', 'Lo que no dependía de mí', repeat('Hoy ', 2000), array['estoico', 'trabajo']);
select pg_temp.check((select char_length(body) > 4000 and title <> '' and tags[1] = 'estoico' from reflections where id = '70000000-0000-4000-8000-00000000000a'), 'el diario acepta título, etiquetas y texto largo');
select pg_temp.expect_error($$insert into reflections (id, type, body) values ('70000000-0000-4000-8000-0000000000ff', 'inventado', 'x')$$, '23514');
select pg_temp.expect_error($$insert into reflections (id, type, body, title) values ('70000000-0000-4000-8000-0000000000fe', 'journal', 'x', repeat('t', 201))$$, '23514');
-- Las reflexiones de siempre siguen funcionando igual.
insert into reflections (id, type, body) values ('70000000-0000-4000-8000-00000000000b', 'learning', 'Pensar menos antes de hablar');

-- Las preferencias visuales caben en prefs sin tabla nueva.
update profiles set prefs = prefs || '{"palette":"pastel-lavanda","background":{"kind":"library","id":"montana"},"celebrate":"full"}'::jsonb
  where id = 'aaaaaaaa-0000-4000-8000-000000000001';
select pg_temp.check((select prefs->>'palette' = 'pastel-lavanda' from profiles where id = 'aaaaaaaa-0000-4000-8000-000000000001'), 'las preferencias visuales se guardan en el perfil');

-- B no ve ni toca nada de A.
select pg_temp.as_user('bbbbbbbb-0000-4000-8000-000000000002');
select pg_temp.check((select count(*) from tasks) + (select count(*) from reflections) = 0, 'B no ve las series ni el diario de A');
select pg_temp.expect_error($$insert into tasks (id, title, series_id, occurrence_date) values ('c0000000-0000-4000-8000-0000000000bb', 'intrusa', 'c0000000-0000-4000-8000-00000000000a', '2026-10-16')$$, '23503');
update reflections set body = 'hackeado';
select pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000001');
select pg_temp.check((select body <> 'hackeado' from reflections where id = '70000000-0000-4000-8000-00000000000b'), 'B no pudo editar el diario de A');

reset role;
set local role anon;
select pg_temp.expect_error('select * from reflections', '42501');

-- Borrar la serie se lleva sus ocurrencias; borrar la cuenta lo borra todo.
reset role;
delete from tasks where id = 'c0000000-0000-4000-8000-00000000000a';
select pg_temp.check((select count(*) from tasks where id = 'c0000000-0000-4000-8000-00000000000b') = 0, 'las ocurrencias caen con su serie');
delete from auth.users where id = 'aaaaaaaa-0000-4000-8000-000000000001';
select pg_temp.check((select count(*) from reflections) = 0, 'borrar el usuario borra su diario');

\echo 'OK: recurrencias, diario y preferencias verificados'
rollback;
