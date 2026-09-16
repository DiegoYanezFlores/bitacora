-- Bitácora: esquema de Supabase.
-- Ejecuta este archivo completo en Supabase → SQL Editor → New query → Run.

-- Estado actual: un documento JSON por usuario (el mismo que guarda localStorage).
create table if not exists public.bitacora_state (
  user_id    uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

-- Historial: una instantánea por hora como máximo, para poder recuperar datos.
create table if not exists public.bitacora_history (
  id       bigint generated always as identity primary key,
  user_id  uuid not null references auth.users (id) on delete cascade,
  data     jsonb not null,
  saved_at timestamptz not null default now()
);
create index if not exists bitacora_history_user_saved on public.bitacora_history (user_id, saved_at desc);

-- Row Level Security: cada usuario solo ve y modifica su propia fila.
alter table public.bitacora_state   enable row level security;
alter table public.bitacora_history enable row level security;

drop policy if exists "state_select_own" on public.bitacora_state;
drop policy if exists "state_insert_own" on public.bitacora_state;
drop policy if exists "state_update_own" on public.bitacora_state;
drop policy if exists "history_select_own" on public.bitacora_history;

create policy "state_select_own" on public.bitacora_state
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "state_insert_own" on public.bitacora_state
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "state_update_own" on public.bitacora_state
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "history_select_own" on public.bitacora_history
  for select to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update on public.bitacora_state to authenticated;
grant select on public.bitacora_history to authenticated;

-- Guarda una instantánea en el historial si la última tiene más de 1 hora.
create or replace function public.bitacora_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.bitacora_history
    where user_id = new.user_id and saved_at > now() - interval '1 hour'
  ) then
    insert into public.bitacora_history (user_id, data) values (new.user_id, new.data);
  end if;
  return new;
end;
$$;

drop trigger if exists bitacora_snapshot on public.bitacora_state;
create trigger bitacora_snapshot
  after insert or update on public.bitacora_state
  for each row execute function public.bitacora_snapshot();
