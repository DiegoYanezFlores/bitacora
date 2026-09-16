-- Métricas internas de Bitácora. Ejecutar en Supabase → SQL Editor (rol postgres; ve a todos los usuarios).
-- No hay analítica de terceros: todo sale de auth.users, activities y events.

-- Activación: % de usuarios que registran su primera actividad en las primeras 24 h.
select
  count(*)                                                        as usuarios,
  count(*) filter (where first_act <= created_at + interval '24 hours') as activados_24h,
  round(100.0 * count(*) filter (where first_act <= created_at + interval '24 hours') / nullif(count(*), 0), 1) as tasa_activacion
from (
  select u.id, u.created_at, min(a.created_at) as first_act
  from auth.users u left join public.activities a on a.user_id = u.id and a.source <> 'import'
  group by u.id, u.created_at
) s;

-- Tiempo hasta la primera actividad (mediana, minutos).
select percentile_cont(0.5) within group (order by extract(epoch from first_act - created_at) / 60) as mediana_min
from (
  select u.created_at, min(a.created_at) as first_act
  from auth.users u join public.activities a on a.user_id = u.id and a.source <> 'import'
  group by u.id, u.created_at
) s;

-- DAU / WAU (usuarios que abren la app o registran algo).
select date_trunc('day', created_at)::date as dia, count(distinct user_id) as dau
from public.events where name in ('app_open', 'activity_create') and created_at > now() - interval '30 days'
group by 1 order by 1;

select date_trunc('week', created_at)::date as semana, count(distinct user_id) as wau
from public.events where name in ('app_open', 'activity_create') and created_at > now() - interval '12 weeks'
group by 1 order by 1;

-- Actividades y proyectos por usuario.
select
  round(avg(acts), 1) as actividades_por_usuario,
  round(avg(projs), 1) as proyectos_por_usuario
from (
  select u.id,
    (select count(*) from public.activities a where a.user_id = u.id and a.deleted_at is null) as acts,
    (select count(*) from public.projects p where p.user_id = u.id and p.deleted_at is null) as projs
  from auth.users u
) s;

-- Retención D1 / D7 / D30 por cohorte de registro (vuelve a abrir o registrar ese día o después).
with cohort as (
  select id, created_at::date as d0 from auth.users
),
activity as (
  select user_id, created_at::date as d from public.events where name in ('app_open', 'activity_create')
)
select
  c.d0 as cohorte,
  count(distinct c.id) as usuarios,
  round(100.0 * count(distinct c.id) filter (where exists (select 1 from activity a where a.user_id = c.id and a.d = c.d0 + 1))  / count(distinct c.id), 1) as d1,
  round(100.0 * count(distinct c.id) filter (where exists (select 1 from activity a where a.user_id = c.id and a.d between c.d0 + 7 and c.d0 + 13)) / count(distinct c.id), 1) as d7,
  round(100.0 * count(distinct c.id) filter (where exists (select 1 from activity a where a.user_id = c.id and a.d between c.d0 + 30 and c.d0 + 36)) / count(distinct c.id), 1) as d30
from cohort c
group by c.d0 order by c.d0 desc;

-- Tasa de completado de tareas (creadas en los últimos 30 días).
select round(100.0 * count(*) filter (where status = 'done') / nullif(count(*), 0), 1) as completado_pct
from public.tasks where deleted_at is null and created_at > now() - interval '30 days';

-- Interacción con avisos dentro de la app.
select props ->> 'action' as accion, count(*) from public.events
where name = 'notice_action' and created_at > now() - interval '30 days' group by 1;

-- Duración aproximada de sesión: minutos entre el primer y el último evento de cada día y usuario.
select round(avg(extract(epoch from (last_e - first_e)) / 60)::numeric, 1) as minutos_promedio
from (
  select user_id, created_at::date, min(created_at) as first_e, max(created_at) as last_e
  from public.events where created_at > now() - interval '30 days' group by 1, 2
) s;
