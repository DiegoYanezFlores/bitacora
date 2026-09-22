-- 004: endurecimiento para uso multiusuario (repositorio público, muchos usuarios nuevos).
-- No cambia columnas ni datos: solo privilegios. Idempotente. Reversión: 004_hardening_down.sql.
-- Ejecuta este archivo completo en Supabase → SQL Editor → New query → Run.

-- 1. El rol anónimo no necesita ninguna tabla: la app solo lee y escribe con sesión.
--    RLS ya devolvía cero filas, pero sin privilegio ni siquiera se puede consultar la tabla.
revoke all on public.bitacora_state, public.bitacora_history from anon;

-- 2. Las tablas que se creen en el futuro no heredan acceso anónimo por defecto.
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on sequences from anon;

-- 3. Las funciones de trigger no deben poder invocarse como RPC.
revoke execute on function public.bitacora_snapshot(), public.bt_handle_new_user(), public.bt_sync_row(), public.bt_check_lineage(), public.bt_criteria_cap() from public, anon, authenticated;

-- 4. Comprobación: falla si alguna tabla de public queda sin RLS o con acceso anónimo.
do $$
declare bad text;
begin
  select string_agg(c.relname, ', ') into bad
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;
  if bad is not null then raise exception 'Tablas sin RLS: %', bad; end if;

  select string_agg(c.relname, ', ') into bad
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind in ('r', 'v')
    and (has_table_privilege('anon', c.oid, 'select') or has_table_privilege('anon', c.oid, 'insert')
      or has_table_privilege('anon', c.oid, 'update') or has_table_privilege('anon', c.oid, 'delete'));
  if bad is not null then raise exception 'Tablas con acceso anónimo: %', bad; end if;
  raise notice 'OK: todas las tablas tienen RLS y ninguna es accesible sin sesión';
end $$;
