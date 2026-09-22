-- Reversión de 004: devuelve los privilegios por defecto de Supabase al rol anónimo.
-- RLS sigue activo, así que esto no expone datos; solo deshace el endurecimiento.
grant select, insert, update, delete on public.bitacora_state, public.bitacora_history to anon;
alter default privileges in schema public grant all on tables to anon;
alter default privileges in schema public grant all on sequences to anon;
grant execute on function public.bitacora_snapshot(), public.bt_handle_new_user(), public.bt_sync_row(), public.bt_check_lineage(), public.bt_criteria_cap() to public;
